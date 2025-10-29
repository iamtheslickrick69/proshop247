# ProShop 24/7 - API Endpoints Specification

## Document Overview

This document defines all FastAPI endpoints for the ProShop 24/7 backend. Each endpoint includes request/response schemas, authentication requirements, rate limiting, error handling, and implementation examples.

---

## API Architecture Overview

### Base Configuration

**Base URL**: `https://api.proshop247.com`

**Framework**: FastAPI 0.104+

**API Versioning**: `/v1/` prefix for all endpoints (future-proof)

**Response Format**: JSON

**Authentication**:
- Twilio webhooks: Signature verification
- Demo endpoints: Public (rate-limited by IP)
- Admin endpoints: API key (V2)

---

## Endpoint Categories

### 1. Twilio Webhooks (Voice & SMS)
- `POST /v1/webhook/voice` - Incoming voice call handler
- `POST /v1/webhook/call-status` - Call status updates
- `POST /v1/webhook/sms` - Incoming SMS handler (V2)

### 2. Text Chat (Landing Page Widget)
- `POST /v1/chat` - Text chat message endpoint
- `WS /v1/chat/ws` - WebSocket connection (optional, better UX)

### 3. Demo System
- `POST /v1/demo/create` - Create custom demo
- `GET /v1/demo/{slug}` - Get demo details
- `POST /v1/demo/{slug}/interact` - Record demo interaction
- `GET /v1/demo/{slug}/status` - Check demo limit status

### 4. Golf Course Management (V2)
- `GET /v1/courses` - List golf courses
- `GET /v1/courses/{slug}` - Get course details
- `POST /v1/courses` - Create new course (admin)
- `PUT /v1/courses/{slug}` - Update course (admin)

### 5. Conversation History (V2)
- `GET /v1/conversations` - List caller's conversations
- `GET /v1/conversations/{id}` - Get conversation details
- `POST /v1/conversations/search` - Semantic search

### 6. Health & Monitoring
- `GET /v1/health` - Health check
- `GET /v1/metrics` - System metrics (admin)

---

## Endpoint Specifications

## 1. Twilio Webhooks

### POST /v1/webhook/voice

**Purpose**: Handle incoming voice calls from Twilio

**Authentication**: Twilio signature verification

**Rate Limiting**: No limit (Twilio origin only)

**Request (from Twilio)**:
```
Content-Type: application/x-www-form-urlencoded

CallSid=CA1234567890abcdef
From=+15551234567
To=+18005551234
CallStatus=ringing
Direction=inbound
```

**Response**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">
        Thanks for calling Fox Hollow Golf Course! Connecting you to our assistant.
    </Say>
    <Connect>
        <Stream url="wss://api.proshop247.com/v1/media-stream" />
    </Connect>
</Response>
```

**Implementation**:

```python
from fastapi import FastAPI, Form, Request, HTTPException
from twilio.twiml.voice_response import VoiceResponse, Connect, Stream
from twilio.request_validator import RequestValidator
import os

app = FastAPI()

def validate_twilio_request(request: Request, form_data: dict) -> bool:
    """
    Validate Twilio request signature for security.
    """
    validator = RequestValidator(os.getenv("TWILIO_AUTH_TOKEN"))

    # Get Twilio signature from headers
    signature = request.headers.get("X-Twilio-Signature", "")

    # Build full URL
    url = str(request.url)

    # Validate signature
    return validator.validate(url, form_data, signature)

@app.post("/v1/webhook/voice")
async def handle_incoming_call(
    request: Request,
    CallSid: str = Form(...),
    From: str = Form(...),
    To: str = Form(...),
    CallStatus: str = Form(...)
):
    """
    Handle incoming voice call from Twilio.

    Flow:
    1. Validate Twilio signature
    2. Identify golf course (by 'To' number)
    3. Identify/create caller (by 'From' number)
    4. Retrieve last 3 conversations
    5. Return TwiML with WebSocket stream URL
    """

    # Validate request
    form_data = await request.form()
    if not validate_twilio_request(request, dict(form_data)):
        raise HTTPException(status_code=403, detail="Invalid Twilio signature")

    # Identify golf course
    golf_course = get_golf_course_by_phone(To)
    if not golf_course:
        # Unknown number, reject call
        response = VoiceResponse()
        response.say("Sorry, this number is not configured. Please contact support.")
        response.hangup()
        return Response(content=str(response), media_type="application/xml")

    # Identify or create caller
    caller = identify_or_create_caller(From, golf_course['id'])

    # Store call session data (for later use in media stream)
    store_call_session({
        'call_sid': CallSid,
        'caller_id': caller['id'],
        'golf_course_id': golf_course['id'],
        'started_at': datetime.utcnow()
    })

    # Build TwiML response
    response = VoiceResponse()

    # Greeting
    greeting = golf_course.get('greeting_message', f"Thanks for calling {golf_course['name']}!")
    response.say(greeting, voice="Polly.Joanna")

    # Connect to WebSocket for real-time audio streaming
    connect = Connect()
    stream = Stream(url=f"wss://api.proshop247.com/v1/media-stream?call_sid={CallSid}")
    connect.append(stream)
    response.append(connect)

    return Response(content=str(response), media_type="application/xml")
```

**Error Handling**:
- Invalid signature → 403 Forbidden
- Unknown phone number → Polite rejection + hangup
- Database error → Fallback to basic greeting (no memory)

---

### POST /v1/webhook/call-status

**Purpose**: Receive call status updates (completed, failed, etc.)

**Authentication**: Twilio signature verification

**Request (from Twilio)**:
```
Content-Type: application/x-www-form-urlencoded

CallSid=CA1234567890abcdef
CallStatus=completed
CallDuration=185
RecordingUrl=https://api.twilio.com/...
```

**Response**:
```json
{
  "status": "success"
}
```

**Implementation**:

```python
@app.post("/v1/webhook/call-status")
async def handle_call_status(
    request: Request,
    CallSid: str = Form(...),
    CallStatus: str = Form(...),
    CallDuration: int = Form(0),
    RecordingUrl: str = Form(None)
):
    """
    Handle call status updates from Twilio.

    Triggered when call ends, used to store conversation.
    """

    # Validate request
    form_data = await request.form()
    if not validate_twilio_request(request, dict(form_data)):
        raise HTTPException(status_code=403, detail="Invalid Twilio signature")

    # Only process completed calls
    if CallStatus != "completed":
        return {"status": "ignored"}

    # Retrieve call session data
    session = get_call_session(CallSid)
    if not session:
        return {"status": "error", "message": "Call session not found"}

    # Retrieve transcript (from Deepgram, stored during call)
    transcript = get_transcript(CallSid)

    # Store conversation in database
    conversation_id = store_conversation(
        caller_id=session['caller_id'],
        golf_course_id=session['golf_course_id'],
        channel='voice',
        transcript=transcript,
        metadata={
            'twilio_call_sid': CallSid,
            'call_duration_seconds': CallDuration,
            'call_recording_url': RecordingUrl,
            'started_at': session['started_at'],
            'ended_at': datetime.utcnow()
        }
    )

    # Schedule embedding generation (async background job)
    schedule_embedding_generation(conversation_id, transcript)

    # Clean up session
    delete_call_session(CallSid)

    return {"status": "success", "conversation_id": conversation_id}
```

---

### WS /v1/media-stream

**Purpose**: WebSocket endpoint for real-time audio streaming (Twilio → Deepgram → Agent → ElevenLabs → Twilio)

**Authentication**: Call SID validation

**Implementation**: (Detailed in VOICE_PIPELINE.md)

---

## 2. Text Chat Endpoints

### POST /v1/chat

**Purpose**: Handle text chat messages (landing page widget, demo system)

**Authentication**: None (public, rate-limited)

**Rate Limiting**: 100 requests/minute per IP

**Request Body**:
```json
{
  "message": "What are your hours?",
  "session_id": "abc123xyz",
  "context": {
    "demo_slug": "fox-hollow" // or null for production
  }
}
```

**Response**:
```json
{
  "response": "We're open Monday-Friday 7am-8pm, and Saturday-Sunday 6am-9pm. Would you like to book a tee time?",
  "session_id": "abc123xyz",
  "intent": "hours",
  "conversation_id": "uuid-here" // if conversation stored
}
```

**Pydantic Schemas**:

```python
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    session_id: str = Field(..., min_length=8, max_length=50)
    context: Optional[dict] = None

    class Config:
        schema_extra = {
            "example": {
                "message": "What are your hours?",
                "session_id": "abc123xyz",
                "context": {"demo_slug": "fox-hollow"}
            }
        }

class ChatResponse(BaseModel):
    response: str
    session_id: str
    intent: Optional[str] = None
    conversation_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        schema_extra = {
            "example": {
                "response": "We're open Monday-Friday 7am-8pm...",
                "session_id": "abc123xyz",
                "intent": "hours",
                "conversation_id": "uuid-here",
                "timestamp": "2024-10-28T10:30:00Z"
            }
        }
```

**Implementation**:

```python
from fastapi import HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/v1/chat", response_model=ChatResponse)
@limiter.limit("100/minute")
async def handle_chat(request: Request, chat_request: ChatRequest):
    """
    Handle text chat message.

    Flow:
    1. Identify if demo or production (via context.demo_slug)
    2. Check demo interaction limit (if demo)
    3. Retrieve conversation history (if production)
    4. Call LangChain agent
    5. Store interaction (if demo) or conversation (if production)
    6. Return response
    """

    # Determine if demo or production
    demo_slug = chat_request.context.get('demo_slug') if chat_request.context else None

    if demo_slug:
        # Demo mode
        demo_course = get_demo_course(demo_slug)
        if not demo_course:
            raise HTTPException(status_code=404, detail="Demo not found")

        # Check interaction limit
        if demo_course['interaction_count'] >= demo_course['interaction_limit']:
            raise HTTPException(
                status_code=429,
                detail="Demo interaction limit reached. Upgrade to unlimited."
            )

        # Build agent with demo course data (no conversation history for demos)
        agent = build_demo_agent(demo_course)

        # Get response
        response_text = agent.run(chat_request.message)

        # Record interaction
        record_demo_interaction(
            demo_course_id=demo_course['id'],
            interaction_type='text-chat',
            user_message=chat_request.message,
            agent_response=response_text,
            user_ip=get_remote_address(request)
        )

        return ChatResponse(
            response=response_text,
            session_id=chat_request.session_id,
            intent=detect_conversation_intent(chat_request.message)
        )

    else:
        # Production mode (requires phone number or user authentication - V2)
        # For MVP, text chat is demo-only
        raise HTTPException(
            status_code=400,
            detail="Production text chat requires authentication (V2 feature)"
        )
```

**Error Responses**:

```json
// Demo not found
{
  "detail": "Demo not found",
  "status_code": 404
}

// Demo limit reached
{
  "detail": "Demo interaction limit reached. Upgrade to unlimited.",
  "status_code": 429
}

// Rate limit exceeded
{
  "detail": "Rate limit exceeded. Try again in 60 seconds.",
  "status_code": 429
}
```

---

## 3. Demo System Endpoints

### POST /v1/demo/create

**Purpose**: Create custom demo course

**Authentication**: None (public, rate-limited)

**Rate Limiting**: 5 requests/hour per IP

**Request Body** (multipart/form-data):
```
name: "Sunset Golf Club"
location: "Phoenix, AZ"
website_url: "https://sunsetgolf.com"
phone_number: "602-555-1234"
email: "manager@sunsetgolf.com"  // Required for lead capture
operating_hours: "7am-7pm daily"
services: ["restaurant", "events"]
logo: [file upload]
menu: [file upload]
scorecard: [file upload]
```

**Response**:
```json
{
  "demo_slug": "abc123xyz",
  "demo_url": "https://proshop247.com/demo/abc123xyz",
  "name": "Sunset Golf Club",
  "status": "active",
  "interaction_limit": 25,
  "interaction_count": 0,
  "scrape_status": "pending",
  "ai_processing_status": "pending",
  "created_at": "2024-10-28T10:30:00Z"
}
```

**Pydantic Schemas**:

```python
from pydantic import BaseModel, EmailStr, HttpUrl
from typing import List, Optional
from fastapi import UploadFile, File, Form

class DemoCreateResponse(BaseModel):
    demo_slug: str
    demo_url: str
    name: str
    status: str
    interaction_limit: int
    interaction_count: int
    scrape_status: str
    ai_processing_status: str
    created_at: datetime

    class Config:
        schema_extra = {
            "example": {
                "demo_slug": "abc123xyz",
                "demo_url": "https://proshop247.com/demo/abc123xyz",
                "name": "Sunset Golf Club",
                "status": "active",
                "interaction_limit": 25,
                "interaction_count": 0,
                "scrape_status": "pending",
                "ai_processing_status": "pending",
                "created_at": "2024-10-28T10:30:00Z"
            }
        }
```

**Implementation**:

```python
from fastapi import UploadFile, File, Form
import aiofiles

@app.post("/v1/demo/create", response_model=DemoCreateResponse)
@limiter.limit("5/hour")
async def create_demo(
    request: Request,
    name: str = Form(...),
    location: str = Form(...),
    website_url: Optional[str] = Form(None),
    phone_number: Optional[str] = Form(None),
    email: EmailStr = Form(...),  # Required
    operating_hours: Optional[str] = Form(None),
    services: Optional[str] = Form(None),  # Comma-separated
    logo: Optional[UploadFile] = File(None),
    menu: Optional[UploadFile] = File(None),
    scorecard: Optional[UploadFile] = File(None)
):
    """
    Create custom demo course.

    Flow:
    1. Validate inputs
    2. Generate unique demo slug
    3. Upload files to Supabase Storage
    4. Create demo_courses record
    5. Create demo_leads record
    6. Schedule background jobs (scraping, AI processing)
    7. Return demo URL
    """

    # Generate unique demo slug
    demo_slug = generate_demo_slug()

    # Upload files to Supabase Storage
    logo_url = await upload_demo_file(logo, demo_slug, 'logo') if logo else None
    menu_url = await upload_demo_file(menu, demo_slug, 'menu') if menu else None
    scorecard_url = await upload_demo_file(scorecard, demo_slug, 'scorecard') if scorecard else None

    # Parse services
    services_list = [s.strip() for s in services.split(',')] if services else []

    # Create demo course record
    demo_course = {
        'demo_slug': demo_slug,
        'name': name,
        'location': location,
        'website_url': website_url,
        'phone_number': phone_number,
        'logo_url': logo_url,
        'menu_file_url': menu_url,
        'scorecard_file_url': scorecard_url,
        'operating_hours': operating_hours,
        'services': services_list,
        'scrape_status': 'pending',
        'ai_processing_status': 'pending',
        'interaction_limit': 25,
        'interaction_count': 0,
        'demo_status': 'active',
        'creator_email': email
    }

    demo = supabase.table('demo_courses').insert(demo_course).execute()
    demo_id = demo.data[0]['id']

    # Create demo lead record
    demo_lead = {
        'demo_course_id': demo_id,
        'email': email,
        'company_name': name,
        'lead_status': 'new',
        'lead_score': 10  # Base score for creating demo
    }
    supabase.table('demo_leads').insert(demo_lead).execute()

    # Schedule background jobs
    if website_url:
        schedule_website_scraping(demo_id, website_url)

    if menu_url or scorecard_url:
        schedule_ai_processing(demo_id, menu_url, scorecard_url)

    # Return response
    return DemoCreateResponse(
        demo_slug=demo_slug,
        demo_url=f"https://proshop247.com/demo/{demo_slug}",
        name=name,
        status='active',
        interaction_limit=25,
        interaction_count=0,
        scrape_status='pending',
        ai_processing_status='pending',
        created_at=datetime.utcnow()
    )

async def upload_demo_file(
    file: UploadFile,
    demo_slug: str,
    file_type: str
) -> str:
    """
    Upload file to Supabase Storage.

    Returns: Public URL
    """
    # Validate file type
    allowed_types = {
        'logo': ['image/png', 'image/jpeg'],
        'menu': ['application/pdf', 'image/png', 'image/jpeg'],
        'scorecard': ['application/pdf', 'image/png', 'image/jpeg']
    }

    if file.content_type not in allowed_types[file_type]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type for {file_type}. Allowed: {allowed_types[file_type]}"
        )

    # Validate file size (5MB limit)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 5MB.")

    # Upload to Supabase Storage
    file_path = f"demo-assets/{demo_slug}/{file_type}_{file.filename}"
    supabase.storage.from_('demo-assets').upload(file_path, contents)

    # Get public URL
    public_url = supabase.storage.from_('demo-assets').get_public_url(file_path)

    return public_url
```

**Error Responses**:

```json
// Invalid file type
{
  "detail": "Invalid file type for logo. Allowed: ['image/png', 'image/jpeg']",
  "status_code": 400
}

// File too large
{
  "detail": "File too large. Max 5MB.",
  "status_code": 400
}

// Rate limit exceeded
{
  "detail": "Rate limit exceeded. Try again in 60 minutes.",
  "status_code": 429
}
```

---

### GET /v1/demo/{slug}

**Purpose**: Get demo course details

**Authentication**: None (public)

**Rate Limiting**: No limit

**Request**: None

**Response**:
```json
{
  "demo_slug": "abc123xyz",
  "name": "Sunset Golf Club",
  "location": "Phoenix, AZ",
  "website_url": "https://sunsetgolf.com",
  "phone_number": "602-555-1234",
  "logo_url": "https://storage.supabase.co/...",
  "operating_hours": "7am-7pm daily",
  "services": ["restaurant", "events"],
  "scraped_data": {
    "hours": "7am-7pm",
    "pricing": "Weekday $30, Weekend $50"
  },
  "menu_data": {
    "appetizers": [
      {"name": "Wings", "price": 12.99}
    ]
  },
  "interaction_limit": 25,
  "interaction_count": 5,
  "demo_status": "active",
  "created_at": "2024-10-28T10:30:00Z"
}
```

**Implementation**:

```python
@app.get("/v1/demo/{slug}")
async def get_demo(slug: str):
    """
    Get demo course details by slug.
    """

    demo = supabase.table('demo_courses') \
        .select('*') \
        .eq('demo_slug', slug) \
        .execute()

    if not demo.data:
        raise HTTPException(status_code=404, detail="Demo not found")

    return demo.data[0]
```

---

### POST /v1/demo/{slug}/interact

**Purpose**: Record demo interaction (used internally by chat/voice endpoints)

**Authentication**: Internal only (API key)

**Request Body**:
```json
{
  "interaction_type": "text-chat",
  "user_message": "What are your hours?",
  "agent_response": "We're open 7am-7pm daily.",
  "user_ip": "192.168.1.1"
}
```

**Response**:
```json
{
  "interaction_id": "uuid-here",
  "interaction_count": 6,
  "interactions_remaining": 19,
  "demo_status": "active"
}
```

**Implementation**:

```python
@app.post("/v1/demo/{slug}/interact")
async def record_demo_interaction(
    slug: str,
    interaction_type: str,
    user_message: str,
    agent_response: str,
    user_ip: str,
    api_key: str = Header(None)
):
    """
    Record demo interaction (internal use only).
    """

    # Validate API key
    if api_key != os.getenv("INTERNAL_API_KEY"):
        raise HTTPException(status_code=403, detail="Forbidden")

    # Get demo
    demo = get_demo_course(slug)
    if not demo:
        raise HTTPException(status_code=404, detail="Demo not found")

    # Check limit
    if demo['interaction_count'] >= demo['interaction_limit']:
        raise HTTPException(status_code=429, detail="Demo limit reached")

    # Record interaction
    interaction = {
        'demo_course_id': demo['id'],
        'interaction_type': interaction_type,
        'user_message': user_message,
        'agent_response': agent_response,
        'user_ip': user_ip,
        'intent': detect_conversation_intent(user_message)
    }

    result = supabase.table('demo_interactions').insert(interaction).execute()

    # Get updated demo status (trigger auto-updates interaction_count)
    updated_demo = get_demo_course(slug)

    return {
        'interaction_id': result.data[0]['id'],
        'interaction_count': updated_demo['interaction_count'],
        'interactions_remaining': updated_demo['interaction_limit'] - updated_demo['interaction_count'],
        'demo_status': updated_demo['demo_status']
    }
```

---

### GET /v1/demo/{slug}/status

**Purpose**: Check demo interaction limit status

**Authentication**: None (public)

**Response**:
```json
{
  "demo_status": "active",
  "interaction_count": 5,
  "interaction_limit": 25,
  "interactions_remaining": 20,
  "limit_reached": false
}
```

**Implementation**:

```python
@app.get("/v1/demo/{slug}/status")
async def get_demo_status(slug: str):
    """
    Get demo interaction limit status.
    """

    demo = get_demo_course(slug)
    if not demo:
        raise HTTPException(status_code=404, detail="Demo not found")

    return {
        'demo_status': demo['demo_status'],
        'interaction_count': demo['interaction_count'],
        'interaction_limit': demo['interaction_limit'],
        'interactions_remaining': demo['interaction_limit'] - demo['interaction_count'],
        'limit_reached': demo['demo_status'] == 'limit-reached'
    }
```

---

## 4. Health & Monitoring

### GET /v1/health

**Purpose**: Health check endpoint (uptime monitoring)

**Authentication**: None

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-10-28T10:30:00Z",
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

**Implementation**:

```python
@app.get("/v1/health")
async def health_check():
    """
    Health check endpoint.
    Tests connectivity to all critical services.
    """

    services = {}

    # Test database
    try:
        supabase.table('golf_courses').select('id').limit(1).execute()
        services['database'] = 'connected'
    except:
        services['database'] = 'error'

    # Test Twilio (check account status)
    try:
        twilio_client.api.accounts(os.getenv("TWILIO_ACCOUNT_SID")).fetch()
        services['twilio'] = 'connected'
    except:
        services['twilio'] = 'error'

    # Test Claude API
    try:
        anthropic_client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=10,
            messages=[{"role": "user", "content": "Test"}]
        )
        services['claude_api'] = 'connected'
    except:
        services['claude_api'] = 'error'

    # Test ElevenLabs
    try:
        elevenlabs_client.voices.get_all()
        services['elevenlabs'] = 'connected'
    except:
        services['elevenlabs'] = 'error'

    # Test Deepgram
    try:
        deepgram_client.keys.list()
        services['deepgram'] = 'connected'
    except:
        services['deepgram'] = 'error'

    # Overall status
    all_healthy = all(status == 'connected' for status in services.values())

    return {
        'status': 'healthy' if all_healthy else 'degraded',
        'timestamp': datetime.utcnow(),
        'version': '1.0.0',
        'services': services
    }
```

---

## Error Handling Patterns

### Standard Error Response

```json
{
  "detail": "Error message here",
  "status_code": 400,
  "error_code": "INVALID_REQUEST",
  "timestamp": "2024-10-28T10:30:00Z"
}
```

### Custom Exception Handler

```python
from fastapi import HTTPException
from fastapi.responses import JSONResponse

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Custom HTTP exception handler.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "status_code": exc.status_code,
            "error_code": get_error_code(exc.status_code),
            "timestamp": datetime.utcnow().isoformat()
        }
    )

def get_error_code(status_code: int) -> str:
    """Map HTTP status codes to error codes"""
    codes = {
        400: "INVALID_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        429: "RATE_LIMIT_EXCEEDED",
        500: "INTERNAL_SERVER_ERROR"
    }
    return codes.get(status_code, "UNKNOWN_ERROR")

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """
    Catch-all exception handler.
    """
    # Log error
    logger.error(f"Unhandled exception: {exc}", exc_info=True)

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "status_code": 500,
            "error_code": "INTERNAL_SERVER_ERROR",
            "timestamp": datetime.utcnow().isoformat()
        }
    )
```

---

## CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://proshop247.com",
        "https://www.proshop247.com",
        "https://lovable.app",  # Lovable preview
        "http://localhost:3000"  # Local development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"]
)
```

---

## Rate Limiting Configuration

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Rate limits by endpoint type
RATE_LIMITS = {
    'chat': "100/minute",
    'demo_create': "5/hour",
    'demo_read': "1000/hour",
    'webhook': None  # No limit (Twilio only)
}
```

---

## Request/Response Logging

```python
import logging
from fastapi import Request
import time

logger = logging.getLogger("uvicorn")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Log all requests and responses.
    """
    # Generate request ID
    request_id = str(uuid.uuid4())

    # Log request
    logger.info(
        f"[{request_id}] {request.method} {request.url.path} "
        f"from {request.client.host}"
    )

    # Time request
    start_time = time.time()

    # Process request
    response = await call_next(request)

    # Calculate duration
    duration = time.time() - start_time

    # Log response
    logger.info(
        f"[{request_id}] {response.status_code} "
        f"completed in {duration:.3f}s"
    )

    # Add request ID to response headers
    response.headers["X-Request-ID"] = request_id

    return response
```

---

## Authentication Middleware (V2)

```python
from fastapi import Header, HTTPException

async def verify_api_key(x_api_key: str = Header(None)):
    """
    Verify API key for protected endpoints (V2).
    """
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API key required")

    # Query database for valid API key
    api_key = supabase.table('api_keys') \
        .select('*') \
        .eq('key', x_api_key) \
        .eq('active', True) \
        .execute()

    if not api_key.data:
        raise HTTPException(status_code=403, detail="Invalid API key")

    return api_key.data[0]

# Usage
@app.get("/v1/protected-endpoint")
async def protected_endpoint(api_key = Depends(verify_api_key)):
    return {"message": "Access granted"}
```

---

## API Documentation (Auto-Generated)

FastAPI automatically generates OpenAPI docs:

**Swagger UI**: `https://api.proshop247.com/docs`

**ReDoc**: `https://api.proshop247.com/redoc`

**OpenAPI JSON**: `https://api.proshop247.com/openapi.json`

**Customize Docs**:

```python
app = FastAPI(
    title="ProShop 24/7 API",
    description="AI-powered voice agent for golf courses",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)
```

---

## Complete FastAPI App Structure

```
backend/
├── main.py                 # FastAPI app entry point
├── requirements.txt        # Dependencies
├── .env                    # Environment variables
├── .env.example           # Template
├── api/
│   ├── __init__.py
│   ├── webhooks.py        # Twilio webhooks
│   ├── chat.py            # Text chat endpoints
│   ├── demo.py            # Demo system endpoints
│   ├── health.py          # Health check
│   └── middleware.py      # CORS, rate limiting, logging
├── services/
│   ├── __init__.py
│   ├── memory.py          # Memory system functions
│   ├── agent.py           # LangChain agent
│   ├── voice.py           # Voice pipeline
│   ├── scraper.py         # Website scraping
│   ├── ai_processor.py    # File AI processing
│   └── embeddings.py      # Embedding generation
├── models/
│   ├── __init__.py
│   ├── schemas.py         # Pydantic models
│   └── database.py        # Database models
├── utils/
│   ├── __init__.py
│   ├── validators.py      # Input validation
│   └── helpers.py         # Helper functions
└── tests/
    ├── test_webhooks.py
    ├── test_chat.py
    ├── test_demo.py
    └── test_memory.py
```

---

## Next Steps

After this document is approved:
1. Create DEMO_GENERATOR_SPEC.md (detailed custom demo creation flow)
2. Create VOICE_PIPELINE.md (Twilio → Deepgram → Agent → ElevenLabs)
3. Create LANGCHAIN_AGENT.md (agent configuration, conversation chains)
4. Create LOVABLE_FRONTEND.md (landing page, demo UI, onboarding modal)

---

**Document Status**: Draft v1.0
**Last Updated**: 2025-10-28
**Next Review**: After approval and before DEMO_GENERATOR_SPEC.md creation
