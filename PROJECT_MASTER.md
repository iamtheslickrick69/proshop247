# ProShop 24/7 - Project Master Document

## Project Vision

ProShop 24/7 is a voice AI agent system designed specifically for golf courses to handle customer inquiries 24/7 via phone and text. The system uses advanced conversation memory to recognize returning callers and maintain context across interactions, creating a personalized customer experience that rivals human staff.

**Core Differentiator**: Unlike traditional chatbots, ProShop 24/7 automatically creates customer profiles from phone numbers and remembers EVERY conversation forever. The system retrieves the last 3 conversations for immediate context, making every interaction feel personal and contextual while maintaining complete conversation history.

**Launch Strategy**: Building exclusively for **Fox Hollow Golf Course** as our first customer and case study. Fox Hollow branding, data, and theming will be integrated throughout. We will scale to 10 accounts using Fox Hollow as the proven reference implementation.

**Game-Changing Demo Strategy**: The landing page offers two paths:
1. **"Try Fox Hollow Demo"** - Pre-loaded, polished example with real course data
2. **"Upload Your Own Course"** - Prospects create their own custom AI demo in 30 seconds, get a shareable link, and can test their course immediately (25 free interactions)

This product-led growth approach turns every prospect into a demo creator and viral marketing agent.

---

## Project Goals

### Primary Goals
1. **Automate customer service** - Handle tee time bookings, restaurant reservations, event inquiries, and general questions 24/7
2. **Personalized experience** - Remember every caller and maintain conversation context across all interactions
3. **Reduce operational costs** - Eliminate need for after-hours staff while improving response times
4. **Increase revenue** - Capture bookings that would otherwise be missed during closed hours
5. **Product-led growth** - Enable prospects to create custom demos instantly, driving viral adoption

### Technical Goals
1. Build production-ready voice AI agent using LangChain + Claude Sonnet 4.5
2. Implement robust conversation memory system with vector embeddings
3. Create seamless voice pipeline (Twilio → Deepgram → Agent → ElevenLabs → Twilio)
4. Deliver Apple/OpenAI-inspired frontend experience in Lovable
5. Deploy scalable backend infrastructure
6. Ensure data privacy and user isolation (each caller's data is protected)
7. Build dynamic demo generation system for instant custom demos

---

## Success Criteria

### MVP Success (Night 1 - 7-8 hours with full demo system)
✅ Working phone number that answers calls with AI voice agent
✅ Auto-account creation when new phone number calls
✅ Memory system stores EVERY conversation permanently
✅ Memory system retrieves last 3 conversations for context
✅ Data isolation: Each caller only sees their own conversation history
✅ Natural voice responses using ElevenLabs
✅ Live landing page with dual-demo system:
  - Fox Hollow pre-loaded demo (text + voice)
  - Custom demo generator (upload course data, get shareable link)
  - Email capture (required for custom demos)
  - 25 free interactions per custom demo
  - **Web scraping working** (auto-extracts data from website URLs)
  - **AI file processing working** (Claude analyzes PDFs/images, extracts structured data)
  - **Hybrid degradation** (gracefully handles scraping failures)
✅ End-to-end tested and deployed

### V2 Success (Week 2+)
✅ OAuth login system (Google/Gmail)
✅ Full dashboard with analytics
✅ Course onboarding flow (3-step process)
✅ Agent customization (upload menus, scorecards, pricing templates)
✅ Calendar integration (Google Calendar, tee sheet APIs)
✅ Automated pricing template switching
✅ Test agent interface for customers
✅ Conversation history viewer (customer can see all their past conversations)
✅ Convert demo users to paid customers (upgrade flow)

### Business Success (3 months)
✅ 10+ golf courses using the system
✅ 90%+ customer satisfaction on AI interactions
✅ 50%+ reduction in missed bookings
✅ Avg 2-minute call handling time
✅ Zero data privacy incidents
✅ 100+ custom demos created (lead pipeline)
✅ 20%+ demo-to-customer conversion rate

---

## Project Scope

### MVP (In Scope for Night 1)

**Backend**
- FastAPI application with RESTful endpoints
- LangChain agent using Claude Sonnet 4.5
- Conversation memory system:
  - Auto-account creation on first call
  - Store EVERY conversation permanently
  - Retrieve last 3 conversations for context injection
  - Data isolation per phone number
- Vector database using Supabase pgvector
- Twilio phone integration (inbound calls for demos + production)
- ElevenLabs text-to-speech integration
- Deepgram speech-to-text integration
- **Dynamic demo generation system**:
  - Create custom AI agents on-the-fly
  - Store demo course data separately from production
  - Track interaction count per demo (25 limit)
  - Generate unique shareable demo links
- Deployed to Railway (or Render)

**Frontend (Lovable)**
- Landing page (Apple/OpenAI aesthetic with Fox Hollow branding)
- Hero section with value proposition
- **Dual-demo system**:
  - **Option 1**: "Try Fox Hollow Demo" button
    - Pre-loaded with Fox Hollow data
    - Text chat + Voice call demos
    - Shows polished, professional example
  - **Option 2**: "Upload Your Own Course" button
    - Opens mini onboarding modal
    - Quick form: course name, location, website, file uploads (menu, scorecard, logo)
    - Email required (lead capture)
    - Generates custom demo link: `proshop247.com/demo/abc123xyz`
    - 25 free interactions (text + voice combined)
    - Shareable link for stakeholders
- 3-step explainer section (how it works)
- CTA buttons (Sign Up, Schedule Demo, Get Started)
- Mobile responsive

**Database (Supabase)**
- PostgreSQL with pgvector extension
- **Production tables**:
  - `golf_courses` - Production customers (Fox Hollow first)
  - `callers` - Customer accounts (auto-created per phone number)
  - `conversations` - All conversations with embeddings
- **Demo tables**:
  - `demo_courses` - Custom demo course data
  - `demo_interactions` - Track usage per demo (count toward 25 limit)
  - `demo_leads` - Email captures from demo creation
- Row-Level Security (RLS) for data isolation
- File storage for uploaded menus, scorecards, logos

**Core Features**
- Phone number answers 24/7
- Natural voice conversations
- Remembers every caller automatically
- Stores ALL conversations (unlimited history)
- Retrieves last 3 conversations for immediate context
- Data privacy: Users only access their own data
- **Fox Hollow branding** integrated throughout
- **Custom demo generation** in <60 seconds
- **Email lead capture** on demo creation
- **Demo link sharing** for viral growth
- Handles: tee time inquiries, restaurant questions, event info

### Out of Scope for MVP (V2 Features)
- OAuth login system
- User dashboard and analytics
- Multi-step course onboarding flow
- Advanced file upload processing (AI extraction from PDFs)
- Calendar API integration
- Pricing template management
- Automated pricing switching
- Full test agent interface for users
- SMS text messaging (for production customers, not demos)
- Multi-course management UI
- Admin panel
- Conversation history viewer UI
- Demo-to-paid conversion flow

---

## Timeline

### Night 1: MVP Sprint (7-8 hours with full demo system)
- **Hour 1**: Project setup + Database schema (production + demo tables, RLS)
- **Hour 2**: Voice integrations (ElevenLabs + Deepgram + Twilio pool with routing)
- **Hour 3**: LangChain agent + Memory system (store all, retrieve last 3)
- **Hour 4**: API endpoints (production + demo generation)
- **Hour 5**: Demo system backend (dynamic agent creation, interaction tracking)
- **Hour 6**: Web scraping + AI file processing (BeautifulSoup, Claude analysis, OCR)
- **Hour 7**: Lovable landing page (dual-demo UI, Fox Hollow branding, modal)
- **Hour 8**: Testing + Deployment (test both demo paths end-to-end, scraping, file uploads)

### Week 2: V2 Features (Staged rollout)
- Day 1-2: OAuth + Dashboard skeleton
- Day 3-4: Onboarding flow (3 steps)
- Day 5-6: Agent customization interface
- Day 7: Calendar integration
- Day 8-9: Pricing templates
- Day 10: Demo-to-paid conversion flow

---

## Key Features Breakdown

### 1. Fox Hollow Integration (First Customer)

**Fox Hollow as Case Study:**
- All branding, theming, data specific to Fox Hollow
- Landing page showcases Fox Hollow demo prominently
- Fox Hollow becomes the reference implementation for sales
- Their success drives next 9 customers

**Fox Hollow Data Needed** (to be provided):
- Course name, location, website
- Logo and brand colors
- Restaurant menu
- Scorecard
- Tee time pricing structure
- Operating hours
- Services offered (events, lessons, etc.)
- Tone/personality preferences

**Phone Number Strategy:**
- Option C: Shared Twilio demo pool number
- Routing logic: Caller ID → determines which golf course demo
- Production courses get dedicated numbers
- Cost optimization for demo system

**Fox Hollow Theming:**
- Landing page uses Fox Hollow color palette
- "As featured at Fox Hollow Golf Course"
- Testimonial section ready for Fox Hollow GM quote
- Case study section (post-launch)

### 2. Dual-Demo System ⭐ COMPETITIVE MOAT

**Demo Option 1: Fox Hollow (Pre-Built)**
- Instant access, no signup required
- Text chat demo (embedded widget)
- Voice call demo (click to call Twilio number)
- Shows polished, professional AI agent
- Real Fox Hollow data (menu, pricing, tee times)
- Purpose: Social proof + quality demonstration

**Demo Option 2: Custom Course (User-Generated)**

**User Flow:**
```
1. Click "Upload Your Own Course" button
   ↓
2. Modal/slide-in appears with quick form:

   STEP 1: Basic Info
   - Course name *
   - Location (city, state) *
   - Website URL *
   - Email address * (lead capture)

   STEP 2: Upload Assets (Optional)
   - Restaurant menu (PDF/image)
   - Scorecard (PDF/image)
   - Logo (image)

   STEP 3: Quick Details
   - Operating hours
   - Phone number
   - Services (checkboxes: restaurant, events, lessons, etc.)

   [Generate My Demo] button
   ↓
3. Backend processes:
   - Create unique demo ID (abc123xyz)
   - Store course data in demo_courses table
   - Store email in demo_leads table
   - Generate custom AI agent instance
   - Create shareable link
   ↓
4. Success screen shows:
   "Your demo is ready! Test it now:"

   Link: proshop247.com/demo/abc123xyz

   [Test Text Chat] [Call Voice Demo] [Copy Link to Share]

   "You have 25 free interactions. Share this link with your team!"
   ↓
5. User can:
   - Test text chat immediately
   - Call voice demo (Twilio)
   - Share link with GM, owner, colleagues
   - Forward via email/Slack
```

**Demo System Backend:**
- Unique demo link per course
- Stored permanently (not temporary)
- 25 free interactions limit (texts + calls combined)
- Interaction counter stored in `demo_interactions` table
- When limit reached: "Your demo has reached 25 interactions. Upgrade to unlimited: [Get Started]"
- Email automatically added to lead nurture sequence

**Web Scraping Strategy (Option C - Hybrid):**
- When user enters website URL → Attempt auto-scrape
- Extract: Hours, pricing, menu items, course description, amenities
- Use BeautifulSoup/Playwright for scraping
- If scraping fails → Gracefully degrade (use only form data)
- Store scrape status in demo_courses table
- Agent acknowledges: "I've analyzed your website and found..."

**File Upload Processing (Option C - Full AI Processing):**
- Uploaded PDFs/images → OCR text extraction (Tesseract/AWS Textract)
- Extracted text → Claude API analysis
- Claude extracts structured data:
  - Menu items with prices
  - Scorecard hole-by-hole details
  - Pricing tiers and rules
  - Operating hours and policies
- Structured data → Stored in demo_courses JSON fields
- Embeddings created for semantic search
- Agent can answer: "Looking at your menu, the Fox Burger is $12.99"

**Why This is Genius:**
- **Zero friction**: 30 seconds to custom demo
- **Viral growth**: Shareable links spread organically
- **Lead qualification**: If they upload data, they're serious
- **Social proof**: "Look what I made for our course!"
- **Data collection**: Build prospect database automatically
- **Competitive moat**: Nobody else offers instant custom demos

### 3. Voice AI Agent

- Uses Claude Sonnet 4.5 for natural language understanding
- ElevenLabs for human-like voice generation
- Deepgram for accurate speech-to-text
- Handles interruptions and natural conversation flow
- Supports multiple golf course personas (Fox Hollow first, then custom)
- **Dynamic agent configuration** based on course data (demo or production)

### 4. Conversation Memory System ⭐ CORE INNOVATION

**Auto-Account Creation:**
- When phone number calls for first time → Create caller record
- Store: phone_number, first_seen, total_calls
- No manual signup required
- Each phone number = unique isolated account

**Unlimited Storage:**
- Store EVERY conversation permanently
- No deletion or expiration
- Complete conversation history for each caller
- Enables future features: analytics, insights, customer journey tracking

**Smart Context Retrieval:**
- On each call, retrieve last 3 conversations by phone number
- Inject into agent's system prompt as context
- Keeps agent response time fast while maintaining awareness
- Last 3 conversations provide sufficient context for 95% of use cases

**Data Privacy & Isolation:**
- Row-Level Security (RLS) in Supabase
- Each phone number can only access their own conversations
- No cross-contamination between callers
- Separate isolation between production and demo data
- GDPR/privacy compliant design
- Future: User can request full data export or deletion

**Conversation Storage:**
- After each call, store full conversation text
- Generate embedding using OpenAI text-embedding-3-small
- Store in vector database for future semantic search
- Metadata: duration, outcome, sentiment, topics discussed

**Example Flow:**
```
Call 1 (Monday): "Hi, I'd like to book a tee time for Saturday"
       → System creates account for 555-123-4567
       → Stores conversation #1

Call 2 (Tuesday): "Hey, it's me again, what time did we say?"
       → System loads last 3 (only has 1): "Monday: asked about Saturday tee time"
       → Agent: "Welcome back! We discussed Saturday. What time works for you?"
       → Stores conversation #2

Call 3 (Friday): "I need to change my Saturday time"
       → System loads last 3: Monday's inquiry, Tuesday's confirmation
       → Agent: "Of course! Let me update your Saturday tee time."
       → Stores conversation #3

Call 4 (Next Month): "I'm back for another round"
       → System loads last 3: Tuesday, Friday, Saturday calls
       → BUT still has ALL 4 conversations stored in database
       → Agent has recent context, full history available for advanced queries
```

### 5. Twilio Phone Integration

- Dedicated phone number for Fox Hollow (production)
- Shared Twilio pool for all demos (cost optimization)
- Inbound call webhook → FastAPI endpoint
- Real-time audio streaming
- Call recording and analytics
- Demo interaction counting
- Future: SMS support for production customers

### 6. Lovable Frontend (Landing Page)

**Design Aesthetic:**
- Apple/OpenAI widget style (clean, modern, premium)
- Fox Hollow branding (colors, logo, imagery)
- One-page scroll layout
- Mobile-first responsive design
- Fast loading, smooth animations

**Key Sections:**
1. **Hero**
   - Headline: "Your Golf Course, Answered 24/7"
   - Subheadline: "AI-powered voice agent that remembers every customer"
   - Dual-demo CTAs (Fox Hollow vs Upload Your Own)

2. **Dual-Demo Section**
   - Side-by-side options
   - Fox Hollow demo (left): "See it in action"
   - Custom demo (right): "Try it with your course"

3. **How It Works** (3 steps)
   - Step 1: Connect your systems
   - Step 2: Customize your agent
   - Step 3: Go live 24/7

4. **Features Showcase**
   - 24/7 availability
   - Conversation memory
   - Natural voice
   - Instant bookings
   - Multi-channel (phone + text)

5. **Fox Hollow Case Study**
   - "As featured at Fox Hollow Golf Course"
   - Testimonial (post-launch)
   - Results/metrics

6. **Pricing** (simple, transparent)
   - Free demo (25 interactions)
   - Starter plan
   - Professional plan
   - Enterprise

7. **Footer**
   - Links, privacy policy, contact

---

## Technical Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                  CUSTOMER INTERACTION LAYER                   │
│         (Phone Call / SMS / Text Chat on Landing Page)       │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │     TWILIO      │
                │  (Phone/SMS)    │
                │  - Production   │
                │  - Demo Pool    │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │  FASTAPI BACKEND│
                │   (Railway)     │
                │                 │
                │  Endpoints:     │
                │  - /webhook     │
                │  - /chat        │
                │  - /demo/create │
                │  - /demo/{id}   │
                └────────┬────────┘
                         │
            ┌────────────┼────────────┬──────────────┐
            ▼            ▼            ▼              ▼
      ┌─────────┐  ┌──────────┐  ┌────────┐   ┌──────────┐
      │Deepgram │  │LangChain │  │Supabase│   │Demo      │
      │  (STT)  │  │  Agent   │  │  (DB)  │   │Generator │
      └─────────┘  └──────────┘  └────────┘   └──────────┘
                         │            │
                         ▼            │
                   ┌──────────┐       │
                   │ElevenLabs│       │
                   │  (TTS)   │       │
                   └──────────┘       │
                                     │
                   ┌──────────────────▼──────────────────┐
                   │  Memory System (RLS)                │
                   │  - Store ALL conversations          │
                   │  - Retrieve last 3 for context      │
                   │  - Data isolation per caller        │
                   │  - Separate demo vs production      │
                   └─────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    LOVABLE FRONTEND                           │
│                                                               │
│  ┌────────────────┐              ┌────────────────┐          │
│  │  Fox Hollow    │              │  Custom Demo   │          │
│  │  Demo (Pre)    │     OR       │  Generator     │          │
│  │                │              │  (Modal Form)  │          │
│  └────────────────┘              └────────────────┘          │
│                                                               │
│  - Hero Section                                              │
│  - Dual-Demo System                                          │
│  - 3-Step Explainer                                          │
│  - Features Showcase                                         │
│  - Fox Hollow Case Study                                     │
│  - Pricing                                                   │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Privacy & Security

### Core Principles
1. **User Isolation**: Each phone number's data is completely isolated
2. **Unlimited Storage**: All conversations stored permanently (user owns their data)
3. **Secure Retrieval**: Only retrieve data for authenticated phone number
4. **No Cross-Talk**: Caller A never sees Caller B's data
5. **Demo Separation**: Demo data completely separate from production data
6. **Lead Privacy**: Demo creator emails stored securely, opt-in for marketing
7. **Future-Proof**: Design allows for GDPR data export/deletion

### Implementation
- **Row-Level Security (RLS)** in Supabase
  - Policy: `phone_number = current_phone_number` (production)
  - Policy: `demo_id = current_demo_id` (demos)
  - Enforced at database level, not application level
- **Encryption at Rest** (Supabase default)
- **API Key Security** (environment variables, never in code)
- **Audit Logging**: Track all data access for compliance
- **File Upload Security**: Virus scanning, size limits, allowed file types only

### Compliance Considerations (V2)
- GDPR: Right to access, export, delete data
- CCPA: California privacy compliance
- CAN-SPAM: Email marketing compliance (demo leads)
- HIPAA: Not applicable (no health data)
- PCI: Not applicable (no payment card data stored)

---

## Risk Assessment

### High Priority Risks
1. **Voice latency** - ElevenLabs + Deepgram processing time
   - Mitigation: Use streaming APIs, optimize prompts, <3 second response target
2. **Memory retrieval speed** - Vector search performance at scale
   - Mitigation: Proper indexing, limit to last 3 conversations, cache frequently accessed data
3. **API costs** - Claude + ElevenLabs usage at scale (especially with free demos)
   - Mitigation: 25 interaction limit on demos, optimize token usage, monitor per-call costs
4. **Data privacy breach** - Unauthorized access to conversations
   - Mitigation: RLS, thorough testing, security audit before V2
5. **Demo abuse** - Users creating unlimited demos to get free service
   - Mitigation: Email required (prevents throwaway accounts), rate limiting, monitor for abuse patterns

### Medium Priority Risks
1. **Twilio webhook reliability** - Network issues, downtime
   - Mitigation: Implement retry logic, health checks, fallback numbers
2. **Supabase free tier limits** - Storage and query limits with demo system
   - Mitigation: Monitor usage, plan upgrade path, optimize queries, compress/archive old demos
3. **Conversation storage costs** - Unlimited history = growing database
   - Mitigation: Compress old conversations, archive to cold storage (V3)
4. **Demo quality** - User-uploaded data might be incomplete
   - Mitigation: Set expectations ("Basic demo with limited data"), validate required fields
5. **File upload issues** - Malicious files, large files, wrong formats
   - Mitigation: File type validation, size limits (5MB), virus scanning, S3/Supabase storage

### Low Priority Risks
1. **Lovable deployment issues** - Platform changes
   - Mitigation: Keep frontend simple, avoid complex dependencies
2. **Voice quality degradation** - Network issues
   - Mitigation: Monitor quality metrics, use Twilio quality monitoring
3. **Demo link sharing** - Links shared publicly on forums
   - Mitigation: Track usage, analytics on link performance, can disable abusive demos

---

## Team & Resources

### Development Team (MVP)
- **You** - Product owner, architect, tester, Fox Hollow relationship
- **Claude Code** - Multi-agent development team:
  - Project Manager (oversight, progress tracking)
  - Backend Engineer (FastAPI, LangChain, demo system)
  - Database Architect (Supabase, schema design, RLS)
  - Integration Specialist (Twilio, ElevenLabs, Deepgram)
  - QA Tester (end-to-end testing, demo validation)

### Required API Keys / Accounts
- Anthropic API (Claude Sonnet 4.5)
- ElevenLabs API
- Deepgram API
- Twilio Account (phone numbers for production + demo pool)
- Supabase Project (with pgvector extension)
- OpenAI API (for embeddings only)
- Lovable Account

### Fox Hollow Information Needed
- [ ] Course full name and location
- [ ] Website URL
- [ ] Logo (high-res image)
- [ ] Brand colors (hex codes)
- [ ] Restaurant menu (PDF or text)
- [ ] Scorecard (PDF or image)
- [ ] Tee time pricing structure
- [ ] Operating hours
- [ ] Services offered (events, weddings, lessons, etc.)
- [ ] Tone/personality preferences (friendly, professional, upscale, etc.)
- [ ] Phone number (or assign new Twilio number)

---

## Post-MVP Roadmap

### Phase 2: Dashboard & Onboarding (Week 2)
- User authentication (OAuth)
- Analytics dashboard
- Multi-step course onboarding flow
- Agent customization interface
- **Conversation history viewer** (see all past conversations)
- **Demo-to-paid conversion flow** (upgrade from demo)

### Phase 3: Integrations (Week 3-4)
- Google Calendar sync
- Tee sheet API integration
- Restaurant POS integration
- Pricing templates
- **Advanced memory features** (semantic search across all conversations)
- **Demo analytics** (track which demos convert, usage patterns)

### Phase 4: Scale & Optimize (Month 2)
- Multi-course support (10 accounts goal)
- Admin panel
- Advanced analytics
- A/B testing for prompts
- Voice quality improvements
- **Memory insights** (customer journey analysis, sentiment trends)
- **Demo virality features** (referral tracking, leaderboards)

### Phase 5: Revenue Features (Month 3+)
- Upselling logic (wedding packages, lessons)
- CRM integration
- Marketing automation
- White-label options
- **Predictive features** (anticipate customer needs based on conversation history)
- **Demo marketplace** (showcase best custom demos publicly)

---

## Definition of Done

### MVP is complete when:

**Core System:**
- [ ] Phone number rings and AI answers
- [ ] Voice sounds natural and human-like
- [ ] First-time callers get auto-account created
- [ ] ALL conversations stored permanently in database
- [ ] Returning callers hear context from last 3 conversations
- [ ] Data isolation verified (caller A cannot access caller B's data)

**Fox Hollow Demo:**
- [ ] Fox Hollow pre-loaded demo works (text + voice)
- [ ] Fox Hollow branding integrated on landing page
- [ ] Fox Hollow data (menu, pricing, info) loaded in agent

**Custom Demo System:**
- [ ] Mini onboarding modal works
- [ ] File uploads work (menu, scorecard, logo)
- [ ] Email capture works (stored in demo_leads table)
- [ ] Custom demo generation works (<60 seconds)
- [ ] Unique demo link generated: proshop247.com/demo/abc123xyz
- [ ] Demo link is shareable and works for anyone
- [ ] Both text and voice work for custom demos
- [ ] Interaction counter works (25 limit enforced)
- [ ] Limit reached message shows: "Upgrade to unlimited"
- [ ] **Web scraping works** (extracts hours, pricing, menu from website)
- [ ] **Scraping failure handled gracefully** (uses form data if scrape fails)
- [ ] **AI file processing works** (Claude extracts structured data from PDFs)
- [ ] **Agent uses scraped/processed data** (can answer questions from uploaded files)

**Landing Page:**
- [ ] Live at proshop247.com (or temp URL)
- [ ] Dual-demo system visible and functional
- [ ] Fox Hollow branding applied
- [ ] Mobile responsive
- [ ] Fast loading (<2 seconds)

**Backend:**
- [ ] Deployed to Railway (or Render)
- [ ] All API endpoints working
- [ ] Environment variables secured
- [ ] Error handling implemented
- [ ] Logging configured

**Database:**
- [ ] Production tables: golf_courses, callers, conversations
- [ ] Demo tables: demo_courses, demo_interactions, demo_leads
- [ ] Row-Level Security (RLS) working
- [ ] File storage configured (Supabase Storage)

**Testing:**
- [ ] End-to-end test: Fox Hollow demo (text + voice)
- [ ] End-to-end test: Create custom demo → Test → Share link → Test from shared link
- [ ] Memory system test: Multi-call scenario (verify context retrieval)
- [ ] Data isolation test: Multiple callers, verify no cross-talk
- [ ] Demo limit test: Hit 25 interactions, verify lockout message
- [ ] File upload test: Menu, scorecard, logo uploads work

**Documentation:**
- [ ] README.md with setup instructions
- [ ] API documentation
- [ ] Environment variables guide
- [ ] Testing guide
- [ ] Fox Hollow data integration guide

### Memory System Test Scenario:
```
1. Call from 555-0001: "I want to book a tee time"
   → Check DB: Account created, conversation #1 stored

2. Call from 555-0002: "What are your hours?"
   → Check DB: Different account, conversation #1 stored
   → Verify: 555-0002 cannot see 555-0001's data

3. Call again from 555-0001: "Hi, it's me again"
   → Check DB: Conversation #2 stored
   → Verify: Agent mentions previous tee time inquiry
   → Verify: Agent does NOT mention 555-0002's question

4. Make 5 more calls from 555-0001
   → Check DB: All 7 conversations stored
   → Verify: Agent uses last 3 for context
   → Verify: All 7 are queryable in database

✅ PASS = Perfect data isolation + unlimited storage + smart retrieval
```

### Custom Demo Test Scenario:
```
1. User clicks "Upload Your Own Course" button
   → Modal opens

2. User fills form:
   - Course name: "Sunset Golf Club"
   - Location: "Phoenix, AZ"
   - Website: "sunsetgolf.com"
   - Email: "manager@sunsetgolf.com"
   - Uploads menu PDF
   → Click "Generate My Demo"

3. Success screen shows:
   → Link: proshop247.com/demo/abc123xyz
   → Check DB: demo_courses table has Sunset Golf Club
   → Check DB: demo_leads table has manager@sunsetgolf.com
   → Check DB: demo_interactions count = 0

4. User clicks "Test Text Chat"
   → Chat works, agent says "Welcome to Sunset Golf Club"
   → Check DB: demo_interactions count = 1

5. User calls voice demo number
   → Agent answers with Sunset Golf Club branding
   → Check DB: demo_interactions count = 2

6. User copies link, shares with colleague
   → Colleague opens proshop247.com/demo/abc123xyz
   → Same demo works for colleague
   → Colleague tests text + voice
   → Check DB: demo_interactions count = 4

7. Make 21 more interactions (total = 25)
   → Next interaction shows: "Your demo has reached 25 interactions. Upgrade to unlimited."
   → Link to upgrade/signup

✅ PASS = Demo generation works + sharing works + limit enforced + upgrade prompt shows
```

### Web Scraping & AI Processing Test Scenario:
```
1. Test with website URL (sunsetgolf.com):
   → Backend scrapes website
   → Extracts hours, pricing, amenities
   → Check DB: demo_courses.scraped_data JSON populated
   → Agent responds: "I see you're open 7am-7pm and rates start at $35"

2. Test with PDF upload (restaurant menu):
   → OCR extracts text from PDF
   → Claude API analyzes and structures menu items
   → Check DB: demo_courses.menu_data JSON has items with prices
   → Agent responds: "Looking at your menu, the club sandwich is $11.99"

3. Test graceful degradation (bad URL):
   → User enters non-existent website
   → Scraper fails
   → System continues with form data only
   → Check DB: demo_courses.scrape_status = "failed"
   → Agent responds: "I have your basic course info from the form"
   → No errors shown to user

4. Test combined scraping + file upload:
   → User enters website + uploads scorecard PDF
   → Both processes run in parallel
   → Claude analyzes scorecard (par, yardage per hole)
   → Check DB: Both scraped_data and scorecard_data populated
   → Agent responds: "Your course is a par 72, 6,800 yards with challenging water hazards on holes 3, 7, and 15"

✅ PASS = Scraping works + AI processing works + graceful degradation + data used by agent
```

---

## Key Metrics to Track

### MVP Launch Metrics:
- Fox Hollow demo usage (text vs voice)
- Custom demos created (count, conversion rate)
- Email captures (demo leads generated)
- Demo sharing rate (unique visitors per demo link)
- Demo-to-signup conversion rate
- Average interactions per demo
- Voice call quality scores
- Response latency (target: <3 seconds)

### Post-MVP Metrics:
- Customer satisfaction (CSAT)
- Net Promoter Score (NPS)
- Bookings generated via AI
- Revenue per course
- Agent accuracy rate
- Conversation memory utilization
- Churn rate
- Demo virality coefficient

---

**Document Status**: v2.0 (Updated with dual-demo strategy + Fox Hollow focus)
**Last Updated**: 2025-10-28
**Next Review**: After MVP completion
**Changes from v1.0**:
- Added Fox Hollow as exclusive first customer and case study
- Integrated dual-demo system (Fox Hollow pre-built + Custom upload)
- Added demo system requirements (email required, 25 interaction limit, permanent storage)
- Added demo_courses, demo_interactions, demo_leads tables
- Updated success criteria and test scenarios for demo system
- Added viral growth and product-led growth strategy
- Expanded timeline to 6-7 hours to account for demo system build
