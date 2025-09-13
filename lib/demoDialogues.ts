// デモンストレーション用の医療面接対話データ

export interface DemoDialogue {
  speaker: 'doctor' | 'patient';
  text: string;
  delay?: number; // 次の発話までの待ち時間（ミリ秒）
}

export const demoDialogues: DemoDialogue[] = [
  // 導入
  { speaker: 'doctor', text: 'こんにちは。歯科医師の田中です。', delay: 2000 },
  { speaker: 'patient', text: 'こんにちは。よろしくお願いします。', delay: 2000 },
  { speaker: 'doctor', text: 'お名前を確認させていただけますか？', delay: 2000 },
  { speaker: 'patient', text: '山田太郎です。', delay: 2000 },
  { speaker: 'doctor', text: '生年月日も教えていただけますか？', delay: 2000 },
  { speaker: 'patient', text: '1990年5月15日生まれです。', delay: 2500 },
  
  // 主訴
  { speaker: 'doctor', text: '今日はどうされましたか？', delay: 2000 },
  { speaker: 'patient', text: '右下の奥歯が痛くて来ました。', delay: 2500 },
  
  // 現病歴（OPQRST）
  { speaker: 'doctor', text: 'いつから痛みますか？', delay: 2000 },
  { speaker: 'patient', text: '3日前からです。', delay: 2000 },
  { speaker: 'doctor', text: 'もう少し詳しく教えていただけますか？', delay: 2000 },
  { speaker: 'patient', text: '木曜日の夕方、食事中に突然痛み始めました。', delay: 3000 },
  
  { speaker: 'doctor', text: 'どんな時に痛みますか？', delay: 2000 },
  { speaker: 'patient', text: '冷たいものを飲むと痛みます。', delay: 2500 },
  { speaker: 'doctor', text: '他に痛む時はありますか？', delay: 2000 },
  { speaker: 'patient', text: '噛む時も痛いです。', delay: 2000 },
  
  { speaker: 'doctor', text: 'どのような痛みですか？', delay: 2000 },
  { speaker: 'patient', text: 'ズキズキする痛みです。', delay: 2000 },
  { speaker: 'doctor', text: 'もう少し詳しく教えてください。', delay: 2000 },
  { speaker: 'patient', text: '脈打つような、うずくような痛みです。', delay: 2500 },
  
  { speaker: 'doctor', text: '痛みはどこですか？', delay: 2000 },
  { speaker: 'patient', text: '右下の奥歯です。', delay: 2000 },
  { speaker: 'doctor', text: '痛みは他の場所に広がりますか？', delay: 2000 },
  { speaker: 'patient', text: '頬の方まで痛みが響きます。', delay: 2500 },
  
  { speaker: 'doctor', text: 'どのくらい痛いですか？10段階で言うと？', delay: 2500 },
  { speaker: 'patient', text: '8くらいです。夜も眠れないくらい痛いです。', delay: 3000 },
  
  { speaker: 'doctor', text: '痛み止めは飲みましたか？', delay: 2000 },
  { speaker: 'patient', text: '市販の鎮痛薬を飲みましたが、あまり効きませんでした。', delay: 3000 },
  
  // 既往歴・アレルギー
  { speaker: 'doctor', text: '持病はありますか？', delay: 2000 },
  { speaker: 'patient', text: '高血圧があります。', delay: 2000 },
  { speaker: 'doctor', text: '他にはありますか？', delay: 2000 },
  { speaker: 'patient', text: 'あと、糖尿病もあります。', delay: 2000 },
  
  { speaker: 'doctor', text: 'お薬は何か飲んでいますか？', delay: 2000 },
  { speaker: 'patient', text: '血圧の薬を飲んでいます。', delay: 2000 },
  { speaker: 'doctor', text: '薬の名前はわかりますか？', delay: 2000 },
  { speaker: 'patient', text: 'えーと、アムロジピンだったと思います。', delay: 2500 },
  
  { speaker: 'doctor', text: 'アレルギーはありますか？', delay: 2000 },
  { speaker: 'patient', text: 'ペニシリンで蕁麻疹が出たことがあります。', delay: 2500 },
  
  // 歯科既往歴
  { speaker: 'doctor', text: '以前に歯の治療を受けたことはありますか？', delay: 2500 },
  { speaker: 'patient', text: '10年前に親知らずを抜きました。', delay: 2500 },
  { speaker: 'doctor', text: 'その時は問題ありませんでしたか？', delay: 2000 },
  { speaker: 'patient', text: '麻酔が効きにくくて追加してもらいました。', delay: 2500 },
  
  // 心理社会的側面
  { speaker: 'doctor', text: 'この痛みで日常生活で困っていることはありますか？', delay: 3000 },
  { speaker: 'patient', text: '仕事に集中できなくて困っています。', delay: 2500 },
  { speaker: 'doctor', text: '心配なことはありますか？', delay: 2000 },
  { speaker: 'patient', text: '抜歯になるんじゃないかと心配です。', delay: 2500 },
  { speaker: 'doctor', text: '治療についてのご希望はありますか？', delay: 2500 },
  { speaker: 'patient', text: 'できれば歯を残したいです。', delay: 2000 },
  
  // 締めくくり
  { speaker: 'doctor', text: '他に伝えたいことはありますか？', delay: 2000 },
  { speaker: 'patient', text: 'そういえば、歯ぐきから血も出ます。', delay: 2500 },
  { speaker: 'doctor', text: 'わかりました。それでは診察させていただきますね。', delay: 3000 },
  { speaker: 'patient', text: 'はい、お願いします。', delay: 2000 },
];

// ランダムな短縮版デモ（練習用）
export const shortDemoDialogues: DemoDialogue[] = [
  { speaker: 'doctor', text: 'こんにちは。今日はどうされましたか？', delay: 2500 },
  { speaker: 'patient', text: '歯が痛くて来ました。', delay: 2000 },
  { speaker: 'doctor', text: 'いつからですか？', delay: 2000 },
  { speaker: 'patient', text: '3日前からです。', delay: 2000 },
  { speaker: 'doctor', text: 'どんな時に痛みますか？', delay: 2000 },
  { speaker: 'patient', text: '冷たいものを飲むと痛みます。', delay: 2500 },
  { speaker: 'doctor', text: 'どのような痛みですか？', delay: 2000 },
  { speaker: 'patient', text: 'ズキズキする痛みです。', delay: 2000 },
  { speaker: 'doctor', text: 'わかりました。診察させていただきますね。', delay: 2500 },
  { speaker: 'patient', text: 'お願いします。', delay: 2000 },
];