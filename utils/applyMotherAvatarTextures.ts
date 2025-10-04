import * as THREE from 'three';

type ColorSpaceType = 'color' | 'linear';

const femaleTextureLoader = new THREE.TextureLoader();
femaleTextureLoader.setCrossOrigin('anonymous');

const textureCache: Record<string, THREE.Texture> = {};

const FEMALE_EYELASH_TEXTURES = {
  diffuse: '/models/textures/Base/Std_Eyelash_Diffuse.jpg',
  normal: '/models/textures/Base/Std_Eyelash_Normal.png',
  alpha: '/models/textures/Base/Std_Eyelash_Opacity.jpg',
  orm: '/models/textures/Details/Mother/Base_Body/Std_Eyelash/Std_Eyelash_ORM.png',
} as const;

const isEyeMaterial = (name: string) =>
  name.includes('nug_eye_r') ||
  name.includes('nug_eye_l') ||
  name.includes('nug_cornea_r') ||
  name.includes('nug_cornea_l');

// テクスチャ読み込みのPromise追跡用
const textureLoadPromises: Promise<void>[] = [];

const loadFemaleTexture = (path: string, type: ColorSpaceType = 'color') => {
  if (textureCache[path]) {
    const cached = textureCache[path];
    cached.needsUpdate = true;
    // キャッシュから取得した場合も、即座にresolveするPromiseを追加
    textureLoadPromises.push(Promise.resolve());
    return cached;
  }

  let resolveLoad: () => void;
  let rejectLoad: (error: any) => void;

  const loadPromise = new Promise<void>((resolve, reject) => {
    resolveLoad = resolve;
    rejectLoad = reject;
  });

  textureLoadPromises.push(loadPromise);

  const texture = femaleTextureLoader.load(
    path,
    (tex) => {
      tex.colorSpace = type === 'color' ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
      tex.flipY = false;
      tex.anisotropy = Math.max(tex.anisotropy, 8);
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      tex.needsUpdate = true;
      console.log(`[applyMotherAvatarTextures] loaded texture: ${path}`);
      resolveLoad();
    },
    undefined,
    (error) => {
      console.error(`[applyMotherAvatarTextures] failed to load texture: ${path}`, error);
      rejectLoad(error);
    }
  );

  texture.colorSpace = type === 'color' ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
  texture.flipY = false;
  texture.anisotropy = Math.max(texture.anisotropy, 8);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;

  textureCache[path] = texture;
  return texture;
};

export const resetMotherAvatarTextureCache = () => {
  Object.values(textureCache).forEach((texture) => {
    try {
      texture.dispose();
    } catch (error) {
      console.warn('[applyMotherAvatarTextures] texture dispose failed', error);
    }
  });
  Object.keys(textureCache).forEach((key) => delete textureCache[key]);
  console.log('[applyMotherAvatarTextures] texture cache has been reset');
};

export async function applyMotherAvatarTextures(scene: THREE.Object3D) {
  console.log('[applyMotherAvatarTextures] FUNCTION CALLED, femaleTexturesApplied:', scene?.userData?.femaleTexturesApplied);

  if (!scene) return;

  // テクスチャ読み込みPromise配列をリセット
  textureLoadPromises.length = 0;

  // Remove cornea meshes completely from the scene
  let corneaMeshCount = 0;
  const meshesToRemove: any[] = [];

  scene.traverse((child: any) => {
    if (!child.isMesh) return;
    const childName = child.name || '';
    const childNameLower = childName.toLowerCase();
    const materials = Array.isArray(child.material) ? child.material : [child.material];

    // すべてのEye関連メッシュをログ出力（詳細情報）
    if (childNameLower.includes('eye')) {
      const matNames = materials.map((m: any) => m?.name || 'unnamed').join(', ');
      console.log('[applyMotherAvatarTextures] Eye mesh found:', childName, 'materials:', matNames, 'visible:', child.visible, 'renderOrder:', child.renderOrder);

      // マテリアルの詳細も出力
      materials.forEach((mat: any) => {
        if (mat) {
          console.log(`  - Material: ${mat.name}, transparent: ${mat.transparent}, opacity: ${mat.opacity}, visible: ${mat.visible}`);
        }
      });
    }

    // メッシュ名またはマテリアル名に"cornea"が含まれているかチェック
    const hasCorneaMaterial = materials.some((mat: THREE.Material) => {
      const matName = (mat?.name || '').toLowerCase();
      return matName.includes('cornea');
    });

    // NUG_Base_Eye_2とNUG_Base_Eye_4を直接名前でチェック
    const isCorneaEye = childName === 'NUG_Base_Eye_2' || childName === 'NUG_Base_Eye_4';

    // オクルージョンメッシュもチェック（これがグレーの層の原因）
    const isOcclusionMesh = childNameLower.includes('eyeonuglusion') || childNameLower.includes('occlusion');

    if (hasCorneaMaterial || isCorneaEye || isOcclusionMesh) {
      console.log('[applyMotherAvatarTextures] *** MESH TO REMOVE DETECTED ***:', childName, 'hasCorneaMat:', hasCorneaMaterial, 'isCorneaEye:', isCorneaEye, 'isOcclusion:', isOcclusionMesh);
      meshesToRemove.push(child);
      corneaMeshCount++;
    }
  });

  // Remove cornea meshes from their parents
  meshesToRemove.forEach((mesh) => {
    if (mesh.parent) {
      mesh.parent.remove(mesh);
      console.log('[applyMotherAvatarTextures] Removed cornea mesh from scene:', mesh.name);
      // Dispose of geometry and materials to free memory
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((mat: any) => {
          if (mat.map) mat.map.dispose();
          if (mat.normalMap) mat.normalMap.dispose();
          mat.dispose();
        });
      }
    }
  });

  console.log('[applyMotherAvatarTextures] Total cornea meshes removed:', corneaMeshCount);

  if (scene.userData?.femaleTexturesApplied) {
    console.log('[applyMotherAvatarTextures] textures already applied, but cornea hidden and materials updated');
    return;
  }

  console.log('[applyMotherAvatarTextures] start');

  scene.traverse((child: any) => {
    if (!child.isMesh) return;

    const meshName = child.name || '';
    const lowerMeshName = meshName.toLowerCase();

    // オクルージョンメッシュは削除リストに追加済み（非表示ではなく削除）
    // if (lowerMeshName.includes('occlusion') || lowerMeshName.includes('onuglusion')) {
    //   child.visible = false;
    //   console.log(`[applyMotherAvatarTextures] hiding occlusion mesh: ${meshName}`);
    // }

    if (lowerMeshName.includes('tearline')) {
      child.visible = true;
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material];

    // Check if this mesh has cornea material and hide it
    const hasCorneaMaterial = materials.some((mat: THREE.Material) => {
      const matName = (mat?.name || '').toLowerCase();
      return matName.includes('cornea');
    });

    if (hasCorneaMaterial) {
      child.visible = false;
      console.log(`[applyMotherAvatarTextures] hiding cornea mesh: ${meshName}`);
    }

    materials.forEach((material: THREE.Material) => {
      if (!material) return;

      const mat = material as any;
      const matName = (material.name || '').toLowerCase();

      console.log(`[applyMotherAvatarTextures] material: ${material.name} (${material.type})`);

      mat.vertexColors = false;
      mat.side = THREE.DoubleSide;

      if (!isEyeMaterial(matName)) {
        mat.map = null;
        mat.normalMap = null;
        mat.aoMap = null;
        mat.emissiveMap = null;
      }

      if (material.type === 'MeshPhysicalMaterial') {
        mat.clearcoat = 0;
        mat.clearcoatRoughness = 1;
        mat.sheen = 0;
        mat.sheenColor = new THREE.Color(0x000000);
        mat.sheenRoughness = 1;
        mat.transmission = 0;
        mat.reflectivity = 0;
        mat.ior = 1.0;
      }

      switch (matName) {
        case 'hair':
          console.log('  -> set hair texture (female)');
          mat.color = new THREE.Color(0x795437);
          mat.map = loadFemaleTexture('/models/textures/Base/Hair_Diffuse.jpg');
          mat.normalMap = loadFemaleTexture('/models/textures/Base/Hair_Normal.jpg', 'linear');
          mat.emissive = new THREE.Color(0x000000); // 反射を抑える
          mat.emissiveIntensity = 0.0;
          mat.roughness = 1.0; // 完全にマット
          mat.metalness = 0.0;
          mat.envMapIntensity = 0.0; // 環境反射を完全に無効化
          break;

        case 'nug_eye_r':
          mat.color = new THREE.Color(0xffffff);
          mat.map = loadFemaleTexture('/models/textures/Base/Std_Cornea_R_Diffuse.png');
          mat.normalMap = loadFemaleTexture('/models/textures/Base/Std_Eye_R_Normal.png', 'linear');
          mat.emissive = new THREE.Color(0x000000);
          mat.emissiveIntensity = 0.0;
          mat.roughness = 0.05; // より滑らかに（角膜のような効果を減らす）
          mat.metalness = 0.0; // メタリックを完全に無効化
          mat.transparent = false;
          mat.opacity = 1.0;
          mat.depthWrite = true;
          mat.side = THREE.FrontSide;
          mat.envMapIntensity = 0.3; // 環境マップの反射を減らす
          break;

        case 'nug_eye_l':
          mat.color = new THREE.Color(0xffffff);
          mat.map = loadFemaleTexture('/models/textures/Base/Std_Cornea_L_Diffuse.png');
          mat.normalMap = loadFemaleTexture('/models/textures/Base/Std_Eye_L_Normal.png', 'linear');
          mat.emissive = new THREE.Color(0x000000);
          mat.emissiveIntensity = 0.0;
          mat.roughness = 0.05; // より滑らかに（角膜のような効果を減らす）
          mat.metalness = 0.0; // メタリックを完全に無効化
          mat.transparent = false;
          mat.opacity = 1.0;
          mat.depthWrite = true;
          mat.side = THREE.FrontSide;
          mat.envMapIntensity = 0.3; // 環境マップの反射を減らす
          break;

        case 'nug_cornea_r':
        case 'nug_cornea_l':
          // 角膜は完全に非表示にする
          mat.map = null;
          mat.normalMap = null;
          mat.color = new THREE.Color(0x000000);
          mat.emissive = new THREE.Color(0x000000);
          mat.emissiveIntensity = 0.0;
          mat.transparent = true;
          mat.opacity = 0.0;
          mat.roughness = 0.0;
          mat.metalness = 0.0;
          mat.depthWrite = false;
          mat.depthTest = false;
          mat.visible = false;
          mat.colorWrite = false;
          // このマテリアルを使用しているメッシュも非表示にする
          child.visible = false;
          child.renderOrder = -999;
          console.log(`  -> cornea material set to invisible: ${matName}`);
          break;

        case 'nug_skin_head':
        case 'nug_skin_body':
        case 'nug_skin_arm':
        case 'nug_skin_leg': {
          console.log(`  -> set skin texture for ${matName}`);
          const skinDiffuse = matName === 'nug_skin_head'
            ? '/models/textures/Base/Std_Skin_Head_Diffuse.png'
            : matName === 'nug_skin_body'
              ? '/models/textures/Base/Std_Skin_Body_Diffuse.jpg'
              : matName === 'nug_skin_arm'
                ? '/models/textures/Base/Std_Skin_Arm_Diffuse.jpg'
                : '/models/textures/Base/Std_Skin_Leg_Diffuse.jpg';
          const skinNormal = matName === 'nug_skin_head'
            ? '/models/textures/Base/Std_Skin_Head_Normal.png'
            : matName === 'nug_skin_body'
              ? '/models/textures/Base/Std_Skin_Body_Normal.png'
              : matName === 'nug_skin_arm'
                ? '/models/textures/Base/Std_Skin_Arm_Normal.png'
                : '/models/textures/Base/Std_Skin_Leg_Normal.png';

          mat.map = loadFemaleTexture(skinDiffuse);
          mat.normalMap = loadFemaleTexture(skinNormal, 'linear');
          mat.color = new THREE.Color(0xf1c9ae);
          mat.emissive = new THREE.Color(0x000000);
          mat.emissiveIntensity = 0.0;
          mat.roughness = 0.5;
          mat.metalness = 0.04;
          break;
        }

        case 'nug_upper_teeth':
        case 'nug_lower_teeth':
          mat.color = new THREE.Color(0xfaf6ef);
          mat.map = loadFemaleTexture(
            matName === 'nug_upper_teeth'
              ? '/models/textures/Base/Std_Upper_Teeth_Diffuse.png'
              : '/models/textures/Base/Std_Lower_Teeth_Diffuse.png'
          );
          mat.normalMap = loadFemaleTexture(
            matName === 'nug_upper_teeth'
              ? '/models/textures/Base/Std_Upper_Teeth_Normal.png'
              : '/models/textures/Base/Std_Lower_Teeth_Normal.png',
            'linear'
          );
          mat.emissive = new THREE.Color(0x000000);
          mat.emissiveIntensity = 0.0;
          mat.roughness = 0.22;
          mat.metalness = 0.05;
          break;

        case 'nug_tongue':
          mat.map = loadFemaleTexture('/models/textures/Base/Std_Tongue_Diffuse.png');
          mat.normalMap = loadFemaleTexture('/models/textures/Base/Std_Tongue_Normal.png', 'linear');
          mat.color = new THREE.Color(0xc2636e);
          mat.emissive = new THREE.Color(0x000000);
          mat.emissiveIntensity = 0.0;
          mat.roughness = 0.4;
          mat.metalness = 0.01;
          break;

        case 'nug_nails':
          mat.map = loadFemaleTexture('/models/textures/Base/Std_Nails_Diffuse.jpg');
          mat.normalMap = loadFemaleTexture('/models/textures/Base/Std_Nails_Normal.png', 'linear');
          mat.color = new THREE.Color(0xf2d1c4);
          mat.emissive = new THREE.Color(0x000000);
          mat.emissiveIntensity = 0.0;
          mat.roughness = 0.26;
          mat.metalness = 0.03;
          break;

        case 'nug_eyelash':
          console.log('  -> set eyelash textures');
          child.visible = true;
          mat.color = new THREE.Color(0x111111);
          mat.emissive = new THREE.Color(0x000000);
          mat.emissiveIntensity = 0.0;
          mat.transparent = true;
          mat.opacity = 1.0;
          mat.depthWrite = false;
          mat.depthTest = true;
          mat.side = THREE.DoubleSide;
          mat.roughness = 0.35;
          mat.metalness = 0.0;
          mat.alphaTest = 0.2;
          mat.blending = THREE.NormalBlending;
          child.renderOrder = 2000;

          mat.map = loadFemaleTexture(FEMALE_EYELASH_TEXTURES.diffuse);
          mat.normalMap = loadFemaleTexture(FEMALE_EYELASH_TEXTURES.normal, 'linear');
          const eyelashAlpha = loadFemaleTexture(FEMALE_EYELASH_TEXTURES.alpha, 'linear');
          const eyelashOrm = loadFemaleTexture(FEMALE_EYELASH_TEXTURES.orm, 'linear');
          mat.alphaMap = eyelashAlpha;
          mat.roughnessMap = eyelashOrm;
          mat.metalnessMap = eyelashOrm;
          mat.aoMap = eyelashOrm;
          mat.aoMapIntensity = 0.4;
          break;

        case 'eyebrow_transparency':
        case 'initialshadinggroup_transparency':
          mat.color = new THREE.Color(0xffffff);
          mat.emissive = new THREE.Color(0x000000);
          mat.emissiveIntensity = 0.0;
          mat.transparent = true;
          mat.opacity = 1.0;
          mat.depthWrite = false;
          mat.alphaTest = 0.2;
          mat.map = loadFemaleTexture('/models/textures/Base/initialShadingGroup_Transparency_Diffuse.jpg');
          mat.normalMap = loadFemaleTexture('/models/textures/Base/initialShadingGroup_Transparency_Normal.jpg', 'linear');
          mat.roughness = 1.0; // 完全にマット
          mat.metalness = 0.0;
          mat.envMapIntensity = 0.0; // 環境反射を完全に無効化
          break;

        case 'nug_tearline_r':
        case 'nug_tearline_l':
          mat.color = new THREE.Color(0xf4cdbe);
          mat.transparent = true;
          mat.opacity = 0.35;
          mat.depthWrite = false;
          mat.alphaTest = 0.05;
          mat.map = null;
          mat.alphaMap = null;
          mat.roughness = 0.2;
          mat.metalness = 0.0;
          mat.visible = true;
          break;

        case 'slim_fit_pants':
          console.log('  -> set pants texture (white - no diffuse map)');
          // 白にするためテクスチャを無効化
          mat.map = null;
          mat.normalMap = loadFemaleTexture('/models/textures/Base/Slim_fit_pants_Normal.jpg', 'linear');
          mat.color = new THREE.Color(0xffffff); // 白
          mat.emissive = new THREE.Color(0x000000);
          mat.emissiveIntensity = 0.0;
          mat.roughness = 0.45;
          mat.metalness = 0.07;
          break;

        case 'sport_sneakers':
          console.log('  -> set sneakers texture');
          mat.map = loadFemaleTexture('/models/textures/Base/Sport_sneakers_Diffuse.jpg');
          mat.normalMap = loadFemaleTexture('/models/textures/Base/Sport_sneakers_Normal.jpg', 'linear');
          mat.color = new THREE.Color(0xffffff);
          mat.emissive = new THREE.Color(0x000000);
          mat.emissiveIntensity = 0.0;
          mat.roughness = 0.38;
          mat.metalness = 0.06;
          break;

        case 'turtleneck_sweater':
          console.log('  -> set sweater texture (grey - no diffuse map)');
          // グレーにするためテクスチャを無効化
          mat.map = null;
          mat.normalMap = loadFemaleTexture('/models/textures/Base/Turtleneck_sweater_Normal.png', 'linear');
          mat.color = new THREE.Color(0x808080); // グレー
          mat.emissive = new THREE.Color(0x000000);
          mat.emissiveIntensity = 0.0;
          mat.roughness = 0.55;
          mat.metalness = 0.06;
          break;

        case 'nug_eye_onudlusion_r':
        case 'nug_eye_onudlusion_l':
        case 'nug_eye_onuglusion_r':
        case 'nug_eye_onuglusion_l':
          mat.color = new THREE.Color(0x1a1a1a);
          mat.transparent = true;
          mat.opacity = 0.45;
          mat.depthWrite = false;
          mat.alphaTest = 0.01;
          mat.map = null;
          mat.alphaMap = null;
          mat.roughness = 0.5;
          mat.metalness = 0.0;
          mat.visible = true;
          break;

        default:
          mat.color = new THREE.Color(0xc0997f);
          mat.emissive = new THREE.Color(0x000000);
          mat.emissiveIntensity = 0.0;
          mat.roughness = 0.5;
          mat.metalness = 0.02;
          console.log(`  -> default color applied for ${matName}`);
          break;
      }

      mat.transparent = mat.transparent ?? false;
      if (!mat.transparent) {
        mat.opacity = 1.0;
      }

      mat.needsUpdate = true;
    });
  });

  scene.traverse((mesh: any) => {
    if (!mesh.isMesh) return;
    const lowerMeshName = (mesh.name || '').toLowerCase();

    if (lowerMeshName.includes('tearline')) {
      mesh.visible = true;
      mesh.renderOrder = Math.max(mesh.renderOrder || 0, 1);
    }

    if (
      lowerMeshName.includes('nug_base_eye') ||
      lowerMeshName.includes('onuglusion') ||
      lowerMeshName.includes('onudlusion')
    ) {
      mesh.visible = true;
    }
  });

  // すべてのテクスチャ読み込みが完了するまで待機
  console.log(`[applyMotherAvatarTextures] Waiting for ${textureLoadPromises.length} textures to load...`);
  await Promise.all(textureLoadPromises).catch((error) => {
    console.warn('[applyMotherAvatarTextures] Some textures failed to load:', error);
  });
  console.log('[applyMotherAvatarTextures] All textures loaded successfully');

  scene.userData.femaleTexturesApplied = true;
  scene.userData.texturesApplied = true;
  (window as any).__APPLY_MOTHER_DEBUG__ = {
    appliedAt: new Date().toISOString(),
    sceneName: scene.name,
    texturesApplied: true
  };
  (window as any).__FEMALE_AVATAR_SCENE__ = scene;
  console.log('[applyMotherAvatarTextures] done');
}
