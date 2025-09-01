import * as THREE from 'three';

/**
 * ClassicMan.glbにテクスチャを適用する
 */
export async function applyClassicManTextures(scene: THREE.Object3D) {
  console.log('=== ClassicManテクスチャ適用開始 ===');
  
  const textureLoader = new THREE.TextureLoader();
  const basePath = '/models/ClassicMan.fbm/';
  
  // 適用結果を記録
  const appliedTextures: { [key: string]: string[] } = {};
  const failedTextures: string[] = [];
  
  // テクスチャをプリロード
  const loadTexture = (filename: string): Promise<THREE.Texture> => {
    return new Promise((resolve, reject) => {
      textureLoader.load(
        basePath + filename,
        (texture) => {
          if (filename.includes('Diffuse')) {
            texture.colorSpace = THREE.SRGBColorSpace;
          }
          console.log(`✓ テクスチャ読み込み成功: ${filename}`);
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
  
  // 全メッシュを処理
  const processPromises: Promise<void>[] = [];
  
  scene.traverse((child: any) => {
    if (!child.isMesh) return;
    
    const meshName = child.name.toLowerCase();
    console.log(`処理中のメッシュ: ${child.name}`);
    
    // ヒゲメッシュを完全に非表示
    if (meshName.includes('beard') || meshName.includes('mustache') || 
        meshName.includes('goatee') || meshName.includes('stubble') || 
        meshName.includes('whisker') || meshName.includes('facial_hair')) {
      child.visible = false;
      console.log(`ヒゲメッシュを非表示: ${child.name}`);
      return;
    }
    
    // 髪のメッシュを特別に処理
    if (meshName === 'hair' || meshName.includes('hair')) {
      console.log(`髪のメッシュを検出: ${child.name}`);
      // メッシュのジオメトリを確認
      if (child.geometry) {
        child.geometry.computeVertexNormals();
      }
    }
    
    // ヒゲのメッシュは表示したまま（後で肌色にする）
    
    // マテリアルの配列化
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    
    materials.forEach((material: THREE.Material, index: number) => {
      if (!material) return;
      
      const matName = material.name.toLowerCase();
      console.log(`  マテリアル: ${material.name}`);
      
      // 新しいマテリアルを作成
      const newMat = new THREE.MeshStandardMaterial({
        name: material.name,
        side: THREE.DoubleSide
      });
      
      const promise = (async () => {
        try {
          // 肌のテクスチャ - 頭部はテクスチャなしで肌色のみ
          if (matName.includes('skin_head') || matName.includes('nug_skin_head')) {
            // テクスチャを使用せず、さらに濃い日本人の肌色を設定
            newMat.color = new THREE.Color(0xc08870); // さらに濃い日本人の肌色
            newMat.roughness = 0.45;
            newMat.metalness = 0.0;
          }
          else if (matName.includes('skin_body') || matName.includes('nug_skin_body')) {
            newMat.map = await loadTexture('Std_Skin_Body_Pbr_Diffuse.jpg');
            newMat.normalMap = await loadTexture('Std_Skin_Body_Pbr_Normal.png');
            newMat.roughness = 0.5;
          }
          else if (matName.includes('skin_arm') || matName.includes('nug_skin_arm')) {
            newMat.map = await loadTexture('Std_Skin_Arm_Pbr_Diffuse.jpg');
            newMat.normalMap = await loadTexture('Std_Skin_Arm_Pbr_Normal.png');
            newMat.roughness = 0.5;
          }
          else if (matName.includes('skin_leg') || matName.includes('nug_skin_leg')) {
            newMat.map = await loadTexture('Std_Skin_Leg_Pbr_Diffuse.jpg');
            newMat.normalMap = await loadTexture('Std_Skin_Leg_Pbr_Normal.png');
            newMat.roughness = 0.5;
          }
          // 目
          else if (matName.includes('nug_eye_r') || matName.includes('nug_eye_l')) {
            newMat.map = await loadTexture('Std_Cornea_R_Pbr_Diffuse.jpg');
            newMat.roughness = 0.3;
          }
          // 目のオクルージョン
          else if (matName.includes('eye_occlusion') || matName.includes('eye_onuglusion')) {
            if (matName.includes('_r')) {
              newMat.map = await loadTexture('Std_Eye_Occlusion_R_Pbr_Diffuse.png');
            } else {
              newMat.map = await loadTexture('Std_Eye_Occlusion_L_Pbr_Diffuse.png');
            }
            newMat.transparent = true;
          }
          // 角膜
          else if (matName.includes('cornea')) {
            newMat.transparent = true;
            newMat.opacity = 0.1;
            newMat.roughness = 0.0;
          }
          // まつ毛 - 髪と同じテクスチャを使用（高い透明度）
          else if (matName.includes('eyelash')) {
            // 髪と同じテクスチャを適用
            newMat.map = await loadTexture('Hair_Transparency_Pbr_Diffuse.jpg');
            newMat.normalMap = await loadTexture('Hair_Transparency_Pbr_Normal.jpg');
            
            // まつ毛用の透明度マップも適用
            const opacityMap = await loadTexture('Std_Eyelash_Pbr_Opacity.png');
            newMat.alphaMap = opacityMap;
            newMat.transparent = true;
            newMat.alphaTest = 0.6; // より高い閾値でより透明に
            newMat.opacity = 0.3; // 全体的な透明度を高める
            newMat.side = THREE.DoubleSide;
            
            console.log('まつ毛に髪のテクスチャを適用（高透明度）');
          }
          // 髪 - 直接茶色に設定（テクスチャなし）
          else if (matName.includes('hair') && !matName.includes('eyelash')) {
            // 髪を茶色に設定（テクスチャは使用しない）
            newMat.color = new THREE.Color(0x1a1511); // ほぼ黒に近い茶色
            newMat.roughness = 0.7;
            newMat.metalness = 0.0;
            newMat.transparent = false;
            newMat.opacity = 1.0;
            newMat.side = THREE.DoubleSide;
            newMat.depthWrite = true;
            
            console.log('髪を直接茶色に設定');
          }
          // 眉毛 - 髪と同じ色に設定
          else if (matName.includes('eyebrow')) {
            newMat.color = new THREE.Color(0x1a1511); // 髪と同じ色
            newMat.roughness = 0.7;
            newMat.metalness = 0.0;
            newMat.transparent = false;
            newMat.opacity = 1.0;
            newMat.side = THREE.DoubleSide;
            console.log('眉毛を髪と同じ色に設定');
          }
          // ヒゲ関連のマテリアルは肌色にする
          else if (matName.includes('beard') || matName.includes('mustache') || 
                   matName.includes('goatee') || matName.includes('stubble') || 
                   matName.includes('whisker') || matName.includes('facial_hair')) {
            // 顎の肌と同じテクスチャを適用
            newMat.map = await loadTexture('Std_Skin_Head_Pbr_Diffuse.jpg');
            newMat.normalMap = await loadTexture('Std_Skin_Head_Pbr_Normal.png');
            newMat.roughness = 0.5;
            console.log('ヒゲマテリアルを肌色に設定');
          }
          // 服
          else if (matName.includes('shirt')) {
            newMat.map = await loadTexture('Fit_shirts_Pbr_Diffuse.jpg');
            newMat.normalMap = await loadTexture('Fit_shirts_Pbr_Normal.jpg');
          }
          // パンツ
          else if (matName.includes('pant')) {
            newMat.map = await loadTexture('Pants_Pbr_Diffuse.jpg');
            newMat.normalMap = await loadTexture('Pants_Pbr_Normal.jpg');
          }
          // 靴
          else if (matName.includes('shoe')) {
            newMat.map = await loadTexture('Boat_Shoes_Pbr_Diffuse.jpg');
            newMat.normalMap = await loadTexture('Boat_Shoes_Pbr_Normal.jpg');
          }
          // 歯
          else if (matName.includes('teeth')) {
            if (matName.includes('upper')) {
              newMat.map = await loadTexture('Std_Upper_Teeth_Pbr_Diffuse.png');
            } else if (matName.includes('lower')) {
              newMat.map = await loadTexture('Std_Lower_Teeth_Pbr_Diffuse.png');
            }
            newMat.roughness = 0.2;
          }
          // 舌
          else if (matName.includes('tongue')) {
            newMat.map = await loadTexture('Std_Tongue_Pbr_Diffuse.jpg');
            newMat.normalMap = await loadTexture('Std_Tongue_Pbr_Normal.png');
          }
          // 唇
          else if (matName.includes('lip') || matName.includes('mouth') || 
                   meshName.includes('lip') || meshName.includes('mouth')) {
            // もっと濃い唇の色（深いローズレッド）
            newMat.color = new THREE.Color(0x8b4d48);
            newMat.roughness = 0.35;
            newMat.metalness = 0.0;
            console.log('唇に色を設定');
          }
          // 爪
          else if (matName.includes('nail')) {
            newMat.map = await loadTexture('Std_Nails_Pbr_Diffuse.png');
            newMat.normalMap = await loadTexture('Std_Nails_Pbr_Normal.png');
          }
          // ティアライン（涙腺）- 透明にする
          else if (matName.includes('tearline') || matName.includes('tear')) {
            newMat.transparent = true;
            newMat.opacity = 0.0;
            newMat.visible = false;
            console.log('ティアラインを透明に設定');
          }
          // 鼻孔 - 肌より少し暗い色にする
          else if (matName.includes('nostril')) {
            newMat.color = new THREE.Color(0x8b6f5c); // 肌より暗い茶色
            newMat.roughness = 0.6;
            console.log('鼻孔を暗い肌色に設定');
          }
          // デフォルト肌色
          else {
            // その他のマテリアルには肌色を適用
            if (meshName.includes('body') || meshName.includes('head') || 
                meshName.includes('arm') || meshName.includes('leg') ||
                meshName.includes('face') || meshName.includes('chin') || 
                meshName.includes('jaw')) {
              // 肌の部分は適切なテクスチャを探す
              if (meshName.includes('head') || meshName.includes('face') || 
                  meshName.includes('chin') || meshName.includes('jaw')) {
                // 頭部と顔はテクスチャなしでさらに濃い日本人の肌色
                newMat.color = new THREE.Color(0xc08870);
                newMat.metalness = 0.0;
              } else if (meshName.includes('body')) {
                newMat.map = await loadTexture('Std_Skin_Body_Pbr_Diffuse.jpg');
                newMat.normalMap = await loadTexture('Std_Skin_Body_Pbr_Normal.png');
              } else if (meshName.includes('arm')) {
                newMat.map = await loadTexture('Std_Skin_Arm_Pbr_Diffuse.jpg');
                newMat.normalMap = await loadTexture('Std_Skin_Arm_Pbr_Normal.png');
              } else if (meshName.includes('leg')) {
                newMat.map = await loadTexture('Std_Skin_Leg_Pbr_Diffuse.jpg');
                newMat.normalMap = await loadTexture('Std_Skin_Leg_Pbr_Normal.png');
              }
              newMat.roughness = 0.5;
            } else {
              // その他はフォールバックカラー
              newMat.color = new THREE.Color(0xc08870);
              newMat.roughness = 0.5;
              newMat.metalness = 0.0;
            }
          }
        } catch (error) {
          console.error(`テクスチャ適用エラー: ${material.name}`, error);
          // エラー時はフォールバックカラー
          newMat.color = new THREE.Color(0xf4ccaa);
          newMat.roughness = 0.5;
        }
        
        // マテリアルを置き換え
        if (Array.isArray(child.material)) {
          child.material[index] = newMat;
        } else {
          child.material = newMat;
        }
        
        newMat.needsUpdate = true;
        
        // 適用結果を記録
        if (!appliedTextures[child.name]) {
          appliedTextures[child.name] = [];
        }
        if (newMat.map) {
          appliedTextures[child.name].push(material.name || 'unnamed');
        }
      })();
      
      processPromises.push(promise);
    });
  });
  
  // すべてのテクスチャの読み込みを待つ
  await Promise.all(processPromises);
  
  // 適用結果をログ出力
  console.log('=== テクスチャ適用結果 ===');
  Object.entries(appliedTextures).forEach(([meshName, textures]) => {
    console.log(`✓ ${meshName}: ${textures.join(', ')}`);
  });
  
  if (failedTextures.length > 0) {
    console.warn('❌ 失敗したテクスチャ:', failedTextures);
  }
  
  // 肌のメッシュに確実にテクスチャが適用されているか確認
  scene.traverse((child: any) => {
    if (child.isMesh) {
      const meshName = child.name.toLowerCase();
      if (meshName.includes('body') || meshName.includes('head') || 
          meshName.includes('face') || meshName.includes('arm') || 
          meshName.includes('leg')) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat: any) => {
          if (!mat.map && !mat.color) {
            console.warn(`⚠️ テクスチャが未適用: ${child.name} - ${mat.name}`);
          }
        });
      }
    }
  });
  
  console.log('=== ClassicManテクスチャ適用完了 ===');
}