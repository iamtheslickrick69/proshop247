# ProShop 24/7 - Technical Stack Specification

## Document Overview

This document provides a comprehensive breakdown of all technologies, frameworks, APIs, and tools used in the ProShop 24/7 MVP. Each component includes version requirements, configuration details, cost considerations, and integration patterns.

---

## Core Technology Stack

### Backend Framework

**FastAPI (Python 3.11+)**
- **Version**: FastAPI 0.104+
- **Purpose**: RESTful API server, webhook handling, real-time voice streaming
- **Key Features**:
  - Async/await support for concurrent request handling
  - Automatic OpenAPI documentation
  - Built-in Pydantic validation
  - WebSocket support for real-time chat
  - High performance (comparable to Node.js/Go)
- **Dependencies**:
  - `fastapi==0.104.1`
  - `uvicorn[standard]==0.24.0` (ASGI server)
  - `pydantic==2.5.0` (data validation)
  - `python-multipart==0.0.6` (file uploads)
  - `python-dotenv==1.0.0` (environment variables)
- **Why FastAPI**:
  - Native async support for voice streaming
  - Excellent integration with LangChain
  - Fast development with automatic validation
  - Production-ready with proper error handling

---

### AI/ML Framework

**LangChain (Python)**
- **Version**: LangChain 0.1.0+
- **Purpose**: Orchestrate AI agent, manage conversation chains, handle memory
- **Key Components**:
  - `ConversationChain` - Main agent conversation loop
  - `ConversationBufferMemory` - Short-term conversation context
  - `VectorStoreRetriever` - Retrieve last 3 conversations from Supabase
  - `ChatAnthropic` - Claude Sonnet 4.5 integration
  - `PromptTemplate` - Dynamic system prompts per golf course
- **Dependencies**:
  - `langchain==0.1.0`
  - `langchain-anthropic==0.1.0` (Claude integration)
  - `langchain-community==0.0.10` (Supabase vector store)
- **Configuration**:
  ```python
  from langchain.chat_models import ChatAnthropic
  from langchain.chains import ConversationChain
  from langchain.memory import ConversationBufferMemory

  llm = ChatAnthropic(
      model="claude-sonnet-4-5-20250929",
      temperature=0.7,
      max_tokens=1024,
      anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
  )

  memory = ConversationBufferMemory(
      memory_key="chat_history",
      return_messages=True
  )

  agent = ConversationChain(
      llm=llm,
      memory=memory,
      verbose=True
  )
  ```

**Claude Sonnet 4.5 (via Anthropic API)**
- **Model ID**: `claude-sonnet-4-5-20250929`
- **Purpose**: Natural language understanding, response generation, file analysis
- **Context Window**: 200,000 tokens
- **Cost**: $3 per million input tokens, $15 per million output tokens
- **Use Cases**:
  - Voice conversation agent (primary)
  - Text chat agent (demos)
  - PDF/image analysis (custom demos)
  - Data extraction from uploaded files
- **Optimization**:
  - Keep system prompts concise (<500 tokens)
  - Limit conversation history injection (last 3 conversations only)
  - Stream responses for faster perceived latency
  - Cache system prompts per golf course

---

### Database & Storage

**Supabase (PostgreSQL + pgvector)**
- **Version**: PostgreSQL 15+, pgvector 0.5.0+
- **Purpose**:
  - Store golf course data (production + demo)
  - Store ALL conversations permanently
  - Store vector embeddings for semantic search
  - File storage for uploaded menus, scorecards, logos
  - Row-Level Security (RLS) for data isolation
- **Extensions Required**:
  - `pgvector` - Vector similarity search
  - `uuid-ossp` - UUID generation
  - `pg_trgm` - Text search optimization
- **Key Features**:
  - Generous free tier: 500MB database, 1GB file storage, 2GB bandwidth
  - Built-in authentication (for V2 dashboard)
  - Real-time subscriptions (for future live dashboard)
  - Row-Level Security policies
  - REST API + PostgREST
- **Tables** (detailed in DATABASE_SCHEMA.md):
  - Production: `golf_courses`, `callers`, `conversations`
  - Demo: `demo_courses`, `demo_interactions`, `demo_leads`
- **Configuration**:
  ```python
  from supabase import create_client, Client

  supabase: Client = create_client(
      os.getenv("SUPABASE_URL"),
      os.getenv("SUPABASE_KEY")
  )
  ```

**OpenAI Embeddings API**
- **Model**: `text-embedding-3-small`
- **Purpose**: Generate vector embeddings for conversation memory
- **Dimensions**: 1536 (default)
- **Cost**: $0.02 per million tokens
- **Use Case**:
  - Embed each conversation after completion
  - Store embeddings in Supabase pgvector
  - Enable future semantic search ("Find all conversations about weddings")
- **Why OpenAI for embeddings**:
  - Cost-effective ($0.02 vs Claude's $3)
  - Fast generation (<100ms)
  - High quality embeddings
  - Standard 1536 dimensions work well with pgvector

---

### Voice Pipeline Components

**Twilio (Phone & SMS)**
- **Purpose**:
  - Inbound phone call handling
  - SMS text messaging (V2)
  - Phone number provisioning
  - Call recording and analytics
- **Pricing**:
  - Phone numbers: $1.15/month per number
  - Inbound calls: $0.0085/minute
  - Outbound calls: $0.013/minute (if needed)
  - SMS: $0.0079 per message (V2)
- **Configuration**:
  - **Production**: Dedicated phone number per golf course (Fox Hollow gets dedicated)
  - **Demo System**: Shared pool number with caller ID routing
  - Webhook URL: `https://api.proshop247.com/webhook/voice`
  - Recording enabled: Yes (for quality monitoring)
- **Required Account Setup**:
  1. Create Twilio account
  2. Purchase 1 phone number (demo pool)
  3. Configure webhook to FastAPI `/webhook/voice` endpoint
  4. Enable Media Streams for real-time audio
- **SDK**:
  ```python
  from twilio.rest import Client
  from twilio.twiml.voice_response import VoiceResponse

  client = Client(
      os.getenv("TWILIO_ACCOUNT_SID"),
      os.getenv("TWILIO_AUTH_TOKEN")
  )
  ```

**Deepgram (Speech-to-Text)**
- **Version**: API v1
- **Purpose**: Convert caller speech to text in real-time
- **Model**: `nova-2` (latest, most accurate)
- **Pricing**: $0.0043/minute (pay-as-you-go)
- **Features**:
  - Real-time streaming transcription
  - 90%+ accuracy for conversational speech
  - Low latency (<300ms)
  - Automatic punctuation and capitalization
  - Interim results for faster UI feedback
- **Configuration**:
  ```python
  from deepgram import Deepgram

  dg_client = Deepgram(os.getenv("DEEPGRAM_API_KEY"))

  options = {
      "model": "nova-2",
      "language": "en-US",
      "punctuate": True,
      "interim_results": True,
      "endpointing": 300  # ms of silence before finalizing
  }
  ```
- **Why Deepgram**:
  - Best accuracy for conversational speech
  - Low latency (critical for voice UX)
  - Affordable pricing
  - Excellent Python SDK
  - Built for real-time streaming

**ElevenLabs (Text-to-Speech)**
- **Purpose**: Convert agent responses to natural voice audio
- **Model**: `eleven_turbo_v2` (fastest, high quality)
- **Voice**: Custom voice clone or premade voice (TBD with Fox Hollow)
- **Pricing**:
  - Free tier: 10,000 characters/month
  - Creator plan: $5/month (30,000 chars)
  - Pro plan: $22/month (100,000 chars)
- **Configuration**:
  ```python
  from elevenlabs import generate, set_api_key, Voice

  set_api_key(os.getenv("ELEVENLABS_API_KEY"))

  audio = generate(
      text="Welcome to Fox Hollow Golf Course!",
      voice=Voice(voice_id=os.getenv("ELEVENLABS_VOICE_ID")),
      model="eleven_turbo_v2",
      stream=True  # Stream audio back to Twilio
  )
  ```
- **Voice Selection Options**:
  1. **Premade voices**: Rachel, Drew, Clyde (professional, friendly)
  2. **Custom voice clone**: Upload 1-2 minutes of Fox Hollow staff audio (V2)
  3. **Voice settings**: Stability=0.7, Similarity=0.8, Style=0.5
- **Why ElevenLabs**:
  - Most natural-sounding TTS available
  - Fast generation (<500ms)
  - Streaming support for lower latency
  - Voice cloning capability (future)
  - Good Python SDK

---

### Web Scraping & File Processing

**BeautifulSoup4 (HTML Parsing)**
- **Version**: BeautifulSoup4 4.12+
- **Purpose**: Parse golf course websites, extract structured data
- **Use Case**: Custom demo generation - auto-extract hours, pricing, amenities
- **Dependencies**:
  - `beautifulsoup4==4.12.2`
  - `requests==2.31.0` (HTTP client)
  - `lxml==4.9.3` (fast XML/HTML parser)
- **Configuration**:
  ```python
  import requests
  from bs4 import BeautifulSoup

  def scrape_golf_course(url: str):
      response = requests.get(url, timeout=10)
      soup = BeautifulSoup(response.content, 'lxml')

      # Extract operating hours
      hours = soup.find('div', class_='hours').get_text()

      # Extract pricing
      pricing = soup.find('section', id='rates').get_text()

      return {"hours": hours, "pricing": pricing}
  ```
- **Graceful Degradation**:
  - Try scraping first
  - If timeout/error → Store scrape_status="failed" in DB
  - Continue with form data only
  - No error shown to user

**Playwright (Browser Automation - Optional)**
- **Version**: Playwright 1.40+
- **Purpose**: Scrape JavaScript-heavy websites (fallback if BeautifulSoup fails)
- **Use Case**: Golf courses with dynamic pricing calculators, booking widgets
- **Dependencies**: `playwright==1.40.0`
- **Configuration**:
  ```python
  from playwright.async_api import async_playwright

  async def scrape_with_playwright(url: str):
      async with async_playwright() as p:
          browser = await p.chromium.launch()
          page = await browser.new_page()
          await page.goto(url)
          content = await page.content()
          await browser.close()
          return content
  ```
- **When to Use**:
  - BeautifulSoup returns empty/insufficient data
  - Website requires JavaScript rendering
  - Pricing calculators, booking forms need interaction
- **Trade-off**: Slower (2-3 seconds vs <1 second), but more robust

**PyPDF2 / pdfplumber (PDF Text Extraction)**
- **Version**: pdfplumber 0.10+
- **Purpose**: Extract text from uploaded PDF menus, scorecards
- **Use Case**: Custom demos - read menu items, hole-by-hole scorecard details
- **Dependencies**: `pdfplumber==0.10.3`
- **Configuration**:
  ```python
  import pdfplumber

  def extract_pdf_text(file_path: str) -> str:
      with pdfplumber.open(file_path) as pdf:
          text = ""
          for page in pdf.pages:
              text += page.extract_text()
      return text
  ```
- **Claude AI Analysis**:
  ```python
  # After extracting raw text, send to Claude for structuring
  extracted_text = extract_pdf_text("menu.pdf")

  prompt = f"""
  Analyze this restaurant menu and extract structured data:

  {extracted_text}

  Return JSON with:
  - categories (appetizers, entrees, desserts, drinks)
  - items with name, description, price
  """

  structured_data = claude_api.messages.create(
      model="claude-sonnet-4-5-20250929",
      messages=[{"role": "user", "content": prompt}]
  )
  ```

**Tesseract OCR (Image Text Extraction - Optional)**
- **Purpose**: Extract text from image files (JPG, PNG menus, scorecards)
- **Use Case**: When users upload photos instead of PDFs
- **Dependencies**: `pytesseract==0.3.10`, Tesseract binary
- **Configuration**:
  ```python
  import pytesseract
  from PIL import Image

  def extract_image_text(file_path: str) -> str:
      image = Image.open(file_path)
      text = pytesseract.image_to_string(image)
      return text
  ```
- **Alternative**: Use Claude Vision API directly (send image, get structured text)
  - More accurate than OCR
  - More expensive ($3 per 1M tokens)
  - Recommended approach for MVP

---

### Frontend Stack (Lovable)

**Lovable (No-Code Frontend Builder)**
- **Platform**: lovable.dev
- **Purpose**: Build landing page, demo interface, onboarding modal
- **Tech Under the Hood**:
  - React.js (generated automatically)
  - Tailwind CSS (styling)
  - Vercel hosting (instant deployment)
- **Why Lovable**:
  - Zero frontend code to write
  - Apple/OpenAI-quality design templates
  - Mobile responsive by default
  - Instant deployment
  - Easy to iterate with AI prompts
- **Project Structure**:
  - One Lovable project: "ProShop 24/7 Landing Page"
  - Pages:
    - `/` - Homepage with dual-demo system
    - `/demo/[id]` - Dynamic custom demo page
  - Components:
    - Hero section
    - Demo selector (Fox Hollow vs Custom)
    - Onboarding modal
    - Text chat widget
    - Voice call button
- **Integration with Backend**:
  - API calls to FastAPI backend: `https://api.proshop247.com`
  - Text chat: WebSocket or REST polling
  - Voice demo: Click-to-call Twilio number
  - File uploads: POST to `/demo/create`

**Tailwind CSS (via Lovable)**
- **Version**: Tailwind 3.x
- **Purpose**: Styling, responsive design
- **Theme Configuration**:
  - Fox Hollow brand colors (TBD)
  - Apple-inspired design system (clean, spacious, modern)
  - Mobile-first breakpoints

**React.js (via Lovable)**
- **Version**: React 18+
- **Purpose**: Component-based UI, state management
- **Key Components**:
  - `DemoSelector` - Choose Fox Hollow vs Custom
  - `OnboardingModal` - File upload form
  - `ChatWidget` - Embedded text chat
  - `VoiceCallButton` - Click-to-call Twilio

---

## Development & Deployment Stack

**Railway (Backend Hosting)**
- **Purpose**: Deploy FastAPI application
- **Free Tier**: $5 credit/month (enough for MVP testing)
- **Pro Plan**: $20/month (unlimited usage)
- **Features**:
  - Automatic deployments from GitHub
  - Environment variable management
  - Built-in PostgreSQL (but we use Supabase)
  - HTTPS by default
  - Custom domains
- **Deployment Configuration**:
  ```yaml
  # railway.json
  {
    "build": {
      "builder": "NIXPACKS",
      "buildCommand": "pip install -r requirements.txt"
    },
    "deploy": {
      "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
      "restartPolicyType": "ON_FAILURE"
    }
  }
  ```
- **Alternative**: Render.com (similar features, more generous free tier)

**GitHub (Version Control)**
- **Purpose**: Code repository, CI/CD trigger
- **Repository Structure**:
  ```
  proshop-247/
  ├── backend/
  │   ├── main.py
  │   ├── requirements.txt
  │   ├── .env.example
  │   └── ...
  ├── docs/
  │   ├── PROJECT_MASTER.md
  │   ├── TECH_STACK.md
  │   └── ...
  └── README.md
  ```
- **Branch Strategy**:
  - `main` - Production branch (deploys to Railway)
  - `dev` - Development branch (testing)
  - Feature branches for new functionality

**Environment Variables (Critical)**
```bash
# API Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
DEEPGRAM_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...

# Database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (for admin operations)

# Application
ENVIRONMENT=production
SECRET_KEY=... (for session encryption)
CORS_ORIGINS=https://proshop247.com,https://lovable.app

# Twilio
TWILIO_PHONE_NUMBER=+1555... (demo pool number)
TWILIO_WEBHOOK_URL=https://api.proshop247.com/webhook/voice

# ElevenLabs
ELEVENLABS_VOICE_ID=... (Fox Hollow voice)
```

---

## Development Tools

**Python 3.11+**
- **Why 3.11**: Performance improvements, better async handling
- **Virtual Environment**: `venv` or `conda`
- **Package Management**: `pip` + `requirements.txt`

**Poetry (Optional - Better Dependency Management)**
- **Purpose**: Deterministic builds, lock file management
- **Configuration**:
  ```toml
  [tool.poetry.dependencies]
  python = "^3.11"
  fastapi = "^0.104.1"
  langchain = "^0.1.0"
  supabase = "^2.0.0"
  ```

**Black (Code Formatter)**
- **Purpose**: Consistent Python code formatting
- **Configuration**: `pyproject.toml`

**pytest (Testing Framework)**
- **Purpose**: Unit tests, integration tests
- **Test Files**:
  - `tests/test_memory.py` - Memory system tests
  - `tests/test_demo_generator.py` - Demo creation tests
  - `tests/test_voice_pipeline.py` - Voice integration tests

**Docker (Optional - Local Development)**
- **Purpose**: Consistent development environment
- **Dockerfile**:
  ```dockerfile
  FROM python:3.11-slim
  WORKDIR /app
  COPY requirements.txt .
  RUN pip install -r requirements.txt
  COPY . .
  CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
  ```

---

## Third-Party Service Accounts Required

### Essential (MVP)
1. **Anthropic** - Claude API
   - Sign up: https://console.anthropic.com
   - Free tier: $5 credit
   - Add payment method for production

2. **OpenAI** - Embeddings API
   - Sign up: https://platform.openai.com
   - Add payment method (pay-as-you-go)

3. **ElevenLabs** - Text-to-Speech
   - Sign up: https://elevenlabs.io
   - Free tier: 10,000 chars/month
   - Upgrade to Creator: $5/month

4. **Deepgram** - Speech-to-Text
   - Sign up: https://deepgram.com
   - Free tier: $200 credit
   - Pay-as-you-go after credit

5. **Twilio** - Phone & SMS
   - Sign up: https://twilio.com
   - Free trial: $15 credit
   - Add payment method for production

6. **Supabase** - Database & Storage
   - Sign up: https://supabase.com
   - Free tier: 500MB database, 1GB storage
   - Upgrade if needed: $25/month

7. **Lovable** - Frontend Builder
   - Sign up: https://lovable.dev
   - Free tier available
   - Pro plan: $20/month (for custom domains)

8. **Railway** - Backend Hosting
   - Sign up: https://railway.app
   - Free tier: $5 credit/month
   - Pro plan: $20/month

### Optional (V2)
- **Google Cloud** - Calendar API integration
- **Stripe** - Payment processing (demo-to-paid conversion)
- **SendGrid** - Email automation (demo lead nurture)
- **Sentry** - Error tracking and monitoring

---

## Cost Breakdown (Monthly Estimates)

### MVP Phase (Testing)
- **API Costs**:
  - Claude: $5-10 (100-200 calls, ~500 tokens each)
  - OpenAI Embeddings: $0.50 (1,000 conversations)
  - ElevenLabs: $0 (free tier, 10K chars)
  - Deepgram: $0 (free $200 credit)
- **Infrastructure**:
  - Twilio: $2 (1 number + 50 calls)
  - Supabase: $0 (free tier)
  - Railway: $0 (free $5 credit)
  - Lovable: $0 (free tier)
- **Total**: ~$10-15/month

### Production Phase (1 Course, 100 Calls/Month)
- **API Costs**:
  - Claude: $30-50 (longer conversations)
  - OpenAI Embeddings: $2
  - ElevenLabs: $5 (Creator plan)
  - Deepgram: $15 (300 minutes)
- **Infrastructure**:
  - Twilio: $10 (1 number + 100 calls @ 3 min avg)
  - Supabase: $0 (still free tier)
  - Railway: $20 (Pro plan for uptime)
  - Lovable: $20 (Pro plan for custom domain)
- **Total**: ~$100-125/month

### Scale Phase (10 Courses, 1000 Calls/Month)
- **API Costs**:
  - Claude: $300-400
  - OpenAI Embeddings: $10
  - ElevenLabs: $99 (Business plan, 500K chars)
  - Deepgram: $150 (3,000 minutes)
- **Infrastructure**:
  - Twilio: $110 (10 numbers + 1,000 calls)
  - Supabase: $25 (Pro plan for storage)
  - Railway: $50 (scaling + multiple instances)
  - Lovable: $20
- **Total**: ~$750-900/month
- **Revenue Target**: $2,000/month (10 courses @ $200/mo each)
- **Margin**: ~$1,100/month (55% margin)

---

## Architecture Decision Records (ADRs)

### ADR-001: FastAPI over Flask/Django
**Decision**: Use FastAPI for backend framework
**Rationale**:
- Native async/await for voice streaming
- Automatic OpenAPI docs (easier testing)
- Modern Python (type hints, Pydantic validation)
- Better performance than Flask
- Lighter than Django (no ORM needed, we use Supabase)

### ADR-002: Supabase over PostgreSQL + pgvector
**Decision**: Use Supabase instead of self-hosted PostgreSQL
**Rationale**:
- Managed PostgreSQL with pgvector pre-installed
- Built-in file storage (no need for S3)
- Row-Level Security for data isolation
- RESTful API for quick prototyping
- Real-time subscriptions for future features
- Free tier sufficient for MVP

### ADR-003: ElevenLabs over Google Cloud TTS
**Decision**: Use ElevenLabs for text-to-speech
**Rationale**:
- Significantly more natural-sounding voices
- Voice cloning capability (future)
- Streaming support for lower latency
- Affordable pricing compared to quality
- Easy Python SDK

### ADR-004: Claude Sonnet 4.5 over GPT-4o
**Decision**: Use Claude for agent LLM
**Rationale**:
- Better instruction following (fewer hallucinations)
- 200K context window (ample for conversation history)
- Superior reasoning for complex queries
- Lower latency than GPT-4o
- Better at structured output generation

### ADR-005: Lovable over Custom React Build
**Decision**: Use Lovable for frontend instead of building React app
**Rationale**:
- 10x faster development (no frontend code to write)
- Professional design out-of-the-box
- Mobile responsive automatically
- Instant deployment (no DevOps setup)
- Easy iteration with AI-assisted design
- Focus development time on backend complexity

### ADR-006: Railway over AWS/GCP
**Decision**: Use Railway for backend hosting
**Rationale**:
- Zero DevOps configuration needed
- Automatic deployments from GitHub
- $5 free credit sufficient for MVP testing
- Easy environment variable management
- Built-in HTTPS and custom domains
- Can migrate to AWS later if needed (FastAPI is portable)

---

## Integration Patterns

### Voice Call Flow (Complete Stack Integration)
```
1. Caller dials Twilio number
   ↓
2. Twilio webhook → FastAPI /webhook/voice endpoint
   ↓
3. FastAPI initiates Deepgram stream (STT)
   ↓
4. Deepgram transcribes audio → text chunks
   ↓
5. FastAPI sends text to LangChain agent
   ↓
6. LangChain retrieves last 3 conversations from Supabase
   ↓
7. LangChain calls Claude Sonnet 4.5 with context
   ↓
8. Claude generates response text
   ↓
9. FastAPI sends text to ElevenLabs (TTS)
   ↓
10. ElevenLabs streams audio back to FastAPI
    ↓
11. FastAPI pipes audio to Twilio
    ↓
12. Caller hears response
    ↓
13. FastAPI stores conversation + embedding in Supabase
```

### Custom Demo Creation Flow
```
1. User fills form on Lovable frontend
   ↓
2. Frontend uploads files to Supabase Storage
   ↓
3. Frontend POST to FastAPI /demo/create endpoint
   ↓
4. FastAPI triggers parallel processes:
   a. BeautifulSoup scrapes website URL
   b. PyPDF extracts text from uploaded PDFs
   c. Claude Vision analyzes uploaded images
   ↓
5. Claude analyzes all extracted data → structured JSON
   ↓
6. FastAPI stores demo in demo_courses table
   ↓
7. FastAPI creates embeddings for demo data
   ↓
8. FastAPI stores in Supabase pgvector
   ↓
9. FastAPI returns demo_id to frontend
   ↓
10. Frontend displays shareable link: proshop247.com/demo/abc123xyz
```

### Memory Retrieval Pattern
```
1. New conversation starts (call or text)
   ↓
2. FastAPI identifies caller by phone number
   ↓
3. FastAPI queries Supabase:
   SELECT * FROM conversations
   WHERE phone_number = '555-123-4567'
   ORDER BY created_at DESC
   LIMIT 3
   ↓
4. Retrieve last 3 conversation summaries
   ↓
5. Inject into LangChain system prompt:
   "Conversation History:
   - Call 1 (2024-10-15): Customer asked about tee times
   - Call 2 (2024-10-18): Customer booked Saturday 9am
   - Call 3 (2024-10-20): Customer asked about restaurant hours"
   ↓
6. Agent responds with context: "Welcome back! How can I help today?"
   ↓
7. After conversation ends, store new conversation (#4) in DB
```

---

## Security & API Key Management

### Environment Variable Security
- **Never commit** `.env` files to GitHub
- Use `.env.example` as template (no real keys)
- Railway/Render: Store keys in dashboard UI
- Supabase: Use service role key only in backend, anon key in frontend

### Row-Level Security (RLS) Policies
```sql
-- Callers can only see their own conversations
CREATE POLICY "Users can only access their own conversations"
ON conversations
FOR SELECT
USING (phone_number = current_setting('app.current_phone_number')::text);

-- Demo interactions isolated by demo_id
CREATE POLICY "Demo interactions isolated by demo_id"
ON demo_interactions
FOR SELECT
USING (demo_id = current_setting('app.current_demo_id')::text);
```

### API Rate Limiting
- Implement rate limiting on FastAPI endpoints:
  - `/chat`: 100 requests/minute per IP
  - `/demo/create`: 5 requests/hour per IP
  - `/webhook/voice`: No limit (Twilio origin only)

### File Upload Security
- Validate file types: Only PDF, JPG, PNG allowed
- Max file size: 5MB
- Virus scanning (ClamAV or VirusTotal API) - Optional for MVP
- Store files in Supabase Storage (isolated by demo_id)

---

## Performance Optimization Targets

### Voice Call Latency
- **Target**: <3 seconds from caller stops speaking → agent starts responding
- **Breakdown**:
  - Deepgram transcription: <300ms
  - LangChain + Claude inference: <2 seconds
  - ElevenLabs TTS generation: <500ms
  - Twilio audio streaming: ~200ms
- **Optimization Strategies**:
  - Use streaming APIs wherever possible
  - Cache system prompts per golf course
  - Preload last 3 conversations during call initialization
  - Use `eleven_turbo_v2` model (fastest TTS)

### Text Chat Latency
- **Target**: <2 seconds for response
- **Breakdown**:
  - API request to FastAPI: <100ms
  - LangChain + Claude inference: <1.5 seconds
  - Response to frontend: <100ms
- **Optimization**:
  - Use WebSocket for persistent connection
  - Stream Claude response (show typing indicator)
  - Cache demo course data in memory

### Demo Creation Time
- **Target**: <60 seconds from form submit → demo ready
- **Breakdown**:
  - File upload to Supabase: <5 seconds
  - Website scraping: <3 seconds
  - PDF text extraction: <2 seconds
  - Claude data analysis: <10 seconds
  - Embedding generation: <5 seconds
  - Database storage: <1 second
- **Total**: ~25 seconds (well under target)

### Database Query Performance
- **Target**: <100ms for conversation retrieval
- **Optimization**:
  - Index on `phone_number` column
  - Index on `created_at` column
  - Limit queries (LIMIT 3)
  - Use prepared statements

---

## Monitoring & Observability (V2)

### Key Metrics to Track
- **Voice Quality**: MOS (Mean Opinion Score) via Twilio Insights
- **Latency**: P50, P95, P99 for voice response time
- **API Costs**: Per-call cost breakdown (Claude, ElevenLabs, Deepgram)
- **Demo Funnel**: Creation rate, test rate, conversion rate
- **Error Rate**: 4xx/5xx errors, failed API calls
- **Memory System**: Retrieval accuracy, context relevance

### Logging Strategy
- **Structured Logging**: Use JSON format for easy parsing
- **Log Levels**: DEBUG (development), INFO (production), ERROR (always)
- **Key Events to Log**:
  - Call start/end with duration
  - Conversation stored successfully
  - Demo created (with scrape success/failure)
  - API errors (with retry count)
  - Rate limit hits

### Error Tracking (Optional - Sentry)
- Capture exceptions in FastAPI
- Track error frequency by endpoint
- Alert on critical errors (DB connection failure, API key invalid)

---

## Technology Stack Summary Table

| Component | Technology | Version | Purpose | Cost (Monthly) |
|-----------|-----------|---------|---------|----------------|
| Backend Framework | FastAPI | 0.104+ | API server | Free (open source) |
| AI/ML Orchestration | LangChain | 0.1.0+ | Agent chain | Free (open source) |
| LLM | Claude Sonnet 4.5 | Latest | Natural language | $5-50 (usage-based) |
| Database | Supabase | PostgreSQL 15+ | Data storage | Free tier (MVP) |
| Vector DB | pgvector | 0.5.0+ | Embeddings | Included with Supabase |
| Embeddings | OpenAI | text-embedding-3-small | Vector generation | $0.50-2 (usage-based) |
| Phone System | Twilio | API v2010 | Voice calls | $2-10 (usage-based) |
| Speech-to-Text | Deepgram | Nova 2 | Voice transcription | $0-15 (free credit) |
| Text-to-Speech | ElevenLabs | Turbo v2 | Voice synthesis | $0-5 (free tier) |
| Web Scraping | BeautifulSoup | 4.12+ | HTML parsing | Free (open source) |
| PDF Processing | pdfplumber | 0.10+ | Text extraction | Free (open source) |
| Frontend | Lovable | Latest | Landing page | Free tier (MVP) |
| Hosting | Railway | N/A | Backend deploy | Free tier (MVP) |
| Version Control | GitHub | N/A | Code repository | Free (public repo) |
| **TOTAL MONTHLY COST (MVP)** | | | | **~$10-20** |
| **TOTAL MONTHLY COST (PRODUCTION)** | | | | **~$100-150** |

---

## Next Steps

After this document is approved:
1. Create DATABASE_SCHEMA.md (detailed table schemas, RLS policies)
2. Create MEMORY_SYSTEM.md (conversation storage and retrieval patterns)
3. Create API_ENDPOINTS.md (FastAPI endpoint specifications)
4. Create DEMO_GENERATOR_SPEC.md (custom demo creation logic)
5. Create VOICE_PIPELINE.md (Twilio → Deepgram → Agent → ElevenLabs flow)

---

**Document Status**: Draft v1.0
**Last Updated**: 2025-10-28
**Next Review**: After approval and before DATABASE_SCHEMA.md creation
