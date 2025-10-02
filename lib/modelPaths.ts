// モデルパスの管理
// 環境変数が設定されている場合はCDNから、そうでない場合はローカルから読み込む

// URLから改行や余分な空白を削除する関数
const cleanUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  // 改行文字とその前後の空白を完全に削除（URLの一部として結合）
  // これにより "vercel\n  -storage" が "vercel-storage" になる
  return url.replace(/[\r\n\t]+\s*/g, '').replace(/\s*[\r\n\t]+/g, '').trim();
};

export const getModelPath = (modelType: 'adult' | 'adult_improved' | 'boy' | 'boy_improved' | 'female'): string => {
  // 開発環境でローカルモデルを使用するオプション
  const useLocalInDev = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_LOCAL_MODELS === 'true';
  
  // 環境変数からCDN URLを取得（クリーニング済み）
  const cdnBase = cleanUrl(process.env.NEXT_PUBLIC_MODEL_CDN_BASE);
  const useCdn = process.env.NEXT_PUBLIC_USE_CDN_MODELS === 'true';
  
  // ローカル開発でローカルモデルを使用する場合
  if (useLocalInDev) {
    const localPaths = {
      adult: '/models/成人男性.glb',
      adult_improved: '/models/成人男性改アバター.glb',
      boy: '/models/少年アバター.glb',
      boy_improved: '/models/Baby main.glb',
      female: '/models/Mother.glb'
    };
    return localPaths[modelType];
  }
  
  // 個別の環境変数からモデルURLを取得（優先）- すべてクリーニング
  const envUrls = {
    adult: cleanUrl(process.env.NEXT_PUBLIC_MODEL_ADULT),
    adult_improved: cleanUrl(process.env.NEXT_PUBLIC_MODEL_ADULT_IMPROVED),
    boy: cleanUrl(process.env.NEXT_PUBLIC_MODEL_BOY),
    boy_improved: cleanUrl(process.env.NEXT_PUBLIC_MODEL_BOY_IMPROVED),
    female: cleanUrl(process.env.NEXT_PUBLIC_MODEL_FEMALE)
  };
  
  // 環境変数が設定されている場合はそれを使用
  if (envUrls[modelType]) {
    // console.log(`Using cleaned model URL for ${modelType}:`, envUrls[modelType]);
    return envUrls[modelType]!;
  }
  
  // CDNベースURLが設定されている場合
  if (useCdn && cdnBase) {
    const cdnPaths = {
      adult: `${cdnBase}/成人男性.glb`,
      adult_improved: `${cdnBase}/成人男性改アバター.glb`,
      boy: `${cdnBase}/少年アバター.glb`,
      boy_improved: `${cdnBase}/Baby main.glb`,
      female: `${cdnBase}/Mother.glb`
    };
    return cdnPaths[modelType];
  }
  
  // デフォルト：ローカルパス
  const localPaths = {
    adult: '/models/成人男性.glb',
    adult_improved: '/models/成人男性改アバター.glb',
    boy: '/models/少年アバター.glb',
    boy_improved: '/models/Baby main.glb',
    female: '/models/Mother.glb'
  };

  return localPaths[modelType];
};

// モデルが利用可能かチェック
export const checkModelAvailability = async (modelPath: string): Promise<boolean> => {
  try {
    const response = await fetch(modelPath, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error(`Model not available at ${modelPath}:`, error);
    return false;
  }
};
