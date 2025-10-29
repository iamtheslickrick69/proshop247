"""
Demo Generator Service
Web scraping + AI processing to create custom demos
"""
import re
import httpx
from bs4 import BeautifulSoup
from typing import Dict, Optional
import asyncio
from urllib.parse import urlparse
from anthropic import Anthropic

from config.settings import ANTHROPIC_API_KEY


async def scrape_golf_course_website(url: str) -> Dict:
    """
    Scrape golf course website for information.

    Two-stage approach:
    1. Try BeautifulSoup (fast, simple)
    2. Fallback to Playwright (if JavaScript-heavy)

    Args:
        url: Golf course website URL

    Returns:
        Dictionary with scraped data
    """
    print(f"🌐 Scraping: {url}")

    # Stage 1: Try simple HTTP request
    try:
        scraped_data = await scrape_with_beautifulsoup(url)
        if scraped_data and scraped_data.get('text_content'):
            print("✅ BeautifulSoup scraping successful")
            return scraped_data
    except Exception as e:
        print(f"⚠️ BeautifulSoup failed: {e}")

    # Stage 2: Fallback to Playwright (not implemented in MVP)
    print("⚠️ Playwright fallback not implemented in MVP")

    return {
        'url': url,
        'text_content': '',
        'title': '',
        'description': '',
        'error': 'Could not scrape website'
    }


async def scrape_with_beautifulsoup(url: str) -> Dict:
    """
    Scrape website using BeautifulSoup.

    Args:
        url: Website URL

    Returns:
        Dictionary with scraped content
    """
    # Add protocol if missing
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url

    async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
        response = await client.get(url)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')

        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer"]):
            script.decompose()

        # Extract title
        title = soup.find('title')
        title_text = title.get_text().strip() if title else ''

        # Extract meta description
        description = ''
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc:
            description = meta_desc.get('content', '')

        # Extract main text content
        text_content = soup.get_text(separator='\n', strip=True)

        # Clean up whitespace
        text_content = '\n'.join(line.strip() for line in text_content.split('\n') if line.strip())

        # Limit to first 5000 characters (for AI processing)
        text_content = text_content[:5000]

        return {
            'url': url,
            'title': title_text,
            'description': description,
            'text_content': text_content,
            'method': 'beautifulsoup'
        }


def generate_slug(name: str) -> str:
    """
    Generate URL-safe slug from course name.

    Args:
        name: Golf course name

    Returns:
        URL-safe slug
    """
    # Convert to lowercase
    slug = name.lower()

    # Remove special characters
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)

    # Replace spaces with hyphens
    slug = re.sub(r'\s+', '-', slug)

    # Remove multiple hyphens
    slug = re.sub(r'-+', '-', slug)

    # Trim hyphens from ends
    slug = slug.strip('-')

    return slug


async def process_with_ai(scraped_data: Dict, course_name: str) -> Dict:
    """
    Use Claude to extract structured information from scraped data.

    Args:
        scraped_data: Raw scraped content
        course_name: Name of the golf course

    Returns:
        Dictionary with structured AI-processed data
    """
    print("🤖 Processing with AI...")

    text_content = scraped_data.get('text_content', '')

    if not text_content:
        print("⚠️ No content to process")
        return {
            'course_name': course_name,
            'summary': f'{course_name} - Custom demo created',
            'amenities': [],
            'special_features': ''
        }

    prompt = f"""Analyze this golf course website content and extract key information.

Course Name: {course_name}
Website Content:
{text_content}

Extract and return ONLY a JSON object with these fields:
{{
    "course_name": "Official course name",
    "location": "City, State",
    "hours": "Operating hours if mentioned",
    "pricing_summary": "Brief pricing info if mentioned",
    "amenities": ["list", "of", "amenities"],
    "special_features": "Notable features, design, or highlights",
    "contact_info": "Phone/email if mentioned"
}}

If information isn't found, use empty string or empty array. Keep it concise."""

    try:
        client = Anthropic(api_key=ANTHROPIC_API_KEY)

        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )

        response_text = response.content[0].text

        # Extract JSON from response
        import json

        # Try to find JSON in the response
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            ai_data = json.loads(json_match.group())
            print("✅ AI processing successful")
            return ai_data
        else:
            print("⚠️ Could not parse AI response as JSON")
            return {
                'course_name': course_name,
                'summary': response_text[:200]
            }

    except Exception as e:
        print(f"❌ AI processing error: {e}")
        return {
            'course_name': course_name,
            'error': str(e)
        }


async def create_demo_course(
    course_name: str,
    website_url: str,
    email: str,
    supabase
) -> Dict:
    """
    Complete demo creation workflow.

    Steps:
    1. Generate slug
    2. Scrape website
    3. Process with AI
    4. Create database record
    5. Create lead record

    Args:
        course_name: Name of the golf course
        website_url: Golf course website URL
        email: User's email (for lead capture)
        supabase: Supabase client

    Returns:
        Created demo course record
    """
    print(f"\n{'='*60}")
    print(f"Creating demo for: {course_name}")
    print(f"{'='*60}\n")

    # Step 1: Generate slug
    slug = generate_slug(course_name)
    print(f"📝 Generated slug: {slug}")

    # Check if slug already exists
    existing = supabase.table('demo_courses') \
        .select('id') \
        .eq('slug', slug) \
        .execute()

    if existing.data:
        # Slug exists - add random suffix
        import uuid
        slug = f"{slug}-{str(uuid.uuid4())[:8]}"
        print(f"📝 Slug updated (duplicate): {slug}")

    # Step 2: Scrape website
    scraped_data = await scrape_golf_course_website(website_url)

    # Step 3: Process with AI
    ai_data = await process_with_ai(scraped_data, course_name)

    # Step 4: Create demo course record
    demo_course = {
        'name': course_name,
        'slug': slug,
        'website_url': website_url,
        'scraped_data': scraped_data,
        'ai_processed_data': ai_data,
        'interaction_limit': 25,
        'status': 'active'
    }

    result = supabase.table('demo_courses').insert(demo_course).execute()
    created_course = result.data[0]

    print(f"✅ Demo course created: {created_course['id']}")

    # Step 5: Create lead record
    lead = {
        'demo_course_id': created_course['id'],
        'email': email,
        'course_name': course_name,
        'course_url': website_url,
        'status': 'new'
    }

    supabase.table('demo_leads').insert(lead).execute()
    print(f"✅ Lead captured: {email}")

    print(f"\n{'='*60}")
    print(f"Demo ready at: /demo/{slug}")
    print(f"{'='*60}\n")

    return created_course
