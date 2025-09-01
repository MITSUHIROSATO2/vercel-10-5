import type { PatientScenario } from './scenarioTypes';

// ランダム要素のデータ
const firstNames = ['田中', '佐藤', '鈴木', '高橋', '伊藤', '渡辺', '山本', '中村', '小林', '加藤'];
const lastNames = ['太郎', '花子', '健一', '美香', '裕子', '誠', '由美', '浩二', '恵子', '隆'];
const ages = ['25歳', '32歳', '38歳', '45歳', '52歳', '58歳', '65歳', '70歳'];
const genders = ['男性', '女性'];
const occupations = ['会社員', '主婦', '自営業', '公務員', '教員', '医療従事者', '学生', '年金生活者', 'フリーランス'];

const complaints = [
  '奥歯が痛む',
  '歯茎から血が出る',
  '冷たいものがしみる',
  '歯がグラグラする',
  '口臭が気になる',
  '歯が欠けた',
  '顎が痛い',
  '詰め物が取れた'
];

const locations = [
  '右上6番', '右下6番', '左上6番', '左下6番',
  '右上4番', '右下4番', '前歯', '奥歯全体'
];

const durations = [
  '3日前から', '1週間前から', '2週間前から', '1ヶ月前から',
  '3ヶ月前から', '半年前から'
];

const natures = [
  'ズキズキする痛み',
  'ジーンとした痛み',
  '鈍い痛み',
  '激痛',
  '違和感程度',
  '時々痛む'
];

const severities = [
  '鎮痛剤で軽減',
  '鎮痛剤が効かない',
  '我慢できる程度',
  '夜も眠れない',
  '日常生活に支障'
];

const progresses = [
  '徐々に悪化',
  '変化なし',
  '良くなったり悪くなったり',
  '急激に悪化'
];

const triggers = [
  '冷たいもので痛む',
  '熱いもので痛む',
  '噛むと痛む',
  '何もしなくても痛む',
  '甘いもので痛む'
];

const impacts = [
  '食事がつらい',
  '仕事に集中できない',
  '会話がしづらい',
  '人前に出たくない',
  '特に支障なし'
];

const medications = [
  'ロキソニン服用',
  'バファリン服用',
  '市販の鎮痛剤',
  'なし',
  '処方された抗生物質'
];

const extractionHistories = [
  '親知らず抜歯あり',
  'なし',
  '10年前に抜歯',
  '複数回抜歯経験あり'
];

const anesthesiaExperiences = [
  'あり（問題なし）',
  'あり（効きにくい）',
  'なし',
  'あり（アレルギー反応）'
];

const complications = [
  'なし',
  '抜歯後の腫れ',
  '出血が止まりにくい',
  '治療後の痛み'
];

const diseases = [
  'なし',
  '高血圧',
  '糖尿病',
  '高血圧、糖尿病',
  '心臓病',
  '骨粗鬆症'
];

const currentMedications = [
  'なし',
  'アムロジピン服用中',
  'メトホルミン服用中',
  '血圧の薬服用中',
  '複数の薬を服用'
];

const allergies = [
  'なし',
  'ペニシリンアレルギー',
  '金属アレルギー',
  'ラテックスアレルギー'
];

const oralHygiene = [
  '朝晩2回',
  '朝のみ',
  '夜のみ',
  '朝昼晩3回',
  '不規則'
];

const dietaryHabits = [
  '甘いもの好き',
  'コーヒー常飲',
  '喫煙あり',
  '飲酒習慣あり',
  '間食多い',
  '健康的な食生活'
];

const familyStructures = [
  '一人暮らし',
  '夫婦二人',
  '家族と同居',
  '子供と同居',
  '高齢の親と同居'
];

const workSchedules = [
  '平日日中のみ可',
  '土日のみ可',
  'いつでも可',
  '夕方以降希望',
  '不定期'
];

const concerns = [
  '痛みが怖い',
  '麻酔が怖い',
  '費用が心配',
  '歯を失うのが怖い',
  '治療期間が心配'
];

const requests = [
  '痛くない治療希望',
  '早く治したい',
  'なるべく歯を残したい',
  '見た目を良くしたい',
  '保険診療希望'
];

// ランダム選択関数
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// シナリオを自動生成する関数
export function generateRandomScenario(): PatientScenario {
  const id = `generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const firstName = randomChoice(firstNames);
  const lastName = randomChoice(lastNames);
  const fullName = `${firstName} ${lastName}`;
  
  return {
    id,
    name: `自動生成患者 - ${fullName}`,
    basicInfo: {
      name: fullName,
      age: randomChoice(ages),
      gender: randomChoice(genders),
      occupation: randomChoice(occupations)
    },
    chiefComplaint: {
      complaint: randomChoice(complaints),
      location: randomChoice(locations),
      since: randomChoice(durations)
    },
    presentIllness: {
      nature: randomChoice(natures),
      severity: randomChoice(severities),
      progress: randomChoice(progresses),
      trigger: randomChoice(triggers),
      dailyImpact: randomChoice(impacts),
      medication: randomChoice(medications),
      dentalVisit: Math.random() > 0.5 ? '初診' : '他院から転院'
    },
    dentalHistory: {
      extraction: randomChoice(extractionHistories),
      anesthesia: randomChoice(anesthesiaExperiences),
      complications: randomChoice(complications)
    },
    medicalHistory: {
      systemicDisease: randomChoice(diseases),
      currentMedication: randomChoice(currentMedications),
      allergies: randomChoice(allergies)
    },
    lifestyle: {
      oralHygiene: randomChoice(oralHygiene),
      dietaryHabits: randomChoice(dietaryHabits),
      familyStructure: randomChoice(familyStructures),
      workSchedule: randomChoice(workSchedules)
    },
    psychosocial: {
      concerns: randomChoice(concerns),
      requests: randomChoice(requests)
    },
    interviewEvaluation: {
      summarization: '面接終盤での再確認',
      additionalCheck: '他に気になることは？'
    }
  };
}

// 特定のテーマに基づいてシナリオを生成
export function generateThemedScenario(theme: 'emergency' | 'periodontal' | 'aesthetic' | 'pediatric' | 'elderly'): PatientScenario {
  const baseScenario = generateRandomScenario();
  
  switch (theme) {
    case 'emergency':
      return {
        ...baseScenario,
        name: `緊急患者 - ${baseScenario.basicInfo.name}`,
        chiefComplaint: {
          complaint: '激痛で眠れない',
          location: randomChoice(['右下6番', '左下6番']),
          since: randomChoice(['昨日から', '今朝から', '3時間前から'])
        },
        presentIllness: {
          ...baseScenario.presentIllness,
          nature: '激痛',
          severity: '鎮痛剤が効かない',
          progress: '急激に悪化',
          dailyImpact: '何もできない'
        }
      };
      
    case 'periodontal':
      return {
        ...baseScenario,
        name: `歯周病患者 - ${baseScenario.basicInfo.name}`,
        basicInfo: {
          ...baseScenario.basicInfo,
          age: randomChoice(['45歳', '52歳', '58歳', '65歳'])
        },
        chiefComplaint: {
          complaint: '歯茎から血が出る',
          location: '全体的',
          since: randomChoice(['半年前から', '1年前から'])
        },
        presentIllness: {
          ...baseScenario.presentIllness,
          nature: '歯磨き時の出血',
          severity: '毎回出血',
          trigger: '歯磨き時',
          dailyImpact: '口臭が気になる'
        }
      };
      
    case 'aesthetic':
      return {
        ...baseScenario,
        name: `審美希望患者 - ${baseScenario.basicInfo.name}`,
        basicInfo: {
          ...baseScenario.basicInfo,
          age: randomChoice(['25歳', '32歳', '38歳']),
          occupation: randomChoice(['会社員', '営業職', '接客業'])
        },
        chiefComplaint: {
          complaint: '歯の色が気になる',
          location: '前歯',
          since: '以前から'
        },
        psychosocial: {
          concerns: '費用が心配',
          requests: '見た目を良くしたい'
        }
      };
      
    case 'pediatric':
      return {
        ...baseScenario,
        name: `小児患者 - ${baseScenario.basicInfo.name}`,
        basicInfo: {
          ...baseScenario.basicInfo,
          age: randomChoice(['6歳', '8歳', '10歳', '12歳']),
          occupation: '小学生'
        },
        psychosocial: {
          concerns: '歯医者さんが怖い',
          requests: '痛くない治療希望'
        }
      };
      
    case 'elderly':
      return {
        ...baseScenario,
        name: `高齢患者 - ${baseScenario.basicInfo.name}`,
        basicInfo: {
          ...baseScenario.basicInfo,
          age: randomChoice(['70歳', '75歳', '80歳', '85歳']),
          occupation: '年金生活者'
        },
        medicalHistory: {
          systemicDisease: randomChoice(['高血圧、糖尿病', '心臓病', '骨粗鬆症']),
          currentMedication: '複数の薬を服用',
          allergies: baseScenario.medicalHistory.allergies
        }
      };
      
    default:
      return baseScenario;
  }
}