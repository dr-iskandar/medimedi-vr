# 🔧 Panduan Perbaikan SSL Certificate Mismatch

## Masalah
Server produksi `medimedi.dickyri.net` menggunakan sertifikat SSL untuk domain `api.priapunyaselera-ai.com` yang menyebabkan SSL certificate mismatch.

## Solusi

### Opsi 1: Menggunakan Script Otomatis (Recommended)

1. **Upload script ke server:**
   ```bash
   scp fix-ssl-certificate.sh root@156.67.217.39:/root/
   ```

2. **Login ke server:**
   ```bash
   ssh root@156.67.217.39
   ```

3. **Jalankan script perbaikan:**
   ```bash
   chmod +x /root/fix-ssl-certificate.sh
   sudo /root/fix-ssl-certificate.sh
   ```

### Opsi 2: Manual Step-by-Step

Jika script otomatis gagal, ikuti langkah manual berikut:

#### 1. Login ke Server
```bash
ssh root@156.67.217.39
```

#### 2. Stop Nginx
```bash
sudo systemctl stop nginx
```

#### 3. Hapus Sertifikat Lama
```bash
# Hapus sertifikat untuk domain lama
sudo certbot delete --cert-name api.priapunyaselera-ai.com --non-interactive

# Hapus sertifikat untuk domain yang benar jika ada
sudo certbot delete --cert-name medimedi.dickyri.net --non-interactive
```

#### 4. Dapatkan Sertifikat Baru
```bash
sudo certbot certonly --standalone \
    -d medimedi.dickyri.net \
    --non-interactive \
    --agree-tos \
    --email admin@medimedi.dickyri.net \
    --force-renewal
```

#### 5. Update Konfigurasi Nginx
```bash
sudo nano /etc/nginx/sites-available/medimedi-vr
```

Pastikan bagian SSL menggunakan path yang benar:
```nginx
# SSL Configuration - PASTIKAN PATH INI BENAR
ssl_certificate /etc/letsencrypt/live/medimedi.dickyri.net/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/medimedi.dickyri.net/privkey.pem;
```

#### 6. Test dan Restart Nginx
```bash
# Test konfigurasi
sudo nginx -t

# Jika test berhasil, restart nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 7. Restart Backend
```bash
cd /var/www/medimedi-vr/emotion-analysis-backend
pm2 restart emotion-analysis || pm2 start src/main.py --name emotion-analysis --interpreter python3
```

### Opsi 3: Menggunakan Deploy Script yang Sudah Ada

Jika Anda ingin menggunakan script deployment yang sudah ada:

1. **Modifikasi setup-https.sh:**
   - Pastikan variabel `DOMAIN="medimedi.dickyri.net"`
   - Jalankan script dari lokal:
   ```bash
   ./ubuntu/setup-https.sh
   ```

## Verifikasi Perbaikan

Setelah menjalankan salah satu opsi di atas:

### 1. Test SSL Certificate
```bash
# Test dari lokal
curl -I https://medimedi.dickyri.net

# Atau gunakan online SSL checker
# https://www.ssllabs.com/ssltest/
```

### 2. Test VR Application
```bash
# Test homepage
curl -k https://medimedi.dickyri.net/

# Seharusnya mengembalikan HTML, bukan "Service Master Started"
```

### 3. Test API Backend
```bash
# Test emotion analysis API
curl -X POST https://medimedi.dickyri.net/api/emotion/analyze \
     -H "Content-Type: application/json" \
     -d '{"text":"I am happy today"}'

# Seharusnya mengembalikan JSON dengan analisis emosi
```

## Troubleshooting

### Jika Masih Mendapat "Service Master Started"

1. **Periksa apakah backend berjalan:**
   ```bash
   pm2 status
   pm2 logs emotion-analysis
   ```

2. **Periksa port backend:**
   ```bash
   netstat -tlnp | grep 5001
   ```

3. **Restart semua services:**
   ```bash
   pm2 restart all
   sudo systemctl restart nginx
   ```

### Jika SSL Certificate Masih Salah

1. **Periksa sertifikat yang terinstall:**
   ```bash
   sudo certbot certificates
   ```

2. **Periksa konfigurasi Nginx:**
   ```bash
   sudo nginx -t
   cat /etc/nginx/sites-enabled/medimedi-vr
   ```

3. **Periksa DNS:**
   ```bash
   nslookup medimedi.dickyri.net
   ```

### Jika Certbot Gagal

1. **Pastikan port 80 tidak digunakan:**
   ```bash
   sudo systemctl stop nginx
   sudo netstat -tlnp | grep :80
   ```

2. **Coba mode webroot:**
   ```bash
   sudo certbot certonly --webroot \
       -w /var/www/medimedi-vr/medimedi-konvergen-vr/dist \
       -d medimedi.dickyri.net
   ```

## Langkah Selanjutnya

Setelah SSL certificate diperbaiki:

1. **Update environment variables** di frontend jika ada
2. **Rebuild frontend** jika diperlukan
3. **Test semua fitur VR** untuk memastikan semuanya berfungsi
4. **Setup monitoring** untuk mencegah masalah serupa

## Catatan Penting

- ⚠️ **Backup konfigurasi** sebelum melakukan perubahan
- ⚠️ **Pastikan DNS** mengarah ke server yang benar (156.67.217.39)
- ⚠️ **Sertifikat Let's Encrypt** akan auto-renew setiap 90 hari
- ⚠️ **Monitor logs** untuk memastikan tidak ada error

## Kontak

Jika masih ada masalah, periksa:
- Nginx error logs: `/var/log/nginx/error.log`
- Backend logs: `pm2 logs emotion-analysis`
- SSL certificate status: `sudo certbot certificates`