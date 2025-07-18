import { Html } from '@react-three/drei';
import { useState, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

export function PerformanceMonitor() {
  const [fps, setFps] = useState(0);
  const [frameTime, setFrameTime] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const { gl, scene } = useThree();
  
  useFrame(() => {
    frameCount.current++;
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime.current;
    
    if (deltaTime >= 1000) { // Update every second
      const currentFps = Math.round((frameCount.current * 1000) / deltaTime);
      setFps(currentFps);
      setFrameTime(Math.round(deltaTime / frameCount.current * 100) / 100);
      
      frameCount.current = 0;
      lastTime.current = currentTime;
    }
  });
  
  useEffect(() => {
    const updateMemoryUsage = () => {
      if (performance.memory) {
        const used = performance.memory.usedJSHeapSize;
        const total = performance.memory.totalJSHeapSize;
        setMemoryUsage(Math.round((used / total) * 100));
      }
    };
    
    updateMemoryUsage();
    const interval = setInterval(updateMemoryUsage, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  const getPerformanceColor = (fps) => {
    if (fps >= 60) return '#4CAF50'; // Green
    if (fps >= 30) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };
  
  const getMemoryColor = (usage) => {
    if (usage < 70) return '#4CAF50'; // Green
    if (usage < 85) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };
  
  return (
    <Html
      position={[2.5, 2.5, -1.5]}
      transform
      occlude
      style={{
        width: isVisible ? '250px' : '80px',
        padding: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        borderRadius: '8px',
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '12px',
        border: '1px solid #333',
        transition: 'all 0.3s ease'
      }}
    >
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: isVisible ? '10px' : '0'
        }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>⚡ Perf</span>
          <button
            onClick={() => setIsVisible(!isVisible)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            {isVisible ? '−' : '+'}
          </button>
        </div>
        
        {isVisible && (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span>FPS:</span>
              <span style={{ color: getPerformanceColor(fps), fontWeight: 'bold' }}>
                {fps}
              </span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span>Frame Time:</span>
              <span style={{ color: frameTime > 16.67 ? '#FF9800' : '#4CAF50' }}>
                {frameTime}ms
              </span>
            </div>
            
            {performance.memory && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <span>Memory:</span>
                <span style={{ color: getMemoryColor(memoryUsage) }}>
                  {memoryUsage}%
                </span>
              </div>
            )}
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span>Renderer:</span>
              <span style={{ fontSize: '10px', opacity: 0.8 }}>
                {gl.capabilities.isWebGL2 ? 'WebGL2' : 'WebGL1'}
              </span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span>Objects:</span>
              <span style={{ fontSize: '10px', opacity: 0.8 }}>
                {scene.children.length}
              </span>
            </div>
            
            {/* Performance indicators */}
            <div style={{
              marginTop: '10px',
              padding: '5px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              fontSize: '10px'
            }}>
              <div style={{ marginBottom: '3px' }}>
                <span style={{ color: fps >= 60 ? '#4CAF50' : '#FF9800' }}>●</span>
                <span style={{ marginLeft: '5px' }}>Frame Rate</span>
              </div>
              <div style={{ marginBottom: '3px' }}>
                <span style={{ color: frameTime <= 16.67 ? '#4CAF50' : '#FF9800' }}>●</span>
                <span style={{ marginLeft: '5px' }}>Frame Time</span>
              </div>
              {performance.memory && (
                <div>
                  <span style={{ color: memoryUsage < 70 ? '#4CAF50' : '#FF9800' }}>●</span>
                  <span style={{ marginLeft: '5px' }}>Memory Usage</span>
                </div>
              )}
            </div>
            
            {/* Quick optimization tips */}
            {(fps < 30 || frameTime > 33) && (
              <div style={{
                marginTop: '8px',
                padding: '5px',
                background: 'rgba(255, 152, 0, 0.2)',
                borderRadius: '4px',
                fontSize: '9px',
                color: '#FFB74D'
              }}>
                ⚠️ Performance issues detected. Consider reducing quality settings.
              </div>
            )}
          </div>
        )}
      </div>
    </Html>
  );
}