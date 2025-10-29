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

from services.voice import decode_audio_from_twilio, encode_audio_for_twilio
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

    Flow:
    1. Twilio calls phone number
    2. TwiML directs to this WebSocket
    3. Bidirectional audio streaming begins
    4. Audio → Deepgram (STT) → Agent → ElevenLabs (TTS) → Audio
    """
    await websocket.accept()
    print("📞 WebSocket connection accepted")

    stream_sid = None
    call_sid = None

    # For MVP, we'll track the conversation as text
    conversation_transcript = []
    audio_buffer = bytearray()

    try:
        async for message in websocket.iter_text():
            data = json.loads(message)
            event = data.get('event')

            if event == 'start':
                # Call started
                stream_sid = data['streamSid']
                call_sid = data['start']['callSid']
                from_number = data['start'].get('customParameters', {}).get('From', 'unknown')

                print(f"📞 Call started: {call_sid}")
                print(f"   From: {from_number}")
                print(f"   Stream: {stream_sid}")

                # Initialize call session
                active_calls[call_sid] = {
                    'stream_sid': stream_sid,
                    'from_number': from_number,
                    'start_time': datetime.now(),
                    'transcript': [],
                    'agent': None,
                    'audio_buffer': bytearray()
                }

                # Send welcome message
                welcome_text = "Thank you for calling Fox Hollow Golf Course. How can I help you today?"
                await send_tts_to_twilio(websocket, stream_sid, welcome_text)

            elif event == 'media':
                # Incoming audio from caller
                if call_sid not in active_calls:
                    continue

                payload = data['media']['payload']

                # Decode audio
                # pcm_audio = decode_audio_from_twilio(payload)

                # Buffer audio
                active_calls[call_sid]['audio_buffer'].extend(base64.b64decode(payload))

                # For MVP: We'll use a simplified approach
                # In production, this would stream to Deepgram continuously
                # For now, we'll wait for silence detection or timeout

            elif event == 'stop':
                # Call ended
                print(f"📞 Call ended: {call_sid}")

                if call_sid in active_calls:
                    # Store conversation
                    session = active_calls[call_sid]
                    transcript_text = "\n".join(session['transcript'])

                    # In production mode, store to database
                    # For demo mode, just log
                    print(f"📝 Call transcript:\n{transcript_text}")

                    # Cleanup
                    del active_calls[call_sid]

            elif event == 'mark':
                # Twilio confirmation marker (can ignore for MVP)
                pass

    except WebSocketDisconnect:
        print(f"📞 WebSocket disconnected: {call_sid}")
        if call_sid and call_sid in active_calls:
            del active_calls[call_sid]

    except Exception as e:
        print(f"❌ Error in media stream: {e}")
        import traceback
        traceback.print_exc()


async def send_tts_to_twilio(
    websocket: WebSocket,
    stream_sid: str,
    text: str
):
    """
    Convert text to speech and send to Twilio.

    Args:
        websocket: Twilio WebSocket connection
        stream_sid: Twilio stream identifier
        text: Text to speak
    """
    try:
        print(f"🔊 Sending TTS: {text[:50]}...")

        # For MVP without ElevenLabs API key, send text as mark
        # In production, this would:
        # 1. Call ElevenLabs API
        # 2. Get audio stream
        # 3. Convert to μ-law
        # 4. Send to Twilio

        # For now, use Twilio's <Say> verb via a mark event
        # This allows testing without ElevenLabs
        mark_message = {
            "event": "mark",
            "streamSid": stream_sid,
            "mark": {
                "name": f"tts_{datetime.now().timestamp()}"
            }
        }

        await websocket.send_text(json.dumps(mark_message))

        # Note: In production with ElevenLabs:
        # audio_data = await get_elevenlabs_audio(text)
        # encoded = encode_audio_for_twilio(audio_data)
        # media_message = {
        #     "event": "media",
        #     "streamSid": stream_sid,
        #     "media": {
        #         "payload": encoded
        #     }
        # }
        # await websocket.send_text(json.dumps(media_message))

    except Exception as e:
        print(f"❌ Error sending TTS: {e}")


async def get_elevenlabs_audio(text: str) -> bytes:
    """
    Get audio from ElevenLabs TTS API.

    Args:
        text: Text to convert to speech

    Returns:
        PCM audio bytes
    """
    if not ELEVENLABS_API_KEY:
        raise ValueError("ELEVENLABS_API_KEY not configured")

    # ElevenLabs API integration
    # This is a placeholder - full implementation would:
    # 1. Make streaming request to ElevenLabs
    # 2. Receive audio chunks
    # 3. Return combined audio

    import httpx

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}/stream"

    headers = {
        "Accept": "audio/mpeg",
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
    }

    data = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=data, headers=headers, timeout=30.0)

        if response.status_code == 200:
            return response.content
        else:
            raise Exception(f"ElevenLabs API error: {response.status_code}")


async def transcribe_with_deepgram(audio_data: bytes) -> str:
    """
    Transcribe audio using Deepgram.

    Args:
        audio_data: PCM audio bytes at 16kHz

    Returns:
        Transcribed text
    """
    if not DEEPGRAM_API_KEY:
        raise ValueError("DEEPGRAM_API_KEY not configured")

    # Deepgram API integration
    # This is a placeholder - full implementation would:
    # 1. Stream audio to Deepgram WebSocket
    # 2. Receive real-time transcription
    # 3. Return final transcript

    import httpx

    url = "https://api.deepgram.com/v1/listen"

    headers = {
        "Authorization": f"Token {DEEPGRAM_API_KEY}",
        "Content-Type": "audio/raw"
    }

    params = {
        "model": "nova-2",
        "encoding": "linear16",
        "sample_rate": "16000",
        "channels": "1"
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            url,
            headers=headers,
            params=params,
            content=audio_data,
            timeout=30.0
        )

        if response.status_code == 200:
            result = response.json()
            transcript = result['results']['channels'][0]['alternatives'][0]['transcript']
            return transcript
        else:
            raise Exception(f"Deepgram API error: {response.status_code}")


# TwiML endpoint to start Media Stream
@router.post("/voice/incoming")
async def handle_incoming_call():
    """
    TwiML endpoint for incoming calls.
    Returns TwiML to start Media Stream.
    """
    from fastapi.responses import Response

    # Get base URL (in production, use actual domain)
    # For local testing with ngrok: use ngrok URL
    base_url = "wss://your-app.railway.app"  # Update in production

    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Start>
        <Stream url="{base_url}/v1/media-stream" />
    </Start>
    <Say>Please wait while we connect you.</Say>
    <Pause length="30"/>
</Response>"""

    return Response(content=twiml, media_type="application/xml")
