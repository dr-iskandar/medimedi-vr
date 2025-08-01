const axios = require('axios');
const { Logger } = require('../utils/logger');

class EmotionAnalyzer {
  constructor() {
    this.backendUrl = process.env.EMOTION_BACKEND_URL || 'http://localhost:5001';
    this.logger = new Logger();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async analyze(text) {
    if (!text || text.trim().length === 0) {
      return this.getDefaultEmotion();
    }

    // Check cache first
    const cacheKey = text.toLowerCase().trim();
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        this.logger.debug('Using cached emotion result', { text: text.substring(0, 50) });
        return cached.result;
      } else {
        this.cache.delete(cacheKey);
      }
    }

    try {
      this.logger.debug('Analyzing emotion for text', { 
        text: text.substring(0, 100),
        length: text.length 
      });

      const response = await axios.post(`${this.backendUrl}/api/emotion/analyze`, {
        text: text
      }, {
        timeout: 5000, // 5 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = {
        emotion: response.data.emotion || 'netral',
        confidence: response.data.confidence || 0.5,
        emoticon: response.data.emoticon || '😐',
        method: response.data.method || 'nlp_lexicon',
        matches: response.data.matches || [],
        allScores: response.data.all_scores || {},
        textLength: response.data.text_length || text.length,
        processedText: response.data.processed_text || text.toLowerCase(),
        timestamp: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });

      this.logger.info('Emotion analysis completed', {
        emotion: result.emotion,
        confidence: result.confidence,
        method: result.method
      });

      return result;
    } catch (error) {
      this.logger.error('Emotion analysis failed', {
        error: error.message,
        text: text.substring(0, 50),
        backendUrl: this.backendUrl
      });

      // Return fallback emotion
      const fallbackResult = this.detectEmotionFallback(text);
      
      // Cache fallback result with shorter timeout
      this.cache.set(cacheKey, {
        result: fallbackResult,
        timestamp: Date.now()
      });

      return fallbackResult;
    }
  }

  detectEmotionFallback(text) {
    const lowerText = text.toLowerCase();
    
    // Enhanced keyword detection for fallback
    const emotionPatterns = {
      senang: [
        'senang', 'bahagia', 'gembira', 'happy', 'joy', 'excited', 
        'love', 'suka', 'cinta', 'riang', 'ceria', 'girang'
      ],
      marah: [
        'marah', 'kesal', 'muak', 'angry', 'mad', 'furious',
        'geram', 'jengkel', 'dongkol', 'benci', 'hate'
      ],
      sedih: [
        'sedih', 'kecewa', 'galau', 'sad', 'disappointed', 'cry',
        'menangis', 'duka', 'nestapa', 'depresi'
      ],
      cemas: [
        'cemas', 'khawatir', 'takut', 'anxious', 'worried', 'scared',
        'gelisah', 'panik', 'stress', 'tegang'
      ],
      agresif: [
        'hancurkan', 'bunuh', 'serang', 'destroy', 'kill', 'attack',
        'pukul', 'hajar', 'gebuk', 'fight'
      ],
      penyesalan: [
        'maaf', 'sorry', 'salah', 'menyesal', 'regret',
        'tobat', 'insaf', 'sesal'
      ]
    };

    for (const [emotion, keywords] of Object.entries(emotionPatterns)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          return {
            emotion: emotion,
            confidence: 0.7,
            emoticon: this.getEmotionEmoticon(emotion),
            method: 'fallback_keyword',
            matches: [keyword],
            allScores: { [emotion]: 0.7, netral: 0.3 },
            textLength: text.length,
            processedText: lowerText,
            timestamp: new Date().toISOString()
          };
        }
      }
    }
    
    return this.getDefaultEmotion();
  }

  getDefaultEmotion() {
    return {
      emotion: 'netral',
      confidence: 0.5,
      emoticon: '😐',
      method: 'default',
      matches: [],
      allScores: { netral: 1.0 },
      textLength: 0,
      processedText: '',
      timestamp: new Date().toISOString()
    };
  }

  getEmotionEmoticon(emotion) {
    const emoticons = {
      senang: '😊',
      marah: '😠',
      sedih: '😢',
      cemas: '😰',
      agresif: '😡',
      defensif: '🛡️',
      penyesalan: '😔',
      kesal: '😤',
      netral: '😐'
    };
    
    return emoticons[emotion] || '😐';
  }

  async testConnection() {
    try {
      const response = await axios.get(`${this.backendUrl}/api/emotion/test`, {
        timeout: 3000
      });
      
      this.logger.success('Emotion backend connection successful', {
        backendUrl: this.backendUrl,
        status: response.status
      });
      
      return true;
    } catch (error) {
      this.logger.error('Emotion backend connection failed', {
        backendUrl: this.backendUrl,
        error: error.message
      });
      
      return false;
    }
  }

  clearCache() {
    this.cache.clear();
    this.logger.info('Emotion analysis cache cleared');
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      timeout: this.cacheTimeout,
      entries: Array.from(this.cache.keys()).slice(0, 5) // Show first 5 keys
    };
  }
}

module.exports = { EmotionAnalyzer };