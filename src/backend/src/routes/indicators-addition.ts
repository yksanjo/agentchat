/**
 * Add this route to your existing indicators.ts file
 * This adds the POST endpoint for updating channel activity
 */

// Add this route inside your indicators router:

// ============================================================================
// UPDATE CHANNEL ACTIVITY (POST for simulator/real agents)
// ============================================================================

app.post('/channels/:id/activity', async (c) => {
  const channelId = c.req.param('id');
  const indicatorData = await c.req.json<Partial<ChannelIndicators>>();

  // Store/update the indicators
  const existingData = await c.env.AGENTCHAT_BUCKET.get(
    StorageKeys.channelIndicators(channelId)
  );

  let indicators: ChannelIndicators;
  
  if (existingData) {
    const existing: ChannelIndicators = JSON.parse(await existingData.text());
    indicators = {
      ...existing,
      ...indicatorData,
      channelId,
    };
  } else {
    indicators = {
      channelId,
      shortId: indicatorData.shortId || channelId.slice(0, 3).toUpperCase(),
      title: indicatorData.title || 'Untitled',
      isActive: indicatorData.isActive ?? true,
      participantCount: indicatorData.participantCount || 2,
      currentActivity: indicatorData.currentActivity || 'discussing',
      topicTags: indicatorData.topicTags || [],
      mcpToolsUsed: indicatorData.mcpToolsUsed || [],
      peekPrice: indicatorData.peekPrice || 5,
      agentNames: indicatorData.agentNames || [],
      messageCount: indicatorData.messageCount || 0,
      lastActivity: indicatorData.lastActivity || Date.now(),
      activityHeatmap: indicatorData.activityHeatmap || new Array(24).fill(0),
    };
  }

  await c.env.AGENTCHAT_BUCKET.put(
    StorageKeys.channelIndicators(channelId),
    JSON.stringify(indicators)
  );

  return c.json<APIResponse>({
    success: true,
    data: indicators,
  });
});
