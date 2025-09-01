'use client';

import { useState, useEffect } from 'react';
import type { InterviewEvaluation, EvaluationItem } from '@/lib/evaluationTypes';
import { evaluationTemplate, calculateScore } from '@/lib/evaluationTypes';
import type { PatientMessage } from '@/lib/openai';

interface InterviewEvaluationProps {
  messages: PatientMessage[];
  scenarioId: string;
  onSave: (evaluation: InterviewEvaluation) => void;
  onCancel: () => void;
  initialEvaluation?: InterviewEvaluation | null;
  isEditMode?: boolean;
}

export default function InterviewEvaluationComponent({
  messages,
  scenarioId,
  onSave,
  onCancel,
  initialEvaluation,
  isEditMode = false
}: InterviewEvaluationProps) {
  const [evaluation, setEvaluation] = useState<InterviewEvaluation>(() => {
    if (initialEvaluation) {
      return initialEvaluation;
    }
    return {
      ...evaluationTemplate,
      id: `eval-${Date.now()}`,
      scenarioId,
      timestamp: new Date()
    };
  });
  
  const [activeTab, setActiveTab] = useState<'communication' | 'introduction' | 'medical' | 'psychosocial' | 'closing'>('communication');
  const [notes, setNotes] = useState(initialEvaluation?.notes || '');
  const [evaluatorName, setEvaluatorName] = useState(initialEvaluation?.evaluatorName || '');
  const [showAutoSuggestions, setShowAutoSuggestions] = useState(!isEditMode);

  // 会話内容から自動的に評価項目を提案
  useEffect(() => {
    if (!showAutoSuggestions || isEditMode) return;

    const conversationText = messages.map(m => m.content).join(' ').toLowerCase();
    const newEvaluation = { ...evaluation };

    // 挨拶のチェック
    if (conversationText.includes('こんにちは') || conversationText.includes('よろしく')) {
      const introItem = newEvaluation.categories.introduction.find(item => item.id === 'intro-1');
      if (introItem) introItem.checked = true;
    }

    // 主訴の確認
    if (conversationText.includes('どうされました') || conversationText.includes('どうしました')) {
      const chiefItem = newEvaluation.categories.medicalInfo.chiefComplaint.find(item => item.id === 'chief-1');
      if (chiefItem) chiefItem.checked = true;
    }

    // 痛みの性状
    if (conversationText.includes('どのような痛み') || conversationText.includes('どんな痛み')) {
      const item = newEvaluation.categories.medicalInfo.chiefComplaint.find(item => item.id === 'chief-3');
      if (item) item.checked = true;
    }

    // 発症時期
    if (conversationText.includes('いつから')) {
      const item = newEvaluation.categories.medicalInfo.chiefComplaint.find(item => item.id === 'chief-6');
      if (item) item.checked = true;
    }

    // 既往歴
    if (conversationText.includes('持病') || conversationText.includes('既往') || conversationText.includes('お体')) {
      const item = newEvaluation.categories.medicalInfo.history.find(item => item.id === 'hist-3');
      if (item) item.checked = true;
    }

    // アレルギー
    if (conversationText.includes('アレルギー')) {
      const item = newEvaluation.categories.medicalInfo.history.find(item => item.id === 'hist-5');
      if (item) item.checked = true;
    }

    // 要約・確認
    if (conversationText.includes('まとめ') || conversationText.includes('確認')) {
      const item = newEvaluation.categories.closing.find(item => item.id === 'close-1');
      if (item) item.checked = true;
    }

    // 言い忘れ
    if (conversationText.includes('言い忘れ') || conversationText.includes('他に') || conversationText.includes('ほかに')) {
      const item = newEvaluation.categories.closing.find(item => item.id === 'close-2');
      if (item) item.checked = true;
    }

    setEvaluation(newEvaluation);
  }, [messages, showAutoSuggestions, isEditMode]);

  const handleItemToggle = (category: string, subcategory: string | null, itemId: string) => {
    const newEvaluation = { ...evaluation };
    
    if (category === 'communication' && subcategory) {
      const items = newEvaluation.categories.communication[subcategory as keyof typeof newEvaluation.categories.communication] as EvaluationItem[];
      const item = items.find(i => i.id === itemId);
      if (item) item.checked = !item.checked;
    } else if (category === 'medicalInfo' && subcategory) {
      const items = newEvaluation.categories.medicalInfo[subcategory as keyof typeof newEvaluation.categories.medicalInfo] as EvaluationItem[];
      const item = items.find(i => i.id === itemId);
      if (item) item.checked = !item.checked;
    } else {
      const items = newEvaluation.categories[category as keyof typeof newEvaluation.categories] as EvaluationItem[];
      if (Array.isArray(items)) {
        const item = items.find(i => i.id === itemId);
        if (item) item.checked = !item.checked;
      }
    }
    
    setEvaluation(newEvaluation);
  };

  const handleSave = () => {
    const finalEvaluation = {
      ...evaluation,
      notes,
      evaluatorName,
      ...calculateScore(evaluation)
    };
    onSave(finalEvaluation);
  };

  const { score, maxScore, percentage } = calculateScore(evaluation);

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case 'high': return '必須';
      case 'medium': return '重要';
      case 'low': return '任意';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-cyan-500/30">
        {/* ヘッダー */}
        <div className="p-6 border-b border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {isEditMode ? '評価の編集' : '医療面接評価'}
              </h2>
              <p className="text-gray-400 mt-1">初診患者の医療面接評価シート</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-cyan-400">{percentage}%</div>
              <div className="text-sm text-gray-400">{score} / {maxScore} 点</div>
            </div>
          </div>
          
          {/* 評価者名入力 */}
          <div className="mt-4 flex items-center gap-4">
            <input
              type="text"
              placeholder="評価者名を入力"
              value={evaluatorName}
              onChange={(e) => setEvaluatorName(e.target.value)}
              className="px-4 py-2 bg-gray-800/50 border border-cyan-500/30 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
            />
            {!isEditMode && (
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={showAutoSuggestions}
                  onChange={(e) => setShowAutoSuggestions(e.target.checked)}
                  className="rounded border-cyan-500/30"
                />
                会話から自動提案
              </label>
            )}
          </div>
        </div>

        {/* タブ */}
        <div className="flex border-b border-cyan-500/30 px-6">
          <button
            onClick={() => setActiveTab('communication')}
            className={`px-4 py-3 font-medium transition-all ${
              activeTab === 'communication' 
                ? 'text-cyan-400 border-b-2 border-cyan-400' 
                : 'text-gray-400 hover:text-cyan-300'
            }`}
          >
            コミュニケーション
          </button>
          <button
            onClick={() => setActiveTab('introduction')}
            className={`px-4 py-3 font-medium transition-all ${
              activeTab === 'introduction' 
                ? 'text-cyan-400 border-b-2 border-cyan-400' 
                : 'text-gray-400 hover:text-cyan-300'
            }`}
          >
            導入
          </button>
          <button
            onClick={() => setActiveTab('medical')}
            className={`px-4 py-3 font-medium transition-all ${
              activeTab === 'medical' 
                ? 'text-cyan-400 border-b-2 border-cyan-400' 
                : 'text-gray-400 hover:text-cyan-300'
            }`}
          >
            医学的情報
          </button>
          <button
            onClick={() => setActiveTab('psychosocial')}
            className={`px-4 py-3 font-medium transition-all ${
              activeTab === 'psychosocial' 
                ? 'text-cyan-400 border-b-2 border-cyan-400' 
                : 'text-gray-400 hover:text-cyan-300'
            }`}
          >
            心理社会
          </button>
          <button
            onClick={() => setActiveTab('closing')}
            className={`px-4 py-3 font-medium transition-all ${
              activeTab === 'closing' 
                ? 'text-cyan-400 border-b-2 border-cyan-400' 
                : 'text-gray-400 hover:text-cyan-300'
            }`}
          >
            締めくくり
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 300px)' }}>
          {activeTab === 'communication' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-3">言語的コミュニケーション</h3>
                <div className="space-y-2">
                  {evaluation.categories.communication.verbal.map(item => (
                    <label key={item.id} className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleItemToggle('communication', 'verbal', item.id)}
                        className="mt-1 rounded border-cyan-500/30"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white">{item.label}</span>
                          <span className={`text-xs ${getPriorityColor(item.priority)}`}>
                            {getPriorityLabel(item.priority)}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-3">全体的な進行</h3>
                <div className="space-y-2">
                  {evaluation.categories.communication.overall.map(item => (
                    <label key={item.id} className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleItemToggle('communication', 'overall', item.id)}
                        className="mt-1 rounded border-cyan-500/30"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white">{item.label}</span>
                          <span className={`text-xs ${getPriorityColor(item.priority)}`}>
                            {getPriorityLabel(item.priority)}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'introduction' && (
            <div className="space-y-2">
              {evaluation.categories.introduction.map(item => (
                <label key={item.id} className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleItemToggle('introduction', null, item.id)}
                    className="mt-1 rounded border-cyan-500/30"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white">{item.label}</span>
                      <span className={`text-xs ${getPriorityColor(item.priority)}`}>
                        {getPriorityLabel(item.priority)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}

          {activeTab === 'medical' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-3">主訴・現病歴</h3>
                <div className="space-y-2">
                  {evaluation.categories.medicalInfo.chiefComplaint.map(item => (
                    <label key={item.id} className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleItemToggle('medicalInfo', 'chiefComplaint', item.id)}
                        className="mt-1 rounded border-cyan-500/30"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white">{item.label}</span>
                          <span className={`text-xs ${getPriorityColor(item.priority)}`}>
                            {getPriorityLabel(item.priority)}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-3">既往歴</h3>
                <div className="space-y-2">
                  {evaluation.categories.medicalInfo.history.map(item => (
                    <label key={item.id} className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleItemToggle('medicalInfo', 'history', item.id)}
                        className="mt-1 rounded border-cyan-500/30"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white">{item.label}</span>
                          <span className={`text-xs ${getPriorityColor(item.priority)}`}>
                            {getPriorityLabel(item.priority)}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-3">生活習慣</h3>
                <div className="space-y-2">
                  {evaluation.categories.medicalInfo.lifestyle.map(item => (
                    <label key={item.id} className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleItemToggle('medicalInfo', 'lifestyle', item.id)}
                        className="mt-1 rounded border-cyan-500/30"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white">{item.label}</span>
                          <span className={`text-xs ${getPriorityColor(item.priority)}`}>
                            {getPriorityLabel(item.priority)}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'psychosocial' && (
            <div className="space-y-2">
              {evaluation.categories.psychosocial.map(item => (
                <label key={item.id} className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleItemToggle('psychosocial', null, item.id)}
                    className="mt-1 rounded border-cyan-500/30"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white">{item.label}</span>
                      <span className={`text-xs ${getPriorityColor(item.priority)}`}>
                        {getPriorityLabel(item.priority)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}

          {activeTab === 'closing' && (
            <div className="space-y-2">
              {evaluation.categories.closing.map(item => (
                <label key={item.id} className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleItemToggle('closing', null, item.id)}
                    className="mt-1 rounded border-cyan-500/30"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white">{item.label}</span>
                      <span className={`text-xs ${getPriorityColor(item.priority)}`}>
                        {getPriorityLabel(item.priority)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* メモ欄 */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-cyan-400 mb-3">評価メモ</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="評価に関するメモや改善点を入力..."
              className="w-full h-32 px-4 py-3 bg-gray-800/50 border border-cyan-500/30 rounded-lg text-white focus:border-cyan-400 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* フッター */}
        <div className="p-6 border-t border-cyan-500/30 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            評価日時: {new Date(evaluation.timestamp).toLocaleString('ja-JP')}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all"
            >
              {isEditMode ? '更新' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}