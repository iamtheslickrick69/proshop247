# ProShop 24/7 - Context Handoff to New Claude Code Session

## SESSION STATUS
- Previous Claude Code session became buggy
- Starting fresh terminal with full context preserved
- All planning complete, ready for document creation phase

## WHAT WAS ACCOMPLISHED
✅ Full project vision defined
✅ Dual-demo landing page strategy approved
✅ Fox Hollow Golf Course data compiled
✅ Multi-agent framework established
✅ All technical decisions made (Option C for all three questions)
✅ PROJECT_MASTER.md created and approved

## DOCUMENTS CREATED
Location: `~/Desktop/THISISTHE1/`

1. **PROJECT_MASTER.md** ✅ COMPLETE
   - Full project vision
   - Dual-demo strategy (Fox Hollow + Custom generator)
   - Tech stack overview
   - Success criteria
   - Timeline (7-8 hours)
   - Test scenarios
   - All Option C decisions integrated

## NEXT DOCUMENTS TO CREATE (In Order)
2. **TECH_STACK.md** ⬅️ START HERE
3. **DATABASE_SCHEMA.md**
4. **MEMORY_SYSTEM.md**
5. **API_ENDPOINTS.md**
6. **DEMO_GENERATOR_SPEC.md**
7. **VOICE_PIPELINE.md**
8. **LANGCHAIN_AGENT.md**
9. **LOVABLE_FRONTEND.md**
10. **DEPLOYMENT.md**
11. **BUILD_CHECKLIST.md**

## KEY DECISIONS MADE

### Option C Selections:
1. **Phone Numbers**: Shared Twilio demo pool with caller ID routing (production gets dedicated)
2. **Web Scraping**: Hybrid approach - Try to scrape website URLs, degrade gracefully if fails
3. **File Processing**: Full AI processing - Claude analyzes PDFs/images and extracts structured data

### Core Architecture:
- **Backend**: FastAPI + LangChain + Claude Sonnet 4.5
- **Voice**: Twilio + Deepgram (STT) + ElevenLabs (TTS)
- **Database**: Supabase (PostgreSQL + pgvector for embeddings)
- **Frontend**: Lovable (landing page with dual-demo system)
- **Memory**: Store ALL conversations, retrieve last 3 for context
- **Demo System**: Custom demo generator (25 free interactions, email required)

### Fox Hollow Golf Course (First Customer)
- **Name**: Fox Hollow Golf Course
- **Location**: 1400 N 200 E, American Fork, UT 84003
- **Phone**: 801.756.3594
- **Website**: https://foxhollowutah.com/
- **Brand Voice**: Casual, friendly, genuine (sounds like a helpful friend at the course)
- **Services**: 18-hole course, The Fox Den Restaurant, events/weddings, driving range
- **Pricing**: $25-$45 (weekday/weekend rates), $18 cart rental
- **Restaurant**: $7-$15 per person, 7am-8pm daily

## WORKFLOW FOR NEW SESSION

### You Are Operating As Multi-Agent Team:
- **PROJECT MANAGER** (oversight, progress tracking, after each doc: ask clarifying questions)
- **BACKEND ENGINEER** (FastAPI, LangChain, integrations)
- **DATABASE ARCHITECT** (Supabase, schema, RLS)
- **INTEGRATION SPECIALIST** (APIs, scraping, file processing)
- **QA TESTER** (validation, test scenarios)

### Process for Each Document:
1. **Create** one document at a time
2. **Present** it with summary
3. **Ask** 2-3 clarifying questions
4. **Wait** for approval
5. **Move** to next document

### Rules:
- ❌ Do NOT write any code yet (documentation phase only)
- ❌ Do NOT skip ahead to multiple documents
- ✅ DO create thorough, detailed documents
- ✅ DO ask clarifying questions
- ✅ DO wait for "approved" before moving on

---

## INSTRUCTION FOR NEW CLAUDE CODE SESSION

Read PROJECT_MASTER.md in `~/Desktop/THISISTHE1/` for full context.

**Your first task:**
1. Acknowledge you understand the full project
2. Confirm you've read PROJECT_MASTER.md
3. List all remaining documents to create
4. Present TECH_STACK.md (the next document)
5. Ask 2-3 clarifying questions
6. Wait for approval before proceeding

**Start now!** 🚀
