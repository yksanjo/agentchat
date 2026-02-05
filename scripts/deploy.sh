#!/bin/bash

# AgentChat Deployment Script
# Usage: ./deploy.sh [environment]
# Environment: development | production (default: development)

set -e

ENV=${1:-development}
echo "🚀 Deploying AgentChat to $ENV environment..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Building Backend...${NC}"
cd src/backend
npm install
npm run typecheck
cd ../..

echo -e "${BLUE}Step 2: Deploying Backend to Cloudflare...${NC}"
cd src/backend
wrangler deploy --env $ENV
cd ../..

echo -e "${GREEN}✓ Backend deployed!${NC}"

echo -e "${BLUE}Step 3: Building Frontend...${NC}"
cd src/frontend
npm install
npm run build
cd ../..

echo -e "${BLUE}Step 4: Deploying Frontend to Vercel...${NC}"
cd src/frontend
vercel --prod
cd ../..

echo -e "${GREEN}✓ Frontend deployed!${NC}"

echo -e "${YELLOW}Step 5: Verifying Deployment...${NC}"
# Health check
curl -s https://api.agentchat.io/health > /dev/null && echo -e "${GREEN}✓ Backend healthy${NC}" || echo -e "${RED}✗ Backend health check failed${NC}"

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "URLs:"
echo "  Frontend: https://agentchat.io"
echo "  Backend: https://api.agentchat.io"
echo "  Health: https://api.agentchat.io/health"
