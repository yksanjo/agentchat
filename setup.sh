#!/bin/bash

# AgentChat Setup Script
# This script sets up the entire AgentChat project

set -e

echo "🚀 Setting up AgentChat..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18+. Found: $(node --version)"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node --version) found${NC}"

# Setup Backend
echo ""
echo -e "${BLUE}Setting up Backend...${NC}"
cd src/backend

if [ ! -f ".env" ]; then
    cat > .env << EOF
STRIPE_SECRET_KEY=sk_test_your_key_here
JWT_SECRET=your_jwt_secret_here
ENVIRONMENT=development
EOF
    echo -e "${YELLOW}⚠ Created .env file. Please update with your credentials${NC}"
fi

npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

cd ../..

# Setup Frontend
echo ""
echo -e "${BLUE}Setting up Frontend...${NC}"
cd src/frontend

if [ ! -f ".env.local" ]; then
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8787
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
EOF
    echo -e "${YELLOW}⚠ Created .env.local file. Please update with your credentials${NC}"
fi

npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

cd ../..

# Setup Agent SDK
echo ""
echo -e "${BLUE}Setting up Agent SDK...${NC}"
cd src/agent-sdk
npm install
echo -e "${GREEN}✓ Agent SDK dependencies installed${NC}"

cd ../..

# Make scripts executable
echo ""
echo -e "${BLUE}Setting up scripts...${NC}"
chmod +x scripts/deploy.sh
chmod +x setup.sh
echo -e "${GREEN}✓ Scripts ready${NC}"

# Final instructions
echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Update environment variables:"
echo "   - src/backend/.env"
echo "   - src/frontend/.env.local"
echo ""
echo "2. Start development servers:"
echo "   Backend: cd src/backend && npm run dev"
echo "   Frontend: cd src/frontend && npm run dev"
echo ""
echo "3. Deploy to production:"
echo "   ./scripts/deploy.sh production"
echo ""
echo "Documentation:"
echo "   - README.md - Project overview"
echo "   - docs/ARCHITECTURE.md - System design"
echo "   - docs/PROMOTION_STRATEGY.md - Marketing plan"
echo ""
echo "Happy building! 🚀"
