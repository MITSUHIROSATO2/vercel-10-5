'use client';

import { useState } from 'react';
import type { InterviewEvaluation } from '@/lib/evaluationTypes';

interface EvaluationListProps {
  evaluations: InterviewEvaluation[];
  onDelete: (evaluationId: string) => void;
  onClose: () => void;
  language?: 'ja' | 'en';
}

export default function EvaluationList({
  evaluations,
  onDelete,
  onClose,
  language = 'ja'
}: EvaluationListProps) {
  const [selectedEvaluation, setSelectedEvaluation] = useState<InterviewEvaluation | null>(null);
  const [detailView, setDetailView] = useState<'overall' | 'details' | 'feedback' | 'conversation'>('overall');

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US', {
      year: 'numeric',
      month: language === 'ja' ? '2-digit' : 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 評価詳細をファイルとしてエクスポート
  const exportEvaluation = (evaluation: InterviewEvaluation) => {
    const exportData = {
      基本情報: {
        評価ID: evaluation.id,
        シナリオID: evaluation.scenarioId,
        評価日時: formatDate(evaluation.timestamp),
        評価者: evaluation.evaluatorName || (language === 'ja' ? '未記入' : 'Not entered'),
        総合スコア: `${evaluation.totalScore || 0} / ${evaluation.maxScore || 100} 点`,
        達成率: `${evaluation.totalScore && evaluation.maxScore
          ? Math.round((evaluation.totalScore / evaluation.maxScore) * 100)
          : 0}%`
      },
      評価項目: evaluation.categories ? {
        コミュニケーション: {
          言語的: evaluation.categories.communication?.verbal?.filter(item => item.checked).map(item => item.label) || [],
          全体的: evaluation.categories.communication?.overall?.filter(item => item.checked).map(item => item.label) || []
        },
        導入: evaluation.categories.introduction?.filter(item => item.checked).map(item => item.label) || [],
        医学的情報: {
          主訴: evaluation.categories.medicalInfo?.chiefComplaint?.filter(item => item.checked).map(item => item.label) || [],
          既往歴: evaluation.categories.medicalInfo?.history?.filter(item => item.checked).map(item => item.label) || [],
          生活習慣: evaluation.categories.medicalInfo?.lifestyle?.filter(item => item.checked).map(item => item.label) || []
        },
        心理社会的情報: evaluation.categories.psychosocial?.filter(item => item.checked).map(item => item.label) || [],
        締めくくり: evaluation.categories.closing?.filter(item => item.checked).map(item => item.label) || []
      } : null,
      AI評価: evaluation.aiEvaluation || null,
      会話ログ: evaluation.conversationLog || null,
      備考: evaluation.notes || ''
    };

    // JSONファイルとしてダウンロード
    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluation_${evaluation.scenarioId}_${new Date(evaluation.timestamp).toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // すべての評価をエクスポート
  const exportAllEvaluations = () => {
    const exportData = evaluations.map(evaluation => ({
      基本情報: {
        評価ID: evaluation.id,
        シナリオID: evaluation.scenarioId,
        評価日時: formatDate(evaluation.timestamp),
        評価者: evaluation.evaluatorName || (language === 'ja' ? '未記入' : 'Not entered'),
        総合スコア: `${evaluation.totalScore || 0} / ${evaluation.maxScore || 100} 点`,
        達成率: `${evaluation.totalScore && evaluation.maxScore
          ? Math.round((evaluation.totalScore / evaluation.maxScore) * 100)
          : 0}%`
      },
      評価項目: evaluation.categories ? {
        コミュニケーション: {
          言語的: evaluation.categories.communication?.verbal?.filter(item => item.checked).map(item => item.label) || [],
          全体的: evaluation.categories.communication?.overall?.filter(item => item.checked).map(item => item.label) || []
        },
        導入: evaluation.categories.introduction?.filter(item => item.checked).map(item => item.label) || [],
        医学的情報: {
          主訴: evaluation.categories.medicalInfo?.chiefComplaint?.filter(item => item.checked).map(item => item.label) || [],
          既往歴: evaluation.categories.medicalInfo?.history?.filter(item => item.checked).map(item => item.label) || [],
          生活習慣: evaluation.categories.medicalInfo?.lifestyle?.filter(item => item.checked).map(item => item.label) || []
        },
        心理社会的情報: evaluation.categories.psychosocial?.filter(item => item.checked).map(item => item.label) || [],
        締めくくり: evaluation.categories.closing?.filter(item => item.checked).map(item => item.label) || []
      } : null,
      AI評価: evaluation.aiEvaluation || null,
      会話ログ: evaluation.conversationLog || null,
      備考: evaluation.notes || ''
    }));

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_evaluations_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden border border-cyan-500/30">
        {/* ヘッダー */}
        <div className="p-6 border-b border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {language === 'ja' ? '評価履歴' : 'Evaluation History'}
              </h2>
              <p className="text-gray-400 mt-1">
                {language === 'ja' ? '過去の医療面接評価一覧' : 'Past Medical Interview Evaluations'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {evaluations.length > 0 && (
                <button
                  onClick={exportAllEvaluations}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all flex items-center gap-2 text-sm"
                  title={language === 'ja' ? 'すべての評価をエクスポート' : 'Export All Evaluations'}
                >
                  <span>📥</span>
                  {language === 'ja' ? '全てエクスポート' : 'Export All'}
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors text-xl"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* リスト */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 100px)' }}>
          {evaluations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">
                {language === 'ja' ? '評価履歴がありません' : 'No evaluation history'}
              </p>
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
                            {language === 'ja' ? 'シナリオID' : 'Scenario ID'}: {evaluation.scenarioId}
                          </h3>
                          <span className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
                            {percentage}%
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">
                              {language === 'ja' ? '評価日時' : 'Evaluation Date'}:
                            </span>
                            <span className="text-white">{formatDate(evaluation.timestamp)}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">
                              {language === 'ja' ? '評価者' : 'Evaluator'}:
                            </span>
                            <span className="text-white">
                              {evaluation.evaluatorName || (language === 'ja' ? '未記入' : 'Not entered')}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">
                              {language === 'ja' ? 'スコア' : 'Score'}:
                            </span>
                            <span className="text-white">
                              {evaluation.totalScore || 0} / {evaluation.maxScore || 100} {language === 'ja' ? '点' : 'points'}
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
                          <div className="mt-4 p-4 bg-gray-900/30 rounded-lg space-y-4">
                            {/* タブ切り替え */}
                            <div className="flex gap-2 border-b border-cyan-500/30 pb-2">
                              <button
                                onClick={() => setDetailView('overall')}
                                className={`px-3 py-1 rounded-t transition-all ${
                                  detailView === 'overall'
                                    ? 'bg-cyan-600/30 text-cyan-400 border-b-2 border-cyan-400'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                              >
                                {language === 'ja' ? '総合評価' : 'Overall Evaluation'}
                              </button>
                              <button
                                onClick={() => setDetailView('details')}
                                className={`px-3 py-1 rounded-t transition-all ${
                                  detailView === 'details'
                                    ? 'bg-cyan-600/30 text-cyan-400 border-b-2 border-cyan-400'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                              >
                                {language === 'ja' ? '詳細項目' : 'Detailed Items'}
                              </button>
                              <button
                                onClick={() => setDetailView('feedback')}
                                className={`px-3 py-1 rounded-t transition-all ${
                                  detailView === 'feedback'
                                    ? 'bg-cyan-600/30 text-cyan-400 border-b-2 border-cyan-400'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                              >
                                {language === 'ja' ? 'フィードバック' : 'Feedback'}
                              </button>
                              <button
                                onClick={() => setDetailView('conversation')}
                                className={`px-3 py-1 rounded-t transition-all ${
                                  detailView === 'conversation'
                                    ? 'bg-cyan-600/30 text-cyan-400 border-b-2 border-cyan-400'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                              >
                                {language === 'ja' ? '会話ログ' : 'Conversation Log'}
                              </button>
                            </div>

                            {/* コンテンツエリア */}
                            {/* 総合評価タブ */}
                            {detailView === 'overall' && (
                              <div className="space-y-4">
                                {/* スコアサマリー */}
                                <div className="bg-gray-800/50 rounded-lg p-4">
                                  <h5 className="text-cyan-400 font-semibold mb-3">
                                    {language === 'ja' ? 'スコアサマリー' : 'Score Summary'}
                                  </h5>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <span className="text-gray-400 text-xs">
                                        {language === 'ja' ? '総合スコア' : 'Total Score'}
                                      </span>
                                      <p className="text-2xl font-bold text-white">
                                        {evaluation.totalScore || 0} / {evaluation.maxScore || 100}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-gray-400 text-xs">
                                        {language === 'ja' ? '達成率' : 'Achievement Rate'}
                                      </span>
                                      <p className={`text-2xl font-bold ${getScoreColor(
                                        evaluation.totalScore && evaluation.maxScore
                                          ? Math.round((evaluation.totalScore / evaluation.maxScore) * 100)
                                          : 0
                                      )}`}>
                                        {evaluation.totalScore && evaluation.maxScore
                                          ? Math.round((evaluation.totalScore / evaluation.maxScore) * 100)
                                          : 0}%
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* AI総合評価 */}
                                {evaluation.aiEvaluation?.summary && (
                                  <div className="bg-gray-800/50 rounded-lg p-4">
                                    <h5 className="text-cyan-400 font-semibold mb-2">
                                      {language === 'ja' ? 'AI総合評価' : 'AI Overall Assessment'}
                                    </h5>
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                      {evaluation.aiEvaluation.summary}
                                    </p>
                                  </div>
                                )}

                                {/* カテゴリー別サマリー */}
                                {evaluation.categories && (
                                  <div className="bg-gray-800/50 rounded-lg p-4">
                                    <h5 className="text-cyan-400 font-semibold mb-3">
                                      {language === 'ja' ? 'カテゴリー別達成状況' : 'Category Achievement'}
                                    </h5>
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-300 text-sm">
                                          {language === 'ja' ? 'コミュニケーション' : 'Communication'}
                                        </span>
                                        <span className="text-white text-sm font-medium">
                                          {[...(evaluation.categories.communication?.verbal || []),
                                            ...(evaluation.categories.communication?.overall || [])]
                                            .filter(item => item.checked).length} /
                                          {(evaluation.categories.communication?.verbal?.length || 0) +
                                           (evaluation.categories.communication?.overall?.length || 0)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-300 text-sm">
                                          {language === 'ja' ? '導入' : 'Introduction'}
                                        </span>
                                        <span className="text-white text-sm font-medium">
                                          {(evaluation.categories.introduction || []).filter(item => item.checked).length} /
                                          {evaluation.categories.introduction?.length || 0}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-300 text-sm">
                                          {language === 'ja' ? '医学的情報' : 'Medical Information'}
                                        </span>
                                        <span className="text-white text-sm font-medium">
                                          {[...(evaluation.categories.medicalInfo?.chiefComplaint || []),
                                            ...(evaluation.categories.medicalInfo?.history || []),
                                            ...(evaluation.categories.medicalInfo?.lifestyle || [])]
                                            .filter(item => item.checked).length} /
                                          {(evaluation.categories.medicalInfo?.chiefComplaint?.length || 0) +
                                           (evaluation.categories.medicalInfo?.history?.length || 0) +
                                           (evaluation.categories.medicalInfo?.lifestyle?.length || 0)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-300 text-sm">
                                          {language === 'ja' ? '心理社会的情報' : 'Psychosocial'}
                                        </span>
                                        <span className="text-white text-sm font-medium">
                                          {(evaluation.categories.psychosocial || []).filter(item => item.checked).length} /
                                          {evaluation.categories.psychosocial?.length || 0}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-300 text-sm">
                                          {language === 'ja' ? '締めくくり' : 'Closing'}
                                        </span>
                                        <span className="text-white text-sm font-medium">
                                          {(evaluation.categories.closing || []).filter(item => item.checked).length} /
                                          {evaluation.categories.closing?.length || 0}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 詳細項目タブ */}
                            {detailView === 'details' && (
                              <div className="space-y-4">
                                {evaluation.categories ? (
                                  <>
                                    {/* コミュニケーション */}
                                    {(evaluation.categories.communication?.verbal?.some(item => item.checked) ||
                                      evaluation.categories.communication?.overall?.some(item => item.checked)) && (
                                      <div className="bg-gray-800/50 rounded-lg p-4">
                                        <h5 className="text-cyan-400 font-semibold mb-2">
                                          {language === 'ja' ? 'コミュニケーション' : 'Communication'}
                                        </h5>
                                        <ul className="space-y-1">
                                          {[...(evaluation.categories.communication?.verbal || []),
                                            ...(evaluation.categories.communication?.overall || [])]
                                            .filter(item => item.checked)
                                            .map((item, idx) => (
                                              <li key={idx} className="text-sm text-gray-300 flex items-start">
                                                <span className="text-green-400 mr-2">✓</span>
                                                {item.label}
                                              </li>
                                            ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* 導入 */}
                                    {evaluation.categories.introduction?.some(item => item.checked) && (
                                      <div className="bg-gray-800/50 rounded-lg p-4">
                                        <h5 className="text-cyan-400 font-semibold mb-2">
                                          {language === 'ja' ? '導入' : 'Introduction'}
                                        </h5>
                                        <ul className="space-y-1">
                                          {evaluation.categories.introduction
                                            .filter(item => item.checked)
                                            .map((item, idx) => (
                                              <li key={idx} className="text-sm text-gray-300 flex items-start">
                                                <span className="text-green-400 mr-2">✓</span>
                                                {item.label}
                                              </li>
                                            ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* 医学的情報 */}
                                    {(evaluation.categories.medicalInfo?.chiefComplaint?.some(item => item.checked) ||
                                      evaluation.categories.medicalInfo?.history?.some(item => item.checked) ||
                                      evaluation.categories.medicalInfo?.lifestyle?.some(item => item.checked)) && (
                                      <div className="bg-gray-800/50 rounded-lg p-4">
                                        <h5 className="text-cyan-400 font-semibold mb-2">
                                          {language === 'ja' ? '医学的情報' : 'Medical Information'}
                                        </h5>
                                        <ul className="space-y-1">
                                          {[...(evaluation.categories.medicalInfo?.chiefComplaint || []),
                                            ...(evaluation.categories.medicalInfo?.history || []),
                                            ...(evaluation.categories.medicalInfo?.lifestyle || [])]
                                            .filter(item => item.checked)
                                            .map((item, idx) => (
                                              <li key={idx} className="text-sm text-gray-300 flex items-start">
                                                <span className="text-green-400 mr-2">✓</span>
                                                {item.label}
                                              </li>
                                            ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* 心理社会的情報 */}
                                    {evaluation.categories.psychosocial?.some(item => item.checked) && (
                                      <div className="bg-gray-800/50 rounded-lg p-4">
                                        <h5 className="text-cyan-400 font-semibold mb-2">
                                          {language === 'ja' ? '心理社会的情報' : 'Psychosocial Information'}
                                        </h5>
                                        <ul className="space-y-1">
                                          {evaluation.categories.psychosocial
                                            .filter(item => item.checked)
                                            .map((item, idx) => (
                                              <li key={idx} className="text-sm text-gray-300 flex items-start">
                                                <span className="text-green-400 mr-2">✓</span>
                                                {item.label}
                                              </li>
                                            ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* 締めくくり */}
                                    {evaluation.categories.closing?.some(item => item.checked) && (
                                      <div className="bg-gray-800/50 rounded-lg p-4">
                                        <h5 className="text-cyan-400 font-semibold mb-2">
                                          {language === 'ja' ? '締めくくり' : 'Closing'}
                                        </h5>
                                        <ul className="space-y-1">
                                          {evaluation.categories.closing
                                            .filter(item => item.checked)
                                            .map((item, idx) => (
                                              <li key={idx} className="text-sm text-gray-300 flex items-start">
                                                <span className="text-green-400 mr-2">✓</span>
                                                {item.label}
                                              </li>
                                            ))}
                                        </ul>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <p className="text-gray-400 text-center py-8">
                                    {language === 'ja' ? '詳細項目情報なし' : 'No detailed items information'}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* 会話ログタブ */}
                            {detailView === 'conversation' && (
                              <div className="space-y-4">
                                {evaluation.conversationLog && evaluation.conversationLog.length > 0 ? (
                                  <div className="max-h-96 overflow-y-auto space-y-2">
                                    {evaluation.conversationLog.map((msg, index) => (
                                  <div key={index} className={`p-3 rounded-lg ${
                                    msg.role === 'student'
                                      ? 'bg-blue-900/30 border-l-2 border-blue-400'
                                      : 'bg-green-900/30 border-l-2 border-green-400'
                                  }`}>
                                    <div className="flex justify-between mb-1">
                                      <span className={`text-xs font-semibold ${
                                        msg.role === 'student' ? 'text-blue-400' : 'text-green-400'
                                      }`}>
                                        {msg.role === 'student'
                                          ? (language === 'ja' ? '学生' : 'Student')
                                          : (language === 'ja' ? '患者' : 'Patient')}
                                      </span>
                                      {msg.timestamp && (
                                        <span className="text-xs text-gray-500">
                                          {new Date(msg.timestamp).toLocaleTimeString()}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-200">{msg.content}</p>
                                  </div>
                                ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-400 text-center py-8">
                                    {language === 'ja' ? '会話ログなし' : 'No conversation log'}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* フィードバックタブ */}
                            {detailView === 'feedback' && (
                              <div className="space-y-4">
                                {evaluation.aiEvaluation ? (
                                  <>
                                    {/* 総合評価 */}
                                    {evaluation.aiEvaluation.summary && (
                                  <div>
                                    <h5 className="text-cyan-400 font-semibold mb-2">
                                      {language === 'ja' ? '総合評価' : 'Overall Assessment'}
                                    </h5>
                                    <p className="text-sm text-gray-300">{evaluation.aiEvaluation.summary}</p>
                                  </div>
                                )}

                                {/* 良かった点 */}
                                {evaluation.aiEvaluation.strengths && evaluation.aiEvaluation.strengths.length > 0 && (
                                  <div>
                                    <h5 className="text-green-400 font-semibold mb-2">
                                      {language === 'ja' ? '良かった点' : 'Strengths'}
                                    </h5>
                                    <ul className="list-disc list-inside space-y-1">
                                      {evaluation.aiEvaluation.strengths.map((strength, index) => (
                                        <li key={index} className="text-sm text-gray-300">{strength}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* 改善点 */}
                                {evaluation.aiEvaluation.improvements && evaluation.aiEvaluation.improvements.length > 0 && (
                                  <div>
                                    <h5 className="text-yellow-400 font-semibold mb-2">
                                      {language === 'ja' ? '改善点' : 'Areas for Improvement'}
                                    </h5>
                                    <ul className="list-disc list-inside space-y-1">
                                      {evaluation.aiEvaluation.improvements.map((improvement, index) => (
                                        <li key={index} className="text-sm text-gray-300">{improvement}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* 詳細フィードバック */}
                                {evaluation.aiEvaluation.detailedFeedback && (
                                  <div className="space-y-3">
                                    {evaluation.aiEvaluation.detailedFeedback.communication && (
                                      <div>
                                        <h6 className="text-xs uppercase tracking-wider text-cyan-300 mb-1">
                                          {language === 'ja' ? 'コミュニケーション' : 'Communication'}
                                        </h6>
                                        <p className="text-sm text-gray-300">{evaluation.aiEvaluation.detailedFeedback.communication}</p>
                                      </div>
                                    )}
                                    {evaluation.aiEvaluation.detailedFeedback.medicalInfo && (
                                      <div>
                                        <h6 className="text-xs uppercase tracking-wider text-cyan-300 mb-1">
                                          {language === 'ja' ? '医学的情報収集' : 'Medical Information Gathering'}
                                        </h6>
                                        <p className="text-sm text-gray-300">{evaluation.aiEvaluation.detailedFeedback.medicalInfo}</p>
                                      </div>
                                    )}
                                    {evaluation.aiEvaluation.detailedFeedback.overall && (
                                      <div>
                                        <h6 className="text-xs uppercase tracking-wider text-cyan-300 mb-1">
                                          {language === 'ja' ? '総合所見' : 'Overall Comments'}
                                        </h6>
                                        <p className="text-sm text-gray-300">{evaluation.aiEvaluation.detailedFeedback.overall}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                                  </>
                                ) : (
                                  <p className="text-gray-400 text-center py-8">
                                    {language === 'ja' ? 'フィードバック情報なし' : 'No feedback information'}
                                  </p>
                                )}
                              </div>
                            )}
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
                          {selectedEvaluation?.id === evaluation.id
                            ? (language === 'ja' ? '閉じる' : 'Close')
                            : (language === 'ja' ? '詳細' : 'Details')}
                        </button>
                        <button
                          onClick={() => exportEvaluation(evaluation)}
                          className="px-3 py-1 bg-emerald-600/20 text-emerald-400 rounded-lg hover:bg-emerald-600/30 transition-all text-sm flex items-center gap-1"
                          title={language === 'ja' ? '評価をエクスポート' : 'Export Evaluation'}
                        >
                          <span className="text-xs">📥</span>
                          {language === 'ja' ? 'エクスポート' : 'Export'}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(language === 'ja' ? 'この評価を削除しますか？' : 'Delete this evaluation?')) {
                              onDelete(evaluation.id);
                            }
                          }}
                          className="px-3 py-1 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-all text-sm"
                        >
                          {language === 'ja' ? '削除' : 'Delete'}
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