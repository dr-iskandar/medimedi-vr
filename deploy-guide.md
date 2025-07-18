# 🚀 Panduan Deployment VR Application ke Remote Server

## 📋 Informasi Server
- **Server IP**: 156.67.217.39
- **Port**: 5211
- **Stack**: React + Three.js (Frontend) + Flask (Backend)

## 🔧 Persiapan Deployment

### 1. Persiapan Server
```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Node.js dan npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python dan pip
sudo apt install python3 python3-pip python3-venv -y

# Install PM2 untuk process management
sudo npm install -g pm2

# Install nginx untuk reverse proxy
sudo apt install nginx -y
```

### 2. Upload Project ke Server
```bash
# Dari local machine
scp -r /Users/dicky.iskandar/Downloads/MediMediVR/ubuntu/ root@156.67.217.39:/var/www/medimedi-vr/

# Atau menggunakan rsync
rsync -avz --exclude 'node_modules' --exclude 'venv' /Users/dicky.iskandar/Downloads/MediMediVR/ubuntu/ root@156.67.217.39:/var/www/medimedi-vr/
```

## 🏗️ Setup Backend (Flask)

### 1. Setup Python Environment
```bash
cd /var/www/medimedi-vr/emotion-analysis-backend

# Buat virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Konfigurasi Backend untuk Production
```bash
# Edit main.py untuk production
sed -i 's/debug=True/debug=False/g' src/main.py
sed -i 's/host="127.0.0.1"/host="0.0.0.0"/g' src/main.py
```

### 3. Jalankan Backend dengan PM2
```bash
# Buat ecosystem file untuk PM2
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

# Start backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🎨 Setup Frontend (React + Three.js)

### 1. Install Dependencies dan Build
```bash
cd /var/www/medimedi-vr/medimedi-konvergen-vr

# Install pnpm jika belum ada
npm install -g pnpm

# Install dependencies
pnpm install

# Build untuk production
pnpm run build
```

### 2. Konfigurasi Nginx
```bash
# Buat konfigurasi nginx
sudo tee /etc/nginx/sites-available/medimedi-vr << 'EOF'
server {
    listen 5211;
    server_name 156.67.217.39;
    
    # Frontend (React)
    location / {
        root /var/www/medimedi-vr/medimedi-konvergen-vr/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # CORS headers untuk VR
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:5001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS untuk API
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
    }
    
    # WebXR requires HTTPS in production, tapi untuk development bisa HTTP
    # Uncomment jika menggunakan HTTPS
    # add_header 'Permissions-Policy' 'xr-spatial-tracking=(self)';
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/medimedi-vr /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔥 Firewall Configuration
```bash
# Buka port yang diperlukan
sudo ufw allow 5211
sudo ufw allow 5001
sudo ufw reload
```

## 🚀 Start Services
```bash
# Start semua services
sudo systemctl start nginx
sudo systemctl enable nginx

# Cek status PM2
pm2 status
pm2 logs medimedi-backend

# Restart jika diperlukan
pm2 restart medimedi-backend
```

## 🧪 Testing Deployment
```bash
# Test backend
curl http://156.67.217.39:5001/health

# Test frontend
curl http://156.67.217.39:5211

# Test dari browser
# http://156.67.217.39:5211
```

## 📱 Akses VR Application
- **URL**: http://156.67.217.39:5211
- **Backend API**: http://156.67.217.39:5211/api/
- **Direct Backend**: http://156.67.217.39:5001

## 🔧 Troubleshooting

### Cek Logs
```bash
# Backend logs
pm2 logs medimedi-backend

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# System logs
journalctl -u nginx -f
```

### Common Issues
1. **Port sudah digunakan**: `sudo netstat -tulpn | grep :5211`
2. **Permission denied**: `sudo chown -R www-data:www-data /var/www/medimedi-vr`
3. **CORS issues**: Pastikan header CORS sudah benar di nginx config

## 🔄 Update Deployment
```bash
# Update frontend
cd /var/www/medimedi-vr/medimedi-konvergen-vr
git pull  # jika menggunakan git
pnpm run build
sudo systemctl reload nginx

# Update backend
cd /var/www/medimedi-vr/emotion-analysis-backend
git pull  # jika menggunakan git
pm2 restart medimedi-backend
```

## 📋 Monitoring
```bash
# Monitor PM2 processes
pm2 monit

# Monitor system resources
htop

# Monitor nginx status
sudo systemctl status nginx
```