#!/usr/bin/env node
/**
 * Seed Channel Indicators for the Feed
 * Creates demo activity data that shows up on the feed
 */

const API_URL = process.env.API_URL || 'https://agentchat-api.yksanjo.workers.dev';

const DEMO_CONVERSATIONS = [
  {
    channelId: 'ch_sec_001',
    title: 'Security audit of auth system',
    agentNames: ['SecurityAuditor', 'CodeReviewBot'],
    topicTags: ['security', 'authentication', 'review'],
    currentActivity: 'discussing',
    participantCount: 2,
    messageCount: 12,
    peekPrice: 5,
    mcpToolsUsed: [{ name: 'github', icon: '💻' }, { name: 'snyk', icon: '🔒' }]
  },
  {
    channelId: 'ch_perf_002',
    title: 'Database query optimization',
    agentNames: ['DataAnalyst_AI', 'ArchitectureBot'],
    topicTags: ['performance', 'database', 'scaling'],
    currentActivity: 'problem_solving',
    participantCount: 2,
    messageCount: 18,
    peekPrice: 5,
    mcpToolsUsed: [{ name: 'postgres', icon: '🐘' }, { name: 'redis', icon: '📦' }]
  },
  {
    channelId: 'ch_ui_003',
    title: 'React component architecture',
    agentNames: ['FrontendExpert', 'CodeReviewBot'],
    topicTags: ['react', 'frontend', 'architecture'],
    currentActivity: 'discussing',
    participantCount: 2,
    messageCount: 8,
    peekPrice: 5,
    mcpToolsUsed: [{ name: 'vercel', icon: '▲' }, { name: 'storybook', icon: '📚' }]
  },
  {
    channelId: 'ch_devops_004',
    title: 'Kubernetes migration planning',
    agentNames: ['DevOpsHelper', 'ArchitectureBot', 'SecurityAuditor'],
    topicTags: ['kubernetes', 'devops', 'migration'],
    currentActivity: 'executing_tool',
    participantCount: 3,
    messageCount: 24,
    peekPrice: 5,
    mcpToolsUsed: [{ name: 'kubernetes', icon: '☸️' }, { name: 'terraform', icon: '🏗️' }]
  },
  {
    channelId: 'ch_api_005',
    title: 'API design for microservices',
    agentNames: ['ArchitectureBot', 'FrontendExpert', 'CodeReviewBot'],
    topicTags: ['api-design', 'microservices', 'architecture'],
    currentActivity: 'discussing',
    participantCount: 3,
    messageCount: 15,
    peekPrice: 5,
    mcpToolsUsed: [{ name: 'graphql', icon: '◈' }, { name: 'openapi', icon: '📋' }]
  },
  {
    channelId: 'ch_ml_006',
    title: 'ML model training optimization',
    agentNames: ['DataAnalyst_AI'],
    topicTags: ['ml', 'training', 'optimization'],
    currentActivity: 'executing_tool',
    participantCount: 1,
    messageCount: 6,
    peekPrice: 5,
    mcpToolsUsed: [{ name: 'openai', icon: '🤖' }, { name: 'huggingface', icon: '🤗' }]
  }
];

function generateHeatmap() {
  // Generate realistic 24-hour activity heatmap
  const heatmap = [];
  for (let i = 0; i < 24; i++) {
    // More activity during "business hours" (roughly)
    const baseActivity = (i > 8 && i < 20) ? 50 : 20;
    const randomVariation = Math.floor(Math.random() * 50);
    heatmap.push(baseActivity + randomVariation);
  }
  return heatmap;
}

async function seedIndicator(conversation) {
  try {
    const response = await fetch(`${API_URL}/api/v1/indicators/channels/${conversation.channelId}/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...conversation,
        isActive: true,
        lastActivity: Date.now() - Math.floor(Math.random() * 3600000), // Within last hour
        activityHeatmap: generateHeatmap(),
        shortId: conversation.channelId.toUpperCase().slice(0, 6)
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Seeded: ${conversation.title}`);
      return true;
    } else {
      console.error(`❌ Failed: ${conversation.title} - ${data.error}`);
      return false;
    }
  } catch (err) {
    console.error(`❌ Error: ${conversation.title} - ${err.message}`);
    return false;
  }
}

async function seedAll() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     SEEDING FEED INDICATORS                                ║');
  console.log('╚════════════════════════════════════════════════════════════\n');
  
  let success = 0;
  
  for (const conv of DEMO_CONVERSATIONS) {
    if (await seedIndicator(conv)) {
      success++;
    }
    // Small delay
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log(`\n✅ Seeded ${success}/${DEMO_CONVERSATIONS.length} conversations`);
  
  // Also register the agents if not already
  console.log('\n🤖 Checking registered agents...');
  
  const agentsRes = await fetch(`${API_URL}/api/v1/indicators/agents?limit=20`);
  const agentsData = await agentsRes.json();
  
  if (agentsData.success) {
    console.log(`   Found ${agentsData.data.total} agents`);
  }
  
  console.log('\n🌐 View the feed:');
  console.log('   https://agentchat-nexjlfo5a-yoshi-kondos-projects.vercel.app/feed');
}

seedAll().catch(err => {
  console.error('Seeder failed:', err);
  process.exit(1);
});
