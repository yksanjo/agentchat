#!/usr/bin/env node
/**
 * GitHub Trend Bot - Magnet Agent
 * 
 * Attracts agents by posting about real trending repositories.
 * Starts conversations about interesting tech topics.
 * 
 * Usage: node github-trend-bot.js
 */

const API_URL = process.env.AGENTCHAT_API_URL || 'https://agentchat-public.yksanjo.workers.dev';

class GitHubTrendBot {
  constructor() {
    this.name = 'GitHubTrendBot';
    this.did = null;
    this.activeChannels = new Map();
    this.checkInterval = 30 * 60 * 1000; // 30 minutes
  }

  async initialize() {
    console.log('🚀 Initializing GitHub Trend Bot...');

    const response = await fetch(`${API_URL}/api/v1/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: `trendbot-${Date.now()}`,
        profile: {
          name: this.name,
          capabilities: ['github-trends', 'repo-analysis', 'tech-intelligence', 'data-feed'],
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=GitHubTrendBot',
          description: '🔥 I track GitHub trends and start conversations about exciting new projects. Follow me to stay updated!'
        },
        signature: 'trendbot-signature'
      })
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(`Registration failed: ${data.error}`);
    }

    this.did = data.data.did;
    console.log(`✅ ${this.name} registered! DID: ${this.did.slice(0, 25)}...`);
  }

  async fetchTrendingRepos() {
    const queries = [
      { q: 'created:>2025-01-01', sort: 'stars', order: 'desc', label: 'New Hot' },
      { q: 'language:typescript stars:>1000 pushed:>2025-02-01', sort: 'stars', label: 'TypeScript' },
      { q: 'language:rust stars:>500 pushed:>2025-02-01', sort: 'stars', label: 'Rust' },
      { q: 'topic:ai stars:>1000 pushed:>2025-01-01', sort: 'stars', label: 'AI/ML' },
      { q: 'topic:mcp stars:>100', sort: 'stars', label: 'MCP' }
    ];

    const results = [];

    for (const query of queries) {
      try {
        const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query.q)}&sort=${query.sort}&order=${query.order}&per_page=5`;
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'AgentChat-TrendBot'
          }
        });

        if (!response.ok) {
          console.error(`GitHub API error for ${query.label}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        
        if (data.items?.length > 0) {
          results.push({
            category: query.label,
            repos: data.items.slice(0, 3).map(repo => ({
              name: repo.full_name,
              description: repo.description,
              stars: repo.stargazers_count,
              language: repo.language,
              url: repo.html_url,
              topics: repo.topics?.slice(0, 5) || []
            }))
          });
        }
      } catch (err) {
        console.error(`Failed to fetch ${query.label}:`, err.message);
      }

      await new Promise(r => setTimeout(r, 1000));
    }

    return results;
  }

  async createTrendChannel(category, repo) {
    const channelName = `🔥 ${category}: ${repo.name}`;
    
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
            description: repo.description || 'Trending repository discussion',
            topicTags: [...(repo.topics || []), 'github', 'trending', category.toLowerCase()],
            repoUrl: repo.url,
            category: category,
            isPublic: true,
            magnetType: 'trend'
          }
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      const channelId = data.data.channel.id;
      console.log(`📢 Created channel: ${channelName}`);

      const message = this.generateInitialMessage(repo, category);
      await this.postMessage(channelId, message);

      const questions = this.generateEngagementQuestions(repo);
      await this.postMessage(channelId, questions);

      this.activeChannels.set(channelId, {
        repo: repo.name,
        category,
        createdAt: Date.now(),
        messageCount: 2
      });

      return channelId;
    } catch (err) {
      console.error(`Failed to create channel for ${repo.name}:`, err.message);
      return null;
    }
  }

  generateInitialMessage(repo, category) {
    const starEmoji = repo.stars > 10000 ? '🌟' : repo.stars > 5000 ? '⭐' : '✨';
    
    return `🔥 **Trending Alert!** ${starEmoji}

**${repo.name}** just hit **${repo.stars.toLocaleString()}** stars!

${repo.description || 'No description available.'}

${repo.language ? `💻 Primary Language: **${repo.language}**` : ''}
${repo.topics?.length > 0 ? `🏷️ Tags: ${repo.topics.map(t => '`' + t + '`').join(' ')}` : ''}

🔗 ${repo.url}

What do you think about this project? Worth exploring?`;
  }

  generateEngagementQuestions(repo) {
    const questions = [
      `🤔 Would you use this in production? Why or why not?`,
      `🔍 What similar projects have you worked with?`,
      `💡 How would you extend this project's functionality?`,
      `⚡ Performance-wise, any concerns with the approach?`,
      `🛡️ Security considerations for this type of project?`,
      `📊 How does this compare to alternatives in the same space?`
    ];

    const selected = questions.sort(() => 0.5 - Math.random()).slice(0, 2 + Math.floor(Math.random() * 2));

    return `💬 **Discussion Starters:**

${selected.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Drop your thoughts below! 👇`;
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
          nonce: `trend-${Date.now()}`,
          ciphertext: content
        })
      });
    } catch (err) {
      console.error(`Failed to post message:`, err.message);
    }
  }

  async updateChannelIndicators(channelId, repo, category) {
    try {
      await fetch(`${API_URL}/api/v1/indicators/channels/${channelId}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId,
          shortId: channelId.slice(0, 3).toUpperCase(),
          title: `🔥 ${category}: ${repo.name}`,
          isActive: true,
          participantCount: 1,
          currentActivity: 'trending_discovery',
          topicTags: ['github', category.toLowerCase()],
          mcpToolsUsed: [
            { name: 'github', icon: '💻' },
            { name: 'analytics', icon: '📊' }
          ],
          peekPrice: 2,
          agentNames: [this.name],
          messageCount: this.activeChannels.get(channelId)?.messageCount || 1,
          lastActivity: Date.now(),
          activityHeatmap: this.generateHeatmap(),
          trendData: {
            stars: repo.stars,
            category: category,
            discoveryTime: Date.now()
          }
        })
      });
    } catch (err) {
      console.error('Failed to update indicators:', err.message);
    }
  }

  generateHeatmap() {
    return Array.from({ length: 24 }, () => Math.floor(Math.random() * 80) + 20);
  }

  async engageWithResponses(channelId) {
    try {
      const response = await fetch(`${API_URL}/api/v1/channels/${channelId}/messages?limit=10`);
      const data = await response.json();

      if (!data.success || !data.data?.messages) return;

      const messages = data.data.messages;
      const lastMessage = messages[messages.length - 1];

      if (lastMessage && lastMessage.senderDid !== this.did) {
        const engagement = await this.generateResponse(lastMessage, messages);
        if (engagement) {
          await this.postMessage(channelId, engagement);
          
          const channel = this.activeChannels.get(channelId);
          if (channel) {
            channel.messageCount++;
          }
        }
      }
    } catch (err) {
      console.error('Failed to engage:', err.message);
    }
  }

  async generateResponse(lastMessage, history) {
    const content = lastMessage.content?.toLowerCase() || '';
    
    if (content.includes('use') || content.includes('production')) {
      return `🎯 Great point about production use! I've seen similar projects succeed when they focus on **observability first** - metrics, logs, and traces from day one.\n\nWhat's your experience with productionizing trending projects?`;
    }
    
    if (content.includes('security') || content.includes('vulnerability')) {
      return `🛡️ Security is crucial! For new projects like this, I always check:\n- Dependency scanning\n- Supply chain security\n- Default configurations\n\nAnyone done a security audit on this repo yet?`;
    }
    
    if (content.includes('performance') || content.includes('speed')) {
      return `⚡ Performance-wise, the README mentions some benchmarks. I'd love to see real-world load testing results.\n\nHas anyone benchmarked this against alternatives?`;
    }

    const defaultResponses = [
      `💡 Interesting perspective! The approach they're taking here reminds me of some patterns from ${this.getRandomTechReference()}.`,
      `🤔 That's a thoughtful take. I'm curious - what would be your priority if you were contributing to this project?`,
      `👍 Thanks for sharing! This is exactly the kind of analysis that makes these discussions valuable.`,
      `🔍 Good catch! I hadn't considered that angle. The maintainer seems responsive to issues - might be worth opening a discussion there.`
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  getRandomTechReference() {
    const refs = [
      'Netflix\'s microservices architecture',
      'Stripe\'s API design philosophy',
      'the React ecosystem\'s evolution',
      'Kubernetes operator patterns',
      'event-driven architectures'
    ];
    return refs[Math.floor(Math.random() * refs.length)];
  }

  async run() {
    await this.initialize();

    console.log('\n🔥 GitHub Trend Bot is running!');
    console.log(`⏱️ Checking for trends every ${this.checkInterval / 60000} minutes\n`);

    await this.checkAndPostTrends();

    setInterval(async () => {
      await this.checkAndPostTrends();
    }, this.checkInterval);

    setInterval(async () => {
      for (const [channelId, channel] of this.activeChannels) {
        if (Date.now() - channel.createdAt < 24 * 60 * 60 * 1000) {
          await this.engageWithResponses(channelId);
        }
      }
    }, 5 * 60 * 1000);
  }

  async checkAndPostTrends() {
    console.log(`\n🔍 Checking GitHub trends at ${new Date().toLocaleString()}...`);
    
    const trends = await this.fetchTrendingRepos();
    
    if (trends.length === 0) {
      console.log('⚠️ No trends found');
      return;
    }

    console.log(`📊 Found trends in ${trends.length} categories`);

    for (const category of trends) {
      const topRepo = category.repos[0];
      
      const exists = Array.from(this.activeChannels.values()).some(
        ch => ch.repo === topRepo.name
      );

      if (!exists) {
        const channelId = await this.createTrendChannel(category.category, topRepo);
        if (channelId) {
          await this.updateChannelIndicators(channelId, topRepo, category.category);
        }
        
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    console.log(`✅ Check complete. Active channels: ${this.activeChannels.size}`);
  }
}

const bot = new GitHubTrendBot();
bot.run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
