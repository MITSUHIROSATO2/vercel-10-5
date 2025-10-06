import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SCENARIO_MODEL = process.env.OPENAI_SCENARIO_MODEL?.trim() || 'gpt-4o-mini';
const SCENARIO_FALLBACK_MODEL = process.env.OPENAI_SCENARIO_FALLBACK_MODEL?.trim() || 'gpt-4o';

export async function POST(request: Request) {
  try {
    const { theme, language } = await request.json();

    // テーマに応じたプロンプトを生成
    const themePrompts: { [key: string]: string } = {
      random: language === 'ja'
        ? 'ランダムな歯科患者のシナリオを生成してください。'
        : 'Generate a random dental patient scenario.',
      emergency: language === 'ja'
        ? '激痛や急性症状を持つ緊急患者のシナリオを生成してください。'
        : 'Generate an emergency patient scenario with severe pain or acute symptoms.',
      periodontal: language === 'ja'
        ? '歯周病の症状を持つ中高年患者のシナリオを生成してください。'
        : 'Generate a middle-aged patient scenario with periodontal disease.',
      caries: language === 'ja'
        ? 'むし歯による痛みや知覚過敏を主訴とする患者のシナリオを生成してください。'
        : 'Generate a patient scenario with cavity-related pain or tooth sensitivity.',
      trauma: language === 'ja'
        ? '転倒やスポーツによる歯の外傷を持つ患者のシナリオを生成してください。'
        : 'Generate a patient scenario involving dental trauma from accidents or sports.',
      orthodontic: language === 'ja'
        ? '歯並びや咬み合わせの矯正相談を希望する患者のシナリオを生成してください。'
        : 'Generate a patient scenario seeking orthodontic consultation for alignment or bite issues.',
      aesthetic: language === 'ja'
        ? '見た目の改善を希望する審美患者のシナリオを生成してください。'
        : 'Generate a patient scenario seeking cosmetic dental improvement.',
      pediatric: language === 'ja'
        ? '歯科恐怖を持つ小児患者のシナリオを生成してください。'
        : 'Generate a pediatric patient scenario with dental anxiety.',
      pregnant: language === 'ja'
        ? '妊娠中で歯科治療の安全性を心配している患者のシナリオを生成してください。'
        : 'Generate a pregnant patient scenario focused on safe dental care during pregnancy.',
      implant: language === 'ja'
        ? '欠損部位へのインプラント治療を希望する患者のシナリオを生成してください。'
        : 'Generate a patient scenario considering implant treatment for missing teeth.',
      maintenance: language === 'ja'
        ? '定期健診やクリーニングで来院するメンテナンス患者のシナリオを生成してください。'
        : 'Generate a patient scenario attending a routine recall or cleaning visit.',
      tmj: language === 'ja'
        ? '顎関節症による顎の痛みや開口障害を訴える患者のシナリオを生成してください。'
        : 'Generate a patient scenario with temporomandibular joint pain or limited mouth opening.',
      elderly: language === 'ja'
        ? '複数の疾患を持つ高齢患者のシナリオを生成してください。'
        : 'Generate an elderly patient scenario with multiple medical conditions.',
    };

    const systemPrompt = language === 'ja' ? `
あなたは歯科医療面接のシミュレーション用に、リアルな患者シナリオを生成する専門家です。
以下の形式でJSON形式のシナリオを生成してください：

{
  "id": "unique_id_timestamp",
  "name": "シナリオ名",
  "basicInfo": {
    "name": "患者氏名（ひらがなで記入、例：やまだ　たろう）",
    "age": "年齢（例：43歳）",
    "gender": "性別（例：男性）",
    "occupation": "職業（例：営業職）"
  },
  "chiefComplaint": {
    "complaint": "主訴（例：右下奥歯がズキズキ痛む）",
    "location": "部位（例：右下6番）",
    "since": "発症時期（例：1週間前から）"
  },
  "presentIllness": {
    "nature": "症状の性状（例：ズキズキ、ジーンとした痛み）",
    "severity": "症状の程度（例：ロキソニンで軽減）",
    "progress": "経過（例：徐々に悪化）",
    "trigger": "誘発因子（例：冷たいもので痛む）",
    "dailyImpact": "日常生活への影響（例：食事がつらい）",
    "medication": "服薬歴（例：市販の鎮痛剤）",
    "dentalVisit": "本件の歯科受診歴（例：初診）"
  },
  "dentalHistory": {
    "extraction": "抜歯歴（例：親知らず抜歯あり）",
    "anesthesia": "麻酔経験（例：あり（効きにくい））",
    "complications": "治療中の異常経験（例：抜歯後の腫れ）"
  },
  "medicalHistory": {
    "systemicDisease": "全身疾患の有無（例：高血圧）",
    "currentMedication": "服薬状況（例：アムロジピン服用中）",
    "allergies": "アレルギー（例：ペニシリンアレルギー）"
  },
  "lifestyle": {
    "oralHygiene": "口腔衛生習慣（例：朝晩2回）",
    "dietaryHabits": "食嗜好・嗜好品（例：甘いコーヒー、喫煙あり）",
    "familyStructure": "家族構成・同居者（例：妻・子ども2人と同居）",
    "workSchedule": "仕事状況・通院条件（例：平日19時まで可）"
  },
  "psychosocial": {
    "concerns": "心配・希望（例：麻酔が怖い、抜きたくない）",
    "requests": "要望（例：痛くない治療を希望）"
  },
  "interviewEvaluation": {
    "summarization": "主訴の要約確認（例：面接終盤での再確認）",
    "additionalCheck": "言い忘れの確認（例：他に気になることは？）"
  },
  "specialCircumstances": ""
}

リアルで具体的な内容を生成してください。各フィールドは適切な日本語で記入してください。
重要：患者氏名は必ずひらがなで生成してください（例：やまだ　たろう、さとう　みちこ）。漢字は使用しないでください。
specialCircumstancesは通常空欄のままにしてください。特別な配慮が必要な場合のみ記入してください。
` : `
You are an expert in generating realistic patient scenarios for dental interview simulations.
Generate a scenario in the following JSON format:

{
  "id": "unique_id_timestamp",
  "name": "Scenario Name",
  "basicInfo": {
    "name": "Patient Name (e.g., John Smith)",
    "age": "Age (e.g., 43 years old)",
    "gender": "Gender (e.g., Male)",
    "occupation": "Occupation (e.g., Sales Representative)"
  },
  "chiefComplaint": {
    "complaint": "Chief Complaint (e.g., Throbbing pain in lower right molar)",
    "location": "Location (e.g., Lower right 6th tooth)",
    "since": "Duration (e.g., Since 1 week ago)"
  },
  "presentIllness": {
    "nature": "Nature of Symptoms (e.g., Throbbing, aching pain)",
    "severity": "Severity (e.g., Reduced with painkillers)",
    "progress": "Progress (e.g., Gradually worsening)",
    "trigger": "Triggers (e.g., Pain with cold things)",
    "dailyImpact": "Daily Life Impact (e.g., Difficult to eat)",
    "medication": "Medication History (e.g., OTC pain relievers)",
    "dentalVisit": "Dental Visit History (e.g., First visit)"
  },
  "dentalHistory": {
    "extraction": "Extraction History (e.g., Wisdom tooth extracted)",
    "anesthesia": "Anesthesia Experience (e.g., Yes, difficult to numb)",
    "complications": "Treatment Complications (e.g., Swelling after extraction)"
  },
  "medicalHistory": {
    "systemicDisease": "Systemic Diseases (e.g., Hypertension)",
    "currentMedication": "Current Medications (e.g., Taking Amlodipine)",
    "allergies": "Allergies (e.g., Penicillin allergy)"
  },
  "lifestyle": {
    "oralHygiene": "Oral Hygiene Habits (e.g., Twice daily)",
    "dietaryHabits": "Dietary Habits (e.g., Sweet coffee, smoker)",
    "familyStructure": "Family Structure (e.g., Living with spouse and 2 children)",
    "workSchedule": "Work Schedule (e.g., Available weekdays until 7pm)"
  },
  "psychosocial": {
    "concerns": "Concerns (e.g., Afraid of anesthesia, don't want extraction)",
    "requests": "Requests (e.g., Want painless treatment)"
  },
  "interviewEvaluation": {
    "summarization": "Summary Confirmation (e.g., Reconfirm at interview end)",
    "additionalCheck": "Additional Check (e.g., Anything else concerning you?)"
  },
  "specialCircumstances": ""
}

Generate realistic and specific content for each field.
Leave specialCircumstances blank unless there are special considerations needed.
`;

    const generateScenarioWithModel = async (model: string) => {
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: themePrompts[theme] || themePrompts.random }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error(`Scenario generation returned empty content (model: ${model})`);
      }

      return JSON.parse(content);
    };

    let generatedScenario;

    try {
      generatedScenario = await generateScenarioWithModel(SCENARIO_MODEL);
    } catch (modelError: any) {
      if (modelError?.response?.status === 404 || modelError?.code === 'model_not_found') {
        console.warn(`Scenario model ${SCENARIO_MODEL} not available. Falling back to ${SCENARIO_FALLBACK_MODEL}.`);
        generatedScenario = await generateScenarioWithModel(SCENARIO_FALLBACK_MODEL);
      } else {
        throw modelError;
      }
    }

    return NextResponse.json({ scenario: generatedScenario });
  } catch (error) {
    console.error('Error generating scenario:', error);
    return NextResponse.json(
      { error: 'Failed to generate scenario' },
      { status: 500 }
    );
  }
}
