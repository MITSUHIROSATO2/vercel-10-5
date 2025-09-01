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
  // コミュニケーション
  { category: 'communication', subcategory: 'verbal', item: '明瞭で聞き取りやすい話し方', priority: 'high' },
  { category: 'communication', subcategory: 'verbal', item: '適切な音量と速度', priority: 'medium' },
  { category: 'communication', subcategory: 'verbal', item: '専門用語を避けた説明', priority: 'high' },
  { category: 'communication', subcategory: 'overall', item: '患者の不安への配慮', priority: 'high' },
  { category: 'communication', subcategory: 'overall', item: '共感的な態度', priority: 'high' },
  
  // 導入
  { category: 'introduction', item: '挨拶と自己紹介', priority: 'high' },
  { category: 'introduction', item: '本人確認（氏名・生年月日）', priority: 'high' },
  { category: 'introduction', item: '診察の目的説明', priority: 'medium' },
  
  // 医学的情報
  { category: 'medicalInfo', subcategory: 'chiefComplaint', item: '主訴の聴取', priority: 'high' },
  { category: 'medicalInfo', subcategory: 'chiefComplaint', item: '開放型質問の使用', priority: 'high' },
  { category: 'medicalInfo', subcategory: 'chiefComplaint', item: '症状の詳細確認', priority: 'high' },
  { category: 'medicalInfo', subcategory: 'history', item: '現病歴の聴取', priority: 'high' },
  { category: 'medicalInfo', subcategory: 'history', item: '既往歴の確認', priority: 'high' },
  { category: 'medicalInfo', subcategory: 'history', item: 'アレルギー歴の確認', priority: 'high' },
  { category: 'medicalInfo', subcategory: 'history', item: '服薬歴の確認', priority: 'high' },
  { category: 'medicalInfo', subcategory: 'lifestyle', item: '喫煙歴の確認', priority: 'medium' },
  { category: 'medicalInfo', subcategory: 'lifestyle', item: '飲酒歴の確認', priority: 'medium' },
  { category: 'medicalInfo', subcategory: 'lifestyle', item: '食生活の確認', priority: 'low' },
  
  // 心理社会的側面
  { category: 'psychosocial', item: '患者の心配事の聴取', priority: 'high' },
  { category: 'psychosocial', item: '治療への希望確認', priority: 'high' },
  { category: 'psychosocial', item: '生活への影響確認', priority: 'medium' },
  
  // 締めくくり
  { category: 'closing', item: '患者の質問への対応', priority: 'high' },
  { category: 'closing', item: '情報の要約・確認', priority: 'high' },
  { category: 'closing', item: '今後の方針説明', priority: 'high' },
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