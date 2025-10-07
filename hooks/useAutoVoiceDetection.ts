import { useEffect, useState, useCallback, useRef } from 'react';

interface AutoVoiceDetectionHook {
  transcript: string;
  isListening: boolean;
  isProcessing: boolean;
  startConversation: (onTranscriptComplete?: (transcript: string) => void, language?: 'ja' | 'en') => void;
  stopConversation: () => void;
  error: string | null;
  voiceActivityLevel: number;
  silenceTimer: number;
  isAutoMode: boolean;
  setAutoMode: (value: boolean) => void;
  setProcessingState: (processing: boolean) => void;
  setSpeakingState: (speaking: boolean) => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useAutoVoiceDetection(): AutoVoiceDetectionHook {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [voiceActivityLevel, setVoiceActivityLevel] = useState(0);
  const [silenceTimer, setSilenceTimer] = useState(0);
  const [isAutoMode, setAutoMode] = useState(true);
  const [shouldRestart, setShouldRestart] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const finalTranscriptRef = useRef('');
  const interimTranscriptRef = useRef('');
  const lastSpeechTimeRef = useRef(Date.now());
  const onTranscriptCompleteRef = useRef<((transcript: string) => void) | null>(null);
  const isConversationActiveRef = useRef(false);

  // 音声アクティビティの検出
  const startVoiceActivityDetection = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const detectVoiceActivity = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // 音声レベルの計算
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedLevel = Math.min(average / 40, 1); // さらに敏感な正規化
        setVoiceActivityLevel(normalizedLevel);

        // 音声アクティビティの検出
        if (normalizedLevel > 0.08) { // より低い閾値で音声を検出
          lastSpeechTimeRef.current = Date.now();
          setSilenceTimer(0);
        } else {
          const silenceDuration = Date.now() - lastSpeechTimeRef.current;
          setSilenceTimer(Math.floor(silenceDuration / 1000));
        }

        animationFrameRef.current = requestAnimationFrame(detectVoiceActivity);
      };

      detectVoiceActivity();
    } catch (error) {
      // console.error('Voice activity detection error:', error);
      setError('マイクへのアクセスに失敗しました');
    }
  }, []);

  // 音声認識の初期化
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'ja-JP';
        recognitionInstance.maxAlternatives = 1;
        
        recognitionInstance.onstart = () => {
          // console.log('Speech recognition started');
          setIsListening(true);
          lastSpeechTimeRef.current = Date.now();
        };

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
            finalTranscriptRef.current = finalTranscript.trim();
            setTranscript(finalTranscriptRef.current);
            
            // 自動モードの場合、一定時間の沈黙後に自動的に処理
            if (isAutoMode && !isProcessing && !isSpeaking && isConversationActiveRef.current) {
              // 既存のタイマーをクリア
              if (silenceTimeoutRef.current) {
                clearTimeout(silenceTimeoutRef.current);
              }
              
              // 新しいタイマーを設定（0.1秒の沈黙で確定）
              silenceTimeoutRef.current = setTimeout(() => {
                if (finalTranscriptRef.current && onTranscriptCompleteRef.current && isConversationActiveRef.current && !isProcessing && !isSpeaking) {
                  // console.log('Auto-sending transcript:', finalTranscriptRef.current);
                  setIsProcessing(true);
                  
                  // 音声認識を一時停止
                  if (recognition) {
                    try {
                      recognition.stop();
                      // console.log('Recognition paused for processing');
                    } catch (e) {
                      // console.log('Failed to pause recognition:', e);
                    }
                  }
                  
                  onTranscriptCompleteRef.current(finalTranscriptRef.current);
                  // transcriptはリセットするが、会話は継続
                  finalTranscriptRef.current = '';
                  setTranscript('');
                }
              }, 100);
            }
          } else if (interimTranscript) {
            interimTranscriptRef.current = interimTranscript;
            setTranscript(interimTranscript);
          }
        };

        recognitionInstance.onerror = (event: any) => {
          // console.error('音声認識エラー:', event.error);
          
          // abortedエラーは無視（正常な停止の場合もあるため）
          if (event.error === 'aborted') {
            // console.log('Recognition aborted - this is normal when stopping');
            return;
          }
          
          // no-speechエラーも無視（しばらく話さない場合）
          if (event.error === 'no-speech') {
            // console.log('No speech detected - waiting for speech');
            // 会話が継続中なら再開を試みる
            if (isConversationActiveRef.current && isAutoMode) {
              setTimeout(() => {
                try {
                  recognitionInstance.start();
                  // console.log('Restarted after no-speech');
                } catch (e) {
                  // console.log('Failed to restart after no-speech:', e);
                }
              }, 100); // no-speech後すぐに再開
            }
            return;
          }
          
          setError(`音声認識エラー: ${event.error}`);
          setIsListening(false);
        };

        recognitionInstance.onend = () => {
          // console.log('Recognition ended. isConversationActive:', isConversationActiveRef.current, 'isAutoMode:', isAutoMode, 'isProcessing:', isProcessing, 'isSpeaking:', isSpeaking);
          
          // 音声認識が終了した場合の状態をリセット
          setIsListening(false);
          
          // 自動モードで会話継続中の場合は再開
          if (isConversationActiveRef.current && isAutoMode) {
            // 処理中や話し中の場合は、それらが完了してから再開される
            if (!isProcessing && !isSpeaking) {
              const restartDelay = 200; // 再開までの待機時間を短縮
              
              setTimeout(() => {
                // 再開時に再度条件をチェック
                if (isConversationActiveRef.current && !isProcessing && !isSpeaking) {
                  try {
                    // console.log('Attempting to restart recognition...');
                    recognitionInstance.start();
                    // console.log('Recognition restarted successfully');
                  } catch (e) {
                    // console.log('Recognition restart failed:', e);
                    // エラーが発生してもリスニング状態は維持
                    if (isConversationActiveRef.current) {
                      // 少し待ってから再試行
                      setTimeout(() => {
                        if (isConversationActiveRef.current && !isProcessing && !isSpeaking) {
                          try {
                            recognitionInstance.start();
                            // console.log('Second attempt to restart recognition succeeded');
                          } catch (e2) {
                            // console.log('Second attempt failed:', e2);
                            setIsListening(false);
                          }
                        }
                      }, 1000);
                    }
                  }
                } else {
                  // console.log('Conditions not met for restart, will check again later');
                  // 条件が満たされない場合は、さらに後で再試行
                  if (isConversationActiveRef.current) {
                    setTimeout(() => {
                      if (isConversationActiveRef.current && !isProcessing && !isSpeaking) {
                        try {
                          recognitionInstance.start();
                          // console.log('Delayed restart succeeded');
                        } catch (e) {
                          // console.log('Delayed restart failed:', e);
                        }
                      }
                    }, 2000);
                  }
                }
              }, restartDelay);
            }
          } else {
            setIsListening(false);
          }
        };

        setRecognition(recognitionInstance);
      }
    }
  }, [isAutoMode]);

  // 会話の開始
  const startConversation = useCallback((onTranscriptComplete?: (transcript: string) => void, language: 'ja' | 'en' = 'ja') => {
    if (recognition) {
      // 言語設定を更新
      recognition.lang = language === 'ja' ? 'ja-JP' : 'en-US';

      // 初回のみリセット（会話が既にアクティブでない場合）
      if (!isConversationActiveRef.current) {
        setTranscript('');
        setError(null);
        finalTranscriptRef.current = '';
        interimTranscriptRef.current = '';
        lastSpeechTimeRef.current = Date.now();
      }

      if (onTranscriptComplete) {
        onTranscriptCompleteRef.current = onTranscriptComplete;
      }

      try {
        // 既に開始している場合はスキップ
        if (!isListening) {
          recognition.start();
          setIsListening(true);
        }
        setShouldRestart(true);
        isConversationActiveRef.current = true;
        startVoiceActivityDetection();
        // console.log('Conversation started or resumed');
      } catch (error: any) {
        // console.error('音声認識開始エラー:', error);
        if (error.name === 'NotAllowedError') {
          setError('マイクの使用を許可してください。ブラウザの設定を確認してください。');
        } else {
          setError('音声認識の開始に失敗しました');
        }
      }
    } else {
      setError('お使いのブラウザは音声認識に対応していません。ChromeまたはEdgeをお使いください。');
    }
  }, [recognition, startVoiceActivityDetection]);

  // 会話の停止
  const stopConversation = useCallback(() => {
    setShouldRestart(false);
    isConversationActiveRef.current = false;
    // console.log('Conversation stopped');
    
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setVoiceActivityLevel(0);
    setSilenceTimer(0);
  }, [recognition]);

  // 処理状態の管理
  const setProcessingState = useCallback((processing: boolean) => {
    // console.log('Setting processing state:', processing);
    setIsProcessing(processing);
    
    // 処理が完了したら音声認識を再開
    if (!processing && isConversationActiveRef.current && isAutoMode && !isSpeaking) {
      setTimeout(() => {
        if (recognition && !isListening && isConversationActiveRef.current) {
          try {
            recognition.start();
            // console.log('Recognition restarted after processing complete');
          } catch (e) {
            // console.log('Failed to restart recognition after processing:', e);
          }
        }
      }, 200); // 処理完了後すぐに再開
    }
  }, [recognition, isAutoMode, isSpeaking, isListening]);

  const setSpeakingState = useCallback((speaking: boolean) => {
    // console.log('Setting speaking state:', speaking);
    setIsSpeaking(speaking);

    if (speaking && recognition) {
      if (isListening) {
        try {
          recognition.stop();
        } catch (e) {
          // console.log('Failed to stop recognition while speaking:', e);
        }
      }
      setIsListening(false);
      return;
    }

    // 音声再生が完了したら音声認識を再開
    if (!speaking && isConversationActiveRef.current && isAutoMode && !isProcessing) {
      setTimeout(() => {
        if (recognition && !isListening && isConversationActiveRef.current) {
          try {
            recognition.start();
            // console.log('Recognition restarted after speaking complete');
          } catch (e) {
            // console.log('Failed to restart recognition after speaking:', e);
          }
        }
      }, 300); // 音声再生後すぐに聞き取り再開
    }
  }, [recognition, isAutoMode, isProcessing, isListening]);

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      stopConversation();
    };
  }, [stopConversation]);

  return {
    transcript,
    isListening,
    isProcessing,
    startConversation,
    stopConversation,
    error,
    voiceActivityLevel,
    silenceTimer,
    isAutoMode,
    setAutoMode,
    setProcessingState,
    setSpeakingState
  };
}
