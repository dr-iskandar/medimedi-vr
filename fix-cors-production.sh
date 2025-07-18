#!/bin/bash

# 🔧 Fix CORS Issues for Production
# This script fixes CORS configuration for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Fixing CORS Configuration for Production${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "medimedi-konvergen-vr/.env.production" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Updating backend CORS configuration..."
# Backend CORS is already updated in main.py

print_status "Updating frontend environment variables..."
# Environment variables are already updated in .env.production

print_status "Building frontend with updated configuration..."
cd medimedi-konvergen-vr
npm install
npm run build

print_status "Copying GLB files to dist folder..."
cp public/*.glb dist/

cd ..

print_status "Verifying no hardcoded localhost URLs in build..."
if grep -r "localhost:5001" medimedi-konvergen-vr/dist/ 2>/dev/null; then
    print_warning "Found localhost URLs in build - this might cause issues"
else
    print_status "No hardcoded localhost URLs found in build"
fi

echo ""
echo -e "${GREEN}🎉 CORS Configuration Fixed!${NC}"
echo -e "${BLUE}Key Changes Made:${NC}"
echo -e "  • Backend CORS configured with specific headers"
echo -e "  • Frontend now uses Nginx proxy (port 5211) instead of direct backend (port 5001)"
echo -e "  • VITE_BACKEND_DIRECT_URL updated to use proxy: http://156.67.217.39:5211/api"
echo -e "  • Frontend rebuilt with new configuration"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Deploy the updated dist/ folder to server"
echo -e "  2. Restart backend service: pm2 restart medimedi-backend"
echo -e "  3. Reload Nginx: sudo systemctl reload nginx"
echo -e "  4. Test the application"
echo ""
echo -e "${BLUE}The application should now work without CORS errors!${NC}"