'use client';

import { motion } from 'framer-motion';

interface Agent {
  did: string;
  profile: {
    name: string;
    avatar?: string;
    badges: string[];
  };
  status: 'online' | 'away' | 'offline';
  lastActive: number;
  reputation: number;
  currentChannel?: string;
}

interface AgentPresenceProps {
  agent: Agent;
  rank?: number;
}

const badgeConfig: Record<string, { emoji: string; label: string; color: string }> = {
  problem_solver: { emoji: '🧩', label: 'Problem Solver', color: 'bg-blue-500/20 text-blue-400' },
  collaborator: { emoji: '🤝', label: 'Collaborator', color: 'bg-green-500/20 text-green-400' },
  transparent: { emoji: '🔮', label: 'Transparent', color: 'bg-purple-500/20 text-purple-400' },
  top_earner: { emoji: '💰', label: 'Top Earner', color: 'bg-yellow-500/20 text-yellow-400' },
  mcp_power_user: { emoji: '🔧', label: 'MCP Power User', color: 'bg-cyan-500/20 text-cyan-400' },
};

const statusConfig = {
  online: { color: 'bg-green-500', label: 'Online', glow: 'shadow-green-500/50' },
  away: { color: 'bg-yellow-500', label: 'Away', glow: 'shadow-yellow-500/50' },
  offline: { color: 'bg-gray-500', label: 'Offline', glow: 'shadow-gray-500/50' },
};

export function AgentPresence({ agent, rank }: AgentPresenceProps) {
  const status = statusConfig[agent.status];
  const timeAgo = getTimeAgo(agent.lastActive);

  return (
    <motion.div 
      whileHover={{ scale: 1.02, x: 4 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer group"
    >
      {/* Rank Badge */}
      {rank && (
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
          ${rank === 1 ? 'bg-yellow-500/30 text-yellow-400' : 
            rank === 2 ? 'bg-gray-400/30 text-gray-300' : 
            rank === 3 ? 'bg-orange-600/30 text-orange-400' : 'bg-white/10 text-gray-500'}`}>
          {rank}
        </div>
      )}

      {/* Avatar */}
      <div className="relative">
        {agent.profile.avatar ? (
          <img
            src={agent.profile.avatar}
            alt={agent.profile.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 
                          flex items-center justify-center text-white font-semibold">
            {agent.profile.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${status.color} 
                         border-2 border-slate-900 ${agent.status === 'online' ? 'pulse-ring' : ''}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white truncate group-hover:text-purple-300 transition">
            {agent.profile.name}
          </span>
          {agent.profile.badges.slice(0, 2).map((badge) => (
            <span 
              key={badge} 
              className={`text-xs px-2 py-0.5 rounded-full ${badgeConfig[badge]?.color || 'bg-white/10'}`}
              title={badgeConfig[badge]?.label}
            >
              {badgeConfig[badge]?.emoji}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="text-purple-400">Rep: {agent.reputation}</span>
          <span className="text-gray-600">•</span>
          <span>{timeAgo}</span>
          {agent.currentChannel && (
            <>
              <span className="text-gray-600">•</span>
              <span className="text-green-400">In chat</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
