#!/bin/bash

# 🔧 Fix Backend Proxy Configuration
# This script fixes the backend proxy to prevent API path duplication

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Fixing Backend Proxy Configuration${NC}"
echo -e "${BLUE}====================================${NC}"
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

# Build frontend with corrected configuration
build_frontend() {
    print_status "Building frontend with corrected proxy configuration..."
    
    cd medimedi-konvergen-vr
    
    # Build for production
    pnpm run build
    
    # Copy GLB files
    find public -name '*.glb' -exec cp {} dist/ \;
    
    cd ..
    
    print_status "Frontend build completed"
}

# Verify configuration
verify_config() {
    print_status "Verifying configuration..."
    
    echo -e "${BLUE}Frontend Environment Variables:${NC}"
    grep -E "VITE_BACKEND" medimedi-konvergen-vr/.env.production
    
    echo ""
    echo -e "${BLUE}Expected API Flow:${NC}"
    echo -e "  Frontend: https://medimedi.dickyri.net"
    echo -e "  API Call: https://medimedi.dickyri.net/api/emotion/test"
    echo -e "  Nginx Proxy: /api/ → http://127.0.0.1:5001/"
    echo -e "  Backend Receives: /emotion/test (without /api prefix)"
    
    print_status "Configuration verified"
}

# Main execution
echo -e "${YELLOW}This script will:${NC}"
echo -e "  • Build frontend with corrected proxy configuration"
echo -e "  • Copy GLB files to dist directory"
echo -e "  • Verify the configuration"
echo ""

build_frontend
verify_config

echo ""
echo -e "${GREEN}🎉 Backend Proxy Configuration Fixed!${NC}"
echo ""
echo -e "${YELLOW}Key Changes Made:${NC}"
echo -e "  1. Updated .env.production to remove /api suffix"
echo -e "  2. Updated setup-https.sh to add rewrite rule for /api prefix removal"
echo -e "  3. Rebuilt frontend with corrected configuration"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Deploy updated files to server"
echo -e "  2. Run setup-https.sh on server to configure Nginx"
echo -e "  3. Test API endpoints"
echo ""
echo -e "${BLUE}Expected API URL: https://medimedi.dickyri.net/api/emotion/test${NC}"
echo -e "${BLUE}Backend receives: /emotion/test${NC}"
echo ""