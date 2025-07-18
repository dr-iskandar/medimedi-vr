#!/bin/bash

# 🚀 MediMedi VR Deployment Script
# Server: 156.67.217.39
# Port: 5211

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="156.67.217.39"
SERVER_PORT="5211"
BACKEND_PORT="5001"
PROJECT_DIR="/var/www/medimedi-vr"
LOCAL_DIR="$(pwd)"

echo -e "${BLUE}🚀 MediMedi VR Deployment Script${NC}"
echo -e "${BLUE}=================================${NC}"
echo -e "Server: ${GREEN}${SERVER_IP}${NC}"
echo -e "Port: ${GREEN}${SERVER_PORT}${NC}"
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

# Check if we're running locally or on server
if [[ "$(hostname -I | awk '{print $1}')" == "${SERVER_IP}" ]]; then
    DEPLOY_MODE="server"
    echo -e "${GREEN}Running on server${NC}"
else
    DEPLOY_MODE="local"
    echo -e "${YELLOW}Running locally - will deploy to server${NC}"
fi

# Function to setup server environment
setup_server() {
    print_status "Setting up server environment..."
    
    # Update system
    sudo apt update && sudo apt upgrade -y
    
    # Install Node.js
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
        print_status "Node.js installed"
    fi
    
    # Install Python
    sudo apt install python3 python3-pip python3-venv -y
    
    # Install PM2
    if ! command -v pm2 &> /dev/null; then
        sudo npm install -g pm2
        print_status "PM2 installed"
    fi
    
    # Install pnpm
    if ! command -v pnpm &> /dev/null; then
        sudo npm install -g pnpm
        print_status "pnpm installed"
    fi
    
    # Install nginx
    if ! command -v nginx &> /dev/null; then
        sudo apt install nginx -y
        print_status "Nginx installed"
    fi
    
    # Create project directory
    sudo mkdir -p ${PROJECT_DIR}
    sudo chown -R $USER:$USER ${PROJECT_DIR}
}

# Function to deploy from local to server
deploy_to_server() {
    print_status "Deploying to server..."
    
    # Check if server is accessible
    if ! ping -c 1 ${SERVER_IP} &> /dev/null; then
        print_error "Server ${SERVER_IP} is not accessible"
        exit 1
    fi
    
    # Upload files to server
    print_status "Uploading files to server..."
    rsync -avz --exclude 'node_modules' --exclude 'venv' --exclude '.git' \
        ${LOCAL_DIR}/ root@${SERVER_IP}:${PROJECT_DIR}/
    
    # Run setup on server
    print_status "Running setup on server..."
    ssh root@${SERVER_IP} "cd ${PROJECT_DIR} && bash deploy.sh"
}

# Function to setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd ${PROJECT_DIR}/emotion-analysis-backend
    
    # Create virtual environment
    python3 -m venv venv
    source venv/bin/activate
    
    # Install dependencies
    pip install -r requirements.txt
    
    # Configure for production
    sed -i 's/debug=True/debug=False/g' src/main.py
    sed -i 's/host="127.0.0.1"/host="0.0.0.0"/g' src/main.py
    
    # Create PM2 ecosystem file
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'medimedi-backend',
    script: 'venv/bin/python',
    args: 'src/main.py',
    cwd: '/var/www/medimedi-vr/emotion-analysis-backend',
    env: {
      FLASK_ENV: 'production'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
EOF
    
    # Stop existing process if running
    pm2 delete medimedi-backend 2>/dev/null || true
    
    # Start backend
    pm2 start ecosystem.config.js
    pm2 save
    
    print_status "Backend setup completed"
}

# Function to setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd ${PROJECT_DIR}/medimedi-konvergen-vr
    
    # Install dependencies
    pnpm install
    
    # Build for production
    pnpm run build
    
    print_status "Frontend build completed"
}

# Function to configure nginx
setup_nginx() {
    print_status "Configuring Nginx..."
    
    # Create nginx configuration
    sudo tee /etc/nginx/sites-available/medimedi-vr << EOF
server {
    listen ${SERVER_PORT};
    server_name ${SERVER_IP};
    
    # Frontend (React)
    location / {
        root ${PROJECT_DIR}/medimedi-konvergen-vr/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
        
        # CORS headers untuk VR
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT}/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # CORS untuk API
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
    }
}
EOF
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/medimedi-vr /etc/nginx/sites-enabled/
    
    # Remove default site if exists
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    sudo nginx -t
    
    # Reload nginx
    sudo systemctl reload nginx
    sudo systemctl enable nginx
    
    print_status "Nginx configured"
}

# Function to configure firewall
setup_firewall() {
    print_status "Configuring firewall..."
    
    # Install ufw if not present
    sudo apt install ufw -y
    
    # Configure firewall
    sudo ufw allow ssh
    sudo ufw allow ${SERVER_PORT}
    sudo ufw allow ${BACKEND_PORT}
    
    # Enable firewall (with --force to avoid interactive prompt)
    sudo ufw --force enable
    
    print_status "Firewall configured"
}

# Function to test deployment
test_deployment() {
    print_status "Testing deployment..."
    
    # Wait a moment for services to start
    sleep 5
    
    # Test backend
    if curl -f http://localhost:${BACKEND_PORT}/health &> /dev/null; then
        print_status "Backend is running on port ${BACKEND_PORT}"
    else
        print_warning "Backend test failed"
    fi
    
    # Test frontend
    if curl -f http://localhost:${SERVER_PORT} &> /dev/null; then
        print_status "Frontend is running on port ${SERVER_PORT}"
    else
        print_warning "Frontend test failed"
    fi
    
    # Show PM2 status
    pm2 status
    
    echo ""
    echo -e "${GREEN}🎉 Deployment completed!${NC}"
    echo -e "${BLUE}Access your VR application at: http://${SERVER_IP}:${SERVER_PORT}${NC}"
    echo -e "${BLUE}Backend API available at: http://${SERVER_IP}:${SERVER_PORT}/api/${NC}"
}

# Main deployment flow
if [[ "$DEPLOY_MODE" == "local" ]]; then
    deploy_to_server
else
    # Running on server
    setup_server
    setup_backend
    setup_frontend
    setup_nginx
    setup_firewall
    test_deployment
fi

print_status "Deployment script completed!"