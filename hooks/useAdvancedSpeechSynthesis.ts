import { useCallback, useRef, useState } from 'react';

interface AdvancedSpeechSynthesisHook {
  speak: (text: string, onEnd?: () => void, onViseme?: (viseme: string) => void) => void;
  cancel: () => void;
  getCurrentUtterance: () => SpeechSynthesisUtterance | null;
  isCurrentlySpeaking: boolean;
  currentWord: string;
  speechProgress: number;
}

export function useAdvancedSpeechSynthesis(): AdvancedSpeechSynthesisHook {
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isCurrentlySpeaking, setIsCurrentlySpeaking] = useState(false);
  const [currentWord, setCurrentWord] = useState('');
  const [speechProgress, setSpeechProgress] = useState(0);

  const speak = useCallback((text: string, onEnd?: () => void, onViseme?: (viseme: string) => void) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // 音声の開始
      utterance.onstart = () => {
        setIsCurrentlySpeaking(true);
        setSpeechProgress(0);
      };

      // 音素境界イベント（より詳細なリップシンク）
      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          const words = text.split(' ');
          const currentIndex = Math.floor((event.charIndex / text.length) * words.length);
          setCurrentWord(words[currentIndex] || '');
          setSpeechProgress((event.charIndex / text.length) * 100);
          
          // 音素に基づいたviseme生成
          const word = words[currentIndex];
          if (word && onViseme) {
            const viseme = generateVisemeFromWord(word);
            onViseme(viseme);
          }
        }
      };

      // 音声の終了
      utterance.onend = () => {
        setIsCurrentlySpeaking(false);
        setCurrentWord('');
        setSpeechProgress(100);
        if (onEnd) onEnd();
      };

      // エラーハンドリング
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsCurrentlySpeaking(false);
        if (onEnd) onEnd();
      };

      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const cancel = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      currentUtteranceRef.current = null;
      setIsCurrentlySpeaking(false);
      setCurrentWord('');
      setSpeechProgress(0);
    }
  }, []);

  const getCurrentUtterance = useCallback(() => {
    return currentUtteranceRef.current;
  }, []);

  return { 
    speak, 
    cancel, 
    getCurrentUtterance, 
    isCurrentlySpeaking, 
    currentWord, 
    speechProgress 
  };
}

// 日本語の音素に基づいたviseme生成
function generateVisemeFromWord(word: string): string {
  const hiragana = word.toLowerCase();
  
  // 母音の判定
  if (hiragana.includes('あ') || hiragana.includes('a')) return 'A';
  if (hiragana.includes('い') || hiragana.includes('i')) return 'I';
  if (hiragana.includes('う') || hiragana.includes('u')) return 'U';
  if (hiragana.includes('え') || hiragana.includes('e')) return 'E';
  if (hiragana.includes('お') || hiragana.includes('o')) return 'O';
  
  // 子音の判定
  if (hiragana.includes('ま') || hiragana.includes('み') || hiragana.includes('む')) return 'M';
  if (hiragana.includes('ば') || hiragana.includes('び') || hiragana.includes('ぶ')) return 'B';
  if (hiragana.includes('ぱ') || hiragana.includes('ぴ') || hiragana.includes('ぷ')) return 'P';
  if (hiragana.includes('た') || hiragana.includes('ち') || hiragana.includes('つ')) return 'T';
  if (hiragana.includes('だ') || hiragana.includes('で') || hiragana.includes('ど')) return 'D';
  if (hiragana.includes('な') || hiragana.includes('に') || hiragana.includes('ぬ')) return 'N';
  
  return 'neutral';
}