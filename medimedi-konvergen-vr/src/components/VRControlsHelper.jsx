import { Html } from '@react-three/drei';
import { useState, useEffect } from 'react';

export function VRControlsHelper({ isVRActive }) {
  const [showHelp, setShowHelp] = useState(true);
  const [helpStep, setHelpStep] = useState(0);
  
  const helpSteps = [
    {
      title: "🎮 Welcome to VR!",
      content: "Use your VR controllers to interact with the environment. Look around to explore!"
    },
    {
      title: "🗣️ Voice Interaction",
      content: "Speak naturally to the AI avatar. Your emotions will be analyzed in real-time."
    },
    {
      title: "📊 Monitor Emotions",
      content: "Watch the emotion panels to see how your feelings are detected and displayed."
    },
    {
      title: "🛠️ Debug Tools",
      content: "Use the debug panel on the left to test connections and view emotion history."
    }
  ];
  
  useEffect(() => {
    if (isVRActive && showHelp) {
      const timer = setTimeout(() => {
        if (helpStep < helpSteps.length - 1) {
          setHelpStep(helpStep + 1);
        } else {
          setShowHelp(false);
        }
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [isVRActive, helpStep, showHelp]);
  
  if (!isVRActive || !showHelp) {
    return null;
  }
  
  return (
    <Html
      position={[0, 2.5, -1.5]}
      transform
      occlude
      style={{
        width: '400px',
        padding: '20px',
        background: 'rgba(0, 100, 200, 0.9)',
        borderRadius: '15px',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        textAlign: 'center',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 0 20px rgba(0, 100, 200, 0.5)'
      }}
    >
      <div>
        <h3 style={{ 
          margin: '0 0 15px 0', 
          fontSize: '20px',
          textShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
        }}>
          {helpSteps[helpStep].title}
        </h3>
        
        <p style={{ 
          margin: '0 0 15px 0', 
          lineHeight: '1.4',
          fontSize: '14px'
        }}>
          {helpSteps[helpStep].content}
        </p>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            Step {helpStep + 1} of {helpSteps.length}
          </div>
          
          <div>
            <button
              onClick={() => setHelpStep(Math.min(helpStep + 1, helpSteps.length - 1))}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                marginRight: '8px'
              }}
              disabled={helpStep >= helpSteps.length - 1}
            >
              Next
            </button>
            
            <button
              onClick={() => setShowHelp(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Skip
            </button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div style={{
          width: '100%',
          height: '4px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '2px',
          marginTop: '15px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${((helpStep + 1) / helpSteps.length) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #00ff88, #00ccff)',
            borderRadius: '2px',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
    </Html>
  );
}