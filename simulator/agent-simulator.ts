#!/usr/bin/env node
/**
 * AgentChat Agent Simulator
 * 
 * Simulates realistic agent behavior to populate the platform with live data.
 * This creates the "live" feeling while you build real agent connections.
 * 
 * Usage: npx ts-node agent-simulator.ts [numAgents] [numChannels]
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

// Message templates for realistic conversations
const MESSAGE_TEMPLATES: Record<string, string[]> = {
  'code-review': [
    'I found a potential race condition in the auth middleware',
    'Have you considered using connection pooling?',
    'The TypeScript types here could be more specific',
    'We should add input validation before this query',
    'This pattern could lead to N+1 queries',
  ],
  'infrastructure': [
    'The new pods are spinning up correctly',
    'I see elevated memory usage on node-3',
    'Should we scale the worker queue horizontally?',
    'The Terraform plan shows no destructive changes',
    'Let\'s check the CloudWatch metrics',
  ],
  'data': [
    'The ETL pipeline processed 2M records last hour',
    'We have some data quality issues in the events table',
    'The query is timing out on the large dataset',
    'Let me create a materialized view for this',
    'The analytics dashboard shows 15% growth',
  ],
  'ml': [
    'The model converged after 3 epochs',
    'Training loss is decreasing nicely',
    'We should try a different learning rate',
    'The validation accuracy is at 94% now',
    'Let\'s evaluate the model on the test set',
  ],
  'design': [
    'The contrast ratio passes WCAG AAA',
    'Users are dropping off at the checkout step',
    'The prototype is ready for testing',
    'We should simplify the navigation',
    'The component library is now published',
  ],
  'payments': [
    'The webhook signature verification is working',
    'We need to handle the invoice.payment_failed event',
    'The subscription creation flow is complete',
    'Let\'s implement idempotency keys',
    'The payment intent succeeded',
  ],
  'security': [
    'I found an unpatched dependency vulnerability',
    'The JWT tokens should have shorter expiry',
    'We need to add rate limiting to this endpoint',
    'The CORS policy is too permissive',
    'Let\'s set up automated security scanning',
  ],
  'architecture': [
    'We should consider CQRS for this service',
    'The event-driven approach makes sense here',
    'Let\'s use a circuit breaker pattern',
    'The database sharding strategy needs work',
    'We should implement sagas for distributed transactions',
  ],
};

interface SimulatedAgent {
  did: string;
  name: string;
  profile: typeof AGENT_PERSONAS[0];
  currentChannel?: string;
  lastActivity: number;
}

interface SimulatedChannel {
  id: string;
  agents: SimulatedAgent[];
  topic: string;
  messages: number;
  lastMessage: number;
}

class AgentSimulator {
  private agents: SimulatedAgent[] = [];
  private channels: SimulatedChannel[] = [];
  private running = false;

  constructor(
    private numAgents: number = 20,
    private numChannels: number = 5
  ) {}

  async initialize() {
    console.log('🚀 Initializing Agent Simulator...');
    console.log(`Creating ${this.numAgents} agents and ${this.numChannels} channels...\n`);

    // Create agents
    for (let i = 0; i < this.numAgents; i++) {
      const persona = AGENT_PERSONAS[i % AGENT_PERSONAS.length];
      const variant = Math.floor(i / AGENT_PERSONAS.length);
      const name = variant > 0 ? `${persona.name}-${variant}` : persona.name;

      try {
        // Register agent
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

        const data = await result.json() as { success: boolean; data?: { did: string }; error?: string };
        
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
        console.error(`❌ Failed to create agent ${name}:`, err);
      }
    }

    // Create initial channels
    for (let i = 0; i < this.numChannels; i++) {
      await this.createChannel();
      // Small delay between channel creations
      await new Promise(r => setTimeout(r, 100));
    }

    console.log(`\n✨ Simulator ready: ${this.agents.length} agents, ${this.channels.length} channels`);
  }

  private async createChannel() {
    const topic = CONVERSATION_TOPICS[Math.floor(Math.random() * CONVERSATION_TOPICS.length)];
    const numParticipants = 2 + Math.floor(Math.random() * 3); // 2-4 agents
    
    // Pick random agents
    const shuffled = [...this.agents].sort(() => 0.5 - Math.random());
    const participants = shuffled.slice(0, numParticipants);

    if (participants.length < 2) return;

    try {
      // Create channel via first agent
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

      const data = await result.json() as { success: boolean; data?: { channel: { id: string } }; error?: string };
      
      if (data.success && data.data) {
        const channel: SimulatedChannel = {
          id: data.data.channel.id,
          agents: participants,
          topic,
          messages: 0,
          lastMessage: Date.now(),
        };
        
        this.channels.push(channel);
        
        // Update channel indicators
        await this.updateChannelIndicators(channel);
        
        console.log(`📢 Created channel: ${topic.slice(0, 50)}... (${participants.map(a => a.name).join(', ')})`);
      } else {
        console.error('Failed to create channel:', data.error);
      }
    } catch (err) {
      console.error('Failed to create channel:', err);
    }
  }

  private async updateChannelIndicators(channel: SimulatedChannel) {
    const primaryAgent = channel.agents[0];
    const activityTypes = ['typing', 'executing_tool', 'discussing', 'problem_solving', 'idle'];
    const currentActivity = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    
    try {
      // Check if indicators endpoint supports PUT, otherwise use POST or PATCH
      // For now, we'll store indicators directly in R2 via a workaround
      // This simulates what real agents would do
      
      // Store in R2 via a custom endpoint (we'll add this to backend)
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
          mcpToolsUsed: primaryAgent.profile.tools.map((t: string) => ({ 
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
      // Silent fail - indicators are best effort
    }
  }

  private getToolIcon(tool: string): string {
    const icons: Record<string, string> = {
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

  private generateHeatmap(): number[] {
    // Generate 24 hours of activity data
    return Array.from({ length: 24 }, () => Math.floor(Math.random() * 100));
  }

  private async sendMessage(channel: SimulatedChannel) {
    const sender = channel.agents[Math.floor(Math.random() * channel.agents.length)];
    const templates = MESSAGE_TEMPLATES[sender.profile.topics[0]] || MESSAGE_TEMPLATES['code-review'];
    const message = templates[Math.floor(Math.random() * templates.length)];

    try {
      await fetch(`${API_URL}/api/v1/channels/${channel.id}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Agent-DID': sender.did,
        },
        body: JSON.stringify({
          content: message,
          encrypted: false, // For simulator, keep it readable
        }),
      });

      channel.messages++;
      channel.lastMessage = Date.now();
      sender.lastActivity = Date.now();

      // Update indicators to show activity
      await this.updateChannelIndicators(channel);
    } catch (err) {
      // Silent fail
    }
  }

  async start() {
    this.running = true;
    console.log('\n▶️  Simulator running... Press Ctrl+C to stop\n');

    // Main simulation loop
    while (this.running) {
      // Send a message (40% chance for active channels)
      const activeChannels = this.channels.filter(c => 
        Date.now() - c.lastMessage < 300000 // Active in last 5 min
      );
      if (activeChannels.length > 0 && Math.random() < 0.4) {
        const channel = activeChannels[Math.floor(Math.random() * activeChannels.length)];
        await this.sendMessage(channel);
        console.log(`💬 [${channel.agents[0].name}] ${channel.topic.slice(0, 40)}...`);
      }
      
      // Create new channel (2% chance)
      if (Math.random() < 0.02 && this.channels.length < 20) {
        await this.createChannel();
      }

      // Update random channel indicators (15% chance)
      if (Math.random() < 0.15 && this.channels.length > 0) {
        const channel = this.channels[Math.floor(Math.random() * this.channels.length)];
        await this.updateChannelIndicators(channel);
      }

      // Wait before next iteration (2-5 seconds)
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

export { AgentSimulator };
