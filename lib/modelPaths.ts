// モデルパスの管理
// 環境変数が設定されている場合はCDNから、そうでない場合はローカルから読み込む

export const getModelPath = (modelType: 'adult' | 'adult_improved' | 'boy' | 'boy_improved' | 'female'): string => {
  // 環境変数からCDN URLを取得
  const cdnBase = process.env.NEXT_PUBLIC_MODEL_CDN_BASE;
  const useCdn = process.env.NEXT_PUBLIC_USE_CDN_MODELS === 'true';
  
  // 個別の環境変数からモデルURLを取得（優先）
  const envUrls = {
    adult: process.env.NEXT_PUBLIC_MODEL_ADULT,
    adult_improved: process.env.NEXT_PUBLIC_MODEL_ADULT_IMPROVED,
    boy: process.env.NEXT_PUBLIC_MODEL_BOY,
    boy_improved: process.env.NEXT_PUBLIC_MODEL_BOY_IMPROVED,
    female: process.env.NEXT_PUBLIC_MODEL_FEMALE
  };
  
  // 環境変数が設定されている場合はそれを使用
  if (envUrls[modelType]) {
    return envUrls[modelType]!;
  }
  
  // CDNベースURLが設定されている場合
  if (useCdn && cdnBase) {
    const cdnPaths = {
      adult: `${cdnBase}/成人男性.glb`,
      adult_improved: `${cdnBase}/成人男性改アバター.glb`,
      boy: `${cdnBase}/少年アバター.glb`,
      boy_improved: `${cdnBase}/少年改アバター.glb`,
      female: `${cdnBase}/Hayden_059d-NO-GUI.glb`
    };
    return cdnPaths[modelType];
  }
  
  // デフォルト：ローカルパス
  const localPaths = {
    adult: '/models/成人男性.glb',
    adult_improved: '/models/成人男性改アバター.glb',
    boy: '/models/少年アバター.glb',
    boy_improved: '/models/少年改アバター.glb',
    female: '/models/Hayden_059d-NO-GUI.glb'
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