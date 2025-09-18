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
  language?: 'ja' | 'en';
}

const defaultCriteria: EvaluationCriteria[] = [
  // （１）対人関係能力：患者との良好な関係の構築
  { category: 'interpersonal', item: '言語的コミュニケーションを適切に行う', priority: 'high' },
  
  // （２）全体をとおして
  { category: 'overall', item: '順序立った面接を行う', priority: 'high' },
  { category: 'overall', item: '話題を変えるときには、唐突でなく適切な声かけをする', priority: 'high' },
  
  // （３）導入部分：オープニング
  { category: 'opening', item: '挨拶を行う', priority: 'high' },
  { category: 'opening', item: '本人確認と自己紹介を適切に行う', priority: 'high' },
  { category: 'opening', item: '面接の概要説明と同意を取得する', priority: 'high' },
  
  // （４）患者に聞く：歯科医学的情報
  { category: 'medicalInfo', subcategory: 'chiefComplaint', item: '主訴を聞く', priority: 'high' },
  { category: 'medicalInfo', subcategory: 'chiefComplaint', item: '主訴の現病歴を聞く', priority: 'high' },
  { category: 'medicalInfo', subcategory: 'history', item: '歯科的既往歴を聞く', priority: 'high' },
  { category: 'medicalInfo', subcategory: 'history', item: '全身的既往歴を聞く', priority: 'high' },
  { category: 'medicalInfo', subcategory: 'lifestyle', item: '口腔衛生習慣(歯磨きの頻度など)を聞く', priority: 'low' },
  { category: 'medicalInfo', subcategory: 'lifestyle', item: '患者の食習慣や嗜好を聞く', priority: 'low' },
  { category: 'medicalInfo', subcategory: 'lifestyle', item: '患者の家族歴や社会歴を聞く', priority: 'low' },
  
  // （５）患者に聞く：心理・社会的情報
  { category: 'psychosocial', item: '解釈モデルを聞く', priority: 'high' },
  { category: 'psychosocial', item: '来院動機を聞く', priority: 'low' },
  { category: 'psychosocial', item: '心理的状況を聞く', priority: 'low' },
  { category: 'psychosocial', item: '検査や治療に関する要望を聞く', priority: 'low' },
  { category: 'psychosocial', item: '患者背景に関わる通院条件、健康･受療行動、生活･社会･心理的背景などを聞く', priority: 'low' },
  
  // （６）締めくくり部分：クロージング
  { category: 'closing', item: '要約と確認を行う', priority: 'high' },
  { category: 'closing', item: '言い忘れの確認を行う', priority: 'high' },
  { category: 'closing', item: '面接終了後、患者が次にどうしたら良いかを適切に伝える', priority: 'high' },
];

const categoryLabels: { [key: string]: { ja: string; en: string } } = {
  interpersonal: { ja: '対人関係能力', en: 'Interpersonal Skills' },
  overall: { ja: '全体', en: 'Overall' },
  opening: { ja: '導入', en: 'Opening' },
  medicalInfo: { ja: '医学的情報', en: 'Medical Information' },
  psychosocial: { ja: '心理社会的側面', en: 'Psychosocial Aspects' },
  closing: { ja: '締めくくり', en: 'Closing' }
};

const subcategoryLabels: { [key: string]: { ja: string; en: string } } = {
  verbal: { ja: '言語的', en: 'Verbal' },
  overall: { ja: '全般', en: 'General' },
  chiefComplaint: { ja: '主訴', en: 'Chief Complaint' },
  history: { ja: '病歴', en: 'Medical History' },
  lifestyle: { ja: '生活習慣', en: 'Lifestyle' }
};

export default function EvaluationCriteriaEditor({ onClose, onSave, language = 'ja' }: EvaluationCriteriaEditorProps) {
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
    if (window.confirm(language === 'ja' ? 'デフォルトの評価項目に戻しますか？' : 'Reset to default evaluation criteria?')) {
      setCriteria(defaultCriteria);
      localStorage.removeItem('evaluationCriteria');
    }
  };

  const handleDelete = (index: number) => {
    if (window.confirm(language === 'ja' ? 'この評価項目を削除しますか？' : 'Delete this evaluation criterion?')) {
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
      alert(language === 'ja' ? '評価項目を入力してください' : 'Please enter an evaluation criterion');
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
    high: language === 'ja' ? '高' : 'High',
    medium: language === 'ja' ? '中' : 'Medium',
    low: language === 'ja' ? '低' : 'Low'
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-cyan-500/30 shadow-2xl">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>⚙️</span>
            {language === 'ja' ? '評価項目編集' : 'Edit Evaluation Criteria'}
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
            {language === 'ja' ? 'すべて' : 'All'}
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
              {label[language]}
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
                        <option value="high">{language === 'ja' ? '優先度: 高' : 'Priority: High'}</option>
                        <option value="medium">{language === 'ja' ? '優先度: 中' : 'Priority: Medium'}</option>
                        <option value="low">{language === 'ja' ? '優先度: 低' : 'Priority: Low'}</option>
                      </select>
                      <button
                        onClick={() => setEditingIndex(null)}
                        className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-colors"
                      >
                        {language === 'ja' ? '完了' : 'Done'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-cyan-400">
                          {categoryLabels[item.category]?.[language] || item.category}
                          {item.subcategory && ` / ${subcategoryLabels[item.subcategory]?.[language] || item.subcategory}`}
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
              <h3 className="text-cyan-400 font-semibold">{language === 'ja' ? '新規評価項目を追加' : 'Add New Evaluation Criterion'}</h3>
              <div className="space-y-2">
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-cyan-400 focus:outline-none"
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label[language]}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder={language === 'ja' ? '評価項目を入力' : 'Enter evaluation criterion'}
                  value={newItem.item}
                  onChange={(e) => setNewItem({ ...newItem, item: e.target.value })}
                  className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-cyan-400 focus:outline-none"
                />
                <select
                  value={newItem.priority}
                  onChange={(e) => setNewItem({ ...newItem, priority: e.target.value as 'high' | 'medium' | 'low' })}
                  className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-cyan-400 focus:outline-none"
                >
                  <option value="high">{language === 'ja' ? '優先度: 高' : 'Priority: High'}</option>
                  <option value="medium">{language === 'ja' ? '優先度: 中' : 'Priority: Medium'}</option>
                  <option value="low">{language === 'ja' ? '優先度: 低' : 'Priority: Low'}</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-colors"
                  >
                    {language === 'ja' ? '追加' : 'Add'}
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    {language === 'ja' ? 'キャンセル' : 'Cancel'}
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
              {language === 'ja' ? '+ 項目を追加' : '+ Add Item'}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all"
            >
              {language === 'ja' ? 'デフォルトに戻す' : 'Reset to Default'}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {language === 'ja' ? 'キャンセル' : 'Cancel'}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all"
            >
              {language === 'ja' ? '保存' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}