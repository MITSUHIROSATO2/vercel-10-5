import { useCallback, useRef, useState } from 'react';
import {
  estimateWordTimings,
  getCurrentPhoneme as getCurrentEnglishPhoneme,
  preprocessTextForTiming,
  type WordTiming
} from '@/lib/improvedEnglishLipSync';

interface DemoElevenLabsSpeechHook {
  playDemoAudio: (base64Audio: string, text: string) => Promise<void>;
  stopAudio: () => void;
  currentWord: string;
  currentPhoneme: string;
  audioLevel: number;
  isPlaying: boolean;
}

export function useDemoElevenLabsSpeech(): DemoElevenLabsSpeechHook {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const wordsRef = useRef<string[]>([]);
  const audioLevelRef = useRef(0);
  const englishWordTimingsRef = useRef<WordTiming[]>([]);
  const lastEnglishPhonemeRef = useRef<string>('');
  const lastEnglishWordRef = useRef<string>('');
  const isEnglishRef = useRef(false);

  const [currentWord, setCurrentWord] = useState('');
  const [currentPhoneme, setCurrentPhoneme] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsPlaying(false);
    setCurrentWord('');
    setCurrentPhoneme('');
    setAudioLevel(0);
    // audioLevelRefをリセットして次回の再生を初期状態から開始
    audioLevelRef.current = 0;
    englishWordTimingsRef.current = [];
    lastEnglishPhonemeRef.current = '';
    lastEnglishWordRef.current = '';
    isEnglishRef.current = false;
  }, []);

  const playDemoAudio = useCallback((base64Audio: string, text: string) => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // 既存の音声を停止
        stopAudio();

        // 初回と2回目以降で同じ動作を保証するため、refをリセット
        audioLevelRef.current = 0;
        wordsRef.current = [];
        englishWordTimingsRef.current = [];
        lastEnglishPhonemeRef.current = '';
        lastEnglishWordRef.current = '';
        setCurrentPhoneme('');
        const containsLatin = /[a-zA-Z]/.test(text);
        const containsJapanese = /[ぁ-んァ-ヶ一-龥]/.test(text);
        isEnglishRef.current = containsLatin && !containsJapanese;

        // オーディオ要素を作成
        const audio = new Audio();
        audio.preload = 'auto';
        audio.crossOrigin = 'anonymous';
        
        // Base64をBlobに変換
        const byteCharacters = atob(base64Audio);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(blob);
        
        audio.src = audioUrl;
        audioRef.current = audio;
        
        // メモリリークを防ぐため、URLを解放
        audio.addEventListener('loadend', () => {
          URL.revokeObjectURL(audioUrl);
        });
        
        // 音声を即座にロード開始
        audio.load();

        audio.onloadedmetadata = () => {
          if (isEnglishRef.current && audio.duration > 0) {
            const processed = preprocessTextForTiming(text);
            englishWordTimingsRef.current = estimateWordTimings(processed, audio.duration);
          }
        };

        // 英語版でも日本語版のリップシンク処理を使用
        // 全てのテキストを日本語処理と同じ方法で扱う
        const cleanText = text.replace(/([、。！？,!?])/g, ' $1 ');
        wordsRef.current = cleanText.split(/\s+/).filter(word => word.length > 0);
        
        // Web Audio APIのセットアップをスキップ（音声出力を優先）
        // リップシンクは音素ベースのシミュレーションで行う

        // 音声解析（本番と同じ）
        const analyzeAudio = () => {
          if (!audio.paused) {
            if (analyserRef.current) {
              // 本番と同じ周波数分析
              const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
              analyserRef.current.getByteFrequencyData(dataArray);
              
              // より精度の高い音声レベル計算（本番と同じ）
              const voiceRange = dataArray.slice(0, Math.floor(dataArray.length * 0.5));
              const average = voiceRange.reduce((sum, value) => sum + value, 0) / voiceRange.length;
              const normalizedLevel = Math.max(0, Math.min((average - 10) / 60, 1));
              const currentLevel = audioLevelRef.current || 0;
              const smoothedLevel = currentLevel * 0.4 + normalizedLevel * 0.6;
              audioLevelRef.current = smoothedLevel;
              setAudioLevel(Math.max(smoothedLevel, 0.15));
            } else {
              // 音素ベースの高品質リップシンクシミュレーション
              const currentTime = audio.currentTime;
              const duration = audio.duration;
              const progress = currentTime / duration;

              if (!isNaN(progress) && isEnglishRef.current) {
                if (duration > 0 && englishWordTimingsRef.current.length === 0) {
                  const processed = preprocessTextForTiming(text);
                  englishWordTimingsRef.current = estimateWordTimings(processed, duration);
                }

                if (englishWordTimingsRef.current.length > 0) {
                  const phonemeInfo = getCurrentEnglishPhoneme(englishWordTimingsRef.current, currentTime);
                  if (phonemeInfo) {
                    if (phonemeInfo.phoneme !== lastEnglishPhonemeRef.current) {
                      lastEnglishPhonemeRef.current = phonemeInfo.phoneme;
                      setCurrentPhoneme(phonemeInfo.phoneme);
                    }

                    let matchedWord = '';
                    for (const timing of englishWordTimingsRef.current) {
                      if (currentTime >= timing.startTime && currentTime <= timing.endTime) {
                        matchedWord = timing.word;
                        break;
                      }
                    }
                    if (matchedWord !== lastEnglishWordRef.current) {
                      lastEnglishWordRef.current = matchedWord;
                      setCurrentWord(matchedWord);
                    }

                    const targetLevel = Math.min(0.85, phonemeInfo.intensity * 0.8 + 0.08);
                    const currentLevel = audioLevelRef.current || 0;
                    const smoothedLevel = currentLevel * 0.7 + targetLevel * 0.3;
                    audioLevelRef.current = smoothedLevel;
                    setAudioLevel(Math.max(smoothedLevel, 0.15));

                    animationRef.current = requestAnimationFrame(analyzeAudio);
                    return;
                  }
                }
              }

              if (wordsRef.current.length > 0 && !isNaN(progress)) {
                // テキスト全体での現在位置を計算
                const totalText = wordsRef.current.join('');
                const totalChars = totalText.length;
                const currentCharIndex = Math.floor(progress * Math.max(totalChars, 1));

                // 現在の文字を取得
                let charCount = 0;
                let currentWord = '';
                let currentChar = '';

                for (const word of wordsRef.current) {
                  if (charCount + word.length > currentCharIndex) {
                    currentWord = word;
                    const wordCharIndex = Math.max(0, Math.min(word.length - 1, currentCharIndex - charCount));
                    currentChar = word[wordCharIndex] || word[0] || '';
                    break;
                  }
                  charCount += word.length;
                }

                // Always use Japanese lip-sync processing regardless of language
                // 英語版でも日本語版のリップシンク処理を使用
                let targetLevel = 0.2;

                const vowelMap: { [key: string]: number } = {
                    'あ': 0.6, 'ア': 0.6, 'a': 0.6,
                    'か': 0.7, 'が': 0.7, 'カ': 0.7, 'ガ': 0.7,
                    'さ': 0.65, 'ざ': 0.65, 'サ': 0.65, 'ザ': 0.65,
                    'た': 0.7, 'だ': 0.7, 'タ': 0.7, 'ダ': 0.7,
                    'な': 0.75, 'ナ': 0.75,
                    'は': 0.7, 'ば': 0.7, 'ぱ': 0.7, 'ハ': 0.7, 'バ': 0.7, 'パ': 0.7,
                    'ま': 0.6, 'マ': 0.6,
                    'や': 0.7, 'ヤ': 0.7,
                    'ら': 0.65, 'ラ': 0.65,
                    'わ': 0.7, 'ワ': 0.7,
                  
                  'い': 0.35, 'イ': 0.35, 'i': 0.35,
                  'き': 0.4, 'ぎ': 0.4, 'キ': 0.4, 'ギ': 0.4,
                  'し': 0.35, 'じ': 0.35, 'シ': 0.35, 'ジ': 0.35,
                  'ち': 0.4, 'ぢ': 0.4, 'チ': 0.4, 'ヂ': 0.4,
                  'に': 0.4, 'ニ': 0.4,
                  'ひ': 0.35, 'び': 0.35, 'ぴ': 0.35, 'ヒ': 0.35, 'ビ': 0.35, 'ピ': 0.35,
                  'み': 0.35, 'ミ': 0.35,
                  'り': 0.4, 'リ': 0.4,
                  
                  'う': 0, 'ウ': 0, 'u': 0,
                  'く': 0.25, 'ぐ': 0.25, 'ク': 0.25, 'グ': 0.25,
                  'す': 0, 'ず': 0, 'ス': 0, 'ズ': 0,
                  'つ': 0.25, 'づ': 0.25, 'ツ': 0.25, 'ヅ': 0.25,
                  'ぬ': 0.25, 'ヌ': 0.25,
                  'ふ': 0.2, 'ぶ': 0.2, 'ぷ': 0.2, 'フ': 0.2, 'ブ': 0.2, 'プ': 0.2,
                  'む': 0, 'ム': 0,
                  'ゆ': 0.25, 'ユ': 0.25,
                  'る': 0.25, 'ル': 0.25,
                  
                  'え': 0.6, 'エ': 0.6, 'e': 0.6,
                  'け': 0.55, 'げ': 0.55, 'ケ': 0.55, 'ゲ': 0.55,
                  'せ': 0.5, 'ぜ': 0.5, 'セ': 0.5, 'ゼ': 0.5,
                  'て': 0.55, 'で': 0.55, 'テ': 0.55, 'デ': 0.55,
                  'ね': 0.6, 'ネ': 0.6,
                  'へ': 0.55, 'べ': 0.55, 'ぺ': 0.55, 'ヘ': 0.55, 'ベ': 0.55, 'ペ': 0.55,
                  'め': 0.5, 'メ': 0.5,
                  'れ': 0.55, 'レ': 0.55,
                  
                  'お': 0.70, 'オ': 0.70, 'o': 0.70,
                  'こ': 0.65, 'ご': 0.65, 'コ': 0.65, 'ゴ': 0.65,
                  'そ': 0.6, 'ぞ': 0.6, 'ソ': 0.6, 'ゾ': 0.6,
                  'と': 0.65, 'ど': 0.65, 'ト': 0.65, 'ド': 0.65,
                  'の': 0.7, 'ノ': 0.7,
                  'ほ': 0.65, 'ぼ': 0.65, 'ぽ': 0.65, 'ホ': 0.65, 'ボ': 0.65, 'ポ': 0.65,
                  'も': 0.6, 'モ': 0.6,
                  'よ': 0.65, 'ヨ': 0.65,
                  'ろ': 0.65, 'ロ': 0.65,
                  'を': 0.7, 'ヲ': 0.7,
                  
                  'ん': 0, 'ン': 0, 'n': 0,
                  '、': 0, '。': 0, ' ': 0,

                  // English consonants
                  'm': 0, 'M': 0,  // lips closed
                  'p': 0, 'P': 0,  // lips closed then open
                  'b': 0, 'B': 0,  // lips closed then open
                  'f': 0.2, 'F': 0.2,  // lower lip touches upper teeth
                  'v': 0.2, 'V': 0.2,  // lower lip touches upper teeth
                  'w': 0.3, 'W': 0.3,  // lips rounded
                  't': 0.3, 'T': 0.3,  // tongue touches alveolar ridge
                  'd': 0.3, 'D': 0.3,  // tongue touches alveolar ridge
                  's': 0.1, 'S': 0.1,  // teeth close together
                  'z': 0.1, 'Z': 0.1,  // teeth close together
                  'l': 0.4, 'L': 0.4,  // tongue touches alveolar ridge, mouth open
                  'r': 0.4, 'R': 0.4,  // tongue curled back
                  'k': 0.3, 'K': 0.3,  // back of tongue raised
                  'g': 0.3, 'G': 0.3,  // back of tongue raised
                  'h': 0.5, 'H': 0.5,  // mouth open
                  'c': 0.3, 'C': 0.3,  // varies by context
                  'q': 0.3, 'Q': 0.3,  // like k
                  'x': 0.2, 'X': 0.2,  // like ks
                  'y': 0.4, 'Y': 0.4,  // like i
                  'j': 0.3, 'J': 0.3,  // like dʒ
                };

                // 文字に対応する音声レベルを取得
                targetLevel = vowelMap[currentChar] || 0.3;

                // ランダムな変動を追加（テキストと文字位置でシード化して一貫性を保つ）
                const seed = text.length + currentCharIndex;
                const pseudoRandom = Math.sin(seed * 12.9898) * 43758.5453;
                const variation = ((pseudoRandom - Math.floor(pseudoRandom)) - 0.5) * 0.05;
                targetLevel = Math.max(0, Math.min(1, targetLevel + variation));

                // スムーズな遷移（本番と同じ）
                const currentLevel = audioLevelRef.current || 0;
                const smoothingFactor = 0.1; // より速い反応
                const smoothedLevel = currentLevel * (1 - smoothingFactor) + targetLevel * smoothingFactor;

                // 微細な振動（プログレスベースで一貫性を保つ）
                const progressTime = progress * 100;
                const vibration = Math.sin(progressTime) * 0.015 + Math.sin(progressTime * 2.3) * 0.01;

                const finalLevel = Math.max(0, Math.min(1, smoothedLevel + vibration));

                audioLevelRef.current = smoothedLevel;
                setAudioLevel(finalLevel);

                // 現在の単語も更新
                setCurrentWord(currentWord);
                lastEnglishWordRef.current = '';
                lastEnglishPhonemeRef.current = '';

                const plosives = ['か', 'き', 'く', 'け', 'こ', 'が', 'ぎ', 'ぐ', 'げ', 'ご', 'た', 'て', 'と', 'だ', 'で', 'ど', 'ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'];
                const fricatives = ['さ', 'し', 'す', 'せ', 'そ', 'ざ', 'じ', 'ず', 'ぜ', 'ぞ', 'は', 'ひ', 'ふ', 'へ', 'ほ'];
                const nasals = ['な', 'に', 'ぬ', 'ね', 'の', 'ま', 'み', 'む', 'め', 'も', 'ん'];
                const liquids = ['ら', 'り', 'る', 'れ', 'ろ', 'わ', 'を'];
                const semivowels = ['や', 'ゆ', 'よ'];

                if (plosives.includes(currentChar[0])) {
                  setCurrentPhoneme('plosive:' + currentChar);
                } else if (fricatives.includes(currentChar[0])) {
                  setCurrentPhoneme('fricative:' + currentChar);
                } else if (nasals.includes(currentChar[0])) {
                  setCurrentPhoneme('nasal:' + currentChar);
                } else if (liquids.includes(currentChar[0])) {
                  setCurrentPhoneme('liquid:' + currentChar);
                } else if (semivowels.includes(currentChar[0])) {
                  setCurrentPhoneme('semivowel:' + currentChar);
                } else if (currentChar === '、' || currentChar === '。') {
                  setCurrentPhoneme('pause');
                } else {
                  setCurrentPhoneme('vowel:' + currentChar);
                }
              } else {
                setAudioLevel(0);
                setCurrentWord('');
                setCurrentPhoneme('');
              }
            }
            
            animationRef.current = requestAnimationFrame(analyzeAudio);
          }
        };

        // 再生開始時の処理
        audio.onplay = () => {
          analyzeAudio();
        };

        // 再生終了
        audio.onended = () => {
          setIsPlaying(false);
          setCurrentWord('');
          setAudioLevel(0);
          
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
          }
          
          resolve();
        };

        // エラーハンドリング
        audio.onerror = (error) => {
          console.error('Audio playback error:', error);
          setIsPlaying(false);
          reject(new Error('Audio playback failed'));
        };

        // 音声を再生
        try {
          // 音声がロードされるまで待機
          await new Promise((resolveLoad, rejectLoad) => {
            if (audio.readyState >= 2) {
              resolveLoad(true);
            } else {
              audio.oncanplay = () => resolveLoad(true);
              audio.onerror = () => rejectLoad(new Error('Audio load error'));
              setTimeout(() => rejectLoad(new Error('Audio load timeout')), 3000);
            }
          });

          // 英語版でも日本語版のリップシンク処理を使用するため、英語用のタイミング計算は不要
          
          // 音声要素の設定
          audio.muted = false;
          audio.volume = 0.8;
          
          // リップシンクを先行させるため、先にスピーキング状態を設定
          setIsPlaying(true);
          
          // 音声再生を50ms遅延
          await new Promise(r => setTimeout(r, 50));
          
          // 再生を試みる
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            await playPromise
              .then(() => {
                console.log('Demo audio playback started');
              })
              .catch((playError) => {
                throw playError;
              });
          }
        } catch (playError: any) {
          console.error('Demo playback error:', playError);
          setIsPlaying(false);
          reject(playError);
        }
      } catch (error) {
        console.error('Demo audio processing error:', error);
        setIsPlaying(false);
        reject(error);
      }
    });
  }, [stopAudio]);

  return {
    playDemoAudio,
    stopAudio,
    currentWord,
    currentPhoneme,
    audioLevel,
    isPlaying
  };
}
