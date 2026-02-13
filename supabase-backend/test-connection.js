#!/usr/bin/env node

/**
 * Test connection to Supabase and Cloudflare R2
 */

import { createClient } from '@supabase/supabase-js';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

async function testSupabase() {
  console.log('Testing Supabase connection...');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('   SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Set' : 'Missing');
    return false;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    
    // Test connection by getting table count
    const { data, error } = await supabase
      .from('agents')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      // Table might not exist yet, which is OK for initial test
      if (error.code === '42P01') {
        console.log('⚠️  Agents table not found (expected if schema not run yet)');
        return true;
      }
      throw error;
    }
    
    console.log(`✅ Supabase connection successful`);
    console.log(`   Agents in database: ${data?.count || 0}`);
    return true;
    
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
}

async function testR2() {
  console.log('\nTesting Cloudflare R2 connection...');
  
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  
  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.error('❌ Missing R2 environment variables');
    console.error('   CLOUDFLARE_ACCOUNT_ID:', accountId ? 'Set' : 'Missing');
    console.error('   R2_ACCESS_KEY_ID:', accessKeyId ? 'Set' : 'Missing');
    console.error('   R2_SECRET_ACCESS_KEY:', secretAccessKey ? 'Set' : 'Missing');
    return false;
  }
  
  try {
    const r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    
    // Test connection by listing buckets
    const command = new ListBucketsCommand({});
    const response = await r2Client.send(command);
    
    console.log(`✅ R2 connection successful`);
    console.log(`   Buckets available: ${response.Buckets?.length || 0}`);
    
    // Check if our target bucket exists
    const targetBucket = process.env.R2_BUCKET_NAME || 'agentchat-production';
    const bucketExists = response.Buckets?.some(b => b.Name === targetBucket);
    
    if (bucketExists) {
      console.log(`   Target bucket "${targetBucket}" found`);
    } else {
      console.log(`   ⚠️  Target bucket "${targetBucket}" not found`);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ R2 connection failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('===========================================');
  console.log('AgentChat Migration - Connection Test');
  console.log('===========================================\n');
  
  const supabaseOk = await testSupabase();
  const r2Ok = await testR2();
  
  console.log('\n===========================================');
  console.log('TEST SUMMARY');
  console.log('===========================================');
  
  if (supabaseOk && r2Ok) {
    console.log('✅ All connections successful!');
    console.log('\nNext steps:');
    console.log('1. Run the database schema in Supabase SQL Editor');
    console.log('2. Run: npm run migrate');
  } else {
    console.log('❌ Some connections failed');
    console.log('\nTroubleshooting:');
    
    if (!supabaseOk) {
      console.log('- Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
      console.log('- Verify Supabase project is running');
      console.log('- Check network connectivity');
    }
    
    if (!r2Ok) {
      console.log('- Check Cloudflare R2 credentials');
      console.log('- Verify bucket exists');
      console.log('- Check IAM permissions');
    }
    
    console.log('\nEnvironment variables needed:');
    console.log('SUPABASE_URL=https://xxxx.supabase.co');
    console.log('SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...');
    console.log('CLOUDFLARE_ACCOUNT_ID=your_account_id');
    console.log('R2_ACCESS_KEY_ID=your_access_key');
    console.log('R2_SECRET_ACCESS_KEY=your_secret_key');
    console.log('R2_BUCKET_NAME=agentchat-production (optional)');
  }
  
  console.log('\n===========================================');
}

main().catch(console.error);