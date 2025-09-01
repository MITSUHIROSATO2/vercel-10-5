'use client';

import { useState } from 'react';
import type { InterviewEvaluation } from '@/lib/evaluationTypes';

interface EvaluationListProps {
  evaluations: InterviewEvaluation[];
  onEdit: (evaluation: InterviewEvaluation) => void;
  onDelete: (evaluationId: string) => void;
  onClose: () => void;
}

export default function EvaluationList({
  evaluations,
  onEdit,
  onDelete,
  onClose
}: EvaluationListProps) {
  const [selectedEvaluation, setSelectedEvaluation] = useState<InterviewEvaluation | null>(null);

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden border border-cyan-500/30">
        {/* ヘッダー */}
        <div className="p-6 border-b border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                評価履歴
              </h2>
              <p className="text-gray-400 mt-1">過去の医療面接評価一覧</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* リスト */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 100px)' }}>
          {evaluations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">評価履歴がありません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {evaluations.map((evaluation) => {
                const percentage = evaluation.totalScore && evaluation.maxScore 
                  ? Math.round((evaluation.totalScore / evaluation.maxScore) * 100)
                  : 0;
                
                return (
                  <div
                    key={evaluation.id}
                    className="bg-gray-800/50 rounded-xl p-4 border border-cyan-500/20 hover:border-cyan-500/40 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            シナリオID: {evaluation.scenarioId}
                          </h3>
                          <span className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
                            {percentage}%
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">評価日時: </span>
                            <span className="text-white">{formatDate(evaluation.timestamp)}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">評価者: </span>
                            <span className="text-white">{evaluation.evaluatorName || '未記入'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">スコア: </span>
                            <span className="text-white">
                              {evaluation.totalScore || 0} / {evaluation.maxScore || 100} 点
                            </span>
                          </div>
                        </div>

                        {evaluation.notes && (
                          <div className="mt-3 p-3 bg-gray-900/50 rounded-lg">
                            <p className="text-sm text-gray-300">{evaluation.notes}</p>
                          </div>
                        )}

                        {/* 詳細表示 */}
                        {selectedEvaluation?.id === evaluation.id && (
                          <div className="mt-4 p-4 bg-gray-900/30 rounded-lg space-y-3">
                            <h4 className="text-cyan-400 font-semibold">評価詳細</h4>
                            
                            {/* チェック済み項目のサマリー */}
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-400">コミュニケーション: </span>
                                <span className="text-white">
                                  {[...evaluation.categories.communication.verbal, ...evaluation.categories.communication.overall]
                                    .filter(item => item.checked).length} / 
                                  {evaluation.categories.communication.verbal.length + evaluation.categories.communication.overall.length}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">導入: </span>
                                <span className="text-white">
                                  {evaluation.categories.introduction.filter(item => item.checked).length} / 
                                  {evaluation.categories.introduction.length}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">医学的情報: </span>
                                <span className="text-white">
                                  {[...evaluation.categories.medicalInfo.chiefComplaint, 
                                    ...evaluation.categories.medicalInfo.history,
                                    ...evaluation.categories.medicalInfo.lifestyle]
                                    .filter(item => item.checked).length} / 
                                  {evaluation.categories.medicalInfo.chiefComplaint.length + 
                                   evaluation.categories.medicalInfo.history.length +
                                   evaluation.categories.medicalInfo.lifestyle.length}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">心理社会: </span>
                                <span className="text-white">
                                  {evaluation.categories.psychosocial.filter(item => item.checked).length} / 
                                  {evaluation.categories.psychosocial.length}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">締めくくり: </span>
                                <span className="text-white">
                                  {evaluation.categories.closing.filter(item => item.checked).length} / 
                                  {evaluation.categories.closing.length}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* アクションボタン */}
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => setSelectedEvaluation(
                            selectedEvaluation?.id === evaluation.id ? null : evaluation
                          )}
                          className="px-3 py-1 bg-cyan-600/20 text-cyan-400 rounded-lg hover:bg-cyan-600/30 transition-all text-sm"
                        >
                          {selectedEvaluation?.id === evaluation.id ? '閉じる' : '詳細'}
                        </button>
                        <button
                          onClick={() => onEdit(evaluation)}
                          className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-all text-sm"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('この評価を削除しますか？')) {
                              onDelete(evaluation.id);
                            }
                          }}
                          className="px-3 py-1 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-all text-sm"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}