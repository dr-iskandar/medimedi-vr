const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const { ConversationManager } = require('./src/elevenlabs/conversation');
const { EmotionAnalyzer } = require('./src/emotion/analyzer');
const { WebSocketHandler } = require('./src/websocket/handler');
const { Logger } = require('./src/utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;
const logger = new Logger();

// Middleware
app.use(cors({
  origin: '*', // Configure this for production
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'conversational-ai-service',
    version: '1.0.0'
  });
});

// API Routes
app.get('/api/status', (req, res) => {
  const stats = {
    activeSessions: ConversationManager.getActiveSessionCount(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };
  res.json(stats);
});

app.post('/api/conversation/start', async (req, res) => {
  try {
    const { agentId, userId } = req.body;
    
    if (!agentId) {
      return res.status(400).json({ error: 'agentId is required' });
    }
    
    const sessionId = await ConversationManager.createSession(agentId, userId || 'anonymous');
    logger.info(`Session created: ${sessionId} for agent: ${agentId}`);
    
    res.json({ 
      sessionId, 
      status: 'created',
      agentId,
      userId
    });
  } catch (error) {
    logger.error('Failed to create session:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/conversation/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    await ConversationManager.endSession(sessionId);
    logger.info(`Session ended: ${sessionId}`);
    
    res.json({ 
      status: 'ended',
      sessionId
    });
  } catch (error) {
    logger.error('Failed to end session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test emotion analysis endpoint
app.post('/api/emotion/test', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }
    
    const emotion = await EmotionAnalyzer.analyze(text);
    res.json(emotion);
  } catch (error) {
    logger.error('Emotion analysis failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket Server
const wss = new WebSocket.Server({ 
  server,
  path: '/ws',
  perMessageDeflate: false
});

const wsHandler = new WebSocketHandler();

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  logger.info(`🔗 New WebSocket connection from ${clientIp}`);
  
  wsHandler.handleConnection(ws, req);
});

wss.on('error', (error) => {
  logger.error('WebSocket server error:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    wss.close(() => {
      logger.info('WebSocket server closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    wss.close(() => {
      logger.info('WebSocket server closed');
      process.exit(0);
    });
  });
});

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 Conversational AI Service running on port ${PORT}`);
  logger.info(`🎯 WebSocket endpoint: ws://localhost:${PORT}/ws`);
  logger.info(`🔗 HTTP API: http://localhost:${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  
  // Log environment info
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`ElevenLabs API Key: ${process.env.ELEVENLABS_API_KEY ? 'Set' : 'Not set'}`);
  logger.info(`Emotion Backend: ${process.env.EMOTION_BACKEND_URL || 'http://localhost:5001'}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = { app, server, wss };