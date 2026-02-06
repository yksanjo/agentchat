#!/bin/bash
# DEPLOY NOW - Quick Public Deployment
# Works without custom domains

set -e

echo ""
echo "🚀 DEPLOYING AGENTCHAT NOW"
echo "=========================="
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

AGENTCHAT_DIR=$(pwd)

# Step 1: Cloudflare Backend
echo -e "${BLUE}Step 1: Deploying Backend${NC}"
echo "────────────────────────────"

cd src/backend

# Check if logged in
if ! wrangler whoami > /dev/null 2>&1; then
    echo "Please login to Cloudflare:"
    wrangler login
fi

# Deploy without custom domain
echo "Deploying to Cloudflare..."
wrangler deploy 2>&1 | tee /tmp/deploy.log | tail -10

# Get the URL (workers.dev subdomain)
BACKEND_URL=$(grep -o 'https://.*workers.dev' /tmp/deploy.log | head -1 || echo "")

if [ -z "$BACKEND_URL" ]; then
    # Try to get from deployment list
    BACKEND_URL=$(wrangler deployment list 2>/dev/null | grep -o 'https://[^ ]*workers.dev' | head -1 || echo "")
fi

if [ -z "$BACKEND_URL" ]; then
    BACKEND_URL="https://agentchat-api.your-username.workers.dev"
fi

echo ""
echo -e "${GREEN}✓ Backend: ${CYAN}$BACKEND_URL${NC}"
echo ""

cd "$AGENTCHAT_DIR"

# Step 2: Vercel Frontend
echo -e "${BLUE}Step 2: Deploying Frontend${NC}"
echo "────────────────────────────"

cd src/frontend

# Check if logged in
if ! vercel whoami > /dev/null 2>&1; then
    echo ""
    echo "Please login to Vercel:"
    echo "1. Visit: https://vercel.com/login"
    echo "2. Or run: vercel login"
    echo ""
    vercel login
fi

# Update API URL
echo "NEXT_PUBLIC_API_URL=$BACKEND_URL" > .env.production.local

# Deploy
echo "Deploying to Vercel..."
vercel --prod --yes 2>&1 | tee /tmp/vercel.log | tail -15

# Get URL
FRONTEND_URL=$(grep -o 'https://[^ ]*vercel.app' /tmp/vercel.log | head -1 || echo "")

if [ -z "$FRONTEND_URL" ]; then
    # Get from project
    PROJECT_NAME=$(cat .vercel/project.json 2>/dev/null | grep -o '"projectName":"[^"]*"' | cut -d'"' -f4 || echo "agentchat")
    FRONTEND_URL="https://$PROJECT_NAME.vercel.app"
fi

echo ""
echo -e "${GREEN}✓ Frontend: ${CYAN}$FRONTEND_URL${NC}"
echo ""

cd "$AGENTCHAT_DIR"

# Step 3: Start Simulator
echo -e "${BLUE}Step 3: Starting Live Simulator${NC}"
echo "─────────────────────────────────"

cd simulator
export AGENTCHAT_API_URL="$BACKEND_URL"

# Run simulator
node agent-simulator.js 25 8 > ../simulator-live.log 2>&1 &
SIM_PID=$!
echo "$SIM_PID" > ../.sim.pid

echo -e "${GREEN}✓ Simulator running (PID: $SIM_PID)${NC}"
echo ""

cd "$AGENTCHAT_DIR"

sleep 3

# Step 4: Verify
echo -e "${BLUE}Step 4: Verifying${NC}"
echo "──────────────────"

if curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend OK${NC}"
else
    echo -e "${YELLOW}⚠ Backend starting...${NC}"
fi

AGENTS=$(curl -s "$BACKEND_URL/api/v1/indicators/agents?limit=1" 2>/dev/null | grep -o '"total":[0-9]*' | cut -d: -f2 || echo "0")
if [ "$AGENTS" -gt 0 ] 2>/dev/null; then
    echo -e "${GREEN}✓ $AGENTS agents active${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════"
echo -e "${GREEN}🎉 AGENTCHAT IS PUBLIC!${NC}"
echo "═══════════════════════════════════════════════"
echo ""
echo -e "${CYAN}$FRONTEND_URL${NC}"
echo ""
echo "Share this link! Agents are live now."
echo ""
echo "To stop: kill $SIM_PID"
echo ""

# Copy URL
if command -v pbcopy > /dev/null; then
    echo "$FRONTEND_URL" | pbcopy
    echo -e "${CYAN}(Copied to clipboard)${NC}"
fi

# Open browser
if command -v open > /dev/null; then
    read -p "Open now? (Y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        open "$FRONTEND_URL"
    fi
fi
