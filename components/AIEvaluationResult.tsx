'use client';

import { useState, useEffect } from 'react';
import type { PatientMessage } from '@/lib/openai';

interface AIEvaluationResultProps {
  messages: PatientMessage[];
  scenarioId: string;
  onClose: () => void;
  onSave?: (evaluation: any) => void;
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
  onSave
}: AIEvaluationResultProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

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
          customCriteria: customCriteria ? JSON.parse(customCriteria) : null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '評価の生成に失敗しました');
      }

      const data = await response.json();
      setEvaluation(data.evaluation);
      
      // 評価を保存
      if (onSave && data.evaluation) {
        onSave(data.evaluation);
      }
    } catch (err) {
      console.error('AI評価エラー:', err);
      setError(err instanceof Error ? err.message : '評価中にエラーが発生しました');
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
    { id: 'overview', label: '総合評価', icon: '📊' },
    { id: 'details', label: '詳細項目', icon: '📋' },
    { id: 'feedback', label: 'フィードバック', icon: '💬' },
  ];

  const categoryLabels: { [key: string]: string } = {
    communication: 'コミュニケーション',
    introduction: '導入',
    medicalInfo: '医学的情報',
    psychosocial: '心理社会的側面',
    closing: '締めくくり'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-cyan-500/30">
        {/* ヘッダー */}
        <div className="p-6 border-b border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <span>🤖</span> AI医療面接評価
              </h2>
              <p className="text-gray-400 mt-1">AIによる自動評価結果</p>
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
              <p className="mt-4 text-cyan-400 animate-pulse">AIが面接を分析中...</p>
              <p className="mt-2 text-gray-500 text-sm">しばらくお待ちください</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400">{error}</p>
              <button
                onClick={generateEvaluation}
                className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
              >
                再試行
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
                      <h3 className="text-lg font-semibold text-white">総合スコア</h3>
                      <span className={`text-4xl font-bold ${getScoreColor(evaluation.totalScore)}`}>
                        {evaluation.totalScore}点
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
                        <span>✅</span> 良かった点
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
                        <span>📝</span> 改善点
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
                        {categoryLabels[category] || category}
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
                                  {item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低'}
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
                      <span>💬</span> コミュニケーション
                    </h4>
                    <p className="text-gray-300">{evaluation.detailedFeedback.communication}</p>
                  </div>
                  <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-500/30">
                    <h4 className="text-purple-400 font-semibold mb-3 flex items-center gap-2">
                      <span>🏥</span> 医学的情報収集
                    </h4>
                    <p className="text-gray-300">{evaluation.detailedFeedback.medicalInfo}</p>
                  </div>
                  <div className="bg-cyan-900/20 rounded-xl p-4 border border-cyan-500/30">
                    <h4 className="text-cyan-400 font-semibold mb-3 flex items-center gap-2">
                      <span>📊</span> 総合評価
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
              評価日時: {new Date().toLocaleString('ja-JP')}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              閉じる
            </button>
          </div>
        )}
      </div>
    </div>
  );
}