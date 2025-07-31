import { Canvas } from '@react-three/fiber';
import { Suspense, useState, useEffect } from 'react';
import { XR, VRButton, Controllers, Hands } from '@react-three/xr';
import { OrbitControls } from '@react-three/drei';
import { Environment360 } from './components/Environment360';
import { Avatar } from './components/Avatar';
import { VRConversationInterface } from './components/VRConversationInterface';
import { VRInterface } from './components/VRInterface';
import { EmotionStats } from './components/EmotionStats';
import { DebugPanel } from './components/DebugPanel';
import { VRControlsHelper } from './components/VRControlsHelper';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { SystemStatus } from './components/SystemStatus';
import './App.css';

function Scene({ isVRActive, isVRConnected }) {
  const [currentEmotion, setCurrentEmotion] = useState('netral');
  const [emotionConfidence, setEmotionConfidence] = useState(0.5);
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const [emotionHistory, setEmotionHistory] = useState([]);
  const [backendStatus, setBackendStatus] = useState('checking');
  
  // Check backend status
   useEffect(() => {
     const checkBackend = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_DIRECT_URL || 'http://localhost:5001';
      const response = await fetch(`${backendUrl}/emotion/test`);
      if (response.ok) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('error');
      }
    } catch (error) {
      setBackendStatus('disconnected');
    }
  };
     
     checkBackend();
     const interval = setInterval(checkBackend, 30000); // Check every 30 seconds
     
     return () => clearInterval(interval);
   }, []);
  
  // Use VR conversation interface
  const conversationInterface = VRConversationInterface({
    onEmotionChange: (emotion) => {
      console.log('🎭 VR Emotion changed:', emotion);
      setCurrentEmotion(emotion.emotion);
      setEmotionConfidence(emotion.confidence || 0.5);
      
      const analysisData = {
        emotion: emotion.emotion,
        confidence: emotion.confidence,
        timestamp: new Date().toLocaleTimeString(),
        fullTimestamp: new Date().toISOString()
      };
      
      setLastAnalysis(analysisData);
      
      // Add to emotion history (keep last 50 entries)
      setEmotionHistory(prev => {
        const newHistory = [...prev, analysisData];
        return newHistory.slice(-50);
      });
    }
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      
      {/* 360 Environment */}
      <Environment360 />
      
      {/* Avatar Character with emotion support and audio-driven animation */}
      <Avatar 
        currentEmotion={currentEmotion} 
        isSpeaking={conversationInterface.conversation.isSpeaking}
        audioData={conversationInterface.audioData}
      />
      
      {/* Ground Plane for NPC positioning */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#2a2a2a" transparent opacity={0.3} />
      </mesh>
      
      {/* VR Interface Panel - Center Front */}
      <VRInterface 
        {...conversationInterface} 
        emotionConfidence={emotionConfidence}
        lastAnalysis={lastAnalysis}
      />
      
      {/* All UI components are now hidden */}
       {/* SystemStatus, DebugPanel, EmotionStats, and PerformanceMonitor are disabled */}
         
        {/* VR Controllers and Hands */}
         <Controllers />
         <Hands />
      
      {/* Camera controls for non-VR mode */}
      <OrbitControls enablePan={false} enableZoom={false} enableRotate={true} />
    </>
  );
}

function LoadingFallback() {
  return (
    <mesh position={[0, 0, -1]}>
      <planeGeometry args={[2, 0.5]} />
      <meshBasicMaterial color="white" />
    </mesh>
  );
}

export default function App() {
  const [isVRActive, setIsVRActive] = useState(false);
  const [isVRConnected, setIsVRConnected] = useState(false);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        left: '10px', 
        zIndex: 1000, 
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px'
      }}>
        <h1 style={{ margin: 0, marginBottom: '10px' }}>
          Medimedi Konvergen WebVR
        </h1>
        <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>
          Desktop: Click and drag to look around<br/>
          VR: Click "Enter VR" button below<br/>
          Interface: Look up to see conversation controls
        </p>
      </div>
      
      {/* VR Button */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000
      }}>
        <VRButton />
      </div>
      
      <Canvas 
        camera={{ position: [0, 0, 3], fov: 75 }}
        onCreated={({ gl }) => {
          // Listen for VR session events
          gl.xr.addEventListener('sessionstart', () => {
            setIsVRActive(true);
            setIsVRConnected(true);
          });
          gl.xr.addEventListener('sessionend', () => {
            setIsVRActive(false);
            setIsVRConnected(false);
          });
        }}
      >
        <XR>
          <Suspense fallback={<LoadingFallback />}>
            <Scene isVRActive={isVRActive} isVRConnected={isVRConnected} />
          </Suspense>
        </XR>
      </Canvas>
    </div>
  );
}

