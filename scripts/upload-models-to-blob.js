#!/usr/bin/env node

/**
 * Vercel Blob StorageにGLBモデルをアップロードするスクリプト
 * 
 * 使用方法:
 * 1. Vercelプロジェクトで Blob Storage を有効化
 * 2. BLOB_READ_WRITE_TOKEN を環境変数に設定
 * 3. このスクリプトを実行: node scripts/upload-models-to-blob.js
 */

const { put, list } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

// 環境変数のチェック
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('❌ エラー: BLOB_READ_WRITE_TOKEN が設定されていません');
  console.log('\n設定方法:');
  console.log('1. Vercelダッシュボードでプロジェクトを開く');
  console.log('2. "Storage" タブをクリック');
  console.log('3. Blob Storageを作成または選択');
  console.log('4. トークンをコピー');
  console.log('5. 以下のコマンドで環境変数を設定:');
  console.log('   export BLOB_READ_WRITE_TOKEN="your_token_here"');
  console.log('6. このスクリプトを再実行');
  process.exit(1);
}

async function uploadModels() {
  const modelsDir = path.join(__dirname, '../public/models');
  
  // アップロードするモデルファイル
  const models = [
    { file: '成人男性.glb', name: 'adult' },
    { file: '少年アバター.glb', name: 'boy' },
    { file: '少年改アバター.glb', name: 'boy_improved' },
    { file: 'Hayden_059d-NO-GUI.glb', name: 'female' }
  ];
  
  console.log('🚀 Vercel Blob Storageへのアップロードを開始します...\n');
  
  const uploadedUrls = {};
  
  for (const model of models) {
    const filePath = path.join(modelsDir, model.file);
    
    // ファイルの存在確認
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ${model.file} が見つかりません。スキップします。`);
      continue;
    }
    
    const stats = fs.statSync(filePath);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log(`📦 ${model.file} をアップロード中... (${fileSizeMB} MB)`);
    
    try {
      // ファイルを読み込み
      const fileBuffer = fs.readFileSync(filePath);
      
      // Blob Storageにアップロード
      const blob = await put(model.file, fileBuffer, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: 'model/gltf-binary',
      });
      
      uploadedUrls[model.name] = blob.url;
      console.log(`✅ ${model.file} のアップロード完了`);
      console.log(`   URL: ${blob.url}\n`);
      
    } catch (error) {
      console.error(`❌ ${model.file} のアップロードに失敗しました:`, error.message);
      
      if (error.message.includes('rate limit')) {
        console.log('   💡 レート制限に達しました。少し待ってから再試行してください。');
      } else if (error.message.includes('storage limit')) {
        console.log('   💡 ストレージ容量が不足しています。Vercelプランをアップグレードしてください。');
      }
    }
  }
  
  // 環境変数の設定方法を表示
  if (Object.keys(uploadedUrls).length > 0) {
    console.log('\n✨ アップロード完了！\n');
    console.log('以下の環境変数をVercelダッシュボードで設定してください:\n');
    console.log('```');
    
    if (uploadedUrls.adult) {
      console.log(`NEXT_PUBLIC_MODEL_ADULT=${uploadedUrls.adult}`);
    }
    if (uploadedUrls.boy) {
      console.log(`NEXT_PUBLIC_MODEL_BOY=${uploadedUrls.boy}`);
    }
    if (uploadedUrls.boy_improved) {
      console.log(`NEXT_PUBLIC_MODEL_BOY_IMPROVED=${uploadedUrls.boy_improved}`);
    }
    if (uploadedUrls.female) {
      console.log(`NEXT_PUBLIC_MODEL_FEMALE=${uploadedUrls.female}`);
    }
    
    console.log('```');
    console.log('\n設定方法:');
    console.log('1. Vercelダッシュボードでプロジェクトを開く');
    console.log('2. "Settings" → "Environment Variables" に移動');
    console.log('3. 上記の環境変数を追加');
    console.log('4. デプロイを再実行');
  }
  
  // 既存のBlobをリスト表示
  try {
    console.log('\n📋 現在のBlob Storage内のファイル:');
    const { blobs } = await list({
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    
    blobs.forEach(blob => {
      const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
      console.log(`  - ${blob.pathname} (${sizeMB} MB)`);
    });
  } catch (error) {
    console.log('Blob一覧の取得に失敗しました:', error.message);
  }
}

// メイン処理
uploadModels().catch(error => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
});