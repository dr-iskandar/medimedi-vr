import { Html } from '@react-three/drei';
import { useState, useEffect } from 'react';

// Helper functions for emotion display
const getEmotionEmoji = (emotion) => {
  const emojiMap = {
    'marah': '😡',
    'sedih': '😢',
    'cemas': '😰',
    'agresif': '😤',
    'defensif': '🛡️',
    'penyesalan': '😔',
    'kesal': '😠',
    'senang': '😊',
    'netral': '😐'
  };
  return emojiMap[emotion] || '😐';
};

const getEmotionColor = (emotion) => {
  const colorMap = {
    'marah': 'rgba(244, 67, 54, 0.3)',
    'sedih': 'rgba(33, 150, 243, 0.3)',
    'cemas': 'rgba(255, 152, 0, 0.3)',
    'agresif': 'rgba(156, 39, 176, 0.3)',
    'defensif': 'rgba(96, 125, 139, 0.3)',
    'penyesalan': 'rgba(121, 85, 72, 0.3)',
    'kesal': 'rgba(255, 87, 34, 0.3)',
    'senang': 'rgba(76, 175, 80, 0.3)',
    'netral': 'rgba(158, 158, 158, 0.3)'
  };
  return colorMap[emotion] || 'rgba(158, 158, 158, 0.3)';
};

export function VRInterface({ 
  agentId, 
  setAgentId, 
  isConnected, 
  currentEmotion, 
  startConversation, 
  endConversation,
  messages,
  emotionConfidence,
  lastAnalysis
}) {
  // Test backend connection
  const [backendStatus, setBackendStatus] = useState('checking');
  
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/emotion/test');
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
    const interval = setInterval(checkBackend, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, []);
  return (
    <Html
      position={[0, 2, -3]}
      transform
      occlude
      style={{
        width: '400px',
        padding: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        borderRadius: '10px',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px'
      }}
    >
      <div>
        <h2 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>
          VR Conversation Control
        </h2>
        
        {/* Backend Status Indicator */}
        <div style={{ 
          marginBottom: '15px', 
          padding: '8px', 
          borderRadius: '5px',
          background: backendStatus === 'connected' ? 'rgba(76, 175, 80, 0.3)' : 
                     backendStatus === 'disconnected' ? 'rgba(244, 67, 54, 0.3)' : 
                     'rgba(255, 193, 7, 0.3)',
          border: `1px solid ${backendStatus === 'connected' ? '#4CAF50' : 
                               backendStatus === 'disconnected' ? '#f44336' : 
                               '#FFC107'}`
        }}>
          <strong>Backend Status:</strong> 
          {backendStatus === 'connected' && '🟢 Connected'}
          {backendStatus === 'disconnected' && '🔴 Disconnected'}
          {backendStatus === 'checking' && '🟡 Checking...'}
          {backendStatus === 'error' && '🟠 Error'}
        </div>
        
        {!isConnected ? (
          <div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Agent ID:
              </label>
              <input
                type="text"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                placeholder="Enter your ElevenLabs Agent ID"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '5px',
                  border: '1px solid #ccc',
                  fontSize: '14px'
                }}
              />
            </div>
            <button
              onClick={startConversation}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Start VR Conversation
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <strong>Status:</strong> Connected ✅<br/>
              <strong>Current Emotion:</strong> 
              <span style={{ 
                display: 'inline-block',
                padding: '4px 8px',
                marginLeft: '8px',
                borderRadius: '15px',
                background: getEmotionColor(currentEmotion),
                fontSize: '16px'
              }}>
                 {getEmotionEmoji(currentEmotion)} {currentEmotion}
               </span>
               <br/>
               <small style={{ opacity: 0.8 }}>
                 Confidence: {Math.round((emotionConfidence || 0) * 100)}%
               </small>
            </div>
            
            {lastAnalysis && (
              <div style={{ 
                marginBottom: '15px',
                padding: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '5px',
                fontSize: '12px'
              }}>
                <strong>Last Analysis:</strong><br/>
                Time: {lastAnalysis.timestamp}<br/>
                Emotion: {getEmotionEmoji(lastAnalysis.emotion)} {lastAnalysis.emotion}<br/>
                Confidence: {Math.round((lastAnalysis.confidence || 0) * 100)}%
              </div>
            )}
            
            <button
              onClick={endConversation}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              End Conversation
            </button>
            
            {messages.length > 0 && (
              <div style={{ 
                marginTop: '15px', 
                maxHeight: '200px', 
                overflowY: 'auto',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '10px',
                borderRadius: '5px'
              }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Recent Messages:</h4>
                {messages.slice(-3).map((msg) => (
                  <div key={msg.id} style={{ marginBottom: '8px', fontSize: '12px' }}>
                    <strong>{msg.speaker}:</strong> {msg.content.substring(0, 100)}...
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Html>
  );
}

