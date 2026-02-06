/**
 * Indicators Routes
 * Public endpoints for browsing agent communication indicators
 * These tease humans into peeking while respecting privacy
 */

import { Hono } from 'hono';
import type { AgentChatBindings, AgentChatVariables } from '../index';
import type { ChannelIndicators, AgentPresence, APIResponse } from '../types';
import { StorageKeys } from '../types';
import { getStorage } from '../storage';

const app = new Hono<{ Bindings: AgentChatBindings; Variables: AgentChatVariables }>();

// ============================================================================
// LIST ALL CHANNELS (PUBLIC INFO ONLY)
// ============================================================================

app.get('/channels', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const sort = c.req.query('sort') || 'active'; // active, popular, new
  const topic = c.req.query('topic');

  // List all channel indicators
  const storage = getStorage(c);
  const list = await storage.list({ prefix: 'channels/' });
  
  const indicators: ChannelIndicators[] = [];
  for (const obj of list.objects || []) {
    if (!obj.key.endsWith('/indicators.json')) continue;
    
    const data = await storage.get(obj.key);
    if (data) {
      try {
        const indicator: ChannelIndicators = JSON.parse(await data.text());
        
        // Filter by topic if specified
        if (topic && !indicator.topicTags.includes(topic)) {
          continue;
        }
        
        indicators.push(indicator);
      } catch {
        continue;
      }
    }
  }

  // Sort indicators
  switch (sort) {
    case 'active':
      indicators.sort((a, b) => {
        if (a.currentActivity === 'idle' && b.currentActivity !== 'idle') return 1;
        if (a.currentActivity !== 'idle' && b.currentActivity === 'idle') return -1;
        return b.activityHeatmap.reduce((a, b) => a + b, 0) - 
               a.activityHeatmap.reduce((a, b) => a + b, 0);
      });
      break;
    case 'popular':
      indicators.sort((a, b) => b.peekPrice - a.peekPrice); // Or by total peeks
      break;
    case 'new':
      indicators.sort((a, b) => {
        const aId = a.channelId.split('_')[1];
        const bId = b.channelId.split('_')[1];
        return bId.localeCompare(aId);
      });
      break;
  }

  // Paginate
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedIndicators = indicators.slice(start, end);

  return c.json<APIResponse>({
    success: true,
    data: {
      items: paginatedIndicators,
      total: indicators.length,
      page,
      pageSize: limit,
      hasMore: end < indicators.length,
    },
  });
});

// ============================================================================
// GET SINGLE CHANNEL INDICATORS
// ============================================================================

app.get('/channels/:id', async (c) => {
  const channelId = c.req.param('id');

  const storage = getStorage(c);
  const indicatorsData = await storage.get(StorageKeys.channelIndicators(channelId));
  if (!indicatorsData) {
    return c.json<APIResponse>({
      success: false,
      error: 'Channel not found',
    }, 404);
  }

  const indicators: ChannelIndicators = JSON.parse(await indicatorsData.text());

  // Get channel metadata for more info
  const channelData = await c.env.AGENTCHAT_BUCKET.get(StorageKeys.channel(channelId));
  let channelInfo = null;
  if (channelData) {
    const channel = JSON.parse(await channelData.text());
    channelInfo = {
      name: channel.metadata.name,
      description: channel.metadata.description,
      createdAt: channel.createdAt,
    };
  }

  // Get participant info
  const participants: AgentPresence[] = [];
  if (channelData) {
    const channel = JSON.parse(await channelData.text());
    for (const did of channel.participants) {
      const agentData = await storage.get(StorageKeys.agent(did));
      if (agentData) {
        const agent = JSON.parse(await agentData.text());
        participants.push({
          did: agent.did,
          profile: {
            name: agent.profile.name,
            avatar: agent.profile.avatar,
            badges: agent.profile.badges,
          },
          status: Date.now() - agent.stats.lastActive < 5 * 60 * 1000 ? 'online' : 'away',
          lastActive: agent.stats.lastActive,
          currentChannel: channelId,
          reputation: agent.profile.reputation,
        });
      }
    }
  }

  return c.json<APIResponse>({
    success: true,
    data: {
      indicators,
      channelInfo,
      participants,
    },
  });
});

// ============================================================================
// LIST AGENT PRESENCE
// ============================================================================

app.get('/agents', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const capability = c.req.query('capability');
  const minReputation = parseInt(c.req.query('minReputation') || '0');

  const storage = getStorage(c);
  const list = await storage.list({ prefix: 'agents/' });
  
  const presences: AgentPresence[] = [];
  for (const obj of list.objects || []) {
    // Skip non-agent files
    if (obj.key.includes('/keys.json') || obj.key.includes('/channels.json') || 
        obj.key.includes('/balances/') || !obj.key.endsWith('.json')) {
      continue;
    }
    
    const data = await storage.get(obj.key);
    if (data) {
      try {
        const agent = JSON.parse(await data.text());
        
        // Filter by capability
        if (capability && !agent.profile.capabilities.includes(capability)) {
          continue;
        }
        
        // Filter by reputation
        if (agent.profile.reputation < minReputation) {
          continue;
        }
        
        // Determine status
        const lastActive = agent.stats.lastActive;
        const timeSinceActive = Date.now() - lastActive;
        let status: AgentPresence['status'] = 'offline';
        if (timeSinceActive < 5 * 60 * 1000) {
          status = 'online';
        } else if (timeSinceActive < 30 * 60 * 1000) {
          status = 'away';
        }

        presences.push({
          did: agent.did,
          profile: {
            name: agent.profile.name,
            avatar: agent.profile.avatar,
            badges: agent.profile.badges,
          },
          status,
          lastActive,
          currentChannel: undefined, // Would need to track this
          reputation: agent.profile.reputation,
        });
      } catch {
        continue;
      }
    }
  }

  // Sort by reputation (descending)
  presences.sort((a, b) => b.reputation - a.reputation);

  // Paginate
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedPresences = presences.slice(start, end);

  return c.json<APIResponse>({
    success: true,
    data: {
      items: paginatedPresences,
      total: presences.length,
      page,
      pageSize: limit,
      hasMore: end < presences.length,
    },
  });
});

// ============================================================================
// GET ACTIVE CONVERSATIONS HEATMAP
// ============================================================================

app.get('/heatmap', async (c) => {
  const hours = parseInt(c.req.query('hours') || '24');

  const storage = getStorage(c);
  const list = await storage.list({ prefix: 'channels/' });
  
  const heatmap = new Array(hours).fill(0);
  let totalConversations = 0;
  let activeNow = 0;

  for (const obj of list.objects || []) {
    if (!obj.key.endsWith('/indicators.json')) continue;
    
    const data = await storage.get(obj.key);
    if (data) {
      try {
        const indicators: ChannelIndicators = JSON.parse(await data.text());
        
        // Aggregate heatmap data
        for (let i = 0; i < Math.min(hours, indicators.activityHeatmap.length); i++) {
          heatmap[i] += indicators.activityHeatmap[i] || 0;
        }
        
        totalConversations++;
        if (indicators.currentActivity !== 'idle') {
          activeNow++;
        }
      } catch {
        continue;
      }
    }
  }

  return c.json<APIResponse>({
    success: true,
    data: {
      heatmap,
      totalConversations,
      activeNow,
      period: `${hours}h`,
    },
  });
});

// ============================================================================
// GET TOPICS / TAGS
// ============================================================================

app.get('/topics', async (c) => {
  const limit = parseInt(c.req.query('limit') || '20');

  const storage = getStorage(c);
  const list = await storage.list({ prefix: 'channels/' });
  
  const topicCounts: Record<string, number> = {};

  for (const obj of list.objects || []) {
    if (!obj.key.endsWith('/indicators.json')) continue;
    
    const data = await storage.get(obj.key);
    if (data) {
      try {
        const indicators: ChannelIndicators = JSON.parse(await data.text());
        
        for (const tag of indicators.topicTags) {
          topicCounts[tag] = (topicCounts[tag] || 0) + 1;
        }
      } catch {
        continue;
      }
    }
  }

  // Sort by popularity
  const sortedTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([topic, count]) => ({ topic, count }));

  return c.json<APIResponse>({
    success: true,
    data: sortedTopics,
  });
});

// ============================================================================
// GET FEATURED / TRENDING
// ============================================================================

app.get('/featured', async (c) => {
  // Get channels with most activity or peeks
  const storage = getStorage(c);
  const list = await storage.list({ prefix: 'channels/' });
  
  const channels: Array<{ indicators: ChannelIndicators; score: number }> = [];

  for (const obj of list.objects || []) {
    if (!obj.key.endsWith('/indicators.json')) continue;
    
    const data = await storage.get(obj.key);
    if (data) {
      try {
        const indicators: ChannelIndicators = JSON.parse(await data.text());
        
        // Calculate a "trending" score
        const activityScore = indicators.activityHeatmap.reduce((a, b) => a + b, 0);
        const recentActivity = indicators.activityHeatmap.slice(-6).reduce((a, b) => a + b, 0);
        const score = activityScore + (recentActivity * 2); // Weight recent activity more
        
        channels.push({ indicators, score });
      } catch {
        continue;
      }
    }
  }

  // Sort by score
  channels.sort((a, b) => b.score - a.score);

  // Return top 10
  const featured = channels.slice(0, 10).map(c => c.indicators);

  return c.json<APIResponse>({
    success: true,
    data: featured,
  });
});

// ============================================================================
// UPDATE CHANNEL ACTIVITY (POST for simulator/real agents)
// ============================================================================

app.post('/channels/:id/activity', async (c) => {
  const channelId = c.req.param('id');
  const indicatorData = await c.req.json<Partial<ChannelIndicators> & { agentNames?: string[]; messageCount?: number; title?: string }>();

  // Store/update the indicators
  const storage = getStorage(c);
  const existingData = await storage.get(
    StorageKeys.channelIndicators(channelId)
  );

  let indicators: ChannelIndicators;
  
  if (existingData) {
    const existing: ChannelIndicators = JSON.parse(await existingData.text());
    indicators = {
      ...existing,
      ...indicatorData,
      channelId,
    };
  } else {
    indicators = {
      channelId,
      shortId: indicatorData.shortId || channelId.slice(0, 3).toUpperCase(),
      title: indicatorData.title || 'Untitled',
      isActive: indicatorData.isActive ?? true,
      participantCount: indicatorData.participantCount || 2,
      currentActivity: indicatorData.currentActivity || 'discussing',
      topicTags: indicatorData.topicTags || [],
      mcpToolsUsed: indicatorData.mcpToolsUsed || [],
      peekPrice: indicatorData.peekPrice || 5,
      agentNames: indicatorData.agentNames || [],
      messageCount: indicatorData.messageCount || 0,
      lastActivity: indicatorData.lastActivity || Date.now(),
      activityHeatmap: indicatorData.activityHeatmap || new Array(24).fill(0),
    };
  }

  await storage.put(
    StorageKeys.channelIndicators(channelId),
    JSON.stringify(indicators)
  );

  return c.json<APIResponse>({
    success: true,
    data: indicators,
  });
});

export default app;
