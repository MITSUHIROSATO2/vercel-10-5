// 医療面接評価の型定義

export interface EvaluationItem {
  id: string;
  label: string;
  checked: boolean;
  category: string;
  subcategory?: string;
  priority?: 'high' | 'medium' | 'low';
  description?: string;
}

export interface EvaluationCategory {
  id: string;
  name: string;
  items: EvaluationItem[];
}

export interface InterviewEvaluation {
  id: string;
  scenarioId: string;
  timestamp: Date;
  totalScore: number;
  maxScore: number;
  categories: {
    procedure?: EvaluationItem[];
    communication: {
      verbal: EvaluationItem[];
      overall: EvaluationItem[];
    };
    introduction: EvaluationItem[];
    medicalInfo: {
      chiefComplaint: EvaluationItem[];
      history: EvaluationItem[];
      lifestyle: EvaluationItem[];
    };
    psychosocial: EvaluationItem[];
    closing: EvaluationItem[];
  };
  notes?: string;
  evaluatorName?: string;
  // AI評価の詳細情報
  conversationLog?: Array<{
    role: 'student' | 'patient';
    content: string;
    timestamp?: string;
  }>;
  aiEvaluation?: {
    summary: string;
    strengths: string[];
    improvements: string[];
    detailedFeedback: {
      communication: string;
      medicalInfo: string;
      overall: string;
    };
  };
}

// 評価項目の定義
export const evaluationTemplate: InterviewEvaluation = {
  id: '',
  scenarioId: '',
  timestamp: new Date(),
  totalScore: 0,
  maxScore: 100,
  categories: {
    communication: {
      verbal: [
        {
          id: 'comm-1',
          label: '適切な言葉遣いと話し方で対応できた',
          checked: false,
          category: 'communication',
          subcategory: 'verbal',
          priority: 'high',
          description: '患者にわかりやすい言葉、丁寧な言葉遣いで話す'
        },
        {
          id: 'comm-2',
          label: '傾聴を積極的に行った',
          checked: false,
          category: 'communication',
          subcategory: 'verbal',
          priority: 'high',
          description: '患者の話を遮らず、適切なあいづちを行う'
        },
        {
          id: 'comm-3',
          label: '共感的対応を行った',
          checked: false,
          category: 'communication',
          subcategory: 'verbal',
          priority: 'high',
          description: '患者の気持ちに共感していることを言葉で伝える'
        },
        {
          id: 'comm-4',
          label: '開放的質問を適切に使用した',
          checked: false,
          category: 'communication',
          subcategory: 'verbal',
          priority: 'high',
          description: '「今日はどうされましたか」など患者が自由に話せる質問'
        },
        {
          id: 'comm-5',
          label: '情報の確認や要約を行った',
          checked: false,
          category: 'communication',
          subcategory: 'verbal',
          priority: 'medium',
          description: '患者の訴えを要約し、確認を行う'
        }
      ],
      overall: [
        {
          id: 'overall-1',
          label: '順序立った面接を行った',
          checked: false,
          category: 'communication',
          subcategory: 'overall',
          priority: 'high',
          description: '導入→主訴→病歴→締めくくりの流れ'
        },
        {
          id: 'overall-2',
          label: '話題を変える際に適切な声かけをした',
          checked: false,
          category: 'communication',
          subcategory: 'overall',
          priority: 'medium',
          description: '「次はお体のことについてお聞きします」など'
        }
      ]
    },
    introduction: [
      {
        id: 'intro-1',
        label: '適切な挨拶を行った',
        checked: false,
        category: 'introduction',
        priority: 'high',
        description: '「こんにちは」「よろしくお願いします」など'
      },
      {
        id: 'intro-2',
        label: '本人確認を行った',
        checked: false,
        category: 'introduction',
        priority: 'high',
        description: '氏名と生年月日の確認'
      },
      {
        id: 'intro-3',
        label: '自己紹介を行った',
        checked: false,
        category: 'introduction',
        priority: 'high',
        description: '名前と立場を伝える'
      },
      {
        id: 'intro-4',
        label: '面接の概要説明と同意を得た',
        checked: false,
        category: 'introduction',
        priority: 'medium',
        description: '今から行うことを説明し、承諾を得る'
      }
    ],
    medicalInfo: {
      chiefComplaint: [
        {
          id: 'chief-1',
          label: '主訴を聞いた',
          checked: false,
          category: 'medicalInfo',
          subcategory: 'chiefComplaint',
          priority: 'high',
          description: '「今日はどうされましたか？」'
        },
        {
          id: 'chief-2',
          label: '症状の部位・位置を聞いた',
          checked: false,
          category: 'medicalInfo',
          subcategory: 'chiefComplaint',
          priority: 'high',
          description: '上下左右、歯・歯肉・粘膜など'
        },
        {
          id: 'chief-3',
          label: '症状の性状を聞いた',
          checked: false,
          category: 'medicalInfo',
          subcategory: 'chiefComplaint',
          priority: 'high',
          description: '「どのような痛みですか？」'
        },
        {
          id: 'chief-4',
          label: '症状の程度を聞いた',
          checked: false,
          category: 'medicalInfo',
          subcategory: 'chiefComplaint',
          priority: 'high',
          description: '「どのくらいの痛みですか？」'
        },
        {
          id: 'chief-5',
          label: '症状の起きる状況を聞いた',
          checked: false,
          category: 'medicalInfo',
          subcategory: 'chiefComplaint',
          priority: 'high',
          description: '「どのような時に痛みますか？」'
        },
        {
          id: 'chief-6',
          label: '発症時期を聞いた',
          checked: false,
          category: 'medicalInfo',
          subcategory: 'chiefComplaint',
          priority: 'high',
          description: '「いつから症状がありますか？」'
        },
        {
          id: 'chief-7',
          label: '症状の経過を聞いた',
          checked: false,
          category: 'medicalInfo',
          subcategory: 'chiefComplaint',
          priority: 'medium',
          description: '発症から今までの変化'
        },
        {
          id: 'chief-8',
          label: '増悪・寛解因子を聞いた',
          checked: false,
          category: 'medicalInfo',
          subcategory: 'chiefComplaint',
          priority: 'medium',
          description: '症状を悪化・改善させる要因'
        },
        {
          id: 'chief-9',
          label: '日常生活への支障を聞いた',
          checked: false,
          category: 'medicalInfo',
          subcategory: 'chiefComplaint',
          priority: 'medium',
          description: '食事や睡眠への影響など'
        },
        {
          id: 'chief-10',
          label: '対処行動を聞いた',
          checked: false,
          category: 'medicalInfo',
          subcategory: 'chiefComplaint',
          priority: 'medium',
          description: '薬の使用や自己対処法'
        }
      ],
      history: [
        {
          id: 'hist-1',
          label: '歯科既往歴を聞いた',
          checked: false,
          category: 'medicalInfo',
          subcategory: 'history',
          priority: 'high',
          description: '過去の歯科治療経験'
        },
        {
          id: 'hist-2',
          label: '麻酔・抜歯の経験を聞いた',
          checked: false,
          category: 'medicalInfo',
          subcategory: 'history',
          priority: 'high',
          description: '歯科麻酔や抜歯の経験と問題の有無'
        },
        {
          id: 'hist-3',
          label: '全身既往歴を聞いた',
          checked: false,
          category: 'medicalInfo',
          subcategory: 'history',
          priority: 'high',
          description: '現在治療中の病気など'
        },
        {
          id: 'hist-4',
          label: '常用薬を聞いた',
          checked: false,
          category: 'medicalInfo',
          subcategory: 'history',
          priority: 'high',
          description: '服用中の薬について'
        },
        {
          id: 'hist-5',
          label: 'アレルギー歴を聞いた',
          checked: false,
          category: 'medicalInfo',
          subcategory: 'history',
          priority: 'high',
          description: '薬品・食物・金属などのアレルギー'
        }
      ],
      lifestyle: [
        {
          id: 'life-1',
          label: '口腔衛生習慣を聞いた',
          checked: false,
          category: 'medicalInfo',
          subcategory: 'lifestyle',
          priority: 'low',
          description: '歯磨きの頻度など'
        },
        {
          id: 'life-2',
          label: '食習慣や嗜好を聞いた',
          checked: false,
          category: 'medicalInfo',
          subcategory: 'lifestyle',
          priority: 'low',
          description: '喫煙・飲酒など'
        }
      ]
    },
    psychosocial: [
      {
        id: 'psych-1',
        label: '解釈モデルを聞いた',
        checked: false,
        category: 'psychosocial',
        priority: 'medium',
        description: '症状の原因について患者の考えを聞く'
      },
      {
        id: 'psych-2',
        label: '心配事や不安を聞いた',
        checked: false,
        category: 'psychosocial',
        priority: 'medium',
        description: '症状に関する心配や不安'
      },
      {
        id: 'psych-3',
        label: '治療への要望を聞いた',
        checked: false,
        category: 'psychosocial',
        priority: 'low',
        description: '治療方法や期間の希望'
      }
    ],
    closing: [
      {
        id: 'close-1',
        label: '要約と確認を行った',
        checked: false,
        category: 'closing',
        priority: 'high',
        description: '聴取内容を要約し、間違いがないか確認'
      },
      {
        id: 'close-2',
        label: '言い忘れの確認を行った',
        checked: false,
        category: 'closing',
        priority: 'high',
        description: '「他に伝えたいことはありませんか？」'
      },
      {
        id: 'close-3',
        label: '次の行動を説明した',
        checked: false,
        category: 'closing',
        priority: 'medium',
        description: '「次はお口の中を見せていただきます」など'
      }
    ]
  },
  notes: ''
};

// スコア計算関数
export function calculateScore(evaluation: InterviewEvaluation): { score: number; maxScore: number; percentage: number } {
  let score = 0;
  let maxScore = 0;
  
  const scoreMap = {
    high: 3,
    medium: 2,
    low: 1
  };
  
  // コミュニケーション
  evaluation.categories.communication.verbal.forEach(item => {
    const points = scoreMap[item.priority || 'medium'];
    maxScore += points;
    if (item.checked) score += points;
  });
  
  evaluation.categories.communication.overall.forEach(item => {
    const points = scoreMap[item.priority || 'medium'];
    maxScore += points;
    if (item.checked) score += points;
  });
  
  // 導入部分
  evaluation.categories.introduction.forEach(item => {
    const points = scoreMap[item.priority || 'medium'];
    maxScore += points;
    if (item.checked) score += points;
  });
  
  // 医学的情報
  evaluation.categories.medicalInfo.chiefComplaint.forEach(item => {
    const points = scoreMap[item.priority || 'medium'];
    maxScore += points;
    if (item.checked) score += points;
  });
  
  evaluation.categories.medicalInfo.history.forEach(item => {
    const points = scoreMap[item.priority || 'medium'];
    maxScore += points;
    if (item.checked) score += points;
  });
  
  evaluation.categories.medicalInfo.lifestyle.forEach(item => {
    const points = scoreMap[item.priority || 'medium'];
    maxScore += points;
    if (item.checked) score += points;
  });
  
  // 心理社会的情報
  evaluation.categories.psychosocial.forEach(item => {
    const points = scoreMap[item.priority || 'medium'];
    maxScore += points;
    if (item.checked) score += points;
  });
  
  // 締めくくり
  evaluation.categories.closing.forEach(item => {
    const points = scoreMap[item.priority || 'medium'];
    maxScore += points;
    if (item.checked) score += points;
  });
  
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  
  return { score, maxScore, percentage };
}