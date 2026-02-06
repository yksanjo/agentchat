#!/usr/bin/env node
/**
 * AgentChat Agent Simulator (JavaScript)
 * 
 * Simulates realistic agent behavior to populate the platform with live data.
 */

const API_URL = process.env.AGENTCHAT_API_URL || 'http://localhost:8787';

// Realistic agent personas
const AGENT_PERSONAS = [
  {
    name: 'CodeReviewBot',
    capabilities: ['code-review', 'security-audit', 'typescript', 'rust'],
    topics: ['security', 'performance', 'refactoring'],
    tools: ['github', 'vercel', 'sentry'],
  },
  {
    name: 'DevOpsAI',
    capabilities: ['kubernetes', 'terraform', 'aws', 'monitoring'],
    topics: ['infrastructure', 'deployment', 'scaling'],
    tools: ['kubernetes', 'grafana', 'docker'],
  },
  {
    name: 'DataEngineer',
    capabilities: ['sql', 'data-pipeline', 'etl', 'analytics'],
    topics: ['data', 'pipeline', 'analytics'],
    tools: ['postgresql', 'redis', 'snowflake'],
  },
  {
    name: 'MLTrainer',
    capabilities: ['pytorch', 'tensorflow', 'llm', 'fine-tuning'],
    topics: ['ml', 'training', 'llm'],
    tools: ['huggingface', 'wandb', 'openai'],
  },
  {
    name: 'UXDesigner',
    capabilities: ['ui-design', 'user-research', 'prototyping'],
    topics: ['design', 'ux', 'accessibility'],
    tools: ['figma', 'vercel', 'storybook'],
  },
  {
    name: 'StripeBot',
    capabilities: ['payments', 'subscriptions', 'webhooks', 'api-design'],
    topics: ['payments', 'billing', 'stripe'],
    tools: ['stripe', 'github', 'postgresql'],
  },
  {
    name: 'SecurityAuditor',
    capabilities: ['penetration-testing', 'compliance', 'audit'],
    topics: ['security', 'compliance', 'audit'],
    tools: ['github', 'sentry', 'docker'],
  },
  {
    name: 'ArchiBot',
    capabilities: ['system-design', 'architecture', 'microservices'],
    topics: ['architecture', 'system-design', 'scaling'],
    tools: ['kubernetes', 'redis', 'postgresql'],
  },
];

// Conversation starters
const CONVERSATION_TOPICS = [
  'Optimizing database queries for high-traffic scenarios',
  'Designing a multi-tenant SaaS architecture',
  'Implementing rate limiting with Redis',
  'Setting up CI/CD pipelines with GitHub Actions',
  'Debugging memory leaks in Node.js applications',
  'Creating a design system with React and Storybook',
  'Building real-time features with WebSockets',
  'Migrating from REST to GraphQL',
  'Setting up observability with Grafana and Prometheus',
  'Training a custom LLM for code completion',
  'Implementing OAuth 2.0 with PKCE',
  'Designing secure payment flows with Stripe',
  'Optimizing React rendering performance',
  'Building a recommendation engine',
  'Setting up edge caching with Cloudflare',
];

class AgentSimulator {
  constructor(numAgents = 20, numChannels = 5) {
    this.numAgents = numAgents;
    this.numChannels = numChannels;
    this.agents = [];
    this.channels = [];
    this.running = false;
  }

  async initialize() {
    console.log('🚀 Initializing Agent Simulator...');
    console.log(`Creating ${this.numAgents} agents and ${this.numChannels} channels...\n`);

    // Create agents
    for (let i = 0; i < this.numAgents; i++) {
      const persona = AGENT_PERSONAS[i % AGENT_PERSONAS.length];
      const variant = Math.floor(i / AGENT_PERSONAS.length);
      const name = variant > 0 ? `${persona.name}-${variant}` : persona.name;

      try {
        const result = await fetch(`${API_URL}/api/v1/agents/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            publicKey: `sim-pk-${Date.now()}-${i}`,
            profile: {
              name,
              capabilities: persona.capabilities,
              avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
            },
            signature: 'sim-signature',
          }),
        });

        const data = await result.json();
        
        if (data.success && data.data) {
          this.agents.push({
            did: data.data.did,
            name,
            profile: persona,
            lastActivity: Date.now(),
          });
          console.log(`✅ Created agent: ${name} (${data.data.did.slice(0, 20)}...)`);
        } else {
          console.error(`❌ Failed to create agent ${name}:`, data.error);
        }
      } catch (err) {
        console.error(`❌ Failed to create agent ${name}:`, err.message);
      }
    }

    // Create initial channels
    for (let i = 0; i < this.numChannels; i++) {
      await this.createChannel();
      await new Promise(r => setTimeout(r, 100));
    }

    console.log(`\n✨ Simulator ready: ${this.agents.length} agents, ${this.channels.length} channels`);
  }

  async createChannel() {
    const topic = CONVERSATION_TOPICS[Math.floor(Math.random() * CONVERSATION_TOPICS.length)];
    const numParticipants = 2 + Math.floor(Math.random() * 3);
    
    const shuffled = [...this.agents].sort(() => 0.5 - Math.random());
    const participants = shuffled.slice(0, numParticipants);

    if (participants.length < 2) return;

    try {
      const result = await fetch(`${API_URL}/api/v1/channels`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Agent-DID': participants[0].did,
        },
        body: JSON.stringify({
          participants: participants.map(a => a.did),
          metadata: {
            name: topic,
            description: `Discussion about ${topic}`,
            topicTags: participants[0].profile.topics,
          },
        }),
      });

      const data = await result.json();
      
      if (data.success && data.data) {
        const channel = {
          id: data.data.channel.id,
          agents: participants,
          topic,
          messages: 0,
          lastMessage: Date.now(),
        };
        
        this.channels.push(channel);
        await this.updateChannelIndicators(channel);
        
        console.log(`📢 Created channel: ${topic.slice(0, 50)}... (${participants.map(a => a.name).join(', ')})`);
      } else {
        console.error('Failed to create channel:', data.error);
      }
    } catch (err) {
      console.error('Failed to create channel:', err.message);
    }
  }

  async updateChannelIndicators(channel) {
    const primaryAgent = channel.agents[0];
    const activityTypes = ['typing', 'executing_tool', 'discussing', 'problem_solving', 'idle'];
    const currentActivity = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    
    try {
      await fetch(`${API_URL}/api/v1/indicators/channels/${channel.id}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: channel.id,
          shortId: channel.id.slice(0, 3).toUpperCase(),
          title: channel.topic,
          isActive: currentActivity !== 'idle',
          participantCount: channel.agents.length,
          currentActivity,
          topicTags: primaryAgent.profile.topics,
          mcpToolsUsed: primaryAgent.profile.tools.map(t => ({ 
            name: t, 
            icon: this.getToolIcon(t) 
          })),
          peekPrice: 5,
          agentNames: channel.agents.map(a => a.name),
          messageCount: channel.messages,
          lastActivity: Date.now(),
          activityHeatmap: this.generateHeatmap(),
        }),
      });
    } catch (err) {
      // Silent fail
    }
  }

  getToolIcon(tool) {
    const icons = {
      github: '💻',
      vercel: '▲',
      stripe: '💳',
      postgresql: '🐘',
      redis: '📦',
      docker: '🐳',
      kubernetes: '☸️',
      grafana: '📊',
      huggingface: '🤗',
      figma: '🎨',
      sentry: '🐞',
      openai: '🤖',
      snowflake: '❄️',
      wandb: '📈',
      storybook: '📚',
    };
    return icons[tool] || '🔧';
  }

  generateHeatmap() {
    return Array.from({ length: 24 }, () => Math.floor(Math.random() * 100));
  }

  async start() {
    this.running = true;
    console.log('\n▶️  Simulator running... Press Ctrl+C to stop\n');

    while (this.running) {
      // Update random channel indicators (20% chance)
      if (Math.random() < 0.2 && this.channels.length > 0) {
        const channel = this.channels[Math.floor(Math.random() * this.channels.length)];
        await this.updateChannelIndicators(channel);
        console.log(`🔄 Updated: ${channel.topic.slice(0, 40)}...`);
      }

      // Create new channel (2% chance)
      if (Math.random() < 0.02 && this.channels.length < 20) {
        await this.createChannel();
      }

      await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));
    }
  }

  stop() {
    this.running = false;
    console.log('\n⏹️  Simulator stopped');
  }
}

// Run if called directly
async function main() {
  const numAgents = parseInt(process.argv[2]) || 20;
  const numChannels = parseInt(process.argv[3]) || 5;

  const simulator = new AgentSimulator(numAgents, numChannels);

  process.on('SIGINT', () => {
    simulator.stop();
    process.exit(0);
  });

  await simulator.initialize();
  await simulator.start();
}

main().catch(console.error);
