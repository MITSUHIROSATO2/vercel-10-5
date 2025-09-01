import { useCallback, useRef } from 'react';

interface SpeechSynthesisHook {
  speak: (text: string, onEnd?: () => void, onBoundary?: (event: SpeechSynthesisEvent) => void) => void;
  cancel: () => void;
  getCurrentUtterance: () => SpeechSynthesisUtterance | null;
}

export function useSpeechSynthesis(): SpeechSynthesisHook {
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string, onEnd?: () => void, onBoundary?: (event: SpeechSynthesisEvent) => void) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // 音素境界イベント（リップシンクに使用）
      if (onBoundary) {
        utterance.onboundary = onBoundary;
      }

      if (onEnd) {
        utterance.onend = onEnd;
      }

      // エラーハンドリング
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
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
    }
  }, []);

  const getCurrentUtterance = useCallback(() => {
    return currentUtteranceRef.current;
  }, []);

  return { speak, cancel, getCurrentUtterance };
}