"""
Voice Pipeline Routes
WebSocket handler for Twilio Media Streams
Real-time bidirectional audio streaming
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Optional
import json
import asyncio
import base64
from datetime import datetime

from services.voice import (
    decode_audio_from_twilio,
    encode_audio_for_twilio,
    initialize_deepgram_stream,
    text_to_speech_for_twilio,
    stream_audio_to_twilio_websocket,
    mulaw_to_pcm
)
from services.agent import create_demo_agent, create_production_agent
from services.memory import (
    identify_or_create_caller,
    get_recent_conversations,
    store_conversation,
    build_context_string
)
from supabase import create_client
from config.settings import (
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    DEEPGRAM_API_KEY,
    ELEVENLABS_API_KEY,
    ELEVENLABS_VOICE_ID
)

router = APIRouter()

# Initialize Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Active call sessions
# Maps call_sid -> session data
active_calls: Dict[str, Dict] = {}


@router.websocket("/media-stream")
async def media_stream_handler(websocket: WebSocket):
    """
    Handle Twilio Media Stream WebSocket connection.

    Complete voice pipeline:
    1. Twilio → WebSocket (incoming audio)
    2. Audio → Deepgram STT (transcription)
    3. Transcription → Agent (response generation)
    4. Response → ElevenLabs TTS (audio generation)
    5. Audio → Twilio (outgoing to caller)
    """
    await websocket.accept()
    print("📞 WebSocket connection accepted")

    stream_sid = None
    call_sid = None
    deepgram_ws = None
    transcript_buffer = []

    try:
        async for message in websocket.iter_text():
            data = json.loads(message)
            event = data.get('event')

            if event == 'start':
                # ============================================================
                # CALL START - Initialize everything
                # ============================================================
                stream_sid = data['streamSid']
                call_sid = data['start']['callSid']
                from_number = data['start'].get('customParameters', {}).get('From', 'unknown')

                print(f"📞 Call started: {call_sid}")
                print(f"   From: {from_number}")
                print(f"   Stream: {stream_sid}")

                # Initialize caller identity and memory
                # For demo: Use Fox Hollow as default golf course
                golf_course_id = "demo-fox-hollow"

                try:
                    # Identify or create caller
                    caller = identify_or_create_caller(supabase, from_number, golf_course_id)

                    # Get conversation history
                    recent_conversations = get_recent_conversations(supabase, caller['id'], limit=3)
                    history_context = build_context_string(recent_conversations)

                    # Create agent with context
                    # For demo, we'll use a simplified golf course dict
                    demo_golf_course = {
                        'name': 'Fox Hollow Golf Course',
                        'location': 'Troy, Michigan',
                        'phone_number': '+12272334997'
                    }

                    agent = create_demo_agent(demo_golf_course)

                    print(f"✅ Agent initialized for caller {caller['id']}")

                except Exception as e:
                    print(f"⚠️ Error initializing caller/agent: {e}")
                    # Create fallback agent
                    demo_golf_course = {
                        'name': 'Fox Hollow Golf Course',
                        'location': 'Troy, Michigan'
                    }
                    agent = create_demo_agent(demo_golf_course)
                    caller = {'id': 'demo-caller', 'phone_number': from_number}

                # Initialize call session
                active_calls[call_sid] = {
                    'stream_sid': stream_sid,
                    'from_number': from_number,
                    'caller': caller,
                    'golf_course_id': golf_course_id,
                    'start_time': datetime.now(),
                    'transcript': [],
                    'agent': agent,
                    'transcript_buffer': [],
                    'is_processing': False  # Prevent overlapping agent responses
                }

                # Define transcript callback for Deepgram
                def on_transcript(transcript: str, is_final: bool):
                    """Handle transcripts from Deepgram"""
                    if is_final and transcript.strip():
                        # Queue for agent processing
                        active_calls[call_sid]['transcript_buffer'].append(transcript)

                        # Process immediately
                        asyncio.create_task(
                            process_agent_response(websocket, stream_sid, call_sid, transcript)
                        )

                # Initialize Deepgram WebSocket
                try:
                    deepgram_ws = await initialize_deepgram_stream(call_sid, on_transcript)
                    print(f"✅ Deepgram initialized for {call_sid}")
                except Exception as e:
                    print(f"❌ Failed to initialize Deepgram: {e}")
                    # Continue without STT (will fail but connection stays open)

                # Send welcome message
                try:
                    welcome_text = "Thank you for calling Fox Hollow Golf Course. How can I help you today?"
                    await send_agent_response(websocket, stream_sid, call_sid, welcome_text)
                except Exception as e:
                    print(f"⚠️ Error sending welcome message: {e}")

            elif event == 'media':
                # ============================================================
                # INCOMING AUDIO - Forward to Deepgram
                # ============================================================
                if call_sid not in active_calls:
                    continue

                if data['media'].get('track') == 'inbound':
                    payload = data['media']['payload']

                    # Decode base64 μ-law audio from Twilio
                    mulaw_data = base64.b64decode(payload)

                    # Convert μ-law (8kHz) to PCM (16kHz) for Deepgram
                    pcm_audio = mulaw_to_pcm(mulaw_data)

                    # Send to Deepgram for transcription
                    if deepgram_ws:
                        try:
                            await deepgram_ws.send(pcm_audio)
                        except Exception as e:
                            print(f"⚠️ Error sending audio to Deepgram: {e}")

            elif event == 'stop':
                # ============================================================
                # CALL END - Store conversation and cleanup
                # ============================================================
                print(f"📞 Call ended: {call_sid}")

                if call_sid in active_calls:
                    session = active_calls[call_sid]

                    # Build full transcript
                    transcript_text = "\n".join(session['transcript'])

                    # Calculate duration
                    duration = int((datetime.now() - session['start_time']).total_seconds())

                    # Store conversation in database
                    try:
                        store_conversation(
                            supabase=supabase,
                            caller_id=session['caller']['id'],
                            golf_course_id=session['golf_course_id'],
                            transcript=transcript_text,
                            channel='voice',
                            duration_seconds=duration
                        )
                        print(f"✅ Conversation stored for {call_sid}")
                    except Exception as e:
                        print(f"⚠️ Error storing conversation: {e}")
                        print(f"📝 Call transcript:\n{transcript_text}")

                    # Close Deepgram connection
                    if deepgram_ws:
                        try:
                            await deepgram_ws.finish()
                        except:
                            pass

                    # Cleanup session
                    del active_calls[call_sid]

            elif event == 'mark':
                # Twilio confirmation marker (can ignore)
                pass

    except WebSocketDisconnect:
        print(f"📞 WebSocket disconnected: {call_sid}")
        if deepgram_ws:
            try:
                await deepgram_ws.finish()
            except:
                pass
        if call_sid and call_sid in active_calls:
            del active_calls[call_sid]

    except Exception as e:
        print(f"❌ Error in media stream: {e}")
        import traceback
        traceback.print_exc()


async def process_agent_response(
    websocket: WebSocket,
    stream_sid: str,
    call_sid: str,
    user_message: str
):
    """
    Process user message through agent and send response.

    Args:
        websocket: Twilio WebSocket connection
        stream_sid: Twilio stream ID
        call_sid: Call session ID
        user_message: Transcribed user message
    """
    if call_sid not in active_calls:
        return

    session = active_calls[call_sid]

    # Prevent overlapping responses
    if session.get('is_processing', False):
        print(f"⚠️ Already processing a response, queuing: {user_message[:50]}")
        return

    session['is_processing'] = True

    try:
        print(f"👤 [{call_sid}] User: {user_message}")
        session['transcript'].append(f"Customer: {user_message}")

        # Get agent response
        agent = session['agent']
        agent_response = agent.run(user_message)

        print(f"🤖 [{call_sid}] Agent: {agent_response}")
        session['transcript'].append(f"Agent: {agent_response}")

        # Send response to caller
        await send_agent_response(websocket, stream_sid, call_sid, agent_response)

    except Exception as e:
        print(f"❌ Error processing agent response: {e}")
        import traceback
        traceback.print_exc()

        # Send fallback response
        try:
            fallback = "I'm sorry, I didn't catch that. Could you please repeat?"
            await send_agent_response(websocket, stream_sid, call_sid, fallback)
        except:
            pass

    finally:
        session['is_processing'] = False


async def send_agent_response(
    websocket: WebSocket,
    stream_sid: str,
    call_sid: str,
    text: str
):
    """
    Convert text to speech and send to caller.

    Args:
        websocket: Twilio WebSocket connection
        stream_sid: Twilio stream ID
        call_sid: Call session ID
        text: Text to speak
    """
    try:
        print(f"🔊 [{call_sid}] Sending TTS: {text[:50]}...")

        # Convert text to speech (returns μ-law audio for Twilio)
        audio_mulaw = await text_to_speech_for_twilio(text)

        # Stream audio to Twilio
        await stream_audio_to_twilio_websocket(websocket, stream_sid, audio_mulaw)

        print(f"✅ [{call_sid}] TTS sent successfully")

    except Exception as e:
        print(f"❌ Error sending TTS: {e}")
        import traceback
        traceback.print_exc()




# TwiML endpoint to start Media Stream
@router.post("/voice/incoming")
async def handle_incoming_call(
    request: Dict = None,
    CallSid: str = "",
    From: str = "",
    To: str = ""
):
    """
    TwiML endpoint for incoming calls.
    Returns TwiML to start Media Stream.

    Note: Set base_url to your ngrok URL for local testing,
    or your production URL when deployed.
    """
    from fastapi.responses import Response
    import os

    # Get base URL from environment or use default
    # For ngrok: export BASE_URL="wss://abc123.ngrok.io"
    # For Railway: export BASE_URL="wss://your-app.up.railway.app"
    base_url = os.getenv("BASE_URL", "wss://localhost:8000")

    # Log incoming call
    print(f"📞 Incoming call from {From} to {To} (CallSid: {CallSid})")

    # Build TwiML with Media Stream
    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="{base_url}/v1/media-stream">
            <Parameter name="From" value="{From}" />
            <Parameter name="To" value="{To}" />
        </Stream>
    </Connect>
</Response>"""

    return Response(content=twiml, media_type="application/xml")
