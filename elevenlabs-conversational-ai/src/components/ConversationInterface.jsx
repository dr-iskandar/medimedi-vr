import { useState, useRef, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Trash2, Mic, MicOff, Volume2 } from 'lucide-react';
import Avatar3D from './Avatar3D';

export default function ConversationInterface({ agentId }) {
  const [messages, setMessages] = useState([]);
  const [debugMessages, setDebugMessages] = useState([]);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [emotionAnalysisEnabled, setEmotionAnalysisEnabled] = useState(true);
  const [processedMessageIds, setProcessedMessageIds] = useState(new Set());
  const transcriptEndRef = useRef(null);

  const conversation = useConversation({
    agentId: agentId,
    onConnect: () => {
      console.log('Connected to conversation');
    },
    onDisconnect: () => {
      console.log('Disconnected from conversation');
    },
    onError: (error) => {
      console.error('Conversation error:', error);
    },
    onMessage: async (message) => {
      console.log('📨 Raw message received:', message);
      
      // Add to debug messages
      setDebugMessages(prev => {
        const newDebugMessages = [message, ...prev].slice(0, 5);
        return newDebugMessages;
      });

      // Create a unique ID for this message
      const messageId = `${message.type}_${Date.now()}_${Math.random()}`;
      
      // Check if we've already processed this message
      if (processedMessageIds.has(messageId)) {
        console.log('🔄 Duplicate message, skipping:', messageId);
        return;
      }

      let messageType = 'unknown';
      let content = '';
      let speaker = 'unknown';

      // Enhanced message type detection
      if (message.type === 'user_transcript' || 
          message.source === 'user' || 
          message.role === 'user' ||
          (message.type === 'transcript' && message.user)) {
        messageType = 'user';
        content = message.text || message.content || message.transcript || JSON.stringify(message);
        speaker = 'user';
        console.log('👤 User message detected:', content);
      } else if (message.type === 'agent_response' || 
                 message.type === 'agent_transcript' ||
                 message.type === 'llm_response' ||
                 message.source === 'agent' ||
                 message.source === 'llm' ||
                 (message.role && message.role === 'agent') ||
                 (message.speaker && message.speaker === 'agent') ||
                 (message.type === 'transcript' && !message.user) ||
                 (message.type === 'response') ||
                 (message.type === 'system' && message.source === 'ai')) { // Added this condition
        messageType = 'agent';
        content = message.text || message.content || message.transcript || message.response || message.message || JSON.stringify(message); // Added message.message
        speaker = 'agent';
        console.log('🤖 Processing agent message for NLP analysis:', content);
        
        // Trigger emotion analysis for agent messages
        if (emotionAnalysisEnabled && content && content.trim().length > 0) {
          console.log('🧠 Triggering emotion analysis for agent response...');
          console.log('📝 Agent message content:', content);
          console.log('📏 Content length:', content.trim().length);
          const analyzedEmotion = await analyzeEmotion(content); // Await the analysis
          if (analyzedEmotion) {
            setCurrentEmotion(analyzedEmotion);
          }
        } else {
          console.log('⚠️ Emotion analysis skipped:', {
            enabled: emotionAnalysisEnabled,
            hasContent: !!content,
            contentLength: content ? content.trim().length : 0
          });
          
          // Force fallback emotion analysis even if content is empty or short
          if (emotionAnalysisEnabled) {
            console.log('🔄 Forcing fallback emotion analysis...');
            const fallbackEmotion = detectEmotionFallback(content || 'neutral message');
            setCurrentEmotion(fallbackEmotion);
          }
        }
      } else {
        messageType = 'debug';
        content = JSON.stringify(message, null, 2);
        speaker = 'system';
        console.log('🔧 Debug message:', content);
        
        // Test emotion analysis on any message that contains text
        if (emotionAnalysisEnabled && message.message && typeof message.message === 'string') {
          console.log('🧪 Testing emotion analysis on debug message:', message.message);
          const analyzedEmotion = await analyzeEmotion(message.message); // Await the analysis
          if (analyzedEmotion) {
            setCurrentEmotion(analyzedEmotion);
          }
        }
      }

      // Add message to conversation
      const newMessage = {
        id: messageId,
        type: messageType,
        content: content,
        speaker: speaker,
        timestamp: new Date().toLocaleTimeString(),
        tentative: message.tentative || false,
        rawType: message.type || 'unknown',
        emotion: speaker === 'agent' ? currentEmotion : null // Store emotion with the message
      };

      setMessages(prev => {
        const updatedMessages = [...prev, newMessage];
        // If the new message is an agent message, and emotion was just analyzed, update the last agent message with the emotion
        if (speaker === 'agent' && currentEmotion) {
          const lastAgentMessageIndex = updatedMessages.findLastIndex(msg => msg.speaker === 'agent');
          if (lastAgentMessageIndex !== -1) {
            updatedMessages[lastAgentMessageIndex].emotion = currentEmotion;
          }
        }
        return updatedMessages;
      });
      setProcessedMessageIds(prev => new Set([...prev, messageId]));

      console.log('✅ Agent message processed with emotion analysis triggered');
    }
  });

  // Analyze emotion using backend API
  const analyzeEmotion = async (text) => {
    if (!emotionAnalysisEnabled) return;
    
    try {
      console.log('🧠 Analyzing emotion for text:', text);
      
      // Try localhost first for development, then fallback to relative URL
      let apiUrl = 'http://localhost:5000/api/emotion/analyze';
      
      // Check if we're in production (no localhost available)
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        apiUrl = '/api/emotion/analyze';
      }
      
      console.log('🔗 Using API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Emotion analysis result:", result);
        return result;
      } else {
        console.warn("⚠️ Emotion analysis API failed with status:", response.status);
        const fallbackEmotion = detectEmotionFallback(text);
        return fallbackEmotion;
      }
    } catch (error) {
      console.error("❌ Error analyzing emotion:", error);
      const fallbackEmotion = detectEmotionFallback(text);
      return fallbackEmotion;
    }
  };

  // Fallback emotion detection
  const detectEmotionFallback = (text) => {
    const lowerText = text.toLowerCase();
    
    // Enhanced keyword detection for fallback
    if (lowerText.includes('senang') || lowerText.includes('bahagia') || lowerText.includes('gembira') ||
        lowerText.includes('happy') || lowerText.includes('joy') || lowerText.includes('excited') ||
        lowerText.includes('love') || lowerText.includes('suka') || lowerText.includes('cinta')) {
      return { emotion: 'senang', confidence: 0.7, method: 'fallback' };
    }
    
    if (lowerText.includes('marah') || lowerText.includes('kesal') || lowerText.includes('muak') || 
        lowerText.includes('angry') || lowerText.includes('mad') || lowerText.includes('furious') ||
        lowerText.includes('geram') || lowerText.includes('jengkel') || lowerText.includes('dongkol')) {
      return { emotion: 'marah', confidence: 0.7, method: 'fallback' };
    }
    
    if (lowerText.includes('sedih') || lowerText.includes('kecewa') || lowerText.includes('galau') ||
        lowerText.includes('sad') || lowerText.includes('disappointed') || lowerText.includes('cry')) {
      return { emotion: 'sedih', confidence: 0.7, method: 'fallback' };
    }
    
    if (lowerText.includes('cemas') || lowerText.includes('khawatir') || lowerText.includes('takut') ||
        lowerText.includes('anxious') || lowerText.includes('worried') || lowerText.includes('scared')) {
      return { emotion: 'cemas', confidence: 0.7, method: 'fallback' };
    }
    
    if (lowerText.includes('hancurkan') || lowerText.includes('bunuh') || lowerText.includes('serang') ||
        lowerText.includes('destroy') || lowerText.includes('kill') || lowerText.includes('attack')) {
      return { emotion: 'agresif', confidence: 0.7, method: 'fallback' };
    }
    
    if (lowerText.includes('maaf') || lowerText.includes('sorry') || lowerText.includes('salah') ||
        lowerText.includes('menyesal') || lowerText.includes('regret')) {
      return { emotion: 'penyesalan', confidence: 0.7, method: 'fallback' };
    }
    
    return { emotion: 'netral', confidence: 0.5, method: 'fallback' };
  };

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Prevent page scroll when conversation is active
  useEffect(() => {
    if (conversation.status === 'connected') {
      // Prevent page scrolling
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      // Scroll to top to ensure avatar is visible
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Re-enable page scrolling when disconnected
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, [conversation.status]);

  const clearTranscript = () => {
    setMessages([]);
    setDebugMessages([]);
    setProcessedMessageIds(new Set());
    setCurrentEmotion(null);
  };

  const toggleEmotionAnalysis = () => {
    setEmotionAnalysisEnabled(!emotionAnalysisEnabled);
    if (!emotionAnalysisEnabled) {
      setCurrentEmotion(null);
    }
  };

  const getMessageIcon = (type) => {
    switch (type) {
      case 'user': return '👤';
      case 'agent': return '🤖';
      case 'debug': return '🔧';
      default: return '❓';
    }
  };

  const getMessageBgColor = (type) => {
    switch (type) {
      case 'user': return 'bg-blue-100 ml-8';
      case 'agent': return 'bg-gray-100 mr-8';
      case 'debug': return 'bg-yellow-50 mx-4';
      default: return 'bg-gray-50 mx-4';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>Controls</span>
                  <Badge variant={conversation.status === 'connected' ? 'default' : 'secondary'}>
                    {conversation.status === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
                  </Badge>
                  <Badge variant="outline" className="ml-auto">
                    🧠 NLP Emotion
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={conversation.status === 'connected' ? conversation.endSession : conversation.startSession}
                  className="w-full"
                  variant={conversation.status === 'connected' ? 'destructive' : 'default'}
                >
                  {conversation.status === 'connected' ? (
                    <>
                      <MicOff className="w-4 h-4 mr-2" />
                      End Conversation
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Start Conversation
                    </>
                  )}
                </Button>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Volume
                  </label>
                  <Slider
                    value={[conversation.volume * 100]}
                    onValueChange={([value]) => conversation.setVolume(value / 100)}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-right text-sm text-gray-500">{Math.round(conversation.volume * 100)}%</div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Agent Speaking</div>
                    <div className="text-gray-600">{conversation.isSpeaking ? 'Yes' : 'No'}</div>
                  </div>
                  <div>
                    <div className="font-medium">Agent ID</div>
                    <div className="text-gray-600 truncate">{agentId.slice(0, 12)}...</div>
                  </div>
                  <div>
                    <div className="font-medium">Messages</div>
                    <div className="text-gray-600">{messages.length}</div>
                  </div>
                  <div>
                    <div className="font-medium">Agent Messages</div>
                    <div className="text-gray-600">{messages.filter(m => m.type === 'agent').length}</div>
                  </div>
                  <div>
                    <div className="font-medium">Current Emotion</div>
                    <div className="text-gray-600">
                      {currentEmotion?.emotion || 'None'}
                      {currentEmotion && (
                        <span className="text-xs ml-1">
                          ({Math.round((currentEmotion.confidence || 0) * 100)}% - {currentEmotion.method})
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Emotion Analysis</div>
                    <Badge variant={emotionAnalysisEnabled ? 'default' : 'secondary'}>
                      {emotionAnalysisEnabled ? 'ON' : 'OFF'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-medium">Status</div>
                  <div className="text-gray-600 capitalize">{conversation.status}</div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={clearTranscript}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Transcript
                  </Button>
                  <Button
                    onClick={toggleEmotionAnalysis}
                    variant={emotionAnalysisEnabled ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                  >
                    {emotionAnalysisEnabled ? 'Disable' : 'Enable'} Emotion
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - 3D Avatar */}
          <div className="lg:col-span-1">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle>3D Avatar with Facial Expressions</CardTitle>
              </CardHeader>
              <CardContent className="h-[500px] p-0">
                <Avatar3D 
                  isSpeaking={conversation.isSpeaking} 
                  audioData={[]}
                  currentEmotion={currentEmotion}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Conversation Transcript */}
          <div className="lg:col-span-1">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Conversation Transcript</span>
                  <Badge variant="outline">{messages.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 min-h-0" style={{ maxHeight: 'calc(600px - 120px)' }}>
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <p>No conversation yet</p>
                      <p className="text-sm">Start talking to see the transcript</p>
                      <Badge variant="outline" className="mt-2">
                        🧠 Agent emotions will be analyzed
                      </Badge>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-3 rounded-lg ${getMessageBgColor(message.type)}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg">{getMessageIcon(message.type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm capitalize">{message.speaker}</span>
                              <span className="text-xs text-gray-500">{message.timestamp}</span>
                              {message.tentative && (
                                <Badge variant="outline" className="text-xs">Tentative</Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">{message.rawType}</Badge>
                              {message.type === 'agent' && message.emotion && (
                                <div className="flex items-center gap-1">
                                  <span className="text-lg">
                                    {message.emotion.emotion === 'marah' ? '😠' : 
                                     message.emotion.emotion === 'sedih' ? '😢' : 
                                     message.emotion.emotion === 'senang' ? '😊' : 
                                     message.emotion.emotion === 'cemas' ? '😰' : 
                                     message.emotion.emotion === 'agresif' ? '😤' : 
                                     message.emotion.emotion === 'penyesalan' ? '😔' : 
                                     message.emotion.emotion === 'kesal' ? '😠' : '😐'}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {message.emotion.emotion} ({Math.round((message.emotion.confidence || 0) * 100)}%)
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <p className="text-sm break-words">{message.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={transcriptEndRef} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Debug Information */}
        {debugMessages.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Debug Information</span>
                <Badge variant="outline">{debugMessages.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {debugMessages.map((msg, index) => (
                  <div key={index} className="text-xs bg-gray-100 p-2 rounded font-mono">
                    <pre className="whitespace-pre-wrap break-all">
                      {JSON.stringify(msg, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

