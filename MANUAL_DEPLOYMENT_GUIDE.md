# 🚀 Manual Deployment Guide - Mouth Animation Fix

## Masalah SSH Connection

Script otomatis gagal karena masalah koneksi SSH ke server. Berikut adalah panduan deployment manual.

## Langkah-langkah Manual Deployment

### 1. Build Frontend Lokal

```bash
# Masuk ke direktori proyek
cd medimedi-konvergen-vr

# Install dependencies (jika belum)
pnpm install

# Build project
pnpm build
```

### 2. Persiapan Files untuk Upload

Setelah build berhasil, siapkan files berikut untuk di-upload:

```
medimedi-konvergen-vr/
├── dist/                          # Hasil build frontend
├── src/components/Avatar.jsx      # File yang sudah diperbaiki
├── src/components/VRConversationInterface.jsx  # File yang sudah diperbaiki
└── src/App.jsx                    # File yang sudah diperbaiki
```

### 3. Upload ke Server

#### Opsi A: Menggunakan SCP (jika SSH tersedia)

```bash
# Upload dist folder
scp -P 5211 -r medimedi-konvergen-vr/dist/ root@156.67.217.39:/root/medimedi-konvergen-vr/

# Upload source files yang diperbaiki
scp -P 5211 medimedi-konvergen-vr/src/components/Avatar.jsx root@156.67.217.39:/root/medimedi-konvergen-vr/src/components/
scp -P 5211 medimedi-konvergen-vr/src/components/VRConversationInterface.jsx root@156.67.217.39:/root/medimedi-konvergen-vr/src/components/
scp -P 5211 medimedi-konvergen-vr/src/App.jsx root@156.67.217.39:/root/medimedi-konvergen-vr/src/
```

#### Opsi B: Menggunakan FTP/SFTP Client

1. Gunakan aplikasi seperti FileZilla, WinSCP, atau Cyberduck
2. Koneksi ke server:
   - Host: `156.67.217.39`
   - Port: `5211`
   - Username: `root`
   - Protocol: SFTP
3. Upload files ke direktori `/root/medimedi-konvergen-vr/`

#### Opsi C: Menggunakan Web Panel (jika tersedia)

Jika server memiliki web panel seperti cPanel, Plesk, atau custom panel:
1. Login ke web panel
2. Buka File Manager
3. Navigate ke `/root/medimedi-konvergen-vr/`
4. Upload files yang diperlukan

### 4. Rebuild di Server

Setelah files berhasil di-upload, login ke server dan jalankan:

```bash
# SSH ke server
ssh -p 5211 root@156.67.217.39

# Masuk ke direktori proyek
cd /root/medimedi-konvergen-vr

# Rebuild frontend
pnpm build

# Restart PM2 processes
pm2 restart medimedi-frontend
pm2 restart medimedi-backend

# Reload Nginx
systemctl reload nginx
```

### 5. Verifikasi Deployment

```bash
# Test frontend
curl -I https://medimedi.dickyri.net/

# Test backend
curl -I https://medimedi.dickyri.net/api/emotion/test

# Check PM2 status
pm2 status
```

## Troubleshooting SSH Issues

### Kemungkinan Penyebab SSH Gagal:

1. **Server Down**: Server mungkin sedang offline
2. **Firewall**: Port 5211 mungkin diblokir
3. **SSH Key**: Memerlukan SSH key yang tepat
4. **Authentication**: Password atau key authentication gagal
5. **Network**: Masalah koneksi internet

### Solusi Alternatif:

1. **Hubungi Administrator Server**:
   - Minta akses SSH yang benar
   - Konfirmasi port dan credentials
   - Minta bantuan untuk deployment

2. **Gunakan GitHub Actions**:
   - Push changes ke repository
   - Setup GitHub Actions untuk auto-deploy
   - Lihat file `.github/workflows/deploy.yml`

3. **Remote Desktop/VNC**:
   - Jika tersedia akses remote desktop
   - Login dan jalankan commands secara langsung

## Files yang Sudah Diperbaiki

### 1. App.jsx
- Menambahkan state `isSpeaking` terpisah
- Memperbaiki callback `onEmotionChange`
- Memastikan prop `isSpeaking` diteruskan dengan benar

### 2. VRConversationInterface.jsx
- Menambahkan `useEffect` untuk monitor `conversation.isSpeaking`
- Menambahkan state lokal `isSpeaking`
- Memperbaiki callback untuk update state

### 3. Avatar.jsx
- Menambahkan logging detail untuk debugging
- Mencoba multiple nama morph target untuk mouth animation
- Memperbaiki algoritma animasi mulut

## Testing di Quest VR

Setelah deployment berhasil:

1. **Buka Quest Browser**
2. **Akses**: https://medimedi.dickyri.net/
3. **Enter VR Mode**
4. **Start Conversation**
5. **Check Console**: Buka developer tools untuk melihat logs
6. **Monitor Mouth Animation**: Perhatikan gerakan mulut saat agent berbicara

## Debug Logs yang Harus Dicari

```
🎤 VR isSpeaking changed: true/false
🎤 VR Available morph targets: [...]
🎤 VR Mouth animation value: 0.x
🎤 VR Using morph target: mouthOpen/jawOpen/viseme_aa
```

## Kontak Support

Jika masih mengalami masalah:
1. Screenshot error messages
2. Copy console logs
3. Dokumentasikan langkah yang sudah dicoba
4. Hubungi administrator server untuk bantuan akses