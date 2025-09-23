'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useAutoVoiceDetection } from '@/hooks/useAutoVoiceDetection';
import { useElevenLabsSpeech } from '@/hooks/useElevenLabsSpeech';
import { useDemoElevenLabsSpeech } from '@/hooks/useDemoElevenLabsSpeech';
import { getModelPath } from '@/lib/modelPaths';
import { audioService } from '@/lib/audioService';

// リップシンクアバターを動的インポート（SSRを無効化）
const FinalLipSyncAvatar = dynamic(
  () => import('@/components/FinalLipSyncAvatar'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-cyan-400 animate-pulse">モデルを読み込み中...</div>
      </div>
    )
  }
);
import { patientScenarios, formatScenarioForAI } from '@/lib/scenarios';
import type { PatientScenario } from '@/lib/scenarioTypes';
import { getTranslatedScenario } from '@/lib/scenariosEnglish';
import { PatientMessage } from '@/lib/openai';
import type { InterviewEvaluation as EvaluationType } from '@/lib/evaluationTypes';
import AIEvaluationResult from '@/components/AIEvaluationResult';
import EvaluationCriteriaEditor from '@/components/EvaluationCriteriaEditor';
import EvaluationList from '@/components/EvaluationList';
import InterviewEvaluation from '@/components/InterviewEvaluation';
import ScenarioEditor from '@/components/ScenarioEditor';
import ScenarioGenerator from '@/components/ScenarioGenerator';
import { demoDialogues, shortDemoDialogues } from '@/lib/demoDialogues';
import { improvedDemoDialogues, shortImprovedDemoDialogues, DemoDialogue } from '@/lib/improvedDemoDialogues';
import { improvedDemoDialoguesEn, shortImprovedDemoDialoguesEn } from '@/lib/improvedDemoDialoguesEnglish';
import { generateDemoDialogues, generateDemoDialoguesEnglish } from '@/lib/dynamicDemoDialogues';

export default function Home() {
  const [messages, setMessages] = useState<PatientMessage[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<PatientScenario>(patientScenarios[0]);
  const [customScenarios, setCustomScenarios] = useState<PatientScenario[]>([]);
  const [editedScenarios, setEditedScenarios] = useState<{ [key: string]: PatientScenario }>({});
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isPatientInfoVisible, setIsPatientInfoVisible] = useState(false);
  const [isEditingScenario, setIsEditingScenario] = useState(false);
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const [showAIEvaluation, setShowAIEvaluation] = useState(false);
  const [showEvaluationList, setShowEvaluationList] = useState(false);
  const [showCriteriaEditor, setShowCriteriaEditor] = useState(false);
  const [evaluations, setEvaluations] = useState<EvaluationType[]>([]);
  const [editingEvaluation, setEditingEvaluation] = useState<EvaluationType | null>(null);
  const [latestResponse, setLatestResponse] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<'adult' | 'boy' | 'boy_improved' | 'female'>('boy');
  const [isAvatarLoaded, setIsAvatarLoaded] = useState(false);
  const [language, setLanguage] = useState<'ja' | 'en'>('ja'); // 言語設定を追加
  const languageRef = useRef<'ja' | 'en'>('ja'); // 最新の言語値を保持
  
  // タイマー関連の状態
  const [interviewTime, setInterviewTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // 会話ログの自動スクロール用ref
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // デモンストレーション関連の状態
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);
  const [currentDemoIndex, setCurrentDemoIndex] = useState(0);
  const [demoType, setDemoType] = useState<'full' | 'short'>('short');
  const [useImprovedDemo, setUseImprovedDemo] = useState(false); // 改善版を使うかどうか
  const [demoLanguage, setDemoLanguage] = useState<'ja' | 'en'>('ja'); // デモ再生時の言語を保持
  const demoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // デモ用の音声フック
  const {
    playDemoAudio,
    stopAudio: stopDemoAudio,
    currentWord: demoCurrentWord,
    audioLevel: demoAudioLevel,
    isPlaying: isDemoAudioPlaying
  } = useDemoElevenLabsSpeech();
  
  // アバター変更時にローディング状態をリセット
  const handleAvatarChange = (avatar: 'adult' | 'boy' | 'boy_improved' | 'female') => {
    if (avatar !== selectedAvatar) {
      console.log(`[Avatar Change] Switching from ${selectedAvatar} to ${avatar}`);
      setIsAvatarLoaded(false);
      setSelectedAvatar(avatar);
      const modelPath = getModelPath(avatar);
      console.log(`[Avatar Change] Model path for ${avatar}: ${modelPath}`);
    }
  };
  
  // onLoaded コールバックをメモ化
  const handleAvatarLoaded = React.useCallback(() => {
    console.log(`[Avatar Loaded] Avatar ${selectedAvatar} loaded successfully`);
    setIsAvatarLoaded(true);
  }, [selectedAvatar]);

  // デモが再生中かどうかを追跡するためのref
  const isDemoPlayingRef = useRef(false);

  // stopDemo関数を先に定義（playNextDemoDialogueから参照されるため）
  const stopDemo = () => {
    setIsDemoPlaying(false);
    isDemoPlayingRef.current = false;
    setCurrentDemoIndex(0);
    setIsSpeaking(false);
    setLatestResponse('');
    
    if (demoTimeoutRef.current) {
      clearTimeout(demoTimeoutRef.current);
      demoTimeoutRef.current = null;
    }
    
    // 音声を停止
    stop(); // ElevenLabsの音声を停止
    stopDemoAudio(); // デモ音声も停止
    
    // Web Speech APIの音声も停止
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // クリーンアップ処理
  useEffect(() => {
    return () => {
      audioService.cleanup();
      stopDemoAudio();
    };
  }, [stopDemoAudio]);

  // 言語変更を追跡
  useEffect(() => {
    console.log('🌐 Language changed to:', language);
    languageRef.current = language; // useRefも更新
  }, [language]);

  // デモ開始時に最初の発話を開始
  useEffect(() => {
    if (isDemoPlaying && currentDemoIndex === 0 && demoType) {
      console.log('▶️ Starting demo playback with:', { demoType, demoLanguage, useImprovedDemo });
      // 少し遅延を入れて状態が確実に更新されるのを待つ
      const timer = setTimeout(() => {
        playNextDemoDialogue(0, demoType);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isDemoPlaying]);

  // デモンストレーション機能
  const playNextDemoDialogue = async (index: number, type: 'full' | 'short') => {
    console.log('📖 playNextDemoDialogue:', {
      index,
      type,
      demoLanguage,
      demoLanguageValue: `"${demoLanguage}"`,
      useImprovedDemo,
      selectedScenario: selectedScenario.name
    });

    // シナリオに基づく動的デモ対話を生成（fullタイプのみ対応）
    let dialogues: DemoDialogue[];

    if (type === 'full') {
      // フルデモはシナリオに基づいて動的に生成
      console.log('🎯 Generating dynamic demo for scenario:', selectedScenario.name, selectedScenario.id);
      dialogues = demoLanguage === 'ja'
        ? generateDemoDialogues(selectedScenario)
        : generateDemoDialoguesEnglish(selectedScenario).length > 0
          ? generateDemoDialoguesEnglish(selectedScenario)
          : improvedDemoDialoguesEn; // 英語版が実装されるまでフォールバック
      console.log('📚 Generated dialogues count:', dialogues.length);
      console.log('🔍 First patient response:', dialogues.find(d => d.speaker === 'patient')?.text);
    } else {
      // ショートデモは既存の固定版を使用
      dialogues = demoLanguage === 'ja'
        ? shortImprovedDemoDialogues
        : shortImprovedDemoDialoguesEn;
    }

    console.log('🗣️ Selected dialogue source:',
      type === 'full'
        ? `Dynamic demo for "${selectedScenario.name}" (${demoLanguage === 'ja' ? 'Japanese' : 'English'})`
        : `Fixed short demo (${demoLanguage === 'ja' ? 'Japanese' : 'English'})`
    );
    if (dialogues[index]) {
      console.log('💬 Current dialogue:', dialogues[index].text.substring(0, 50) + '...');
    }
    
    if (index >= dialogues.length) {
      // デモ終了
      stopDemo();
      return;
    }

    const dialogue = dialogues[index];
    const nextIndex = index + 1;

    // メッセージを追加
    const role = dialogue.speaker === 'doctor' ? 'user' : 'assistant';
    const newMessage: PatientMessage = { role, content: dialogue.text };
    setMessages(prev => [...prev, newMessage]);

    // 次の発話に進む関数
    const proceedToNext = () => {
      const delay = dialogue.delay || 1500;
      
      if (isDemoPlayingRef.current && nextIndex < dialogues.length) {
        demoTimeoutRef.current = setTimeout(() => {
          setCurrentDemoIndex(nextIndex);
          playNextDemoDialogue(nextIndex, type);
        }, delay);
      } else if (nextIndex >= dialogues.length) {
        stopDemo();
      }
    };

    // 患者の発話の場合のみアバターを動かす
    if (dialogue.speaker === 'patient') {
      console.log('🎭 デモ: 患者の発話を再生開始:', dialogue.text);
      // 最新の応答を保存（アバターのリップシンク用）
      setLatestResponse(dialogue.text);
      
      const patientVoiceId = 'j9jfwdrw7BRfcR43Qohk'; // AI患者用のElevenLabs voice ID
      
      try {
        // リップシンクを開始
        setIsSpeaking(true);
        
        // ElevenLabs APIを呼び出す（患者用voice ID）
        console.log('🔊 ElevenLabs APIを呼び出し中...');
        const requestBody = {
          text: dialogue.text,
          voiceId: patientVoiceId,
          emotion: 'neutral', // デモでは感情をニュートラルに設定
          language: demoLanguage // demoLanguageを使用
        };
        console.log('📤 ElevenLabs APIリクエスト:', requestBody);

        const response = await fetch('/api/elevenlabs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ ElevenLabs API応答受信:', data.audio ? '音声データあり' : '音声データなし');
          if (data.audio) {
            // Base64音声データを再生しながらリップシンクを継続
            try {
              console.log('🎵 音声再生を開始...');
              
              // デモ専用の高品質リップシンクフックを使用（本番と同等の品質）
              setIsSpeaking(true);
              
              try {
                console.log('🎵 playDemoAudio呼び出し中...');
                // useDemoElevenLabsSpeechフックを使用して本番と同じ品質のリップシンクを実現
                await playDemoAudio(data.audio, dialogue.text);
                console.log('✅ playDemoAudio完了');
              } catch (playError) {
                console.error('❌ playDemoAudioエラー:', playError);
              }
              
              // 音声再生完了後のクリーンアップ
              setIsSpeaking(false);
              setLatestResponse('');
              
              console.log('✅ 音声再生処理完了');
              
              proceedToNext();
              return; // 処理完了
            } catch (error) {
              console.warn('❌ 音声再生エラー、フォールバック使用:', error);
              setIsSpeaking(false);
            }
          } else {
            console.warn('⚠️ 音声データが含まれていません');
            setIsSpeaking(false);
          }
        } else {
          const errorText = await response.text();
          console.error('❌ ElevenLabs APIエラー:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
          setIsSpeaking(false);
        }
      } catch (error) {
        console.warn('患者の音声生成エラー、フォールバック使用:', error);
        setIsSpeaking(false);
      }
      
      // フォールバックまたは正常完了後の処理
      if (!isDemoPlayingRef.current) {
        setIsSpeaking(false);
        return;
      }
      
      // フォールバック: Web Speech APIを使用
      if ('speechSynthesis' in window) {
        setIsSpeaking(true);
        speak(dialogue.text, 
          () => {
            setIsSpeaking(false);
            proceedToNext();
          },
          (progress) => {}
        );
      } else {
        setIsSpeaking(false);
        proceedToNext();
      }
    } else {
      // 医師の発話の場合は、アバターを動かさない
      const doctorVoiceId = 'PmgfHCGeS5b7sH90BOOJ'; // 医師用のElevenLabs voice ID
      
      let audioPlayed = false;
      
      try {
        // ElevenLabs APIを呼び出す
        const response = await fetch('/api/elevenlabs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: dialogue.text,
            voiceId: doctorVoiceId,
            emotion: 'neutral', // 医師も感情をニュートラルに
            language: demoLanguage // demoLanguageを使用
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.audio) {
            // 統一された音声サービスを使用（医師の音声はリップシンクなし）
            try {
              await audioService.playAudio({
                text: dialogue.text,
                base64Audio: data.audio,
                enableRealTimeAnalysis: false,
                onEnd: () => {
                  audioPlayed = true;
                  proceedToNext();
                }
              });
            } catch (error) {
              console.warn('音声再生エラー:', error);
              proceedToNext();
            }
          } else {
            console.warn('音声データが含まれていません');
          }
        } else {
          console.warn('ElevenLabs APIエラー:', response.status);
        }
      } catch (error) {
        console.warn('医師の音声生成エラー:', error);
      }
      
      // デモが停止されていない場合は次に進む
      if (!isDemoPlayingRef.current) {
        return;
      }
      
      // 音声が再生されていても、されていなくても次に進む
      // (音声再生が成功した場合は、onendedイベントで自動的に次に進む)
      if (audioPlayed) {
        // 音声再生が成功した場合、proceedToNextはonendedで呼ばれる
        // ここでは何もしない
      } else {
        // 音声なしで次に進む（デフォルトの遅延を使用）
        proceedToNext();
      }
    }
  };

  // startDemo関数を追加
  const startDemo = (type: 'full' | 'short') => {
    const currentLang = languageRef.current; // useRefから最新の言語値を取得
    console.log('🎬 Starting demo with:', {
      type,
      currentLanguage: currentLang,
      stateLanguage: language,
      languageValue: `"${currentLang}"`
    });
    setDemoType(type);
    setDemoLanguage(currentLang); // 最新の言語を保存
    setUseImprovedDemo(true); // 常に改善版を使用（多言語対応）
    setIsDemoPlaying(true);
    isDemoPlayingRef.current = true;
    setCurrentDemoIndex(0);
    setMessages([]); // チャット履歴をクリア

    // タイマーを開始
    if (!isTimerRunning) {
      setIsTimerRunning(true);
      setInterviewTime(0);
    }

    // 状態更新後に最初の発話を開始（useEffectで処理される）
  };

  // デモ停止時のクリーンアップ
  useEffect(() => {
    return () => {
      if (demoTimeoutRef.current) {
        clearTimeout(demoTimeoutRef.current);
      }
    };
  }, []);

  const isConversationActiveRef = useRef(false);
  
  // タイマーの管理
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setInterviewTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning]);
  
  // 時間をフォーマットする関数
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const { 
    transcript, 
    isListening, 
    isProcessing,
    startConversation, 
    stopConversation, 
    error: speechError,
    voiceActivityLevel,
    silenceTimer,
    isAutoMode,
    setAutoMode,
    setProcessingState,
    setSpeakingState
  } = useAutoVoiceDetection();
  const { speak, cancel, isCurrentlySpeaking, currentWord, speechProgress, isLoading, audioLevel, currentPhoneme, initializeAudio } = useElevenLabsSpeech();

  // 音声認識の手動制御
  const [audioInitialized, setAudioInitialized] = useState(false);
  
  const handleStartConversation = async () => {
    try {
      // 音声認識を開始
      isConversationActiveRef.current = true;
      
      // タイマーを開始（初回のみ）
      if (!isTimerRunning && interviewTime === 0) {
        setIsTimerRunning(true);
      }
      
      startConversation((finalTranscript) => {
        if (finalTranscript.trim() && isConversationActiveRef.current) {
          // console.log('音声認識結果:', finalTranscript);
          handleSendMessage(finalTranscript);
        }
      }, language);
      
      // 初回のみ音声を初期化（音声認識開始後に実行）
      if (!audioInitialized) {
        setTimeout(async () => {
          const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAABXQVZFZm10');
          silentAudio.volume = 0;
          await silentAudio.play().catch(() => {});
          
          await initializeAudio();
          setAudioInitialized(true);
          // console.log('✅ 音声システムを初期化しました');
        }, 100);
      }
    } catch (error) {
      // console.error('音声初期化エラー:', error);
      // エラーでも音声認識は開始
      isConversationActiveRef.current = true;
      startConversation((finalTranscript) => {
        if (finalTranscript.trim() && isConversationActiveRef.current) {
          handleSendMessage(finalTranscript);
        }
      });
    }
  };
  
  const handleStopConversation = () => {
    isConversationActiveRef.current = false;
    stopConversation();
    cancel(); // 音声も停止
  };
  
  // 処理状態の管理
  useEffect(() => {
    setProcessingState(isLoadingResponse);
  }, [isLoadingResponse, setProcessingState]);
  
  useEffect(() => {
    setSpeakingState(isCurrentlySpeaking || isSpeaking);
  }, [isCurrentlySpeaking, isSpeaking, setSpeakingState]);
  
  // 会話ログの自動スクロール
  useEffect(() => {
    if (chatContainerRef.current) {
      // スムーズにスクロール
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const newMessage: PatientMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setIsLoadingResponse(true);

    try {
      setApiError(null);
      // 会話履歴全体を送信して文脈を保持
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages, // 全会話履歴を送信
          patientScenario: formatScenarioForAI(selectedScenario),
          language: language // 言語設定を追加
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        setApiError(data.error);
      } else if (data.response) {
        const aiMessage: PatientMessage = { role: 'assistant', content: data.response };
        setMessages([...updatedMessages, aiMessage]);
        
        // 最新の応答を保存（感情分析用）
        setLatestResponse(data.response);
        
        // 音声再生（初期化済みでなくても試みる）
        setIsSpeaking(true);
        
        // デバッグ用ログ
        // console.log('音声再生を試みます:', {
        //   audioInitialized,
        //   responseLength: data.response.length,
        //   response: data.response.substring(0, 50) + '...'
        // });
        
        // ElevenLabsまたはフォールバックで音声合成（言語設定を渡す）
        speak(data.response,
          () => {
            setIsSpeaking(false);
            // console.log('音声再生が完了しました');

            // 音声再生完了後、自動モードの場合は音声認識を再開
            if (isAutoMode && isConversationActiveRef.current) {
              // console.log('音声再生完了、音声認識を再開待機中...');
            }
          },
          (progress) => {
            // プログレスのログは最小限に
            // if (progress % 25 === 0) {
            //   console.log('Speech progress:', progress);
            // }
          },
          language // 言語設定を追加
        );
      }
    } catch (error) {
      // console.error('Error:', error);
      setApiError('応答の生成中にエラーが発生しました。しばらくしてから再度お試しください。');
    } finally {
      setIsLoadingResponse(false);
    }
  };

  const handleScenarioChange = (scenarioId: string) => {
    // 編集済みシナリオを優先
    let scenario = editedScenarios[scenarioId];
    
    // 編集済みがなければオリジナルまたはカスタムから取得
    if (!scenario) {
      const foundScenario = [...patientScenarios, ...customScenarios].find(s => s.id === scenarioId);
      if (foundScenario) {
        scenario = foundScenario;
      }
    }
    
    if (scenario) {
      setSelectedScenario(scenario);
      setMessages([]); // シナリオ変更時のみメッセージをリセット
      cancel();
      setApiError(null);
      // console.log('シナリオを変更しました：', scenario.name);
    }
  };

  const handleGenerateNewScenario = (newScenario: PatientScenario) => {
    const updatedCustomScenarios = [...customScenarios, newScenario];
    setCustomScenarios(updatedCustomScenarios);
    setSelectedScenario(newScenario);
    setMessages([]); // 新規シナリオ生成時もリセット
    cancel();
    setApiError(null);
    setIsGeneratingScenario(false);
    
    // localStorageに保存
    localStorage.setItem('customScenarios', JSON.stringify(updatedCustomScenarios));
    // console.log('新規シナリオを生成しました：', newScenario.name);
  };

  // 評価の保存
  const handleSaveEvaluation = (evaluation: EvaluationType) => {
    if (editingEvaluation) {
      // 編集モード
      setEvaluations(prev => prev.map(e => e.id === evaluation.id ? evaluation : e));
      setEditingEvaluation(null);
    } else {
      // 新規作成
      setEvaluations(prev => [...prev, evaluation]);
    }
    setShowAIEvaluation(false);
    
    // localStorageに保存
    const storedEvaluations = localStorage.getItem('evaluations');
    const allEvaluations = storedEvaluations ? JSON.parse(storedEvaluations) : [];
    if (editingEvaluation) {
      const updatedEvaluations = allEvaluations.map((e: EvaluationType) => 
        e.id === evaluation.id ? evaluation : e
      );
      localStorage.setItem('evaluations', JSON.stringify(updatedEvaluations));
    } else {
      localStorage.setItem('evaluations', JSON.stringify([...allEvaluations, evaluation]));
    }
  };

  // 評価の削除
  const handleDeleteEvaluation = (evaluationId: string) => {
    setEvaluations(prev => prev.filter(e => e.id !== evaluationId));
    
    // localStorageからも削除
    const storedEvaluations = localStorage.getItem('evaluations');
    if (storedEvaluations) {
      const allEvaluations = JSON.parse(storedEvaluations);
      const updatedEvaluations = allEvaluations.filter((e: EvaluationType) => e.id !== evaluationId);
      localStorage.setItem('evaluations', JSON.stringify(updatedEvaluations));
    }
  };

  // 評価の編集
  const handleEditEvaluation = (evaluation: EvaluationType) => {
    setEditingEvaluation(evaluation);
    setShowEvaluationList(false);
    setShowAIEvaluation(true);
  };

  // localStorageから評価とシナリオを読み込み
  useEffect(() => {
    // 評価の読み込み
    const storedEvaluations = localStorage.getItem('evaluations');
    if (storedEvaluations) {
      setEvaluations(JSON.parse(storedEvaluations));
    }
    
    // カスタムシナリオの読み込み
    const storedCustomScenarios = localStorage.getItem('customScenarios');
    if (storedCustomScenarios) {
      setCustomScenarios(JSON.parse(storedCustomScenarios));
    }
    
    // 編集済みシナリオの読み込み
    const storedEditedScenarios = localStorage.getItem('editedScenarios');
    if (storedEditedScenarios) {
      const edited = JSON.parse(storedEditedScenarios);
      setEditedScenarios(edited);
      
      // 選択中のシナリオが編集されている場合は、編集版を使用
      if (edited[patientScenarios[0].id]) {
        setSelectedScenario(edited[patientScenarios[0].id]);
      }
    }
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-cyan-900 via-slate-900 to-blue-900 tech-grid">
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <header className="text-center mb-8">
          <h1 className="text-5xl lg:text-6xl font-bold mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent neon-glow">
              AI DENTAL INTERVIEW SIMULATION
            </span>
          </h1>
          <div className="mt-4 w-32 h-1 mx-auto bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
        </header>

        <div className="max-w-7xl mx-auto space-y-6">
          {/* 上部：アバター表示 */}
          <div className="glass-effect rounded-2xl border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300">
            <div className="relative z-0 w-full">
              {/* アバター切り替えボタン - ローディング完了後にのみ表示 */}
              {isAvatarLoaded && (
                <>
                  {/* 言語切り替えボタン - 左端 */}
                  <div className="absolute top-4 left-4 z-10 flex gap-2">
                    <button
                      onClick={() => {
                        console.log('🇯🇵 Switching to Japanese (current:', language, ')');
                        setLanguage('ja');
                      }}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        language === 'ja'
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      }`}
                    >
                      日本語版
                    </button>
                    <button
                      onClick={() => {
                        console.log('🇬🇧 Switching to English (current:', language, ')');
                        setLanguage('en');
                      }}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        language === 'en'
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      }`}
                    >
                      ENGLISH VERSION
                    </button>
                  </div>
                  {/* アバター選択ボタン - 右端 */}
                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button
                      onClick={() => handleAvatarChange('boy')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedAvatar === 'boy'
                          ? 'bg-cyan-600 text-white shadow-lg'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      }`}
                    >
                      {language === 'ja' ? '男性1' : 'Male 1'}
                    </button>
                    <button
                      onClick={() => handleAvatarChange('adult')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedAvatar === 'adult'
                          ? 'bg-cyan-600 text-white shadow-lg'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      }`}
                    >
                      {language === 'ja' ? '男性2' : 'Male 2'}
                    </button>
                    <button
                      onClick={() => handleAvatarChange('female')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedAvatar === 'female'
                          ? 'bg-cyan-600 text-white shadow-lg'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      }`}
                    >
                      {language === 'ja' ? '女性' : 'Female'}
                    </button>
                    <button
                      onClick={() => handleAvatarChange('boy_improved')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedAvatar === 'boy_improved'
                          ? 'bg-cyan-600 text-white shadow-lg'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      }`}
                    >
                      {language === 'ja' ? '青年改' : 'Young Male'}
                    </button>
                  </div>
                </>
              )}
              {/* リップシンク対応アバター表示部分 */}
              <div className="scan-overlay" style={{ minHeight: '400px' }}>
                <React.Suspense fallback={
                  <div className="flex items-center justify-center h-[400px]">
                    <div className="text-cyan-400 animate-pulse">モデルを読み込み中...</div>
                  </div>
                }>
                  <FinalLipSyncAvatar 
                    key={selectedAvatar} // アバター変更時に完全に再マウント
                    isSpeaking={isSpeaking || isCurrentlySpeaking || isDemoAudioPlaying} 
                    currentWord={isDemoAudioPlaying ? demoCurrentWord : currentWord}
                    audioLevel={isDemoAudioPlaying ? demoAudioLevel : audioLevel}
                    currentPhoneme={currentPhoneme}
                    speechProgress={speechProgress}
                    modelPath={getModelPath(selectedAvatar)}
                    selectedAvatar={selectedAvatar}
                    onLoaded={handleAvatarLoaded}
                  />
                </React.Suspense>
              </div>
            </div>
          </div>

          {/* 下部：シナリオ選択、AI患者情報、医療面接 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 左側：シナリオ選択とAI患者情報 */}
            <div className="flex flex-col h-[400px] gap-4">
            <div className="glass-effect rounded-2xl p-4 border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 h-[140px]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-cyan-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {language === 'ja' ? 'シナリオ選択' : 'Scenario Selection'}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (isDemoPlaying && demoType === 'short') {
                        stopDemo();
                      } else if (!isDemoPlaying) {
                        // デモが動作していない場合のみ開始
                        startDemo('short');
                      } else {
                        // 他のデモが動作中の場合は一旦停止してから開始
                        stopDemo();
                        // 現在の言語値をキャプチャして渡す
                        const currentLang = language;
                        requestAnimationFrame(() => {
                          startDemo('short');
                        });
                      }
                    }}
                    className="px-3 py-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all flex items-center gap-2"
                  >
                    <span>{isDemoPlaying && demoType === 'short' ? '⏸️' : '▶️'}</span>
                    {isDemoPlaying && demoType === 'short' ? (language === 'ja' ? '停止' : 'Stop') : (language === 'ja' ? 'デモ' : 'Demo')}
                  </button>
                  <button
                    onClick={() => {
                      if (isDemoPlaying && demoType === 'full') {
                        stopDemo();
                      } else if (!isDemoPlaying) {
                        // デモが動作していない場合のみ開始
                        startDemo('full');
                      } else {
                        // 他のデモが動作中の場合は一旦停止してから開始
                        stopDemo();
                        requestAnimationFrame(() => {
                          startDemo('full');
                        });
                      }
                    }}
                    className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white text-sm rounded-lg hover:from-cyan-700 hover:to-cyan-800 transition-all flex items-center gap-2"
                  >
                    <span>{isDemoPlaying && demoType === 'full' ? '⏸️' : '▶️'}</span>
                    {isDemoPlaying && demoType === 'full' ? (language === 'ja' ? '停止' : 'Stop') : (language === 'ja' ? 'フルデモ' : 'Full Demo')}
                  </button>
                  <button
                    onClick={() => setIsGeneratingScenario(true)}
                    className="px-3 py-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all flex items-center gap-2"
                  >
                    <span>🎲</span>
                    {language === 'ja' ? 'シナリオ新規自動生成' : 'Generate New Scenario'}
                  </button>
                  <button
                    onClick={() => setIsEditingScenario(true)}
                    className="px-3 py-1 bg-gradient-to-r from-slate-600 to-slate-700 text-white text-sm rounded-lg hover:from-slate-700 hover:to-slate-800 transition-all flex items-center gap-2"
                  >
                    <span>✏️</span>
                    {language === 'ja' ? '編集' : 'Edit'}
                  </button>
                  {/* カスタムシナリオの場合は削除ボタンを表示 */}
                  {customScenarios.some(s => s.id === selectedScenario.id) && (
                    <button
                      onClick={() => {
                        if (confirm(language === 'ja' ? 'このシナリオを削除しますか？' : 'Delete this scenario?')) {
                          const updatedCustomScenarios = customScenarios.filter(s => s.id !== selectedScenario.id);
                          setCustomScenarios(updatedCustomScenarios);
                          localStorage.setItem('customScenarios', JSON.stringify(updatedCustomScenarios));
                          setSelectedScenario(patientScenarios[0]);
                        }
                      }}
                      className="px-3 py-1 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm rounded-lg hover:from-red-700 hover:to-red-800 transition-all flex items-center gap-2"
                    >
                      <span>🗑️</span>
                      {language === 'ja' ? '削除' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
              <select
                value={selectedScenario.id}
                onChange={(e) => handleScenarioChange(e.target.value)}
                className="w-full p-3 bg-gray-800/50 border border-cyan-500/30 rounded-xl text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all text-sm"
              >
                {[...patientScenarios, ...customScenarios].map(scenario => {
                  // 編集済みシナリオの場合はマークを付ける
                  const isEdited = !!editedScenarios[scenario.id];
                  const displayScenario = editedScenarios[scenario.id] || scenario;
                  const translatedScenario = getTranslatedScenario(displayScenario, language);
                  return (
                    <option key={scenario.id} value={scenario.id} className="bg-gray-800">
                      {isEdited ? '✓ ' : ''}{translatedScenario.name} - {translatedScenario.basicInfo.name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="glass-effect rounded-2xl p-4 border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 flex-1 overflow-hidden">
              <div 
                className="flex items-center justify-between mb-3 cursor-pointer select-none"
                onClick={() => setIsPatientInfoVisible(!isPatientInfoVisible)}
              >
                <h2 className="text-lg font-semibold text-cyan-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {language === 'ja' ? 'AI患者情報' : 'AI Patient Information'}
                </h2>
                <span className={`text-cyan-400 transition-transform duration-300 ${isPatientInfoVisible ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </div>
              
              <div className={`space-y-2 text-xs overflow-hidden transition-all duration-500 ${isPatientInfoVisible ? 'h-[calc(100%-3rem)] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0'}`}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <strong className="text-gray-400">{language === 'ja' ? '氏名' : 'Name'}：</strong> {getTranslatedScenario(selectedScenario, language).basicInfo.name}
                  </div>
                  <div>
                    <strong className="text-gray-400">{language === 'ja' ? '年齢' : 'Age'}：</strong> {getTranslatedScenario(selectedScenario, language).basicInfo.age}
                  </div>
                  <div>
                    <strong className="text-gray-400">{language === 'ja' ? '性別' : 'Gender'}：</strong> {getTranslatedScenario(selectedScenario, language).basicInfo.gender}
                  </div>
                  <div>
                    <strong className="text-gray-400">{language === 'ja' ? '職業' : 'Occupation'}：</strong> {getTranslatedScenario(selectedScenario, language).basicInfo.occupation}
                  </div>
                </div>
                <div className="border-t border-gray-700 pt-3">
                  <div className="flex items-start gap-3">
                    <span className="text-cyan-400 mt-1">▶</span>
                    <div>
                      <strong className="text-gray-400">{language === 'ja' ? '主訴' : 'Chief Complaint'}：</strong> {getTranslatedScenario(selectedScenario, language).chiefComplaint.complaint}
                      <div className="text-xs text-gray-500 mt-1">
                        {language === 'ja' ? '部位' : 'Location'}：{getTranslatedScenario(selectedScenario, language).chiefComplaint.location} / {getTranslatedScenario(selectedScenario, language).chiefComplaint.since}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-700 pt-3">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 mt-1">▶</span>
                    <div>
                      <strong className="text-gray-400">{language === 'ja' ? '現病歴' : 'Present Illness'}：</strong>
                      <div className="text-xs text-gray-300 mt-1 space-y-1">
                        <div>・{getTranslatedScenario(selectedScenario, language).presentIllness.nature}</div>
                        <div>・{getTranslatedScenario(selectedScenario, language).presentIllness.severity}</div>
                        <div>・{getTranslatedScenario(selectedScenario, language).presentIllness.dailyImpact}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-700 pt-3">
                  <div className="flex items-start gap-3">
                    <span className="text-teal-400 mt-1">▶</span>
                    <div>
                      <strong className="text-gray-400">{language === 'ja' ? '全身既往歴' : 'Medical History'}：</strong>
                      <div className="text-xs text-gray-300 mt-1">
                        {getTranslatedScenario(selectedScenario, language).medicalHistory.systemicDisease || (language === 'ja' ? 'なし' : 'None')}
                        {getTranslatedScenario(selectedScenario, language).medicalHistory.allergies && ` / ${language === 'ja' ? 'アレルギー' : 'Allergies'}：${getTranslatedScenario(selectedScenario, language).medicalHistory.allergies}`}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-700 pt-3">
                  <div className="flex items-start gap-3">
                    <span className="text-sky-400 mt-1">▶</span>
                    <div>
                      <strong className="text-gray-400">{language === 'ja' ? '心理社会的情報' : 'Psychosocial Info'}：</strong>
                      <div className="text-xs text-gray-300 mt-1">
                        {getTranslatedScenario(selectedScenario, language).psychosocial.concerns}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {!isPatientInfoVisible && (
                <div className="text-center text-gray-500 text-sm">
                  {language === 'ja' ? 'クリックして詳細を表示' : 'Click to show details'}
                </div>
              )}
            </div>
            </div>

            {/* 右側：医療面接 */}
            <div className="glass-effect rounded-2xl p-4 flex flex-col h-[400px] border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-cyan-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {language === 'ja' ? '医療面接' : 'Medical Interview'}
              </h2>
              
              {/* タイマー表示 */}
              {(isTimerRunning || interviewTime > 0) && (
                <div className="flex items-center gap-3">
                  <div className="glass-effect px-3 py-1 rounded-lg border border-cyan-500/30 flex items-center gap-2">
                    <span className="text-cyan-400">⏱️</span>
                    <span className="text-cyan-300 font-mono text-lg">
                      {formatTime(interviewTime)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setIsTimerRunning(!isTimerRunning);
                    }}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title={isTimerRunning ? (language === 'ja' ? '一時停止' : 'Pause') : (language === 'ja' ? '再開' : 'Resume')}
                  >
                    {isTimerRunning ? '⏸️' : '▶️'}
                  </button>
                  <button
                    onClick={() => {
                      setIsTimerRunning(false);
                      setInterviewTime(0);
                    }}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title={language === 'ja' ? 'リセット' : 'Reset'}
                  >
                    🔄
                  </button>
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCriteriaEditor(true)}
                  className="px-3 py-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all flex items-center gap-2"
                >
                  <span>⚙️</span>
                  {language === 'ja' ? '評価項目編集' : 'Edit Criteria'}
                </button>
                <button
                  onClick={() => setShowEvaluationList(true)}
                  className="px-3 py-1 bg-gradient-to-r from-slate-600 to-slate-700 text-white text-sm rounded-lg hover:from-slate-700 hover:to-slate-800 transition-all flex items-center gap-2"
                >
                  <span>📂</span>
                  {language === 'ja' ? '評価履歴' : 'History'}
                </button>
              </div>
            </div>
            
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto mb-3 p-3 bg-gray-900/50 rounded-xl space-y-3 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500 text-center">
                    <div>
                      {language === 'ja' ? 'マイクボタンを押して開始してください' : 'Press the microphone button to start'}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div className={`max-w-[80%] p-3 rounded-xl glass-effect ${
                      message.role === 'user' 
                        ? 'bg-cyan-900/30 border-cyan-500/30 text-cyan-100' 
                        : 'bg-blue-900/30 border-blue-500/30 text-blue-100'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <span className="text-xs opacity-60 mt-2 block">
                        {message.role === 'user' ? (language === 'ja' ? '歯科医師' : 'Dentist') : (language === 'ja' ? 'AI患者' : 'AI Patient')}
                      </span>
                    </div>
                  </div>
                ))
              )}
              {isLoadingResponse && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-xl glass-effect bg-blue-900/30 border-blue-500/30">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-blue-300">{language === 'ja' ? '考えています...' : 'Thinking...'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {apiError && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-xl">
                <p className="text-sm text-red-300">{apiError}</p>
              </div>
            )}

            {speechError && (
              <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-500/30 rounded-xl">
                <p className="text-sm text-yellow-300">{language === 'ja' ? '音声認識エラー' : 'Speech Recognition Error'}: {speechError}</p>
              </div>
            )}

            <div className="flex items-center gap-4">
              {/* 音声認識制御ボタン */}
              <button
                onClick={() => {
                  if (isListening) {
                    handleStopConversation();
                  } else {
                    handleStartConversation();
                  }
                }}
                disabled={isLoadingResponse || isCurrentlySpeaking}
                className={`relative w-16 h-16 rounded-full transition-all duration-300 ${
                  isListening 
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 scale-110 animate-pulse' 
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:scale-105'
                } ${(isLoadingResponse || isCurrentlySpeaking) ? 'opacity-50 cursor-not-allowed' : ''} shadow-lg`}
              >
                <div className="relative">
                  {/* 音声レベルメーター */}
                  {isListening && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div 
                        className="w-14 h-14 rounded-full bg-white/20 transition-transform"
                        style={{ transform: `scale(${0.8 + voiceActivityLevel * 0.4})` }}
                      />
                    </div>
                  )}
                  <span className="relative text-2xl z-10">
                    {isListening ? '⏸️' : '🎤'}
                  </span>
                </div>
              </button>
              
              <div className="flex-1">
                {isListening && (
                  <div>
                    <div className="text-cyan-400 animate-pulse">
                      <span className="text-sm">{language === 'ja' ? '聞いています...' : 'Listening...'}</span>
                    </div>
                    {transcript && (
                      <p className="text-white mt-1">{transcript}</p>
                    )}
                    {silenceTimer > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        {language === 'ja' ? '沈黙' : 'Silence'}: {silenceTimer}{language === 'ja' ? '秒' : 's'}
                      </p>
                    )}
                  </div>
                )}
                
                {isProcessing && (
                  <div className="text-yellow-400 text-sm mt-2">
                    {language === 'ja' ? '処理中...' : 'Processing...'}
                  </div>
                )}
              </div>

              {isLoading && (
                <div className="text-cyan-400 text-sm animate-pulse">
                  {language === 'ja' ? '音声を準備中...' : 'Preparing audio...'}
                </div>
              )}

              {/* AI評価ボタン */}
              {messages.length > 0 && (
                <button
                  onClick={() => setShowAIEvaluation(true)}
                  className="px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all flex items-center gap-2 animate-pulse whitespace-nowrap"
                >
                  <span>🤖</span>
                  {language === 'ja' ? '医療面接のAI評価' : 'AI Interview Evaluation'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

      {isEditingScenario && (
        <ScenarioEditor
          scenario={getTranslatedScenario(selectedScenario, language)}
          language={language}
          onSave={(updatedScenario) => {
            setSelectedScenario(updatedScenario);
            
            // オリジナルシナリオの編集の場合
            const isOriginalScenario = patientScenarios.some(s => s.id === updatedScenario.id);
            
            if (isOriginalScenario) {
              // 編集済みシナリオとして保存
              const updatedEditedScenarios = {
                ...editedScenarios,
                [updatedScenario.id]: updatedScenario
              };
              setEditedScenarios(updatedEditedScenarios);
              localStorage.setItem('editedScenarios', JSON.stringify(updatedEditedScenarios));
            } else {
              // カスタムシナリオの更新
              const updatedCustomScenarios = customScenarios.map(s => 
                s.id === updatedScenario.id ? updatedScenario : s
              );
              setCustomScenarios(updatedCustomScenarios);
              localStorage.setItem('customScenarios', JSON.stringify(updatedCustomScenarios));
            }
            setIsEditingScenario(false);
          }}
          onCancel={() => setIsEditingScenario(false)}
        />
      )}

      {isGeneratingScenario && (
        <ScenarioGenerator
          language={language}
          onGenerate={handleGenerateNewScenario}
          onCancel={() => setIsGeneratingScenario(false)}
        />
      )}

      {showAIEvaluation && (
        <AIEvaluationResult
          messages={messages}
          scenarioId={selectedScenario.id}
          onClose={() => setShowAIEvaluation(false)}
          language={language}
          onSave={(evaluation) => {
            // AI評価を保存
            const updatedEvaluations = [...evaluations, evaluation];
            setEvaluations(updatedEvaluations);
            
            // localStorageに保存
            const storedEvaluations = localStorage.getItem('evaluations');
            const allEvaluations = storedEvaluations ? JSON.parse(storedEvaluations) : [];
            localStorage.setItem('evaluations', JSON.stringify([...allEvaluations, evaluation]));
          }}
        />
      )}

      {showEvaluationList && (
        <EvaluationList
          evaluations={evaluations}
          onEdit={handleEditEvaluation}
          onDelete={handleDeleteEvaluation}
          onClose={() => setShowEvaluationList(false)}
          language={language}
        />
      )}

      {showCriteriaEditor && (
        <EvaluationCriteriaEditor
          onClose={() => setShowCriteriaEditor(false)}
          onSave={() => {
            // 評価項目が更新されたことを通知（必要に応じて処理を追加）
            // console.log('評価項目が更新されました');
          }}
          language={language}
        />
      )}

    </main>
  );
}