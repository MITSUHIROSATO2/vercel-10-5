'use client';

import React from 'react';
import type { PatientScenario } from '@/lib/scenarioTypes';
import { getTranslatedScenario } from '@/lib/scenariosEnglish';

interface PatientInfoModalProps {
  scenario: PatientScenario;
  language: 'ja' | 'en';
  onClose: () => void;
}

export default function PatientInfoModal({ scenario, language, onClose }: PatientInfoModalProps) {
  const translatedScenario = getTranslatedScenario(scenario, language);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-gray-900 rounded-2xl border border-cyan-500/30 p-5 max-w-4xl w-full max-h-[95vh] overflow-y-auto custom-scrollbar shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {language === 'ja' ? 'AI患者情報' : 'AI Patient Information'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <span className="text-2xl">✕</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* 基本情報 */}
          <div className="glass-effect rounded-xl p-5 border-cyan-500/20">
            <h3 className="text-lg font-semibold text-cyan-300 mb-3 flex items-center gap-2">
              <span>👤</span>
              {language === 'ja' ? '基本情報' : 'Basic Information'}
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div className="flex flex-col">
                <span className="text-gray-400">{language === 'ja' ? '氏名' : 'Name'}</span>
                <span className="text-white font-medium text-base">{translatedScenario.basicInfo.name}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400">{language === 'ja' ? '年齢' : 'Age'}</span>
                <span className="text-white font-medium text-base">{translatedScenario.basicInfo.age}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400">{language === 'ja' ? '性別' : 'Gender'}</span>
                <span className="text-white font-medium text-base">{translatedScenario.basicInfo.gender}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400">{language === 'ja' ? '職業' : 'Occupation'}</span>
                <span className="text-white font-medium text-base">{translatedScenario.basicInfo.occupation}</span>
              </div>
            </div>
          </div>

          {/* 主訴 */}
          <div className="glass-effect rounded-xl p-5 border-cyan-500/20">
            <h3 className="text-lg font-semibold text-cyan-300 mb-3 flex items-center gap-2">
              <span>🩺</span>
              {language === 'ja' ? '主訴' : 'Chief Complaint'}
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-400">{language === 'ja' ? '訴え' : 'Complaint'}</span>
                <p className="text-white mt-1 text-base">{translatedScenario.chiefComplaint.complaint}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-400">{language === 'ja' ? '部位' : 'Location'}</span>
                  <p className="text-white mt-1 text-base">{translatedScenario.chiefComplaint.location}</p>
                </div>
                <div>
                  <span className="text-gray-400">{language === 'ja' ? '発症時期' : 'Since'}</span>
                  <p className="text-white mt-1 text-base">{translatedScenario.chiefComplaint.since}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 現病歴 */}
          <div className="glass-effect rounded-xl p-5 border-blue-500/20">
            <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
              <span>📋</span>
              {language === 'ja' ? '現病歴' : 'Present Illness'}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <p className="text-white flex-1 text-base">{translatedScenario.presentIllness.nature}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <p className="text-white flex-1 text-base">{translatedScenario.presentIllness.severity}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <p className="text-white flex-1 text-base">{translatedScenario.presentIllness.dailyImpact}</p>
              </div>
            </div>
          </div>

          {/* 全身既往歴 */}
          <div className="glass-effect rounded-xl p-5 border-teal-500/20">
            <h3 className="text-lg font-semibold text-teal-300 mb-3 flex items-center gap-2">
              <span>🏥</span>
              {language === 'ja' ? '全身既往歴' : 'Medical History'}
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-400">{language === 'ja' ? '全身疾患' : 'Systemic Disease'}</span>
                <p className="text-white mt-1 text-base">
                  {translatedScenario.medicalHistory.systemicDisease || (language === 'ja' ? 'なし' : 'None')}
                </p>
              </div>
              {translatedScenario.medicalHistory.allergies && (
                <div>
                  <span className="text-gray-400">{language === 'ja' ? 'アレルギー' : 'Allergies'}</span>
                  <p className="text-white mt-1 text-base">{translatedScenario.medicalHistory.allergies}</p>
                </div>
              )}
              {translatedScenario.medicalHistory.medications && (
                <div>
                  <span className="text-gray-400">{language === 'ja' ? '服用薬' : 'Medications'}</span>
                  <p className="text-white mt-1 text-base">{translatedScenario.medicalHistory.medications}</p>
                </div>
              )}
            </div>
          </div>

          {/* 心理社会的情報 - 2列幅 */}
          <div className="glass-effect rounded-xl p-5 border-purple-500/20 col-span-2">
            <h3 className="text-lg font-semibold text-purple-300 mb-3 flex items-center gap-2">
              <span>💭</span>
              {language === 'ja' ? '心理社会的情報' : 'Psychosocial Information'}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">{language === 'ja' ? '懸念事項' : 'Concerns'}</span>
                <p className="text-white mt-1 text-base">{translatedScenario.psychosocial.concerns}</p>
              </div>
              {translatedScenario.psychosocial.expectations && (
                <div>
                  <span className="text-gray-400">{language === 'ja' ? '期待' : 'Expectations'}</span>
                  <p className="text-white mt-1 text-base">{translatedScenario.psychosocial.expectations}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
