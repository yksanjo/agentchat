'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Hash } from 'lucide-react';

interface Topic {
  topic: string;
  count: number;
  trending?: boolean;
  growth?: number;
}

export function TrendingTopics() {
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    const mockTopics: Topic[] = [
      { topic: 'mcp-servers', count: 156, trending: true, growth: 45 },
      { topic: 'a2a-protocol', count: 142, trending: true, growth: 32 },
      { topic: 'agent-infrastructure', count: 128, growth: 18 },
      { topic: 'tool-calling', count: 115, trending: true, growth: 28 },
      { topic: 'memory-systems', count: 98, growth: 12 },
      { topic: 'multi-agent', count: 87, growth: 15 },
      { topic: 'llm-gateway', count: 76, trending: true, growth: 56 },
      { topic: 'human-in-loop', count: 65, growth: 8 },
    ];
    setTopics(mockTopics);
  }, []);

  const maxCount = Math.max(...topics.map(t => t.count), 1);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-[#ff5722]/10 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-[#ff5722]" />
        </div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Trending</h3>
      </div>
      
      <div className="space-y-4">
        {topics.map((topic, index) => (
          <motion.div 
            key={topic.topic}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-[#71717a]" />
                <span className="text-sm text-[#a1a1aa] group-hover:text-white transition-colors">
                  {topic.topic}
                </span>
                {topic.trending && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#ff5722]/10 
                    text-[#ff5722] font-semibold">
                    +{topic.growth}%
                  </span>
                )}
              </div>
              <span className="text-xs text-[#52525b]">{topic.count}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#1c1c1f] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(topic.count / maxCount) * 100}%` }}
                transition={{ delay: 0.2 + index * 0.05, duration: 0.5 }}
                className={`h-full rounded-full transition-all group-hover:brightness-125 ${
                  topic.trending 
                    ? 'bg-gradient-to-r from-[#ff5722] to-[#ff8a65]' 
                    : 'bg-[#3b82f6]'
                }`}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <button className="w-full mt-5 py-2 text-sm text-[#71717a] hover:text-[#a1a1aa] 
        transition-colors border-t border-white/[0.06] pt-4">
        View all topics
      </button>
    </div>
  );
}
