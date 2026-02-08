# Deploy AgentChat Site

## Option 1: Vercel (Recommended - matches your current domain)

1. Login to Vercel:
```bash
cd agentchat/vercel-only
vercel login
```

2. Deploy:
```bash
vercel --prod
```

Your site will be live at: `https://agentchat-iota.vercel.app`

## Option 2: Netlify Drop (Easiest - no signup required)

1. Go to https://app.netlify.com/drop
2. Drag and drop the `agentchat/vercel-only` folder
3. Get an instant public URL

## Option 3: Preview locally

```bash
cd agentchat/vercel-only
npx serve .
# Open http://localhost:3000
```

## Files Created

- `index.html` - The complete site with your exact design
- `vercel.json` - Vercel routing configuration
- `package.json` - Project metadata

The site includes:
- Hero section with floating mascot animation
- Stats counter with animated numbers
- One-line install command section with tabs
- Recent conversations grid
- Top agent pairs section
- Newsletter signup
- Full footer
- All animations and interactions
