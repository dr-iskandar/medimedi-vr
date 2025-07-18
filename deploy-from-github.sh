#!/bin/bash

# Deploy MediMedi VR from GitHub
# Usage: ./deploy-from-github.sh [branch_name]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/dr-iskandar/medimedi-vr.git"
BRANCH=${1:-main}
APP_DIR="/opt/medimedi-vr"
BACKEND_PORT=5001
FRONTEND_PORT=5211
USER="ubuntu"

echo -e "${BLUE}🚀 MediMedi VR GitHub Deployment Script${NC}"
echo -e "${BLUE}======================================${NC}"
echo -e "Repository: ${REPO_URL}"
echo -e "Branch: ${BRANCH}"
echo -e "Target Directory: ${APP_DIR}"
echo -e "Backend Port: ${BACKEND_PORT}"
echo -e "Frontend Port: ${FRONTEND_PORT}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Installing..."
    sudo apt update
    sudo apt install -y git
fi

# Check if directory exists
if [ -d "$APP_DIR" ]; then
    print_status "Directory exists. Updating from GitHub..."
    cd "$APP_DIR"
    
    # Stop services before update
    print_status "Stopping services..."
    sudo pm2 stop medimedi-backend || true
    sudo systemctl stop nginx || true
    
    # Backup current version
    print_status "Creating backup..."
    sudo cp -r "$APP_DIR" "${APP_DIR}_backup_$(date +%Y%m%d_%H%M%S)" || true
    
    # Pull latest changes
    print_status "Pulling latest changes from ${BRANCH}..."
    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
    
else
    print_status "Cloning repository..."
    sudo mkdir -p "$APP_DIR"
    sudo chown "$USER:$USER" "$APP_DIR"
    git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# Install system dependencies
print_status "Installing system dependencies..."
sudo apt update
sudo apt install -y python3 python3-pip python3-venv nodejs npm nginx

# Install Node.js 18+ if needed
if ! node --version | grep -q "v1[8-9]\|v[2-9][0-9]"; then
    print_status "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install pnpm
if ! command -v pnpm &> /dev/null; then
    print_status "Installing pnpm..."
    sudo npm install -g pnpm
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
fi

# Setup Backend
print_status "Setting up backend..."
cd "$APP_DIR/emotion-analysis-backend"

# Create virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Create PM2 ecosystem file for backend
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'medimedi-backend',
    script: 'src/main.py',
    interpreter: './venv/bin/python',
    cwd: '$APP_DIR/emotion-analysis-backend',
    env: {
      FLASK_ENV: 'production',
      PORT: '$BACKEND_PORT'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start backend with PM2
print_status "Starting backend service..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Setup Frontend
print_status "Setting up frontend..."
cd "$APP_DIR/medimedi-konvergen-vr"

# Install dependencies
pnpm install

# Copy production environment
if [ -f "../.env.production" ]; then
    cp "../.env.production" ".env.production"
fi

# Build for production
print_status "Building frontend..."
pnpm build

# Setup Nginx
print_status "Configuring Nginx..."

# Add GLB MIME type to Nginx
sudo tee /etc/nginx/conf.d/glb-mime.conf > /dev/null << EOF
# MIME type for GLB files
location ~* \.glb\$ {
    add_header Content-Type "model/gltf-binary";
}
EOF

sudo tee /etc/nginx/sites-available/medimedi-vr > /dev/null << EOF
server {
    listen $FRONTEND_PORT;
    server_name _;
    
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
        proxy_pass http://localhost:$BACKEND_PORT;
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
        add_header Access-Control-Allow-Origin *;
        add_header Cache-Control "public, max-age=31536000";
        expires 1y;
    }
    
    # GLTF files
    location ~* \.gltf\$ {
        root $APP_DIR/medimedi-konvergen-vr/dist;
        add_header Content-Type "model/gltf+json";
        add_header Access-Control-Allow-Origin *;
        add_header Cache-Control "public, max-age=31536000";
        expires 1y;
    }
    
    # Other WebXR and VR assets
    location ~* \.(jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)\$ {
        root $APP_DIR/medimedi-konvergen-vr/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin *;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/medimedi-vr /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Configure firewall
print_status "Configuring firewall..."
sudo ufw allow $FRONTEND_PORT/tcp
sudo ufw allow $BACKEND_PORT/tcp
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Set up log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/medimedi-vr > /dev/null << EOF
$APP_DIR/emotion-analysis-backend/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reload medimedi-backend
    endscript
}
EOF

# Create update script
print_status "Creating update script..."
sudo tee /usr/local/bin/update-medimedi-vr > /dev/null << EOF
#!/bin/bash
cd $APP_DIR
git pull origin $BRANCH
cd emotion-analysis-backend
source venv/bin/activate
pip install -r requirements.txt
pm2 restart medimedi-backend
cd ../medimedi-konvergen-vr
pnpm install
pnpm build
sudo systemctl reload nginx
echo "MediMedi VR updated successfully!"
EOF

sudo chmod +x /usr/local/bin/update-medimedi-vr

# Final status check
print_status "Checking services status..."
echo ""
echo "=== Service Status ==="
echo "Backend (PM2):"
pm2 status medimedi-backend
echo ""
echo "Nginx:"
sudo systemctl status nginx --no-pager -l
echo ""
echo "Firewall:"
sudo ufw status

print_status "Deployment completed successfully!"
echo ""
echo -e "${GREEN}🎉 MediMedi VR is now running!${NC}"
echo -e "${BLUE}📱 Frontend:${NC} http://$(curl -s ifconfig.me):$FRONTEND_PORT"
echo -e "${BLUE}🔧 Backend API:${NC} http://$(curl -s ifconfig.me):$FRONTEND_PORT/api"
echo -e "${BLUE}📊 PM2 Monitor:${NC} pm2 monit"
echo ""
echo -e "${YELLOW}📝 Quick Commands:${NC}"
echo -e "  Update app: ${BLUE}sudo update-medimedi-vr${NC}"
echo -e "  Check logs: ${BLUE}pm2 logs medimedi-backend${NC}"
echo -e "  Restart backend: ${BLUE}pm2 restart medimedi-backend${NC}"
echo -e "  Restart nginx: ${BLUE}sudo systemctl restart nginx${NC}"
echo ""
echo -e "${GREEN}✅ Ready for VR experiences!${NC}"