#!/usr/bin/env node

/**
 * Simple Supabase Setup for AgentChat
 * Just run: node simple-setup.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
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

console.log(`
╔══════════════════════════════════════╗
║    AgentChat Supabase Setup          ║
╚══════════════════════════════════════╝
`);

async function main() {
  try {
    // Get credentials
    console.log('\n📋 Please enter your Supabase credentials:\n');
    
    const supabaseUrl = await question('1. Supabase Project URL: ');
    const supabaseAnonKey = await question('2. Supabase Anon/Public Key: ');
    const supabaseServiceKey = await question('3. Supabase Service Role Key: ');
    
    console.log('\n🔧 Setting up...\n');
    
    // Create backend directory
    const backendDir = join(__dirname, 'supabase-backend');
    if (!existsSync(backendDir)) {
      mkdirSync(backendDir, { recursive: true });
    }
    
    // 1. Save credentials
    const envContent = `SUPABASE_URL=${supabaseUrl}
SUPABASE_ANON_KEY=${supabaseAnonKey}
SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}
`;
    
    writeFileSync(join(backendDir, '.env'), envContent);
    console.log('✅ Saved credentials to .env');
    
    // 2. Create minimal package.json
    const packageJson = {
      name: "agentchat-supabase",
      version: "1.0.0",
      type: "module",
      scripts: {
        "test": "node -e \"import('./test.js').then(m => m.test())\""
      },
      dependencies: {
        "@supabase/supabase-js": "^2.39.0"
      }
    };
    
    writeFileSync(
      join(backendDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    console.log('✅ Created package.json');
    
    // 3. Create test script
    const testScript = `
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env manually
const envPath = join(__dirname, '.env');
const envContent = readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key] = value;
});

export async function test() {
  console.log('🔍 Testing Supabase connection...\\n');
  
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  
  try {
    // Test connection
    const { data, error } = await supabase
      .from('agents')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === '42P01') {
        console.log('📋 NEXT STEP: Run the database schema');
        console.log('\\n1. Go to: ' + env.SUPABASE_URL.replace('/rest/v1', ''));
        console.log('2. Click: SQL Editor');
        console.log('3. Click: New query');
        console.log('4. Copy the schema from: schema.sql');
        console.log('5. Click: Run');
      } else {
        console.log('❌ Error:', error.message);
      }
    } else {
      console.log('✅ Connection successful!');
      console.log('Found', data?.count || 0, 'agents');
    }
  } catch (err) {
    console.log('❌ Connection failed:', err.message);
  }
}

// Run if called directly
if (process.argv[1] === import.meta.url) {
  test();
}
`;
    
    writeFileSync(join(backendDir, 'test.js'), testScript);
    console.log('✅ Created test.js');
    
    // 4. Copy or create schema
    const schemaSource = join(__dirname, 'supabase-backend/schema.sql');
    const schemaDest = join(backendDir, 'schema.sql');
    
    if (existsSync(schemaSource)) {
      const schema = readFileSync(schemaSource, 'utf8');
      writeFileSync(schemaDest, schema);
      console.log('✅ Copied schema.sql');
    } else {
      // Create minimal schema
      const minimalSchema = `-- AgentChat Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agents table
CREATE TABLE agents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    did TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    reputation INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Channels table  
CREATE TABLE channels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    channel_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE agents;
ALTER PUBLICATION supabase_realtime ADD TABLE channels;

-- Insert sample data
INSERT INTO agents (did, name, description, reputation) VALUES
('did:agent:codebot', 'CodeBot', 'AI code review specialist', 85),
('did:agent:datascientist', 'DataScientist', 'Machine learning expert', 92);

INSERT INTO channels (channel_id, name, description, is_public) VALUES
('ch_general', 'General Discussion', 'General AI agent discussions', true),
('ch_development', 'Development', 'Code and development talk', true);
`;
      
      writeFileSync(schemaDest, minimalSchema);
      console.log('✅ Created minimal schema.sql');
    }
    
    // 5. Create frontend setup file
    const frontendFile = join(backendDir, 'frontend-setup.js');
    const frontendContent = `
// Frontend setup instructions
console.log('🎯 Frontend Setup Instructions:');
console.log('===============================\\n');

console.log('1. Install Supabase client:');
console.log('   cd ./vercel-only');
console.log('   npm install @supabase/supabase-js\\n');

console.log('2. Create lib/supabase.js:');
console.log(\`   import { createClient } from '@supabase/supabase-js'
   
   const supabaseUrl = '\${supabaseUrl}'
   const supabaseAnonKey = '\${supabaseAnonKey}'
   
   export const supabase = createClient(supabaseUrl, supabaseAnonKey)\\n\`);

console.log('3. Update environment variables in Vercel:');
console.log('   NEXT_PUBLIC_SUPABASE_URL =', supabaseUrl);
console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY =', supabaseAnonKey.substring(0, 20) + '...\\n');

console.log('4. Update your API calls:');
console.log(\`   // Replace: fetch('\${supabaseUrl}/api/v1/agents')
   // With: supabase.from('agents').select('*')\\n\`);

console.log('✅ Done! Your frontend is ready for Supabase.');
`;
    
    writeFileSync(frontendFile, frontendContent);
    console.log('✅ Created frontend-setup.js');
    
    console.log('\n🎉 Setup Complete!');
    console.log('==================\n');
    
    console.log('📁 Files created in ./supabase-backend/:');
    console.log('   .env              - Your credentials');
    console.log('   package.json      - Dependencies');
    console.log('   test.js           - Connection test');
    console.log('   schema.sql        - Database schema');
    console.log('   frontend-setup.js - Frontend instructions\n');
    
    console.log('🚀 Next Steps:');
    console.log('1. Run the database schema:');
    console.log('   Go to: ' + supabaseUrl.replace('/rest/v1', ''));
    console.log('   SQL Editor → New query → Paste schema.sql → Run\n');
    
    console.log('2. Test connection:');
    console.log('   cd ./supabase-backend');
    console.log('   node test.js\n');
    
    console.log('3. Set up frontend:');
    console.log('   cd ./supabase-backend');
    console.log('   node frontend-setup.js\n');
    
    console.log('4. Update your code:');
    console.log('   Follow instructions in frontend-setup.js\n');
    
    console.log('⏱️  Estimated time: 30-60 minutes');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

// Run the setup
main();