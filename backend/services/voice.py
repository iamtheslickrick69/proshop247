"""
Voice Pipeline Service
Audio format conversions and streaming utilities
Deepgram STT and ElevenLabs TTS integration
"""
import base64
import audioop
import struct
import asyncio
import os
import io
import json
from typing import Optional, Callable
from deepgram import DeepgramClient, LiveTranscriptionEvents, LiveOptions
from elevenlabs import generate, Voice
from pydub import AudioSegment
import httpx


def mulaw_to_pcm(mulaw_data: bytes) -> bytes:
    """
    Convert μ-law (8kHz, 8-bit) to PCM (16kHz, 16-bit).

    Twilio sends audio as μ-law encoded at 8kHz.
    Deepgram expects PCM at 16kHz.

    Args:
        mulaw_data: Raw μ-law audio bytes

    Returns:
        PCM audio bytes at 16kHz, 16-bit
    """
    # Step 1: Decode μ-law to linear PCM (8kHz, 16-bit)
    pcm_8khz = audioop.ulaw2lin(mulaw_data, 2)  # 2 = 16-bit samples

    # Step 2: Resample from 8kHz to 16kHz
    pcm_16khz, _ = audioop.ratecv(
        pcm_8khz,      # Input fragment
        2,              # Sample width (16-bit = 2 bytes)
        1,              # Number of channels (mono)
        8000,           # Input sample rate
        16000,          # Output sample rate
        None            # State (None for first call)
    )

    return pcm_16khz


def pcm_to_mulaw(pcm_data: bytes, sample_rate: int = 24000) -> bytes:
    """
    Convert PCM to μ-law (8kHz, 8-bit).

    ElevenLabs returns PCM at various sample rates (usually 24kHz).
    Twilio expects μ-law at 8kHz.

    Args:
        pcm_data: Raw PCM audio bytes
        sample_rate: Input sample rate (default: 24000 for ElevenLabs)

    Returns:
        μ-law audio bytes at 8kHz, 8-bit
    """
    # Step 1: Resample to 8kHz if needed
    if sample_rate != 8000:
        pcm_8khz, _ = audioop.ratecv(
            pcm_data,       # Input fragment
            2,              # Sample width (16-bit = 2 bytes)
            1,              # Number of channels (mono)
            sample_rate,    # Input sample rate
            8000,           # Output sample rate (8kHz for Twilio)
            None            # State
        )
    else:
        pcm_8khz = pcm_data

    # Step 2: Encode to μ-law
    mulaw_data = audioop.lin2ulaw(pcm_8khz, 2)  # 2 = 16-bit samples

    return mulaw_data


def encode_audio_for_twilio(pcm_data: bytes, sample_rate: int = 24000) -> str:
    """
    Encode PCM audio for Twilio Media Streams.

    Converts PCM → μ-law → base64 (required by Twilio).

    Args:
        pcm_data: Raw PCM audio bytes
        sample_rate: Input sample rate

    Returns:
        Base64-encoded μ-law audio string
    """
    # Convert to μ-law
    mulaw_data = pcm_to_mulaw(pcm_data, sample_rate)

    # Base64 encode
    b64_encoded = base64.b64encode(mulaw_data).decode('utf-8')

    return b64_encoded


def decode_audio_from_twilio(b64_mulaw: str) -> bytes:
    """
    Decode audio from Twilio Media Streams.

    Converts base64 → μ-law → PCM (for Deepgram).

    Args:
        b64_mulaw: Base64-encoded μ-law audio from Twilio

    Returns:
        PCM audio bytes at 16kHz, 16-bit
    """
    # Base64 decode
    mulaw_data = base64.b64decode(b64_mulaw)

    # Convert to PCM
    pcm_data = mulaw_to_pcm(mulaw_data)

    return pcm_data


def create_silence(duration_ms: int = 500) -> bytes:
    """
    Create silent audio buffer.

    Useful for padding or preventing audio gaps.

    Args:
        duration_ms: Duration in milliseconds

    Returns:
        Silent PCM audio bytes (16kHz, 16-bit, mono)
    """
    sample_rate = 16000
    num_samples = int(sample_rate * duration_ms / 1000)

    # Create zeros (silence) as 16-bit signed integers
    silence = struct.pack('<' + ('h' * num_samples), *([0] * num_samples))

    return silence


# Audio quality settings
TWILIO_SAMPLE_RATE = 8000  # μ-law at 8kHz
DEEPGRAM_SAMPLE_RATE = 16000  # PCM at 16kHz
ELEVENLABS_SAMPLE_RATE = 24000  # PCM at 24kHz (default)

# Buffer sizes for streaming
AUDIO_CHUNK_SIZE = 1024  # bytes
BUFFER_DURATION_MS = 20  # milliseconds between chunks


# ============================================================================
# DEEPGRAM STT INTEGRATION
# ============================================================================

async def initialize_deepgram_stream(
    call_sid: str,
    on_transcript_callback: Callable[[str, bool], None]
):
    """
    Initialize Deepgram WebSocket for real-time transcription.

    Args:
        call_sid: Unique call identifier
        on_transcript_callback: Function to call with (transcript, is_final) when transcription received

    Returns:
        Deepgram connection object
    """
    from config.settings import DEEPGRAM_API_KEY

    if not DEEPGRAM_API_KEY:
        raise ValueError("DEEPGRAM_API_KEY not configured")

    deepgram = DeepgramClient(DEEPGRAM_API_KEY)

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
            # Check if utterance is complete (detected by endpointing)
            if result.speech_final:
                # Complete utterance - send to agent
                print(f"🎤 [{call_sid}] Deepgram final: {sentence}")
                on_transcript_callback(sentence, True)
            else:
                # Partial final (word finalized but utterance continues)
                on_transcript_callback(sentence, False)

    def on_error(self, error, **kwargs):
        """Handle errors"""
        print(f"❌ Deepgram error for {call_sid}: {error}")

    def on_close(self, close_event, **kwargs):
        """Handle connection close"""
        print(f"📴 Deepgram connection closed for {call_sid}")

    # Register event handlers
    dg_connection.on(LiveTranscriptionEvents.Transcript, on_message)
    dg_connection.on(LiveTranscriptionEvents.Error, on_error)
    dg_connection.on(LiveTranscriptionEvents.Close, on_close)

    # Start connection
    if not await dg_connection.start(options):
        raise Exception("Failed to start Deepgram connection")

    print(f"✅ Deepgram stream initialized for {call_sid}")
    return dg_connection


# ============================================================================
# ELEVENLABS TTS INTEGRATION
# ============================================================================

async def text_to_speech(text: str, voice_id: Optional[str] = None) -> bytes:
    """
    Convert text to speech using ElevenLabs.

    Args:
        text: Text to convert to speech
        voice_id: Optional voice ID (uses default from env if not provided)

    Returns:
        Audio data (MP3 format)
    """
    from config.settings import ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID

    if not ELEVENLABS_API_KEY:
        raise ValueError("ELEVENLABS_API_KEY not configured")

    if not voice_id:
        voice_id = ELEVENLABS_VOICE_ID

    try:
        print(f"🔊 Converting to speech: {text[:50]}...")

        # Use ElevenLabs streaming API
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"

        headers = {
            "Accept": "audio/mpeg",
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json"
        }

        data = {
            "text": text,
            "model_id": "eleven_turbo_v2",  # Fastest model for low latency
            "voice_settings": {
                "stability": 0.7,
                "similarity_boost": 0.8,
                "style": 0.5,
                "use_speaker_boost": True
            }
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=data, headers=headers)

            if response.status_code == 200:
                audio_data = response.content
                print(f"✅ Generated {len(audio_data)} bytes of audio")
                return audio_data
            else:
                raise Exception(f"ElevenLabs API error: {response.status_code} - {response.text}")

    except Exception as e:
        print(f"❌ ElevenLabs TTS error: {e}")
        raise


async def text_to_speech_for_twilio(text: str, voice_id: Optional[str] = None) -> bytes:
    """
    Convert text to speech and format for Twilio (μ-law, 8kHz).

    Args:
        text: Text to convert
        voice_id: Optional voice ID

    Returns:
        μ-law audio bytes at 8kHz ready for Twilio
    """
    # Get MP3 from ElevenLabs
    mp3_audio = await text_to_speech(text, voice_id)

    # Convert MP3 to PCM
    audio = AudioSegment.from_mp3(io.BytesIO(mp3_audio))

    # Convert to 16kHz mono PCM (16-bit)
    audio = audio.set_frame_rate(16000).set_channels(1).set_sample_width(2)
    pcm_16khz = audio.raw_data

    # Convert to μ-law 8kHz for Twilio
    mulaw_8khz = pcm_to_mulaw(pcm_16khz, sample_rate=16000)

    print(f"✅ Converted to Twilio format: {len(mulaw_8khz)} bytes")
    return mulaw_8khz


async def stream_audio_to_twilio_websocket(
    websocket,
    stream_sid: str,
    audio_mulaw: bytes,
    chunk_size: int = 160
):
    """
    Stream audio to Twilio WebSocket in chunks.

    Args:
        websocket: Twilio WebSocket connection
        stream_sid: Twilio stream identifier
        audio_mulaw: μ-law audio bytes at 8kHz
        chunk_size: Bytes per chunk (160 = 20ms for 8kHz μ-law)
    """
    # Split into 20ms chunks (160 bytes for μ-law 8kHz)
    chunks = [audio_mulaw[i:i+chunk_size] for i in range(0, len(audio_mulaw), chunk_size)]

    print(f"📤 Streaming {len(chunks)} audio chunks to Twilio")

    # Send chunks to Twilio
    for i, chunk in enumerate(chunks):
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
        # Only delay between chunks, not after the last one
        if i < len(chunks) - 1:
            await asyncio.sleep(0.02)

    print(f"✅ Finished streaming {len(chunks)} chunks")
