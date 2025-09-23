// 選択したシナリオに基づく動的デモ対話生成

import type { PatientScenario } from './scenarioTypes';
import type { DemoDialogue } from './improvedDemoDialogues';

// 医師の質問は全シナリオ共通
const doctorQuestions = {
  // 導入
  greeting: 'こんにちは、歯科医師の田中と申します、本日担当させていただきます。',
  nameConfirmation: 'まず、お名前をフルネームで教えていただけますか？',
  birthDateConfirmation: 'お名前確認できました。生年月日も確認させてください。',
  consentForInterview: 'これから症状について詳しくお伺いして、診察をさせていただきます。よろしいでしょうか？',

  // 主訴
  chiefComplaint: '今日はどのような症状でいらっしゃいましたか？',
  sympathyAndDetail: 'お辛いですね。その症状について、もう少し詳しく教えていただけますか？',

  // 現病歴（OPQRST）
  onset: 'いつから症状が始まりましたか？',
  trigger: 'きっかけは何かありましたか？',
  whenPain: 'どんな時に症状が出ますか？',
  otherTriggers: '他にも症状が出る時はありますか？',
  quality: 'どのような症状か表現していただけますか？',
  location: '症状の場所を具体的に教えてください。',
  radiation: '症状は他の場所に広がりますか？',
  severity: '症状の強さを10段階で表すと、どのくらいですか？',
  medication: '薬は使用されましたか？',

  // 歯科的既往歴
  dentalTransition: 'わかりました。次に、歯の治療歴についてお聞きします。',
  dentalHistory: '今まで歯科治療を受けたことはありますか？',
  dentalProblems: 'その時の治療で何か問題はありましたか？',
  otherDentalHistory: '他に歯科治療の経験はありますか？',

  // 全身的既往歴
  medicalTransition: 'ありがとうございます。続いて、全身の健康状態についてお伺いします。',
  currentDiseases: '現在治療中の病気はありますか？',
  currentMedications: '服用中のお薬を教えてください。',
  allergies: 'アレルギーはありますか？',

  // 家族歴
  familyHistory: 'ご家族に歯周病や歯を早く失った方はいらっしゃいますか？',

  // 生活習慣
  lifestyleTransition: '分かりました。次に、普段の生活習慣についてお聞きします。',
  brushingFrequency: '歯磨きは1日何回されていますか？',
  flossUsage: 'フロスや歯間ブラシは使用されていますか？',
  sweetConsumption: '甘いものはよく召し上がりますか？',
  snacking: '間食はされますか？',

  // 嗜好品
  habitsTransition: '嗜好品についてもお聞きします。',
  smoking: 'タバコは吸われますか？',
  alcohol: 'お酒は飲まれますか？',

  // 心理社会的側面
  psychosocialTransition: '治療に関するご希望をお聞かせください。',
  concerns: '治療について何か不安なことはありますか？',
  requests: '治療に関して特別なご希望はありますか？',

  // まとめ
  summary: 'それでは、今日お聞きした内容を確認させていただきます。',
  additionalConcerns: '他に何か気になることや、お聞きしたいことはありますか？',
  conclusion: '分かりました。これから診察させていただきますね。'
};

// シナリオに基づいて患者の応答を生成
export function generateDemoDialogues(scenario: PatientScenario, language: 'ja' | 'en' = 'ja'): DemoDialogue[] {
  const dialogues: DemoDialogue[] = [];

  // ===== 導入 =====
  dialogues.push(
    { speaker: 'doctor', text: doctorQuestions.greeting, delay: 3000 },
    { speaker: 'patient', text: 'こんにちは、よろしくお願いします。', delay: 2500 },

    { speaker: 'doctor', text: doctorQuestions.nameConfirmation, delay: 2000 },
    { speaker: 'patient', text: `${scenario.basicInfo.name}です。`, delay: 2000 },

    { speaker: 'doctor', text: `${scenario.basicInfo.name}さんですね。生年月日も確認させてください。`, delay: 2500 },
    { speaker: 'patient', text: generateBirthDate(scenario.basicInfo.age), delay: 2500 },

    { speaker: 'doctor', text: doctorQuestions.consentForInterview, delay: 3000 },
    { speaker: 'patient', text: 'はい、お願いします。', delay: 2000 }
  );

  // ===== 主訴 =====
  dialogues.push(
    { speaker: 'doctor', text: doctorQuestions.chiefComplaint, delay: 2500 },
    { speaker: 'patient', text: `${scenario.chiefComplaint.complaint}で来ました。`, delay: 2500 },

    { speaker: 'doctor', text: doctorQuestions.sympathyAndDetail, delay: 3000 },
    { speaker: 'patient', text: 'はい。', delay: 1500 }
  );

  // ===== 現病歴（OPQRST）=====
  dialogues.push(
    { speaker: 'doctor', text: doctorQuestions.onset, delay: 2000 },
    { speaker: 'patient', text: scenario.chiefComplaint.since, delay: 2000 },

    { speaker: 'doctor', text: doctorQuestions.trigger, delay: 2000 },
    { speaker: 'patient', text: scenario.presentIllness.trigger || '特にきっかけはありません。', delay: 3000 },

    { speaker: 'doctor', text: doctorQuestions.whenPain, delay: 2000 },
    { speaker: 'patient', text: scenario.presentIllness.trigger || '噛むと痛みます。', delay: 2500 },

    { speaker: 'doctor', text: doctorQuestions.otherTriggers, delay: 2000 },
    { speaker: 'patient', text: scenario.presentIllness.dailyImpact || '特にありません。', delay: 2500 },

    { speaker: 'doctor', text: doctorQuestions.quality, delay: 2500 },
    { speaker: 'patient', text: scenario.presentIllness.nature, delay: 2500 },

    { speaker: 'doctor', text: doctorQuestions.location, delay: 2000 },
    { speaker: 'patient', text: scenario.chiefComplaint.location, delay: 2000 },

    { speaker: 'doctor', text: doctorQuestions.radiation, delay: 2000 },
    { speaker: 'patient', text: generateRadiation(scenario.chiefComplaint.location), delay: 2500 },

    { speaker: 'doctor', text: doctorQuestions.severity, delay: 2500 },
    { speaker: 'patient', text: generateSeverityResponse(scenario.presentIllness.severity), delay: 3000 },

    { speaker: 'doctor', text: doctorQuestions.medication, delay: 2000 },
    { speaker: 'patient', text: scenario.presentIllness.medication || '特に使っていません。', delay: 3000 }
  );

  // ===== 歯科的既往歴 =====
  dialogues.push(
    { speaker: 'doctor', text: doctorQuestions.dentalTransition, delay: 2500 },

    { speaker: 'doctor', text: doctorQuestions.dentalHistory, delay: 2500 },
    { speaker: 'patient', text: scenario.dentalHistory.extraction || 'ありません。', delay: 2500 },

    { speaker: 'doctor', text: doctorQuestions.dentalProblems, delay: 2500 },
    { speaker: 'patient', text: scenario.dentalHistory.complications || '特に問題ありませんでした。', delay: 2500 },

    { speaker: 'doctor', text: doctorQuestions.otherDentalHistory, delay: 2000 },
    { speaker: 'patient', text: scenario.dentalHistory.anesthesia ? '虫歯の治療を受けたことがあります。' : '特にありません。', delay: 2000 }
  );

  // ===== 全身的既往歴 =====
  dialogues.push(
    { speaker: 'doctor', text: doctorQuestions.medicalTransition, delay: 3000 },

    { speaker: 'doctor', text: doctorQuestions.currentDiseases, delay: 2000 },
    { speaker: 'patient', text: scenario.medicalHistory.systemicDisease || 'ありません。', delay: 2000 },

    { speaker: 'doctor', text: doctorQuestions.currentMedications, delay: 2000 },
    { speaker: 'patient', text: scenario.medicalHistory.currentMedication || '飲んでいません。', delay: 2500 },

    { speaker: 'doctor', text: doctorQuestions.allergies, delay: 2000 },
    { speaker: 'patient', text: scenario.medicalHistory.allergies || 'ありません。', delay: 2500 }
  );

  // 家族歴
  dialogues.push(
    { speaker: 'doctor', text: doctorQuestions.familyHistory, delay: 3000 },
    { speaker: 'patient', text: generateFamilyHistory(scenario.chiefComplaint.complaint), delay: 2500 }
  );

  // ===== 生活習慣 =====
  dialogues.push(
    { speaker: 'doctor', text: doctorQuestions.lifestyleTransition, delay: 3000 },

    { speaker: 'doctor', text: doctorQuestions.brushingFrequency, delay: 2000 },
    { speaker: 'patient', text: scenario.lifestyle.oralHygiene || '朝と夜の2回です。', delay: 2000 },

    { speaker: 'doctor', text: doctorQuestions.flossUsage, delay: 2500 },
    { speaker: 'patient', text: generateFlossUsage(scenario.lifestyle.oralHygiene), delay: 2000 },

    { speaker: 'doctor', text: doctorQuestions.sweetConsumption, delay: 2000 },
    { speaker: 'patient', text: generateSweetConsumption(scenario.lifestyle.dietaryHabits), delay: 2500 },

    { speaker: 'doctor', text: doctorQuestions.snacking, delay: 2000 },
    { speaker: 'patient', text: generateSnacking(scenario.lifestyle.dietaryHabits), delay: 2500 }
  );

  // ===== 嗜好品 =====
  dialogues.push(
    { speaker: 'doctor', text: doctorQuestions.habitsTransition, delay: 2500 },

    { speaker: 'doctor', text: doctorQuestions.smoking, delay: 2000 },
    { speaker: 'patient', text: generateSmokingResponse(scenario.lifestyle.dietaryHabits), delay: 2000 },

    { speaker: 'doctor', text: doctorQuestions.alcohol, delay: 2000 },
    { speaker: 'patient', text: '週に2〜3回、ビールを飲む程度です。', delay: 2500 }
  );

  // ===== 心理社会的側面 =====
  dialogues.push(
    { speaker: 'doctor', text: doctorQuestions.psychosocialTransition, delay: 3000 },

    { speaker: 'doctor', text: doctorQuestions.concerns, delay: 2500 },
    { speaker: 'patient', text: scenario.psychosocial.concerns || '特にありません。', delay: 2500 },

    { speaker: 'doctor', text: doctorQuestions.requests, delay: 2500 },
    { speaker: 'patient', text: scenario.psychosocial.requests || 'なるべく痛くない治療を希望します。', delay: 3000 }
  );

  // ===== まとめ =====
  dialogues.push(
    { speaker: 'doctor', text: doctorQuestions.summary, delay: 3000 },
    { speaker: 'doctor', text: generateSummary(scenario), delay: 4000 },
    { speaker: 'patient', text: 'はい、そうです。', delay: 2000 },

    { speaker: 'doctor', text: doctorQuestions.additionalConcerns, delay: 2500 },
    { speaker: 'patient', text: '大丈夫です。', delay: 2000 },

    { speaker: 'doctor', text: doctorQuestions.conclusion, delay: 2500 }
  );

  return dialogues;
}

// ヘルパー関数

function generateBirthDate(age: string): string {
  const ageNum = parseInt(age);
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - ageNum;
  return `${birthYear}年5月15日生まれです。`;
}

function generateRadiation(location: string): string {
  if (location.includes('右')) {
    return '右の頬や耳の方まで響きます。';
  } else if (location.includes('左')) {
    return '左の頬や耳の方まで響きます。';
  } else if (location === '全体的') {
    return '特に広がりません。';
  }
  return '頭痛がすることもあります。';
}

function generateSeverityResponse(severity: string | undefined): string {
  if (!severity) return '7くらいです。';
  if (severity.includes('ロキソニン')) {
    return '8くらいです。夜も眠れないほどです。';
  }
  if (severity.includes('軽減')) {
    return '6くらいです。薬を飲めば楽になります。';
  }
  return '5くらいです。我慢できる程度です。';
}

function generateFamilyHistory(complaint: string): string {
  if (complaint.includes('歯茎') || complaint.includes('歯周')) {
    return '父が歯周病で60歳頃に入れ歯になりました。';
  }
  return '特にそういう人はいません。';
}

function generateFlossUsage(oralHygiene: string): string {
  if (oralHygiene.includes('朝のみ')) {
    return '使っていません。';
  }
  return 'たまに使う程度です。';
}

function generateSweetConsumption(dietaryHabits: string | undefined): string {
  if (!dietaryHabits) return '特に食べません。';
  if (dietaryHabits.includes('甘い')) {
    return 'コーヒーに砂糖を入れて、1日3杯くらい飲みます。';
  }
  return 'あまり食べません。';
}

function generateSnacking(dietaryHabits: string | undefined): string {
  if (!dietaryHabits) return 'あまりしません。';
  if (dietaryHabits.includes('間食')) {
    return '仕事中にお菓子をつまむことがあります。';
  }
  return 'ほとんどしません。';
}

function generateSmokingResponse(dietaryHabits: string | undefined): string {
  if (!dietaryHabits) return '吸いません。';
  if (dietaryHabits.includes('喫煙')) {
    return '1日10本程度吸います。';
  }
  return '吸いません。';
}

function generateSummary(scenario: PatientScenario): string {
  return `${scenario.chiefComplaint.location}の${scenario.chiefComplaint.complaint}で、` +
         `${scenario.chiefComplaint.since}症状があり、` +
         `${scenario.presentIllness.nature}ということですね。`;
}

// ショートデモ用の対話生成
export function generateShortDemoDialogues(scenario: PatientScenario, language: 'ja' | 'en' = 'ja'): DemoDialogue[] {
  const dialogues: DemoDialogue[] = [];

  // ===== 簡潔版：主要な質問のみ =====

  // 導入
  dialogues.push(
    { speaker: 'doctor', text: doctorQuestions.greeting, delay: 3000 },
    { speaker: 'patient', text: 'こんにちは、よろしくお願いします。', delay: 2500 },

    { speaker: 'doctor', text: doctorQuestions.nameConfirmation, delay: 2000 },
    { speaker: 'patient', text: `${scenario.basicInfo.name}です。`, delay: 2000 }
  );

  // 主訴
  dialogues.push(
    { speaker: 'doctor', text: doctorQuestions.chiefComplaint, delay: 2500 },
    { speaker: 'patient', text: `${scenario.chiefComplaint.complaint}で来ました。`, delay: 2500 }
  );

  // 現病歴（主要な項目のみ）
  dialogues.push(
    { speaker: 'doctor', text: doctorQuestions.onset, delay: 2000 },
    { speaker: 'patient', text: scenario.chiefComplaint.since, delay: 2000 },

    { speaker: 'doctor', text: doctorQuestions.quality, delay: 2500 },
    { speaker: 'patient', text: scenario.presentIllness.nature, delay: 2500 },

    { speaker: 'doctor', text: doctorQuestions.severity, delay: 2500 },
    { speaker: 'patient', text: generateSeverityResponse(scenario.presentIllness.severity), delay: 3000 }
  );

  // 既往歴（簡潔に）
  dialogues.push(
    { speaker: 'doctor', text: doctorQuestions.currentDiseases, delay: 2000 },
    { speaker: 'patient', text: scenario.medicalHistory.systemicDisease || 'ありません。', delay: 2000 },

    { speaker: 'doctor', text: doctorQuestions.allergies, delay: 2000 },
    { speaker: 'patient', text: scenario.medicalHistory.allergies || 'ありません。', delay: 2500 }
  );

  // 心理社会的側面
  dialogues.push(
    { speaker: 'doctor', text: doctorQuestions.concerns, delay: 2500 },
    { speaker: 'patient', text: scenario.psychosocial.concerns || '特にありません。', delay: 2500 }
  );

  // まとめ
  dialogues.push(
    { speaker: 'doctor', text: doctorQuestions.additionalConcerns, delay: 2500 },
    { speaker: 'patient', text: '大丈夫です。', delay: 2000 },

    { speaker: 'doctor', text: doctorQuestions.conclusion, delay: 2500 }
  );

  return dialogues;
}

// 英語版の対話生成（将来的な拡張用）
export function generateDemoDialoguesEnglish(scenario: PatientScenario): DemoDialogue[] {
  // 英語版の実装は後で追加
  return [];
}

// 英語版ショートデモ（将来的な拡張用）
export function generateShortDemoDialoguesEnglish(scenario: PatientScenario): DemoDialogue[] {
  // 英語版の実装は後で追加
  return [];
}