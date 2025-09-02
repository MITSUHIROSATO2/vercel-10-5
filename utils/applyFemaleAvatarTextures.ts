import * as THREE from 'three';

/**
 * 女性アバター（Hayden）のテクスチャ適用
 */
export async function applyFemaleAvatarTextures(scene: THREE.Object3D, enableLogging: boolean = true) {
  if (enableLogging) {
    console.log('=== 女性アバター テクスチャ適用開始 ===');
  }
  
  const textureLoader = new THREE.TextureLoader();
  // Blob StorageのベースURL - 環境に応じて切り替え
  const isProduction = process.env.NODE_ENV === 'production';
  const basePath = isProduction 
    ? 'https://ayyxiwfdxbwzwqa7.public.blob.vercel-storage.com/textures/'
    : '/models/textures/';
  
  // テクスチャキャッシュ
  const textureCache: { [key: string]: THREE.Texture } = {};
  
  // テクスチャを読み込み（キャッシュ付き）
  const loadTexture = async (filename: string): Promise<THREE.Texture> => {
    if (textureCache[filename]) {
      return textureCache[filename];
    }
    
    return new Promise((resolve, reject) => {
      textureLoader.load(
        basePath + filename,
        (texture) => {
          if (filename.includes('diffuse') || filename.includes('alb')) {
            texture.colorSpace = THREE.SRGBColorSpace;
          }
          textureCache[filename] = texture;
          if (enableLogging) {
            console.log(`✓ テクスチャ読み込み: ${filename}`);
          }
          resolve(texture);
        },
        undefined,
        (error) => {
          console.error(`✗ テクスチャ読み込み失敗: ${filename}`, error);
          reject(error);
        }
      );
    });
  };
  
  // マテリアル設定
  const materials: { [key: string]: { 
    map?: string; 
    normalMap?: string; 
    roughnessMap?: string;
    alphaMap?: string;
    alphaTest?: number;
    color?: THREE.Color;
    transparent?: boolean;
    opacity?: number;
    roughness?: number;
    metalness?: number;
  }} = {
    // 肌（Hayden_Skin マテリアル用）
    'body': {
      map: 'Hayden_skin_002-light-med.jpg',
      normalMap: 'Body_normal_0-047.png',
      roughnessMap: 'body003roughness-speckle2.png',
      roughness: 0.45,
      metalness: 0.0
    },
    // 髪
    'hair': {
      map: 'beach-blonde-fade-02.jpg',
      alphaMap: 'Imogen-Hair_opacity5.png',
      normalMap: 'Hair_normal.png',
      transparent: true,
      opacity: 1.0,
      roughness: 0.3,
      metalness: 0.0,
      alphaTest: 0.01
    },
    // 目
    'eye': {
      map: 'Eye-blue-001c.png',
      roughness: 0.1,
      metalness: 0.0
    },
    // まつ毛
    'eyelash': {
      map: 'HairStrip-B-Lash-04c.png',
      transparent: true,
      opacity: 0.9,
      roughness: 0.8,
      metalness: 0.0
    },
    // 歯
    'teeth': {
      map: 'Teeth04.png',
      roughness: 0.2,
      metalness: 0.0
    },
    // 舌
    'tongue': {
      map: 'tongue001.png',
      normalMap: 'tongue001bump.png',
      roughness: 0.8,
      metalness: 0.0
    },
    // 服（Tシャツ）
    'shirt': {
      map: 'Hayden t-shirt-alb-pink.jpg',
      normalMap: 'Hayden t-shirt-normal2.jpg',
      alphaMap: 'Hayden t-shirt-alpha1.jpg',
      transparent: true,
      roughness: 0.7,
      metalness: 0.0
    },
    // ヨガパンツ
    'pants': {
      map: 'Hayden yoga-alb-pink.jpg',
      normalMap: 'Hayden Yoga-normal3.jpg',
      roughnessMap: 'Hayden yoga-rough2.jpg',
      roughness: 0.6,
      metalness: 0.0
    },
    // タイツ
    'tights': {
      map: 'Hayden Tights-alb-tan.jpg',
      normalMap: 'Hayden Tights-normal3.jpg',
      roughness: 0.5,
      metalness: 0.0
    },
    // 靴
    'shoes': {
      map: 'Boots_alb-01-white.jpg',
      normalMap: 'Boots_normal2.jpg',
      roughnessMap: 'Boots_rough2.jpg',
      roughness: 0.4,
      metalness: 0.1
    }
  };
  
  // メッシュを処理
  const processPromises: Promise<void>[] = [];
  
  scene.traverse((child: any) => {
    if (!child.isMesh) return;
    
    const meshName = child.name.toLowerCase();
    const materialName = child.material?.name || '';
    
    if (enableLogging) {
      console.log(`処理中: ${child.name} (Material: ${child.material?.name})`);
    }
    
    // マテリアルタイプを判定（実際のマテリアル名でマッチング）
    let materialConfig = null;
    
    // マテリアル名ベースでマッチング（より正確）
    if (materialName === 'Hayden_Skin') {
      materialConfig = materials.body;
      if (enableLogging) {
        console.log('  -> Hayden_Skin マテリアルに肌テクスチャを適用');
      }
    } else if (materialName === 'Hay-Hair' || materialName === 'Hay-Hair.clr') {
      materialConfig = materials.hair;
      if (enableLogging) {
        console.log('  -> Hay-Hair マテリアルに髪テクスチャを適用');
      }
    } else if (materialName === 'eye-color' || meshName.includes('eye_') && meshName.includes('color')) {
      materialConfig = materials.eye;
      if (enableLogging) {
        console.log('  -> eye-color マテリアルに目テクスチャを適用');
      }
    } else if (materialName === 'Eyelashes') {
      materialConfig = materials.eyelash;
      if (enableLogging) {
        console.log('  -> Eyelashes マテリアルにまつ毛テクスチャを適用');
      }
    } else if (materialName === 'Teeth') {
      materialConfig = materials.teeth;
      if (enableLogging) {
        console.log('  -> Teeth マテリアルに歯テクスチャを適用');
      }
    } else if (materialName === 'Material.035' || meshName.includes('tongue')) {
      materialConfig = materials.tongue;
      if (enableLogging) {
        console.log('  -> Material.035/Tongue マテリアルに舌テクスチャを適用');
      }
    } else if (materialName === 'Frilly Sweater') {
      materialConfig = materials.shirt;
      if (enableLogging) {
        console.log('  -> Frilly Sweater マテリアルに服テクスチャを適用');
      }
    } else if (materialName === 'Sneakers') {
      materialConfig = materials.shoes;
      if (enableLogging) {
        console.log('  -> Sneakers マテリアルに靴テクスチャを適用');
      }
    } else if (materialName === 'Eyebrow') {
      // 眉毛マテリアルを非表示にする
      if (enableLogging) {
        console.log('  -> Eyebrow マテリアルを透明化');
      }
      // 眉毛を透明にして非表示にする
      const eyebrowMat = new THREE.MeshStandardMaterial({
        transparent: true,
        opacity: 0,
        visible: false
      });
      child.material = eyebrowMat;
      child.visible = false;
      return; // これ以上の処理をスキップ
    }
    
    // メッシュ名でのフォールバック（マテリアル名が不明な場合のみ）
    if (!materialConfig && !materialName) {
      if (meshName.includes('body') || meshName.includes('skin')) {
        materialConfig = materials.body;
      } else if (meshName.includes('hair') && !meshName.includes('lash')) {
        materialConfig = materials.hair;
      } else if (meshName.includes('teeth') || meshName.includes('tooth')) {
        materialConfig = materials.teeth;
      } else if (meshName.includes('tongue')) {
        materialConfig = materials.tongue;
      }
    }
    
    if (materialConfig) {
      const newMat = new THREE.MeshStandardMaterial({
        name: child.material?.name || 'female_material'
      });
      
      const promise = (async () => {
        try {
          // ディフューズマップ
          if (materialConfig.map) {
            newMat.map = await loadTexture(materialConfig.map);
          }
          
          // ノーマルマップ
          if (materialConfig.normalMap) {
            newMat.normalMap = await loadTexture(materialConfig.normalMap);
          }
          
          // ラフネスマップ
          if (materialConfig.roughnessMap) {
            newMat.roughnessMap = await loadTexture(materialConfig.roughnessMap);
          }
          
          // アルファマップ
          if (materialConfig.alphaMap) {
            newMat.alphaMap = await loadTexture(materialConfig.alphaMap);
            newMat.transparent = true;
            newMat.alphaTest = materialConfig.alphaTest || 0.1; // 設定値を使用、デフォルトは0.1
          }
          
          // その他のプロパティ
          if (materialConfig.color) {
            newMat.color = materialConfig.color;
          }
          if (materialConfig.transparent !== undefined) {
            newMat.transparent = materialConfig.transparent;
          }
          if (materialConfig.opacity !== undefined) {
            newMat.opacity = materialConfig.opacity;
          }
          if (materialConfig.roughness !== undefined) {
            newMat.roughness = materialConfig.roughness;
          }
          if (materialConfig.metalness !== undefined) {
            newMat.metalness = materialConfig.metalness;
          }
          
          // 髪の特別な設定
          if (materialName === 'Hay-Hair' || materialName === 'Hay-Hair.clr' || meshName.includes('hair')) {
            newMat.side = THREE.DoubleSide;
            newMat.depthWrite = true;
            newMat.depthTest = true;
            // 髪のレンダリング順序を調整
            child.renderOrder = 1;
          }
          
          // マテリアルを適用
          child.material = newMat;
          newMat.needsUpdate = true;
          
        } catch (error) {
          console.error(`エラー処理中: ${child.name}`, error);
          // フォールバック：基本的な肌色マテリアル
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0xfdbcb4),
            roughness: 0.5,
            metalness: 0.0
          });
        }
      })();
      
      processPromises.push(promise);
    }
  });
  
  // すべての処理を待つ
  await Promise.all(processPromises);
  
  if (enableLogging) {
    console.log('=== 女性アバター テクスチャ適用完了 ===');
  }
}