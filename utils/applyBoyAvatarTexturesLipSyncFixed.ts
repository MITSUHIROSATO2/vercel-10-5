import * as THREE from 'three';

/**
 * 少年アバター用のテクスチャ適用（リップシンク互換版）
 * Material置き換えを避け、morphTargets/needsUpdateを使用しない
 */
export async function applyBoyAvatarTexturesLipSyncFixed(scene: THREE.Object3D, enableLogging: boolean = true) {
  console.log('=== 少年アバター テクスチャ適用開始（リップシンク互換版） ===');
  console.log('Scene:', scene);
  console.log('Scene children count:', scene.children.length);
  
  const textureLoader = new THREE.TextureLoader();
  textureLoader.setCrossOrigin('anonymous');
  
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
  const loadTexture = async (filename: string): Promise<THREE.Texture | null> => {
    if (textureCache[filename]) {
      return textureCache[filename];
    }
    
    try {
      return new Promise((resolve) => {
        textureLoader.load(
          basePath + filename,
          (texture) => {
            if (filename.includes('Diffuse')) {
              texture.colorSpace = THREE.SRGBColorSpace;
            }
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.flipY = false;
            
            textureCache[filename] = texture;
            stats.texturesApplied++;
            console.log(`  ✓ テクスチャ読み込み: ${filename}`);
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

  // 処理用のプロミス配列
  const promises: Promise<void>[] = [];
  
  scene.traverse((child: any) => {
    if (!child.isMesh) return;
    
    stats.totalMeshes++;
    const meshName = child.name;
    const lowerMeshName = meshName.toLowerCase();
    
    console.log(`処理中のメッシュ: ${meshName}`);
    
    // ヒゲを非表示
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
    
    // まつ毛とティアラインを非表示
    if (lowerMeshName.includes('eyelash') || lowerMeshName.includes('lash') ||
        lowerMeshName.includes('tearline') || lowerMeshName.includes('tear') ||
        lowerMeshName.includes('lacrimal') || lowerMeshName.includes('caruncle')) {
      child.visible = false;
      if (enableLogging) {
        console.log(`非表示: ${meshName}`);
      }
      return;
    }
    
    // 角膜とオクルージョンを非表示
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
    
    // マテリアルの配列化
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    
    materials.forEach((material: THREE.Material) => {
      if (!material) return;
      
      // MeshStandardMaterialの場合のみ処理（置き換えなし）
      if (material instanceof THREE.MeshStandardMaterial) {
        // morphTargets設定は変更しない（既存の設定を保持）
        // material.morphTargets = true; // 使用しない
        // material.morphNormals = true; // 使用しない
        
        const matName = material.name?.toLowerCase() || '';
        console.log(`  Material type: MeshStandardMaterial, has color: ${!!material.color}`);
        
        const promise = (async () => {
          try {
            console.log(`  マテリアル処理: ${matName} (mesh: ${lowerMeshName})`);
            
            // 髪の色変更
            if (lowerMeshName.includes('hair') && !lowerMeshName.includes('eyebrow') && !lowerMeshName.includes('eyelash')) {
              console.log(`  → 髪の色を設定: 0x1a1511`);
              material.color = new THREE.Color(0x1a1511);
              material.roughness = 0.7;
              material.metalness = 0.0;
              console.log(`  → 髪の色設定後: ${material.color.getHexString()}`);
              stats.processedMeshes++;
            }
            // 眉毛の色変更
            else if (lowerMeshName.includes('eyebrow') || matName.includes('eyebrow')) {
              console.log(`  → 眉毛の色を設定: 0x1a1511`);
              material.color = new THREE.Color(0x1a1511);
              material.roughness = 0.7;
              material.metalness = 0.0;
              stats.processedMeshes++;
            }
            // 目のテクスチャ
            else if (lowerMeshName.includes('nug_base_eye') && !lowerMeshName.includes('onuglusion')) {
              if (matName.includes('nug_eye_r')) {
                console.log(`  → 右目のテクスチャを適用`);
                const texture = await loadTexture('Std_Eye_R_Pbr_Diffuse.jpg');
                if (texture) {
                  material.map = texture;
                }
              } else if (matName.includes('nug_eye_l')) {
                console.log(`  → 左目のテクスチャを適用`);
                const texture = await loadTexture('Std_Eye_L_Pbr_Diffuse.jpg');
                if (texture) {
                  material.map = texture;
                }
              }
              material.roughness = 0.2;
              material.metalness = 0.0;
              stats.processedMeshes++;
            }
            // 上の歯 - テクスチャと色を適用
            else if (matName.includes('upper_teeth')) {
              const texture = await loadTexture('Std_Upper_Teeth_Pbr_Diffuse.png');
              if (texture) {
                material.map = texture;
              }
              material.color = new THREE.Color(0xffffff);
              material.roughness = 0.1;
              material.metalness = 0.05;
              stats.processedMeshes++;
              console.log(`  上の歯テクスチャ適用: ${matName}`);
            }
            // 下の歯 - テクスチャと色を適用
            else if (matName.includes('lower_teeth')) {
              const texture = await loadTexture('Std_Lower_Teeth_Pbr_Diffuse.png');
              if (texture) {
                material.map = texture;
              }
              material.color = new THREE.Color(0xffffff);
              material.roughness = 0.1;
              material.metalness = 0.05;
              stats.processedMeshes++;
              console.log(`  下の歯テクスチャ適用: ${matName}`);
            }
            // 舌のテクスチャと色
            else if (matName.includes('tongue')) {
              const diffuse = await loadTexture('Std_Tongue_Pbr_Diffuse.jpg');
              const normal = await loadTexture('Std_Tongue_Pbr_Normal.png');
              if (diffuse) {
                material.map = diffuse;
              }
              if (normal) {
                material.normalMap = normal;
              }
              material.color = new THREE.Color(0xff6b6b);
              material.roughness = 0.4;
              stats.processedMeshes++;
            }
            // 肌の色（頭部）
            else if (matName.includes('skin_head')) {
              console.log(`  → 頭部の肌色を設定: 0xc08870`);
              material.color = new THREE.Color(0xc08870);
              material.roughness = 0.45;
              material.metalness = 0.0;
              console.log(`  → 頭部の肌色設定後: ${material.color.getHexString()}`);
              stats.processedMeshes++;
            }
            // 肌の色（体）
            else if (matName.includes('skin_body')) {
              console.log(`  → 体の肌色を設定: 0xc08870`);
              material.color = new THREE.Color(0xc08870);
              material.roughness = 0.5;
              material.metalness = 0.0;
              stats.processedMeshes++;
            }
            // 肌の色（腕）
            else if (matName.includes('skin_arm') || matName.includes('nug_skin_arm')) {
              console.log(`  → 腕の肌色を設定: 0xc08870`);
              material.color = new THREE.Color(0xc08870);
              material.roughness = 0.5;
              material.metalness = 0.0;
              stats.processedMeshes++;
            }
            // 肌の色（脚）
            else if (matName.includes('skin_leg') || matName.includes('nug_skin_leg')) {
              console.log(`  → 脚の肌色を設定: 0xc08870`);
              material.color = new THREE.Color(0xc08870);
              material.roughness = 0.5;
              material.metalness = 0.0;
              stats.processedMeshes++;
            }
            // 爪
            else if (matName.includes('nails')) {
              const texture = await loadTexture('Std_Nails_Pbr_Diffuse.png');
              const normal = await loadTexture('Std_Nails_Pbr_Normal.png');
              if (texture) {
                material.map = texture;
              }
              if (normal) {
                material.normalMap = normal;
              }
              material.roughness = 0.3;
              material.metalness = 0.0;
              stats.processedMeshes++;
            }
            // 服
            else if (lowerMeshName.includes('fit_shirt')) {
              const texture = await loadTexture('Fit_shirts_Pbr_Diffuse.jpg');
              const normal = await loadTexture('Fit_shirts_Pbr_Normal.jpg');
              if (texture) {
                material.map = texture;
              }
              if (normal) {
                material.normalMap = normal;
              }
              material.roughness = 0.7;
              material.metalness = 0.0;
              stats.processedMeshes++;
            }
            // パンツ
            else if (lowerMeshName.includes('pants')) {
              const texture = await loadTexture('Pants_Pbr_Diffuse.jpg');
              const normal = await loadTexture('Pants_Pbr_Normal.jpg');
              if (texture) {
                material.map = texture;
              }
              if (normal) {
                material.normalMap = normal;
              }
              material.roughness = 0.6;
              material.metalness = 0.0;
              stats.processedMeshes++;
            }
            // 靴
            else if (lowerMeshName.includes('boat_shoe')) {
              const texture = await loadTexture('Boat_Shoes_Pbr_Diffuse.jpg');
              const normal = await loadTexture('Boat_Shoes_Pbr_Normal.jpg');
              if (texture) {
                material.map = texture;
              }
              if (normal) {
                material.normalMap = normal;
              }
              material.roughness = 0.4;
              material.metalness = 0.1;
              stats.processedMeshes++;
            }
            // デフォルトの肌色（その他のボディパーツ）
            else if (lowerMeshName.includes('body') || matName.includes('skin')) {
              console.log(`  → デフォルト肌色を設定: 0xc08870`);
              material.color = new THREE.Color(0xc08870);
              material.roughness = 0.5;
              material.metalness = 0.0;
              stats.processedMeshes++;
            }
            else {
              console.log(`  → マッチなし（処理スキップ）`);
            }
            
            // vertexColorsをfalseに設定（頂点カラーを無効化）
            material.vertexColors = false;
            
            // マテリアルを更新（色を確実に適用するため）
            material.needsUpdate = true;
            
          } catch (error) {
            if (enableLogging) {
              console.error('  マテリアル処理エラー:', error);
            }
            stats.errors++;
          }
        })();
        
        promises.push(promise);
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