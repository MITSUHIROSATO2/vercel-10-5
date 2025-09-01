// VOICEVOX風の自然な日本語音声合成設定
export interface VoiceSettings {
  speaker: string;
  speedScale: number;
  pitchScale: number;
  intonationScale: number;
  volumeScale: number;
  prePhonemeLength: number;
  postPhonemeLength: number;
}

// 歯科医療用の音声設定プリセット
export const DENTAL_VOICE_PRESETS: Record<string, VoiceSettings> = {
  // 優しい女性歯科衛生士
  gentle_hygienist: {
    speaker: 'female_nurse',
    speedScale: 0.95,        // 少しゆっくり話す
    pitchScale: 1.05,        // やや高めの声
    intonationScale: 1.15,   // 抑揚を強めに
    volumeScale: 0.9,        // 優しい音量
    prePhonemeLength: 0.15,  // 話し始めの間
    postPhonemeLength: 0.2,  // 話し終わりの間
  },
  // 落ち着いた説明
  calm_explanation: {
    speaker: 'female_nurse',
    speedScale: 0.9,         // ゆっくり丁寧に
    pitchScale: 1.0,         // 標準的な高さ
    intonationScale: 1.0,    // 標準的な抑揚
    volumeScale: 0.85,       // 少し控えめな音量
    prePhonemeLength: 0.2,   // 十分な間を取る
    postPhonemeLength: 0.25,
  },
  // 励ましの声かけ
  encouraging: {
    speaker: 'female_nurse',
    speedScale: 1.0,         // 通常速度
    pitchScale: 1.1,         // 明るめの声
    intonationScale: 1.3,    // 感情豊かに
    volumeScale: 0.95,       // はっきりとした音量
    prePhonemeLength: 0.1,
    postPhonemeLength: 0.15,
  }
};

// 日本語テキストの改善関数
export function improveJapaneseText(text: string, context: 'pain' | 'procedure' | 'comfort' | 'general'): string {
  // 不自然な表現を自然な日本語に変換
  const replacements: Record<string, string> = {
    // 一般的な修正
    'です。': 'ですね。',
    'ます。': 'ますね。',
    'ください。': 'くださいね。',
    'いかがですか？': 'いかがでしょうか？',
    
    // 痛みに関する表現
    '痛いですか': '痛みはありますか',
    '大丈夫ですか': 'お痛みは大丈夫ですか',
    '痛みます': 'お痛みがあります',
    
    // 処置に関する表現
    '始めます': '始めさせていただきますね',
    '終わりました': '終わりましたよ',
    'してください': 'していただけますか',
    
    // 敬語の調整
    'あなた': '患者様',
    'わかりました': 'かしこまりました',
  };

  let improvedText = text;
  
  // 基本的な置換
  for (const [from, to] of Object.entries(replacements)) {
    improvedText = improvedText.replace(new RegExp(from, 'g'), to);
  }

  // コンテキストに応じた調整
  switch (context) {
    case 'pain':
      // 痛みに関する会話では、より共感的な表現に
      improvedText = improvedText
        .replace(/痛み/g, 'お痛み')
        .replace(/つらい/g, 'おつらい')
        .replace(/我慢/g, 'ご無理');
      break;
      
    case 'procedure':
      // 処置中は丁寧かつ安心感のある表現に
      improvedText = improvedText
        .replace(/します/g, 'させていただきます')
        .replace(/少し/g, '少しだけ')
        .replace(/お待ち/g, 'お待ちいただいて');
      break;
      
    case 'comfort':
      // 励ましの場面では温かみのある表現に
      improvedText = improvedText
        .replace(/大丈夫/g, '大丈夫ですよ')
        .replace(/頑張って/g, '一緒に頑張りましょう')
        .replace(/心配/g, 'ご心配');
      break;
  }

  // 文末の調整（より自然な会話調に）
  improvedText = improvedText
    .replace(/。$/g, 'ね。')
    .replace(/か。$/g, 'か？')
    .replace(/よ。$/g, 'よ〜。');

  // 間投詞の追加（自然な会話のリズム）
  if (context === 'comfort' || context === 'general') {
    improvedText = improvedText
      .replace(/^/, 'そうですね、')
      .replace(/ですが/g, 'ですけれど')
      .replace(/しかし/g, 'でも');
  }

  return improvedText;
}

// 音声合成用のSSML生成
export function generateSSML(text: string, settings: VoiceSettings): string {
  // SSML (Speech Synthesis Markup Language) 形式で出力
  const ssml = `
    <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ja-JP">
      <prosody rate="${settings.speedScale}" pitch="${settings.pitchScale}x" volume="${settings.volumeScale}">
        ${text.split('。').map(sentence => {
          if (sentence.trim()) {
            // 文ごとに適切な間を入れる
            return `<s>${sentence.trim()}。<break time="${settings.postPhonemeLength}s"/></s>`;
          }
          return '';
        }).join('\n')}
      </prosody>
    </speak>
  `.trim();
  
  return ssml;
}

// 感情に応じた音声設定の調整
export function adjustVoiceForEmotion(
  baseSettings: VoiceSettings, 
  emotion: 'neutral' | 'happy' | 'pain' | 'worried'
): VoiceSettings {
  const adjusted = { ...baseSettings };
  
  switch (emotion) {
    case 'happy':
      adjusted.pitchScale *= 1.1;      // 声を高く
      adjusted.speedScale *= 1.05;     // 少し速く
      adjusted.intonationScale *= 1.2; // 抑揚を強く
      break;
      
    case 'pain':
      adjusted.pitchScale *= 0.95;     // 声を低く
      adjusted.speedScale *= 0.9;      // ゆっくり
      adjusted.volumeScale *= 0.8;     // 音量を下げる
      break;
      
    case 'worried':
      adjusted.speedScale *= 0.95;     // 少しゆっくり
      adjusted.intonationScale *= 0.9; // 抑揚を抑える
      adjusted.prePhonemeLength *= 1.5; // 間を長く
      break;
  }
  
  return adjusted;
}