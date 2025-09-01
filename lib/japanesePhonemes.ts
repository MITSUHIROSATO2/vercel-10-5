// 日本語の音素と口の形のマッピング
export interface JapanesePhoneme {
  phoneme: string;
  mouthShape: {
    jawOpen: number;      // 顎の開き具合 (0-1)
    lipRounding: number;  // 唇の丸み (0-1)
    lipWidth: number;     // 唇の横幅 (0-1)
    tonguePosition: number; // 舌の位置 (0-1)
    teethVisible: number;  // 歯の見え具合 (0-1)
  };
  morphTargets?: {
    [key: string]: number;
  };
}

// 日本語の母音
const vowels: { [key: string]: JapanesePhoneme } = {
  'あ': {
    phoneme: 'a',
    mouthShape: {
      jawOpen: 0.8,      // 大きく開く
      lipRounding: 0,    // 丸めない
      lipWidth: 0.6,     // 中程度の幅
      tonguePosition: 0.3, // 舌は下
      teethVisible: 0.3
    },
    morphTargets: {
      'A25_Jaw_Open': 0.8,
      'Mouth_Open': 0.7,
      'V_Open': 0.6
    }
  },
  'い': {
    phoneme: 'i',
    mouthShape: {
      jawOpen: 0.2,      // ほとんど閉じる
      lipRounding: 0,    // 丸めない
      lipWidth: 1.0,     // 横に広げる
      tonguePosition: 0.8, // 舌は上前方
      teethVisible: 0.8   // 歯が見える
    },
    morphTargets: {
      'A25_Jaw_Open': 0.2,
      'Mouth_Smile_Left': 0.3,
      'Mouth_Smile_Right': 0.3,
      'V_Dental_Lip': 0.4
    }
  },
  'う': {
    phoneme: 'u',
    mouthShape: {
      jawOpen: 0.3,      // 少し開く
      lipRounding: 0.9,  // 強く丸める
      lipWidth: 0.2,     // 狭める
      tonguePosition: 0.6, // 舌は後方
      teethVisible: 0
    },
    morphTargets: {
      'A25_Jaw_Open': 0.3,
      'Mouth_Pucker': 0.7,
      'V_Lip_Funnel': 0.6
    }
  },
  'え': {
    phoneme: 'e',
    mouthShape: {
      jawOpen: 0.4,      // 中程度に開く
      lipRounding: 0,    // 丸めない
      lipWidth: 0.8,     // やや広げる
      tonguePosition: 0.6, // 舌は中間
      teethVisible: 0.5
    },
    morphTargets: {
      'A25_Jaw_Open': 0.4,
      'Mouth_Open': 0.3,
      'Mouth_Smile_Left': 0.2,
      'Mouth_Smile_Right': 0.2
    }
  },
  'お': {
    phoneme: 'o',
    mouthShape: {
      jawOpen: 0.5,      // 中程度に開く
      lipRounding: 0.7,  // 丸める
      lipWidth: 0.4,     // 少し狭める
      tonguePosition: 0.4, // 舌は後方
      teethVisible: 0.1
    },
    morphTargets: {
      'A25_Jaw_Open': 0.5,
      'Mouth_Pucker': 0.4,
      'V_Open': 0.3
    }
  },
  'ん': {
    phoneme: 'n',
    mouthShape: {
      jawOpen: 0.1,      // ほぼ閉じる
      lipRounding: 0.2,  // わずかに丸める
      lipWidth: 0.5,     // 中間
      tonguePosition: 0.5, // 舌は上に接触
      teethVisible: 0
    },
    morphTargets: {
      'A25_Jaw_Open': 0.1,
      'Mouth_Close': 0.8
    }
  }
};

// 子音と母音の組み合わせ
const consonants: { [key: string]: Partial<JapanesePhoneme> } = {
  'か': { phoneme: 'ka', mouthShape: { ...vowels['あ'].mouthShape, jawOpen: 0.7 } },
  'き': { phoneme: 'ki', mouthShape: { ...vowels['い'].mouthShape, jawOpen: 0.25 } },
  'く': { phoneme: 'ku', mouthShape: { ...vowels['う'].mouthShape, jawOpen: 0.35 } },
  'け': { phoneme: 'ke', mouthShape: { ...vowels['え'].mouthShape, jawOpen: 0.45 } },
  'こ': { phoneme: 'ko', mouthShape: { ...vowels['お'].mouthShape, jawOpen: 0.55 } },
  
  'さ': { phoneme: 'sa', mouthShape: { ...vowels['あ'].mouthShape, teethVisible: 0.6 } },
  'し': { phoneme: 'shi', mouthShape: { ...vowels['い'].mouthShape, lipRounding: 0.3 } },
  'す': { phoneme: 'su', mouthShape: { ...vowels['う'].mouthShape, teethVisible: 0.3 } },
  'せ': { phoneme: 'se', mouthShape: { ...vowels['え'].mouthShape, teethVisible: 0.6 } },
  'そ': { phoneme: 'so', mouthShape: { ...vowels['お'].mouthShape, teethVisible: 0.2 } },
  
  'た': { phoneme: 'ta', mouthShape: { ...vowels['あ'].mouthShape, tonguePosition: 0.7 } },
  'ち': { phoneme: 'chi', mouthShape: { ...vowels['い'].mouthShape, tonguePosition: 0.9 } },
  'つ': { phoneme: 'tsu', mouthShape: { ...vowels['う'].mouthShape, teethVisible: 0.4 } },
  'て': { phoneme: 'te', mouthShape: { ...vowels['え'].mouthShape, tonguePosition: 0.7 } },
  'と': { phoneme: 'to', mouthShape: { ...vowels['お'].mouthShape, tonguePosition: 0.6 } },
  
  'な': { phoneme: 'na', mouthShape: { ...vowels['あ'].mouthShape, tonguePosition: 0.8 } },
  'に': { phoneme: 'ni', mouthShape: { ...vowels['い'].mouthShape, tonguePosition: 0.9 } },
  'ぬ': { phoneme: 'nu', mouthShape: { ...vowels['う'].mouthShape, tonguePosition: 0.8 } },
  'ね': { phoneme: 'ne', mouthShape: { ...vowels['え'].mouthShape, tonguePosition: 0.8 } },
  'の': { phoneme: 'no', mouthShape: { ...vowels['お'].mouthShape, tonguePosition: 0.7 } },
  
  'は': { phoneme: 'ha', mouthShape: { ...vowels['あ'].mouthShape, jawOpen: 0.9 } },
  'ひ': { phoneme: 'hi', mouthShape: { ...vowels['い'].mouthShape, jawOpen: 0.3 } },
  'ふ': { phoneme: 'fu', mouthShape: { lipRounding: 0.5, jawOpen: 0.2, lipWidth: 0.3, tonguePosition: 0.4, teethVisible: 0.1 } },
  'へ': { phoneme: 'he', mouthShape: { ...vowels['え'].mouthShape, jawOpen: 0.5 } },
  'ほ': { phoneme: 'ho', mouthShape: { ...vowels['お'].mouthShape, jawOpen: 0.6 } },
  
  'ま': { phoneme: 'ma', mouthShape: { ...vowels['あ'].mouthShape, jawOpen: 0.6 } },
  'み': { phoneme: 'mi', mouthShape: { ...vowels['い'].mouthShape, jawOpen: 0.2 } },
  'む': { phoneme: 'mu', mouthShape: { ...vowels['う'].mouthShape, jawOpen: 0.2 } },
  'め': { phoneme: 'me', mouthShape: { ...vowels['え'].mouthShape, jawOpen: 0.35 } },
  'も': { phoneme: 'mo', mouthShape: { ...vowels['お'].mouthShape, jawOpen: 0.4 } },
  
  'や': { phoneme: 'ya', mouthShape: { ...vowels['あ'].mouthShape, jawOpen: 0.7 } },
  'ゆ': { phoneme: 'yu', mouthShape: { ...vowels['う'].mouthShape, jawOpen: 0.4 } },
  'よ': { phoneme: 'yo', mouthShape: { ...vowels['お'].mouthShape, jawOpen: 0.5 } },
  
  'ら': { phoneme: 'ra', mouthShape: { ...vowels['あ'].mouthShape, tonguePosition: 0.6 } },
  'り': { phoneme: 'ri', mouthShape: { ...vowels['い'].mouthShape, tonguePosition: 0.7 } },
  'る': { phoneme: 'ru', mouthShape: { ...vowels['う'].mouthShape, tonguePosition: 0.6 } },
  'れ': { phoneme: 're', mouthShape: { ...vowels['え'].mouthShape, tonguePosition: 0.6 } },
  'ろ': { phoneme: 'ro', mouthShape: { ...vowels['お'].mouthShape, tonguePosition: 0.5 } },
  
  'わ': { phoneme: 'wa', mouthShape: { ...vowels['あ'].mouthShape, lipRounding: 0.2 } },
  'を': { phoneme: 'wo', mouthShape: { ...vowels['お'].mouthShape, jawOpen: 0.4 } },
};

// 濁音・半濁音
const dakuten: { [key: string]: Partial<JapanesePhoneme> } = {
  'が': { phoneme: 'ga', mouthShape: { ...consonants['か']!.mouthShape! } },
  'ぎ': { phoneme: 'gi', mouthShape: { ...consonants['き']!.mouthShape! } },
  'ぐ': { phoneme: 'gu', mouthShape: { ...consonants['く']!.mouthShape! } },
  'げ': { phoneme: 'ge', mouthShape: { ...consonants['け']!.mouthShape! } },
  'ご': { phoneme: 'go', mouthShape: { ...consonants['こ']!.mouthShape! } },
  
  'ざ': { phoneme: 'za', mouthShape: { ...consonants['さ']!.mouthShape! } },
  'じ': { phoneme: 'ji', mouthShape: { ...consonants['し']!.mouthShape! } },
  'ず': { phoneme: 'zu', mouthShape: { ...consonants['す']!.mouthShape! } },
  'ぜ': { phoneme: 'ze', mouthShape: { ...consonants['せ']!.mouthShape! } },
  'ぞ': { phoneme: 'zo', mouthShape: { ...consonants['そ']!.mouthShape! } },
  
  'だ': { phoneme: 'da', mouthShape: { ...consonants['た']!.mouthShape! } },
  'ぢ': { phoneme: 'ji', mouthShape: { ...consonants['ち']!.mouthShape! } },
  'づ': { phoneme: 'zu', mouthShape: { ...consonants['つ']!.mouthShape! } },
  'で': { phoneme: 'de', mouthShape: { ...consonants['て']!.mouthShape! } },
  'ど': { phoneme: 'do', mouthShape: { ...consonants['と']!.mouthShape! } },
  
  'ば': { phoneme: 'ba', mouthShape: { ...consonants['は']!.mouthShape!, jawOpen: 0.7 } },
  'び': { phoneme: 'bi', mouthShape: { ...consonants['ひ']!.mouthShape!, jawOpen: 0.2 } },
  'ぶ': { phoneme: 'bu', mouthShape: { ...consonants['ふ']!.mouthShape!, jawOpen: 0.3 } },
  'べ': { phoneme: 'be', mouthShape: { ...consonants['へ']!.mouthShape!, jawOpen: 0.4 } },
  'ぼ': { phoneme: 'bo', mouthShape: { ...consonants['ほ']!.mouthShape!, jawOpen: 0.5 } },
  
  'ぱ': { phoneme: 'pa', mouthShape: { ...consonants['は']!.mouthShape!, jawOpen: 0.6, lipRounding: 0.1 } },
  'ぴ': { phoneme: 'pi', mouthShape: { ...consonants['ひ']!.mouthShape!, jawOpen: 0.15, lipRounding: 0.1 } },
  'ぷ': { phoneme: 'pu', mouthShape: { ...consonants['ふ']!.mouthShape!, jawOpen: 0.25, lipRounding: 0.8 } },
  'ぺ': { phoneme: 'pe', mouthShape: { ...consonants['へ']!.mouthShape!, jawOpen: 0.35, lipRounding: 0.1 } },
  'ぽ': { phoneme: 'po', mouthShape: { ...consonants['ほ']!.mouthShape!, jawOpen: 0.45, lipRounding: 0.6 } },
};

// すべての音素を結合
export const japanesePhonemesMap: { [key: string]: JapanesePhoneme } = {
  ...vowels,
  ...Object.entries(consonants).reduce((acc, [key, value]) => ({
    ...acc,
    [key]: { ...value, morphTargets: vowels[key[0]] ? vowels[key[0]].morphTargets : {} }
  }), {}),
  ...Object.entries(dakuten).reduce((acc, [key, value]) => ({
    ...acc,
    [key]: { ...value, morphTargets: {} }
  }), {}),
} as { [key: string]: JapanesePhoneme };

// 文字から音素を取得
export function getJapanesePhoneme(char: string): JapanesePhoneme | null {
  return japanesePhonemesMap[char] || null;
}

// デフォルトの口の形
export const defaultMouthShape: JapanesePhoneme = {
  phoneme: 'neutral',
  mouthShape: {
    jawOpen: 0.05,
    lipRounding: 0.1,
    lipWidth: 0.5,
    tonguePosition: 0.5,
    teethVisible: 0
  }
};