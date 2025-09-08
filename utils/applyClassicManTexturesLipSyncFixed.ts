import * as THREE from 'three';

/**
 * ClassicManのテクスチャ適用（リップシンク互換版）
 * Material置き換えを避け、morphTargets/needsUpdateを使用しない
 */
export async function applyClassicManTexturesLipSyncFixed(scene: THREE.Object3D, enableLogging: boolean = true) {
  if (enableLogging) {
    console.log('=== ClassicMan テクスチャ適用開始（リップシンク互換版） ===');
  }
  
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

  // 処理用のプロミス配列
  const promises: Promise<void>[] = [];
  
  scene.traverse((child: any) => {
    if (!child.isMesh) return;
    
    stats.totalMeshes++;
    const meshName = child.name;
    const lowerMeshName = meshName.toLowerCase();
    
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
        lowerMeshName.includes('tearline') || lowerMeshName.includes('tear')) {
      child.visible = false;
      if (enableLogging) {
        console.log(`非表示: ${meshName}`);
      }
      return;
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
        
        const promise = (async () => {
          try {
            // 髪の色変更
            if (lowerMeshName.includes('hair') && !lowerMeshName.includes('eyebrow') && !lowerMeshName.includes('eyelash')) {
              material.color = new THREE.Color(0x1a1511);
              material.roughness = 0.7;
              material.metalness = 0.0;
              stats.processedMeshes++;
            }
            // 眉毛の色変更
            else if (lowerMeshName.includes('eyebrow')) {
              material.color = new THREE.Color(0x1a1511);
              material.roughness = 0.7;
              material.metalness = 0.0;
              stats.processedMeshes++;
            }
            // 目のテクスチャ
            else if (lowerMeshName.includes('nug_base_eye') && !lowerMeshName.includes('onuglusion')) {
              if (matName.includes('nug_eye_r')) {
                const texture = await loadTexture('Std_Eye_R_Pbr_Diffuse.jpg');
                if (texture) {
                  material.map = texture;
                }
              } else if (matName.includes('nug_eye_l')) {
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
              if (enableLogging) {
                console.log(`  上の歯テクスチャ適用: ${matName}`);
              }
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
              if (enableLogging) {
                console.log(`  下の歯テクスチャ適用: ${matName}`);
              }
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
              material.metalness = 0.0;
              stats.processedMeshes++;
            }
            // 肌の色（頭部）
            else if (matName.includes('skin_head')) {
              material.color = new THREE.Color(0xc08870);
              material.roughness = 0.45;
              material.metalness = 0.0;
              stats.processedMeshes++;
            }
            // 肌の色（体）
            else if (matName.includes('skin_body')) {
              const texture = await loadTexture('Std_Skin_Body_Pbr_Diffuse.jpg');
              const normal = await loadTexture('Std_Skin_Body_Pbr_Normal.png');
              if (texture) {
                material.map = texture;
              }
              if (normal) {
                material.normalMap = normal;
              }
              material.roughness = 0.5;
              material.metalness = 0.0;
              stats.processedMeshes++;
            }
            // 肌の色（腕）
            else if (matName.includes('skin_arm')) {
              const texture = await loadTexture('Std_Skin_Arm_Pbr_Diffuse.jpg');
              const normal = await loadTexture('Std_Skin_Arm_Pbr_Normal.png');
              if (texture) {
                material.map = texture;
              }
              if (normal) {
                material.normalMap = normal;
              }
              material.roughness = 0.5;
              material.metalness = 0.0;
              stats.processedMeshes++;
            }
            // 肌の色（脚）
            else if (matName.includes('skin_leg')) {
              const texture = await loadTexture('Std_Skin_Leg_Pbr_Diffuse.jpg');
              const normal = await loadTexture('Std_Skin_Leg_Pbr_Normal.png');
              if (texture) {
                material.map = texture;
              }
              if (normal) {
                material.normalMap = normal;
              }
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
            // デフォルトの肌色
            else if (lowerMeshName.includes('body') || matName.includes('skin')) {
              material.color = new THREE.Color(0xc08870);
              material.roughness = 0.5;
              material.metalness = 0.0;
              stats.processedMeshes++;
            }
            
            // needsUpdateは使用しない
            // material.needsUpdate = true; // 使用しない
            
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