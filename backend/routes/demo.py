"""
Demo System Routes
API endpoints for creating and managing custom demos
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from supabase import create_client

from services.demo_generator import create_demo_course
from config.settings import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

router = APIRouter()

# Initialize Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


class CreateDemoRequest(BaseModel):
    """Request model for creating a demo"""
    course_name: str = Field(..., description="Golf course name", min_length=2)
    website_url: str = Field(..., description="Golf course website URL")
    email: EmailStr = Field(..., description="Email for updates")

    class Config:
        json_schema_extra = {
            "example": {
                "course_name": "Pine Valley Golf Club",
                "website_url": "https://pinevalleygolfclub.com",
                "email": "owner@pinevalley.com"
            }
        }


class CreateDemoResponse(BaseModel):
    """Response model for demo creation"""
    demo_id: str
    slug: str
    demo_url: str
    message: str


class DemoInfoResponse(BaseModel):
    """Response model for demo info"""
    demo_id: str
    name: str
    slug: str
    website_url: Optional[str]
    interaction_count: int
    interaction_limit: int
    status: str
    ai_data: Optional[dict]


@router.post("/demo/create", response_model=CreateDemoResponse)
async def create_demo(request: CreateDemoRequest, background_tasks: BackgroundTasks):
    """
    Create a custom demo for a golf course.

    This endpoint:
    1. Generates a unique slug
    2. Scrapes the golf course website
    3. Processes content with AI
    4. Creates demo in database
    5. Captures email lead

    The demo will be available at /demo/{slug}
    """
    try:
        # Create demo (synchronous for MVP)
        # In production, this would be a background job
        demo_course = await create_demo_course(
            course_name=request.course_name,
            website_url=request.website_url,
            email=request.email,
            supabase=supabase
        )

        return CreateDemoResponse(
            demo_id=demo_course['id'],
            slug=demo_course['slug'],
            demo_url=f"/demo/{demo_course['slug']}",
            message=f"Demo created successfully! Try chatting at /demo/{demo_course['slug']}"
        )

    except Exception as e:
        print(f"❌ Error creating demo: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create demo: {str(e)}")


@router.get("/demo/{slug}/info", response_model=DemoInfoResponse)
async def get_demo_info(slug: str):
    """
    Get information about a demo.

    Returns demo details including interaction count and AI-processed data.
    """
    try:
        response = supabase.table('demo_courses') \
            .select('*') \
            .eq('slug', slug) \
            .execute()

        if not response.data:
            raise HTTPException(status_code=404, detail=f"Demo not found: {slug}")

        demo = response.data[0]

        return DemoInfoResponse(
            demo_id=demo['id'],
            name=demo['name'],
            slug=demo['slug'],
            website_url=demo.get('website_url'),
            interaction_count=demo['interaction_count'],
            interaction_limit=demo['interaction_limit'],
            status=demo['status'],
            ai_data=demo.get('ai_processed_data')
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching demo info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/demo/{slug}/status")
async def get_demo_status(slug: str):
    """
    Quick status check for a demo.

    Returns basic info: exists, active, interactions remaining.
    """
    try:
        response = supabase.table('demo_courses') \
            .select('id, name, status, interaction_count, interaction_limit') \
            .eq('slug', slug) \
            .execute()

        if not response.data:
            return {
                "exists": False,
                "slug": slug
            }

        demo = response.data[0]
        remaining = demo['interaction_limit'] - demo['interaction_count']

        return {
            "exists": True,
            "slug": slug,
            "name": demo['name'],
            "status": demo['status'],
            "active": demo['status'] == 'active',
            "interactions_used": demo['interaction_count'],
            "interactions_remaining": remaining,
            "interactions_limit": demo['interaction_limit']
        }

    except Exception as e:
        print(f"❌ Error checking demo status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/demos")
async def list_demos(limit: int = 10, status: Optional[str] = None):
    """
    List all demos.

    Query params:
    - limit: Max number to return (default: 10)
    - status: Filter by status (active, expired, suspended)
    """
    try:
        query = supabase.table('demo_courses') \
            .select('id, name, slug, interaction_count, interaction_limit, status, created_at') \
            .order('created_at', desc=True) \
            .limit(limit)

        if status:
            query = query.eq('status', status)

        response = query.execute()

        return {
            "demos": response.data,
            "count": len(response.data)
        }

    except Exception as e:
        print(f"❌ Error listing demos: {e}")
        raise HTTPException(status_code=500, detail=str(e))
