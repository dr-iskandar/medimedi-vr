const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// ElevenLabs API Configuration
const ELEVENLABS_API_KEY = 'sk_6ca48be267c92868c6b9d8cb1682d5ffca0f1457724f97b4';
const AGENT_ID = 'agent_01k0rh29kxebks7s0stwrszcfe';
const BASE_URL = 'https://api.elevenlabs.io/v1/convai';

// Headers for ElevenLabs API
const headers = {
  'xi-api-key': ELEVENLABS_API_KEY,
  'Content-Type': 'application/json'
};

/**
 * Get conversation summary from ElevenLabs API
 * @route GET /api/conversation-summary
 * @returns {Object} Analysis data from the latest conversation
 */
app.get('/api/conversation-summary', async (req, res) => {
  try {
    console.log('Fetching conversations list...');
    
    // Step 1: Get list of conversations
    const conversationsResponse = await axios.get(
      `${BASE_URL}/conversations`,
      {
        headers,
        params: {
          agent_id: AGENT_ID
        }
      }
    );

    const conversations = conversationsResponse.data.conversations;
    
    if (!conversations || conversations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No conversations found for this agent'
      });
    }

    // Step 2: Get the latest conversation (first in the list)
    const latestConversation = conversations[0];
    const conversationId = latestConversation.conversation_id;
    
    console.log(`Fetching conversation details for ID: ${conversationId}`);

    // Step 3: Get detailed conversation data
    const conversationDetailResponse = await axios.get(
      `${BASE_URL}/conversations/${conversationId}`,
      { headers }
    );

    const conversationDetail = conversationDetailResponse.data;
    
    // Step 4: Extract analysis data
    const analysis = conversationDetail.analysis;
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'No analysis data found for this conversation'
      });
    }

    // Extract required analysis fields
    const result = {
      success: true,
      conversation_id: conversationId,
      conversation_info: {
        agent_name: latestConversation.agent_name,
        start_time: latestConversation.start_time_unix_secs,
        duration_secs: latestConversation.call_duration_secs,
        status: latestConversation.status,
        call_successful: latestConversation.call_successful,
        call_summary_title: latestConversation.call_summary_title
      },
      analysis: {
        call_successful: analysis.call_successful,
        transcript_summary: analysis.transcript_summary,
        evaluation_criteria_results: analysis.evaluation_criteria_results,
        data_collection_results: {
          emosi_awal: {
            value: analysis.data_collection_results?.['emosi awal']?.value || null,
            rationale: analysis.data_collection_results?.['emosi awal']?.rationale || null
          },
          emosi_akhir: {
            value: analysis.data_collection_results?.['emosi akhir']?.value || null,
            rationale: analysis.data_collection_results?.['emosi akhir']?.rationale || null
          }
        }
      }
    };

    res.json(result);

  } catch (error) {
    console.error('Error fetching conversation summary:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: 'ElevenLabs API Error',
        error: error.response.data
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Get all conversations list
 * @route GET /api/conversations
 * @returns {Object} List of all conversations
 */
app.get('/api/conversations', async (req, res) => {
  try {
    const conversationsResponse = await axios.get(
      `${BASE_URL}/conversations`,
      {
        headers,
        params: {
          agent_id: AGENT_ID
        }
      }
    );

    res.json({
      success: true,
      data: conversationsResponse.data
    });

  } catch (error) {
    console.error('Error fetching conversations:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: 'ElevenLabs API Error',
        error: error.response.data
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Get specific conversation detail
 * @route GET /api/conversation/:id
 * @param {string} id - Conversation ID
 * @returns {Object} Detailed conversation data
 */
app.get('/api/conversation/:id', async (req, res) => {
  try {
    const conversationId = req.params.id;
    
    const conversationDetailResponse = await axios.get(
      `${BASE_URL}/conversations/${conversationId}`,
      { headers }
    );

    res.json({
      success: true,
      data: conversationDetailResponse.data
    });

  } catch (error) {
    console.error('Error fetching conversation detail:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: 'ElevenLabs API Error',
        error: error.response.data
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Conversation Summary API is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Conversation Summary API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Conversation Summary: http://localhost:${PORT}/api/conversation-summary`);
});

module.exports = app;