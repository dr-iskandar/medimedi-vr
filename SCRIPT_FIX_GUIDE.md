# Script Fix Guide - Mouth Animation

## Masalah yang Diperbaiki

Script `fix-mouth-animation.sh` sebelumnya gagal karena:
- Mencoba build di direktori yang salah (`/var/www/medimedi-vr`)
- Path file yang tidak sesuai dengan struktur proyek

## Perbaikan yang Dilakukan

### 1. Path Build yang Benar
```bash
# Sebelum (salah)
pnpm build  # di root directory

# Sesudah (benar)
cd medimedi-konvergen-vr
pnpm build
cd ..
```

### 2. Path Copy Files yang Benar
```bash
# Sebelum (salah)
scp -r dist/ ...
scp src/components/Avatar.jsx ...

# Sesudah (benar)
scp -r medimedi-konvergen-vr/dist/ ...
scp medimedi-konvergen-vr/src/components/Avatar.jsx ...
```

## Cara Menjalankan Script yang Sudah Diperbaiki

1. **Pastikan berada di direktori yang benar:**
   ```bash
   cd /Users/dicky.iskandar/Downloads/MediMediVR/ubuntu
   ```

2. **Jalankan script:**
   ```bash
   chmod +x fix-mouth-animation.sh
   ./fix-mouth-animation.sh
   ```

3. **Script akan otomatis:**
   - Masuk ke direktori `medimedi-konvergen-vr`
   - Install dependencies jika diperlukan
   - Build frontend
   - Copy files ke server dengan path yang benar
   - Rebuild di server
   - Restart services

## Verifikasi

Setelah script berhasil dijalankan:

1. **Cek frontend:** https://medimedi.my.id
2. **Cek backend:** https://medimedi.my.id/api/health
3. **Test di Quest VR:** Buka browser Quest dan akses aplikasi
4. **Monitor animasi mulut:** Lihat console log untuk debug info

## Troubleshooting

Jika masih ada error:

1. **Cek struktur direktori:**
   ```bash
   ls -la medimedi-konvergen-vr/
   ```

2. **Cek package.json:**
   ```bash
   cat medimedi-konvergen-vr/package.json
   ```

3. **Manual build test:**
   ```bash
   cd medimedi-konvergen-vr
   pnpm install
   pnpm build
   ```

4. **Cek koneksi server:**
   ```bash
   ssh -p 22 root@103.127.99.73
   ```