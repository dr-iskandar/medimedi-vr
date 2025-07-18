#!/bin/bash

# 🔧 Fix Frontend API Endpoints for MediMedi VR
# This script fixes the frontend API endpoints and redeploys the application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Fixing Frontend API Endpoints for MediMedi VR${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Configuration
SERVER_IP="156.67.217.39"
SERVER_PORT="5211"
PROJECT_DIR="/var/www/medimedi-vr"
FRONTEND_DIR="medimedi-konvergen-vr"

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

# Build frontend locally
build_frontend() {
    print_status "Building frontend locally..."
    
    cd ${FRONTEND_DIR}
    
    # Install dependencies
    pnpm install
    
    # Build for production
    pnpm run build
    
    if [ $? -eq 0 ]; then
        print_status "Frontend built successfully"
    else
        print_error "Frontend build failed"
        exit 1
    fi
    
    cd ..
}

# Deploy to server
deploy_to_server() {
    print_status "Deploying to server..."
    
    # Sync frontend files
    rsync -avz --delete \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude '.env.local' \
        ${FRONTEND_DIR}/ \
        root@${SERVER_IP}:${PROJECT_DIR}/${FRONTEND_DIR}/
    
    if [ $? -eq 0 ]; then
        print_status "Frontend files synced to server"
    else
        print_error "Failed to sync frontend files"
        exit 1
    fi
}

# Build on server
build_on_server() {
    print_status "Building frontend on server..."
    
    ssh root@${SERVER_IP} << 'EOF'
set -e

# Navigate to project directory
cd /var/www/medimedi-vr/medimedi-konvergen-vr

# Install dependencies
pnpm install

# Build for production
pnpm run build

echo "✅ Frontend built on server"
EOF

    if [ $? -eq 0 ]; then
        print_status "Frontend built successfully on server"
    else
        print_error "Failed to build frontend on server"
        exit 1
    fi
}

# Restart services on server
restart_services() {
    print_status "Restarting services on server..."
    
    ssh root@${SERVER_IP} << 'EOF'
set -e

# Restart backend
cd /var/www/medimedi-vr/emotion-analysis-backend
pm2 restart emotion-analysis || pm2 start src/main.py --name emotion-analysis --interpreter python3

# Restart nginx
sudo systemctl reload nginx

echo "✅ Services restarted"
EOF

    if [ $? -eq 0 ]; then
        print_status "Services restarted successfully"
    else
        print_error "Failed to restart services"
        exit 1
    fi
}

# Test endpoints
test_endpoints() {
    print_status "Testing API endpoints..."
    
    sleep 5
    
    # Test emotion analysis endpoint
    echo "Testing emotion analysis API..."
    curl -X POST https://medimedi.dickyri.net/api/emotion/analyze \
         -H "Content-Type: application/json" \
         -d '{"text":"I am very happy today"}' \
         -k -s | jq .
    
    if [ $? -eq 0 ]; then
        print_status "API endpoint test successful"
    else
        print_warning "API endpoint test failed - check server logs"
    fi
    
    # Test frontend
    echo "Testing frontend..."
    curl -I https://medimedi.dickyri.net/ -k -s
    
    if [ $? -eq 0 ]; then
        print_status "Frontend test successful"
    else
        print_warning "Frontend test failed"
    fi
}

# Show summary of changes
show_changes() {
    echo ""
    echo -e "${YELLOW}📋 Changes Made:${NC}"
    echo -e "  • Fixed VRConversationInterface.jsx: /emotion/analyze → /api/emotion/analyze"
    echo -e "  • Fixed DebugPanel.jsx: /emotion/test → /api/emotion/test"
    echo -e "  • Fixed DebugPanel.jsx: /emotion/analyze → /api/emotion/analyze"
    echo -e "  • Rebuilt and deployed frontend"
    echo -e "  • Restarted backend and nginx services"
    echo ""
}

# Main execution
echo -e "${YELLOW}This script will:${NC}"
echo -e "  • Build frontend locally with fixed endpoints"
echo -e "  • Deploy to server (${SERVER_IP})"
echo -e "  • Build frontend on server"
echo -e "  • Restart services"
echo -e "  • Test API endpoints"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

build_frontend
deploy_to_server
build_on_server
restart_services
test_endpoints
show_changes

echo ""
echo -e "${GREEN}🎉 Frontend Endpoints Fixed and Deployed!${NC}"
echo -e "${BLUE}Your VR application is now available at: https://medimedi.dickyri.net${NC}"
echo -e "${BLUE}API endpoint: https://medimedi.dickyri.net/api/emotion/analyze${NC}"
echo ""
echo -e "${YELLOW}Verification:${NC}"
echo -e "  1. Visit https://medimedi.dickyri.net - should show VR application"
echo -e "  2. Test emotion analysis in the VR interface"
echo -e "  3. Check browser console for successful API calls"
echo ""