'use client';

import { useState, useEffect } from 'react';
import type { PatientMessage } from '@/lib/openai';

interface AIEvaluationResultProps {
  messages: PatientMessage[];
  scenarioId: string;
  onClose: () => void;
  onSave?: (evaluation: any) => void;
  onRetry?: () => void;
  onNewScenario?: () => void;
  language?: 'ja' | 'en';
  availableScenarios?: Array<{ id: string; name: string }>;
  onScenarioSelect?: (scenarioId: string) => void;
}

interface EvaluationResult {
  evaluatedItems: Array<{
    category: string;
    subcategory?: string;
    item: string;
    checked: boolean;
    comment: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  totalScore: number;
  maxScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  detailedFeedback: {
    communication: string;
    medicalInfo: string;
    overall: string;
  };
}

export default function AIEvaluationResult({
  messages,
  scenarioId,
  onClose,
  onSave,
  onRetry,
  onNewScenario,
  language = 'ja',
  availableScenarios = [],
  onScenarioSelect
}: AIEvaluationResultProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showScenarioSelector, setShowScenarioSelector] = useState(false);

  useEffect(() => {
    generateEvaluation();
  }, [messages, scenarioId]);

  const generateEvaluation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // LocalStorageからカスタム評価項目を取得
      const customCriteria = localStorage.getItem('evaluationCriteria');
      
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          scenarioId,
          customCriteria: customCriteria ? JSON.parse(customCriteria) : null,
          language
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || (language === 'ja' ? '評価の生成に失敗しました' : 'Failed to generate evaluation'));
      }

      const data = await response.json();
      setEvaluation(data.evaluation);

      // 評価を保存（会話ログとAI評価を含む）
      if (onSave && data.evaluation) {
        // evaluatedItemsをcategories構造に変換
        const categories = {
          communication: {
            verbal: data.evaluation.evaluatedItems
              .filter((item: any) => item.category === 'interpersonal')
              .map((item: any) => ({
                id: item.item,
                label: item.item,
                checked: item.checked,
                category: 'communication',
                subcategory: 'verbal',
                priority: item.priority
              })),
            overall: data.evaluation.evaluatedItems
              .filter((item: any) => item.category === 'overall')
              .map((item: any) => ({
                id: item.item,
                label: item.item,
                checked: item.checked,
                category: 'communication',
                subcategory: 'overall',
                priority: item.priority
              }))
          },
          introduction: data.evaluation.evaluatedItems
            .filter((item: any) => item.category === 'opening')
            .map((item: any) => ({
              id: item.item,
              label: item.item,
              checked: item.checked,
              category: 'introduction',
              priority: item.priority
            })),
          medicalInfo: {
            chiefComplaint: data.evaluation.evaluatedItems
              .filter((item: any) => item.category === 'medicalInfo' && item.subcategory === 'chiefComplaint')
              .map((item: any) => ({
                id: item.item,
                label: item.item,
                checked: item.checked,
                category: 'medicalInfo',
                subcategory: item.subcategory,
                priority: item.priority
              })),
            history: data.evaluation.evaluatedItems
              .filter((item: any) => item.category === 'medicalInfo' && item.subcategory === 'history')
              .map((item: any) => ({
                id: item.item,
                label: item.item,
                checked: item.checked,
                category: 'medicalInfo',
                subcategory: item.subcategory,
                priority: item.priority
              })),
            lifestyle: data.evaluation.evaluatedItems
              .filter((item: any) => item.category === 'medicalInfo' && item.subcategory === 'lifestyle')
              .map((item: any) => ({
                id: item.item,
                label: item.item,
                checked: item.checked,
                category: 'medicalInfo',
                subcategory: item.subcategory,
                priority: item.priority
              }))
          },
          psychosocial: data.evaluation.evaluatedItems
            .filter((item: any) => item.category === 'psychosocial')
            .map((item: any) => ({
              id: item.item,
              label: item.item,
              checked: item.checked,
              category: 'psychosocial',
              priority: item.priority
            })),
          closing: data.evaluation.evaluatedItems
            .filter((item: any) => item.category === 'closing')
            .map((item: any) => ({
              id: item.item,
              label: item.item,
              checked: item.checked,
              category: 'closing',
              priority: item.priority
            }))
        };

        const evaluationWithDetails = {
          id: `eval_${Date.now()}`,
          scenarioId,
          timestamp: new Date(),
          totalScore: data.evaluation.totalScore || 0,
          maxScore: data.evaluation.maxScore || 100,
          evaluatorName: data.evaluation.evaluatorName || 'AI自動評価システム',
          // evaluatedItems を保存（EvaluationListで後方互換性のため）
          evaluatedItems: data.evaluation.evaluatedItems,
          categories,
          conversationLog: messages.map((msg, index) => ({
            role: msg.role === 'user' ? 'student' : 'patient',
            content: msg.content,
            timestamp: new Date(Date.now() - (messages.length - index) * 30000).toISOString() // 概算のタイムスタンプ
          })),
          aiEvaluation: {
            summary: data.evaluation.summary || '',
            strengths: data.evaluation.strengths || [],
            improvements: data.evaluation.improvements || [],
            detailedFeedback: data.evaluation.detailedFeedback || {
              communication: '',
              medicalInfo: '',
              overall: ''
            }
          }
        };
        onSave(evaluationWithDetails);
      }
    } catch (err) {
      console.error('AI evaluation error:', err);
      setError(err instanceof Error ? err.message : (language === 'ja' ? '評価中にエラーが発生しました' : 'An error occurred during evaluation'));
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const tabs = [
    { id: 'overview', label: language === 'ja' ? '総合評価' : 'Overall Evaluation', icon: '📊' },
    { id: 'details', label: language === 'ja' ? '詳細項目' : 'Detailed Items', icon: '📋' },
    { id: 'feedback', label: language === 'ja' ? 'フィードバック' : 'Feedback', icon: '💬' },
  ];

  const categoryLabels: { [key: string]: { ja: string; en: string } } = {
    procedure: { ja: '手順・手続き', en: 'Procedure' },
    communication: { ja: 'コミュニケーション', en: 'Communication' },
    introduction: { ja: '導入', en: 'Introduction' },
    medicalInfo: { ja: '医学的情報', en: 'Medical Information' },
    psychosocial: { ja: '心理社会的側面', en: 'Psychosocial Aspects' },
    closing: { ja: '締めくくり', en: 'Closing' }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-cyan-500/30">
        {/* ヘッダー */}
        <div className="p-6 border-b border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <span>🤖</span> {language === 'ja' ? 'AI医療面接評価' : 'AI Medical Interview Evaluation'}
              </h2>
              <p className="text-gray-400 mt-1 text-sm">
                {language === 'ja' ? 'OpenAI GPT-5 による自動評価結果' : 'Automatic Evaluation by OpenAI GPT-5'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-cyan-500/30 rounded-full animate-spin border-t-cyan-500"></div>
                <span className="absolute inset-0 flex items-center justify-center text-2xl">🤖</span>
              </div>
              <p className="mt-4 text-cyan-400 animate-pulse">
                {language === 'ja' ? 'AIが面接を分析中...' : 'AI is analyzing the interview...'}
              </p>
              <p className="mt-2 text-gray-500 text-sm">
                {language === 'ja' ? 'しばらくお待ちください' : 'Please wait a moment'}
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400">{error}</p>
              <button
                onClick={generateEvaluation}
                className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
              >
                {language === 'ja' ? '再試行' : 'Retry'}
              </button>
            </div>
          ) : evaluation ? (
            <>
              {/* タブナビゲーション */}
              <div className="flex gap-2 mb-6">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'bg-cyan-600/30 text-cyan-400 border border-cyan-500/50'
                        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* 総合評価タブ */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* スコア */}
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-cyan-500/20">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">
                        {language === 'ja' ? '総合スコア' : 'Total Score'}
                      </h3>
                      <span className={`text-4xl font-bold ${getScoreColor(evaluation.totalScore)}`}>
                        {evaluation.totalScore}{language === 'ja' ? '点' : ' points'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${
                          evaluation.totalScore >= 80 ? 'bg-green-500' :
                          evaluation.totalScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${evaluation.totalScore}%` }}
                      />
                    </div>
                    <p className="mt-4 text-gray-300">{evaluation.summary}</p>
                  </div>

                  {/* 強みと改善点 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-900/20 rounded-xl p-4 border border-green-500/30">
                      <h4 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                        <span>✅</span> {language === 'ja' ? '良かった点' : 'Strengths'}
                      </h4>
                      <ul className="space-y-2">
                        {evaluation.strengths.map((strength, idx) => (
                          <li key={idx} className="text-gray-300 flex items-start gap-2">
                            <span className="text-green-400 mt-1">•</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-orange-900/20 rounded-xl p-4 border border-orange-500/30">
                      <h4 className="text-orange-400 font-semibold mb-3 flex items-center gap-2">
                        <span>📝</span> {language === 'ja' ? '改善点' : 'Areas for Improvement'}
                      </h4>
                      <ul className="space-y-2">
                        {evaluation.improvements.map((improvement, idx) => (
                          <li key={idx} className="text-gray-300 flex items-start gap-2">
                            <span className="text-orange-400 mt-1">•</span>
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 詳細項目タブ */}
              {activeTab === 'details' && (
                <div className="space-y-4">
                  {Object.entries(
                    evaluation.evaluatedItems.reduce((acc, item) => {
                      const cat = item.category;
                      if (!acc[cat]) acc[cat] = [];
                      acc[cat].push(item);
                      return acc;
                    }, {} as Record<string, typeof evaluation.evaluatedItems>)
                  ).map(([category, items]) => (
                    <div key={category} className="bg-gray-800/50 rounded-xl p-4 border border-cyan-500/20">
                      <h4 className="text-cyan-400 font-semibold mb-3">
                        {categoryLabels[category]?.[language] || category}
                      </h4>
                      <div className="space-y-2">
                        {items.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={item.checked}
                              readOnly
                              className="mt-1 rounded border-gray-600 bg-gray-700 text-cyan-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-300">{item.item}</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(item.priority)}`}>
                                  {language === 'ja'
                                    ? (item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低')
                                    : (item.priority === 'high' ? 'High' : item.priority === 'medium' ? 'Medium' : 'Low')}
                                </span>
                              </div>
                              {item.comment && (
                                <p className="text-xs text-gray-500 mt-1">{item.comment}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* フィードバックタブ */}
              {activeTab === 'feedback' && (
                <div className="space-y-4">
                  <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-500/30">
                    <h4 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
                      <span>💬</span> {language === 'ja' ? 'コミュニケーション' : 'Communication'}
                    </h4>
                    <p className="text-gray-300">{evaluation.detailedFeedback.communication}</p>
                  </div>
                  <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-500/30">
                    <h4 className="text-purple-400 font-semibold mb-3 flex items-center gap-2">
                      <span>🏥</span> {language === 'ja' ? '医学的情報収集' : 'Medical Information Gathering'}
                    </h4>
                    <p className="text-gray-300">{evaluation.detailedFeedback.medicalInfo}</p>
                  </div>
                  <div className="bg-cyan-900/20 rounded-xl p-4 border border-cyan-500/30">
                    <h4 className="text-cyan-400 font-semibold mb-3 flex items-center gap-2">
                      <span>📊</span> {language === 'ja' ? '総合評価' : 'Overall Evaluation'}
                    </h4>
                    <p className="text-gray-300">{evaluation.detailedFeedback.overall}</p>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* フッター */}
        {!isLoading && evaluation && (
          <div className="p-6 border-t border-cyan-500/30 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {language === 'ja' ? '評価日時' : 'Evaluation Date'}: {new Date().toLocaleString(language === 'ja' ? 'ja-JP' : 'en-US')}
            </div>
            <div className="flex items-center gap-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center gap-2"
                >
                  <span>🔄</span>
                  {language === 'ja' ? 'もう一度練習' : 'Practice Again'}
                </button>
              )}
              {onNewScenario && (
                <button
                  onClick={() => setShowScenarioSelector(!showScenarioSelector)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2"
                >
                  <span>📋</span>
                  {language === 'ja' ? '新しいシナリオで練習' : 'Practice with New Scenario'}
                </button>
              )}
              {showScenarioSelector && availableScenarios.length > 0 && (
                <div className="absolute bottom-16 right-6 bg-slate-800 rounded-lg border border-cyan-500/30 shadow-xl max-h-80 overflow-y-auto min-w-[300px]">
                  <div className="p-3 border-b border-cyan-500/30 flex items-center justify-between">
                    <p className="text-sm text-gray-400">{language === 'ja' ? 'シナリオを選択' : 'Select Scenario'}</p>
                    <button
                      onClick={() => setShowScenarioSelector(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-2">
                    {availableScenarios.map((scenario) => (
                      <button
                        key={scenario.id}
                        onClick={() => {
                          if (onScenarioSelect) {
                            onScenarioSelect(scenario.id);
                          }
                          setShowScenarioSelector(false);
                          onClose();
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-cyan-600/20 rounded transition-colors"
                      >
                        {scenario.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={onClose}
                className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
              >
                {language === 'ja' ? '閉じる' : 'Close'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}