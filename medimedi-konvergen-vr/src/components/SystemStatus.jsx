import { Html } from '@react-three/drei';
import { useState, useEffect } from 'react';

export function SystemStatus({ backendStatus, isVRActive, emotionHistory }) {
  const [systemInfo, setSystemInfo] = useState({
    userAgent: '',
    platform: '',
    language: '',
    online: navigator.onLine,
    cookieEnabled: navigator.cookieEnabled,
    webGL: false,
    webXR: false
  });
  
  const [networkStatus, setNetworkStatus] = useState({
    type: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0
  });
  
  useEffect(() => {
    // Get system information
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    setSystemInfo({
      userAgent: navigator.userAgent.split(' ').slice(-2).join(' '), // Simplified
      platform: navigator.platform,
      language: navigator.language,
      online: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      webGL: !!gl,
      webXR: 'xr' in navigator
    });
    
    // Network information (if available)
    if ('connection' in navigator) {
      const connection = navigator.connection;
      setNetworkStatus({
        type: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0
      });
      
      const updateNetworkInfo = () => {
        setNetworkStatus({
          type: connection.type || 'unknown',
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0
        });
      };
      
      connection.addEventListener('change', updateNetworkInfo);
      return () => connection.removeEventListener('change', updateNetworkInfo);
    }
    
    // Online/offline status
    const handleOnline = () => setSystemInfo(prev => ({ ...prev, online: true }));
    const handleOffline = () => setSystemInfo(prev => ({ ...prev, online: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return '#4CAF50';
      case 'disconnected': return '#F44336';
      case 'checking': return '#FF9800';
      default: return '#9E9E9E';
    }
  };
  
  const getNetworkQuality = () => {
    if (networkStatus.effectiveType === '4g') return { color: '#4CAF50', text: 'Excellent' };
    if (networkStatus.effectiveType === '3g') return { color: '#FF9800', text: 'Good' };
    if (networkStatus.effectiveType === '2g') return { color: '#F44336', text: 'Poor' };
    return { color: '#9E9E9E', text: 'Unknown' };
  };
  
  const networkQuality = getNetworkQuality();
  
  return (
    <Html
      position={[-2.5, 0.5, -1.5]}
      transform
      occlude
      style={{
        width: '400px',
        padding: '15px',
        background: 'rgba(0, 0, 0, 0.85)',
        borderRadius: '10px',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        border: '1px solid #333'
      }}
    >
      <div>
        <h3 style={{ 
          margin: '0 0 15px 0', 
          fontSize: '16px',
          textAlign: 'center',
          color: '#00BCD4'
        }}>
          🖥️ System Status
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          {/* Connection Status */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#FFC107' }}>🔗 Connections</h4>
            
            <div style={{ marginBottom: '5px' }}>
              <span style={{ color: getStatusColor(backendStatus) }}>●</span>
              <span style={{ marginLeft: '5px' }}>Backend: {backendStatus}</span>
            </div>
            
            <div style={{ marginBottom: '5px' }}>
              <span style={{ color: isVRActive ? '#4CAF50' : '#9E9E9E' }}>●</span>
              <span style={{ marginLeft: '5px' }}>VR: {isVRActive ? 'Active' : 'Inactive'}</span>
            </div>
            
            <div style={{ marginBottom: '5px' }}>
              <span style={{ color: systemInfo.online ? '#4CAF50' : '#F44336' }}>●</span>
              <span style={{ marginLeft: '5px' }}>Network: {systemInfo.online ? 'Online' : 'Offline'}</span>
            </div>
            
            <div style={{ marginBottom: '5px' }}>
              <span style={{ color: networkQuality.color }}>●</span>
              <span style={{ marginLeft: '5px' }}>Quality: {networkQuality.text}</span>
            </div>
          </div>
          
          {/* System Capabilities */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#FFC107' }}>⚙️ Capabilities</h4>
            
            <div style={{ marginBottom: '5px' }}>
              <span style={{ color: systemInfo.webGL ? '#4CAF50' : '#F44336' }}>●</span>
              <span style={{ marginLeft: '5px' }}>WebGL: {systemInfo.webGL ? 'Yes' : 'No'}</span>
            </div>
            
            <div style={{ marginBottom: '5px' }}>
              <span style={{ color: systemInfo.webXR ? '#4CAF50' : '#F44336' }}>●</span>
              <span style={{ marginLeft: '5px' }}>WebXR: {systemInfo.webXR ? 'Yes' : 'No'}</span>
            </div>
            
            <div style={{ marginBottom: '5px' }}>
              <span style={{ color: systemInfo.cookieEnabled ? '#4CAF50' : '#F44336' }}>●</span>
              <span style={{ marginLeft: '5px' }}>Cookies: {systemInfo.cookieEnabled ? 'Yes' : 'No'}</span>
            </div>
            
            <div style={{ marginBottom: '5px' }}>
              <span style={{ color: '#4CAF50' }}>●</span>
              <span style={{ marginLeft: '5px' }}>Lang: {systemInfo.language}</span>
            </div>
          </div>
        </div>
        
        {/* Network Details */}
        {networkStatus.effectiveType !== 'unknown' && (
          <div style={{
            marginTop: '15px',
            padding: '10px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '5px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#FFC107' }}>📡 Network Details</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11px' }}>
              <div>Type: {networkStatus.effectiveType.toUpperCase()}</div>
              <div>Downlink: {networkStatus.downlink} Mbps</div>
              <div>RTT: {networkStatus.rtt}ms</div>
              <div>Platform: {systemInfo.platform}</div>
            </div>
          </div>
        )}
        
        {/* Emotion Analytics Summary */}
        <div style={{
          marginTop: '15px',
          padding: '10px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '5px'
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#FFC107' }}>📊 Session Analytics</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11px' }}>
            <div>Total Analyses: {emotionHistory.length}</div>
            <div>Session Time: {Math.floor(Date.now() / 60000) % 60}min</div>
            <div>Last Update: {emotionHistory.length > 0 ? emotionHistory[emotionHistory.length - 1].timestamp : 'None'}</div>
            <div>Status: {backendStatus === 'connected' ? '✅ Ready' : '❌ Issues'}</div>
          </div>
        </div>
        
        {/* Warning Messages */}
        {(!systemInfo.webXR || !systemInfo.webGL) && (
          <div style={{
            marginTop: '10px',
            padding: '8px',
            background: 'rgba(255, 152, 0, 0.2)',
            borderRadius: '5px',
            fontSize: '11px',
            color: '#FFB74D'
          }}>
            ⚠️ {!systemInfo.webXR && 'WebXR not supported. '}
            {!systemInfo.webGL && 'WebGL not available. '}
            VR experience may be limited.
          </div>
        )}
      </div>
    </Html>
  );
}