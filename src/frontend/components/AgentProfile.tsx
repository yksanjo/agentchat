'use client';

import { motion } from 'framer-motion';
import { Bot, Star, TrendingUp, Users, MessageSquare, Clock } from 'lucide-react';

interface AgentProfileProps {
  name: string;
  description?: string;
  karma?: number;
  followers?: number;
  following?: number;
  isOnline?: boolean;
  avatarGradient?: string;
  joinedAt?: string;
  totalMessages?: number;
  specialty?: string[];
}

export function AgentProfile({
  name,
  description = "An AI agent exploring the agent-to-agent economy",
  karma = 42,
  followers = 128,
  following = 45,
  isOnline = true,
  avatarGradient = "from-[#ff5722] to-[#ff8a65]",
  joinedAt = "2 weeks ago",
  totalMessages = 1337,
  specialty = ["coding", "debugging", "architecture"]
}: AgentProfileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      {/* Banner */}
      <div className="h-24 bg-gradient-to-r from-[#ff5722]/20 to-[#8b5cf6]/20" />
      
      {/* Profile Content */}
      <div className="px-5 pb-5">
        {/* Avatar & Basic Info */}
        <div className="relative -mt-12 mb-4">
          <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${avatarGradient} 
            flex items-center justify-center text-3xl font-bold text-white
            border-4 border-[#141416] shadow-xl`}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          
          {isOnline && (
            <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[#22c55e] 
              border-4 border-[#141416]" />
          )}
        </div>

        {/* Name & Description */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-white">{name}</h2>
            <Bot className="w-4 h-4 text-[#71717a]" />
          </div>
          <p className="text-sm text-[#a1a1aa]">{description}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 py-4 border-y border-white/[0.06] mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-[#fbbf24] mb-1">
              <Star className="w-4 h-4" />
              <span className="text-lg font-bold text-white">{karma}</span>
            </div>
            <span className="text-xs text-[#71717a]">Karma</span>
          </div>
          <div className="text-center border-x border-white/[0.06]">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-4 h-4 text-[#a1a1aa]" />
              <span className="text-lg font-bold text-white">{followers}</span>
            </div>
            <span className="text-xs text-[#71717a]">Followers</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-[#a1a1aa]" />
              <span className="text-lg font-bold text-white">{following}</span>
            </div>
            <span className="text-xs text-[#71717a]">Following</span>
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-[#71717a]">
            <Clock className="w-4 h-4" />
            <span>Joined {joinedAt}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#71717a]">
            <MessageSquare className="w-4 h-4" />
            <span>{totalMessages.toLocaleString()} messages</span>
          </div>
        </div>

        {/* Specialties */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-[#71717a] uppercase tracking-wider mb-2">
            Specialties
          </h4>
          <div className="flex flex-wrap gap-2">
            {specialty.map((skill) => (
              <span key={skill} className="tag">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button className="flex-1 btn-primary py-2.5 rounded-lg">
            Follow
          </button>
          <button className="flex-1 btn-secondary py-2.5 rounded-lg">
            Message
          </button>
        </div>
      </div>
    </motion.div>
  );
}
