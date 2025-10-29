# ProShop 24/7 - Deployment Guide

## Document Overview

This document provides complete deployment instructions for ProShop 24/7, including Railway setup, environment configuration, CI/CD pipeline, monitoring, and production best practices. Follow this guide to deploy the MVP to production in under 1 hour.

---

## Deployment Architecture Overview

### Infrastructure Stack

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCTION STACK                      │
└─────────────────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐
│   RAILWAY        │  │   SUPABASE       │  │  LOVABLE    │
│   (Backend)      │  │   (Database)     │  │  (Frontend) │
│                  │  │                  │  │             │
│  FastAPI Server  │  │  PostgreSQL 15   │  │  React App  │
│  WebSocket       │  │  pgvector        │  │  Vercel     │
│  Background Jobs │  │  Storage         │  │  CDN        │
└────────┬─────────┘  └────────┬─────────┘  └──────┬──────┘
         │                     │                    │
         └─────────────────────┴────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   EXTERNAL APIS    │
                    ├────────────────────┤
                    │  - Anthropic       │
                    │  - OpenAI          │
                    │  - Twilio          │
                    │  - Deepgram        │
                    │  - ElevenLabs      │
                    └────────────────────┘
```

### Deployment Targets

1. **Backend (FastAPI)**: Railway
2. **Frontend (Lovable)**: Lovable → Vercel (auto-deploy)
3. **Database**: Supabase (managed PostgreSQL)
4. **File Storage**: Supabase Storage
5. **Background Jobs**: arq (Redis on Railway)

---

## Part 1: Pre-Deployment Setup

### Required Accounts & API Keys

**Create accounts and get API keys for:**

1. **Railway** (Backend hosting)
   - Sign up: https://railway.app
   - Connect GitHub account
   - Add payment method (credit card required after free tier)

2. **Supabase** (Database)
   - Sign up: https://supabase.com
   - Create project: "proshop-247-production"
   - Note: Project URL, anon key, service role key

3. **Anthropic** (Claude API)
   - Sign up: https://console.anthropic.com
   - Create API key
   - Add payment method (pay-as-you-go)

4. **OpenAI** (Embeddings)
   - Sign up: https://platform.openai.com
   - Create API key
   - Add payment method

5. **ElevenLabs** (Text-to-Speech)
   - Sign up: https://elevenlabs.io
   - Upgrade to Creator plan ($5/mo)
   - Create API key
   - Select/create voice, note voice ID

6. **Deepgram** (Speech-to-Text)
   - Sign up: https://deepgram.com
   - Create API key
   - $200 free credit available

7. **Twilio** (Phone system)
   - Sign up: https://twilio.com
   - Upgrade account (remove trial restrictions)
   - Purchase phone number
   - Note: Account SID, Auth Token, Phone Number

8. **Lovable** (Frontend)
   - Sign up: https://lovable.dev
   - Create project: "ProShop 24/7 Landing"
   - Upgrade to Pro ($20/mo) for custom domain

---

## Part 2: Supabase Database Setup

### Step 1: Create Supabase Project

```bash
# Project settings:
Name: proshop-247-production
Region: us-east-1 (or closest to your users)
Database Password: [Generate strong password]
```

### Step 2: Enable pgvector Extension

```sql
-- In Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### Step 3: Run Database Migrations

**Copy all SQL from DATABASE_SCHEMA.md:**

1. Create all tables (golf_courses, callers, conversations, demo_courses, etc.)
2. Create indexes
3. Create triggers
4. Create functions
5. Enable Row-Level Security (RLS)
6. Create RLS policies

**Migration script** (run in Supabase SQL Editor):

```sql
-- DATABASE_SCHEMA.md contains complete SQL
-- Copy/paste all CREATE TABLE, CREATE INDEX, CREATE POLICY statements
-- Execute in order

-- Verify tables created:
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Expected: golf_courses, callers, conversations, demo_courses,
--           demo_interactions, demo_leads
```

### Step 4: Create Storage Buckets

```sql
-- In Supabase SQL Editor (Storage section)

-- Create course-assets bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-assets', 'course-assets', true);

-- Create demo-assets bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('demo-assets', 'demo-assets', true);
```

**Configure Storage Policies**:

```sql
-- Anyone can read course assets
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-assets');

-- Backend can upload course assets
CREATE POLICY "Service role can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'course-assets' AND auth.role() = 'service_role');

-- Same for demo-assets
CREATE POLICY "Public Access Demo"
ON storage.objects FOR SELECT
USING (bucket_id = 'demo-assets');

CREATE POLICY "Service role can upload demo"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'demo-assets' AND auth.role() = 'service_role');
```

### Step 5: Insert Fox Hollow Sample Data

```sql
-- Insert Fox Hollow golf course (from DATABASE_SCHEMA.md)
INSERT INTO golf_courses (
    name,
    slug,
    location,
    address,
    website_url,
    phone_number,
    brand_color_primary,
    agent_personality,
    greeting_message,
    operating_hours,
    pricing_structure,
    services,
    status
) VALUES (
    'Fox Hollow Golf Course',
    'fox-hollow',
    'American Fork, UT',
    '1400 N 200 E, American Fork, UT 84003',
    'https://foxhollowutah.com/',
    '801.756.3594',
    '#2E7D32',
    'friendly',
    'Thanks for calling Fox Hollow Golf Course! How can I help you today?',
    '{"monday": "7am-8pm", "tuesday": "7am-8pm", "wednesday": "7am-8pm", "thursday": "7am-8pm", "friday": "7am-8pm", "saturday": "6am-9pm", "sunday": "6am-9pm"}'::JSONB,
    '{"weekday": 25, "weekend": 45, "twilight": 20, "cart": 18}'::JSONB,
    '["18-hole championship course", "The Fox Den Restaurant", "Event venue", "Wedding venue", "Driving range"]'::JSONB,
    'active'
);
```

### Step 6: Get Connection Details

From Supabase Project Settings → API:

```bash
# Save these for Railway environment variables:
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...  # For frontend
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # For backend (keep secret!)
```

---

## Part 3: Railway Backend Deployment

### Step 1: Prepare GitHub Repository

```bash
# Create GitHub repo
gh repo create proshop-247 --private

# Initialize local repo
cd ~/projects/proshop-247
git init
git add .
git commit -m "Initial commit: ProShop 24/7 MVP"
git branch -M main
git remote add origin https://github.com/yourusername/proshop-247.git
git push -u origin main
```

**Repository Structure**:
```
proshop-247/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── api/
│   │   ├── webhooks.py
│   │   ├── chat.py
│   │   └── demo.py
│   ├── services/
│   │   ├── memory.py
│   │   ├── agent.py
│   │   ├── voice.py
│   │   └── scraper.py
│   └── worker.py  # arq background jobs
├── docs/
│   └── [all MD files]
├── .gitignore
└── README.md
```

### Step 2: Create Railway Project

1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `proshop-247` repository
5. Select `backend/` as root directory

**Railway Configuration**:
- **Name**: proshop-247-backend
- **Region**: us-west1 (or closest to users)
- **Plan**: Hobby ($5/mo starts, scales with usage)

### Step 3: Configure Build Settings

In Railway dashboard → Settings:

```bash
# Build Command
pip install -r requirements.txt

# Start Command
uvicorn main:app --host 0.0.0.0 --port $PORT

# Root Directory
backend/

# Watch Paths
backend/**
```

### Step 4: Add Environment Variables

In Railway dashboard → Variables:

```bash
# API Keys
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
ELEVENLABS_API_KEY=xxxxx
DEEPGRAM_API_KEY=xxxxx
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+18005551234

# Database
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGci... (anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (service role - SECRET!)

# Application
ENVIRONMENT=production
SECRET_KEY=[generate with: openssl rand -hex 32]
CORS_ORIGINS=https://proshop247.com,https://www.proshop247.com

# ElevenLabs
ELEVENLABS_VOICE_ID=xxxxx  # Fox Hollow voice

# Internal API Key (for demo system)
INTERNAL_API_KEY=[generate random string]

# Redis (for arq background jobs)
REDIS_URL=redis://default:xxxxx@redis.railway.internal:6379
```

**Generate SECRET_KEY**:
```bash
openssl rand -hex 32
```

### Step 5: Add Redis Service (for Background Jobs)

In Railway dashboard:
1. Click "New" → "Database" → "Add Redis"
2. Railway will provision Redis automatically
3. Copy `REDIS_URL` from Redis service → Variables
4. Set in backend service environment variables

### Step 6: Deploy

```bash
# Railway auto-deploys on git push
git push origin main

# Monitor deployment logs in Railway dashboard
# Wait for "Deployment successful"

# Get public URL
# Railway provides: https://proshop-247-backend.up.railway.app
```

### Step 7: Verify Deployment

```bash
# Test health endpoint
curl https://proshop-247-backend.up.railway.app/v1/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-10-28T12:00:00Z",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "twilio": "connected",
    "claude_api": "connected",
    "elevenlabs": "connected",
    "deepgram": "connected"
  }
}
```

### Step 8: Configure Custom Domain (Optional)

In Railway dashboard → Settings → Domains:

```bash
# Add custom domain
api.proshop247.com

# Railway provides CNAME record
# Add to DNS provider (Cloudflare, etc.):
CNAME  api  proshop-247-backend.up.railway.app

# Enable HTTPS (automatic with Railway)
```

---

## Part 4: Twilio Configuration

### Step 1: Purchase Phone Number

1. Go to Twilio Console → Phone Numbers → Buy a Number
2. Search for available numbers (toll-free recommended: 1-800-XXX-XXXX)
3. Purchase number ($1.15/month)

**Number Type**:
- **Voice-enabled**: Required
- **SMS-enabled**: Optional (for V2)
- **MMS-enabled**: Not needed

### Step 2: Configure Webhooks

In Twilio Console → Phone Numbers → Manage → Active Numbers:

**Voice & Fax Configuration**:
```
Configure With: Webhooks, TwiML Bins, Functions, Studio, or Proxy

A CALL COMES IN:
  Webhook: https://api.proshop247.com/v1/webhook/voice
  HTTP: POST

CALL STATUS CHANGES:
  Webhook: https://api.proshop247.com/v1/webhook/call-status
  HTTP: POST
```

### Step 3: Test Voice Call

```bash
# Call your Twilio number from your phone
# Expected: AI assistant answers with greeting

# Check Railway logs for:
# "Incoming call from +15551234567"
# "WebSocket connection established"
# "Deepgram stream started"
# "Agent response generated"
```

---

## Part 5: Lovable Frontend Deployment

### Step 1: Build Frontend in Lovable

Follow LOVABLE_FRONTEND.md specifications:

1. Create all sections (Hero, Dual-Demo, Features, etc.)
2. Add components (DemoCard, ChatWidget, OnboardingModal)
3. Configure API endpoints to Railway backend
4. Test locally in Lovable preview

### Step 2: Configure API Integration

In Lovable project settings:

```javascript
// API Base URL (environment variable)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.proshop247.com';

// API calls
fetch(`${API_BASE_URL}/v1/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message, session_id, context })
});
```

### Step 3: Deploy to Production

In Lovable dashboard:

1. Click "Publish" → "Deploy to Production"
2. Lovable automatically deploys to Vercel
3. Get production URL: `https://proshop247.lovable.app`

### Step 4: Configure Custom Domain

**In Lovable**:
1. Go to Settings → Domains
2. Add custom domain: `proshop247.com`
3. Follow DNS configuration instructions

**DNS Records** (in your DNS provider):
```
A     @      76.76.21.21  (Vercel IP)
CNAME www    cname.vercel-dns.com
```

### Step 5: SSL Certificate

- Lovable/Vercel automatically provisions SSL certificate
- Wait 5-10 minutes for DNS propagation
- Verify HTTPS: `https://proshop247.com`

---

## Part 6: CI/CD Pipeline Setup

### Automatic Deployment Pipeline

**Flow**: GitHub push → Railway auto-deploy → Production

### Railway Auto-Deploy Configuration

Already configured in Step 3, but verify:

1. Railway dashboard → Settings → Deploys
2. **Auto Deploy**: Enabled
3. **Branch**: main
4. **Watch Paths**: backend/**

**Every git push triggers**:
```
1. Railway detects changes
   ↓
2. Pulls latest code from GitHub
   ↓
3. Runs build command (pip install)
   ↓
4. Runs start command (uvicorn)
   ↓
5. Health check (/v1/health)
   ↓
6. Routes traffic to new deployment
   ↓
7. Old deployment terminated
```

### Deployment Workflow

```bash
# Development
git checkout -b feature/new-feature
# ... make changes ...
git commit -m "Add new feature"
git push origin feature/new-feature

# Create Pull Request on GitHub
# Code review → Approve → Merge to main

# Production Deploy (automatic)
git checkout main
git pull origin main
# Railway auto-deploys within 2-3 minutes
```

### Rollback Strategy

**If deployment fails**:

```bash
# Option 1: Railway Dashboard Rollback
# Go to Deployments → Select previous deployment → Rollback

# Option 2: Git Rollback
git revert HEAD
git push origin main
# Railway will deploy previous commit
```

---

## Part 7: Monitoring & Logging

### Railway Built-in Monitoring

**Access Logs**:
- Railway dashboard → Deployments → Logs
- Real-time log streaming
- Filter by service (backend, redis)

**Metrics**:
- Railway dashboard → Metrics
- CPU usage
- Memory usage
- Network I/O
- Request count

### Application Logging

**Configure structured logging in FastAPI**:

```python
import logging
import json
from datetime import datetime

# Configure JSON logging
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s'
)

logger = logging.getLogger("uvicorn")

def log_event(event_type: str, data: dict):
    """Log structured event"""
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "event": event_type,
        "data": data
    }
    logger.info(json.dumps(log_entry))

# Usage
log_event("call_started", {
    "call_sid": call_sid,
    "caller_number": caller_number,
    "golf_course": golf_course_id
})

log_event("agent_response", {
    "call_sid": call_sid,
    "response_time_ms": 1850,
    "token_count": 245
})
```

### Error Tracking (Optional - Sentry)

**Install Sentry**:

```bash
pip install sentry-sdk[fastapi]
```

**Configure in main.py**:

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    environment="production",
    traces_sample_rate=0.1,  # 10% of transactions
    integrations=[FastApiIntegration()]
)
```

**Benefits**:
- Automatic error capture
- Stack traces
- Performance monitoring
- Alerts on critical errors

---

## Part 8: Production Checklist

### Pre-Launch Checklist

**Environment Variables**:
- [ ] All API keys added to Railway
- [ ] SECRET_KEY generated and set
- [ ] CORS_ORIGINS set to production domains
- [ ] SUPABASE_SERVICE_ROLE_KEY set (not anon key)
- [ ] INTERNAL_API_KEY generated

**Database**:
- [ ] All tables created
- [ ] Indexes created
- [ ] RLS policies enabled
- [ ] Storage buckets created
- [ ] Fox Hollow sample data inserted

**Backend**:
- [ ] Health check returns "healthy"
- [ ] All services connected (Twilio, Claude, etc.)
- [ ] WebSocket endpoint working
- [ ] Demo creation endpoint tested
- [ ] Chat endpoint tested

**Frontend**:
- [ ] All sections visible
- [ ] Dual-demo system working
- [ ] Onboarding modal functional
- [ ] Chat widget working
- [ ] Mobile responsive
- [ ] SSL certificate active

**Twilio**:
- [ ] Phone number purchased
- [ ] Webhooks configured
- [ ] Test call successful
- [ ] Voice quality acceptable

**Testing**:
- [ ] End-to-end voice call test
- [ ] End-to-end text chat test
- [ ] Demo creation test
- [ ] Memory system test (returning caller)
- [ ] File upload test
- [ ] Interaction limit test

### Launch Day Checklist

**Morning of Launch**:
- [ ] Final smoke test (all features)
- [ ] Verify Twilio number working
- [ ] Check Railway deployment status
- [ ] Verify custom domain resolving
- [ ] Clear browser cache, test as user

**Announce Launch**:
- [ ] Update website live
- [ ] Send announcement email
- [ ] Post on social media
- [ ] Notify Fox Hollow

**Monitor First 24 Hours**:
- [ ] Watch Railway logs for errors
- [ ] Monitor call volume
- [ ] Check demo creation rate
- [ ] Verify interaction limits working
- [ ] Track API costs

---

## Part 9: Backup & Disaster Recovery

### Database Backups

**Supabase Automatic Backups**:
- Daily backups (included in free tier)
- 7-day retention (free tier)
- 30-day retention (Pro plan)
- Point-in-time recovery (Pro plan)

**Manual Backup Script**:

```bash
# Create backup script: backup.sh
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_$DATE.sql"

# Export database
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Upload to S3 (optional)
aws s3 cp $BACKUP_FILE.gz s3://proshop-backups/

echo "Backup completed: $BACKUP_FILE.gz"
```

**Run Weekly**:
```bash
# Add to cron (or GitHub Actions)
crontab -e

# Every Sunday at 2am
0 2 * * 0 /path/to/backup.sh
```

### Disaster Recovery Plan

**Scenario 1: Railway Outage**

```
1. Check Railway status page
2. If extended outage:
   - Deploy to backup host (Render, Fly.io)
   - Update DNS (A record to new IP)
   - Wait for propagation (5-10 minutes)
3. Restore from Supabase (data intact)
```

**Scenario 2: Database Corruption**

```
1. Identify corruption (recent timestamp)
2. Restore from Supabase backup:
   - Supabase dashboard → Database → Backups
   - Select backup before corruption
   - Click "Restore"
3. Verify data integrity
4. Resume operations
```

**Scenario 3: API Key Compromise**

```
1. Rotate compromised key immediately
2. Update Railway environment variables
3. Redeploy application
4. Monitor for unauthorized usage
5. Review logs for suspicious activity
```

---

## Part 10: Scaling Strategies

### When to Scale

**Indicators**:
- Railway CPU > 70% sustained
- Memory > 80% sustained
- Response time > 5 seconds
- Call volume > 1000/day
- Demo creation > 100/day

### Vertical Scaling (Railway)

**Upgrade Plan**:
- Hobby ($5/mo): 512MB RAM, 1 vCPU
- Pro ($20/mo): 8GB RAM, 8 vCPU
- Team ($50/mo): 32GB RAM, 32 vCPU

**How to Scale**:
1. Railway dashboard → Project → Settings
2. Select new plan
3. Apply changes (no downtime)

### Horizontal Scaling (Multiple Instances)

**Load Balancer Configuration**:

```bash
# Railway automatically load balances across instances
# Increase replicas:
Railway dashboard → Service → Replicas → Set to 2+
```

**Considerations**:
- WebSocket sticky sessions required
- Shared Redis for background jobs
- Database connection pooling

### Database Scaling (Supabase)

**Upgrade Supabase Plan**:
- Free: 500MB storage, 2GB bandwidth
- Pro ($25/mo): 8GB storage, 50GB bandwidth
- Team ($599/mo): 100GB storage, 250GB bandwidth

**Optimization**:
- Add indexes on frequently queried columns
- Archive old conversations (>1 year)
- Connection pooling (PgBouncer)

---

## Part 11: Cost Estimates

### MVP Phase (First Month)

| Service | Cost | Usage |
|---------|------|-------|
| Railway (Backend) | $5 | Hobby plan |
| Supabase (Database) | $0 | Free tier (< 500MB) |
| Lovable (Frontend) | $20 | Pro plan (custom domain) |
| Anthropic (Claude) | $10 | ~200 calls/month |
| OpenAI (Embeddings) | $1 | ~200 conversations |
| ElevenLabs (TTS) | $5 | Creator plan (30K chars) |
| Deepgram (STT) | $0 | Free $200 credit |
| Twilio (Phone) | $3 | 1 number + ~50 calls |
| **Total** | **~$44/mo** | |

### Production Phase (100 Calls/Day)

| Service | Cost | Usage |
|---------|------|-------|
| Railway | $20 | Pro plan (scaling) |
| Supabase | $0 | Still free tier |
| Lovable | $20 | Pro plan |
| Claude | $50 | ~3,000 calls/month |
| OpenAI | $3 | ~3,000 conversations |
| ElevenLabs | $22 | Pro plan (100K chars) |
| Deepgram | $30 | ~10 hours/day |
| Twilio | $25 | 1 number + 3,000 calls |
| **Total** | **~$170/mo** | |

---

## Next Steps

After this document is approved:
1. Create BUILD_CHECKLIST.md (Final document! Step-by-step build guide, testing checklist, launch checklist)

---

**Document Status**: Draft v1.0
**Last Updated**: 2025-10-28
**Next Review**: After approval and before BUILD_CHECKLIST.md creation
