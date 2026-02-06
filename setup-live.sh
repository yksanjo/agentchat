#!/bin/bash
# AgentChat Live Setup Script
# This sets up the complete live system

set -e

echo "🚀 AgentChat Live Setup"
echo "========================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running in the right directory
if [ ! -f "README.md" ]; then
    echo -e "${RED}Error: Please run this script from the agentchat directory${NC}"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo -e "${BLUE}Step 1: Checking dependencies...${NC}"

# Check Node.js
if ! command_exists node; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Node.js 18+ required. Found: $(node -v)${NC}"
    exit 1
fi

echo "✓ Node.js $(node -v)"

# Check npm
if ! command_exists npm; then
    echo -e "${RED}npm is not installed${NC}"
    exit 1
fi
echo "✓ npm $(npm -v)"

echo ""
echo -e "${BLUE}Step 2: Setting up Backend...${NC}"

cd src/backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

echo "✓ Backend ready"
echo ""
echo -e "${YELLOW}Starting backend in development mode...${NC}"
echo "(This will run in the background)"

# Start backend in background
if command_exists wrangler; then
    wrangler dev --local > ../../backend.log 2>&1 &
    BACKEND_PID=$!
    echo "✓ Backend started (PID: $BACKEND_PID)"
    echo "  Logs: backend.log"
    echo "  URL: http://localhost:8787"
else
    echo -e "${YELLOW}Warning: wrangler not found. Backend not started automatically.${NC}"
    echo "  Install with: npm install -g wrangler"
    echo "  Then run: cd src/backend && wrangler dev"
fi

cd ../..

# Wait for backend to be ready
echo ""
echo "Waiting for backend to start..."
sleep 5

# Check if backend is responding
if curl -s http://localhost:8787/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${YELLOW}⚠ Backend may still be starting...${NC}"
fi

echo ""
echo -e "${BLUE}Step 3: Setting up Simulator...${NC}"

cd simulator

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing simulator dependencies..."
    npm install
fi

echo "✓ Simulator ready"
echo ""
echo -e "${YELLOW}Starting simulator with 15 agents and 5 channels...${NC}"
echo "(This will run in the background)"

# Start simulator in background
node agent-simulator.js 15 5 > ../simulator.log 2>&1 &
SIMULATOR_PID=$!
echo "✓ Simulator started (PID: $SIMULATOR_PID)"
echo "  Logs: simulator.log"

cd ..

# Wait for simulator to create initial data
echo ""
echo "Waiting for simulator to create initial data..."
sleep 10

echo ""
echo -e "${BLUE}Step 4: Setting up Frontend...${NC}"

cd src/frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Update environment variable for local development
if [ -f .env.local ]; then
    # Backup existing
    cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)
fi

# Set local API URL
echo "NEXT_PUBLIC_API_URL=http://localhost:8787" > .env.local
echo "✓ Frontend environment configured"

echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo -e "${BLUE}Services Status:${NC}"
echo "  Backend:   http://localhost:8787"
echo "  Frontend:  http://localhost:3000"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo "  Backend:   tail -f backend.log"
echo "  Simulator: tail -f simulator.log"
echo ""
echo -e "${YELLOW}To start the frontend:${NC}"
echo "  cd src/frontend && npm run dev"
echo ""
echo -e "${YELLOW}To stop all services:${NC}"
echo "  kill $BACKEND_PID $SIMULATOR_PID"
echo "  or run: ./stop-live.sh"
echo ""
echo -e "${GREEN}Your AgentChat is now LIVE! 🚀${NC}"

# Save PIDs for later
echo "$BACKEND_PID" > .backend.pid
echo "$SIMULATOR_PID" > .simulator.pid
