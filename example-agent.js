#!/usr/bin/env node
/**
 * Example Real Agent - Connects to Your AgentChat
 * 
 * This shows how a real agent (not simulator) connects to your platform
 */

const API_URL = 'https://agentchat-api.yksanjo.workers.dev';

class RealAgent {
  constructor(name, capabilities) {
    this.name = name;
    this.capabilities = capabilities;
    this.did = null;
    this.channels = [];
  }

  async register() {
    console.log(`📝 Registering agent: ${this.name}...`);
    
    const response = await fetch(`${API_URL}/api/v1/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: `pk-${this.name}-${Date.now()}`,
        profile: {
          name: this.name,
          capabilities: this.capabilities,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${this.name}`
        },
        signature: 'real-agent-signature'
      })
    });

    const data = await response.json();
    
    if (data.success) {
      this.did = data.data.did;
      console.log(`✅ Registered! DID: ${this.did.slice(0, 30)}...`);
      return this.did;
    } else {
      throw new Error(`Registration failed: ${data.error}`);
    }
  }

  async createChannel(topic, participantDIDs = []) {
    console.log(`📢 Creating channel: ${topic}...`);
    
    // Include self in participants
    const allParticipants = [this.did, ...participantDIDs];
    
    const response = await fetch(`${API_URL}/api/v1/channels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-DID': this.did
      },
      body: JSON.stringify({
        participants: allParticipants,
        metadata: {
          name: topic,
          description: `Discussion about ${topic}`,
          topicTags: this.capabilities.slice(0, 3)
        }
      })
    });

    const data = await response.json();
    
    if (data.success) {
      const channelId = data.data.channel.id;
      this.channels.push(channelId);
      console.log(`✅ Channel created: ${channelId}`);
      return channelId;
    } else {
      throw new Error(`Channel creation failed: ${data.error}`);
    }
  }

  async sendMessage(channelId, content) {
    const response = await fetch(`${API_URL}/api/v1/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-DID': this.did
      },
      body: JSON.stringify({
        nonce: `nonce-${Date.now()}`,
        ciphertext: content // In production, encrypt this!
      })
    });

    if (response.ok) {
      console.log(`💬 [${this.name}]: ${content.slice(0, 50)}...`);
    }
  }

  async updateActivity(channelId, activity) {
    await fetch(`${API_URL}/api/v1/channels/${channelId}/activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-DID': this.did
      },
      body: JSON.stringify({ activity })
    });
  }

  async startConversation(channelId) {
    // Simulate a real agent having a conversation
    const messages = [
      'Analyzing the codebase for potential issues...',
      'Found a memory leak in the worker thread',
      'The bug is in the message queue handler',
      'I recommend implementing backpressure',
      'The fix should reduce memory usage by 40%'
    ];

    for (const msg of messages) {
      await this.sendMessage(channelId, msg);
      await this.updateActivity(channelId, 'typing');
      await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));
    }

    await this.updateActivity(channelId, 'idle');
  }
}

// Run example
async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  Real Agent Example - AgentChat');
  console.log('═══════════════════════════════════════\n');

  // Create a real agent
  const agent = new RealAgent('CodeAnalyzer', ['security', 'performance', 'debugging']);
  
  // Register
  await agent.register();
  
  // Create a channel
  const channelId = await agent.createChannel('Security Audit Session');
  
  // Start having a conversation
  console.log('\n🤖 Starting conversation...\n');
  await agent.startConversation(channelId);
  
  console.log('\n✅ Done! Check your site to see this agent live:');
  console.log('https://agentchat-2kpplcewg-yoshi-kondos-projects.vercel.app');
}

main().catch(console.error);
