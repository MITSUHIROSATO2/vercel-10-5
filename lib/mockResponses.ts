export const mockResponsesJa = [
  // 挨拶への返答（挨拶のみ、症状は話さない）
  "こんにちは。よろしくお願いします。",
  "よろしくお願いします。",

  // 主訴（簡潔に1文で）
  "歯が痛みます。",
  "歯茎から血が出ます。",
  "詰め物が取れました。",

  // 「どちらの歯ですか？」への返答
  "右上の奥歯です。",
  "左下の親知らずです。",

  // 「いつからですか？」への返答
  "3日前からです。",
  "1週間ほど前からです。",
  "今朝からです。",

  // 「どのような痛みですか？」への返答
  "ズキズキとした痛みです。",
  "冷たいものがしみます。",
  "噛むと痛みます。",

  // 「痛みの程度は？」への返答
  "10段階で7くらいです。",
  "夜も眠れないほどです。",
  "我慢できる程度です。",

  // その他の質問への返答
  "はい、そうです。",
  "いいえ、特にありません。",
  "承知いたしました。",
  "アレルギーはありません。",
  "前回は半年前です。"
];

export const mockResponsesEn = [
  // Greetings
  "Hello. Nice to meet you.",
  "Nice to meet you.",

  // Chief complaints
  "I have a toothache.",
  "My gums are bleeding.",
  "My filling fell out.",

  // "Which tooth?" responses
  "It's my upper right molar.",
  "It's my lower left wisdom tooth.",

  // "Since when?" responses
  "Since three days ago.",
  "About a week ago.",
  "Since this morning.",

  // "What kind of pain?" responses
  "It's a throbbing pain.",
  "It's sensitive to cold.",
  "It hurts when I bite.",

  // "Pain level?" responses
  "About 7 out of 10.",
  "I can't sleep at night.",
  "It's tolerable.",

  // Other responses
  "Yes, that's right.",
  "No, nothing in particular.",
  "I understand.",
  "I have no allergies.",
  "My last visit was six months ago."
];

export function getRandomMockResponse(language: 'ja' | 'en' = 'ja'): string {
  const responses = language === 'ja' ? mockResponsesJa : mockResponsesEn;
  return responses[Math.floor(Math.random() * responses.length)];
}