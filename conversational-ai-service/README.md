# Conversational AI Service for Unity

Service wrapper yang memungkinkan Unity untuk melakukan streaming percakapan langsung dengan avatar menggunakan ElevenLabs Conversational AI tanpa memerlukan SDK ElevenLabs di Unity.

## 🚀 Features

- **Real-time WebSocket Communication** - Komunikasi real-time antara Unity dan ElevenLabs
- **Audio Streaming** - Streaming audio bidirectional untuk percakapan natural
- **Emotion Analysis Integration** - Analisis emosi real-time untuk kontrol avatar
- **Session Management** - Manajemen sesi percakapan yang robust
- **No Unity SDK Required** - Unity tidak perlu menginstall SDK ElevenLabs
- **Cross-platform Support** - Dapat digunakan di berbagai platform Unity

## 📋 Prerequisites

- Node.js 16+ 
- ElevenLabs API Key
- Emotion Analysis Backend (sudah tersedia di project ini)

## 🛠️ Installation

1. **Clone dan setup project:**
```bash
cd conversational-ai-service
npm install
```

2. **Setup environment variables:**
```bash
cp .env.example .env
```

3. **Edit file `.env` dengan konfigurasi Anda:**
```env
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_AGENT_ID=your_agent_id_here
EMOTION_BACKEND_URL=http://localhost:5001
PORT=3001
```

## 🚀 Running the Service

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Service akan berjalan di `http://localhost:3001`

## 📡 API Endpoints

### HTTP Endpoints

#### Health Check
```
GET /health
```
Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "conversational-ai-service",
  "version": "1.0.0"
}
```

#### Service Status
```
GET /api/status
```
Response:
```json
{
  "activeSessions": 2,
  "uptime": 3600,
  "memory": {...},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Start Conversation
```
POST /api/conversation/start
```
Body:
```json
{
  "agentId": "agent_01k0rh29kxebks7s0stwrszcfe",
  "sessionId": "optional-custom-session-id",
  "options": {
    "language": "en",
    "voice": "default"
  }
}
```

#### End Conversation
```
DELETE /api/conversation/:sessionId
```

### WebSocket Connection

**Endpoint:** `ws://localhost:3001/ws`

#### Message Types

##### 1. Start Conversation
```json
{
  "type": "start_conversation",
  "agentId": "agent_01k0rh29kxebks7s0stwrszcfe",
  "sessionId": "optional-session-id",
  "options": {}
}
```

##### 2. Audio Input
```json
{
  "type": "audio_input",
  "audioData": "base64-encoded-audio",
  "format": "wav"
}
```

##### 3. Text Input
```json
{
  "type": "text_input",
  "text": "Hello, how are you?"
}
```

##### 4. End Conversation
```json
{
  "type": "end_conversation",
  "sessionId": "session-id"
}
```

##### 5. Ping
```json
{
  "type": "ping"
}
```

#### Response Messages

##### Connection Established
```json
{
  "type": "connection",
  "status": "connected",
  "connectionId": "uuid",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

##### Conversation Started
```json
{
  "type": "conversation_started",
  "sessionId": "session-id",
  "agentId": "agent-id",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

##### Text Processed with Emotion
```json
{
  "type": "text_processed",
  "sessionId": "session-id",
  "originalText": "Hello",
  "emotion": {
    "emotion": "senang",
    "confidence": 0.85,
    "emoticon": "😊"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

##### Error Response
```json
{
  "type": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🎮 Unity Integration

### Unity WebSocket Client Example

```csharp
using System;
using System.Text;
using UnityEngine;
using WebSocketSharp;
using Newtonsoft.Json;

public class ConversationalAIClient : MonoBehaviour
{
    private WebSocket ws;
    private string serviceUrl = "ws://localhost:3001/ws";
    private string currentSessionId;
    
    [Header("Configuration")]
    public string agentId = "agent_01k0rh29kxebks7s0stwrszcfe";
    
    [Header("Events")]
    public UnityEvent<EmotionData> OnEmotionDetected;
    public UnityEvent<string> OnAudioReceived;
    public UnityEvent OnConversationStarted;
    public UnityEvent OnConversationEnded;
    
    void Start()
    {
        ConnectToService();
    }
    
    void ConnectToService()
    {
        ws = new WebSocket(serviceUrl);
        
        ws.OnOpen += (sender, e) => {
            Debug.Log("Connected to Conversational AI Service");
        };
        
        ws.OnMessage += (sender, e) => {
            HandleMessage(e.Data);
        };
        
        ws.OnError += (sender, e) => {
            Debug.LogError($"WebSocket Error: {e.Message}");
        };
        
        ws.OnClose += (sender, e) => {
            Debug.Log("Disconnected from service");
        };
        
        ws.Connect();
    }
    
    public void StartConversation()
    {
        var message = new {
            type = "start_conversation",
            agentId = agentId
        };
        
        SendMessage(message);
    }
    
    public void SendText(string text)
    {
        var message = new {
            type = "text_input",
            text = text
        };
        
        SendMessage(message);
    }
    
    public void SendAudio(byte[] audioData)
    {
        string base64Audio = Convert.ToBase64String(audioData);
        var message = new {
            type = "audio_input",
            audioData = base64Audio,
            format = "wav"
        };
        
        SendMessage(message);
    }
    
    public void EndConversation()
    {
        var message = new {
            type = "end_conversation",
            sessionId = currentSessionId
        };
        
        SendMessage(message);
    }
    
    private void SendMessage(object message)
    {
        if (ws != null && ws.ReadyState == WebSocketState.Open)
        {
            string json = JsonConvert.SerializeObject(message);
            ws.Send(json);
        }
    }
    
    private void HandleMessage(string data)
    {
        try {
            var response = JsonConvert.DeserializeObject<dynamic>(data);
            string messageType = response.type;
            
            switch (messageType)
            {
                case "conversation_started":
                    currentSessionId = response.sessionId;
                    OnConversationStarted?.Invoke();
                    break;
                    
                case "text_processed":
                    if (response.emotion != null)
                    {
                        var emotionData = JsonConvert.DeserializeObject<EmotionData>(response.emotion.ToString());
                        OnEmotionDetected?.Invoke(emotionData);
                    }
                    break;
                    
                case "conversation_ended":
                    currentSessionId = null;
                    OnConversationEnded?.Invoke();
                    break;
                    
                case "error":
                    Debug.LogError($"Service Error: {response.error.message}");
                    break;
            }
        }
        catch (Exception e) {
            Debug.LogError($"Error parsing message: {e.Message}");
        }
    }
    
    void OnDestroy()
    {
        if (ws != null)
        {
            ws.Close();
        }
    }
}

[Serializable]
public class EmotionData
{
    public string emotion;
    public float confidence;
    public string emoticon;
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|----------|
| `ELEVENLABS_API_KEY` | ElevenLabs API Key | Required |
| `ELEVENLABS_AGENT_ID` | Default Agent ID | Required |
| `PORT` | Service port | 3001 |
| `EMOTION_BACKEND_URL` | Emotion analysis backend URL | http://localhost:5001 |
| `WS_MAX_CONNECTIONS` | Max WebSocket connections | 100 |
| `SESSION_TIMEOUT` | Session timeout (ms) | 3600000 |

## 📊 Monitoring

### Logs
Service menggunakan structured logging dengan level:
- `info` - Informasi umum
- `warn` - Peringatan
- `error` - Error
- `debug` - Debug information
- `success` - Operasi berhasil

### Health Checks
- HTTP health endpoint: `GET /health`
- WebSocket ping/pong untuk connection health
- Automatic session cleanup untuk inactive sessions

## 🚨 Error Handling

### Common Error Codes
- `CONVERSATION_START_ERROR` - Gagal memulai percakapan
- `CONVERSATION_END_ERROR` - Gagal mengakhiri percakapan
- `AUDIO_PROCESSING_ERROR` - Error processing audio
- `TEXT_PROCESSING_ERROR` - Error processing text
- `MESSAGE_PROCESSING_ERROR` - Error parsing message

## 🔒 Security

- CORS configuration untuk production
- Rate limiting untuk API endpoints
- Input validation untuk semua messages
- Session timeout untuk security

## 📈 Performance

- Connection pooling untuk WebSocket
- Audio buffer optimization
- Automatic cleanup untuk inactive sessions
- Memory usage monitoring

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details