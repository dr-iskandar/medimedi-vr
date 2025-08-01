const { Logger } = require('../utils/logger');

class WebSocketEvents {
  constructor() {
    this.logger = new Logger();
    this.eventHandlers = new Map();
    this.setupDefaultHandlers();
  }

  setupDefaultHandlers() {
    // Connection events
    this.on('connection_established', (data) => {
      this.logger.info(`Connection established: ${data.connectionId}`);
    });

    this.on('connection_lost', (data) => {
      this.logger.warn(`Connection lost: ${data.connectionId}`);
    });

    // Conversation events
    this.on('conversation_started', (data) => {
      this.logger.success(`Conversation started: ${data.sessionId} with agent: ${data.agentId}`);
    });

    this.on('conversation_ended', (data) => {
      this.logger.info(`Conversation ended: ${data.sessionId}`);
    });

    // Audio events
    this.on('audio_received', (data) => {
      this.logger.debug(`Audio received for session: ${data.sessionId}, duration: ${data.duration}ms`);
    });

    this.on('audio_sent', (data) => {
      this.logger.debug(`Audio sent for session: ${data.sessionId}, size: ${data.size} bytes`);
    });

    // Error events
    this.on('error_occurred', (data) => {
      this.logger.error(`Error in session ${data.sessionId}: ${data.error}`);
    });

    // Emotion events
    this.on('emotion_detected', (data) => {
      this.logger.debug(`Emotion detected: ${data.emotion} (confidence: ${data.confidence}) for session: ${data.sessionId}`);
    });
  }

  // Register event handler
  on(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName).push(handler);
  }

  // Remove event handler
  off(eventName, handler) {
    if (this.eventHandlers.has(eventName)) {
      const handlers = this.eventHandlers.get(eventName);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Emit event
  emit(eventName, data = {}) {
    if (this.eventHandlers.has(eventName)) {
      const handlers = this.eventHandlers.get(eventName);
      handlers.forEach(handler => {
        try {
          handler({
            ...data,
            eventName,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          this.logger.error(`Error in event handler for ${eventName}:`, error);
        }
      });
    }
  }

  // Get all registered events
  getRegisteredEvents() {
    return Array.from(this.eventHandlers.keys());
  }

  // Get handler count for an event
  getHandlerCount(eventName) {
    return this.eventHandlers.has(eventName) ? this.eventHandlers.get(eventName).length : 0;
  }

  // Clear all handlers for an event
  clearHandlers(eventName) {
    if (this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
  }

  // Clear all handlers
  clearAllHandlers() {
    this.eventHandlers.clear();
    this.setupDefaultHandlers();
  }
}

// Create singleton instance
const webSocketEvents = new WebSocketEvents();

module.exports = { WebSocketEvents: webSocketEvents };