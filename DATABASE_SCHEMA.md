# ProShop 24/7 - Database Schema Specification

## Document Overview

This document defines the complete database architecture for ProShop 24/7, including all tables, columns, relationships, indexes, Row-Level Security (RLS) policies, and Supabase Storage configuration. The schema is designed for data isolation, unlimited conversation storage, and efficient retrieval of conversation history.

---

## Database Platform

**Supabase (PostgreSQL 15+)**
- **Extensions Required**:
  - `pgvector` - Vector similarity search for embeddings
  - `uuid-ossp` - UUID generation for primary keys
  - `pg_trgm` - Trigram text search for name/location searches
- **Features Used**:
  - Row-Level Security (RLS) for data isolation
  - Supabase Storage for file uploads (menus, scorecards, logos)
  - Real-time subscriptions (V2 feature)
  - PostgREST API (automatic REST endpoints)

---

## Schema Overview

### Production Tables (Customer System)
1. **`golf_courses`** - Production golf course accounts (Fox Hollow first)
2. **`callers`** - Auto-created caller accounts (identified by phone number)
3. **`conversations`** - ALL conversations stored permanently with embeddings

### Demo Tables (Lead Generation System)
4. **`demo_courses`** - Custom demo golf courses created by prospects
5. **`demo_interactions`** - Track text/voice usage per demo (25 limit)
6. **`demo_leads`** - Email captures from demo creation

### Supporting Tables (V2+)
7. **`users`** - OAuth authenticated users for dashboard (V2)
8. **`conversation_tags`** - Categorize conversations (weddings, tee times, etc.) (V2)

---

## Table Schemas

### 1. golf_courses (Production Accounts)

**Purpose**: Store production golf course customer accounts

```sql
CREATE TABLE golf_courses (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basic Information
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,  -- URL-friendly identifier (e.g., "fox-hollow")
    location TEXT NOT NULL,  -- City, State format
    address TEXT,
    website_url TEXT,
    phone_number TEXT,
    email TEXT,

    -- Branding
    logo_url TEXT,  -- URL to logo in Supabase Storage
    brand_color_primary TEXT,  -- Hex color (e.g., "#2E7D32")
    brand_color_secondary TEXT,

    -- Voice Configuration
    elevenlabs_voice_id TEXT,  -- Custom voice ID if using voice clone
    agent_personality TEXT,  -- "friendly", "professional", "upscale"
    greeting_message TEXT,  -- Custom greeting (e.g., "Thanks for calling Fox Hollow!")

    -- Course Data (Structured JSON)
    operating_hours JSONB,  -- {"monday": "7am-7pm", "tuesday": "7am-7pm", ...}
    pricing_structure JSONB,  -- {"weekday": 25, "weekend": 45, "cart": 18}
    services JSONB,  -- ["18-hole course", "restaurant", "events", "driving range"]
    menu_data JSONB,  -- Parsed restaurant menu items with prices
    scorecard_data JSONB,  -- Hole-by-hole par, yardage, handicap

    -- Twilio Configuration
    twilio_phone_number TEXT UNIQUE,  -- Dedicated phone number for this course
    twilio_webhook_url TEXT,

    -- Subscription & Status
    subscription_tier TEXT DEFAULT 'free',  -- "free", "starter", "pro", "enterprise"
    status TEXT DEFAULT 'active',  -- "active", "suspended", "cancelled"
    is_demo BOOLEAN DEFAULT false,  -- false for production, true for internal demos

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    onboarded_by UUID REFERENCES users(id),  -- User who created this account (V2)

    -- Soft Delete
    deleted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT valid_subscription_tier CHECK (subscription_tier IN ('free', 'starter', 'pro', 'enterprise')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'suspended', 'cancelled'))
);

-- Indexes
CREATE INDEX idx_golf_courses_slug ON golf_courses(slug);
CREATE INDEX idx_golf_courses_status ON golf_courses(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_golf_courses_phone ON golf_courses(twilio_phone_number);

-- Updated_at Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_golf_courses_updated_at
BEFORE UPDATE ON golf_courses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Sample Data (Fox Hollow)
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
    '#2E7D32',  -- Green color
    'friendly',
    'Thanks for calling Fox Hollow Golf Course! How can I help you today?',
    '{"monday": "7am-8pm", "tuesday": "7am-8pm", "wednesday": "7am-8pm", "thursday": "7am-8pm", "friday": "7am-8pm", "saturday": "6am-9pm", "sunday": "6am-9pm"}'::JSONB,
    '{"weekday": 25, "weekend": 45, "twilight": 20, "cart": 18, "club_rental": 15}'::JSONB,
    '["18-hole championship course", "The Fox Den Restaurant", "Event venue", "Wedding venue", "Driving range", "Private lessons"]'::JSONB,
    'active'
);
```

**Key Design Decisions**:
- **JSONB fields**: Flexible schema for course-specific data (hours, pricing, menu)
- **Slug field**: URL-friendly identifier for API routing
- **Soft delete**: `deleted_at` instead of hard delete (preserve conversation history)
- **Brand customization**: Logo, colors, personality for white-label experience
- **Twilio integration**: Store phone number and webhook URL per course

---

### 2. callers (Auto-Created Caller Accounts)

**Purpose**: Store caller information (auto-created on first call/text)

```sql
CREATE TABLE callers (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identification
    phone_number TEXT UNIQUE NOT NULL,  -- E.164 format: +15551234567
    phone_number_normalized TEXT UNIQUE NOT NULL,  -- Normalized: 15551234567

    -- Association
    golf_course_id UUID NOT NULL REFERENCES golf_courses(id) ON DELETE CASCADE,

    -- Caller Information (Optional - collected over time)
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    preferred_contact_method TEXT,  -- "phone", "sms", "email"

    -- Statistics
    total_conversations INTEGER DEFAULT 0,
    total_call_duration_seconds INTEGER DEFAULT 0,
    total_text_messages INTEGER DEFAULT 0,
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),

    -- Customer Preferences (learned over time)
    preferred_tee_time TEXT,  -- "morning", "afternoon", "twilight"
    typical_party_size INTEGER,
    notes TEXT,  -- Agent's notes about this caller

    -- Tags for Segmentation (V2)
    tags TEXT[],  -- ["frequent-golfer", "event-planner", "restaurant-customer"]

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_phone_number CHECK (phone_number ~ '^\+[1-9]\d{1,14}$')
);

-- Indexes
CREATE INDEX idx_callers_phone_number ON callers(phone_number);
CREATE INDEX idx_callers_golf_course ON callers(golf_course_id);
CREATE INDEX idx_callers_last_seen ON callers(last_seen DESC);
CREATE INDEX idx_callers_phone_normalized ON callers(phone_number_normalized);

-- Updated_at Trigger
CREATE TRIGGER update_callers_updated_at
BEFORE UPDATE ON callers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Row-Level Security (RLS)
ALTER TABLE callers ENABLE ROW LEVEL SECURITY;

-- Policy: Callers can only see their own record
CREATE POLICY "Callers can only access their own data"
ON callers
FOR SELECT
USING (phone_number = current_setting('app.current_phone_number', true)::text);

-- Policy: Backend can insert/update any caller
CREATE POLICY "Backend service can manage callers"
ON callers
FOR ALL
USING (current_setting('app.role', true) = 'service_role');
```

**Key Design Decisions**:
- **Auto-created**: No manual signup required, accounts created on first call
- **Phone number as unique identifier**: Simplest authentication method
- **Normalized phone**: Store both E.164 format and normalized for flexible matching
- **Statistics tracking**: Analyze caller behavior over time
- **RLS policies**: Callers can only access their own data, backend has full access

---

### 3. conversations (Unlimited Conversation Storage)

**Purpose**: Store EVERY conversation permanently with vector embeddings

```sql
CREATE TABLE conversations (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationships
    caller_id UUID NOT NULL REFERENCES callers(id) ON DELETE CASCADE,
    golf_course_id UUID NOT NULL REFERENCES golf_courses(id) ON DELETE CASCADE,

    -- Conversation Metadata
    channel TEXT NOT NULL,  -- "voice", "sms", "web-chat"
    direction TEXT NOT NULL,  -- "inbound", "outbound"
    status TEXT DEFAULT 'completed',  -- "in-progress", "completed", "failed"

    -- Voice-Specific Fields
    twilio_call_sid TEXT UNIQUE,  -- Twilio Call SID (if voice call)
    call_duration_seconds INTEGER,
    call_recording_url TEXT,

    -- SMS-Specific Fields
    twilio_message_sid TEXT,  -- Twilio Message SID (if SMS)

    -- Conversation Content
    transcript TEXT NOT NULL,  -- Full conversation text
    summary TEXT,  -- AI-generated summary (1-2 sentences)
    intent TEXT,  -- Detected intent: "tee-time", "restaurant", "event", "general-info"
    sentiment TEXT,  -- "positive", "neutral", "negative"
    topics TEXT[],  -- ["pricing", "availability", "weekend-rates"]

    -- Vector Embedding (for semantic search)
    embedding VECTOR(1536),  -- OpenAI text-embedding-3-small dimensions

    -- Outcome Tracking
    outcome TEXT,  -- "booking-made", "question-answered", "callback-requested", "unresolved"
    booking_reference TEXT,  -- If booking was made (reference number)
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_notes TEXT,

    -- Agent Performance
    agent_response_time_ms INTEGER,  -- Latency from caller stop speaking → agent response
    agent_interruptions INTEGER DEFAULT 0,  -- Number of times agent was interrupted

    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_channel CHECK (channel IN ('voice', 'sms', 'web-chat')),
    CONSTRAINT valid_direction CHECK (direction IN ('inbound', 'outbound')),
    CONSTRAINT valid_status CHECK (status IN ('in-progress', 'completed', 'failed')),
    CONSTRAINT valid_sentiment CHECK (sentiment IN ('positive', 'neutral', 'negative', NULL))
);

-- Indexes
CREATE INDEX idx_conversations_caller ON conversations(caller_id, created_at DESC);
CREATE INDEX idx_conversations_golf_course ON conversations(golf_course_id, created_at DESC);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX idx_conversations_intent ON conversations(intent);
CREATE INDEX idx_conversations_channel ON conversations(channel);

-- Vector Index (for similarity search)
CREATE INDEX idx_conversations_embedding ON conversations USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Row-Level Security (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Callers can only see their own conversations
CREATE POLICY "Callers can only access their own conversations"
ON conversations
FOR SELECT
USING (
    caller_id IN (
        SELECT id FROM callers
        WHERE phone_number = current_setting('app.current_phone_number', true)::text
    )
);

-- Policy: Backend service can manage all conversations
CREATE POLICY "Backend service can manage conversations"
ON conversations
FOR ALL
USING (current_setting('app.role', true) = 'service_role');
```

**Key Design Decisions**:
- **Unlimited storage**: No expiration, all conversations stored forever
- **Vector embeddings**: Enable semantic search ("Find conversations about weddings")
- **Rich metadata**: Intent, sentiment, topics for analytics
- **Multi-channel support**: Voice, SMS, web chat in same table
- **Performance tracking**: Response time, interruptions for quality monitoring
- **RLS isolation**: Callers only see their own conversations

---

### 4. demo_courses (Custom Demo Golf Courses)

**Purpose**: Store custom demo courses created by prospects

```sql
CREATE TABLE demo_courses (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    demo_slug TEXT UNIQUE NOT NULL,  -- Unique shareable link: "abc123xyz"

    -- Basic Information
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    website_url TEXT,
    phone_number TEXT,

    -- Uploaded Files
    logo_url TEXT,  -- URL to logo in Supabase Storage
    menu_file_url TEXT,
    scorecard_file_url TEXT,

    -- Scraped Data (from website)
    scraped_data JSONB,  -- {"hours": "...", "pricing": "...", "amenities": [...]}
    scrape_status TEXT DEFAULT 'pending',  -- "pending", "success", "failed"
    scrape_error TEXT,

    -- AI-Processed Data (from uploaded files)
    menu_data JSONB,  -- Parsed menu items with prices
    scorecard_data JSONB,  -- Hole-by-hole details
    ai_processing_status TEXT DEFAULT 'pending',  -- "pending", "processing", "completed", "failed"
    ai_processing_error TEXT,

    -- Form Data (from onboarding modal)
    operating_hours TEXT,
    services TEXT[],  -- ["restaurant", "events", "lessons"]

    -- Demo Configuration
    interaction_limit INTEGER DEFAULT 25,
    interaction_count INTEGER DEFAULT 0,
    demo_status TEXT DEFAULT 'active',  -- "active", "limit-reached", "expired", "disabled"

    -- Lead Information
    creator_email TEXT NOT NULL,  -- Required for demo creation
    creator_name TEXT,
    creator_phone TEXT,

    -- Analytics
    total_visitors INTEGER DEFAULT 0,  -- Unique visitors to demo link
    total_text_chats INTEGER DEFAULT 0,
    total_voice_calls INTEGER DEFAULT 0,
    shared_count INTEGER DEFAULT 0,  -- Number of times link was shared

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,  -- Optional expiration (e.g., 30 days)
    last_accessed TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT valid_demo_slug CHECK (demo_slug ~ '^[a-z0-9]{9,12}$'),
    CONSTRAINT valid_scrape_status CHECK (scrape_status IN ('pending', 'success', 'failed')),
    CONSTRAINT valid_ai_processing_status CHECK (ai_processing_status IN ('pending', 'processing', 'completed', 'failed')),
    CONSTRAINT valid_demo_status CHECK (demo_status IN ('active', 'limit-reached', 'expired', 'disabled'))
);

-- Indexes
CREATE INDEX idx_demo_courses_slug ON demo_courses(demo_slug);
CREATE INDEX idx_demo_courses_email ON demo_courses(creator_email);
CREATE INDEX idx_demo_courses_status ON demo_courses(demo_status);
CREATE INDEX idx_demo_courses_created_at ON demo_courses(created_at DESC);

-- Function: Generate unique demo slug
CREATE OR REPLACE FUNCTION generate_demo_slug()
RETURNS TEXT AS $$
DECLARE
    slug TEXT;
    slug_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate random 9-character alphanumeric slug
        slug := lower(substr(md5(random()::text), 1, 9));

        -- Check if slug already exists
        SELECT EXISTS(SELECT 1 FROM demo_courses WHERE demo_slug = slug) INTO slug_exists;

        EXIT WHEN NOT slug_exists;
    END LOOP;

    RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- Row-Level Security (RLS)
ALTER TABLE demo_courses ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read demo courses (for demo access)
CREATE POLICY "Anyone can read demo courses"
ON demo_courses
FOR SELECT
USING (demo_status IN ('active', 'limit-reached'));

-- Policy: Backend service can manage demos
CREATE POLICY "Backend service can manage demo courses"
ON demo_courses
FOR ALL
USING (current_setting('app.role', true) = 'service_role');
```

**Key Design Decisions**:
- **Unique demo slug**: Short, shareable link (e.g., "abc123xyz")
- **Separate from production**: Demo data isolated from production courses
- **Scraping + AI processing**: Track status separately for debugging
- **Interaction limit**: Enforced at application level, tracked in DB
- **Analytics**: Track usage for lead qualification
- **Permanent storage**: Demos never expire automatically (can be disabled manually)

---

### 5. demo_interactions (Demo Usage Tracking)

**Purpose**: Track each text/voice interaction for demo limit enforcement

```sql
CREATE TABLE demo_interactions (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationships
    demo_course_id UUID NOT NULL REFERENCES demo_courses(id) ON DELETE CASCADE,

    -- Interaction Details
    interaction_type TEXT NOT NULL,  -- "text-chat", "voice-call"
    duration_seconds INTEGER,  -- For voice calls
    user_ip TEXT,  -- Track IP for abuse prevention
    user_agent TEXT,  -- Browser/device info

    -- Content
    user_message TEXT,
    agent_response TEXT,
    intent TEXT,  -- Detected intent

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_interaction_type CHECK (interaction_type IN ('text-chat', 'voice-call'))
);

-- Indexes
CREATE INDEX idx_demo_interactions_demo_course ON demo_interactions(demo_course_id, created_at DESC);
CREATE INDEX idx_demo_interactions_created_at ON demo_interactions(created_at DESC);
CREATE INDEX idx_demo_interactions_ip ON demo_interactions(user_ip);

-- Row-Level Security (RLS)
ALTER TABLE demo_interactions ENABLE ROW LEVEL SECURITY;

-- Policy: Backend service only
CREATE POLICY "Backend service can manage demo interactions"
ON demo_interactions
FOR ALL
USING (current_setting('app.role', true) = 'service_role');

-- Trigger: Update demo_courses.interaction_count on INSERT
CREATE OR REPLACE FUNCTION increment_demo_interaction_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE demo_courses
    SET
        interaction_count = interaction_count + 1,
        last_accessed = NOW(),
        total_text_chats = total_text_chats + CASE WHEN NEW.interaction_type = 'text-chat' THEN 1 ELSE 0 END,
        total_voice_calls = total_voice_calls + CASE WHEN NEW.interaction_type = 'voice-call' THEN 1 ELSE 0 END,
        demo_status = CASE
            WHEN interaction_count + 1 >= interaction_limit THEN 'limit-reached'
            ELSE demo_status
        END
    WHERE id = NEW.demo_course_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_demo_interaction_count
AFTER INSERT ON demo_interactions
FOR EACH ROW
EXECUTE FUNCTION increment_demo_interaction_count();
```

**Key Design Decisions**:
- **Separate table**: Don't store full conversations for demos (privacy + cost)
- **Automatic counting**: Trigger updates demo_courses.interaction_count
- **Automatic limit enforcement**: Trigger sets demo_status='limit-reached' at 25
- **IP tracking**: Detect abuse patterns
- **Lightweight storage**: Only store basics, not full conversation history

---

### 6. demo_leads (Email Captures from Demo Creation)

**Purpose**: Store email leads captured during demo creation for marketing

```sql
CREATE TABLE demo_leads (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationships
    demo_course_id UUID UNIQUE NOT NULL REFERENCES demo_courses(id) ON DELETE CASCADE,

    -- Lead Information
    email TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    company_name TEXT,  -- Same as demo course name usually

    -- Lead Source
    referral_source TEXT,  -- "organic", "google-ads", "linkedin", etc.
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,

    -- Lead Qualification
    lead_score INTEGER DEFAULT 0,  -- 0-100, increases with demo usage
    lead_status TEXT DEFAULT 'new',  -- "new", "contacted", "qualified", "converted", "unqualified"

    -- Conversion Tracking
    converted_to_customer BOOLEAN DEFAULT false,
    converted_golf_course_id UUID REFERENCES golf_courses(id),
    converted_at TIMESTAMPTZ,

    -- Follow-up
    last_contacted TIMESTAMPTZ,
    next_follow_up TIMESTAMPTZ,
    notes TEXT,

    -- Email Marketing
    email_verified BOOLEAN DEFAULT false,
    opted_in_marketing BOOLEAN DEFAULT true,  -- Assumed opt-in on demo creation
    unsubscribed BOOLEAN DEFAULT false,
    unsubscribed_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_lead_status CHECK (lead_status IN ('new', 'contacted', 'qualified', 'converted', 'unqualified'))
);

-- Indexes
CREATE INDEX idx_demo_leads_email ON demo_leads(email);
CREATE INDEX idx_demo_leads_status ON demo_leads(lead_status);
CREATE INDEX idx_demo_leads_created_at ON demo_leads(created_at DESC);
CREATE INDEX idx_demo_leads_demo_course ON demo_leads(demo_course_id);

-- Updated_at Trigger
CREATE TRIGGER update_demo_leads_updated_at
BEFORE UPDATE ON demo_leads
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-calculate lead score based on demo usage
CREATE OR REPLACE FUNCTION calculate_lead_score()
RETURNS TRIGGER AS $$
DECLARE
    demo demo_courses%ROWTYPE;
    score INTEGER := 0;
BEGIN
    -- Get demo course data
    SELECT * INTO demo FROM demo_courses WHERE id = NEW.demo_course_id;

    -- Base score: 10 points for creating demo
    score := 10;

    -- +5 points for each interaction (up to 50 points)
    score := score + LEAST(demo.interaction_count * 5, 50);

    -- +20 points if they've shared the link
    IF demo.shared_count > 0 THEN
        score := score + 20;
    END IF;

    -- +10 points if demo has been accessed multiple times
    IF demo.total_visitors > 3 THEN
        score := score + 10;
    END IF;

    -- +10 points if they uploaded files (shows seriousness)
    IF demo.menu_file_url IS NOT NULL OR demo.scorecard_file_url IS NOT NULL THEN
        score := score + 10;
    END IF;

    NEW.lead_score := LEAST(score, 100);  -- Cap at 100

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_calculate_lead_score
BEFORE INSERT OR UPDATE ON demo_leads
FOR EACH ROW
EXECUTE FUNCTION calculate_lead_score();

-- Row-Level Security (RLS)
ALTER TABLE demo_leads ENABLE ROW LEVEL SECURITY;

-- Policy: Backend service only (sensitive lead data)
CREATE POLICY "Backend service can manage demo leads"
ON demo_leads
FOR ALL
USING (current_setting('app.role', true) = 'service_role');
```

**Key Design Decisions**:
- **Automatic lead scoring**: Trigger calculates score based on demo usage
- **Conversion tracking**: Link demo leads to converted golf_courses
- **Email marketing compliance**: Track opt-in, unsubscribe status
- **UTM tracking**: Capture marketing attribution
- **RLS protection**: Only backend can access (contains sensitive email data)

---

## Supabase Storage Configuration

### Buckets

**1. course-assets (Production Golf Course Files)**
```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-assets', 'course-assets', true);

-- Storage policy: Anyone can read
CREATE POLICY "Anyone can read course assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-assets');

-- Storage policy: Backend can upload
CREATE POLICY "Backend can upload course assets"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'course-assets'
    AND current_setting('app.role', true) = 'service_role'
);

-- File structure:
-- course-assets/
--   {golf_course_slug}/
--     logo.png
--     menu.pdf
--     scorecard.pdf
--     event-space-photo.jpg
```

**2. demo-assets (Demo Golf Course Files)**
```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('demo-assets', 'demo-assets', true);

-- Storage policy: Anyone can read
CREATE POLICY "Anyone can read demo assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'demo-assets');

-- Storage policy: Backend can upload
CREATE POLICY "Backend can upload demo assets"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'demo-assets'
    AND current_setting('app.role', true) = 'service_role'
);

-- File structure:
-- demo-assets/
--   {demo_slug}/
--     logo.png
--     menu.pdf
--     scorecard.pdf
```

**File Upload Constraints**:
- Max file size: 5MB
- Allowed types: `image/png`, `image/jpeg`, `application/pdf`
- File naming convention: `{timestamp}_{original_filename}`

---

## Key Queries & Performance Patterns

### Query 1: Retrieve Last 3 Conversations for Caller

```sql
-- Used on every call to inject context into agent
SELECT
    id,
    transcript,
    summary,
    intent,
    created_at
FROM conversations
WHERE caller_id = $1
ORDER BY created_at DESC
LIMIT 3;

-- Performance: <50ms with idx_conversations_caller
```

### Query 2: Check Demo Interaction Limit

```sql
-- Used before each demo interaction to enforce 25 limit
SELECT
    demo_status,
    interaction_count,
    interaction_limit
FROM demo_courses
WHERE demo_slug = $1;

-- Performance: <10ms with idx_demo_courses_slug
```

### Query 3: Semantic Search Across Conversations

```sql
-- Find conversations similar to a query (V2 feature)
SELECT
    c.id,
    c.transcript,
    c.summary,
    c.created_at,
    1 - (c.embedding <=> $1::vector) AS similarity
FROM conversations c
WHERE c.golf_course_id = $2
ORDER BY c.embedding <=> $1::vector
LIMIT 10;

-- Performance: <200ms with idx_conversations_embedding (IVFFlat)
-- $1 = query embedding (vector)
-- $2 = golf_course_id (UUID)
```

### Query 4: Get Caller Statistics

```sql
-- Retrieve caller info with latest conversation
SELECT
    c.id,
    c.phone_number,
    c.first_name,
    c.last_name,
    c.total_conversations,
    c.last_seen,
    conv.summary AS last_conversation_summary
FROM callers c
LEFT JOIN LATERAL (
    SELECT summary, created_at
    FROM conversations
    WHERE caller_id = c.id
    ORDER BY created_at DESC
    LIMIT 1
) conv ON true
WHERE c.phone_number = $1;

-- Performance: <30ms
```

### Query 5: Demo Analytics Dashboard

```sql
-- Get demo performance metrics
SELECT
    dc.name,
    dc.demo_slug,
    dc.interaction_count,
    dc.total_visitors,
    dc.total_text_chats,
    dc.total_voice_calls,
    dc.created_at,
    dl.email,
    dl.lead_score,
    dl.lead_status
FROM demo_courses dc
LEFT JOIN demo_leads dl ON dl.demo_course_id = dc.id
WHERE dc.demo_status = 'active'
ORDER BY dc.interaction_count DESC;

-- Performance: <100ms
```

---

## Row-Level Security (RLS) Summary

### Production Tables

**callers**:
- ✅ Callers can SELECT their own data (via phone_number)
- ✅ Backend service role has full access

**conversations**:
- ✅ Callers can SELECT their own conversations (via caller_id → phone_number)
- ✅ Backend service role has full access

**golf_courses**:
- ✅ Public can SELECT active courses (for frontend display)
- ✅ Backend service role has full access

### Demo Tables

**demo_courses**:
- ✅ Anyone can SELECT active demos (for demo access via shareable link)
- ✅ Backend service role has full access

**demo_interactions**:
- ✅ Backend service role only (no public access)

**demo_leads**:
- ✅ Backend service role only (sensitive email data)

---

## Migration Scripts

### Initial Setup Script

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create tables in order (respect foreign keys)
-- 1. golf_courses (no dependencies)
-- 2. users (V2, no dependencies)
-- 3. callers (depends on golf_courses)
-- 4. conversations (depends on callers, golf_courses)
-- 5. demo_courses (no dependencies)
-- 6. demo_interactions (depends on demo_courses)
-- 7. demo_leads (depends on demo_courses, golf_courses)

-- Run all CREATE TABLE statements from above
-- ...

-- Create storage buckets
-- ...

-- Enable RLS on all tables
-- ...

-- Create all policies
-- ...

-- Insert sample data (Fox Hollow)
-- ...
```

### Rollback Script (Development Only)

```sql
-- Drop tables in reverse order
DROP TABLE IF EXISTS demo_leads CASCADE;
DROP TABLE IF EXISTS demo_interactions CASCADE;
DROP TABLE IF EXISTS demo_courses CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS callers CASCADE;
DROP TABLE IF EXISTS golf_courses CASCADE;

-- Drop storage buckets
DELETE FROM storage.objects WHERE bucket_id IN ('course-assets', 'demo-assets');
DELETE FROM storage.buckets WHERE id IN ('course-assets', 'demo-assets');

-- Drop extensions (only if not used elsewhere)
-- DROP EXTENSION IF EXISTS "vector";
```

---

## Database Backup & Maintenance

### Backup Strategy (V2)

**Supabase Built-in Backups**:
- Daily automatic backups (included in Pro plan)
- Point-in-time recovery (PITR)
- Manual backup before major migrations

**Custom Backup Script**:
```bash
# Backup all tables to SQL dump
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Backup to S3 (production)
pg_dump $DATABASE_URL | gzip | aws s3 cp - s3://proshop-backups/backup_$(date +%Y%m%d).sql.gz
```

### Maintenance Tasks

**Weekly**:
- Vacuum analyze conversations table (rebuild indexes)
- Check disk usage, conversation count growth

**Monthly**:
- Archive old demo_interactions (older than 90 days)
- Review and delete inactive demos (no access in 6 months)

**Quarterly**:
- Review conversation storage costs
- Optimize vector indexes (rebuild if needed)
- Audit RLS policies for security

---

## Sample Data: Fox Hollow Golf Course

**Inserted via migration script**:

```sql
-- Golf course (already shown above)
-- INSERT INTO golf_courses (...) VALUES (...);

-- Sample caller
INSERT INTO callers (
    phone_number,
    phone_number_normalized,
    golf_course_id,
    first_name,
    total_conversations,
    first_seen,
    last_seen
) VALUES (
    '+15551234567',
    '15551234567',
    (SELECT id FROM golf_courses WHERE slug = 'fox-hollow'),
    'John',
    3,
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '1 day'
);

-- Sample conversations
INSERT INTO conversations (
    caller_id,
    golf_course_id,
    channel,
    direction,
    transcript,
    summary,
    intent,
    sentiment,
    topics,
    outcome,
    call_duration_seconds,
    started_at,
    ended_at
) VALUES
(
    (SELECT id FROM callers WHERE phone_number = '+15551234567'),
    (SELECT id FROM golf_courses WHERE slug = 'fox-hollow'),
    'voice',
    'inbound',
    'Caller: Hi, I''d like to book a tee time for Saturday.
Agent: I''d be happy to help! What time works best for you?
Caller: Around 9am if possible.
Agent: Perfect! I have 9:15am available. How many players?
Caller: Four players.
Agent: Great! I''ve noted that down. Can I get your name and phone number?',
    'Customer inquired about Saturday tee time, requested 9am for 4 players.',
    'tee-time',
    'positive',
    ARRAY['tee-time', 'weekend', 'morning'],
    'booking-made',
    180,
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days' + INTERVAL '3 minutes'
),
(
    (SELECT id FROM callers WHERE phone_number = '+15551234567'),
    (SELECT id FROM golf_courses WHERE slug = 'fox-hollow'),
    'voice',
    'inbound',
    'Caller: Hey, I booked a tee time for Saturday at 9:15. Can I change it to 10am?
Agent: Of course! Let me look that up. Yes, I can move your 9:15am time to 10am. Still 4 players?
Caller: Yes, four players. Thanks!',
    'Customer changed Saturday tee time from 9:15am to 10am.',
    'tee-time',
    'positive',
    ARRAY['tee-time', 'reschedule'],
    'booking-modified',
    90,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days' + INTERVAL '90 seconds'
),
(
    (SELECT id FROM callers WHERE phone_number = '+15551234567'),
    (SELECT id FROM golf_courses WHERE slug = 'fox-hollow'),
    'voice',
    'inbound',
    'Caller: What are your restaurant hours?
Agent: The Fox Den Restaurant is open daily from 7am to 8pm. Would you like to make a reservation?
Caller: No, just checking. Thanks!',
    'Customer asked about restaurant hours.',
    'restaurant',
    'neutral',
    ARRAY['restaurant', 'hours'],
    'question-answered',
    45,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day' + INTERVAL '45 seconds'
);
```

---

## Entity Relationship Diagram (ERD)

```
┌─────────────────┐
│  golf_courses   │
│─────────────────│
│ id (PK)         │
│ name            │
│ slug (UNIQUE)   │
│ phone_number    │
│ ...             │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────┐          ┌──────────────────┐
│    callers      │          │  conversations   │
│─────────────────│          │──────────────────│
│ id (PK)         │◄────────┐│ id (PK)          │
│ phone_number    │         ││ caller_id (FK)   │
│ golf_course_id  │◄────────┘│ golf_course_id   │
│ total_convs     │    1:N   │ transcript       │
│ ...             │          │ embedding        │
└─────────────────┘          │ ...              │
                             └──────────────────┘


┌─────────────────┐
│  demo_courses   │
│─────────────────│
│ id (PK)         │
│ demo_slug       │
│ name            │
│ creator_email   │
│ interaction_ct  │
│ ...             │
└────────┬────────┘
         │
         │ 1:N
         │
    ┌────▼────────────────┐
    │ demo_interactions   │
    │─────────────────────│
    │ id (PK)             │
    │ demo_course_id (FK) │
    │ interaction_type    │
    │ ...                 │
    └─────────────────────┘
         │
         │ 1:1
         │
    ┌────▼──────────┐
    │  demo_leads   │
    │───────────────│
    │ id (PK)       │
    │ demo_course_id│
    │ email         │
    │ lead_score    │
    │ ...           │
    └───────────────┘
```

---

## Database Size Estimates

### MVP (1 Course, 100 Calls/Month)
- **golf_courses**: 1 row = ~5 KB
- **callers**: 50 unique callers = 50 rows × 2 KB = 100 KB
- **conversations**: 100 conversations × 10 KB (avg) = 1 MB
- **Embeddings**: 100 × 6 KB (1536-dim vector) = 600 KB
- **demo_courses**: 10 demos = 10 × 5 KB = 50 KB
- **demo_interactions**: 250 interactions = 250 × 1 KB = 250 KB
- **Total**: ~2 MB/month (well within Supabase free tier 500 MB)

### Production (10 Courses, 1000 Calls/Month)
- **conversations**: 1,000 × 10 KB = 10 MB/month
- **Embeddings**: 1,000 × 6 KB = 6 MB/month
- **Annual growth**: ~200 MB/year
- **Total after 1 year**: ~200 MB (still within free tier)

### Scale (100 Courses, 10,000 Calls/Month)
- **conversations**: 10,000 × 10 KB = 100 MB/month
- **Annual growth**: ~1.2 GB/year
- **Total after 1 year**: ~1.2 GB (need Supabase Pro plan: $25/mo)

---

## Next Steps

After this document is approved:
1. Create MEMORY_SYSTEM.md (conversation retrieval logic, embedding generation)
2. Create API_ENDPOINTS.md (FastAPI endpoint specifications)
3. Create DEMO_GENERATOR_SPEC.md (custom demo creation flow)
4. Create VOICE_PIPELINE.md (Twilio → Deepgram → Agent → ElevenLabs)

---

**Document Status**: Draft v1.0
**Last Updated**: 2025-10-28
**Next Review**: After approval and before MEMORY_SYSTEM.md creation
