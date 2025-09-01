// Kuromoji変換のテスト用APIエンドポイント
import { NextRequest, NextResponse } from 'next/server';
import { convertTextForSpeech } from '@/lib/kuromojiConverter';

export async function GET(request: NextRequest) {
  const testPhrases = [
    "食事中に痛みがあります。",
    "食事の時に痛いです。",
    "食べ物を噛むと痛いです。",
    "朝食後に薬を飲みます。",
    "昼食前に歯を磨きます。",
    "夕食時に出血しました。",
    "食欲がありません。",
    "食後すぐに歯を磨きます。",
    "食前に薬を服用します。",
    "今日の朝食は食べられませんでした。",
    "昨日の夕食後から痛いです。",
    "食事ができなくて困っています。",
    "3日前から歯茎が腫れています。",
    "親知らずの抜歯をお願いします。",
    "冷たい飲み物がしみます。",
    "10年前に親知らずを抜きました。",
    "高血圧と糖尿病の薬を飲んでいます。",
  ];

  const results = [];
  
  for (const phrase of testPhrases) {
    try {
      const converted = await convertTextForSpeech(phrase);
      results.push({
        original: phrase,
        converted: converted,
        success: true
      });
    } catch (error) {
      results.push({
        original: phrase,
        converted: phrase,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return NextResponse.json({
    message: 'Kuromoji conversion test results',
    results: results
  });
}