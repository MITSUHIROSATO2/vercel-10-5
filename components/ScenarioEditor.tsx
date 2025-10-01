'use client';

import { useState, useEffect } from 'react';
import type { PatientScenario } from '@/lib/scenarioTypes';

interface ScenarioEditorProps {
  scenario: PatientScenario;
  onSave: (scenario: PatientScenario) => void;
  onCancel: () => void;
  language?: 'ja' | 'en';
}

export default function ScenarioEditor({ scenario, onSave, onCancel, language = 'ja' }: ScenarioEditorProps) {
  const [editedScenario, setEditedScenario] = useState<PatientScenario>(scenario);
  const [activeCategory, setActiveCategory] = useState<string>('basicInfo');
  
  // scenarioプロップが変更されたら、editedScenarioを更新
  useEffect(() => {
    setEditedScenario(scenario);
  }, [scenario]);

  const handleFieldChange = (category: string, field: string, value: string) => {
    // specialCircumstances は直接フィールドとして扱う
    if (category === 'specialCircumstances') {
      setEditedScenario(prev => ({
        ...prev,
        specialCircumstances: value
      }));
    } else {
      setEditedScenario(prev => ({
        ...prev,
        [category]: {
          ...(prev[category as keyof PatientScenario] as any || {}),
          [field]: value
        }
      }));
    }
  };


  const categories = language === 'ja' ? [
    { id: 'basicInfo', label: '基本情報', icon: '👤' },
    { id: 'chiefComplaint', label: '主訴', icon: '🦷' },
    { id: 'presentIllness', label: '現病歴', icon: '📋' },
    { id: 'dentalHistory', label: '歯科既往歴', icon: '🏥' },
    { id: 'medicalHistory', label: '全身既往歴', icon: '💊' },
    { id: 'lifestyle', label: '生活歴', icon: '🏠' },
    { id: 'psychosocial', label: '心理社会的情報', icon: '💭' },
    { id: 'interviewEvaluation', label: '面接技法評価', icon: '✅' },
    { id: 'specialCircumstances', label: '特殊事情', icon: '⚠️' }
  ] : [
    { id: 'basicInfo', label: 'Basic Info', icon: '👤' },
    { id: 'chiefComplaint', label: 'Chief Complaint', icon: '🦷' },
    { id: 'presentIllness', label: 'Present Illness', icon: '📋' },
    { id: 'dentalHistory', label: 'Dental History', icon: '🏥' },
    { id: 'medicalHistory', label: 'Medical History', icon: '💊' },
    { id: 'lifestyle', label: 'Lifestyle', icon: '🏠' },
    { id: 'psychosocial', label: 'Psychosocial', icon: '💭' },
    { id: 'interviewEvaluation', label: 'Interview Evaluation', icon: '✅' },
    { id: 'specialCircumstances', label: 'Special Circumstances', icon: '⚠️' }
  ];

  const fieldConfigs: Record<string, Array<{field: string, label: string, placeholder: string}>> = language === 'ja' ? {
    basicInfo: [
      { field: 'name', label: '氏名', placeholder: '例：田中 弘樹' },
      { field: 'age', label: '年齢', placeholder: '例：43歳' },
      { field: 'gender', label: '性別', placeholder: '例：男性／女性／その他' },
      { field: 'occupation', label: '職業', placeholder: '例：営業職／主婦／学生など' }
    ],
    chiefComplaint: [
      { field: 'complaint', label: '主訴', placeholder: '例：右下奥歯がズキズキ痛む' },
      { field: 'location', label: '部位', placeholder: '例：右下6番' },
      { field: 'since', label: 'いつから', placeholder: '例：1週間前から' }
    ],
    presentIllness: [
      { field: 'nature', label: '症状の性状', placeholder: '例：ズキズキ／ジーンなど' },
      { field: 'severity', label: '症状の程度', placeholder: '例：ロキソニンで軽減' },
      { field: 'progress', label: '経過', placeholder: '例：徐々に悪化' },
      { field: 'trigger', label: '誘発因子', placeholder: '例：冷たいもので痛む' },
      { field: 'dailyImpact', label: '日常生活への影響', placeholder: '例：食事がつらい' },
      { field: 'medication', label: '服薬歴', placeholder: '例：市販の鎮痛剤（ロキソニン）' },
      { field: 'dentalVisit', label: '本件の歯科受診歴', placeholder: '例：初診／前に他院受診' }
    ],
    dentalHistory: [
      { field: 'extraction', label: '抜歯歴', placeholder: '例：親知らず抜歯あり' },
      { field: 'anesthesia', label: '麻酔経験', placeholder: '例：あり（効きにくい）' },
      { field: 'complications', label: '治療中の異常経験', placeholder: '例：抜歯後の腫れ' }
    ],
    medicalHistory: [
      { field: 'systemicDisease', label: '全身疾患の有無', placeholder: '例：高血圧、糖尿病など' },
      { field: 'currentMedication', label: '服薬状況', placeholder: '例：アムロジピン服用中' },
      { field: 'allergies', label: 'アレルギー', placeholder: '例：ペニシリンアレルギー' }
    ],
    lifestyle: [
      { field: 'oralHygiene', label: '口腔衛生習慣', placeholder: '例：朝晩2回／夜は適当など' },
      { field: 'dietaryHabits', label: '食嗜好・嗜好品', placeholder: '例：甘いコーヒー／喫煙あり' },
      { field: 'familyStructure', label: '家族構成・同居者', placeholder: '例：妻・子ども2人と同居' },
      { field: 'workSchedule', label: '仕事状況・通院条件', placeholder: '例：平日19時まで可、昼不可' }
    ],
    psychosocial: [
      { field: 'concerns', label: '心配・希望', placeholder: '例：麻酔が怖い／抜きたくない' },
      { field: 'requests', label: '要望', placeholder: '例：痛くない治療を希望' }
    ],
    interviewEvaluation: [
      { field: 'summarization', label: '主訴の要約確認', placeholder: '面接終盤での再確認' },
      { field: 'additionalCheck', label: '言い忘れの確認', placeholder: '例：『他に気になることは？』' }
    ],
    specialCircumstances: [
      { field: 'specialCircumstances', label: '特殊事情', placeholder: '特別な配慮が必要な場合、もしくは特殊事項を試したい場合は記入\n例：男性歯科医師が苦手、日本語がまだ流暢ではない外国からの患者さんとして振る舞ってほしい場合など' }
    ]
  } : {
    basicInfo: [
      { field: 'name', label: 'Name', placeholder: 'e.g., John Smith' },
      { field: 'age', label: 'Age', placeholder: 'e.g., 43 years old' },
      { field: 'gender', label: 'Gender', placeholder: 'e.g., Male/Female/Other' },
      { field: 'occupation', label: 'Occupation', placeholder: 'e.g., Office Worker/Homemaker/Student' }
    ],
    chiefComplaint: [
      { field: 'complaint', label: 'Chief Complaint', placeholder: 'e.g., Throbbing pain in lower right molar' },
      { field: 'location', label: 'Location', placeholder: 'e.g., Lower right 6th tooth' },
      { field: 'since', label: 'Duration', placeholder: 'e.g., Since 1 week ago' }
    ],
    presentIllness: [
      { field: 'nature', label: 'Nature of Symptoms', placeholder: 'e.g., Throbbing/Aching' },
      { field: 'severity', label: 'Severity', placeholder: 'e.g., Reduced with painkillers' },
      { field: 'progress', label: 'Progress', placeholder: 'e.g., Gradually worsening' },
      { field: 'trigger', label: 'Triggers', placeholder: 'e.g., Pain with cold things' },
      { field: 'dailyImpact', label: 'Daily Impact', placeholder: 'e.g., Difficult to eat' },
      { field: 'medication', label: 'Medication History', placeholder: 'e.g., OTC pain relievers' },
      { field: 'dentalVisit', label: 'Dental Visit History', placeholder: 'e.g., First visit/Previous clinic' }
    ],
    dentalHistory: [
      { field: 'extraction', label: 'Extraction History', placeholder: 'e.g., Wisdom tooth extracted' },
      { field: 'anesthesia', label: 'Anesthesia Experience', placeholder: 'e.g., Yes (difficult to numb)' },
      { field: 'complications', label: 'Treatment Complications', placeholder: 'e.g., Swelling after extraction' }
    ],
    medicalHistory: [
      { field: 'systemicDisease', label: 'Systemic Diseases', placeholder: 'e.g., Hypertension, Diabetes' },
      { field: 'currentMedication', label: 'Current Medications', placeholder: 'e.g., Taking Amlodipine' },
      { field: 'allergies', label: 'Allergies', placeholder: 'e.g., Penicillin allergy' }
    ],
    lifestyle: [
      { field: 'oralHygiene', label: 'Oral Hygiene Habits', placeholder: 'e.g., Twice daily/Once daily' },
      { field: 'dietaryHabits', label: 'Dietary Habits', placeholder: 'e.g., Sweet coffee/Smoker' },
      { field: 'familyStructure', label: 'Family Structure', placeholder: 'e.g., Living with spouse and 2 children' },
      { field: 'workSchedule', label: 'Work Schedule', placeholder: 'e.g., Available weekdays until 7pm' }
    ],
    psychosocial: [
      { field: 'concerns', label: 'Concerns', placeholder: 'e.g., Afraid of anesthesia/Don\'t want extraction' },
      { field: 'requests', label: 'Requests', placeholder: 'e.g., Want painless treatment' }
    ],
    interviewEvaluation: [
      { field: 'summarization', label: 'Summary Confirmation', placeholder: 'Reconfirm at interview end' },
      { field: 'additionalCheck', label: 'Additional Check', placeholder: 'e.g., "Anything else concerning you?"' }
    ],
    specialCircumstances: [
      { field: 'specialCircumstances', label: 'Special Circumstances', placeholder: 'Enter if special considerations or specific scenarios needed\ne.g., uncomfortable with male dentists, non-native speaker with limited language proficiency, etc.' }
    ]
  };

  // スクロール処理
  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden border border-cyan-500/30">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 p-6 border-b border-cyan-500/30">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {language === 'ja' ? 'シナリオ編集' : 'Edit Scenario'}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {language === 'ja' ? 'キャンセル' : 'Cancel'}
              </button>
              <button
                onClick={() => onSave(editedScenario)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all"
              >
                {language === 'ja' ? '保存' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(90vh-100px)]">
          {/* サイドバー */}
          <div className="w-64 bg-gray-800/50 border-r border-gray-700 p-4 overflow-y-auto">
            <div className="space-y-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => scrollToCategory(cat.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
                    activeCategory === cat.id
                      ? 'bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border border-cyan-500/30'
                      : 'hover:bg-slate-700/50'
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-sm">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* メインコンテンツ - 全フィールド表示 */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* 各カテゴリを順番に表示 */}
              {categories.map(cat => (
                <div 
                  key={cat.id} 
                  id={`category-${cat.id}`}
                  className={`glass-effect rounded-xl p-6 border transition-all ${
                    activeCategory === cat.id 
                      ? 'border-cyan-400/50 shadow-lg shadow-cyan-400/20' 
                      : 'border-cyan-500/20'
                  }`}
                >
                  {/* カテゴリヘッダー */}
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-cyan-500/20">
                    <span className="text-2xl">{cat.icon}</span>
                    <h3 className="text-lg font-semibold text-cyan-400">{cat.label}</h3>
                  </div>
                  
                  {/* フィールド */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fieldConfigs[cat.id]?.map(config => {
                      const categoryData = cat.id === 'specialCircumstances'
                        ? editedScenario
                        : editedScenario[cat.id as keyof PatientScenario] as any;
                      const value = cat.id === 'specialCircumstances'
                        ? categoryData?.specialCircumstances || ''
                        : categoryData?.[config.field] || '';

                      // 特殊事情は大きなテキストエリアとして表示
                      if (cat.id === 'specialCircumstances') {
                        return (
                          <div key={config.field} className="col-span-full space-y-2">
                            <label className="block text-sm font-medium text-cyan-300">
                              {config.label}
                            </label>
                            <textarea
                              value={value}
                              onChange={(e) => handleFieldChange(cat.id, config.field, e.target.value)}
                              placeholder={config.placeholder}
                              rows={4}
                              className="w-full p-2.5 bg-slate-800/50 border border-slate-600 rounded-lg text-white text-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all resize-y"
                            />
                          </div>
                        );
                      }

                      return (
                        <div key={config.field} className="space-y-2">
                          <label className="block text-sm font-medium text-cyan-300">
                            {config.label}
                          </label>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleFieldChange(cat.id, config.field, e.target.value)}
                            placeholder={config.placeholder}
                            className="w-full p-2.5 bg-slate-800/50 border border-slate-600 rounded-lg text-white text-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}