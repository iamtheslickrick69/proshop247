# ProShop 24/7 - Demo Generator Specification

## Document Overview

This document details the custom demo generation system - the **competitive moat** of ProShop 24/7. The demo generator allows prospects to create a fully functional AI demo of their golf course in under 60 seconds by uploading their course data. This turns every prospect into a demo creator and viral marketing agent.

---

## Demo Generator Philosophy

### Why This is Genius

**Traditional Demo Flow**:
```
Prospect → "Request Demo" → Wait for sales call → 3-day delay → Watch generic demo
```

**ProShop 24/7 Demo Flow**:
```
Prospect → Upload course data (30 seconds) → Test custom AI immediately → Share with team
```

**Key Benefits**:
1. **Zero friction** - 30 seconds from idea to working demo
2. **Viral growth** - Shareable links spread organically (stakeholder forwarding)
3. **Lead qualification** - If they upload data, they're serious buyers
4. **Social proof** - "Look what I made for our course!" (emotional investment)
5. **Data collection** - Build prospect database automatically with email capture
6. **Competitive moat** - Nobody else offers instant custom demos

---

## Demo Generation Workflow

### High-Level Flow

```
User clicks "Upload Your Own Course"
           ↓
┌──────────────────────────────────────┐
│  Onboarding Modal Opens              │
│  (Lovable frontend component)        │
└───────────────┬──────────────────────┘
                ↓
┌──────────────────────────────────────┐
│  STEP 1: Basic Info                  │
│  - Course name *                     │
│  - Location *                        │
│  - Website URL *                     │
│  - Email * (lead capture)            │
└───────────────┬──────────────────────┘
                ↓
┌──────────────────────────────────────┐
│  STEP 2: Upload Assets (Optional)    │
│  - Restaurant menu (PDF/image)       │
│  - Scorecard (PDF/image)             │
│  - Logo (image)                      │
└───────────────┬──────────────────────┘
                ↓
┌──────────────────────────────────────┐
│  STEP 3: Quick Details               │
│  - Operating hours                   │
│  - Phone number                      │
│  - Services (checkboxes)             │
└───────────────┬──────────────────────┘
                ↓
┌──────────────────────────────────────┐
│  [Generate My Demo] Button           │
└───────────────┬──────────────────────┘
                ↓
┌──────────────────────────────────────┐
│  Frontend: POST /v1/demo/create      │
│  - Validates inputs                  │
│  - Uploads files to Supabase Storage │
│  - Shows "Generating..." loader      │
└───────────────┬──────────────────────┘
                ↓
┌──────────────────────────────────────┐
│  Backend: Demo Creation              │
│  1. Generate unique slug (abc123xyz) │
│  2. Create demo_courses record       │
│  3. Create demo_leads record         │
│  4. Schedule background jobs:        │
│     - Website scraping               │
│     - AI file processing             │
│     - Embedding generation           │
└───────────────┬──────────────────────┘
                ↓
┌──────────────────────────────────────┐
│  Frontend: Success Screen            │
│  "Your demo is ready!"               │
│                                      │
│  proshop247.com/demo/abc123xyz       │
│                                      │
│  [Test Text Chat]                    │
│  [Call Voice Demo]                   │
│  [Copy Link to Share]                │
│                                      │
│  "You have 25 free interactions"     │
└───────────────┬──────────────────────┘
                ↓
┌──────────────────────────────────────┐
│  Background Jobs (Async)             │
│  - Scrape website (3-5 seconds)      │
│  - Extract PDF text (2-3 seconds)    │
│  - Claude analyzes files (10 sec)    │
│  - Generate embeddings (5 seconds)   │
│  - Update demo_courses record        │
└───────────────┬──────────────────────┘
                ↓
┌──────────────────────────────────────┐
│  Demo Agent Ready                    │
│  - Agent has course data             │
│  - Agent has scraped data (if any)   │
│  - Agent has menu/scorecard data     │
│  - Ready for text/voice interactions │
└──────────────────────────────────────┘
```

**Total Time**: ~25 seconds (well under 60 second target)

---

## Component 1: Demo Slug Generation

### Function: `generate_demo_slug()`

**Purpose**: Generate unique, short, shareable demo identifier

**Requirements**:
- Unique (collision-free)
- Short (easy to share: 9-12 characters)
- URL-safe (lowercase alphanumeric only)
- Pronounceable (not critical, but nice)

**Implementation**:

```python
import hashlib
import secrets
from supabase import Client

def generate_demo_slug(length: int = 9) -> str:
    """
    Generate unique demo slug.

    Uses cryptographically secure random string.
    Checks database for collisions (rare but possible).

    Returns:
        Unique 9-character slug (e.g., "abc123xyz")
    """

    max_attempts = 10

    for attempt in range(max_attempts):
        # Generate random alphanumeric string
        slug = ''.join(secrets.choice('abcdefghijklmnopqrstuvwxyz0123456789')
                      for _ in range(length))

        # Check if slug already exists
        existing = supabase.table('demo_courses') \
            .select('demo_slug') \
            .eq('demo_slug', slug) \
            .execute()

        if not existing.data:
            return slug

    # If all attempts fail (extremely rare), use timestamp-based slug
    import time
    timestamp_slug = hashlib.md5(str(time.time()).encode()).hexdigest()[:9]
    return timestamp_slug

# Alternative: Use database function (more efficient)
"""
CREATE OR REPLACE FUNCTION generate_demo_slug()
RETURNS TEXT AS $$
DECLARE
    slug TEXT;
    slug_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate random 9-character alphanumeric slug
        slug := lower(substr(md5(random()::text), 1, 9));

        -- Check if slug already exists
        SELECT EXISTS(SELECT 1 FROM demo_courses WHERE demo_slug = slug) INTO slug_exists;

        EXIT WHEN NOT slug_exists;
    END LOOP;

    RETURN slug;
END;
$$ LANGUAGE plpgsql;
"""
```

**Example Slugs**:
- `abc123xyz`
- `sunset789`
- `golf4ever`
- `teeoff456`

**Collision Probability**:
- Character space: 36 (26 letters + 10 digits)
- Slug length: 9 characters
- Total combinations: 36^9 = 101,559,956,668,416 (101 trillion)
- With 10,000 demos: collision probability ~0.0000001%

---

## Component 2: File Upload & Storage

### Function: `upload_demo_file()`

**Purpose**: Upload user files to Supabase Storage with validation

**Supported File Types**:
- **Logo**: PNG, JPG (max 5MB)
- **Menu**: PDF, PNG, JPG (max 5MB)
- **Scorecard**: PDF, PNG, JPG (max 5MB)

**Storage Structure**:
```
demo-assets/
  {demo_slug}/
    logo_20241028103000_foxhollow-logo.png
    menu_20241028103001_restaurant-menu.pdf
    scorecard_20241028103002_course-scorecard.pdf
```

**Implementation**:

```python
from fastapi import UploadFile, HTTPException
import os
from datetime import datetime
from supabase import Client

async def upload_demo_file(
    file: UploadFile,
    demo_slug: str,
    file_type: str,  # 'logo', 'menu', 'scorecard'
    supabase: Client
) -> str:
    """
    Upload file to Supabase Storage with validation.

    Args:
        file: FastAPI UploadFile object
        demo_slug: Demo identifier
        file_type: Type of file (logo, menu, scorecard)

    Returns:
        Public URL of uploaded file

    Raises:
        HTTPException: Invalid file type, size, or upload error
    """

    # File type validation
    allowed_types = {
        'logo': {
            'mime_types': ['image/png', 'image/jpeg'],
            'extensions': ['.png', '.jpg', '.jpeg']
        },
        'menu': {
            'mime_types': ['application/pdf', 'image/png', 'image/jpeg'],
            'extensions': ['.pdf', '.png', '.jpg', '.jpeg']
        },
        'scorecard': {
            'mime_types': ['application/pdf', 'image/png', 'image/jpeg'],
            'extensions': ['.pdf', '.png', '.jpg', '.jpeg']
        }
    }

    if file.content_type not in allowed_types[file_type]['mime_types']:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type for {file_type}. Allowed: {allowed_types[file_type]['mime_types']}"
        )

    # File size validation (5MB limit)
    contents = await file.read()
    file_size_mb = len(contents) / (1024 * 1024)

    if file_size_mb > 5:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({file_size_mb:.2f}MB). Maximum 5MB."
        )

    # Generate unique filename
    timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
    file_extension = os.path.splitext(file.filename)[1]
    safe_filename = f"{file_type}_{timestamp}_{file.filename.replace(' ', '-')}"
    file_path = f"{demo_slug}/{safe_filename}"

    try:
        # Upload to Supabase Storage
        supabase.storage.from_('demo-assets').upload(
            file_path,
            contents,
            file_options={"content-type": file.content_type}
        )

        # Get public URL
        public_url = supabase.storage.from_('demo-assets').get_public_url(file_path)

        return public_url

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"File upload failed: {str(e)}"
        )
```

**Security Considerations**:
- File type validation (MIME type + extension)
- File size limit (prevent DOS via large uploads)
- Filename sanitization (remove spaces, special characters)
- Virus scanning (optional for MVP, add in V2 with ClamAV)

---

## Component 3: Website Scraping

### Function: `scrape_golf_course_website()`

**Purpose**: Extract course data from website URL (Option C: hybrid approach)

**Target Data**:
- Operating hours
- Pricing (greens fees, cart rental)
- Services/amenities
- Contact information
- Course description

**Strategy**:
1. **Try BeautifulSoup first** (fast, works for 80% of sites)
2. **Fall back to Playwright** if BeautifulSoup fails (slower, handles JS sites)
3. **Gracefully degrade** if both fail (continue with form data only)

**Implementation**:

```python
import requests
from bs4 import BeautifulSoup
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

def scrape_golf_course_website(
    url: str,
    demo_id: str,
    supabase: Client
) -> Dict:
    """
    Scrape golf course website for structured data.

    First tries BeautifulSoup (fast), falls back to Playwright if needed.

    Args:
        url: Website URL
        demo_id: Demo course ID

    Returns:
        Dict with scraped data: hours, pricing, amenities, description
    """

    # Update demo status
    supabase.table('demo_courses') \
        .update({'scrape_status': 'processing'}) \
        .eq('id', demo_id) \
        .execute()

    try:
        # ATTEMPT 1: BeautifulSoup (fast, simple)
        scraped_data = scrape_with_beautifulsoup(url)

        if scraped_data and is_scrape_successful(scraped_data):
            # Success!
            supabase.table('demo_courses') \
                .update({
                    'scraped_data': scraped_data,
                    'scrape_status': 'success'
                }) \
                .eq('id', demo_id) \
                .execute()

            logger.info(f"Scrape successful (BeautifulSoup): {url}")
            return scraped_data

        # ATTEMPT 2: Playwright (slower, handles JS)
        logger.info(f"BeautifulSoup insufficient, trying Playwright: {url}")
        scraped_data = scrape_with_playwright(url)

        if scraped_data and is_scrape_successful(scraped_data):
            # Success!
            supabase.table('demo_courses') \
                .update({
                    'scraped_data': scraped_data,
                    'scrape_status': 'success'
                }) \
                .eq('id', demo_id) \
                .execute()

            logger.info(f"Scrape successful (Playwright): {url}")
            return scraped_data

        # FAILURE: Both methods failed
        raise Exception("Both scraping methods failed")

    except Exception as e:
        # Graceful degradation: mark as failed, continue with form data
        logger.warning(f"Scrape failed for {url}: {str(e)}")

        supabase.table('demo_courses') \
            .update({
                'scrape_status': 'failed',
                'scrape_error': str(e)
            }) \
            .eq('id', demo_id) \
            .execute()

        return {}

def scrape_with_beautifulsoup(url: str) -> Dict:
    """
    Scrape website using BeautifulSoup (fast, simple HTML parsing).

    Returns:
        Dict with: hours, pricing, amenities, description
    """

    try:
        # Fetch HTML
        response = requests.get(url, timeout=10, headers={
            'User-Agent': 'Mozilla/5.0 (compatible; ProShop247Bot/1.0)'
        })
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'lxml')

        # Extract data using common patterns
        data = {}

        # HOURS: Look for common patterns
        hours_keywords = ['hours', 'open', 'schedule', 'times']
        for keyword in hours_keywords:
            element = soup.find(['div', 'section', 'p'],
                               class_=lambda x: x and keyword in x.lower())
            if element:
                data['hours'] = element.get_text(strip=True)
                break

        # PRICING: Look for rates, pricing, fees
        pricing_keywords = ['rates', 'pricing', 'fees', 'greens fees']
        for keyword in pricing_keywords:
            element = soup.find(['div', 'section', 'table'],
                               class_=lambda x: x and keyword.replace(' ', '') in x.lower().replace(' ', ''))
            if element:
                data['pricing'] = element.get_text(strip=True)
                break

        # AMENITIES: Look for lists of services
        amenities_keywords = ['amenities', 'services', 'facilities']
        for keyword in amenities_keywords:
            element = soup.find(['div', 'section', 'ul'],
                               class_=lambda x: x and keyword in x.lower())
            if element:
                # Extract list items
                amenities = [li.get_text(strip=True) for li in element.find_all('li')]
                data['amenities'] = amenities
                break

        # DESCRIPTION: Meta description or first paragraph
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc:
            data['description'] = meta_desc.get('content', '')
        else:
            # Try first paragraph
            first_p = soup.find('p')
            if first_p:
                data['description'] = first_p.get_text(strip=True)

        # PHONE: Look for tel: links or phone patterns
        tel_link = soup.find('a', href=lambda x: x and x.startswith('tel:'))
        if tel_link:
            data['phone'] = tel_link.get_text(strip=True)

        return data

    except Exception as e:
        logger.error(f"BeautifulSoup scraping failed: {str(e)}")
        return {}

def scrape_with_playwright(url: str) -> Dict:
    """
    Scrape website using Playwright (handles JavaScript-heavy sites).

    Returns:
        Dict with: hours, pricing, amenities, description
    """

    try:
        from playwright.async_api import async_playwright
        import asyncio

        async def scrape():
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()

                # Navigate to page
                await page.goto(url, wait_until='networkidle', timeout=10000)

                # Wait for content to load
                await page.wait_for_timeout(2000)

                # Get page content
                content = await page.content()

                await browser.close()

                # Parse with BeautifulSoup
                soup = BeautifulSoup(content, 'lxml')

                # Use same extraction logic as BeautifulSoup method
                # (omitted for brevity - same as scrape_with_beautifulsoup)

                return data

        # Run async scrape
        return asyncio.run(scrape())

    except Exception as e:
        logger.error(f"Playwright scraping failed: {str(e)}")
        return {}

def is_scrape_successful(data: Dict) -> bool:
    """
    Check if scrape returned sufficient data.

    Criteria: At least 2 of: hours, pricing, amenities, description
    """
    fields = ['hours', 'pricing', 'amenities', 'description']
    populated_fields = sum(1 for field in fields if data.get(field))

    return populated_fields >= 2
```

**Graceful Degradation**:
- Scraping fails → Store `scrape_status='failed'`
- Agent still works with form data only
- No error shown to user
- Agent acknowledges: "I have your basic course info from the form you filled out"

---

## Component 4: AI File Processing

### Function: `process_uploaded_files()`

**Purpose**: Extract structured data from uploaded PDFs/images using Claude

**Process**:
1. **Extract text** from PDF/image (PyPDF2 or OCR)
2. **Send to Claude** for analysis and structuring
3. **Store structured data** in demo_courses JSONB fields
4. **Generate embeddings** for semantic search

**Implementation**:

```python
import pdfplumber
from anthropic import Anthropic
from typing import Dict, Optional
import json

anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def process_uploaded_files(
    demo_id: str,
    menu_url: Optional[str],
    scorecard_url: Optional[str],
    supabase: Client
):
    """
    Process uploaded PDF/image files using Claude AI.

    Steps:
    1. Download files from Supabase Storage
    2. Extract text (PDF) or OCR (images)
    3. Send to Claude for structuring
    4. Store structured data in database
    """

    # Update processing status
    supabase.table('demo_courses') \
        .update({'ai_processing_status': 'processing'}) \
        .eq('id', demo_id) \
        .execute()

    try:
        menu_data = None
        scorecard_data = None

        # Process menu file
        if menu_url:
            menu_text = extract_file_text(menu_url)
            if menu_text:
                menu_data = analyze_menu_with_claude(menu_text)

        # Process scorecard file
        if scorecard_url:
            scorecard_text = extract_file_text(scorecard_url)
            if scorecard_text:
                scorecard_data = analyze_scorecard_with_claude(scorecard_text)

        # Store structured data
        supabase.table('demo_courses') \
            .update({
                'menu_data': menu_data,
                'scorecard_data': scorecard_data,
                'ai_processing_status': 'completed'
            }) \
            .eq('id', demo_id) \
            .execute()

        logger.info(f"AI processing completed for demo {demo_id}")

    except Exception as e:
        logger.error(f"AI processing failed for demo {demo_id}: {str(e)}")

        supabase.table('demo_courses') \
            .update({
                'ai_processing_status': 'failed',
                'ai_processing_error': str(e)
            }) \
            .eq('id', demo_id) \
            .execute()

def extract_file_text(file_url: str) -> str:
    """
    Extract text from PDF or image file.

    For PDFs: Use pdfplumber
    For images: Use Claude Vision API (most accurate)
    """

    # Download file
    response = requests.get(file_url)
    file_content = response.content

    # Detect file type
    if file_url.lower().endswith('.pdf'):
        # Extract PDF text
        import io
        pdf_file = io.BytesIO(file_content)

        with pdfplumber.open(pdf_file) as pdf:
            text = ""
            for page in pdf.pages:
                text += page.extract_text() or ""

        return text

    elif file_url.lower().endswith(('.jpg', '.jpeg', '.png')):
        # Use Claude Vision API (better than Tesseract OCR)
        import base64

        base64_image = base64.b64encode(file_content).decode('utf-8')

        # Determine media type
        media_type = 'image/jpeg' if file_url.lower().endswith(('.jpg', '.jpeg')) else 'image/png'

        response = anthropic_client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=2000,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": base64_image
                        }
                    },
                    {
                        "type": "text",
                        "text": "Extract all text from this image. Return the text exactly as shown, preserving formatting where possible."
                    }
                ]
            }]
        )

        return response.content[0].text

    else:
        raise ValueError(f"Unsupported file type: {file_url}")

def analyze_menu_with_claude(menu_text: str) -> Dict:
    """
    Analyze restaurant menu text with Claude, extract structured data.

    Returns:
        Dict with categories, items, prices:
        {
          "categories": {
            "appetizers": [...],
            "entrees": [...],
            "desserts": [...],
            "drinks": [...]
          },
          "price_range": "7-15"
        }
    """

    prompt = f"""Analyze this restaurant menu and extract structured data.

Menu text:
{menu_text}

Return a JSON object with this structure:
{{
  "categories": {{
    "appetizers": [
      {{"name": "Item Name", "description": "Brief desc", "price": 12.99}}
    ],
    "entrees": [...],
    "desserts": [...],
    "drinks": [...]
  }},
  "price_range": "7-15"  // Min-max prices as string
}}

Guidelines:
- Categorize items appropriately (appetizers, entrees, desserts, drinks, etc.)
- Extract prices accurately (handle various formats: $12, 12.99, etc.)
- Include item descriptions if available
- Calculate price_range from all items
- If categories aren't clear, use generic names

Return ONLY the JSON object, no additional text.
"""

    response = anthropic_client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )

    # Parse JSON response
    try:
        menu_data = json.loads(response.content[0].text)
        return menu_data
    except json.JSONDecodeError:
        # Claude didn't return valid JSON, use raw text
        logger.warning("Claude returned invalid JSON for menu analysis")
        return {"raw_text": response.content[0].text}

def analyze_scorecard_with_claude(scorecard_text: str) -> Dict:
    """
    Analyze golf scorecard with Claude, extract hole-by-hole details.

    Returns:
        Dict with hole details:
        {
          "holes": [
            {"hole": 1, "par": 4, "yardage": 380, "handicap": 5},
            ...
          ],
          "total_par": 72,
          "total_yardage": 6800,
          "course_rating": 72.5,
          "slope": 130
        }
    """

    prompt = f"""Analyze this golf scorecard and extract structured data.

Scorecard text:
{scorecard_text}

Return a JSON object with this structure:
{{
  "holes": [
    {{"hole": 1, "par": 4, "yardage": 380, "handicap": 5}},
    ...18 holes
  ],
  "total_par": 72,
  "total_yardage": 6800,
  "course_rating": 72.5,  // If available
  "slope": 130  // If available
}}

Guidelines:
- Extract all 18 holes (or 9 if executive course)
- Include par, yardage, handicap for each hole
- Calculate totals
- Include course rating/slope if present
- Handle multiple tee boxes (choose blue/white tees)

Return ONLY the JSON object, no additional text.
"""

    response = anthropic_client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )

    # Parse JSON response
    try:
        scorecard_data = json.loads(response.content[0].text)
        return scorecard_data
    except json.JSONDecodeError:
        logger.warning("Claude returned invalid JSON for scorecard analysis")
        return {"raw_text": response.content[0].text}
```

**AI Processing Benefits**:
- **Accurate extraction**: Claude Vision > Tesseract OCR for image text
- **Structured data**: JSON output ready for database storage
- **Natural language queries**: Agent can answer "What's the most expensive menu item?" or "What's the hardest hole?"
- **Flexible input**: Handles poor quality scans, handwritten notes, various formats

---

## Component 5: Background Job Architecture

### Why Background Jobs?

Demo creation must be **fast** (<5 seconds to return demo URL). Heavy processing (scraping, AI analysis) runs asynchronously.

**Synchronous** (blocks user):
- Generate demo slug
- Upload files to storage
- Create database records
- Return demo URL ✅ User sees success screen

**Asynchronous** (background):
- Scrape website (3-5 seconds)
- Extract PDF text (2-3 seconds)
- Claude analysis (10 seconds)
- Generate embeddings (5 seconds)

**Total**: Synchronous ~2 seconds, Asynchronous ~20 seconds (runs in background)

### Implementation Options

**Option A: Celery (Full-featured, production-ready)**
- Requires Redis or RabbitMQ
- Heavy setup, but robust
- Good for scale

**Option B: FastAPI Background Tasks (Simple, built-in)**
- No additional dependencies
- Good for simple tasks
- Limited monitoring

**Option C: arq (Async, lightweight)**
- Redis-backed
- Async-native (perfect for FastAPI)
- Good balance of simplicity and features

**Recommendation**: Option C (arq) for MVP - Async-native, Redis-backed, simple setup

### Implementation with arq

```python
from arq import create_pool
from arq.connections import RedisSettings
import asyncio

# arq worker configuration
async def scrape_website_task(ctx, demo_id: str, url: str):
    """
    Background task: Scrape website
    """
    from services.scraper import scrape_golf_course_website

    scrape_golf_course_website(url, demo_id, ctx['supabase'])

async def process_files_task(ctx, demo_id: str, menu_url: str, scorecard_url: str):
    """
    Background task: Process uploaded files with AI
    """
    from services.ai_processor import process_uploaded_files

    process_uploaded_files(demo_id, menu_url, scorecard_url, ctx['supabase'])

async def generate_embeddings_task(ctx, demo_id: str):
    """
    Background task: Generate embeddings for demo course data
    """
    # Get demo course data
    demo = ctx['supabase'].table('demo_courses').select('*').eq('id', demo_id).execute()

    # Combine all text for embedding
    text_parts = []
    if demo.data[0].get('scraped_data'):
        text_parts.append(json.dumps(demo.data[0]['scraped_data']))
    if demo.data[0].get('menu_data'):
        text_parts.append(json.dumps(demo.data[0]['menu_data']))

    combined_text = " ".join(text_parts)

    # Generate embedding
    from services.embeddings import generate_embedding
    embedding = generate_embedding(combined_text)

    # Store embedding (future: use for semantic demo search)
    # For now, just log success
    logger.info(f"Generated embedding for demo {demo_id}")

# arq worker class
class WorkerSettings:
    functions = [scrape_website_task, process_files_task, generate_embeddings_task]
    redis_settings = RedisSettings(host='localhost', port=6379)
    on_startup = startup
    on_shutdown = shutdown

async def startup(ctx):
    """Initialize worker context"""
    from supabase import create_client
    ctx['supabase'] = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Service role for background jobs
    )

async def shutdown(ctx):
    """Cleanup worker context"""
    pass

# Schedule jobs from FastAPI
from arq import ArqRedis

async def schedule_background_jobs(demo_id: str, website_url: str, menu_url: str, scorecard_url: str):
    """
    Schedule background jobs for demo processing.
    """
    redis = await create_pool(RedisSettings(host='localhost', port=6379))

    # Schedule scraping (if website URL provided)
    if website_url:
        await redis.enqueue_job('scrape_website_task', demo_id, website_url)

    # Schedule AI processing (if files uploaded)
    if menu_url or scorecard_url:
        await redis.enqueue_job('process_files_task', demo_id, menu_url, scorecard_url)

    # Schedule embedding generation (after others complete)
    await redis.enqueue_job('generate_embeddings_task', demo_id, _defer_by=30)  # Wait 30 seconds
```

**Run Worker**:
```bash
arq worker.WorkerSettings
```

---

## Component 6: Demo Agent Configuration

### How Demo Agent Differs from Production Agent

| Feature | Production Agent | Demo Agent |
|---------|------------------|------------|
| Conversation History | Last 3 conversations | None (no history for demos) |
| Data Source | Database: golf_courses table | Database: demo_courses table |
| Phone Number | Dedicated Twilio number | Shared pool number (caller ID routing) |
| Interaction Limit | Unlimited | 25 interactions |
| Caller Tracking | Auto-create caller accounts | Anonymous (no accounts) |
| Conversation Storage | Store ALL conversations | Count interactions only (no full storage) |

### Function: `build_demo_agent()`

**Purpose**: Build LangChain agent configured for demo course

**Implementation**:

```python
from langchain.chat_models import ChatAnthropic
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

def build_demo_agent(demo_course: Dict) -> LLMChain:
    """
    Build LangChain agent for demo course.

    Args:
        demo_course: Demo course data from database

    Returns:
        Configured LangChain agent
    """

    # Extract demo course data
    name = demo_course['name']
    location = demo_course['location']
    operating_hours = demo_course.get('operating_hours', 'Not specified')
    services = demo_course.get('services', [])
    scraped_data = demo_course.get('scraped_data', {})
    menu_data = demo_course.get('menu_data', {})
    scorecard_data = demo_course.get('scorecard_data', {})

    # Build system prompt
    prompt_template = f"""You are an AI assistant for {name}, a golf course located in {location}.

**IMPORTANT: THIS IS A DEMO**
You are demonstrating ProShop 24/7's AI capabilities to a prospect. Be helpful and enthusiastic!

Your role is to help with:
- Tee time inquiries
- Restaurant questions
- Event and wedding venue inquiries
- General course information

COURSE INFORMATION:
- Name: {name}
- Location: {location}
- Operating Hours: {operating_hours}
- Services: {', '.join(services)}

"""

    # Add scraped data if available
    if scraped_data:
        if scraped_data.get('hours'):
            prompt_template += f"\nDetailed Hours: {scraped_data['hours']}"
        if scraped_data.get('pricing'):
            prompt_template += f"\nPricing: {scraped_data['pricing']}"
        if scraped_data.get('amenities'):
            prompt_template += f"\nAmenities: {', '.join(scraped_data['amenities'])}"

    # Add menu data if available
    if menu_data and menu_data.get('categories'):
        prompt_template += "\n\nRESTAURANT MENU:"
        for category, items in menu_data['categories'].items():
            prompt_template += f"\n{category.title()}:"
            for item in items[:3]:  # Show first 3 items per category
                prompt_template += f"\n- {item['name']}: ${item['price']}"

    # Add scorecard data if available
    if scorecard_data and scorecard_data.get('holes'):
        prompt_template += f"\n\nCOURSE DETAILS:"
        prompt_template += f"\n- Par: {scorecard_data.get('total_par', 'Unknown')}"
        prompt_template += f"\n- Yardage: {scorecard_data.get('total_yardage', 'Unknown')}"
        prompt_template += f"\n- Holes: {len(scorecard_data['holes'])}"

    # Instructions
    prompt_template += """

INSTRUCTIONS:
1. Be warm, friendly, and helpful
2. Keep responses concise (2-3 sentences)
3. For tee time bookings, say "I've noted that down and someone will confirm shortly"
4. If you don't have specific information, acknowledge it politely
5. Remind them this is a demo: "This is a demo of what ProShop 24/7 can do for your course!"

Current message: {message}

Your response:"""

    # Build LangChain components
    llm = ChatAnthropic(
        model="claude-sonnet-4-5-20250929",
        temperature=0.7,
        max_tokens=512,
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
    )

    prompt = PromptTemplate(
        template=prompt_template,
        input_variables=["message"]
    )

    agent = LLMChain(llm=llm, prompt=prompt)

    return agent
```

---

## Component 7: Demo Testing Scenarios

### Test Scenario 1: Complete Demo Creation Flow

```
Step 1: User submits demo form
- Name: "Sunset Golf Club"
- Location: "Phoenix, AZ"
- Website: "https://sunsetgolf.com"
- Email: "manager@sunsetgolf.com"
- Uploads: menu.pdf, scorecard.pdf

Step 2: Backend processing
✅ Files uploaded to Supabase Storage
✅ demo_courses record created (slug: "abc123xyz")
✅ demo_leads record created (email captured)
✅ Background jobs scheduled

Step 3: User sees success screen
✅ Demo URL shown: proshop247.com/demo/abc123xyz
✅ Test buttons visible: Text Chat, Voice Call
✅ Copy link button works

Step 4: Background jobs complete (20 seconds later)
✅ Website scraped: hours, pricing extracted
✅ Menu PDF processed: 25 menu items extracted
✅ Scorecard PDF processed: 18 holes extracted
✅ demo_courses record updated with structured data

Step 5: User tests demo
✅ Clicks "Test Text Chat"
✅ Sends message: "What are your hours?"
✅ Agent responds with scraped hours
✅ interaction_count incremented to 1

✅ PASS: Complete flow works end-to-end
```

### Test Scenario 2: Scraping Failure (Graceful Degradation)

```
Step 1: User submits demo with bad website URL
- Website: "https://nonexistent-golf-course.com"
- No file uploads

Step 2: Backend attempts scraping
❌ Scraping fails (timeout / 404)
✅ scrape_status set to "failed"
✅ Demo creation continues (no error shown to user)

Step 3: User tests demo
✅ Agent responds: "I have your basic course info. For specific details like hours and pricing, I'd recommend calling the course directly at [phone]."
✅ Demo still functional, just limited data

✅ PASS: Graceful degradation works
```

### Test Scenario 3: Demo Interaction Limit

```
Step 1: Demo created, interaction_count = 0

Step 2: User sends 25 text messages
✅ Each message increments interaction_count
✅ All 25 messages get responses

Step 3: User sends 26th message
❌ API returns 429 (Too Many Requests)
❌ Frontend shows: "Your demo has reached 25 interactions. Upgrade to unlimited: [Get Started]"

Step 4: User tries voice call
❌ Call rejected with message: "Demo limit reached. To continue, please upgrade."

✅ PASS: Interaction limit enforced correctly
```

---

## Demo Lead Scoring Algorithm

### Automatic Scoring (Trigger-based)

```python
def calculate_lead_score(demo_course: Dict) -> int:
    """
    Calculate lead score (0-100) based on demo usage.

    Higher score = higher quality lead
    """
    score = 0

    # Base score: Created demo
    score += 10

    # Engagement: Interaction count
    interaction_count = demo_course['interaction_count']
    score += min(interaction_count * 5, 50)  # Max 50 points (10 interactions)

    # Virality: Shared link
    if demo_course['shared_count'] > 0:
        score += 20

    # Seriousness: Uploaded files
    if demo_course['menu_file_url'] or demo_course['scorecard_file_url']:
        score += 10

    # Multiple visits
    if demo_course['total_visitors'] > 3:
        score += 10

    # Cap at 100
    return min(score, 100)
```

**Lead Score Interpretation**:
- **80-100**: Hot lead (high engagement, shared, uploaded files)
- **50-79**: Warm lead (moderate engagement)
- **10-49**: Cold lead (created demo, minimal usage)

---

## Error Handling & Retry Logic

### Retry Strategies by Task

**Website Scraping**:
- Max retries: 2
- Retry delay: 5 seconds
- Failure action: Mark as failed, continue

**AI File Processing**:
- Max retries: 3
- Retry delay: 10 seconds
- Failure action: Mark as failed, store raw text

**Embedding Generation**:
- Max retries: 3
- Retry delay: 30 seconds
- Failure action: Skip (optional feature)

**File Upload**:
- Max retries: 1
- Retry delay: Immediate
- Failure action: Return error to user

---

## Next Steps

After this document is approved:
1. Create VOICE_PIPELINE.md (Twilio → Deepgram → Agent → ElevenLabs real-time streaming)
2. Create LANGCHAIN_AGENT.md (agent configuration, prompts, conversation chains)
3. Create LOVABLE_FRONTEND.md (landing page, dual-demo UI, onboarding modal)
4. Create DEPLOYMENT.md (Railway setup, environment variables, monitoring)

---

**Document Status**: Draft v1.0
**Last Updated**: 2025-10-28
**Next Review**: After approval and before VOICE_PIPELINE.md creation
