import * as THREE from 'three';

/**
 * ClassicMan改良版のテクスチャ適用
 * JSONの分析に基づいた正確なマッピング
 */
export async function applyClassicManTexturesImproved(scene: THREE.Object3D) {
  const textureLoader = new THREE.TextureLoader();
  textureLoader.setCrossOrigin('anonymous'); // CORS設定を追加
  
  // Blob Storageのベースパスを使用（環境変数から取得）
  // Vercelの本番環境では一時的にローカルパスを使用
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
      const url = basePath + filename;
      textureLoader.load(
        url,
        (texture) => {
          if (filename.includes('Diffuse')) {
            texture.colorSpace = THREE.SRGBColorSpace;
          }
          textureCache[filename] = texture;
          // テクスチャ読み込み成功
          resolve(texture);
        },
        undefined,
        (error) => {
          // テクスチャ読み込み失敗
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
    
    // 目のマッピング（JSONに基づく）- 左右別々のテクスチャを使用
    if (lowerMesh.includes('nug_base_eye') && !lowerMesh.includes('onuglusion')) {
      if (lowerMat.includes('nug_eye_r')) {
        return { diffuse: 'Std_Eye_R_Pbr_Diffuse.jpg', type: 'eye' };
      } else if (lowerMat.includes('nug_eye_l')) {
        return { diffuse: 'Std_Eye_L_Pbr_Diffuse.jpg', type: 'eye' };
      }
    }
    
    // コーネア（角膜）
    if (lowerMat.includes('cornea')) {
      return { diffuse: 'Std_Cornea_R_Pbr_Diffuse.jpg', type: 'cornea' };
    }
    
    // 目のオクルージョン
    if (lowerMesh.includes('eyeonuglusion')) {
      if (lowerMat.includes('_r')) {
        return { diffuse: 'Std_Eye_Occlusion_R_Pbr_Diffuse.png', type: 'occlusion', transparent: true };
      } else if (lowerMat.includes('_l')) {
        return { diffuse: 'Std_Eye_Occlusion_L_Pbr_Diffuse.png', type: 'occlusion', transparent: true };
      }
    }
    
    // まつ毛 - 非表示にする
    if (lowerMat.includes('nug_eyelash') || lowerMat.includes('eyelash')) {
      return { type: 'hide' };  // 非表示
    }
    
    // ティアライン（涙腺）- 非表示にする
    if (lowerMat.includes('tearline') || lowerMat.includes('tear')) {
      return { type: 'hide' };  // 非表示
    }
    
    // 眉毛
    if (lowerMesh.includes('eyebrow')) {
      return { 
        diffuse: 'Eyebrow_Transparency_Pbr_Diffuse.jpg',
        normal: 'Eyebrow_Transparency_Pbr_Normal.png',
        type: 'eyebrow',
        color: 0x1a1511
      };
    }
    
    // 髪（髪全般をキャッチ）
    if (lowerMesh.includes('hair') && !lowerMesh.includes('eyebrow') && !lowerMesh.includes('eyelash')) {
      // テクスチャは使用せず、色のみ設定
      return { 
        type: 'hair',
        color: 0x1a1511  // ほぼ黒に近い茶色
      };
    }
    
    // ヒゲ（非表示）
    if (lowerMesh.includes('beard') || lowerMesh.includes('mustache')) {
      return { type: 'hide' };
    }
    
    // 肌 - 頭部にはテクスチャを使用しない
    if (lowerMat.includes('nug_skin_head')) {
      return { 
        // diffuse: 'Std_Skin_Head_Pbr_Diffuse.jpg', // テクスチャは使用しない
        // normal: 'Std_Skin_Head_Pbr_Normal.png',  // ノーマルマップも使用しない
        type: 'skin_head'
      };
    }
    if (lowerMat.includes('nug_skin_body')) {
      return { 
        diffuse: 'Std_Skin_Body_Pbr_Diffuse.jpg',
        normal: 'Std_Skin_Body_Pbr_Normal.png',
        type: 'skin'
      };
    }
    if (lowerMat.includes('nug_skin_arm')) {
      return { 
        diffuse: 'Std_Skin_Arm_Pbr_Diffuse.jpg',
        normal: 'Std_Skin_Arm_Pbr_Normal.png',
        type: 'skin'
      };
    }
    if (lowerMat.includes('nug_skin_leg')) {
      return { 
        diffuse: 'Std_Skin_Leg_Pbr_Diffuse.jpg',
        normal: 'Std_Skin_Leg_Pbr_Normal.png',
        type: 'skin'
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
    // 処理中: ${meshName}
    
    // ヒゲを非表示
    if (lowerMeshName.includes('beard') || 
        lowerMeshName.includes('mustache') ||
        lowerMeshName.includes('goatee') ||
        lowerMeshName.includes('stubble')) {
      child.visible = false;
      // 非表示: ${meshName}
      return;
    }
    
    // まつ毛とティアラインを非表示
    if (lowerMeshName.includes('eyelash') || lowerMeshName.includes('lash') ||
        lowerMeshName.includes('tearline') || lowerMeshName.includes('tear')) {
      child.visible = false;
      // 非表示: ${meshName}
      return;
    }
    
    // 髪の特別処理
    if (lowerMeshName.includes('hair') && !lowerMeshName.includes('eyelash') && !lowerMeshName.includes('eyebrow')) {
      // 髪を検出: ${meshName} - 茶色を適用
    }
    
    // 目関連のメッシュをデバッグ
    if (lowerMeshName.includes('eye') || lowerMeshName.includes('cornea')) {
      // 目関連メッシュ: ${meshName}
    }
    
    // マテリアルの配列化
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    
    materials.forEach((material: THREE.Material, index: number) => {
      if (!material) return;
      
      const matName = material.name || '';
      // マテリアル: ${matName}
      
      // テクスチャマッピングを取得
      const mapping = getTextureForMesh(meshName, matName);
      
      if (mapping) {
        // → タイプ: ${mapping.type}
        
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
            
            // Opacityマップ（まつ毛用）
            if ('opacity' in mapping && mapping.opacity) {
              const opacityMap = await loadTexture(mapping.opacity as string);
              newMat.alphaMap = opacityMap;
              newMat.transparent = true;
              newMat.alphaTest = 0.3;
              newMat.opacity = 0.7;
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
              case 'occlusion':
                newMat.transparent = true;
                newMat.alphaTest = 0.5;
                break;
              case 'skin_head':
                // 顔には色のみ設定（テクスチャを一切使わない）
                newMat.map = null;
                newMat.normalMap = null;
                newMat.color = new THREE.Color(0xc08870);
                newMat.roughness = 0.45;
                newMat.metalness = 0.0;
                break;
              case 'skin':
                newMat.roughness = 0.5;
                break;
              case 'teeth':
                newMat.roughness = 0.2;
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
              case 'eyelash':
                newMat.color = new THREE.Color(0x000000);  // 黒色
                newMat.roughness = 0.9;
                newMat.metalness = 0.0;
                newMat.side = THREE.DoubleSide;
                break;
              case 'tearline':
                newMat.color = new THREE.Color(0x000000);  // 黒色
                newMat.roughness = 0.9;
                newMat.metalness = 0.0;
                break;
              case 'cornea':
                newMat.transparent = true;
                newMat.opacity = 0.2;  // 角膜はほぼ透明
                newMat.roughness = 0.0;
                newMat.metalness = 0.0;
                break;
            }
            
            // 透明設定
            if (mapping.transparent) {
              newMat.transparent = true;
            }
            
            // マテリアルを置き換え
            // マテリアルを置き換え
            if (Array.isArray(child.material)) {
              child.material[index] = newMat;
            } else {
              child.material = newMat;
            }
            
            newMat.needsUpdate = true;
            stats.processedMeshes++;
            
          } catch (error) {
            // エラー: ${error}
            stats.errors++;
            // フォールバック
            newMat.color = new THREE.Color(0xc08870);
            newMat.roughness = 0.5;
          }
        })();
        
        processPromises.push(promise);
      } else {
        // デフォルトマテリアル
        // console.log(`    → デフォルト`);
        
        // メッシュ名からタイプを推測
        let defaultColor = new THREE.Color(0xc08870); // 肌色
        let defaultRoughness = 0.5;
        
        // 髪の場合
        if (lowerMeshName.includes('hair') && !lowerMeshName.includes('eyebrow') && !lowerMeshName.includes('eyelash')) {
          defaultColor = new THREE.Color(0x1a1511);
          defaultRoughness = 0.7;
          // console.log(`    髪として処理`);
        }
        // 眉毛の場合
        else if (lowerMeshName.includes('eyebrow')) {
          defaultColor = new THREE.Color(0x1a1511);
          defaultRoughness = 0.7;
          // console.log(`    眉毛として処理`);
        }
        // 目の場合
        else if (lowerMeshName.includes('eye') && !lowerMeshName.includes('eyebrow') && !lowerMeshName.includes('eyelash')) {
          // 目は特別な処理が必要かもしれない
          // console.log(`    目として処理`);
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
  
  // 統計情報
  // 総メッシュ数: ${stats.totalMeshes}
  // 処理済み: ${stats.processedMeshes}
  // テクスチャ適用: ${stats.texturesApplied}
  // エラー: ${stats.errors}
}