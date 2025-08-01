# Emotion Analysis API Documentation for Unity

## Overview
Emotion Analysis Backend adalah service REST API yang dapat menganalisis emosi dari teks menggunakan pendekatan lexicon-based NLP. API ini dapat diakses dari Unity untuk mengintegrasikan analisis emosi real-time dalam aplikasi VR/AR atau game.

## Base URL
```
http://medimedi.dickyri.net:5001
```

## Endpoints

### 1. Analyze Emotion
**Endpoint:** `POST /api/emotion/analyze`

**Description:** Menganalisis emosi dari teks yang diberikan

**Request Body:**
```json
{
  "text": "Saya sangat senang hari ini!"
}
```

**Response:**
```json
{
  "emotion": "senang",
  "confidence": 0.3,
  "emoticon": "😊",
  "matches": ["senang"],
  "all_scores": {
    "netral": 0.3,
    "senang": 0.9
  },
  "method": "nlp_lexicon",
  "text_length": 28,
  "processed_text": "saya sangat senang hari ini!"
}
```

### 2. Get Supported Emotions
**Endpoint:** `GET /api/emotion/emotions`

**Description:** Mendapatkan daftar emosi yang didukung oleh sistem

**Response:**
```json
{
  "supported_emotions": [
    "marah", "sedih", "cemas", "agresif", 
    "defensif", "penyesalan", "kesal", "senang", "netral"
  ],
  "emotion_details": {
    "marah": {
      "keyword_count": 29,
      "pattern_count": 7,
      "weight": 1.0,
      "sample_keywords": ["marah", "kesal", "geram", "murka", "berang"]
    }
  },
  "total_keywords": 194,
  "method": "nlp_lexicon"
}
```

### 3. Test Endpoint
**Endpoint:** `GET /api/emotion/test`

**Description:** Menguji sistem dengan contoh teks untuk berbagai emosi

## Unity Integration

### Prerequisites
1. Unity 2020.3 atau lebih baru
2. Emotion Analysis Backend berjalan di `http://medimedi.dickyri.net:5001`
3. Package `Newtonsoft.Json` untuk Unity (dapat diinstall via Package Manager)

### C# Script untuk Unity

```csharp
using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;
using Newtonsoft.Json;

[Serializable]
public class EmotionRequest
{
    public string text;
}

[Serializable]
public class EmotionResponse
{
    public string emotion;
    public float confidence;
    public string emoticon;
    public string[] matches;
    public string method;
    public int text_length;
    public string processed_text;
}

[Serializable]
public class EmotionScores
{
    public float netral;
    public float senang;
    public float marah;
    public float sedih;
    public float cemas;
    public float agresif;
    public float defensif;
    public float penyesalan;
    public float kesal;
}

public class EmotionAnalyzer : MonoBehaviour
{
    private const string BASE_URL = "http://medimedi.dickyri.net:5001";
    
    [Header("Emotion Analysis Settings")]
    public bool debugMode = true;
    
    // Events
    public System.Action<EmotionResponse> OnEmotionAnalyzed;
    public System.Action<string> OnAnalysisError;
    
    /// <summary>
    /// Menganalisis emosi dari teks
    /// </summary>
    /// <param name="text">Teks yang akan dianalisis</param>
    public void AnalyzeEmotion(string text)
    {
        if (string.IsNullOrEmpty(text))
        {
            if (debugMode) Debug.LogWarning("Text is empty or null");
            OnAnalysisError?.Invoke("Text cannot be empty");
            return;
        }
        
        StartCoroutine(AnalyzeEmotionCoroutine(text));
    }
    
    private IEnumerator AnalyzeEmotionCoroutine(string text)
    {
        // Prepare request
        EmotionRequest request = new EmotionRequest { text = text };
        string jsonData = JsonConvert.SerializeObject(request);
        byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
        
        // Create UnityWebRequest
        using (UnityWebRequest www = new UnityWebRequest($"{BASE_URL}/api/emotion/analyze", "POST"))
        {
            www.uploadHandler = new UploadHandlerRaw(bodyRaw);
            www.downloadHandler = new DownloadHandlerBuffer();
            www.SetRequestHeader("Content-Type", "application/json");
            
            if (debugMode) Debug.Log($"Sending emotion analysis request for: {text}");
            
            yield return www.SendWebRequest();
            
            if (www.result == UnityWebRequest.Result.Success)
            {
                try
                {
                    string responseText = www.downloadHandler.text;
                    EmotionResponse response = JsonConvert.DeserializeObject<EmotionResponse>(responseText);
                    
                    if (debugMode)
                    {
                        Debug.Log($"Emotion Analysis Result: {response.emotion} (confidence: {response.confidence:F2})");
                    }
                    
                    OnEmotionAnalyzed?.Invoke(response);
                }
                catch (Exception e)
                {
                    if (debugMode) Debug.LogError($"Failed to parse response: {e.Message}");
                    OnAnalysisError?.Invoke($"Parse error: {e.Message}");
                }
            }
            else
            {
                string error = $"Request failed: {www.error} (Code: {www.responseCode})";
                if (debugMode) Debug.LogError(error);
                OnAnalysisError?.Invoke(error);
            }
        }
    }
    
    /// <summary>
    /// Mendapatkan daftar emosi yang didukung
    /// </summary>
    public void GetSupportedEmotions()
    {
        StartCoroutine(GetSupportedEmotionsCoroutine());
    }
    
    private IEnumerator GetSupportedEmotionsCoroutine()
    {
        using (UnityWebRequest www = UnityWebRequest.Get($"{BASE_URL}/api/emotion/emotions"))
        {
            yield return www.SendWebRequest();
            
            if (www.result == UnityWebRequest.Result.Success)
            {
                if (debugMode) Debug.Log($"Supported emotions: {www.downloadHandler.text}");
            }
            else
            {
                if (debugMode) Debug.LogError($"Failed to get emotions: {www.error}");
            }
        }
    }
    
    /// <summary>
    /// Test koneksi ke API
    /// </summary>
    public void TestConnection()
    {
        StartCoroutine(TestConnectionCoroutine());
    }
    
    private IEnumerator TestConnectionCoroutine()
    {
        using (UnityWebRequest www = UnityWebRequest.Get($"{BASE_URL}/api/emotion/test"))
        {
            yield return www.SendWebRequest();
            
            if (www.result == UnityWebRequest.Result.Success)
            {
                if (debugMode) Debug.Log("API connection successful!");
                if (debugMode) Debug.Log($"Test results: {www.downloadHandler.text}");
            }
            else
            {
                if (debugMode) Debug.LogError($"API connection failed: {www.error}");
            }
        }
    }
}
```

### Contoh Penggunaan dalam Unity

```csharp
public class EmotionDemo : MonoBehaviour
{
    [Header("UI References")]
    public TMPro.TMP_InputField inputField;
    public TMPro.TMP_Text resultText;
    public Button analyzeButton;
    
    private EmotionAnalyzer emotionAnalyzer;
    
    void Start()
    {
        // Get atau tambahkan EmotionAnalyzer component
        emotionAnalyzer = GetComponent<EmotionAnalyzer>();
        if (emotionAnalyzer == null)
        {
            emotionAnalyzer = gameObject.AddComponent<EmotionAnalyzer>();
        }
        
        // Subscribe ke events
        emotionAnalyzer.OnEmotionAnalyzed += OnEmotionResult;
        emotionAnalyzer.OnAnalysisError += OnEmotionError;
        
        // Setup UI
        analyzeButton.onClick.AddListener(AnalyzeText);
        
        // Test koneksi saat start
        emotionAnalyzer.TestConnection();
    }
    
    void AnalyzeText()
    {
        string text = inputField.text;
        if (!string.IsNullOrEmpty(text))
        {
            emotionAnalyzer.AnalyzeEmotion(text);
            resultText.text = "Analyzing...";
        }
    }
    
    void OnEmotionResult(EmotionResponse response)
    {
        resultText.text = $"Emotion: {response.emotion} {response.emoticon}\n" +
                         $"Confidence: {response.confidence:F2}\n" +
                         $"Matches: {string.Join(", ", response.matches)}";
    }
    
    void OnEmotionError(string error)
    {
        resultText.text = $"Error: {error}";
    }
    
    void OnDestroy()
    {
        if (emotionAnalyzer != null)
        {
            emotionAnalyzer.OnEmotionAnalyzed -= OnEmotionResult;
            emotionAnalyzer.OnAnalysisError -= OnEmotionError;
        }
    }
}
```

## Supported Emotions

API mendukung 9 kategori emosi:

1. **marah** - Kemarahan, kesal, geram (😡)
2. **sedih** - Kesedihan, kecewa, galau (😢)
3. **cemas** - Kecemasan, khawatir, takut (😰)
4. **agresif** - Agresivitas, kekerasan (😤)
5. **defensif** - Sikap defensif, menyalahkan (🛡️)
6. **penyesalan** - Penyesalan, permintaan maaf (😔)
7. **kesal** - Kesal, bete, frustrasi (😠)
8. **senang** - Kebahagiaan, kegembiraan (😊)
9. **netral** - Emosi netral (😐)

## Error Handling

### Common Error Codes:
- **400**: Bad Request - Text parameter missing atau invalid
- **500**: Internal Server Error - Error dalam analisis
- **Connection Error**: Backend tidak berjalan atau tidak dapat diakses

### Best Practices:
1. Selalu cek koneksi internet sebelum melakukan request
2. Implementasikan timeout untuk request (default 30 detik)
3. Handle error dengan graceful fallback
4. Cache hasil analisis untuk teks yang sama
5. Gunakan async/await pattern untuk performa yang lebih baik

## Performance Tips

1. **Batching**: Untuk multiple text analysis, pertimbangkan untuk membuat endpoint batch
2. **Caching**: Cache hasil analisis untuk menghindari request berulang
3. **Throttling**: Batasi frequency request untuk menghindari spam
4. **Connection Pooling**: Reuse UnityWebRequest instances jika memungkinkan

## Deployment Considerations

### Development
- Backend berjalan di `localhost:5001`
- CORS sudah dikonfigurasi untuk development

### Production
- Ganti BASE_URL ke production server
- Implementasikan HTTPS untuk keamanan
- Tambahkan authentication jika diperlukan
- Monitor performance dan error rates

## Troubleshooting

### Backend tidak dapat diakses:
1. Pastikan backend berjalan: `python3 src/main.py`
2. Cek port 5001 tidak digunakan aplikasi lain
3. Verify CORS settings jika ada cross-origin issues

### Unity connection issues:
1. Pastikan Newtonsoft.Json package terinstall
2. Cek firewall settings
3. Test dengan curl terlebih dahulu
4. Enable debug mode untuk detailed logging

### Performance issues:
1. Monitor network latency
2. Optimize text preprocessing
3. Implement request queuing untuk multiple requests
4. Consider local caching strategies

## Example Use Cases

1. **VR Therapy Applications**: Analisis emosi real-time dari speech-to-text
2. **Educational Games**: Feedback emosional dari input siswa
3. **Social VR**: Moderasi konten berdasarkan analisis emosi
4. **Chatbot Integration**: Respons adaptif berdasarkan emosi user
5. **Mental Health Apps**: Tracking mood dan emotional state

---

**Note**: Pastikan Emotion Analysis Backend sudah berjalan sebelum menggunakan API ini dari Unity. Untuk production deployment, pertimbangkan untuk menggunakan HTTPS dan implementasi authentication yang proper.