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
