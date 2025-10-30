# ProShop 24/7 - Production Deployment Guide

## Current Status Check

✅ **CLI Tools Installed:**
- Railway CLI: `/opt/homebrew/bin/railway`
- Vercel CLI: `/opt/homebrew/bin/vercel`
- Node.js & npm: Installed

✅ **Git Repository:**
- Remote: `https://github.com/iamtheslickrick69/proshop247.git`
- Branch: `main`

⚠️ **Existing Deployments:**
- Railway Backend: `https://web-production-6834.up.railway.app` (502 error - needs redeployment)
- Vercel Frontend: `https://frontend-laxyv3bgp-rocky-teampayprocs-projects.vercel.app` (deployed 18h ago)

---

## Step 1: Deploy Backend to Railway

### 1.1 Login to Railway (MANUAL STEP)

Railway CLI requires interactive login. Run this command in your terminal:

```bash
cd /Users/isr/Desktop/THISISTHE1/backend
railway login
```

This will open a browser window. Log in with your Railway account.

### 1.2 Link to Existing Railway Project

Since there's already a Railway deployment at `https://web-production-6834.up.railway.app`, link to it:

```bash
cd /Users/isr/Desktop/THISISTHE1/backend
railway link
```

Select your existing project from the list.

**OR** if you want to start fresh:

```bash
cd /Users/isr/Desktop/THISISTHE1/backend
railway init
```

Follow the prompts to create a new project.

### 1.3 Set Environment Variables

Run the provided script to set all environment variables:

```bash
cd /Users/isr/Desktop/THISISTHE1/backend
chmod +x set_railway_env.sh
./set_railway_env.sh
```

**OR** set them manually via Railway dashboard:
1. Go to https://railway.app/dashboard
2. Select your project
3. Go to "Variables" tab
4. Add each variable from `backend/.env`

### 1.4 Deploy Backend

```bash
cd /Users/isr/Desktop/THISISTHE1/backend
railway up
```

This will:
- Upload code to Railway
- Install dependencies from `requirements.txt`
- Start the server with the command in `Procfile`

### 1.5 Get Railway URL

```bash
railway domain
```

Save this URL - you'll need it for the frontend.

Example output: `https://web-production-6834.up.railway.app`

### 1.6 Test Backend

```bash
# Test health endpoint
curl https://YOUR-RAILWAY-URL.up.railway.app/health

# Expected response:
# {"status":"healthy","message":"All systems operational","version":"1.0.0"}
```

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Update Frontend Environment Variables

Update the Railway URL in your frontend `.env.production` file:

```bash
cd /Users/isr/Desktop/THISISTHE1/frontend
echo "VITE_API_URL=https://YOUR-RAILWAY-URL.up.railway.app" > .env.production
```

### 2.2 Build Frontend

```bash
cd /Users/isr/Desktop/THISISTHE1/frontend
npm install
npm run build
```

This will create a `dist` folder with the production build.

### 2.3 Deploy to Vercel

```bash
cd /Users/isr/Desktop/THISISTHE1/frontend
vercel --prod
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **Y** (if you have one) or **N** for new
- What's your project's name? **proshop247** (or keep default)
- In which directory is your code located? **.**
- Want to override settings? **N**

### 2.4 Set Vercel Environment Variable

Set the Railway API URL as an environment variable in Vercel:

```bash
vercel env add VITE_API_URL production
```

When prompted, paste your Railway URL: `https://YOUR-RAILWAY-URL.up.railway.app`

### 2.5 Get Vercel URL

After deployment completes, Vercel will display your production URL.

Example: `https://proshop247.vercel.app`

---

## Step 3: Update Backend CORS Settings

Now that you have your Vercel frontend URL, update the backend to allow requests from it.

### 3.1 Update main.py

The backend currently allows all origins (`allow_origins=["*"]`). For production, update this to your specific Vercel URL.

Edit `/Users/isr/Desktop/THISISTHE1/backend/main.py`:

```python
# CORS middleware - Production settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://proshop247.vercel.app",  # Replace with your Vercel URL
        "https://www.proshop247.com",      # Add custom domain if you have one
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3.2 Redeploy Backend

```bash
cd /Users/isr/Desktop/THISISTHE1/backend
railway up
```

Wait ~2 minutes for Railway to redeploy.

---

## Step 4: Configure Twilio for Production

### 4.1 Update Twilio Webhook URL

1. Go to https://console.twilio.com
2. Navigate to **Phone Numbers** → **Manage** → **Active Numbers**
3. Click on your number: `+12272334997`
4. Under "Voice & Fax" section:
   - **A CALL COMES IN**:
     - Webhook: `https://YOUR-RAILWAY-URL.up.railway.app/v1/webhook/voice`
     - HTTP Method: **POST**
   - **CALL STATUS CHANGES**:
     - Webhook: `https://YOUR-RAILWAY-URL.up.railway.app/v1/webhook/call-status`
     - HTTP Method: **POST**
5. Click **Save**

### 4.2 Test Voice Call

Call your Twilio number: `+1 (227) 233-4997`

Expected behavior:
- AI assistant answers with greeting
- You can have a conversation
- Check Railway logs for activity

---

## Step 5: Production Testing Checklist

### 5.1 Backend Health Check

```bash
# Test health endpoint
curl https://YOUR-RAILWAY-URL.up.railway.app/health

# Test root endpoint
curl https://YOUR-RAILWAY-URL.up.railway.app/
```

### 5.2 Frontend Loading

```bash
# Visit your Vercel URL in browser
open https://YOUR-VERCEL-URL.vercel.app
```

Verify:
- [ ] Landing page loads
- [ ] Hero section displays
- [ ] Demo cards appear
- [ ] Chat widget opens
- [ ] Mobile responsive

### 5.3 Chat Widget Test

1. Open chat widget on frontend
2. Send a test message: "What are your hours?"
3. Verify AI responds
4. Check interaction counter

### 5.4 Demo Creation Test

1. Fill out onboarding form:
   - Course Name: "Test Golf Course"
   - Website: "https://testgolfcourse.com"
   - Email: "test@example.com"
2. Submit form
3. Verify demo is created
4. Check interaction limit works

### 5.5 Voice Call Test

1. Call Twilio number: `+1 (227) 233-4997`
2. Listen for greeting
3. Ask: "What are your hours?"
4. Verify AI responds correctly
5. Check Railway logs for:
   - WebSocket connection
   - Deepgram stream
   - Agent response

### 5.6 API Endpoints Test

```bash
# Test chat endpoint
curl -X POST https://YOUR-RAILWAY-URL.up.railway.app/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","session_id":"test-session","context":{}}'

# Test demo creation endpoint
curl -X POST https://YOUR-RAILWAY-URL.up.railway.app/v1/demo/create \
  -H "Content-Type: application/json" \
  -d '{"course_name":"Test Course","website_url":"https://test.com","email":"test@example.com"}'
```

---

## Step 6: Monitor Production

### 6.1 Railway Logs

View real-time logs:

```bash
cd /Users/isr/Desktop/THISISTHE1/backend
railway logs
```

Or view in Railway dashboard:
- https://railway.app/dashboard → Your Project → Deployments → Logs

### 6.2 Vercel Logs

View deployment logs:

```bash
cd /Users/isr/Desktop/THISISTHE1/frontend
vercel logs
```

Or view in Vercel dashboard:
- https://vercel.com/dashboard → Your Project → Deployments

### 6.3 Monitor API Usage

Check usage and costs:
- **Railway**: https://railway.app/account/usage
- **Anthropic**: https://console.anthropic.com/settings/usage
- **OpenAI**: https://platform.openai.com/usage
- **ElevenLabs**: https://elevenlabs.io/subscription
- **Deepgram**: https://console.deepgram.com/usage
- **Twilio**: https://console.twilio.com/us1/monitor/usage

---

## Troubleshooting

### Backend 502 Error

If Railway shows 502 errors:

1. Check environment variables are set correctly
2. View logs: `railway logs`
3. Verify `requirements.txt` has all dependencies
4. Check Railway build logs for errors
5. Ensure `PORT` environment variable is set (Railway sets this automatically)

### Frontend Build Fails

If Vercel build fails:

1. Check build logs in Vercel dashboard
2. Verify `package.json` has correct build command
3. Ensure all dependencies are in `package.json`
4. Check TypeScript errors: `npm run build` locally

### CORS Errors

If you see CORS errors in browser console:

1. Verify backend `main.py` has Vercel URL in `allow_origins`
2. Redeploy backend after CORS changes
3. Clear browser cache
4. Check Network tab for actual error

### Twilio Webhook Not Working

If voice calls don't work:

1. Verify webhook URL is correct in Twilio console
2. Check Railway logs for incoming webhook requests
3. Test webhook manually: `curl -X POST https://YOUR-RAILWAY-URL/v1/webhook/voice`
4. Ensure Railway deployment is live (not sleeping)

---

## Environment Variables Reference

### Backend (Railway)

```bash
SUPABASE_URL=https://cyohdzoubewlxawmklrc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...
DEEPGRAM_API_KEY=a3db8846fef6640ab343ef541bc6ab424e3dee13
ELEVENLABS_API_KEY=sk_51cb43bb2ed91a617b677f77f0fb560c7737ff962e0b9251
ELEVENLABS_VOICE_ID=f5HLTX707KIM4SzJYzSz
TWILIO_ACCOUNT_SID=PNf858e33766275441a2b571cba68ea46d
TWILIO_AUTH_TOKEN=c712739c795af3dff4daa8a723d8ee29
TWILIO_PHONE_NUMBER=+12272334997
ENVIRONMENT=production
PORT=8000
```

### Frontend (Vercel)

```bash
VITE_API_URL=https://YOUR-RAILWAY-URL.up.railway.app
```

---

## Cost Estimates

**Monthly costs for production:**

| Service | Estimated Cost |
|---------|---------------|
| Railway (Backend) | $5-20 |
| Vercel (Frontend) | $0 (Hobby tier) |
| Supabase (Database) | $0 (Free tier) |
| Anthropic (Claude) | $10-50 |
| OpenAI (Embeddings) | $1-3 |
| ElevenLabs (TTS) | $5-22 |
| Deepgram (STT) | $0-30 |
| Twilio (Phone) | $3-25 |
| **Total** | **$24-150/month** |

---

## Next Steps After Deployment

1. **Custom Domain** (Optional)
   - Buy domain (e.g., proshop247.com)
   - Configure DNS in Vercel
   - Update CORS in backend

2. **SSL Certificate**
   - Automatic with Railway & Vercel
   - Verify HTTPS works

3. **Monitoring**
   - Set up uptime monitoring (e.g., UptimeRobot)
   - Configure error alerts

4. **Backups**
   - Supabase auto-backups enabled
   - Export code to GitHub regularly

5. **Analytics** (Optional)
   - Add Google Analytics to frontend
   - Track chat interactions
   - Monitor demo creation rate

---

**Last Updated**: 2025-10-29
**Document Status**: Ready for production deployment
