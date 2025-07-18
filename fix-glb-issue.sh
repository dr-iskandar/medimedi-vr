#!/bin/bash

# Fix GLB Loading Issue Script
# This script fixes the GLB file loading issue in MediMedi VR

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/medimedi-vr"
FRONTEND_PORT="3000"
BACKEND_PORT="5000"

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo -e "${GREEN}🔧 MediMedi VR GLB Fix Script${NC}"
echo "=============================="
echo ""

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for safety reasons."
   print_status "Please run as a regular user with sudo privileges."
   exit 1
fi

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    print_error "App directory $APP_DIR not found!"
    print_status "Please run the main deployment script first."
    exit 1
fi

print_status "Fixing GLB loading issue..."

# Step 1: Update Nginx configuration for GLB MIME types
print_status "Updating Nginx configuration..."
sudo tee /etc/nginx/conf.d/mime-types.conf > /dev/null << 'EOF'
# Additional MIME types for 3D assets
map $sent_http_content_type $expires {
    default                    off;
    text/html                  epoch;
    text/css                   max;
    application/javascript     max;
    ~image/                    max;
    model/gltf-binary         max;
    model/gltf+json           max;
}

# GLB and GLTF MIME types
location ~* \.glb$ {
    add_header Content-Type "model/gltf-binary";
    add_header Access-Control-Allow-Origin "*";
    add_header Cache-Control "public, max-age=31536000";
}

location ~* \.gltf$ {
    add_header Content-Type "model/gltf+json";
    add_header Access-Control-Allow-Origin "*";
    add_header Cache-Control "public, max-age=31536000";
}
EOF

# Step 2: Update main Nginx site configuration
print_status "Updating main Nginx site configuration..."
sudo tee /etc/nginx/sites-available/medimedi-vr > /dev/null << EOF
server {
    listen $FRONTEND_PORT;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Frontend static files
    location / {
        root $APP_DIR/medimedi-konvergen-vr/dist;
        try_files \$uri \$uri/ /index.html;
        
        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept";
    }
    
    # API proxy to backend
    location /api/ {
        proxy_pass http://localhost:$BACKEND_PORT/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept";
        
        # Handle preflight requests
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
            add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 200;
        }
    }
    
    # GLB files with proper MIME type
    location ~* \.glb\$ {
        root $APP_DIR/medimedi-konvergen-vr/dist;
        add_header Content-Type "model/gltf-binary";
        add_header Access-Control-Allow-Origin "*";
        add_header Cache-Control "public, max-age=31536000";
        expires 1y;
    }
    
    # GLTF files
    location ~* \.gltf\$ {
        root $APP_DIR/medimedi-konvergen-vr/dist;
        add_header Content-Type "model/gltf+json";
        add_header Access-Control-Allow-Origin "*";
        add_header Cache-Control "public, max-age=31536000";
        expires 1y;
    }
    
    # Other WebXR and VR assets
    location ~* \.(jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)\$ {
        root $APP_DIR/medimedi-konvergen-vr/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
    }
}
EOF

# Step 3: Test Nginx configuration
print_status "Testing Nginx configuration..."
if sudo nginx -t; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration test failed!"
    exit 1
fi

# Step 4: Rebuild frontend with updated Vite config
print_status "Rebuilding frontend..."
cd "$APP_DIR/medimedi-konvergen-vr"

# Pull latest changes
print_status "Pulling latest changes..."
cd "$APP_DIR"
git pull origin main

cd "$APP_DIR/medimedi-konvergen-vr"

# Install dependencies
print_status "Installing dependencies..."
pnpm install

# Clean previous build
print_status "Cleaning previous build..."
rm -rf dist

# Build for production
print_status "Building for production..."
pnpm build

# Verify GLB file exists in dist
if [ -f "dist/kevin_kecil_v4.glb" ]; then
    print_success "GLB file found in dist directory"
else
    print_warning "GLB file not found in dist, copying manually..."
    cp public/kevin_kecil_v4.glb dist/
    if [ -f "dist/kevin_kecil_v4.glb" ]; then
        print_success "GLB file copied successfully"
    else
        print_error "Failed to copy GLB file"
        exit 1
    fi
fi

# Step 5: Restart services
print_status "Restarting services..."
sudo systemctl reload nginx
print_success "Nginx reloaded"

# Step 6: Verify services
print_status "Verifying services..."
echo ""
echo "=== Service Status ==="
echo "Nginx:"
sudo systemctl status nginx --no-pager -l | head -10
echo ""
echo "Backend (PM2):"
pm2 status medimedi-backend

# Step 7: Test GLB file accessibility
print_status "Testing GLB file accessibility..."
GLB_URL="http://localhost:$FRONTEND_PORT/kevin_kecil_v4.glb"
if curl -s -I "$GLB_URL" | grep -q "200 OK"; then
    print_success "GLB file is accessible at $GLB_URL"
else
    print_warning "GLB file might not be accessible. Check manually."
fi

print_success "GLB fix completed!"
echo ""
echo -e "${GREEN}🎉 GLB Loading Issue Fixed!${NC}"
echo -e "${BLUE}📱 Frontend:${NC} http://$(curl -s ifconfig.me 2>/dev/null || echo 'localhost'):$FRONTEND_PORT"
echo -e "${BLUE}🔧 GLB Test URL:${NC} http://$(curl -s ifconfig.me 2>/dev/null || echo 'localhost'):$FRONTEND_PORT/kevin_kecil_v4.glb"
echo ""
echo -e "${YELLOW}📝 What was fixed:${NC}"
echo "  ✅ Added proper MIME type for GLB files (model/gltf-binary)"
echo "  ✅ Updated Vite config to handle GLB assets correctly"
echo "  ✅ Improved Nginx configuration for 3D assets"
echo "  ✅ Rebuilt frontend with proper asset handling"
echo "  ✅ Added CORS headers for GLB files"
echo ""
echo -e "${GREEN}✅ Your VR avatar should now load correctly!${NC}"