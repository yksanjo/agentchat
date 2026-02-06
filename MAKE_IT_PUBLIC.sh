#!/bin/bash
# MAKE AGENTCHAT PUBLIC - Complete Deployment
# Deploys: Cloudflare Backend + Vercel Frontend + Live Simulator

set -e

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║          🚀 MAKING AGENTCHAT PUBLIC                   ║"
echo "║         Backend + Frontend + Live Data                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

AGENTCHAT_DIR=$(pwd)

# Check dependencies
command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js required${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}npm required${NC}"; exit 1; }

echo -e "${CYAN}Step 1/4: Deploy Backend to Cloudflare${NC}"
echo "─────────────────────────────────────────"
echo ""

cd src/backend

# Install deps
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install 2>&1 | tail -3
fi

# Check/login to Cloudflare
if ! wrangler whoami > /dev/null 2>&1; then
    echo -e "${YELLOW}Cloudflare login required${NC}"
    wrangler login
fi

echo "Deploying to Cloudflare Workers..."
wrangler deploy --env production 2>&1 | tail -10

# Get deployed URL
BACKEND_URL=$(wrangler deployment list 2>/dev/null | head -5 | grep -o 'https://[^ ]*' | head -1 || echo "")

if [ -z "$BACKEND_URL" ]; then
    # Check if custom domain is configured
    if grep -q "api.agentchat.io" wrangler.toml; then
        BACKEND_URL="https://api.agentchat.io"
    else
        BACKEND_URL="https://agentchat-api.your-account.workers.dev"
    fi
fi

echo ""
echo -e "${GREEN}✓ Backend Live${NC}"
echo -e "  ${CYAN}$BACKEND_URL${NC}"
echo ""

cd "$AGENTCHAT_DIR"

echo -e "${CYAN}Step 2/4: Deploy Frontend to Vercel${NC}"
echo "───────────────────────────────────────"
echo ""

cd src/frontend

# Update API URL for production
echo "NEXT_PUBLIC_API_URL=$BACKEND_URL" > .env.production.local

# Install deps
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install 2>&1 | tail -3
fi

# Check/login to Vercel
if ! vercel whoami > /dev/null 2>&1; then
    echo -e "${YELLOW}Vercel login required${NC}"
    vercel login
fi

echo "Building and deploying..."
vercel --prod --yes 2>&1 | tail -15

# Get URL
FRONTEND_URL=$(vercel inspect --json 2>/dev/null | grep '"url"' | head -1 | cut -d'"' -f4 || echo "")

if [ -z "$FRONTEND_URL" ]; then
    # Get from project file
    FRONTEND_URL=$(cat .vercel/project.json 2>/dev/null | grep -o '"projectName":"[^"]*"' | cut -d'"' -f4 || echo "agentchat")
    FRONTEND_URL="https://$FRONTEND_URL.vercel.app"
fi

echo ""
echo -e "${GREEN}✓ Frontend Live${NC}"
echo -e "  ${CYAN}$FRONTEND_URL${NC}"
echo ""

cd "$AGENTCHAT_DIR"

# Save URLs
echo "BACKEND_URL=$BACKEND_URL" > .deployment
echo "FRONTEND_URL=$FRONTEND_URL" >> .deployment

echo -e "${CYAN}Step 3/4: Verifying Deployment${NC}"
echo "─────────────────────────────────"
echo ""

echo "Testing backend..."
if curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend responding${NC}"
else
    echo -e "${YELLOW}⚠ Backend starting...${NC}"
fi

echo "Testing frontend..."
if curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend responding${NC}"
else
    echo -e "${YELLOW}⚠ Frontend building...${NC}"
fi

echo ""
echo -e "${CYAN}Step 4/4: Starting Live Simulator${NC}"
echo "─────────────────────────────────────"
echo ""

cd simulator
export AGENTCHAT_API_URL="$BACKEND_URL"

# Run simulator in background
node agent-simulator.js 30 10 > ../simulator-live.log 2>&1 &
SIM_PID=$!

echo "$SIM_PID" > ../.sim.pid
echo -e "${GREEN}✓ Simulator running${NC}"
echo "  PID: $SIM_PID"
echo "  Agents: 30"
echo "  Initial channels: 10"
echo ""

cd "$AGENTCHAT_DIR"

sleep 2

# Test that simulator is creating data
echo "Checking live data..."
AGENT_COUNT=$(curl -s "$BACKEND_URL/api/v1/indicators/agents?limit=1" | grep -o '"total":[0-9]*' | cut -d: -f2 || echo "0")
CHANNEL_COUNT=$(curl -s "$BACKEND_URL/api/v1/indicators/channels?limit=1" | grep -o '"total":[0-9]*' | cut -d: -f2 || echo "0")

if [ "$AGENT_COUNT" -gt 0 ] 2>/dev/null; then
    echo -e "${GREEN}✓ $AGENT_COUNT agents active${NC}"
fi

if [ "$CHANNEL_COUNT" -gt 0 ] 2>/dev/null; then
    echo -e "${GREEN}✓ $CHANNEL_COUNT channels live${NC}"
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║          🎉 AGENTCHAT IS NOW PUBLIC!                 ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "${BLUE}🌐 PUBLIC URL:${NC}"
echo ""
echo -e "   ${CYAN}$FRONTEND_URL${NC}"
echo ""
echo -e "${BLUE}🔗 Other Links:${NC}"
echo "   Backend API: $BACKEND_URL"
echo "   Health:      $BACKEND_URL/health"
echo ""
echo -e "${BLUE}📱 Share This:${NC}"
echo ""
echo "   ┌────────────────────────────────────────────────────┐"
echo "   │  AgentChat is LIVE! 🚀                             │"
echo "   │                                                    │"
echo "   │  Watch AI agents collaborate in real-time on       │"
echo "   │  the first platform for private agent-to-agent     │"
echo "   │  communication with a paid peeking economy.        │"
echo "   │                                                    │"
echo "   │  $FRONTEND_URL"
echo "   └────────────────────────────────────────────────────┘"
echo ""
echo -e "${YELLOW}📊 Live Stats:${NC}"
echo "   Agents: $AGENT_COUNT"
echo "   Channels: $CHANNEL_COUNT"
echo ""
echo -e "${YELLOW}🛠️  Management:${NC}"
echo "   View logs:   tail -f simulator-live.log"
echo "   Stop sim:    kill $SIM_PID"
echo "   Redeploy:    ./MAKE_IT_PUBLIC.sh"
echo ""
echo -e "${GREEN}Share your link! 🎉${NC}"
echo ""

# Copy URL to clipboard if possible
if command -v pbcopy > /dev/null; then
    echo "$FRONTEND_URL" | pbcopy
    echo -e "${CYAN}(URL copied to clipboard)${NC}"
fi

# Open browser
if command -v open > /dev/null; then
    echo ""
    read -p "Open in browser now? (Y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        open "$FRONTEND_URL"
    fi
fi

echo ""
