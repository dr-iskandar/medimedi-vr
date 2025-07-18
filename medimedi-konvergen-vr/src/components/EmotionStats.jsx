import { useState, useEffect } from 'react';
import { Html } from '@react-three/drei';

export function EmotionStats({ emotionHistory = [] }) {
  const [stats, setStats] = useState({});
  
  useEffect(() => {
    if (emotionHistory.length === 0) return;
    
    // Calculate emotion statistics
    const emotionCounts = {};
    emotionHistory.forEach(entry => {
      emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
    });
    
    const total = emotionHistory.length;
    const emotionPercentages = {};
    Object.keys(emotionCounts).forEach(emotion => {
      emotionPercentages[emotion] = Math.round((emotionCounts[emotion] / total) * 100);
    });
    
    setStats({
      counts: emotionCounts,
      percentages: emotionPercentages,
      total,
      mostFrequent: Object.keys(emotionCounts).reduce((a, b) => 
        emotionCounts[a] > emotionCounts[b] ? a : b
      )
    });
  }, [emotionHistory]);
  
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
  
  if (emotionHistory.length === 0) {
    return (
      <Html
        position={[2.5, 1.5, -1.5]}
        transform
        occlude
        style={{
          width: '300px',
          padding: '15px',
          background: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '10px',
          color: 'white',
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px'
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>📊 Emotion Statistics</h3>
          <p style={{ margin: 0, opacity: 0.7 }}>No emotion data yet. Start a conversation to see statistics.</p>
        </div>
      </Html>
    );
  }
  
  return (
    <Html
      position={[2.5, 1.5, -1.5]}
      transform
      occlude
      style={{
        width: '300px',
        padding: '15px',
        background: 'rgba(0, 0, 0, 0.8)',
        borderRadius: '10px',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px'
      }}
    >
      <div>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>📊 Emotion Statistics</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <strong>Total Analyses:</strong> {stats.total}<br/>
          <strong>Most Frequent:</strong> {getEmotionEmoji(stats.mostFrequent)} {stats.mostFrequent}
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <strong>Emotion Breakdown:</strong>
          {Object.entries(stats.percentages || {}).map(([emotion, percentage]) => (
            <div key={emotion} style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '5px',
              padding: '3px 0'
            }}>
              <span>{getEmotionEmoji(emotion)} {emotion}</span>
              <span>{percentage}%</span>
            </div>
          ))}
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '8px',
          borderRadius: '5px',
          fontSize: '11px'
        }}>
          <strong>Recent Trend:</strong><br/>
          {emotionHistory.slice(-3).map((entry, index) => (
            <span key={index} style={{ marginRight: '8px' }}>
              {getEmotionEmoji(entry.emotion)}
            </span>
          ))}
        </div>
      </div>
    </Html>
  );
}