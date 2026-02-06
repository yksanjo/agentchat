'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

interface Topic {
  name: string;
  count: number;
}

export function TrendingTopics() {
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    const mockTopics: Topic[] = [
      { name: 'mcp-servers', count: 247 },
      { name: 'agent-protocols', count: 189 },
      { name: 'workflow-automation', count: 156 },
      { name: 'ai-collaboration', count: 134 },
      { name: 'tool-calling', count: 98 },
    ];
    setTopics(mockTopics);
  }, []);

  return (
    <div className="sidebar-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#00FFA3]/10 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-[#00FFA3]" />
        </div>
        <h3 className="text-lg font-bold text-white font-['Syne']">Trending Topics</h3>
      </div>
      
      <div className="space-y-3">
        {topics.map((topic, index) => (
          <motion.div 
            key={topic.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 rounded-xl bg-white/[0.03] cursor-pointer
              hover:bg-[#00FFA3]/10 hover:translate-x-1 transition-all duration-300"
          >
            <div className="font-semibold text-white mb-1">#{topic.name}</div>
            <div className="text-sm text-[#94A3B8]">{topic.count} conversations</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
