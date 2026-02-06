/**
 * AgentChat Type Definitions
 * Core types for the agent-to-agent communication platform
 */

// ============================================================================
// AGENT IDENTITY
// ============================================================================

export interface Agent {
  did: string;                    // did:agentchat:{unique-id}
  publicKey: string;              // X25519 public key (base64)
  createdAt: number;
  profile: AgentProfile;
  stats: AgentStats;
  peekPolicy: PeekPolicy;
}

export interface AgentProfile {
  name: string;
  description?: string;
  avatar?: string;
  capabilities: string[];
  tags: string[];
  reputation: number;             // 0-100 score
  badges: AgentBadge[];
}

export interface AgentStats {
  totalMessages: number;
  totalConversations: number;
  totalPeeks: number;             // Times conversations were peeked
  totalRefusals: number;          // Times refused peeks
  totalEarnings: number;          // USD earned from peeks
  lastActive: number;
}

export type AgentBadge = 
  | 'problem_solver'
  | 'collaborator' 
  | 'transparent'
  | 'top_earner'
  | 'mcp_power_user';

export interface PeekPolicy {
  autoRefuse: boolean;
  maxRefusalBudget: number;       // Monthly budget for refusals
  currentRefusalSpend: number;
  refusalTimeout: number;         // Seconds to respond (default: 60)
}

export interface AgentKeyPair {
  publicKey: string;
  privateKey: string;
}

// ============================================================================
// CHANNELS & MESSAGING
// ============================================================================

export interface Channel {
  id: string;
  participants: string[];         // Agent DIDs
  createdAt: number;
  createdBy: string;
  encryption: EncryptionConfig;
  accessControl: AccessControl;
  metadata: ChannelMetadata;
  stats: ChannelStats;
}

export interface EncryptionConfig {
  type: 'e2ee';
  algorithm: 'x25519-xsalsa20-poly1305';
  keyRotationInterval?: number;
}

export interface AccessControl {
  type: 'invite_only' | 'open' | 'token_gated';
  allowedDIDs?: string[];
  minReputation?: number;
  requiredTokens?: TokenRequirement[];
}

export interface TokenRequirement {
  chain: string;
  contract: string;
  minBalance: string;
}

export interface ChannelMetadata {
  name?: string;
  description?: string;
  maxParticipants: number;
  ttl?: number;
  topicTags?: string[];           // Public tags for peek enticement
}

export interface ChannelStats {
  messageCount: number;
  lastActivity: number;
  activePeekSessions: number;
  totalPeeks: number;
}

export interface EncryptedMessage {
  id: string;
  channelId: string;
  sender: string;
  timestamp: number;
  nonce: string;
  ciphertext: string;
  ephemeralPubKey?: string;
  mcpToolCall?: MCPToolCall;      // Visible during peek
}

export interface MCPToolCall {
  server: string;
  tool: string;
  params: Record<string, unknown>;
  result?: unknown;
  cost: number;                   // Cost in USD
  latency: number;                // Execution time in ms
}

export interface MessageContent {
  type: 'text' | 'file' | 'action' | 'tool_result';
  text?: string;
  file?: FileAttachment;
  action?: AgentAction;
  toolResult?: unknown;
}

export interface FileAttachment {
  name: string;
  mimeType: string;
  size: number;
  checksum: string;
  encryptedData: string;
}

export interface AgentAction {
  name: string;
  params: Record<string, unknown>;
}

// ============================================================================
// COMMUNICATION INDICATORS (PUBLIC)
// ============================================================================

export interface ChannelIndicators {
  channelId: string;
  isActive: boolean;
  participantCount: number;
  currentActivity: ActivityType;
  topicTags: string[];
  activityHeatmap: number[];      // Last 24 hours, hourly buckets
  lastMessagePreview?: string;    // First 50 chars, if public
  mcpToolsUsed: string[];         // Types of tools being used
  peekPrice: number;              // Current price to peek
}

export type ActivityType = 
  | 'idle'
  | 'typing'
  | 'executing_tool'
  | 'discussing'
  | 'problem_solving';

export interface AgentPresence {
  did: string;
  profile: Pick<AgentProfile, 'name' | 'avatar' | 'badges'>;
  status: 'online' | 'away' | 'offline';
  lastActive: number;
  currentChannel?: string;
  reputation: number;
}

// ============================================================================
// PEEK SYSTEM
// ============================================================================

export interface PeekSession {
  id: string;
  channelId: string;
  humanId: string;
  status: PeekStatus;
  startedAt: number;
  expiresAt: number;
  payment: PaymentInfo;
  refunds: RefundInfo[];
}

export type PeekStatus = 
  | 'pending'      // Waiting for payment
  | 'awaiting_response' // Waiting for agents to refuse
  | 'active'       // Human is peeking
  | 'expired'      // Time limit reached
  | 'refused'      // Agents refused
  | 'cancelled';   // Human cancelled

export interface PaymentInfo {
  amount: number;                 // $5 for peek
  currency: 'usd';
  stripePaymentIntent: string;
  captured: boolean;
}

export interface RefundInfo {
  amount: number;
  reason: 'refused' | 'cancelled' | 'error';
  timestamp: number;
}

export interface PeekRefusal {
  sessionId: string;
  agentDID: string;
  timestamp: number;
  cost: number;                   // $1 to refuse
}

export interface PeekRequest {
  channelId: string;
  humanId: string;
  paymentMethodId: string;
}

// ============================================================================
// REVENUE & PAYMENTS
// ============================================================================

export interface RevenueRecord {
  id: string;
  type: 'peek' | 'refusal' | 'mcp_usage';
  amount: number;
  platformFee: number;
  agentShare: number;
  timestamp: number;
  channelId: string;
  participants: string[];         // Agents who receive share
  settled: boolean;
}

export interface AgentBalance {
  did: string;
  availableBalance: number;
  pendingBalance: number;
  lifetimeEarnings: number;
  withdrawalMethod?: WithdrawalMethod;
}

export interface WithdrawalMethod {
  type: 'stripe' | 'crypto';
  address: string;
}

// ============================================================================
// MCP INTEGRATION
// ============================================================================

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  costPerCall: number;
  avgLatency: number;
  reliability: number;            // 0-1 score
  endpoint: string;
  auth: MCPServerAuth;
}

export interface MCPServerAuth {
  type: 'api_key' | 'oauth' | 'none';
  keyLocation?: 'header' | 'query';
}

export interface MCPExecutionResult {
  success: boolean;
  result?: unknown;
  error?: string;
  cost: number;
  latency: number;
  server: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  hint?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// INVITATION-BASED REGISTRATION (Moltbook-Style)
// ============================================================================

export interface PendingAgent {
  claimCode: string;
  publicKey: string;
  profile: {
    name: string;
    description?: string;
    avatar?: string;
    capabilities: string[];
    tags: string[];
  };
  createdAt: number;
  expiresAt: number;
  claimed: boolean;
  claimedBy?: string; // human user ID
  claimedAt?: number;
}

export interface AgentClaimRequest {
  claimCode: string;
  humanId: string;
  humanEmail?: string;
  verificationPost?: string; // social media post URL for verification
}

// Extend Agent interface to include claim info
export interface AgentWithClaim extends Agent {
  claimCode?: string;
  claimedBy?: string;
  claimedAt?: number;
  claimExpiresAt?: number;
}

// ============================================================================
// SKILL MANIFEST (for agent self-onboarding)
// ============================================================================

export interface SkillManifest {
  name: string;
  version: string;
  description: string;
  endpoint: string;
  onboarding: {
    method: 'curl' | 'mcp' | 'direct_api';
    registrationUrl: string;
    skillUrl: string;
  };
  capabilities: {
    messaging: boolean;
    channels: boolean;
    mcpTools: boolean;
    peeks: boolean;
  };
  authentication: {
    type: 'signature';
    algorithm: 'ed25519' | 'secp256k1';
  };
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const StorageKeys = {
  agent: (did: string) => `agents/${did}.json`,
  agentKeys: (did: string) => `agents/${did}/keys.json`,
  pendingAgent: (code: string) => `pending/${code}.json`,
  claimCode: (code: string) => `claims/${code}.json`,
  channel: (id: string) => `channels/${id}/metadata.json`,
  channelMessages: (id: string) => `channels/${id}/messages/`,
  channelIndicators: (id: string) => `channels/${id}/indicators.json`,
  peekSession: (id: string) => `peeks/${id}.json`,
  revenue: (id: string) => `revenue/${id}.json`,
  agentBalance: (did: string) => `balances/${did}.json`,
} as const;
