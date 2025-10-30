#!/bin/bash

# ProShop 24/7 - CORS Update Helper Script
# Automatically updates CORS settings in backend main.py

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

MAIN_PY="/Users/isr/Desktop/THISISTHE1/backend/main.py"

echo ""
echo "=========================================="
echo -e "${BLUE}ProShop 24/7 - CORS Configuration${NC}"
echo "=========================================="
echo ""

# Get Vercel URL from user
if [ -z "$1" ]; then
    read -p "Enter your Vercel production URL (e.g., https://proshop247.vercel.app): " VERCEL_URL
else
    VERCEL_URL="$1"
fi

# Validate URL
if [[ ! "$VERCEL_URL" =~ ^https?:// ]]; then
    echo -e "${YELLOW}Warning: URL should start with https://${NC}"
    VERCEL_URL="https://$VERCEL_URL"
fi

echo ""
echo "Will update CORS to allow:"
echo "  - $VERCEL_URL"
echo ""

# Backup original file
echo "Creating backup of main.py..."
cp "$MAIN_PY" "$MAIN_PY.backup"
echo -e "${GREEN}✓${NC} Backup created: $MAIN_PY.backup"

# Update CORS settings
echo "Updating CORS configuration..."

# Create the new CORS configuration
NEW_CORS="app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        \"$VERCEL_URL\",
        \"https://www.proshop247.com\",  # Custom domain (if you have one)
    ],
    allow_credentials=True,
    allow_methods=[\"*\"],
    allow_headers=[\"*\"],
)"

# Use sed to replace the CORS middleware block
# This is a bit complex because we need to replace multiple lines
python3 << EOF
import re

with open('$MAIN_PY', 'r') as f:
    content = f.read()

# Pattern to match the CORS middleware block
pattern = r'app\.add_middleware\s*\(\s*CORSMiddleware,[\s\S]*?\)'

# Replacement
replacement = '''app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "$VERCEL_URL",
        "https://www.proshop247.com",  # Custom domain (if you have one)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)'''

# Replace
new_content = re.sub(pattern, replacement, content)

# Write back
with open('$MAIN_PY', 'w') as f:
    f.write(new_content)

print("✓ CORS configuration updated")
EOF

echo ""
echo "Changes made:"
echo "=========================================="
grep -A 7 "add_middleware" "$MAIN_PY" | head -8
echo "=========================================="
echo ""

echo -e "${GREEN}✓${NC} CORS configuration updated successfully!"
echo ""
echo "Next steps:"
echo "1. Review the changes above"
echo "2. If correct, deploy to Railway:"
echo "   cd /Users/isr/Desktop/THISISTHE1/backend"
echo "   railway up"
echo ""
echo "3. If something went wrong, restore backup:"
echo "   cp $MAIN_PY.backup $MAIN_PY"
echo ""
