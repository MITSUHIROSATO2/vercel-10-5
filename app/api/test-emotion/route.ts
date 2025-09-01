import { NextRequest, NextResponse } from 'next/server';

// 感情テスト用のサンプルテキスト
const emotionSamples = {
  pain: [
    "歯がズキズキして痛いです",
    "激痛で夜も眠れません",
    "噛むと痛みが走ります",
    "冷たいものがしみて辛いです"
  ],
  anxiety: [
    "治療は痛くないでしょうか？心配です",
    "抜歯になるのではないかと不安です",
    "大丈夫でしょうか...",
    "どうしよう、怖いです"
  ],
  discomfort: [
    "歯ぐきが腫れて気持ち悪いです",
    "口の中に違和感があります",
    "血の味がして気持ち悪いです"
  ],
  relief: [
    "痛みが和らいで安心しました",
    "良かった、ほっとしました",
    "ありがとうございます、安心しました"
  ],
  confusion: [
    "えーと、いつからだったかな...",
    "うーん、よくわからないです",
    "たぶん3日前くらいだったと思います"
  ],
  neutral: [
    "こんにちは",
    "よろしくお願いします",
    "山田太郎です"
  ]
};

export async function GET(request: NextRequest) {
  // URLパラメータから感情タイプを取得
  const { searchParams } = new URL(request.url);
  const emotion = searchParams.get('emotion') || 'all';
  
  if (emotion === 'all') {
    return NextResponse.json({ samples: emotionSamples });
  }
  
  if (emotion in emotionSamples) {
    const samples = emotionSamples[emotion as keyof typeof emotionSamples];
    return NextResponse.json({ 
      emotion,
      samples,
      message: `${emotion}の感情テキストサンプル`
    });
  }
  
  return NextResponse.json({ 
    error: 'Invalid emotion type',
    availableEmotions: Object.keys(emotionSamples)
  }, { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    const { text, testEmotion } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'テキストが必要です' },
        { status: 400 }
      );
    }
    
    // 指定された感情でテスト音声を生成
    const emotion = testEmotion || 'auto'; // 'auto'の場合は自動検出
    
    console.log('Testing emotion voice generation');
    console.log('Text:', text);
    console.log('Test emotion:', emotion);
    
    // ElevenLabs APIを呼び出し
    const response = await fetch(`${request.url.replace('/test-emotion', '/elevenlabs')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        text,
        emotion: emotion === 'auto' ? undefined : emotion
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `音声生成エラー: ${error}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      emotion: emotion,
      text: text,
      audio: data.audio,
      format: data.format,
      message: `${emotion}の感情で音声を生成しました`
    });
    
  } catch (error) {
    console.error('Emotion test error:', error);
    return NextResponse.json(
      { error: 'エラーが発生しました' },
      { status: 500 }
    );
  }
}