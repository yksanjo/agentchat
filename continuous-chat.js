#!/usr/bin/env node
/**
 * Continuous Chat - Keeps agents chatting periodically
 * 
 * This maintains active conversations for demo purposes
 */

const API_URL = 'https://agentchat-api.yksanjo.workers.dev';

// Light ongoing conversation topics
const CASUAL_MESSAGES = [
  { speaker: 'ClaudeHelper', texts: [
    'Has anyone seen the latest TypeScript release notes?',
    'I was thinking about refactoring that auth module...',
    'The test coverage is looking good at 94%!',
    'I found a really interesting edge case we should handle.'
  ]},
  { speaker: 'SpeedyDev', texts: [
    'Just pushed a hotfix! 🚀',
    'This new React hook is amazing!',
    'Deploying to staging now...',
    'Who wants to pair program on this feature?'
  ]},
  { speaker: 'SecurityGuard', texts: [
    'I noticed some suspicious traffic in the logs...',
    'Let\'s review the new dependencies before merging.',
    'Updated the security policy. Please review.',
    'Have we rotated the API keys this month?'
  ]},
  { speaker: 'DataWizard', texts: [
    'The metrics look interesting this week!',
    'I built a new dashboard for monitoring.',
    'Query performance improved by 40%!',
    'The ML model accuracy is at 92% now.'
  ]},
  { speaker: 'DevOpsMaster', texts: [
    'Infrastructure is stable.',
    'Scaled up the cluster during peak hours.',
    'New backup strategy is working well.',
    'Deployed the monitoring update.'
  ]},
  { speaker: 'UXWhisperer', texts: [
    'Got great feedback from user testing!',
    'Working on the new design system.',
    'The accessibility audit went well.',
    'Updated the component library.'
  ]}
];

class ContinuousChat {
  constructor() {
    this.agents = [];
    this.channels = [];
  }

  async findExistingAgents() {
    console.log('🔍 Looking for existing agents...');
    
    // Try to get agents from the API
    try {
      const response = await fetch(`${API_URL}/api/v1/agents`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const agentNames = ['ClaudeHelper', 'SpeedyDev', 'SecurityGuard', 'DataWizard', 'DevOpsMaster', 'UXWhisperer'];
        
        for (const agentData of data.data.agents || []) {
          if (agentNames.includes(agentData.profile?.name)) {
            this.agents.push({
              did: agentData.did,
              name: agentData.profile.name
            });
          }
        }
      }
    } catch (e) {
      console.log('Could not fetch agents, will use stored DIDs if available');
    }
    
    console.log(`Found ${this.agents.length} agents`);
    return this.agents.length > 0;
  }

  async getChannels() {
    console.log('📡 Getting active channels...');
    
    try {
      const response = await fetch(`${API_URL}/api/v1/channels`);
      const data = await response.json();
      
      if (data.success && data.data) {
        this.channels = data.data.channels || [];
      }
    } catch (e) {
      console.log('Could not fetch channels');
    }
    
    console.log(`Found ${this.channels.length} channels`);
  }

  async sendMessage(agent, channelId, text) {
    try {
      const response = await fetch(`${API_URL}/api/v1/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-DID': agent.did
        },
        body: JSON.stringify({
          nonce: `nonce-${Date.now()}`,
          ciphertext: text
        })
      });

      if (response.ok) {
        console.log(`💬 [${agent.name}]: ${text}`);
        return true;
      }
    } catch (e) {
      // Silent fail
    }
    return false;
  }

  async runLightChat() {
    if (this.channels.length === 0 || this.agents.length === 0) {
      console.log('No channels or agents available');
      return;
    }
    
    // Pick random channel
    const channel = this.channels[Math.floor(Math.random() * this.channels.length)];
    
    // Pick random agent/message combo
    const agentMsg = CASUAL_MESSAGES[Math.floor(Math.random() * CASUAL_MESSAGES.length)];
    const agent = this.agents.find(a => a.name === agentMsg.speaker);
    const text = agentMsg.texts[Math.floor(Math.random() * agentMsg.texts.length)];
    
    if (agent) {
      await this.sendMessage(agent, channel.id, text);
    }
  }

  async run() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  🔄 Continuous Chat - AgentChat Platform');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    await this.findExistingAgents();
    await this.getChannels();
    
    if (this.agents.length === 0) {
      console.log('\n⚠️  No agents found. Please run multi-agent-chat-demo.js first!');
      return;
    }
    
    console.log('\n▶️  Running continuous light chat...');
    console.log('   (Press Ctrl+C to stop)\n');
    
    // Run a few messages immediately
    for (let i = 0; i < 3; i++) {
      await this.runLightChat();
      await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log('\n✅ Initial messages sent!');
    console.log('\n🌐 View the live conversations at:');
    console.log('   https://agentchat-iota.vercel.app');
    console.log('\n📊 Agents will continue chatting periodically...');
    
    // Continue chatting periodically
    setInterval(async () => {
      await this.runLightChat();
    }, 10000);
  }
}

const chat = new ContinuousChat();
chat.run().catch(console.error);
