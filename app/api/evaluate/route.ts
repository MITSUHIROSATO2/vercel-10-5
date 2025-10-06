import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const RAW_OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();
const isValidApiKey = RAW_OPENAI_API_KEY && RAW_OPENAI_API_KEY !== 'your_openai_api_key_here' && RAW_OPENAI_API_KEY !== 'dummy-key-for-build';
const openai = isValidApiKey ? new OpenAI({
  apiKey: RAW_OPENAI_API_KEY,
}) : null;

const EVALUATION_MODEL = process.env.OPENAI_EVALUATION_MODEL?.trim() || 'gpt-4o';
const EVALUATION_FALLBACK_MODEL = process.env.OPENAI_EVALUATION_FALLBACK_MODEL?.trim() || 'gpt-4o-mini';
const FORCE_MOCK_EVALUATION = process.env.USE_MOCK_AI_EVALUATION === 'true';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

interface EvaluationCriteria {
  category: string;
  subcategory?: string;
  item: string;
  itemEn: string;
  priority: 'high' | 'medium' | 'low';
}

const evaluationCriteria: EvaluationCriteria[] = [
  // （１）対人関係能力：患者との良好な関係の構築
  { category: 'interpersonal', item: '言語的コミュニケーションを適切に行う', itemEn: 'Conduct appropriate verbal communication', priority: 'high' },

  // （２）全体をとおして
  { category: 'overall', item: '順序立った面接を行う', itemEn: 'Conduct a well-structured interview', priority: 'high' },
  { category: 'overall', item: '話題を変えるときには、唐突でなく適切な声かけをする', itemEn: 'Use appropriate transitions when changing topics', priority: 'high' },

  // （３）導入部分：オープニング
  { category: 'opening', item: '挨拶を行う', itemEn: 'Greet the patient', priority: 'high' },
  { category: 'opening', item: '本人確認と自己紹介を適切に行う', itemEn: 'Verify patient identity and introduce yourself appropriately', priority: 'high' },
  { category: 'opening', item: '面接の概要説明と同意を取得する', itemEn: 'Explain interview overview and obtain consent', priority: 'high' },

  // （４）患者に聞く：歯科医学的情報
  { category: 'medicalInfo', subcategory: 'chiefComplaint', item: '主訴を聞く', itemEn: 'Ask about chief complaint', priority: 'high' },
  { category: 'medicalInfo', subcategory: 'chiefComplaint', item: '主訴の現病歴を聞く', itemEn: 'Ask about present illness history', priority: 'high' },
  { category: 'medicalInfo', subcategory: 'history', item: '歯科的既往歴を聞く', itemEn: 'Ask about dental history', priority: 'high' },
  { category: 'medicalInfo', subcategory: 'history', item: '全身的既往歴を聞く', itemEn: 'Ask about medical history', priority: 'high' },
  { category: 'medicalInfo', subcategory: 'lifestyle', item: '口腔衛生習慣(歯磨きの頻度など)を聞く', itemEn: 'Ask about oral hygiene habits (brushing frequency, etc.)', priority: 'low' },
  { category: 'medicalInfo', subcategory: 'lifestyle', item: '患者の食習慣や嗜好を聞く', itemEn: 'Ask about dietary habits and preferences', priority: 'low' },
  { category: 'medicalInfo', subcategory: 'lifestyle', item: '患者の家族歴や社会歴を聞く', itemEn: 'Ask about family and social history', priority: 'low' },

  // （５）患者に聞く：心理・社会的情報
  { category: 'psychosocial', item: '解釈モデルを聞く', itemEn: 'Ask about patient\'s explanatory model', priority: 'high' },
  { category: 'psychosocial', item: '来院動機を聞く', itemEn: 'Ask about reason for visit', priority: 'low' },
  { category: 'psychosocial', item: '心理的状況を聞く', itemEn: 'Ask about psychological status', priority: 'low' },
  { category: 'psychosocial', item: '検査や治療に関する要望を聞く', itemEn: 'Ask about preferences for examination and treatment', priority: 'low' },
  { category: 'psychosocial', item: '患者背景に関わる通院条件、健康･受療行動、生活･社会･心理的背景などを聞く', itemEn: 'Ask about visit conditions, health behaviors, and life/social/psychological background', priority: 'low' },

  // （６）締めくくり部分：クロージング
  { category: 'closing', item: '要約と確認を行う', itemEn: 'Summarize and confirm', priority: 'high' },
  { category: 'closing', item: '言い忘れの確認を行う', itemEn: 'Ask if anything was forgotten', priority: 'high' },
  { category: 'closing', item: '面接終了後、患者が次にどうしたら良いかを適切に伝える', itemEn: 'Explain next steps appropriately after interview', priority: 'high' },
];

export async function POST(request: NextRequest) {
  let messages: any[] = [];
  let scenarioId = '';
  let customCriteria: any = null;
  let language: 'ja' | 'en' = 'ja';
  let criteriaToUse = evaluationCriteria;

  try {
    const body = await request.json();
    messages = Array.isArray(body.messages) ? body.messages : [];
    scenarioId = body.scenarioId;
    customCriteria = body.customCriteria;
    language = body.language === 'en' ? 'en' : 'ja';
    
    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: language === 'ja' ? '会話履歴が必要です' : 'Conversation history is required' },
        { status: 400 }
      );
    }

    // カスタム評価項目があればそれを使用、なければデフォルトを使用
    criteriaToUse = customCriteria && customCriteria.length > 0 ? customCriteria : evaluationCriteria;

    const shouldUseMock = FORCE_MOCK_EVALUATION || !openai;
    if (shouldUseMock) {
      if (!IS_PRODUCTION) {
        console.log('[Evaluation API] Using mock evaluation (OpenAI unavailable or forced).');
      }
      const mockEvaluation = createMockEvaluation(messages, language);
      const formattedMock = buildEvaluationResponse(mockEvaluation, scenarioId, language, messages.length);
      return NextResponse.json({ success: true, evaluation: formattedMock });
    }

    // 会話履歴を文字列に変換
    const conversationText = messages
      .map((msg: any) => `${msg.role === 'user' ? (language === 'ja' ? '医師' : 'Doctor') : (language === 'ja' ? '患者' : 'Patient')}: ${msg.content}`)
      .join('\n');

    // GPT-4による評価
    const evaluationPrompt = language === 'ja' ? `
あなたは歯科医療面接の評価者です。以下の医療面接の会話を分析し、評価基準に基づいて評価してください。

【会話履歴】
${conversationText}

【評価基準】
${criteriaToUse.map((c: EvaluationCriteria) => `- ${c.item} (優先度: ${c.priority === 'high' ? '高' : c.priority === 'medium' ? '中' : '低'})`).join('\n')}

【評価方法】
1. 各評価項目について、会話内で実施されたかを判定
2. 実施された項目は "checked": true、されなかった項目は "checked": false
3. 具体的な評価コメントを記載
4. 全体的な評価スコア（100点満点）を算出
5. 総合的なフィードバックを提供

【出力形式】
以下のJSON形式で出力してください：
{
  "evaluatedItems": [
    {
      "category": "カテゴリ名",
      "subcategory": "サブカテゴリ名（ある場合）",
      "item": "評価項目",
      "checked": true/false,
      "comment": "具体的な評価コメント",
      "priority": "high/medium/low"
    }
  ],
  "totalScore": 総合スコア（0-100）,
  "maxScore": 100,
  "summary": "総合的な評価コメント",
  "strengths": ["良かった点1", "良かった点2"],
  "improvements": ["改善点1", "改善点2"],
  "detailedFeedback": {
    "communication": "コミュニケーションに関する詳細フィードバック",
    "medicalInfo": "医学的情報収集に関する詳細フィードバック",
    "overall": "全体的な詳細フィードバック"
  }
}` : `
You are a dental medical interview evaluator. Analyze the following medical interview conversation and evaluate it based on the evaluation criteria.

[Conversation History]
${conversationText}

[Evaluation Criteria]
${criteriaToUse.map((c: EvaluationCriteria) => `- ${c.itemEn || c.item} (Priority: ${c.priority})`).join('\n')}

[Evaluation Method]
1. Determine whether each evaluation item was performed in the conversation
2. Mark performed items as "checked": true, not performed as "checked": false
3. Provide specific evaluation comments
4. Calculate an overall evaluation score (out of 100)
5. Provide comprehensive feedback

[Output Format]
Please output in the following JSON format:
{
  "evaluatedItems": [
    {
      "category": "category name",
      "subcategory": "subcategory name (if applicable)",
      "item": "evaluation item",
      "checked": true/false,
      "comment": "specific evaluation comment",
      "priority": "high/medium/low"
    }
  ],
  "totalScore": overall score (0-100),
  "maxScore": 100,
  "summary": "comprehensive evaluation comment",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "detailedFeedback": {
    "communication": "detailed feedback on communication",
    "medicalInfo": "detailed feedback on medical information gathering",
    "overall": "overall detailed feedback"
  }
}`;

    const generateEvaluationWithModel = async (model: string) => {
      if (!openai) {
        throw new Error('OpenAI client is not available');
      }

      const completion = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: language === 'ja'
              ? '医療面接評価の専門家として、客観的かつ建設的な評価を行ってください。日本語で評価してください。'
              : 'As a medical interview evaluation expert, provide objective and constructive evaluation. Provide evaluation in English.'
          },
          {
            role: 'user',
            content: evaluationPrompt
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error(`Evaluation response was empty (model: ${model})`);
      }

      return JSON.parse(content);
    };

    let evaluationResult;

    try {
      evaluationResult = await generateEvaluationWithModel(EVALUATION_MODEL);
    } catch (modelError: any) {
      if (modelError?.response?.status === 404 || modelError?.code === 'model_not_found') {
        console.warn(`Evaluation model ${EVALUATION_MODEL} not available. Falling back to ${EVALUATION_FALLBACK_MODEL}.`);
        evaluationResult = await generateEvaluationWithModel(EVALUATION_FALLBACK_MODEL);
      } else {
        throw modelError;
      }
    }
    
    // 評価結果を整形
    const formattedEvaluation = buildEvaluationResponse(evaluationResult, scenarioId, language, messages.length);

    return NextResponse.json({ success: true, evaluation: formattedEvaluation });
    
  } catch (error) {
    console.error('Evaluation API Error:', error);
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';

    if (!IS_PRODUCTION) {
      const networkError = isNetworkRelatedError(error);
      const authError = isAuthError(errorMessage);

      if (networkError || authError || FORCE_MOCK_EVALUATION || !openai) {
        console.warn('[Evaluation API] Falling back to mock evaluation due to local environment constraints.');
        const mockEvaluation = createMockEvaluation(messages, language);
        const formattedMock = buildEvaluationResponse(mockEvaluation, scenarioId, language, messages?.length || 0);
        return NextResponse.json({ success: true, evaluation: formattedMock });
      }
    }

    return NextResponse.json(
      { error: `評価の生成中にエラーが発生しました: ${errorMessage}` },
      { status: 500 }
    );
  }
}

function isNetworkRelatedError(error: any): boolean {
  const code = error?.code || error?.cause?.code;
  if (code && ['ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT'].includes(code)) {
    return true;
  }
  const message = typeof error?.message === 'string' ? error.message : '';
  return /ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT/i.test(message);
}

function isAuthError(message: string): boolean {
  return message?.toLowerCase().includes('openai_api_key') || message?.toLowerCase().includes('api key');
}

function buildEvaluationResponse(evaluationResult: any, scenarioId: string, language: 'ja' | 'en', messageCount: number) {
  return {
    id: `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    scenarioId,
    evaluatorName: language === 'ja' ? 'AI自動評価システム' : 'AI Automatic Evaluation System',
    ...evaluationResult,
    conversationLength: messageCount,
    isAIEvaluation: true
  };
}

function createMockEvaluation(messages: any[], language: 'ja' | 'en') {
  const doctorSpeech = messages
    .filter((msg: any) => msg.role === 'user')
    .map((msg: any) => msg.content)
    .join('\n')
    .toLowerCase();

  const hasGreeting = /(こんにちは|こんばんは|おはよう|hello|hi)/i.test(doctorSpeech);
  const askedChiefComplaint = /(どうされました|何があった|what brings you|what seems to be the problem|chief complaint)/i.test(doctorSpeech);
  const askedHistory = /(いつから|どのくらい|どういう時|since when|how long|what makes it)/i.test(doctorSpeech);
  const askedPsychosocial = /(心配|不安|仕事|生活|worried|concern|impact|work|daily)/i.test(doctorSpeech);
  const checkedClosing = /(他に|ほかに|anything else|others you want to share|anything else that concerns you)/i.test(doctorSpeech);

  let totalScore = 60;
  if (hasGreeting) totalScore += 5;
  if (askedChiefComplaint) totalScore += 10;
  if (askedHistory) totalScore += 10;
  if (askedPsychosocial) totalScore += 8;
  if (checkedClosing) totalScore += 7;
  totalScore = Math.min(95, Math.max(45, totalScore));

  const summary = language === 'ja'
    ? '全体として基本的な問診は実施できていますが、追加の深掘り質問があるとより良い面接になります。'
    : 'Overall, the basic interview flow is covered, but deeper follow-up questions would improve the encounter.';

  const strengths = language === 'ja'
    ? [
        hasGreeting ? '丁寧な挨拶で患者との関係性を築けています。' : '患者の主訴を短時間で把握できています。',
        askedHistory ? '主訴の経過を段階的に確認できています。' : '患者の不安に共感的な姿勢が見られます。'
      ]
    : [
        hasGreeting ? 'You established rapport with a polite greeting.' : 'You identified the patient’s chief concern quickly.',
        askedHistory ? 'You explored the history of the complaint in stages.' : 'You showed empathy toward patient concerns.'
      ];

  const improvements = language === 'ja'
    ? [
        askedPsychosocial ? '問診の締めくくりで言い忘れを確認すると更に安心感を与えられます。' : '生活背景や心理面への質問を追加すると患者理解が深まります。',
        askedHistory ? '経過だけでなく痛みの程度や緩解因子も掘り下げると診断精度が高まります。' : '主訴の発症状況や増悪因子をもう一歩深掘りしましょう。'
      ]
    : [
        askedPsychosocial ? 'Consider confirming if the patient has anything else to share at the end.' : 'Add questions about lifestyle or psychosocial context to deepen understanding.',
        askedHistory ? 'Probe further into severity and relieving factors to refine your assessment.' : 'Ask more about onset and aggravating factors to clarify the clinical picture.'
      ];

  const detailedFeedback = language === 'ja'
    ? {
        communication: hasGreeting
          ? '挨拶や相槌で患者が話しやすい雰囲気を維持できています。'
          : '冒頭で挨拶や自己紹介を行い、患者との信頼関係を築きましょう。',
        medicalInfo: askedHistory
          ? '主訴の発症時期や症状の変化を適切に確認できています。さらに痛みの程度や誘因を尋ねられると理想的です。'
          : '主訴を聞くだけでなく、発症時期や症状の特徴を段階的に確認しましょう。',
        overall: checkedClosing
          ? '締めくくりで言い忘れを確認できており良い印象です。今後もこの流れを維持してください。'
          : '面接の最後に言い忘れや不安の確認を行うと、患者の満足度が向上します。'
      }
    : {
        communication: hasGreeting
          ? 'Your greeting and verbal acknowledgments foster a comfortable atmosphere.'
          : 'Open with a greeting or brief introduction to build rapport immediately.',
        medicalInfo: askedHistory
          ? 'You explored onset and progression well; adding questions on severity or triggers would strengthen assessment.'
          : 'Move beyond identifying the chief complaint to explore onset, quality, and triggers step by step.',
        overall: checkedClosing
          ? 'You wrapped up by checking for additional concerns, which supports patient satisfaction.'
          : 'Conclude by asking if the patient has further questions or concerns to ensure nothing is missed.'
      };

  const evaluatedItems = [
    {
      category: 'opening',
      item: language === 'ja' ? '挨拶を行う' : 'Greet the patient',
      checked: hasGreeting,
      comment: language === 'ja'
        ? hasGreeting ? '丁寧な挨拶ができています。' : '最初に挨拶を入れると患者が安心します。'
        : hasGreeting ? 'Appropriate greeting observed.' : 'Add a greeting to put the patient at ease.',
      priority: 'high'
    },
    {
      category: 'medicalInfo',
      subcategory: 'chiefComplaint',
      item: language === 'ja' ? '主訴を聞く' : 'Ask about chief complaint',
      checked: askedChiefComplaint,
      comment: language === 'ja'
        ? askedChiefComplaint ? '主訴の把握ができています。' : '「今日はどうされましたか？」など主訴を確認しましょう。'
        : askedChiefComplaint ? 'Chief complaint identified clearly.' : 'Ask directly about the main reason for the visit.',
      priority: 'high'
    },
    {
      category: 'medicalInfo',
      subcategory: 'history',
      item: language === 'ja' ? '主訴の現病歴を聞く' : 'Ask about present illness history',
      checked: askedHistory,
      comment: language === 'ja'
        ? askedHistory ? '発症時期や状況を段階的に確認できています。' : '発症時期や痛みの性質などOPQRSTを意識して聞きましょう。'
        : askedHistory ? 'Present illness explored with follow-up questions.' : 'Cover onset, timing, and characteristics to enrich history.',
      priority: 'high'
    },
    {
      category: 'psychosocial',
      item: language === 'ja' ? '心理的状況を聞く' : 'Ask about psychological status',
      checked: askedPsychosocial,
      comment: language === 'ja'
        ? askedPsychosocial ? '患者の不安や生活背景に配慮した質問ができています。' : '生活や不安についても質問すると患者理解が深まります。'
        : askedPsychosocial ? 'Psychosocial aspects addressed appropriately.' : 'Include questions about anxiety, lifestyle, or impact on daily life.',
      priority: 'medium'
    },
    {
      category: 'closing',
      item: language === 'ja' ? '言い忘れの確認を行う' : 'Ask if anything was forgotten',
      checked: checkedClosing,
      comment: language === 'ja'
        ? checkedClosing ? '締めくくりで追加の懸念を確認できています。' : '最後に「他に気になることはありますか？」と確認すると安心感が高まります。'
        : checkedClosing ? 'Closure included checking for additional concerns.' : 'End by asking if the patient has other concerns to ensure completeness.',
      priority: 'high'
    },
    {
      category: 'overall',
      item: language === 'ja' ? '順序立った面接を行う' : 'Conduct a well-structured interview',
      checked: totalScore >= 65,
      comment: language === 'ja'
        ? totalScore >= 65 ? '基本的な流れが整理されています。' : '問診の順序を意識して情報を整理すると伝わりやすくなります。'
        : totalScore >= 65 ? 'Interview followed a logical structure.' : 'Follow a clearer structure to make the interview easier to follow.',
      priority: 'high'
    }
  ];

  return {
    evaluatedItems,
    totalScore,
    maxScore: 100,
    summary,
    strengths,
    improvements,
    detailedFeedback
  };
}
