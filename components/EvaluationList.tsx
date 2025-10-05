'use client';

import { useState } from 'react';
import type { InterviewEvaluation } from '@/lib/evaluationTypes';
import type { Paragraph as DocxParagraph } from 'docx';

type DocxModule = typeof import('docx');

let docxModulePromise: Promise<DocxModule> | null = null;
const loadDocxModule = async (): Promise<DocxModule> => {
  if (!docxModulePromise) {
    docxModulePromise = import('docx');
  }
  return docxModulePromise;
};

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

  // 評価詳細をDOCXファイルとしてエクスポート
  const exportEvaluation = async (evaluation: InterviewEvaluation) => {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await loadDocxModule();

    const percentage = evaluation.totalScore && evaluation.maxScore
      ? Math.round((evaluation.totalScore / evaluation.maxScore) * 100)
      : 0;

    const sections: DocxParagraph[] = [];

    // タイトル
    sections.push(
      new Paragraph({
        text: language === 'ja' ? '医療面接評価レポート' : 'Medical Interview Evaluation Report',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    );

    // 基本情報
    sections.push(
      new Paragraph({
        text: language === 'ja' ? '基本情報' : 'Basic Information',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: language === 'ja' ? 'シナリオID: ' : 'Scenario ID: ', bold: true }),
          new TextRun(evaluation.scenarioId)
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: language === 'ja' ? '評価日時: ' : 'Evaluation Date: ', bold: true }),
          new TextRun(formatDate(evaluation.timestamp))
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: language === 'ja' ? '評価者: ' : 'Evaluator: ', bold: true }),
          new TextRun(evaluation.evaluatorName || (language === 'ja' ? '未記入' : 'Not entered'))
        ]
      })
    );

    // 総合評価セクション
    sections.push(
      new Paragraph({
        text: language === 'ja' ? '総合評価' : 'Overall Evaluation',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: language === 'ja' ? '総合スコア: ' : 'Total Score: ', bold: true }),
          new TextRun(`${evaluation.totalScore || 0} / ${evaluation.maxScore || 100} ${language === 'ja' ? '点' : 'points'}`)
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: language === 'ja' ? '達成率: ' : 'Achievement Rate: ', bold: true }),
          new TextRun(`${percentage}%`)
        ],
        spacing: { after: 200 }
      })
    );

    // AI総合評価
    if (evaluation.aiEvaluation?.summary) {
      sections.push(
        new Paragraph({
          text: language === 'ja' ? 'AI総合評価' : 'AI Overall Assessment',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
          text: evaluation.aiEvaluation.summary,
          spacing: { after: 200 }
        })
      );
    }

    // 詳細項目セクション
    sections.push(
      new Paragraph({
        text: language === 'ja' ? '詳細項目' : 'Detailed Items',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    );

    // evaluatedItems形式（古い形式）または categories形式に対応
    if ((evaluation as any).evaluatedItems && (evaluation as any).evaluatedItems.length > 0) {
      // 古い形式: カテゴリーごとにグループ化
      const grouped = ((evaluation as any).evaluatedItems as Array<any>).reduce((acc: any, item: any) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      }, {});

      Object.entries(grouped).forEach(([category, items]: [string, any]) => {
        sections.push(
          new Paragraph({
            text: category,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          })
        );

        items.forEach((item: any) => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: item.checked ? '☑ ' : '☐ ', bold: true }),
                new TextRun(item.item),
                new TextRun({ text: ` [${item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低'}]`, color: '888888' })
              ],
              spacing: { after: 100 }
            })
          );
        });
      });
    } else if (evaluation.categories) {
      // 新しい形式: categories
      // 手順・手続き (Procedure)
      if ((evaluation.categories as any).procedure && (evaluation.categories as any).procedure.length > 0) {
        sections.push(
          new Paragraph({
            text: language === 'ja' ? '手順・手続き' : 'Procedure',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          })
        );
        (evaluation.categories as any).procedure.forEach((item: any) => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: item.checked ? '☑ ' : '☐ ', bold: true }),
                new TextRun(item.label)
              ],
              spacing: { after: 100 }
            })
          );
        });
      }

      // コミュニケーション
      if (evaluation.categories.communication?.verbal || evaluation.categories.communication?.overall) {
        sections.push(
          new Paragraph({
            text: language === 'ja' ? 'コミュニケーション' : 'Communication',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          })
        );
        [...(evaluation.categories.communication?.verbal || []),
         ...(evaluation.categories.communication?.overall || [])]
          .forEach(item => {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({ text: item.checked ? '☑ ' : '☐ ', bold: true }),
                  new TextRun(item.label)
                ],
                spacing: { after: 100 }
              })
            );
          });
      }

      // 導入
      if (evaluation.categories.introduction && evaluation.categories.introduction.length > 0) {
        sections.push(
          new Paragraph({
            text: language === 'ja' ? '導入' : 'Introduction',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          })
        );
        evaluation.categories.introduction.forEach(item => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: item.checked ? '☑ ' : '☐ ', bold: true }),
                new TextRun(item.label)
              ],
              spacing: { after: 100 }
            })
          );
        });
      }

      // 医学的情報
      if (evaluation.categories.medicalInfo?.chiefComplaint ||
          evaluation.categories.medicalInfo?.history ||
          evaluation.categories.medicalInfo?.lifestyle) {
        sections.push(
          new Paragraph({
            text: language === 'ja' ? '医学的情報' : 'Medical Information',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          })
        );
        [...(evaluation.categories.medicalInfo?.chiefComplaint || []),
         ...(evaluation.categories.medicalInfo?.history || []),
         ...(evaluation.categories.medicalInfo?.lifestyle || [])]
          .forEach(item => {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({ text: item.checked ? '☑ ' : '☐ ', bold: true }),
                  new TextRun(item.label)
                ],
                spacing: { after: 100 }
              })
            );
          });
      }

      // 心理社会的情報
      if (evaluation.categories.psychosocial && evaluation.categories.psychosocial.length > 0) {
        sections.push(
          new Paragraph({
            text: language === 'ja' ? '心理社会的情報' : 'Psychosocial Information',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          })
        );
        evaluation.categories.psychosocial.forEach(item => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: item.checked ? '☑ ' : '☐ ', bold: true }),
                new TextRun(item.label)
              ],
              spacing: { after: 100 }
            })
          );
        });
      }

      // 締めくくり
      if (evaluation.categories.closing && evaluation.categories.closing.length > 0) {
        sections.push(
          new Paragraph({
            text: language === 'ja' ? '締めくくり' : 'Closing',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          })
        );
        evaluation.categories.closing.forEach(item => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: item.checked ? '☑ ' : '☐ ', bold: true }),
                new TextRun(item.label)
              ],
              spacing: { after: 100 }
            })
          );
        });
      }
    }

    // フィードバックセクション
    if (evaluation.aiEvaluation) {
      sections.push(
        new Paragraph({
          text: language === 'ja' ? 'フィードバック' : 'Feedback',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        })
      );

      // 良かった点
      if (evaluation.aiEvaluation.strengths && evaluation.aiEvaluation.strengths.length > 0) {
        sections.push(
          new Paragraph({
            text: language === 'ja' ? '良かった点' : 'Strengths',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          })
        );
        evaluation.aiEvaluation.strengths.forEach(strength => {
          sections.push(
            new Paragraph({
              text: `• ${strength}`,
              spacing: { after: 100 }
            })
          );
        });
      }

      // 改善点
      if (evaluation.aiEvaluation.improvements && evaluation.aiEvaluation.improvements.length > 0) {
        sections.push(
          new Paragraph({
            text: language === 'ja' ? '改善点' : 'Areas for Improvement',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          })
        );
        evaluation.aiEvaluation.improvements.forEach(improvement => {
          sections.push(
            new Paragraph({
              text: `• ${improvement}`,
              spacing: { after: 100 }
            })
          );
        });
      }

      // 詳細フィードバック
      if (evaluation.aiEvaluation.detailedFeedback) {
        if (evaluation.aiEvaluation.detailedFeedback.communication) {
          sections.push(
            new Paragraph({
              text: language === 'ja' ? 'コミュニケーション' : 'Communication',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 }
            }),
            new Paragraph({
              text: evaluation.aiEvaluation.detailedFeedback.communication,
              spacing: { after: 200 }
            })
          );
        }
        if (evaluation.aiEvaluation.detailedFeedback.medicalInfo) {
          sections.push(
            new Paragraph({
              text: language === 'ja' ? '医学的情報収集' : 'Medical Information Gathering',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 }
            }),
            new Paragraph({
              text: evaluation.aiEvaluation.detailedFeedback.medicalInfo,
              spacing: { after: 200 }
            })
          );
        }
        if (evaluation.aiEvaluation.detailedFeedback.overall) {
          sections.push(
            new Paragraph({
              text: language === 'ja' ? '総合所見' : 'Overall Comments',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 }
            }),
            new Paragraph({
              text: evaluation.aiEvaluation.detailedFeedback.overall,
              spacing: { after: 200 }
            })
          );
        }
      }
    }

    // 会話ログセクション
    if (evaluation.conversationLog && evaluation.conversationLog.length > 0) {
      sections.push(
        new Paragraph({
          text: language === 'ja' ? '会話ログ' : 'Conversation Log',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        })
      );

      evaluation.conversationLog.forEach((msg) => {
        const roleLabel = msg.role === 'student'
          ? (language === 'ja' ? '学生' : 'Student')
          : (language === 'ja' ? '患者' : 'Patient');
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${roleLabel}: `, bold: true, color: msg.role === 'student' ? '3B82F6' : '10B981' }),
              new TextRun(msg.content)
            ],
            spacing: { after: 150 }
          })
        );
      });
    }

    // ドキュメント作成
    const doc = new Document({
      sections: [{
        properties: {},
        children: sections
      }]
    });

    // Blobとして生成してダウンロード
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluation_${evaluation.scenarioId}_${new Date(evaluation.timestamp).toISOString().split('T')[0]}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // すべての評価をDOCXファイルとしてエクスポート
  const exportAllEvaluations = async () => {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await loadDocxModule();
    const allSections: DocxParagraph[] = [];

    // タイトル
    allSections.push(
      new Paragraph({
        text: language === 'ja' ? '医療面接評価レポート（全件）' : 'Medical Interview Evaluation Reports (All)',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 }
      })
    );

    // 各評価をループ
    evaluations.forEach((evaluation, evalIndex) => {
      const percentage = evaluation.totalScore && evaluation.maxScore
        ? Math.round((evaluation.totalScore / evaluation.maxScore) * 100)
        : 0;

      // 評価の区切り
      if (evalIndex > 0) {
        allSections.push(
          new Paragraph({
            text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            spacing: { before: 600, after: 600 }
          })
        );
      }

      // 評価番号
      allSections.push(
        new Paragraph({
          text: language === 'ja' ? `評価 ${evalIndex + 1}` : `Evaluation ${evalIndex + 1}`,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 200 }
        })
      );

      // 基本情報
      allSections.push(
        new Paragraph({
          text: language === 'ja' ? '基本情報' : 'Basic Information',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: language === 'ja' ? 'シナリオID: ' : 'Scenario ID: ', bold: true }),
            new TextRun(evaluation.scenarioId)
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: language === 'ja' ? '評価日時: ' : 'Evaluation Date: ', bold: true }),
            new TextRun(formatDate(evaluation.timestamp))
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: language === 'ja' ? '評価者: ' : 'Evaluator: ', bold: true }),
            new TextRun(evaluation.evaluatorName || (language === 'ja' ? '未記入' : 'Not entered'))
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: language === 'ja' ? '総合スコア: ' : 'Total Score: ', bold: true }),
            new TextRun(`${evaluation.totalScore || 0} / ${evaluation.maxScore || 100} ${language === 'ja' ? '点' : 'points'}`)
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: language === 'ja' ? '達成率: ' : 'Achievement Rate: ', bold: true }),
            new TextRun(`${percentage}%`)
          ],
          spacing: { after: 200 }
        })
      );

      // AI総合評価
      if (evaluation.aiEvaluation?.summary) {
        allSections.push(
          new Paragraph({
            text: language === 'ja' ? '総合評価' : 'Overall Evaluation',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            text: evaluation.aiEvaluation.summary,
            spacing: { after: 200 }
          })
        );
      }
    });

    // ドキュメント作成
    const doc = new Document({
      sections: [{
        properties: {},
        children: allSections
      }]
    });

    // Blobとして生成してダウンロード
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_evaluations_${new Date().toISOString().split('T')[0]}.docx`;
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
                                      {/* Procedure */}
                                      {(evaluation.categories as any).procedure?.length > 0 && (
                                        <div className="flex justify-between items-center">
                                          <span className="text-gray-300 text-sm">
                                            {language === 'ja' ? '手順・手続き' : 'Procedure'}
                                          </span>
                                          <span className="text-white text-sm font-medium">
                                            {((evaluation.categories as any).procedure || []).filter((item: any) => item.checked).length} /
                                            {(evaluation.categories as any).procedure?.length || 0}
                                          </span>
                                        </div>
                                      )}
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
                                {/* evaluatedItems形式（古い形式）のサポート */}
                                {(evaluation as any).evaluatedItems && (evaluation as any).evaluatedItems.length > 0 ? (
                                  <>
                                    {/* カテゴリーごとにグループ化して表示 */}
                                    {Object.entries(
                                      ((evaluation as any).evaluatedItems as Array<any>).reduce((acc: any, item: any) => {
                                        const cat = item.category;
                                        if (!acc[cat]) acc[cat] = [];
                                        acc[cat].push(item);
                                        return acc;
                                      }, {})
                                    ).map(([category, items]: [string, any]) => (
                                      <div key={category} className="bg-gray-800/50 rounded-lg p-4">
                                        <h5 className="text-cyan-400 font-semibold mb-2">
                                          {category}
                                        </h5>
                                        <ul className="space-y-2">
                                          {items.map((item: any, idx: number) => (
                                            <li key={idx} className="text-sm">
                                              <div className="flex items-start gap-2">
                                                <input
                                                  type="checkbox"
                                                  checked={item.checked}
                                                  readOnly
                                                  className="mt-1 rounded border-gray-600 bg-gray-700 text-cyan-500"
                                                />
                                                <div className="flex-1">
                                                  <div className="flex items-center gap-2">
                                                    <span className={item.checked ? "text-gray-300" : "text-gray-500"}>{item.item}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                      item.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                                      item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                      'bg-blue-500/20 text-blue-400'
                                                    }`}>
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
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    ))}
                                  </>
                                ) : evaluation.categories ? (
                                  <>
                                    {/* 手順・手続き (Procedure) */}
                                    {(evaluation.categories as any).procedure?.length > 0 && (
                                      <div className="bg-gray-800/50 rounded-lg p-4">
                                        <h5 className="text-cyan-400 font-semibold mb-2">
                                          {language === 'ja' ? '手順・手続き' : 'Procedure'}
                                        </h5>
                                        <ul className="space-y-2">
                                          {(evaluation.categories as any).procedure
                                            .map((item: any, idx: number) => (
                                              <li key={idx} className="text-sm flex items-start gap-2">
                                                <input
                                                  type="checkbox"
                                                  checked={item.checked}
                                                  readOnly
                                                  className="mt-1 rounded border-gray-600 bg-gray-700 text-cyan-500"
                                                />
                                                <span className={item.checked ? "text-gray-300" : "text-gray-500"}>{item.label}</span>
                                              </li>
                                            ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* コミュニケーション */}
                                    {(evaluation.categories.communication?.verbal?.length > 0 ||
                                      evaluation.categories.communication?.overall?.length > 0) && (
                                      <div className="bg-gray-800/50 rounded-lg p-4">
                                        <h5 className="text-cyan-400 font-semibold mb-2">
                                          {language === 'ja' ? 'コミュニケーション' : 'Communication'}
                                        </h5>
                                        <ul className="space-y-2">
                                          {[...(evaluation.categories.communication?.verbal || []),
                                            ...(evaluation.categories.communication?.overall || [])]
                                            .map((item, idx) => (
                                              <li key={idx} className="text-sm flex items-start gap-2">
                                                <input
                                                  type="checkbox"
                                                  checked={item.checked}
                                                  readOnly
                                                  className="mt-1 rounded border-gray-600 bg-gray-700 text-cyan-500"
                                                />
                                                <span className={item.checked ? "text-gray-300" : "text-gray-500"}>{item.label}</span>
                                              </li>
                                            ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* 導入 */}
                                    {evaluation.categories.introduction?.length > 0 && (
                                      <div className="bg-gray-800/50 rounded-lg p-4">
                                        <h5 className="text-cyan-400 font-semibold mb-2">
                                          {language === 'ja' ? '導入' : 'Introduction'}
                                        </h5>
                                        <ul className="space-y-2">
                                          {evaluation.categories.introduction
                                            .map((item, idx) => (
                                              <li key={idx} className="text-sm flex items-start gap-2">
                                                <input
                                                  type="checkbox"
                                                  checked={item.checked}
                                                  readOnly
                                                  className="mt-1 rounded border-gray-600 bg-gray-700 text-cyan-500"
                                                />
                                                <span className={item.checked ? "text-gray-300" : "text-gray-500"}>{item.label}</span>
                                              </li>
                                            ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* 医学的情報 */}
                                    {(evaluation.categories.medicalInfo?.chiefComplaint?.length > 0 ||
                                      evaluation.categories.medicalInfo?.history?.length > 0 ||
                                      evaluation.categories.medicalInfo?.lifestyle?.length > 0) && (
                                      <div className="bg-gray-800/50 rounded-lg p-4">
                                        <h5 className="text-cyan-400 font-semibold mb-2">
                                          {language === 'ja' ? '医学的情報' : 'Medical Information'}
                                        </h5>
                                        <ul className="space-y-2">
                                          {[...(evaluation.categories.medicalInfo?.chiefComplaint || []),
                                            ...(evaluation.categories.medicalInfo?.history || []),
                                            ...(evaluation.categories.medicalInfo?.lifestyle || [])]
                                            .map((item, idx) => (
                                              <li key={idx} className="text-sm flex items-start gap-2">
                                                <input
                                                  type="checkbox"
                                                  checked={item.checked}
                                                  readOnly
                                                  className="mt-1 rounded border-gray-600 bg-gray-700 text-cyan-500"
                                                />
                                                <span className={item.checked ? "text-gray-300" : "text-gray-500"}>{item.label}</span>
                                              </li>
                                            ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* 心理社会的情報 */}
                                    {evaluation.categories.psychosocial?.length > 0 && (
                                      <div className="bg-gray-800/50 rounded-lg p-4">
                                        <h5 className="text-cyan-400 font-semibold mb-2">
                                          {language === 'ja' ? '心理社会的情報' : 'Psychosocial Information'}
                                        </h5>
                                        <ul className="space-y-2">
                                          {evaluation.categories.psychosocial
                                            .map((item, idx) => (
                                              <li key={idx} className="text-sm flex items-start gap-2">
                                                <input
                                                  type="checkbox"
                                                  checked={item.checked}
                                                  readOnly
                                                  className="mt-1 rounded border-gray-600 bg-gray-700 text-cyan-500"
                                                />
                                                <span className={item.checked ? "text-gray-300" : "text-gray-500"}>{item.label}</span>
                                              </li>
                                            ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* 締めくくり */}
                                    {evaluation.categories.closing?.length > 0 && (
                                      <div className="bg-gray-800/50 rounded-lg p-4">
                                        <h5 className="text-cyan-400 font-semibold mb-2">
                                          {language === 'ja' ? '締めくくり' : 'Closing'}
                                        </h5>
                                        <ul className="space-y-2">
                                          {evaluation.categories.closing
                                            .map((item, idx) => (
                                              <li key={idx} className="text-sm flex items-start gap-2">
                                                <input
                                                  type="checkbox"
                                                  checked={item.checked}
                                                  readOnly
                                                  className="mt-1 rounded border-gray-600 bg-gray-700 text-cyan-500"
                                                />
                                                <span className={item.checked ? "text-gray-300" : "text-gray-500"}>{item.label}</span>
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
