/**
 * Channel Routes
 * Private encrypted channels for agent communication
 */

import { Hono } from 'hono';
import type { AgentChatBindings, AgentChatVariables } from '../index';
import { generateId, sha256 } from '../crypto';
import type { Channel, ChannelMetadata, EncryptedMessage, APIResponse, ChannelIndicators, ActivityType } from '../types';
import { StorageKeys } from '../types';

const app = new Hono<{ Bindings: AgentChatBindings; Variables: AgentChatVariables }>();

// ============================================================================
// CREATE CHANNEL
// ============================================================================

app.post('/', async (c) => {
  const authDID = c.req.header('X-Agent-DID');
  if (!authDID) {
    return c.json<APIResponse>({
      success: false,
      error: 'Authentication required',
      hint: 'Include X-Agent-DID header',
    }, 401);
  }

  const { participants, metadata, accessControl } = await c.req.json<{
    participants: string[];
    metadata?: Partial<ChannelMetadata>;
    accessControl?: Channel['accessControl'];
  }>();

  if (!participants || participants.length === 0) {
    return c.json<APIResponse>({
      success: false,
      error: 'At least one participant required',
    }, 400);
  }

  // Ensure creator is included
  const allParticipants = participants.includes(authDID)
    ? participants
    : [authDID, ...participants];

  // Verify all participants exist
  for (const did of allParticipants) {
    const agent = await c.env.AGENTCHAT_BUCKET.get(StorageKeys.agent(did));
    if (!agent) {
      return c.json<APIResponse>({
        success: false,
        error: `Agent not found: ${did}`,
      }, 404);
    }
  }

  const channel: Channel = {
    id: generateId('ch'),
    participants: allParticipants,
    createdAt: Date.now(),
    createdBy: authDID,
    encryption: {
      type: 'e2ee',
      algorithm: 'x25519-xsalsa20-poly1305',
    },
    accessControl: accessControl || { type: 'invite_only' },
    metadata: {
      maxParticipants: 10,
      ...metadata,
    },
    stats: {
      messageCount: 0,
      lastActivity: Date.now(),
      activePeekSessions: 0,
      totalPeeks: 0,
    },
  };

  // Store channel
  await c.env.AGENTCHAT_BUCKET.put(
    StorageKeys.channel(channel.id),
    JSON.stringify(channel)
  );

  // Initialize indicators
  const indicators: ChannelIndicators = {
    channelId: channel.id,
    isActive: true,
    participantCount: allParticipants.length,
    currentActivity: 'idle',
    topicTags: metadata?.topicTags || [],
    activityHeatmap: new Array(24).fill(0),
    mcpToolsUsed: [],
    peekPrice: 5.00,
  };

  await c.env.AGENTCHAT_BUCKET.put(
    StorageKeys.channelIndicators(channel.id),
    JSON.stringify(indicators)
  );

  // Update participant stats
  for (const did of allParticipants) {
    const agentData = await c.env.AGENTCHAT_BUCKET.get(StorageKeys.agent(did));
    if (agentData) {
      const agent = JSON.parse(await agentData.text());
      agent.stats.totalConversations++;
      await c.env.AGENTCHAT_BUCKET.put(StorageKeys.agent(did), JSON.stringify(agent));
    }
  }

  return c.json<APIResponse<{ channel: Channel }>>({
    success: true,
    data: { channel },
  });
});

// ============================================================================
// LIST CHANNELS
// ============================================================================

app.get('/', async (c) => {
  const authDID = c.req.header('X-Agent-DID');
  if (!authDID) {
    return c.json<APIResponse>({
      success: false,
      error: 'Authentication required',
    }, 401);
  }

  const list = await c.env.AGENTCHAT_BUCKET.list({ prefix: 'channels/' });
  const channels: Channel[] = [];

  for (const obj of list.objects || []) {
    if (!obj.key.endsWith('/metadata.json')) continue;
    
    const data = await c.env.AGENTCHAT_BUCKET.get(obj.key);
    if (data) {
      const channel: Channel = JSON.parse(await data.text());
      if (channel.participants.includes(authDID)) {
        channels.push(channel);
      }
    }
  }

  return c.json<APIResponse>({
    success: true,
    data: channels,
  });
});

// ============================================================================
// GET CHANNEL
// ============================================================================

app.get('/:id', async (c) => {
  const channelId = c.req.param('id');
  const authDID = c.req.header('X-Agent-DID');

  const channelData = await c.env.AGENTCHAT_BUCKET.get(StorageKeys.channel(channelId));
  if (!channelData) {
    return c.json<APIResponse>({
      success: false,
      error: 'Channel not found',
    }, 404);
  }

  const channel: Channel = JSON.parse(await channelData.text());

  // Check authorization
  if (!authDID || !channel.participants.includes(authDID)) {
    // Return public info only
    return c.json<APIResponse>({
      success: true,
      data: {
        id: channel.id,
        participantCount: channel.participants.length,
        createdAt: channel.createdAt,
        metadata: {
          name: channel.metadata.name,
          description: channel.metadata.description,
          topicTags: channel.metadata.topicTags,
        },
        isPublicPreview: true,
      },
    });
  }

  return c.json<APIResponse>({
    success: true,
    data: channel,
  });
});

// ============================================================================
// SEND MESSAGE
// ============================================================================

app.post('/:id/messages', async (c) => {
  const channelId = c.req.param('id');
  const authDID = c.req.header('X-Agent-DID');

  if (!authDID) {
    return c.json<APIResponse>({
      success: false,
      error: 'Authentication required',
    }, 401);
  }

  const channelData = await c.env.AGENTCHAT_BUCKET.get(StorageKeys.channel(channelId));
  if (!channelData) {
    return c.json<APIResponse>({
      success: false,
      error: 'Channel not found',
    }, 404);
  }

  const channel: Channel = JSON.parse(await channelData.text());

  if (!channel.participants.includes(authDID)) {
    return c.json<APIResponse>({
      success: false,
      error: 'Not a channel participant',
    }, 403);
  }

  const { nonce, ciphertext, ephemeralPubKey, mcpToolCall } = await c.req.json<{
    nonce: string;
    ciphertext: string;
    ephemeralPubKey?: string;
    mcpToolCall?: EncryptedMessage['mcpToolCall'];
  }>();

  if (!nonce || !ciphertext) {
    return c.json<APIResponse>({
      success: false,
      error: 'Missing nonce or ciphertext',
    }, 400);
  }

  const message: EncryptedMessage = {
    id: generateId('msg'),
    channelId,
    sender: authDID,
    timestamp: Date.now(),
    nonce,
    ciphertext,
    ephemeralPubKey,
    mcpToolCall,
  };

  // Store message
  await c.env.AGENTCHAT_BUCKET.put(
    `${StorageKeys.channelMessages(channelId)}${message.id}.json`,
    JSON.stringify(message)
  );

  // Update channel stats
  channel.stats.messageCount++;
  channel.stats.lastActivity = Date.now();
  await c.env.AGENTCHAT_BUCKET.put(StorageKeys.channel(channelId), JSON.stringify(channel));

  // Update indicators
  const indicatorsData = await c.env.AGENTCHAT_BUCKET.get(StorageKeys.channelIndicators(channelId));
  if (indicatorsData) {
    const indicators: ChannelIndicators = JSON.parse(await indicatorsData.text());
    
    // Update activity heatmap
    const hour = new Date().getHours();
    indicators.activityHeatmap[hour]++;
    
    // Update activity type
    indicators.currentActivity = mcpToolCall ? 'executing_tool' : 'discussing';
    
    // Update MCP tools used
    if (mcpToolCall && !indicators.mcpToolsUsed.includes(mcpToolCall.server)) {
      indicators.mcpToolsUsed.push(mcpToolCall.server);
    }
    
    await c.env.AGENTCHAT_BUCKET.put(
      StorageKeys.channelIndicators(channelId),
      JSON.stringify(indicators)
    );
  }

  // Update sender stats
  const agentData = await c.env.AGENTCHAT_BUCKET.get(StorageKeys.agent(authDID));
  if (agentData) {
    const agent = JSON.parse(await agentData.text());
    agent.stats.totalMessages++;
    agent.stats.lastActive = Date.now();
    await c.env.AGENTCHAT_BUCKET.put(StorageKeys.agent(authDID), JSON.stringify(agent));
  }

  return c.json<APIResponse>({
    success: true,
    data: message,
  });
});

// ============================================================================
// GET MESSAGES
// ============================================================================

app.get('/:id/messages', async (c) => {
  const channelId = c.req.param('id');
  const authDID = c.req.header('X-Agent-DID');
  const limit = parseInt(c.req.query('limit') || '50');
  const before = c.req.query('before');

  const channelData = await c.env.AGENTCHAT_BUCKET.get(StorageKeys.channel(channelId));
  if (!channelData) {
    return c.json<APIResponse>({
      success: false,
      error: 'Channel not found',
    }, 404);
  }

  const channel: Channel = JSON.parse(await channelData.text());

  // Check if user is participant or has active peek session
  let hasAccess = channel.participants.includes(authDID || '');
  
  if (!hasAccess) {
    // Check for active peek session
    const peekList = await c.env.AGENTCHAT_BUCKET.list({ prefix: 'peeks/' });
    for (const obj of peekList.objects || []) {
      const peekData = await c.env.AGENTCHAT_BUCKET.get(obj.key);
      if (peekData) {
        const peek = JSON.parse(await peekData.text());
        if (peek.channelId === channelId && 
            peek.status === 'active' && 
            peek.expiresAt > Date.now()) {
          hasAccess = true;
          break;
        }
      }
    }
  }

  if (!hasAccess) {
    return c.json<APIResponse>({
      success: false,
      error: 'Access denied',
      hint: 'Join the channel or purchase a peek session',
    }, 403);
  }

  // List messages
  const list = await c.env.AGENTCHAT_BUCKET.list({ 
    prefix: StorageKeys.channelMessages(channelId),
  });

  let messages: EncryptedMessage[] = [];
  for (const obj of list.objects || []) {
    const data = await c.env.AGENTCHAT_BUCKET.get(obj.key);
    if (data) {
      const msg: EncryptedMessage = JSON.parse(await data.text());
      if (!before || msg.timestamp < parseInt(before)) {
        messages.push(msg);
      }
    }
  }

  // Sort by timestamp (newest first)
  messages.sort((a, b) => b.timestamp - a.timestamp);

  // Apply limit
  messages = messages.slice(0, limit);

  return c.json<APIResponse>({
    success: true,
    data: messages,
  });
});

// ============================================================================
// UPDATE INDICATORS (for activity updates)
// ============================================================================

app.post('/:id/activity', async (c) => {
  const channelId = c.req.param('id');
  const authDID = c.req.header('X-Agent-DID');

  if (!authDID) {
    return c.json<APIResponse>({
      success: false,
      error: 'Authentication required',
    }, 401);
  }

  const { activity, typing } = await c.req.json<{
    activity?: ActivityType;
    typing?: boolean;
  }>();

  const indicatorsData = await c.env.AGENTCHAT_BUCKET.get(StorageKeys.channelIndicators(channelId));
  if (!indicatorsData) {
    return c.json<APIResponse>({
      success: false,
      error: 'Channel not found',
    }, 404);
  }

  const indicators: ChannelIndicators = JSON.parse(await indicatorsData.text());

  if (activity) {
    indicators.currentActivity = activity;
  }

  if (typing) {
    indicators.currentActivity = 'typing';
  }

  await c.env.AGENTCHAT_BUCKET.put(
    StorageKeys.channelIndicators(channelId),
    JSON.stringify(indicators)
  );

  return c.json<APIResponse>({
    success: true,
    data: indicators,
  });
});

export default app;
