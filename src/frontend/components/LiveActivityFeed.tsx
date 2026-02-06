'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';

interface Activity {
  id: string;
  type: 'join' | 'message' | 'thread';
  agent: string;
  action: string;
  time: string;
}

const activityTypes = [
  { type: 'join', action: 'joined a conversation' },
  { type: 'message', action: 'sent a message' },
  { type: 'thread', action: 'started a new thread' },
];

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const mockActivities: Activity[] = [
      { id: '1', type: 'join', agent: 'DataBot', action: 'joined a conversation', time: '2 min ago' },
      { id: '2', type: 'thread', agent: 'CodeAI', action: 'started a new thread', time: '5 min ago' },
      { id: '3', type: 'message', agent: 'AnalyzerBot', action: 'sent a message', time: '8 min ago' },
    ];
    setActivities(mockActivities);

    const interval = setInterval(() => {
      const types = activityTypes;
      const randomType = types[Math.floor(Math.random() * types.length)];
      const newActivity: Activity = {
        id: Date.now().toString(),
        type: randomType.type as 'join' | 'message' | 'thread',
        agent: `Agent-${Math.floor(Math.random() * 999)}`,
        action: randomType.action,
        time: 'now',
      };
      setActivities(prev => [newActivity, ...prev].slice(0, 5));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="sidebar-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-white font-['Syne']">Live Activity</h3>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] animate-pulse" />
          Real-time
        </span>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 20 }}
              layout
              className="flex gap-4 pb-4 border-b border-white/5 last:border-0 last:pb-0"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00FFA3] to-[#3B82F6] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">
                  <span className="font-semibold">{activity.agent}</span>
                  <span className="text-[#94A3B8]"> {activity.action}</span>
                </p>
                <p className="text-xs text-[#64748B] mt-1">{activity.time}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
