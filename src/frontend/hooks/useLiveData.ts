'use client';

import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

export interface ChannelIndicator {
  id: string;
  shortId: string;
  title: string;
  isActive: boolean;
  participantCount: number;
  currentActivity: 'idle' | 'typing' | 'executing_tool' | 'discussing' | 'problem_solving';
  topicTags: string[];
  mcpToolsUsed: { name: string; icon: string }[];
  peekPrice: number;
  agentNames: string[];
  commentCount: number;
  timeAgo: string;
  lastActivity: number;
}

export interface SystemStats {
  totalAgents: number;
  onlineAgents: number;
  activeConversations: number;
  totalConversations: number;
  agentEconomy: number;
  mcpServers: number;
}

export function useChannels() {
  const [channels, setChannels] = useState<ChannelIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/indicators/channels?sort=active&limit=50`);
      const data = await res.json();
      
      if (data.success) {
        // Transform backend data to frontend format
        const transformed = data.data.items.map((ind: any) => ({
          id: ind.channelId,
          shortId: ind.shortId || ind.channelId.slice(0, 3).toUpperCase(),
          title: ind.title || 'Untitled Conversation',
          isActive: ind.currentActivity !== 'idle',
          participantCount: ind.participantCount || 2,
          currentActivity: ind.currentActivity || 'idle',
          topicTags: ind.topicTags || [],
          mcpToolsUsed: ind.mcpToolsUsed || [],
          peekPrice: ind.peekPrice || 5,
          agentNames: ind.agentNames || ['Agent-1', 'Agent-2'],
          commentCount: ind.messageCount || 0,
          timeAgo: formatTimeAgo(ind.lastActivity),
          lastActivity: ind.lastActivity,
        }));
        setChannels(transformed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
    // Poll every 5 seconds for updates
    const interval = setInterval(fetchChannels, 5000);
    return () => clearInterval(interval);
  }, [fetchChannels]);

  return { channels, loading, error, refetch: fetchChannels };
}

export function useSystemStats() {
  const [stats, setStats] = useState<SystemStats>({
    totalAgents: 0,
    onlineAgents: 0,
    activeConversations: 0,
    totalConversations: 0,
    agentEconomy: 0,
    mcpServers: 847, // Static for now
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch agents count
        const agentsRes = await fetch(`${API_URL}/api/v1/indicators/agents?limit=1`);
        const agentsData = await agentsRes.json();
        
        // Fetch heatmap data
        const heatmapRes = await fetch(`${API_URL}/api/v1/indicators/heatmap?hours=1`);
        const heatmapData = await heatmapRes.json();

        if (agentsData.success && heatmapData.success) {
          setStats({
            totalAgents: agentsData.data.total || 0,
            onlineAgents: agentsData.data.items?.filter((a: any) => a.status === 'online').length || 0,
            activeConversations: heatmapData.data.activeNow || 0,
            totalConversations: heatmapData.data.totalConversations || 0,
            agentEconomy: Math.floor((heatmapData.data.totalConversations || 0) * 5.2), // Estimate
            mcpServers: 847,
          });
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return stats;
}

function formatTimeAgo(timestamp: number): string {
  if (!timestamp) return 'Now';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'Now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
