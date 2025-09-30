'use client';

import { useState } from 'react';
import { generateRandomScenario, generateThemedScenario } from '@/lib/scenarioGenerator';
import type { PatientScenario } from '@/lib/scenarioTypes';

interface ScenarioGeneratorProps {
  onGenerate: (scenario: PatientScenario) => void;
  onCancel: () => void;
  language?: 'ja' | 'en';
}

export default function ScenarioGenerator({ onGenerate, onCancel, language = 'ja' }: ScenarioGeneratorProps) {
  const [selectedTheme, setSelectedTheme] = useState<string>('random');

  const themes = language === 'ja' ? [
    { id: 'random', label: '完全ランダム', icon: '🎲', description: 'すべての要素をランダムに生成' },
    { id: 'emergency', label: '緊急患者', icon: '🆘', description: '激痛や急性症状を持つ患者' },
    { id: 'periodontal', label: '歯周病患者', icon: '🦷', description: '歯周病の症状を持つ中高年患者' },
    { id: 'aesthetic', label: '審美希望患者', icon: '✨', description: '見た目の改善を希望する患者' },
    { id: 'pediatric', label: '小児患者', icon: '👶', description: '歯科恐怖を持つ子供の患者' },
    { id: 'elderly', label: '高齢患者', icon: '👴', description: '複数の疾患を持つ高齢者' }
  ] : [
    { id: 'random', label: 'Fully Random', icon: '🎲', description: 'Generate all elements randomly' },
    { id: 'emergency', label: 'Emergency Patient', icon: '🆘', description: 'Patient with severe pain or acute symptoms' },
    { id: 'periodontal', label: 'Periodontal Patient', icon: '🦷', description: 'Middle-aged patient with gum disease' },
    { id: 'aesthetic', label: 'Aesthetic Patient', icon: '✨', description: 'Patient seeking cosmetic improvement' },
    { id: 'pediatric', label: 'Pediatric Patient', icon: '👶', description: 'Child patient with dental anxiety' },
    { id: 'elderly', label: 'Elderly Patient', icon: '👴', description: 'Senior with multiple conditions' }
  ];

  const handleGenerate = () => {
    let newScenario: PatientScenario;

    // Always use Japanese generator for now
    if (selectedTheme === 'random') {
      newScenario = generateRandomScenario();
    } else {
      newScenario = generateThemedScenario(selectedTheme as any);
    }

    // The scenario will be automatically translated in the OpenAI API when language is 'en'
    onGenerate(newScenario);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl max-w-3xl w-full border border-cyan-500/30">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 p-6 border-b border-cyan-500/30">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {language === 'ja' ? 'シナリオ新規自動生成' : 'Generate New Scenario'}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {language === 'ja' ? 'キャンセル' : 'Cancel'}
              </button>
              <button
                onClick={handleGenerate}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center gap-2"
              >
                <span>🎲</span>
                {language === 'ja' ? '生成' : 'Generate'}
              </button>
            </div>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">{language === 'ja' ? '生成タイプを選択' : 'Select Generation Type'}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {themes.map(theme => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedTheme === theme.id
                    ? 'bg-gradient-to-br from-cyan-900/50 to-blue-900/50 border-cyan-400 shadow-lg shadow-cyan-400/20'
                    : 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800'
                }`}
              >
                <div className="text-3xl mb-2">{theme.icon}</div>
                <div className="text-sm font-semibold text-white mb-1">{theme.label}</div>
                <div className="text-xs text-gray-400">{theme.description}</div>
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="text-sm font-semibold text-cyan-400 mb-2">{language === 'ja' ? '生成される内容' : 'Generated Content'}</h4>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• {language === 'ja' ? '患者の基本情報（氏名、年齢、性別、職業）' : 'Basic patient information (name, age, gender, occupation)'}</li>
              <li>• {language === 'ja' ? '主訴と症状の詳細' : 'Chief complaint and symptom details'}</li>
              <li>• {language === 'ja' ? '現病歴と既往歴' : 'Present and past medical history'}</li>
              <li>• {language === 'ja' ? '生活習慣と家族構成' : 'Lifestyle and family structure'}</li>
              <li>• {language === 'ja' ? '心理社会的情報' : 'Psychosocial information'}</li>
            </ul>
          </div>

          {selectedTheme !== 'random' && (
            <div className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
              <p className="text-sm text-blue-300">
                {language === 'ja' ? (
                  <><strong>{themes.find(t => t.id === selectedTheme)?.label}</strong>の特徴を持つシナリオが生成されます。
                  基本的な情報はランダムですが、症状や背景が選択したテーマに合わせて調整されます。</>
                ) : (
                  <>A scenario with <strong>{themes.find(t => t.id === selectedTheme)?.label}</strong> characteristics will be generated.
                  Basic information is random, but symptoms and background are adjusted to match the selected theme.</>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}