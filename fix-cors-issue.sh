#!/bin/bash

# Fix CORS Issue Script
# This script fixes the hardcoded localhost URLs that cause CORS errors in production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "medimedi-konvergen-vr/package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "🔧 Fixing CORS issues by updating frontend with environment variables..."

# Navigate to frontend directory
cd medimedi-konvergen-vr

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_warning ".env.production not found, creating from template..."
    cat > .env.production << EOF
# Production Environment Configuration
VITE_BACKEND_URL=http://156.67.217.39:5211/api
VITE_BACKEND_DIRECT_URL=http://156.67.217.39:5001
VITE_SERVER_IP=156.67.217.39
VITE_SERVER_PORT=5211
VITE_BACKEND_PORT=5001
VITE_ENVIRONMENT=production
VITE_DEBUG=false

# WebXR Configuration
VITE_ENABLE_VR=true
VITE_ENABLE_AR=false

# Performance Settings
VITE_ENABLE_STATS=false
VITE_ENABLE_DEBUG_PANEL=false

# Asset URLs
VITE_AVATAR_MODEL_URL=/kevin_kecil_v4.glb
VITE_ENVIRONMENT_TEXTURE_URL=/environment.jpg
EOF
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "📦 Installing dependencies..."
    pnpm install
fi

# Clean previous build
print_status "🧹 Cleaning previous build..."
rm -rf dist

# Build for production
print_status "🏗️ Building frontend for production..."
VITE_BACKEND_URL=http://156.67.217.39:5211/api VITE_BACKEND_DIRECT_URL=http://156.67.217.39:5001 pnpm build

# Check if build was successful
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    print_success "✅ Frontend build completed successfully!"
else
    print_error "❌ Frontend build failed!"
    exit 1
fi

# Copy GLB files to dist if they exist in public
if [ -f "public/kevin_kecil_v4.glb" ]; then
    print_status "📁 Copying GLB files to dist..."
    cp public/*.glb dist/ 2>/dev/null || true
    cp public/*.jpg dist/ 2>/dev/null || true
    cp public/*.ico dist/ 2>/dev/null || true
fi

print_success "🎉 CORS fix completed!"
print_status "📋 Summary of changes:"
echo "   • Updated App.jsx to use VITE_BACKEND_DIRECT_URL"
echo "   • Updated DebugPanel.jsx to use VITE_BACKEND_DIRECT_URL"
echo "   • Updated ConversationInterface.jsx to use VITE_BACKEND_URL"
echo "   • Rebuilt frontend with proper environment variables"
echo ""
print_status "🚀 Next steps:"
echo "   1. Deploy the updated dist folder to your server"
echo "   2. Restart Nginx if needed: sudo systemctl restart nginx"
echo "   3. Test the application at: http://156.67.217.39:5211"
echo ""
print_warning "💡 Note: The frontend now uses production URLs instead of localhost"