# ProShop 24/7 Backend - Railway Deployment

## Quick Deploy to Railway

### 1. Install Railway CLI (if not already installed)
```bash
npm install -g @railway/cli
```

### 2. Login to Railway
```bash
railway login
```

### 3. Initialize Railway Project
```bash
railway init
```

### 4. Add Environment Variables
In Railway dashboard, add these variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `DEEPGRAM_API_KEY` (optional for now)
- `ELEVENLABS_API_KEY` (optional for now)
- `ELEVENLABS_VOICE_ID` (optional for now)
- `ENVIRONMENT=production`

### 5. Deploy
```bash
railway up
```

### 6. Get Your URL
```bash
railway domain
```

## Files Required for Deployment

- `requirements.txt` - Python dependencies
- `Procfile` - Start command
- `railway.json` - Railway configuration
- `.gitignore` - Exclude sensitive files

## Environment Variables

All sensitive keys are in `.env` (not committed to git).

## Production URL

After deployment, your backend will be at:
`https://your-app-name.up.railway.app`
