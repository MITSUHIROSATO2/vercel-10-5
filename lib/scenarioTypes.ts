// シナリオのデータ型定義
export interface PatientScenario {
  id: string;
  name: string;
  
  // 基本情報
  basicInfo: {
    name: string;
    age: string;
    gender: string;
    occupation: string;
  };
  
  // 主訴
  chiefComplaint: {
    complaint: string;
    location: string;
    since: string;
  };
  
  // 現病歴
  presentIllness: {
    nature: string; // 症状の性状
    severity: string; // 症状の程度
    progress: string; // 経過
    trigger: string; // 誘発因子
    dailyImpact: string; // 日常生活への影響
    medication: string; // 服薬歴
    dentalVisit: string; // 本件の歯科受診歴
  };
  
  // 歯科既往歴
  dentalHistory: {
    extraction: string; // 抜歯歴
    anesthesia: string; // 麻酔経験
    complications: string; // 治療中の異常経験
  };
  
  // 全身既往歴
  medicalHistory: {
    systemicDisease: string; // 全身疾患の有無
    currentMedication: string; // 服薬状況
    allergies: string; // アレルギー
  };
  
  // 生活歴
  lifestyle: {
    oralHygiene: string; // 口腔衛生習慣
    dietaryHabits: string; // 食嗜好・嗜好品
    familyStructure: string; // 家族構成・同居者
    workSchedule: string; // 仕事状況・通院条件
  };
  
  // 心理社会的情報
  psychosocial: {
    concerns: string; // 心配・希望
    requests: string; // 要望
  };
  
  // 面接技法評価
  interviewEvaluation: {
    summarization: string; // 主訴の要約確認
    additionalCheck: string; // 言い忘れの確認
  };

  // 特殊事情（通常は空欄）
  specialCircumstances?: string;
}

// サンプルシナリオテンプレート
export const scenarioTemplates: Record<string, Partial<PatientScenario>> = {
  toothache: {
    name: '急性歯痛の患者',
    basicInfo: {
      name: '田中 弘樹',
      age: '43歳',
      gender: '男性',
      occupation: '営業職'
    },
    chiefComplaint: {
      complaint: '右下奥歯がズキズキ痛む',
      location: '右下6番',
      since: '1週間前から'
    },
    presentIllness: {
      nature: 'ズキズキ、ジーンとした痛み',
      severity: 'ロキソニンで軽減',
      progress: '徐々に悪化',
      trigger: '冷たいもので痛む',
      dailyImpact: '食事がつらい',
      medication: '市販の鎮痛剤（ロキソニン）',
      dentalVisit: '初診'
    },
    dentalHistory: {
      extraction: '親知らず抜歯あり',
      anesthesia: 'あり（効きにくい）',
      complications: '抜歯後の腫れ'
    },
    medicalHistory: {
      systemicDisease: '高血圧',
      currentMedication: 'アムロジピン服用中',
      allergies: 'ペニシリンアレルギー'
    },
    lifestyle: {
      oralHygiene: '朝晩2回、夜は適当',
      dietaryHabits: '甘いコーヒー、喫煙あり',
      familyStructure: '妻・子ども2人と同居',
      workSchedule: '平日19時まで可、昼不可'
    },
    psychosocial: {
      concerns: '麻酔が怖い、抜きたくない',
      requests: '痛くない治療を希望'
    },
    interviewEvaluation: {
      summarization: '面接終盤での再確認',
      additionalCheck: '他に気になることは？'
    }
  },
  
  periodontal: {
    name: '歯周病の患者',
    basicInfo: {
      name: '佐藤 美智子',
      age: '58歳',
      gender: '女性',
      occupation: '主婦'
    },
    chiefComplaint: {
      complaint: '歯茎から血が出る',
      location: '全体的',
      since: '半年前から'
    },
    presentIllness: {
      nature: '歯磨き時の出血',
      severity: '毎回出血する',
      progress: '変化なし',
      trigger: '歯磨き時',
      dailyImpact: '口臭が気になる',
      medication: 'なし',
      dentalVisit: '前に他院受診'
    },
    dentalHistory: {
      extraction: 'なし',
      anesthesia: 'あり',
      complications: 'なし'
    },
    medicalHistory: {
      systemicDisease: '糖尿病',
      currentMedication: 'メトホルミン服用中',
      allergies: 'なし'
    },
    lifestyle: {
      oralHygiene: '朝のみ',
      dietaryHabits: '間食多い',
      familyStructure: '夫と二人暮らし',
      workSchedule: 'いつでも可'
    },
    psychosocial: {
      concerns: '歯を失うのが怖い',
      requests: '歯を残したい'
    },
    interviewEvaluation: {
      summarization: '面接終盤での再確認',
      additionalCheck: '他に気になることは？'
    }
  },
  
  aesthetic: {
    name: '審美希望の患者',
    basicInfo: {
      name: '山田 真理',
      age: '28歳',
      gender: '女性',
      occupation: '会社員'
    },
    chiefComplaint: {
      complaint: '前歯の色が気になる',
      location: '上前歯',
      since: '以前から'
    },
    presentIllness: {
      nature: '黄ばみ',
      severity: '写真で目立つ',
      progress: '変化なし',
      trigger: 'なし',
      dailyImpact: '人前で笑えない',
      medication: 'なし',
      dentalVisit: '初診'
    },
    dentalHistory: {
      extraction: 'なし',
      anesthesia: 'あり',
      complications: 'なし'
    },
    medicalHistory: {
      systemicDisease: 'なし',
      currentMedication: 'なし',
      allergies: 'なし'
    },
    lifestyle: {
      oralHygiene: '朝昼晩3回',
      dietaryHabits: 'コーヒー好き',
      familyStructure: '一人暮らし',
      workSchedule: '土日のみ可'
    },
    psychosocial: {
      concerns: '費用が心配',
      requests: '自然な白さにしたい'
    },
    interviewEvaluation: {
      summarization: '面接終盤での再確認',
      additionalCheck: '他に気になることは？'
    }
  }
};