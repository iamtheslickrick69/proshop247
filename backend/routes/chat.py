"""
Chat API routes
Handles text-based conversations with the AI agent
"""
from fastapi import APIRouter, HTTPException, Request
from supabase import create_client
from typing import Dict
import uuid

from models.schemas import ChatRequest, ChatResponse
from services.agent import create_demo_agent, create_production_agent
from services.memory import (
    identify_or_create_caller,
    get_recent_conversations,
    store_conversation,
    build_context_string
)
from config.settings import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

router = APIRouter()

# Initialize Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# In-memory session storage (for demo - in production use Redis)
# Maps session_id -> agent instance
active_sessions: Dict[str, any] = {}


@router.post("/chat", response_model=ChatResponse)
async def handle_chat(request: Request, chat_request: ChatRequest):
    """
    Handle text chat with AI agent.

    Supports two modes:
    1. Demo mode: context.demo_slug = "fox-hollow" or other demo
    2. Production mode: context.phone_number + context.golf_course_id
    """
    try:
        session_id = chat_request.session_id
        message = chat_request.message
        context = chat_request.context or {}

        # Determine mode: demo or production
        demo_slug = context.get('demo_slug')
        phone_number = context.get('phone_number')
        golf_course_id = context.get('golf_course_id')

        if demo_slug:
            # DEMO MODE
            response_data = await handle_demo_chat(
                session_id, message, demo_slug
            )
            return response_data

        elif phone_number and golf_course_id:
            # PRODUCTION MODE
            response_data = await handle_production_chat(
                session_id, message, phone_number, golf_course_id
            )
            return response_data

        else:
            raise HTTPException(
                status_code=400,
                detail="Must provide either demo_slug or (phone_number + golf_course_id)"
            )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in chat endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


async def handle_demo_chat(session_id: str, message: str, demo_slug: str) -> ChatResponse:
    """
    Handle demo mode chat.
    Uses demo_courses table, tracks interaction limits.
    """
    # Get demo course
    response = supabase.table('demo_courses') \
        .select('*') \
        .eq('slug', demo_slug) \
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail=f"Demo not found: {demo_slug}")

    demo_course = response.data[0]

    # Check interaction limit
    if demo_course['interaction_count'] >= demo_course['interaction_limit']:
        raise HTTPException(
            status_code=429,
            detail=f"Demo limit reached ({demo_course['interaction_limit']} interactions). Contact us to unlock full version!"
        )

    # Get or create agent for this session
    if session_id not in active_sessions:
        agent = create_demo_agent(demo_course)
        active_sessions[session_id] = agent
        print(f"✨ New demo session created: {session_id}")
    else:
        agent = active_sessions[session_id]
        print(f"♻️ Reusing existing session: {session_id}")

    # Get agent response
    try:
        response = agent.invoke({"input": message})

        # Extract response text
        if isinstance(response, dict):
            response_text = response.get('response', str(response))
        else:
            response_text = str(response)
    except Exception as e:
        print(f"❌ Agent error: {e}")
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")

    # Record interaction
    interaction = {
        'demo_course_id': demo_course['id'],
        'channel': 'text-chat',
        'transcript': f"User: {message}\nAgent: {response_text}",
        'session_id': session_id
    }

    supabase.table('demo_interactions').insert(interaction).execute()
    print(f"📝 Demo interaction recorded (count: {demo_course['interaction_count'] + 1})")

    # Get updated count (trigger increments it automatically)
    updated_course = supabase.table('demo_courses') \
        .select('interaction_count, interaction_limit') \
        .eq('id', demo_course['id']) \
        .execute()

    new_count = updated_course.data[0]['interaction_count']
    limit = updated_course.data[0]['interaction_limit']

    return ChatResponse(
        response=response_text,
        session_id=session_id,
        interaction_count=new_count,
        interaction_limit=limit
    )


async def handle_production_chat(
    session_id: str,
    message: str,
    phone_number: str,
    golf_course_id: str
) -> ChatResponse:
    """
    Handle production mode chat.
    Uses full memory system, stores conversations permanently.
    """
    # Get golf course
    response = supabase.table('golf_courses') \
        .select('*') \
        .eq('id', golf_course_id) \
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail=f"Golf course not found")

    golf_course = response.data[0]

    # Identify or create caller
    caller = identify_or_create_caller(supabase, phone_number, golf_course_id)

    # Get conversation history
    recent_conversations = get_recent_conversations(supabase, caller['id'], limit=3)
    conversation_history = build_context_string(recent_conversations)

    # Get or create agent for this session
    if session_id not in active_sessions:
        agent = create_production_agent(golf_course, caller, conversation_history)
        active_sessions[session_id] = agent
        print(f"✨ New production session created: {session_id}")
    else:
        agent = active_sessions[session_id]
        print(f"♻️ Reusing existing session: {session_id}")

    # Get agent response
    try:
        response = agent.invoke({"input": message})

        # Extract response text
        if isinstance(response, dict):
            response_text = response.get('response', str(response))
        else:
            response_text = str(response)
    except Exception as e:
        print(f"❌ Agent error: {e}")
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")

    # Store conversation
    transcript = f"User: {message}\nAgent: {response_text}"
    store_conversation(
        supabase=supabase,
        caller_id=caller['id'],
        golf_course_id=golf_course_id,
        transcript=transcript,
        channel='text-chat'
    )

    print(f"💾 Production conversation stored for caller {caller['id']}")

    return ChatResponse(
        response=response_text,
        session_id=session_id
    )
