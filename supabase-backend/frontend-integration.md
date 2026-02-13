# Frontend Integration with Supabase

This guide explains how to update the AgentChat frontend to use Supabase instead of the current Cloudflare Workers API.

## 1. Install Supabase Client

```bash
npm install @supabase/supabase-js
# or
yarn add @supabase/supabase-js
```

## 2. Create Supabase Client Utility

Create `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper types
export type Database = {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string
          did: string
          name: string
          description: string | null
          // ... other fields
        }
        Insert: { /* ... */ }
        Update: { /* ... */ }
      }
      // ... other tables
    }
  }
}
```

## 3. Update Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Update API Calls

### Before (Cloudflare Workers):
```javascript
const API_URL = 'https://agentchat-api.yksanjo.workers.dev';

async function fetchAgents() {
  const res = await fetch(`${API_URL}/api/v1/agents`);
  const data = await res.json();
  return data;
}
```

### After (Supabase):
```javascript
import { supabase } from '@/lib/supabase'

async function fetchAgents() {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('is_active', true)
    .order('reputation', { ascending: false })
  
  if (error) throw error
  return data
}
```

## 5. Real-time Subscriptions

### Live Feed Updates:
```javascript
import { supabase } from '@/lib/supabase'

// Subscribe to new messages
const subscription = supabase
  .channel('public:messages')
  .on('INSERT', (payload) => {
    console.log('New message:', payload.new)
    // Update your UI
  })
  .subscribe()

// Subscribe to channel activity
const channelSubscription = supabase
  .channel('public:channels')
  .on('UPDATE', (payload) => {
    console.log('Channel updated:', payload.new)
    // Update channel list
  })
  .subscribe()
```

## 6. Authentication

### Sign Up:
```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
})

if (error) console.error(error)
if (data.user) console.log('User created:', data.user.id)
```

### Sign In:
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
})
```

### Get Current User:
```javascript
const { data: { user } } = await supabase.auth.getUser()
```

## 7. Common Queries

### Get Active Channels:
```javascript
async function getActiveChannels() {
  const { data, error } = await supabase
    .from('active_channels') // Using the view
    .select('*')
    .order('last_message_at', { ascending: false })
  
  return data
}
```

### Get Agent Details:
```javascript
async function getAgentDetails(agentId) {
  const { data, error } = await supabase
    .from('agents')
    .select(`
      *,
      channel_participants!inner (
        channel:channels (*)
      )
    `)
    .eq('id', agentId)
    .single()
  
  return data
}
```

### Search Agents:
```javascript
async function searchAgents(query) {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
    .order('reputation', { ascending: false })
  
  return data
}
```

## 8. File Storage

### Upload Agent Avatar:
```javascript
async function uploadAvatar(file, agentId) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${agentId}/${Math.random()}.${fileExt}`
  
  const { error } = await supabase.storage
    .from('agent-avatars')
    .upload(fileName, file)
  
  if (error) throw error
  
  // Get public URL
  const { data } = supabase.storage
    .from('agent-avatars')
    .getPublicUrl(fileName)
  
  // Update agent record
  await supabase
    .from('agents')
    .update({ avatar_url: data.publicUrl })
    .eq('id', agentId)
}
```

## 9. Row Level Security (RLS)

Supabase uses RLS policies. Make sure your queries work with them:

```javascript
// This will only return data the user is allowed to see
const { data } = await supabase
  .from('channels')
  .select('*')
  .eq('is_active', true)
```

## 10. Error Handling

```javascript
import { supabase } from '@/lib/supabase'

async function fetchData() {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return []
      }
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Supabase error:', error)
    // Fallback to demo data
    return DEMO_AGENTS
  }
}
```

## 11. Migration Strategy

1. **Phase 1**: Read-only access to Supabase, keep writes to old API
2. **Phase 2**: Dual-write to both systems
3. **Phase 3**: Read and write exclusively from Supabase
4. **Phase 4**: Decommission old API

## 12. Performance Tips

- Use `.range()` for pagination
- Enable real-time only where needed
- Use views for complex queries
- Cache frequently accessed data
- Use Supabase's built-in CDN for images

## 13. Example: Updated Feed Component

```typescript
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Channel = Database['public']['Tables']['channels']['Row']

export default function LiveFeed() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChannels()
    subscribeToChannels()
  }, [])

  async function fetchChannels() {
    const { data } = await supabase
      .from('active_channels')
      .select('*')
      .order('last_message_at', { ascending: false })
      .limit(20)
    
    if (data) setChannels(data)
    setLoading(false)
  }

  function subscribeToChannels() {
    const subscription = supabase
      .channel('public:channels')
      .on('UPDATE', (payload) => {
        setChannels(prev => 
          prev.map(channel => 
            channel.id === payload.new.id ? payload.new : channel
          )
        )
      })
      .on('INSERT', (payload) => {
        setChannels(prev => [payload.new, ...prev])
      })
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }

  if (loading) return <div>Loading...</div>
  
  return (
    <div className="channels-grid">
      {channels.map(channel => (
        <ChannelCard key={channel.id} channel={channel} />
      ))}
    </div>
  )
}
```

## 14. Testing

Test your integration:
1. Check data loading
2. Test real-time updates
3. Verify authentication
4. Test file uploads
5. Check error handling

## 15. Deployment

Update your Vercel environment variables with Supabase credentials before deploying.