# Vercel デプロイメントガイド

## 重要: GLB モデルファイルについて

このアプリケーションは大容量のGLB 3Dモデルファイルを使用しており、Vercelデプロイ時に問題が発生する可能性があります。以下の手順に従って適切にデプロイしてください。

## 問題: Git LFS と Vercel

Vercelはビルド時にGit LFSファイルを自動的にダウンロードしません。これにより、GLBファイルが実際のバイナリファイルではなくテキストポインタとしてデプロイされ、以下のエラーが発生します：
- "JSON Parse error: Unexpected identifier 'version'" エラー
- モデルの読み込み失敗
- アプリケーションのクラッシュ

## ファイルサイズの問題

現在のGLBファイルサイズ：
- 成人男性.glb: 149MB
- Hayden_059d-NO-GUI.glb: 131MB  
- 少年アバター.glb: 71MB
- 少年改アバター.glb: 71MB

**Vercelの制限: 最大ファイルサイズは100MB**

## 解決策

### 推奨解決策: 外部ストレージの使用（最も確実）

ファイルサイズ制限のため、以下の方法を推奨します：

#### 1. Vercel Blob Storage を使用（推奨）

```bash
# Vercel CLIをインストール
npm i -g vercel

# Vercel Blob Storageにファイルをアップロード
vercel blob upload public/models/成人男性.glb
vercel blob upload public/models/少年アバター.glb
vercel blob upload public/models/少年改アバター.glb
```

#### 2. Cloudflare R2 または AWS S3 を使用

1. ストレージサービスにGLBファイルをアップロード
2. 公開URLを取得
3. 環境変数に設定：
   ```
   NEXT_PUBLIC_MODEL_ADULT=https://your-cdn.com/models/成人男性.glb
   NEXT_PUBLIC_MODEL_BOY=https://your-cdn.com/models/少年アバター.glb
   NEXT_PUBLIC_MODEL_BOY_IMPROVED=https://your-cdn.com/models/少年改アバター.glb
   ```

#### 3. GitHub Releases を一時的な解決策として使用

1. GitHubリポジトリのReleasesセクションに移動
2. 新しいリリースを作成
3. GLBファイルをアセットとしてアップロード
4. ダウンロードURLをコードで使用

### 代替案: モデルファイルの最適化

GLBファイルを圧縮して100MB以下にする：

```bash
# gltf-pipelineをインストール
npm install -g gltf-pipeline

# Draco圧縮を適用
gltf-pipeline -i input.glb -o output.glb -d
```

### Vercelビルド設定の更新

`vercel.json`ファイルは既に設定済みです：
```json
{
  "buildCommand": "git lfs install && git lfs pull && npm run build"
}
```

ただし、ファイルサイズの問題は解決されません。

## Verification Script

Run the Git LFS check script before deployment:

```bash
node scripts/check-git-lfs.js
```

This script will verify that all GLB files are properly downloaded and not Git LFS pointers.

## Environment Variables

Ensure these environment variables are set in Vercel:

- `OPENAI_API_KEY`: Your OpenAI API key
- `ELEVENLABS_API_KEY`: Your ElevenLabs API key (optional)
- `OPENAI_API_MODEL`: Model to use (default: gpt-4o-mini)
- `NEXT_PUBLIC_ELEVENLABS_VOICE_ID`: Voice ID for TTS (optional)

## Error Handling

The application now includes:
- Error boundaries for 3D model loading failures
- Fallback UI when models fail to load
- Graceful degradation to mock responses when API keys are missing

## Testing Deployment

After deployment, verify:
1. Models load without errors
2. Avatar displays correctly
3. No console errors about GLB parsing
4. Speech synthesis works (if configured)

## Troubleshooting

If models fail to load after deployment:

1. Check browser console for specific errors
2. Verify file sizes in Vercel's file browser
3. Ensure Git LFS is properly configured locally:
   ```bash
   git lfs install
   git lfs track "*.glb"
   git lfs pull
   ```
4. Consider using the external CDN approach for reliability