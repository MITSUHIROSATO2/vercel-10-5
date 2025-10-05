import { NextRequest, NextResponse } from 'next/server';
import { convertKanjiToHiragana } from '@/lib/textConverter';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

export async function GET(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production';
  const token = process.env.TEST_API_TOKEN;

  if (!token) {
    return NextResponse.json({ error: 'Test endpoint disabled' }, { status: 503 });
  }

  const authorization = request.headers.get('authorization') || '';
  const providedToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null;

  if (!providedToken || providedToken !== token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const testText = "こんにちは、今日はどうされましたか？";
  
  if (!isProduction) {
    console.log('Testing voice output...');
    console.log('API Key exists:', !!ELEVENLABS_API_KEY);
    console.log('Voice ID exists:', !!ELEVENLABS_VOICE_ID);
  }
  
  if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID) {
    return NextResponse.json({
      error: 'ElevenLabs API configuration missing',
      hasApiKey: !!ELEVENLABS_API_KEY,
      hasVoiceId: !!ELEVENLABS_VOICE_ID
    }, { status: 500 });
  }

  try {
    // 漢字をひらがなに変換（フォールバック使用）
    const hiraganaText = convertKanjiToHiragana(testText);
    if (!isProduction) {
      console.log('Converted text:', hiraganaText);
    }

    // ElevenLabs API呼び出し
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: hiraganaText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.3,
            use_speaker_boost: true
          }
        })
      }
    );

    if (!isProduction) {
      console.log('ElevenLabs Response Status:', response.status);
      console.log('ElevenLabs Response Headers:', Object.fromEntries(response.headers.entries()));
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API Error:', errorText);
      return NextResponse.json({
        error: 'ElevenLabs API error',
        status: response.status,
        details: errorText
      }, { status: response.status });
    }

    // 音声データをBase64に変換
    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    
    return NextResponse.json({
      success: true,
      audio: audioBase64,
      format: 'mp3',
      originalText: testText,
      convertedText: hiraganaText,
      audioSize: audioBuffer.byteLength
    });
    
  } catch (error) {
    console.error('Test voice error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
