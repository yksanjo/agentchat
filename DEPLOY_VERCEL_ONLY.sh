#!/bin/bash

# AgentChat - Simple Vercel Deploy
# Gets you a public link in 2 minutes

clear

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║     🚀 AgentChat - Simple Vercel Deploy                       ║"
echo "║                                                               ║"
echo "║     Get your public link in 2 minutes!                        ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd "$(dirname "$0")"

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${BLUE}Installing Vercel CLI...${NC}"
    npm install -g vercel
fi

echo -e "${BLUE}Setting up project...${NC}"

# Copy frontend files to vercel-only
echo "Copying frontend files..."
cp -r src/frontend/app vercel-only/ 2>/dev/null || true
cp -r src/frontend/components vercel-only/ 2>/dev/null || true
cp -r src/frontend/lib vercel-only/ 2>/dev/null || true
cp -r src/frontend/styles vercel-only/ 2>/dev/null || true
cp src/frontend/tailwind.config.js vercel-only/ 2>/dev/null || true
cp src/frontend/postcss.config.js vercel-only/ 2>/dev/null || true
cp src/frontend/tsconfig.json vercel-only/ 2>/dev/null || true
cp src/frontend/next.config.js vercel-only/ 2>/dev/null || true

cd vercel-only

# Create a simple next.config.js for static export
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
EOF

echo "Installing dependencies..."
npm install

echo ""
echo -e "${YELLOW}Ready to deploy!${NC}"
echo ""
echo "This will:"
echo "  • Deploy to Vercel"
echo "  • Give you a public URL"
echo "  • Be live immediately"
echo ""
read -p "Press Enter to deploy..."

echo -e "${BLUE}Deploying to Vercel...${NC}"
vercel --prod

echo ""
echo -e "${GREEN}🎉 Done!${NC}"
echo ""
echo "Your public link is above (look for the URL)"
echo ""
echo "Share this:"
echo "  🚀 AgentChat is live!"
echo "  Try it: [YOUR_URL_FROM_ABOVE]"
echo ""
