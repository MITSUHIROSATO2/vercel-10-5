// 選択したシナリオに基づく動的デモ対話生成

import type { PatientScenario } from './scenarioTypes';
import type { DemoDialogue } from './improvedDemoDialogues';
import { getTranslatedScenario } from './scenariosEnglish';

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
  explanatoryModel: 'ご自身では、この症状の原因は何だと思われますか？',
  visitReason: '今日、受診しようと思われたきっかけは何ですか？',
  psychologicalStatus: '最近、ストレスや不安を感じることはありますか？',
  concerns: '治療について何か不安なことはありますか？',
  requests: '治療に関して特別なご希望はありますか？',
  patientBackground: '通院の際、お仕事やご家庭の都合で気をつけることはありますか？',

  // まとめ
  summary: 'それでは、今日お聞きした内容を確認させていただきます。',
  additionalConcerns: '他に何か気になることや、お聞きしたいことはありますか？',
  conclusion: 'わかりました。それでは診察させていただきますね。'
};

// シナリオに基づいて患者の応答を生成
export function generateDemoDialogues(scenario: PatientScenario, _language: 'ja' | 'en' = 'ja'): DemoDialogue[] {
  const dialogues: DemoDialogue[] = [];

  // ===== 導入 =====
  dialogues.push(
    { speaker: 'doctor', text: doctorQuestions.greeting, delay: 3000 },
    { speaker: 'patient', text: 'こんにちは。よろしくお願いします。', delay: 2500 },

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
    { speaker: 'patient', text: generateOnsetDetail(scenario.presentIllness.trigger), delay: 3000 }
  );

  // ===== 現病歴（OPQRST）=====
  dialogues.push(
    { speaker: 'doctor', text: doctorQuestions.onset, delay: 2000 },
    { speaker: 'patient', text: `${scenario.chiefComplaint.since}からです。`, delay: 2000 },

    { speaker: 'doctor', text: doctorQuestions.trigger, delay: 2000 },
    { speaker: 'patient', text: generatePainTrigger(scenario.presentIllness.trigger), delay: 2500 },

    { speaker: 'doctor', text: doctorQuestions.otherTriggers, delay: 2000 },
    { speaker: 'patient', text: generateAdditionalTrigger(scenario.presentIllness.trigger), delay: 2000 },

    { speaker: 'doctor', text: doctorQuestions.quality, delay: 2000 },
    { speaker: 'patient', text: generatePainQuality(scenario.presentIllness.nature), delay: 2000 },

    { speaker: 'doctor', text: 'もう少し詳しく教えてください。', delay: 2000 },
    { speaker: 'patient', text: generateDetailedSymptom(scenario.presentIllness.nature), delay: 2500 },

    { speaker: 'doctor', text: doctorQuestions.location, delay: 2000 },
    { speaker: 'patient', text: `${scenario.chiefComplaint.location}です。`, delay: 2000 },

    { speaker: 'doctor', text: doctorQuestions.radiation, delay: 2000 },
    { speaker: 'patient', text: generateRadiation(scenario.chiefComplaint.location), delay: 2500 },

    { speaker: 'doctor', text: doctorQuestions.severity, delay: 2500 },
    { speaker: 'patient', text: generateSeverityResponse(scenario.presentIllness.severity), delay: 3000 },

    { speaker: 'doctor', text: doctorQuestions.medication, delay: 2000 },
    { speaker: 'patient', text: scenario.presentIllness.medication ? `${scenario.presentIllness.medication}を使っています。` : '今のところ、何も使っていません。', delay: 3000 }
  );

  // ===== 歯科的既往歴 =====
  dialogues.push(
    { speaker: 'doctor', text: doctorQuestions.dentalTransition, delay: 2500 },

    { speaker: 'doctor', text: doctorQuestions.dentalHistory, delay: 2500 },
    { speaker: 'patient', text: scenario.dentalHistory.extraction ? `${scenario.dentalHistory.extraction}抜いたことがあります。` : '歯を抜いたことはありません。', delay: 2500 },

    { speaker: 'doctor', text: doctorQuestions.dentalProblems, delay: 2500 },
    { speaker: 'patient', text: scenario.dentalHistory.complications ? `${scenario.dentalHistory.complications}がありました。` : '特にトラブルはなかったと思います。', delay: 2500 },

    { speaker: 'doctor', text: doctorQuestions.otherDentalHistory, delay: 2000 },
    { speaker: 'patient', text: scenario.dentalHistory.anesthesia ? '以前、虫歯の治療を何度か受けたことがあります。' : '他には特にありません。', delay: 2000 }
  );

  // ===== 全身的既往歴 =====
  dialogues.push(
    { speaker: 'doctor', text: doctorQuestions.medicalTransition, delay: 3000 },

    { speaker: 'doctor', text: doctorQuestions.currentDiseases, delay: 2000 },
    { speaker: 'patient', text: scenario.medicalHistory.systemicDisease ? `${scenario.medicalHistory.systemicDisease}があります。` : '特に病気はありません。', delay: 2000 },

    { speaker: 'doctor', text: doctorQuestions.currentMedications, delay: 2000 },
    { speaker: 'patient', text: scenario.medicalHistory.currentMedication ? `${scenario.medicalHistory.currentMedication}を服用しています。` : '現在、薬は飲んでいません。', delay: 2500 },

    { speaker: 'doctor', text: doctorQuestions.allergies, delay: 2000 },
    { speaker: 'patient', text: scenario.medicalHistory.allergies ? `${scenario.medicalHistory.allergies}にアレルギーがあります。` : 'アレルギーは特にありません。', delay: 2500 }
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
    { speaker: 'patient', text: scenario.lifestyle.oralHygiene ? `${scenario.lifestyle.oralHygiene}磨いています。` : '朝と夜の2回、歯を磨いています。', delay: 2000 },

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

    // 解釈モデル
    { speaker: 'doctor', text: doctorQuestions.explanatoryModel, delay: 2500 },
    { speaker: 'patient', text: generateExplanatoryModel(scenario.chiefComplaint.complaint), delay: 3000 },

    // 来院動機
    { speaker: 'doctor', text: doctorQuestions.visitReason, delay: 2500 },
    { speaker: 'patient', text: generateVisitReason(scenario.presentIllness.severity), delay: 2500 },

    // 心理的状況
    { speaker: 'doctor', text: doctorQuestions.psychologicalStatus, delay: 2500 },
    { speaker: 'patient', text: '仕事が忙しくて、少しストレスはあります。', delay: 2500 },

    // 治療への不安
    { speaker: 'doctor', text: doctorQuestions.concerns, delay: 2500 },
    { speaker: 'patient', text: scenario.psychosocial.concerns ? `${scenario.psychosocial.concerns}が心配です。` : '治療の痛みがあるかどうかが少し心配です。', delay: 2500 },

    // 治療への要望
    { speaker: 'doctor', text: doctorQuestions.requests, delay: 2500 },
    { speaker: 'patient', text: scenario.psychosocial.requests ? `${scenario.psychosocial.requests}をお願いしたいです。` : 'できるだけ痛くない治療をお願いできればと思います。', delay: 3000 },

    // 患者背景
    { speaker: 'doctor', text: doctorQuestions.patientBackground, delay: 2500 },
    { speaker: 'patient', text: '仕事がありますので、できれば平日の夕方以降が助かります。', delay: 3000 }
  );

  // ===== まとめ =====
  dialogues.push(
    { speaker: 'doctor', text: doctorQuestions.summary, delay: 3000 },
    { speaker: 'doctor', text: generateSummary(scenario), delay: 4000 },
    { speaker: 'patient', text: 'はい、その通りです。', delay: 2000 },

    { speaker: 'doctor', text: doctorQuestions.additionalConcerns, delay: 2500 },
    { speaker: 'patient', text: '特に他には大丈夫です。', delay: 2000 },

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
    return '頬の方まで痛みが響きます。';
  } else if (location.includes('左')) {
    return '頬の方まで痛みが響きます。';
  } else if (location === '全体的') {
    return '特に広がりません。';
  }
  return '頭痛がすることもあります。';
}

function generateSeverityResponse(severity: string | undefined): string {
  if (!severity) return '7くらいです。';
  if (severity.includes('ロキソニン')) {
    return '8くらいです。夜も眠れないくらい痛いです。';
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

function generateExplanatoryModel(complaint: string): string {
  if (complaint.includes('痛')) {
    return '虫歯が進行して神経まで達しているのかもしれません。';
  } else if (complaint.includes('出血')) {
    return '歯周病が進んでいるのではないかと思います。';
  } else if (complaint.includes('腫')) {
    return '膿が溜まっているのかもしれません。';
  }
  return '虫歯か歯周病だと思います。';
}

function generateVisitReason(severity: string | undefined): string {
  if (!severity) return '症状が続いているので、心配になりました。';
  if (severity.includes('夜も眠れない')) {
    return '痛みで夜も眠れなくなったので、これは受診しないとと思いました。';
  }
  return '症状が続いていて、このままでは悪化すると思ったからです。';
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

// ショートデモ用の対話生成（demoDialoguesと同じ52対話）
export function generateShortDemoDialogues(scenario: PatientScenario, language: 'ja' | 'en' = 'ja'): DemoDialogue[] {
  if (language === 'en') {
    return generateDemoDialoguesEnglish(scenario); // Use full English demo (52 dialogues)
  }

  // generateDemoDialoguesと同じ内容を返す（52対話のフルデモ）
  return generateDemoDialogues(scenario);
}

// 追加のヘルパー関数
function generateOnsetDetail(trigger: string | undefined): string {
  if (!trigger) return '特にきっかけはありませんが、徐々に悪化しています。';
  if (trigger.includes('食事')) return '木曜日の夕方、食事中に突然痛み始めました。';
  if (trigger.includes('冷たい')) return '冷たいものを飲んだ時に急に痛くなりました。';
  if (trigger.includes('噛')) return '固いものを噛んだ時に痛み始めました。';
  return '朝起きた時から痛みがありました。';
}

function generatePainTrigger(trigger: string | undefined): string {
  if (!trigger) return '噛むと痛みます。';
  if (trigger.includes('冷たい')) return '冷たいものを飲むと痛みます。';
  if (trigger.includes('熱い')) return '熱いものを飲むと痛みます。';
  if (trigger.includes('甘い')) return '甘いものを食べると痛みます。';
  return '噛むと痛みます。';
}

function generateAdditionalTrigger(trigger: string | undefined): string {
  if (!trigger) return '何もしていない時も痛いです。';
  if (trigger.includes('冷たい')) return '噛む時も痛いです。';
  if (trigger.includes('噛')) return '何もしていない時も痛いです。';
  return '噛む時も痛いです。';
}

function generatePainQuality(nature: string): string {
  if (nature.includes('ズキズキ')) return 'ズキズキする痛みです。';
  if (nature.includes('鋭い')) return '鋭い痛みです。';
  if (nature.includes('鈍い')) return '鈍い痛みです。';
  if (nature.includes('しみる')) return 'しみる痛みです。';
  return 'ズキズキする痛みです。';
}

function generateDetailedSymptom(nature: string): string {
  if (nature.includes('ズキズキ')) {
    return '脈打つような、うずくような痛みです。';
  } else if (nature.includes('しみる')) {
    return '冷たいものがしみて、キーンとする痛みです。';
  } else if (nature.includes('出血')) {
    return '歯磨きの時に特にひどく、朝起きた時も血の味がします。';
  }
  return '持続的で鈍い痛みです。';
}

/* eslint-disable @typescript-eslint/no-unused-vars */

function generateDetailedSeverity(severity: string | undefined): string {
  if (!severity) return '7くらいです。日常生活に支障があります。';
  if (severity.includes('ロキソニン')) {
    return '8くらいです。夜も眠れないくらい痛いです。';
  }
  if (severity.includes('軽減')) {
    return '5くらいです。我慢はできますが、気になります。';
  }
  return '8くらいです。夜も眠れないくらい痛いです。';
}

function generateMedicationResponse(medication: string | undefined): string {
  if (!medication) return '市販の鎮痛薬を飲みましたが、あまり効きませんでした。';
  if (medication.includes('ロキソニン')) return 'ロキソニンを飲みましたが、あまり効きませんでした。';
  if (medication.includes('効果')) return '痛み止めを飲んで少し楽になりました。';
  return '市販の鎮痛薬を飲みましたが、あまり効きませんでした。';
}

function generateSystemicDiseaseFirst(disease: string | undefined): string {
  if (!disease) return '特にありません。';
  const diseases = disease.split('、');
  if (diseases.length > 0) {
    return `${diseases[0]}があります。`;
  }
  return '特にありません。';
}

function generateSystemicDiseaseSecond(disease: string): string {
  const diseases = disease.split('、');
  if (diseases.length > 1) {
    return `あと、${diseases.slice(1).join('と')}もあります。`;
  }
  return '特に他はありません。';
}

function generateMedicationFirst(medication: string | undefined): string {
  if (!medication) return '特に飲んでいません。';
  const meds = medication.split('、');
  if (meds.length > 0) {
    return '血圧の薬を飲んでいます。';
  }
  return '特に飲んでいません。';
}

function generateMedicationDetail(medication: string): string {
  const meds = medication.split('、');
  if (meds.length > 0) {
    return `えーと、${meds[0]}だったと思います。`;
  }
  return '薬の名前はちょっと覚えていません。';
}

function generateAllergyResponse(allergies: string | undefined): string {
  if (!allergies || allergies === 'なし') return '特にありません。';
  if (allergies.includes('ペニシリン')) return 'ペニシリンで蕁麻疹が出たことがあります。';
  if (allergies.includes('キシロカイン')) return 'キシロカインでめまいがしたことがあります。';
  return `${allergies}で蕁麻疹が出たことがあります。`;
}

function generateDentalHistoryFirst(extraction: string | undefined): string {
  if (!extraction) return '特にありません。';
  if (extraction.includes('親知らず')) return '10年前に親知らずを抜きました。';
  if (extraction.includes('虫歯')) return '5年前に虫歯の治療をしました。';
  if (extraction.includes('歯周病')) return '歯周病の治療を受けたことがあります。';
  return extraction;
}

function generateDentalComplication(complications: string | undefined, anesthesia: string | undefined): string {
  if (anesthesia && anesthesia.includes('効きにくい')) {
    return '麻酔が効きにくくて追加してもらいました。';
  }
  if (complications) {
    return complications;
  }
  return '特に問題ありませんでした。';
}

function generateDailyImpactDetail(impact: string | undefined): string {
  if (!impact) return '食事が思うようにできません。';
  if (impact.includes('食事')) return '仕事に集中できなくて困っています。';
  if (impact.includes('睡眠')) return '夜も眠れなくて困っています。';
  if (impact.includes('会話')) return '人と話すのも辛いです。';
  return '仕事に集中できなくて困っています。';
}

function generateConcernDetail(concerns: string | undefined): string {
  if (!concerns) return '抜歯になるんじゃないかと心配です。';
  if (concerns.includes('抜歯')) return '抜歯になるんじゃないかと心配です。';
  if (concerns.includes('費用')) return '治療費がどのくらいかかるか心配です。';
  if (concerns.includes('期間')) return '治療期間が長くなるのが心配です。';
  return concerns;
}

function generateRequestDetail(requests: string | undefined): string {
  if (!requests) return 'できれば歯を残したいです。';
  if (requests.includes('痛くない')) return 'できるだけ痛くない治療をお願いします。';
  if (requests.includes('早く')) return '早く痛みを取ってほしいです。';
  return requests;
}

function generateAdditionalConcernDetail(complaint: string): string {
  if (complaint.includes('歯茎')) {
    return 'そういえば、口臭も気になります。';
  } else if (complaint.includes('痛')) {
    return 'そういえば、歯ぐきから血も出ます。';
  }
  return '特にありません。';
}

function generateAdditionalDiseases(systemicDisease: string): string {
  if (systemicDisease.includes('高血圧') && systemicDisease.includes('糖尿病')) {
    return 'この2つだけです。';
  } else if (systemicDisease.includes('高血圧')) {
    return 'あと、軽い糖尿病もあります。';
  }
  return '特に他はありません。';
}

function generateDailyImpact(impact: string | undefined): string {
  if (!impact) return '食事が思うようにできません。';
  if (impact.includes('食事')) {
    return '仕事に集中できなくて困っています。';
  }
  return impact;
}

function generateAdditionalConcern(complaint: string): string {
  if (complaint.includes('歯茎')) {
    return 'そういえば、口臭も気になります。';
  } else if (complaint.includes('痛')) {
    return 'そういえば、歯ぐきから血も出ます。';
  }
  return '特にありません。';
}

/* eslint-enable @typescript-eslint/no-unused-vars */

// 英語版の対話生成（通常版 - 40対話）
export function generateDemoDialoguesEnglish(scenario: PatientScenario): DemoDialogue[] {
  const dialogues: DemoDialogue[] = [];

  // 英語シナリオから患者情報を取得
  const translatedScenario = getTranslatedScenario(scenario, 'en');
  const patientName = translatedScenario.basicInfo?.name || 'Taro Yamada';
  const patientAge = translatedScenario.basicInfo?.age || '34 years old';
  const patientGender = translatedScenario.basicInfo?.gender || 'Male';

  // ===== Introduction =====
  dialogues.push(
    { speaker: 'doctor', text: "Hello. I'm Dr. Tanaka, and I'll be taking care of you today.", delay: 2000 },
    { speaker: 'patient', text: 'Hello, doctor. Thank you for seeing me today. I appreciate your time.', delay: 2500 },
    { speaker: 'doctor', text: 'May I have your full name, please?', delay: 2000 },
    { speaker: 'patient', text: `Yes, of course. My name is ${patientName}.`, delay: 2000 },
    { speaker: 'doctor', text: 'Could you tell me your date of birth as well?', delay: 2000 },
    { speaker: 'patient', text: "Sure, it's May 15th, 1990.", delay: 2500 }
  );

  // ===== Chief Complaint =====
  const chiefComplaint = translatedScenario.chiefComplaint?.complaint || 'I have pain in my lower right back tooth.';
  const location = translatedScenario.chiefComplaint?.location || 'lower right back tooth';

  dialogues.push(
    { speaker: 'doctor', text: 'What brings you in today?', delay: 2000 },
    { speaker: 'patient', text: `Well, ${chiefComplaint.toLowerCase()}. It's been bothering me quite a bit lately.`, delay: 3000 }
  );

  // ===== Present Illness (OPQRST) =====
  const since = translatedScenario.chiefComplaint?.since || 'About three days ago';
  const nature = translatedScenario.presentIllness?.nature || 'throbbing pain';
  const trigger = translatedScenario.presentIllness?.trigger || 'It started suddenly during dinner';

  dialogues.push(
    { speaker: 'doctor', text: 'When did this problem start?', delay: 2000 },
    { speaker: 'patient', text: `Let me think... I would say ${since.toLowerCase()}. I remember noticing it first around that time.`, delay: 3000 },
    { speaker: 'doctor', text: 'Could you tell me more about how it started?', delay: 2000 },
    { speaker: 'patient', text: `${trigger}. I was quite surprised when I first noticed it, to be honest.`, delay: 3500 }
  );

  const severity = translatedScenario.presentIllness?.severity || 'Severe';
  const progress = translatedScenario.presentIllness?.progress || 'Getting worse';
  const medication = translatedScenario.presentIllness?.medication || 'None';
  const dailyImpact = translatedScenario.presentIllness?.dailyImpact || 'Affecting daily life';

  dialogues.push(
    { speaker: 'doctor', text: 'When does it occur most often?', delay: 2000 },
    { speaker: 'patient', text: `Mainly ${trigger.toLowerCase()}. That's when I notice it the most.`, delay: 2500 },
    { speaker: 'doctor', text: 'Are there other times when you notice it?', delay: 2000 },
    { speaker: 'patient', text: 'Yes, it happens regularly throughout the day. Sometimes even when I\'m not doing anything in particular.', delay: 3000 }
  );

  dialogues.push(
    { speaker: 'doctor', text: 'What does it feel like? Can you describe the sensation?', delay: 2000 },
    { speaker: 'patient', text: `It's like ${nature.toLowerCase()}. That's the best way I can describe it.`, delay: 2500 },
    { speaker: 'doctor', text: 'And how severe would you say it is?', delay: 2000 },
    { speaker: 'patient', text: `I'd say it's ${severity.toLowerCase()}. And to be honest, it seems to be ${progress.toLowerCase()} over time.`, delay: 3000 }
  );

  dialogues.push(
    { speaker: 'doctor', text: 'Where exactly is the problem located?', delay: 2000 },
    { speaker: 'patient', text: `It's in the ${location.toLowerCase()}. I can show you exactly where if you'd like.`, delay: 2500 }
  );

  dialogues.push(
    { speaker: 'doctor', text: 'Have you taken any medication for this?', delay: 2000 },
    { speaker: 'patient', text: medication === 'None' ? 'No, I haven\'t taken anything yet. I wanted to see you first before taking any medication.' : `Yes, I've tried ${medication.toLowerCase()}. It helped a little, but not as much as I'd hoped.`, delay: 3500 }
  );

  dialogues.push(
    { speaker: 'doctor', text: 'How is this affecting your daily life?', delay: 2000 },
    { speaker: 'patient', text: `${dailyImpact}. It's really been quite disruptive, to be honest.`, delay: 3000 }
  );

  // ===== Medical History & Allergies =====
  const systemicDisease = translatedScenario.medicalHistory?.systemicDisease || 'No particular medical conditions';
  const currentMedication = translatedScenario.medicalHistory?.currentMedication || 'None';
  const allergies = translatedScenario.medicalHistory?.allergies || 'None';

  dialogues.push(
    { speaker: 'doctor', text: 'Do you have any medical conditions I should know about?', delay: 2000 },
    { speaker: 'patient', text: systemicDisease === 'No particular medical conditions' ? 'No, I\'m generally healthy. I don\'t have any chronic medical conditions that I know of.' : `Yes, I have ${systemicDisease.toLowerCase()}. I've been managing it for quite some time now.`, delay: 3000 }
  );

  dialogues.push(
    { speaker: 'doctor', text: 'Are you currently taking any medications regularly?', delay: 2000 },
    { speaker: 'patient', text: currentMedication === 'None' ? 'No, I\'m not taking any regular medications at the moment.' : `Yes, I am. ${currentMedication}. I take it every day as prescribed by my doctor.`, delay: 3000 }
  );

  dialogues.push(
    { speaker: 'doctor', text: 'Do you have any allergies, especially to medications?', delay: 2000 },
    { speaker: 'patient', text: allergies === 'None' ? 'No, I don\'t have any known allergies to medications or anything else.' : `Yes, actually. ${allergies}. So I need to be careful about that.`, delay: 3000 }
  );

  // ===== Dental History =====
  const extraction = translatedScenario.dentalHistory?.extraction || 'No previous extractions';
  const anesthesia = translatedScenario.dentalHistory?.anesthesia || 'No issues with anesthesia';
  const complications = translatedScenario.dentalHistory?.complications || 'No complications';

  dialogues.push(
    { speaker: 'doctor', text: 'Have you had any dental treatment in the past?', delay: 2500 },
    { speaker: 'patient', text: extraction === 'No previous extractions' ? 'No, I haven\'t had any major dental work done before. Just regular cleanings and check-ups.' : `Yes, ${extraction.toLowerCase()}. I remember it quite well.`, delay: 3000 }
  );

  if (anesthesia !== 'No issues with anesthesia') {
    dialogues.push(
      { speaker: 'doctor', text: 'Were there any problems during that procedure?', delay: 2000 },
      { speaker: 'patient', text: `Actually, yes. ${anesthesia}. It was a bit uncomfortable, but we got through it eventually.`, delay: 3000 }
    );
  }

  // ===== Psychosocial Aspects =====
  const concerns = translatedScenario.psychosocial?.concerns || 'No particular concerns';
  const requests = translatedScenario.psychosocial?.requests || 'No special requests';

  if (concerns !== 'No particular concerns') {
    dialogues.push(
      { speaker: 'doctor', text: 'Are you concerned or worried about anything in particular?', delay: 2000 },
      { speaker: 'patient', text: `Yes, actually. ${concerns}. It's been on my mind quite a bit lately.`, delay: 3000 }
    );
  }

  if (requests !== 'No special requests') {
    dialogues.push(
      { speaker: 'doctor', text: 'Do you have any preferences or requests for your treatment?', delay: 2500 },
      { speaker: 'patient', text: `Well, ${requests.toLowerCase()}. That would really be ideal for me.`, delay: 2500 }
    );
  }

  // ===== Conclusion =====
  dialogues.push(
    { speaker: 'doctor', text: 'Is there anything else you\'d like to tell me about your condition?', delay: 2000 },
    { speaker: 'patient', text: 'I think that covers everything for now. Thank you for listening so carefully to all my concerns.', delay: 3000 },
    { speaker: 'doctor', text: 'Of course. Now, let me examine you so we can determine the best course of treatment.', delay: 3000 },
    { speaker: 'patient', text: 'Yes, please go ahead. I really appreciate your help, doctor.', delay: 2500 }
  );

  return dialogues;
}
