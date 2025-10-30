# Voice Pipeline Testing Guide

## Prerequisites

1. All API keys configured in `.env`:
   - DEEPGRAM_API_KEY
   - ELEVENLABS_API_KEY
   - ELEVENLABS_VOICE_ID
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - TWILIO_PHONE_NUMBER

2. Dependencies installed:
   ```bash
   pip install -r requirements.txt
   ```

3. ngrok installed for local testing:
   ```bash
   brew install ngrok  # macOS
   # or download from https://ngrok.com/download
   ```

## Step 1: Start Backend Server

```bash
cd /Users/isr/Desktop/THISISTHE1/backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The server should start and show:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

## Step 2: Expose Backend with ngrok

In a new terminal:

```bash
ngrok http 8000
```

You should see output like:
```
Session Status                online
Forwarding                    https://abc123.ngrok.io -> http://localhost:8000
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

## Step 3: Set BASE_URL Environment Variable

Update your `.env` file or export in terminal:

```bash
export BASE_URL="wss://abc123.ngrok.io"
```

Or add to `.env`:
```
BASE_URL=wss://abc123.ngrok.io
```

**Important:** Use `wss://` (not `https://`) for WebSocket connections.

Restart the backend server after updating.

## Step 4: Configure Twilio Webhook

1. Go to Twilio Console: https://console.twilio.com/
2. Navigate to: Phone Numbers → Manage → Active Numbers
3. Click on your phone number: `+12272334997`
4. Under "Voice & Fax" section:
   - **A CALL COMES IN:** Configure with:
     - Webhook: `https://abc123.ngrok.io/v1/voice/incoming`
     - HTTP Method: `POST`
5. Click "Save"

## Step 5: Make Test Call

Call your Twilio number from your phone:
```
+1 (227) 233-4997
```

### Expected Flow:

1. **Call connects** - You should hear silence briefly
2. **Welcome message** - AI says: "Thank you for calling Fox Hollow Golf Course. How can I help you today?"
3. **Speak your question** - Try: "What are your hours?"
4. **AI responds** - You hear the agent's voice response

### What to Monitor:

Watch your terminal for logs:

```
📞 Incoming call from +15551234567 to +12272334997
📞 WebSocket connection accepted
📞 Call started: CA1234567890abcdef
   From: +15551234567
   Stream: MZ1234567890abcdef
✅ Agent initialized for caller abc-123-def
✅ Deepgram initialized for CA1234567890abcdef
🔊 Sending TTS: Thank you for calling Fox Hollow Golf Course...
✅ Generated 12345 bytes of audio
✅ Converted to Twilio format: 5678 bytes
📤 Streaming 284 audio chunks to Twilio
✅ Finished streaming 284 chunks
🎤 [CA1234567890abcdef] Deepgram final: What are your hours?
👤 [CA1234567890abcdef] User: What are your hours?
🤖 [CA1234567890abcdef] Agent: We're open from dawn to dusk...
🔊 Sending TTS: We're open from dawn to dusk...
📞 Call ended: CA1234567890abcdef
✅ Conversation stored for CA1234567890abcdef
```

## Troubleshooting

### Issue: No audio response

**Check:**
1. ElevenLabs API key is valid
2. Voice ID is correct
3. Terminal shows "Generated X bytes of audio"

**Fix:**
```bash
# Test ElevenLabs API
curl -X POST https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}/stream \
  -H "xi-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"Test","model_id":"eleven_turbo_v2"}' \
  --output test.mp3
```

### Issue: Speech not recognized

**Check:**
1. Deepgram API key is valid
2. Terminal shows "Deepgram final: ..."
3. Audio is being received (check for "media" events)

**Fix:**
```bash
# Check Deepgram API
curl -X POST https://api.deepgram.com/v1/listen \
  -H "Authorization: Token YOUR_KEY" \
  -H "Content-Type: audio/wav" \
  --data-binary @test.wav
```

### Issue: WebSocket not connecting

**Check:**
1. ngrok is running
2. BASE_URL is set correctly (with `wss://`)
3. Twilio webhook is configured with ngrok URL

**Fix:**
- Check ngrok dashboard: http://127.0.0.1:4040
- Verify webhook requests are arriving

### Issue: Agent not responding

**Check:**
1. Anthropic API key is valid
2. Agent initialization succeeded
3. Terminal shows "Agent: ..." logs

**Fix:**
```python
# Test agent directly
python test_agent.py
```

## Performance Benchmarks

Target latency (caller stops speaking → hears response):

| Component | Target | Acceptable |
|-----------|--------|------------|
| Deepgram STT | <300ms | <500ms |
| Agent (Claude) | <2000ms | <3000ms |
| ElevenLabs TTS | <500ms | <1000ms |
| Total | <3000ms | <5000ms |

## Testing Checklist

- [ ] Backend server starts without errors
- [ ] ngrok tunnel established
- [ ] Twilio webhook configured
- [ ] Call connects successfully
- [ ] Welcome message plays
- [ ] Speech is transcribed (check logs)
- [ ] Agent generates response (check logs)
- [ ] Response is spoken to caller
- [ ] Conversation is stored in database
- [ ] Multiple turns work (ask follow-up questions)
- [ ] Call ends cleanly

## Next Steps After Successful Test

1. **Test Multiple Scenarios:**
   - Booking inquiry
   - Pricing questions
   - Amenities questions
   - Complex multi-turn conversations

2. **Test Edge Cases:**
   - Background noise
   - Long pauses
   - Interruptions
   - Multiple rapid questions

3. **Measure Latency:**
   - Record timestamps in logs
   - Calculate time from speech end to response start
   - Optimize if > 3 seconds

4. **Deploy to Production:**
   - Update BASE_URL to Railway URL
   - Update Twilio webhook to production URL
   - Monitor production logs

## Voice Quality Assessment

Rate the following (1-5 scale):

- [ ] Audio clarity: ___/5
- [ ] Transcription accuracy: ___/5
- [ ] Response relevance: ___/5
- [ ] Voice naturalness: ___/5
- [ ] Overall latency: ___/5

## Common Test Phrases

Try these during testing:

1. "What are your hours?"
2. "How much does it cost to play 18 holes?"
3. "Can I book a tee time for Saturday at 10 AM?"
4. "Do you have a driving range?"
5. "What's the dress code?"
6. "Can I rent clubs?"
7. "I'd like to cancel my reservation."
8. "What's the weather like today?"

## Production Deployment

Once local testing is successful:

```bash
# 1. Deploy to Railway
git add .
git commit -m "Add complete voice pipeline"
git push railway main

# 2. Set environment variable on Railway
railway variables set BASE_URL=wss://your-app.up.railway.app

# 3. Update Twilio webhook
# Change to: https://your-app.up.railway.app/v1/voice/incoming

# 4. Make test call to verify production
```

## Support

If issues persist:
1. Check all API keys are correct
2. Verify billing is active for all services
3. Review terminal logs for error messages
4. Test each component individually
5. Check ngrok/Railway logs for webhook delivery
