# ProShop 24/7 - Quick Deployment Reference

## Prerequisites (One-Time Setup)

```bash
# 1. Login to Railway (opens browser)
cd /Users/isr/Desktop/THISISTHE1/backend
railway login

# 2. Login to Vercel (already done)
vercel whoami  # Should show: rocky-8713
```

---

## Automated Deployment (Recommended)

Run the automated deployment script:

```bash
cd /Users/isr/Desktop/THISISTHE1
./deploy.sh
```

This script will:
1. ✅ Check CLI tools installed
2. ✅ Verify Railway & Vercel authentication
3. ✅ Deploy backend to Railway
4. ✅ Update frontend environment variables
5. ✅ Build and deploy frontend to Vercel
6. ✅ Display production URLs
7. ⚠️  Prompt you to update CORS settings

---

## Manual Deployment Steps

### Backend (Railway)

```bash
cd /Users/isr/Desktop/THISISTHE1/backend

# Set environment variables
./set_railway_env.sh

# Deploy
railway up

# Get URL
railway domain
```

### Frontend (Vercel)

```bash
cd /Users/isr/Desktop/THISISTHE1/frontend

# Update API URL in .env.production
echo "VITE_API_URL=https://YOUR-RAILWAY-URL.up.railway.app" > .env.production

# Build
npm run build

# Deploy
vercel --prod
```

---

## Testing Production

### Test Backend

```bash
# Health check
curl https://YOUR-RAILWAY-URL.up.railway.app/health

# Expected: {"status":"healthy","message":"All systems operational","version":"1.0.0"}
```

### Test Frontend

```bash
# Open in browser
open https://YOUR-VERCEL-URL.vercel.app

# Should see landing page with:
# - Hero section
# - Demo cards
# - Chat widget
```

### Test Voice Call

```bash
# Call Twilio number
# +1 (227) 233-4997

# Expected:
# - AI assistant answers
# - Greeting plays
# - You can have conversation
```

---

## Update Twilio Webhook

After backend deployment, update Twilio:

1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/active
2. Click on: `+12272334997`
3. Under "Voice & Fax":
   - **A CALL COMES IN**: `https://YOUR-RAILWAY-URL.up.railway.app/v1/webhook/voice` (POST)
   - **CALL STATUS CHANGES**: `https://YOUR-RAILWAY-URL.up.railway.app/v1/webhook/call-status` (POST)
4. Click **Save**

---

## Update CORS (After First Deploy)

Edit `/Users/isr/Desktop/THISISTHE1/backend/main.py`:

```python
# Find this section (around line 55-63):
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this line
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Replace with:
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://YOUR-VERCEL-URL.vercel.app",
        "https://proshop247.com",  # If you have custom domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Then redeploy:

```bash
cd /Users/isr/Desktop/THISISTHE1/backend
railway up
```

---

## Monitor Logs

### Backend Logs (Railway)

```bash
cd /Users/isr/Desktop/THISISTHE1/backend
railway logs
```

Or view in dashboard: https://railway.app/dashboard

### Frontend Logs (Vercel)

```bash
cd /Users/isr/Desktop/THISISTHE1/frontend
vercel logs
```

Or view in dashboard: https://vercel.com/dashboard

---

## Troubleshooting

### Backend 502 Error

```bash
# Check logs
cd /Users/isr/Desktop/THISISTHE1/backend
railway logs

# Common issues:
# - Missing environment variables
# - Python dependency errors
# - Port configuration
```

### Frontend Not Loading

```bash
# Rebuild and redeploy
cd /Users/isr/Desktop/THISISTHE1/frontend
npm run build
vercel --prod
```

### CORS Errors

```bash
# Verify Vercel URL is in backend CORS settings
# Redeploy backend after updating main.py
cd /Users/isr/Desktop/THISISTHE1/backend
railway up
```

---

## Environment Variables Checklist

### Railway (Backend)

- ✅ SUPABASE_URL
- ✅ SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ ANTHROPIC_API_KEY
- ✅ OPENAI_API_KEY
- ✅ DEEPGRAM_API_KEY
- ✅ ELEVENLABS_API_KEY
- ✅ ELEVENLABS_VOICE_ID
- ✅ TWILIO_ACCOUNT_SID
- ✅ TWILIO_AUTH_TOKEN
- ✅ TWILIO_PHONE_NUMBER
- ✅ ENVIRONMENT=production
- ✅ PORT=8000

### Vercel (Frontend)

- ✅ VITE_API_URL (Railway backend URL)

---

## Current Deployment Status

**Existing Backend**: `https://web-production-6834.up.railway.app`
- Status: 502 error (needs redeployment)

**Existing Frontend**: `https://frontend-laxyv3bgp-rocky-teampayprocs-projects.vercel.app`
- Status: Deployed 18h ago (might need update)

**Twilio Number**: `+1 (227) 233-4997`
- Needs webhook update after backend deployment

---

## Quick Commands

```bash
# Full deployment
./deploy.sh

# Backend only
cd backend && railway up

# Frontend only
cd frontend && npm run build && vercel --prod

# View logs
cd backend && railway logs
cd frontend && vercel logs

# Test health
curl https://YOUR-RAILWAY-URL.up.railway.app/health
```

---

**Last Updated**: 2025-10-29
