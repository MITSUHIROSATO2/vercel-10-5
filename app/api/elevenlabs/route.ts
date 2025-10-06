import { NextRequest, NextResponse } from 'next/server';
// 包括的な医療辞書を使用
import { medicalDictionary } from '@/lib/medicalDictionary';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const ELEVENLABS_VOICE_PATIENT_MALE = process.env.ELEVENLABS_VOICE_PATIENT_MALE;
const ELEVENLABS_VOICE_PATIENT_FEMALE = process.env.ELEVENLABS_VOICE_PATIENT_FEMALE;
const ELEVENLABS_VOICE_DOCTOR = process.env.ELEVENLABS_VOICE_DOCTOR;

// 年を日本語読みに変換する関数
function convertYearToJapanese(year: string): string {
  const yearNum = parseInt(year);
  let result = '';

  // 千の位
  const thousand = Math.floor(yearNum / 1000);
  if (thousand === 1) result += 'せん';
  else if (thousand === 2) result += 'にせん';

  // 百の位
  const hundred = Math.floor((yearNum % 1000) / 100);
  if (hundred === 1) result += 'ひゃく';
  else if (hundred === 2) result += 'にひゃく';
  else if (hundred === 3) result += 'さんびゃく';
  else if (hundred === 4) result += 'よんひゃく';
  else if (hundred === 5) result += 'ごひゃく';
  else if (hundred === 6) result += 'ろっぴゃく';
  else if (hundred === 7) result += 'ななひゃく';
  else if (hundred === 8) result += 'はっぴゃく';
  else if (hundred === 9) result += 'きゅうひゃく';

  // 十の位
  const ten = Math.floor((yearNum % 100) / 10);
  if (ten === 1) result += 'じゅう';
  else if (ten === 2) result += 'にじゅう';
  else if (ten === 3) result += 'さんじゅう';
  else if (ten === 4) result += 'よんじゅう';
  else if (ten === 5) result += 'ごじゅう';
  else if (ten === 6) result += 'ろくじゅう';
  else if (ten === 7) result += 'ななじゅう';
  else if (ten === 8) result += 'はちじゅう';
  else if (ten === 9) result += 'きゅうじゅう';

  // 一の位
  const one = yearNum % 10;
  if (one === 1) result += 'いち';
  else if (one === 2) result += 'に';
  else if (one === 3) result += 'さん';
  else if (one === 4) result += 'よ';
  else if (one === 5) result += 'ご';
  else if (one === 6) result += 'ろく';
  else if (one === 7) result += 'なな';
  else if (one === 8) result += 'はち';
  else if (one === 9) result += 'きゅう';

  result += 'ねん';
  return result;
}

// 月の読み方
const monthReadings: { [key: string]: string } = {
  '1': 'いちがつ', '2': 'にがつ', '3': 'さんがつ', '4': 'しがつ',
  '5': 'ごがつ', '6': 'ろくがつ', '7': 'しちがつ', '8': 'はちがつ',
  '9': 'くがつ', '10': 'じゅうがつ', '11': 'じゅういちがつ', '12': 'じゅうにがつ'
};

// 日の読み方
const dayReadings: { [key: string]: string } = {
  '1': 'ついたち', '2': 'ふつか', '3': 'みっか', '4': 'よっか', '5': 'いつか',
  '6': 'むいか', '7': 'なのか', '8': 'ようか', '9': 'ここのか', '10': 'とおか',
  '11': 'じゅういちにち', '12': 'じゅうににち', '13': 'じゅうさんにち',
  '14': 'じゅうよっか', '15': 'じゅうごにち', '16': 'じゅうろくにち',
  '17': 'じゅうしちにち', '18': 'じゅうはちにち', '19': 'じゅうくにち',
  '20': 'はつか', '21': 'にじゅういちにち', '22': 'にじゅうににち',
  '23': 'にじゅうさんにち', '24': 'にじゅうよっか', '25': 'にじゅうごにち',
  '26': 'にじゅうろくにち', '27': 'にじゅうしちにち', '28': 'にじゅうはちにち',
  '29': 'にじゅうくにち', '30': 'さんじゅうにち', '31': 'さんじゅういちにち'
};

// 動的に日付を変換する関数
function convertDynamicDates(text: string): string {
  // YYYY年MM月DD日生まれです のパターン
  text = text.replace(/(\d{4})年(\d{1,2})月(\d{1,2})日生まれです/g, (match, year, month, day) => {
    const yearJa = convertYearToJapanese(year);
    const monthJa = monthReadings[month] || month + 'がつ';
    const dayJa = dayReadings[day] || day + 'にち';
    return `${yearJa} ${monthJa} ${dayJa} うまれです`;
  });

  // YYYY年MM月DD日 のパターン
  text = text.replace(/(\d{4})年(\d{1,2})月(\d{1,2})日/g, (match, year, month, day) => {
    const yearJa = convertYearToJapanese(year);
    const monthJa = monthReadings[month] || month + 'がつ';
    const dayJa = dayReadings[day] || day + 'にち';
    return `${yearJa} ${monthJa} ${dayJa}`;
  });

  return text;
}

export async function POST(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production';
  const debugLog = (...args: unknown[]) => {
    if (!isProduction) {
      console.log(...args);
    }
  };

  debugLog('ElevenLabs API called');
  
  try {
    const { text, emotion = 'neutral', voiceId, voiceRole, language = 'ja' } = await request.json();
    const requestMeta = {
      language,
      voiceRole: voiceRole ?? 'default',
      emotion,
      textPreview: text?.slice(0, 40) ?? '',
    };

    console.log('[ElevenLabs] Incoming request', requestMeta);
    
    if (!text) {
      return NextResponse.json(
        { error: 'テキストが必要です' },
        { status: 400 }
      );
    }

    // voiceIdが指定されていればそれを使用。なければロールに応じた環境変数を参照
    const voiceRoleMap: Record<string, string | undefined> = {
      patient_male: ELEVENLABS_VOICE_PATIENT_MALE,
      patient_female: ELEVENLABS_VOICE_PATIENT_FEMALE,
      doctor: ELEVENLABS_VOICE_DOCTOR,
    };

    const selectedVoiceId = voiceId || (voiceRole ? voiceRoleMap[voiceRole] : undefined) || ELEVENLABS_VOICE_ID;

    if (!ELEVENLABS_API_KEY || !selectedVoiceId) {
      console.error('[ElevenLabs] Missing configuration', {
        hasApiKey: !!ELEVENLABS_API_KEY,
        resolvedVoiceId: selectedVoiceId ?? null,
        ...requestMeta,
      });
      return NextResponse.json(
        { error: 'ElevenLabs APIが設定されていません' },
        { status: 500 }
      );
    }

    debugLog(`🎙️ Voice role: ${voiceRole ?? 'default'} (resolved=${selectedVoiceId ? 'yes' : 'no'})`);
    if (isProduction) {
      console.log('[ElevenLabs] Using voice configuration', {
        selectedVoiceId,
        ...requestMeta,
      });
    }

    // 辞書ベースでテキストを音声用に変換
    let processedTextForTTS: string = text;

    // テキストの正規化（不要なスペースを削除）
    processedTextForTTS = processedTextForTTS.trim().replace(/　+/g, ' ').replace(/ +/g, ' ');

    debugLog(`🌐 Language: ${language}`);

    // 日本語の場合のみ医療辞書による変換を行う
    if (language === 'ja') {
      // 3日前の変換前のテキストを確認
      if (!isProduction && processedTextForTTS.includes('3日')) {
        console.log("Text before conversion contains '3日'");
      }

      // 包括的な医療辞書を使用して変換
      // 長い単語から優先的に処理
      const sortedWords = Object.entries(medicalDictionary)
        .sort((a, b) => b[0].length - a[0].length);
    
    if (!isProduction && processedTextForTTS.includes('生年月日')) {
      console.log('生年月日 found in text before conversion');
    }
    
    // まず辞書ファイルの既存エントリーで変換
    for (const [kanji, hiragana] of sortedWords) {
      // 特殊文字をエスケープ
      const escapedKanji = kanji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const beforeReplace = processedTextForTTS;
      processedTextForTTS = processedTextForTTS.replace(new RegExp(escapedKanji, 'g'), hiragana);

      // 生年月日の変換をログ
      if (!isProduction && kanji === '生年月日' && beforeReplace !== processedTextForTTS) {
        console.log(`Successfully replaced '生年月日' with 'せいねんがっぴ'`);
      }

      // 3日前の変換をデバッグ
      if (!isProduction && (kanji.includes('3日') || kanji === '3日') && beforeReplace !== processedTextForTTS) {
        console.log(`Replaced '${kanji}' with '${hiragana}'`);
      }
    }

    // 年月日の動的変換（辞書にない日付も処理）
    processedTextForTTS = convertDynamicDates(processedTextForTTS);

      if (!isProduction && processedTextForTTS.includes('せいねんがっぴ')) {
        console.log('せいねんがっぴ found in text after conversion');
      }

      if (!isProduction && text.includes('3日')) {
        console.log('Final converted text for ElevenLabs generated');
      }
    } // language === 'ja' の終了
    
    // 以下は古い辞書（コメントアウト済み）
    /*
    // 特定の読み間違いやすい単語のみ変換（最小限に抑える）
    const difficultWords: { [key: string]: string } = {
      // より長いフレーズを最優先
      '困っています': 'こまっています',
      '困っている': 'こまっている',
      '困ってます': 'こまってます',
      '困ってる': 'こまってる',
      '困った': 'こまった',
      // 固いもの関連
      '固いものが': 'かたいものが',
      '固いものを': 'かたいものを',
      '固いもの': 'かたいもの',
      '硬いものが': 'かたいものが',
      '硬いものを': 'かたいものを',
      '硬いもの': 'かたいもの',
      '固い食べ物': 'かたいたべもの',
      '硬い食べ物': 'かたいたべもの',
      '固くて': 'かたくて',
      '硬くて': 'かたくて',
      '固い': 'かたい',
      '硬い': 'かたい',
      '柔らかいもの': 'やわらかいもの',
      '柔らかい': 'やわらかい',
      // 抜歯関連（活用形も含めて優先処理）
      '抜歯する': 'ばっしする',
      '抜歯して': 'ばっしして',
      '抜歯した': 'ばっしした',
      '抜歯を': 'ばっしを',
      '抜歯が': 'ばっしが',
      '抜歯の': 'ばっしの',
      '抜歯': 'ばっし',
      // 歯科関連の重要単語（より長いフレーズを優先）
      '歯科医師': 'しかいし',  // 「歯科医師」を「しかいし」に
      '歯科医院': 'しかいいん',  // 「歯科医院」を「しかいいん」に
      '歯科医': 'しかい',  // 「歯科医」を「しかい」に
      '歯科': 'しか',  // 「歯科」を「しか」に
      '歯が痛くて': 'はがいたくて',  // フレーズ全体で変換
      '歯が痛い': 'はがいたい',
      '歯が痛む': 'はがいたむ',
      '歯がしみる': 'はがしみる',
      '奥歯が': 'おくばが',
      '前歯が': 'まえばが',
      '歯が': 'はが',  // 「歯が」を「はが」に
      '歯を': 'はを',  // 「歯を」を「はを」に
      '歯の': 'はの',  // 「歯の」を「はの」に
      '歯に': 'はに',  // 「歯に」を「はに」に
      '右下': 'みぎした',  // 「右下」を「みぎした」に追加
      '左下': 'ひだりした',  // 「左下」も追加
      '右上': 'みぎうえ',  // 「右上」も追加
      '左上': 'ひだりうえ',  // 「左上」も追加
      '奥歯': 'おくば',  // 「奥歯」を「おくば」に
      '前歯': 'まえば',
      '歯': 'は',  // 単独の「歯」は最後に
      '親知らず': 'おやしらず',
      '歯茎': 'はぐき',
      '歯肉': 'しにく',
      '麻酔': 'ますい',
      '虫歯': 'むしば',
      '歯周病': 'ししゅうびょう',
      '困る': 'こまる',
      // 治療関連の重要単語
      '治りません': 'なおりません',  // 「治りません」を「なおりません」に
      '治りました': 'なおりました',
      '治ります': 'なおります',
      '治らない': 'なおらない',
      '治った': 'なおった',
      '治る': 'なおる',
      '治療': 'ちりょう',
      '治癒': 'ちゆ',
      '完治': 'かんち',
      '治す': 'なおす',
      '治して': 'なおして',
      // その他の読み間違いやすい漢字
      '医師': 'いし',  // 「医師」を「いし」に
      '医者': 'いしゃ',  // 「医者」を「いしゃ」に
      '医院': 'いいん',  // 「医院」を「いいん」に
      '病院': 'びょういん',  // 「病院」を「びょういん」に
      '患者': 'かんじゃ',  // 「患者」を「かんじゃ」に
      '痛み止め': 'いたみどめ',
      '腫れ': 'はれ',
      '腫れて': 'はれて',
      '腫れている': 'はれている',
      '膿': 'うみ',
      '膿が': 'うみが',
      '噛む': 'かむ',
      '噛めない': 'かめない',
      '噛むと': 'かむと',
      '詰め物': 'つめもの',
      '被せ物': 'かぶせもの',
      '診察': 'しんさつ',
      '診断': 'しんだん',
      '症状': 'しょうじょう',
      '炎症': 'えんしょう',
      '感染': 'かんせん',
      '細菌': 'さいきん',
      '消毒': 'しょうどく',
      '洗浄': 'せんじょう',
      '根管': 'こんかん',
      '神経': 'しんけい',
      '知覚': 'ちかく',
      '過敏': 'かびん',
      '知覚過敏': 'ちかくかびん',
      // 数字の読み方（1-10）
      '1本': 'いっぽん',
      '2本': 'にほん',
      '3本': 'さんぼん',
      '4本': 'よんほん',
      '5本': 'ごほん',
      '6本': 'ろっぽん',
      '7本': 'ななほん',
      '8本': 'はっぽん',
      '9本': 'きゅうほん',
      '10本': 'じゅっぽん',
      '1つ': 'ひとつ',
      '2つ': 'ふたつ',
      '3つ': 'みっつ',
      '4つ': 'よっつ',
      '5つ': 'いつつ',
      '6つ': 'むっつ',
      '7つ': 'ななつ',
      '8つ': 'やっつ',
      '9つ': 'ここのつ',
      '10': 'じゅう',
      '1回': 'いっかい',
      '2回': 'にかい',
      '3回': 'さんかい',
      '4回': 'よんかい',
      '5回': 'ごかい',
      '6回': 'ろっかい',
      '7回': 'ななかい',
      '8回': 'はっかい',
      '9回': 'きゅうかい',
      '10回': 'じゅっかい',
      '1週間': 'いっしゅうかん',
      '2週間': 'にしゅうかん',
      '3週間': 'さんしゅうかん',
      '4週間': 'よんしゅうかん',
      '1ヶ月': 'いっかげつ',
      '2ヶ月': 'にかげつ',
      '3ヶ月': 'さんかげつ',
      '4ヶ月': 'よんかげつ',
      '5ヶ月': 'ごかげつ',
      '6ヶ月': 'ろっかげつ',
      // 薬品名
      'ロキソニン': 'ロキソニン',  // カタカナはそのまま
      'ボルタレン': 'ボルタレン',
      'カロナール': 'カロナール',
      'イブプロフェン': 'イブプロフェン',
      'アセトアミノフェン': 'アセトアミノフェン',
      'リドカイン': 'リドカイン',
      'キシロカイン': 'キシロカイン',
      'ペニシリン': 'ペニシリン',
      'アモキシシリン': 'アモキシシリン',
      'クラビット': 'クラビット',
      'ジスロマック': 'ジスロマック',
      // 日常生活の重要単語
      '食事': 'しょくじ',  // 「食事」を「しょくじ」に追加
      '食べ物': 'たべもの',
      '食べる': 'たべる',
      '飲み物': 'のみもの',
      '仕事': 'しごと',
      '睡眠': 'すいみん',
      '運動': 'うんどう',
      // 特殊な読み方
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
      '二十日': 'はつか'
    };
    
    // 特定の単語のみ置換（長い単語から優先的に処理）
    const sortedWords = Object.entries(difficultWords)
      .sort((a, b) => b[0].length - a[0].length);  // 長い単語からマッチ
    
    for (const [kanji, hiragana] of sortedWords) {
      processedTextForTTS = processedTextForTTS.replace(new RegExp(kanji, 'g'), hiragana);
    }
    */
    
    // Kuromoji.js使用時は数字変換も不要
    /*
    // 数字の処理（より詳細な変換）
    // 基本的な数字を日本語に変換
    const numberToJapanese: { [key: string]: string } = {
      '0': 'ゼロ', '1': 'いち', '2': 'に', '3': 'さん', '4': 'よん',
      '5': 'ご', '6': 'ろく', '7': 'なな', '8': 'はち', '9': 'きゅう',
      '10': 'じゅう', '11': 'じゅういち', '12': 'じゅうに',
      '20': 'にじゅう', '30': 'さんじゅう', '40': 'よんじゅう',
      '50': 'ごじゅう', '60': 'ろくじゅう', '70': 'ななじゅう',
      '80': 'はちじゅう', '90': 'きゅうじゅう', '100': 'ひゃく'
    };
    
    // 数字を変換（単独の数字のみ）
    Object.entries(numberToJapanese).forEach(([num, reading]) => {
      // 単語境界で囲まれた数字のみを変換
      const regex = new RegExp(`\\b${num}\\b(?![年月日時分秒])`, 'g');
      processedTextForTTS = processedTextForTTS.replace(regex, reading);
    });
    
    // 単位付き数字の処理
    processedTextForTTS = processedTextForTTS
      .replace(/(\d+)年/g, (match, num) => {
        const n = parseInt(num);
        if (n === 4) return 'よねん';
        return `${num}ねん`;
      })
      .replace(/(\d+)月(?!日)/g, (match, num) => {
        const n = parseInt(num);
        if (n === 4) return 'しがつ';
        if (n === 7) return 'しちがつ';
        if (n === 9) return 'くがつ';
        return `${num}がつ`;
      })
      .replace(/(\d+)日/g, (match, num) => {
        const n = parseInt(num);
        if (n === 1) return 'ついたち';
        if (n === 2) return 'ふつか';
        if (n === 3) return 'みっか';
        if (n === 4) return 'よっか';
        if (n === 5) return 'いつか';
        if (n === 6) return 'むいか';
        if (n === 7) return 'なのか';
        if (n === 8) return 'ようか';
        if (n === 9) return 'ここのか';
        if (n === 10) return 'とおか';
        if (n === 14) return 'じゅうよっか';
        if (n === 20) return 'はつか';
        if (n === 24) return 'にじゅうよっか';
        return `${num}にち`;
      })
      .replace(/(\d+)時/g, (match, num) => {
        const n = parseInt(num);
        if (n === 4) return 'よじ';
        if (n === 7) return 'しちじ';
        if (n === 9) return 'くじ';
        return `${num}じ`;
      })
      .replace(/(\d+)分/g, (match, num) => {
        const n = parseInt(num);
        if (n === 1) return 'いっぷん';
        if (n === 3) return 'さんぷん';
        if (n === 4) return 'よんぷん';
        if (n === 6) return 'ろっぷん';
        if (n === 8) return 'はっぷん';
        if (n === 10) return 'じゅっぷん';
        return `${num}ふん`;
      })
      .replace(/(\d+)秒/g, '$1びょう');
    */
    
    debugLog('Original text received for TTS processing');
    debugLog('Processed for TTS (Dictionary).');

    // 言語と感情に応じたvoice_settingsを設定
    let voiceSettings: any = language === 'ja' ? {
      stability: 0.65,  // 日本語はやや安定的に
      similarity_boost: 0.85,  // オリジナル音声に近づける
      style: 0.0,  // スタイルはニュートラルから始める
      use_speaker_boost: true
    } : {
      stability: 0.75,  // 英語はより安定的に
      similarity_boost: 0.75,  // 英語は標準的な設定
      style: 0.0,
      use_speaker_boost: true
    };

    // 感情処理用のテキスト変数
    let processedText = processedTextForTTS;

    // 感情パラメータの調整（ElevenLabsの推奨値に基づいて調整）
    switch(emotion) {
      case 'pain': // 痛みを感じている
        voiceSettings = {
          stability: 0.4,  // 適度な不安定さで痛みを表現
          similarity_boost: 0.75,  // オリジナル声を保ちつつ変化
          style: 0.5,  // 適度な感情表現
          use_speaker_boost: true
        };
        // 痛みの表現（文中のみ間を追加、文末には追加しない）
        // 文末以外の痛み表現に間を追加
        processedText = processedText
          .replace(/痛い(?!。|です|ます)/g, '痛い... ')  // 文末以外
          .replace(/いたい(?!。|です|ます)/g, 'いたい... ')  // 文末以外
          .replace(/つらい(?!。|です|ます)/g, 'つらい... ')  // 文末以外
          .replace(/辛い(?!。|です|ます)/g, '辛い... ')  // 文末以外
          // 句読点の後の間は最小限に
          .replace(/。/g, '。')
          .replace(/、/g, '、');
        break;
        
      case 'anxiety': // 不安
        voiceSettings = {
          stability: 0.5,  // やや不安定
          similarity_boost: 0.8,
          style: 0.3,  // 控えめな感情表現
          use_speaker_boost: true
        };
        // 不安の表現（文末のみ間を追加）
        processedText = processedText
          .replace(/でしょうか(?=。|$)/g, 'でしょうか...')  // 文末のみ
          .replace(/ですか(?=。|$)/g, 'ですか...')  // 文末のみ
          .replace(/心配(?!。|です|ます)/g, '心配')  // 間を削除
          .replace(/不安(?!。|です|ます)/g, '不安');  // 間を削除
        break;
        
      case 'relief': // 安堵
        voiceSettings = {
          stability: 0.75,  // 安定した落ち着いた声
          similarity_boost: 0.85,
          style: 0.1,  // 穏やかな表現
          use_speaker_boost: true
        };
        break;
        
      case 'confusion': // 困惑
        voiceSettings = {
          stability: 0.55,  // やや不安定
          similarity_boost: 0.8,
          style: 0.2,  // 控えめな感情表現
          use_speaker_boost: true
        };
        // 困惑の表現（適切な位置に間を追加）
        processedText = processedText
          .replace(/えーと(?=、)/g, 'えーと...')  // 読点の前のみ
          .replace(/うーん(?=、)/g, 'うーん...')  // 読点の前のみ
          .replace(/たぶん/g, 'たぶん')  // 間は不要
          .replace(/わからない/g, 'わからない');  // 間は不要
        break;
        
      case 'discomfort': // 不快感
        voiceSettings = {
          stability: 0.45,  // 不快感を表現
          similarity_boost: 0.75,
          style: 0.4,  // 適度な感情表現
          use_speaker_boost: true
        };
        break;
        
      default: // neutral
        // デフォルト設定を使用
        break;
    }

    // パラメータの範囲を確認（0.0〜1.0）
    voiceSettings.stability = Math.max(0, Math.min(1, voiceSettings.stability));
    voiceSettings.similarity_boost = Math.max(0, Math.min(1, voiceSettings.similarity_boost));
    voiceSettings.style = Math.max(0, Math.min(1, voiceSettings.style));

    debugLog(`Generating speech with emotion: ${emotion}`);
    debugLog('Voice settings configured');
    debugLog('Final text prepared for ElevenLabs');

    // ElevenLabs API呼び出し（ひらがなテキストを使用）
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: processedText,  // 感情処理済みテキストを使用
          model_id: 'eleven_turbo_v2_5',  // Turbo v2.5モデルで高速化
          voice_settings: voiceSettings,
          optimize_streaming_latency: 3,  // 最速のストリーミング最適化
          output_format: 'mp3_44100_128'  // 高品質設定
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ElevenLabs] API Error', {
        status: response.status,
        statusText: response.statusText,
        bodyPreview: errorText.slice(0, 200),
        selectedVoiceId,
        ...requestMeta,
      });
      return NextResponse.json(
        { error: `音声生成エラー: ${response.status}` },
        { status: response.status }
      );
    }

    // 音声データをBase64に変換
    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    
    debugLog('Speech generated successfully');
    if (isProduction) {
      console.log('[ElevenLabs] Speech generated', {
        audioBytes: audioBase64.length,
        ...requestMeta,
      });
    }

    return NextResponse.json({ 
      audio: audioBase64,
      format: 'mp3'
    });

  } catch (error) {
    console.error('[ElevenLabs] Unexpected error', {
      error,
    });
    return NextResponse.json(
      { error: 'エラーが発生しました' },
      { status: 500 }
    );
  }
}
