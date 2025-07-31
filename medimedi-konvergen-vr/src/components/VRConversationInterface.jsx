import { useConversation } from '@elevenlabs/react';
import { useState, useEffect } from 'react';
import { useAudioAnalysis } from '../hooks/useAudioAnalysis';

export function VRConversationInterface({ onEmotionChange }) {
  const [agentId, setAgentId] = useState("agent_01k0rh29kxebks7s0stwrszcfe"); // Hardcoded Agent ID
  const [isConnected, setIsConnected] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('netral');
  const [messages, setMessages] = useState([]);
  
  // Audio analysis for real-time mouth animation
  const audioData = useAudioAnalysis(isConnected);

  const conversation = useConversation({
    onConnect: () => {
      console.log('🔗 VR Conversation connected');
      setIsConnected(true);
    },
    onDisconnect: () => {
      console.log('🔌 VR Conversation disconnected');
      setIsConnected(false);
    },
    onMessage: async (message) => {
      console.log('📨 VR Message received:', message);
      
      // Add message to conversation history
      const newMessage = {
        id: Date.now(),
        content: message.message || JSON.stringify(message),
        speaker: message.source === 'ai' ? 'agent' : 'user',
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Analyze emotion for agent messages
      if (message.source === 'ai' && message.message) {
        try {
          const emotion = await analyzeEmotion(message.message);
          if (emotion) {
            setCurrentEmotion(emotion.emotion);
            onEmotionChange?.({ emotion: emotion.emotion, confidence: emotion.confidence, isSpeaking: conversation.isSpeaking });
          }
        } catch (error) {
          console.error('❌ VR Emotion analysis failed:', error);
          // Fallback emotion detection
          const fallbackEmotion = detectEmotionFallback(message.message);
          setCurrentEmotion(fallbackEmotion);
            onEmotionChange?.({ emotion: fallbackEmotion, confidence: 0.5, isSpeaking: conversation.isSpeaking });
        }
      }
    },
    onError: (error) => {
      console.error('❌ VR Conversation error:', error);
    }
  });

  // Emotion analysis function
  const analyzeEmotion = async (text) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_DIRECT_URL || 'http://localhost:5001';
      const response = await fetch(`${backendUrl}/api/emotion/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('🧠 VR Emotion analysis result:', result);
        return result;
      }
    } catch (error) {
      console.error('❌ VR Emotion API error:', error);
    }
    return null;
  };

  // Fallback emotion detection
  const detectEmotionFallback = (text) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('marah') || lowerText.includes('muak') || lowerText.includes('kesal')) {
      return 'marah';
    } else if (lowerText.includes('senang') || lowerText.includes('bahagia') || lowerText.includes('gembira')) {
      return 'senang';
    } else if (lowerText.includes('sedih')) {
      return 'sedih';
    } else if (lowerText.includes('kecewa') || lowerText.includes('mengecewakan')) {
      return 'kecewa';
    } else if (lowerText.includes('takut') || lowerText.includes('ketakutan') || lowerText.includes('ngeri')) {
      return 'takut';
    } else if (lowerText.includes('bingung') || lowerText.includes('kebingungan') || lowerText.includes('tidak mengerti')) {
      return 'bingung';
    } else if (lowerText.includes('diam') || lowerText.includes('tidak bicara') || lowerText.includes('senyap')) {
      return 'diam';
    } else if (lowerText.includes('tertawa') || lowerText.includes('lucu') || lowerText.includes('haha') || lowerText.includes('wkwk')) {
      return 'tertawa';
    }
    return 'netral';
  };

  const startConversation = async () => {
    if (!agentId.trim()) {
      alert('Please enter an Agent ID');
      return;
    }
    
    try {
      await conversation.startSession({ agentId: agentId.trim() });
    } catch (error) {
      console.error('❌ Failed to start VR conversation:', error);
      alert('Failed to start conversation. Please check your Agent ID.');
    }
  };

  const endConversation = async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error('❌ Failed to end VR conversation:', error);
    }
  };

  return {
    agentId,
    setAgentId,
    isConnected,
    currentEmotion,
    messages,
    startConversation,
    endConversation,
    conversation,
    audioData
  };
}

