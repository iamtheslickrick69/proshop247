"""
LangChain Agent - AI conversation handler
Uses Claude Sonnet 4.5 with conversation memory
"""
from typing import Dict, Optional
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from config.settings import ANTHROPIC_API_KEY


def build_production_agent_prompt(
    golf_course: Dict,
    caller: Dict,
    conversation_history: str
) -> str:
    """
    Build system prompt for production golf course agent.

    Args:
        golf_course: Golf course data from database
        caller: Caller data from database
        conversation_history: Formatted string of recent conversations

    Returns:
        Complete system prompt string
    """
    prompt = f"""You are the AI receptionist for {golf_course['name']}, located in {golf_course.get('location', 'our location')}.

Your role is to assist callers with:
- Booking tee times
- Answering questions about pricing, hours, and amenities
- Providing course information
- Handling cancellations and changes

**Golf Course Information:**
- Name: {golf_course['name']}
- Location: {golf_course.get('location', 'N/A')}
- Phone: {golf_course.get('phone_number', 'N/A')}
- Website: {golf_course.get('website_url', 'N/A')}

**Hours of Operation:**
{format_hours(golf_course.get('hours_of_operation', {}))}

**Pricing:**
{format_pricing(golf_course.get('pricing', {}))}

**Amenities:**
{', '.join(golf_course.get('amenities', []))}

**Policies:**
{format_policies(golf_course.get('policies', {}))}

**Special Notes:**
{golf_course.get('special_notes', 'None')}

**Caller Information:**
- Phone: {caller.get('phone_number', 'Unknown')}
- Name: {caller.get('first_name', '')} {caller.get('last_name', '')}
- Total Previous Calls: {caller.get('total_conversations', 0)}

**Conversation History:**
{conversation_history}

**Instructions:**
1. Be warm, professional, and helpful
2. Reference previous conversations naturally when relevant
3. For bookings, collect: date, time, number of players, cart preference
4. If you can't help with something, offer to transfer to the pro shop
5. Keep responses concise (2-3 sentences max for voice calls)
6. Use natural, conversational language - not robotic
7. Proactively suggest relevant information (e.g., mention twilight pricing if calling late afternoon)

**Remember:** You're having a real-time voice conversation. Keep it natural and friendly!"""

    return prompt


def build_demo_agent_prompt(demo_course: Dict) -> str:
    """
    Build system prompt for demo mode agent.

    Args:
        demo_course: Demo course data from database

    Returns:
        Complete system prompt string
    """
    scraped_data = demo_course.get('scraped_data', {})
    ai_data = demo_course.get('ai_processed_data', {})

    prompt = f"""You are an AI receptionist demo for {demo_course['name']}.

This is a DEMONSTRATION to show the capabilities of ProShop 24/7 AI voice agents.

**Course Information (from website):**
- Name: {demo_course['name']}
- Location: {demo_course.get('location', 'Location not specified')}
- Website: {demo_course.get('website_url', 'N/A')}

**Available Information:**
{format_demo_data(scraped_data, ai_data)}

**Demo Instructions:**
1. Answer questions based on available information
2. If information isn't available, politely say: "I don't have that specific information in this demo, but the full version would have complete details."
3. Highlight features: "This demo shows how I can handle bookings, answer questions, and remember conversations"
4. Keep responses natural and conversational
5. After 3-4 exchanges, suggest: "Would you like to see how I handle bookings?" or similar

**Remember:** This is a demonstration. Be helpful but also showcase the technology!

**Interaction Count:** {demo_course.get('interaction_count', 0)} / {demo_course.get('interaction_limit', 25)}
{get_demo_limit_message(demo_course)}"""

    return prompt


def create_production_agent(
    golf_course: Dict,
    caller: Dict,
    conversation_history: str
) -> ConversationChain:
    """
    Create LangChain agent for production golf course.

    Args:
        golf_course: Golf course data
        caller: Caller data
        conversation_history: Formatted conversation history

    Returns:
        Configured ConversationChain
    """
    # Build system prompt
    system_prompt = build_production_agent_prompt(
        golf_course, caller, conversation_history
    )

    # Initialize Claude Sonnet 4.5
    llm = ChatAnthropic(
        model="claude-sonnet-4-5-20250929",
        temperature=0.7,
        max_tokens=512,
        anthropic_api_key=ANTHROPIC_API_KEY,
        streaming=True
    )

    # Create prompt template
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{input}")
    ])

    # Create conversation memory
    memory = ConversationBufferMemory(
        memory_key="history",
        return_messages=True
    )

    # Create chain
    chain = ConversationChain(
        llm=llm,
        prompt=prompt_template,
        memory=memory,
        verbose=False
    )

    print(f"🤖 Production agent created for {golf_course['name']}")
    return chain


def create_demo_agent(demo_course: Dict) -> ConversationChain:
    """
    Create LangChain agent for demo mode.

    Args:
        demo_course: Demo course data

    Returns:
        Configured ConversationChain
    """
    # Build system prompt
    system_prompt = build_demo_agent_prompt(demo_course)

    # Initialize Claude Sonnet 4.5
    llm = ChatAnthropic(
        model="claude-sonnet-4-5-20250929",
        temperature=0.7,
        max_tokens=512,
        anthropic_api_key=ANTHROPIC_API_KEY,
        streaming=True
    )

    # Create prompt template
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{input}")
    ])

    # Create conversation memory
    memory = ConversationBufferMemory(
        memory_key="history",
        return_messages=True
    )

    # Create chain
    chain = ConversationChain(
        llm=llm,
        prompt=prompt_template,
        memory=memory,
        verbose=False
    )

    print(f"🎭 Demo agent created for {demo_course['name']}")
    return chain


# Helper functions for formatting

def format_hours(hours: Dict) -> str:
    """Format hours of operation dictionary into readable string"""
    if not hours:
        return "Hours not specified"

    lines = []
    for day, times in hours.items():
        if isinstance(times, dict):
            open_time = times.get('open', 'N/A')
            close_time = times.get('close', 'N/A')
            lines.append(f"{day.capitalize()}: {open_time} - {close_time}")

    return "\n".join(lines) if lines else "Hours not specified"


def format_pricing(pricing: Dict) -> str:
    """Format pricing dictionary into readable string"""
    if not pricing:
        return "Pricing not specified"

    lines = []
    for category, prices in pricing.items():
        if isinstance(prices, dict):
            lines.append(f"{category.replace('_', ' ').title()}:")
            for item, price in prices.items():
                lines.append(f"  - {item.replace('_', ' ').title()}: ${price}")
        else:
            lines.append(f"{category.replace('_', ' ').title()}: ${prices}")

    return "\n".join(lines) if lines else "Pricing not specified"


def format_policies(policies: Dict) -> str:
    """Format policies dictionary into readable string"""
    if not policies:
        return "No specific policies"

    lines = []
    for policy_name, policy_text in policies.items():
        lines.append(f"**{policy_name.replace('_', ' ').title()}:** {policy_text}")

    return "\n".join(lines)


def format_demo_data(scraped_data: Dict, ai_data: Dict) -> str:
    """Format demo data into readable string"""
    parts = []

    if scraped_data:
        parts.append("**Scraped from website:**")
        for key, value in scraped_data.items():
            parts.append(f"- {key}: {value}")

    if ai_data:
        parts.append("\n**AI-processed information:**")
        for key, value in ai_data.items():
            if isinstance(value, list):
                parts.append(f"- {key}: {', '.join(str(v) for v in value)}")
            else:
                parts.append(f"- {key}: {value}")

    return "\n".join(parts) if parts else "Limited information available for this demo"


def get_demo_limit_message(demo_course: Dict) -> str:
    """Get appropriate message based on demo interaction limit"""
    count = demo_course.get('interaction_count', 0)
    limit = demo_course.get('interaction_limit', 25)

    remaining = limit - count

    if remaining <= 0:
        return "\n\n⚠️ DEMO LIMIT REACHED - Politely inform the user they've used all free interactions."
    elif remaining <= 5:
        return f"\n\n⚠️ Only {remaining} interactions remaining in this demo."
    else:
        return ""
