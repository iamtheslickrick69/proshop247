# ProShop 24/7 - Production Deployment

## 🚀 Quick Start

Deploy ProShop 24/7 to production in **3 simple steps**:

```bash
# 1. Login to Railway (one-time, opens browser)
cd /Users/isr/Desktop/THISISTHE1/backend
railway login

# 2. Run automated deployment
cd /Users/isr/Desktop/THISISTHE1
./deploy.sh

# 3. Test production
./test_production.sh
```

That's it! Your application will be live.

---

## 📋 What Gets Deployed

### Backend → Railway
- FastAPI server
- WebSocket support for voice calls
- All AI integrations (Claude, OpenAI, ElevenLabs, Deepgram)
- Twilio voice webhooks
- Database connections to Supabase

**URL**: `https://YOUR-PROJECT.up.railway.app`

### Frontend → Vercel
- React + Vite application
- Landing page with demo system
- Chat widget
- Onboarding flow

**URL**: `https://YOUR-PROJECT.vercel.app`

---

## 📁 Deployment Files Overview

### 🔧 Scripts

| File | Purpose | Usage |
|------|---------|-------|
| `deploy.sh` | **Main deployment script** | `./deploy.sh` |
| `test_production.sh` | **Production testing** | `./test_production.sh` |
| `update_cors.sh` | **Update CORS settings** | `./update_cors.sh https://your-vercel-url.vercel.app` |
| `backend/set_railway_env.sh` | **Set Railway env vars** | `cd backend && ./set_railway_env.sh` |

### 📖 Documentation

| File | Purpose |
|------|---------|
| `DEPLOYMENT_STATUS.md` | **Current deployment state & checklist** |
| `DEPLOYMENT_GUIDE.md` | **Complete deployment guide (detailed)** |
| `QUICK_DEPLOY.md` | **Quick reference for common tasks** |
| `README_DEPLOYMENT.md` | **This file - deployment overview** |

### ⚙️ Configuration

| File | Purpose |
|------|---------|
| `backend/.env` | Backend environment variables |
| `backend/railway.json` | Railway deployment config |
| `backend/Procfile` | Railway start command |
| `frontend/.env.production` | Frontend production config |
| `frontend/vercel.json` | Vercel deployment config |

---

## 🎯 Step-by-Step Deployment

### Prerequisites ✅

All prerequisites are already met:
- ✅ Railway CLI installed
- ✅ Vercel CLI installed
- ✅ GitHub repository set up
- ✅ All API keys configured
- ✅ Supabase database configured

### Step 1: Railway Login

**Required once per machine:**

```bash
cd /Users/isr/Desktop/THISISTHE1/backend
railway login
```

This opens a browser window. Sign in with your Railway account.

### Step 2: Run Deployment Script

**Automated deployment:**

```bash
cd /Users/isr/Desktop/THISISTHE1
./deploy.sh
```

**What it does:**
1. ✅ Verifies authentication
2. ✅ Sets Railway environment variables
3. ✅ Deploys backend to Railway
4. ✅ Builds frontend
5. ✅ Deploys frontend to Vercel
6. ✅ Displays production URLs
7. ⚠️ Prompts for CORS update

**Duration**: ~5-10 minutes

### Step 3: Update CORS (Important!)

**Option A: Automated** (Recommended)

```bash
./update_cors.sh https://YOUR-VERCEL-URL.vercel.app
```

**Option B: Manual**

Edit `/Users/isr/Desktop/THISISTHE1/backend/main.py`:

```python
# Line ~57, change from:
allow_origins=["*"],

# To:
allow_origins=[
    "https://YOUR-VERCEL-URL.vercel.app",
],
```

Then redeploy:

```bash
cd backend && railway up
```

### Step 4: Configure Twilio Webhook

1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/active
2. Click on: `+12272334997`
3. Under "Voice & Fax" → "A CALL COMES IN":
   - Webhook: `https://YOUR-RAILWAY-URL.up.railway.app/v1/webhook/voice`
   - Method: POST
4. Click **Save**

### Step 5: Test Production

**Automated tests:**

```bash
./test_production.sh
```

**Manual tests:**

```bash
# 1. Backend health
curl https://YOUR-RAILWAY-URL.up.railway.app/health

# 2. Frontend
open https://YOUR-VERCEL-URL.vercel.app

# 3. Voice call
# Call: +1 (227) 233-4997
```

---

## 🔍 Testing

### Quick Health Check

```bash
# Test backend
curl https://YOUR-RAILWAY-URL.up.railway.app/health

# Expected response:
# {"status":"healthy","message":"All systems operational","version":"1.0.0"}
```

### Full Test Suite

```bash
cd /Users/isr/Desktop/THISISTHE1
./test_production.sh
```

**Tests included:**
- ✅ Backend health endpoint
- ✅ API documentation access
- ✅ Chat endpoint
- ✅ Demo creation endpoint
- ✅ Demo info/status endpoints
- ✅ Frontend loading
- ✅ CORS configuration
- ✅ Database connection

### Manual Testing

**Chat Widget:**
1. Visit frontend URL
2. Click chat widget
3. Send message: "What are your hours?"
4. Verify AI responds

**Demo Creation:**
1. Fill onboarding form
2. Submit demo request
3. Verify demo created
4. Test interaction limits

**Voice Call:**
1. Call `+1 (227) 233-4997`
2. Listen for greeting
3. Ask questions
4. Verify AI responds

---

## 📊 Monitoring

### View Logs

**Backend (Railway):**
```bash
cd backend
railway logs
```

**Frontend (Vercel):**
```bash
cd frontend
vercel logs
```

### Monitor Usage

- **Railway**: https://railway.app/account/usage
- **Vercel**: https://vercel.com/dashboard
- **Anthropic**: https://console.anthropic.com/settings/usage
- **OpenAI**: https://platform.openai.com/usage
- **Twilio**: https://console.twilio.com/us1/monitor/usage

---

## 🐛 Troubleshooting

### Backend 502 Error

```bash
# Check logs
cd backend
railway logs

# Common fixes:
# 1. Verify environment variables set
# 2. Check Python dependencies
# 3. Redeploy
railway up
```

### Frontend Build Fails

```bash
# Clear and rebuild
cd frontend
rm -rf node_modules
npm install
npm run build

# Then redeploy
vercel --prod
```

### CORS Errors

```bash
# Update CORS
./update_cors.sh https://YOUR-VERCEL-URL.vercel.app

# Redeploy backend
cd backend
railway up
```

### Twilio Webhook Not Working

1. Verify webhook URL in Twilio console
2. Check Railway logs: `cd backend && railway logs`
3. Test manually: `curl -X POST https://YOUR-RAILWAY-URL/v1/webhook/voice`

---

## 💰 Costs

**Monthly estimates:**

| Service | Cost |
|---------|------|
| Railway | $5-20 |
| Vercel | $0 (free tier) |
| Supabase | $0 (free tier) |
| Anthropic | $10-50 |
| OpenAI | $1-3 |
| ElevenLabs | $5-22 |
| Deepgram | $0-30 |
| Twilio | $3-25 |
| **Total** | **$24-150/month** |

Costs scale with usage. Start low and monitor.

---

## 🔐 Security

### Environment Variables

**Never commit these files:**
- `backend/.env`
- `frontend/.env`
- `frontend/.env.production`

**Secure storage:**
- Railway dashboard (encrypted)
- Vercel dashboard (encrypted)
- Local `.env` files (gitignored)

### API Keys

**Rotate regularly:**
- Anthropic API key
- OpenAI API key
- Twilio auth token
- ElevenLabs API key

**Enable 2FA:**
- Railway account
- Vercel account
- GitHub account
- Supabase account

---

## 🔄 Updates & Redeployment

### Backend Updates

```bash
# Make changes to backend code
cd /Users/isr/Desktop/THISISTHE1/backend

# Deploy
railway up
```

### Frontend Updates

```bash
# Make changes to frontend code
cd /Users/isr/Desktop/THISISTHE1/frontend

# Build and deploy
npm run build
vercel --prod
```

### Environment Variable Updates

```bash
# Backend
cd backend
railway variables

# Frontend
cd frontend
vercel env ls
```

---

## 📞 Support

### Service Dashboards

- **Railway**: https://railway.app/dashboard
- **Vercel**: https://vercel.com/dashboard
- **Supabase**: https://app.supabase.com
- **Twilio**: https://console.twilio.com

### Documentation

- **Main Guide**: `DEPLOYMENT_GUIDE.md` - Comprehensive guide
- **Quick Ref**: `QUICK_DEPLOY.md` - Common commands
- **Status**: `DEPLOYMENT_STATUS.md` - Current state

### GitHub Repository

https://github.com/iamtheslickrick69/proshop247

---

## ✅ Deployment Checklist

**Before deployment:**
- [x] Backend code complete
- [x] Frontend code complete
- [x] Database configured
- [x] API keys obtained
- [x] CLI tools installed
- [ ] Railway login completed

**During deployment:**
- [ ] Run `./deploy.sh`
- [ ] Update CORS settings
- [ ] Configure Twilio webhook
- [ ] Run `./test_production.sh`

**After deployment:**
- [ ] Verify all tests pass
- [ ] Test voice call manually
- [ ] Test chat widget
- [ ] Monitor logs for errors
- [ ] Share production URLs

---

## 🎉 Success Criteria

**Deployment is successful when:**

✅ Backend health check returns 200 OK
✅ Frontend loads without errors
✅ Chat widget responds to messages
✅ Demo creation works
✅ Voice call connects and AI responds
✅ All production tests pass

**Then you're live!** 🚀

---

## 📱 Production URLs

After deployment, you'll have:

- **Backend API**: `https://YOUR-PROJECT.up.railway.app`
- **Frontend**: `https://YOUR-PROJECT.vercel.app`
- **API Docs**: `https://YOUR-PROJECT.up.railway.app/docs`
- **Phone**: `+1 (227) 233-4997`

Save these URLs for reference!

---

**Last Updated**: 2025-10-29
**Version**: 1.0.0
**Status**: Ready for Production
