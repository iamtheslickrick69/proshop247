#!/bin/bash

# ProShop 24/7 - Voice Pipeline Setup Script
# This script helps set up and test the voice pipeline

set -e  # Exit on error

echo "=========================================="
echo "ProShop 24/7 - Voice Pipeline Setup"
echo "=========================================="
echo ""

# Check if we're in the backend directory
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    exit 1
fi

echo "Step 1: Installing Python dependencies..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install/upgrade dependencies
echo "Installing dependencies from requirements.txt..."
pip install -r requirements.txt

echo "✅ Dependencies installed"
echo ""

echo "Step 2: Checking environment variables..."
echo ""

# Source .env file
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Loaded .env file"
else
    echo "⚠️  Warning: .env file not found"
fi

# Check required API keys
missing_keys=()

if [ -z "$DEEPGRAM_API_KEY" ]; then
    missing_keys+=("DEEPGRAM_API_KEY")
fi

if [ -z "$ELEVENLABS_API_KEY" ]; then
    missing_keys+=("ELEVENLABS_API_KEY")
fi

if [ -z "$ELEVENLABS_VOICE_ID" ]; then
    missing_keys+=("ELEVENLABS_VOICE_ID")
fi

if [ -z "$ANTHROPIC_API_KEY" ]; then
    missing_keys+=("ANTHROPIC_API_KEY")
fi

if [ -z "$TWILIO_ACCOUNT_SID" ]; then
    missing_keys+=("TWILIO_ACCOUNT_SID")
fi

if [ -z "$TWILIO_AUTH_TOKEN" ]; then
    missing_keys+=("TWILIO_AUTH_TOKEN")
fi

if [ -z "$TWILIO_PHONE_NUMBER" ]; then
    missing_keys+=("TWILIO_PHONE_NUMBER")
fi

if [ ${#missing_keys[@]} -gt 0 ]; then
    echo "⚠️  Warning: Missing API keys:"
    for key in "${missing_keys[@]}"; do
        echo "   - $key"
    done
    echo ""
    echo "Please add these to your .env file before testing."
else
    echo "✅ All required API keys found"
fi

echo ""
echo "Step 3: Testing voice pipeline components..."
echo ""

# Run component tests
python3 test_voice_pipeline.py

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start the backend server:"
echo "   uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
echo ""
echo "2. In a new terminal, start ngrok:"
echo "   ngrok http 8000"
echo ""
echo "3. Copy the ngrok HTTPS URL (e.g., https://abc123.ngrok.io)"
echo ""
echo "4. Set BASE_URL environment variable:"
echo "   export BASE_URL='wss://abc123.ngrok.io'"
echo "   Or add to .env: BASE_URL=wss://abc123.ngrok.io"
echo ""
echo "5. Configure Twilio webhook:"
echo "   - Go to: https://console.twilio.com/"
echo "   - Phone Numbers → Active Numbers → Click your number"
echo "   - Set Voice webhook to: https://abc123.ngrok.io/v1/voice/incoming"
echo ""
echo "6. Make a test call to: $TWILIO_PHONE_NUMBER"
echo ""
echo "See VOICE_TESTING.md for detailed testing instructions."
echo ""
