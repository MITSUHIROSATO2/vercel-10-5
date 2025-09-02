# Vercel Blob Storage 使用ガイド

## Vercel Blob Storageとは
Vercel Blob Storageは、大容量ファイル（画像、動画、3Dモデルなど）を保存・配信するためのオブジェクトストレージサービスです。

## セットアップ手順

### 1. Vercel CLIのインストール

```bash
npm install -g vercel
```

### 2. Vercelにログイン

```bash
vercel login
```

### 3. プロジェクトをVercelにリンク

プロジェクトのルートディレクトリで実行：

```bash
vercel link
```

### 4. Vercel Blob Storageを有効化

1. [Vercelダッシュボード](https://vercel.com/dashboard)にアクセス
2. プロジェクトを選択
3. "Storage"タブをクリック
4. "Create Database"をクリック
5. "Blob"を選択
6. データベース名を入力（例：`dental-ai-models`）
7. "Create"をクリック

### 5. @vercel/blobパッケージをインストール

```bash
npm install @vercel/blob
```

### 6. GLBファイルをアップロード

#### 方法1: Vercel CLIを使用（推奨）

```bash
# Vercel Blob Storageにファイルをアップロード
npx vercel blob upload public/models/成人男性.glb --project your-project-name
npx vercel blob upload public/models/少年アバター.glb --project your-project-name
npx vercel blob upload public/models/少年改アバター.glb --project your-project-name
npx vercel blob upload public/models/Hayden_059d-NO-GUI.glb --project your-project-name
```

#### 方法2: プログラマティックにアップロード

`scripts/upload-models.js`を作成：

```javascript
const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

async function uploadModels() {
  const models = [
    '成人男性.glb',
    '少年アバター.glb',
    '少年改アバター.glb',
    'Hayden_059d-NO-GUI.glb'
  ];

  for (const modelName of models) {
    const filePath = path.join(__dirname, '../public/models', modelName);
    const file = fs.readFileSync(filePath);
    
    const { url } = await put(modelName, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    
    console.log(`Uploaded ${modelName} to: ${url}`);
  }
}

uploadModels().catch(console.error);
```

実行：
```bash
BLOB_READ_WRITE_TOKEN=your_token node scripts/upload-models.js
```

### 7. 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定：

```bash
# Blob Storageトークン（自動生成される）
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxx

# アップロードしたモデルのURL
NEXT_PUBLIC_MODEL_ADULT=https://your-blob-store.public.blob.vercel-storage.com/成人男性.glb
NEXT_PUBLIC_MODEL_BOY=https://your-blob-store.public.blob.vercel-storage.com/少年アバター.glb
NEXT_PUBLIC_MODEL_BOY_IMPROVED=https://your-blob-store.public.blob.vercel-storage.com/少年改アバター.glb
NEXT_PUBLIC_MODEL_FEMALE=https://your-blob-store.public.blob.vercel-storage.com/Hayden_059d-NO-GUI.glb
```

### 8. コードの更新

`components/SimulatorInterface.tsx`を更新：

```typescript
import { getModelPath } from '@/lib/modelPaths';

// アバター選択時
const handleAvatarChange = (avatarType: string) => {
  const modelPath = getModelPath(avatarType);
  setSelectedModelPath(modelPath);
  setSelectedAvatar(avatarType);
};
```

## 料金

### 無料プラン
- 5GB のストレージ
- 月間 1TB の帯域幅

### 有料プラン（Pro）
- $20/月から
- より多くのストレージと帯域幅

## メリット

1. **高速配信**: Vercelのグローバルエッジネットワークから配信
2. **簡単な統合**: Vercelプロジェクトとシームレスに統合
3. **自動CORS設定**: CORSの問題を回避
4. **キャッシュ最適化**: 自動的にキャッシュが最適化される

## トラブルシューティング

### アップロードエラーが発生する場合

1. トークンが正しく設定されているか確認：
```bash
vercel env pull
cat .env.local | grep BLOB
```

2. ファイルサイズ制限を確認（最大500MB）

### URLが404を返す場合

1. Blob Storageが有効になっているか確認
2. アップロードが成功したか確認：
```bash
npx vercel blob list
```

### CORSエラーが発生する場合

`vercel.json`に以下を追加：

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

## 実装例

```typescript
// lib/modelPaths.ts
export const getModelPath = (modelType: string): string => {
  // Blob Storage URLを環境変数から取得
  const urls = {
    adult: process.env.NEXT_PUBLIC_MODEL_ADULT,
    boy: process.env.NEXT_PUBLIC_MODEL_BOY,
    boy_improved: process.env.NEXT_PUBLIC_MODEL_BOY_IMPROVED,
    female: process.env.NEXT_PUBLIC_MODEL_FEMALE
  };
  
  // 環境変数が設定されていればBlob Storage URLを使用
  if (urls[modelType]) {
    return urls[modelType];
  }
  
  // フォールバック：ローカルファイル
  const localPaths = {
    adult: '/models/成人男性.glb',
    boy: '/models/少年アバター.glb',
    boy_improved: '/models/少年改アバター.glb',
    female: '/models/Hayden_059d-NO-GUI.glb'
  };
  
  return localPaths[modelType];
};
```

## まとめ

Vercel Blob Storageを使用することで、大容量のGLBファイルを確実にホスティングし、高速に配信できます。これにより、Git LFSの問題やファイルサイズ制限を回避できます。