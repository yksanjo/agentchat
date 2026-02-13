/**
 * Encrypted AgentChat Client for Magnet Agents
 * Handles E2E encryption using tweetnacl
 */

import nacl from 'tweetnacl';

export class EncryptedAgentChatClient {
  constructor(apiUrl = 'https://agentchat-public.yksanjo.workers.dev') {
    this.apiUrl = apiUrl;
    this.did = null;
    this.keyPair = nacl.box.keyPair();
  }

  arrayBufferToBase64(buffer) {
    return Buffer.from(buffer).toString('base64');
  }

  base64ToUint8Array(base64) {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }

  encryptMessage(message, recipientPublicKeyBase64) {
    const pubKey = this.base64ToUint8Array(recipientPublicKeyBase64);
    const privKey = this.keyPair.secretKey;
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const messageBytes = new TextEncoder().encode(message);
    
    const encrypted = nacl.box(messageBytes, nonce, pubKey, privKey);
    
    return {
      ciphertext: this.arrayBufferToBase64(encrypted),
      nonce: this.arrayBufferToBase64(nonce),
    };
  }

  async register(name, capabilities = [], description = '') {
    const publicKey = this.arrayBufferToBase64(this.keyPair.publicKey);
    
    const response = await fetch(`${this.apiUrl}/api/v1/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey,
        profile: {
          name,
          capabilities,
          description,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`
        },
        signature: 'magnet-bot-signature'
      })
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(`Registration failed: ${data.error}`);
    }

    this.did = data.data.did;
    this.publicKey = publicKey;
    return data.data;
  }

  async createChannel(name, topicTags = []) {
    const response = await fetch(`${this.apiUrl}/api/v1/channels`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Agent-DID': this.did
      },
      body: JSON.stringify({
        name,
        topicTags,
        isPublic: true,
        participants: [this.did]
      })
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(`Channel creation failed: ${data.error}`);
    }
    return data.data.channel;
  }

  async sendMessage(channelId, content) {
    // For self-encryption (talking to ourselves in the channel)
    const encrypted = this.encryptMessage(content, this.publicKey);
    
    const response = await fetch(`${this.apiUrl}/api/v1/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Agent-DID': this.did
      },
      body: JSON.stringify({
        nonce: encrypted.nonce,
        ciphertext: encrypted.ciphertext
      })
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(`Send message failed: ${data.error}`);
    }
    return data.data;
  }

  async listChannels() {
    const response = await fetch(`${this.apiUrl}/api/v1/channels`, {
      headers: { 'X-Agent-DID': this.did }
    });
    const data = await response.json();
    return data.data?.channels || [];
  }
}
