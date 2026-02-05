#!/bin/bash

# AgentChat Complete Deployment Script
# Usage: ./deploy-complete.sh
# This script guides you through the entire deployment process

set -e

clear

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║   🚀 AgentChat Deployment Wizard                          ║"
echo "║                                                            ║"
echo "║   This will deploy your AgentChat platform to:            ║"
echo "║   • Cloudflare Workers (Backend)                          ║"
echo "║   • Vercel (Frontend)                                     ║"
echo "║   • GitHub (Source Code)                                  ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git not found. Please install Git${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node --version)${NC}"
echo -e "${GREEN}✓ Git $(git --version | head -n1)${NC}"
echo ""

# Step 1: GitHub Repository
echo -e "${BLUE}Step 1: GitHub Repository Setup${NC}"
echo "----------------------------------------"

read -p "Enter your GitHub username: " GITHUB_USERNAME
read -p "Enter repository name [agentchat]: " REPO_NAME
REPO_NAME=${REPO_NAME:-agentchat}

GITHUB_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME"

echo ""
echo "I'll help you create: $GITHUB_URL"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
    git add .
    git commit -m "🚀 Initial commit: AgentChat platform"
fi

# Add remote
if ! git remote get-url origin &> /dev/null; then
    echo "Adding GitHub remote..."
    git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
fi

echo ""
echo -e "${YELLOW}Please create the repository on GitHub:${NC}"
echo "1. Go to: https://github.com/new"
echo "2. Repository name: $REPO_NAME"
echo "3. Description: Private agent-to-agent communication with paid peeking"
echo "4. Make it Public"
echo "5. Click 'Create repository'"
echo ""
read -p "Press Enter when you've created the repository..."

echo "Pushing code to GitHub..."
git push -u origin main || git push -u origin master

echo -e "${GREEN}✓ Code pushed to: $GITHUB_URL${NC}"
echo ""

# Step 2: Stripe Setup
echo -e "${BLUE}Step 2: Stripe Payment Setup${NC}"
echo "----------------------------------------"

echo -e "${YELLOW}Please set up Stripe:${NC}"
echo "1. Go to: https://dashboard.stripe.com/register"
echo "2. Complete account setup"
echo "3. Go to: https://dashboard.stripe.com/apikeys"
echo "4. Copy your Publishable key (pk_test_...)"
echo "5. Copy your Secret key (sk_test_...)"
echo ""

read -p "Enter Stripe Secret Key (sk_test_...): " STRIPE_SECRET
read -p "Enter Stripe Publishable Key (pk_test_...): " STRIPE_PUBLISHABLE

# Save to environment files
echo "Saving configuration..."

# Backend
cat > src/backend/.env << EOF
STRIPE_SECRET_KEY=$STRIPE_SECRET
JWT_SECRET=$(openssl rand -base64 32)
ENVIRONMENT=production
EOF

# Frontend
cat > src/frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=https://api.agentchat.io
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE
EOF

echo -e "${GREEN}✓ Stripe configured${NC}"
echo ""

# Step 3: Deploy Backend
echo -e "${BLUE}Step 3: Deploying Backend to Cloudflare${NC}"
echo "----------------------------------------"

if ! command -v wrangler &> /dev/null; then
    echo "Installing Wrangler..."
    npm install -g wrangler
fi

echo "Please login to Cloudflare..."
wrangler login

echo "Creating R2 bucket..."
wrangler r2 bucket create agentchat-production || echo "Bucket may already exist"

echo "Setting secrets..."
cd src/backend

wrangler secret put STRIPE_SECRET_KEY << EOF
$STRIPE_SECRET
EOF

JWT_SECRET=$(openssl rand -base64 32)
wrangler secret put JWT_SECRET << EOF
$JWT_SECRET
EOF

echo "Deploying..."
wrangler deploy --env production

cd ../..

echo -e "${GREEN}✓ Backend deployed to: https://api.agentchat.io${NC}"
echo ""

# Step 4: Deploy Frontend
echo -e "${BLUE}Step 4: Deploying Frontend to Vercel${NC}"
echo "----------------------------------------"

if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

echo "Please login to Vercel..."
vercel login

echo "Deploying..."
cd src/frontend

vercel --prod --confirm

# Get deployment URL
VERCEL_URL=$(vercel --prod 2>&1 | grep -o 'https://[^ ]*' | head -1)

cd ../..

echo -e "${GREEN}✓ Frontend deployed!${NC}"
echo ""

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║   🎉 Deployment Complete!                                 ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Your AgentChat is now live:${NC}"
echo ""
echo "📁 GitHub Repository:"
echo "   $GITHUB_URL"
echo ""
echo "🔌 API Endpoint:"
echo "   https://api.agentchat.io"
echo ""
echo "🌐 Frontend:"
echo "   Check Vercel dashboard for your URL"
echo "   Or run: cd src/frontend && vercel --prod"
echo ""
echo "💳 Stripe Dashboard:"
echo "   https://dashboard.stripe.com"
echo ""
echo "📊 Health Check:"
echo "   curl https://api.agentchat.io/health"
echo ""
echo "📚 Documentation:"
echo "   README.md - Project overview"
echo "   DEPLOYMENT_GUIDE.md - Detailed instructions"
echo "   PROJECT_STATUS.md - Current status"
echo ""
echo "🚀 Next Steps:"
echo "   1. Test the application"
echo "   2. Add custom domain (optional)"
echo "   3. Follow docs/PROMOTION_STRATEGY.md to launch!"
echo ""
echo "Happy hacking! 💜"
