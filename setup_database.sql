-- ============================================================================
-- ProShop 24/7 - Complete Database Setup Script
-- ============================================================================
-- Paste this entire script into Supabase SQL Editor and click "Run"
-- This will create all tables, indexes, RLS policies, and sample data
-- ============================================================================

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- TABLE 1: golf_courses (Production)
-- ============================================================================
CREATE TABLE golf_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    phone_number TEXT NOT NULL,
    location TEXT,
    timezone TEXT DEFAULT 'America/Denver',
    hours_of_operation JSONB,
    pricing JSONB,
    amenities TEXT[],
    policies JSONB,
    special_notes TEXT,
    website_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_golf_courses_slug ON golf_courses(slug);
CREATE INDEX idx_golf_courses_phone ON golf_courses(phone_number);

-- ============================================================================
-- TABLE 2: callers (Production)
-- ============================================================================
CREATE TABLE callers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    golf_course_id UUID NOT NULL REFERENCES golf_courses(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    total_conversations INTEGER DEFAULT 0,
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(golf_course_id, phone_number)
);

CREATE INDEX idx_callers_phone ON callers(phone_number);
CREATE INDEX idx_callers_golf_course ON callers(golf_course_id);
CREATE INDEX idx_callers_last_seen ON callers(last_seen DESC);

-- ============================================================================
-- TABLE 3: conversations (Production)
-- ============================================================================
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caller_id UUID NOT NULL REFERENCES callers(id) ON DELETE CASCADE,
    golf_course_id UUID NOT NULL REFERENCES golf_courses(id) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK (channel IN ('voice', 'text-chat', 'sms')),
    transcript TEXT NOT NULL,
    summary TEXT,
    intent TEXT,
    sentiment TEXT,
    booking_made BOOLEAN DEFAULT FALSE,
    embedding VECTOR(1536),
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_caller ON conversations(caller_id);
CREATE INDEX idx_conversations_golf_course ON conversations(golf_course_id);
CREATE INDEX idx_conversations_created ON conversations(created_at DESC);
CREATE INDEX idx_conversations_embedding ON conversations USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================================
-- TABLE 4: demo_courses (Demo System)
-- ============================================================================
CREATE TABLE demo_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    location TEXT,
    phone_number TEXT,
    website_url TEXT,
    scraped_data JSONB DEFAULT '{}'::jsonb,
    ai_processed_data JSONB DEFAULT '{}'::jsonb,
    interaction_count INTEGER DEFAULT 0,
    interaction_limit INTEGER DEFAULT 25,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX idx_demo_courses_slug ON demo_courses(slug);
CREATE INDEX idx_demo_courses_status ON demo_courses(status);
CREATE INDEX idx_demo_courses_expires ON demo_courses(expires_at);

-- ============================================================================
-- TABLE 5: demo_interactions (Demo System)
-- ============================================================================
CREATE TABLE demo_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demo_course_id UUID NOT NULL REFERENCES demo_courses(id) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK (channel IN ('voice', 'text-chat')),
    transcript TEXT,
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_demo_interactions_demo_course ON demo_interactions(demo_course_id);
CREATE INDEX idx_demo_interactions_session ON demo_interactions(session_id);
CREATE INDEX idx_demo_interactions_created ON demo_interactions(created_at DESC);

-- ============================================================================
-- TABLE 6: demo_leads (Demo System)
-- ============================================================================
CREATE TABLE demo_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demo_course_id UUID REFERENCES demo_courses(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    course_name TEXT NOT NULL,
    course_url TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'lost')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_demo_leads_email ON demo_leads(email);
CREATE INDEX idx_demo_leads_status ON demo_leads(status);
CREATE INDEX idx_demo_leads_created ON demo_leads(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE golf_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE callers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_leads ENABLE ROW LEVEL SECURITY;

-- Golf Courses: Service role can do everything, anon can read
CREATE POLICY "Service role full access" ON golf_courses FOR ALL USING (true);
CREATE POLICY "Public read access" ON golf_courses FOR SELECT USING (true);

-- Callers: Service role full access
CREATE POLICY "Service role full access" ON callers FOR ALL USING (true);

-- Conversations: Service role full access
CREATE POLICY "Service role full access" ON conversations FOR ALL USING (true);

-- Demo Courses: Public can read active demos, service role full access
CREATE POLICY "Service role full access" ON demo_courses FOR ALL USING (true);
CREATE POLICY "Public read active demos" ON demo_courses FOR SELECT USING (status = 'active');

-- Demo Interactions: Service role full access
CREATE POLICY "Service role full access" ON demo_interactions FOR ALL USING (true);

-- Demo Leads: Service role full access
CREATE POLICY "Service role full access" ON demo_leads FOR ALL USING (true);

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for golf_courses
CREATE TRIGGER golf_courses_updated_at
    BEFORE UPDATE ON golf_courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Function to increment demo interaction count
CREATE OR REPLACE FUNCTION increment_demo_interaction_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE demo_courses
    SET interaction_count = interaction_count + 1
    WHERE id = NEW.demo_course_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for demo_interactions
CREATE TRIGGER demo_interaction_counter
    AFTER INSERT ON demo_interactions
    FOR EACH ROW
    EXECUTE FUNCTION increment_demo_interaction_count();

-- Function to increment caller conversation count
CREATE OR REPLACE FUNCTION increment_caller_conversation_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE callers
    SET total_conversations = total_conversations + 1,
        last_seen = NOW()
    WHERE id = NEW.caller_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for conversations
CREATE TRIGGER conversation_counter
    AFTER INSERT ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION increment_caller_conversation_count();

-- ============================================================================
-- SAMPLE DATA: Fox Hollow Golf Course
-- ============================================================================

INSERT INTO golf_courses (
    name,
    slug,
    phone_number,
    location,
    timezone,
    hours_of_operation,
    pricing,
    amenities,
    policies,
    special_notes,
    website_url
) VALUES (
    'Fox Hollow Golf Course',
    'fox-hollow',
    '+18015551234',
    'American Fork, Utah',
    'America/Denver',
    '{
        "monday": {"open": "06:00", "close": "21:00"},
        "tuesday": {"open": "06:00", "close": "21:00"},
        "wednesday": {"open": "06:00", "close": "21:00"},
        "thursday": {"open": "06:00", "close": "21:00"},
        "friday": {"open": "06:00", "close": "21:00"},
        "saturday": {"open": "05:30", "close": "21:00"},
        "sunday": {"open": "05:30", "close": "21:00"}
    }'::jsonb,
    '{
        "9_holes": {
            "weekday": 25,
            "weekend": 30,
            "twilight": 20
        },
        "18_holes": {
            "weekday": 45,
            "weekend": 55,
            "twilight": 35
        },
        "cart_rental": 15,
        "club_rental": 20,
        "season_pass": 1200
    }'::jsonb,
    ARRAY[
        'Pro Shop',
        'Driving Range',
        'Putting Green',
        'Golf Carts',
        'Club Rentals',
        'Lessons Available',
        'Clubhouse',
        'Snack Bar',
        'Beer & Wine'
    ],
    '{
        "cancellation": "Cancel up to 24 hours before tee time for full refund",
        "dress_code": "Collared shirts required. No denim or athletic wear.",
        "pace_of_play": "18 holes should take approximately 4.5 hours",
        "booking_window": "Tee times can be booked up to 7 days in advance",
        "payment": "We accept all major credit cards. Cash accepted in pro shop."
    }'::jsonb,
    'Championship 18-hole course designed by Gene Bates. Rated 4.5 stars. Beautiful mountain views. Known for challenging water hazards on holes 7, 12, and 16.',
    'https://www.foxhollowgolf.com'
);

-- Create demo version of Fox Hollow
INSERT INTO demo_courses (
    name,
    slug,
    location,
    phone_number,
    website_url,
    scraped_data,
    ai_processed_data,
    interaction_limit,
    status
) VALUES (
    'Fox Hollow Golf Course',
    'fox-hollow',
    'American Fork, Utah',
    '+18015551234',
    'https://www.foxhollowgolf.com',
    '{
        "course_name": "Fox Hollow Golf Course",
        "location": "American Fork, Utah",
        "description": "Championship 18-hole course with mountain views"
    }'::jsonb,
    '{
        "hours": "6:00 AM - 9:00 PM daily",
        "pricing": "18 holes: $45-55, 9 holes: $25-30",
        "amenities": ["Pro Shop", "Driving Range", "Club Rentals", "Snack Bar"],
        "special_features": "Challenging water hazards, Gene Bates design, 4.5-star rated"
    }'::jsonb,
    1000,
    'active'
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify setup (optional):
-- SELECT COUNT(*) FROM golf_courses; -- Should return 1
-- SELECT COUNT(*) FROM demo_courses; -- Should return 1
-- SELECT name, slug FROM golf_courses;
-- SELECT name, slug FROM demo_courses;

-- ============================================================================
-- SETUP COMPLETE! 🎉
-- ============================================================================
-- You now have:
-- ✅ 6 tables created
-- ✅ All indexes and vector search enabled
-- ✅ RLS policies configured
-- ✅ Triggers for auto-updating counts
-- ✅ Fox Hollow Golf Course data loaded
-- ============================================================================
