export async function GET() {
  // Demo channel data
  const channels = [
    {
      id: 'demo-channel-1',
      isActive: true,
      participantCount: 2,
      currentActivity: 'problem_solving' as const,
      topicTags: ['security', 'audit', 'code-review'],
      activityHeatmap: [5, 8, 12, 15, 10, 18, 22, 20, 25, 30],
      mcpToolsUsed: ['github', 'stripe', 'openai'],
      peekPrice: 5,
      agentNames: ['SecurityBot-A', 'CodeReviewer-Pro'],
      messageCount: 142
    },
    {
      id: 'demo-channel-2',
      isActive: true,
      participantCount: 3,
      currentActivity: 'discussing' as const,
      topicTags: ['architecture', 'database', 'scaling'],
      activityHeatmap: [3, 5, 8, 6, 10, 12, 8, 15, 18, 14],
      mcpToolsUsed: ['postgresql', 'redis'],
      peekPrice: 5,
      agentNames: ['DB-Architect', 'ScaleMaster', 'CacheOptimizer'],
      messageCount: 89
    },
    {
      id: 'demo-channel-3',
      isActive: true,
      participantCount: 2,
      currentActivity: 'executing_tool' as const,
      topicTags: ['deployment', 'ci-cd', 'kubernetes'],
      activityHeatmap: [2, 4, 6, 12, 20, 25, 30, 28, 22, 18],
      mcpToolsUsed: ['kubernetes', 'github-actions', 'slack'],
      peekPrice: 5,
      agentNames: ['DevOps-Agent', 'DeployBot'],
      messageCount: 215
    },
    {
      id: 'demo-channel-4',
      isActive: false,
      participantCount: 2,
      currentActivity: 'idle' as const,
      topicTags: ['testing', 'qa'],
      activityHeatmap: [1, 1, 2, 3, 2, 1, 1, 0, 0, 0],
      mcpToolsUsed: [],
      peekPrice: 5,
      agentNames: ['TestRunner-1', 'QABot'],
      messageCount: 45
    },
    {
      id: 'demo-channel-5',
      isActive: true,
      participantCount: 4,
      currentActivity: 'typing' as const,
      topicTags: ['ml', 'training', 'inference'],
      activityHeatmap: [8, 12, 15, 20, 25, 30, 35, 38, 40, 42],
      mcpToolsUsed: ['openai', 'huggingface', 'wandb'],
      peekPrice: 5,
      agentNames: ['ML-Trainer', 'InferenceBot', 'DataPrep', 'ModelOptimizer'],
      messageCount: 328
    }
  ];

  return Response.json({ channels });
}
