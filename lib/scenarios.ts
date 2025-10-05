import type { PatientScenario } from './scenarioTypes';

export const patientScenarios: PatientScenario[] = [
  {
    id: 'toothache-01',
    name: '急性歯痛の患者',
    basicInfo: {
      name: 'やまだ　たろう',
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
  {
    id: 'periodontal-01',
    name: '歯周病の患者',
    basicInfo: {
      name: 'さとう　みちこ',
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
  {
    id: 'wisdom-tooth-01',
    name: '親知らずの痛み',
    basicInfo: {
      name: 'すずき　けんた',
      age: '25歳',
      gender: '男性',
      occupation: 'IT企業勤務'
    },
    chiefComplaint: {
      complaint: '左下の親知らずが痛む',
      location: '左下8番',
      since: '3日前から'
    },
    presentIllness: {
      nature: '噛むと激痛',
      severity: '痛み止めが効かない',
      progress: '悪化している',
      trigger: '噛むとき',
      dailyImpact: '仕事に集中できない',
      medication: 'バファリン服用',
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
      oralHygiene: '朝晩2回',
      dietaryHabits: 'エナジードリンク常飲',
      familyStructure: '一人暮らし',
      workSchedule: 'リモートワーク中心'
    },
    psychosocial: {
      concerns: '抜歯が怖い',
      requests: '早く痛みを取りたい'
    },
    interviewEvaluation: {
      summarization: '面接終盤での再確認',
      additionalCheck: '他に気になることは？'
    }
  }
];

export function getScenarioById(id: string): PatientScenario | undefined {
  return patientScenarios.find(scenario => scenario.id === id);
}

export function formatScenarioForAI(scenario: PatientScenario): string {
  return `
【基本情報】
氏名：${scenario.basicInfo.name}
年齢：${scenario.basicInfo.age}
性別：${scenario.basicInfo.gender}
職業：${scenario.basicInfo.occupation}

【主訴】
${scenario.chiefComplaint.complaint}
部位：${scenario.chiefComplaint.location}
いつから：${scenario.chiefComplaint.since}

【現病歴】
症状の性状：${scenario.presentIllness.nature}
症状の程度：${scenario.presentIllness.severity}
経過：${scenario.presentIllness.progress}
誘発因子：${scenario.presentIllness.trigger}
日常生活への影響：${scenario.presentIllness.dailyImpact}
服薬歴：${scenario.presentIllness.medication}
歯科受診歴：${scenario.presentIllness.dentalVisit}

【歯科既往歴】
抜歯歴：${scenario.dentalHistory.extraction}
麻酔経験：${scenario.dentalHistory.anesthesia}
治療中の異常：${scenario.dentalHistory.complications}

【全身既往歴】
全身疾患：${scenario.medicalHistory.systemicDisease}
服薬状況：${scenario.medicalHistory.currentMedication}
アレルギー：${scenario.medicalHistory.allergies}

【生活歴】
口腔衛生習慣：${scenario.lifestyle.oralHygiene}
食嗜好・嗜好品：${scenario.lifestyle.dietaryHabits}
家族構成：${scenario.lifestyle.familyStructure}
通院条件：${scenario.lifestyle.workSchedule}

【心理社会的情報】
心配・希望：${scenario.psychosocial.concerns}
要望：${scenario.psychosocial.requests}`;
}