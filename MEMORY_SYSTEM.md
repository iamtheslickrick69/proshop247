# ProShop 24/7 - Memory System Specification

## Document Overview

This document defines the conversation memory system - the core innovation of ProShop 24/7. The memory system enables the AI agent to recognize returning callers, remember every conversation forever, and provide contextual responses by retrieving the last 3 conversations. This creates a personalized experience that rivals human staff.

---

## Memory System Philosophy

### Core Principles

1. **Store Everything, Forever**
   - Every conversation is permanently stored (no expiration)
   - Complete conversation history enables future analytics and insights
   - Users own their data, can request export or deletion (V2)

2. **Retrieve Smart, Not All**
   - Don't inject ALL conversations into agent context (too expensive, too slow)
   - Retrieve last 3 conversations for immediate context
   - Last 3 provides sufficient context for 95% of use cases
   - Full history available for semantic search (V2)

3. **Auto-Account Creation**
   - No manual signup required
   - Phone number = unique identifier
   - First call automatically creates caller account
   - Zero friction for customers

4. **Perfect Data Isolation**
   - Each phone number's data is completely isolated
   - Caller A never sees Caller B's conversations
   - Enforced at database level (RLS), not just application level
   - Demo data completely separate from production data

---

## Memory System Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CALL/TEXT STARTS                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                ┌────────────────────┐
                │ Identify Caller    │
                │ (Phone Number)     │
                └────────┬───────────┘
                         │
                    ┌────▼─────┐
                    │ Exists?  │
                    └────┬─────┘
                         │
            ┌────────────┼────────────┐
            │ NO                 YES  │
            ▼                          ▼
    ┌───────────────┐        ┌──────────────────┐
    │ Create Caller │        │ Retrieve Last 3  │
    │ Account       │        │ Conversations    │
    └───────┬───────┘        └────────┬─────────┘
            │                         │
            └────────────┬────────────┘
                         │
                         ▼
                ┌────────────────────┐
                │ Inject Context     │
                │ into Agent Prompt  │
                └────────┬───────────┘
                         │
                         ▼
                ┌────────────────────┐
                │ Agent Converses    │
                │ (LangChain Loop)   │
                └────────┬───────────┘
                         │
                         ▼
                ┌────────────────────┐
                │ Call/Text Ends     │
                └────────┬───────────┘
                         │
                         ▼
                ┌────────────────────┐
                │ Store Conversation │
                │ - Transcript       │
                │ - Summary          │
                │ - Metadata         │
                └────────┬───────────┘
                         │
                         ▼
                ┌────────────────────┐
                │ Generate Embedding │
                │ (OpenAI API)       │
                └────────┬───────────┘
                         │
                         ▼
                ┌────────────────────┐
                │ Store Embedding    │
                │ in Vector DB       │
                └────────┬───────────┘
                         │
                         ▼
                ┌────────────────────┐
                │ Update Caller Stats│
                │ (total_convs, etc) │
                └────────────────────┘
```

---

## Component 1: Caller Identification & Account Creation

### Function: `identify_or_create_caller()`

**Purpose**: Identify caller by phone number, create account if first-time caller

**Input**:
- `phone_number` (str): E.164 format (e.g., "+15551234567")
- `golf_course_id` (UUID): Which golf course they're calling

**Output**:
- `caller` (dict): Caller record with id, phone_number, total_conversations, etc.

**Implementation**:

```python
from supabase import Client
from typing import Dict, Optional
import re

def normalize_phone_number(phone: str) -> str:
    """
    Normalize phone number to E.164 format
    Examples:
    - "(555) 123-4567" → "+15551234567"
    - "555-123-4567" → "+15551234567"
    - "+1 555 123 4567" → "+15551234567"
    """
    # Remove all non-digit characters except leading +
    digits = re.sub(r'[^\d+]', '', phone)

    # If no country code, assume US (+1)
    if not digits.startswith('+'):
        digits = '+1' + digits

    return digits

def identify_or_create_caller(
    supabase: Client,
    phone_number: str,
    golf_course_id: str
) -> Dict:
    """
    Identify caller by phone number, create account if first-time caller.

    Returns:
        Caller record (dict)
    """
    # Normalize phone number
    phone_normalized = normalize_phone_number(phone_number)

    # Query database for existing caller
    response = supabase.table('callers') \
        .select('*') \
        .eq('phone_number', phone_normalized) \
        .eq('golf_course_id', golf_course_id) \
        .execute()

    # If caller exists, update last_seen
    if response.data and len(response.data) > 0:
        caller = response.data[0]

        # Update last_seen timestamp
        supabase.table('callers') \
            .update({'last_seen': 'NOW()'}) \
            .eq('id', caller['id']) \
            .execute()

        return caller

    # If caller doesn't exist, create new account
    else:
        new_caller = {
            'phone_number': phone_normalized,
            'phone_number_normalized': phone_normalized.replace('+', ''),
            'golf_course_id': golf_course_id,
            'total_conversations': 0,
            'total_call_duration_seconds': 0,
            'total_text_messages': 0,
            'first_seen': 'NOW()',
            'last_seen': 'NOW()'
        }

        response = supabase.table('callers') \
            .insert(new_caller) \
            .execute()

        return response.data[0]
```

**Edge Cases**:
- **Multiple golf courses**: Same phone number can call different courses (separate accounts)
- **Invalid phone number**: Validate E.164 format, reject if invalid
- **Database error**: Retry once, then fail gracefully (allow call without memory)

---

## Component 2: Conversation History Retrieval

### Function: `retrieve_last_3_conversations()`

**Purpose**: Retrieve last 3 conversations for context injection into agent

**Input**:
- `caller_id` (UUID): Caller's unique ID
- `golf_course_id` (UUID): Which golf course (for data isolation)

**Output**:
- `conversations` (list): List of 3 most recent conversation summaries

**Implementation**:

```python
from typing import List, Dict
from supabase import Client

def retrieve_last_3_conversations(
    supabase: Client,
    caller_id: str,
    golf_course_id: str
) -> List[Dict]:
    """
    Retrieve last 3 conversations for caller.

    Returns:
        List of conversation dicts with: id, summary, intent, created_at
    """
    response = supabase.table('conversations') \
        .select('id, summary, intent, topics, outcome, created_at') \
        .eq('caller_id', caller_id) \
        .eq('golf_course_id', golf_course_id) \
        .order('created_at', desc=True) \
        .limit(3) \
        .execute()

    return response.data if response.data else []

def format_conversation_history_for_prompt(
    conversations: List[Dict]
) -> str:
    """
    Format conversation history into human-readable text for agent prompt.

    Example output:
    "Conversation History (most recent first):

    1. October 25, 2024 - Tee Time Booking
       Summary: Customer booked Saturday 10am tee time for 4 players.
       Outcome: Booking confirmed

    2. October 20, 2024 - Restaurant Inquiry
       Summary: Customer asked about restaurant hours and menu.
       Outcome: Question answered

    3. October 15, 2024 - General Inquiry
       Summary: Customer inquired about pricing and availability.
       Outcome: Question answered"
    """
    if not conversations:
        return "This is the customer's first conversation. No prior history."

    formatted = "Conversation History (most recent first):\n\n"

    for i, conv in enumerate(conversations, 1):
        # Format date
        date_str = conv['created_at'][:10]  # "2024-10-25"

        # Format intent
        intent = conv.get('intent', 'General Inquiry').replace('-', ' ').title()

        # Format summary
        summary = conv.get('summary', 'No summary available')

        # Format outcome
        outcome = conv.get('outcome', 'unknown')
        outcome_display = outcome.replace('-', ' ').title() if outcome else 'Unknown'

        # Build formatted entry
        formatted += f"{i}. {date_str} - {intent}\n"
        formatted += f"   Summary: {summary}\n"
        formatted += f"   Outcome: {outcome_display}\n\n"

    return formatted
```

**Performance Optimization**:
- **Index**: `idx_conversations_caller` ensures <50ms query time
- **Select only needed columns**: Don't fetch full transcript (saves bandwidth)
- **Limit 3**: Small result set, minimal network overhead
- **Cache**: Cache results for duration of call (avoid repeated queries)

**Example Output**:

```
Conversation History (most recent first):

1. October 25, 2024 - Tee Time Booking
   Summary: Customer booked Saturday 10am tee time for 4 players.
   Outcome: Booking Confirmed

2. October 20, 2024 - Restaurant Inquiry
   Summary: Customer asked about restaurant hours and menu.
   Outcome: Question Answered

3. October 15, 2024 - General Inquiry
   Summary: Customer inquired about pricing and availability.
   Outcome: Question Answered
```

---

## Component 3: Context Injection into Agent Prompt

### Function: `build_agent_system_prompt()`

**Purpose**: Build dynamic system prompt with conversation history + golf course data

**Input**:
- `golf_course` (dict): Golf course data (name, hours, pricing, etc.)
- `caller` (dict): Caller data (name, preferences, etc.)
- `conversation_history` (str): Formatted last 3 conversations

**Output**:
- `system_prompt` (str): Complete system prompt for LangChain agent

**Implementation**:

```python
from typing import Dict

def build_agent_system_prompt(
    golf_course: Dict,
    caller: Dict,
    conversation_history: str
) -> str:
    """
    Build dynamic system prompt with golf course data + conversation history.

    Returns:
        Complete system prompt string
    """

    # Extract golf course data
    course_name = golf_course['name']
    location = golf_course['location']
    phone_number = golf_course.get('phone_number', '')
    operating_hours = golf_course.get('operating_hours', {})
    pricing = golf_course.get('pricing_structure', {})
    services = golf_course.get('services', [])
    personality = golf_course.get('agent_personality', 'friendly')
    greeting = golf_course.get('greeting_message', f'Thanks for calling {course_name}!')

    # Extract caller data
    caller_name = caller.get('first_name', '')
    total_convs = caller.get('total_conversations', 0)

    # Build system prompt
    prompt = f"""You are an AI assistant for {course_name}, a golf course located in {location}.

Your role is to help customers with:
- Tee time bookings and availability
- Restaurant reservations and menu questions
- Event and wedding venue inquiries
- General course information (hours, pricing, services)
- Directions and contact information

PERSONALITY: {personality.title()}
- Be warm, helpful, and conversational
- Sound like a friendly staff member at the course
- Keep responses concise (2-3 sentences max)
- If you don't know something, offer to have a staff member call back

COURSE INFORMATION:
- Name: {course_name}
- Location: {location}
- Phone: {phone_number}
- Operating Hours: {format_hours(operating_hours)}
- Pricing: {format_pricing(pricing)}
- Services: {', '.join(services)}

CUSTOMER INFORMATION:
- Phone Number: {caller['phone_number']}
- Name: {caller_name if caller_name else 'Unknown (ask politely if needed)'}
- Total Previous Conversations: {total_convs}

{conversation_history}

IMPORTANT INSTRUCTIONS:
1. Reference conversation history naturally (e.g., "Welcome back! Last time we discussed...")
2. If this is their first conversation, greet them warmly and ask how you can help
3. Always confirm important details (dates, times, party size) before "booking"
4. For actual bookings, say "I've noted that down and someone will confirm shortly"
5. If asked about something outside your knowledge, offer callback: "Let me have a manager call you back"
6. Never make up information - if unsure, say so

GREETING (use on first message):
{greeting}

Now, help the customer with their inquiry!"""

    return prompt

def format_hours(hours: Dict) -> str:
    """Format operating hours dict into readable string"""
    if not hours:
        return "7am-7pm daily (typical hours)"

    # Example: {"monday": "7am-8pm", "saturday": "6am-9pm"}
    # Group by same hours
    hours_str = ", ".join([f"{day.title()}: {time}" for day, time in hours.items()])
    return hours_str

def format_pricing(pricing: Dict) -> str:
    """Format pricing dict into readable string"""
    if not pricing:
        return "Please ask for current rates"

    # Example: {"weekday": 25, "weekend": 45, "cart": 18}
    pricing_items = []
    if 'weekday' in pricing:
        pricing_items.append(f"Weekday ${pricing['weekday']}")
    if 'weekend' in pricing:
        pricing_items.append(f"Weekend ${pricing['weekend']}")
    if 'cart' in pricing:
        pricing_items.append(f"Cart rental ${pricing['cart']}")

    return ", ".join(pricing_items)
```

**Key Design Decisions**:
- **Dynamic prompt**: Built fresh for each call based on caller's history
- **Concise**: Keep prompt <1000 tokens to reduce latency and cost
- **Personality injection**: Match golf course's desired tone
- **Conversation history**: Naturally integrated, not overwhelming
- **Fail-safe instructions**: Guide agent to handle unknowns gracefully

---

## Component 4: Conversation Storage

### Function: `store_conversation()`

**Purpose**: Store completed conversation in database after call/text ends

**Input**:
- `caller_id` (UUID): Caller's ID
- `golf_course_id` (UUID): Golf course ID
- `channel` (str): "voice", "sms", or "web-chat"
- `transcript` (str): Full conversation text
- `metadata` (dict): Call duration, intent, sentiment, etc.

**Output**:
- `conversation_id` (UUID): ID of stored conversation

**Implementation**:

```python
from supabase import Client
from typing import Dict, Optional
import uuid

def store_conversation(
    supabase: Client,
    caller_id: str,
    golf_course_id: str,
    channel: str,
    transcript: str,
    metadata: Dict
) -> str:
    """
    Store completed conversation in database.

    Args:
        caller_id: Caller's UUID
        golf_course_id: Golf course UUID
        channel: "voice", "sms", or "web-chat"
        transcript: Full conversation text
        metadata: {
            'twilio_call_sid': str (optional),
            'call_duration_seconds': int (optional),
            'call_recording_url': str (optional),
            'started_at': str (ISO timestamp),
            'ended_at': str (ISO timestamp)
        }

    Returns:
        conversation_id (UUID)
    """

    # Generate AI summary of conversation
    summary = generate_conversation_summary(transcript)

    # Detect intent
    intent = detect_conversation_intent(transcript)

    # Detect sentiment
    sentiment = detect_conversation_sentiment(transcript)

    # Extract topics
    topics = extract_conversation_topics(transcript)

    # Detect outcome
    outcome = detect_conversation_outcome(transcript)

    # Build conversation record
    conversation = {
        'id': str(uuid.uuid4()),
        'caller_id': caller_id,
        'golf_course_id': golf_course_id,
        'channel': channel,
        'direction': 'inbound',
        'status': 'completed',
        'transcript': transcript,
        'summary': summary,
        'intent': intent,
        'sentiment': sentiment,
        'topics': topics,
        'outcome': outcome,
        'twilio_call_sid': metadata.get('twilio_call_sid'),
        'call_duration_seconds': metadata.get('call_duration_seconds'),
        'call_recording_url': metadata.get('call_recording_url'),
        'started_at': metadata.get('started_at'),
        'ended_at': metadata.get('ended_at'),
        'created_at': 'NOW()'
    }

    # Insert into database
    response = supabase.table('conversations') \
        .insert(conversation) \
        .execute()

    # Update caller statistics
    update_caller_statistics(supabase, caller_id, metadata)

    return conversation['id']

def update_caller_statistics(
    supabase: Client,
    caller_id: str,
    metadata: Dict
):
    """
    Update caller statistics after conversation.
    """
    # Increment total_conversations
    supabase.rpc('increment_caller_conversations', {
        'caller_uuid': caller_id
    }).execute()

    # Add call duration if voice call
    if metadata.get('call_duration_seconds'):
        supabase.rpc('add_caller_call_duration', {
            'caller_uuid': caller_id,
            'duration_seconds': metadata['call_duration_seconds']
        }).execute()

    # Update last_seen
    supabase.table('callers') \
        .update({'last_seen': 'NOW()'}) \
        .eq('id', caller_id) \
        .execute()
```

**Helper Functions for AI Analysis**:

```python
from anthropic import Anthropic

def generate_conversation_summary(transcript: str) -> str:
    """
    Generate 1-2 sentence summary of conversation using Claude.

    Example: "Customer booked Saturday 10am tee time for 4 players."
    """
    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    prompt = f"""Summarize this golf course conversation in 1-2 sentences. Focus on the customer's request and outcome.

Conversation:
{transcript}

Summary (1-2 sentences):"""

    response = client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=100,
        messages=[{"role": "user", "content": prompt}]
    )

    return response.content[0].text.strip()

def detect_conversation_intent(transcript: str) -> str:
    """
    Detect primary intent: "tee-time", "restaurant", "event", "general-info", etc.

    Uses simple keyword matching for speed (avoid API call).
    """
    transcript_lower = transcript.lower()

    # Priority order (check most specific first)
    if any(word in transcript_lower for word in ['wedding', 'event', 'party', 'reception']):
        return 'event'
    elif any(word in transcript_lower for word in ['tee time', 'book', 'reservation', 'play', 'golf']):
        return 'tee-time'
    elif any(word in transcript_lower for word in ['restaurant', 'menu', 'food', 'eat', 'dining', 'fox den']):
        return 'restaurant'
    elif any(word in transcript_lower for word in ['lesson', 'instruction', 'coach']):
        return 'lessons'
    elif any(word in transcript_lower for word in ['price', 'cost', 'rate', 'fee']):
        return 'pricing'
    elif any(word in transcript_lower for word in ['hours', 'open', 'close']):
        return 'hours'
    else:
        return 'general-info'

def detect_conversation_sentiment(transcript: str) -> str:
    """
    Detect sentiment: "positive", "neutral", "negative"

    Uses simple keyword matching for speed.
    """
    transcript_lower = transcript.lower()

    positive_words = ['great', 'perfect', 'awesome', 'excellent', 'wonderful', 'thanks', 'thank you']
    negative_words = ['upset', 'frustrated', 'angry', 'disappointed', 'problem', 'issue', 'complaint']

    positive_count = sum(1 for word in positive_words if word in transcript_lower)
    negative_count = sum(1 for word in negative_words if word in transcript_lower)

    if negative_count > positive_count:
        return 'negative'
    elif positive_count > negative_count:
        return 'positive'
    else:
        return 'neutral'

def extract_conversation_topics(transcript: str) -> List[str]:
    """
    Extract key topics mentioned in conversation.

    Returns: List of topics (e.g., ["tee-time", "weekend", "pricing"])
    """
    transcript_lower = transcript.lower()
    topics = []

    # Topic keywords
    topic_map = {
        'tee-time': ['tee time', 'book', 'reservation'],
        'weekend': ['saturday', 'sunday', 'weekend'],
        'weekday': ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'weekday'],
        'pricing': ['price', 'cost', 'rate', 'fee', 'how much'],
        'restaurant': ['restaurant', 'menu', 'food', 'fox den'],
        'cart': ['cart', 'golf cart'],
        'event': ['wedding', 'event', 'party'],
        'lesson': ['lesson', 'instruction'],
        'hours': ['hours', 'open', 'close'],
        'directions': ['directions', 'address', 'location', 'how to get']
    }

    for topic, keywords in topic_map.items():
        if any(keyword in transcript_lower for keyword in keywords):
            topics.append(topic)

    return topics

def detect_conversation_outcome(transcript: str) -> str:
    """
    Detect conversation outcome: "booking-made", "question-answered",
    "callback-requested", "unresolved", etc.
    """
    transcript_lower = transcript.lower()

    if 'noted that down' in transcript_lower or 'confirm shortly' in transcript_lower:
        return 'booking-made'
    elif 'call you back' in transcript_lower or 'have someone reach out' in transcript_lower:
        return 'callback-requested'
    elif any(word in transcript_lower for word in ['thanks', 'got it', 'perfect']):
        return 'question-answered'
    else:
        return 'unresolved'
```

---

## Component 5: Embedding Generation & Storage

### Function: `generate_and_store_embedding()`

**Purpose**: Generate vector embedding for conversation, store in database for semantic search

**Input**:
- `conversation_id` (UUID): ID of conversation to embed
- `transcript` (str): Conversation text
- `summary` (str): Conversation summary

**Output**:
- `embedding` (list): 1536-dimensional vector

**Implementation**:

```python
from openai import OpenAI
from supabase import Client
from typing import List

def generate_and_store_embedding(
    supabase: Client,
    conversation_id: str,
    transcript: str,
    summary: str
):
    """
    Generate vector embedding for conversation using OpenAI API.
    Store embedding in conversations table for semantic search.

    This runs ASYNCHRONOUSLY after conversation ends (no latency impact).
    """

    # Initialize OpenAI client
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    # Combine summary + first 500 chars of transcript for embedding
    # (Summary captures key points, transcript provides details)
    text_to_embed = f"{summary}\n\n{transcript[:500]}"

    try:
        # Generate embedding
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text_to_embed,
            encoding_format="float"
        )

        embedding = response.data[0].embedding  # List of 1536 floats

        # Store embedding in database
        supabase.table('conversations') \
            .update({'embedding': embedding}) \
            .eq('id', conversation_id) \
            .execute()

        return embedding

    except Exception as e:
        # Log error but don't fail (embeddings are optional feature)
        print(f"Error generating embedding for conversation {conversation_id}: {e}")
        return None
```

**Why OpenAI Embeddings Instead of Claude?**
- **Cost**: $0.02 per million tokens vs Claude's $3 per million
- **Speed**: <100ms generation time
- **Quality**: High-quality embeddings optimized for semantic search
- **Standard dimensions**: 1536 works perfectly with pgvector

**When to Generate Embeddings**:
- **Asynchronously** after conversation ends (background job)
- **No latency impact** on customer experience
- **Not critical**: If embedding fails, conversation still stored (can regenerate later)

**Embedding Storage Format in PostgreSQL**:
```sql
-- Store as VECTOR(1536) type (pgvector extension)
UPDATE conversations
SET embedding = '[0.123, -0.456, 0.789, ...]'::vector
WHERE id = '...';
```

---

## Component 6: Semantic Search (V2 Feature)

### Function: `semantic_search_conversations()`

**Purpose**: Find conversations similar to a query (e.g., "all wedding inquiries")

**Input**:
- `query` (str): Natural language query (e.g., "wedding inquiries")
- `golf_course_id` (UUID): Limit to specific golf course
- `limit` (int): Number of results to return

**Output**:
- `conversations` (list): Ranked list of similar conversations

**Implementation**:

```python
from openai import OpenAI
from supabase import Client
from typing import List, Dict

def semantic_search_conversations(
    supabase: Client,
    query: str,
    golf_course_id: str,
    limit: int = 10
) -> List[Dict]:
    """
    Semantic search across conversations using vector similarity.

    Example queries:
    - "wedding inquiries"
    - "frustrated customers"
    - "tee time cancellations"
    - "pricing questions"

    Returns:
        List of conversations ranked by similarity
    """

    # Generate embedding for query
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=query
    )
    query_embedding = response.data[0].embedding

    # Query database for similar conversations
    # Using cosine similarity (1 - distance)
    result = supabase.rpc('search_conversations', {
        'query_embedding': query_embedding,
        'course_id': golf_course_id,
        'match_limit': limit
    }).execute()

    return result.data

# SQL function for vector similarity search
"""
CREATE OR REPLACE FUNCTION search_conversations(
    query_embedding VECTOR(1536),
    course_id UUID,
    match_limit INT
)
RETURNS TABLE (
    id UUID,
    transcript TEXT,
    summary TEXT,
    intent TEXT,
    created_at TIMESTAMPTZ,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.transcript,
        c.summary,
        c.intent,
        c.created_at,
        1 - (c.embedding <=> query_embedding) AS similarity
    FROM conversations c
    WHERE c.golf_course_id = course_id
        AND c.embedding IS NOT NULL
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_limit;
END;
$$;
"""
```

**Use Cases (V2)**:
- **Customer insights**: "Find all frustrated customers"
- **Training data**: "Find all tee time booking conversations"
- **Analytics**: "What are customers asking about weddings?"
- **Agent improvement**: "Find conversations where agent struggled"

---

## Memory System Performance Metrics

### Target Performance

| Operation | Target Latency | Actual (Expected) |
|-----------|----------------|-------------------|
| Identify/create caller | <50ms | ~30ms |
| Retrieve last 3 conversations | <100ms | ~40ms |
| Format conversation history | <10ms | ~5ms |
| Build system prompt | <20ms | ~10ms |
| Store conversation | <500ms | ~300ms |
| Generate embedding (async) | N/A (async) | ~200ms |
| Semantic search | <300ms | ~150ms |

**Total Memory System Overhead**: ~100ms per call (identify + retrieve + format)

**Optimization Strategies**:
1. **Database indexes**: Ensure idx_conversations_caller exists
2. **Connection pooling**: Reuse Supabase connections
3. **Caching**: Cache golf course data (rarely changes)
4. **Parallel queries**: Fetch caller + last 3 conversations in parallel
5. **Async embeddings**: Generate embeddings AFTER call ends (no blocking)

---

## Edge Cases & Error Handling

### Edge Case 1: First-Time Caller

**Scenario**: Phone number calls for the first time, no conversation history

**Handling**:
```python
conversation_history = retrieve_last_3_conversations(supabase, caller_id, golf_course_id)

if not conversation_history:
    history_text = "This is the customer's first conversation. No prior history."
else:
    history_text = format_conversation_history_for_prompt(conversation_history)
```

**Agent Behavior**:
- Greets warmly: "Thanks for calling Fox Hollow! How can I help you today?"
- No context references (since there's no history)
- May ask for name politely during conversation

### Edge Case 2: Interrupted Call

**Scenario**: Call drops mid-conversation, caller calls back 2 minutes later

**Handling**:
- Previous (incomplete) conversation stored with status='failed'
- When caller calls back, last 3 includes the incomplete conversation
- Agent can reference: "I see we got disconnected earlier. Let's pick up where we left off."

**Implementation**:
```python
# Store incomplete conversation with status='failed'
conversation = {
    'status': 'failed',  # Instead of 'completed'
    'transcript': partial_transcript,
    'summary': 'Call disconnected mid-conversation',
    # ... other fields
}
```

### Edge Case 3: Embedding Generation Failure

**Scenario**: OpenAI API error, rate limit, or network timeout

**Handling**:
```python
try:
    embedding = generate_and_store_embedding(supabase, conversation_id, transcript, summary)
except Exception as e:
    # Log error for later retry
    log_error(f"Embedding failed for conversation {conversation_id}: {e}")

    # Conversation still stored successfully (embedding is optional)
    # Can regenerate embeddings later via batch job
```

**Impact**: Conversation stored successfully, semantic search unavailable for this conversation until embedding regenerated

**Retry Strategy** (V2):
- Nightly batch job finds conversations without embeddings
- Regenerates embeddings for failed conversations
- Max 3 retry attempts, then mark as permanently failed

### Edge Case 4: Multiple Simultaneous Calls (Same Phone Number)

**Scenario**: Same phone number calls from 2 devices simultaneously (rare but possible)

**Handling**:
- Each call gets separate conversation record
- Both calls retrieve same last 3 conversations
- No collision (different conversation IDs)
- Chronological order maintained by timestamps

**Database Isolation**:
- PostgreSQL transaction isolation prevents race conditions
- Caller statistics (total_conversations) updated atomically

### Edge Case 5: Caller Name Unknown

**Scenario**: Caller never provided name, we only have phone number

**Handling**:
```python
caller_name = caller.get('first_name', '')

if caller_name:
    greeting = f"Welcome back, {caller_name}! How can I help you today?"
else:
    greeting = "Welcome back! How can I help you today?"
```

**Name Collection** (Optional):
- Agent can politely ask: "By the way, what's your name so I can better assist you?"
- Store in callers.first_name for future calls

### Edge Case 6: Very Long Transcript (>10,000 chars)

**Scenario**: Long, complex conversation with multiple topics

**Handling**:
- **Database**: PostgreSQL TEXT type handles unlimited length
- **Embedding**: Only embed summary + first 500 chars (full transcript too expensive)
- **Summary**: Claude can summarize long conversations efficiently
- **Display**: Truncate in UI, show "View Full Transcript" button (V2)

---

## Memory System Testing Scenarios

### Test Scenario 1: New Caller Journey

```
Test: First-time caller → Returning caller → Returning caller
Expected behavior:

Call 1 (Monday 9am):
- Caller: +15551234567
- System: Creates new caller account
- Conversation history: "This is the customer's first conversation."
- Agent: "Thanks for calling Fox Hollow! How can I help you today?"
- Stores conversation #1

Call 2 (Tuesday 3pm):
- Caller: +15551234567 (same number)
- System: Retrieves caller account
- Conversation history: Shows Monday's conversation
- Agent: "Welcome back! Last time we discussed tee times. How can I help today?"
- Stores conversation #2

Call 3 (Friday 11am):
- Caller: +15551234567
- System: Retrieves caller account
- Conversation history: Shows Monday + Tuesday conversations
- Agent: "Welcome back! I see you've been planning your golf outing. What can I help with?"
- Stores conversation #3

✅ PASS: Agent remembers caller across all 3 calls
✅ PASS: Conversation history grows naturally
✅ PASS: Agent references past conversations naturally
```

### Test Scenario 2: Multi-Call Memory Limit (Last 3)

```
Test: Caller makes 10 calls, verify only last 3 are retrieved

Calls 1-10 over 2 weeks:
- All 10 conversations stored permanently in database
- Last 3 conversations retrieved for context

Call 11:
- System retrieves conversations #10, #9, #8 (last 3)
- Conversations #1-#7 still in database, just not in active context
- Agent has recent context, full history available for semantic search (V2)

✅ PASS: All 10 conversations stored permanently
✅ PASS: Only last 3 retrieved (performance optimization)
✅ PASS: Older conversations still queryable via semantic search
```

### Test Scenario 3: Data Isolation

```
Test: Two callers, verify no cross-contamination

Caller A: +15551111111
- Conversation 1: "I want to book a tee time for Saturday"

Caller B: +15552222222
- Conversation 1: "What are your restaurant hours?"

Caller A calls back:
- Retrieves Caller A's history only
- Agent says: "Welcome back! Last time we discussed tee times."
- Does NOT mention restaurant hours (Caller B's conversation)

Caller B calls back:
- Retrieves Caller B's history only
- Agent says: "Welcome back! Last time you asked about restaurant hours."
- Does NOT mention tee times (Caller A's conversation)

✅ PASS: Perfect data isolation between callers
✅ PASS: RLS policies enforced at database level
✅ PASS: No cross-contamination of conversation history
```

### Test Scenario 4: Async Embedding Generation

```
Test: Verify embeddings generated without blocking call

Call ends at 10:00:00
- Conversation stored at 10:00:00.300 (300ms)
- Call marked as completed
- Customer hears "Thank you for calling!"

Background job:
- 10:00:01.000 (1 second later): Embedding generation starts
- 10:00:01.200 (1.2 seconds later): Embedding stored in database

Next call at 10:05:00:
- Retrieves last 3 conversations (including the one at 10:00:00)
- Conversation has embedding (ready for semantic search)

✅ PASS: Conversation stored immediately (no blocking)
✅ PASS: Embedding generated asynchronously
✅ PASS: No impact on call latency
```

---

## Memory System Code Integration Example

### Complete Flow in FastAPI

```python
from fastapi import FastAPI, Request
from twilio.twiml.voice_response import VoiceResponse
from supabase import create_client
import os

app = FastAPI()
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

@app.post("/webhook/voice")
async def handle_incoming_call(request: Request):
    """
    Twilio webhook handler for incoming voice calls.
    Demonstrates complete memory system integration.
    """

    # Parse Twilio request
    form_data = await request.form()
    caller_phone = form_data.get('From')  # E.164 format: +15551234567
    called_number = form_data.get('To')
    call_sid = form_data.get('CallSid')

    # Determine which golf course (based on called number)
    golf_course = get_golf_course_by_phone(supabase, called_number)

    # STEP 1: Identify or create caller
    caller = identify_or_create_caller(
        supabase,
        caller_phone,
        golf_course['id']
    )

    # STEP 2: Retrieve last 3 conversations
    conversation_history = retrieve_last_3_conversations(
        supabase,
        caller['id'],
        golf_course['id']
    )

    # STEP 3: Format conversation history for prompt
    history_text = format_conversation_history_for_prompt(conversation_history)

    # STEP 4: Build agent system prompt
    system_prompt = build_agent_system_prompt(
        golf_course,
        caller,
        history_text
    )

    # STEP 5: Initialize LangChain agent with system prompt
    # (LangChain integration detailed in LANGCHAIN_AGENT.md)
    agent = initialize_agent(system_prompt)

    # STEP 6: Handle voice conversation
    # (Voice pipeline detailed in VOICE_PIPELINE.md)
    response = VoiceResponse()
    response.say("Connecting you to our AI assistant...")
    # ... voice stream handling ...

    return str(response)

@app.post("/webhook/call-ended")
async def handle_call_ended(request: Request):
    """
    Twilio webhook for call completion.
    Store conversation and generate embedding.
    """

    form_data = await request.form()
    call_sid = form_data.get('CallSid')
    duration = int(form_data.get('CallDuration', 0))
    recording_url = form_data.get('RecordingUrl')

    # Get conversation transcript from session storage
    # (In production, this comes from Deepgram transcription stored during call)
    transcript = get_transcript_from_session(call_sid)
    caller_id = get_caller_id_from_session(call_sid)
    golf_course_id = get_golf_course_id_from_session(call_sid)

    # STEP 7: Store conversation
    conversation_id = store_conversation(
        supabase,
        caller_id,
        golf_course_id,
        channel='voice',
        transcript=transcript,
        metadata={
            'twilio_call_sid': call_sid,
            'call_duration_seconds': duration,
            'call_recording_url': recording_url,
            'started_at': get_call_start_time(call_sid),
            'ended_at': 'NOW()'
        }
    )

    # STEP 8: Generate embedding asynchronously
    # (Background job, no blocking)
    schedule_embedding_generation(conversation_id, transcript)

    return {"status": "success"}
```

---

## Next Steps

After this document is approved:
1. Create API_ENDPOINTS.md (FastAPI endpoints: /webhook/voice, /chat, /demo/create, etc.)
2. Create DEMO_GENERATOR_SPEC.md (custom demo creation flow)
3. Create VOICE_PIPELINE.md (Twilio → Deepgram → Agent → ElevenLabs integration)
4. Create LANGCHAIN_AGENT.md (agent configuration, conversation chains, prompt templates)

---

**Document Status**: Draft v1.0
**Last Updated**: 2025-10-28
**Next Review**: After approval and before API_ENDPOINTS.md creation
