# 🎤 Panduan Perbaikan Animasi Mulut di Quest VR

## 🔍 Masalah yang Ditemukan

Animasi mulut tidak berjalan di Quest VR karena beberapa masalah:

1. **Masalah State Management**: `isSpeaking` state tidak ter-update dengan benar dari ElevenLabs conversation
2. **Masalah Prop Passing**: Avatar component tidak menerima `isSpeaking` prop yang benar
3. **Masalah Morph Target**: Kemungkinan nama morph target untuk mulut berbeda di model GLTF

## 🛠️ Perbaikan yang Dilakukan

### 1. Perbaikan State Management di `App.jsx`

```javascript
// Menambahkan state isSpeaking terpisah
const [isSpeaking, setIsSpeaking] = useState(false);

// Update callback untuk menangkap perubahan isSpeaking
const conversationInterface = VRConversationInterface({
  onEmotionChange: (emotion) => {
    setCurrentEmotion(emotion.emotion);
    setEmotionConfidence(emotion.confidence || 0.5);
    setIsSpeaking(emotion.isSpeaking || false); // Update isSpeaking state
    // ...
  }
});

// Pass isSpeaking state ke Avatar
<Avatar currentEmotion={currentEmotion} isSpeaking={isSpeaking} />
```

### 2. Perbaikan Monitoring di `VRConversationInterface.jsx`

```javascript
// Menambahkan state isSpeaking lokal
const [isSpeaking, setIsSpeaking] = useState(false);

// Monitor perubahan conversation.isSpeaking
useEffect(() => {
  if (conversation && typeof conversation.isSpeaking === 'boolean') {
    const newIsSpeaking = conversation.isSpeaking;
    console.log('🎤 VR Speaking status changed:', newIsSpeaking);
    setIsSpeaking(newIsSpeaking);
    
    // Notify parent component
    onEmotionChange?.({ 
      emotion: currentEmotion, 
      confidence: 0.5, 
      isSpeaking: newIsSpeaking 
    });
  }
}, [conversation.isSpeaking, currentEmotion, onEmotionChange]);
```

### 3. Perbaikan Deteksi Morph Target di `Avatar.jsx`

```javascript
// Mencoba berbagai nama morph target yang mungkin
const possibleMouthNames = [
  "mouthOpen", "mouth_open", "MouthOpen", "Mouth_Open", 
  "viseme_aa", "viseme_E", "jawOpen", "jaw_open"
];

// Logging yang lebih detail untuk debugging
console.log('🎤 VR Available morph targets:', Object.keys(wolf3DHead.morphTargetDictionary));

// Animasi mulut yang lebih responsif
if (isSpeaking) {
  const time = Date.now() * 0.008; // Slightly faster animation
  const mouthValue = Math.abs(Math.sin(time)) * 0.7; // Oscillate between 0 and 0.7
  wolf3DHead.morphTargetInfluences[mouthOpenIndex] = mouthValue;
  console.log(`🎤 VR Mouth animation value: ${mouthValue.toFixed(3)}`);
}
```

## 🚀 Deployment

### Opsi 1: Menggunakan Script Otomatis

```bash
# Berikan permission execute
chmod +x fix-mouth-animation.sh

# Jalankan script
./fix-mouth-animation.sh
```

### Opsi 2: Manual Deployment

1. **Build Frontend Lokal**:
   ```bash
   pnpm install
   pnpm build
   ```

2. **Copy ke Server**:
   ```bash
   scp -P 5211 -r dist/ root@156.67.217.39:/root/medimedi-konvergen-vr/
   scp -P 5211 src/components/Avatar.jsx root@156.67.217.39:/root/medimedi-konvergen-vr/src/components/
   scp -P 5211 src/components/VRConversationInterface.jsx root@156.67.217.39:/root/medimedi-konvergen-vr/src/components/
   scp -P 5211 src/App.jsx root@156.67.217.39:/root/medimedi-konvergen-vr/src/
   ```

3. **Build dan Restart di Server**:
   ```bash
   ssh -p 5211 root@156.67.217.39
   cd /root/medimedi-konvergen-vr
   pnpm build
   pm2 restart medimedi-frontend
   systemctl reload nginx
   ```

## 🧪 Testing dan Verifikasi

### 1. Test Akses Aplikasi

```bash
# Test frontend
curl -I https://medimedi.dickyri.net/

# Test backend
curl -I https://medimedi.dickyri.net/api/emotion/test
```

### 2. Test di Quest VR

1. **Buka Quest Browser**:
   - Navigasi ke `https://medimedi.dickyri.net/`
   - Klik "Enter VR"

2. **Buka Developer Console**:
   - Di Quest browser, buka developer tools
   - Monitor console logs

3. **Start Conversation**:
   - Mulai percakapan dengan agent
   - Perhatikan logs di console

4. **Verifikasi Logs**:
   ```
   🎤 VR Available morph targets: ["eyeBlink", "mouthOpen", "mouthSmile", ...]
   🎤 VR Found mouth morph target: mouthOpen at index 2
   🎤 VR Setting up mouth animation with mouthOpen, isSpeaking: true
   🎤 VR Speaking status changed: true
   🎤 VR Mouth animation value: 0.456
   ```

### 3. Troubleshooting

#### Jika Tidak Ada Morph Target yang Ditemukan:

```javascript
// Check log ini di console:
⚠️ VR No mouth morph target found. Available targets: ["eyeBlink", "browUp", ...]
⚠️ VR Tried these names: ["mouthOpen", "mouth_open", ...]
```

**Solusi**: Tambahkan nama morph target yang sesuai ke array `possibleMouthNames`

#### Jika isSpeaking Tidak Berubah:

```javascript
// Check log ini di console:
🎤 VR Speaking status changed: false (selalu false)
```

**Solusi**: 
1. Verifikasi ElevenLabs API key
2. Check network connection
3. Verifikasi agent ID

#### Jika Animasi Tidak Smooth:

**Solusi**: Adjust parameter animasi:
```javascript
const time = Date.now() * 0.008; // Ubah speed
const mouthValue = Math.abs(Math.sin(time)) * 0.7; // Ubah amplitude
```

## 📊 Monitoring

### Console Logs yang Harus Diperhatikan:

1. **Initialization**:
   ```
   🎭 VR Wolf3D_Head found: Object
   🎭 VR Morph targets: {eyeBlink: 0, mouthOpen: 1, ...}
   ```

2. **Conversation Status**:
   ```
   🔗 VR Conversation connected
   🎤 VR Speaking status changed: true
   ```

3. **Mouth Animation**:
   ```
   🎤 VR Found mouth morph target: mouthOpen at index 1
   🎤 VR Mouth animation value: 0.523
   ```

4. **Emotion Analysis**:
   ```
   🧠 VR Emotion analysis result: {emotion: "senang", confidence: 0.8}
   🎭 VR Emotion changed: {emotion: "senang", confidence: 0.8, isSpeaking: true}
   ```

## 🔧 Advanced Debugging

### Inspect Model Morph Targets:

```javascript
// Tambahkan di browser console untuk inspect model
const avatar = document.querySelector('canvas').__r3f.scene.children.find(child => 
  child.children.some(c => c.name === 'Wolf3D_Head')
);
const head = avatar.children.find(c => c.name === 'Wolf3D_Head');
console.log('All morph targets:', head.morphTargetDictionary);
console.log('Current influences:', head.morphTargetInfluences);
```

### Manual Test Mouth Animation:

```javascript
// Test manual mouth animation di browser console
const head = /* get Wolf3D_Head mesh */;
const mouthIndex = head.morphTargetDictionary['mouthOpen'];
head.morphTargetInfluences[mouthIndex] = 0.5; // Open mouth
```

## 📝 Catatan Penting

1. **Performance**: Animasi mulut menggunakan `requestAnimationFrame` untuk performa optimal
2. **Cleanup**: Animation frame dibersihkan saat component unmount
3. **Fallback**: Jika morph target tidak ditemukan, aplikasi tetap berjalan tanpa animasi mulut
4. **Logging**: Extensive logging untuk debugging, bisa dikurangi di production

## 🎯 Expected Results

Setelah perbaikan:
- ✅ Animasi mulut berjalan saat agent berbicara
- ✅ Mulut tertutup saat agent tidak berbicara
- ✅ Transisi smooth antara buka/tutup mulut
- ✅ Sinkronisasi dengan status `isSpeaking` dari ElevenLabs
- ✅ Kompatibel dengan Quest VR browser