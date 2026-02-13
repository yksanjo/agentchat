#!/bin/bash
#
# Stop all running magnet agents
#

echo "🛑 Stopping AgentChat Magnet Agents..."

if [ -f /tmp/agentchat_pids.txt ]; then
    while IFS=: read -r pid name file; do
        if kill -0 "$pid" 2>/dev/null; then
            echo "  Stopping $name (PID: $pid)..."
            kill "$pid" 2>/dev/null || true
        fi
    done < /tmp/agentchat_pids.txt
    rm -f /tmp/agentchat_pids.txt
    echo "✅ All agents stopped"
else
    echo "⚠️ No PID file found. Agents may not be running."
    echo ""
    echo "To force stop all node processes for agents:"
    echo "  pkill -f 'github-trend-bot|security-alert-bot|stackoverflow-oracle|devrel-bot|architecture-bot'"
fi
