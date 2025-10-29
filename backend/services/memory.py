"""
Memory System - Conversation history management
Implements the two-tier memory strategy:
1. Store ALL conversations permanently
2. Retrieve last 3 for context injection
"""
from typing import Dict, List, Optional
from datetime import datetime
from supabase import Client
import openai
from config.settings import OPENAI_API_KEY

# Initialize OpenAI client for embeddings
openai.api_key = OPENAI_API_KEY


def identify_or_create_caller(
    supabase: Client,
    phone_number: str,
    golf_course_id: str
) -> Dict:
    """
    Auto-create caller account if first time, or retrieve existing caller.
    Zero-friction account creation!

    Args:
        supabase: Supabase client
        phone_number: Caller's phone number (unique identifier)
        golf_course_id: Which golf course they're calling

    Returns:
        Caller record dictionary
    """
    # Try to find existing caller
    response = supabase.table('callers') \
        .select('*') \
        .eq('phone_number', phone_number) \
        .eq('golf_course_id', golf_course_id) \
        .execute()

    if response.data:
        # Existing caller found - update last_seen
        caller = response.data[0]
        supabase.table('callers') \
            .update({'last_seen': datetime.now().isoformat()}) \
            .eq('id', caller['id']) \
            .execute()

        print(f"✅ Returning caller identified: {phone_number} (ID: {caller['id']})")
        return caller

    # New caller - create account automatically
    new_caller = {
        'phone_number': phone_number,
        'golf_course_id': golf_course_id,
        'total_conversations': 0,
        'preferences': {}
    }

    result = supabase.table('callers').insert(new_caller).execute()
    caller = result.data[0]

    print(f"🆕 New caller auto-created: {phone_number} (ID: {caller['id']})")
    return caller


def get_recent_conversations(
    supabase: Client,
    caller_id: str,
    limit: int = 3
) -> List[Dict]:
    """
    Retrieve the last N conversations for this caller.
    Core of our memory strategy: Last 3 conversations = short-term memory.

    Args:
        supabase: Supabase client
        caller_id: UUID of the caller
        limit: How many recent conversations to retrieve (default: 3)

    Returns:
        List of conversation dictionaries, newest first
    """
    response = supabase.table('conversations') \
        .select('*') \
        .eq('caller_id', caller_id) \
        .order('created_at', desc=True) \
        .limit(limit) \
        .execute()

    conversations = response.data
    print(f"📚 Retrieved {len(conversations)} recent conversations for caller {caller_id}")

    return conversations


def store_conversation(
    supabase: Client,
    caller_id: str,
    golf_course_id: str,
    transcript: str,
    channel: str = 'voice',
    summary: Optional[str] = None,
    intent: Optional[str] = None,
    sentiment: Optional[str] = None,
    booking_made: bool = False,
    duration_seconds: Optional[int] = None
) -> Dict:
    """
    Store a new conversation permanently.
    Generates embedding for future semantic search.

    Args:
        supabase: Supabase client
        caller_id: UUID of the caller
        golf_course_id: UUID of the golf course
        transcript: Full conversation text
        channel: 'voice', 'text-chat', or 'sms'
        summary: Optional AI-generated summary
        intent: Optional detected intent (e.g., "booking", "pricing_inquiry")
        sentiment: Optional sentiment analysis result
        booking_made: Whether a booking was made
        duration_seconds: Call duration (for voice)

    Returns:
        Created conversation record
    """
    # Generate embedding for semantic search
    embedding = generate_embedding(transcript)

    conversation = {
        'caller_id': caller_id,
        'golf_course_id': golf_course_id,
        'transcript': transcript,
        'channel': channel,
        'summary': summary,
        'intent': intent,
        'sentiment': sentiment,
        'booking_made': booking_made,
        'duration_seconds': duration_seconds,
        'embedding': embedding
    }

    result = supabase.table('conversations').insert(conversation).execute()
    stored = result.data[0]

    print(f"💾 Conversation stored (ID: {stored['id']}, channel: {channel})")
    return stored


def generate_embedding(text: str) -> List[float]:
    """
    Generate OpenAI embedding for semantic search.
    Uses text-embedding-3-small ($0.02/1M tokens).

    Args:
        text: Text to embed

    Returns:
        1536-dimensional embedding vector
    """
    try:
        response = openai.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        embedding = response.data[0].embedding
        print(f"🔢 Generated embedding (dim: {len(embedding)})")
        return embedding
    except Exception as e:
        print(f"⚠️ Error generating embedding: {e}")
        # Return zero vector as fallback
        return [0.0] * 1536


def build_context_string(conversations: List[Dict]) -> str:
    """
    Format recent conversations into natural language context for the agent.

    Args:
        conversations: List of conversation dictionaries (newest first)

    Returns:
        Formatted context string for LLM injection
    """
    if not conversations:
        return "No previous conversations."

    # Reverse to show oldest → newest
    conversations = list(reversed(conversations))

    context_parts = []
    for i, conv in enumerate(conversations, 1):
        created_at = conv['created_at']
        channel = conv['channel']

        # Format timestamp
        try:
            dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            time_str = dt.strftime("%B %d at %I:%M %p")
        except:
            time_str = created_at

        # Add conversation with metadata
        summary = conv.get('summary') or conv['transcript'][:200] + "..."

        context_parts.append(
            f"**Conversation {i}** ({time_str} via {channel}):\n{summary}"
        )

    context_string = "\n\n".join(context_parts)
    print(f"📝 Built context string ({len(context_string)} chars)")

    return context_string


def retrieve_relevant_memories(
    supabase: Client,
    caller_id: str,
    query_text: str,
    limit: int = 5
) -> List[Dict]:
    """
    Semantic search for relevant past conversations.
    Uses pgvector cosine similarity on embeddings.

    This is for FUTURE enhancement - not used in MVP.
    MVP uses simple "last 3" strategy.

    Args:
        supabase: Supabase client
        caller_id: UUID of the caller
        query_text: Current user message to find similar past conversations
        limit: How many relevant memories to retrieve

    Returns:
        List of relevant conversation dictionaries
    """
    # Generate embedding for query
    query_embedding = generate_embedding(query_text)

    # Supabase vector search
    # Note: This requires a stored procedure in Supabase for vector similarity
    # For MVP, we're using the simpler "last 3" approach instead

    response = supabase.rpc(
        'match_conversations',
        {
            'query_embedding': query_embedding,
            'match_threshold': 0.7,
            'match_count': limit,
            'p_caller_id': caller_id
        }
    ).execute()

    memories = response.data
    print(f"🔍 Found {len(memories)} semantically relevant memories")

    return memories


# Optional: Create the RPC function for vector search
# Run this SQL in Supabase to enable retrieve_relevant_memories():
"""
CREATE OR REPLACE FUNCTION match_conversations(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  p_caller_id UUID
)
RETURNS TABLE (
  id UUID,
  transcript TEXT,
  summary TEXT,
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
    c.created_at,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM conversations c
  WHERE c.caller_id = p_caller_id
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
"""
