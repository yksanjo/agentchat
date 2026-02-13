#!/bin/bash

echo "🚀 AgentChat Supabase Quick Setup"
echo "=================================="
echo ""

# Check for required commands
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }

# Create necessary directories
mkdir -p ./supabase-backend
cd ./supabase-backend

echo "📦 Installing dependencies..."
npm init -y
npm install @supabase/supabase-js dotenv

echo ""
echo "🔧 Configuration Setup"
echo "======================"
echo ""
echo "Please enter your Supabase credentials:"
echo ""

# Get credentials from user
read -p "Supabase Project URL (https://xxx.supabase.co): " SUPABASE_URL
read -p "Supabase Anon/Public Key: " SUPABASE_ANON_KEY
read -p "Supabase Service Role Key (for migrations): " SUPABASE_SERVICE_ROLE_KEY

# Create environment files
echo "Creating environment files..."
cat > .env << EOF
# Supabase Credentials
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# Cloudflare R2 (for migration - optional)
# CLOUDFLARE_ACCOUNT_ID=your_account_id
# R2_ACCESS_KEY_ID=your_access_key
# R2_SECRET_ACCESS_KEY=your_secret_key
# R2_BUCKET_NAME=agentchat-production
EOF

cat > .env.example << EOF
# Supabase Credentials
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Cloudflare R2 (for migration - optional)
# CLOUDFLARE_ACCOUNT_ID=your_account_id
# R2_ACCESS_KEY_ID=your_access_key
# R2_SECRET_ACCESS_KEY=your_secret_key
# R2_BUCKET_NAME=agentchat-production
EOF

# Create package.json with scripts
cat > package.json << EOF
{
  "name": "agentchat-supabase",
  "version": "1.0.0",
  "description": "Supabase backend for AgentChat",
  "type": "module",
  "scripts": {
    "setup": "node setup-database.js",
    "test": "node test-connection.js",
    "migrate": "node migrate-from-r2.js",
    "generate-types": "node generate-types.js"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@aws-sdk/client-s3": "^3.490.0",
    "@aws-sdk/credential-provider-env": "^3.490.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Create setup script
cat > setup-database.js << 'EOF'
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupDatabase() {
  console.log('🔧 Setting up AgentChat database on Supabase...\n');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    console.error('   Please run: cp .env.example .env and fill in your credentials');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });
  
  try {
    // Read schema file
    const schemaPath = join(__dirname, 'schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Running database schema...');
    
    // Split by semicolons and execute each statement
    const statements = schemaSql.split(';').filter(stmt => stmt.trim());
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (stmt) {
        console.log(`  Running statement ${i + 1}/${statements.length}...`);
        
        // Use Supabase's SQL API to execute
        const { error } = await supabase.rpc('exec_sql', { sql: stmt });
        
        if (error) {
          // If exec_sql doesn't exist, we'll need to use a different approach
          console.log(`  Note: Some statements may need to be run manually in Supabase SQL Editor`);
          break;
        }
      }
    }
    
    console.log('\n✅ Database setup instructions:');
    console.log('================================');
    console.log('1. Go to your Supabase Dashboard: ' + supabaseUrl.replace('/rest/v1', ''));
    console.log('2. Navigate to: SQL Editor');
    console.log('3. Click "New query"');
    console.log('4. Copy the contents of schema.sql');
    console.log('5. Run the query');
    console.log('\n📁 The schema.sql file is located at: ' + schemaPath);
    
    // Test connection after setup
    console.log('\n🔍 Testing connection to verify setup...');
    const { data, error } = await supabase
      .from('agents')
      .select('count', { count: 'exact', head: true });
    
    if (error && error.code === '42P01') {
      console.log('⚠️  Tables not created yet - please run the schema.sql manually');
    } else if (error) {
      console.log('⚠️  Connection test error:', error.message);
    } else {
      console.log('✅ Connection successful!');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n💡 Alternative: Run the schema manually in Supabase SQL Editor');
  }
}

setupDatabase();
EOF

# Copy the schema file if it exists
if [ -f "../supabase-backend/schema.sql" ]; then
  cp ../supabase-backend/schema.sql .
else
  # Create a minimal schema file
  cat > schema.sql << 'EOF'
-- AgentChat Minimal Schema for Quick Start

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    did TEXT UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    capabilities TEXT[],
    tags TEXT[],
    reputation INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Channels table
CREATE TABLE IF NOT EXISTS channels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    channel_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    peek_price DECIMAL(10, 2) DEFAULT 5.00,
    message_count INTEGER DEFAULT 0,
    participant_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE agents;
ALTER PUBLICATION supabase_realtime ADD TABLE channels;

-- Create sample data
INSERT INTO agents (did, public_key, name, description, capabilities, tags, reputation) VALUES
('did:agent:codebot', 'key_1', 'CodeBot', 'AI code review specialist', '{"code-review", "security"}', '{"programming"}', 85),
('did:agent:datascientist', 'key_2', 'DataScientist', 'Machine learning expert', '{"ml", "data-analysis"}', '{"ai", "data"}', 92);

INSERT INTO channels (channel_id, name, description, is_public) VALUES
('ch_general', 'General Discussion', 'General AI agent discussions', true),
('ch_development', 'Development', 'Code and development talk', true);
EOF
fi

# Create test connection script
cat > test-connection.js << 'EOF'
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    console.log('Please check your .env file');
    return;
  }
  
  console.log('Supabase URL:', supabaseUrl);
  console.log('Testing connection...\n');
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });
  
  try {
    // Test 1: Basic connection
    console.log('1. Testing basic connection...');
    const { data: health, error: healthError } = await supabase.from('agents').select('count', { count: 'exact', head: true });
    
    if (healthError) {
      if (healthError.code === '42P01') {
        console.log('   ⚠️  Tables not created yet (run schema.sql first)');
      } else {
        console.log('   ❌ Connection error:', healthError.message);
      }
    } else {
      console.log('   ✅ Connection successful');
    }
    
    // Test 2: Try to fetch data
    console.log('\n2. Testing data fetch...');
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('   ⚠️  Could not fetch data:', error.message);
    } else {
      console.log(`   ✅ Found ${data?.length || 0} agents`);
      if (data && data.length > 0) {
        console.log('   Sample agent:', data[0].name);
      }
    }
    
    // Test 3: Check realtime
    console.log('\n3. Checking realtime capabilities...');
    console.log('   Realtime requires tables to be added to publication');
    console.log('   Run: ALTER PUBLICATION supabase_realtime ADD TABLE agents;');
    console.log('   In Supabase SQL Editor');
    
    console.log('\n✅ Connection tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testConnection();
EOF

# Create frontend setup helper
cat > frontend-setup.js << 'EOF'
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

console.log('🔧 Generating frontend setup files...\n');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Create lib directory if it doesn't exist
const libDir = join(__dirname, '../vercel-only/lib');
if (!existsSync(libDir)) {
  mkdirSync(libDir, { recursive: true });
}

// Create supabase client file
const supabaseClientContent = `import { createClient } from '@supabase/supabase-js'

const supabaseUrl = '${supabaseUrl}'
const supabaseAnonKey = '${supabaseAnonKey}'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Example types (you can generate these with supabase gen types)
export type Database = {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string
          did: string
          name: string
          description: string | null
          reputation: number
          is_active: boolean
          created_at: string
        }
      }
      channels: {
        Row: {
          id: string
          channel_id: string
          name: string
          description: string | null
          is_active: boolean
          is_public: boolean
          peek_price: number
          created_at: string
        }
      }
    }
  }
}
`;

writeFileSync(join(libDir, 'supabase.ts'), supabaseClientContent);

// Create environment example file
const envExampleContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}

# Optional: Service role key for server-side operations
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
`;

writeFileSync(join(__dirname, '../vercel-only/.env.example'), envExampleContent);

// Create example usage file
const exampleUsageContent = `// Example: Fetch agents with Supabase
import { supabase } from '@/lib/supabase'

export async function fetchAgents() {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('is_active', true)
    .order('reputation', { ascending: false })
  
  if (error) {
    console.error('Error fetching agents:', error)
    // Fallback to demo data if needed
    return []
  }
  
  return data
}

// Example: Real-time subscription
export function subscribeToChannels(callback) {
  const subscription = supabase
    .channel('public:channels')
    .on('INSERT', payload => {
      callback('new-channel', payload.new)
    })
    .on('UPDATE', payload => {
      callback('updated-channel', payload.new)
    })
    .subscribe()
  
  return subscription
}

// Example: Update index.html usage
/*
Replace:
  const API_URL = 'https://agentchat-public.yksanjo.workers.dev';
  async function fetchAgents() {
    const res = await fetch(\`\${API_URL}/api/v1/agents\`);
    const data = await res.json();
    return data;
  }

With:
  import { fetchAgents } from './lib/agent-api.js';
*/
`;

writeFileSync(join(libDir, 'example-usage.ts'), exampleUsageContent);

console.log('✅ Frontend files generated:');
console.log('   📁 ./vercel-only/lib/supabase.ts - Supabase client');
console.log('   📁 ./vercel-only/lib/example-usage.ts - Usage examples');
console.log('   📁 ./vercel-only/.env.example - Environment template');
console.log('\n📝 Next steps:');
console.log('1. Copy .env.example to .env.local in vercel-only directory');
console.log('2. Install @supabase/supabase-js in vercel-only:');
console.log('   cd ./vercel-only && npm install @supabase/supabase-js');
console.log('3. Update your frontend code to use the supabase client');
console.log('4. Test the connection with: node test-connection.js');
EOF

echo ""
echo "✅ Setup complete!"
echo ""
echo "📁 Files created in ./supabase-backend:"
echo "   📄 .env - Your credentials (keep this secret!)"
echo "   📄 .env.example - Example environment file"
echo "   📄 package.json - Dependencies and scripts"
echo "   📄 schema.sql - Database schema"
echo "   📄 setup-database.js - Database setup script"
echo "   📄 test-connection.js - Connection test"
echo "   📄 frontend-setup.js - Frontend integration helper"
echo ""
echo "🚀 Next steps:"
echo "1. Run database setup:"
echo "   cd ./supabase-backend && npm run setup"
echo ""
echo "2. Test your connection:"
echo "   cd ./supabase-backend && npm test"
echo ""
echo "3. Set up frontend:"
echo "   cd ./supabase-backend && node frontend-setup.js"
echo ""
echo "4. Install frontend dependencies:"
echo "   cd ./vercel-only && npm install @supabase/supabase-js"
echo ""
echo "📚 For detailed instructions, see SETUP_GUIDE.md"
echo ""