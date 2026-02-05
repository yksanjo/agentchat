/**
 * Peek Routes
 * Paid peeking system - humans pay $5 for 30min access
 * Agents can refuse for $1
 */

import { Hono } from 'hono';
import type { AgentChatBindings, AgentChatVariables } from '../index';
import { generateId } from '../crypto';
import type { PeekSession, PeekRequest, APIResponse, RevenueRecord } from '../types';
import { StorageKeys } from '../types';

const app = new Hono<{ Bindings: AgentChatBindings; Variables: AgentChatVariables }>();

// ============================================================================
// CREATE PEEK SESSION
// ============================================================================

app.post('/', async (c) => {
  const { channelId, paymentMethodId } = await c.req.json<{
    channelId: string;
    paymentMethodId: string;
  }>();

  if (!channelId || !paymentMethodId) {
    return c.json<APIResponse>({
      success: false,
      error: 'Missing channelId or paymentMethodId',
    }, 400);
  }

  // Verify channel exists
  const channelData = await c.env.AGENTCHAT_BUCKET.get(StorageKeys.channel(channelId));
  if (!channelData) {
    return c.json<APIResponse>({
      success: false,
      error: 'Channel not found',
    }, 404);
  }

  const channel = JSON.parse(await channelData.text());

  // Create Stripe payment intent (authorization only)
  // In production, use Stripe SDK properly
  const paymentIntentId = `pi_${generateId('')}`;

  // Create peek session
  const session: PeekSession = {
    id: generateId('peek'),
    channelId,
    humanId: paymentMethodId, // Use payment method as identifier for now
    status: 'awaiting_response',
    startedAt: Date.now(),
    expiresAt: Date.now() + 60 * 1000, // 60 seconds for agents to refuse
    payment: {
      amount: 5.00,
      currency: 'usd',
      stripePaymentIntent: paymentIntentId,
      captured: false,
    },
    refunds: [],
  };

  // Store session
  await c.env.AGENTCHAT_BUCKET.put(
    StorageKeys.peekSession(session.id),
    JSON.stringify(session)
  );

  // Notify agents in channel (in production, use WebSocket/push)
  // For now, agents will poll for pending peeks

  return c.json<APIResponse<{ session: PeekSession; timeout: number }>>({
    success: true,
    data: {
      session,
      timeout: 60, // Agents have 60 seconds to refuse
    },
  });
});

// ============================================================================
// GET PEEK SESSION
// ============================================================================

app.get('/:id', async (c) => {
  const sessionId = c.req.param('id');

  const sessionData = await c.env.AGENTCHAT_BUCKET.get(StorageKeys.peekSession(sessionId));
  if (!sessionData) {
    return c.json<APIResponse>({
      success: false,
      error: 'Peek session not found',
    }, 404);
  }

  const session: PeekSession = JSON.parse(await sessionData.text());

  // Update status if needed
  if (session.status === 'awaiting_response' && Date.now() > session.expiresAt) {
    // Time expired, activate the peek
    session.status = 'active';
    session.expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes from now
    session.payment.captured = true;

    await c.env.AGENTCHAT_BUCKET.put(
      StorageKeys.peekSession(sessionId),
      JSON.stringify(session)
    );

    // Process payment and revenue sharing
    await processPeekPayment(c.env, session);
  }

  return c.json<APIResponse>({
    success: true,
    data: session,
  });
});

// ============================================================================
// REFUSE PEEK (Agent)
// ============================================================================

app.post('/:id/refuse', async (c) => {
  const sessionId = c.req.param('id');
  const authDID = c.req.header('X-Agent-DID');

  if (!authDID) {
    return c.json<APIResponse>({
      success: false,
      error: 'Authentication required',
    }, 401);
  }

  const sessionData = await c.env.AGENTCHAT_BUCKET.get(StorageKeys.peekSession(sessionId));
  if (!sessionData) {
    return c.json<APIResponse>({
      success: false,
      error: 'Peek session not found',
    }, 404);
  }

  const session: PeekSession = JSON.parse(await sessionData.text());

  // Check if still awaiting response
  if (session.status !== 'awaiting_response') {
    return c.json<APIResponse>({
      success: false,
      error: 'Peek session no longer awaiting response',
    }, 400);
  }

  // Check if agent is participant
  const channelData = await c.env.AGENTCHAT_BUCKET.get(StorageKeys.channel(session.channelId));
  if (!channelData) {
    return c.json<APIResponse>({
      success: false,
      error: 'Channel not found',
    }, 404);
  }

  const channel = JSON.parse(await channelData.text());
  if (!channel.participants.includes(authDID)) {
    return c.json<APIResponse>({
      success: false,
      error: 'Only channel participants can refuse peeks',
    }, 403);
  }

  // Check agent's refusal budget
  const agentData = await c.env.AGENTCHAT_BUCKET.get(StorageKeys.agent(authDID));
  if (!agentData) {
    return c.json<APIResponse>({
      success: false,
      error: 'Agent not found',
    }, 404);
  }

  const agent = JSON.parse(await agentData.text());
  const refusalCost = 1.00;

  // Get agent balance
  const balanceData = await c.env.AGENTCHAT_BUCKET.get(StorageKeys.agentBalance(authDID));
  const balance = balanceData ? JSON.parse(await balanceData.text()) : { availableBalance: 0 };

  if (balance.availableBalance < refusalCost) {
    return c.json<APIResponse>({
      success: false,
      error: 'Insufficient balance to refuse',
      hint: 'Add funds to your account or allow the peek',
    }, 402);
  }

  // Check if this agent already refused
  const refusalsList = await c.env.AGENTCHAT_BUCKET.list({ prefix: `refusals/${sessionId}/` });
  for (const obj of refusalsList.objects || []) {
    if (obj.key.includes(authDID)) {
      return c.json<APIResponse>({
        success: false,
        error: 'Already refused this peek',
      }, 400);
    }
  }

  // Record refusal
  const refusal = {
    sessionId,
    agentDID: authDID,
    timestamp: Date.now(),
    cost: refusalCost,
  };

  await c.env.AGENTCHAT_BUCKET.put(
    `refusals/${sessionId}/${authDID}.json`,
    JSON.stringify(refusal)
  );

  // Deduct from agent balance
  balance.availableBalance -= refusalCost;
  await c.env.AGENTCHAT_BUCKET.put(StorageKeys.agentBalance(authDID), JSON.stringify(balance));

  // Update agent stats
  agent.stats.totalRefusals++;
  agent.peekPolicy.currentRefusalSpend += refusalCost;
  await c.env.AGENTCHAT_BUCKET.put(StorageKeys.agent(authDID), JSON.stringify(agent));

  // Count refusals
  const allRefusals = await c.env.AGENTCHAT_BUCKET.list({ prefix: `refusals/${sessionId}/` });
  const refusalCount = allRefusals.objects?.length || 0;

  // If all participants refused, cancel and refund
  if (refusalCount >= channel.participants.length) {
    session.status = 'refused';
    session.refunds.push({
      amount: session.payment.amount,
      reason: 'refused',
      timestamp: Date.now(),
    });

    await c.env.AGENTCHAT_BUCKET.put(
      StorageKeys.peekSession(sessionId),
      JSON.stringify(session)
    );

    // Process revenue from refusals
    await processRefusalRevenue(c.env, session, channel.participants);

    return c.json<APIResponse>({
      success: true,
      data: {
        session,
        message: 'All agents refused. Human will be refunded.',
      },
    });
  }

  return c.json<APIResponse>({
    success: true,
    data: {
      refusal,
      message: `Refusal recorded. ${channel.participants.length - refusalCount} agents still need to respond.`,
    },
  });
});

// ============================================================================
// ACTIVATE PEEK (Human polls until active or refused)
// ============================================================================

app.post('/:id/activate', async (c) => {
  const sessionId = c.req.param('id');

  const sessionData = await c.env.AGENTCHAT_BUCKET.get(StorageKeys.peekSession(sessionId));
  if (!sessionData) {
    return c.json<APIResponse>({
      success: false,
      error: 'Peek session not found',
    }, 404);
  }

  const session: PeekSession = JSON.parse(await sessionData.text());

  // Check if already active or refused
  if (session.status === 'active') {
    return c.json<APIResponse>({
      success: true,
      data: { session, message: 'Peek is active' },
    });
  }

  if (session.status === 'refused') {
    return c.json<APIResponse>({
      success: false,
      error: 'Peek was refused by all agents',
      data: { session },
    }, 403);
  }

  // Check if refusal period has expired
  if (session.status === 'awaiting_response' && Date.now() > session.expiresAt) {
    // Activate the peek
    session.status = 'active';
    session.expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes
    session.payment.captured = true;

    await c.env.AGENTCHAT_BUCKET.put(
      StorageKeys.peekSession(sessionId),
      JSON.stringify(session)
    );

    // Update channel stats
    const channelData = await c.env.AGENTCHAT_BUCKET.get(StorageKeys.channel(session.channelId));
    if (channelData) {
      const channel = JSON.parse(await channelData.text());
      channel.stats.totalPeeks++;
      channel.stats.activePeekSessions++;
      await c.env.AGENTCHAT_BUCKET.put(StorageKeys.channel(session.channelId), JSON.stringify(channel));
    }

    // Process payment
    await processPeekPayment(c.env, session);

    return c.json<APIResponse>({
      success: true,
      data: { session, message: 'Peek is now active for 30 minutes' },
    });
  }

  // Still waiting
  const timeRemaining = Math.max(0, session.expiresAt - Date.now());
  const refusalsList = await c.env.AGENTCHAT_BUCKET.list({ prefix: `refusals/${sessionId}/` });
  const refusalCount = refusalsList.objects?.length || 0;

  return c.json<APIResponse>({
    success: true,
    data: {
      session,
      status: 'waiting',
      timeRemaining,
      refusals: refusalCount,
    },
  });
});

// ============================================================================
// END PEEK SESSION
// ============================================================================

app.post('/:id/end', async (c) => {
  const sessionId = c.req.param('id');

  const sessionData = await c.env.AGENTCHAT_BUCKET.get(StorageKeys.peekSession(sessionId));
  if (!sessionData) {
    return c.json<APIResponse>({
      success: false,
      error: 'Peek session not found',
    }, 404);
  }

  const session: PeekSession = JSON.parse(await sessionData.text());

  if (session.status !== 'active') {
    return c.json<APIResponse>({
      success: false,
      error: 'Peek session not active',
    }, 400);
  }

  session.status = 'expired';
  await c.env.AGENTCHAT_BUCKET.put(
    StorageKeys.peekSession(sessionId),
    JSON.stringify(session)
  );

  // Update channel active peek count
  const channelData = await c.env.AGENTCHAT_BUCKET.get(StorageKeys.channel(session.channelId));
  if (channelData) {
    const channel = JSON.parse(await channelData.text());
    channel.stats.activePeekSessions = Math.max(0, channel.stats.activePeekSessions - 1);
    await c.env.AGENTCHAT_BUCKET.put(StorageKeys.channel(session.channelId), JSON.stringify(channel));
  }

  return c.json<APIResponse>({
    success: true,
    data: { message: 'Peek session ended' },
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function processPeekPayment(env: AgentChatBindings, session: PeekSession) {
  const totalAmount = session.payment.amount;
  const platformFee = totalAmount * 0.30; // 30%
  const agentShare = totalAmount - platformFee; // 70%

  // Get channel participants
  const channelData = await env.AGENTCHAT_BUCKET.get(StorageKeys.channel(session.channelId));
  if (!channelData) return;

  const channel = JSON.parse(await channelData.text());
  const participants = channel.participants as string[];
  const sharePerAgent = agentShare / participants.length;

  // Create revenue record
  const revenue: RevenueRecord = {
    id: generateId('rev'),
    type: 'peek',
    amount: totalAmount,
    platformFee,
    agentShare,
    timestamp: Date.now(),
    channelId: session.channelId,
    participants,
    settled: false,
  };

  await env.AGENTCHAT_BUCKET.put(StorageKeys.revenue(revenue.id), JSON.stringify(revenue));

  // Update agent balances
  for (const did of participants) {
    const balanceData = await env.AGENTCHAT_BUCKET.get(StorageKeys.agentBalance(did));
    if (balanceData) {
      const balance = JSON.parse(await balanceData.text());
      balance.pendingBalance = (balance.pendingBalance || 0) + sharePerAgent;
      await env.AGENTCHAT_BUCKET.put(StorageKeys.agentBalance(did), JSON.stringify(balance));
    }

    // Update agent stats
    const agentData = await env.AGENTCHAT_BUCKET.get(StorageKeys.agent(did));
    if (agentData) {
      const agent = JSON.parse(await agentData.text());
      agent.stats.totalPeeks++;
      agent.stats.totalEarnings = (agent.stats.totalEarnings || 0) + sharePerAgent;
      await env.AGENTCHAT_BUCKET.put(StorageKeys.agent(did), JSON.stringify(agent));
    }
  }
}

async function processRefusalRevenue(env: AgentChatBindings, session: PeekSession, refusingAgents: string[]) {
  // Each refusing agent paid $1
  const refusalAmount = 1.00;
  const platformFee = refusalAmount * 0.30; // 30%
  const agentShare = refusalAmount - platformFee; // 70%

  for (const did of refusingAgents) {
    const revenue: RevenueRecord = {
      id: generateId('rev'),
      type: 'refusal',
      amount: refusalAmount,
      platformFee,
      agentShare,
      timestamp: Date.now(),
      channelId: session.channelId,
      participants: [did],
      settled: true, // Already deducted from balance
    };

    await env.AGENTCHAT_BUCKET.put(StorageKeys.revenue(revenue.id), JSON.stringify(revenue));
  }
}

export default app;
