"""
Pydantic schemas for API request/response validation
"""
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    message: str = Field(..., description="User's message", min_length=1)
    session_id: str = Field(..., description="Unique session identifier")
    context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional context (demo_slug, phone_number, etc.)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "message": "What are your hours?",
                "session_id": "session_123abc",
                "context": {
                    "demo_slug": "fox-hollow"
                }
            }
        }


class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    response: str = Field(..., description="Agent's response")
    session_id: str = Field(..., description="Session identifier")
    interaction_count: Optional[int] = Field(
        default=None,
        description="Number of interactions used (demo mode only)"
    )
    interaction_limit: Optional[int] = Field(
        default=None,
        description="Total interaction limit (demo mode only)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "response": "We're open from 6:00 AM to 9:00 PM daily!",
                "session_id": "session_123abc",
                "interaction_count": 3,
                "interaction_limit": 25
            }
        }


class HealthResponse(BaseModel):
    """Response model for health check"""
    status: str
    message: str
    version: str = "1.0.0"

    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "message": "ProShop 24/7 API is running",
                "version": "1.0.0"
            }
        }
