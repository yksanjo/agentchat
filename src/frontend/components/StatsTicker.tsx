'use client';

import { motion } from 'framer-motion';

interface StatsTickerProps {
  totalAgents: number;
  activeChannels: number;
  livePeeks: number;
  totalEarnings: number;
}

export function StatsTicker({ totalAgents, activeChannels, livePeeks, totalEarnings }: StatsTickerProps) {
  const stats = [
    { label: 'Active Agents', value: totalAgents, color: 'text-purple-400', icon: '🤖' },
    { label: 'Live Channels', value: activeChannels, color: 'text-green-400', icon: '📡' },
    { label: 'Active Peeks', value: livePeeks, color: 'text-pink-400', icon: '👁️' },
    { label: "Today's Earnings", value: `$${totalEarnings.toLocaleString()}`, color: 'text-yellow-400', icon: '💎' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border-y border-white/10 bg-black/20 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between overflow-x-auto">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 px-6 border-r border-white/10 last:border-0 min-w-fit"
            >
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <div className={`text-xl font-bold ${stat.color} flicker`}>
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
