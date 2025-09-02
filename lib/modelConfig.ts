// Model configuration with fallbacks for Vercel deployment
export const MODEL_CONFIG = {
  // Use a CDN or external URL for production if Git LFS is not working
  models: {
    adult: {
      path: '/models/成人男性.glb',
      fallbackPath: null, // Add CDN URL here if needed
      name: '成人男性'
    },
    adult_improved: {
      path: '/models/成人男性改アバター.glb',
      fallbackPath: null,
      name: '成人男性改'
    },
    boy: {
      path: '/models/少年アバター.glb',
      fallbackPath: null,
      name: '少年'
    },
    boy_improved: {
      path: '/models/少年改アバター.glb',
      fallbackPath: null,
      name: '少年改'
    }
  },
  
  // Check if we're in production and Git LFS might not be working
  getModelPath: (modelType: string): string => {
    const model = MODEL_CONFIG.models[modelType as keyof typeof MODEL_CONFIG.models];
    if (!model) {
      console.warn(`Model type ${modelType} not found, using default`);
      return MODEL_CONFIG.models.adult.path;
    }
    
    // In production, check if we should use fallback
    if (process.env.NODE_ENV === 'production' && model.fallbackPath) {
      console.log(`Using fallback path for ${modelType}`);
      return model.fallbackPath;
    }
    
    return model.path;
  },
  
  // Validate if a model file is accessible
  validateModel: async (path: string): Promise<boolean> => {
    try {
      const response = await fetch(path, { method: 'HEAD' });
      const contentType = response.headers.get('content-type');
      
      // Check if it's a binary GLB file, not a Git LFS pointer
      if (!response.ok || contentType?.includes('text')) {
        console.error(`Model at ${path} appears to be a Git LFS pointer or text file`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to validate model at ${path}:`, error);
      return false;
    }
  }
};