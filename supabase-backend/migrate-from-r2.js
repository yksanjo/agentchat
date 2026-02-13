#!/usr/bin/env node

/**
 * Migration script from Cloudflare R2 to Supabase
 * 
 * This script helps migrate existing AgentChat data from R2 storage to Supabase.
 * 
 * Usage:
 * 1. Set up Supabase project and run schema.sql
 * 2. Configure environment variables
 * 3. Run: node migrate-from-r2.js
 */

import { createClient } from '@supabase/supabase-js';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { fromEnv } from '@aws-sdk/credential-provider-env';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const config = {
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  r2: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET_NAME || 'agentchat-production',
  }
};

// Validate configuration
function validateConfig() {
  const missing = [];
  
  if (!config.supabase.url) missing.push('SUPABASE_URL');
  if (!config.supabase.serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!config.r2.accountId) missing.push('CLOUDFLARE_ACCOUNT_ID');
  if (!config.r2.accessKeyId) missing.push('R2_ACCESS_KEY_ID');
  if (!config.r2.secretAccessKey) missing.push('R2_SECRET_ACCESS_KEY');
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:');
    missing.forEach(v => console.error(`  - ${v}`));
    process.exit(1);
  }
}

// Initialize clients
function initClients() {
  // Supabase client with service role for migration
  const supabase = createClient(
    config.supabase.url,
    config.supabase.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  // R2/S3 client
  const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.r2.accessKeyId,
      secretAccessKey: config.r2.secretAccessKey,
    },
  });

  return { supabase, r2Client };
}

// List all objects in R2 bucket
async function listR2Objects(r2Client, bucket) {
  console.log('Listing objects in R2 bucket...');
  
  const objects = [];
  let continuationToken;
  
  try {
    do {
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
      });
      
      const response = await r2Client.send(command);
      
      if (response.Contents) {
        objects.push(...response.Contents);
      }
      
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);
    
    console.log(`Found ${objects.length} objects in R2 bucket`);
    return objects;
  } catch (error) {
    console.error('Error listing R2 objects:', error);
    throw error;
  }
}

// Get object content from R2
async function getR2Object(r2Client, bucket, key) {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    
    const response = await r2Client.send(command);
    const content = await response.Body.transformToString();
    
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error getting object ${key}:`, error);
    return null;
  }
}

// Migrate agents from R2 to Supabase
async function migrateAgents(r2Client, supabase, bucket) {
  console.log('\n=== Migrating Agents ===');
  
  // List agent objects (assuming they're stored with prefix 'agents/')
  const objects = await listR2Objects(r2Client, bucket);
  const agentObjects = objects.filter(obj => obj.Key.startsWith('agents/'));
  
  console.log(`Found ${agentObjects.length} agent objects to migrate`);
  
  let migrated = 0;
  let failed = 0;
  
  for (const obj of agentObjects) {
    try {
      const agentData = await getR2Object(r2Client, bucket, obj.Key);
      
      if (!agentData) {
        console.warn(`Skipping ${obj.Key} - could not parse data`);
        failed++;
        continue;
      }
      
      // Transform R2 agent data to Supabase schema
      const supabaseAgent = {
        did: agentData.did || `did:agent:${obj.Key.replace('agents/', '')}`,
        public_key: agentData.publicKey || '',
        name: agentData.profile?.name || 'Unknown Agent',
        description: agentData.profile?.description || '',
        capabilities: agentData.profile?.capabilities || [],
        tags: agentData.profile?.tags || [],
        reputation: agentData.profile?.reputation || agentData.stats?.reputation || 0,
        total_messages: agentData.stats?.totalMessages || 0,
        total_conversations: agentData.stats?.totalConversations || 0,
        total_peeks: agentData.stats?.totalPeeks || 0,
        total_earnings: agentData.stats?.totalEarnings || 0,
        is_active: true,
        last_active_at: new Date(agentData.stats?.lastActive || Date.now()).toISOString(),
        created_at: new Date(agentData.createdAt || Date.now()).toISOString(),
        auto_refuse: agentData.peekPolicy?.autoRefuse || false,
        max_refusal_budget: agentData.peekPolicy?.maxRefusalBudget || 100.00,
        current_refusal_spend: agentData.peekPolicy?.currentRefusalSpend || 0.00,
        refusal_timeout: agentData.peekPolicy?.refusalTimeout || 60,
      };
      
      // Insert into Supabase
      const { error } = await supabase
        .from('agents')
        .upsert(supabaseAgent, { onConflict: 'did' });
      
      if (error) {
        console.error(`Error migrating agent ${obj.Key}:`, error);
        failed++;
      } else {
        migrated++;
        if (migrated % 10 === 0) {
          console.log(`Migrated ${migrated} agents...`);
        }
      }
    } catch (error) {
      console.error(`Error processing agent ${obj.Key}:`, error);
      failed++;
    }
  }
  
  console.log(`Agents migration complete: ${migrated} migrated, ${failed} failed`);
  return { migrated, failed };
}

// Migrate channels from R2 to Supabase
async function migrateChannels(r2Client, supabase, bucket) {
  console.log('\n=== Migrating Channels ===');
  
  const objects = await listR2Objects(r2Client, bucket);
  const channelObjects = objects.filter(obj => obj.Key.startsWith('channels/'));
  
  console.log(`Found ${channelObjects.length} channel objects to migrate`);
  
  let migrated = 0;
  let failed = 0;
  
  for (const obj of channelObjects) {
    try {
      const channelData = await getR2Object(r2Client, bucket, obj.Key);
      
      if (!channelData) {
        console.warn(`Skipping ${obj.Key} - could not parse data`);
        failed++;
        continue;
      }
      
      // Transform R2 channel data to Supabase schema
      const supabaseChannel = {
        channel_id: channelData.id || obj.Key.replace('channels/', ''),
        name: channelData.metadata?.name || 'Unnamed Channel',
        description: channelData.metadata?.description || '',
        topic_tags: channelData.metadata?.topicTags || [],
        max_participants: channelData.metadata?.maxParticipants || 10,
        is_active: true,
        is_public: channelData.accessControl?.type !== 'invite_only',
        peek_price: 5.00, // Default
        message_count: channelData.stats?.messageCount || 0,
        participant_count: channelData.participants?.length || 0,
        total_peeks: 0, // Will need to calculate from peeks data
        total_earnings: 0.00,
        created_at: new Date(channelData.createdAt || Date.now()).toISOString(),
        last_message_at: channelData.stats?.lastMessageAt 
          ? new Date(channelData.stats.lastMessageAt).toISOString()
          : null,
      };
      
      // Insert into Supabase
      const { error } = await supabase
        .from('channels')
        .upsert(supabaseChannel, { onConflict: 'channel_id' });
      
      if (error) {
        console.error(`Error migrating channel ${obj.Key}:`, error);
        failed++;
      } else {
        migrated++;
        if (migrated % 10 === 0) {
          console.log(`Migrated ${migrated} channels...`);
        }
      }
    } catch (error) {
      console.error(`Error processing channel ${obj.Key}:`, error);
      failed++;
    }
  }
  
  console.log(`Channels migration complete: ${migrated} migrated, ${failed} failed`);
  return { migrated, failed };
}

// Main migration function
async function main() {
  console.log('Starting migration from R2 to Supabase...');
  console.log('===========================================\n');
  
  // Validate configuration
  validateConfig();
  
  // Initialize clients
  const { supabase, r2Client } = initClients();
  
  // Test connections
  console.log('Testing Supabase connection...');
  const { error: supabaseError } = await supabase.from('agents').select('count', { count: 'exact', head: true });
  if (supabaseError) {
    console.error('Supabase connection failed:', supabaseError);
    process.exit(1);
  }
  console.log('✓ Supabase connection successful\n');
  
  // Perform migrations
  try {
    // Migrate agents
    const agentResult = await migrateAgents(r2Client, supabase, config.r2.bucket);
    
    // Migrate channels
    const channelResult = await migrateChannels(r2Client, supabase, config.r2.bucket);
    
    // Summary
    console.log('\n===========================================');
    console.log('MIGRATION SUMMARY');
    console.log('===========================================');
    console.log(`Agents: ${agentResult.migrated} migrated, ${agentResult.failed} failed`);
    console.log(`Channels: ${channelResult.migrated} migrated, ${channelResult.failed} failed`);
    console.log('\nNext steps:');
    console.log('1. Manually migrate any additional data (peeks, messages, etc.)');
    console.log('2. Update frontend to use Supabase client');
    console.log('3. Test the migrated data');
    console.log('4. Switch traffic to new backend');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
main().catch(console.error);