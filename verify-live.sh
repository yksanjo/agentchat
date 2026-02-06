#!/bin/bash
# Verify AgentChat is running properly

echo "🔍 Verifying AgentChat Live Setup"
echo "=================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:8787}"

# Check backend
echo "Checking Backend..."
if curl -s "$API_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend is running at $API_URL"
    
    # Get health data
    HEALTH=$(curl -s "$API_URL/health")
    echo "  Health: $HEALTH"
else
    echo -e "${RED}✗${NC} Backend is NOT running"
    echo "  Start with: cd src/backend && wrangler dev"
fi

echo ""

# Check agents
echo "Checking Agents..."
AGENTS_RESP=$(curl -s "$API_URL/api/v1/indicators/agents?limit=1" 2>/dev/null)
if [ -n "$AGENTS_RESP" ] && echo "$AGENTS_RESP" | grep -q '"success":true'; then
    TOTAL_AGENTS=$(echo "$AGENTS_RESP" | grep -o '"total":[0-9]*' | cut -d: -f2)
    echo -e "${GREEN}✓${NC} Found $TOTAL_AGENTS agents"
else
    echo -e "${YELLOW}⚠${NC} No agents found (simulator may still be initializing)"
fi

echo ""

# Check channels
echo "Checking Channels..."
CHANNELS_RESP=$(curl -s "$API_URL/api/v1/indicators/channels?limit=5" 2>/dev/null)
if [ -n "$CHANNELS_RESP" ] && echo "$CHANNELS_RESP" | grep -q '"success":true'; then
    TOTAL_CHANNELS=$(echo "$CHANNELS_RESP" | grep -o '"total":[0-9]*' | head -1 | cut -d: -f2)
    echo -e "${GREEN}✓${NC} Found $TOTAL_CHANNELS channels"
    
    # Show first few channel titles
    echo "  Active conversations:"
    echo "$CHANNELS_RESP" | grep -o '"title":"[^"]*"' | head -3 | sed 's/"title":"/    - /' | sed 's/"//'
else
    echo -e "${YELLOW}⚠${NC} No channels found (simulator may still be initializing)"
fi

echo ""

# Check heatmap
echo "Checking Activity Heatmap..."
HEATMAP_RESP=$(curl -s "$API_URL/api/v1/indicators/heatmap?hours=1" 2>/dev/null)
if [ -n "$HEATMAP_RESP" ] && echo "$HEATMAP_RESP" | grep -q '"success":true'; then
    ACTIVE_NOW=$(echo "$HEATMAP_RESP" | grep -o '"activeNow":[0-9]*' | cut -d: -f2)
    TOTAL_CONV=$(echo "$HEATMAP_RESP" | grep -o '"totalConversations":[0-9]*' | cut -d: -f2)
    echo -e "${GREEN}✓${NC} Active conversations: $ACTIVE_NOW"
    echo "  Total conversations: $TOTAL_CONV"
else
    echo -e "${YELLOW}⚠${NC} Heatmap data not available"
fi

echo ""
echo "=================================="

# Overall status
if curl -s "$API_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ AgentChat is LIVE!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Start frontend: cd src/frontend && npm run dev"
    echo "  2. Open http://localhost:3000"
    echo "  3. Watch real-time agent activity!"
else
    echo -e "${RED}✗ AgentChat is not running${NC}"
    echo ""
    echo "Start it with:"
    echo "  ./setup-live.sh"
fi
