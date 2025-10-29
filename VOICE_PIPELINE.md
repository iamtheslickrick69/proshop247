# ProShop 24/7 - Voice Pipeline Specification

## Document Overview

This document details the real-time voice pipeline - the most technically complex component of ProShop 24/7. The pipeline enables natural, low-latency voice conversations by orchestrating Twilio (phone system), Deepgram (speech-to-text), Claude (AI agent), and ElevenLabs (text-to-speech) in real-time bidirectional streaming.

**Target Performance**: <3 seconds from caller stops speaking → agent starts responding

---

## Voice Pipeline Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CALLER (Customer Phone)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │ Audio (μ-law, 8kHz)
                             ▼
                    ┌─────────────────┐
                    │     TWILIO      │
                    │  Phone System   │
                    │                 │
                    │  - Receives call│
                    │  - Streams audio│
                    │  - Returns audio│
                    └────────┬────────┘
                             │ WebSocket (Media Stream)
                             ▼
                    ┌─────────────────┐
                    │  FASTAPI BACKEND│
                    │  /media-stream  │
                    │                 │
                    │  Orchestrates:  │
                    │  - Audio routing│
                    │  - State mgmt   │
                    │  - Conversation │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
    ┌──────────────┐  ┌──────────┐  ┌──────────────┐
    │  DEEPGRAM    │  │  CLAUDE  │  │  ELEVENLABS  │
    │   (STT)      │  │  AGENT   │  │    (TTS)     │
    │              │  │          │  │              │
    │ Audio → Text │  │ Text→Text│  │ Text → Audio │
    └──────────────┘  └──────────┘  └──────────────┘
           │                │                │
           │ Transcription  │ Response       │ Audio
           └────────────────┴────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  CONVERSATION   │
                    │    STORAGE      │
                    │  (Supabase)     │
                    └─────────────────┘
```

### Detailed Flow (Step-by-Step)

```
1. CALL INITIATION
   - Customer dials golf course number
   - Twilio receives call → POST /webhook/voice
   - FastAPI returns TwiML with <Stream> directive
   - Twilio establishes WebSocket to /media-stream

2. AUDIO STREAMING STARTS (Bidirectional)
   ┌─ INBOUND (Caller → Agent)
   │  - Twilio sends audio chunks (μ-law, 8kHz, base64)
   │  - FastAPI decodes → PCM (16kHz, mono)
   │  - Forward to Deepgram WebSocket
   │  - Deepgram returns transcript (streaming)
   │  - When sentence complete (detected by endpointing):
   │    → Send to Claude agent
   │    → Claude generates response
   │    → Send response to ElevenLabs
   │
   └─ OUTBOUND (Agent → Caller)
      - ElevenLabs streams audio chunks (MP3/PCM)
      - FastAPI converts to μ-law, 8kHz
      - Encode to base64
      - Send to Twilio WebSocket
      - Twilio plays audio to caller

3. CONVERSATION LOOP
   - Caller speaks → STT → Agent → TTS → Audio → Caller hears
   - Repeat until call ends

4. CALL TERMINATION
   - Caller hangs up or agent ends call
   - Twilio sends stop event
   - FastAPI closes all WebSocket connections
   - Store complete conversation in database
   - Generate embeddings (background job)
```

---

## Component 1: Twilio Media Streams

### What are Twilio Media Streams?

Twilio Media Streams provide **real-time audio streaming** via WebSocket during active phone calls. This enables custom processing (STT, AI, TTS) instead of just playing pre-recorded audio.

**Key Features**:
- Bidirectional (send and receive audio)
- WebSocket-based (wss://)
- μ-law encoded audio (8kHz, G.711)
- 20ms audio chunks (160 samples per chunk)
- Base64 encoded payloads

### TwiML Configuration

When call starts, return TwiML with `<Stream>` directive:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">
        Thanks for calling Fox Hollow Golf Course!
    </Say>
    <Connect>
        <Stream url="wss://api.proshop247.com/v1/media-stream">
            <Parameter name="call_sid" value="CA1234567890abcdef" />
            <Parameter name="caller_number" value="+15551234567" />
        </Stream>
    </Connect>
</Response>
```

**Parameters**:
- `url`: WebSocket endpoint for audio streaming
- `<Parameter>`: Custom metadata passed to WebSocket

### WebSocket Message Format

**From Twilio (Inbound Audio)**:

```json
{
  "event": "media",
  "streamSid": "MZ1234567890abcdef",
  "media": {
    "track": "inbound",
    "chunk": "1",
    "timestamp": "1234567890",
    "payload": "base64EncodedAudioData..."
  }
}
```

**To Twilio (Outbound Audio)**:

```json
{
  "event": "media",
  "streamSid": "MZ1234567890abcdef",
  "media": {
    "payload": "base64EncodedAudioData..."
  }
}
```

**Other Events**:
- `start`: Stream started
- `stop`: Stream stopped
- `mark`: Marker event (for audio timing)

---

## Component 2: WebSocket Handler (FastAPI)

### Implementation: `/v1/media-stream`

```python
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict
import asyncio
import base64
import json

# Active call sessions
call_sessions: Dict[str, dict] = {}

@app.websocket("/v1/media-stream")
async def media_stream_handler(websocket: WebSocket):
    """
    WebSocket handler for Twilio Media Streams.

    Orchestrates bidirectional audio streaming:
    - Receive audio from Twilio → Deepgram STT
    - Receive text from Claude → ElevenLabs TTS → Twilio
    """

    await websocket.accept()

    # Initialize session state
    stream_sid = None
    call_sid = None
    caller_number = None
    deepgram_ws = None
    agent = None

    try:
        async for message in websocket.iter_text():
            data = json.loads(message)
            event = data.get('event')

            # START EVENT: Initialize session
            if event == 'start':
                stream_sid = data['streamSid']
                call_sid = data['start']['callSid']

                # Extract custom parameters
                params = data['start'].get('customParameters', {})
                caller_number = params.get('caller_number')

                # Initialize call session
                session = await initialize_call_session(call_sid, caller_number)
                call_sessions[call_sid] = session

                # Initialize Deepgram WebSocket
                deepgram_ws = await initialize_deepgram_stream(call_sid)

                # Initialize agent with conversation history
                agent = await initialize_agent(session)

                # Start background task to handle agent responses
                asyncio.create_task(
                    handle_agent_responses(websocket, stream_sid, call_sid)
                )

            # MEDIA EVENT: Incoming audio from caller
            elif event == 'media':
                if data['media']['track'] == 'inbound':
                    # Decode base64 audio
                    audio_payload = data['media']['payload']

                    # Convert μ-law to PCM (required for Deepgram)
                    pcm_audio = mulaw_to_pcm(base64.b64decode(audio_payload))

                    # Send to Deepgram for transcription
                    if deepgram_ws:
                        await deepgram_ws.send(pcm_audio)

            # STOP EVENT: Call ended
            elif event == 'stop':
                # Close Deepgram connection
                if deepgram_ws:
                    await deepgram_ws.close()

                # Finalize conversation (store in DB)
                await finalize_conversation(call_sid)

                # Clean up session
                if call_sid in call_sessions:
                    del call_sessions[call_sid]

                break

    except WebSocketDisconnect:
        # Handle disconnection
        if deepgram_ws:
            await deepgram_ws.close()

        if call_sid in call_sessions:
            del call_sessions[call_sid]

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.close()
```

### Audio Format Conversion

**Twilio uses μ-law (G.711)**:
- Sample rate: 8kHz
- Encoding: μ-law (logarithmic compression)
- Chunk size: 160 samples (20ms)

**Deepgram requires PCM**:
- Sample rate: 16kHz (for best accuracy)
- Encoding: Linear PCM (16-bit)

**Conversion Function**:

```python
import audioop
import numpy as np

def mulaw_to_pcm(mulaw_data: bytes) -> bytes:
    """
    Convert μ-law audio (8kHz) to PCM (16kHz).

    Steps:
    1. Decode μ-law to 16-bit PCM (8kHz)
    2. Resample 8kHz → 16kHz
    """

    # Decode μ-law to PCM (still 8kHz)
    pcm_8khz = audioop.ulaw2lin(mulaw_data, 2)  # 2 = 16-bit

    # Resample 8kHz → 16kHz (required for Deepgram)
    pcm_16khz = audioop.ratecv(
        pcm_8khz,
        2,      # Sample width (16-bit)
        1,      # Channels (mono)
        8000,   # Input rate (8kHz)
        16000,  # Output rate (16kHz)
        None    # State (None for first call)
    )[0]

    return pcm_16khz

def pcm_to_mulaw(pcm_data: bytes) -> bytes:
    """
    Convert PCM audio (16kHz) to μ-law (8kHz) for Twilio.

    Steps:
    1. Resample 16kHz → 8kHz
    2. Encode to μ-law
    """

    # Resample 16kHz → 8kHz
    pcm_8khz = audioop.ratecv(
        pcm_data,
        2,      # Sample width (16-bit)
        1,      # Channels (mono)
        16000,  # Input rate (16kHz)
        8000,   # Output rate (8kHz)
        None
    )[0]

    # Encode to μ-law
    mulaw_data = audioop.lin2ulaw(pcm_8khz, 2)

    return mulaw_data
```

---

## Component 3: Deepgram Integration (STT)

### Deepgram WebSocket Connection

```python
from deepgram import DeepgramClient, LiveTranscriptionEvents, LiveOptions
import asyncio

async def initialize_deepgram_stream(call_sid: str):
    """
    Initialize Deepgram WebSocket for real-time transcription.

    Returns:
        Deepgram WebSocket connection
    """

    deepgram = DeepgramClient(os.getenv("DEEPGRAM_API_KEY"))

    # Configure transcription options
    options = LiveOptions(
        model="nova-2",
        language="en-US",
        smart_format=True,
        interim_results=True,
        endpointing=300,  # ms of silence before finalizing
        punctuate=True,
        utterance_end_ms=1000  # End utterance after 1 second silence
    )

    # Create WebSocket connection
    dg_connection = deepgram.listen.websocket.v("1")

    # Event handlers
    def on_message(self, result, **kwargs):
        """Handle transcription results"""
        sentence = result.channel.alternatives[0].transcript

        if len(sentence) == 0:
            return

        # Check if final result (not interim)
        if result.is_final:
            # Store transcript in session
            call_sessions[call_sid]['transcript_buffer'].append(sentence)

            # Check if utterance is complete (detected by endpointing)
            if result.speech_final:
                # Complete sentence - send to agent
                full_utterance = ' '.join(call_sessions[call_sid]['transcript_buffer'])
                call_sessions[call_sid]['transcript_buffer'] = []

                # Queue for agent processing
                call_sessions[call_sid]['agent_queue'].put_nowait(full_utterance)

    def on_error(self, error, **kwargs):
        """Handle errors"""
        logger.error(f"Deepgram error: {error}")

    # Register event handlers
    dg_connection.on(LiveTranscriptionEvents.Transcript, on_message)
    dg_connection.on(LiveTranscriptionEvents.Error, on_error)

    # Start connection
    if not await dg_connection.start(options):
        raise Exception("Failed to start Deepgram connection")

    return dg_connection
```

### Deepgram Configuration Explained

**Key Parameters**:

- `model="nova-2"`: Latest, most accurate model
- `interim_results=True`: Get partial transcripts (useful for UI, not used in MVP)
- `endpointing=300`: Finalize transcript after 300ms silence
- `utterance_end_ms=1000`: End utterance after 1 second silence
- `punctuate=True`: Add punctuation automatically
- `smart_format=True`: Format numbers, dates properly

**Endpointing Strategy**:
- **Short pause (300ms)**: Finalize current word/phrase
- **Long pause (1000ms)**: Utterance complete → send to agent

This creates natural conversation flow:
```
Caller: "I'd like to book a tee time"
        [300ms pause - word finalized]
        "for Saturday morning"
        [1000ms pause - UTTERANCE COMPLETE → Send to agent]
```

---

## Component 4: Agent Processing Loop

### Background Task: `handle_agent_responses()`

```python
import asyncio
from asyncio import Queue

async def initialize_call_session(call_sid: str, caller_number: str) -> dict:
    """
    Initialize call session with state management.

    Returns:
        Session dict with queues, buffers, agent, etc.
    """

    # Identify caller (auto-create if first time)
    caller = identify_or_create_caller(caller_number, golf_course_id)

    # Retrieve last 3 conversations
    conversation_history = retrieve_last_3_conversations(caller['id'], golf_course_id)

    # Build agent
    agent = build_agent(golf_course, caller, conversation_history)

    # Initialize session
    session = {
        'call_sid': call_sid,
        'caller_id': caller['id'],
        'golf_course_id': golf_course_id,
        'agent': agent,
        'transcript_buffer': [],  # Buffer for building complete utterances
        'agent_queue': Queue(),   # Queue for agent processing
        'full_transcript': [],    # Full conversation transcript
        'started_at': datetime.utcnow()
    }

    return session

async def handle_agent_responses(
    websocket: WebSocket,
    stream_sid: str,
    call_sid: str
):
    """
    Background task: Process agent queue and generate responses.

    Runs continuously during call, processing caller utterances.
    """

    session = call_sessions[call_sid]
    agent = session['agent']
    agent_queue = session['agent_queue']

    while True:
        try:
            # Wait for next caller utterance (from Deepgram)
            user_message = await asyncio.wait_for(
                agent_queue.get(),
                timeout=60.0  # Timeout after 60 seconds of silence
            )

            # Log user message
            logger.info(f"[{call_sid}] User: {user_message}")
            session['full_transcript'].append(f"Customer: {user_message}")

            # Get agent response (LangChain)
            agent_response = agent.run(user_message)

            # Log agent response
            logger.info(f"[{call_sid}] Agent: {agent_response}")
            session['full_transcript'].append(f"Agent: {agent_response}")

            # Convert text to speech (ElevenLabs)
            audio_stream = await text_to_speech(agent_response)

            # Stream audio back to Twilio
            await stream_audio_to_twilio(websocket, stream_sid, audio_stream)

        except asyncio.TimeoutError:
            # No message in 60 seconds - assume call is idle
            logger.warning(f"[{call_sid}] No activity for 60s")
            break

        except Exception as e:
            logger.error(f"[{call_sid}] Agent processing error: {e}")
            # Send error response to caller
            error_response = "I'm sorry, I'm having trouble understanding. Can you repeat that?"
            audio_stream = await text_to_speech(error_response)
            await stream_audio_to_twilio(websocket, stream_sid, audio_stream)
```

---

## Component 5: ElevenLabs Integration (TTS)

### Text-to-Speech Streaming

```python
from elevenlabs import generate, stream, Voice
import asyncio

async def text_to_speech(text: str) -> bytes:
    """
    Convert text to speech using ElevenLabs.

    Returns:
        Audio data (MP3 or PCM)
    """

    try:
        # Generate audio stream
        audio_stream = generate(
            text=text,
            voice=Voice(
                voice_id=os.getenv("ELEVENLABS_VOICE_ID"),  # Fox Hollow voice
                settings={
                    "stability": 0.7,
                    "similarity_boost": 0.8,
                    "style": 0.5,
                    "use_speaker_boost": True
                }
            ),
            model="eleven_turbo_v2",  # Fastest model
            stream=True  # Stream audio chunks
        )

        # Collect audio chunks
        audio_chunks = []
        for chunk in audio_stream:
            if chunk:
                audio_chunks.append(chunk)

        # Combine chunks
        full_audio = b''.join(audio_chunks)

        return full_audio

    except Exception as e:
        logger.error(f"ElevenLabs TTS error: {e}")
        # Fallback: Return silent audio or error message
        raise

async def stream_audio_to_twilio(
    websocket: WebSocket,
    stream_sid: str,
    audio_data: bytes
):
    """
    Stream audio to Twilio WebSocket in chunks.

    Steps:
    1. Convert MP3/PCM to μ-law 8kHz
    2. Split into 20ms chunks (160 samples)
    3. Base64 encode
    4. Send to Twilio WebSocket
    """

    # ElevenLabs returns MP3 - convert to PCM first
    # (Note: elevenlabs SDK can also return raw PCM if configured)
    import io
    from pydub import AudioSegment

    # Load MP3
    audio = AudioSegment.from_mp3(io.BytesIO(audio_data))

    # Convert to 16kHz mono PCM
    audio = audio.set_frame_rate(16000).set_channels(1)
    pcm_16khz = audio.raw_data

    # Convert to μ-law 8kHz
    mulaw_8khz = pcm_to_mulaw(pcm_16khz)

    # Split into 20ms chunks (160 bytes for μ-law 8kHz)
    chunk_size = 160
    chunks = [mulaw_8khz[i:i+chunk_size] for i in range(0, len(mulaw_8khz), chunk_size)]

    # Send chunks to Twilio
    for chunk in chunks:
        # Base64 encode
        payload = base64.b64encode(chunk).decode('utf-8')

        # Send media message
        message = {
            "event": "media",
            "streamSid": stream_sid,
            "media": {
                "payload": payload
            }
        }

        await websocket.send_text(json.dumps(message))

        # Small delay to maintain timing (20ms per chunk)
        await asyncio.sleep(0.02)
```

---

## Component 6: Conversation Storage

### Function: `finalize_conversation()`

```python
async def finalize_conversation(call_sid: str):
    """
    Store conversation in database after call ends.

    Steps:
    1. Retrieve session data
    2. Build full transcript
    3. Store conversation in database
    4. Schedule embedding generation
    5. Clean up session
    """

    session = call_sessions.get(call_sid)
    if not session:
        logger.warning(f"No session found for call {call_sid}")
        return

    # Build full transcript
    full_transcript = '\n'.join(session['full_transcript'])

    # Calculate call duration
    duration = (datetime.utcnow() - session['started_at']).total_seconds()

    # Store conversation
    conversation_id = store_conversation(
        caller_id=session['caller_id'],
        golf_course_id=session['golf_course_id'],
        channel='voice',
        transcript=full_transcript,
        metadata={
            'twilio_call_sid': call_sid,
            'call_duration_seconds': int(duration),
            'started_at': session['started_at'].isoformat(),
            'ended_at': datetime.utcnow().isoformat()
        }
    )

    # Schedule embedding generation (async)
    schedule_embedding_generation(conversation_id, full_transcript)

    logger.info(f"Conversation stored: {conversation_id}")
```

---

## Performance Optimization

### Target Latency Breakdown

**Total Target: <3 seconds from caller stops speaking → agent starts responding**

| Component | Target | Optimization Strategy |
|-----------|--------|----------------------|
| Deepgram STT | <300ms | Use `nova-2` model, endpointing=300ms |
| Agent (Claude) | <2000ms | Cache system prompts, limit context, streaming |
| ElevenLabs TTS | <500ms | Use `eleven_turbo_v2`, streaming |
| Network latency | <200ms | WebSocket (low overhead), buffer management |
| **TOTAL** | **<3000ms** | **Achievable with optimizations** |

### Optimization Strategies

**1. Parallel Processing**
```python
# Instead of sequential:
# transcript = await deepgram(audio)  # 300ms
# response = await claude(transcript) # 2000ms
# audio = await elevenlabs(response)  # 500ms
# Total: 2800ms

# Use streaming and overlap:
# - Start TTS as soon as Claude generates first sentence
# - Stream audio to caller immediately
# Total perceived latency: ~1500ms (caller hears response sooner)
```

**2. Agent Caching**
```python
# Cache system prompt per golf course
# Avoid regenerating on every call
@lru_cache(maxsize=100)
def get_agent_system_prompt(golf_course_id: str) -> str:
    # Build once, reuse for all calls to this course
    return build_agent_system_prompt(golf_course)
```

**3. Connection Pooling**
- Keep Deepgram WebSocket alive between calls (if possible)
- Reuse HTTP connections to ElevenLabs
- Connection pool for Supabase queries

**4. Audio Buffering**
```python
# Buffer audio chunks for smoother playback
# Send chunks in batches instead of one-by-one
chunk_buffer = []
for chunk in audio_chunks:
    chunk_buffer.append(chunk)
    if len(chunk_buffer) >= 5:  # Send 5 chunks at once
        await send_chunks_batch(chunk_buffer)
        chunk_buffer = []
```

---

## Error Handling & Recovery

### Common Failure Modes

**1. Deepgram Disconnection**
```python
# If Deepgram WebSocket drops:
# - Log error
# - Attempt reconnect (max 3 retries)
# - If fails: Fallback to "I'm having trouble hearing you" + hang up gracefully

async def reconnect_deepgram(call_sid: str, max_retries: int = 3):
    for attempt in range(max_retries):
        try:
            deepgram_ws = await initialize_deepgram_stream(call_sid)
            return deepgram_ws
        except Exception as e:
            logger.warning(f"Deepgram reconnect attempt {attempt+1} failed: {e}")
            await asyncio.sleep(1)

    # All retries failed
    logger.error(f"Deepgram reconnection failed after {max_retries} attempts")
    return None
```

**2. ElevenLabs API Error**
```python
# If ElevenLabs fails:
# - Log error
# - Fallback to simpler TTS (Twilio's built-in Say)
# - Continue conversation (degraded mode)

async def text_to_speech_with_fallback(text: str) -> bytes:
    try:
        return await text_to_speech(text)
    except Exception as e:
        logger.error(f"ElevenLabs failed: {e}, using fallback")
        # Fallback: Use Twilio's <Say> command (less natural but works)
        # Send command via WebSocket
        return None  # Signal to use fallback
```

**3. Agent (Claude) Timeout**
```python
# If Claude API times out:
# - Retry once (max 5 seconds wait)
# - If still fails: Fallback response
# - "I'm sorry, I didn't catch that. Could you repeat?"

async def get_agent_response_with_timeout(agent, user_message: str, timeout: float = 5.0):
    try:
        response = await asyncio.wait_for(
            agent.arun(user_message),
            timeout=timeout
        )
        return response
    except asyncio.TimeoutError:
        logger.warning("Agent timeout, using fallback response")
        return "I'm sorry, I didn't catch that. Could you repeat?"
```

**4. Network Issues (WebSocket Drop)**
```python
# If Twilio WebSocket drops:
# - Twilio automatically attempts reconnect
# - If reconnect fails: Call drops (expected behavior)
# - Store partial conversation up to that point

try:
    await websocket.send_text(message)
except Exception as e:
    logger.error(f"WebSocket send failed: {e}")
    # Store partial conversation
    await finalize_conversation(call_sid)
    raise
```

---

## Testing & Debugging

### Local Testing Setup

**1. ngrok for Twilio Webhooks**
```bash
# Expose local FastAPI to internet
ngrok http 8000

# Update Twilio webhook URL to ngrok URL
# https://abc123.ngrok.io/v1/webhook/voice
```

**2. Test Call Flow**
```python
# test_voice_pipeline.py

import asyncio
import websockets
import json
import base64

async def test_media_stream():
    """
    Test WebSocket media stream handler locally.
    """
    uri = "ws://localhost:8000/v1/media-stream"

    async with websockets.connect(uri) as websocket:
        # Send start event
        start_event = {
            "event": "start",
            "streamSid": "MZ_test_123",
            "start": {
                "callSid": "CA_test_123",
                "customParameters": {
                    "caller_number": "+15551234567"
                }
            }
        }
        await websocket.send(json.dumps(start_event))

        # Send fake audio (silence)
        silence = b'\xFF' * 160  # 160 bytes of μ-law silence
        payload = base64.b64encode(silence).decode('utf-8')

        media_event = {
            "event": "media",
            "streamSid": "MZ_test_123",
            "media": {
                "track": "inbound",
                "chunk": "1",
                "timestamp": "1234567890",
                "payload": payload
            }
        }

        # Send 50 chunks (1 second of audio)
        for i in range(50):
            await websocket.send(json.dumps(media_event))
            await asyncio.sleep(0.02)  # 20ms per chunk

        # Wait for response
        response = await websocket.recv()
        print(f"Response: {response}")

        # Send stop event
        stop_event = {
            "event": "stop",
            "streamSid": "MZ_test_123"
        }
        await websocket.send(json.dumps(stop_event))

asyncio.run(test_media_stream())
```

### Debugging Tools

**1. WebSocket Logging**
```python
# Log all WebSocket messages for debugging
import logging

logging.basicConfig(level=logging.DEBUG)

# In WebSocket handler:
@app.websocket("/v1/media-stream")
async def media_stream_handler(websocket: WebSocket):
    async for message in websocket.iter_text():
        logger.debug(f"Received: {message[:200]}...")  # Log first 200 chars
        # ... process message
```

**2. Audio Inspection**
```python
# Save audio chunks to file for inspection
def save_audio_chunk(audio_data: bytes, filename: str):
    with open(f"debug/{filename}.raw", 'wb') as f:
        f.write(audio_data)

# Listen to saved audio:
# ffplay -f mulaw -ar 8000 -ac 1 debug/chunk_001.raw
```

**3. Latency Tracking**
```python
# Track latency for each component
import time

class LatencyTracker:
    def __init__(self):
        self.timings = {}

    def start(self, component: str):
        self.timings[component] = time.time()

    def end(self, component: str):
        if component in self.timings:
            duration = time.time() - self.timings[component]
            logger.info(f"[LATENCY] {component}: {duration*1000:.0f}ms")
            return duration
        return 0

# Usage:
tracker = LatencyTracker()
tracker.start("deepgram")
transcript = await deepgram(audio)
tracker.end("deepgram")

tracker.start("agent")
response = await agent.run(transcript)
tracker.end("agent")
```

---

## Complete Code Example

### Full WebSocket Handler with All Components

```python
from fastapi import FastAPI, WebSocket
from typing import Dict
import asyncio
import json

app = FastAPI()
call_sessions: Dict[str, dict] = {}

@app.websocket("/v1/media-stream")
async def media_stream_handler(websocket: WebSocket):
    await websocket.accept()

    stream_sid = None
    call_sid = None
    deepgram_ws = None

    try:
        async for message in websocket.iter_text():
            data = json.loads(message)
            event = data.get('event')

            if event == 'start':
                stream_sid = data['streamSid']
                call_sid = data['start']['callSid']
                caller_number = data['start']['customParameters'].get('caller_number')

                # Initialize session
                session = await initialize_call_session(call_sid, caller_number)
                call_sessions[call_sid] = session

                # Initialize Deepgram
                deepgram_ws = await initialize_deepgram_stream(call_sid)

                # Start agent response handler
                asyncio.create_task(handle_agent_responses(websocket, stream_sid, call_sid))

            elif event == 'media' and data['media']['track'] == 'inbound':
                # Process audio
                audio_payload = data['media']['payload']
                pcm_audio = mulaw_to_pcm(base64.b64decode(audio_payload))

                # Send to Deepgram
                if deepgram_ws:
                    await deepgram_ws.send(pcm_audio)

            elif event == 'stop':
                # Finalize conversation
                if deepgram_ws:
                    await deepgram_ws.close()

                await finalize_conversation(call_sid)

                if call_sid in call_sessions:
                    del call_sessions[call_sid]

                break

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        if deepgram_ws:
            await deepgram_ws.close()

        await websocket.close()
```

---

## Next Steps

After this document is approved:
1. Create LANGCHAIN_AGENT.md (agent configuration, system prompts, conversation chains)
2. Create LOVABLE_FRONTEND.md (landing page design, dual-demo UI, onboarding modal)
3. Create DEPLOYMENT.md (Railway setup, environment variables, monitoring, production checklist)
4. Create BUILD_CHECKLIST.md (step-by-step build guide, testing checklist, launch checklist)

---

**Document Status**: Draft v1.0
**Last Updated**: 2025-10-28
**Next Review**: After approval and before LANGCHAIN_AGENT.md creation
