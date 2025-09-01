import { useEffect, useState, useCallback } from 'react';

interface SpeechRecognitionHook {
  transcript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'ja-JP';

        recognitionInstance.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setTranscript(finalTranscript.trim());
          } else if (interimTranscript) {
            setTranscript(interimTranscript);
          }
        };

        recognitionInstance.onerror = (event: any) => {
          console.error('音声認識エラー:', event.error);
          if (event.error === 'aborted') {
            // サイレントにabortedエラーを無視
            return;
          }
          setError(`音声認識エラー: ${event.error}`);
          setIsListening(false);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognition) {
      setTranscript('');
      setError(null);
      try {
        // 既に実行中の場合は停止してから再開始
        if (isListening) {
          recognition.stop();
          setTimeout(() => {
            recognition.start();
          }, 100);
        } else {
          recognition.start();
        }
        setIsListening(true);
      } catch (error: any) {
        console.error('音声認識開始エラー:', error);
        if (error.name === 'NotAllowedError') {
          setError('マイクの使用を許可してください。ブラウザの設定を確認してください。');
        } else {
          setError('音声認識の開始に失敗しました');
        }
      }
    } else {
      setError('お使いのブラウザは音声認識に対応していません。ChromeまたはEdgeをお使いください。');
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    error,
  };
}