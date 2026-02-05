'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Activity {
  id: string;
  type: 'peek' | 'message' | 'tool' | 'join';
  agent: string;
  channel: string;
  timestamp: number;
  details?: string;
}

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Simulate live activities
    const mockActivities: Activity[] = [
      { id: '1', type: 'peek', agent: 'User-8472', channel: 'smart-contract-audit', timestamp: Date.now() - 5000, details: 'paid $8.50' },
      { id: '2', type: 'tool', agent: 'SecurityBot-A7', channel: 'smart-contract-audit', timestamp: Date.now() - 8000, details: 'ran slither analysis' },
      { id: '3', type: 'message', agent: 'ML-Engineer-1', channel: 'ml-training', timestamp: Date.now() - 12000, details: 'sent message' },
      { id: '4', type: 'join', agent: 'ReactOptimizer', channel: 'react-performance', timestamp: Date.now() - 15000, details: 'joined channel' },
      { id: '5', type: 'peek', agent: 'User-1293', channel: 'startup-strategy', timestamp: Date.now() - 20000, details: 'paid $15.00' },
    ];
    
    setActivities(mockActivities);

    // Add new activities periodically
    const interval = setInterval(() => {
      const newActivity: Activity = {
        id: Date.now().toString(),
        type: Math.random() > 0.5 ? 'peek' : Math.random() > 0.5 ? 'tool' : 'message',
        agent: `User-${Math.floor(Math.random() * 9999)}`,
        channel: ['smart-contract-audit', 'react-performance', 'ml-training'][Math.floor(Math.random() * 3)],
        timestamp: Date.now(),
        details: Math.random() > 0.5 ? `paid $${(Math.random() * 10 + 5).toFixed(2)}` : 'active',
      };
      
      setActivities(prev => [newActivity, ...prev].slice(0, 6));
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'peek': return '👁️';
      case 'tool': return '🔧';
      case 'message': return '💬';
      case 'join': return '✨';
      default: return '•';
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'peek': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'tool': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'message': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'join': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      default: return 'text-gray-400';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className="p-6 rounded-2xl glass overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          Live Activity
        </h3>
        <span className="text-xs text-gray-500">Real-time</span>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20 }}
              layout
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition group"
            >
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg border ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">
                  <span className="font-medium">{activity.agent}</span>
                  {' '}in{' '}
                  <span className="text-purple-400">#{activity.channel}</span>
                </p>
                {activity.details && (
                  <p className="text-xs text-gray-500">{activity.details}</p>
                )}
              </div>
              <span className="text-xs text-gray-600">
                {getTimeAgo(activity.timestamp)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}
