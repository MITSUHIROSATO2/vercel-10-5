'use client';

import { useState, useEffect } from 'react';

interface EvaluationCriteria {
  category: string;
  subcategory?: string;
  item: string;
  priority: 'high' | 'medium' | 'low';
}

interface EvaluationCriteriaEditorProps {
  onClose: () => void;
  onSave?: () => void;
}

const defaultCriteria: EvaluationCriteria[] = [
  // コミュニケーション
  { category: 'communication', subcategory: 'verbal', item: '明瞭で聞き取りやすい話し方', priority: 'high' },
  { category: 'communication', subcategory: 'verbal', item: '適切な音量と速度', priority: 'medium' },
  { category: 'communication', subcategory: 'verbal', item: '専門用語を避けた説明', priority: 'high' },
  { category: 'communication', subcategory: 'overall', item: '患者の不安への配慮', priority: 'high' },
  { category: 'communication', subcategory: 'overall', item: '共感的な態度', priority: 'high' },
  
  // 導入
  { category: 'introduction', item: '挨拶と自己紹介', priority: 'high' },
  { category: 'introduction', item: '本人確認（氏名・生年月日）', priority: 'high' },
  { category: 'introduction', item: '診察の目的説明', priority: 'medium' },
  
  // 医学的情報
  { category: 'medicalInfo', subcategory: 'chiefComplaint', item: '主訴の聴取', priority: 'high' },
  { category: 'medicalInfo', subcategory: 'chiefComplaint', item: '開放型質問の使用', priority: 'high' },
  { category: 'medicalInfo', subcategory: 'chiefComplaint', item: '症状の詳細確認', priority: 'high' },
  { category: 'medicalInfo', subcategory: 'history', item: '現病歴の聴取', priority: 'high' },
  { category: 'medicalInfo', subcategory: 'history', item: '既往歴の確認', priority: 'high' },
  { category: 'medicalInfo', subcategory: 'history', item: 'アレルギー歴の確認', priority: 'high' },
  { category: 'medicalInfo', subcategory: 'history', item: '服薬歴の確認', priority: 'high' },
  { category: 'medicalInfo', subcategory: 'lifestyle', item: '喫煙歴の確認', priority: 'medium' },
  { category: 'medicalInfo', subcategory: 'lifestyle', item: '飲酒歴の確認', priority: 'medium' },
  { category: 'medicalInfo', subcategory: 'lifestyle', item: '食生活の確認', priority: 'low' },
  
  // 心理社会的側面
  { category: 'psychosocial', item: '患者の心配事の聴取', priority: 'high' },
  { category: 'psychosocial', item: '治療への希望確認', priority: 'high' },
  { category: 'psychosocial', item: '生活への影響確認', priority: 'medium' },
  
  // 締めくくり
  { category: 'closing', item: '患者の質問への対応', priority: 'high' },
  { category: 'closing', item: '情報の要約・確認', priority: 'high' },
  { category: 'closing', item: '今後の方針説明', priority: 'high' },
];

const categoryLabels: { [key: string]: string } = {
  communication: 'コミュニケーション',
  introduction: '導入',
  medicalInfo: '医学的情報',
  psychosocial: '心理社会的側面',
  closing: '締めくくり'
};

const subcategoryLabels: { [key: string]: string } = {
  verbal: '言語的',
  overall: '全般',
  chiefComplaint: '主訴',
  history: '病歴',
  lifestyle: '生活習慣'
};

export default function EvaluationCriteriaEditor({ onClose, onSave }: EvaluationCriteriaEditorProps) {
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newItem, setNewItem] = useState<EvaluationCriteria>({
    category: 'communication',
    item: '',
    priority: 'medium'
  });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    // LocalStorageから保存された評価項目を読み込み
    const savedCriteria = localStorage.getItem('evaluationCriteria');
    if (savedCriteria) {
      setCriteria(JSON.parse(savedCriteria));
    } else {
      setCriteria(defaultCriteria);
    }
  }, []);

  const handleSave = () => {
    // LocalStorageに保存
    localStorage.setItem('evaluationCriteria', JSON.stringify(criteria));
    if (onSave) onSave();
    onClose();
  };

  const handleReset = () => {
    if (window.confirm('デフォルトの評価項目に戻しますか？')) {
      setCriteria(defaultCriteria);
      localStorage.removeItem('evaluationCriteria');
    }
  };

  const handleDelete = (index: number) => {
    if (window.confirm('この評価項目を削除しますか？')) {
      const newCriteria = [...criteria];
      newCriteria.splice(index, 1);
      setCriteria(newCriteria);
    }
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
  };

  const handleUpdate = (index: number, field: keyof EvaluationCriteria, value: string) => {
    const newCriteria = [...criteria];
    newCriteria[index] = { ...newCriteria[index], [field]: value };
    setCriteria(newCriteria);
  };

  const handleAdd = () => {
    if (!newItem.item.trim()) {
      alert('評価項目を入力してください');
      return;
    }
    setCriteria([...criteria, newItem]);
    setNewItem({
      category: 'communication',
      item: '',
      priority: 'medium'
    });
    setShowAddForm(false);
  };

  const filteredCriteria = selectedCategory === 'all' 
    ? criteria 
    : criteria.filter(c => c.category === selectedCategory);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const priorityLabels = {
    high: '高',
    medium: '中',
    low: '低'
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-cyan-500/30 shadow-2xl">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>⚙️</span>
            評価項目編集
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* カテゴリフィルター */}
        <div className="p-4 border-b border-gray-700 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            すべて
          </button>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                selectedCategory === key
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 評価項目リスト */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 240px)' }}>
          <div className="space-y-2">
            {filteredCriteria.map((item, index) => (
              <div
                key={index}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:border-cyan-500/50 transition-all"
              >
                {editingIndex === index ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={item.item}
                      onChange={(e) => handleUpdate(index, 'item', e.target.value)}
                      className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-cyan-400 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <select
                        value={item.priority}
                        onChange={(e) => handleUpdate(index, 'priority', e.target.value)}
                        className="p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-cyan-400 focus:outline-none"
                      >
                        <option value="high">優先度: 高</option>
                        <option value="medium">優先度: 中</option>
                        <option value="low">優先度: 低</option>
                      </select>
                      <button
                        onClick={() => setEditingIndex(null)}
                        className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-colors"
                      >
                        完了
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-cyan-400">
                          {categoryLabels[item.category]}
                          {item.subcategory && ` / ${subcategoryLabels[item.subcategory]}`}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(item.priority)}`}>
                          {priorityLabels[item.priority as keyof typeof priorityLabels]}
                        </span>
                      </div>
                      <p className="text-white">{item.item}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(index)}
                        className="text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(index)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 新規追加フォーム */}
          {showAddForm && (
            <div className="mt-4 bg-gray-800/50 border border-cyan-500/50 rounded-lg p-4 space-y-3">
              <h3 className="text-cyan-400 font-semibold">新規評価項目を追加</h3>
              <div className="space-y-2">
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-cyan-400 focus:outline-none"
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="評価項目を入力"
                  value={newItem.item}
                  onChange={(e) => setNewItem({ ...newItem, item: e.target.value })}
                  className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-cyan-400 focus:outline-none"
                />
                <select
                  value={newItem.priority}
                  onChange={(e) => setNewItem({ ...newItem, priority: e.target.value as 'high' | 'medium' | 'low' })}
                  className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-cyan-400 focus:outline-none"
                >
                  <option value="high">優先度: 高</option>
                  <option value="medium">優先度: 中</option>
                  <option value="low">優先度: 低</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-colors"
                  >
                    追加
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="p-4 border-t border-gray-700 flex justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
            >
              + 項目を追加
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all"
            >
              デフォルトに戻す
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}