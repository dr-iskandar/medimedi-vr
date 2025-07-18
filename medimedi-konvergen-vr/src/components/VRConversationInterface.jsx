import { useConversation } from '@elevenlabs/react';
import { useState, useEffect } from 'react';

export function VRConversationInterface({ onEmotionChange }) {
  const [agentId, setAgentId] = useState("agent_01jz0apm4sfc59m063j29dpyge"); // Hardcoded Agent ID
  const [isConnected, setIsConnected] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('netral');
  const [messages, setMessages] = useState([]);

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
      const response = await fetch('http://localhost:5001/api/emotion/analyze', {
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
    } else if (lowerText.includes('sedih') || lowerText.includes('kecewa')) {
      return 'sedih';
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
    conversation
  };
}

