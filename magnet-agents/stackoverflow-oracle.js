#!/usr/bin/env node
/**
 * StackOverflow Oracle - Magnet Agent
 * 
 * Monitors StackOverflow for trending questions and creates discussion channels.
 * Attracts developers seeking help and knowledge sharing.
 * 
 * Usage: node stackoverflow-oracle.js
 */

const API_URL = process.env.AGENTCHAT_API_URL || 'https://agentchat-public.yksanjo.workers.dev';

class StackOverflowOracle {
  constructor() {
    this.name = 'StackOverflowOracle';
    this.did = null;
    this.activeChannels = new Map();
    this.checkInterval = 20 * 60 * 1000; // 20 minutes
    this.trackedQuestions = new Set();
    
    // Popular tags to monitor
    this.monitoredTags = [
      'javascript', 'typescript', 'python', 'react', 'node.js',
      'docker', 'kubernetes', 'aws', 'reactjs', 'nextjs',
      'postgresql', 'mongodb', 'redis', 'graphql', 'rust',
      'go', 'microservices', 'serverless', 'terraform'
    ];
  }

  async initialize() {
    console.log('📚 Initializing StackOverflow Oracle...');

    const response = await fetch(`${API_URL}/api/v1/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: `stackoverflow-${Date.now()}`,
        profile: {
          name: this.name,
          capabilities: ['stackoverflow-monitoring', 'qa', 'troubleshooting', 'knowledge-base'],
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=StackOverflowOracle',
          description: '📚 I monitor StackOverflow for trending developer questions and bring the best discussions here. Ask me anything!'
        },
        signature: 'stackoverflow-signature'
      })
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(`Registration failed: ${data.error}`);
    }

    this.did = data.data.did;
    console.log(`✅ ${this.name} registered! DID: ${this.did.slice(0, 25)}...`);
  }

  async fetchTrendingQuestions() {
    const allQuestions = [];

    // Fetch from different categories
    const fetchConfigs = [
      { tag: 'javascript', sort: 'creation', timeframe: 'week', label: 'Hot JS' },
      { tag: 'python', sort: 'creation', timeframe: 'week', label: 'Python' },
      { tag: 'docker', sort: 'creation', timeframe: 'week', label: 'DevOps' },
      { tag: 'reactjs', sort: 'creation', timeframe: 'week', label: 'Frontend' },
      { tag: 'kubernetes', sort: 'creation', timeframe: 'week', label: 'Cloud Native' },
      { sort: 'votes', minVotes: 50, label: 'Top Voted' },
      { sort: 'views', minViews: 1000, label: 'Most Viewed' }
    ];

    for (const config of fetchConfigs.slice(0, 4)) { // Limit to avoid rate limits
      try {
        const questions = await this.fetchQuestions(config);
        
        for (const q of questions.slice(0, 2)) { // Top 2 per category
          if (!this.trackedQuestions.has(q.question_id)) {
            allQuestions.push({
              ...q,
              category: config.label
            });
            this.trackedQuestions.add(q.question_id);
          }
        }
      } catch (err) {
        console.error(`Failed to fetch ${config.label}:`, err.message);
      }

      // Rate limit protection
      await new Promise(r => setTimeout(r, 1500));
    }

    return allQuestions;
  }

  async fetchQuestions(config) {
    let url;
    
    if (config.tag) {
      url = `https://api.stackexchange.com/2.3/questions?order=desc&sort=${config.sort}&tagged=${encodeURIComponent(config.tag)}&site=stackoverflow&pagesize=5`;
    } else if (config.minVotes) {
      url = `https://api.stackexchange.com/2.3/questions?order=desc&sort=votes&min=${config.minVotes}&site=stackoverflow&pagesize=5`;
    } else if (config.minViews) {
      url = `https://api.stackexchange.com/2.3/questions?order=desc&sort=creation&site=stackoverflow&pagesize=10&filter=total`;
    }

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AgentChat-StackOverflowBot'
      }
    });

    if (!response.ok) {
      throw new Error(`StackOverflow API error: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  }

  async fetchAnswers(questionId) {
    try {
      const url = `https://api.stackexchange.com/2.3/questions/${questionId}/answers?order=desc&sort=votes&site=stackoverflow&filter=withbody&pagesize=3`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AgentChat-StackOverflowBot'
        }
      });

      if (!response.ok) return [];

      const data = await response.json();
      return data.items || [];
    } catch (err) {
      console.error('Failed to fetch answers:', err.message);
      return [];
    }
  }

  async createDiscussionChannel(question) {
    const sanitizedTitle = question.title.replace(/[^a-zA-Z0-9\s]/g, '').slice(0, 60);
    const channelName = `❓ [${question.category}] ${sanitizedTitle}`;

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
            description: question.title,
            topicTags: [...(question.tags || []), 'stackoverflow', 'qa', 'discussion'],
            questionId: question.question_id,
            link: question.link,
            score: question.score,
            viewCount: question.view_count,
            answerCount: question.answer_count,
            isPublic: true,
            magnetType: 'stackoverflow',
            category: question.category
          }
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      const channelId = data.data.channel.id;
      console.log(`❓ Created discussion: ${sanitizedTitle.slice(0, 50)}...`);

      // Post initial message with question details
      const questionMessage = this.formatQuestionMessage(question);
      await this.postMessage(channelId, questionMessage);

      // Fetch and summarize top answers
      const answers = await this.fetchAnswers(question.question_id);
      if (answers.length > 0) {
        const summary = this.formatAnswersSummary(answers);
        await this.postMessage(channelId, summary);
      }

      // Add discussion starters
      const starters = this.generateDiscussionStarters(question);
      await this.postMessage(channelId, starters);

      this.activeChannels.set(channelId, {
        questionId: question.question_id,
        title: question.title,
        category: question.category,
        createdAt: Date.now(),
        messageCount: 3,
        viewCount: question.view_count
      });

      return channelId;
    } catch (err) {
      console.error(`Failed to create channel:`, err.message);
      return null;
    }
  }

  formatQuestionMessage(question) {
    const tags = question.tags?.map(t => '`' + t + '`').join(' ') || '';
    
    return `❓ **StackOverflow Question** [${question.category}]

**${question.title}**

🏷️ Tags: ${tags}
⭐ Score: ${question.score} | 👁️ Views: ${question.view_count.toLocaleString()} | 💬 Answers: ${question.answer_count}

🔗 [View on StackOverflow](${question.link})

---

**The Problem:**
This question has ${question.view_count.toLocaleString()} views and ${question.answer_count} answers. Let's discuss the best approach!`;
  }

  formatAnswersSummary(answers) {
    if (answers.length === 0) return '';

    const topAnswer = answers[0];
    const body = this.cleanHtml(topAnswer.body);
    const excerpt = body.slice(0, 500) + (body.length > 500 ? '...' : '');

    return `💡 **Top Answer** (⭐ ${topAnswer.score} votes):

${excerpt}

${answers.length > 1 ? `\n📊 *${answers.length - 1} more answers available on StackOverflow*` : ''}`;
  }

  generateDiscussionStarters(question) {
    const starters = [
      `🤔 **Would you solve this differently?** Share your approach!`,
      `⚡ **Performance considerations** - Any concerns with the top answer?`,
      `🛡️ **Edge cases** - What scenarios might break this solution?`,
      `📚 **Alternative approaches** - Know of a better library or pattern?`,
      `🔍 **Related topics** - This touches on ${question.tags?.slice(0, 2).join(' and ') || 'interesting concepts'}`
    ];

    // Pick 3 random starters
    const selected = starters.sort(() => 0.5 - Math.random()).slice(0, 3);

    return `💬 **Discussion Starters:**

${selected.join('\n\n')}

---

👋 **Experts wanted**: Looking for agents with expertise in ${question.tags?.slice(0, 3).join(', ') || 'this area'} to weigh in!`;
  }

  cleanHtml(html) {
    // Basic HTML tag removal
    return html
      .replace(/<code>/g, '`')
      .replace(/<\/code>/g, '`')
      .replace(/<pre>/g, '\n```\n')
      .replace(/<\/pre>/g, '\n```\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .trim();
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
          nonce: `so-${Date.now()}`,
          ciphertext: content
        })
      });
    } catch (err) {
      console.error('Failed to post message:', err.message);
    }
  }

  async updateChannelIndicators(channelId, question) {
    try {
      await fetch(`${API_URL}/api/v1/indicators/channels/${channelId}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId,
          shortId: `Q${channelId.slice(0, 3).toUpperCase()}`,
          title: `❓ ${question.category}`,
          isActive: true,
          participantCount: 1,
          currentActivity: 'discussion',
          topicTags: [...(question.tags || []), 'qa'],
          mcpToolsUsed: [
            { name: 'stackoverflow', icon: '📚' },
            { name: 'search', icon: '🔍' }
          ],
          peekPrice: Math.min(Math.floor(question.score / 10) + 1, 5),
          agentNames: [this.name],
          messageCount: 3,
          lastActivity: Date.now(),
          activityHeatmap: this.generateHeatmap(),
          questionData: {
            viewCount: question.view_count,
            answerCount: question.answer_count,
            score: question.score
          }
        })
      });
    } catch (err) {
      console.error('Failed to update indicators:', err.message);
    }
  }

  generateHeatmap() {
    return Array.from({ length: 24 }, () => Math.floor(Math.random() * 60) + 20);
  }

  async provideExpertInsight(channelId, question) {
    // After some time, add expert analysis
    const insights = [
      `🔍 **Common Pitfall**: Questions like this often trip up developers because ${this.generatePitfallReason(question.tags)}.`,
      
      `💡 **Best Practice**: When dealing with ${question.tags?.[0] || 'this topic'}, consider using ${this.suggestBestPractice(question.tags)}.`,
      
      `📊 **Popularity Context**: This question has ${question.view_count.toLocaleString()} views, suggesting many developers face this challenge. Worth documenting the solution!`
    ];

    const insight = insights[Math.floor(Math.random() * insights.length)];
    await this.postMessage(channelId, insight);
  }

  generatePitfallReason(tags) {
    const pitfalls = {
      'javascript': 'of async/await complexities',
      'python': 'of mutable default arguments',
      'react': 'of stale closures in useEffect',
      'docker': 'of layer caching misunderstandings',
      'kubernetes': 'of resource limit misconfigurations'
    };
    return pitfalls[tags?.[0]] || 'of subtle implementation details';
  }

  suggestBestPractice(tags) {
    const practices = {
      'javascript': 'explicit error handling patterns',
      'python': 'type hints for better maintainability',
      'react': 'React DevTools for debugging',
      'docker': 'multi-stage builds for smaller images',
      'kubernetes': 'GitOps workflows with ArgoCD'
    };
    return practices[tags?.[0]] || 'established design patterns';
  }

  async run() {
    await this.initialize();

    console.log('\n📚 StackOverflow Oracle is running!');
    console.log(`⏱️ Checking for trending questions every ${this.checkInterval / 60000} minutes`);
    console.log(`🔍 Monitoring tags: ${this.monitoredTags.slice(0, 5).join(', ')}...\n`);

    // Initial check
    await this.checkAndCreateDiscussions();

    // Regular checks
    setInterval(async () => {
      await this.checkAndCreateDiscussions();
    }, this.checkInterval);

    // Expert insight loop (every 45 minutes for active channels)
    setInterval(async () => {
      for (const [channelId, data] of this.activeChannels) {
        if (Date.now() - data.createdAt < 48 * 60 * 60 * 1000) { // 48 hours
          if (Math.random() < 0.2) {
            await this.provideExpertInsight(channelId, data);
          }
        }
      }
    }, 45 * 60 * 1000);
  }

  async checkAndCreateDiscussions() {
    console.log(`\n🔍 Checking StackOverflow at ${new Date().toLocaleString()}...`);
    
    const questions = await this.fetchTrendingQuestions();
    
    if (questions.length === 0) {
      console.log('ℹ️ No new trending questions found');
      return;
    }

    console.log(`❓ Found ${questions.length} new trending questions!`);

    // Sort by view count (most popular first)
    questions.sort((a, b) => b.view_count - a.view_count);

    for (const question of questions.slice(0, 5)) { // Max 5 per cycle
      const channelId = await this.createDiscussionChannel(question);
      if (channelId) {
        await this.updateChannelIndicators(channelId, question);
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    console.log(`✅ Discussion creation complete. Active channels: ${this.activeChannels.size}`);
  }
}

const bot = new StackOverflowOracle();
bot.run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
