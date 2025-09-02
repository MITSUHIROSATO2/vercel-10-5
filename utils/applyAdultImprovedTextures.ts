import * as THREE from 'three';

/**
 * 成人男性改アバター用のテクスチャ適用
 * 成人男性texturesフォルダのテクスチャを使用
 */
export async function applyAdultImprovedTextures(scene: THREE.Object3D) {
  console.log('=== 成人男性改アバター テクスチャ適用開始 ===');
  
  const textureLoader = new THREE.TextureLoader();
  textureLoader.setCrossOrigin('anonymous'); // CORS設定を追加
  
  // Blob Storageのベースパスを使用（環境変数から取得）
  const basePath = process.env.NEXT_PUBLIC_TEXTURE_BASE_URL 
    ? `${process.env.NEXT_PUBLIC_TEXTURE_BASE_URL}/成人男性textures/Man_Grey_Suit_01_Blender/Man_Grey_Suit_01_Blender/CC_Base_Body/`
    : '/models/成人男性textures/Man_Grey_Suit_01_Blender/Man_Grey_Suit_01_Blender/CC_Base_Body/';
  
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
  const loadTexture = async (path: string, filename: string): Promise<THREE.Texture | null> => {
    const fullPath = path + filename;
    
    if (textureCache[fullPath]) {
      return textureCache[fullPath];
    }
    
    return new Promise((resolve) => {
      textureLoader.load(
        fullPath,
        (texture) => {
          // Diffuseテクスチャの場合はsRGB色空間を設定
          if (filename.includes('Diffuse') || filename.includes('BaseColor')) {
            texture.colorSpace = THREE.SRGBColorSpace;
          }
          textureCache[fullPath] = texture;
          console.log(`✓ テクスチャ読み込み: ${filename}`);
          resolve(texture);
        },
        undefined,
        (error) => {
          console.warn(`テクスチャ読み込みスキップ: ${filename}`, error);
          stats.errors++;
          resolve(null);
        }
      );
    });
  };
  
  // メッシュ名から最適なテクスチャを決定
  const getTextureForMesh = (meshName: string, materialName: string) => {
    const lowerMesh = meshName.toLowerCase();
    const lowerMat = materialName.toLowerCase();
    
    // 服装
    if (lowerMesh.includes('blazer') || lowerMat.includes('blazer')) {
      return { 
        type: 'blazer',
        basePath: '/models/成人男性textures/Man_Grey_Suit_01_Blender/Blazer/Blazer/Blazer/',
        roughness: 'Blazer_roughness.png'
      };
    }
    
    if (lowerMesh.includes('shirt') || lowerMat.includes('shirt')) {
      return { 
        type: 'shirt',
        basePath: '/models/成人男性textures/Man_Grey_Suit_01_Blender/Business_Shirt/Business_Shirt/Business_Shirt/',
        roughness: 'Business_Shirt_roughness.png'
      };
    }
    
    if (lowerMesh.includes('tie') || lowerMat.includes('tie')) {
      return { 
        type: 'tie'
      };
    }
    
    if (lowerMesh.includes('shoe') || lowerMat.includes('shoe') || lowerMat.includes('cuir')) {
      return { 
        type: 'shoes',
        basePath: '/models/成人男性textures/Man_Grey_Suit_01_Blender/shoes/shoes/cuir/',
        roughness: 'cuir_roughness.png',
        metallic: 'cuir_metallic.png',
        ao: 'cuir_ao.png'
      };
    }
    
    // 目
    if (lowerMat.includes('std_cornea_r')) {
      return { 
        type: 'eye',
        basePath: basePath + 'Std_Cornea_R/',
        sclera: 'Std_Cornea_R_Sclera.png',
        normal: 'Std_Cornea_R_ScleraN.png',
        roughness: 'Std_Cornea_R_roughness.png'
      };
    }
    
    if (lowerMat.includes('std_cornea_l')) {
      return { 
        type: 'eye',
        basePath: basePath + 'Std_Cornea_L/',
        sclera: 'Std_Cornea_L_Sclera.png',
        normal: 'Std_Cornea_L_ScleraN.png',
        roughness: 'Std_Cornea_L_roughness.png'
      };
    }
    
    // 肌
    if (lowerMat.includes('std_skin_head')) {
      return { 
        type: 'skin',
        basePath: basePath + 'Std_Skin_Head/',
        roughness: 'Std_Skin_Head_roughness.png',
        metallic: 'Std_Skin_Head_metallic.png',
        ao: 'Std_Skin_Head_ao.png'
      };
    }
    
    if (lowerMat.includes('std_skin_body')) {
      return { 
        type: 'skin',
        basePath: basePath + 'Std_Skin_Body/',
        roughness: 'Std_Skin_Body_roughness.png',
        metallic: 'Std_Skin_Body_metallic.png',
        ao: 'Std_Skin_Body_ao.png'
      };
    }
    
    if (lowerMat.includes('std_skin_arm')) {
      return { 
        type: 'skin',
        basePath: basePath + 'Std_Skin_Arm/',
        roughness: 'Std_Skin_Arm_roughness.png',
        metallic: 'Std_Skin_Arm_metallic.png',
        ao: 'Std_Skin_Arm_ao.png'
      };
    }
    
    // 歯
    if (lowerMat.includes('std_upper_teeth')) {
      return { 
        type: 'teeth',
        basePath: basePath + 'Std_Upper_Teeth/',
        roughness: 'Std_Upper_Teeth_roughness.png',
        ao: 'Std_Upper_Teeth_ao.png'
      };
    }
    
    if (lowerMat.includes('std_lower_teeth')) {
      return { 
        type: 'teeth',
        basePath: basePath + 'Std_Lower_Teeth/',
        roughness: 'Std_Lower_Teeth_roughness.png',
        ao: 'Std_Lower_Teeth_ao.png'
      };
    }
    
    // 舌
    if (lowerMat.includes('std_tongue')) {
      return { 
        type: 'tongue',
        basePath: basePath + 'Std_Tongue/',
        roughness: 'Std_Tongue_roughness.png'
      };
    }
    
    // まつ毛 - 非表示
    if (lowerMat.includes('eyelash') || lowerMesh.includes('eyelash')) {
      return { type: 'hide' };
    }
    
    // 涙腺 - 非表示
    if (lowerMat.includes('tearline') || lowerMesh.includes('tearline')) {
      return { type: 'hide' };
    }
    
    // オクルージョン - 非表示
    if (lowerMat.includes('occlusion') || lowerMesh.includes('occlusion')) {
      return { type: 'hide' };
    }
    
    // 髪
    if (lowerMesh.includes('hair') || lowerMat.includes('hair')) {
      return { 
        type: 'hair',
        basePath: '/models/成人男性textures/Man_Grey_Suit_01_Blender/Classic_short/Classic_short/Hair_Transparency/',
        roughness: 'Hair_Transparency_roughness.png',
        ao: 'Hair_Transparency_ao.png'
      };
    }
    
    // 眉毛
    if (lowerMesh.includes('brow') || lowerMat.includes('brow')) {
      return { 
        type: 'eyebrow',
        basePath: '/models/成人男性textures/Man_Grey_Suit_01_Blender/Kevin_Brow/Kevin_Brow/Male_Brow_Transparency/',
        roughness: 'Male_Brow_Transparency_roughness.png'
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
    console.log(`\n処理中: ${meshName}`);
    
    // 特定のメッシュを非表示
    if (lowerMeshName.includes('eyelash') || 
        lowerMeshName.includes('tearline') || 
        lowerMeshName.includes('occlusion')) {
      child.visible = false;
      console.log(`非表示: ${meshName}`);
      return;
    }
    
    // マテリアルの配列化
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    
    materials.forEach((material: THREE.Material, index: number) => {
      if (!material) return;
      
      const matName = material.name || '';
      console.log(`  マテリアル: ${matName}`);
      
      // テクスチャマッピングを取得
      const mapping = getTextureForMesh(meshName, matName);
      
      if (mapping) {
        console.log(`    → タイプ: ${mapping.type}`);
        
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
            // 色の設定
            if ('color' in mapping && mapping.color) {
              newMat.color = new THREE.Color(mapping.color as THREE.ColorRepresentation);
            }
            
            // テクスチャの読み込み
            if ('basePath' in mapping) {
              // Roughness
              if ('roughness' in mapping && mapping.roughness) {
                const roughnessTex = await loadTexture(mapping.basePath, mapping.roughness);
                if (roughnessTex) {
                  newMat.roughnessMap = roughnessTex;
                  newMat.roughness = 1.0;
                  stats.texturesApplied++;
                }
              }
              
              // Metallic
              if ('metallic' in mapping && mapping.metallic) {
                const metallicTex = await loadTexture(mapping.basePath, mapping.metallic);
                if (metallicTex) {
                  newMat.metalnessMap = metallicTex;
                  newMat.metalness = 1.0;
                  stats.texturesApplied++;
                }
              }
              
              // AO
              if ('ao' in mapping && mapping.ao) {
                const aoTex = await loadTexture(mapping.basePath, mapping.ao);
                if (aoTex) {
                  newMat.aoMap = aoTex;
                  newMat.aoMapIntensity = 1.0;
                  stats.texturesApplied++;
                }
              }
              
              // Sclera (目の白目部分)
              if ('sclera' in mapping && mapping.sclera) {
                const scleraTex = await loadTexture(mapping.basePath, mapping.sclera);
                if (scleraTex) {
                  newMat.map = scleraTex;
                  stats.texturesApplied++;
                }
              }
              
              // Normal
              if ('normal' in mapping && mapping.normal) {
                const normalTex = await loadTexture(mapping.basePath, mapping.normal);
                if (normalTex) {
                  newMat.normalMap = normalTex;
                  stats.texturesApplied++;
                }
              }
            }
            
            // タイプ別の設定
            switch (mapping.type) {
              case 'eye':
                newMat.roughness = 0.1;
                newMat.metalness = 0.0;
                if (!newMat.map) newMat.color = new THREE.Color(0xffffff);
                break;
              case 'skin':
                if (!newMat.roughnessMap) newMat.roughness = 0.45;
                // より自然な肌色
                newMat.color = new THREE.Color(0xd4a797);
                break;
              case 'teeth':
                // 歯を真っ白にする
                newMat.color = new THREE.Color(0xffffff); // 純白
                newMat.emissive = new THREE.Color(0xffffff); // 発光色も白
                newMat.emissiveIntensity = 0.15; // 発光させて明るくする
                newMat.roughness = 0.05; // とても艶やか
                newMat.metalness = 0.1; // わずかに金属感
                break;
              case 'tongue':
                newMat.roughness = 0.6;
                newMat.color = new THREE.Color(0xd4847e); // ピンク
                break;
              case 'blazer':
                if (!newMat.roughnessMap) newMat.roughness = 0.7;
                // よりリアルなグレー
                newMat.color = new THREE.Color(0x4a4a4a);
                break;
              case 'shirt':
                if (!newMat.roughnessMap) newMat.roughness = 0.6;
                newMat.color = new THREE.Color(0xffffff); // 純白
                break;
              case 'tie':
                newMat.roughness = 0.4;
                newMat.metalness = 0.1;
                // 落ち着いた赤
                newMat.color = new THREE.Color(0x8b2c2c);
                break;
              case 'shoes':
                if (!newMat.roughnessMap) newMat.roughness = 0.2;
                newMat.metalness = 0.1;
                newMat.color = new THREE.Color(0x0a0a0a); // ほぼ黒
                break;
              case 'hair':
                if (!newMat.roughnessMap) newMat.roughness = 0.7;
                // グレーヘア
                newMat.color = new THREE.Color(0x3a3a3a);
                break;
              case 'eyebrow':
                if (!newMat.roughnessMap) newMat.roughness = 0.8;
                // 濃いグレー
                newMat.color = new THREE.Color(0x2a2a2a);
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
          }
        })();
        
        processPromises.push(promise);
      }
    });
  });
  
  // すべての処理を待つ
  await Promise.all(processPromises);
  
  // 統計情報を出力
  console.log('\n=== 適用結果 ===');
  console.log(`総メッシュ数: ${stats.totalMeshes}`);
  console.log(`処理済み: ${stats.processedMeshes}`);
  console.log(`テクスチャ適用: ${stats.texturesApplied}`);
  console.log(`エラー: ${stats.errors}`);
  
  console.log('=== 成人男性改アバター テクスチャ適用完了 ===');
}