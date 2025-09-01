import * as THREE from 'three';

/**
 * マッピング設定の型定義
 */
interface TextureMapping {
  patterns: string[];
  excludePatterns?: string[];
  diffuse?: string;
  normal?: string;
  opacity?: string;
  color?: number;
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  alphaTest?: number;
  opacity_value?: number;
  useTexture?: boolean;
  visible?: boolean;
  emissive?: number;
  emissiveIntensity?: number;
}

/**
 * テクスチャマッピングの定義
 */
const TEXTURE_MAPPINGS: { [key: string]: TextureMapping } = {
  // ティアライン（涙腺）を非表示
  tearline: {
    patterns: ['tearline', 'tear'],
    excludePatterns: ['lacrimal'],
    visible: false,  // 非表示
    useTexture: false
  },
  // 涙腺（目頭のピンク部分）も非表示
  lacrimal: {
    patterns: ['lacrimal', 'caruncle'],
    visible: false,  // 非表示
    useTexture: false
  },
  // 肌関連
  skin_head: {
    patterns: ['skin_head', 'nug_skin_head', 'head', 'face'],
    diffuse: 'Std_Skin_Head_Pbr_Diffuse.jpg',
    normal: 'Std_Skin_Head_Pbr_Normal.png',
    useTexture: false, // 現在は色のみ使用
    color: 0xc08870,
    roughness: 0.45
  },
  skin_body: {
    patterns: ['skin_body', 'nug_skin_body', 'body'],
    diffuse: 'Std_Skin_Body_Pbr_Diffuse.jpg',
    normal: 'Std_Skin_Body_Pbr_Normal.png',
    roughness: 0.5
  },
  skin_arm: {
    patterns: ['skin_arm', 'nug_skin_arm', 'arm'],
    diffuse: 'Std_Skin_Arm_Pbr_Diffuse.jpg',
    normal: 'Std_Skin_Arm_Pbr_Normal.png',
    roughness: 0.5
  },
  skin_leg: {
    patterns: ['skin_leg', 'nug_skin_leg', 'leg'],
    diffuse: 'Std_Skin_Leg_Pbr_Diffuse.jpg',
    normal: 'Std_Skin_Leg_Pbr_Normal.png',
    roughness: 0.5
  },
  // 目（左右別々のテクスチャを適用）
  eye_right: {
    patterns: ['nug_eye_r', 'eye_r'],
    excludePatterns: ['occlusion', 'onuglusion', 'cornea', 'base', 'cc_base'],
    diffuse: 'Std_Eye_R_Pbr_Diffuse.jpg',
    roughness: 0.2,
    metalness: 0.0,
    useTexture: true
  },
  eye_left: {
    patterns: ['nug_eye_l', 'eye_l'],
    excludePatterns: ['occlusion', 'onuglusion', 'cornea', 'base', 'cc_base'],
    diffuse: 'Std_Eye_L_Pbr_Diffuse.jpg',
    roughness: 0.2,
    metalness: 0.0,
    useTexture: true
  },
  // NUG_Base_Eye メッシュ用 - 非表示にする
  base_eye: {
    patterns: ['nug_base_eye'],
    excludePatterns: ['occlusion', 'onuglusion', 'cornea'],
    visible: false,  // 非表示（白い部分の原因）
    useTexture: false
  },
  // オクルージョン（影）- 非表示
  eye_occlusion: {
    patterns: ['occlusion', 'onuglusion'],
    visible: false,  // 非表示
    useTexture: false
  },
  // 角膜（透明）
  cornea: {
    patterns: ['cornea'],
    visible: false,  // 非表示にする
    useTexture: false
  },
  // CC_Base メッシュ - 非表示
  cc_base: {
    patterns: ['cc_base'],
    visible: false,  // 非表示
    useTexture: false
  },
  // 髪
  hair: {
    patterns: ['hair'],
    excludePatterns: ['eyelash', 'eyebrow'],
    color: 0x1a1511,
    roughness: 0.7,
    useTexture: false
  },
  eyelash: {
    patterns: ['eyelash', 'nug_eyelash'],
    visible: false,  // 非表示
    useTexture: false
  },
  eyebrow: {
    patterns: ['eyebrow'],
    color: 0x1a1511,
    roughness: 0.7,
    useTexture: false
  },
  // 口
  teeth_upper: {
    patterns: ['upper_teeth', 'nug_upper_teeth'],
    diffuse: 'Std_Upper_Teeth_Pbr_Diffuse.png',
    roughness: 0.1,
    metalness: 0.05,
    color: 0xffffff, // 真っ白
    emissive: 0xffffff, // 発光色も白
    emissiveIntensity: 0.1 // わずかに発光
  },
  teeth_lower: {
    patterns: ['lower_teeth', 'nug_lower_teeth'],
    diffuse: 'Std_Lower_Teeth_Pbr_Diffuse.png',
    roughness: 0.1,
    metalness: 0.05,
    color: 0xffffff, // 真っ白
    emissive: 0xffffff, // 発光色も白
    emissiveIntensity: 0.1 // わずかに発光
  },
  tongue: {
    patterns: ['tongue', 'nug_tongue'],
    diffuse: 'Std_Tongue_Pbr_Diffuse.jpg',
    normal: 'Std_Tongue_Pbr_Normal.png'
  },
  lip: {
    patterns: ['lip', 'mouth'],
    color: 0x8b4d48,
    roughness: 0.35,
    useTexture: false
  },
  // 服装
  shirt: {
    patterns: ['shirt'],
    diffuse: 'Fit_shirts_Pbr_Diffuse.jpg',
    normal: 'Fit_shirts_Pbr_Normal.jpg'
  },
  pants: {
    patterns: ['pant', 'pants'],
    diffuse: 'Pants_Pbr_Diffuse.jpg',
    normal: 'Pants_Pbr_Normal.jpg'
  },
  shoes: {
    patterns: ['shoe'],
    diffuse: 'Boat_Shoes_Pbr_Diffuse.jpg',
    normal: 'Boat_Shoes_Pbr_Normal.jpg'
  },
  // その他
  nails: {
    patterns: ['nail'],
    diffuse: 'Std_Nails_Pbr_Diffuse.png',
    normal: 'Std_Nails_Pbr_Normal.png'
  }
};

/**
 * マテリアル名またはメッシュ名から適切なマッピングを見つける
 */
function findMapping(matName: string, meshName: string) {
  const lowerMatName = matName.toLowerCase();
  const lowerMeshName = meshName.toLowerCase();
  
  for (const [key, mapping] of Object.entries(TEXTURE_MAPPINGS)) {
    // 除外パターンをチェック
    if (mapping.excludePatterns) {
      const excluded = mapping.excludePatterns.some(pattern => 
        lowerMatName.includes(pattern) || lowerMeshName.includes(pattern)
      );
      if (excluded) continue;
    }
    
    // パターンマッチング
    const matched = mapping.patterns.some(pattern => 
      lowerMatName.includes(pattern) || lowerMeshName.includes(pattern)
    );
    
    if (matched) {
      return { key, mapping };
    }
  }
  
  return null;
}

/**
 * 改善版：ClassicMan.glbにテクスチャを適用する
 */
export async function applyClassicManTexturesV2(scene: THREE.Object3D) {
  // console.log('=== ClassicMan V2 テクスチャ適用開始 ===');
  
  const textureLoader = new THREE.TextureLoader();
  const basePath = '/models/ClassicMan.fbm/';
  
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
  const loadTexture = async (filename: string): Promise<THREE.Texture> => {
    if (textureCache[filename]) {
      return textureCache[filename];
    }
    
    return new Promise((resolve, reject) => {
      textureLoader.load(
        basePath + filename,
        (texture) => {
          if (filename.includes('Diffuse')) {
            texture.colorSpace = THREE.SRGBColorSpace;
          }
          textureCache[filename] = texture;
          // console.log(`✓ テクスチャ読み込み: ${filename}`);
          resolve(texture);
        },
        undefined,
        (error) => {
          console.error(`✗ テクスチャ読み込み失敗: ${filename}`, error);
          stats.errors++;
          reject(error);
        }
      );
    });
  };
  
  // 処理するプロミスの配列
  const processPromises: Promise<void>[] = [];
  
  // 最初にすべてのメッシュを表示状態にする（後で特定のメッシュを非表示にする）
  scene.traverse((child: any) => {
    if (child.isMesh) {
      child.visible = true;
    }
  });
  
  // メイン処理
  scene.traverse((child: any) => {
    if (!child.isMesh) return;
    
    stats.totalMeshes++;
    const meshName = child.name;
    // console.log(`\n処理中: ${meshName}`);
    
    // 目関連のメッシュを特別にログ
    if (meshName.toLowerCase().includes('eye') || 
        meshName.toLowerCase().includes('cornea') || 
        meshName.toLowerCase().includes('sclera') ||
        meshName.toLowerCase().includes('iris') ||
        meshName.toLowerCase().includes('pupil')) {
      // console.log(`👁️ 目関連メッシュ検出: ${meshName}`);
    }
    
    // マテリアルの配列化
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    
    materials.forEach((material: THREE.Material, index: number) => {
      if (!material) return;
      
      const matName = material.name || '';
      // console.log(`  マテリアル: ${matName}`);
      
      // マッピングを検索
      const result = findMapping(matName, meshName);
      
      if (result) {
        const { key, mapping } = result;
        // console.log(`    → マッピング: ${key}`);
        
        // visibleプロパティがfalseの場合、メッシュを非表示にする
        if (mapping.visible === false) {
          child.visible = false;
          // console.log(`    → 非表示設定: ${meshName}`);
          return;
        }
        
        // 新しいマテリアルを作成
        const newMat = new THREE.MeshStandardMaterial({
          name: material.name,
          side: THREE.DoubleSide
        });
        
        const promise = (async () => {
          try {
            // 色のみ使用する場合
            if (mapping.useTexture === false) {
              if (mapping.color) {
                newMat.color = new THREE.Color(mapping.color);
              }
              if (mapping.roughness !== undefined) {
                newMat.roughness = mapping.roughness;
              }
              // console.log(`      色設定: ${mapping.color?.toString(16)}`);
            }
            // テクスチャを使用する場合
            else {
              if (mapping.diffuse) {
                newMat.map = await loadTexture(mapping.diffuse);
                stats.texturesApplied++;
              }
              if (mapping.normal) {
                newMat.normalMap = await loadTexture(mapping.normal);
              }
              // 色が指定されている場合は適用（歯を白くするため）
              if (mapping.color) {
                newMat.color = new THREE.Color(mapping.color);
              }
              if (mapping.opacity && typeof mapping.opacity === 'string') {
                const opacityMap = await loadTexture(mapping.opacity);
                newMat.alphaMap = opacityMap;
              }
            }
            
            // その他のプロパティ
            if (mapping.transparent) {
              newMat.transparent = true;
            }
            if (mapping.alphaTest) {
              newMat.alphaTest = mapping.alphaTest;
            }
            if (mapping.opacity_value !== undefined) {
              newMat.opacity = mapping.opacity_value;
            }
            if (mapping.roughness !== undefined) {
              newMat.roughness = mapping.roughness;
            }
            if (mapping.metalness !== undefined) {
              newMat.metalness = mapping.metalness;
            }
            // emissive（発光）プロパティ
            if (mapping.emissive) {
              newMat.emissive = new THREE.Color(mapping.emissive);
            }
            if (mapping.emissiveIntensity !== undefined) {
              newMat.emissiveIntensity = mapping.emissiveIntensity;
            }
            
            // マテリアルを置き換え
            if (Array.isArray(child.material)) {
              child.material[index] = newMat;
            } else {
              child.material = newMat;
            }
            
            newMat.needsUpdate = true;
            stats.processedMeshes++;
            
          } catch (error) {
            console.error(`    エラー: ${error}`);
            stats.errors++;
            // フォールバック
            newMat.color = new THREE.Color(0xc08870);
            newMat.roughness = 0.5;
          }
        })();
        
        processPromises.push(promise);
      } else {
        // console.log(`    → マッピングなし（デフォルト肌色を適用）`);
        
        // デフォルトマテリアル
        const newMat = new THREE.MeshStandardMaterial({
          name: material.name,
          color: new THREE.Color(0xc08870),
          roughness: 0.5,
          side: THREE.DoubleSide
        });
        
        if (Array.isArray(child.material)) {
          child.material[index] = newMat;
        } else {
          child.material = newMat;
        }
        
        newMat.needsUpdate = true;
      }
    });
  });
  
  // すべての処理を待つ
  await Promise.all(processPromises);
  
  // 最後に不要なメッシュを非表示にする
  scene.traverse((child: any) => {
    if (!child.isMesh) return;
    
    const meshName = child.name.toLowerCase();
    
    // ヒゲを非表示
    if (meshName.includes('beard') || meshName.includes('mustache') || 
        meshName.includes('goatee') || meshName.includes('stubble')) {
      child.visible = false;
      // console.log(`非表示（後処理）: ${child.name}`);
    }
    
    // ティアライン、涙腺、まつ毛、角膜、オクルージョンを非表示
    if (meshName.includes('tearline') || meshName.includes('lacrimal') || 
        meshName.includes('caruncle') || meshName.includes('eyelash') || 
        meshName.includes('lash') || meshName.includes('cornea') ||
        meshName.includes('occlusion') || meshName.includes('onuglusion')) {
      child.visible = false;
      // console.log(`目周辺メッシュを非表示（後処理）: ${child.name}`);
    }
    
    // NUG_Base_Eye メッシュを全て非表示（白い部分の原因）
    if (meshName.includes('nug_base_eye')) {
      child.visible = false;
      // console.log(`NUG_Base_Eye を非表示（後処理）: ${child.name}`);
    }
    
    // CC_Base メッシュも非表示
    if (meshName.includes('cc_base')) {
      child.visible = false;
      // console.log(`CC_Base を非表示（後処理）: ${child.name}`);
    }
  });
  
  // 統計情報を出力
  // console.log('\n=== 適用結果 ===');
  // console.log(`総メッシュ数: ${stats.totalMeshes}`);
  // console.log(`処理済み: ${stats.processedMeshes}`);
  // console.log(`テクスチャ適用: ${stats.texturesApplied}`);
  // console.log(`エラー: ${stats.errors}`);
  // 
  // console.log('=== ClassicMan V2 テクスチャ適用完了 ===');
}