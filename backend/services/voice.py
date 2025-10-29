"""
Voice Pipeline Service
Audio format conversions and streaming utilities
"""
import base64
import audioop
import struct


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
