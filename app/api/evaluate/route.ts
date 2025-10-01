import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  try {
    const { messages, scenarioId, customCriteria, language = 'ja' } = await request.json();
    
    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: language === 'ja' ? '会話履歴が必要です' : 'Conversation history is required' },
        { status: 400 }
      );
    }

    // カスタム評価項目があればそれを使用、なければデフォルトを使用
    const criteriaToUse = customCriteria && customCriteria.length > 0 ? customCriteria : evaluationCriteria;

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

    const completion = await openai.chat.completions.create({
      model: 'gpt-5',
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
      // GPT-5はtemperature=1のみサポート
      response_format: { type: "json_object" }
    });

    const evaluationResult = JSON.parse(completion.choices[0].message.content || '{}');
    
    // 評価結果を整形
    const formattedEvaluation = {
      id: `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      scenarioId,
      evaluatorName: language === 'ja' ? 'AI自動評価システム' : 'AI Automatic Evaluation System',
      ...evaluationResult,
      conversationLength: messages.length,
      isAIEvaluation: true
    };

    return NextResponse.json({
      success: true,
      evaluation: formattedEvaluation
    });
    
  } catch (error) {
    console.error('Evaluation API Error:', error);
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    return NextResponse.json(
      { error: `評価の生成中にエラーが発生しました: ${errorMessage}` },
      { status: 500 }
    );
  }
}