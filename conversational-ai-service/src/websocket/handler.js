const { ConversationManager } = require('../elevenlabs/conversation');
const { EmotionAnalyzer } = require('../emotion/analyzer');
const { AudioProcessor } = require('../elevenlabs/audio');
const { Logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class WebSocketHandler {
  constructor() {
    this.logger = new Logger();
    this.audioProcessor = new AudioProcessor();
    this.emotionAnalyzer = new EmotionAnalyzer();
    this.connections = new Map();
  }

  handleConnection(ws, req) {
    const connectionId = uuidv4();
    const clientIP = req.socket.remoteAddress;
    
    this.logger.info(`New WebSocket connection: ${connectionId} from ${clientIP}`);
    
    // Store connection info
    this.connections.set(connectionId, {
      ws,
      sessionId: null,
      agentId: null,
      connectedAt: new Date(),
      lastActivity: new Date()
    });

    // Send welcome message
    this.sendMessage(ws, {
      type: 'connection',
      status: 'connected',
      connectionId,
      timestamp: new Date().toISOString()
    });

    // Set up message handler
    ws.on('message', async (data) => {
      try {
        await this.handleMessage(connectionId, data);
      } catch (error) {
        this.logger.error(`Error handling message for connection ${connectionId}:`, error);
        this.sendError(ws, 'MESSAGE_PROCESSING_ERROR', error.message);
      }
    });

    // Handle connection close
    ws.on('close', () => {
      this.handleDisconnection(connectionId);
    });

    // Handle connection error
    ws.on('error', (error) => {
      this.logger.error(`WebSocket error for connection ${connectionId}:`, error);
      this.handleDisconnection(connectionId);
    });
  }

  async handleMessage(connectionId, data) {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    connection.lastActivity = new Date();
    
    let message;
    try {
      message = JSON.parse(data.toString());
    } catch (error) {
      throw new Error('Invalid JSON message');
    }

    this.logger.debug(`Received message type: ${message.type} from connection: ${connectionId}`);

    switch (message.type) {
      case 'start_conversation':
        await this.handleStartConversation(connectionId, message);
        break;
        
      case 'end_conversation':
        await this.handleEndConversation(connectionId, message);
        break;
        
      case 'audio_input':
        await this.handleAudioInput(connectionId, message);
        break;
        
      case 'text_input':
        await this.handleTextInput(connectionId, message);
        break;
        
      case 'ping':
        this.handlePing(connectionId);
        break;
        
      default:
        throw new Error(`Unknown message type: ${message.type}`);
    }
  }

  async handleStartConversation(connectionId, message) {
    const connection = this.connections.get(connectionId);
    const { agentId, sessionId = uuidv4(), options = {} } = message;

    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    try {
      // Start conversation with ElevenLabs
      const conversation = await ConversationManager.startConversation(agentId, sessionId, options);
      
      // Update connection info
      connection.sessionId = sessionId;
      connection.agentId = agentId;
      
      // Send success response
      this.sendMessage(connection.ws, {
        type: 'conversation_started',
        sessionId,
        agentId,
        timestamp: new Date().toISOString()
      });
      
      this.logger.success(`Conversation started for connection ${connectionId}, session: ${sessionId}`);
    } catch (error) {
      this.sendError(connection.ws, 'CONVERSATION_START_ERROR', error.message);
      throw error;
    }
  }

  async handleEndConversation(connectionId, message) {
    const connection = this.connections.get(connectionId);
    const sessionId = message.sessionId || connection.sessionId;

    if (!sessionId) {
      throw new Error('No active session to end');
    }

    try {
      await ConversationManager.endConversation(sessionId);
      
      // Clear session info
      connection.sessionId = null;
      connection.agentId = null;
      
      this.sendMessage(connection.ws, {
        type: 'conversation_ended',
        sessionId,
        timestamp: new Date().toISOString()
      });
      
      this.logger.info(`Conversation ended for connection ${connectionId}, session: ${sessionId}`);
    } catch (error) {
      this.sendError(connection.ws, 'CONVERSATION_END_ERROR', error.message);
      throw error;
    }
  }

  async handleAudioInput(connectionId, message) {
    const connection = this.connections.get(connectionId);
    const { audioData, format = 'wav' } = message;

    if (!connection.sessionId) {
      throw new Error('No active conversation session');
    }

    try {
      // Process audio input
      const processedAudio = this.audioProcessor.processAudioInput(
        this.audioProcessor.base64ToBuffer(audioData),
        format
      );
      
      // Send to ElevenLabs (this would be implemented based on their streaming API)
      // For now, we'll simulate the response
      
      // Update session activity
      ConversationManager.updateSessionActivity(connection.sessionId);
      
      this.logger.debug(`Processed audio input for session: ${connection.sessionId}`);
      
      // Send acknowledgment
      this.sendMessage(connection.ws, {
        type: 'audio_received',
        sessionId: connection.sessionId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      this.sendError(connection.ws, 'AUDIO_PROCESSING_ERROR', error.message);
      throw error;
    }
  }

  async handleTextInput(connectionId, message) {
    const connection = this.connections.get(connectionId);
    const { text } = message;

    if (!connection.sessionId) {
      throw new Error('No active conversation session');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text input cannot be empty');
    }

    try {
      // Analyze emotion of the input text
      const emotionResult = await this.emotionAnalyzer.analyzeEmotion(text);
      
      // Update session activity
      ConversationManager.updateSessionActivity(connection.sessionId);
      
      // Send response with emotion analysis
      this.sendMessage(connection.ws, {
        type: 'text_processed',
        sessionId: connection.sessionId,
        originalText: text,
        emotion: emotionResult,
        timestamp: new Date().toISOString()
      });
      
      this.logger.debug(`Processed text input for session: ${connection.sessionId}`);
      
    } catch (error) {
      this.sendError(connection.ws, 'TEXT_PROCESSING_ERROR', error.message);
      throw error;
    }
  }

  handlePing(connectionId) {
    const connection = this.connections.get(connectionId);
    this.sendMessage(connection.ws, {
      type: 'pong',
      timestamp: new Date().toISOString()
    });
  }

  handleDisconnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    this.logger.info(`WebSocket disconnected: ${connectionId}`);
    
    // Clean up active session if exists
    if (connection.sessionId) {
      ConversationManager.endConversation(connection.sessionId)
        .catch(error => {
          this.logger.error(`Error ending session ${connection.sessionId} on disconnect:`, error);
        });
    }
    
    this.connections.delete(connectionId);
  }

  sendMessage(ws, message) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  sendError(ws, errorCode, errorMessage) {
    this.sendMessage(ws, {
      type: 'error',
      error: {
        code: errorCode,
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    });
  }

  // Broadcast message to all connections
  broadcast(message) {
    for (const [connectionId, connection] of this.connections.entries()) {
      try {
        this.sendMessage(connection.ws, message);
      } catch (error) {
        this.logger.error(`Error broadcasting to connection ${connectionId}:`, error);
      }
    }
  }

  // Get connection statistics
  getStats() {
    return {
      totalConnections: this.connections.size,
      activeSessions: Array.from(this.connections.values())
        .filter(conn => conn.sessionId).length,
      connections: Array.from(this.connections.entries()).map(([id, conn]) => ({
        connectionId: id,
        sessionId: conn.sessionId,
        agentId: conn.agentId,
        connectedAt: conn.connectedAt,
        lastActivity: conn.lastActivity
      }))
    };
  }
}

module.exports = { WebSocketHandler };