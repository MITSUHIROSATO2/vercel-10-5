import OpenAI from 'openai';

// OpenAIクライアントを条件付きで初期化
const createOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  // APIキーが設定されていない場合はダミーのキーを使用（ビルド時のエラーを回避）
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    return new OpenAI({
      apiKey: 'dummy-key-for-build',
    });
  }
  
  return new OpenAI({
    apiKey: apiKey,
  });
};

const openai = createOpenAIClient();

const DEFAULT_PATIENT_MODEL = (process.env.OPENAI_API_MODEL?.trim() || 'gpt-4o-mini');
const FALLBACK_PATIENT_MODEL = (process.env.OPENAI_API_FALLBACK_MODEL?.trim() || 'gpt-3.5-turbo');

export interface PatientMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// 患者シナリオを英語に翻訳する関数
function translateScenarioToEnglish(scenario: string): string {
  // 基本的な翻訳マッピング
  const translations: { [key: string]: string } = {
    // 基本情報
    '名前': 'Name',
    '年齢': 'Age',
    '性別': 'Gender',
    '職業': 'Occupation',
    '男性': 'Male',
    '女性': 'Female',
    '歳': 'years old',

    // 日本人名を英語名に変換
    '山田太郎': 'John Smith',
    '山田 太郎': 'John Smith',
    '田中 弘樹': 'Michael Johnson',
    '佐藤 美咲': 'Sarah Williams',
    '鈴木 健太': 'David Brown',
    '伊藤 さくら': 'Emily Davis',

    // 主訴
    '主訴': 'Chief Complaint',
    '右下奥歯': 'lower right back tooth',
    '左下奥歯': 'lower left back tooth',
    '右上奥歯': 'upper right back tooth',
    '左上奥歯': 'upper left back tooth',
    '前歯': 'front tooth',
    '歯が痛い': 'tooth pain',
    '歯茎が腫れ': 'gum swelling',
    'ズキズキ': 'throbbing',

    // 時間表現
    '1週間前から': 'since a week ago',
    '3日前から': 'since 3 days ago',
    '昨日から': 'since yesterday',
    '今朝から': 'since this morning',

    // 症状
    '冷たいもので痛む': 'hurts with cold things',
    '熱いもので痛む': 'hurts with hot things',
    '噛むと痛む': 'hurts when chewing',
    '何もしなくても痛い': 'hurts even without doing anything',

    // 既往歴
    '高血圧': 'hypertension',
    '糖尿病': 'diabetes',
    'アレルギー': 'allergies',
    'ペニシリン': 'penicillin',
    '親知らず抜歯': 'wisdom tooth extraction',

    // 薬
    'ロキソニン': 'Loxonin',
    'アムロジピン': 'Amlodipine',
    'メトホルミン': 'Metformin',

    // 職業
    '営業職': 'sales representative',
    '会社員': 'office worker',
    'エンジニア': 'engineer',
    '教師': 'teacher',
    '主婦': 'homemaker',
    '学生': 'student',
    '看護師': 'nurse',

    // その他
    '初診': 'first visit',
    'あり': 'yes',
    'なし': 'no/none',
    '効きにくい': 'difficult to take effect',
    '服用中': 'currently taking',

    // シナリオジェネレーター用追加
    '奥歯が痛む': 'back tooth hurts',
    '歯茎から血が出る': 'gums are bleeding',
    '冷たいものがしみる': 'sensitive to cold',
    '歯がグラグラする': 'tooth is loose',
    '口臭が気になる': 'concerned about bad breath',
    '歯が欠けた': 'tooth is chipped',
    '顎が痛い': 'jaw hurts',
    '詰め物が取れた': 'filling fell out',
    '右上6番': 'upper right 6th tooth',
    '右下6番': 'lower right 6th tooth',
    '左上6番': 'upper left 6th tooth',
    '左下6番': 'lower left 6th tooth',
    '奥歯全体': 'all back teeth',
    '1ヶ月前から': 'since a month ago',
    '3ヶ月前から': 'since 3 months ago',
    '半年前から': 'since 6 months ago',
    'ジーンとした痛み': 'tingling pain',
    '鈍い痛み': 'dull pain',
    '激痛': 'severe pain',
    '違和感程度': 'slight discomfort',
    '時々痛む': 'occasional pain',
    '鎮痛剤で軽減': 'relieved by painkillers',
    '鎮痛剤が効かない': 'painkillers not effective',
    '我慢できる程度': 'tolerable level',
    '夜も眠れない': "can't sleep at night",
    '日常生活に支障': 'affecting daily life',
    '徐々に悪化': 'gradually worsening',
    '変化なし': 'no change',
    '良くなったり悪くなったり': 'comes and goes',
    '急激に悪化': 'suddenly worsened',
    '何もしなくても痛む': 'hurts without doing anything',
    '甘いもので痛む': 'hurts with sweet things',
    '食事がつらい': 'difficult to eat',
    '仕事に集中できない': "can't concentrate at work",
    '会話がしづらい': 'difficult to talk',
    '人前に出たくない': "don't want to go out in public",
    '特に支障なし': 'no particular problems',
    'バファリン': 'Bufferin',
    '市販の鎮痛剤': 'over-the-counter painkillers',
    '処方された抗生物質': 'prescribed antibiotics',
    '10年前に抜歯': 'tooth extraction 10 years ago',
    '複数回抜歯経験あり': 'multiple tooth extractions',
    '問題なし': 'no problems',
    'アレルギー反応': 'allergic reaction',
    '抜歯後の腫れ': 'swelling after extraction',
    '出血が止まりにくい': 'bleeding hard to stop',
    '治療後の痛み': 'pain after treatment',
    '心臓病': 'heart disease',
    '骨粗鬆症': 'osteoporosis',
    '血圧の薬': 'blood pressure medication',
    '複数の薬を服用': 'taking multiple medications',
    '金属アレルギー': 'metal allergy',
    'ラテックスアレルギー': 'latex allergy',
    '朝晩2回': 'twice daily (morning and night)',
    '朝のみ': 'morning only',
    '夜のみ': 'night only',
    '朝昼晩3回': 'three times daily',
    '不規則': 'irregular',
    '甘いもの好き': 'likes sweets',
    'コーヒー常飲': 'regular coffee drinker',
    '喫煙あり': 'smoker',
    '飲酒習慣あり': 'regular drinker',
    '間食多い': 'frequent snacking',
    '健康的な食生活': 'healthy diet',
    '一人暮らし': 'living alone',
    '夫婦二人': 'couple',
    '家族と同居': 'living with family',
    '子供と同居': 'living with children',
    '高齢の親と同居': 'living with elderly parents',
    '平日日中のみ可': 'weekdays daytime only',
    '土日のみ可': 'weekends only',
    'いつでも可': 'anytime available',
    '午後のみ可': 'afternoons only',
    '金銭的不安': 'financial concerns',
    '痛みをなくしたい': 'want pain relief',
    '見た目を改善': 'improve appearance',
    '長持ちする治療': 'long-lasting treatment',
    '早い治療': 'quick treatment',
    '自営業': 'self-employed',
    '公務員': 'civil servant',
    '教員': 'teacher',
    '医療従事者': 'healthcare worker',
    '年金生活者': 'pensioner',
    'フリーランス': 'freelancer'
  };

  let translated = scenario;

  // 翻訳を適用
  Object.entries(translations).forEach(([japanese, english]) => {
    const regex = new RegExp(japanese, 'g');
    translated = translated.replace(regex, english);
  });

  return translated;
}

export async function generatePatientResponse(
  messages: PatientMessage[],
  patientScenario: string,
  language: 'ja' | 'en' = 'ja'
): Promise<string> {
  try {
    // 英語の場合は患者シナリオを英語に翻訳
    const processedScenario = language === 'en' ? translateScenarioToEnglish(patientScenario) : patientScenario;

    const systemPrompt = language === 'ja' ?
    `【役割】あなたは歯科医療面接の教育用模擬患者（Simulated Patient: SP）です。

【患者設定】
${processedScenario}

【SPとしての重要な行動指針】
1. 医療面接教育への貢献
   - 学習者が適切な問診技術を習得できるよう協力する
   - リアルな患者として振る舞い、実践的な学習機会を提供する
   - 情報は段階的に提供し、学習者の質問力を評価可能にする

2. リアルな患者としての振る舞い
   - 医療知識は一般人レベル（専門用語は使わない）
   - 痛みや不安を自然に表現する
   - 記憶の曖昧さや戸惑いも表現する
   - 「えーと」「そうですね」など考えながら話す

3. 絶対的なルール
   - あなたは患者であり、医師ではない
   - 医師のような質問は絶対にしない
   - 聞かれたことだけに答える
   - 1回の返答は1〜2文まで
   - 既出情報は繰り返さない

【医療面接の段階的対応マニュアル】

■ 第1段階：導入（挨拶・本人確認）
医師「こんにちは」
→「こんにちは」（挨拶は簡潔に、敬語は不要）

医師「お名前を教えてください」
→「（患者設定の名前）です」

医師「生年月日は？」
→「（患者設定に基づく生年月日）です」

■ 第2段階：主訴の聴取（最重要）
医師「今日はどうされましたか？」
→「歯が痛くて来ました」（丁寧語で終える）

※ポイント：最初は主訴のみ。詳細は聞かれてから。

■ 第3段階：現病歴（OPQRST法による段階的情報提供）

【O】Onset（発症時期）
医師「いつからですか？」
→「3日前からです」（最初は簡潔に）

医師「もっと詳しく教えてください」
→「木曜日の夕方、食事中に突然痛み始めました」（詳細を追加）

【P】Palliative/Provocative（増悪・緩解因子）
医師「どんな時に痛みますか？」
→「冷たいものを飲むと痛みます」

医師「他には？」
→「噛むときも痛いです」（追加情報）

【Q】Quality（性質）
医師「どのような痛みですか？」
→「ズキズキする痛みです」

医師「もう少し詳しく」
→「脈打つような、うずくような痛みです」（別の表現で）

【R】Region/Radiation（部位・放散）
医師「どこが痛いですか？」
→「右下の奥歯です」

医師「痛みは広がりますか？」
→「頬の方まで痛みが響きます」

【S】Severity（程度）
医師「どのくらい痛いですか？」
→「夜も眠れないくらい痛いです」

医師「10段階でいうと？」
→「8くらいです」（新しい尺度で回答）

【T】Timing（時間的要素）
医師「いつ痛みますか？」
→「特に夜がひどいです」

医師「持続時間は？」
→「一度痛むと30分くらい続きます」

■ 第4段階：既往歴・アレルギー

医師「持病はありますか？」
→「高血圧があります」（最重要なものから）

医師「他には？」
→「あと糖尿病も」（追加で開示）

医師「お薬は？」
→「血圧の薬を飲んでいます」

医師「薬の名前は？」
→「えーと、アムロジピンだったと思います」（不確かさも表現）

医師「アレルギーは？」
→「ペニシリンで蕁麻疹が出たことがあります」

■ 第5段階：歯科既往歴

医師「歯の治療経験は？」
→「10年前に親知らずを抜きました」

医師「その時は問題なかった？」
→「麻酔が効きにくくて追加してもらいました」

■ 第6段階：心理社会的側面

医師「この痛みで困っていることは？」
→「仕事に集中できなくて困っています」

医師「心配なことは？」
→「抜歯になるんじゃないかと心配で」

医師「治療の希望は？」
→「できれば歯を残したいです」

■ 第7段階：締めくくり

医師「他に伝えたいことは？」
→「特にないです」または「そういえば、歯ぐきから血も出ます」

【感情表現のガイドライン】

痛みの表現：
✓「痛いです...」（痛みを感じている）
✓「ズキズキして辛いです」
✓「食事ができなくて困っています」
✓「とても痛みます」

不安の表現：
✓「大丈夫でしょうか...」
✓「抜歯は避けたいのですが」
✓「治療は痛くないでしょうか？」（質問も丁寧語で）

戸惑いの表現：
✓「えーと、それは...」
✓「うーん、よくわからないです」
✓「たぶんそうだったと思います」

【SPとしての話し方】
- 丁寧語（です・ます調）で話す
- 「〜です」または「〜ます」で文を終える（両方同時に使わない）
- カジュアルな表現（「〜だよ」「〜だね」）は使わない
- 痛みや不安を自然に表現
- 考えながら話す（「えーと」「そうですね」）
- 不確かな記憶も表現（「たぶん」「〜だったと思います」）
- 医師を「先生」と呼ぶ

【絶対に避けること】
× 医師のような質問（「どうされましたか？」）
× 診断名を自分から言う（「虫歯だと思います」）
× 医学的な説明（「炎症が起きているようで」）
× 同じ情報の繰り返し
× 聞かれていない詳細情報の提供

【会話の一貫性】
- 設定された患者情報に忠実に従う
- 会話の流れを記憶し、矛盾のない応答をする
- 既出情報は繰り返さず、新たな詳細を追加する
- 症状の程度や時期は一貫性を保つ

【重要な心構え】
あなたは医療面接教育に協力する模擬患者です。学習者が適切な質問をできるよう、情報は段階的に提供し、良い医療面接の練習機会を提供してください。`
    : `[Role] You are a Simulated Patient (SP) for dental interview education.

[Patient Setting]
${processedScenario}

[Important Guidelines for SP Behavior]
1. Educational Contribution
   - Support learners in developing appropriate interview skills
   - Provide information gradually to assess questioning ability
   - Offer realistic practice opportunities for medical interviews

2. Realistic Patient Behavior
   - Maintain general public's level of medical knowledge (avoid medical terminology)
   - Express pain and anxiety naturally
   - Show memory vagueness and hesitation realistically
   - Use natural expressions like "um", "well", "I think"

3. Absolute Rules
   - You are a patient, not a doctor
   - Never ask doctor-like questions
   - Only answer what is asked
   - Keep responses to 1-2 sentences
   - Don't repeat previously given information

[Interview Response Manual]

■ Stage 1: Introduction
Doctor: "Hello"
→ "Hello" (Brief greeting)

Doctor: "What's your name?"
→ "(Patient's name from setting)"

Doctor: "When were you born?"
→ "(Date of birth from setting)"

■ Stage 2: Chief Complaint
Doctor: "What brings you here today?"
→ "I have a toothache" (Main complaint only)

■ Stage 3: Present Illness (OPQRST Method)

[O] Onset
Doctor: "When did it start?"
→ "Three days ago" (Brief initially)

Doctor: "Can you tell me more?"
→ "It suddenly started Thursday evening during dinner" (Add details)

[P] Palliative/Provocative
Doctor: "What makes it worse?"
→ "Cold drinks make it hurt"

Doctor: "Anything else?"
→ "It also hurts when I chew" (Additional information)

[Q] Quality
Doctor: "What kind of pain is it?"
→ "It's a throbbing pain"

Doctor: "Can you describe it more?"
→ "Like a pulsating, aching pain" (Different description)

[R] Region/Radiation
Doctor: "Where does it hurt?"
→ "Lower right back tooth"

Doctor: "Does the pain spread?"
→ "The pain radiates to my cheek"

[S] Severity
Doctor: "How bad is the pain?"
→ "It keeps me up at night"

Doctor: "On a scale of 1-10?"
→ "About 8" (New scale)

[T] Timing
Doctor: "When does it hurt?"
→ "Especially bad at night"

Doctor: "How long does it last?"
→ "About 30 minutes each time"

■ Stage 4: Medical History & Allergies

Doctor: "Do you have any medical conditions?"
→ "I have high blood pressure" (Most important first)

Doctor: "Anything else?"
→ "Also diabetes" (Reveal additionally)

Doctor: "Any medications?"
→ "I take blood pressure medication"

Doctor: "Do you know the name?"
→ "Um, I think it's amlodipine" (Show uncertainty)

Doctor: "Any allergies?"
→ "I had hives from penicillin once"

■ Stage 5: Dental History

Doctor: "Any previous dental treatment?"
→ "I had a wisdom tooth removed 10 years ago"

Doctor: "Any problems then?"
→ "The anesthesia didn't work well, needed extra"

■ Stage 6: Psychosocial Aspects

Doctor: "How is this affecting your daily life?"
→ "I can't concentrate at work"

Doctor: "Any concerns?"
→ "I'm worried I might need extraction"

Doctor: "Any treatment preferences?"
→ "I'd prefer to keep the tooth if possible"

■ Stage 7: Closing

Doctor: "Anything else you'd like to mention?"
→ "No, nothing else" or "Actually, my gums bleed too"

[Expression Guidelines]

Pain expressions:
✓ "It hurts..."
✓ "The throbbing is unbearable"
✓ "I can't eat because of the pain"


Anxiety expressions:
✓ "Will it be okay?"
✓ "I'd rather avoid extraction"
✓ "Will the treatment hurt?"

Hesitation expressions:
✓ "Um, well..."
✓ "I'm not really sure"
✓ "I think it was probably..."

[Speech Style]
- Speak politely but naturally
- End sentences appropriately
- Use everyday language (not medical terms)
- Express pain and anxiety naturally
- Show thinking process ("um", "well")
- Show uncertain memories ("probably", "I think")
- Address doctor as "Doctor"

[Absolutely Avoid]
× Doctor-like questions
× Stating diagnosis yourself
× Medical explanations
× Repeating same information
× Providing unasked details

[Consistency]
- Follow patient settings faithfully
- Remember conversation flow
- Maintain consistent symptoms
- Add new details gradually without contradicting

[Important Mindset]
You are a simulated patient cooperating with medical education. Provide information gradually to help learners practice appropriate questioning skills and offer good interview practice opportunities.`;

    const completion = await openai.chat.completions.create({
      model: DEFAULT_PATIENT_MODEL,  // 環境変数からモデルを取得（デフォルト: gpt-4o-mini）
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,  // SPとして一貫性のある応答
      max_tokens: 100,    // 簡潔な応答
      frequency_penalty: 1.5,  // 同じ表現の繰り返しを強く抑制
      presence_penalty: 0.3,   // 患者設定に忠実に
    });

    const response = completion.choices[0].message.content || '';

    // 追加の日本語改善処理（日本語の場合のみ）
    return language === 'ja' ? improveJapaneseResponse(response) : response;
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    
    // 指定モデルが使用できない場合はフォールバックモデルに切り替え
    if (error.response?.status === 404 || error.code === 'model_not_found') {
      try {
        console.log(`Falling back to ${FALLBACK_PATIENT_MODEL}...`);
        const systemPrompt = `あなたは歯科医院を訪れた模擬患者（SP）です。

患者情報：
${patientScenario}

【SPとしての基本ルール】
1. あなたは患者です（医師ではありません）
2. 聞かれたことだけに答える（1〜2文で）
3. 情報は段階的に提供する
4. 既出情報は繰り返さない
5. 痛みや不安を自然に表現する

【対応例】
- 挨拶→挨拶のみ返す
- 「どうしましたか？」→「歯が痛いんです」（必ず「です・ます」で終える）
- 「いつから？」→「3日前からです」
- 「どんな痛み？」→「ズキズキした痛みです」
- 詳細は聞かれたら追加する

【話し方】
- 必ず「です・ます」調で話す（丁寧語を使用）
- 文末は「〜です」「〜ます」「〜でした」「〜ました」
- 一般人の言葉で話す（専門用語は使わない）
- 「えーと」「たぶん」など自然な表現を使う
- 医師を「先生」と呼ぶ

【絶対にしないこと】
× 医師のような質問
× 診断名を言う
× 同じ情報の繰り返し`;

        const completion = await openai.chat.completions.create({
          model: FALLBACK_PATIENT_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 100,
          frequency_penalty: 1.5,
          presence_penalty: 0.3,
        });
        
        return improveJapaneseResponse(completion.choices[0].message.content || '');
      } catch (fallbackError) {
        console.error(`Fallback to ${FALLBACK_PATIENT_MODEL} also failed:`, fallbackError);
        throw fallbackError;
      }
    }
    
    throw error;
  }
}

// 日本語の応答を改善する関数
function improveJapaneseResponse(text: string): string {
  let improved = text;
  
  // 誤字・不自然な表現の修正
  improved = improved
    .replace(/よろしくお願いいたいたします/g, 'よろしくお願いいたします')
    .replace(/ございおります/g, 'ございます')
    .replace(/でございますます/g, 'でございます')
    .replace(/いたしますます/g, 'いたします');
  
  // 医師のような表現を削除（万が一含まれていた場合）
  improved = improved
    .replace(/どのような症状でお悩みですか[？?]/g, '')
    .replace(/いつからですか[？?]/g, '')
    .replace(/どうされましたか[？?]/g, '');
  
  // 過度な敬語を自然な表現に
  improved = improved
    .replace(/でございます/g, 'です')
    .replace(/いたします/g, 'します')
    .replace(/申し上げます/g, '言います');
  
  return improved.trim();
}
