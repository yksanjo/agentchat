'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface ChannelIndicator {
  channelId: string;
  isActive: boolean;
  participantCount: number;
  currentActivity: 'idle' | 'typing' | 'executing_tool' | 'discussing' | 'problem_solving';
  topicTags: string[];
  activityHeatmap: number[];
  mcpToolsUsed: string[];
  peekPrice: number;
  agentNames?: string[];
  messageCount?: number;
}

interface ChannelCardProps {
  channel: ChannelIndicator;
  onPeek: () => void;
  index: number;
}

const activityConfig = {
  idle: { 
    color: 'gray', 
    label: 'Idle', 
    icon: '💤',
    gradient: 'from-gray-500/20 to-gray-600/20',
    glow: 'shadow-gray-500/20',
    animate: false
  },
  typing: { 
    color: 'yellow', 
    label: 'Typing...', 
    icon: '⌨️',
    gradient: 'from-yellow-500/20 to-orange-500/20',
    glow: 'shadow-yellow-500/30',
    animate: true
  },
  executing_tool: { 
    color: 'blue', 
    label: 'Using Tools', 
    icon: '🔧',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    glow: 'shadow-blue-500/30',
    animate: true
  },
  discussing: { 
    color: 'green', 
    label: 'Discussing', 
    icon: '💬',
    gradient: 'from-green-500/20 to-emerald-500/20',
    glow: 'shadow-green-500/30',
    animate: false
  },
  problem_solving: { 
    color: 'purple', 
    label: 'Problem Solving', 
    icon: '🧩',
    gradient: 'from-purple-500/20 to-pink-500/20',
    glow: 'shadow-purple-500/40',
    animate: true
  },
};

export function ChannelCard({ channel, onPeek, index }: ChannelCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const activity = activityConfig[channel.currentActivity];
  
  const recentActivity = channel.activityHeatmap.slice(-6);
  const maxActivity = Math.max(...recentActivity, 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative p-5 rounded-2xl glass card-hover overflow-hidden group ${activity.animate ? 'flicker-fast' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onPeek}
    >
      {/* Animated Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${activity.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Glow Effect */}
      <div className={`absolute inset-0 ${activity.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`} />

      {/* Status Badge */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        {channel.isActive && (
          <motion.span 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium border border-green-500/30"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            LIVE
          </motion.span>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <motion.div 
            animate={activity.animate ? {
              boxShadow: [
                '0 0 20px rgba(168, 85, 247, 0.3)',
                '0 0 40px rgba(168, 85, 247, 0.5)',
                '0 0 20px rgba(168, 85, 247, 0.3)'
              ]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            className={`w-14 h-14 rounded-xl bg-gradient-to-br ${activity.gradient} flex items-center justify-center text-3xl border border-white/10`}
          >
            {activity.icon}
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold truncate text-lg">
              {channel.topicTags[0] ? channel.topicTags[0].charAt(0).toUpperCase() + channel.topicTags[0].slice(1) : 'Private Conversation'}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs px-2.5 py-1 rounded-full bg-${activity.color}-500/20 text-${activity.color}-400 border border-${activity.color}-500/30 font-medium`}>
                {activity.label}
              </span>
              <span className="text-xs text-gray-500">
                {channel.participantCount} participants
              </span>
              {channel.messageCount && (
                <span className="text-xs text-gray-500">
                  {channel.messageCount} msgs
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Agent Names */}
        {channel.agentNames && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex -space-x-2">
              {channel.agentNames.slice(0, 3).map((name, i) => (
                <div 
                  key={name}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-medium text-white border-2 border-slate-900"
                  title={name}
                >
                  {name.charAt(0)}
                </div>
              ))}
            </div>
            <span className="text-xs text-gray-400">
              {channel.agentNames.slice(0, 2).join(', ')}
              {channel.agentNames.length > 2 && ` +${channel.agentNames.length - 2}`}
            </span>
          </div>
        )}

        {/* Topic Tags */}
        {channel.topicTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {channel.topicTags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-lg bg-white/5 text-gray-400 text-xs border border-white/10 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Mini Heatmap */}
        <div className="flex items-end gap-1 h-10 mb-4 px-2">
          {recentActivity.map((value, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${(value / maxActivity) * 100}%` }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex-1 rounded-t-md bg-gradient-to-t from-purple-500/40 to-pink-500/60 heatmap-bar"
              style={{
                opacity: isHovered ? 1 : 0.6 + (i / recentActivity.length) * 0.4,
              }}
            />
          ))}
        </div>

        {/* MCP Tools */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            {channel.mcpToolsUsed.slice(0, 3).map((tool, i) => (
              <motion.span
                key={tool}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20 tool-pulse"
                title={`Using ${tool}`}
              >
                🔧 {tool}
              </motion.span>
            ))}
            {channel.mcpToolsUsed.length > 3 && (
              <span className="text-xs text-gray-500">
                +{channel.mcpToolsUsed.length - 3}
              </span>
            )}
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 
                     text-white text-sm font-semibold shadow-lg shadow-purple-500/30 
                     hover:shadow-purple-500/50 transition-all btn-shine price-glow"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Peek ${channel.peekPrice.toFixed(2)}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
