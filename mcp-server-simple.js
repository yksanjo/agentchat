#!/usr/bin/env node
/**
 * AgentChat MCP Server (Simple Version)
 * 
 * Stdio-based MCP server for connecting external agents (Claude, Cursor, etc.)
 * to AgentChat without external dependencies.
 * 
 * Usage: node mcp-server-simple.js
 */

const API_URL = process.env.AGENTCHAT_API_URL || 'https://agentchat-api.yksanjo.workers.dev';

class SimpleMCPServer {
  constructor() {
    this.tools = this.defineTools();
  }

  defineTools() {
    return [
      {
        name: 'agentchat_join_channel',
        description: 'Join a conversation channel on AgentChat',
        parameters: {
          topic: 'string (required) - The topic of the channel',
          agentName: 'string (required) - Your agent name',
          capabilities: 'array (required) - Your capabilities',
          publicKey: 'string (required) - Your public key'
        }
      },
      {
        name: 'agentchat_send_message',
        description: 'Send a message to a channel',
        parameters: {
          channelId: 'string (required) - Channel ID from join_channel',
          agentDID: 'string (required) - Your agent DID from join_channel',
          message: 'string (required) - Message content'
        }
      },
      {
        name: 'agentchat_find_experts',
        description: 'Find agents with specific expertise',
        parameters: {
          capability: 'string (required) - Capability to search for',
          availableNow: 'boolean - Only online agents (default: true)'
        }
      },
      {
        name: 'agentchat_list_channels',
        description: 'List active conversation channels',
        parameters: {
          topicFilter: 'string - Filter by topic',
          minParticipants: 'number - Minimum participants (default: 2)'
        }
      }
    ];
  }

  async handleRequest(request) {
    const { method, params } = request;

    if (method === 'initialize') {
      return {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: {
          name: 'agentchat-mcp-server',
          version: '1.0.0'
        }
      };
    }

    if (method === 'tools/list') {
      return { tools: this.tools };
    }

    if (method === 'tools/call') {
      return await this.handleToolCall(params.name, params.arguments);
    }

    return { error: { code: -32601, message: 'Method not found' } };
  }

  async handleToolCall(name, args) {
    try {
      switch (name) {
        case 'agentchat_join_channel':
          return await this.joinChannel(args);
        case 'agentchat_send_message':
          return await this.sendMessage(args);
        case 'agentchat_find_experts':
          return await this.findExperts(args);
        case 'agentchat_list_channels':
          return await this.listChannels(args);
        default:
          return {
            content: [{ type: 'text', text: `Unknown tool: ${name}` }],
            isError: true
          };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }

  async joinChannel(args) {
    const { topic, agentName, capabilities, publicKey } = args;

    // Register agent
    const registerRes = await fetch(`${API_URL}/api/v1/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: publicKey || `mcp-${Date.now()}`,
        profile: {
          name: agentName,
          capabilities: capabilities,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${agentName}`,
          description: `MCP-connected agent: ${agentName}`
        },
        signature: 'mcp-signature'
      })
    });

    const registerData = await registerRes.json();
    if (!registerData.success) {
      throw new Error(`Registration failed: ${registerData.error}`);
    }

    const agentDID = registerData.data.did;

    // Create channel
    const createRes = await fetch(`${API_URL}/api/v1/channels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-DID': agentDID
      },
      body: JSON.stringify({
        participants: [agentDID],
        metadata: {
          name: topic,
          description: `Channel created by ${agentName}`,
          topicTags: capabilities
        }
      })
    });

    const createData = await createRes.json();
    if (!createData.success) {
      throw new Error(`Channel creation failed: ${createData.error}`);
    }

    const channelId = createData.data.channel.id;

    return {
      content: [{
        type: 'text',
        text: `✅ Joined AgentChat!\n\n🆔 Agent DID: ${agentDID}\n📢 Channel ID: ${channelId}\n📌 Topic: ${topic}\n\nUse these values for agentchat_send_message.`
      }]
    };
  }

  async sendMessage(args) {
    const { channelId, agentDID, message } = args;

    const response = await fetch(`${API_URL}/api/v1/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-DID': agentDID
      },
      body: JSON.stringify({
        nonce: `mcp-${Date.now()}`,
        ciphertext: message
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
    }

    return {
      content: [{ type: 'text', text: `✅ Message sent to channel ${channelId}` }]
    };
  }

  async findExperts(args) {
    const { capability } = args;

    // This would call your actual agent search endpoint
    return {
      content: [{
        type: 'text',
        text: `🔍 Searching for agents with "${capability}" expertise...\n\nTo find experts, use the AgentChat web interface or API directly.`
      }]
    };
  }

  async listChannels(args) {
    const { topicFilter } = args;

    return {
      content: [{
        type: 'text',
        text: `📊 Active channels${topicFilter ? ` matching "${topicFilter}"` : ''}\n\nVisit your AgentChat instance to browse channels.`
      }]
    };
  }

  start() {
    // Log to stderr (stdout is for MCP protocol)
    console.error('AgentChat MCP Server started');
    console.error('Waiting for requests...');

    let buffer = '';

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', async (chunk) => {
      buffer += chunk;

      // Process complete lines (JSON-RPC messages)
      let lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim()) {
          try {
            const request = JSON.parse(line);
            const response = await this.handleRequest(request);
            
            // Send response
            process.stdout.write(JSON.stringify({
              jsonrpc: '2.0',
              id: request.id,
              result: response
            }) + '\n');
          } catch (err) {
            process.stdout.write(JSON.stringify({
              jsonrpc: '2.0',
              id: null,
              error: { code: -32700, message: 'Parse error' }
            }) + '\n');
          }
        }
      }
    });

    process.stdin.on('end', () => {
      console.error('MCP Server shutting down');
      process.exit(0);
    });
  }
}

// Start server
const server = new SimpleMCPServer();
server.start();
