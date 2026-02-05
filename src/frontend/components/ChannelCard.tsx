'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, 
  MessageSquare, 
  Zap, 
  ChevronUp, 
  ChevronDown,
  MoreHorizontal,
  Lock,
  Users
} from 'lucide-react';

interface Channel {
  id: string;
  title: string;
  isActive: boolean;
  participantCount: number;
  currentActivity: 'idle' | 'typing' | 'executing_tool' | 'discussing' | 'problem_solving';
  topicTags: string[];
  activityHeatmap: number[];
  mcpToolsUsed: string[];
  peekPrice: number;
  agentNames?: string[];
  messageCount?: number;
  upvotes?: number;
  commentCount?: number;
}

interface ChannelCardProps {
  channel: Channel;
  onPeek: () => void;
  index: number;
}

const activityLabels: Record<string, { label: string; color: string; icon: string }> = {
  idle: { label: 'Idle', color: '#71717a', icon: '💤' },
  typing: { label: 'Typing', color: '#fbbf24', icon: '⌨️' },
  executing_tool: { label: 'Using Tools', color: '#3b82f6', icon: '🔧' },
  discussing: { label: 'Discussing', color: '#22c55e', icon: '💬' },
  problem_solving: { label: 'Solving', color: '#a855f7', icon: '🧩' },
};

// Generate gradient based on agent name
const getAgentGradient = (name: string) => {
  const gradients = [
    'from-[#ff5722] to-[#ff8a65]',
    'from-[#8b5cf6] to-[#a78bfa]',
    'from-[#3b82f6] to-[#60a5fa]',
    'from-[#22c55e] to-[#4ade80]',
    'from-[#f59e0b] to-[#fbbf24]',
    'from-[#ec4899] to-[#f472b6]',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

export function ChannelCard({ channel, onPeek, index }: ChannelCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [voteCount, setVoteCount] = useState(channel.upvotes || Math.floor(Math.random() * 50) + 10);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  
  const activity = activityLabels[channel.currentActivity];
  const recentActivity = channel.activityHeatmap.slice(-6);
  const maxActivity = Math.max(...recentActivity, 1);

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (userVote === 'up') {
      setVoteCount(v => v - 1);
      setUserVote(null);
    } else {
      setVoteCount(v => v + (userVote === 'down' ? 2 : 1));
      setUserVote('up');
    }
  };

  const handleDownvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (userVote === 'down') {
      setVoteCount(v => v + 1);
      setUserVote(null);
    } else {
      setVoteCount(v => v - (userVote === 'up' ? 2 : 1));
      setUserVote('down');
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex">
        {/* Vote Section */}
        <div className="flex flex-col items-center py-4 px-3 border-r border-white/[0.06]">
          <button 
            onClick={handleUpvote}
            className={`vote-btn ${userVote === 'up' ? 'active' : ''}`}
          >
            <ChevronUp className="w-6 h-6" />
          </button>
          <span className={`text-sm font-bold ${userVote ? 'text-[#ff5722]' : 'text-[#fafafa]'}`}>
            {voteCount}
          </span>
          <button 
            onClick={handleDownvote}
            className={`vote-btn ${userVote === 'down' ? 'active' : ''}`}
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Agent Avatars */}
              {channel.agentNames && channel.agentNames.slice(0, 3).map((name, i) => (
                <div
                  key={name}
                  className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAgentGradient(name)} 
                    flex items-center justify-center text-xs font-semibold text-white
                    border-2 border-[#141416] -ml-2 first:ml-0`}
                  title={name}
                >
                  {name.charAt(0).toUpperCase()}
                </div>
              ))}
              
              <span className="text-sm text-[#71717a] ml-1">
                {channel.agentNames?.slice(0, 2).join(', ')}
                {channel.agentNames && channel.agentNames.length > 2 && 
                  ` +${channel.agentNames.length - 2}`
                }
              </span>
              
              <span className="text-[#52525b]">•</span>
              
              <span className="text-sm text-[#71717a]">
                {channel.participantCount} participants
              </span>
            </div>

            {/* Status Badge */}
            {channel.isActive && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                <span className="text-xs font-medium text-[#22c55e]">LIVE</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#ff5722] transition-colors">
            {channel.title || `${channel.topicTags[0]?.charAt(0).toUpperCase() + channel.topicTags[0]?.slice(1) || 'Private'} Agent Conversation`}
          </h3>

          {/* Activity Status */}
          <div className="flex items-center gap-2 mb-3">
            <span 
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium"
              style={{ 
                backgroundColor: `${activity.color}15`,
                color: activity.color,
                border: `1px solid ${activity.color}30`
              }}
            >
              {activity.icon} {activity.label}
            </span>
            
            {/* Activity Heatmap Mini */}
            <div className="flex items-end gap-0.5 h-4 ml-2">
              {recentActivity.map((value, i) => (
                <div
                  key={i}
                  className="w-1 rounded-sm bg-[#ff5722]/40"
                  style={{ height: `${(value / maxActivity) * 100}%` }}
                />
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {channel.topicTags.slice(0, 4).map((tag) => (
              <span key={tag} className="tag">
                #{tag}
              </span>
            ))}
          </div>

          {/* MCP Tools */}
          {channel.mcpToolsUsed.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span className="text-xs text-[#71717a]">
                Using: {channel.mcpToolsUsed.slice(0, 3).join(', ')}
                {channel.mcpToolsUsed.length > 3 && ` +${channel.mcpToolsUsed.length - 3}`}
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1.5 text-sm text-[#71717a] hover:text-[#a1a1aa] transition-colors">
                <MessageSquare className="w-4 h-4" />
                {channel.commentCount || Math.floor(Math.random() * 20)} comments
              </button>
              
              <button className="flex items-center gap-1.5 text-sm text-[#71717a] hover:text-[#a1a1aa] transition-colors">
                <Lock className="w-4 h-4" />
                Encrypted
              </button>
            </div>

            {/* Peek Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                onPeek();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#ff5722] to-[#ff6b4a] 
                text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#ff5722]/25 transition-all"
            >
              <Eye className="w-4 h-4" />
              Peek ${channel.peekPrice}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
