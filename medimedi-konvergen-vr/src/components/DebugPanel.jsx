import { Html } from '@react-three/drei';
import { useState } from 'react';

export function DebugPanel({ 
  currentEmotion, 
  emotionConfidence, 
  isConnected, 
  backendStatus,
  emotionHistory 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const testEmotions = [
    'marah', 'sedih', 'cemas', 'agresif', 'defensif', 
    'penyesalan', 'kesal', 'senang', 'netral'
  ];
  
  const testBackendConnection = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_DIRECT_URL || 'http://localhost:5001';
      const response = await fetch(`${backendUrl}/api/emotion/test`);
      const data = await response.json();
      console.log('🧪 Backend test result:', data);
      alert('Backend test successful! Check console for details.');
    } catch (error) {
      console.error('🧪 Backend test failed:', error);
      alert('Backend test failed! Check console for details.');
    }
  };
  
  const testEmotionAnalysis = async (testText) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_DIRECT_URL || 'http://localhost:5001';
      const response = await fetch(`${backendUrl}/api/emotion/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testText })
      });
      const data = await response.json();
      console.log('🧪 Emotion analysis test result:', data);
      alert(`Emotion detected: ${data.emotion} (${Math.round(data.confidence * 100)}%)`);
    }
 catch (error) {
      console.error('🧪 Emotion analysis test failed:', error);
      alert('Emotion analysis test failed! Check console for details.');
    }
  };
  
  return (
    <Html
      position={[-2.5, 1.5, -1.5]}
      transform
      occlude
      style={{
        width: isExpanded ? '350px' : '200px',
        padding: '15px',
        background: 'rgba(0, 0, 0, 0.9)',
        borderRadius: '10px',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        border: '1px solid #333'
      }}
    >
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>🛠️ Debug Panel</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <strong>Status:</strong><br/>
          VR: {isConnected ? '🟢' : '🔴'}<br/>
          Backend: {backendStatus === 'connected' ? '🟢' : '🔴'}<br/>
          Emotion: {currentEmotion} ({Math.round(emotionConfidence * 100)}%)
        </div>
        
        {isExpanded && (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <strong>Quick Tests:</strong><br/>
              <button
                onClick={testBackendConnection}
                style={{
                  width: '100%',
                  padding: '6px',
                  margin: '3px 0',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                Test Backend
              </button>
              
              <button
                onClick={() => testEmotionAnalysis('Saya sangat marah dengan pelayanan ini!')}
                style={{
                  width: '100%',
                  padding: '6px',
                  margin: '3px 0',
                  background: '#FF5722',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                Test Angry Text
              </button>
              
              <button
                onClick={() => testEmotionAnalysis('Terima kasih banyak, saya sangat senang!')}
                style={{
                  width: '100%',
                  padding: '6px',
                  margin: '3px 0',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                Test Happy Text
              </button>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <strong>Emotion History:</strong><br/>
              <div style={{
                maxHeight: '100px',
                overflowY: 'auto',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '5px',
                borderRadius: '4px',
                fontSize: '10px'
              }}>
                {emotionHistory.slice(-5).map((entry, index) => (
                  <div key={index} style={{ marginBottom: '2px' }}>
                    {entry.timestamp}: {entry.emotion} ({Math.round(entry.confidence * 100)}%)
                  </div>
                ))}
                {emotionHistory.length === 0 && (
                  <div style={{ opacity: 0.7 }}>No emotion data yet</div>
                )}
              </div>
            </div>
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '10px'
            }}>
              <strong>System Info:</strong><br/>
              Total Analyses: {emotionHistory.length}<br/>
              Frontend: React + Three.js + WebXR<br/>
              Backend: Flask + Python NLP<br/>
              Port: Frontend:5173, Backend:5001
            </div>
          </div>
        )}
      </div>
    </Html>
  );
}