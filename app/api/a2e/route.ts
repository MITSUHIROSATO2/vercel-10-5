import { NextRequest, NextResponse } from 'next/server';

// A2E.ai API設定
const A2E_API_KEY = process.env.A2E_API_KEY; // クライアントサイドから隠蔽
const A2E_API_BASE_URL = 'https://api.a2e.ai/v1'; // 実際のA2E.ai APIエンドポイント

// 開発環境用のモック設定
const USE_MOCK = true; // 本番環境では false に設定

interface A2ESessionRequest {
  avatarId?: string;
  emotion?: string;
  language?: string;
}

interface A2ESpeakRequest {
  sessionId: string;
  text: string;
  emotion?: string;
  voice?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json();

    if (!A2E_API_KEY) {
      return NextResponse.json(
        { error: 'A2E.ai APIキーが設定されていません' },
        { status: 500 }
      );
    }

    // アクションに応じて処理を分岐
    switch (action) {
      case 'createSession':
        return await createSession(params as A2ESessionRequest);
      
      case 'speak':
        return await speak(params as A2ESpeakRequest);
      
      case 'updateEmotion':
        return await updateEmotion(params);
      
      default:
        return NextResponse.json(
          { error: '無効なアクションです' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('A2E.ai API error:', error);
    return NextResponse.json(
      { error: 'A2E.ai APIの処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

// セッション作成
async function createSession(params: A2ESessionRequest) {
  try {
    // モックレスポンス（開発用）
    if (USE_MOCK) {
      return NextResponse.json({
        sessionId: 'mock-session-' + Date.now(),
        avatarUrl: null, // iframeを使わず、静的画像を使用
        websocketUrl: null,
      });
    }

    const response = await fetch(`${A2E_API_BASE_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${A2E_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        avatar_id: params.avatarId || 'default',
        initial_emotion: params.emotion || 'neutral',
        language: params.language || 'ja',
        settings: {
          enable_lip_sync: true,
          enable_eye_tracking: true,
          enable_facial_expressions: true,
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`A2E.ai API error: ${error}`);
    }

    const data = await response.json();
    return NextResponse.json({
      sessionId: data.session_id,
      avatarUrl: data.avatar_url,
      websocketUrl: data.websocket_url,
    });
  } catch (error) {
    console.error('Failed to create A2E session:', error);
    return NextResponse.json(
      { error: 'セッションの作成に失敗しました' },
      { status: 500 }
    );
  }
}

// 音声合成とリップシンク
async function speak(params: A2ESpeakRequest) {
  try {
    // モックレスポンス（開発用）
    if (USE_MOCK) {
      return NextResponse.json({
        audioUrl: '/api/elevenlabs', // 既存のElevenLabs APIを使用
        visemeData: generateMockVisemeData(params.text),
        duration: params.text.length * 0.1, // 仮の長さ
      });
    }

    const response = await fetch(`${A2E_API_BASE_URL}/sessions/${params.sessionId}/speak`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${A2E_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: params.text,
        emotion: params.emotion || 'neutral',
        voice_settings: {
          voice_id: params.voice || 'japanese_female_01',
          speed: 1.0,
          pitch: 1.0,
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`A2E.ai speak API error: ${error}`);
    }

    const data = await response.json();
    return NextResponse.json({
      audioUrl: data.audio_url,
      visemeData: data.viseme_data,
      duration: data.duration,
    });
  } catch (error) {
    console.error('Failed to generate speech:', error);
    return NextResponse.json(
      { error: '音声生成に失敗しました' },
      { status: 500 }
    );
  }
}

// モック用のビゼームデータ生成
function generateMockVisemeData(text: string) {
  const visemes = [];
  const duration = text.length * 0.1;
  const interval = 0.05;
  
  for (let i = 0; i < duration; i += interval) {
    visemes.push({
      time: i,
      viseme: Math.floor(Math.random() * 15), // 0-14のランダムなビゼーム
      weight: Math.random()
    });
  }
  
  return visemes;
}

// 感情の更新
async function updateEmotion(params: any) {
  try {
    // モックレスポンス（開発用）
    if (USE_MOCK) {
      return NextResponse.json({ success: true });
    }

    const response = await fetch(`${A2E_API_BASE_URL}/sessions/${params.sessionId}/emotion`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${A2E_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emotion: params.emotion,
        intensity: params.intensity || 1.0,
        transition_duration: params.transitionDuration || 0.5,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`A2E.ai emotion API error: ${error}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update emotion:', error);
    return NextResponse.json(
      { error: '感情の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// WebSocket接続情報の取得
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'セッションIDが必要です' },
        { status: 400 }
      );
    }

    const response = await fetch(`${A2E_API_BASE_URL}/sessions/${sessionId}/websocket`, {
      headers: {
        'Authorization': `Bearer ${A2E_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get WebSocket info');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to get WebSocket info:', error);
    return NextResponse.json(
      { error: 'WebSocket情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}