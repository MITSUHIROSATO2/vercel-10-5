'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useAutoVoiceDetection } from '@/hooks/useAutoVoiceDetection';
import { useElevenLabsSpeech } from '@/hooks/useElevenLabsSpeech';

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
import ScenarioEditor from '@/components/ScenarioEditor';
import ScenarioGenerator from '@/components/ScenarioGenerator';
import { PatientMessage } from '@/lib/openai';
import AIEvaluationResult from '@/components/AIEvaluationResult';
import EvaluationList from '@/components/EvaluationList';
import EvaluationCriteriaEditor from '@/components/EvaluationCriteriaEditor';
import type { InterviewEvaluation as EvaluationType } from '@/lib/evaluationTypes';

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
  const [selectedAvatar, setSelectedAvatar] = useState<'adult' | 'boy' | 'boy_improved' | 'female'>('boy_improved');
  const [isAvatarLoaded, setIsAvatarLoaded] = useState(false);
  
  // アバター変更時にローディング状態をリセット
  const handleAvatarChange = (avatar: 'adult' | 'boy' | 'boy_improved' | 'female') => {
    if (avatar !== selectedAvatar) {
      setIsAvatarLoaded(false);
      setSelectedAvatar(avatar);
    }
  };
  
  // onLoaded コールバックをメモ化
  const handleAvatarLoaded = React.useCallback(() => {
    setIsAvatarLoaded(true);
  }, []);

  const isConversationActiveRef = useRef(false);
  
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
      startConversation((finalTranscript) => {
        if (finalTranscript.trim() && isConversationActiveRef.current) {
          // console.log('音声認識結果:', finalTranscript);
          handleSendMessage(finalTranscript);
        }
      });
      
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
          patientScenario: formatScenarioForAI(selectedScenario)
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
        
        // ElevenLabsまたはフォールバックで音声合成
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
          }
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
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <button
                    onClick={() => handleAvatarChange('boy_improved')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedAvatar === 'boy_improved'
                        ? 'bg-cyan-600 text-white shadow-lg'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    青年改
                  </button>
                  <button
                    onClick={() => handleAvatarChange('boy')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedAvatar === 'boy'
                        ? 'bg-cyan-600 text-white shadow-lg'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    青年
                  </button>
                  <button
                    onClick={() => handleAvatarChange('adult')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedAvatar === 'adult'
                        ? 'bg-cyan-600 text-white shadow-lg'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    成人男性
                  </button>
                  <button
                    onClick={() => handleAvatarChange('female')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedAvatar === 'female'
                        ? 'bg-cyan-600 text-white shadow-lg'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    女性
                  </button>
                </div>
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
                    isSpeaking={isSpeaking || isCurrentlySpeaking} 
                    currentWord={currentWord}
                    audioLevel={audioLevel}
                    currentPhoneme={currentPhoneme}
                    speechProgress={speechProgress}
                    modelPath={
                      selectedAvatar === 'adult' 
                        ? (process.env.NEXT_PUBLIC_MODEL_ADULT || '/models/成人男性.glb')
                        : selectedAvatar === 'boy'
                        ? (process.env.NEXT_PUBLIC_MODEL_BOY || '/models/少年アバター.glb')
                        : selectedAvatar === 'boy_improved'
                        ? (process.env.NEXT_PUBLIC_MODEL_BOY_IMPROVED || '/models/少年改アバター.glb')
                        : (process.env.NEXT_PUBLIC_MODEL_FEMALE || '/models/Hayden_059d-NO-GUI.glb')
                    }
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
                  シナリオ選択
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsGeneratingScenario(true)}
                    className="px-3 py-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all flex items-center gap-2"
                  >
                    <span>🎲</span>
                    シナリオ新規自動生成
                  </button>
                  <button
                    onClick={() => setIsEditingScenario(true)}
                    className="px-3 py-1 bg-gradient-to-r from-slate-600 to-slate-700 text-white text-sm rounded-lg hover:from-slate-700 hover:to-slate-800 transition-all flex items-center gap-2"
                  >
                    <span>✏️</span>
                    編集
                  </button>
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
                  return (
                    <option key={scenario.id} value={scenario.id} className="bg-gray-800">
                      {isEdited ? '✓ ' : ''}{displayScenario.name} - {displayScenario.basicInfo.name}
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
                  AI患者情報
                </h2>
                <span className={`text-cyan-400 transition-transform duration-300 ${isPatientInfoVisible ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </div>
              
              <div className={`space-y-2 text-xs overflow-hidden transition-all duration-500 ${isPatientInfoVisible ? 'h-[calc(100%-3rem)] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0'}`}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <strong className="text-gray-400">氏名：</strong> {selectedScenario.basicInfo.name}
                  </div>
                  <div>
                    <strong className="text-gray-400">年齢：</strong> {selectedScenario.basicInfo.age}
                  </div>
                  <div>
                    <strong className="text-gray-400">性別：</strong> {selectedScenario.basicInfo.gender}
                  </div>
                  <div>
                    <strong className="text-gray-400">職業：</strong> {selectedScenario.basicInfo.occupation}
                  </div>
                </div>
                <div className="border-t border-gray-700 pt-3">
                  <div className="flex items-start gap-3">
                    <span className="text-cyan-400 mt-1">▶</span>
                    <div>
                      <strong className="text-gray-400">主訴：</strong> {selectedScenario.chiefComplaint.complaint}
                      <div className="text-xs text-gray-500 mt-1">
                        部位：{selectedScenario.chiefComplaint.location} / {selectedScenario.chiefComplaint.since}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-700 pt-3">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 mt-1">▶</span>
                    <div>
                      <strong className="text-gray-400">現病歴：</strong>
                      <div className="text-xs text-gray-300 mt-1 space-y-1">
                        <div>・{selectedScenario.presentIllness.nature}</div>
                        <div>・{selectedScenario.presentIllness.severity}</div>
                        <div>・{selectedScenario.presentIllness.dailyImpact}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-700 pt-3">
                  <div className="flex items-start gap-3">
                    <span className="text-teal-400 mt-1">▶</span>
                    <div>
                      <strong className="text-gray-400">全身既往歴：</strong>
                      <div className="text-xs text-gray-300 mt-1">
                        {selectedScenario.medicalHistory.systemicDisease || 'なし'}
                        {selectedScenario.medicalHistory.allergies && ` / アレルギー：${selectedScenario.medicalHistory.allergies}`}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-700 pt-3">
                  <div className="flex items-start gap-3">
                    <span className="text-sky-400 mt-1">▶</span>
                    <div>
                      <strong className="text-gray-400">心理社会的情報：</strong>
                      <div className="text-xs text-gray-300 mt-1">
                        {selectedScenario.psychosocial.concerns}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {!isPatientInfoVisible && (
                <div className="text-center text-gray-500 text-sm">
                  クリックして詳細を表示
                </div>
              )}
            </div>
            </div>

            {/* 右側：医療面接 */}
            <div className="glass-effect rounded-2xl p-4 flex flex-col h-[400px] border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-cyan-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                医療面接
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCriteriaEditor(true)}
                  className="px-3 py-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all flex items-center gap-2"
                >
                  <span>⚙️</span>
                  評価項目編集
                </button>
                <button
                  onClick={() => setShowEvaluationList(true)}
                  className="px-3 py-1 bg-gradient-to-r from-slate-600 to-slate-700 text-white text-sm rounded-lg hover:from-slate-700 hover:to-slate-800 transition-all flex items-center gap-2"
                >
                  <span>📂</span>
                  評価履歴
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto mb-3 p-3 bg-gray-900/50 rounded-xl space-y-3 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500 text-center">
                    <div>
                      マイクボタンを押して開始してください
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
                        {message.role === 'user' ? '歯科医師' : 'AI患者'}
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
                      <span className="text-xs text-blue-300">考えています...</span>
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
                <p className="text-sm text-yellow-300">音声認識エラー: {speechError}</p>
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
                      <span className="text-sm">聞いています...</span>
                    </div>
                    {transcript && (
                      <p className="text-white mt-1">{transcript}</p>
                    )}
                    {silenceTimer > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        沈黙: {silenceTimer}秒
                      </p>
                    )}
                  </div>
                )}
                
                {isProcessing && (
                  <div className="text-yellow-400 text-sm mt-2">
                    処理中...
                  </div>
                )}
              </div>

              {isLoading && (
                <div className="text-cyan-400 text-sm animate-pulse">
                  音声を準備中...
                </div>
              )}

              {/* AI評価ボタン */}
              {messages.length > 0 && (
                <button
                  onClick={() => setShowAIEvaluation(true)}
                  className="px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all flex items-center gap-2 animate-pulse whitespace-nowrap"
                >
                  <span>🤖</span>
                  医療面接のAI評価
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

      {isEditingScenario && (
        <ScenarioEditor
          scenario={selectedScenario}
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
          onGenerate={handleGenerateNewScenario}
          onCancel={() => setIsGeneratingScenario(false)}
        />
      )}

      {showAIEvaluation && (
        <AIEvaluationResult
          messages={messages}
          scenarioId={selectedScenario.id}
          onClose={() => setShowAIEvaluation(false)}
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
        />
      )}

      {showCriteriaEditor && (
        <EvaluationCriteriaEditor
          onClose={() => setShowCriteriaEditor(false)}
          onSave={() => {
            // 評価項目が更新されたことを通知（必要に応じて処理を追加）
            // console.log('評価項目が更新されました');
          }}
        />
      )}

    </main>
  );
}