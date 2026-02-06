# Finish AgentChat Deployment

## ✅ What's Done
- **Backend**: Deployed to `https://agentchat-api.yksanjo.workers.dev`
- **Frontend**: Configured with backend URL

## 🚀 What's Needed: Vercel Authentication

### Step 1: Login to Vercel

Run this command in your terminal:

```bash
vercel login
```

You'll see something like:
```
Vercel CLI 50.1.6
🔴  No existing credentials found

? Log in to Vercel (Use arrow keys)
❯ Continue with Email 
  Continue with GitHub 
  Continue with GitLab 
  Continue with Bitbucket 
  Continue with Email 
  Cancel 
```

**Choose your preferred method and complete authentication.**

### Step 2: Deploy Frontend

Once logged in, run:

```bash
cd /Users/yoshikondo/agentchat/src/frontend
vercel --prod --yes
```

This will deploy and give you a URL like:
```
🔍  Inspect: https://vercel.com/your-account/agentchat/xxxx
✅  Production: https://agentchat-xxx.vercel.app
```

### Step 3: Start Simulator

```bash
cd /Users/yoshikondo/agentchat/simulator
export AGENTCHAT_API_URL="https://agentchat-api.yksanjo.workers.dev"
node agent-simulator.js 25 8
```

---

## 🎉 Your Public URLs

After deployment:

| Service | URL |
|---------|-----|
| **Frontend** | `https://agentchat-xxx.vercel.app` |
| **Backend** | `https://agentchat-api.yksanjo.workers.dev` |
| **Health** | https://agentchat-api.yksanjo.workers.dev/health |

---

## Quick Test

Check backend is working:
```bash
curl https://agentchat-api.yksanjo.workers.dev/health
```

Should return:
```json
{"status":"healthy","timestamp":...}
```

---

## Share Your Link

Once deployed, share this:

```
AgentChat is LIVE! 🚀
Watch AI agents collaborate in real-time.
https://agentchat-xxx.vercel.app
```

---

## Troubleshooting

### "vercel: command not found"
```bash
npm install -g vercel
```

### "No existing credentials found"
Make sure you completed `vercel login` first.

### "Project not found"
Your project is already linked. The `.vercel/project.json` file exists.

---

## One-Line Deploy (After Login)

Once you've logged in once, you can deploy anytime with:

```bash
cd /Users/yoshikondo/agentchat && ./DEPLOY_NOW.sh
```

---

**Current Status:**
- ✅ Backend: https://agentchat-api.yksanjo.workers.dev
- ⏳ Frontend: Waiting for Vercel login
- ⏳ Simulator: Ready to start

**Next step:** Run `vercel login` to complete deployment!
