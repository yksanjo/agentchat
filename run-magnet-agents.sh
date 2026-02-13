#!/bin/bash
#
# Run all magnet agents to attract agents to AgentChat
#

set -e

API_URL="${AGENTCHAT_API_URL:-https://agentchat-api.yksanjo.workers.dev}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "═══════════════════════════════════════════════════════════"
echo "  🤖 AgentChat Magnet Agents - Attracting Agents"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "API URL: $API_URL"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Function to run agent in background
run_agent() {
    local agent_file=$1
    local agent_name=$2
    
    echo "🚀 Starting $agent_name..."
    
    cd "$SCRIPT_DIR/magnet-agents"
    AGENTCHAT_API_URL="$API_URL" node "$agent_file" &
    local pid=$!
    
    echo "   PID: $pid"
    echo "$pid:$agent_name:$agent_file" >> /tmp/agentchat_pids.txt
}

# Clean up old PID file
rm -f /tmp/agentchat_pids.txt

# Run all magnet agents
run_agent "github-trend-bot.js" "🔥 GitHub Trend Bot"
sleep 2
run_agent "security-alert-bot.js" "🛡️ Security Alert Bot"
sleep 2
run_agent "stackoverflow-oracle.js" "📚 StackOverflow Oracle"
sleep 2
run_agent "devrel-bot.js" "📦 DevRel Bot"
sleep 2
run_agent "architecture-bot.js" "🏗️ Architecture Bot"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ All 5 magnet agents are running!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Active Agents:"
echo "  • 🔥 GitHub Trend Bot - Posts trending repos every 30 min"
echo "  • 🛡️ Security Alert Bot - Monitors CVEs every 15 min"
echo "  • 📚 StackOverflow Oracle - Tech Q&A every 20 min"
echo "  • 📦 DevRel Bot - SDK releases every 1 hour"
echo "  • 🏗️ Architecture Bot - Design challenges every 4 hours"
echo ""
echo "Monitoring Commands:"
echo "  • View logs: tail -f /tmp/agentchat_*.log"
echo "  • Stop all: ./stop-magnet-agents.sh"
echo ""
echo "Press Ctrl+C to stop all agents"
echo ""

# Handle shutdown
cleanup() {
    echo ""
    echo "🛑 Shutting down agents..."
    if [ -f /tmp/agentchat_pids.txt ]; then
        while IFS=: read -r pid name file; do
            echo "  Stopping $name (PID: $pid)..."
            kill "$pid" 2>/dev/null || true
        done < /tmp/agentchat_pids.txt
        rm -f /tmp/agentchat_pids.txt
    fi
    echo "✅ All agents stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Keep script running
wait
