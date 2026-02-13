#!/usr/bin/env node

/**
 * AgentChat Supabase Setup Script
 * 
 * This script helps you set up Supabase for AgentChat.
 * Run it and follow the instructions.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🚀 AgentChat Supabase Setup');
  console.log('============================\n');
  
  // Check if .env already exists
  const envPath = join(__dirname, 'supabase-backend/.env');
  let hasEnv = existsSync(envPath);
  
  if (hasEnv) {
    console.log('📁 Found existing .env file');
    const useExisting = await question('Use existing credentials? (y/n): ');
    
    if (useExisting.toLowerCase() === 'y') {
      console.log('Using existing credentials...\n');
      await runSetupWithExistingEnv();
      rl.close();
      return;
    }
  }
  
  // Get credentials from user
  console.log('\n🔑 Please enter your Supabase credentials:\n');
  
  const supabaseUrl = await question('Supabase Project URL (https://xxx.supabase.co): ');
  const supabaseAnonKey = await question('Supabase Anon/Public Key: ');
  const supabaseServiceKey = await question('Supabase Service Role Key: ');
  
  // Create directory structure
  const backendDir = join(__dirname, 'supabase-backend');
  if (!existsSync(backendDir)) {
    mkdirSync(backendDir, { recursive: true });
  }
  
  // Create .env file
  const envContent = `# Supabase Credentials
SUPABASE_URL=${supabaseUrl}
SUPABASE_ANON_KEY=${supabaseAnonKey}
SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}

# Cloudflare R2 (for migration - optional)
# CLOUDFLARE_ACCOUNT_ID=your_account_id
# R2_ACCESS_KEY_ID=your_access_key
# R2_SECRET_ACCESS_KEY=your_secret_key
# R2_BUCKET_NAME=agentchat-production
`;
  
  writeFileSync(envPath, envContent);
  console.log('\n✅ Created .env file');
  
  // Create package.json
  const packageJson = {
    name: "agentchat-supabase",
    version: "1.0.0",
    description: "Supabase backend for AgentChat",
    type: "module",
    scripts: {
      "setup": "node setup.js",
      "test": "node test-connection.js",
      "generate-frontend": "node generate-frontend-files.js"
    },
    dependencies: {
      "@supabase/supabase-js": "^2.39.0",
      "dotenv": "^16.3.1"
    },
    engines: {
      node: ">=18.0.0"
    }
  };
  
  writeFileSync(
    join(backendDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  console.log('✅ Created package.json');
  
  // Copy schema file if it exists
  const schemaSource = join(__dirname, 'supabase-backend/schema.sql');
  const schemaDest = join(backendDir, 'schema.sql');
  
  if (existsSync(schemaSource)) {
    const schemaContent = readFileSync(schemaSource, 'utf8');
    writeFileSync(schemaDest, schemaContent);
    console.log('✅ Copied schema.sql');
  } else {
    // Create minimal schema
    const minimalSchema = `-- AgentChat Minimal Schema for Quick Start

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
`;
    
    writeFileSync(schemaDest, minimalSchema);
    console.log('✅ Created minimal schema.sql');
  }
  
  // Create setup script
  const setupScript = `import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupDatabase() {
  console.log('🔧 Setting up AgentChat database...\\n');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });
  
  try {
    // Read schema
    const schemaPath = join(__dirname, 'schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Please run this schema in Supabase SQL Editor:');
    console.log('\\n1. Go to: ' + supabaseUrl.replace('/rest/v1', ''));
    console.log('2. Navigate to: SQL Editor');
    console.log('3. Click "New query"');
    console.log('4. Copy the schema below:');
    console.log('\\n' + '='.repeat(50));
    console.log(schemaSql);
    console.log('='.repeat(50));
    
    console.log('\\n✅ Schema ready to be executed.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setupDatabase();
`;
  
  writeFileSync(join(backendDir, 'setup.js'), setupScript);
  console.log('✅ Created setup.js');
  
  // Create test connection script
  const testScript = `import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\\n');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    return;
  }
  
  console.log('Supabase URL:', supabaseUrl);
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });
  
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('⚠️  Tables not created yet - run the schema first');
      } else {
        console.log('❌ Error:', error.message);
      }
    } else {
      console.log('✅ Connection successful!');
      console.log('Found', data?.length || 0, 'agents');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testConnection();
`;
  
  writeFileSync(join(backendDir, 'test-connection.js'), testScript);
  console.log('✅ Created test-connection.js');
  
  // Create frontend generator
  const frontendGenerator = `import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Generating frontend files...\\n');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Create lib directory in vercel-only
const libDir = join(__dirname, '../vercel-only/lib');
if (!existsSync(libDir)) {
  mkdirSync(libDir, { recursive: true });
}

// Create supabase client
const clientContent = \`import { createClient } from '@supabase/supabase-js'

const supabaseUrl = '\${supabaseUrl}'
const supabaseAnonKey = '\${supabaseAnonKey}'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Example usage:
// import { supabase } from '@/lib/supabase'
// 
// async function getAgents() {
//   const { data } = await supabase.from('agents').select('*')
//   return data
// }
\`;

writeFileSync(join(libDir, 'supabase.js'), clientContent);

// Create environment example
const envExample = \`NEXT_PUBLIC_SUPABASE_URL=\${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=\${supabaseAnonKey}
\`;

writeFileSync(join(__dirname, '../vercel-only/.env.local.example'), envExample);

console.log('✅ Generated files:');
console.log('   📁 ./vercel-only/lib/supabase.js');
console.log('   📁 ./vercel-only/.env.local.example');
console.log('\\n📝 Next steps:');
console.log('1. Copy .env.local.example to .env.local in vercel-only');
console.log('2. Install @supabase/supabase-js:');
console.log('   cd ./vercel-only && npm install @supabase/supabase-js');
console.log('3. Update your code to use the supabase client');
\`;

writeFileSync(join(backendDir, 'generate-frontend-files.js'), frontendGenerator);
console.log('✅ Created generate-frontend-files.js');
  
  console.log('\n🎉 Setup complete!');
  console.log('\n📁 Directory structure:');
  console.log('   ./supabase-backend/');
  console.log('   ├── .env (your credentials)');
  console.log('   ├── package.json');
  console.log('   ├── schema.sql');
  console.log('   ├── setup.js');
  console.log('   ├── test-connection.js');
  console.log('   └── generate-frontend-files.js');
  
  console.log('\n🚀 Next steps:');
  console.log('1. Install dependencies:');
  console.log('   cd ./supabase-backend && npm install');
  console.log('\n2. Set up database schema:');
  console.log('   cd ./supabase-backend && npm run setup');
  console.log('   (Follow instructions to run schema in Supabase SQL Editor)');
  console.log('\n3. Test connection:');
  console.log('   cd ./supabase-backend && npm test');
  console.log('\n4. Generate frontend files:');
  console.log('   cd ./supabase-backend && npm run generate-frontend');
  console.log('\n5. Update frontend:');
  console.log('   cd ./vercel-only && npm install @supabase/supabase-js');
  console.log('   Update your code to use Supabase client');
  
  rl.close();
}

async function runSetupWithExistingEnv() {
  console.log('\nRunning setup with existing credentials...\n');
  
  // Load environment
  const envPath = join(__dirname, 'supabase-backend/.env');
  const envContent = readFileSync(envPath, 'utf8');
  
  // Parse URL from env
  const urlMatch = envContent.match(/SUPABASE_URL=(.+)/);
  const supabaseUrl = urlMatch ? urlMatch[1].trim() : null;
  
  if (!supabaseUrl) {
    console.error('❌ Could not find SUPABASE_URL in .env');
    return;
  }
  
  console.log('📋 Database setup instructions:');
  console.log('===============================\n');
  console.log('1. Go to your Supabase Dashboard:');
  console.log('   ' + supabaseUrl.replace('/rest/v1', ''));
  console.log('\n2. Navigate to: SQL Editor');
  console.log('\n3. Click "New query"');
  console.log('\n4. Copy and run the schema from:');
  console.log('   ./supabase-backend/schema.sql');
  console.log('\n5. After running schema, test connection:');
  console.log('   cd ./supabase-backend && npm test');
  
  // Check if we have the full schema
  const schemaPath = join(__dirname, 'supabase-backend/schema.sql');
  if (existsSync(schemaPath)) {
    const schemaContent = readFileSync(schemaPath, 'utf8');
    console.log('\n📄 Schema preview (first 500 chars):');
    console.log('='.repeat(50));
    console.log(schemaContent.substring(0, 500) + '...');
    console.log('='.repeat(50));
  }
}

// Run main function
main().catch(console.error);