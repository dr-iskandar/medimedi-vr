const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:3002';
const ELEVENLABS_API_KEY = 'sk_6ca48be267c92868c6b9d8cb1682d5ffca0f1457724f97b4';
const AGENT_ID = 'agent_01k0rh29kxebks7s0stwrszcfe';

/**
 * Test the conversation summary API
 */
async function testConversationSummaryAPI() {
  console.log('🧪 Testing Conversation Summary API...');
  console.log('=' .repeat(50));

  try {
    // Test 1: Health Check
    console.log('\n1. Testing Health Check...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data.message);

    // Test 2: Get Conversation Summary
    console.log('\n2. Testing Conversation Summary...');
    const summaryResponse = await axios.get(`${API_BASE_URL}/api/conversation-summary`);
    
    if (summaryResponse.data.success) {
      console.log('✅ Conversation Summary Retrieved Successfully');
      console.log('📊 Analysis Data:');
      console.log('   - Conversation ID:', summaryResponse.data.conversation_id);
      console.log('   - Agent Name:', summaryResponse.data.conversation_info.agent_name);
      console.log('   - Call Successful:', summaryResponse.data.analysis.call_successful);
      console.log('   - Transcript Summary:', summaryResponse.data.analysis.transcript_summary);
      
      // Display emotion analysis
      const emotions = summaryResponse.data.analysis.data_collection_results;
      console.log('\n🎭 Emotion Analysis:');
      console.log('   - Emosi Awal:', emotions.emosi_awal.value || 'N/A');
      console.log('   - Emosi Akhir:', emotions.emosi_akhir.value || 'N/A');
      
      // Display evaluation criteria
      const evaluation = summaryResponse.data.analysis.evaluation_criteria_results;
      if (evaluation) {
        console.log('\n📋 Evaluation Results:');
        Object.keys(evaluation).forEach(key => {
          console.log(`   - ${key}: ${evaluation[key].result}`);
        });
      }
    } else {
      console.log('❌ Failed to get conversation summary:', summaryResponse.data.message);
    }

    // Test 3: Get All Conversations
    console.log('\n3. Testing Get All Conversations...');
    const conversationsResponse = await axios.get(`${API_BASE_URL}/api/conversations`);
    
    if (conversationsResponse.data.success) {
      const conversations = conversationsResponse.data.data.conversations;
      console.log(`✅ Retrieved ${conversations.length} conversations`);
      
      if (conversations.length > 0) {
        console.log('📝 Latest Conversation:');
        const latest = conversations[0];
        console.log('   - ID:', latest.conversation_id);
        console.log('   - Title:', latest.call_summary_title);
        console.log('   - Duration:', latest.call_duration_secs, 'seconds');
        console.log('   - Status:', latest.status);
      }
    } else {
      console.log('❌ Failed to get conversations:', conversationsResponse.data.message);
    }

    // Test 4: Get Specific Conversation Detail
    if (summaryResponse.data.success) {
      console.log('\n4. Testing Get Specific Conversation Detail...');
      const conversationId = summaryResponse.data.conversation_id;
      const detailResponse = await axios.get(`${API_BASE_URL}/api/conversation/${conversationId}`);
      
      if (detailResponse.data.success) {
        console.log('✅ Conversation detail retrieved successfully');
        console.log('   - Has transcript:', detailResponse.data.data.transcript ? 'Yes' : 'No');
        console.log('   - Has analysis:', detailResponse.data.data.analysis ? 'Yes' : 'No');
        console.log('   - Has audio:', detailResponse.data.data.has_audio ? 'Yes' : 'No');
      } else {
        console.log('❌ Failed to get conversation detail:', detailResponse.data.message);
      }
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the API server is running:');
      console.log('   npm start');
      console.log('   or');
      console.log('   node conversation-summary-api.js');
    }
  }
}

/**
 * Test direct ElevenLabs API connection
 */
async function testDirectElevenLabsAPI() {
  console.log('\n🔗 Testing Direct ElevenLabs API Connection...');
  console.log('=' .repeat(50));

  try {
    // Test ElevenLabs API directly
    const response = await axios.get(
      'https://api.elevenlabs.io/v1/convai/conversations',
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        params: {
          agent_id: AGENT_ID
        }
      }
    );

    console.log('✅ ElevenLabs API connection successful');
    console.log('📊 Response:');
    console.log('   - Total conversations:', response.data.conversations?.length || 0);
    
    if (response.data.conversations && response.data.conversations.length > 0) {
      const latest = response.data.conversations[0];
      console.log('   - Latest conversation ID:', latest.conversation_id);
      console.log('   - Agent name:', latest.agent_name);
    }

  } catch (error) {
    console.error('❌ ElevenLabs API test failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting Conversation Summary API Tests');
  console.log('Time:', new Date().toISOString());
  
  // Test direct API connection first
  await testDirectElevenLabsAPI();
  
  // Wait a bit before testing our API
  console.log('\n⏳ Waiting 2 seconds before testing our API...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test our API
  await testConversationSummaryAPI();
}

// Execute tests
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testConversationSummaryAPI,
  testDirectElevenLabsAPI,
  runAllTests
};