import { NextResponse } from 'next/server';

export async function GET() {
  // 環境変数の状態を確認（値は隠蔽）
  const envStatus = {
    // API Keys
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not set',
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY ? '✅ Set' : '❌ Not set',
    
    // Model URLs
    NEXT_PUBLIC_MODEL_ADULT: process.env.NEXT_PUBLIC_MODEL_ADULT ? '✅ Set' : '❌ Not set',
    NEXT_PUBLIC_MODEL_BOY: process.env.NEXT_PUBLIC_MODEL_BOY ? '✅ Set' : '❌ Not set',
    NEXT_PUBLIC_MODEL_BOY_IMPROVED: process.env.NEXT_PUBLIC_MODEL_BOY_IMPROVED ? '✅ Set' : '❌ Not set',
    NEXT_PUBLIC_MODEL_FEMALE: process.env.NEXT_PUBLIC_MODEL_FEMALE ? '✅ Set' : '❌ Not set',
    
    // CDN Settings
    NEXT_PUBLIC_USE_CDN_MODELS: process.env.NEXT_PUBLIC_USE_CDN_MODELS || 'Not set',
    NEXT_PUBLIC_MODEL_CDN_BASE: process.env.NEXT_PUBLIC_MODEL_CDN_BASE ? '✅ Set' : '❌ Not set',
    
    // Blob Storage
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN ? '✅ Set' : '❌ Not set',
    
    // Node Environment
    NODE_ENV: process.env.NODE_ENV,
    
    // Check if API keys are dummy values
    OPENAI_KEY_IS_DUMMY: process.env.OPENAI_API_KEY === 'dummy-key-for-build' ? '⚠️ Yes' : '✅ No',
    
    // Model URLs (first 50 chars only for security)
    MODEL_ADULT_URL_PREVIEW: process.env.NEXT_PUBLIC_MODEL_ADULT 
      ? process.env.NEXT_PUBLIC_MODEL_ADULT.substring(0, 50) + '...' 
      : 'Not set',
  };

  return NextResponse.json(envStatus, { status: 200 });
}