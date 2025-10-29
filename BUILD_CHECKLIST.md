# ProShop 24/7 - Build Checklist

## Document Overview

This is the **master build guide** for ProShop 24/7 MVP. Follow this document step-by-step to build and launch the complete system in one 7-8 hour sprint. Each hour is broken down into specific tasks with code examples, testing steps, and success criteria.

**Use this document as your blueprint for implementation.**

---

## Build Philosophy

### The One-Night Sprint Approach

**Goal**: Ship a working MVP in 7-8 hours that prospects can test immediately.

**Principles**:
1. **Build sequentially** - Complete each hour before moving to the next
2. **Test continuously** - Verify each component works before building the next
3. **Ship imperfect** - 80% done and deployed > 100% perfect and unreleased
4. **Document as you go** - Add comments, log decisions
5. **No premature optimization** - Make it work, then make it fast

### Success Definition

**You're done when**:
- ✅ Voice call to Twilio number works (AI answers)
- ✅ Text chat on landing page works (AI responds)
- ✅ Custom demo generator works (30-second creation)
- ✅ Memory system works (remembers returning callers)
- ✅ Landing page is live and looks professional
- ✅ All tests pass (20+ scenarios)

---

## Pre-Build Setup (30 minutes)

### Before You Start

**Complete these prerequisites**:

1. **Read all documentation** (skim if needed)
   - [ ] PROJECT_MASTER.md (understand vision)
   - [ ] TECH_STACK.md (know the tools)
   - [ ] DATABASE_SCHEMA.md (understand data model)
   - [ ] All other spec docs (reference as needed)

2. **Create all accounts** (from DEPLOYMENT.md)
   - [ ] Railway account + payment method
   - [ ] Supabase account
   - [ ] Anthropic API key
   - [ ] OpenAI API key
   - [ ] ElevenLabs account + API key
   - [ ] Deepgram API key
   - [ ] Twilio account + phone number
   - [ ] Lovable account

3. **Set up development environment**
   - [ ] Python 3.11+ installed
   - [ ] VS Code or preferred IDE
   - [ ] Git installed
   - [ ] GitHub account
   - [ ] Terminal/command line ready

4. **Create project structure**
   ```bash
   mkdir -p ~/projects/proshop-247
   cd ~/projects/proshop-247

   mkdir -p backend/{api,services,models,utils,tests}
   mkdir docs

   touch backend/main.py
   touch backend/requirements.txt
   touch backend/.env
   touch backend/.env.example
   touch README.md
   ```

5. **Initialize git repository**
   ```bash
   git init
   echo ".env" >> .gitignore
   echo "__pycache__/" >> .gitignore
   echo "*.pyc" >> .gitignore
   git add .
   git commit -m "Initial project structure"
   ```

---

## Hour 1: Database Setup + Core Dependencies (60 min)

### Tasks

**1.1 Set up Supabase Project (15 min)**

- [ ] Create Supabase project: "proshop-247-production"
- [ ] Enable pgvector extension
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "pg_trgm";
  ```

**1.2 Create Database Schema (30 min)**

- [ ] Copy complete SQL from DATABASE_SCHEMA.md
- [ ] Run in Supabase SQL Editor:
  - [ ] Create golf_courses table
  - [ ] Create callers table
  - [ ] Create conversations table
  - [ ] Create demo_courses table
  - [ ] Create demo_interactions table
  - [ ] Create demo_leads table
  - [ ] Create all indexes
  - [ ] Create all triggers
  - [ ] Enable RLS on all tables
  - [ ] Create RLS policies

- [ ] Insert Fox Hollow sample data:
  ```sql
  INSERT INTO golf_courses (name, slug, location, ...) VALUES (...);
  ```

- [ ] Verify tables created:
  ```sql
  SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
  ```

**1.3 Create Storage Buckets (10 min)**

- [ ] Create course-assets bucket
- [ ] Create demo-assets bucket
- [ ] Configure storage policies (public read, service role write)

**1.4 Set up Python environment (5 min)**

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Create requirements.txt
cat > requirements.txt << EOF
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-dotenv==1.0.0
supabase==2.0.0
anthropic==0.5.0
openai==1.3.0
langchain==0.1.0
langchain-anthropic==0.1.0
elevenlabs==0.2.0
deepgram-sdk==3.0.0
twilio==8.10.0
beautifulsoup4==4.12.2
lxml==4.9.3
pdfplumber==0.10.3
arq==0.25.0
redis==5.0.0
pydantic==2.5.0
python-multipart==0.0.6
requests==2.31.0
audioop-lts==0.2.0
websockets==12.0
EOF

pip install -r requirements.txt
```

### Testing Hour 1

```bash
# Verify Supabase connection
python3 << EOF
from supabase import create_client
import os

supabase = create_client(
    "YOUR_SUPABASE_URL",
    "YOUR_SUPABASE_ANON_KEY"
)

result = supabase.table('golf_courses').select('*').execute()
print(f"✅ Golf courses: {len(result.data)} found")
EOF
```

**Success Criteria**:
- [x] All tables exist in Supabase
- [x] Fox Hollow data inserted
- [x] Python packages installed
- [x] Supabase connection works

---

## Hour 2: Voice Integration Setup (60 min)

### Tasks

**2.1 Create Twilio webhook handler (20 min)**

```python
# backend/api/webhooks.py

from fastapi import FastAPI, Form, Request
from twilio.twiml.voice_response import VoiceResponse, Connect, Stream
import os

app = FastAPI()

@app.post("/v1/webhook/voice")
async def handle_incoming_call(
    request: Request,
    CallSid: str = Form(...),
    From: str = Form(...),
    To: str = Form(...)
):
    """Handle incoming voice call from Twilio"""

    # Get golf course by phone number
    # (Simplified for now - Fox Hollow only)

    # Build TwiML response
    response = VoiceResponse()
    response.say(
        "Thanks for calling Fox Hollow Golf Course!",
        voice="Polly.Joanna"
    )

    # Connect to WebSocket for streaming
    connect = Connect()
    stream = Stream(url=f"wss://{request.url.hostname}/v1/media-stream")
    stream.parameter(name="call_sid", value=CallSid)
    stream.parameter(name="caller_number", value=From)
    connect.append(stream)
    response.append(connect)

    return Response(content=str(response), media_type="application/xml")
```

**2.2 Set up WebSocket handler skeleton (20 min)**

```python
# backend/api/voice.py

from fastapi import WebSocket
import json
import logging

logger = logging.getLogger(__name__)

call_sessions = {}

@app.websocket("/v1/media-stream")
async def media_stream_handler(websocket: WebSocket):
    """Handle Twilio Media Stream WebSocket"""

    await websocket.accept()
    logger.info("WebSocket connection accepted")

    stream_sid = None
    call_sid = None

    try:
        async for message in websocket.iter_text():
            data = json.loads(message)
            event = data.get('event')

            if event == 'start':
                stream_sid = data['streamSid']
                call_sid = data['start']['callSid']
                logger.info(f"Stream started: {call_sid}")

                # Initialize session
                call_sessions[call_sid] = {
                    'stream_sid': stream_sid,
                    'started_at': datetime.utcnow()
                }

            elif event == 'media':
                # TODO: Process audio (Hour 3)
                pass

            elif event == 'stop':
                logger.info(f"Stream stopped: {call_sid}")
                if call_sid in call_sessions:
                    del call_sessions[call_sid]
                break

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        await websocket.close()
```

**2.3 Configure Twilio (15 min)**

- [ ] Purchase Twilio phone number
- [ ] Configure webhook URL (use ngrok for local testing):
  ```bash
  ngrok http 8000
  # Copy https URL
  ```
- [ ] Set webhook in Twilio Console:
  - Voice URL: `https://YOUR-NGROK-URL/v1/webhook/voice`
  - Method: POST

**2.4 Test basic call (5 min)**

- [ ] Run FastAPI server:
  ```bash
  uvicorn main:app --reload --port 8000
  ```
- [ ] Call Twilio number
- [ ] Verify greeting plays

### Testing Hour 2

```bash
# Test webhook endpoint
curl -X POST http://localhost:8000/v1/webhook/voice \
  -d "CallSid=TEST123" \
  -d "From=+15551234567" \
  -d "To=+18005551234"

# Expected: TwiML XML response
```

**Success Criteria**:
- [x] Twilio webhook returns TwiML
- [x] WebSocket connection accepted
- [x] Phone call plays greeting
- [x] WebSocket receives start/stop events

---

## Hour 3: LangChain Agent + Memory System (60 min)

### Tasks

**3.1 Create memory system functions (20 min)**

```python
# backend/services/memory.py

from supabase import Client
from typing import Dict, List

def identify_or_create_caller(
    supabase: Client,
    phone_number: str,
    golf_course_id: str
) -> Dict:
    """Identify caller or create new account"""

    # Normalize phone number
    phone_normalized = phone_number.replace('+', '').replace(' ', '')

    # Check if exists
    result = supabase.table('callers') \
        .select('*') \
        .eq('phone_number', phone_number) \
        .eq('golf_course_id', golf_course_id) \
        .execute()

    if result.data:
        # Update last_seen
        caller = result.data[0]
        supabase.table('callers') \
            .update({'last_seen': 'NOW()'}) \
            .eq('id', caller['id']) \
            .execute()
        return caller

    # Create new caller
    new_caller = {
        'phone_number': phone_number,
        'phone_number_normalized': phone_normalized,
        'golf_course_id': golf_course_id,
        'total_conversations': 0
    }

    result = supabase.table('callers').insert(new_caller).execute()
    return result.data[0]

def retrieve_last_3_conversations(
    supabase: Client,
    caller_id: str
) -> List[Dict]:
    """Retrieve last 3 conversations for context"""

    result = supabase.table('conversations') \
        .select('summary, intent, created_at') \
        .eq('caller_id', caller_id) \
        .order('created_at', desc=True) \
        .limit(3) \
        .execute()

    return result.data

def store_conversation(
    supabase: Client,
    caller_id: str,
    golf_course_id: str,
    transcript: str
) -> str:
    """Store completed conversation"""

    # Generate summary (simplified - use Claude in production)
    summary = transcript[:200] + "..."

    conversation = {
        'caller_id': caller_id,
        'golf_course_id': golf_course_id,
        'channel': 'voice',
        'transcript': transcript,
        'summary': summary,
        'status': 'completed'
    }

    result = supabase.table('conversations').insert(conversation).execute()
    return result.data[0]['id']
```

**3.2 Create LangChain agent (25 min)**

```python
# backend/services/agent.py

from langchain.chat_models import ChatAnthropic
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
import os

def create_agent(golf_course: Dict, conversation_history: str):
    """Create LangChain agent with memory"""

    # Build system prompt
    system_prompt = f"""You are an AI assistant for {golf_course['name']}.

Keep responses concise (2-3 sentences).

Course Info:
- Location: {golf_course['location']}
- Hours: 7am-8pm daily
- Pricing: Weekday $25, Weekend $45

{conversation_history}

Current message: {{input}}
Assistant:"""

    prompt = PromptTemplate(
        input_variables=["input"],
        template=system_prompt
    )

    llm = ChatAnthropic(
        model="claude-sonnet-4-5-20250929",
        temperature=0.7,
        max_tokens=512,
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
    )

    memory = ConversationBufferMemory()

    agent = ConversationChain(
        llm=llm,
        prompt=prompt,
        memory=memory,
        verbose=True
    )

    return agent
```

**3.3 Test agent standalone (15 min)**

```python
# backend/test_agent.py

from services.agent import create_agent
from services.memory import retrieve_last_3_conversations

# Mock golf course
golf_course = {
    'name': 'Fox Hollow Golf Course',
    'location': 'American Fork, UT'
}

# Create agent
agent = create_agent(golf_course, "No previous conversations.")

# Test conversation
response1 = agent.run("What are your hours?")
print(f"Agent: {response1}")

response2 = agent.run("How much for 18 holes?")
print(f"Agent: {response2}")

response3 = agent.run("What did I just ask about?")
print(f"Agent: {response3}")  # Should remember hours question
```

### Testing Hour 3

```bash
# Run agent test
python backend/test_agent.py

# Expected output:
# Agent: We're open 7am-8pm daily...
# Agent: Weekday is $25, weekend $45...
# Agent: You asked about our hours...
```

**Success Criteria**:
- [x] Memory system creates/retrieves callers
- [x] Agent responds naturally
- [x] Agent remembers conversation context
- [x] Responses are concise (<3 sentences)

---

## Hour 4: API Endpoints + Demo System Backend (60 min)

### Tasks

**4.1 Create chat endpoint (15 min)**

```python
# backend/api/chat.py

from fastapi import HTTPException
from pydantic import BaseModel
from services.agent import create_agent
from services.demo import get_demo_course, record_demo_interaction

class ChatRequest(BaseModel):
    message: str
    session_id: str
    context: dict = {}

class ChatResponse(BaseModel):
    response: str
    session_id: str

@app.post("/v1/chat", response_model=ChatResponse)
async def handle_chat(chat_request: ChatRequest):
    """Handle text chat (demo system)"""

    demo_slug = chat_request.context.get('demo_slug')

    if not demo_slug:
        raise HTTPException(status_code=400, detail="demo_slug required")

    # Get demo course
    demo_course = get_demo_course(supabase, demo_slug)

    if not demo_course:
        raise HTTPException(status_code=404, detail="Demo not found")

    # Check interaction limit
    if demo_course['interaction_count'] >= demo_course['interaction_limit']:
        raise HTTPException(status_code=429, detail="Demo limit reached")

    # Create agent
    agent = create_agent(demo_course, "This is a demo.")

    # Get response
    response_text = agent.run(chat_request.message)

    # Record interaction
    record_demo_interaction(
        supabase,
        demo_course['id'],
        'text-chat',
        chat_request.message,
        response_text
    )

    return ChatResponse(
        response=response_text,
        session_id=chat_request.session_id
    )
```

**4.2 Create demo creation endpoint (30 min)**

```python
# backend/api/demo.py

from fastapi import UploadFile, File, Form
from services.demo import generate_demo_slug, upload_file_to_supabase

@app.post("/v1/demo/create")
async def create_demo(
    name: str = Form(...),
    location: str = Form(...),
    website_url: str = Form(None),
    email: str = Form(...),
    logo: UploadFile = File(None),
    menu: UploadFile = File(None)
):
    """Create custom demo"""

    # Generate unique slug
    demo_slug = generate_demo_slug()

    # Upload files if provided
    logo_url = None
    menu_url = None

    if logo:
        logo_url = await upload_file_to_supabase(logo, demo_slug, 'logo')

    if menu:
        menu_url = await upload_file_to_supabase(menu, demo_slug, 'menu')

    # Create demo record
    demo_data = {
        'demo_slug': demo_slug,
        'name': name,
        'location': location,
        'website_url': website_url,
        'creator_email': email,
        'logo_url': logo_url,
        'menu_file_url': menu_url,
        'interaction_limit': 25,
        'demo_status': 'active'
    }

    result = supabase.table('demo_courses').insert(demo_data).execute()
    demo_id = result.data[0]['id']

    # Create lead record
    lead_data = {
        'demo_course_id': demo_id,
        'email': email,
        'company_name': name,
        'lead_status': 'new'
    }
    supabase.table('demo_leads').insert(lead_data).execute()

    # TODO: Schedule background jobs (scraping, AI processing)

    return {
        'demo_slug': demo_slug,
        'demo_url': f'https://proshop247.com/demo/{demo_slug}',
        'status': 'active'
    }
```

**4.3 Create demo helper functions (15 min)**

```python
# backend/services/demo.py

import secrets
import base64

def generate_demo_slug() -> str:
    """Generate unique 9-character slug"""
    return ''.join(secrets.choice('abcdefghijklmnopqrstuvwxyz0123456789') for _ in range(9))

async def upload_file_to_supabase(
    file: UploadFile,
    demo_slug: str,
    file_type: str
) -> str:
    """Upload file to Supabase Storage"""

    # Read file
    contents = await file.read()

    # Validate size (5MB max)
    if len(contents) > 5 * 1024 * 1024:
        raise ValueError("File too large")

    # Upload to Supabase
    file_path = f"{demo_slug}/{file_type}_{file.filename}"

    supabase.storage.from_('demo-assets').upload(
        file_path,
        contents,
        file_options={"content-type": file.content_type}
    )

    # Get public URL
    public_url = supabase.storage.from_('demo-assets').get_public_url(file_path)

    return public_url

def get_demo_course(supabase: Client, demo_slug: str) -> Dict:
    """Get demo course by slug"""
    result = supabase.table('demo_courses') \
        .select('*') \
        .eq('demo_slug', demo_slug) \
        .execute()

    return result.data[0] if result.data else None

def record_demo_interaction(
    supabase: Client,
    demo_course_id: str,
    interaction_type: str,
    user_message: str,
    agent_response: str
):
    """Record demo interaction"""

    interaction = {
        'demo_course_id': demo_course_id,
        'interaction_type': interaction_type,
        'user_message': user_message,
        'agent_response': agent_response
    }

    supabase.table('demo_interactions').insert(interaction).execute()
```

### Testing Hour 4

```bash
# Test chat endpoint
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are your hours?",
    "session_id": "test123",
    "context": {"demo_slug": "fox-hollow"}
  }'

# Test demo creation
curl -X POST http://localhost:8000/v1/demo/create \
  -F "name=Test Golf Club" \
  -F "location=Phoenix, AZ" \
  -F "email=test@example.com"
```

**Success Criteria**:
- [x] Chat endpoint returns response
- [x] Demo creation returns demo_slug
- [x] File upload works
- [x] Interaction counting works

---

## Hour 5: Integrate Voice Pipeline (60 min)

### Tasks

**5.1 Add Deepgram STT integration (20 min)**

```python
# backend/services/voice.py

from deepgram import DeepgramClient, LiveTranscriptionEvents, LiveOptions

async def initialize_deepgram_stream(call_sid: str):
    """Initialize Deepgram WebSocket"""

    deepgram = DeepgramClient(os.getenv("DEEPGRAM_API_KEY"))

    options = LiveOptions(
        model="nova-2",
        language="en-US",
        punctuate=True,
        interim_results=True,
        endpointing=300
    )

    dg_connection = deepgram.listen.websocket.v("1")

    def on_message(self, result, **kwargs):
        sentence = result.channel.alternatives[0].transcript

        if sentence and result.is_final and result.speech_final:
            # Complete utterance - queue for agent
            call_sessions[call_sid]['agent_queue'].put_nowait(sentence)

    dg_connection.on(LiveTranscriptionEvents.Transcript, on_message)

    await dg_connection.start(options)

    return dg_connection
```

**5.2 Add ElevenLabs TTS integration (20 min)**

```python
# backend/services/voice.py

from elevenlabs import generate, Voice

async def text_to_speech(text: str) -> bytes:
    """Convert text to speech"""

    audio_stream = generate(
        text=text,
        voice=Voice(voice_id=os.getenv("ELEVENLABS_VOICE_ID")),
        model="eleven_turbo_v2",
        stream=True
    )

    audio_chunks = []
    for chunk in audio_stream:
        if chunk:
            audio_chunks.append(chunk)

    return b''.join(audio_chunks)
```

**5.3 Connect everything in WebSocket handler (20 min)**

```python
# Update backend/api/voice.py

@app.websocket("/v1/media-stream")
async def media_stream_handler(websocket: WebSocket):
    await websocket.accept()

    # ... (keep existing start event handling)

    if event == 'start':
        # Initialize Deepgram
        deepgram_ws = await initialize_deepgram_stream(call_sid)

        # Initialize agent
        caller = identify_or_create_caller(supabase, caller_number, golf_course_id)
        history = retrieve_last_3_conversations(supabase, caller['id'])
        agent = create_agent(golf_course, format_history(history))

        # Start agent response handler
        asyncio.create_task(handle_agent_responses(websocket, stream_sid, call_sid, agent))

    elif event == 'media':
        # Send audio to Deepgram
        audio_payload = base64.b64decode(data['media']['payload'])
        await deepgram_ws.send(audio_payload)
```

### Testing Hour 5

- [ ] Make test call
- [ ] Speak into phone: "What are your hours?"
- [ ] Verify agent responds with voice
- [ ] Check Railway logs for transcription

**Success Criteria**:
- [x] Deepgram transcribes speech
- [x] Agent generates response
- [x] ElevenLabs converts to speech
- [x] Caller hears response

---

## Hour 6: Lovable Frontend Build (60 min)

### Tasks

**6.1 Create Lovable project (5 min)**

- [ ] Go to lovable.dev
- [ ] Create project: "ProShop 24/7 Landing"
- [ ] Select "Start from scratch"

**6.2 Build Hero section (15 min)**

Use this Lovable prompt:
```
Create a hero section with:
- Headline: "Your Golf Course, Answered 24/7" (56px bold)
- Subheadline: "AI-powered voice agent that remembers every customer"
- Two buttons:
  * "Try Fox Hollow Demo" (green #2E7D32, white text)
  * "Upload Your Course" (white bg, green border)
- Golf course background image (subtle, 50% opacity)
- Mobile responsive (stacked layout)
```

**6.3 Build Dual-Demo section (20 min)**

Use this Lovable prompt:
```
Create two cards side-by-side (mobile: stacked):

Left card - Fox Hollow Demo:
- Title: "Fox Hollow Demo"
- Description: "Test our polished demo..."
- Button: "Test Text Chat" (opens chat widget)
- Phone number: "📞 Call: 1-800-XXX-XXXX"

Right card - Custom Demo:
- Title: "Custom Demo"
- Description: "Upload your course data..."
- Button: "Create My Demo" (opens modal)
- Feature list with 3 bullets

Style: White bg, border, shadow, hover lift effect
```

**6.4 Build chat widget (15 min)**

```
Create a chat widget component:
- Fixed bottom-right, 380px wide
- Header: Forest green, "Chat with ProShop AI"
- Message bubbles: Agent (left, gray), User (right, green)
- Input field at bottom with send button
- Minimize/close buttons
- Mobile: Full screen modal

Connect to API: POST https://api.proshop247.com/v1/chat
```

**6.5 Build onboarding modal (5 min)**

```
Create a 3-step modal for demo creation:

Step 1: Name, Location, Website, Email (all required)
Step 2: File uploads (menu, scorecard, logo) - drag & drop
Step 3: Hours, phone, services (checkboxes)

Success screen: Show demo URL, copy button, test buttons

Style: Centered modal, 600px wide, progress dots at top
```

### Testing Hour 6

- [ ] Preview in Lovable
- [ ] Test chat widget (connects to backend)
- [ ] Test demo creation modal (form submission)
- [ ] Verify mobile responsive

**Success Criteria**:
- [x] Landing page looks professional
- [x] Chat widget connects to backend
- [x] Demo creation works
- [x] Mobile responsive

---

## Hour 7: Testing & Deployment (60 min)

### Tasks

**7.1 Deploy backend to Railway (15 min)**

```bash
# Push to GitHub
git add .
git commit -m "ProShop 24/7 MVP complete"
git push origin main

# Create Railway project
# - Connect GitHub repo
# - Set environment variables (from DEPLOYMENT.md)
# - Deploy

# Wait for deployment
# Get public URL
```

**7.2 Deploy frontend to Lovable (5 min)**

- [ ] Click "Publish" in Lovable
- [ ] Deploy to production
- [ ] Get public URL

**7.3 Configure Twilio for production (5 min)**

- [ ] Update webhook URL to Railway URL
- [ ] Test voice call

**7.4 Run complete test suite (35 min)**

**Test 1: Voice Call (5 min)**
- [ ] Call Twilio number
- [ ] Verify greeting
- [ ] Ask: "What are your hours?"
- [ ] Verify natural response
- [ ] Hang up

**Test 2: Memory System (10 min)**
- [ ] Call from same number again
- [ ] Say: "Hi, it's me again"
- [ ] Verify agent acknowledges: "Welcome back!"
- [ ] Reference previous conversation
- [ ] Verify context maintained

**Test 3: Text Chat (5 min)**
- [ ] Open landing page
- [ ] Click "Test Text Chat"
- [ ] Send: "What are your hours?"
- [ ] Verify response
- [ ] Send follow-up question
- [ ] Verify context maintained

**Test 4: Demo Creation (10 min)**
- [ ] Click "Upload Your Course"
- [ ] Fill form (use test data)
- [ ] Upload test files
- [ ] Click "Generate My Demo"
- [ ] Verify demo URL appears
- [ ] Open demo URL
- [ ] Test text chat on custom demo
- [ ] Verify demo-specific data appears

**Test 5: Demo Limit (5 min)**
- [ ] Create demo
- [ ] Send 25 messages (can script this)
- [ ] Verify 26th message rejected
- [ ] Verify limit message appears

### Testing Hour 7

**Complete End-to-End Test**:
```bash
# Automated test script
python backend/tests/test_e2e.py

# Expected: All tests pass
# ✅ Database connection
# ✅ Voice webhook
# ✅ Chat endpoint
# ✅ Demo creation
# ✅ Memory system
# ✅ File upload
# ✅ Interaction limit
```

**Success Criteria**:
- [x] Backend deployed to Railway
- [x] Frontend deployed to Lovable
- [x] Voice calls work end-to-end
- [x] Text chat works
- [x] Demo creation works
- [x] Memory system works
- [x] All tests pass

---

## Hour 8: Polish & Launch Prep (Optional - 60 min)

### Tasks

**8.1 Add error handling (20 min)**

- [ ] Add try-catch to all endpoints
- [ ] Add proper HTTP status codes
- [ ] Add error logging
- [ ] Test error scenarios

**8.2 Add monitoring (15 min)**

- [ ] Verify Railway logs working
- [ ] Add structured logging
- [ ] Test log filtering

**8.3 Final polish (15 min)**

- [ ] Review landing page copy
- [ ] Check mobile responsive
- [ ] Test on real mobile device
- [ ] Fix any UI bugs

**8.4 Create README (10 min)**

```markdown
# ProShop 24/7

AI-powered voice agent for golf courses.

## Features
- 24/7 voice answering
- Conversation memory
- Custom demos in 30 seconds

## Demo
Try it: https://proshop247.com

## Tech Stack
- Backend: FastAPI + Claude + LangChain
- Frontend: Lovable (React)
- Database: Supabase
- Voice: Twilio + Deepgram + ElevenLabs
```

---

## Final Launch Checklist

### Pre-Launch Verification

**Environment**:
- [ ] All API keys set in Railway
- [ ] CORS origins configured correctly
- [ ] SECRET_KEY is strong and secret
- [ ] Database RLS policies enabled

**Functionality**:
- [ ] Voice calls work (test from 3 different phones)
- [ ] Text chat works (test on desktop + mobile)
- [ ] Demo creation works
- [ ] Demo limit enforced (25 interactions)
- [ ] Memory system works (returning caller test)
- [ ] File uploads work (menu, scorecard, logo)

**Performance**:
- [ ] Voice response < 3 seconds
- [ ] Text chat response < 2 seconds
- [ ] Demo creation < 60 seconds
- [ ] Landing page loads < 2 seconds

**Security**:
- [ ] .env not in git
- [ ] Service role key not exposed in frontend
- [ ] RLS policies tested
- [ ] File upload size limits enforced

**Content**:
- [ ] Landing page copy finalized
- [ ] Fox Hollow data accurate
- [ ] Twilio number displayed correctly
- [ ] Demo instructions clear

### Launch!

**Soft Launch (Internal Testing)**:
1. [ ] Send demo link to 5 friends
2. [ ] Ask them to test both demos
3. [ ] Collect feedback
4. [ ] Fix critical bugs

**Public Launch**:
1. [ ] Announce on Twitter/LinkedIn
2. [ ] Email Fox Hollow
3. [ ] Post in golf industry forums
4. [ ] Monitor for first 24 hours

---

## Troubleshooting Guide

### Common Issues

**Issue: "Voice call doesn't connect"**
- Check Twilio webhook URL is correct
- Verify Railway deployment is live
- Check Railway logs for errors
- Test webhook manually with curl

**Issue: "Agent responses are slow"**
- Check Claude API key is valid
- Verify Railway has enough resources
- Check network latency
- Enable streaming (if not already)

**Issue: "Memory system not working"**
- Verify callers table has RLS policies
- Check caller_id is being passed correctly
- Test database query manually
- Check conversation history formatting

**Issue: "Demo creation fails"**
- Check Supabase Storage permissions
- Verify file size < 5MB
- Check email validation
- Look for error in Railway logs

**Issue: "Chat widget not connecting"**
- Check CORS settings in backend
- Verify API URL in frontend
- Test endpoint with curl
- Check browser console for errors

---

## Success Metrics

### MVP Success Criteria

**Technical**:
- [x] System handles 10 concurrent calls
- [x] Response latency < 3 seconds
- [x] Uptime > 99% (first week)
- [x] Zero data breaches

**Business**:
- [ ] 10 custom demos created (first week)
- [ ] 50 interactions across all demos
- [ ] 5 email leads captured
- [ ] 1 demo-to-customer conversion (first month)

**Quality**:
- [ ] Voice quality: 4/5 average rating
- [ ] Agent accuracy: 90%+ correct responses
- [ ] Demo creation success rate: 95%+
- [ ] Zero critical bugs (first week)

---

## Post-Launch Roadmap

### Week 1: Monitor & Fix
- Watch Railway logs daily
- Fix critical bugs immediately
- Respond to user feedback
- Track cost per interaction

### Week 2: Optimize
- Improve agent prompts based on real conversations
- Optimize response latency
- Add missing data to Fox Hollow profile
- Improve error messages

### Month 1: Enhance
- Add OAuth login (V2)
- Build analytics dashboard
- Add SMS support
- Improve demo scraping accuracy

### Month 2: Scale
- Onboard 5 more golf courses
- Build course management UI
- Add calendar integration
- Implement pricing templates

---

## Congratulations!

**You've built ProShop 24/7 MVP! 🎉**

You now have:
- ✅ Working voice AI agent
- ✅ Conversation memory system
- ✅ Custom demo generator
- ✅ Professional landing page
- ✅ Production deployment

**Next steps**:
1. Monitor first users closely
2. Collect feedback
3. Iterate quickly
4. Scale to 10 golf courses

**Remember**: Shipped imperfect > Perfect unreleased

Good luck! 🚀

---

**Document Status**: Final v1.0
**Last Updated**: 2025-10-28
**Total Documentation**: 11/11 Complete ✅
