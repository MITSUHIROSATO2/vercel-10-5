#!/usr/bin/env node

/**
 * Vercel Blob Storage内のファイルURLを一覧表示
 */

const { list } = require('@vercel/blob');

async function listBlobUrls() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN が設定されていません');
    process.exit(1);
  }

  try {
    const { blobs } = await list({
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log('📋 Blob Storage内のGLBファイルとURL:\n');
    
    const glbFiles = blobs.filter(blob => blob.pathname.endsWith('.glb'));
    
    glbFiles.forEach(blob => {
      const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
      console.log(`📁 ${blob.pathname} (${sizeMB} MB)`);
      console.log(`   URL: ${blob.url}\n`);
    });

    console.log('\n🔧 Vercelの環境変数として設定してください:\n');
    console.log('```');
    
    const adultBlob = glbFiles.find(b => b.pathname === '成人男性.glb');
    const boyBlob = glbFiles.find(b => b.pathname === '少年アバター.glb');
    const boyImprovedBlob = glbFiles.find(b => b.pathname === '少年改アバター.glb');
    const femaleBlob = glbFiles.find(b => b.pathname === 'Hayden_059d-NO-GUI.glb');
    
    if (adultBlob) {
      console.log(`NEXT_PUBLIC_MODEL_ADULT=${adultBlob.url}`);
    }
    if (boyBlob) {
      console.log(`NEXT_PUBLIC_MODEL_BOY=${boyBlob.url}`);
    }
    if (boyImprovedBlob) {
      console.log(`NEXT_PUBLIC_MODEL_BOY_IMPROVED=${boyImprovedBlob.url}`);
    }
    if (femaleBlob) {
      console.log(`NEXT_PUBLIC_MODEL_FEMALE=${femaleBlob.url}`);
    }
    
    console.log('```');
    
  } catch (error) {
    console.error('エラー:', error.message);
  }
}

listBlobUrls();