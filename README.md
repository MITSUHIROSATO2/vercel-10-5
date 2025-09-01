# 歯科AI模擬患者シミュレーター

AIによる模擬患者と対話して診療スキルを向上させる歯科医師向けウェブアプリケーションです。

## 機能

- 🤖 OpenAI GPT-4による自然な患者応答
- 🎤 音声入力・音声出力対応（Web Speech API）
- 👤 3Dアバターによる視覚的フィードバック
- 📋 複数の診療シナリオ
- 💬 リアルタイムチャット形式の対話

## セットアップ

1. 依存関係のインストール
```bash
npm install
```

2. 環境変数の設定
`.env.local`ファイルを編集し、OpenAI APIキーを設定してください：
```
OPENAI_API_KEY=your_openai_api_key_here
```

3. 開発サーバーの起動
```bash
npm run dev
```

4. ブラウザで http://localhost:3000 を開く

## 使用方法

1. シナリオを選択
2. 「録音開始」ボタンを押して患者に話しかける
3. AIが患者として応答
4. 診療の練習を続ける

## 技術スタック

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- OpenAI API
- Three.js / React Three Fiber
- Web Speech API