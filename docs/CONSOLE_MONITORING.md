# Console Monitoring with Playwright

## 概要
Playwrightを使用してブラウザコンソールログをリアルタイムで監視し、エラーやWebGLの問題を検出するツールです。

## セットアップ

1. **依存関係のインストール**
```bash
npm install --save-dev playwright @playwright/test
```

2. **Playwrightブラウザのインストール**
```bash
npm run playwright:install
```

## 使い方

### 基本的な監視
アプリケーションを起動してからコンソール監視を開始します：

```bash
# 1. アプリケーションを起動（別ターミナル）
npm run dev

# 2. コンソール監視を開始
npm run monitor
```

### アバター切り替えテスト付き監視
自動的にアバターの切り替えをテストしながら監視します：

```bash
npm run monitor:test
```

### カスタムURLの監視
```bash
node scripts/monitor-console.js http://localhost:3001
```

## 機能

### リアルタイム監視
- ✅ コンソールログ（log, info, warn, error, debug）
- ✅ ページエラー
- ✅ ネットワークエラー
- ✅ HTTPエラーレスポンス

### エラー検出
- 🎮 **WebGL問題**: Context Lost、リソースエラー
- 🎨 **Three.js問題**: ジオメトリ、マテリアル、メモリリーク
- 🌐 **API問題**: フェッチエラー、タイムアウト

### ログ出力
- **コンソール表示**: カラーコード付きリアルタイム表示
- **ファイル保存**: `logs/console-[timestamp].log`
- **サマリー生成**: `logs/console-[timestamp]-summary.json`

## ログの見方

### コンソール表示
```
[14:23:45] 📝 LOG: Model loaded successfully [app.js:123]
[14:23:46] ⚠️  WARN: Texture size is large [three.js:456]
[14:23:47] ❌ ERROR: WebGL Context Lost [canvas.js:789]
```

### ログファイル形式
```json
{
  "timestamp": "2024-01-20T14:23:45.123Z",
  "type": "error",
  "text": "WebGL Context Lost",
  "location": "[canvas.js:789]"
}
```

### サマリーファイル
```json
{
  "totalLogs": 150,
  "errors": 5,
  "warnings": 12,
  "startTime": "2024-01-20T14:20:00.000Z",
  "endTime": "2024-01-20T14:30:00.000Z",
  "errorDetails": [...]
}
```

## トラブルシューティング

### WebGLエラーの監視
WebGL関連のエラーが検出された場合、以下の情報が表示されます：

```
🎮 WebGL問題検出！
  → WebGLコンテキストが失われました
  → 解決策: Canvas の再作成またはページリロードが必要です
```

### Three.jsエラーの監視
```
🎨 Three.js問題検出！
  → リソースの解放に問題があります
  → メモリリークの可能性があります
```

## 高度な使用方法

### プログラマティックな使用
```javascript
const { ConsoleMonitor } = require('./scripts/monitor-console');

async function runTests() {
  const monitor = new ConsoleMonitor();
  await monitor.start('http://localhost:3000');

  // カスタムテストを実行
  await monitor.testAvatarSwitching();

  // 監視を停止
  await monitor.stop();
}
```

### CI/CDでの使用
```yaml
- name: Start app and monitor
  run: |
    npm run dev &
    sleep 5
    npm run monitor:test
```

## 注意事項

- ブラウザはデフォルトで表示モード（`headless: false`）で起動します
- 監視を停止するには `Ctrl+C` を押してください
- ログファイルは `logs/` ディレクトリに保存されます
- 大量のログがある場合、パフォーマンスに影響する可能性があります

## 関連ファイル

- `/scripts/monitor-console.js` - メイン監視スクリプト
- `/scripts/monitor-console.ts` - TypeScript版（オプション）
- `/playwright.config.ts` - Playwright設定
- `/logs/` - ログファイル保存先