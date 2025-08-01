const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');
const { Logger } = require('../utils/logger');

class ConversationManager {
  constructor() {
    this.logger = new Logger();
    this.activeSessions = new Map();
    this.client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY
    });
  }

  getActiveSessionCount() {
    return this.activeSessions ? this.activeSessions.size : 0;
  }

  async startConversation(agentId, sessionId, options = {}) {
    try {
      this.logger.info(`Starting conversation for session: ${sessionId}`);
      
      const conversationConfig = {
        agent_id: agentId,
        ...options
      };

      // Create conversation session
      const conversation = await this.client.conversationalAI.createConversation(conversationConfig);
      
      this.activeSessions.set(sessionId, {
        conversation,
        agentId,
        startTime: new Date(),
        lastActivity: new Date()
      });

      this.logger.success(`Conversation started successfully for session: ${sessionId}`);
      return conversation;
    } catch (error) {
      this.logger.error(`Failed to start conversation for session ${sessionId}:`, error);
      throw error;
    }
  }

  async endConversation(sessionId) {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // End the conversation
      if (session.conversation && session.conversation.end) {
        await session.conversation.end();
      }

      this.activeSessions.delete(sessionId);
      this.logger.info(`Conversation ended for session: ${sessionId}`);
      
      return { success: true, sessionId };
    } catch (error) {
      this.logger.error(`Failed to end conversation for session ${sessionId}:`, error);
      throw error;
    }
  }

  getSession(sessionId) {
    return this.activeSessions.get(sessionId);
  }

  updateSessionActivity(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  getAllSessions() {
    return Array.from(this.activeSessions.entries()).map(([id, session]) => ({
      sessionId: id,
      agentId: session.agentId,
      startTime: session.startTime,
      lastActivity: session.lastActivity
    }));
  }

  // Clean up inactive sessions (older than 1 hour)
  cleanupInactiveSessions() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.lastActivity < oneHourAgo) {
        this.logger.warn(`Cleaning up inactive session: ${sessionId}`);
        this.endConversation(sessionId).catch(err => {
          this.logger.error(`Error cleaning up session ${sessionId}:`, err);
        });
      }
    }
  }
}

// Create singleton instance
const conversationManager = new ConversationManager();

// Set up cleanup interval (every 30 minutes)
setInterval(() => {
  conversationManager.cleanupInactiveSessions();
}, 30 * 60 * 1000);

module.exports = { ConversationManager: conversationManager };