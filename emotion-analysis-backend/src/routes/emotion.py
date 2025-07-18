from flask import Blueprint, request, jsonify
import re
import string
from collections import Counter

emotion_bp = Blueprint('emotion', __name__)

# Kamus emosi berbasis kata kunci (lexicon-based approach)
EMOTION_LEXICON = {
    'marah': {
        'keywords': [
            'marah', 'kesal', 'geram', 'murka', 'berang', 'jengkel', 'dongkol',
            'angry', 'mad', 'furious', 'rage', 'irritated', 'annoyed', 'pissed',
            'damn', 'hell', 'stupid', 'idiot', 'hate', 'disgusting', 'terrible',
            'awful', 'worst', 'sucks', 'ridiculous', 'outrageous', 'unacceptable',
            'muak', 'tertekan'
        ],
        'patterns': [
            r'\b(tidak|nggak|gak)\s+(bisa|mau|suka|setuju)\b',
            r'\b(kenapa|mengapa)\s+(harus|musti)\b',
            r'\bapa-apaan\b',
            r'\bmenyebalkan\b',
            r'\bmuak\s+(saya|aku)\b',
            r'\bberhenti\s+menekan\b',
            r'\bcukup\s+tertekan\b'
        ],
        'weight': 1.0
    },
    'sedih': {
        'keywords': [
            'sedih', 'kecewa', 'galau', 'patah hati', 'hancur', 'terpuruk',
            'sad', 'disappointed', 'heartbroken', 'depressed', 'down', 'blue',
            'cry', 'tears', 'sorry', 'regret', 'miss', 'lonely', 'empty',
            'hopeless', 'devastated', 'grief', 'sorrow', 'melancholy'
        ],
        'patterns': [
            r'\bsaya\s+(sedih|kecewa|galau)\b',
            r'\btidak\s+(bahagia|senang|gembira)\b',
            r'\bkenapa\s+(hidup|nasib)\b'
        ],
        'weight': 0.9
    },
    'cemas': {
        'keywords': [
            'cemas', 'khawatir', 'takut', 'was-was', 'gelisah', 'panik', 'stress',
            'anxious', 'worried', 'nervous', 'scared', 'afraid', 'panic', 'stress',
            'concerned', 'uneasy', 'restless', 'tense', 'overwhelmed', 'pressure',
            'doubt', 'uncertain', 'insecure', 'paranoid', 'frightened'
        ],
        'patterns': [
            r'\bbagaimana\s+(kalau|jika|bila)\b',
            r'\bapa\s+(yang\s+)?terjadi\b',
            r'\bsemoga\s+(tidak|jangan)\b'
        ],
        'weight': 0.8
    },
    'agresif': {
        'keywords': [
            'serang', 'hancurkan', 'bunuh', 'pukul', 'hajar', 'gebuk', 'tonjok',
            'attack', 'destroy', 'kill', 'fight', 'punch', 'hit', 'beat', 'smash',
            'crush', 'eliminate', 'violence', 'aggressive', 'hostile', 'brutal',
            'savage', 'fierce', 'ruthless', 'merciless', 'vicious'
        ],
        'patterns': [
            r'\bakan\s+(ku|saya)\s+(hancurkan|bunuh|serang)\b',
            r'\bkamu\s+(akan|bakal)\s+(mati|hancur)\b'
        ],
        'weight': 1.2
    },
    'defensif': {
        'keywords': [
            'bukan salah saya', 'saya tidak', 'itu bukan', 'jangan salahkan',
            'not my fault', 'not me', 'I didn\'t', 'wasn\'t me', 'defend', 'protect',
            'excuse', 'justify', 'explanation', 'misunderstand', 'unfair',
            'blame', 'accusation', 'innocent', 'victim'
        ],
        'patterns': [
            r'\bbukan\s+(salah|kesalahan)\s+(saya|aku)\b',
            r'\bsaya\s+(tidak|nggak|gak)\s+(tahu|tau|pernah)\b',
            r'\bkenapa\s+(saya|aku)\s+(yang|harus)\b'
        ],
        'weight': 0.7
    },
    'penyesalan': {
        'keywords': [
            'menyesal', 'sesal', 'salah', 'maaf', 'mohon maaf', 'sorry',
            'regret', 'apologize', 'mistake', 'wrong', 'fault', 'guilt',
            'shame', 'remorse', 'repent', 'forgive', 'pardon'
        ],
        'patterns': [
            r'\bmaaf\s+(ya|deh|banget)\b',
            r'\bsaya\s+(salah|keliru)\b',
            r'\bseharusnya\s+(tidak|jangan)\b'
        ],
        'weight': 0.6
    },
    'kesal': {
        'keywords': [
            'kesal', 'sebel', 'bete', 'ilfeel', 'annoyed', 'irritated', 'bothered',
            'frustrated', 'fed up', 'sick of', 'tired of', 'enough', 'stop it'
        ],
        'patterns': [
            r'\budah\s+(capek|lelah|bosan)\b',
            r'\bstop\s+(it|doing|that)\b'
        ],
        'weight': 0.8
    },
    'senang': {
        'keywords': [
            'senang', 'bahagia', 'gembira', 'suka', 'cinta', 'love', 'happy',
            'joy', 'excited', 'cheerful', 'delighted', 'pleased', 'glad',
            'wonderful', 'amazing', 'fantastic', 'great', 'excellent', 'awesome',
            'perfect', 'brilliant', 'marvelous', 'superb', 'outstanding',
            'incredible', 'fabulous', 'terrific', 'magnificent'
        ],
        'patterns': [
            r'\bsaya\s+(senang|bahagia|suka)\b',
            r'\bterima\s+kasih\s+(banyak|banget)\b',
            r'\bsangat\s+(bagus|baik|keren)\b'
        ],
        'weight': 0.9
    },
    'netral': {
        'keywords': [
            'baik', 'oke', 'ya', 'terima kasih', 'thanks', 'okay', 'fine',
            'good', 'nice', 'cool', 'sure', 'alright', 'understand'
        ],
        'patterns': [],
        'weight': 0.3
    }
}

def preprocess_text(text):
    """Preprocessing teks untuk analisis emosi"""
    if not text:
        return ""
    
    # Convert ke lowercase
    text = text.lower()
    
    # Hapus tanda baca kecuali yang penting untuk emosi
    text = re.sub(r'[^\w\s!?.-]', ' ', text)
    
    # Hapus extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def calculate_emotion_scores(text):
    """Menghitung skor emosi berdasarkan lexicon"""
    if not text:
        return {}
    
    preprocessed_text = preprocess_text(text)
    emotion_scores = {}
    
    for emotion, data in EMOTION_LEXICON.items():
        score = 0
        matches = []
        
        # Cek keyword matches
        for keyword in data['keywords']:
            keyword_lower = keyword.lower()
            if keyword_lower in preprocessed_text:
                # Hitung berapa kali keyword muncul
                count = preprocessed_text.count(keyword_lower)
                score += count * data['weight']
                matches.extend([keyword] * count)
        
        # Cek pattern matches
        for pattern in data['patterns']:
            pattern_matches = re.findall(pattern, preprocessed_text, re.IGNORECASE)
            if pattern_matches:
                score += len(pattern_matches) * data['weight'] * 1.5  # Pattern lebih berbobot
                matches.extend([f"pattern: {pattern}"] * len(pattern_matches))
        
        if score > 0:
            emotion_scores[emotion] = {
                'score': score,
                'matches': matches,
                'confidence': min(score / 3.0, 1.0)  # Normalize confidence 0-1
            }
    
    return emotion_scores

def get_dominant_emotion(emotion_scores):
    """Mendapatkan emosi dominan dari skor"""
    if not emotion_scores:
        return {
            'emotion': 'netral',
            'confidence': 0.5,
            'emoticon': '😐'
        }
    
    # Urutkan berdasarkan skor tertinggi
    sorted_emotions = sorted(
        emotion_scores.items(), 
        key=lambda x: x[1]['score'], 
        reverse=True
    )
    
    dominant_emotion = sorted_emotions[0][0]
    dominant_data = sorted_emotions[0][1]
    
    # Mapping emosi ke emoticon
    emotion_emoticons = {
        'marah': '😡',
        'sedih': '😢',
        'cemas': '😰',
        'agresif': '😤',
        'defensif': '🛡️',
        'penyesalan': '😔',
        'kesal': '😠',
        'senang': '😊',
        'netral': '😐'
    }
    
    return {
        'emotion': dominant_emotion,
        'confidence': dominant_data['confidence'],
        'emoticon': emotion_emoticons.get(dominant_emotion, '😐'),
        'matches': dominant_data['matches'][:5],  # Limit to 5 matches
        'all_scores': {k: v['score'] for k, v in emotion_scores.items()}
    }

@emotion_bp.route('/analyze', methods=['POST'])
def analyze_emotion():
    """Endpoint untuk analisis emosi"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'error': 'Text is required'
            }), 400
        
        text = data['text']
        
        if not text or not text.strip():
            return jsonify({
                'emotion': 'netral',
                'confidence': 0.5,
                'emoticon': '😐',
                'matches': [],
                'method': 'nlp_lexicon'
            })
        
        # Analisis emosi
        emotion_scores = calculate_emotion_scores(text)
        result = get_dominant_emotion(emotion_scores)
        
        # Tambahkan metadata
        result['method'] = 'nlp_lexicon'
        result['text_length'] = len(text)
        result['processed_text'] = preprocess_text(text)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'error': f'Analysis failed: {str(e)}',
            'emotion': 'netral',
            'confidence': 0.0,
            'emoticon': '😐'
        }), 500

@emotion_bp.route('/test', methods=['GET'])
def test_emotion():
    """Endpoint untuk testing dengan contoh teks"""
    test_texts = [
        "Saya sangat marah dengan pelayanan ini!",
        "Terima kasih atas bantuannya, sangat membantu",
        "Saya khawatir kalau nanti terjadi masalah",
        "Maaf ya, saya salah tadi",
        "Udah capek banget sama hal ini",
        "Akan ku hancurkan semua yang menghalangi",
        "Bukan salah saya kalau ini terjadi"
    ]
    
    results = []
    for text in test_texts:
        emotion_scores = calculate_emotion_scores(text)
        result = get_dominant_emotion(emotion_scores)
        results.append({
            'text': text,
            'emotion': result['emotion'],
            'confidence': result['confidence'],
            'emoticon': result['emoticon']
        })
    
    return jsonify({
        'test_results': results,
        'total_emotions': len(EMOTION_LEXICON),
        'method': 'nlp_lexicon'
    })

@emotion_bp.route('/emotions', methods=['GET'])
def get_emotions():
    """Endpoint untuk mendapatkan daftar emosi yang didukung"""
    emotion_info = {}
    
    for emotion, data in EMOTION_LEXICON.items():
        emotion_info[emotion] = {
            'keyword_count': len(data['keywords']),
            'pattern_count': len(data['patterns']),
            'weight': data['weight'],
            'sample_keywords': data['keywords'][:5]  # 5 contoh keyword
        }
    
    return jsonify({
        'supported_emotions': list(EMOTION_LEXICON.keys()),
        'emotion_details': emotion_info,
        'total_keywords': sum(len(data['keywords']) for data in EMOTION_LEXICON.values()),
        'method': 'nlp_lexicon'
    })

