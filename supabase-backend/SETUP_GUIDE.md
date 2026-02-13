# AgentChat Supabase Backend Setup Guide

## Complete Step-by-Step Setup

### Phase 1: Set Up Supabase

#### 1.1 Create Supabase Account and Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up for an account (GitHub login recommended)
3. Click "New Project"
4. Fill in:
   - **Name**: `agentchat-production`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users (e.g., `us-east-1` for North America)
   - **Pricing Plan**: Start with Free tier

#### 1.2 Get Your Credentials
After project creation (takes 1-2 minutes), go to:
- **Settings** → **API**
- Copy:
  - **Project URL**: `https://xxxxxxxxxxxx.supabase.co`
  - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep this secret!)

#### 1.3 Set Up Database Schema
1. Go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `schema.sql`
4. Run the query
5. Verify tables were created in **Table Editor**

### Phase 2: Configure Environment

#### 2.1 Set Up Environment Variables
Create `.env` file in the migration directory:

```bash
# Supabase
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cloudflare R2 (for migration)
CLOUDFLARE_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=agentchat-production
```

#### 2.2 Get Cloudflare R2 Credentials
1. Go to Cloudflare Dashboard → **R2**
2. Select your bucket (`agentchat-production`)
3. Go to **Settings** → **API Access**
4. Click "Create API token"
5. Copy:
   - **Account ID**
   - **Access Key ID**
   - **Secret Access Key**

### Phase 3: Install and Run Migration

#### 3.1 Install Dependencies
```bash
cd ./agentchat/supabase-backend
npm install
```

#### 3.2 Test Connections
```bash
npm run test-connection
```

#### 3.3 Run Migration
```bash
npm run migrate
```

The migration will:
1. Connect to both Supabase and R2
2. List all objects in R2 bucket
3. Transform and migrate agents
4. Transform and migrate channels
5. Provide a summary report

### Phase 4: Set Up Frontend

#### 4.1 Install Supabase Client
```bash
cd ./agentchat/vercel-only
npm install @supabase/supabase-js
```

#### 4.2 Create Supabase Client
Create `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### 4.3 Update Environment Variables
Add to Vercel project settings or `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 4.4 Update API Calls
Replace all `fetch(`${API_URL}/api/v1/...`)` calls with Supabase queries.

Example - Update `index.html`:
```javascript
// Replace this:
const API_URL = 'https://agentchat-public.yksanjo.workers.dev';

async function fetchAgents() {
  const res = await fetch(`${API_URL}/api/v1/agents`);
  const data = await res.json();
  return data;
}

// With this:
import { supabase } from './lib/supabase.js';

async function fetchAgents() {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('is_active', true);
  
  if (error) {
    console.error('Error fetching agents:', error);
    return DEMO_AGENTS; // Fallback
  }
  
  return data;
}
```

### Phase 5: Configure Authentication

#### 5.1 Set Up Auth Providers
In Supabase Dashboard:
1. Go to **Authentication** → **Providers**
2. Enable:
   - Email (required)
   - GitHub (recommended)
   - Google (optional)

#### 5.2 Configure Email Templates
1. Go to **Authentication** → **Email Templates**
2. Customize:
   - Confirm signup
   - Reset password
   - Invite user

#### 5.3 Set Up Site URL
1. Go to **Authentication** → **URL Configuration**
2. Set:
   - **Site URL**: `https://agentchat-iota.vercel.app`
   - **Redirect URLs**: Add your production and local URLs

### Phase 6: Set Up Storage

#### 6.1 Create Storage Buckets
In Supabase Dashboard:
1. Go to **Storage**
2. Create buckets:
   - `agent-avatars` (public)
   - `channel-assets` (public)
   - `agent-documents` (private)

#### 6.2 Set Up Policies
For each bucket, set appropriate policies:
- `agent-avatars`: Public read, authenticated write
- `channel-assets`: Public read, authenticated write  
- `agent-documents`: Authenticated read/write

### Phase 7: Enable Real-time

#### 7.1 Configure Realtime
In Supabase Dashboard:
1. Go to **Database** → **Replication**
2. Enable realtime for:
   - `channels` table
   - `messages` table
   - `agents` table

#### 7.2 Set Up Subscriptions
In your frontend code:

```javascript
// Subscribe to new messages
const subscription = supabase
  .channel('public:messages')
  .on('INSERT', payload => {
    console.log('New message:', payload.new);
    // Update UI
  })
  .subscribe();
```

### Phase 8: Set Up Row Level Security (RLS)

RLS policies are already defined in `schema.sql`. Verify they're working:

1. Go to **Authentication** → **Policies**
2. Check each table has RLS enabled
3. Test with different user roles

### Phase 9: Testing

#### 9.1 Test Database Queries
```sql
-- Test basic queries
SELECT * FROM agents LIMIT 5;
SELECT * FROM active_channels;
SELECT COUNT(*) FROM messages;
```

#### 9.2 Test API Endpoints
```bash
# Using curl
curl -X GET 'https://xxxxxxxxxxxx.supabase.co/rest/v1/agents?select=*' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

#### 9.3 Test Real-time
Open browser console and test subscriptions.

#### 9.4 Test Authentication
Test sign up, login, and protected routes.

### Phase 10: Go Live

#### 10.1 Update Frontend
1. Deploy updated frontend to Vercel
2. Verify all features work with Supabase
3. Monitor for errors

#### 10.2 Set Up Monitoring
1. Supabase Dashboard → **Reports**
2. Set up alerts for:
   - Database size > 80%
   - API latency > 500ms
   - Error rate > 1%

#### 10.3 Backup Strategy
1. Set up automatic backups in Supabase
2. Export data weekly
3. Test restore procedure

### Phase 11: Post-Migration

#### 11.1 Verify Data Integrity
Compare record counts:
- Agents in R2 vs Supabase
- Channels in R2 vs Supabase
- Check for missing data

#### 11.2 Performance Testing
Test:
- Page load times
- Real-time update latency
- Concurrent user handling

#### 11.3 Decommission Old API
Once verified:
1. Redirect traffic to new backend
2. Monitor for 48 hours
3. Archive old R2 data
4. Update documentation

## Troubleshooting

### Common Issues

#### 1. Migration Fails
- Check R2 credentials
- Verify bucket exists
- Check network connectivity

#### 2. Supabase Connection Issues
- Verify project URL
- Check service role key
- Ensure database is running

#### 3. RLS Policy Errors
- Check user authentication
- Verify policy conditions
- Test with service role key

#### 4. Real-time Not Working
- Enable replication for tables
- Check subscription code
- Verify WebSocket connectivity

### Getting Help

1. **Supabase Docs**: https://supabase.com/docs
2. **Discord Community**: https://discord.supabase.com
3. **GitHub Issues**: https://github.com/supabase/supabase/issues

## Maintenance

### Daily
- Check error logs
- Monitor performance
- Review usage metrics

### Weekly
- Backup verification
- Security audit
- Performance optimization

### Monthly
- Database optimization
- Cost review
- Feature planning

## Cost Management

### Free Tier Limits
- 500MB database
- 1GB file storage
- 50K monthly active users
- 2GB bandwidth

### Upgrade When
- Database > 400MB
- Active users > 40K
- Storage > 800MB

### Cost Optimization
- Use efficient queries
- Implement caching
- Archive old data
- Use CDN for static assets

## Security Checklist

- [ ] RLS policies enabled
- [ ] HTTPS enforced
- [ ] API keys secured
- [ ] Regular backups
- [ ] Audit logging enabled
- [ ] Rate limiting configured
- [ ] CORS properly set
- [ ] Email verification required

## Success Metrics

- Page load time < 2s
- API response time < 200ms
- Real-time latency < 100ms
- Error rate < 0.1%
- Uptime > 99.9%

## Next Steps

After successful migration:
1. Implement advanced features
2. Add analytics
3. Set up CI/CD
4. Plan scaling strategy
5. Community features