#!/bin/bash

# 🔒 Setup HTTPS for MediMedi VR
# This script configures SSL/HTTPS for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔒 Setting up HTTPS for MediMedi VR${NC}"
echo -e "${BLUE}===================================${NC}"
echo ""

# Configuration
DOMAIN="medimedi.dickyri.net"
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

# Install Certbot for Let's Encrypt SSL
install_certbot() {
    print_status "Installing Certbot for SSL certificates..."
    
    sudo apt update
    sudo apt install snapd -y
    sudo snap install core; sudo snap refresh core
    sudo snap install --classic certbot
    
    # Create symlink
    sudo ln -sf /snap/bin/certbot /usr/bin/certbot
    
    print_status "Certbot installed"
}

# Create Nginx configuration with HTTPS
setup_nginx_https() {
    print_status "Creating HTTPS Nginx configuration..."
    
    # Create nginx configuration with HTTPS
    sudo tee /etc/nginx/sites-available/medimedi-vr << EOF
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
    
    # SSL Configuration
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
    
    # Frontend (React)
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
    
    # Backend API
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
    
    print_status "HTTPS Nginx configuration created"
}

# Obtain SSL certificate
obtain_ssl_certificate() {
    print_status "Obtaining SSL certificate for ${DOMAIN}..."
    
    # Stop nginx temporarily
    sudo systemctl stop nginx
    
    # Obtain certificate
    sudo certbot certonly --standalone -d ${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN}
    
    if [ $? -eq 0 ]; then
        print_status "SSL certificate obtained successfully"
    else
        print_error "Failed to obtain SSL certificate"
        exit 1
    fi
}

# Setup auto-renewal
setup_auto_renewal() {
    print_status "Setting up SSL certificate auto-renewal..."
    
    # Test renewal
    sudo certbot renew --dry-run
    
    # Add cron job for auto-renewal
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
    
    print_status "Auto-renewal configured"
}

# Enable and start services
start_services() {
    print_status "Starting services..."
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/medimedi-vr /etc/nginx/sites-enabled/
    
    # Remove default site if exists
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    sudo nginx -t
    
    if [ $? -eq 0 ]; then
        # Start nginx
        sudo systemctl start nginx
        sudo systemctl enable nginx
        
        print_status "Nginx started with HTTPS configuration"
    else
        print_error "Nginx configuration test failed"
        exit 1
    fi
}

# Configure firewall for HTTPS
setup_firewall_https() {
    print_status "Configuring firewall for HTTPS..."
    
    sudo ufw allow 'Nginx Full'
    sudo ufw allow ssh
    
    print_status "Firewall configured for HTTPS"
}

# Test HTTPS
test_https() {
    print_status "Testing HTTPS configuration..."
    
    sleep 5
    
    if curl -f https://${DOMAIN} &> /dev/null; then
        print_status "HTTPS is working correctly"
    else
        print_warning "HTTPS test failed - please check configuration"
    fi
}

# Main execution
echo -e "${YELLOW}This script will:${NC}"
echo -e "  • Install Certbot for SSL certificates"
echo -e "  • Create HTTPS Nginx configuration"
echo -e "  • Obtain SSL certificate for ${DOMAIN}"
echo -e "  • Setup auto-renewal"
echo -e "  • Configure firewall"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

install_certbot
setup_nginx_https
obtain_ssl_certificate
setup_auto_renewal
start_services
setup_firewall_https
test_https

echo ""
echo -e "${GREEN}🎉 HTTPS Setup Completed!${NC}"
echo -e "${BLUE}Your VR application is now available at: https://${DOMAIN}${NC}"
echo -e "${BLUE}Backend API available at: https://${DOMAIN}/api/${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Update frontend environment variables to use HTTPS URLs"
echo -e "  2. Rebuild and deploy frontend"
echo -e "  3. Test the application"
echo ""