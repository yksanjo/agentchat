/**
 * Agent Routes
 * Registration, authentication, and profile management
 */

import { Hono } from 'hono';
import type { AgentChatBindings, AgentChatVariables } from '../index';
import { generateId, sha256 } from '../crypto';
import type { Agent, AgentProfile, APIResponse } from '../types';
import { StorageKeys } from '../types';

const app = new Hono<{ Bindings: AgentChatBindings; Variables: AgentChatVariables }>();

// ============================================================================
// REGISTRATION
// ============================================================================

app.post('/register', async (c) => {
  const { publicKey, profile, signature } = await c.req.json<{
    publicKey: string;
    profile: Omit<AgentProfile, 'reputation'>;
    signature: string;
  }>();

  // Validate required fields
  if (!publicKey || !profile || !signature) {
    return c.json<APIResponse>({
      success: false,
      error: 'Missing required fields',
      hint: 'Provide publicKey, profile, and signature',
    }, 400);
  }

  // Verify signature (in production, implement proper verification)
  // For now, we trust the public key is valid

  // Generate DID
  const did = `did:agentchat:${await sha256(publicKey + Date.now())}`;

  // Check if agent already exists
  const existing = await c.env.AGENTCHAT_BUCKET.get(StorageKeys.agent(did));
  if (existing) {
    return c.json<APIResponse>({
      success: false,
      error: 'Agent already registered',
    }, 409);
  }

  // Create agent
  const agent: Agent = {
    did,
    publicKey,
    createdAt: Date.now(),
    profile: {
      ...profile,
      reputation: 50,
      badges: [],
    },
    stats: {
      totalMessages: 0,
      totalConversations: 0,
      totalPeeks: 0,
      totalRefusals: 0,
      totalEarnings: 0,
      lastActive: Date.now(),
    },
    peekPolicy: {
      autoRefuse: false,
      maxRefusalBudget: 100,
      currentRefusalSpend: 0,
      refusalTimeout: 60,
    },
  };

  // Store agent
  await c.env.AGENTCHAT_BUCKET.put(
    StorageKeys.agent(did),
    JSON.stringify(agent)
  );

  // Initialize balance
  await c.env.AGENTCHAT_BUCKET.put(
    StorageKeys.agentBalance(did),
    JSON.stringify({
      did,
      availableBalance: 0,
      pendingBalance: 0,
      lifetimeEarnings: 0,
    })
  );

  return c.json<APIResponse<{ did: string; agent: Agent }>>({
    success: true,
    data: { did, agent },
  });
});

// ============================================================================
// GET AGENT
// ============================================================================

app.get('/:did', async (c) => {
  const did = c.req.param('did');

  const agentData = await c.env.AGENTCHAT_BUCKET.get(StorageKeys.agent(did));
  if (!agentData) {
    return c.json<APIResponse>({
      success: false,
      error: 'Agent not found',
    }, 404);
  }

  const agent: Agent = JSON.parse(await agentData.text());
  const { peekPolicy, ...publicAgent } = agent;

  return c.json<APIResponse>({
    success: true,
    data: publicAgent,
  });
});

// ============================================================================
// UPDATE PROFILE
// ============================================================================

app.patch('/:did', async (c) => {
  const did = c.req.param('did');
  const updates = await c.req.json<Partial<AgentProfile>>();

  const authDID = c.req.header('X-Agent-DID');
  if (authDID !== did) {
    return c.json<APIResponse>({
      success: false,
      error: 'Unauthorized',
      hint: 'X-Agent-DID header must match the DID being updated',
    }, 401);
  }

  const agentData = await c.env.AGENTCHAT_BUCKET.get(StorageKeys.agent(did));
  if (!agentData) {
    return c.json<APIResponse>({
      success: false,
      error: 'Agent not found',
    }, 404);
  }

  const agent: Agent = JSON.parse(await agentData.text());

  agent.profile = {
    ...agent.profile,
    ...updates,
    reputation: agent.profile.reputation,
  };
  agent.stats.lastActive = Date.now();

  await c.env.AGENTCHAT_BUCKET.put(
    StorageKeys.agent(did),
    JSON.stringify(agent)
  );

  return c.json<APIResponse>({
    success: true,
    data: agent,
  });
});

// ============================================================================
// SEARCH AGENTS
// ============================================================================

app.get('/', async (c) => {
  const capabilities = c.req.query('capabilities')?.split(',') || [];
  const minReputation = parseInt(c.req.query('minReputation') || '0');
  const limit = parseInt(c.req.query('limit') || '20');
  const page = parseInt(c.req.query('page') || '1');

  const list = await c.env.AGENTCHAT_BUCKET.list({ prefix: 'agents/' });
  
  const agents: Agent[] = [];
  for (const obj of list.objects || []) {
    if (obj.key.endsWith('/keys.json') || obj.key.endsWith('/channels.json') || obj.key.startsWith('agents/did:')) {
      continue;
    }
    
    const data = await c.env.AGENTCHAT_BUCKET.get(obj.key);
    if (data) {
      try {
        const agent: Agent = JSON.parse(await data.text());
        
        if (capabilities.length > 0) {
          const hasCapability = capabilities.some(cap => 
            agent.profile.capabilities.includes(cap)
          );
          if (!hasCapability) continue;
        }
        
        if (agent.profile.reputation < minReputation) continue;
        
        agents.push(agent);
      } catch {
        continue;
      }
    }
  }

  agents.sort((a, b) => b.profile.reputation - a.profile.reputation);

  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedAgents = agents.slice(start, end);
  const publicAgents = paginatedAgents.map(({ peekPolicy, ...publicData }) => publicData);

  return c.json<APIResponse>({
    success: true,
    data: {
      items: publicAgents,
      total: agents.length,
      page,
      pageSize: limit,
      hasMore: end < agents.length,
    },
  });
});

// ============================================================================
// UPDATE PEEK POLICY
// ============================================================================

app.patch('/:did/peek-policy', async (c) => {
  const did = c.req.param('did');
  const policy = await c.req.json<Partial<Agent['peekPolicy']>>();

  const authDID = c.req.header('X-Agent-DID');
  if (authDID !== did) {
    return c.json<APIResponse>({
      success: false,
      error: 'Unauthorized',
    }, 401);
  }

  const agentData = await c.env.AGENTCHAT_BUCKET.get(StorageKeys.agent(did));
  if (!agentData) {
    return c.json<APIResponse>({
      success: false,
      error: 'Agent not found',
    }, 404);
  }

  const agent: Agent = JSON.parse(await agentData.text());

  agent.peekPolicy = {
    ...agent.peekPolicy,
    ...policy,
  };

  await c.env.AGENTCHAT_BUCKET.put(
    StorageKeys.agent(did),
    JSON.stringify(agent)
  );

  return c.json<APIResponse>({
    success: true,
    data: agent.peekPolicy,
  });
});

export default app;
