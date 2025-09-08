import * as THREE from 'three';

/**
 * 女性アバター（Hayden）のテクスチャ適用（リップシンク互換版）
 * Material置き換えを避け、morphTargets/needsUpdateを使用しない
 */
export async function applyFemaleAvatarTexturesLipSyncFixed(scene: THREE.Object3D, enableLogging: boolean = true) {
  if (enableLogging) {
    console.log('=== 女性アバター テクスチャ適用開始（リップシンク互換版） ===');
  }
  
  const textureLoader = new THREE.TextureLoader();
  textureLoader.setCrossOrigin('anonymous');
  
  const basePath = '/models/textures/';
  
  // 統計情報
  const stats = {
    totalMeshes: 0,
    processedMeshes: 0,
    texturesApplied: 0,
    errors: 0
  };
  
  // テクスチャキャッシュ
  const textureCache: { [key: string]: THREE.Texture } = {};
  
  // テクスチャを読み込み（キャッシュ付き）
  const loadTexture = async (filename: string): Promise<THREE.Texture | null> => {
    if (textureCache[filename]) {
      return textureCache[filename];
    }
    
    try {
      return new Promise((resolve) => {
        textureLoader.load(
          basePath + filename,
          (texture) => {
            if (filename.includes('diffuse') || filename.includes('alb')) {
              texture.colorSpace = THREE.SRGBColorSpace;
            }
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.flipY = false;
            
            textureCache[filename] = texture;
            stats.texturesApplied++;
            if (enableLogging) {
              console.log(`  ✓ テクスチャ読み込み: ${filename}`);
            }
            resolve(texture);
          },
          undefined,
          (error) => {
            console.warn(`  ⚠️ テクスチャ読み込み失敗: ${filename}`);
            stats.errors++;
            resolve(null);
          }
        );
      });
    } catch (error) {
      stats.errors++;
      return null;
    }
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
      color: new THREE.Color(0xffffff),
      roughness: 0.1,
      metalness: 0.05
    },
    // 舌
    'tongue': {
      map: 'tongue001.png',
      normalMap: 'tongue001bump.png',
      color: new THREE.Color(0xff6b6b),
      roughness: 0.4,
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
  
  // 処理用のプロミス配列
  const promises: Promise<void>[] = [];
  
  scene.traverse((child: any) => {
    if (!child.isMesh) return;
    
    stats.totalMeshes++;
    const meshName = child.name.toLowerCase();
    const materialName = child.material?.name || '';
    
    if (enableLogging) {
      console.log(`処理中: ${child.name} (Material: ${materialName})`);
    }
    
    // 眉毛を非表示
    if (materialName === 'Eyebrow') {
      child.visible = false;
      if (enableLogging) {
        console.log('  -> Eyebrow を非表示');
      }
      return;
    }
    
    // マテリアルの配列化
    const materialsList = Array.isArray(child.material) ? child.material : [child.material];
    
    materialsList.forEach((material: THREE.Material) => {
      if (!material) return;
      
      // MeshStandardMaterialの場合のみ処理（置き換えなし）
      if (material instanceof THREE.MeshStandardMaterial) {
        // morphTargets設定は変更しない（既存の設定を保持）
        // material.morphTargets = true; // 使用しない
        // material.morphNormals = true; // 使用しない
        
        const matName = material.name || '';
        
        // マテリアルタイプを判定
        let materialConfig = null;
        
        if (matName === 'Hayden_Skin') {
          materialConfig = materials.body;
        } else if (matName === 'Hay-Hair' || matName === 'Hay-Hair.clr') {
          materialConfig = materials.hair;
        } else if (matName === 'eye-color' || meshName.includes('eye_') && meshName.includes('color')) {
          materialConfig = materials.eye;
        } else if (matName === 'Eyelashes') {
          materialConfig = materials.eyelash;
        } else if (matName === 'Teeth') {
          materialConfig = materials.teeth;
        } else if (matName === 'Material.035' || meshName.includes('tongue')) {
          materialConfig = materials.tongue;
        } else if (matName === 'Frilly Sweater') {
          materialConfig = materials.shirt;
        } else if (matName === 'Sneakers') {
          materialConfig = materials.shoes;
        }
        
        if (materialConfig) {
          const promise = (async () => {
            try {
              // ディフューズマップ
              if (materialConfig.map) {
                const texture = await loadTexture(materialConfig.map);
                if (texture) {
                  material.map = texture;
                }
              }
              
              // ノーマルマップ
              if (materialConfig.normalMap) {
                const normalMap = await loadTexture(materialConfig.normalMap);
                if (normalMap) {
                  material.normalMap = normalMap;
                }
              }
              
              // ラフネスマップ
              if (materialConfig.roughnessMap) {
                const roughnessMap = await loadTexture(materialConfig.roughnessMap);
                if (roughnessMap) {
                  material.roughnessMap = roughnessMap;
                }
              }
              
              // アルファマップ
              if (materialConfig.alphaMap) {
                const alphaMap = await loadTexture(materialConfig.alphaMap);
                if (alphaMap) {
                  material.alphaMap = alphaMap;
                  material.transparent = true;
                  material.alphaTest = materialConfig.alphaTest || 0.1;
                }
              }
              
              // その他のプロパティ（直接設定）
              if (materialConfig.color) {
                material.color = materialConfig.color;
              }
              if (materialConfig.transparent !== undefined) {
                material.transparent = materialConfig.transparent;
              }
              if (materialConfig.opacity !== undefined) {
                material.opacity = materialConfig.opacity;
              }
              if (materialConfig.roughness !== undefined) {
                material.roughness = materialConfig.roughness;
              }
              if (materialConfig.metalness !== undefined) {
                material.metalness = materialConfig.metalness;
              }
              
              // 髪の特別な設定
              if (matName === 'Hay-Hair' || matName === 'Hay-Hair.clr' || meshName.includes('hair')) {
                material.side = THREE.DoubleSide;
                material.depthWrite = true;
                material.depthTest = true;
                child.renderOrder = 1;
              }
              
              // needsUpdateは使用しない
              // material.needsUpdate = true; // 使用しない
              
              stats.processedMeshes++;
              if (enableLogging) {
                console.log(`  ✓ テクスチャ適用: ${matName}`);
              }
              
            } catch (error) {
              if (enableLogging) {
                console.error('  マテリアル処理エラー:', error);
              }
              stats.errors++;
            }
          })();
          
          promises.push(promise);
        }
      }
    });
  });
  
  // すべてのテクスチャ読み込みを待つ
  await Promise.all(promises);
  
  // 統計情報を出力
  if (enableLogging) {
    console.log('=== テクスチャ適用結果 ===');
    console.log(`  総メッシュ数: ${stats.totalMeshes}`);
    console.log(`  処理済み: ${stats.processedMeshes}`);
    console.log(`  テクスチャ適用: ${stats.texturesApplied}`);
    console.log(`  エラー: ${stats.errors}`);
  }
  
  return Promise.resolve();
}