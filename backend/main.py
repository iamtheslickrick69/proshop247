"""
ProShop 24/7 - FastAPI Backend
Main application entry point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from routes import chat, voice, demo
from models.schemas import HealthResponse
from config.settings import validate_settings, ENVIRONMENT, PORT

# Validate environment variables on startup
try:
    validate_settings()
    print("✅ Environment variables validated")
except ValueError as e:
    print(f"❌ Configuration error: {e}")
    print("Please check your .env file")
    exit(1)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown"""
    # Startup
    print("\n" + "="*60)
    print("🚀 ProShop 24/7 API Starting...")
    print("="*60)
    print(f"Environment: {ENVIRONMENT}")
    print(f"Port: {PORT}")
    print(f"Docs: http://localhost:{PORT}/docs")
    print("="*60 + "\n")

    yield

    # Shutdown
    print("\n" + "="*60)
    print("👋 ProShop 24/7 API Shutting Down...")
    print("="*60 + "\n")


# Create FastAPI app
app = FastAPI(
    title="ProShop 24/7 API",
    description="AI Voice Agent for Golf Courses",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware - allow all origins for development
# TODO: Restrict origins in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: ["https://your-frontend.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/v1", tags=["Chat"])
app.include_router(voice.router, prefix="/v1", tags=["Voice"])
app.include_router(demo.router, prefix="/v1", tags=["Demo"])


@app.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint - health check"""
    return HealthResponse(
        status="healthy",
        message="ProShop 24/7 API is running",
        version="1.0.0"
    )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        message="All systems operational",
        version="1.0.0"
    )


# For running directly with python main.py
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=PORT,
        reload=True if ENVIRONMENT == "development" else False
    )
