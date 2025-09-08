import * as THREE from 'three';

/**
 * 少年アバター用のテクスチャ適用（既存マテリアル修正版）
 * マテリアルを置き換えずに既存のマテリアルを修正する
 * これによりモーフターゲット設定が保持される
 */
export async function applyBoyAvatarTexturesWithReplacement(scene: THREE.Object3D, enableLogging: boolean = true) {
  console.log('=== 少年アバター テクスチャ適用開始（既存マテリアル修正版） ===');
  
  const textureLoader = new THREE.TextureLoader();
  textureLoader.setCrossOrigin('anonymous');
  
  const basePath = '/models/ClassicMan.fbm/';
  
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
            console.log(`  ✓ テクスチャ読み込み: ${filename}`);
            resolve(texture);
          },
          undefined,
          (error) => {
            console.warn(`  ⚠️ テクスチャ読み込み失敗: ${filename}`);
            resolve(null);
          }
        );
      });
    } catch (error) {
      return null;
    }
  };

  // 処理用のプロミス配列
  const promises: Promise<void>[] = [];
  
  scene.traverse((child: any) => {
    if (!child.isMesh) return;
    
    const meshName = child.name;
    const lowerMeshName = meshName.toLowerCase();
    
    if (enableLogging) {
      console.log(`処理中のメッシュ: ${meshName}`);
    }
    
    // ヒゲを非表示
    if (lowerMeshName.includes('beard') || 
        lowerMeshName.includes('mustache') ||
        lowerMeshName.includes('goatee') ||
        lowerMeshName.includes('stubble')) {
      child.visible = false;
      return;
    }
    
    // まつ毛とティアラインを非表示
    if (lowerMeshName.includes('eyelash') || lowerMeshName.includes('lash') ||
        lowerMeshName.includes('tearline') || lowerMeshName.includes('tear') ||
        lowerMeshName.includes('lacrimal') || lowerMeshName.includes('caruncle')) {
      child.visible = false;
      return;
    }
    
    // 角膜とオクルージョンを非表示
    if (lowerMeshName.includes('cornea') ||
        lowerMeshName.includes('occlusion') || lowerMeshName.includes('onuglusion')) {
      child.visible = false;
      return;
    }
    
    // マテリアルの配列化
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    
    materials.forEach((material: THREE.Material) => {
      if (!material) return;
      
      // MeshStandardMaterialの場合のみ処理（既存のマテリアルを修正）
      if (material instanceof THREE.MeshStandardMaterial) {
        const mat = material;
        const matName = material.name?.toLowerCase() || '';
        
        if (enableLogging) {
          console.log(`  マテリアル: ${material.name}, morphTargets: ${mat.morphTargets}, morphNormals: ${mat.morphNormals}`);
        }
        
        // 頂点カラーを無効化
        mat.vertexColors = false;
        mat.side = THREE.DoubleSide;
        
        const promise = (async () => {
          try {
            // 髪の色変更
            if (lowerMeshName.includes('hair') && !lowerMeshName.includes('eyebrow') && !lowerMeshName.includes('eyelash')) {
              if (enableLogging) console.log(`  → 髪の色を設定: 0x1a1511`);
              mat.color = new THREE.Color(0x1a1511);
              mat.roughness = 0.7;
              mat.metalness = 0.0;
            }
            // 眉毛の色変更
            else if (lowerMeshName.includes('eyebrow') || matName.includes('eyebrow')) {
              if (enableLogging) console.log(`  → 眉毛の色を設定: 0x1a1511`);
              mat.color = new THREE.Color(0x1a1511);
              mat.roughness = 0.7;
              mat.metalness = 0.0;
            }
            // 目のテクスチャ
            else if (lowerMeshName.includes('nug_base_eye') && !lowerMeshName.includes('onuglusion')) {
              if (matName.includes('nug_eye_r')) {
                if (enableLogging) console.log(`  → 右目のテクスチャを適用`);
                const texture = await loadTexture('Std_Eye_R_Pbr_Diffuse.jpg');
                if (texture) {
                  mat.map = texture;
                }
              } else if (matName.includes('nug_eye_l')) {
                if (enableLogging) console.log(`  → 左目のテクスチャを適用`);
                const texture = await loadTexture('Std_Eye_L_Pbr_Diffuse.jpg');
                if (texture) {
                  mat.map = texture;
                }
              }
              mat.roughness = 0.2;
              mat.metalness = 0.0;
            }
            // 上の歯
            else if (matName.includes('upper_teeth')) {
              const texture = await loadTexture('Std_Upper_Teeth_Pbr_Diffuse.png');
              if (texture) {
                mat.map = texture;
              }
              mat.color = new THREE.Color(0xffffff);
              mat.roughness = 0.1;
              mat.metalness = 0.05;
              if (enableLogging) console.log(`  上の歯テクスチャ適用`);
            }
            // 下の歯
            else if (matName.includes('lower_teeth')) {
              const texture = await loadTexture('Std_Lower_Teeth_Pbr_Diffuse.png');
              if (texture) {
                mat.map = texture;
              }
              mat.color = new THREE.Color(0xffffff);
              mat.roughness = 0.1;
              mat.metalness = 0.05;
              if (enableLogging) console.log(`  下の歯テクスチャ適用`);
            }
            // 舌
            else if (matName.includes('tongue')) {
              const diffuse = await loadTexture('Std_Tongue_Pbr_Diffuse.jpg');
              const normal = await loadTexture('Std_Tongue_Pbr_Normal.png');
              if (diffuse) {
                mat.map = diffuse;
              }
              if (normal) {
                mat.normalMap = normal;
              }
              mat.color = new THREE.Color(0xff6b6b);
              mat.roughness = 0.4;
            }
            // 肌の色（頭部）
            else if (matName.includes('skin_head')) {
              if (enableLogging) console.log(`  → 頭部の肌色を設定: 0xc08870`);
              mat.color = new THREE.Color(0xc08870);
              mat.roughness = 0.45;
              mat.metalness = 0.0;
            }
            // 肌の色（体）
            else if (matName.includes('skin_body')) {
              if (enableLogging) console.log(`  → 体の肌色を設定: 0xc08870`);
              mat.color = new THREE.Color(0xc08870);
              mat.roughness = 0.5;
              mat.metalness = 0.0;
            }
            // 肌の色（腕）
            else if (matName.includes('skin_arm') || matName.includes('nug_skin_arm')) {
              if (enableLogging) console.log(`  → 腕の肌色を設定: 0xc08870`);
              mat.color = new THREE.Color(0xc08870);
              mat.roughness = 0.5;
              mat.metalness = 0.0;
            }
            // 肌の色（脚）
            else if (matName.includes('skin_leg') || matName.includes('nug_skin_leg')) {
              if (enableLogging) console.log(`  → 脚の肌色を設定: 0xc08870`);
              mat.color = new THREE.Color(0xc08870);
              mat.roughness = 0.5;
              mat.metalness = 0.0;
            }
            // 爪
            else if (matName.includes('nails')) {
              const texture = await loadTexture('Std_Nails_Pbr_Diffuse.png');
              const normal = await loadTexture('Std_Nails_Pbr_Normal.png');
              if (texture) {
                mat.map = texture;
              }
              if (normal) {
                mat.normalMap = normal;
              }
              mat.roughness = 0.3;
              mat.metalness = 0.0;
            }
            // 服
            else if (lowerMeshName.includes('fit_shirt')) {
              const texture = await loadTexture('Fit_shirts_Pbr_Diffuse.jpg');
              const normal = await loadTexture('Fit_shirts_Pbr_Normal.jpg');
              if (texture) {
                mat.map = texture;
              }
              if (normal) {
                mat.normalMap = normal;
              }
              mat.roughness = 0.7;
              mat.metalness = 0.0;
            }
            // パンツ
            else if (lowerMeshName.includes('pants')) {
              const texture = await loadTexture('Pants_Pbr_Diffuse.jpg');
              const normal = await loadTexture('Pants_Pbr_Normal.jpg');
              if (texture) {
                mat.map = texture;
              }
              if (normal) {
                mat.normalMap = normal;
              }
              mat.roughness = 0.6;
              mat.metalness = 0.0;
            }
            // 靴
            else if (lowerMeshName.includes('boat_shoe')) {
              const texture = await loadTexture('Boat_Shoes_Pbr_Diffuse.jpg');
              const normal = await loadTexture('Boat_Shoes_Pbr_Normal.jpg');
              if (texture) {
                mat.map = texture;
              }
              if (normal) {
                mat.normalMap = normal;
              }
              mat.roughness = 0.4;
              mat.metalness = 0.1;
            }
            // デフォルトの肌色
            else if (lowerMeshName.includes('body') || matName.includes('skin')) {
              if (enableLogging) console.log(`  → デフォルト肌色を設定: 0xc08870`);
              mat.color = new THREE.Color(0xc08870);
              mat.roughness = 0.5;
              mat.metalness = 0.0;
            }
            else {
              // その他のマテリアル - デフォルト色
              mat.color = new THREE.Color(0xc08870);
              mat.roughness = 0.5;
              mat.metalness = 0.0;
            }
            
            // マテリアルを更新
            mat.needsUpdate = true;
            
            if (enableLogging) {
              console.log(`  → マテリアル更新完了: ${material.name}`);
            }
            
          } catch (error) {
            console.error('  マテリアル処理エラー:', error);
          }
        })();
        
        promises.push(promise);
      }
    });
  });
  
  // すべてのテクスチャ読み込みを待つ
  await Promise.all(promises);
  
  console.log('=== テクスチャ適用完了（既存マテリアル修正版） ===');
  
  return Promise.resolve();
}