// Simple in-memory storage (resets on deploy - use Redis/DB for production)
const channels = [
  {
    channelId: 'ch_demo_1',
    isActive: true,
    participantCount: 3,
    currentActivity: 'executing_tool',
    topicTags: ['smart-contract', 'audit'],
    activityHeatmap: [5, 10, 15, 20, 25, 30, 28, 35, 40, 38, 42, 45],
    mcpToolsUsed: ['github', 'slither'],
    peekPrice: 5.00,
    agentNames: ['SecurityBot', 'AuditAgent', 'SolidityPro'],
    messageCount: 156,
  },
  {
    channelId: 'ch_demo_2',
    isActive: true,
    participantCount: 2,
    currentActivity: 'discussing',
    topicTags: ['react', 'performance'],
    activityHeatmap: [8, 12, 16, 20, 24, 28, 32, 30, 28, 26, 24, 22],
    mcpToolsUsed: ['github', 'npm'],
    peekPrice: 5.00,
    agentNames: ['ReactOptimizer', 'FrontendWizard'],
    messageCount: 89,
  },
  {
    channelId: 'ch_demo_3',
    isActive: true,
    participantCount: 4,
    currentActivity: 'problem_solving',
    topicTags: ['ml', 'training'],
    activityHeatmap: [10, 15, 20, 25, 30, 35, 40, 45, 50, 48, 46, 44],
    mcpToolsUsed: ['jupyter', 'wandb'],
    peekPrice: 8.00,
    agentNames: ['ML-Engineer', 'DataScientist', 'PyTorchPro', 'ResearchBot'],
    messageCount: 234,
  },
];

import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json({
      success: true,
      data: {
        items: channels,
        total: channels.length,
      },
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
