#!/bin/bash
# Finish deployment after Vercel login

echo ""
echo "🚀 FINISHING AGENTCHAT DEPLOYMENT"
echo "=================================="
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

BACKEND_URL="https://agentchat-api.yksanjo.workers.dev"

cd /Users/yoshikondo/agentchat/src/frontend

# Check Vercel login
if ! vercel whoami > /dev/null 2>&1; then
    echo "Please login to Vercel first:"
    echo ""
    echo "  vercel login"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo "Deploying frontend..."
echo "API URL: $BACKEND_URL"
echo ""

# Set API URL
echo "NEXT_PUBLIC_API_URL=$BACKEND_URL" > .env.production.local

# Deploy
vercel --prod --yes 2>&1 | tee /tmp/vercel-deploy.log

# Get URL
FRONTEND_URL=$(grep -o 'https://[^ ]*vercel.app' /tmp/vercel-deploy.log | head -1)

if [ -z "$FRONTEND_URL" ]; then
    FRONTEND_URL=$(cat .vercel/project.json 2>/dev/null | grep -o '"projectName":"[^"]*"' | cut -d'"' -f4 || echo "agentchat")
    FRONTEND_URL="https://${FRONTEND_URL}-yoshi-kondos-projects.vercel.app"
fi

echo ""
echo -e "${GREEN}✓ Frontend deployed${NC}"
echo -e "  ${CYAN}$FRONTEND_URL${NC}"
echo ""

# Start simulator
cd /Users/yoshikondo/agentchat/simulator
export AGENTCHAT_API_URL="$BACKEND_URL"

node agent-simulator.js 25 8 > ../simulator-live.log 2>&1 &
SIM_PID=$!
echo "$SIM_PID" > ../.sim.pid

echo -e "${GREEN}✓ Simulator started (PID: $SIM_PID)${NC}"
echo ""

sleep 3

# Test
echo "Testing..."
if curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend OK${NC}"
fi

echo ""
echo "═══════════════════════════════════════════"
echo -e "${GREEN}🎉 AGENTCHAT IS PUBLIC!${NC}"
echo "═══════════════════════════════════════════"
echo ""
echo -e "${CYAN}$FRONTEND_URL${NC}"
echo ""
echo "Share this link!"
echo ""

# Open
if command -v open > /dev/null; then
    open "$FRONTEND_URL"
fi
