# ProShop 24/7 - LangChain Agent Specification

## Document Overview

This document defines the LangChain agent configuration - the "brain" of ProShop 24/7. The agent orchestrates conversation flow, maintains context, and generates natural responses using Claude Sonnet 4.5. This specification covers system prompts, conversation chains, memory integration, and response optimization.

---

## LangChain Architecture Overview

### Why LangChain?

**LangChain Benefits**:
- Abstracts LLM interaction complexity
- Built-in conversation memory management
- Chain composition for multi-step reasoning
- Tool/function calling support (for future booking integration)
- Easy to swap LLMs (Claude → GPT-4 if needed)

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER MESSAGE                              │
│          "I'd like to book a tee time for Saturday"         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                ┌─────────────────────┐
                │  ConversationChain  │
                │    (LangChain)      │
                └─────────┬───────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
┌─────────────────┐ ┌─────────────┐ ┌──────────────┐
│  System Prompt  │ │  Chat Model │ │  Memory      │
│  (Dynamic)      │ │  (Claude)   │ │  (Last 3)    │
│                 │ │             │ │              │
│ Golf course data│ │ Sonnet 4.5  │ │ Conversation │
│ Conversation    │ │ 200K ctx    │ │ history      │
│ history (last 3)│ │ Streaming   │ │ from DB      │
└─────────────────┘ └─────────────┘ └──────────────┘
         │                │                │
         └────────────────┼────────────────┘
                          │
                          ▼
                ┌─────────────────────┐
                │  AGENT RESPONSE     │
                │  "I'd be happy to   │
                │  help! What time    │
                │  works for you?"    │
                └─────────────────────┘
```

### Key Components

1. **ChatAnthropic** - Claude Sonnet 4.5 LLM wrapper
2. **ConversationChain** - Manages conversation flow
3. **ConversationBufferMemory** - Short-term conversation memory (current call)
4. **PromptTemplate** - Dynamic system prompt generation
5. **Callbacks** - Streaming, logging, latency tracking

---

## System Prompt Templates

### Production Agent Prompt Template

```python
PRODUCTION_AGENT_TEMPLATE = """You are an AI phone assistant for {course_name}, a golf course located in {location}.

ROLE: You answer phone calls and help customers with tee times, restaurant reservations, event inquiries, and general information about the course.

PERSONALITY: {personality}
- Be warm, friendly, and professional
- Sound like a helpful staff member at the course
- Keep responses conversational and concise (2-3 sentences maximum)
- Use natural language, avoid robotic or overly formal speech

COURSE INFORMATION:
{course_info}

CUSTOMER INFORMATION:
- Phone Number: {caller_phone}
- Name: {caller_name}
- Previous Conversations: {total_conversations}

{conversation_history}

IMPORTANT INSTRUCTIONS:

1. **Reference Past Conversations Naturally**
   - If this is a returning customer, acknowledge it warmly
   - Reference relevant past interactions when appropriate
   - Example: "Welcome back! Last time we discussed your Saturday tee time."

2. **Be Helpful But Honest**
   - If you don't have specific information, say so politely
   - Offer to have a staff member call them back for complex questions
   - Example: "I don't have the exact availability right now, but I can have someone call you back within the hour."

3. **Confirm Important Details**
   - Always repeat back critical information (dates, times, party size)
   - Example: "Just to confirm, that's Saturday, May 4th at 9:15am for 4 players, correct?"

4. **Handle Bookings Appropriately**
   - For tee time or restaurant bookings, say: "I've noted that down and someone from our team will call you shortly to confirm."
   - Don't make firm commitments (you can't actually book yet)

5. **Be Concise**
   - Keep responses under 3 sentences
   - Get to the point quickly
   - If caller asks multiple questions, address them in order

6. **Natural Conversation Flow**
   - Use conversational fillers when appropriate: "Sure!", "Absolutely!", "Great question!"
   - Acknowledge what they said before responding
   - End with a question if more info is needed

EXAMPLE INTERACTIONS:

Customer: "What are your hours?"
You: "We're open Monday through Friday from 7am to 8pm, and weekends from 6am to 9pm. Would you like to book a tee time?"

Customer: "How much for 18 holes on Saturday?"
You: "Our weekend rate is $45 for 18 holes, plus $18 if you'd like to rent a cart. What time were you thinking?"

Customer: "I'd like to book a tee time."
You: "I'd be happy to help! What day and time work best for you?"

CURRENT CONVERSATION:
Human: {input}
Assistant:"""

def build_production_agent_prompt(
    golf_course: dict,
    caller: dict,
    conversation_history: str
) -> str:
    """
    Build dynamic system prompt for production agent.
    """

    # Format course information
    course_info = f"""- Name: {golf_course['name']}
- Location: {golf_course['location']}
- Phone: {golf_course.get('phone_number', 'Not specified')}
- Website: {golf_course.get('website_url', 'Not specified')}

Operating Hours:
{format_hours(golf_course.get('operating_hours', {}))}

Pricing:
{format_pricing(golf_course.get('pricing_structure', {}))}

Services & Amenities:
{format_services(golf_course.get('services', []))}

Restaurant Menu Highlights:
{format_menu_highlights(golf_course.get('menu_data', {}))}

Course Details:
{format_scorecard_summary(golf_course.get('scorecard_data', {}))}"""

    # Build prompt
    prompt = PRODUCTION_AGENT_TEMPLATE.format(
        course_name=golf_course['name'],
        location=golf_course['location'],
        personality=golf_course.get('agent_personality', 'friendly').title(),
        course_info=course_info,
        caller_phone=caller['phone_number'],
        caller_name=caller.get('first_name', 'Unknown'),
        total_conversations=caller['total_conversations'],
        conversation_history=conversation_history,
        input="{input}"  # Placeholder for LangChain
    )

    return prompt
```

### Demo Agent Prompt Template

```python
DEMO_AGENT_TEMPLATE = """You are an AI assistant demonstrating ProShop 24/7's capabilities for {course_name}, a golf course in {location}.

**IMPORTANT: THIS IS A DEMO**
You are showcasing what ProShop 24/7 can do for golf courses. Be enthusiastic and helpful!

ROLE: Help with tee time inquiries, restaurant questions, event information, and general course details.

PERSONALITY: Friendly and Professional
- Be warm and welcoming
- Show off your knowledge of the course
- Keep responses concise (2-3 sentences)
- Occasionally mention this is a demo of ProShop 24/7

DEMO COURSE INFORMATION:
{course_info}

DEMO FEATURES TO HIGHLIGHT:
- 24/7 availability (never miss a booking)
- Natural conversation (sounds human)
- Instant answers (no hold times)
- Remembers customers (when in production)

INSTRUCTIONS:

1. **Be Helpful & Demonstrate Capabilities**
   - Answer questions accurately using the course data provided
   - If specific information is missing, acknowledge it politely
   - Example: "Based on the information I have, our hours are 7am-7pm daily. For more specific details, a staff member can follow up!"

2. **Occasionally Mention Demo Context**
   - Every few messages, subtly reference the demo
   - Example: "This is just a demo, but in production, I'd remember all your preferences!"

3. **Handle Bookings Appropriately**
   - For bookings, say: "In production, I'd note this down and have someone confirm shortly. Pretty cool, right?"

4. **Be Enthusiastic**
   - Show excitement about the technology
   - Example: "I can answer questions 24/7, even at 2am! How can I help you today?"

5. **Keep It Concise**
   - 2-3 sentences maximum per response
   - Get to the point quickly

EXAMPLE INTERACTIONS:

Customer: "What are your hours?"
You: "We're open 7am to 7pm daily! I can answer questions anytime though - even at midnight. What else would you like to know?"

Customer: "How much for a tee time?"
You: "Weekend rates are $50 for 18 holes, plus $18 for a cart. When were you thinking of playing?"

Customer: "I want to book a tee time."
You: "Awesome! In production, I'd take all your details and have someone confirm within minutes. What day and time work for you?"

CURRENT CONVERSATION:
Human: {input}
Assistant:"""

def build_demo_agent_prompt(demo_course: dict) -> str:
    """
    Build dynamic system prompt for demo agent.
    """

    # Format course information
    course_info = f"""- Name: {demo_course['name']}
- Location: {demo_course['location']}
- Website: {demo_course.get('website_url', 'Not specified')}
- Operating Hours: {demo_course.get('operating_hours', 'Not specified')}
- Services: {', '.join(demo_course.get('services', []))}

"""

    # Add scraped data if available
    if demo_course.get('scraped_data'):
        scraped = demo_course['scraped_data']
        if scraped.get('hours'):
            course_info += f"Detailed Hours: {scraped['hours']}\n"
        if scraped.get('pricing'):
            course_info += f"Pricing Details: {scraped['pricing']}\n"

    # Add menu data if available
    if demo_course.get('menu_data'):
        course_info += "\nRestaurant Menu Highlights:\n"
        menu = demo_course['menu_data']
        if menu.get('categories'):
            for category, items in list(menu['categories'].items())[:2]:  # First 2 categories
                course_info += f"  {category.title()}: "
                item_names = [item['name'] for item in items[:3]]  # First 3 items
                course_info += ", ".join(item_names) + "\n"

    # Add scorecard data if available
    if demo_course.get('scorecard_data'):
        scorecard = demo_course['scorecard_data']
        course_info += f"\nCourse: Par {scorecard.get('total_par', '72')}, {scorecard.get('total_yardage', '6800')} yards\n"

    # Build prompt
    prompt = DEMO_AGENT_TEMPLATE.format(
        course_name=demo_course['name'],
        location=demo_course['location'],
        course_info=course_info,
        input="{input}"  # Placeholder for LangChain
    )

    return prompt
```

---

## LangChain Agent Configuration

### Production Agent Setup

```python
from langchain.chat_models import ChatAnthropic
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from typing import Dict

def create_production_agent(
    golf_course: Dict,
    caller: Dict,
    conversation_history: str
) -> ConversationChain:
    """
    Create LangChain agent for production use.

    Returns:
        Configured ConversationChain
    """

    # Build system prompt
    system_prompt = build_production_agent_prompt(
        golf_course,
        caller,
        conversation_history
    )

    # Create prompt template
    prompt = PromptTemplate(
        input_variables=["input"],
        template=system_prompt
    )

    # Initialize Claude LLM
    llm = ChatAnthropic(
        model="claude-sonnet-4-5-20250929",
        temperature=0.7,  # Slightly creative but consistent
        max_tokens=512,   # Limit response length (concise)
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
        streaming=True,   # Enable streaming for lower latency
        callbacks=[StreamingStdOutCallbackHandler()]  # Log streaming output
    )

    # Create conversation memory (for current call only)
    memory = ConversationBufferMemory(
        memory_key="history",
        return_messages=True,
        ai_prefix="Assistant",
        human_prefix="Customer"
    )

    # Create conversation chain
    agent = ConversationChain(
        llm=llm,
        prompt=prompt,
        memory=memory,
        verbose=True  # Log for debugging (disable in production)
    )

    return agent
```

### Demo Agent Setup

```python
def create_demo_agent(demo_course: Dict) -> ConversationChain:
    """
    Create LangChain agent for demo use.

    Simpler than production (no conversation history, no caller tracking).
    """

    # Build system prompt
    system_prompt = build_demo_agent_prompt(demo_course)

    # Create prompt template
    prompt = PromptTemplate(
        input_variables=["input"],
        template=system_prompt
    )

    # Initialize Claude LLM (same config as production)
    llm = ChatAnthropic(
        model="claude-sonnet-4-5-20250929",
        temperature=0.7,
        max_tokens=512,
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
        streaming=True
    )

    # Create conversation memory (for demo session only)
    memory = ConversationBufferMemory(
        memory_key="history",
        return_messages=True
    )

    # Create conversation chain
    agent = ConversationChain(
        llm=llm,
        prompt=prompt,
        memory=memory,
        verbose=False  # Less logging for demos
    )

    return agent
```

---

## Memory Integration

### How Memory Works

**Two Types of Memory**:

1. **Short-term (ConversationBufferMemory)**
   - Stores current call's conversation
   - Managed by LangChain automatically
   - Cleared when call ends
   - Used for: "As I mentioned earlier in this call..."

2. **Long-term (Supabase Database)**
   - Stores all conversations permanently
   - Retrieved manually (last 3 conversations)
   - Injected into system prompt
   - Used for: "Welcome back! Last week you asked about..."

### Memory Flow

```python
# BEFORE CALL STARTS
# 1. Retrieve last 3 conversations from database
conversation_history = retrieve_last_3_conversations(caller_id, golf_course_id)

# 2. Format for prompt injection
history_text = format_conversation_history_for_prompt(conversation_history)

# 3. Build system prompt with history
system_prompt = build_production_agent_prompt(
    golf_course,
    caller,
    history_text  # ← Long-term memory injected here
)

# 4. Create agent with short-term memory
agent = create_production_agent(golf_course, caller, history_text)


# DURING CALL
# 5. ConversationBufferMemory automatically tracks current conversation
user_message = "I'd like to book a tee time"
agent_response = agent.run(user_message)  # LangChain adds to memory automatically

# Later in same call:
user_message = "What time did we say?"
agent_response = agent.run(user_message)  # Agent remembers from ConversationBufferMemory


# AFTER CALL ENDS
# 6. Store full conversation in database
store_conversation(caller_id, golf_course_id, full_transcript)

# 7. Next time caller calls, their new conversation will be in "last 3"
```

---

## Helper Functions

### Format Functions for Prompt Building

```python
def format_hours(hours: dict) -> str:
    """Format operating hours dict into readable text"""
    if not hours:
        return "Please call for current hours"

    formatted = []
    for day, time in hours.items():
        formatted.append(f"  {day.title()}: {time}")

    return "\n".join(formatted)

def format_pricing(pricing: dict) -> str:
    """Format pricing dict into readable text"""
    if not pricing:
        return "Please call for current rates"

    formatted = []
    if 'weekday' in pricing:
        formatted.append(f"  Weekday: ${pricing['weekday']}")
    if 'weekend' in pricing:
        formatted.append(f"  Weekend: ${pricing['weekend']}")
    if 'twilight' in pricing:
        formatted.append(f"  Twilight: ${pricing['twilight']}")
    if 'cart' in pricing:
        formatted.append(f"  Cart Rental: ${pricing['cart']}")

    return "\n".join(formatted)

def format_services(services: list) -> str:
    """Format services list into readable text"""
    if not services:
        return "18-hole golf course"

    return "\n".join([f"  - {service}" for service in services])

def format_menu_highlights(menu_data: dict) -> str:
    """Format menu highlights (top items from each category)"""
    if not menu_data or not menu_data.get('categories'):
        return "Restaurant available on-site"

    highlights = []
    for category, items in list(menu_data['categories'].items())[:3]:  # First 3 categories
        if items:
            top_items = [f"{item['name']} (${item['price']})" for item in items[:2]]  # Top 2 per category
            highlights.append(f"  {category.title()}: {', '.join(top_items)}")

    return "\n".join(highlights) if highlights else "Full menu available"

def format_scorecard_summary(scorecard_data: dict) -> str:
    """Format scorecard summary"""
    if not scorecard_data:
        return "18-hole championship course"

    total_par = scorecard_data.get('total_par', 72)
    total_yardage = scorecard_data.get('total_yardage', 6800)
    rating = scorecard_data.get('course_rating')
    slope = scorecard_data.get('slope')

    summary = f"  Par {total_par}, {total_yardage} yards"
    if rating and slope:
        summary += f"\n  Rating: {rating}, Slope: {slope}"

    return summary
```

---

## Agent Response Optimization

### Token Usage Optimization

**Goal**: Keep responses under 512 tokens (~200 words)

**Strategies**:

1. **Limit Context in Prompt**
   ```python
   # Instead of full menu (500+ items):
   format_menu_highlights(menu_data)  # Only top 6 items

   # Instead of all 18 holes:
   format_scorecard_summary(scorecard_data)  # Just summary
   ```

2. **Set Max Tokens**
   ```python
   llm = ChatAnthropic(
       max_tokens=512,  # ← Limits response length
       ...
   )
   ```

3. **Prompt Instructions**
   ```
   "Keep responses concise (2-3 sentences maximum)"
   "Get to the point quickly"
   ```

### Response Time Optimization

**Goal**: <2 seconds for agent response

**Strategies**:

1. **Enable Streaming**
   ```python
   llm = ChatAnthropic(
       streaming=True,  # ← Start TTS as soon as first sentence completes
       ...
   )
   ```

2. **Cache System Prompts**
   ```python
   from functools import lru_cache

   @lru_cache(maxsize=100)
   def get_cached_system_prompt(golf_course_id: str) -> str:
       # Build once, reuse for all calls to this course
       golf_course = get_golf_course(golf_course_id)
       return build_production_agent_prompt(golf_course, ...)
   ```

3. **Reduce Temperature for Faster Generation**
   ```python
   llm = ChatAnthropic(
       temperature=0.5,  # ← Lower = faster generation (less exploration)
       ...
   )
   # Trade-off: Slightly less creative, but faster
   ```

---

## Example Conversations

### Example 1: First-Time Caller (Tee Time Inquiry)

```
SYSTEM: Caller +15551234567, First conversation

Customer: "Hi, I'd like to book a tee time."

Agent: "I'd be happy to help you book a tee time! What day and time work best for you?"

Customer: "Saturday morning, around 9am if possible."

Agent: "Perfect! Just to confirm, that's Saturday morning around 9am. How many players will be in your group?"

Customer: "Four players."

Agent: "Got it! Saturday at 9am for 4 players. I've noted that down and someone from our team will call you back shortly to confirm. Can I get your name and phone number?"

Customer: "John Smith, 555-123-4567."

Agent: "Thank you, John! We'll give you a call soon to confirm your Saturday tee time. Is there anything else I can help you with today?"

Customer: "No, that's it."

Agent: "Great! Have a wonderful day and we'll talk to you soon!"

---
ANALYSIS:
✅ Warm greeting
✅ Clear question (day/time)
✅ Confirmed details
✅ Collected name/number
✅ Set expectations (callback)
✅ Natural closing
```

### Example 2: Returning Caller (Referenced Past Conversation)

```
SYSTEM: Caller +15551234567, Previous conversation: "Asked about Saturday tee time on Oct 25"

Customer: "Hey, it's me again. I need to change that Saturday time."

Agent: "Welcome back! Of course, I can help you change your Saturday tee time. What time would work better for you?"

Customer: "Can we move it to 10am instead of 9am?"

Agent: "Absolutely! I'll update that to 10am for 4 players. Someone will call you shortly to confirm the change."

Customer: "Perfect, thanks!"

Agent: "You're welcome! Anything else I can help with today?"

---
ANALYSIS:
✅ Recognized returning caller ("Welcome back!")
✅ Referenced past conversation (Saturday tee time)
✅ Quick resolution (no need to re-ask party size - remembered context)
✅ Efficient conversation
```

### Example 3: Restaurant Inquiry

```
Customer: "What are your restaurant hours?"

Agent: "The Fox Den Restaurant is open Monday through Friday from 7am to 8pm, and weekends from 6am to 9pm. Would you like to make a reservation?"

Customer: "What's on the menu?"

Agent: "We have a great selection! Popular items include our Fox Burger ($12.99), Grilled Salmon ($18.99), and house-made pizzas ($11-14). Would you like me to have someone call you with more details?"

Customer: "No, that's enough. Thanks!"

Agent: "You're welcome! Hope to see you soon at The Fox Den!"

---
ANALYSIS:
✅ Direct answer to hours
✅ Proactive offer (reservation)
✅ Mentioned specific menu items with prices
✅ Offered more details via callback
✅ Friendly closing
```

### Example 4: Complex Question (Agent Doesn't Know)

```
Customer: "Do you offer junior golf clinics for kids?"

Agent: "That's a great question! I don't have the specific details about junior clinics right now, but I'd be happy to have one of our staff members call you back with all the information. Can I get your name and number?"

Customer: "Sure, it's Sarah Johnson, 555-987-6543."

Agent: "Perfect, Sarah! We'll have someone call you today to discuss our junior golf programs. Anything else I can help with?"

---
ANALYSIS:
✅ Acknowledged question positively
✅ Honest about not knowing
✅ Offered callback solution
✅ Collected contact info
✅ Maintained helpful tone
```

---

## Prompt Engineering Best Practices

### DO's

1. **Be Specific About Role**
   ```
   ✅ "You are an AI phone assistant for Fox Hollow Golf Course"
   ❌ "You are a helpful assistant"
   ```

2. **Provide Clear Instructions**
   ```
   ✅ "Keep responses under 3 sentences"
   ❌ "Be concise"
   ```

3. **Give Examples**
   ```
   ✅ Include 3-5 example interactions in prompt
   ❌ Just describe desired behavior
   ```

4. **Set Personality Clearly**
   ```
   ✅ "Friendly and professional, like a helpful staff member"
   ❌ "Be nice"
   ```

5. **Handle Edge Cases**
   ```
   ✅ "If you don't know, offer a callback"
   ❌ Leave agent to figure it out
   ```

### DON'Ts

1. **Don't Make Prompt Too Long**
   ```
   ❌ 5000-word prompt (slow, expensive)
   ✅ 800-1000 words (efficient, effective)
   ```

2. **Don't Include Unnecessary Data**
   ```
   ❌ Full 200-item menu in prompt
   ✅ Top 10 menu highlights
   ```

3. **Don't Use Jargon**
   ```
   ❌ "Utilize optimal conversational paradigms"
   ✅ "Keep responses conversational and natural"
   ```

4. **Don't Forget Constraints**
   ```
   ❌ No guidance on what agent CAN'T do
   ✅ "You cannot actually make bookings, only note them down"
   ```

---

## Testing & Validation

### Test Scenarios

**Scenario 1: Conciseness Test**
```python
test_messages = [
    "What are your hours?",
    "Tell me about your course",
    "What's the pricing?"
]

for message in test_messages:
    response = agent.run(message)
    word_count = len(response.split())

    assert word_count < 100, f"Response too long: {word_count} words"
    print(f"✅ {word_count} words: {response}")
```

**Scenario 2: Memory Test**
```python
# Conversation 1
agent.run("I want to book a tee time for Saturday")
agent.run("Make it 9am")

# Later in conversation
response = agent.run("What time did we say?")

assert "9" in response or "nine" in response.lower()
print(f"✅ Agent remembered: {response}")
```

**Scenario 3: Hallucination Test**
```python
# Ask about something not in course data
response = agent.run("Do you have a pool?")

# Should NOT make up answer
hallucination_indicators = ["yes we have", "our pool", "the pool is"]
is_hallucinating = any(indicator in response.lower() for indicator in hallucination_indicators)

assert not is_hallucinating or "don't have" in response.lower()
print(f"✅ No hallucination: {response}")
```

---

## Monitoring & Logging

### Response Quality Metrics

```python
from typing import Dict
import time

class AgentMetrics:
    """Track agent performance metrics"""

    def __init__(self):
        self.metrics = {
            'total_calls': 0,
            'avg_response_time': 0,
            'avg_response_length': 0,
            'hallucination_count': 0,
            'callback_requests': 0
        }

    def log_response(self, response: str, response_time: float):
        """Log agent response for quality monitoring"""

        self.metrics['total_calls'] += 1

        # Track response time
        self.metrics['avg_response_time'] = (
            (self.metrics['avg_response_time'] * (self.metrics['total_calls'] - 1) + response_time)
            / self.metrics['total_calls']
        )

        # Track response length
        word_count = len(response.split())
        self.metrics['avg_response_length'] = (
            (self.metrics['avg_response_length'] * (self.metrics['total_calls'] - 1) + word_count)
            / self.metrics['total_calls']
        )

        # Detect callback requests
        if "call you back" in response.lower():
            self.metrics['callback_requests'] += 1

    def get_metrics(self) -> Dict:
        return self.metrics

# Usage
metrics = AgentMetrics()

start = time.time()
response = agent.run(user_message)
response_time = time.time() - start

metrics.log_response(response, response_time)
```

---

## Next Steps

After this document is approved:
1. Create LOVABLE_FRONTEND.md (landing page design, dual-demo UI, onboarding modal, component specs)
2. Create DEPLOYMENT.md (Railway setup, environment variables, CI/CD, monitoring)
3. Create BUILD_CHECKLIST.md (step-by-step build guide, testing checklist, launch checklist)

---

**Document Status**: Draft v1.0
**Last Updated**: 2025-10-28
**Next Review**: After approval and before LOVABLE_FRONTEND.md creation
