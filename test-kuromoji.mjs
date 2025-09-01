// Kuromoji変換テスト用スクリプト（ESモジュール版）
import { testKuromojiConversion, convertTextForSpeech } from './lib/kuromojiConverter.js';

async function runTest() {
  console.log('=== 個別テストケース ===\n');
  
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
  ];

  for (const phrase of testPhrases) {
    try {
      const converted = await convertTextForSpeech(phrase);
      console.log(`原文: ${phrase}`);
      console.log(`変換: ${converted}`);
      console.log('---');
    } catch (error) {
      console.error(`エラー: ${phrase}`, error.message);
    }
  }

  console.log('\n=== 包括的テスト実行 ===\n');
  await testKuromojiConversion();
}

runTest().catch(console.error);