#!/bin/bash

# 🚀 PM2 WebSocket Service Deployment
# Deploy Conversational AI Service dengan PM2 untuk production

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SERVER_IP="156.67.217.39"
SERVICE_NAME="conversational-ai-service"
REMOTE_PATH="/var/www/medimedi-vr/conversational-ai-service"

echo -e "${BLUE}🚀 PM2 WebSocket Service Deployment${NC}"
echo -e "${BLUE}====================================${NC}"
echo ""

# Upload ecosystem config
echo -e "${YELLOW}📤 Uploading PM2 configuration...${NC}"
scp conversational-ai-service/ecosystem.config.js root@$SERVER_IP:$REMOTE_PATH/

# Deploy on server
echo -e "${YELLOW}🔧 Deploying PM2 service...${NC}"
ssh root@$SERVER_IP << EOF
set -e

cd $REMOTE_PATH

# Install PM2 if not exists
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Create log directory
mkdir -p /var/log/pm2

# Stop existing service if running
echo "🛑 Stopping existing service..."
pm2 stop $SERVICE_NAME 2>/dev/null || true
pm2 delete $SERVICE_NAME 2>/dev/null || true

# Start service with ecosystem config
echo "🚀 Starting service with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Setup PM2 startup
echo "⚙️ Setting up PM2 startup..."
pm2 startup systemd -u root --hp /root

# Show status
echo "📊 PM2 Status:"
pm2 status
pm2 logs $SERVICE_NAME --lines 10

echo ""
echo "✅ PM2 deployment completed!"
echo "📋 Available commands:"
echo "  pm2 status                    # Check service status"
echo "  pm2 logs $SERVICE_NAME        # View logs"
echo "  pm2 restart $SERVICE_NAME     # Restart service"
echo "  pm2 stop $SERVICE_NAME        # Stop service"
echo "  pm2 monit                     # Real-time monitoring"
EOF

echo ""
echo -e "${GREEN}🎉 PM2 WebSocket service deployed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Service Details:${NC}"
echo "• Name: $SERVICE_NAME"
echo "• Port: 3001"
echo "• Auto-restart: Enabled"
echo "• Memory limit: 1GB"
echo "• Logs: /var/log/pm2/"
echo ""
echo -e "${BLUE}🔗 Endpoints:${NC}"
echo "• WebSocket: wss://medimedi.dickyri.net/ws"
echo "• Health: https://medimedi.dickyri.net/health"
echo "• Status: https://medimedi.dickyri.net/ai-status"