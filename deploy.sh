#!/bin/bash

# ProShop 24/7 - Automated Deployment Script
# This script automates the deployment process for both backend and frontend

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo ""
    echo "=========================================="
    echo -e "${BLUE}$1${NC}"
    echo "=========================================="
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Project directories
PROJECT_ROOT="/Users/isr/Desktop/THISISTHE1"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

print_header "ProShop 24/7 - Production Deployment"

# Step 1: Check prerequisites
print_header "Step 1: Checking Prerequisites"

if ! command -v railway &> /dev/null; then
    print_error "Railway CLI not found"
    exit 1
fi
print_success "Railway CLI found"

if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI not found"
    exit 1
fi
print_success "Vercel CLI found"

if ! command -v node &> /dev/null; then
    print_error "Node.js not found"
    exit 1
fi
print_success "Node.js found"

# Step 2: Check Railway authentication
print_header "Step 2: Checking Railway Authentication"

cd "$BACKEND_DIR"

if ! railway whoami &> /dev/null; then
    print_error "Not logged into Railway"
    print_info "Please run: railway login"
    print_info "Then run this script again"
    exit 1
fi

RAILWAY_USER=$(railway whoami 2>&1 | head -1)
print_success "Logged into Railway as: $RAILWAY_USER"

# Step 3: Check Vercel authentication
print_header "Step 3: Checking Vercel Authentication"

cd "$FRONTEND_DIR"

VERCEL_USER=$(vercel whoami 2>&1)
if [ $? -eq 0 ]; then
    print_success "Logged into Vercel as: $VERCEL_USER"
else
    print_error "Not logged into Vercel"
    print_info "Please run: vercel login"
    exit 1
fi

# Step 4: Deploy Backend to Railway
print_header "Step 4: Deploying Backend to Railway"

cd "$BACKEND_DIR"

# Check if Railway project is linked
if [ ! -d ".railway" ]; then
    print_warning "Railway project not linked"
    print_info "Linking to Railway project..."
    railway link
fi

print_info "Setting environment variables..."
if [ -f "set_railway_env.sh" ]; then
    chmod +x set_railway_env.sh
    ./set_railway_env.sh
    print_success "Environment variables set"
else
    print_warning "set_railway_env.sh not found, skipping..."
fi

print_info "Deploying backend to Railway..."
railway up

print_success "Backend deployed to Railway"

# Get Railway URL
RAILWAY_URL=$(railway domain 2>&1 | grep -o 'https://[^[:space:]]*' | head -1)
if [ -z "$RAILWAY_URL" ]; then
    print_warning "Could not auto-detect Railway URL"
    read -p "Enter your Railway URL (e.g., https://web-production-6834.up.railway.app): " RAILWAY_URL
fi

print_success "Railway URL: $RAILWAY_URL"

# Test backend
print_info "Testing backend health endpoint..."
sleep 5  # Wait for deployment to stabilize

HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/health")
if [ "$HEALTH_CHECK" = "200" ]; then
    print_success "Backend health check passed"
else
    print_warning "Backend health check returned: $HEALTH_CHECK"
    print_info "This might be normal if the backend is still starting up"
fi

# Step 5: Update Frontend Environment
print_header "Step 5: Updating Frontend Environment"

cd "$FRONTEND_DIR"

print_info "Updating .env.production with Railway URL..."
echo "VITE_API_URL=$RAILWAY_URL" > .env.production
print_success ".env.production updated"

# Step 6: Build Frontend
print_header "Step 6: Building Frontend"

cd "$FRONTEND_DIR"

print_info "Installing dependencies..."
npm install --silent

print_info "Building frontend..."
npm run build

if [ -d "dist" ]; then
    print_success "Frontend built successfully"
else
    print_error "Frontend build failed - dist directory not found"
    exit 1
fi

# Step 7: Deploy Frontend to Vercel
print_header "Step 7: Deploying Frontend to Vercel"

cd "$FRONTEND_DIR"

print_info "Deploying to Vercel..."
VERCEL_OUTPUT=$(vercel --prod --yes 2>&1)

# Extract Vercel URL from output
VERCEL_URL=$(echo "$VERCEL_OUTPUT" | grep -o 'https://[^[:space:]]*vercel.app' | head -1)

if [ -z "$VERCEL_URL" ]; then
    print_warning "Could not auto-detect Vercel URL"
    print_info "Please check Vercel dashboard for your deployment URL"
    VERCEL_URL="https://frontend-laxyv3bgp-rocky-teampayprocs-projects.vercel.app"
fi

print_success "Frontend deployed to Vercel"
print_success "Vercel URL: $VERCEL_URL"

# Step 8: Set Vercel Environment Variable
print_header "Step 8: Setting Vercel Environment Variables"

print_info "Setting VITE_API_URL in Vercel..."
# Note: This might prompt for input
vercel env add VITE_API_URL production --force <<< "$RAILWAY_URL" || print_warning "Environment variable might already exist"

# Step 9: Update Backend CORS
print_header "Step 9: Updating Backend CORS Settings"

print_warning "MANUAL STEP REQUIRED:"
print_info "Update /Users/isr/Desktop/THISISTHE1/backend/main.py"
print_info "Change allow_origins to include: $VERCEL_URL"
print_info ""
print_info "Replace:"
print_info '    allow_origins=["*"],'
print_info ""
print_info "With:"
print_info "    allow_origins=[\"$VERCEL_URL\"],"
print_info ""

read -p "Press Enter after you've updated main.py (or skip if not needed)..."

# Step 10: Redeploy Backend with CORS Changes
print_header "Step 10: Redeploying Backend with CORS Changes"

cd "$BACKEND_DIR"

print_info "Redeploying backend..."
railway up

print_success "Backend redeployed with CORS settings"

# Step 11: Summary
print_header "Deployment Complete!"

echo ""
echo "Production URLs:"
echo "=================================="
echo -e "${GREEN}Backend (Railway):${NC}  $RAILWAY_URL"
echo -e "${GREEN}Frontend (Vercel):${NC} $VERCEL_URL"
echo ""
echo "Next Steps:"
echo "=================================="
echo "1. Test backend health: curl $RAILWAY_URL/health"
echo "2. Visit frontend: open $VERCEL_URL"
echo "3. Test chat widget on frontend"
echo "4. Update Twilio webhook URL:"
echo "   https://console.twilio.com/us1/develop/phone-numbers/manage/active"
echo "   Set webhook to: $RAILWAY_URL/v1/webhook/voice"
echo ""
echo "5. Test voice call: +1 (227) 233-4997"
echo ""
echo "Monitor Logs:"
echo "=================================="
echo "Backend:  cd $BACKEND_DIR && railway logs"
echo "Frontend: cd $FRONTEND_DIR && vercel logs"
echo ""

print_success "All done! 🚀"
