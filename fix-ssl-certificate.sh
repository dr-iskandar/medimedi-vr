#!/bin/bash

# 🔧 Fix SSL Certificate Mismatch for MediMedi VR
# This script fixes SSL certificate mismatch by obtaining correct certificate for medimedi.dickyri.net

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Fixing SSL Certificate Mismatch for MediMedi VR${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

# Configuration
DOMAIN="medimedi.dickyri.net"
OLD_DOMAIN="api.priapunyaselera-ai.com"
SERVER_IP="156.67.217.39"
BACKEND_PORT="5001"
PROJECT_DIR="/var/www/medimedi-vr"

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

# Check if running as root or with sudo
check_permissions() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root or with sudo"
        exit 1
    fi
}

# Remove old SSL certificates
remove_old_certificates() {
    print_status "Removing old SSL certificates..."
    
    # Stop nginx
    systemctl stop nginx
    
    # Remove old certificates if they exist
    if [ -d "/etc/letsencrypt/live/${OLD_DOMAIN}" ]; then
        certbot delete --cert-name ${OLD_DOMAIN} --non-interactive
        print_status "Removed old certificate for ${OLD_DOMAIN}"
    fi
    
    if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
        certbot delete --cert-name ${DOMAIN} --non-interactive
        print_status "Removed existing certificate for ${DOMAIN}"
    fi
}

# Obtain new SSL certificate for correct domain
obtain_new_certificate() {
    print_status "Obtaining new SSL certificate for ${DOMAIN}..."
    
    # Obtain certificate using standalone mode
    certbot certonly --standalone \
        -d ${DOMAIN} \
        --non-interactive \
        --agree-tos \
        --email admin@${DOMAIN} \
        --force-renewal
    
    if [ $? -eq 0 ]; then
        print_status "SSL certificate obtained successfully for ${DOMAIN}"
    else
        print_error "Failed to obtain SSL certificate for ${DOMAIN}"
        exit 1
    fi
}

# Update Nginx configuration with correct domain
update_nginx_config() {
    print_status "Updating Nginx configuration..."
    
    # Create correct nginx configuration
    tee /etc/nginx/sites-available/medimedi-vr << EOF
# HTTP redirect to HTTPS
server {
    listen 80;
    server_name ${DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name ${DOMAIN};
    
    # SSL Configuration - FIXED PATHS
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Frontend (React VR)
    location / {
        root ${PROJECT_DIR}/medimedi-konvergen-vr/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
        
        # CORS headers untuk VR
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # GLB files for VR
        location ~* \.glb\$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header 'Access-Control-Allow-Origin' '*';
        }
    }
    
    # Backend API - FIXED PROXY_PASS
    location /api/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # CORS untuk API
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
        
        # Handle preflight requests
        if (\$request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
}
EOF
    
    print_status "Nginx configuration updated with correct domain"
}

# Test and restart services
restart_services() {
    print_status "Testing and restarting services..."
    
    # Enable site
    ln -sf /etc/nginx/sites-available/medimedi-vr /etc/nginx/sites-enabled/
    
    # Remove default site if exists
    rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    nginx -t
    
    if [ $? -eq 0 ]; then
        # Start nginx
        systemctl start nginx
        systemctl enable nginx
        
        print_status "Nginx restarted with correct SSL configuration"
    else
        print_error "Nginx configuration test failed"
        exit 1
    fi
}

# Restart backend service
restart_backend() {
    print_status "Restarting backend service..."
    
    # Check if PM2 is managing the backend
    if command -v pm2 &> /dev/null; then
        cd ${PROJECT_DIR}/emotion-analysis-backend
        pm2 restart emotion-analysis || pm2 start src/main.py --name emotion-analysis --interpreter python3
        print_status "Backend service restarted"
    else
        print_warning "PM2 not found. Please manually restart the backend service"
    fi
}

# Test HTTPS with correct domain
test_https() {
    print_status "Testing HTTPS configuration..."
    
    sleep 5
    
    # Test HTTPS connection
    if curl -f -s https://${DOMAIN} &> /dev/null; then
        print_status "HTTPS is working correctly for ${DOMAIN}"
    else
        print_warning "HTTPS test failed - please check configuration"
    fi
    
    # Test API endpoint
    if curl -f -s https://${DOMAIN}/api/emotion/analyze &> /dev/null; then
        print_status "API endpoint is accessible"
    else
        print_warning "API endpoint test failed - backend may not be running"
    fi
}

# Main execution
echo -e "${YELLOW}This script will:${NC}"
echo -e "  • Remove old SSL certificates for ${OLD_DOMAIN}"
echo -e "  • Obtain new SSL certificate for ${DOMAIN}"
echo -e "  • Update Nginx configuration"
echo -e "  • Restart services"
echo -e "  • Test HTTPS functionality"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

check_permissions
remove_old_certificates
obtain_new_certificate
update_nginx_config
restart_services
restart_backend
test_https

echo ""
echo -e "${GREEN}🎉 SSL Certificate Fixed!${NC}"
echo -e "${BLUE}Your VR application is now available at: https://${DOMAIN}${NC}"
echo -e "${BLUE}Backend API available at: https://${DOMAIN}/api/${NC}"
echo ""
echo -e "${YELLOW}Verification Steps:${NC}"
echo -e "  1. Visit https://${DOMAIN} - should show VR application"
echo -e "  2. Check SSL certificate in browser - should show ${DOMAIN}"
echo -e "  3. Test API: curl -X POST https://${DOMAIN}/api/emotion/analyze -H 'Content-Type: application/json' -d '{\"text\":\"test\"}'"
echo ""