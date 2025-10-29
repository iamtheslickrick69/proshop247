"""
Test script for Chat API
Tests the /v1/chat endpoint with demo mode
"""
import requests
import json
import uuid

API_URL = "http://localhost:8000"

def test_chat_api():
    """Test the chat endpoint"""
    print("\n" + "="*60)
    print("Testing ProShop 24/7 Chat API")
    print("="*60 + "\n")

    # Generate session ID
    session_id = str(uuid.uuid4())
    print(f"Session ID: {session_id}\n")

    # Test messages
    messages = [
        "Hi, what are your hours?",
        "How much for 18 holes?",
        "Do you have a driving range?",
        "What did I first ask about?"
    ]

    for i, message in enumerate(messages, 1):
        print(f"\n{'='*60}")
        print(f"Message {i}: {message}")
        print(f"{'='*60}\n")

        # Make request
        payload = {
            "message": message,
            "session_id": session_id,
            "context": {
                "demo_slug": "fox-hollow"
            }
        }

        try:
            response = requests.post(
                f"{API_URL}/v1/chat",
                json=payload,
                timeout=30
            )

            if response.status_code == 200:
                data = response.json()
                print(f"✅ Response:\n{data['response']}\n")
                print(f"Interactions: {data['interaction_count']}/{data['interaction_limit']}")
            else:
                print(f"❌ Error {response.status_code}: {response.text}")
                break

        except requests.exceptions.ConnectionError:
            print("❌ Could not connect to API. Is the server running?")
            print("Start it with: ./venv/bin/python main.py")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
            break

    print("\n" + "="*60)
    print("Test Complete!")
    print("="*60 + "\n")


if __name__ == "__main__":
    test_chat_api()
