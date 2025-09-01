'use client';

import { useState } from 'react';
import { generateRandomScenario, generateThemedScenario } from '@/lib/scenarioGenerator';
import type { PatientScenario } from '@/lib/scenarioTypes';

interface ScenarioGeneratorProps {
  onGenerate: (scenario: PatientScenario) => void;
  onCancel: () => void;
}

export default function ScenarioGenerator({ onGenerate, onCancel }: ScenarioGeneratorProps) {
  const [selectedTheme, setSelectedTheme] = useState<string>('random');

  const themes = [
    { id: 'random', label: '完全ランダム', icon: '🎲', description: 'すべての要素をランダムに生成' },
    { id: 'emergency', label: '緊急患者', icon: '🆘', description: '激痛や急性症状を持つ患者' },
    { id: 'periodontal', label: '歯周病患者', icon: '🦷', description: '歯周病の症状を持つ中高年患者' },
    { id: 'aesthetic', label: '審美希望患者', icon: '✨', description: '見た目の改善を希望する患者' },
    { id: 'pediatric', label: '小児患者', icon: '👶', description: '歯科恐怖を持つ子供の患者' },
    { id: 'elderly', label: '高齢患者', icon: '👴', description: '複数の疾患を持つ高齢者' }
  ];

  const handleGenerate = () => {
    let newScenario: PatientScenario;
    
    if (selectedTheme === 'random') {
      newScenario = generateRandomScenario();
    } else {
      newScenario = generateThemedScenario(selectedTheme as any);
    }
    
    onGenerate(newScenario);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl max-w-3xl w-full border border-cyan-500/30">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 p-6 border-b border-cyan-500/30">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              シナリオ新規自動生成
            </h2>
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleGenerate}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center gap-2"
              >
                <span>🎲</span>
                生成
              </button>
            </div>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">生成タイプを選択</h3>
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
            <h4 className="text-sm font-semibold text-cyan-400 mb-2">生成される内容</h4>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• 患者の基本情報（氏名、年齢、性別、職業）</li>
              <li>• 主訴と症状の詳細</li>
              <li>• 現病歴と既往歴</li>
              <li>• 生活習慣と家族構成</li>
              <li>• 心理社会的情報</li>
            </ul>
          </div>

          {selectedTheme !== 'random' && (
            <div className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
              <p className="text-sm text-blue-300">
                <strong>{themes.find(t => t.id === selectedTheme)?.label}</strong>の特徴を持つシナリオが生成されます。
                基本的な情報はランダムですが、症状や背景が選択したテーマに合わせて調整されます。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}