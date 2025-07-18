# 🚀 GitHub Setup Guide - MediMedi VR

Panduan cepat untuk upload project ke GitHub dan setup deployment otomatis.

## 📋 Prerequisites

- Git installed
- GitHub account
- SSH access ke server (156.67.217.39)

## 🎯 Quick Setup

### 1. Setup Repository

```bash
# Jalankan script setup otomatis
./setup-github.sh YOUR_GITHUB_USERNAME medimedi-vr
```

### 2. Create Repository di GitHub

1. Buka https://github.com/new
2. Repository name: `medimedi-vr`
3. Description: `Virtual Reality Emotion Analysis Platform`
4. Public/Private (pilih sesuai kebutuhan)
5. **JANGAN** centang "Add a README file" (sudah ada)
6. Click **"Create repository"**

### 3. Push ke GitHub

```bash
# Push semua files ke GitHub
git push -u origin main
```

## 🔧 Manual Setup (Alternative)

Jika script otomatis tidak berfungsi:

```bash
# 1. Initialize git
git init
git branch -M main

# 2. Add files
git add .
git commit -m "Initial commit: MediMedi VR Platform"

# 3. Add remote
git remote add origin https://github.com/YOUR_USERNAME/medimedi-vr.git

# 4. Push
git push -u origin main
```

## 🚀 Deployment dari GitHub

### Option 1: Direct Deploy

```bash
# Di server (156.67.217.39)
ssh ubuntu@156.67.217.39
bash <(curl -s https://raw.githubusercontent.com/YOUR_USERNAME/medimedi-vr/main/deploy-from-github.sh)
```

### Option 2: Clone & Deploy

```bash
# Di server
ssh ubuntu@156.67.217.39
git clone https://github.com/YOUR_USERNAME/medimedi-vr.git /opt/medimedi-vr
cd /opt/medimedi-vr
./deploy-from-github.sh
```

### Option 3: Update Existing

```bash
# Di server (jika sudah ada deployment)
ssh ubuntu@156.67.217.39
sudo update-medimedi-vr
```

## 🔄 GitHub Actions (CI/CD)

### Setup Secrets

Di GitHub repository → Settings → Secrets and variables → Actions:

- `HOST`: `156.67.217.39`
- `USERNAME`: `ubuntu`
- `SSH_KEY`: Private SSH key untuk akses server

### Auto Deployment

Setelah setup secrets, setiap push ke `main` branch akan:
1. Run tests otomatis
2. Build aplikasi
3. Deploy ke server

## 📁 Files yang Dibuat

```
├── .gitignore              # Git ignore rules
├── README.md               # Project documentation
├── LICENSE                 # MIT License
├── setup-github.sh         # GitHub setup script
├── deploy-from-github.sh   # GitHub deployment script
├── GITHUB-SETUP.md         # This guide
├── .github/
│   ├── workflows/
│   │   └── deploy.yml      # CI/CD pipeline
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── pull_request_template.md
└── ...
```

## 🔍 Troubleshooting

### Git Issues

```bash
# Reset git if needed
rm -rf .git
git init
git branch -M main
```

### Permission Issues

```bash
# Fix script permissions
chmod +x *.sh
```

### Repository Already Exists

```bash
# Force push (HATI-HATI!)
git push -f origin main
```

## 📞 Quick Commands

```bash
# Check git status
git status

# Add new changes
git add .
git commit -m "Update: description"
git push

# Pull latest from server
git pull origin main

# Check deployment status
ssh ubuntu@156.67.217.39 'pm2 status'
```

## 🎯 Success Indicators

✅ Repository created di GitHub  
✅ Files uploaded successfully  
✅ GitHub Actions workflow running  
✅ Server dapat pull dari GitHub  
✅ Auto deployment working  
✅ App accessible di http://156.67.217.39:5211  

## 🔗 Useful Links

- **GitHub Repository**: https://github.com/YOUR_USERNAME/medimedi-vr
- **Live App**: http://156.67.217.39:5211
- **GitHub Actions**: https://github.com/YOUR_USERNAME/medimedi-vr/actions
- **Issues**: https://github.com/YOUR_USERNAME/medimedi-vr/issues

---

**🎉 Setelah setup selesai, deployment bisa dilakukan dengan simple `git push`!**