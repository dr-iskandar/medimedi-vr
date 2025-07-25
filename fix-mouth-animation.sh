#!/bin/bash

# 🎤 Fix Mouth Animation Script
# This script fixes the mouth animation issue in Quest VR

echo "🎤 Fixing mouth animation for Quest VR..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="156.67.217.39"
SERVER_PORT="5211"
SERVER_USER="root"
REMOTE_PATH="/root/medimedi-konvergen-vr"
LOCAL_PATH="."

echo -e "${BLUE}📋 Configuration:${NC}"
echo -e "  Server: ${SERVER_IP}:${SERVER_PORT}"
echo -e "  Remote path: ${REMOTE_PATH}"
echo -e "  Local path: ${LOCAL_PATH}"
echo ""

# Step 1: Build frontend locally
echo -e "${YELLOW}🔨 Step 1: Building frontend locally...${NC}"
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm not found. Installing...${NC}"
    npm install -g pnpm
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    pnpm install
fi

# Build the project
echo -e "${YELLOW}🏗️ Building project...${NC}"
pnpm build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend build successful${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

# Step 2: Deploy to server
echo -e "${YELLOW}🚀 Step 2: Deploying to server...${NC}"

# Copy updated files to server
echo -e "${BLUE}📤 Copying files to server...${NC}"
scp -P $SERVER_PORT -r dist/ $SERVER_USER@$SERVER_IP:$REMOTE_PATH/
scp -P $SERVER_PORT src/components/Avatar.jsx $SERVER_USER@$SERVER_IP:$REMOTE_PATH/src/components/
scp -P $SERVER_PORT src/components/VRConversationInterface.jsx $SERVER_USER@$SERVER_IP:$REMOTE_PATH/src/components/
scp -P $SERVER_PORT src/App.jsx $SERVER_USER@$SERVER_IP:$REMOTE_PATH/src/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Files copied successfully${NC}"
else
    echo -e "${RED}❌ Failed to copy files${NC}"
    exit 1
fi

# Step 3: Build and restart on server
echo -e "${YELLOW}🔄 Step 3: Building and restarting on server...${NC}"

ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP << 'EOF'
cd /root/medimedi-konvergen-vr

echo "🏗️ Building on server..."
pnpm build

if [ $? -eq 0 ]; then
    echo "✅ Server build successful"
    
    # Restart PM2 processes
    echo "🔄 Restarting PM2 processes..."
    pm2 restart medimedi-frontend || pm2 start "pnpm preview --host 0.0.0.0 --port 3000" --name medimedi-frontend
    pm2 restart medimedi-backend || echo "Backend not running or already restarted"
    
    # Reload Nginx
    echo "🔄 Reloading Nginx..."
    systemctl reload nginx
    
    echo "✅ Services restarted successfully"
else
    echo "❌ Server build failed"
    exit 1
fi
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Server deployment successful${NC}"
else
    echo -e "${RED}❌ Server deployment failed${NC}"
    exit 1
fi

# Step 4: Test the application
echo -e "${YELLOW}🧪 Step 4: Testing the application...${NC}"

echo -e "${BLUE}🌐 Testing frontend...${NC}"
curl -s -o /dev/null -w "%{http_code}" https://medimedi.dickyri.net/ | grep -q "200" && echo -e "${GREEN}✅ Frontend is accessible${NC}" || echo -e "${RED}❌ Frontend is not accessible${NC}"

echo -e "${BLUE}🔧 Testing backend...${NC}"
curl -s -o /dev/null -w "%{http_code}" https://medimedi.dickyri.net/api/emotion/test | grep -q "200" && echo -e "${GREEN}✅ Backend is accessible${NC}" || echo -e "${RED}❌ Backend is not accessible${NC}"

echo ""
echo -e "${GREEN}🎉 Mouth animation fix deployment completed!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "  1. Open https://medimedi.dickyri.net/ in Quest browser"
echo -e "  2. Enter VR mode"
echo -e "  3. Start a conversation"
echo -e "  4. Check browser console for mouth animation logs"
echo -e "  5. Verify that mouth moves when agent is speaking"
echo ""
echo -e "${YELLOW}🔍 Debug tips:${NC}"
echo -e "  - Check browser console for '🎤 VR' logs"
echo -e "  - Look for 'Available morph targets' log"
echo -e "  - Verify 'isSpeaking' status changes"
echo -e "  - Check 'Mouth animation value' logs during speech"
echo ""