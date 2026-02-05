# 🆘 AgentChat - Help & Support

## "It's not working" - Let's Fix It!

I understand something isn't working. Let's diagnose and fix it quickly.

---

## 🔍 Step 1: Diagnose the Problem

Run this command:
```bash
cd agentchat
./diagnose.sh
```

This will tell you exactly what's wrong.

---

## 🛠️ Step 2: Quick Fix

Run this for automatic fixes:
```bash
./quick-fix.sh
```

Then choose the number for your issue:
- 1 = Dependencies missing
- 2 = Environment variables missing  
- 3 = CLI tools not installed
- 4 = Git issues
- 5 = Backend not working
- 6 = Frontend not working
- 7 = Stripe not working
- 8 = Everything broken (reset)
- 9 = Just diagnose

---

## ❓ Tell Me What's Wrong

Please answer these questions:

1. **What are you trying to do?**
   - [ ] Deploy for the first time
   - [ ] Fix a broken deployment
   - [ ] Test if it's working
   - [ ] Something else

2. **What error do you see?**
   - Copy and paste the exact error message
   - Or describe what happens

3. **Which URL is not working?**
   - [ ] https://agentchat.io (frontend)
   - [ ] https://api.agentchat.io (backend)
   - [ ] GitHub repository
   - [ ] Payment/Stripe
   - [ ] All of them

4. **What step failed?**
   - [ ] Git push
   - [ ] npm install
   - [ ] wrangler deploy
   - [ ] vercel deploy
   - [ ] Stripe setup
   - [ ] Testing the app

---

## 🔥 Most Common Issues

### 1. "I haven't deployed yet"
**Fix:**
```bash
cd agentchat
./deploy-complete.sh
```
Follow the prompts.

### 2. "The website doesn't load"
**Check:**
```bash
curl -I https://agentchat.io
```

**If it fails:**
```bash
cd src/frontend
vercel --prod
```

### 3. "API is not responding"
**Check:**
```bash
curl https://api.agentchat.io/health
```

**If it fails:**
```bash
cd src/backend
wrangler deploy --env production
```

### 4. "Payments not working"
**Fix:**
```bash
./quick-fix.sh
# Choose option 7 (Stripe)
```

### 5. "npm install fails"
**Fix:**
```bash
./quick-fix.sh
# Choose option 1 (Dependencies)
```

---

## 📝 What I Need From You

To help you faster, please share:

```
1. What you're trying to do:
   [Your answer]

2. What actually happens:
   [Error message or description]

3. What you've already tried:
   [Steps you took]

4. Output of diagnose.sh:
   [Run ./diagnose.sh and paste result]
```

---

## 🚀 Emergency Reset

If everything is broken:

```bash
cd agentchat
./quick-fix.sh
# Choose option 8 (Reset all)
```

Then start over with:
```bash
./deploy-complete.sh
```

---

## 📖 Helpful Files

| File | Use This When... |
|------|------------------|
| `TROUBLESHOOTING.md` | You have a specific error |
| `diagnose.sh` | You want to check what's wrong |
| `quick-fix.sh` | You want automatic fixes |
| `DEPLOYMENT_GUIDE.md` | You want step-by-step instructions |
| `QUICK_START.md` | You want quick reference |

---

## 💬 Get Personal Help

If the scripts don't work, tell me:

1. **The exact error message** (copy/paste)
2. **Which command you ran**
3. **What the output was**

Example:
> "I ran `./deploy-complete.sh` and got this error: 
> `wrangler: command not found`
> What should I do?"

---

## ✅ Quick Checklist

Before saying "it's not working", check:

- [ ] Did you run `./deploy-complete.sh`?
- [ ] Did you set up Stripe API keys?
- [ ] Did you push to GitHub?
- [ ] Did you deploy to Cloudflare?
- [ ] Did you deploy to Vercel?
- [ ] Did you run `./diagnose.sh`?

If NO to any of these, do that first!

---

## 🎯 The Bottom Line

**Most common fix:**
```bash
cd agentchat
./quick-fix.sh
# Pick the number for your issue
```

**If that doesn't work:**
Tell me the exact error message and I'll fix it for you.

---

**What's your specific error?** Let me know and I'll help! 💪
