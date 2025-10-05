// kuromoji.jsを使用した高精度な日本語テキスト変換
// 注意: kuromojiはNode.js環境でのみ動作します（サーバーサイド）

// Tokenizer のインスタンスをキャッシュ
let tokenizerInstance: any = null;
let tokenizerPromise: Promise<any> | null = null;

// 特殊な読み方のオーバーライド辞書
const specialReadings: { [key: string]: string } = {
  // 痛み関連の動詞活用
  '痛んでいます': 'いたんでいます',
  '痛んでいる': 'いたんでいる',
  '痛んでいて': 'いたんでいて',
  '痛んで': 'いたんで',
  '痛みます': 'いたみます',
  '痛みが': 'いたみが',
  '痛み': 'いたみ',
  
  // 薬関連
  '薬': 'くすり',
  'お薬': 'おくすり',
  '薬を': 'くすりを',
  '薬が': 'くすりが',
  '薬は': 'くすりは',
  '薬の': 'くすりの',
  '薬で': 'くすりで',
  '薬も': 'くすりも',
  '鎮痛薬': 'ちんつうやく',
  '痛み止め': 'いたみどめ',
  '鎮痛剤': 'ちんつうざい',
  
  // 医療・歯科用語
  '親知らず': 'おやしらず',
  '歯周病': 'ししゅうびょう',
  '虫歯': 'むしば',
  '歯茎': 'はぐき',
  '歯石': 'しせき',
  '歯垢': 'しこう',
  '歯磨き': 'はみがき',
  '歯ブラシ': 'はぶらし',
  '詰め物': 'つめもの',
  '被せ物': 'かぶせもの',
  '根管治療': 'こんかんちりょう',
  '抜歯': 'ばっし',
  '麻酔': 'ますい',
  '局所麻酔': 'きょくしょますい',
  '歯髄': 'しずい',
  '歯肉': 'しにく',
  '顎関節': 'がくかんせつ',
  '噛み合わせ': 'かみあわせ',
  '咬合': 'こうごう',
  '口腔': 'こうくう',
  '口臭': 'こうしゅう',
  '口内炎': 'こうないえん',
  '知覚過敏': 'ちかくかびん',
  '歯列矯正': 'しれつきょうせい',
  '入れ歯': 'いれば',
  '義歯': 'ぎし',
  
  // 複合語（長いものから優先的にマッチさせる）
  '食事中': 'しょくじちゅう',
  '食事後': 'しょくじご',
  '食事前': 'しょくじまえ',
  '朝食後': 'ちょうしょくご',
  '昼食後': 'ちゅうしょくご',
  '夕食後': 'ゆうしょくご',
  '朝食前': 'ちょうしょくまえ',
  '昼食前': 'ちゅうしょくまえ',
  '夕食前': 'ゆうしょくまえ',
  '朝食時': 'ちょうしょくじ',
  '昼食時': 'ちゅうしょくじ',
  '夕食時': 'ゆうしょくじ',
  
  // 日常用語（特殊な読み）
  '今日': 'きょう',
  '昨日': 'きのう',
  '明日': 'あした',
  '一日': 'いちにち',
  '二日': 'ふつか',
  '三日': 'みっか',
  '四日': 'よっか',
  '五日': 'いつか',
  '六日': 'むいか',
  '七日': 'なのか',
  '八日': 'ようか',
  '九日': 'ここのか',
  '十日': 'とおか',
  '二十日': 'はつか',
  '今年': 'ことし',
  '去年': 'きょねん',
  '来年': 'らいねん',
  '大丈夫': 'だいじょうぶ',
  '食事': 'しょくじ',
  '朝食': 'ちょうしょく',
  '昼食': 'ちゅうしょく',
  '夕食': 'ゆうしょく',
  '夕飯': 'ゆうはん',
  '朝飯': 'あさめし',
  '昼飯': 'ひるめし',
  '晩飯': 'ばんめし',
  '御飯': 'ごはん',
  '食べ物': 'たべもの',
  '飲み物': 'のみもの',
  '食欲': 'しょくよく',
  '食後': 'しょくご',
  '食前': 'しょくぜん',
  '食中': 'しょくちゅう'
};

// 助詞や接続詞などは変換しない
const preserveWords = new Set([
  'の', 'を', 'は', 'が', 'に', 'で', 'と', 'から', 'まで', 'より',
  'へ', 'や', 'か', 'も', 'ね', 'よ', 'わ', 'さ', 'ぞ', 'ぜ',
  'です', 'ます', 'でした', 'ました', 'でしょう', 'ましょう'
]);

// Tokenizer を初期化
async function getTokenizer(): Promise<any> {
  // クライアントサイドでは常にnullを返す
  if (typeof window !== 'undefined') {
    return null;
  }
  
  if (tokenizerInstance) {
    return tokenizerInstance;
  }

  if (tokenizerPromise) {
    return tokenizerPromise;
  }

  tokenizerPromise = (async () => {
    try {
      // Node.js環境であることを明示的に確認
      if (typeof process === 'undefined' || !process.versions || !process.versions.node) {
        console.error('Not in Node.js environment');
        tokenizerPromise = null;
        throw new Error('Not in Node.js environment');
      }

      // カスタムサーバーローダーを動的インポート
      const { createServerTokenizer } = await import('./kuromojiServerLoader');
      const tokenizer = await createServerTokenizer();
      tokenizerInstance = tokenizer;
      console.log('Kuromoji tokenizer initialized successfully using custom server loader');
      return tokenizer;
    } catch (error) {
      console.error('Failed to initialize kuromoji:', error);
      tokenizerPromise = null;
      // フォールバックを返す（エラーをthrowしない）
      return null;
    }
  })();

  return tokenizerPromise;
}

// カタカナをひらがなに変換
function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30a1-\u30f6]/g, (match) => {
    const chr = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });
}

// 自然な音声のためのポーズを追加
function addNaturalPauses(text: string): string {
  // 句読点の後に短いポーズを追加
  text = text.replace(/。/g, '。　');
  text = text.replace(/、/g, '、　');
  text = text.replace(/？/g, '？　');
  text = text.replace(/！/g, '！　');
  
  // 長い文の場合、適切な位置にポーズを追加
  if (text.length > 30) {
    // 接続詞の後にわずかなポーズ
    text = text.replace(/て([^。、])/g, 'て　$1');
    text = text.replace(/で([^。、])/g, 'で　$1');
    text = text.replace(/が([^。、])/g, 'が　$1');
    text = text.replace(/けど/g, 'けど　');
    text = text.replace(/けれど/g, 'けれど　');
    text = text.replace(/しかし/g, 'しかし　');
    text = text.replace(/でも/g, 'でも　');
  }
  
  return text;
}

// 特殊な数字の読み方を処理
function convertNumbers(text: string): string {
  // 年月日時分の読み方
  text = text.replace(/(\d+)年/g, '$1ねん');
  text = text.replace(/(\d+)月(?!曜)/g, '$1がつ');
  text = text.replace(/(\d+)日(?!曜)/g, (match, p1) => {
    const num = parseInt(p1);
    const specialDays: { [key: number]: string } = {
      1: 'ついたち',
      2: 'ふつか',
      3: 'みっか',
      4: 'よっか',
      5: 'いつか',
      6: 'むいか',
      7: 'なのか',
      8: 'ようか',
      9: 'ここのか',
      10: 'とおか',
      14: 'じゅうよっか',
      20: 'はつか',
      24: 'にじゅうよっか'
    };
    return specialDays[num] || `${p1}にち`;
  });
  text = text.replace(/(\d+)時/g, '$1じ');
  text = text.replace(/(\d+)分/g, (match, p1) => {
    const num = parseInt(p1);
    if (num === 3) return 'さんぷん';
    if (num === 4) return 'よんぷん';
    if (num === 10) return 'じゅっぷん';
    return `${p1}ふん`;
  });
  text = text.replace(/(\d+)秒/g, '$1びょう');
  
  // その他の単位
  text = text.replace(/(\d+)歳/g, '$1さい');
  text = text.replace(/(\d+)円/g, '$1えん');
  text = text.replace(/(\d+)人/g, '$1にん');
  text = text.replace(/(\d+)個/g, '$1こ');
  text = text.replace(/(\d+)本/g, '$1ほん');
  text = text.replace(/(\d+)枚/g, '$1まい');
  text = text.replace(/(\d+)回/g, '$1かい');
  text = text.replace(/(\d+)度/g, '$1ど');
  text = text.replace(/(\d+)番/g, '$1ばん');
  text = text.replace(/(\d+)階/g, '$1かい');
  text = text.replace(/(\d+)丁目/g, '$1ちょうめ');
  
  return text;
}

// メイン変換関数（kuromoji使用）
export async function convertKanjiToHiraganaWithKuromoji(text: string): Promise<string> {
  // クライアントサイドではkuromojiは使用できない
  if (typeof window !== 'undefined') {
    return convertKanjiToHiraganaFallback(text);
  }
  
  try {
    // Tokenizerを取得試行
    const tokenizer = await getTokenizer();
    
    // tokenizerが取得できない場合はフォールバック
    if (!tokenizer) {
      return convertKanjiToHiraganaFallback(text);
    }
    // 特殊な読み方の語句を事前に変換（長いものから優先的に）
    let processedText = text;
    
    // 辞書を長さでソート（長いものからマッチさせる）
    const sortedReadings = Object.entries(specialReadings).sort((a, b) => b[0].length - a[0].length);
    
    for (const [kanji, reading] of sortedReadings) {
      const regex = new RegExp(kanji, 'g');
      processedText = processedText.replace(regex, reading);
    }

    
    // テキストを形態素解析
    const tokens = tokenizer.tokenize(processedText);
    
    // トークンを処理して読み仮名に変換
    let result = '';
    for (const token of tokens) {
      // 助詞や接続詞はそのまま
      if (preserveWords.has(token.surface_form)) {
        result += token.surface_form;
      }
      // 記号はそのまま
      else if (token.pos === '記号') {
        result += token.surface_form;
      }
      // ひらがなはそのまま
      else if (token.surface_form.match(/^[ぁ-ゖ]+$/)) {
        result += token.surface_form;
      }
      // 読み仮名がある場合はそれを使用
      else if (token.reading) {
        // カタカナをひらがなに変換
        result += katakanaToHiragana(token.reading);
      }
      // 読み仮名がない場合（数字など）はそのまま
      else {
        result += token.surface_form;
      }
    }
    
    // 数字の特殊な読み方を処理
    result = convertNumbers(result);
    
    // 自然な音声のためのポーズを追加
    result = addNaturalPauses(result);
    
    // 不要な空白を整理（句読点周辺のポーズ以外を削除）
    result = result.replace(/([^。、？！])\s+([^。、？！])/g, '$1$2');
    result = result.replace(/　+/g, '　');
    result = result.trim();
    
    return result;
  } catch (error) {
    console.error('Kuromoji conversion error:', error);
    // エラーの場合は元のテキストを返す
    return text;
  }
}

// フォールバック用の簡易変換（kuromojiが利用できない場合）
export function convertKanjiToHiraganaFallback(text: string): string {
  let convertedText = text;
  
  // 特殊な読み方の語句を変換
  for (const [kanji, reading] of Object.entries(specialReadings)) {
    const regex = new RegExp(kanji, 'g');
    convertedText = convertedText.replace(regex, reading);
  }
  
  // 数字の特殊な読み方を処理
  convertedText = convertNumbers(convertedText);
  
  // 自然な音声のためのポーズを追加
  convertedText = addNaturalPauses(convertedText);
  
  // 不要な空白を整理
  convertedText = convertedText.replace(/　+/g, '　');
  convertedText = convertedText.trim();
  
  return convertedText;
}

// エクスポート用のメイン関数
export async function convertTextForSpeech(text: string): Promise<string> {
  try {
    // サーバーサイドでのみkuromojiを試行
    if (typeof window === 'undefined') {
      return await convertKanjiToHiraganaWithKuromoji(text);
    }
    // クライアントサイドではフォールバックを使用
    return convertKanjiToHiraganaFallback(text);
  } catch (error) {
    console.warn('convertTextForSpeech fallback due to error:', error);
    // エラー時はフォールバック
    return convertKanjiToHiraganaFallback(text);
  }
}

// テスト用関数
export async function testKuromojiConversion() {
  const testCases = [
    "今日は右下の奥歯が痛いです。",
    "3日前から歯茎が腫れています。",
    "親知らずの抜歯をお願いします。",
    "食事中に痛みがあります。",
    "朝食後に薬を飲みます。",
    "食べ物が詰まりやすいです。",
    "食欲がありません。",
    "昨日の夕食後から痛いです。",
    "食前食後に歯を磨きます。",
    "冷たい飲み物がしみます。",
    "10年前に親知らずを抜きました。",
    "高血圧と糖尿病の薬を飲んでいます。",
  ];
  
  console.log('=== Kuromoji音声変換テスト ===\n');
  for (const text of testCases) {
    try {
      const converted = await convertTextForSpeech(text);
      console.log(`元の文: ${text}`);
      console.log(`変換後: ${converted}`);
      console.log('---');
    } catch (error) {
      console.error(`変換エラー: ${text}`, error);
    }
  }
}
