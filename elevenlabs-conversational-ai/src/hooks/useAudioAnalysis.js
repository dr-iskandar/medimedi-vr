import { useState, useEffect, useRef } from 'react';

export const useAudioAnalysis = (isSpeaking) => {
  const [audioData, setAudioData] = useState({
    volume: 0,
    frequency: 0,
    dominantFrequency: 0,
    frequencyBins: [],
    isAnalyzing: false
  });
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isSpeaking) {
      startAudioAnalysis();
    } else {
      stopAudioAnalysis();
    }

    return () => {
      stopAudioAnalysis();
    };
  }, [isSpeaking]);

  const startAudioAnalysis = async () => {
    try {
      console.log('🎤 Starting audio analysis...');
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      
      // Create audio context
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const audioContext = audioContextRef.current;
      
      // Create analyser node
      analyserRef.current = audioContext.createAnalyser();
      const analyser = analyserRef.current;
      
      // Configure analyser
      analyser.fftSize = 512; // Higher resolution for better frequency detection
      analyser.smoothingTimeConstant = 0.3;
      
      // Connect microphone to analyser
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      setAudioData(prev => ({ ...prev, isAnalyzing: true }));
      
      // Start analysis loop
      analyzeAudio();
      
    } catch (error) {
      console.error('❌ Error accessing microphone:', error);
      setAudioData(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  const analyzeAudio = () => {
    if (!analyserRef.current) return;
    
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const frequencyArray = new Float32Array(bufferLength);
    
    // Get frequency data
    analyser.getByteFrequencyData(dataArray);
    analyser.getFloatFrequencyData(frequencyArray);
    
    // Calculate volume (RMS)
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const volume = Math.sqrt(sum / bufferLength) / 255;
    
    // Find dominant frequency
    let maxValue = 0;
    let maxIndex = 0;
    for (let i = 0; i < bufferLength; i++) {
      if (dataArray[i] > maxValue) {
        maxValue = dataArray[i];
        maxIndex = i;
      }
    }
    
    // Convert index to frequency (Hz)
    const sampleRate = audioContextRef.current.sampleRate;
    const dominantFrequency = (maxIndex * sampleRate) / (analyser.fftSize * 2);
    
    // Calculate average frequency weighted by amplitude
    let weightedSum = 0;
    let totalWeight = 0;
    for (let i = 0; i < bufferLength; i++) {
      const freq = (i * sampleRate) / (analyser.fftSize * 2);
      const weight = dataArray[i];
      weightedSum += freq * weight;
      totalWeight += weight;
    }
    const averageFrequency = totalWeight > 0 ? weightedSum / totalWeight : 0;
    
    // Update state
    setAudioData({
      volume: Math.min(volume, 1.0),
      frequency: averageFrequency,
      dominantFrequency: dominantFrequency,
      frequencyBins: Array.from(dataArray).slice(0, 50), // First 50 bins for visualization
      isAnalyzing: true
    });
    
    // Continue analysis
    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  };

  const stopAudioAnalysis = () => {
    console.log('🛑 Stopping audio analysis...');
    
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    
    // Reset audio data
    setAudioData({
      volume: 0,
      frequency: 0,
      dominantFrequency: 0,
      frequencyBins: [],
      isAnalyzing: false
    });
  };

  return audioData;
};