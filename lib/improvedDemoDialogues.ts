// 改善版：医療面接評価項目に準拠したデモンストレーション用対話データ

export interface DemoDialogue {
  speaker: 'doctor' | 'patient';
  text: string;
  delay?: number; // 次の発話までの待ち時間（ミリ秒）
}

export const improvedDemoDialogues: DemoDialogue[] = [
  // ===== 導入 =====
  // 挨拶と自己紹介
  { speaker: 'doctor', text: 'こんにちは、歯科医師の田中と申します、本日担当させていただきます。', delay: 3000 },
  { speaker: 'patient', text: 'こんにちは、よろしくお願いします。', delay: 2500 },

  // 本人確認（フルネーム）
  { speaker: 'doctor', text: 'まず、お名前をフルネームで教えていただけますか？', delay: 2000 },
  { speaker: 'patient', text: '山田太郎です。', delay: 2000 },
  { speaker: 'doctor', text: '山田太郎さんですね。生年月日も確認させてください。', delay: 2500 },
  { speaker: 'patient', text: '1990年5月15日生まれです。', delay: 2500 },

  // 面接の概要説明と同意
  { speaker: 'doctor', text: 'これから症状について詳しくお伺いして、診察をさせていただきます。よろしいでしょうか？', delay: 3000 },
  { speaker: 'patient', text: 'はい、お願いします。', delay: 2000 },

  // ===== 医学的情報 / 主訴 =====
  { speaker: 'doctor', text: '今日はどのような症状でいらっしゃいましたか？', delay: 2500 },
  { speaker: 'patient', text: '右下の奥歯が痛くて来ました。', delay: 2500 },

  // 話題転換の声かけ
  { speaker: 'doctor', text: 'お辛いですね。その痛みについて、もう少し詳しく教えていただけますか？', delay: 3000 },
  { speaker: 'patient', text: 'はい。', delay: 1500 },

  // ===== 現病歴（OPQRST）=====
  { speaker: 'doctor', text: 'いつから痛み始めましたか？', delay: 2000 },
  { speaker: 'patient', text: '3日前の木曜日からです。', delay: 2000 },
  { speaker: 'doctor', text: 'きっかけは何かありましたか？', delay: 2000 },
  { speaker: 'patient', text: '夕食中に、固いものを噛んだ時に、急に痛くなりました。', delay: 3000 },

  { speaker: 'doctor', text: 'どんな時に痛みますか？', delay: 2000 },
  { speaker: 'patient', text: '冷たいものを飲むと痛みます。', delay: 2500 },
  { speaker: 'doctor', text: '他にも痛む時はありますか？', delay: 2000 },
  { speaker: 'patient', text: '噛む時や、何もしていない時も痛いです。', delay: 2500 },

  { speaker: 'doctor', text: 'どのような痛みか表現していただけますか？', delay: 2500 },
  { speaker: 'patient', text: 'ズキズキと脈打つような痛みです。', delay: 2500 },

  { speaker: 'doctor', text: '痛みの場所を具体的に教えてください。', delay: 2000 },
  { speaker: 'patient', text: '右下の一番奥の歯です。', delay: 2000 },
  { speaker: 'doctor', text: '痛みは他の場所に広がりますか？', delay: 2000 },
  { speaker: 'patient', text: '右の頬や耳の方まで響きます。', delay: 2500 },

  { speaker: 'doctor', text: '痛みの強さを10段階で表すと、どのくらいですか？', delay: 2500 },
  { speaker: 'patient', text: '8くらいです。夜も眠れないほどです。', delay: 3000 },

  { speaker: 'doctor', text: '痛み止めは使用されましたか？', delay: 2000 },
  { speaker: 'patient', text: '市販のロキソニンを飲みましたが、あまり効きませんでした。', delay: 3000 },

  // 話題転換の声かけ
  { speaker: 'doctor', text: 'わかりました。次に、歯の治療歴についてお聞きします。', delay: 2500 },

  // ===== 歯科的既往歴 =====
  { speaker: 'doctor', text: '今まで歯科治療を受けたことはありますか？', delay: 2500 },
  { speaker: 'patient', text: '10年前に親知らずを抜いたことがあります。', delay: 2500 },
  { speaker: 'doctor', text: 'その時の治療で何か問題はありましたか？', delay: 2500 },
  { speaker: 'patient', text: '麻酔が効きにくくて、追加してもらいました。', delay: 2500 },
  { speaker: 'doctor', text: '他に歯科治療の経験はありますか？', delay: 2000 },
  { speaker: 'patient', text: '5年前に虫歯の治療をしました。', delay: 2000 },

  // 話題転換の声かけ
  { speaker: 'doctor', text: 'ありがとうございます。続いて、全身の健康状態についてお伺いします。', delay: 3000 },

  // ===== 全身的既往歴 =====
  { speaker: 'doctor', text: '現在治療中の病気はありますか？', delay: 2000 },
  { speaker: 'patient', text: '高血圧と糖尿病があります。', delay: 2000 },

  { speaker: 'doctor', text: '服用中のお薬を教えてください。', delay: 2000 },
  { speaker: 'patient', text: 'アムロジピンとメトホルミンを飲んでいます。', delay: 2500 },

  { speaker: 'doctor', text: 'アレルギーはありますか？', delay: 2000 },
  { speaker: 'patient', text: 'ペニシリンで蕁麻疹が出たことがあります。', delay: 2500 },

  // 家族歴
  { speaker: 'doctor', text: 'ご家族に歯周病や歯を早く失った方はいらっしゃいますか？', delay: 3000 },
  { speaker: 'patient', text: '父が歯周病で60歳頃に入れ歯になりました。', delay: 2500 },

  // 話題転換の声かけ
  { speaker: 'doctor', text: '分かりました。次に、普段の生活習慣についてお聞きします。', delay: 3000 },

  // ===== 生活習慣 =====
  // 口腔衛生習慣
  { speaker: 'doctor', text: '歯磨きは1日何回されていますか？', delay: 2000 },
  { speaker: 'patient', text: '朝と夜の2回です。', delay: 2000 },
  { speaker: 'doctor', text: 'フロスや歯間ブラシは使用されていますか？', delay: 2500 },
  { speaker: 'patient', text: 'たまに使う程度です。', delay: 2000 },

  // 食習慣
  { speaker: 'doctor', text: '甘いものはよく召し上がりますか？', delay: 2000 },
  { speaker: 'patient', text: 'コーヒーに砂糖を入れて、1日3杯くらい飲みます。', delay: 2500 },
  { speaker: 'doctor', text: '間食はされますか？', delay: 2000 },
  { speaker: 'patient', text: '仕事中にお菓子をつまむことがあります。', delay: 2500 },

  // 嗜好品
  { speaker: 'doctor', text: 'タバコは吸われますか？', delay: 2000 },
  { speaker: 'patient', text: 'いいえ、吸いません。', delay: 2000 },
  { speaker: 'doctor', text: 'お酒は飲まれますか？', delay: 2000 },
  { speaker: 'patient', text: '週に2、3回、ビールを飲む程度です。', delay: 2500 },

  // 社会歴
  { speaker: 'doctor', text: 'お仕事は何をされていますか？', delay: 2000 },
  { speaker: 'patient', text: '会社員で、デスクワークが中心です。', delay: 2500 },

  // 話題転換の声かけ
  { speaker: 'doctor', text: 'ありがとうございます。今度は、今回の症状についてのお考えをお聞かせください。', delay: 3500 },

  // ===== 心理社会的側面 =====
  // 解釈モデル
  { speaker: 'doctor', text: '今回の痛みの原因について、何か思い当たることはありますか？', delay: 3000 },
  { speaker: 'patient', text: '虫歯が進行したのかなと思っています。', delay: 2500 },

  // 来院動機
  { speaker: 'doctor', text: '今回、受診を決められたきっかけは何でしたか？', delay: 2500 },
  { speaker: 'patient', text: '痛みで仕事に集中できなくなったからです。', delay: 2500 },

  // 心理的状況
  { speaker: 'doctor', text: '歯の痛みについて、特に心配されていることはありますか？', delay: 3000 },
  { speaker: 'patient', text: '抜歯になるんじゃないかと心配です。', delay: 2500 },

  // 治療への要望
  { speaker: 'doctor', text: '治療について、何かご希望はありますか？', delay: 2500 },
  { speaker: 'patient', text: 'できるだけ歯を残したいです。痛みも早く取りたいです。', delay: 3000 },

  // 通院条件
  { speaker: 'doctor', text: '通院について、何か制約はありますか？', delay: 2500 },
  { speaker: 'patient', text: '平日の夕方以降か、土曜日なら通えます。', delay: 2500 },

  // ===== 締めくくり =====
  // 要約と確認
  { speaker: 'doctor', text: '確認させていただきます。3日前から右下の奥歯に強い痛みがあり、痛み止めも効きにくい状態なのですね。', delay: 4000 },
  { speaker: 'patient', text: 'はい、そうです。', delay: 1500 },
  { speaker: 'doctor', text: '高血圧と糖尿病で治療中で、ペニシリンのアレルギーがあることも確認しました。', delay: 3500 },
  { speaker: 'patient', text: 'はい。', delay: 1500 },

  // 言い忘れの確認
  { speaker: 'doctor', text: '他に何か伝え忘れたことや、気になることはありませんか？', delay: 3000 },
  { speaker: 'patient', text: 'そういえば、最近歯ぐきから血が出ることもあります。', delay: 3000 },
  { speaker: 'doctor', text: 'わかりました。それも含めて診察させていただきます。', delay: 2500 },

  // 次のステップの説明
  { speaker: 'doctor', text: 'これから口の中を拝見して、必要に応じてレントゲン撮影を行います。その後、診断と治療方針をご説明します。よろしいでしょうか？', delay: 4500 },
  { speaker: 'patient', text: 'はい、お願いします。', delay: 2000 },
  { speaker: 'doctor', text: 'それでは、診察台を倒させていただきますね。', delay: 2500 },
];

// 短縮版（練習用）
export const shortImprovedDemoDialogues: DemoDialogue[] = [
  // 導入
  { speaker: 'doctor', text: 'こんにちは。歯科医師の田中です。', delay: 2000 },
  { speaker: 'patient', text: 'こんにちは。よろしくお願いします。', delay: 2000 },
  { speaker: 'doctor', text: 'お名前を確認させてください。', delay: 2000 },
  { speaker: 'patient', text: '山田太郎です。', delay: 2000 },
  { speaker: 'doctor', text: 'これから症状についてお伺いします。よろしいでしょうか？', delay: 3000 },
  { speaker: 'patient', text: 'はい。', delay: 1500 },

  // 主訴
  { speaker: 'doctor', text: '今日はどうされましたか？', delay: 2000 },
  { speaker: 'patient', text: '歯が痛くて来ました。', delay: 2000 },
  { speaker: 'doctor', text: 'いつから痛みますか？', delay: 2000 },
  { speaker: 'patient', text: '3日前からです。', delay: 2000 },

  // 生活習慣
  { speaker: 'doctor', text: '歯磨きは1日何回されていますか？', delay: 2500 },
  { speaker: 'patient', text: '朝と夜の2回です。', delay: 2000 },

  // 心理社会的側面
  { speaker: 'doctor', text: '治療について何かご希望はありますか？', delay: 2500 },
  { speaker: 'patient', text: 'できるだけ歯を残したいです。', delay: 2500 },

  // 締めくくり
  { speaker: 'doctor', text: '他に気になることはありませんか？', delay: 2500 },
  { speaker: 'patient', text: '特にありません。', delay: 2000 },
  { speaker: 'doctor', text: 'それでは診察させていただきます。', delay: 2500 },
  { speaker: 'patient', text: 'お願いします。', delay: 2000 },
];