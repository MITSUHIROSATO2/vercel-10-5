import * as THREE from 'three';

/**
 * 少年アバター用のテクスチャ適用
 * 少年改アバターと同じロジックを使用
 */
export async function applyBoyAvatarTextures(scene: THREE.Object3D, enableLogging: boolean = true) {
  if (enableLogging) {
    console.log('=== 少年アバター テクスチャ適用開始 ===');
  }
  
  const textureLoader = new THREE.TextureLoader();
  // Blob StorageのベースURL - 環境に応じて切り替え
  const isProduction = process.env.NODE_ENV === 'production';
  const basePath = isProduction 
    ? 'https://ayyxiwfdxbwzwqa7.public.blob.vercel-storage.com/ClassicMan.fbm/'
    : '/models/ClassicMan.fbm/';
  
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
          if (enableLogging) {
            console.log(`✓ テクスチャ読み込み: ${filename}`);
          }
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
  
  // メッシュ名から最適なテクスチャを決定
  const getTextureForMesh = (meshName: string, materialName: string) => {
    const lowerMesh = meshName.toLowerCase();
    const lowerMat = materialName.toLowerCase();
    
    // 目のマッピング（Cornea テクスチャを使用）
    if (lowerMesh.includes('nug_base_eye') && !lowerMesh.includes('onuglusion')) {
      if (lowerMat.includes('nug_eye_r') || lowerMat.includes('nug_eye_l')) {
        return { diffuse: 'Std_Cornea_R_Pbr_Diffuse.jpg', type: 'eye' };
      }
    }
    
    // コーネア（角膜）- 非表示
    if (lowerMat.includes('cornea')) {
      return { type: 'hide' };
    }
    
    // 目のオクルージョン - 非表示
    if (lowerMesh.includes('eyeonuglusion') || lowerMat.includes('occlusion')) {
      return { type: 'hide' };
    }
    
    // まつ毛 - 非表示
    if (lowerMat.includes('nug_eyelash') || lowerMat.includes('eyelash')) {
      return { type: 'hide' };
    }
    
    // ティアライン（涙腺）- 非表示
    if (lowerMat.includes('tearline') || lowerMat.includes('tear')) {
      return { type: 'hide' };
    }
    
    // 涙腺 - 非表示
    if (lowerMat.includes('lacrimal') || lowerMat.includes('caruncle')) {
      return { type: 'hide' };
    }
    
    // 眉毛
    if (lowerMesh.includes('eyebrow')) {
      return { 
        type: 'eyebrow',
        color: 0x1a1511
      };
    }
    
    // 髪
    if (lowerMesh.includes('hair') && !lowerMesh.includes('eyebrow') && !lowerMesh.includes('eyelash')) {
      return { 
        type: 'hair',
        color: 0x1a1511
      };
    }
    
    // ヒゲ（非表示）
    if (lowerMesh.includes('beard') || lowerMesh.includes('mustache') || 
        lowerMesh.includes('goatee') || lowerMesh.includes('stubble')) {
      return { type: 'hide' };
    }
    
    // 肌 - テクスチャを使用せず色のみ
    if (lowerMat.includes('nug_skin_head')) {
      return { 
        type: 'skin_head',
        color: 0xc08870
      };
    }
    if (lowerMat.includes('nug_skin_body')) {
      return { 
        type: 'skin',
        color: 0xc08870
      };
    }
    if (lowerMat.includes('nug_skin_arm')) {
      return { 
        type: 'skin',
        color: 0xc08870
      };
    }
    if (lowerMat.includes('nug_skin_leg')) {
      return { 
        type: 'skin',
        color: 0xc08870
      };
    }
    
    // 歯
    if (lowerMat.includes('nug_upper_teeth')) {
      return { diffuse: 'Std_Upper_Teeth_Pbr_Diffuse.png', type: 'teeth' };
    }
    if (lowerMat.includes('nug_lower_teeth')) {
      return { diffuse: 'Std_Lower_Teeth_Pbr_Diffuse.png', type: 'teeth' };
    }
    
    // 舌
    if (lowerMat.includes('nug_tongue')) {
      return { 
        diffuse: 'Std_Tongue_Pbr_Diffuse.jpg',
        normal: 'Std_Tongue_Pbr_Normal.png',
        type: 'tongue'
      };
    }
    
    // 爪
    if (lowerMat.includes('nug_nails')) {
      return { 
        diffuse: 'Std_Nails_Pbr_Diffuse.png',
        normal: 'Std_Nails_Pbr_Normal.png',
        type: 'nail'
      };
    }
    
    // 服
    if (lowerMesh.includes('fit_shirt')) {
      return { 
        diffuse: 'Fit_shirts_Pbr_Diffuse.jpg',
        normal: 'Fit_shirts_Pbr_Normal.jpg',
        type: 'shirt'
      };
    }
    if (lowerMesh.includes('pants')) {
      return { 
        diffuse: 'Pants_Pbr_Diffuse.jpg',
        normal: 'Pants_Pbr_Normal.jpg',
        type: 'pants'
      };
    }
    if (lowerMesh.includes('boat_shoe')) {
      return { 
        diffuse: 'Boat_Shoes_Pbr_Diffuse.jpg',
        normal: 'Boat_Shoes_Pbr_Normal.jpg',
        type: 'shoes'
      };
    }
    
    return null;
  };
  
  // メッシュを処理
  const processPromises: Promise<void>[] = [];
  
  scene.traverse((child: any) => {
    if (!child.isMesh) return;
    
    stats.totalMeshes++;
    const meshName = child.name;
    const lowerMeshName = meshName.toLowerCase();
    if (enableLogging) {
      console.log(`\n処理中: ${meshName}`);
    }
    
    // 特定のメッシュを非表示
    // ヒゲ
    if (lowerMeshName.includes('beard') || 
        lowerMeshName.includes('mustache') ||
        lowerMeshName.includes('goatee') ||
        lowerMeshName.includes('stubble')) {
      child.visible = false;
      if (enableLogging) {
        console.log(`非表示: ${meshName}`);
      }
      return;
    }
    
    // まつ毛とティアライン
    if (lowerMeshName.includes('eyelash') || lowerMeshName.includes('lash') ||
        lowerMeshName.includes('tearline') || lowerMeshName.includes('tear') ||
        lowerMeshName.includes('lacrimal') || lowerMeshName.includes('caruncle')) {
      child.visible = false;
      if (enableLogging) {
        console.log(`非表示: ${meshName}`);
      }
      return;
    }
    
    // 角膜とオクルージョン
    if (lowerMeshName.includes('cornea') ||
        lowerMeshName.includes('occlusion') || lowerMeshName.includes('onuglusion')) {
      child.visible = false;
      if (enableLogging) {
        console.log(`非表示: ${meshName}`);
      }
      return;
    }
    
    // NUG_Base_Eye は目なので表示する（ただしonuglusionは除外）
    if (lowerMeshName.includes('nug_base_eye')) {
      if (lowerMeshName.includes('onuglusion')) {
        child.visible = false;
        if (enableLogging) {
          console.log(`非表示（オクルージョン）: ${meshName}`);
        }
        return;
      }
      // 目のメッシュは表示
      child.visible = true;
      if (enableLogging) {
        console.log(`👁️ 目のメッシュを表示: ${meshName}`);
      }
    }
    
    // 髪と眉毛は必ず表示
    if (lowerMeshName.includes('hair') && !lowerMeshName.includes('eyelash')) {
      child.visible = true;
      if (enableLogging) {
        console.log(`髪/眉毛を表示: ${meshName}`);
      }
    }
    
    // 目関連のメッシュをデバッグ
    if (lowerMeshName.includes('eye') && !lowerMeshName.includes('eyebrow') && !lowerMeshName.includes('eyelash')) {
      if (enableLogging) {
        console.log(`👁️ 目関連メッシュ: ${meshName}`);
      }
    }
    
    // マテリアルの配列化
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    
    materials.forEach((material: THREE.Material, index: number) => {
      if (!material) return;
      
      const matName = material.name || '';
      if (enableLogging) {
        console.log(`  マテリアル: ${matName}`);
      }
      
      // テクスチャマッピングを取得
      const mapping = getTextureForMesh(meshName, matName);
      
      if (mapping) {
        if (enableLogging) {
          console.log(`    → タイプ: ${mapping.type}`);
        }
        
        if (mapping.type === 'hide') {
          child.visible = false;
          return;
        }
        
        // 新しいマテリアルを作成
        const newMat = new THREE.MeshStandardMaterial({
          name: material.name,
          side: THREE.DoubleSide
        });
        
        const promise = (async () => {
          try {
            // Diffuseテクスチャ
            if (mapping.diffuse) {
              newMat.map = await loadTexture(mapping.diffuse);
              stats.texturesApplied++;
            }
            
            // Normalマップ
            if (mapping.normal) {
              newMat.normalMap = await loadTexture(mapping.normal);
            }
            
            // 色の設定
            if (mapping.color) {
              newMat.color = new THREE.Color(mapping.color);
            }
            
            // タイプ別の設定
            switch (mapping.type) {
              case 'eye':
                newMat.roughness = 0.2;
                newMat.metalness = 0.0;
                break;
              case 'skin_head':
                // 顔には色のみ設定（テクスチャを使わない）
                newMat.color = new THREE.Color(0xc08870);
                newMat.roughness = 0.45;
                break;
              case 'skin':
                // 肌には色のみ設定（テクスチャを使わない）
                newMat.color = new THREE.Color(0xc08870);
                newMat.roughness = 0.5;
                break;
              case 'teeth':
                // 歯を真っ白にする
                newMat.color = new THREE.Color(0xffffff); // 純白
                newMat.emissive = new THREE.Color(0xffffff); // 発光色も白
                newMat.emissiveIntensity = 0.1; // わずかに発光させて明るくする
                newMat.roughness = 0.1; // より艶を出す
                newMat.metalness = 0.05; // わずかに金属感
                break;
              case 'hair':
                // 髪は色のみ（テクスチャなし）
                newMat.color = new THREE.Color(0x1a1511);
                newMat.roughness = 0.7;
                newMat.metalness = 0.0;
                break;
              case 'eyebrow':
                // 眉毛も色のみ
                newMat.color = new THREE.Color(0x1a1511);
                newMat.roughness = 0.7;
                newMat.metalness = 0.0;
                break;
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
        // デフォルトマテリアル
        if (enableLogging) {
          console.log(`    → デフォルト`);
        }
        
        // メッシュ名からタイプを推測
        let defaultColor = new THREE.Color(0xc08870); // 肌色
        let defaultRoughness = 0.5;
        
        // 髪の場合
        if (lowerMeshName.includes('hair') && !lowerMeshName.includes('eyebrow') && !lowerMeshName.includes('eyelash')) {
          defaultColor = new THREE.Color(0x1a1511);
          defaultRoughness = 0.7;
          if (enableLogging) {
            console.log(`    髪として処理`);
          }
        }
        // 眉毛の場合
        else if (lowerMeshName.includes('eyebrow')) {
          defaultColor = new THREE.Color(0x1a1511);
          defaultRoughness = 0.7;
          if (enableLogging) {
            console.log(`    眉毛として処理`);
          }
        }
        
        const newMat = new THREE.MeshStandardMaterial({
          name: material.name,
          color: defaultColor,
          roughness: defaultRoughness,
          side: THREE.DoubleSide
        });
        
        if (Array.isArray(child.material)) {
          child.material[index] = newMat;
        } else {
          child.material = newMat;
        }
      }
    });
  });
  
  // すべての処理を待つ
  await Promise.all(processPromises);
  
  // 統計情報を出力
  if (enableLogging) {
    console.log('\n=== 適用結果 ===');
    console.log(`総メッシュ数: ${stats.totalMeshes}`);
    console.log(`処理済み: ${stats.processedMeshes}`);
    console.log(`テクスチャ適用: ${stats.texturesApplied}`);
    console.log(`エラー: ${stats.errors}`);
    
    console.log('=== 少年アバター テクスチャ適用完了 ===');
  }
}