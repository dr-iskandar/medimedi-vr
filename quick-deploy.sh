#!/bin/bash

# 🚀 Quick Deploy Script untuk MediMedi VR
# Jalankan script ini untuk deploy otomatis ke server 156.67.217.39:5211

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 MediMedi VR Quick Deploy${NC}"
echo -e "${BLUE}===========================${NC}"
echo ""

# Check if we have SSH access to server
SERVER_IP="156.67.217.39"
echo -e "${YELLOW}Checking server connectivity...${NC}"

if ! ping -c 1 $SERVER_IP &> /dev/null; then
    echo -e "${RED}❌ Server $SERVER_IP tidak dapat diakses${NC}"
    echo -e "${YELLOW}Pastikan:${NC}"
    echo "1. Server sedang running"
    echo "2. Network connection tersedia"
    echo "3. Firewall tidak memblokir koneksi"
    exit 1
fi

echo -e "${GREEN}✅ Server dapat diakses${NC}"

# Check SSH key or ask for password
echo -e "${YELLOW}Testing SSH connection...${NC}"
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes root@$SERVER_IP exit &> /dev/null; then
    echo -e "${YELLOW}⚠️  SSH key tidak ditemukan, akan menggunakan password${NC}"
    echo -e "${YELLOW}Pastikan Anda memiliki akses root ke server${NC}"
else
    echo -e "${GREEN}✅ SSH connection OK${NC}"
fi

# Confirm deployment
echo ""
echo -e "${YELLOW}Akan deploy ke:${NC}"
echo -e "Server: ${GREEN}$SERVER_IP${NC}"
echo -e "Port: ${GREEN}5211${NC}"
echo -e "Backend: ${GREEN}5001${NC}"
echo ""
read -p "Lanjutkan deployment? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment dibatalkan${NC}"
    exit 0
fi

# Start deployment
echo -e "${GREEN}🚀 Memulai deployment...${NC}"

# Run main deployment script
./deploy.sh

echo ""
echo -e "${GREEN}🎉 Deployment selesai!${NC}"
echo -e "${BLUE}Akses aplikasi VR di: http://$SERVER_IP:5211${NC}"
echo -e "${BLUE}Backend API di: http://$SERVER_IP:5211/api/${NC}"
echo ""
echo -e "${YELLOW}Tips:${NC}"
echo "1. Gunakan browser yang support WebXR (Chrome/Edge)"
echo "2. Untuk VR, pastikan headset sudah terhubung"
echo "3. Cek logs dengan: ssh root@$SERVER_IP 'pm2 logs medimedi-backend'"
echo "4. Restart backend: ssh root@$SERVER_IP 'pm2 restart medimedi-backend'"
echo "5. Cek status: ssh root@$SERVER_IP 'pm2 status && systemctl status nginx'"