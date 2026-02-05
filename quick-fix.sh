#!/bin/bash

# AgentChat Quick Fix Script
# Automatically fixes common issues

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                 AGENTCHAT QUICK FIX                           ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}What issue are you having?${NC}"
echo ""
echo "1) Dependencies not installed"
echo "2) Environment variables missing"
echo "3) Wrangler/Vercel not installed"
echo "4) Git repository issues"
echo "5) Backend deployment failed"
echo "6) Frontend deployment failed"
echo "7) Stripe not working"
echo "8) Everything broken - reset all"
echo "9) Just diagnose"
echo ""

read -p "Enter number (1-9): " CHOICE

case $CHOICE in
  1)
    echo -e "${BLUE}Installing dependencies...${NC}"
    cd src/backend && npm install
    cd ../frontend && npm install
    cd ../agent-sdk && npm install
    cd ../..
    echo -e "${GREEN}✓ Dependencies installed${NC}"
    ;;
    
  2)
    echo -e "${BLUE}Setting up environment variables...${NC}"
    
    read -p "Enter Stripe Secret Key (sk_test_...): " STRIPE_SECRET
    read -p "Enter Stripe Publishable Key (pk_test_...): " STRIPE_PUBLISHABLE
    
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
    
    echo -e "${GREEN}✓ Environment variables set${NC}"
    echo -e "${YELLOW}⚠ Don't forget to set secrets in Cloudflare:${NC}"
    echo "  wrangler secret put STRIPE_SECRET_KEY"
    ;;
    
  3)
    echo -e "${BLUE}Installing CLI tools...${NC}"
    npm install -g wrangler vercel
    echo -e "${GREEN}✓ CLI tools installed${NC}"
    echo -e "${YELLOW}⚠ Now login:${NC}"
    echo "  wrangler login"
    echo "  vercel login"
    ;;
    
  4)
    echo -e "${BLUE}Fixing Git repository...${NC}"
    
    if [ ! -d ".git" ]; then
        git init
        git add .
        git commit -m "Initial commit"
    fi
    
    read -p "Enter your GitHub username: " GITHUB_USER
    read -p "Enter repository name [agentchat]: " REPO_NAME
    REPO_NAME=${REPO_NAME:-agentchat}
    
    git remote remove origin 2>/dev/null || true
    git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
    
    echo -e "${GREEN}✓ Git configured${NC}"
    echo -e "${YELLOW}⚠ Now push:${NC}"
    echo "  git push -u origin main"
    ;;
    
  5)
    echo -e "${BLUE}Fixing backend deployment...${NC}"
    cd src/backend
    
    echo "Checking for TypeScript errors..."
    npm run typecheck || echo "TypeScript errors found - fix them first"
    
    echo "Creating R2 bucket if needed..."
    wrangler r2 bucket create agentchat-production 2>/dev/null || echo "Bucket may already exist"
    
    echo "Redeploying..."
    wrangler deploy --env production
    
    cd ../..
    echo -e "${GREEN}✓ Backend redeployed${NC}"
    ;;
    
  6)
    echo -e "${BLUE}Fixing frontend deployment...${NC}"
    cd src/frontend
    
    echo "Building locally first..."
    npm run build || echo "Build failed - check errors above"
    
    echo "Redeploying..."
    vercel --prod
    
    cd ../..
    echo -e "${GREEN}✓ Frontend redeployed${NC}"
    ;;
    
  7)
    echo -e "${BLUE}Fixing Stripe integration...${NC}"
    
    echo "1. Make sure you have a Stripe account: https://stripe.com"
    echo "2. Get API keys from: https://dashboard.stripe.com/apikeys"
    echo ""
    read -p "Enter Stripe Secret Key: " STRIPE_SECRET
    read -p "Enter Stripe Publishable Key: " STRIPE_PUBLISHABLE
    
    # Update files
    cat > src/backend/.env << EOF
STRIPE_SECRET_KEY=$STRIPE_SECRET
JWT_SECRET=$(openssl rand -base64 32)
ENVIRONMENT=production
EOF
    
    cat > src/frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=https://api.agentchat.io
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE
EOF
    
    cd src/backend
    wrangler secret put STRIPE_SECRET_KEY << EOF
$STRIPE_SECRET
EOF
    
    echo -e "${GREEN}✓ Stripe configured${NC}"
    echo -e "${YELLOW}⚠ Redeploy both services:${NC}"
    echo "  cd src/backend && wrangler deploy --env production"
    echo "  cd src/frontend && vercel --prod"
    ;;
    
  8)
    echo -e "${YELLOW}⚠ This will reset everything. Continue? (y/n)${NC}"
    read CONFIRM
    if [ "$CONFIRM" = "y" ]; then
        echo -e "${BLUE}Resetting everything...${NC}"
        
        # Clean dependencies
        rm -rf src/backend/node_modules
        rm -rf src/frontend/node_modules
        rm -rf src/agent-sdk/node_modules
        
        # Reinstall
        cd src/backend && npm install
        cd ../frontend && npm install
        cd ../agent-sdk && npm install
        cd ../..
        
        echo -e "${GREEN}✓ Everything reset and reinstalled${NC}"
        echo -e "${YELLOW}⚠ Now set up environment variables again:${NC}"
        echo "  ./quick-fix.sh"
        echo "  Choose option 2"
    else
        echo "Cancelled"
    fi
    ;;
    
  9)
    ./diagnose.sh
    ;;
    
  *)
    echo "Invalid choice"
    ;;
esac

echo ""
echo "Done! Run ./diagnose.sh to verify everything is working."
