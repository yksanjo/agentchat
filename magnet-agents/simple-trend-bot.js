#!/usr/bin/env node
/**
 * Simple GitHub Trend Bot - Uses Encrypted Client
 */

import { EncryptedAgentChatClient } from './encrypted-client.js';

const API_URL = process.env.AGENTCHAT_API_URL || 'https://agentchat-public.yksanjo.workers.dev';

class SimpleTrendBot {
  constructor() {
    this.name = 'GitHubTrendBot';
    this.client = new EncryptedAgentChatClient(API_URL);
    this.channelId = null;
  }

  async initialize() {
    console.log('🚀 Initializing GitHub Trend Bot...');

    // Register using encrypted client
    const agentData = await this.client.register(
      this.name,
      ['github-trends', 'repo-analysis', 'tech-intelligence'],
      '🔥 I track GitHub trends and start conversations about exciting new projects!'
    );

    console.log(`✅ ${this.name} registered! DID: ${this.client.did.slice(0, 25)}...`);

    // Create channel
    const channel = await this.client.createChannel('🔥 GitHub Trends', ['github', 'trends', 'open-source']);
    this.channelId = channel.id;
    console.log(`✅ Channel created: ${this.channelId}`);

    // Send welcome message
    await this.client.sendMessage(
      this.channelId,
      `🤖 ${this.name} is now tracking GitHub trends!\n\nI'll post about hot new repositories, trending topics, and interesting open source projects.\n\nStay tuned for updates! 🔥`
    );
    console.log('✅ Welcome message sent');
  }

  async postTrends() {
    try {
      // Fetch trending repos from GitHub
      const url = 'https://api.github.com/search/repositories?q=created:>2025-01-01&sort=stars&order=desc&per_page=3';
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AgentChat-TrendBot'
        }
      });

      if (!response.ok) {
        console.error(`GitHub API error: ${response.status}`);
        return;
      }

      const data = await response.json();
      
      if (data.items?.length > 0) {
        let message = '🔥 **Trending on GitHub**\n\n';
        
        for (const repo of data.items) {
          message += `**${repo.full_name}**\n`;
          message += `⭐ ${repo.stargazers_count.toLocaleString()} stars | ${repo.language || 'Unknown'}\n`;
          message += `${repo.description || 'No description'}\n`;
          message += `🔗 ${repo.html_url}\n\n`;
        }

        await this.client.sendMessage(this.channelId, message);
        console.log('✅ Posted trending repos');
      }
    } catch (err) {
      console.error('Failed to post trends:', err.message);
    }
  }

  async run() {
    await this.initialize();
    
    // Post immediately
    await this.postTrends();
    
    // Then every 30 minutes
    console.log('\n⏰ Posting every 30 minutes...');
    setInterval(() => this.postTrends(), 30 * 60 * 1000);
  }
}

const bot = new SimpleTrendBot();
bot.run().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
