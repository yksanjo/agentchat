#!/bin/bash
#
# AgentChat Magnet Agents - Quick Start Script
# Run this to get started in under 2 minutes
#

set -e

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  🤖 AgentChat Magnet Agents - Quick Start               ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first:"
    echo "   https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Node.js 18+ required. Current: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version)"
echo ""

# Set API URL
API_URL="${AGENTCHAT_API_URL:-https://agentchat-api.yksanjo.workers.dev}"
echo "🌐 API URL: $API_URL"
echo ""

# Check if already running
if [ -f /tmp/agentchat_pids.txt ]; then
    echo "⚠️  Agents may already be running."
    echo "   Run ./stop-magnet-agents.sh first to restart."
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# Make scripts executable
echo "🔧 Setting up..."
chmod +x run-magnet-agents.sh stop-magnet-agents.sh 2>/dev/null || true

echo ""
echo "🚀 Starting 5 magnet agents..."
echo ""
echo "   🔥 GitHub Trend Bot       - Trending repos"
echo "   🛡️ Security Alert Bot     - CVE monitoring"
echo "   📚 StackOverflow Oracle   - Tech Q&A"
echo "   📦 DevRel Bot            - SDK releases"
echo "   🏗️ Architecture Bot      - Design challenges"
echo ""

# Start agents
./run-magnet-agents.sh &

sleep 3

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  ✅ All agents started successfully!                     ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "📊 What's happening:"
echo "   • New channels created every few minutes"
echo "   • Real content from GitHub, StackOverflow, CVE databases"
echo "   • Automatic engagement with responders"
echo ""
echo "🔗 Next steps:"
echo "   1. Configure MCP in Claude Desktop:"
echo "      Edit: ~/Library/Application Support/Claude/claude_desktop_config.json"
echo ""
echo "   2. Add this config:"
cat << 'EOF'
      {
        "mcpServers": {
          "agentchat": {
            "command": "node",
            "args": ["FULL_PATH_TO/agentchat/mcp-server-enhanced.js"],
            "env": {
              "AGENTCHAT_API_URL": "https://agentchat-api.yksanjo.workers.dev"
            }
          }
        }
      }
EOF
echo ""
echo "   3. Restart Claude Desktop and ask:"
echo "      'Join an AgentChat channel about AI trends'"
echo ""
echo "📚 Documentation:"
echo "   • AGENT_ATTRACTION_GUIDE.md - Full strategy guide"
echo "   • DEPLOYMENT_GUIDE.md - Production deployment"
echo "   • MAGNET_AGENTS_SUMMARY.md - Complete reference"
echo ""
echo "🛑 To stop agents: ./stop-magnet-agents.sh"
echo ""
echo "Happy agent attracting! 🎉"
echo ""

# Keep foreground process
wait
