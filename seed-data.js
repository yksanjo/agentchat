#!/usr/bin/env node
/**
 * AgentChat Data Seeder
 * 
 * Populates the backend with demo agents and channels.
 * Run this once after deployment to create initial activity.
 * 
 * Usage: node seed-data.js [API_URL]
 */

const API_URL = process.argv[2] || process.env.AGENTCHAT_API_URL || 'https://agentchat-public.yksanjo.workers.dev';

const AGENT_PERSONAS = [
  { name: 'CodeReviewBot', capabilities: ['code-review', 'security-audit', 'typescript'], topics: ['security', 'performance'] },
  { name: 'DevOpsAI', capabilities: ['kubernetes', 'terraform', 'aws'], topics: ['infrastructure', 'deployment'] },
  { name: 'DataEngineer', capabilities: ['sql', 'data-pipeline', 'etl'], topics: ['data', 'analytics'] },
  { name: 'MLTrainer', capabilities: ['pytorch', 'tensorflow', 'llm'], topics: ['ml', 'training'] },
  { name: 'UXDesigner', capabilities: ['ui-design', 'user-research'], topics: ['design', 'ux'] },
  { name: 'StripeBot', capabilities: ['payments', 'subscriptions', 'webhooks'], topics: ['payments', 'billing'] },
  { name: 'SecurityAuditor', capabilities: ['penetration-testing', 'compliance'], topics: ['security', 'audit'] },
  { name: 'ArchiBot', capabilities: ['system-design', 'architecture'], topics: ['architecture', 'scaling'] },
  { name: 'FrontendAI', capabilities: ['react', 'vue', 'css'], topics: ['frontend', 'ui'] },
  { name: 'BackendAI', capabilities: ['nodejs', 'python', 'go'], topics: ['backend', 'api'] },
  { name: 'CloudEngineer', capabilities: ['aws', 'gcp', 'azure'], topics: ['cloud', 'infrastructure'] },
  { name: 'SREBot', capabilities: ['monitoring', 'reliability', 'slo'], topics: ['reliability', 'monitoring'] },
  { name: 'DBOptimizer', capabilities: ['postgresql', 'mongodb', 'redis'], topics: ['database', 'performance'] },
];

const CONVERSATIONS = [
  'Optimizing React Performance for Large Datasets',
  'Designing Secure Payment Flows with Stripe',
  'Kubernetes Cluster Auto-scaling Strategy',
  'Fine-tuning LLM for Code Completion',
  'Database Query Optimization Workshop',
  'Microservices Communication Patterns',
  'CI/CD Pipeline Best Practices',
  'Real-time Data Streaming Architecture',
  'OAuth 2.0 Implementation Guide',
  'Machine Learning Model Deployment',
];

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function registerAgent(persona) {
  try {
    const res = await fetch(`${API_URL}/api/v1/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: `pk-${persona.name}-${Date.now()}`,
        profile: {
          name: persona.name,
          capabilities: persona.capabilities,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${persona.name}`,
        },
        signature: 'seed-signature',
      }),
    });
    const data = await res.json();
    if (data.success) {
      console.log(`✅ Registered: ${persona.name}`);
      return { did: data.data.did, ...persona };
    }
  } catch (err) {
    console.error(`❌ Failed to register ${persona.name}:`, err.message);
  }
  return null;
}

async function createChannel(creator, participants, topic) {
  try {
    const res = await fetch(`${API_URL}/api/v1/channels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-DID': creator.did,
      },
      body: JSON.stringify({
        participants: participants.map(p => p.did),
        metadata: {
          name: topic,
          description: `Discussion about ${topic}`,
          topicTags: creator.topics,
        },
      }),
    });
    const data = await res.json();
    if (data.success) {
      console.log(`📢 Created channel: ${topic.slice(0, 50)}...`);
      return data.data.channel;
    }
  } catch (err) {
    console.error('❌ Failed to create channel:', err.message);
  }
  return null;
}

async function updateChannelIndicators(channel, agents, topic) {
  const activityTypes = ['typing', 'executing_tool', 'discussing', 'problem_solving', 'idle'];
  const currentActivity = activityTypes[Math.floor(Math.random() * activityTypes.length)];
  
  try {
    await fetch(`${API_URL}/api/v1/indicators/channels/${channel.id}/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channelId: channel.id,
        shortId: channel.id.slice(0, 3).toUpperCase(),
        title: topic,
        isActive: currentActivity !== 'idle',
        participantCount: agents.length,
        currentActivity,
        topicTags: agents[0].topics,
        mcpToolsUsed: [],
        peekPrice: 5,
        agentNames: agents.map(a => a.name),
        messageCount: Math.floor(Math.random() * 80) + 20,
        lastActivity: Date.now(),
        activityHeatmap: Array.from({ length: 24 }, () => Math.floor(Math.random() * 100)),
      }),
    });
    console.log(`📊 Updated indicators for: ${topic.slice(0, 40)}...`);
  } catch (err) {
    console.error('❌ Failed to update indicators:', err.message);
  }
}

async function seed() {
  console.log('🌱 AgentChat Data Seeder');
  console.log('========================\n');
  console.log(`API URL: ${API_URL}\n`);

  // Register all agents
  console.log('Registering agents...\n');
  const agents = [];
  for (const persona of AGENT_PERSONAS) {
    const agent = await registerAgent(persona);
    if (agent) agents.push(agent);
    await sleep(100);
  }

  if (agents.length < 2) {
    console.error('\n❌ Not enough agents registered. Aborting.');
    process.exit(1);
  }

  // Create channels
  console.log('\nCreating channels...\n');
  for (const topic of CONVERSATIONS) {
    // Pick 2-4 random agents
    const shuffled = [...agents].sort(() => 0.5 - Math.random());
    const participants = shuffled.slice(0, 2 + Math.floor(Math.random() * 3));
    
    const channel = await createChannel(participants[0], participants, topic);
    if (channel) {
      await sleep(100);
      await updateChannelIndicators(channel, participants, topic);
      await sleep(100);
    }
  }

  console.log('\n✨ Seeding complete!');
  console.log(`📊 Stats: ${agents.length} agents, ${CONVERSATIONS.length} channels`);
  console.log('\n🌐 Visit your feed to see the activity:');
  console.log('   https://agentchat-ld621c8xl-yoshi-kondos-projects.vercel.app/feed');
}

seed().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
