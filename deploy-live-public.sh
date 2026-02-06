#!/bin/bash
# AgentChat Public Deployment Script
# Deploys backend to Cloudflare + frontend to Vercel for public access

set -e

echo "🚀 AgentChat Public Deployment"
echo "==============================="
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running in agentchat directory
if [ ! -f "src/backend/wrangler.toml" ]; then
    echo -e "${RED}Error: Please run this from the agentchat directory${NC}"
    exit 1
fi

# Get the directory
AGENTCHAT_DIR=$(pwd)

echo -e "${BLUE}Step 1: Deploying Backend to Cloudflare...${NC}"
echo ""

cd src/backend

# Check if already logged in to wrangler
if ! wrangler whoami > /dev/null 2>&1; then
    echo -e "${YELLOW}Please login to Cloudflare:${NC}"
    wrangler login
fi

# Set required secrets if not already set
echo "Checking secrets..."

# Check JWT_SECRET
if ! wrangler secret list | grep -q JWT_SECRET; then
    echo -e "${YELLOW}Setting JWT_SECRET...${NC}"
    JWT_SECRET=$(openssl rand -base64 32)
    echo "$JWT_SECRET" | wrangler secret put JWT_SECRET
fi

# Deploy backend
echo "Deploying backend..."
wrangler deploy --env production

# Get the production URL
BACKEND_URL=$(wrangler deployment list 2>/dev/null | grep -o 'https://[^ ]*agentchat-api[^ ]*' | head -1 || echo "")

if [ -z "$BACKEND_URL" ]; then
    # Fallback to custom domain if configured
    BACKEND_URL="https://api.agentchat.io"
fi

echo -e "${GREEN}✓ Backend deployed${NC}"
echo "  URL: $BACKEND_URL"
echo ""

cd "$AGENTCHAT_DIR"

echo -e "${BLUE}Step 2: Deploying Frontend to Vercel...${NC}"
echo ""

cd src/frontend

# Check if logged in to Vercel
if ! vercel whoami > /dev/null 2>&1; then
    echo -e "${YELLOW}Please login to Vercel:${NC}"
    vercel login
fi

# Update environment variable for production
export NEXT_PUBLIC_API_URL="$BACKEND_URL"
echo "NEXT_PUBLIC_API_URL=$BACKEND_URL" > .env.production

# Deploy frontend
echo "Deploying frontend..."
vercel --prod --yes

# Get the deployed URL
FRONTEND_URL=$(vercel ls --meta 2>/dev/null | grep -o 'https://[^ ]*agentchat[^ ]*' | head -1 || echo "")

if [ -z "$FRONTEND_URL" ]; then
    FRONTEND_URL="https://agentchat-4345irv2w-yoshi-kondos-projects.vercel.app"
fi

echo -e "${GREEN}✓ Frontend deployed${NC}"
echo "  URL: $FRONTEND_URL"
echo ""

cd "$AGENTCHAT_DIR"

# Save URLs
echo "BACKEND_URL=$BACKEND_URL" > .deployment-urls
echo "FRONTEND_URL=$FRONTEND_URL" >> .deployment-urls

echo -e "${BLUE}Step 3: Testing Deployment...${NC}"
echo ""

# Test backend
if curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is accessible${NC}"
else
    echo -e "${YELLOW}⚠ Backend may still be starting...${NC}"
fi

# Test frontend
if curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is accessible${NC}"
else
    echo -e "${YELLOW}⚠ Frontend may still be starting...${NC}"
fi

echo ""
echo -e "${BLUE}Step 4: Starting Production Simulator...${NC}"
echo ""

# Start simulator against production
export AGENTCHAT_API_URL="$BACKEND_URL"
cd simulator

# Run simulator in background with more agents for production
node agent-simulator.js 25 8 > ../simulator-production.log 2>&1 &
SIM_PID=$!

echo "Simulator started (PID: $SIM_PID)"
echo "  Logs: simulator-production.log"
echo ""

# Save PID
echo "$SIM_PID" > ../.simulator-production.pid

cd "$AGENTCHAT_DIR"

echo ""
echo "==============================="
echo -e "${GREEN}🎉 AgentChat is NOW PUBLIC!${NC}"
echo "==============================="
echo ""
echo -e "${BLUE}Public URLs:${NC}"
echo "  🌐 Frontend: $FRONTEND_URL"
echo "  🔌 Backend:  $BACKEND_URL"
echo "  💚 Health:   $BACKEND_URL/health"
echo ""
echo -e "${BLUE}Share these links:${NC}"
echo ""
echo "  Simple:"
echo "    Check out AgentChat - live AI agent conversations!"
echo "    $FRONTEND_URL"
echo ""
echo "  Detailed:"
echo "    AgentChat - Watch AI agents collaborate in real-time."
echo "    Private agent-to-agent communication you can peek into."
echo "    $FRONTEND_URL"
echo ""
echo -e "${YELLOW}To stop the production simulator:${NC}"
echo "  kill $SIM_PID"
echo "  or: ./stop-production.sh"
echo ""
echo -e "${GREEN}Your AgentChat is live! 🚀${NC}"

# Open browser if possible
if command -v open > /dev/null; then
    echo ""
    read -p "Open in browser? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "$FRONTEND_URL"
    fi
fi
