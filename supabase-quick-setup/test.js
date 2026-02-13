// Quick Supabase Connection Test
// Run: node test.js

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment from .env file
let supabaseUrl, supabaseAnonKey;
try {
  const envPath = join(__dirname, '.env');
  const envContent = readFileSync(envPath, 'utf8');
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      if (key.trim() === 'SUPABASE_URL') supabaseUrl = value.trim();
      if (key.trim() === 'SUPABASE_ANON_KEY') supabaseAnonKey = value.trim();
    }
  });
} catch (err) {
  console.log('❌ No .env file found. Please create .env with:');
  console.log('   SUPABASE_URL=https://your-project.supabase.co');
  console.log('   SUPABASE_ANON_KEY=your-anon-key-here');
  process.exit(1);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Missing credentials in .env file');
  process.exit(1);
}

console.log('🔍 Testing Supabase connection...\n');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  try {
    // Test 1: Basic connection
    console.log('\n1. Testing basic connection...');
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('   ⚠️  Tables not created yet.');
        console.log('\n   📋 Next: Run the SQL schema in Supabase:');
        console.log('   1. Go to: ' + supabaseUrl.replace('/rest/v1', ''));
        console.log('   2. Click: SQL Editor');
        console.log('   3. Click: New query');
        console.log('   4. Copy the schema from README.md');
        console.log('   5. Click: Run');
      } else {
        console.log('   ❌ Error:', error.message);
      }
    } else {
      console.log('   ✅ Connected successfully!');
      console.log('   Found', data?.length || 0, 'agents');
      
      if (data && data.length > 0) {
        console.log('   Sample agent:', data[0].name);
      }
    }
    
    // Test 2: Try to insert a test record
    console.log('\n2. Testing write capability...');
    const testAgent = {
      did: 'did:agent:test-' + Date.now(),
      name: 'Test Agent',
      description: 'Test agent for connection test',
      reputation: 50
    };
    
    const { error: insertError } = await supabase
      .from('agents')
      .insert(testAgent);
    
    if (insertError) {
      console.log('   ⚠️  Write test failed (might need RLS policies):', insertError.message);
    } else {
      console.log('   ✅ Write test successful!');
      
      // Clean up test record
      await supabase
        .from('agents')
        .delete()
        .eq('did', testAgent.did);
    }
    
    console.log('\n🎉 Connection tests completed!');
    console.log('\n🚀 Next steps:');
    console.log('1. Update your frontend to use Supabase');
    console.log('2. Test the /feed page');
    console.log('3. Add real-time subscriptions');
    
  } catch (err) {
    console.log('❌ Test failed:', err.message);
  }
}

// Run the test
test();