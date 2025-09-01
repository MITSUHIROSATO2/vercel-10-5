import { useEffect, useRef, useState, useCallback } from 'react';

interface PhonemeData {
  phoneme: string;
  timestamp: number;
  duration: number;
}

interface LipSyncResult {
  currentPhoneme: string;
  mouthShape: {
    width: number;
    height: number;
    roundness: number;
  };
  jawPosition: number;
  tonguePosition: {
    x: number;
    y: number;
    z: number;
  };
}

// 日本語の音素マッピング（より詳細）
const JAPANESE_PHONEME_MAP: { [key: string]: any } = {
  // 母音
  'あ': { width: 0.24, height: 0.10, roundness: 0.5, jaw: 0.8, tongue: { x: 0, y: -0.02, z: 0 } },
  'い': { width: 0.28, height: 0.04, roundness: 0.2, jaw: 0.2, tongue: { x: 0, y: 0.02, z: 0.02 } },
  'う': { width: 0.14, height: 0.06, roundness: 0.8, jaw: 0.3, tongue: { x: 0, y: 0, z: -0.02 } },
  'え': { width: 0.22, height: 0.07, roundness: 0.3, jaw: 0.5, tongue: { x: 0, y: 0.01, z: 0.01 } },
  'お': { width: 0.16, height: 0.08, roundness: 0.7, jaw: 0.6, tongue: { x: 0, y: -0.01, z: -0.01 } },
  
  // カ行
  'か': { width: 0.20, height: 0.06, roundness: 0.4, jaw: 0.4, tongue: { x: 0, y: 0.02, z: -0.03 } },
  'き': { width: 0.26, height: 0.04, roundness: 0.2, jaw: 0.2, tongue: { x: 0, y: 0.03, z: 0.02 } },
  'く': { width: 0.15, height: 0.05, roundness: 0.7, jaw: 0.3, tongue: { x: 0, y: 0.01, z: -0.03 } },
  'け': { width: 0.21, height: 0.06, roundness: 0.3, jaw: 0.4, tongue: { x: 0, y: 0.02, z: 0.01 } },
  'こ': { width: 0.17, height: 0.07, roundness: 0.6, jaw: 0.5, tongue: { x: 0, y: 0, z: -0.02 } },
  
  // サ行
  'さ': { width: 0.19, height: 0.05, roundness: 0.3, jaw: 0.3, tongue: { x: 0, y: 0.01, z: 0.03 } },
  'し': { width: 0.25, height: 0.03, roundness: 0.2, jaw: 0.1, tongue: { x: 0, y: 0.03, z: 0.03 } },
  'す': { width: 0.14, height: 0.04, roundness: 0.6, jaw: 0.2, tongue: { x: 0, y: 0.02, z: 0.02 } },
  'せ': { width: 0.20, height: 0.05, roundness: 0.3, jaw: 0.3, tongue: { x: 0, y: 0.02, z: 0.02 } },
  'そ': { width: 0.16, height: 0.06, roundness: 0.5, jaw: 0.4, tongue: { x: 0, y: 0.01, z: 0 } },
  
  // タ行
  'た': { width: 0.18, height: 0.05, roundness: 0.4, jaw: 0.3, tongue: { x: 0, y: 0.03, z: 0.04 } },
  'ち': { width: 0.24, height: 0.03, roundness: 0.2, jaw: 0.1, tongue: { x: 0, y: 0.04, z: 0.04 } },
  'つ': { width: 0.13, height: 0.04, roundness: 0.7, jaw: 0.2, tongue: { x: 0, y: 0.02, z: 0.03 } },
  'て': { width: 0.20, height: 0.05, roundness: 0.3, jaw: 0.3, tongue: { x: 0, y: 0.03, z: 0.03 } },
  'と': { width: 0.16, height: 0.06, roundness: 0.6, jaw: 0.4, tongue: { x: 0, y: 0.01, z: 0.01 } },
  
  // ナ行
  'な': { width: 0.18, height: 0.05, roundness: 0.4, jaw: 0.4, tongue: { x: 0, y: 0.02, z: 0.03 } },
  'に': { width: 0.24, height: 0.04, roundness: 0.2, jaw: 0.2, tongue: { x: 0, y: 0.03, z: 0.03 } },
  'ぬ': { width: 0.14, height: 0.05, roundness: 0.6, jaw: 0.3, tongue: { x: 0, y: 0.01, z: 0 } },
  'ね': { width: 0.20, height: 0.06, roundness: 0.3, jaw: 0.4, tongue: { x: 0, y: 0.02, z: 0.02 } },
  'の': { width: 0.16, height: 0.07, roundness: 0.5, jaw: 0.5, tongue: { x: 0, y: 0, z: -0.01 } },
  
  // ハ行
  'は': { width: 0.20, height: 0.06, roundness: 0.4, jaw: 0.5, tongue: { x: 0, y: -0.01, z: 0 } },
  'ひ': { width: 0.26, height: 0.04, roundness: 0.2, jaw: 0.2, tongue: { x: 0, y: 0.02, z: 0.02 } },
  'ふ': { width: 0.12, height: 0.05, roundness: 0.8, jaw: 0.2, tongue: { x: 0, y: 0, z: -0.02 } },
  'へ': { width: 0.21, height: 0.06, roundness: 0.3, jaw: 0.4, tongue: { x: 0, y: 0.01, z: 0.01 } },
  'ほ': { width: 0.16, height: 0.07, roundness: 0.6, jaw: 0.5, tongue: { x: 0, y: -0.01, z: -0.01 } },
  
  // マ行
  'ま': { width: 0.12, height: 0.02, roundness: 0.5, jaw: 0.1, tongue: { x: 0, y: 0, z: 0 } },
  'み': { width: 0.14, height: 0.02, roundness: 0.3, jaw: 0.1, tongue: { x: 0, y: 0.01, z: 0.01 } },
  'む': { width: 0.10, height: 0.03, roundness: 0.8, jaw: 0.1, tongue: { x: 0, y: 0, z: -0.01 } },
  'め': { width: 0.16, height: 0.04, roundness: 0.3, jaw: 0.2, tongue: { x: 0, y: 0.01, z: 0.01 } },
  'も': { width: 0.12, height: 0.05, roundness: 0.7, jaw: 0.3, tongue: { x: 0, y: 0, z: -0.01 } },
  
  // ヤ行
  'や': { width: 0.22, height: 0.08, roundness: 0.4, jaw: 0.6, tongue: { x: 0, y: 0.01, z: 0 } },
  'ゆ': { width: 0.15, height: 0.06, roundness: 0.7, jaw: 0.4, tongue: { x: 0, y: 0, z: -0.01 } },
  'よ': { width: 0.17, height: 0.07, roundness: 0.6, jaw: 0.5, tongue: { x: 0, y: 0, z: -0.01 } },
  
  // ラ行
  'ら': { width: 0.19, height: 0.06, roundness: 0.4, jaw: 0.4, tongue: { x: 0, y: 0.03, z: 0.02 } },
  'り': { width: 0.25, height: 0.04, roundness: 0.2, jaw: 0.2, tongue: { x: 0, y: 0.04, z: 0.03 } },
  'る': { width: 0.15, height: 0.05, roundness: 0.6, jaw: 0.3, tongue: { x: 0, y: 0.03, z: 0.01 } },
  'れ': { width: 0.21, height: 0.06, roundness: 0.3, jaw: 0.4, tongue: { x: 0, y: 0.03, z: 0.02 } },
  'ろ': { width: 0.17, height: 0.07, roundness: 0.5, jaw: 0.5, tongue: { x: 0, y: 0.02, z: 0 } },
  
  // ワ行
  'わ': { width: 0.20, height: 0.08, roundness: 0.5, jaw: 0.6, tongue: { x: 0, y: 0, z: 0 } },
  'を': { width: 0.16, height: 0.07, roundness: 0.6, jaw: 0.5, tongue: { x: 0, y: 0, z: -0.01 } },
  'ん': { width: 0.18, height: 0.03, roundness: 0.4, jaw: 0.1, tongue: { x: 0, y: 0, z: 0 } },
  
  // 濁音・半濁音
  'が': { width: 0.20, height: 0.07, roundness: 0.4, jaw: 0.5, tongue: { x: 0, y: 0.01, z: -0.02 } },
  'ぎ': { width: 0.26, height: 0.05, roundness: 0.2, jaw: 0.3, tongue: { x: 0, y: 0.02, z: 0.02 } },
  'ぐ': { width: 0.15, height: 0.06, roundness: 0.7, jaw: 0.4, tongue: { x: 0, y: 0, z: -0.02 } },
  'げ': { width: 0.21, height: 0.07, roundness: 0.3, jaw: 0.5, tongue: { x: 0, y: 0.01, z: 0.01 } },
  'ご': { width: 0.17, height: 0.08, roundness: 0.6, jaw: 0.6, tongue: { x: 0, y: -0.01, z: -0.01 } },
  
  // デフォルト
  'default': { width: 0.20, height: 0.05, roundness: 0.4, jaw: 0.3, tongue: { x: 0, y: 0, z: 0 } }
};

export function useAdvancedLipSync(
  text: string,
  audioElement: HTMLAudioElement | null,
  isPlaying: boolean
): LipSyncResult {
  const [currentPhoneme, setCurrentPhoneme] = useState<string>('');
  const [mouthShape, setMouthShape] = useState({ width: 0.2, height: 0.05, roundness: 0.4 });
  const [jawPosition, setJawPosition] = useState(0.3);
  const [tonguePosition, setTonguePosition] = useState({ x: 0, y: 0, z: 0 });
  
  const phonemeQueueRef = useRef<PhonemeData[]>([]);
  const animationFrameRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(0);
  
  // テキストから音素列を生成
  const generatePhonemeSequence = useCallback((text: string): PhonemeData[] => {
    const phonemes: PhonemeData[] = [];
    let timestamp = 0;
    
    // ひらがなに変換（実際のアプリケーションでは、より高度な変換が必要）
    const hiraganaText = text; // ここでは仮にすでにひらがなと仮定
    
    for (let i = 0; i < hiraganaText.length; i++) {
      const char = hiraganaText[i];
      const phonemeData = JAPANESE_PHONEME_MAP[char] || JAPANESE_PHONEME_MAP['default'];
      
      // 音素の継続時間を計算（文字によって調整）
      let duration = 100; // 基本の継続時間（ミリ秒）
      
      // 母音は長め
      if ('あいうえお'.includes(char)) {
        duration = 150;
      }
      // 撥音「ん」は長め
      else if (char === 'ん') {
        duration = 120;
      }
      // 促音「っ」の処理
      else if (char === 'っ') {
        duration = 50;
      }
      
      phonemes.push({
        phoneme: char,
        timestamp: timestamp,
        duration: duration
      });
      
      timestamp += duration;
    }
    
    return phonemes;
  }, []);
  
  // 音素に基づいて口の形を更新
  const updateMouthFromPhoneme = useCallback((phoneme: string, audioLevel: number = 0) => {
    const phonemeData = JAPANESE_PHONEME_MAP[phoneme] || JAPANESE_PHONEME_MAP['default'];
    
    // 音声レベルに基づいて口の開き具合を調整
    const levelMultiplier = 0.8 + audioLevel * 0.4;
    
    setMouthShape({
      width: phonemeData.width,
      height: phonemeData.height * levelMultiplier,
      roundness: phonemeData.roundness
    });
    
    setJawPosition(phonemeData.jaw * levelMultiplier);
    setTonguePosition(phonemeData.tongue);
    setCurrentPhoneme(phoneme);
  }, []);
  
  // アニメーションループ
  const animate = useCallback(() => {
    if (!isPlaying || !audioElement) {
      return;
    }
    
    const currentTime = audioElement.currentTime * 1000; // ミリ秒に変換
    
    // 現在の音素を見つける
    const currentPhonemeData = phonemeQueueRef.current.find(
      p => p.timestamp <= currentTime && p.timestamp + p.duration > currentTime
    );
    
    if (currentPhonemeData) {
      // 音声解析から音量レベルを取得（ここでは仮の値）
      const audioLevel = 0.5; // 実際のアプリケーションでは Web Audio API から取得
      
      updateMouthFromPhoneme(currentPhonemeData.phoneme, audioLevel);
    } else {
      // デフォルトの口の形に戻す
      updateMouthFromPhoneme('default', 0);
    }
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isPlaying, audioElement, updateMouthFromPhoneme]);
  
  // 再生開始時に音素列を生成
  useEffect(() => {
    if (isPlaying && text) {
      phonemeQueueRef.current = generatePhonemeSequence(text);
      animate();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // デフォルトの口の形に戻す
      updateMouthFromPhoneme('default', 0);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, text, generatePhonemeSequence, animate, updateMouthFromPhoneme]);
  
  return {
    currentPhoneme,
    mouthShape,
    jawPosition,
    tonguePosition
  };
}

// ひらがな変換用のユーティリティ関数（簡易版）
export function toHiragana(text: string): string {
  // 実際のアプリケーションでは、kuromoji.js などのライブラリを使用
  // ここでは簡易的な変換のみ
  const katakanaToHiragana: { [key: string]: string } = {
    'ア': 'あ', 'イ': 'い', 'ウ': 'う', 'エ': 'え', 'オ': 'お',
    'カ': 'か', 'キ': 'き', 'ク': 'く', 'ケ': 'け', 'コ': 'こ',
    'サ': 'さ', 'シ': 'し', 'ス': 'す', 'セ': 'せ', 'ソ': 'そ',
    'タ': 'た', 'チ': 'ち', 'ツ': 'つ', 'テ': 'て', 'ト': 'と',
    'ナ': 'な', 'ニ': 'に', 'ヌ': 'ぬ', 'ネ': 'ね', 'ノ': 'の',
    'ハ': 'は', 'ヒ': 'ひ', 'フ': 'ふ', 'ヘ': 'へ', 'ホ': 'ほ',
    'マ': 'ま', 'ミ': 'み', 'ム': 'む', 'メ': 'め', 'モ': 'も',
    'ヤ': 'や', 'ユ': 'ゆ', 'ヨ': 'よ',
    'ラ': 'ら', 'リ': 'り', 'ル': 'る', 'レ': 'れ', 'ロ': 'ろ',
    'ワ': 'わ', 'ヲ': 'を', 'ン': 'ん',
  };
  
  return text.split('').map(char => katakanaToHiragana[char] || char).join('');
}