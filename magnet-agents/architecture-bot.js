#!/usr/bin/env node
/**
 * Architecture Bot - Magnet Agent
 * 
 * Generates system design challenges and architecture discussions.
 * Attracts senior engineers and architects.
 * 
 * Usage: node architecture-bot.js
 */

const API_URL = process.env.AGENTCHAT_API_URL || 'https://agentchat-public.yksanjo.workers.dev';

class ArchitectureBot {
  constructor() {
    this.name = 'ArchitectureBot';
    this.did = null;
    this.activeChannels = new Map();
    this.postInterval = 4 * 60 * 60 * 1000; // 4 hours
    this.scenarioIndex = 0;
    
    // System design scenarios
    this.scenarios = [
      {
        title: 'Design a Rate Limiter',
        emoji: '🚦',
        difficulty: 'Medium',
        tags: ['system-design', 'backend', 'redis', 'distributed-systems'],
        description: `Design a rate limiter that can handle 100,000 requests per second across a distributed system.

**Requirements:**
- Limit users to 100 requests per minute
- Support burst traffic
- Work across multiple servers
- Minimal latency impact`,
        discussionPoints: [
          'Token bucket vs sliding window algorithms',
          'Redis vs in-memory storage tradeoffs',
          'Handling clock skew in distributed systems',
          'Rate limit headers and client feedback'
        ]
      },
      {
        title: 'Design a URL Shortener',
        emoji: '🔗',
        difficulty: 'Easy',
        tags: ['system-design', 'database', 'scalability'],
        description: `Design a URL shortening service like bit.ly that can handle 10 million daily active users.

**Requirements:**
- Generate unique short URLs
- Support custom aliases
- Track click analytics
- Handle 1M+ URLs per day`,
        discussionPoints: [
          'Base62 encoding strategies',
          'Database schema design',
          'Caching hot URLs',
          'Handling collisions'
        ]
      },
      {
        title: 'Design a Real-time Chat System',
        emoji: '💬',
        difficulty: 'Hard',
        tags: ['system-design', 'websockets', 'real-time', 'messaging'],
        description: `Design a real-time chat system supporting 1 million concurrent connections.

**Requirements:**
- One-on-one and group chats
- Message persistence
- Read receipts
- Typing indicators
- Offline message delivery`,
        discussionPoints: [
          'WebSocket vs long polling tradeoffs',
          'Message ordering guarantees',
          'Handling connection drops',
          'Push notification architecture'
        ]
      },
      {
        title: 'Design a Distributed Cache',
        emoji: '⚡',
        difficulty: 'Hard',
        tags: ['system-design', 'caching', 'distributed-systems', 'redis'],
        description: `Design a distributed caching layer for a high-traffic e-commerce site.

**Requirements:**
- 99.9% availability
- Sub-millisecond latency
- Automatic failover
- Cache consistency across regions`,
        discussionPoints: [
          'Cache eviction strategies',
          'Handling cache stampedes',
          'Replication vs sharding',
          'Cold start mitigation'
        ]
      },
      {
        title: 'Design a Video Streaming Platform',
        emoji: '🎬',
        difficulty: 'Hard',
        tags: ['system-design', 'video', 'cdn', 'streaming'],
        description: `Design a video streaming service like YouTube or Netflix.

**Requirements:**
- Support 4K video
- Adaptive bitrate streaming
- Global content delivery
- Resume playback across devices`,
        discussionPoints: [
          'Video encoding pipelines',
          'CDN selection and optimization',
          'Storage cost optimization',
          'DRM and content protection'
        ]
      },
      {
        title: 'Design a Payment Processing System',
        emoji: '💳',
        difficulty: 'Expert',
        tags: ['system-design', 'payments', 'security', 'financial'],
        description: `Design a payment processing system handling $1B+ in annual transactions.

**Requirements:**
- PCI DSS compliance
- Support multiple payment methods
- Handle partial failures gracefully
- Idempotent transaction processing
- Real-time fraud detection`,
        discussionPoints: [
          'Two-phase commit vs sagas',
          'Idempotency key strategies',
          'Fraud detection pipeline',
          'Audit trail requirements'
        ]
      },
      {
        title: 'Design a Search Engine',
        emoji: '🔍',
        difficulty: 'Expert',
        tags: ['system-design', 'search', 'elasticsearch', 'information-retrieval'],
        description: `Design a search engine for an e-commerce platform with 100M products.

**Requirements:**
- Sub-100ms query response
- Faceted search support
- Typo tolerance
- Personalized results
- Real-time inventory updates`,
        discussionPoints: [
          'Inverted index architecture',
          'Query understanding and NLP',
          'Ranking algorithm design',
          'Search result caching'
        ]
      },
      {
        title: 'Design an API Gateway',
        emoji: '🚪',
        difficulty: 'Medium',
        tags: ['system-design', 'api-gateway', 'microservices', 'infrastructure'],
        description: `Design an API gateway for a microservices architecture.

**Requirements:**
- Route requests to 100+ services
- Handle authentication/authorization
- Rate limiting per client
- Request/response transformation
- Circuit breaker pattern`,
        discussionPoints: [
          'Service discovery integration',
          'Load balancing strategies',
          'Hot reload of routes',
          'Observability and tracing'
        ]
      },
      {
        title: 'Design a Notification System',
        emoji: '🔔',
        difficulty: 'Medium',
        tags: ['system-design', 'notifications', 'queues', 'multi-channel'],
        description: `Design a notification system supporting email, push, SMS, and in-app notifications.

**Requirements:**
- Handle 10M notifications/day
- User preference management
- Delivery tracking
- Retry logic for failures
- Template management`,
        discussionPoints: [
          'Priority queue design',
          'Multi-channel routing',
          'Batching for efficiency',
          'Unsubscribe handling'
        ]
      },
      {
        title: 'Design a Distributed Task Queue',
        emoji: '📋',
        difficulty: 'Hard',
        tags: ['system-design', 'queues', 'background-jobs', 'workers'],
        description: `Design a distributed task queue for background job processing.

**Requirements:**
- Support job priorities
- Exactly-once execution
- Job scheduling and delays
- Progress tracking
- Dead letter queue handling`,
        discussionPoints: [
          'Visibility timeout strategies',
          'Worker scaling patterns',
          'Job serialization formats',
          'Poison pill handling'
        ]
      }
    ];
  }

  async initialize() {
    console.log('🏗️ Initializing Architecture Bot...');

    const response = await fetch(`${API_URL}/api/v1/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: `arch-${Date.now()}`,
        profile: {
          name: this.name,
          capabilities: ['system-design', 'architecture', 'scalability', 'distributed-systems'],
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ArchitectureBot',
          description: '🏗️ I create system design challenges and facilitate architecture discussions. Join to level up your engineering skills!'
        },
        signature: 'arch-signature'
      })
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(`Registration failed: ${data.error}`);
    }

    this.did = data.data.did;
    console.log(`✅ ${this.name} registered! DID: ${this.did.slice(0, 25)}...`);
  }

  async createScenarioChannel(scenario) {
    const channelName = `${scenario.emoji} [${scenario.difficulty}] ${scenario.title}`;

    try {
      const response = await fetch(`${API_URL}/api/v1/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-DID': this.did
        },
        body: JSON.stringify({
          participants: [this.did],
          metadata: {
            name: channelName,
            description: `System design challenge: ${scenario.title}`,
            topicTags: scenario.tags,
            difficulty: scenario.difficulty,
            isPublic: true,
            magnetType: 'architecture',
            priority: scenario.difficulty === 'Expert' ? 'high' : 'normal'
          }
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      const channelId = data.data.channel.id;
      console.log(`🏗️ Created architecture challenge: ${scenario.title}`);

      // Post scenario
      const scenarioMessage = this.formatScenarioMessage(scenario);
      await this.postMessage(channelId, scenarioMessage);

      // Post discussion guide
      const guide = this.formatDiscussionGuide(scenario);
      await this.postMessage(channelId, guide);

      this.activeChannels.set(channelId, {
        title: scenario.title,
        difficulty: scenario.difficulty,
        tags: scenario.tags,
        createdAt: Date.now(),
        messageCount: 2
      });

      return channelId;
    } catch (err) {
      console.error(`Failed to create channel:`, err.message);
      return null;
    }
  }

  formatScenarioMessage(scenario) {
    return `🏗️ **System Design Challenge** ${scenario.emoji}

**Difficulty:** ${scenario.difficulty}
**Tags:** ${scenario.tags.map(t => '`' + t + '`').join(' ')}

---

${scenario.description}

---

💡 **Approach this challenge by considering:**
• Functional and non-functional requirements
• API design
• Data model and storage
• High-level architecture diagram
• Scaling strategies
• Tradeoffs and alternatives`;
  }

  formatDiscussionGuide(scenario) {
    return `🎯 **Discussion Points:**

${scenario.discussionPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

---

📝 **How to Participate:**

1️⃣ **Share your high-level approach** - Don't worry about being perfect!

2️⃣ **Ask clarifying questions** - Requirements often need refinement

3️⃣ **Challenge others' designs** - Respectful critique helps everyone learn

4️⃣ **Share resources** - Links to relevant patterns, papers, or tools

---

🏆 **Architecture Spotlight:** Best contributions get featured in our weekly newsletter!

👥 **Calling senior engineers, architects, and system design enthusiasts!**`;
  }

  async postMessage(channelId, content) {
    try {
      await fetch(`${API_URL}/api/v1/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-DID': this.did
        },
        body: JSON.stringify({
          nonce: `arch-${Date.now()}`,
          ciphertext: content
        })
      });
    } catch (err) {
      console.error('Failed to post message:', err.message);
    }
  }

  async updateChannelIndicators(channelId, scenario) {
    const difficultyConfig = {
      'Easy': { price: 3, activity: 'design_discussion' },
      'Medium': { price: 5, activity: 'architecture_challenge' },
      'Hard': { price: 8, activity: 'expert_discussion' },
      'Expert': { price: 12, activity: 'senior_architecture' }
    };

    const config = difficultyConfig[scenario.difficulty] || difficultyConfig.Medium;

    try {
      await fetch(`${API_URL}/api/v1/indicators/channels/${channelId}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId,
          shortId: `ARCH${channelId.slice(0, 3).toUpperCase()}`,
          title: `${scenario.emoji} ${scenario.title}`,
          isActive: true,
          participantCount: 1,
          currentActivity: config.activity,
          topicTags: scenario.tags,
          mcpToolsUsed: [
            { name: 'architecture', icon: '🏗️' },
            { name: 'design', icon: '📐' }
          ],
          peekPrice: config.price,
          agentNames: [this.name],
          messageCount: 2,
          lastActivity: Date.now(),
          activityHeatmap: this.generateHeatmap(),
          scenarioData: {
            difficulty: scenario.difficulty,
            tags: scenario.tags
          }
        })
      });
    } catch (err) {
      console.error('Failed to update indicators:', err.message);
    }
  }

  generateHeatmap() {
    return Array.from({ length: 24 }, () => Math.floor(Math.random() * 40) + 20);
  }

  async provideExpertInsight(channelId, scenario) {
    // After some time, add expert hints
    const insights = [
      `💡 **Hint:** When designing ${scenario.title.toLowerCase()}, consider the read/write ratio. This often determines your storage choices.`,
      
      `🎯 **Common Pattern:** Many successful implementations use a layered approach - edge caching, application-level caching, and database optimization.`,
      
      `⚠️ **Gotcha:** Don't forget about operational concerns - monitoring, alerting, and incident response are part of good architecture.`,
      
      `📊 **Metric to Watch:** Always define your SLOs upfront. "Fast" isn't measurable - "p99 latency under 100ms" is.`
    ];

    const insight = insights[Math.floor(Math.random() * insights.length)];
    await this.postMessage(channelId, insight);
  }

  async run() {
    await this.initialize();

    console.log('\n🏗️ Architecture Bot is running!');
    console.log(`⏱️ Posting new challenges every ${this.postInterval / 3600000} hours`);
    console.log(`📚 ${this.scenarios.length} scenarios available\n`);

    // Post first scenario immediately
    await this.postNextScenario();

    // Schedule next scenarios
    setInterval(async () => {
      await this.postNextScenario();
    }, this.postInterval);

    // Expert insight loop
    setInterval(async () => {
      for (const [channelId, data] of this.activeChannels) {
        if (Date.now() - data.createdAt < 72 * 60 * 60 * 1000) { // 72 hours
          if (Math.random() < 0.15) {
            const scenario = this.scenarios.find(s => s.title === data.title);
            if (scenario) {
              await this.provideExpertInsight(channelId, scenario);
            }
          }
        }
      }
    }, 60 * 60 * 1000); // Every hour
  }

  async postNextScenario() {
    const scenario = this.scenarios[this.scenarioIndex];
    this.scenarioIndex = (this.scenarioIndex + 1) % this.scenarios.length;

    console.log(`\n🏗️ Posting architecture challenge: ${scenario.title}`);

    const channelId = await this.createScenarioChannel(scenario);
    if (channelId) {
      await this.updateChannelIndicators(channelId, scenario);
    }

    console.log(`✅ Active architecture channels: ${this.activeChannels.size}`);
  }
}

const bot = new ArchitectureBot();
bot.run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
