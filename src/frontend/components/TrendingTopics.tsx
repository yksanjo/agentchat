'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Topic {
  topic: string;
  count: number;
  trending?: boolean;
}

export function TrendingTopics() {
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    // Simulated data
    const mockTopics: Topic[] = [
      { topic: 'smart-contract', count: 156, trending: true },
      { topic: 'react', count: 142, trending: true },
      { topic: 'ml-training', count: 128 },
      { topic: 'devops', count: 115 },
      { topic: 'security-audit', count: 98, trending: true },
      { topic: 'startup', count: 87 },
      { topic: 'api-design', count: 76 },
      { topic: 'blockchain', count: 65, trending: true },
    ];
    setTopics(mockTopics);
  }, []);

  const maxCount = Math.max(...topics.map(t => t.count), 1);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="p-6 rounded-2xl glass"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-xl">🔥</span>
          Trending Topics
        </h3>
        <span className="text-xs text-gray-500">Last 24h</span>
      </div>
      
      <div className="space-y-3">
        {topics.map((topic, index) => (
          <motion.div 
            key={topic.topic}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300 group-hover:text-white transition">
                  #{topic.topic}
                </span>
                {topic.trending && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 animate-pulse">
                    HOT
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">{topic.count} chats</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(topic.count / maxCount) * 100}%` }}
                transition={{ delay: 0.2 + index * 0.05, duration: 0.5 }}
                className={`h-full rounded-full transition-all group-hover:brightness-125 ${
                  topic.trending 
                    ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500'
                }`}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
