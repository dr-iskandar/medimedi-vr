# 🔧 Panduan Perbaikan Endpoint API - Error 405 Not Allowed

## 🚨 Masalah yang Ditemukan

Error **405 (Not Allowed)** pada `https://medimedi.dickyri.net/emotion/analyze` disebabkan oleh **ketidakcocokan endpoint** antara frontend dan backend:

### Frontend (Salah)
```javascript
// VRConversationInterface.jsx
fetch(`${backendUrl}/emotion/analyze`, { ... })

// DebugPanel.jsx  
fetch(`${backendUrl}/emotion/test`)
fetch(`${backendUrl}/emotion/analyze`, { ... })
```

### Backend (Benar)
```python
# main.py
app.register_blueprint(emotion_bp, url_prefix='/api/emotion')

# emotion.py
@emotion_bp.route('/analyze', methods=['POST'])  # Menjadi /api/emotion/analyze
@emotion_bp.route('/test', methods=['GET'])       # Menjadi /api/emotion/test
```

### Nginx Configuration (Benar)
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:5001;
    # ...
}
```

## ✅ Solusi yang Diterapkan

### 1. Perbaikan Frontend Endpoints

**File: `VRConversationInterface.jsx`**
```diff
- const response = await fetch(`${backendUrl}/emotion/analyze`, {
+ const response = await fetch(`${backendUrl}/api/emotion/analyze`, {
```

**File: `DebugPanel.jsx`**
```diff
- const response = await fetch(`${backendUrl}/emotion/test`);
+ const response = await fetch(`${backendUrl}/api/emotion/test`);

- const response = await fetch(`${backendUrl}/emotion/analyze`, {
+ const response = await fetch(`${backendUrl}/api/emotion/analyze`, {
```

### 2. Script Deployment Otomatis

Script `fix-frontend-endpoints.sh` telah dibuat untuk:
- ✅ Build frontend dengan endpoint yang benar
- ✅ Deploy ke server produksi
- ✅ Restart services
- ✅ Test API endpoints

## 🚀 Cara Menjalankan Perbaikan

### Opsi 1: Menggunakan Script Otomatis (Recommended)

```bash
# Jalankan dari direktori ubuntu/
./fix-frontend-endpoints.sh
```

### Opsi 2: Manual Step-by-Step

#### 1. Build Frontend Lokal
```bash
cd medimedi-konvergen-vr
pnpm install
pnpm run build
cd ..
```

#### 2. Deploy ke Server
```bash
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    medimedi-konvergen-vr/ \
    root@156.67.217.39:/var/www/medimedi-vr/medimedi-konvergen-vr/
```

#### 3. Build di Server
```bash
ssh root@156.67.217.39
cd /var/www/medimedi-vr/medimedi-konvergen-vr
pnpm install
pnpm run build
```

#### 4. Restart Services
```bash
# Di server
cd /var/www/medimedi-vr/emotion-analysis-backend
pm2 restart emotion-analysis
sudo systemctl reload nginx
```

## 🧪 Verifikasi Perbaikan

### 1. Test API Endpoint
```bash
# Test dari lokal
curl -X POST https://medimedi.dickyri.net/api/emotion/analyze \
     -H "Content-Type: application/json" \
     -d '{"text":"I am very happy today"}' \
     -k

# Expected Response:
{
  "all_scores": {"senang": 0.9},
  "confidence": 0.3,
  "emoticon": "😊",
  "emotion": "senang",
  "matches": ["happy"],
  "method": "nlp_lexicon",
  "processed_text": "i am very happy today",
  "text_length": 21
}
```

### 2. Test Frontend
```bash
# Test homepage
curl -I https://medimedi.dickyri.net/ -k

# Should return 200 OK with HTML content
```

### 3. Test di Browser
1. Buka https://medimedi.dickyri.net
2. Buka Developer Tools (F12)
3. Cek Console - tidak ada error 405
4. Test fitur emotion analysis
5. Cek Network tab - API calls ke `/api/emotion/analyze` berhasil

## 📊 Ringkasan Perubahan

| File | Perubahan | Status |
|------|-----------|--------|
| `VRConversationInterface.jsx` | `/emotion/analyze` → `/api/emotion/analyze` | ✅ Fixed |
| `DebugPanel.jsx` | `/emotion/test` → `/api/emotion/test` | ✅ Fixed |
| `DebugPanel.jsx` | `/emotion/analyze` → `/api/emotion/analyze` | ✅ Fixed |
| Backend routing | Sudah benar (`/api/emotion/*`) | ✅ OK |
| Nginx config | Sudah benar (`/api/` proxy) | ✅ OK |

## 🔍 Troubleshooting

### Jika Masih Error 405

1. **Cek apakah backend berjalan:**
   ```bash
   ssh root@156.67.217.39
   pm2 status
   pm2 logs emotion-analysis
   ```

2. **Cek port backend:**
   ```bash
   netstat -tlnp | grep 5001
   ```

3. **Test backend langsung:**
   ```bash
   # Di server
   curl -X POST http://localhost:5001/api/emotion/analyze \
        -H "Content-Type: application/json" \
        -d '{"text":"test"}'
   ```

### Jika Frontend Tidak Update

1. **Clear browser cache** (Ctrl+F5)
2. **Cek apakah build berhasil:**
   ```bash
   ssh root@156.67.217.39
   ls -la /var/www/medimedi-vr/medimedi-konvergen-vr/dist/
   ```
3. **Restart nginx:**
   ```bash
   sudo systemctl restart nginx
   ```

### Jika SSL Certificate Error

Gunakan script SSL fix yang sudah dibuat:
```bash
./fix-ssl-certificate.sh
```

## 📝 Catatan Penting

- ⚠️ **Endpoint yang benar**: `/api/emotion/analyze` (bukan `/emotion/analyze`)
- ⚠️ **Backend prefix**: Semua API menggunakan `/api/` prefix
- ⚠️ **CORS**: Sudah dikonfigurasi dengan benar di backend
- ⚠️ **SSL**: Gunakan `-k` flag untuk testing jika certificate mismatch

## 🎯 Hasil Akhir

Setelah perbaikan:
- ✅ Frontend menggunakan endpoint yang benar
- ✅ API emotion analysis berfungsi normal
- ✅ Tidak ada lagi error 405 Not Allowed
- ✅ VR application dapat menganalisis emosi dengan benar
- ✅ Debug panel berfungsi untuk testing

## 📞 Support

Jika masih ada masalah:
1. Cek logs: `pm2 logs emotion-analysis`
2. Cek nginx logs: `/var/log/nginx/error.log`
3. Cek browser console untuk error frontend
4. Test API endpoint secara manual dengan curl