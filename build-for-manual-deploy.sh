#!/bin/bash

# 🎤 Build for Manual Deploy - Mouth Animation Fix
# This script builds the frontend locally and prepares files for manual upload

echo "🎤 Building mouth animation fix for manual deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="medimedi-konvergen-vr"
BUILD_DIR="manual-deploy-files"

echo -e "${BLUE}📋 Configuration:${NC}"
echo -e "  Project: ${PROJECT_DIR}"
echo -e "  Output: ${BUILD_DIR}"
echo ""

# Step 1: Build frontend locally
echo -e "${YELLOW}🔨 Step 1: Building frontend locally...${NC}"

# Navigate to the correct project directory
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Project directory '$PROJECT_DIR' not found${NC}"
    echo -e "${YELLOW}Make sure you're in the correct directory${NC}"
    exit 1
fi

cd $PROJECT_DIR

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

# Go back to parent directory
cd ..

# Step 2: Prepare files for manual upload
echo -e "${YELLOW}📦 Step 2: Preparing files for manual upload...${NC}"

# Create build directory
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR

# Copy dist folder
echo -e "${BLUE}📁 Copying dist folder...${NC}"
cp -r $PROJECT_DIR/dist $BUILD_DIR/

# Copy updated source files
echo -e "${BLUE}📁 Copying updated source files...${NC}"
mkdir -p $BUILD_DIR/src/components
cp $PROJECT_DIR/src/App.jsx $BUILD_DIR/src/
cp $PROJECT_DIR/src/components/Avatar.jsx $BUILD_DIR/src/components/
cp $PROJECT_DIR/src/components/VRConversationInterface.jsx $BUILD_DIR/src/components/

# Create upload instructions
echo -e "${BLUE}📝 Creating upload instructions...${NC}"
cat > $BUILD_DIR/UPLOAD_INSTRUCTIONS.md << 'EOF'
# 📤 Upload Instructions

## Files to Upload

### 1. Frontend Build (dist folder)
```
dist/ → /root/medimedi-konvergen-vr/dist/
```

### 2. Updated Source Files
```
src/App.jsx → /root/medimedi-konvergen-vr/src/App.jsx
src/components/Avatar.jsx → /root/medimedi-konvergen-vr/src/components/Avatar.jsx
src/components/VRConversationInterface.jsx → /root/medimedi-konvergen-vr/src/components/VRConversationInterface.jsx
```

## Upload Methods

### Method 1: SCP (if SSH works)
```bash
scp -P 5211 -r dist/ root@156.67.217.39:/root/medimedi-konvergen-vr/
scp -P 5211 src/App.jsx root@156.67.217.39:/root/medimedi-konvergen-vr/src/
scp -P 5211 src/components/Avatar.jsx root@156.67.217.39:/root/medimedi-konvergen-vr/src/components/
scp -P 5211 src/components/VRConversationInterface.jsx root@156.67.217.39:/root/medimedi-konvergen-vr/src/components/
```

### Method 2: FTP/SFTP Client
- Host: 156.67.217.39
- Port: 5211
- Username: root
- Upload to: /root/medimedi-konvergen-vr/

### Method 3: Web Panel File Manager
- Login to server web panel
- Navigate to /root/medimedi-konvergen-vr/
- Upload files manually

## After Upload - Server Commands

```bash
# SSH to server
ssh -p 5211 root@156.67.217.39

# Navigate to project
cd /root/medimedi-konvergen-vr

# Rebuild (optional, since dist is already built)
pnpm build

# Restart services
pm2 restart medimedi-frontend
pm2 restart medimedi-backend
systemctl reload nginx

# Check status
pm2 status
curl -I https://medimedi.dickyri.net/
```
EOF

# Create deployment summary
echo -e "${BLUE}📋 Creating deployment summary...${NC}"
cat > $BUILD_DIR/DEPLOYMENT_SUMMARY.md << 'EOF'
# 🎤 Mouth Animation Fix - Deployment Summary

## Changes Made

### 1. App.jsx
- ✅ Added separate `isSpeaking` state
- ✅ Fixed `onEmotionChange` callback
- ✅ Ensured proper prop passing to Avatar

### 2. VRConversationInterface.jsx
- ✅ Added `useEffect` to monitor `conversation.isSpeaking`
- ✅ Added local `isSpeaking` state
- ✅ Fixed callback to update state properly

### 3. Avatar.jsx
- ✅ Added detailed logging for debugging
- ✅ Added multiple morph target name attempts
- ✅ Improved mouth animation algorithm
- ✅ Added fallback morph targets: mouthOpen, jawOpen, viseme_aa

## Expected Results

1. **isSpeaking State**: Should properly sync with ElevenLabs conversation
2. **Mouth Animation**: Should work with different morph target names
3. **Debug Logs**: Console should show detailed animation info
4. **Quest VR**: Mouth should move when agent speaks

## Testing Checklist

- [ ] Frontend loads at https://medimedi.dickyri.net/
- [ ] Backend API responds at https://medimedi.dickyri.net/api/emotion/test
- [ ] VR mode works in Quest browser
- [ ] Conversation starts successfully
- [ ] Console shows "🎤 VR" debug logs
- [ ] Mouth animation visible during agent speech
- [ ] No JavaScript errors in console

## Debug Information

Look for these console logs:
```
🎤 VR isSpeaking changed: true
🎤 VR Available morph targets: ["mouthOpen", "jawOpen", ...]
🎤 VR Using morph target: mouthOpen
🎤 VR Mouth animation value: 0.8
```
EOF

echo -e "${GREEN}✅ Files prepared for manual deployment${NC}"
echo ""
echo -e "${BLUE}📁 Files ready in: ${BUILD_DIR}/${NC}"
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "  1. Check ${BUILD_DIR}/UPLOAD_INSTRUCTIONS.md"
echo -e "  2. Upload files to server using preferred method"
echo -e "  3. Run server commands to restart services"
echo -e "  4. Test the application in Quest VR"
echo ""
echo -e "${YELLOW}🔍 Files to upload:${NC}"
echo -e "  • dist/ (frontend build)"
echo -e "  • src/App.jsx (updated)"
echo -e "  • src/components/Avatar.jsx (updated)"
echo -e "  • src/components/VRConversationInterface.jsx (updated)"
echo ""
echo -e "${GREEN}🎉 Build completed! Ready for manual deployment.${NC}"