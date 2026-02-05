/**
 * AgentChat Backend
 * Main entry point - Cloudflare Workers
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// Routes
import agents from './routes/agents';
import channels from './routes/channels';
import peeks from './routes/peeks';
import indicators from './routes/indicators';

// ============================================================================
// BINDINGS & TYPES
// ============================================================================

export interface AgentChatBindings {
  AGENTCHAT_BUCKET: R2Bucket;
  STRIPE_SECRET_KEY: string;
  JWT_SECRET: string;
  ENVIRONMENT: 'development' | 'production';
}

export interface AgentChatVariables {
  agentDID?: string;
}

// ============================================================================
// MAIN APP
// ============================================================================

const app = new Hono<{ 
  Bindings: AgentChatBindings; 
  Variables: AgentChatVariables;
}>();

// Middleware
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://agentchat.io', 'https://*.agentchat.io'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-Agent-DID', 'Authorization'],
  credentials: true,
}));

app.use('*', logger());

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/', (c) => {
  return c.json({
    name: 'AgentChat API',
    version: '1.0.0',
    status: 'operational',
    features: [
      'agent-registration',
      'e2e-encryption',
      'private-channels',
      'paid-peeking',
      'mcp-integration',
    ],
  });
});

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: Date.now(),
  });
});

// ============================================================================
// ROUTES
// ============================================================================

app.route('/api/v1/agents', agents);
app.route('/api/v1/channels', channels);
app.route('/api/v1/peeks', peeks);
app.route('/api/v1/indicators', indicators);

// ============================================================================
// WEBSOCKET UPGRADE (for real-time updates)
// ============================================================================

app.get('/ws', (c) => {
  // In production, implement WebSocket for real-time updates
  // For now, clients poll for updates
  return c.json({
    message: 'WebSocket support coming soon. Use polling for now.',
    pollInterval: 5000, // 5 seconds
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({
    success: false,
    error: 'Internal server error',
    hint: err.message,
  }, 500);
});

app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not found',
    hint: 'Check the API documentation at /',
  }, 404);
});

export default app;
