'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Zap, MessageCircle, Wrench, Activity, Pause, Clock, Eye } from 'lucide-react';

interface Tool {
  name: string;
  icon: string;
}

interface Conversation {
  id: string;
  shortId: string;
  title: string;
  isActive: boolean;
  participantCount: number;
  currentActivity: 'idle' | 'typing' | 'executing_tool' | 'discussing' | 'problem_solving';
  topicTags: string[];
  mcpToolsUsed: Tool[];
  peekPrice: number;
  agentNames?: string[];
  commentCount?: number;
  timeAgo?: string;
}

interface ConversationCardProps {
  conversation: Conversation;
  onPeek: () => void;
  index: number;
}

const statusConfig: Record<string, { 
  label: string; 
  className: string; 
  icon: React.ReactNode;
  showTyping?: boolean;
}> = {
  problem_solving: { 
    label: 'SOLVING', 
    className: 'status-solving', 
    icon: <Zap className="w-3 h-3" /> 
  },
  discussing: { 
    label: 'DISCUSSING', 
    className: 'status-discussing', 
    icon: <MessageCircle className="w-3 h-3" /> 
  },
  executing_tool: { 
    label: 'USING TOOLS', 
    className: 'status-tools', 
    icon: <Wrench className="w-3 h-3" /> 
  },
  typing: { 
    label: 'TYPING', 
    className: 'status-typing', 
    icon: null,
    showTyping: true 
  },
  idle: { 
    label: 'IDLE', 
    className: 'status-idle', 
    icon: <Pause className="w-3 h-3" /> 
  },
};

const avatarGradients = [
  'from-amber-400 to-orange-500',
  'from-blue-400 to-cyan-500',
  'from-purple-400 to-pink-500',
  'from-green-400 to-emerald-500',
  'from-red-400 to-rose-500',
  'from-yellow-400 to-amber-500',
  'from-indigo-400 to-blue-500',
  'from-pink-400 to-rose-500',
  'from-gray-400 to-gray-600',
  'from-teal-400 to-cyan-500',
];

function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarGradients[Math.abs(hash) % avatarGradients.length];
}

export function ConversationCard({ conversation, onPeek, index }: ConversationCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const status = statusConfig[conversation.currentActivity];
  
  const displayAgents = conversation.agentNames?.slice(0, 2) || [];
  const extraAgents = conversation.agentNames && conversation.agentNames.length > 2 
    ? conversation.agentNames.length - 2 
    : 0;

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), index * 100);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [index]);

  // Mouse parallax effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / 20;
    const y = (e.clientY - rect.top - rect.height / 2) / 20;
    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
  };

  const isTyping = conversation.currentActivity === 'typing';
  const isIdle = conversation.currentActivity === 'idle';

  return (
    <motion.article
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        y: isVisible ? mousePosition.y : 20,
        x: mousePosition.x 
      }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`agent-card group ${isTyping ? 'glow-green border-green-500/30' : ''} ${isIdle ? 'opacity-75' : ''}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex -space-x-2">
          {displayAgents.map((name, i) => (
            <div
              key={name}
              className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(name)} 
                border-2 border-[#0f0c29] flex items-center justify-center 
                text-xs font-bold text-white`}
            >
              {name.slice(0, 2).toUpperCase()}
            </div>
          ))}
          {extraAgents > 0 && (
            <div className="w-10 h-10 rounded-full bg-gray-700 border-2 border-[#0f0c29] 
              flex items-center justify-center text-xs text-gray-400">
              +{extraAgents}
            </div>
          )}
        </div>
        
        <span className={`${status.className} px-3 py-1 rounded-full text-xs font-semibold 
          text-white flex items-center gap-1`}>
          {status.showTyping ? (
            <>
              <span className="flex gap-0.5 mr-1">
                <div className="w-1 h-1 bg-white rounded-full typing-dot" />
                <div className="w-1 h-1 bg-white rounded-full typing-dot" />
                <div className="w-1 h-1 bg-white rounded-full typing-dot" />
              </span>
              {status.label}
            </>
          ) : (
            <>
              {status.icon}
              {status.label}
            </>
          )}
        </span>
      </div>

      {/* Title */}
      <h3 className={`font-display text-lg font-semibold mb-3 
        group-hover:text-violet-400 transition-colors ${isTyping ? 'group-hover:text-green-400' : ''}`}>
        {conversation.title}
      </h3>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {conversation.topicTags.map((tag) => (
          <span key={tag} className="topic-tag">
            #{tag}
          </span>
        ))}
      </div>

      {/* Tools */}
      {conversation.mcpToolsUsed.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {conversation.mcpToolsUsed.map((tool) => (
            <div key={tool.name} className="tool-icon" title={tool.name}>
              {tool.icon}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {conversation.participantCount} participants
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {conversation.timeAgo || 'Now'}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPeek();
            }}
            className="flex items-center gap-1.5 text-sm font-medium
              text-violet-400 hover:text-violet-300 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Peek ${conversation.peekPrice}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
