# 🥽 MediMedi VR - Virtual Reality Emotion Analysis Platform

Platform VR interaktif dengan analisis emosi real-time menggunakan React Three.js, WebXR, dan Flask backend.

## 🌟 Features

- **🥽 WebXR Support** - Compatible dengan Meta Quest, HTC Vive, Valve Index
- **😊 Real-time Emotion Analysis** - Analisis emosi menggunakan AI/ML
- **🎭 3D Avatar Animation** - Avatar dengan facial expressions dan smooth transitions
- **🌍 360° Environment** - Immersive 360-degree environments
- **🎮 VR Controllers** - Hand tracking dan controller support
- **📊 Performance Monitoring** - Real-time FPS dan memory monitoring
- **🔄 Smooth Animations** - Interpolated blendshape transitions

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   VR Headset    │───▶│  React Frontend  │───▶│  Flask Backend  │
│   (WebXR)       │    │  (Three.js/XR)   │    │  (Emotion API)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- pnpm (recommended) atau npm
- VR Headset (optional, dapat digunakan di browser biasa)

### Local Development

```bash
# Clone repository
git clone https://github.com/dr-iskandar/medimedi-vr.git
cd medimedi-vr

# Setup Backend
cd emotion-analysis-backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# atau venv\Scripts\activate  # Windows
pip install -r requirements.txt
python src/main.py

# Setup Frontend (terminal baru)
cd ../medimedi-konvergen-vr
pnpm install
pnpm dev
```

Akses aplikasi di: http://localhost:5173

## 🌐 Production Deployment

### Quick Deploy ke Server
```bash
# Deploy ke server 156.67.217.39:5211
./quick-deploy.sh
```

### Manual Deployment
Lihat [README-DEPLOYMENT.md](README-DEPLOYMENT.md) untuk panduan lengkap.

## 📁 Project Structure

```
├── emotion-analysis-backend/     # Flask backend
│   ├── src/
│   │   ├── main.py              # Entry point
│   │   ├── routes/              # API routes
│   │   └── models/              # Data models
│   └── requirements.txt
├── medimedi-konvergen-vr/        # React frontend
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── Avatar.jsx       # 3D Avatar dengan emotions
│   │   │   ├── Environment360.jsx
│   │   │   └── VRInterface.jsx
│   │   └── hooks/               # Custom hooks
│   ├── public/
│   │   ├── kevin_kecil_v4.glb   # 3D Avatar model
│   │   └── environment.jpg      # 360° background
│   └── package.json
├── deploy.sh                     # Deployment script
├── quick-deploy.sh              # Quick deployment
└── README-DEPLOYMENT.md         # Deployment guide
```

## 🎮 VR Controls

### Desktop/Mobile
- **Mouse/Touch** - Look around
- **WASD/Arrow Keys** - Movement (desktop)
- **VR Button** - Enter VR mode

### VR Headset
- **Head Movement** - Look around
- **Controllers** - Interact with UI
- **Hand Tracking** - Natural hand interactions (if supported)

## 🎭 Avatar Emotions

Avatar mendukung berbagai ekspresi emosi:
- **Netral** - Default expression
- **Senang** - Smile animation
- **Marah/Agresif** - Angry expression dengan frown
- **Sedih** - Sad expression
- **Cemas** - Anxious expression dengan raised eyebrows

### Smooth Transitions
- Transisi antar emosi menggunakan interpolasi
- Kecepatan transisi dapat dikonfigurasi
- Auto-reset ke netral saat percakapan berhenti

## 🔧 Configuration

### Environment Variables

**Development (.env.local)**
```env
VITE_BACKEND_URL=http://localhost:5001
VITE_ENVIRONMENT=development
VITE_DEBUG=true
```

**Production (.env.production)**
```env
VITE_BACKEND_URL=http://156.67.217.39:5211/api
VITE_ENVIRONMENT=production
VITE_DEBUG=false
```

## 🧪 Testing

### Frontend
```bash
cd medimedi-konvergen-vr
pnpm test
```

### Backend
```bash
cd emotion-analysis-backend
source venv/bin/activate
python -m pytest
```

### VR Testing
1. Gunakan Chrome/Edge dengan WebXR support
2. Connect VR headset
3. Klik "Enter VR" button
4. Test semua interactions

## 📊 Performance

### Optimization
- **Code Splitting** - Lazy loading untuk components
- **Asset Optimization** - Compressed textures dan models
- **Memory Management** - Efficient Three.js object disposal
- **Frame Rate** - Target 90fps untuk VR

### Monitoring
- Real-time FPS counter
- Memory usage tracking
- Network latency monitoring
- Error tracking dan logging

## 🔍 Troubleshooting

### Common Issues

**VR tidak berfungsi**
- Pastikan browser support WebXR
- Check VR headset connection
- Enable VR di browser settings

**Avatar tidak load**
- Check network connection
- Verify GLTF model path
- Check browser console untuk errors

**Backend connection failed**
- Verify backend is running
- Check CORS settings
- Verify API endpoints

### Debug Mode
```bash
# Enable debug mode
export VITE_DEBUG=true
pnpm dev
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Three.js** - 3D graphics library
- **React Three Fiber** - React renderer untuk Three.js
- **@react-three/xr** - WebXR support
- **@react-three/drei** - Useful helpers
- **Flask** - Python web framework

## 📞 Support

Untuk support dan pertanyaan:
- Create GitHub issue
- Check [deployment guide](README-DEPLOYMENT.md)
- Review troubleshooting section

---

**Made with ❤️ for immersive VR experiences**