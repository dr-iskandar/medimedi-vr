# 🚀 MediMedi VR - Deployment Guide

## 📋 Quick Start

Untuk deploy aplikasi VR ke server **156.67.217.39:5211**, jalankan:

```bash
./quick-deploy.sh
```

## 🎯 Target Deployment

- **Server**: 156.67.217.39
- **Port**: 5211
- **Backend**: 5001
- **Stack**: React + Three.js + WebXR + Flask

## 📁 File Deployment

### Scripts
- `quick-deploy.sh` - Script deployment cepat (recommended)
- `deploy.sh` - Script deployment lengkap
- `deploy-guide.md` - Panduan manual deployment

### Configuration
- `vite.config.production.js` - Konfigurasi Vite untuk production
- `.env.production` - Environment variables untuk production

## 🔧 Prerequisites

### Local Machine
- SSH access ke server (root@156.67.217.39)
- rsync atau scp untuk upload files

### Server Requirements
- Ubuntu/Debian Linux
- Root access
- Internet connection
- Ports 5211 dan 5001 tersedia

## 🚀 Deployment Steps

### Option 1: Quick Deploy (Recommended)
```bash
# Jalankan dari direktori project
./quick-deploy.sh
```

### Option 2: Manual Deploy
```bash
# 1. Upload files ke server
rsync -avz --exclude 'node_modules' --exclude 'venv' ./ root@156.67.217.39:/var/www/medimedi-vr/

# 2. SSH ke server dan jalankan setup
ssh root@156.67.217.39
cd /var/www/medimedi-vr
./deploy.sh
```

### Option 3: Step by Step
Ikuti panduan lengkap di `deploy-guide.md`

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Browser  │───▶│  Nginx (5211)    │───▶│  React App      │
│   (WebXR)       │    │  Reverse Proxy   │    │  (Three.js/VR)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Flask Backend  │
                       │  (Port 5001)    │
                       │  Emotion API    │
                       └─────────────────┘
```

## 🔍 Monitoring & Troubleshooting

### Cek Status Services
```bash
# SSH ke server
ssh root@156.67.217.39

# Cek PM2 processes
pm2 status
pm2 logs medimedi-backend

# Cek Nginx
sudo systemctl status nginx
sudo nginx -t

# Cek ports
sudo netstat -tulpn | grep -E ':(5211|5001)'
```

### Common Issues

#### 1. Backend tidak jalan
```bash
# Restart backend
pm2 restart medimedi-backend

# Cek logs
pm2 logs medimedi-backend --lines 50
```

#### 2. Frontend tidak load
```bash
# Cek nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Cek nginx logs
sudo tail -f /var/log/nginx/error.log
```

#### 3. CORS Issues
```bash
# Pastikan nginx config sudah benar
cat /etc/nginx/sites-available/medimedi-vr

# Reload nginx
sudo systemctl reload nginx
```

#### 4. Port sudah digunakan
```bash
# Cek process yang menggunakan port
sudo lsof -i :5211
sudo lsof -i :5001

# Kill process jika perlu
sudo kill -9 <PID>
```

## 🔄 Update Deployment

### Update Frontend
```bash
# Dari local machine
./quick-deploy.sh

# Atau manual
ssh root@156.67.217.39
cd /var/www/medimedi-vr/medimedi-konvergen-vr
pnpm run build
sudo systemctl reload nginx
```

### Update Backend
```bash
ssh root@156.67.217.39
cd /var/www/medimedi-vr/emotion-analysis-backend
pm2 restart medimedi-backend
```

## 🧪 Testing

### Local Testing
```bash
# Test connectivity
ping 156.67.217.39

# Test HTTP endpoints
curl http://156.67.217.39:5211
curl http://156.67.217.39:5211/api/health
```

### Browser Testing
1. Buka http://156.67.217.39:5211
2. Pastikan VR button muncul
3. Test dengan VR headset jika tersedia
4. Cek console untuk errors

## 📱 VR Access

### Supported Browsers
- **Chrome/Chromium** (Recommended)
- **Microsoft Edge**
- **Firefox** (Limited WebXR support)

### VR Headsets
- **Meta Quest 2/3/Pro**
- **HTC Vive**
- **Valve Index**
- **Windows Mixed Reality**

### Mobile VR
- **Google Cardboard**
- **Samsung Gear VR**
- **Daydream**

## 🔐 Security Notes

- Server menggunakan HTTP (bukan HTTPS)
- Untuk production, pertimbangkan SSL certificate
- Firewall dikonfigurasi untuk port 5211 dan 5001
- Backend API terbuka untuk CORS (development mode)

## 📞 Support

Jika ada masalah deployment:

1. Cek logs di server
2. Pastikan semua dependencies terinstall
3. Verify network connectivity
4. Check firewall settings

## 🎉 Success Indicators

✅ **Deployment berhasil jika:**
- `curl http://156.67.217.39:5211` mengembalikan HTML
- `curl http://156.67.217.39:5211/api/health` mengembalikan JSON
- Browser dapat akses http://156.67.217.39:5211
- VR button muncul di interface
- PM2 menunjukkan backend running
- Nginx status active

---

**Happy VR Development! 🥽✨**