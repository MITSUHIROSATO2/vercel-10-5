import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface EvaluationCriteria {
  category: string;
  subcategory?: string;
  item: string;
  priority: 'high' | 'medium' | 'low';
}

const evaluationCriteria: EvaluationCriteria[] = [
  // （１）対人関係能力：患者との良好な関係の構築
  { category: 'interpersonal', item: '言語的コミュニケーションを適切に行う', priority: 'high' },
  
  // （２）全体をとおして
  { category: 'overall', item: '順序立った面接を行う', priority: 'high' },
  { category: 'overall', item: '話題を変えるときには、唐突でなく適切な声かけをする', priority: 'high' },
  
  // （３）導入部分：オープニング
  { category: 'opening', item: '挨拶を行う', priority: 'high' },
  { category: 'opening', item: '本人確認と自己紹介を適切に行う', priority: 'high' },
  { category: 'opening', item: '面接の概要説明と同意を取得する', priority: 'high' },
  
  // （４）患者に聞く：歯科医学的情報
  { category: 'medicalInfo', subcategory: 'chiefComplaint', item: '主訴を聞く', priority: 'high' },
  { category: 'medicalInfo', subcategory: 'chiefComplaint', item: '主訴の現病歴を聞く', priority: 'high' },
  { category: 'medicalInfo', subcategory: 'history', item: '歯科的既往歴を聞く', priority: 'high' },
  { category: 'medicalInfo', subcategory: 'history', item: '全身的既往歴を聞く', priority: 'high' },
  { category: 'medicalInfo', subcategory: 'lifestyle', item: '口腔衛生習慣(歯磨きの頻度など)を聞く', priority: 'low' },
  { category: 'medicalInfo', subcategory: 'lifestyle', item: '患者の食習慣や嗜好を聞く', priority: 'low' },
  { category: 'medicalInfo', subcategory: 'lifestyle', item: '患者の家族歴や社会歴を聞く', priority: 'low' },
  
  // （５）患者に聞く：心理・社会的情報
  { category: 'psychosocial', item: '解釈モデルを聞く', priority: 'high' },
  { category: 'psychosocial', item: '来院動機を聞く', priority: 'low' },
  { category: 'psychosocial', item: '心理的状況を聞く', priority: 'low' },
  { category: 'psychosocial', item: '検査や治療に関する要望を聞く', priority: 'low' },
  { category: 'psychosocial', item: '患者背景に関わる通院条件、健康･受療行動、生活･社会･心理的背景などを聞く', priority: 'low' },
  
  // （６）締めくくり部分：クロージング
  { category: 'closing', item: '要約と確認を行う', priority: 'high' },
  { category: 'closing', item: '言い忘れの確認を行う', priority: 'high' },
  { category: 'closing', item: '面接終了後、患者が次にどうしたら良いかを適切に伝える', priority: 'high' },
];

export async function POST(request: NextRequest) {
  try {
    const { messages, scenarioId, customCriteria } = await request.json();
    
    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: '会話履歴が必要です' },
        { status: 400 }
      );
    }

    // カスタム評価項目があればそれを使用、なければデフォルトを使用
    const criteriaToUse = customCriteria && customCriteria.length > 0 ? customCriteria : evaluationCriteria;

    // 会話履歴を文字列に変換
    const conversationText = messages
      .map((msg: any) => `${msg.role === 'user' ? '医師' : '患者'}: ${msg.content}`)
      .join('\n');

    // GPT-4による評価
    const evaluationPrompt = `
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
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: '医療面接評価の専門家として、客観的かつ建設的な評価を行ってください。'
        },
        {
          role: 'user',
          content: evaluationPrompt
        }
      ],
      temperature: 0.3, // 評価の一貫性のため低めに設定
      response_format: { type: "json_object" }
    });

    const evaluationResult = JSON.parse(completion.choices[0].message.content || '{}');
    
    // 評価結果を整形
    const formattedEvaluation = {
      id: `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      scenarioId,
      evaluatorName: 'AI自動評価システム',
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