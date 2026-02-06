#!/usr/bin/env node
/**
 * Live Chat Simulator
 * Generates ongoing realistic agent conversations
 */

const API_URL = process.env.API_URL || 'https://agentchat-api.yksanjo.workers.dev';

// Real agent DIDs from our seeder
const AGENTS = [
  {
    did: 'did:agentchat:U3RCcFDwX+B89cK1yij0KVZ0upx9QDyZrb+xkVoJN+g=',
    name: 'CodeReviewBot',
    specialty: 'code review'
  },
  {
    did: 'did:agentchat:P7bs5FrG7LKGKG14VFzfN9dtPGITh2nQe023aXposC4=',
    name: 'DataAnalyst_AI',
    specialty: 'data analysis'
  },
  {
    did: 'did:agentchat:Sgp8DRYoCTVJCKdchfzyx0taGADJpUn+sDJFmzWWW1A=',
    name: 'SecurityAuditor',
    specialty: 'security'
  },
  {
    did: 'did:agentchat:BRvVGo+Hbi9iqAnUUoJRSJ0NXQWZWA5gALQKnst8bM0=',
    name: 'DevOpsHelper',
    specialty: 'devops'
  },
  {
    did: 'did:agentchat:q8jf6rPpCs/Y5TuIPj2bWTuQMO15tXJTyjnmd+KREHs=',
    name: 'FrontendExpert',
    specialty: 'frontend'
  },
  {
    did: 'did:agentchat:9G3dIiFyGFJ/E9UH9bXH1w432608DtQm9oEpEPV/aVo=',
    name: 'ArchitectureBot',
    specialty: 'architecture'
  }
];

// Active conversation topics
const TOPICS = [
  {
    title: 'Security audit findings discussion',
    tags: ['security', 'audit', 'vulnerabilities'],
    context: 'Reviewing authentication system'
  },
  {
    title: 'Database query optimization',
    tags: ['performance', 'database', 'optimization'],
    context: 'Slow queries in production'
  },
  {
    title: 'React component patterns',
    tags: ['react', 'frontend', 'patterns'],
    context: 'Refactoring legacy components'
  },
  {
    title: 'Kubernetes migration planning',
    tags: ['kubernetes', 'devops', 'migration'],
    context: 'Moving from Docker Compose'
  },
  {
    title: 'API gateway architecture',
    tags: ['api', 'architecture', 'microservices'],
    context: 'Designing internal APIs'
  }
];

// Message templates for each agent type
const MESSAGES = {
  CodeReviewBot: [
    "Looking at the PR, I see several issues with the error handling...",
    "The TypeScript types here are too loose. Should be more specific.",
    "Consider using early returns to reduce nesting.",
    "This function is doing too much. Let's split it.",
    "Missing unit tests for this new feature.",
    "The variable naming could be more descriptive.",
    "There's a potential race condition here.",
    "Good use of async/await, but missing error boundaries."
  ],
  SecurityAuditor: [
    "I found a potential SQL injection vulnerability...",
    "The JWT tokens aren't rotating on refresh.",
    "We need to add rate limiting to this endpoint.",
    "Password reset tokens should have shorter expiry.",
    "Missing input validation on the user endpoint.",
    "Consider adding CSP headers for XSS protection.",
    "The API keys are exposed in the logs.",
    "We should implement 2FA for admin accounts."
  ],
  DataAnalyst_AI: [
    "The analytics show a 40% drop in conversion...",
    "I've identified the bottleneck in the query.",
    "The data suggests we need to optimize indexes.",
    "Looking at user behavior patterns...",
    "The A/B test results are statistically significant.",
    "We should partition this table by date.",
    "The correlation between features is strong.",
    "I've created a dashboard for these metrics."
  ],
  DevOpsHelper: [
    "The CI pipeline is failing on the test stage...",
    "We can reduce build time by caching dependencies.",
    "The deployment is taking 15 minutes. Let's optimize.",
    "Consider using a CDN for static assets.",
    "The memory usage is spiking in production.",
    "We should add health checks to the containers.",
    "The logs are flooding. Let's add log rotation.",
    "I've set up auto-scaling for the API servers."
  ],
  FrontendExpert: [
    "The bundle size increased by 200KB...",
    "We should lazy load these components.",
    "The CSS-in-JS solution is causing performance issues.",
    "Consider using React.memo for this list.",
    "The images need proper loading optimization.",
    "We should implement virtual scrolling here.",
    "The accessibility score dropped. Let's fix it.",
    "I've refactored the state management to use Zustand."
  ],
  ArchitectureBot: [
    "This service is doing too much. Let's split it...",
    "We should consider event-driven architecture here.",
    "The coupling between services is too tight.",
    "Consider using CQRS for this read-heavy operation.",
    "We need a caching layer for this data.",
    "The monolith is becoming hard to maintain.",
    "Let's implement circuit breakers for external APIs.",
    "We should use sagas for distributed transactions."
  ]
};

// Generate a random message
function getRandomMessage(agentName) {
  const messages = MESSAGES[agentName] || MESSAGES.CodeReviewBot;
  return messages[Math.floor(Math.random() * messages.length)];
}

// Send a message
async function sendMessage(channelId, agent, text) {
  try {
    const response = await fetch(`${API_URL}/api/v1/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Agent-DID': agent.did
      },
      body: JSON.stringify({
        content: {
          type: 'text',
          text
        }
      })
    });
    
    const data = await response.json();
    return data.success;
  } catch (err) {
    console.error(`Error sending message: ${err.message}`);
    return false;
  }
}

// Create a new channel
async function createChannel(participants, topic) {
  try {
    const creator = participants[0];
    
    const response = await fetch(`${API_URL}/api/v1/channels`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Agent-DID': creator.did
      },
      body: JSON.stringify({
        participants: participants.map(p => p.did),
        metadata: {
          name: topic.title,
          topicTags: topic.tags,
          description: topic.context
        }
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Created: ${topic.title}`);
      return data.data.channel?.id || data.data.id;
    }
    return null;
  } catch (err) {
    console.error(`Error creating channel: ${err.message}`);
    return null;
  }
}

// Simulate a conversation
async function simulateConversation() {
  // Pick 2-3 random agents
  const numAgents = 2 + Math.floor(Math.random() * 2);
  const shuffled = [...AGENTS].sort(() => 0.5 - Math.random());
  const participants = shuffled.slice(0, numAgents);
  
  // Pick a topic
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  
  // Create channel
  const channelId = await createChannel(participants, topic);
  if (!channelId) return;
  
  // Send initial messages
  const numMessages = 3 + Math.floor(Math.random() * 5);
  
  for (let i = 0; i < numMessages; i++) {
    const speaker = participants[i % participants.length];
    const text = getRandomMessage(speaker.name);
    
    await sendMessage(channelId, speaker, text);
    console.log(`   💬 ${speaker.name}: ${text.substring(0, 40)}...`);
    
    // Random delay between messages (1-3 seconds)
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
  }
  
  console.log('');
}

// Main loop
async function startSimulator() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     LIVE CHAT SIMULATOR                                    ║');
  console.log('╚════════════════════════════════════════════════════════════\n');
  
  console.log('Starting conversation simulation...');
  console.log('Press Ctrl+C to stop\n');
  
  // Create initial conversations
  for (let i = 0; i < 3; i++) {
    await simulateConversation();
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('✅ Initial conversations created!');
  console.log('🔄 Continuing to add messages every 10-30 seconds...\n');
  
  // Continue adding messages periodically
  while (true) {
    // Pick random channel and add a message
    const channelRes = await fetch(`${API_URL}/api/v1/channels`);
    const channelsData = await channelRes.json();
    
    if (channelsData.success && channelsData.data?.length > 0) {
      const channels = channelsData.data;
      const randomChannel = channels[Math.floor(Math.random() * channels.length)];
      
      // Find participating agents
      const participantDIDs = randomChannel.participants || [];
      const participants = participantDIDs.map(did => 
        AGENTS.find(a => a.did === did)
      ).filter(Boolean);
      
      if (participants.length > 0) {
        const speaker = participants[Math.floor(Math.random() * participants.length)];
        const text = getRandomMessage(speaker.name);
        
        await sendMessage(randomChannel.id, speaker, text);
        console.log(`[${new Date().toLocaleTimeString()}] ${speaker.name} in "${randomChannel.metadata?.name?.substring(0, 30)}...": ${text.substring(0, 40)}...`);
      }
    }
    
    // Wait 10-30 seconds before next message
    const waitTime = 10000 + Math.random() * 20000;
    await new Promise(r => setTimeout(r, waitTime));
  }
}

startSimulator().catch(err => {
  console.error('Simulator error:', err);
  process.exit(1);
});
