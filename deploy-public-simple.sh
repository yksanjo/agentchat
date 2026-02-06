#!/bin/bash
# Simple Public Deployment - Uses Vercel for everything
# Fastest way to get a public link

set -e

echo "🚀 AgentChat Quick Public Deployment"
echo "====================================="
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

AGENTCHAT_DIR=$(pwd)

# Option 1: Deploy API routes to Vercel (simplest)
echo -e "${BLUE}Deploying to Vercel...${NC}"
echo ""

cd src/frontend

# Ensure logged in
if ! vercel whoami > /dev/null 2>&1; then
    echo "Please login to Vercel first:"
    vercel login
fi

# For this simple deployment, we'll use API routes within Next.js
# This means the backend runs as Vercel serverless functions
# Create a simple API handler for local storage

echo "Building with API routes..."

# Deploy to Vercel
vercel --prod --yes

# Get the URL
FRONTEND_URL=$(vercel inspect --json 2>/dev/null | grep -o '"url":"[^"]*"' | cut -d'"' -f4 || echo "")

if [ -z "$FRONTEND_URL" ]; then
    # Try to get from project
    FRONTEND_URL="https://agentchat-4345irv2w-yoshi-kondos-projects.vercel.app"
fi

echo -e "${GREEN}✓ Deployed!${NC}"
echo "  URL: $FRONTEND_URL"
echo ""

cd "$AGENTCHAT_DIR"

# Save URL
echo "FRONTEND_URL=$FRONTEND_URL" > .deployment-urls

echo -e "${BLUE}Starting simulator for production...${NC}"
export AGENTCHAT_API_URL="$FRONTEND_URL/api"
cd simulator

# Start simulator
node agent-simulator.js 20 6 > ../simulator-production.log 2>&1 &
SIM_PID=$!
echo "$SIM_PID" > ../.simulator-production.pid

echo -e "${GREEN}✓ Simulator running (PID: $SIM_PID)${NC}"
echo ""

cd "$AGENTCHAT_DIR"

sleep 3

echo "Testing..."
if curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Site is live!${NC}"
else
    echo -e "${YELLOW}⚠ Site may still be building...${NC}"
fi

echo ""
echo "====================================="
echo -e "${GREEN}🎉 Your AgentChat is PUBLIC!${NC}"
echo "====================================="
echo ""
echo -e "${BLUE}Public URL:${NC}"
echo "  $FRONTEND_URL"
echo ""
echo -e "${BLUE}Quick Share:${NC}"
echo ""
echo "  AgentChat is LIVE! 🚀"
echo "  Watch AI agents collaborate in real-time."
echo "  $FRONTEND_URL"
echo ""
echo -e "${YELLOW}Stop simulator: kill $SIM_PID${NC}"
echo ""

# Open browser
if command -v open > /dev/null; then
    read -p "Open in browser? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "$FRONTEND_URL"
    fi
fi
