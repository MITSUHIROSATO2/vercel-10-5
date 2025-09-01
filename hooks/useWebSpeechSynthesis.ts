import { useCallback, useRef, useState } from 'react';

interface WebSpeechSynthesisHook {
  speak: (text: string, onEnd?: () => void, onProgress?: (progress: number) => void) => Promise<void>;
  cancel: () => void;
  isCurrentlySpeaking: boolean;
  currentWord: string;
  speechProgress: number;
  isLoading: boolean;
  audioLevel: number;
  currentPhoneme: string;
}

export function useWebSpeechSynthesis(): WebSpeechSynthesisHook {
  const [isCurrentlySpeaking, setIsCurrentlySpeaking] = useState(false);
  const [currentWord, setCurrentWord] = useState('');
  const [speechProgress, setSpeechProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentPhoneme, setCurrentPhoneme] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback(async (
    text: string, 
    onEnd?: () => void,
    onProgress?: (progress: number) => void
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        reject(new Error('Web Speech API is not supported'));
        return;
      }

      // キャンセル処理
      cancel();

      setIsLoading(true);
      setIsCurrentlySpeaking(false);
      setCurrentWord('');
      setSpeechProgress(0);
      setAudioLevel(0);

      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';
        utterance.rate = 0.9; // 少しゆっくり
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        utteranceRef.current = utterance;

        // 音声の開始
        utterance.onstart = () => {
          setIsCurrentlySpeaking(true);
          setIsLoading(false);
          
          // 単語とプログレスのシミュレーション
          const words = text.split(/\s+/);
          let wordIndex = 0;
          const wordsPerSecond = 3; // 1秒あたり約3単語
          const intervalMs = 1000 / wordsPerSecond;
          
          intervalRef.current = setInterval(() => {
            if (wordIndex < words.length) {
              const currentWordText = words[wordIndex];
              setCurrentWord(currentWordText);
              
              // 進捗の計算
              const progress = (wordIndex / words.length) * 100;
              setSpeechProgress(progress);
              if (onProgress) onProgress(progress);
              
              // 音声レベルのシミュレーション
              const baseLevel = 0.5;
              const variation = Math.sin(Date.now() / 100) * 0.3;
              setAudioLevel(Math.max(0, Math.min(1, baseLevel + variation)));
              
              // 簡易的な音素推定
              const firstChar = currentWordText[0];
              if (['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ'].includes(firstChar)) {
                setCurrentPhoneme('a');
              } else if (['い', 'き', 'し', 'ち', 'に', 'ひ', 'み', 'り'].includes(firstChar)) {
                setCurrentPhoneme('i');
              } else if (['う', 'く', 'す', 'つ', 'ぬ', 'ふ', 'む', 'ゆ', 'る'].includes(firstChar)) {
                setCurrentPhoneme('u');
              } else if (['え', 'け', 'せ', 'て', 'ね', 'へ', 'め', 'れ'].includes(firstChar)) {
                setCurrentPhoneme('e');
              } else if (['お', 'こ', 'そ', 'と', 'の', 'ほ', 'も', 'よ', 'ろ', 'を'].includes(firstChar)) {
                setCurrentPhoneme('o');
              } else {
                setCurrentPhoneme('n');
              }
              
              wordIndex++;
            }
          }, intervalMs);
        };

        // 音声の終了
        utterance.onend = () => {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          setIsCurrentlySpeaking(false);
          setCurrentWord('');
          setSpeechProgress(100);
          setAudioLevel(0);
          setCurrentPhoneme('');
          
          if (onEnd) onEnd();
          resolve();
        };

        // エラー処理
        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          setIsCurrentlySpeaking(false);
          setIsLoading(false);
          setCurrentWord('');
          setSpeechProgress(0);
          setAudioLevel(0);
          
          if (onEnd) onEnd();
          reject(new Error(`Speech synthesis error: ${event.error}`));
        };

        // 既存の音声をキャンセルしてから新しい音声を開始
        window.speechSynthesis.cancel();
        
        // 少し遅延を入れてから音声を開始（より安定した動作のため）
        setTimeout(() => {
          window.speechSynthesis.speak(utterance);
          setIsLoading(false);
        }, 100);
        
      } catch (error) {
        console.error('Speech synthesis setup error:', error);
        setIsLoading(false);
        reject(error);
      }
    });
  }, []);

  const cancel = useCallback(() => {
    // 音声合成を停止
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // インターバルをクリア
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // 状態をリセット
    setIsCurrentlySpeaking(false);
    setCurrentWord('');
    setSpeechProgress(0);
    setAudioLevel(0);
    setCurrentPhoneme('');
    setIsLoading(false);
    
    utteranceRef.current = null;
  }, []);

  return { 
    speak, 
    cancel, 
    isCurrentlySpeaking, 
    currentWord, 
    speechProgress,
    isLoading,
    audioLevel,
    currentPhoneme
  };
}