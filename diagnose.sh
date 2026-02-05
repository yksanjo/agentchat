#!/bin/bash

# AgentChat Diagnostic Script
# This script checks what's working and what's not

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                 AGENTCHAT DIAGNOSTIC                          ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ISSUES=0

# Function to check command
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is NOT installed"
        ISSUES=$((ISSUES + 1))
        return 1
    fi
}

# Function to check URL
check_url() {
    local url=$1
    local name=$2
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓${NC} $name is accessible ($url)"
        return 0
    else
        echo -e "${RED}✗${NC} $name returned HTTP $response ($url)"
        ISSUES=$((ISSUES + 1))
        return 1
    fi
}

# Function to check file
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2 exists"
        return 0
    else
        echo -e "${RED}✗${NC} $2 is MISSING"
        ISSUES=$((ISSUES + 1))
        return 1
    fi
}

echo -e "${BLUE}Checking Prerequisites...${NC}"
echo "─────────────────────────────────────────────────────────────────"

check_command node
check_command npm
check_command git

echo ""
echo -e "${BLUE}Checking CLI Tools...${NC}"
echo "─────────────────────────────────────────────────────────────────"

check_command wrangler
check_command vercel

echo ""
echo -e "${BLUE}Checking Project Structure...${NC}"
echo "─────────────────────────────────────────────────────────────────"

check_file "src/backend/package.json" "Backend package.json"
check_file "src/frontend/package.json" "Frontend package.json"
check_file "src/backend/src/index.ts" "Backend main file"
check_file "src/frontend/app/page.tsx" "Frontend main file"

echo ""
echo -e "${BLUE}Checking Environment Variables...${NC}"
echo "─────────────────────────────────────────────────────────────────"

if [ -f "src/backend/.env" ]; then
    echo -e "${GREEN}✓${NC} Backend .env exists"
    if grep -q "STRIPE_SECRET_KEY" src/backend/.env; then
        echo -e "${GREEN}✓${NC} STRIPE_SECRET_KEY is set"
    else
        echo -e "${RED}✗${NC} STRIPE_SECRET_KEY is NOT set in backend .env"
        ISSUES=$((ISSUES + 1))
    fi
else
    echo -e "${YELLOW}⚠${NC} Backend .env does NOT exist (create it)"
    ISSUES=$((ISSUES + 1))
fi

if [ -f "src/frontend/.env.local" ]; then
    echo -e "${GREEN}✓${NC} Frontend .env.local exists"
    if grep -q "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" src/frontend/.env.local; then
        echo -e "${GREEN}✓${NC} NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set"
    else
        echo -e "${RED}✗${NC} NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is NOT set"
        ISSUES=$((ISSUES + 1))
    fi
else
    echo -e "${YELLOW}⚠${NC} Frontend .env.local does NOT exist (create it)"
    ISSUES=$((ISSUES + 1))
fi

echo ""
echo -e "${BLUE}Checking Deployments...${NC}"
echo "─────────────────────────────────────────────────────────────────"

# Try to check if backend is deployed
echo "Checking if backend is deployed..."
if curl -s "https://api.agentchat.io/health" > /dev/null 2>&1; then
    response=$(curl -s "https://api.agentchat.io/health" 2>/dev/null)
    if echo "$response" | grep -q "healthy"; then
        echo -e "${GREEN}✓${NC} Backend is deployed and healthy"
    else
        echo -e "${YELLOW}⚠${NC} Backend responded but may have issues"
    fi
else
    echo -e "${YELLOW}⚠${NC} Backend not accessible (or not deployed yet)"
fi

# Try to check if frontend is deployed
echo "Checking if frontend is deployed..."
if curl -s -o /dev/null -w "%{http_code}" "https://agentchat.io" 2>/dev/null | grep -q "200"; then
    echo -e "${GREEN}✓${NC} Frontend is deployed"
else
    echo -e "${YELLOW}⚠${NC} Frontend not accessible (or not deployed yet)"
fi

echo ""
echo -e "${BLUE}Checking GitHub Repository...${NC}"
echo "─────────────────────────────────────────────────────────────────"

if [ -d ".git" ]; then
    echo -e "${GREEN}✓${NC} Git repository initialized"
    
    REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
    if [ -n "$REMOTE" ]; then
        echo -e "${GREEN}✓${NC} Git remote configured: $REMOTE"
    else
        echo -e "${YELLOW}⚠${NC} Git remote not configured"
    fi
    
    if git log --oneline -1 > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Git commits exist"
    else
        echo -e "${YELLOW}⚠${NC} No git commits yet"
    fi
else
    echo -e "${YELLOW}⚠${NC} Git repository not initialized"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"

if [ $ISSUES -eq 0 ]; then
    echo -e "║  ${GREEN}🎉 All checks passed! You're ready to deploy!${NC}              ║"
elif [ $ISSUES -lt 3 ]; then
    echo -e "║  ${YELLOW}⚠ $ISSUES minor issue(s) found. See above.${NC}                  ║"
else
    echo -e "║  ${RED}✗ $ISSUES issue(s) found. See TROUBLESHOOTING.md${NC}            ║"
fi

echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Provide next steps based on issues
if [ $ISSUES -eq 0 ]; then
    echo "Next steps:"
    echo "  1. Deploy backend: cd src/backend && wrangler deploy --env production"
    echo "  2. Deploy frontend: cd src/frontend && vercel --prod"
    echo "  3. Test at https://agentchat.io"
elif [ $ISSUES -lt 3 ]; then
    echo "Next steps:"
    echo "  1. Fix the issues above"
    echo "  2. Run ./diagnose.sh again to verify"
    echo "  3. See TROUBLESHOOTING.md for help"
else
    echo "Next steps:"
    echo "  1. Read TROUBLESHOOTING.md"
    echo "  2. Fix the issues shown above"
    echo "  3. Run setup.sh to reconfigure"
    echo "  4. Run ./diagnose.sh again"
fi

echo ""
