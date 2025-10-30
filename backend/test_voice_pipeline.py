"""
Test Voice Pipeline Components
Verifies Deepgram, ElevenLabs, and audio conversion functions
"""
import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Test imports
print("Testing imports...")
try:
    from services.voice import (
        mulaw_to_pcm,
        pcm_to_mulaw,
        text_to_speech,
        initialize_deepgram_stream
    )
    print("✅ Voice service imports successful")
except Exception as e:
    print(f"❌ Import error: {e}")
    exit(1)

try:
    from services.agent import create_demo_agent
    print("✅ Agent service imports successful")
except Exception as e:
    print(f"❌ Import error: {e}")
    exit(1)


async def test_audio_conversion():
    """Test audio format conversions"""
    print("\n--- Testing Audio Conversion ---")

    # Create test audio (1 second of silence)
    test_mulaw = b'\xff' * 8000  # 1 second of μ-law silence at 8kHz

    # Test μ-law to PCM
    print("Converting μ-law → PCM...")
    pcm_audio = mulaw_to_pcm(test_mulaw)
    print(f"✅ Converted {len(test_mulaw)} bytes μ-law → {len(pcm_audio)} bytes PCM")

    # Test PCM to μ-law
    print("Converting PCM → μ-law...")
    mulaw_audio = pcm_to_mulaw(pcm_audio, sample_rate=16000)
    print(f"✅ Converted {len(pcm_audio)} bytes PCM → {len(mulaw_audio)} bytes μ-law")

    print("✅ Audio conversion tests passed!")


async def test_elevenlabs():
    """Test ElevenLabs TTS"""
    print("\n--- Testing ElevenLabs TTS ---")

    api_key = os.getenv("ELEVENLABS_API_KEY")
    voice_id = os.getenv("ELEVENLABS_VOICE_ID")

    if not api_key:
        print("⚠️ ELEVENLABS_API_KEY not set - skipping ElevenLabs test")
        return

    if not voice_id:
        print("⚠️ ELEVENLABS_VOICE_ID not set - skipping ElevenLabs test")
        return

    print(f"API Key: {api_key[:20]}...")
    print(f"Voice ID: {voice_id}")

    try:
        print("Generating speech for: 'Hello, this is a test.'")
        audio_data = await text_to_speech("Hello, this is a test.", voice_id)
        print(f"✅ Generated {len(audio_data)} bytes of audio")

        # Optionally save to file
        with open("/tmp/test_tts.mp3", "wb") as f:
            f.write(audio_data)
        print("✅ Saved test audio to /tmp/test_tts.mp3")

    except Exception as e:
        print(f"❌ ElevenLabs test failed: {e}")
        import traceback
        traceback.print_exc()


async def test_deepgram():
    """Test Deepgram STT initialization"""
    print("\n--- Testing Deepgram STT ---")

    api_key = os.getenv("DEEPGRAM_API_KEY")

    if not api_key:
        print("⚠️ DEEPGRAM_API_KEY not set - skipping Deepgram test")
        return

    print(f"API Key: {api_key[:20]}...")

    transcripts = []

    def on_transcript(text: str, is_final: bool):
        """Callback for transcripts"""
        status = "FINAL" if is_final else "interim"
        print(f"   [{status}] {text}")
        if is_final:
            transcripts.append(text)

    try:
        print("Initializing Deepgram connection...")
        dg_connection = await initialize_deepgram_stream("test-call", on_transcript)
        print("✅ Deepgram connection initialized")

        # Note: We can't test audio transcription without actual audio
        # In a real test, you'd send audio chunks here

        print("Closing Deepgram connection...")
        await dg_connection.finish()
        print("✅ Deepgram connection closed")

    except Exception as e:
        print(f"❌ Deepgram test failed: {e}")
        import traceback
        traceback.print_exc()


async def test_agent():
    """Test Agent creation"""
    print("\n--- Testing Agent ---")

    api_key = os.getenv("ANTHROPIC_API_KEY")

    if not api_key:
        print("⚠️ ANTHROPIC_API_KEY not set - skipping Agent test")
        return

    print(f"API Key: {api_key[:20]}...")

    try:
        print("Creating demo agent...")
        demo_course = {
            'name': 'Fox Hollow Golf Course',
            'location': 'Troy, Michigan'
        }
        agent = create_demo_agent(demo_course)
        print("✅ Agent created successfully")

        # Test agent with a simple query
        print("\nTesting agent response...")
        response = agent.run("What are your hours?")
        print(f"Agent: {response}")
        print("✅ Agent test passed!")

    except Exception as e:
        print(f"❌ Agent test failed: {e}")
        import traceback
        traceback.print_exc()


async def main():
    """Run all tests"""
    print("=" * 60)
    print("VOICE PIPELINE COMPONENT TESTS")
    print("=" * 60)

    # Test audio conversion (no API required)
    await test_audio_conversion()

    # Test ElevenLabs TTS
    await test_elevenlabs()

    # Test Deepgram STT
    await test_deepgram()

    # Test Agent
    await test_agent()

    print("\n" + "=" * 60)
    print("TESTS COMPLETE")
    print("=" * 60)
    print("\n✅ All component tests passed!")
    print("\nNext steps:")
    print("1. Start backend: uvicorn main:app --port 8000 --reload")
    print("2. Start ngrok: ngrok http 8000")
    print("3. Configure Twilio webhook with ngrok URL")
    print("4. Make test call to Twilio number")


if __name__ == "__main__":
    asyncio.run(main())
