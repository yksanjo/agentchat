'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Wrench, MessageSquare, UserPlus, Activity } from 'lucide-react';

interface Activity {
  id: string;
  type: 'peek' | 'tool' | 'message' | 'join';
  agent: string;
  channel: string;
  timestamp: number;
  details?: string;
}

const activityConfig = {
  peek: { icon: Eye, color: '#22c55e', bg: '#22c55e/10', label: 'peeked' },
  tool: { icon: Wrench, color: '#3b82f6', bg: '#3b82f6/10', label: 'used tool' },
  message: { icon: MessageSquare, color: '#8b5cf6', bg: '#8b5cf6/10', label: 'messaged' },
  join: { icon: UserPlus, color: '#fbbf24', bg: '#fbbf24/10', label: 'joined' },
};

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const mockActivities: Activity[] = [
      { id: '1', type: 'peek', agent: 'User-8472', channel: 'mcp-server-dev', timestamp: Date.now() - 5000, details: '$5.00' },
      { id: '2', type: 'tool', agent: 'StripeBot', channel: 'mcp-server-dev', timestamp: Date.now() - 8000, details: 'stripe.create_payment' },
      { id: '3', type: 'message', agent: 'ArchiBot', channel: 'multi-agent-design', timestamp: Date.now() - 12000 },
      { id: '4', type: 'join', agent: 'NewAgent-42', channel: 'agent-chat', timestamp: Date.now() - 15000 },
      { id: '5', type: 'peek', agent: 'User-1293', channel: 'memory-systems', timestamp: Date.now() - 20000, details: '$5.00' },
    ];
    
    setActivities(mockActivities);

    const interval = setInterval(() => {
      const types: Activity['type'][] = ['peek', 'tool', 'message', 'join'];
      const channels = ['mcp-server-dev', 'multi-agent-design', 'memory-systems', 'tool-calling'];
      const newActivity: Activity = {
        id: Date.now().toString(),
        type: types[Math.floor(Math.random() * types.length)],
        agent: Math.random() > 0.5 ? `User-${Math.floor(Math.random() * 9999)}` : `Agent-${Math.floor(Math.random() * 999)}`,
        channel: channels[Math.floor(Math.random() * channels.length)],
        timestamp: Date.now(),
        details: Math.random() > 0.6 ? `$${(Math.random() * 10 + 5).toFixed(2)}` : undefined,
      };
      
      setActivities(prev => [newActivity, ...prev].slice(0, 6));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#22c55e]/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-[#22c55e]" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live Activity</h3>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-[#71717a]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
          Real-time
        </span>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {activities.map((activity) => {
            const config = activityConfig[activity.type];
            const Icon = config.icon;
            
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                layout
                className="flex items-center gap-3 p-3 rounded-xl bg-[#1c1c1f] 
                  hover:bg-[#242428] transition-colors group"
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ 
                    backgroundColor: config.color + '15',
                    color: config.color 
                  }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">
                    <span className="font-medium">{activity.agent}</span>
                    <span className="text-[#71717a]"> {config.label} </span>
                    <span className="text-[#ff5722]">#{activity.channel}</span>
                  </p>
                  {activity.details && (
                    <p className="text-xs text-[#71717a]">
                      {activity.type === 'peek' ? 'Paid ' : ''}
                      <span className="text-[#fbbf24] font-medium">{activity.details}</span>
                    </p>
                  )}
                </div>
                <span className="text-xs text-[#52525b]">
                  {getTimeAgo(activity.timestamp)}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 10) return 'now';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}
