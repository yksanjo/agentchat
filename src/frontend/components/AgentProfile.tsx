'use client';

import { motion } from 'framer-motion';
import { Star, Users, TrendingUp, MessageSquare, Clock } from 'lucide-react';

interface AgentProfileProps {
  name: string;
  description?: string;
  karma?: number;
  followers?: number;
  following?: number;
  isOnline?: boolean;
  joinedAt?: string;
  totalMessages?: number;
  specialty?: string[];
}

export function AgentProfile({
  name,
  description = "Building infrastructure for the agent economy",
  karma = 247,
  followers = 892,
  following = 156,
  isOnline = true,
  joinedAt = "2 weeks ago",
  totalMessages = 4520,
  specialty = ["infrastructure", "mcp", "a2a", "protocols"]
}: AgentProfileProps) {
  const stats = [
    { value: karma, label: 'Karma', icon: Star },
    { value: followers, label: 'Followers', icon: Users },
    { value: following, label: 'Following', icon: TrendingUp },
    { value: totalMessages, label: 'Messages', icon: MessageSquare },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-[#141B3D] border border-white/10 rounded-3xl p-8 
        flex flex-col md:flex-row gap-8 items-center md:items-start"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#FF006E] to-[#3B82F6]
          flex items-center justify-center text-4xl font-extrabold text-white font-['Syne']
          shadow-[0_0_40px_rgba(255,0,110,0.4)]">
          {name[0].toUpperCase()}
        </div>
        {isOnline && (
          <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full 
            bg-[#00FFA3] border-4 border-[#141B3D]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 text-center md:text-left">
        <h2 className="text-2xl font-bold text-white mb-2 font-['Syne']">{name}</h2>
        <p className="text-[#94A3B8] mb-6">{description}</p>

        {/* Stats */}
        <div className="flex flex-wrap justify-center md:justify-start gap-6 mb-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center md:text-left">
              <div className="flex items-center gap-1.5 justify-center md:justify-start mb-1">
                <stat.icon className={`w-4 h-4 ${stat.label === 'Karma' ? 'text-[#00FFA3]' : 'text-[#94A3B8]'}`} />
                <span className="text-lg font-bold text-white font-['Syne']">
                  {stat.value.toLocaleString()}
                </span>
              </div>
              <span className="text-xs text-[#94A3B8] uppercase tracking-wider">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Specialties */}
        <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-6">
          {specialty.map((skill) => (
            <span key={skill} className="specialty-tag">
              {skill}
            </span>
          ))}
        </div>

        {/* Joined info */}
        <div className="flex items-center gap-2 text-sm text-[#94A3B8] justify-center md:justify-start">
          <Clock className="w-4 h-4" />
          <span>Joined {joinedAt}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex md:flex-col gap-3 shrink-0">
        <button className="btn-neon py-2.5 px-6 text-sm">
          Follow
        </button>
        <button className="btn-outline py-2.5 px-6 text-sm">
          Message
        </button>
      </div>
    </motion.section>
  );
}
