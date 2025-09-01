'use client';

import React, { useRef, useEffect, useState, Suspense, lazy } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';

// 少年アバター用のリップシンクコンポーネントを動的インポート
// const BoyAvatarLipSync = lazy(() => import('./BoyAvatarLipSync'));
// const SimpleBoyAvatar = lazy(() => import('./SimpleBoyAvatar'));

interface AvatarModelProps {
  isSpeaking: boolean;
  audioLevel?: number;
  currentWord?: string;
  currentPhoneme?: string;
  speechProgress?: number;
  audioData?: Float32Array;
  audioFrequency?: number;
  onLoaded?: () => void;
  modelPath?: string;
  lipSyncIntensity?: number;
}

// 日本語の音素に基づくモーフターゲットマッピング（精度向上版）
const PhonemeToMorphs: { [key: string]: { [morphName: string]: number } } = {
  // 母音（より詳細なビジームと口の形）
  'あ': { 
    'A25_Jaw_Open': 0.7, 
    'V_Open': 0.6,
    'Mouth_Open': 0.5,
    'A44_Mouth_Upper_Up_Left': 0.2,
    'A45_Mouth_Upper_Up_Right': 0.2,
    'A46_Mouth_Lower_Down_Left': 0.3,
    'A47_Mouth_Lower_Down_Right': 0.3,
    'V_Lip_Open': 0.4
  },
  'い': { 
    'A25_Jaw_Open': 0.15,
    'V_Wide': 0.5,
    'A50_Mouth_Stretch_Left': 0.4,
    'A51_Mouth_Stretch_Right': 0.4,
    'A38_Mouth_Smile_Left': 0.2,
    'A39_Mouth_Smile_Right': 0.2,
    'Mouth_Widen': 0.3
  },
  'う': { 
    'A25_Jaw_Open': 0.2,
    'A30_Mouth_Pucker': 0.5,
    'A29_Mouth_Funnel': 0.3,
    'V_Tight_O': 0.4,
    'Mouth_Pucker': 0.4,
    'A33_Mouth_Roll_Upper': 0.1,
    'A34_Mouth_Roll_Lower': 0.1
  },
  'え': { 
    'A25_Jaw_Open': 0.35,
    'V_Wide': 0.3,
    'Mouth_Open': 0.25,
    'A50_Mouth_Stretch_Left': 0.2,
    'A51_Mouth_Stretch_Right': 0.2,
    'A44_Mouth_Upper_Up_Left': 0.1,
    'A45_Mouth_Upper_Up_Right': 0.1
  },
  'お': { 
    'A25_Jaw_Open': 0.45,
    'V_Open': 0.3,
    'A29_Mouth_Funnel': 0.4,
    'V_Tight_O': 0.3,
    'Mouth_Open': 0.35,
    'A33_Mouth_Roll_Upper': 0.15,
    'A34_Mouth_Roll_Lower': 0.15
  },
  
  // カタカナ（同じパターン）
  'ア': { 
    'A25_Jaw_Open': 0.7, 
    'V_Open': 0.6,
    'Mouth_Open': 0.5,
    'A44_Mouth_Upper_Up_Left': 0.2,
    'A45_Mouth_Upper_Up_Right': 0.2,
    'A46_Mouth_Lower_Down_Left': 0.3,
    'A47_Mouth_Lower_Down_Right': 0.3,
    'V_Lip_Open': 0.4
  },
  'イ': { 
    'A25_Jaw_Open': 0.15,
    'V_Wide': 0.5,
    'A50_Mouth_Stretch_Left': 0.4,
    'A51_Mouth_Stretch_Right': 0.4,
    'A38_Mouth_Smile_Left': 0.2,
    'A39_Mouth_Smile_Right': 0.2
  },
  'ウ': { 
    'A25_Jaw_Open': 0.2,
    'A30_Mouth_Pucker': 0.5,
    'A29_Mouth_Funnel': 0.3,
    'V_Tight_O': 0.4,
    'Mouth_Pucker': 0.4
  },
  'エ': { 
    'A25_Jaw_Open': 0.35,
    'V_Wide': 0.3,
    'Mouth_Open': 0.25,
    'A50_Mouth_Stretch_Left': 0.2,
    'A51_Mouth_Stretch_Right': 0.2
  },
  'オ': { 
    'A25_Jaw_Open': 0.45,
    'V_Open': 0.3,
    'A29_Mouth_Funnel': 0.4,
    'V_Tight_O': 0.3,
    'Mouth_Open': 0.35
  },
  
  // ま行（唇を使う音）
  'ま': { 
    'A37_Mouth_Close': 0.3,
    'V_Explosive': 0.2,
    'A25_Jaw_Open': 0.25,
    'A48_Mouth_Press_Left': 0.2,
    'A49_Mouth_Press_Right': 0.2,
    'Mouth_Lips_Part': 0.3
  },
  'み': { 
    'A37_Mouth_Close': 0.25,
    'V_Wide': 0.15,
    'A25_Jaw_Open': 0.1,
    'A48_Mouth_Press_Left': 0.15,
    'A49_Mouth_Press_Right': 0.15
  },
  'む': { 
    'A37_Mouth_Close': 0.25,
    'A30_Mouth_Pucker': 0.2,
    'A25_Jaw_Open': 0.1,
    'A48_Mouth_Press_Left': 0.15,
    'A49_Mouth_Press_Right': 0.15
  },
  'め': { 
    'A37_Mouth_Close': 0.15,
    'Mouth_Open': 0.2,
    'A25_Jaw_Open': 0.2,
    'V_Wide': 0.1
  },
  'も': { 
    'A37_Mouth_Close': 0.15,
    'A29_Mouth_Funnel': 0.25,
    'A25_Jaw_Open': 0.3,
    'V_Tight_O': 0.2
  },
  
  // ば行・ぱ行（破裂音）
  'ば': { 'V_Explosive': 0.4, 'A25_Jaw_Open': 0.5, 'V_Open': 0.3 },
  'び': { 'V_Explosive': 0.3, 'A25_Jaw_Open': 0.15, 'V_Wide': 0.3 },
  'ぶ': { 'V_Explosive': 0.3, 'A25_Jaw_Open': 0.2, 'A30_Mouth_Pucker': 0.3 },
  'べ': { 'V_Explosive': 0.3, 'A25_Jaw_Open': 0.3, 'V_Wide': 0.2 },
  'ぼ': { 'V_Explosive': 0.3, 'A25_Jaw_Open': 0.4, 'A29_Mouth_Funnel': 0.3 },
  
  // た行（舌を使う音）
  'た': { 'V_Dental_Lip': 0.2, 'A25_Jaw_Open': 0.5, 'V_Open': 0.3, 'V_Tongue_up': 0.2 },
  'ち': { 'V_Affricate': 0.3, 'A25_Jaw_Open': 0.15, 'V_Wide': 0.3, 'V_Tongue_Raise': 0.2 },
  'つ': { 'V_Affricate': 0.3, 'A25_Jaw_Open': 0.2, 'V_Tight': 0.3, 'V_Tongue_up': 0.2 },
  'て': { 'V_Dental_Lip': 0.2, 'A25_Jaw_Open': 0.3, 'V_Wide': 0.2, 'V_Tongue_up': 0.1 },
  'と': { 'V_Dental_Lip': 0.2, 'A25_Jaw_Open': 0.4, 'V_Tight_O': 0.2, 'V_Tongue_up': 0.1 },
  
  // さ行（摩擦音）
  'さ': { 'V_Tight': 0.2, 'A25_Jaw_Open': 0.4, 'V_Open': 0.2, 'V_Dental_Lip': 0.1 },
  'し': { 'V_Tight': 0.3, 'A25_Jaw_Open': 0.1, 'V_Wide': 0.2, 'V_Affricate': 0.2 },
  'す': { 'V_Tight': 0.3, 'A25_Jaw_Open': 0.15, 'V_Tight_O': 0.2, 'A30_Mouth_Pucker': 0.1 },
  'せ': { 'V_Tight': 0.2, 'A25_Jaw_Open': 0.25, 'V_Wide': 0.15 },
  'そ': { 'V_Tight': 0.2, 'A25_Jaw_Open': 0.35, 'V_Tight_O': 0.15 },
  
  // ん（鼻音）
  'ん': { 
    'A37_Mouth_Close': 0.5,
    'Mouth_Lips_Part': 0.05,
    'A20_Cheek_Puff': 0.05,
    'V_None': 0.3
  },
  'ン': { 
    'A37_Mouth_Close': 0.5,
    'Mouth_Lips_Part': 0.05,
    'A20_Cheek_Puff': 0.05,
    'V_None': 0.3
  },
};

// 表情・感情のプリセット
const EmotionPresets: { [key: string]: { [morphName: string]: number } } = {
  'neutral': {},
  'focused': {
    'A02_Brow_Down_Left': 0.15,
    'A03_Brow_Down_Right': 0.15,
    'A16_Eye_Squint_Left': 0.05,
    'A17_Eye_Squint_Right': 0.05,
    'A35_Mouth_Shrug_Upper': 0.05
  },
  'thinking': {
    'A01_Brow_Inner_Up': 0.2,
    'A04_Brow_Outer_Up_Left': 0.1,
    'A05_Brow_Outer_Up_Right': 0.1,
    'A06_Eye_Look_Up_Left': 0.1,
    'A07_Eye_Look_Up_Right': 0.1,
    'A31_Mouth_Left': 0.1
  }
};

// 文字から音素マッピングを取得
function getPhonemeMapping(char: string): { [morphName: string]: number } {
  // 直接マッピングがある場合
  if (PhonemeToMorphs[char]) {
    return PhonemeToMorphs[char];
  }
  
  // 子音を含む場合、母音部分を抽出
  const vowelMap: { [key: string]: string } = {
    'か': 'あ', 'き': 'い', 'く': 'う', 'け': 'え', 'こ': 'お',
    'が': 'あ', 'ぎ': 'い', 'ぐ': 'う', 'げ': 'え', 'ご': 'お',
    'さ': 'あ', 'し': 'い', 'す': 'う', 'せ': 'え', 'そ': 'お',
    'ざ': 'あ', 'じ': 'い', 'ず': 'う', 'ぜ': 'え', 'ぞ': 'お',
    'た': 'あ', 'ち': 'い', 'つ': 'う', 'て': 'え', 'と': 'お',
    'だ': 'あ', 'ぢ': 'い', 'づ': 'う', 'で': 'え', 'ど': 'お',
    'な': 'あ', 'に': 'い', 'ぬ': 'う', 'ね': 'え', 'の': 'お',
    'は': 'あ', 'ひ': 'い', 'ふ': 'う', 'へ': 'え', 'ほ': 'お',
    'ば': 'あ', 'び': 'い', 'ぶ': 'う', 'べ': 'え', 'ぼ': 'お',
    'ぱ': 'あ', 'ぴ': 'い', 'ぷ': 'う', 'ぺ': 'え', 'ぽ': 'お',
    'や': 'あ', 'ゆ': 'う', 'よ': 'お',
    'ら': 'あ', 'り': 'い', 'る': 'う', 'れ': 'え', 'ろ': 'お',
    'わ': 'あ', 'を': 'お',
    // カタカナ
    'カ': 'ア', 'キ': 'イ', 'ク': 'ウ', 'ケ': 'エ', 'コ': 'オ',
    'ガ': 'ア', 'ギ': 'イ', 'グ': 'ウ', 'ゲ': 'エ', 'ゴ': 'オ',
    'サ': 'ア', 'シ': 'イ', 'ス': 'ウ', 'セ': 'エ', 'ソ': 'オ',
    'ザ': 'ア', 'ジ': 'イ', 'ズ': 'ウ', 'ゼ': 'エ', 'ゾ': 'オ',
    'タ': 'ア', 'チ': 'イ', 'ツ': 'ウ', 'テ': 'エ', 'ト': 'オ',
    'ダ': 'ア', 'ヂ': 'イ', 'ヅ': 'ウ', 'デ': 'エ', 'ド': 'オ',
    'ナ': 'ア', 'ニ': 'イ', 'ヌ': 'ウ', 'ネ': 'エ', 'ノ': 'オ',
    'ハ': 'ア', 'ヒ': 'イ', 'フ': 'ウ', 'ヘ': 'エ', 'ホ': 'オ',
    'バ': 'ア', 'ビ': 'イ', 'ブ': 'ウ', 'ベ': 'エ', 'ボ': 'オ',
    'パ': 'ア', 'ピ': 'イ', 'プ': 'ウ', 'ペ': 'エ', 'ポ': 'オ',
    'マ': 'ま', 'ミ': 'み', 'ム': 'む', 'メ': 'め', 'モ': 'も',
    'ヤ': 'ア', 'ユ': 'ウ', 'ヨ': 'オ',
    'ラ': 'ア', 'リ': 'イ', 'ル': 'ウ', 'レ': 'エ', 'ロ': 'オ',
    'ワ': 'ア', 'ヲ': 'オ',
  };
  
  const vowel = vowelMap[char];
  if (vowel && PhonemeToMorphs[vowel]) {
    return PhonemeToMorphs[vowel];
  }
  
  // デフォルト値
  return { 'A25_Jaw_Open': 0.2, 'Mouth_Open': 0.15 };
}

function AvatarModel({ 
  isSpeaking, 
  audioLevel = 0, 
  currentWord = '', 
  currentPhoneme = '',
  speechProgress = 0,
  audioData,
  audioFrequency = 0,
  onLoaded,
  modelPath = '/models/man-grey-suit-optimized.glb'
}: AvatarModelProps) {
  // モデルタイプの判定
  const isBoyModel = modelPath.includes('BOY_4');
  
  // 少年アバターの場合は専用コンポーネントを使用
  if (isBoyModel) {
    // シンプル版を使用（より安定）
    // SimpleBoyAvatarは存在しないため、nullを返す
    return null;
  }
  
  // モデル別のリップシンク設定
  const lipSyncConfig = {
    jawMultiplier: isBoyModel ? 1.4 : 1.0,  // 少年は顎の動きを大きく
    mouthMultiplier: isBoyModel ? 1.3 : 1.0, // 少年は口の動きを大きく
    tongueMultiplier: isBoyModel ? 1.2 : 1.0, // 少年は舌の動きも調整
    blinkInterval: isBoyModel ? 4 : 3, // 少年は瞬きの頻度を少し下げる
  };
  const group = useRef<THREE.Group>(null);
  const [morphTargets, setMorphTargets] = useState<any[]>([]);
  const [oralMeshes, setOralMeshes] = useState<any[]>([]);
  const lowerTeethMesh = useRef<any>(null);
  const upperTeethMesh = useRef<any>(null);
  const tongueMesh = useRef<any>(null);
  const jawBone = useRef<any>(null);
  const lowerTeethBone = useRef<any>(null);
  const teeth01Bone = useRef<any>(null);
  const teeth02Bone = useRef<any>(null);
  const tongue01Bone = useRef<any>(null);
  const tongue02Bone = useRef<any>(null);
  const tongue03Bone = useRef<any>(null);
  const tongueBonesOriginal = useRef<{ [key: string]: { position: THREE.Vector3, rotation: THREE.Euler } }>({});
  const animationTime = useRef(0);
  const blinkTimer = useRef(0);
  const nextBlinkTime = useRef(3 + Math.random() * 3);
  const isBlinking = useRef(false);
  const currentMorphValues = useRef<{ [key: string]: number }>({});
  const emotionMorphValues = useRef<{ [key: string]: number }>({});
  const oralMeshOriginalPositions = useRef<{ [key: string]: THREE.Vector3 }>({});
  const lowerTeethOriginalY = useRef<number>(0);
  const jawBoneOriginalRotation = useRef<THREE.Euler | null>(null);
  const currentEmotion = useRef<string>('neutral');
  const microExpressionTimer = useRef(0);
  const previousWord = useRef<string>('');
  const wordChangeTime = useRef<number>(0);
  const anticipationMorphs = useRef<{ [key: string]: number }>({});
  const audioHistory = useRef<number[]>([]);
  const smoothedAudioLevel = useRef<number>(0);
  const peakDetectionThreshold = useRef<number>(0.3);
  const lastPeakTime = useRef<number>(0);
  
  const { scene } = useGLTF(modelPath);
  
  useEffect(() => {
    if (!scene) return;
    
    console.log('=== FinalLipSyncAvatar: 初期化 ===');
    
    // モデルが読み込まれたことを通知
    if (onLoaded) {
      // 少し遅延を入れて確実にすべてが初期化されてから通知
      setTimeout(() => {
        onLoaded();
      }, 100);
    }
    const morphMeshes: any[] = [];
    const oralMeshList: any[] = [];
    
    // まずボーンを探す
    scene.traverse((child: any) => {
      if (child.isBone) {
        // CC_Base_JawRootが下顎のルートボーン
        if (child.name === 'CC_Base_JawRoot') {
          jawBone.current = child;
          jawBoneOriginalRotation.current = child.rotation.clone();
          console.log('顎ボーン発見:', child.name);
        } else if (child.name === 'CC_Base_Teeth01') {
          teeth01Bone.current = child;
          console.log('歯ボーン01発見:', child.name);
        } else if (child.name === 'CC_Base_Teeth02') {
          teeth02Bone.current = child;
          console.log('歯ボーン02発見:', child.name);
        } else if (child.name === 'CC_Base_Tongue01') {
          tongue01Bone.current = child;
          tongueBonesOriginal.current['tongue01'] = {
            position: child.position.clone(),
            rotation: child.rotation.clone()
          };
          console.log('舌ボーン01発見:', child.name);
        } else if (child.name === 'CC_Base_Tongue02') {
          tongue02Bone.current = child;
          tongueBonesOriginal.current['tongue02'] = {
            position: child.position.clone(),
            rotation: child.rotation.clone()
          };
          console.log('舌ボーン02発見:', child.name);
        } else if (child.name === 'CC_Base_Tongue03') {
          tongue03Bone.current = child;
          tongueBonesOriginal.current['tongue03'] = {
            position: child.position.clone(),
            rotation: child.rotation.clone()
          };
          console.log('舌ボーン03発見:', child.name);
        }
      }
    });
    
    scene.traverse((child: any) => {
      if (child.isMesh || child.isSkinnedMesh) {
        child.frustumCulled = true;
        child.castShadow = true;
        child.receiveShadow = true;
        
        // 特定のメッシュを識別（名前とマテリアルで判定）
        if (child.name === 'CC_Base_Body_9' || 
            (child.material && child.material.name && child.material.name.includes('Std_Lower_Teeth'))) {
          lowerTeethMesh.current = child;
          // ワールド座標での位置を取得
          const worldPos = new THREE.Vector3();
          child.getWorldPosition(worldPos);
          lowerTeethOriginalY.current = worldPos.y;
          console.log('下の歯メッシュ発見:', child.name);
          console.log('  元のY位置(ワールド):', worldPos.y);
          console.log('  元のY位置(ローカル):', child.position.y);
          console.log('  親:', child.parent?.name);
          console.log('  isSkinnedMesh:', child.isSkinnedMesh);
          if (child.skeleton) {
            console.log('  スケルトンあり、ボーン数:', child.skeleton.bones.length);
            // 関連するボーンを探す
            child.skeleton.bones.forEach((bone: any, idx: number) => {
              if (bone.name.toLowerCase().includes('jaw') || 
                  bone.name.toLowerCase().includes('teeth') ||
                  bone.name.toLowerCase().includes('chin')) {
                console.log(`    関連ボーン[${idx}]: ${bone.name}`);
              }
            });
          }
        } else if (child.name === 'CC_Base_Body_8' ||
                   (child.material && child.material.name && child.material.name.includes('Std_Upper_Teeth'))) {
          upperTeethMesh.current = child;
          console.log('上の歯メッシュ発見:', child.name);
        } else if (child.name === 'CC_Base_Body_1' ||
                   (child.material && child.material.name && child.material.name.includes('Std_Tongue'))) {
          tongueMesh.current = child;
          tongueBonesOriginal.current['tongueMesh'] = {
            position: child.position.clone(),
            rotation: child.rotation.clone()
          };
          console.log('舌メッシュ発見:', child.name);
          console.log('  元の位置:', child.position);
        }
        
        // 口腔内メッシュの判定（マテリアル名ベース）
        let isOralMesh = false;
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat: any) => {
            if (mat.name) {
              const matNameLower = mat.name.toLowerCase();
              if (matNameLower.includes('teeth') || 
                  matNameLower.includes('tooth') || 
                  matNameLower.includes('tongue')) {
                isOralMesh = true;
              }
            }
          });
        }
        
        // モーフターゲットを持つメッシュを収集
        if (child.morphTargetInfluences && child.morphTargetInfluences.length > 0) {
          morphMeshes.push(child);
          
          // 口腔内メッシュも別途記録
          if (isOralMesh) {
            oralMeshList.push(child);
            console.log(`口腔内メッシュ発見: ${child.name}`);
            // 元の位置を保存
            oralMeshOriginalPositions.current[child.uuid] = child.position.clone();
          }
        }
        
        if (child.material) {
          const processMaterial = (mat: any) => {
            mat.depthWrite = true;
            mat.depthTest = true;
            mat.needsUpdate = true;
          };
          
          if (Array.isArray(child.material)) {
            child.material.forEach(processMaterial);
          } else {
            processMaterial(child.material);
          }
        }
      }
    });
    
    console.log(`総モーフターゲットメッシュ数: ${morphMeshes.length}`);
    console.log(`口腔内メッシュ数: ${oralMeshList.length}`);
    
    // 初期化時にすべてのモーフターゲットを0にリセット
    morphMeshes.forEach(mesh => {
      if (mesh.morphTargetInfluences) {
        for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
          mesh.morphTargetInfluences[i] = 0;
        }
      }
    });
    
    // 歯のボーンを初期位置にリセット
    if (teeth01Bone.current) {
      teeth01Bone.current.position.set(0, 0, 0);
      teeth01Bone.current.rotation.set(0, 0, 0);
      teeth01Bone.current.updateMatrixWorld(true);
    }
    if (teeth02Bone.current) {
      teeth02Bone.current.position.set(0, 0, 0);
      teeth02Bone.current.rotation.set(0, 0, 0);
      teeth02Bone.current.updateMatrixWorld(true);
    }
    
    // 下の歯メッシュを初期位置にリセット
    if (lowerTeethMesh.current) {
      lowerTeethMesh.current.position.set(0, 0, 0);
      lowerTeethMesh.current.rotation.set(0, 0, 0);
    }
    
    setMorphTargets(morphMeshes);
    setOralMeshes(oralMeshList);
  }, [scene]);
  
  useFrame((state, delta) => {
    if (!group.current) return;
    
    animationTime.current += delta;
    microExpressionTimer.current += delta;
    
    // 瞬きアニメーション（より自然に）
    blinkTimer.current += delta;
    if (blinkTimer.current >= nextBlinkTime.current) {
      isBlinking.current = true;
      blinkTimer.current = 0;
      nextBlinkTime.current = lipSyncConfig.blinkInterval + Math.random() * 3;
    }
    
    let blinkValue = 0;
    if (isBlinking.current) {
      const blinkProgress = blinkTimer.current / 0.15;
      if (blinkProgress < 1) {
        // より自然な瞬きカーブ
        blinkValue = Math.sin(blinkProgress * Math.PI);
      } else {
        isBlinking.current = false;
      }
    }
    
    // 感情に基づく微表情（マイクロエクスプレッション）
    if (isSpeaking) {
      // 話している時は中立的な表情
      currentEmotion.current = 'neutral';
      
      // 微細な表情変化（リアリティ向上）
      const microExpression = Math.sin(microExpressionTimer.current * 2) * 0.03;
      emotionMorphValues.current['A01_Brow_Inner_Up'] = microExpression;
    } else {
      currentEmotion.current = 'neutral';
    }
    
    // 感情モーフの適用
    const emotionPreset = EmotionPresets[currentEmotion.current] || {};
    Object.entries(emotionPreset).forEach(([morphName, targetValue]) => {
      const currentValue = emotionMorphValues.current[morphName] || 0;
      emotionMorphValues.current[morphName] = currentValue + (targetValue - currentValue) * 0.1;
    });
    
    // 単語が変わったかチェック（先行動作のため）
    if (currentWord !== previousWord.current) {
      previousWord.current = currentWord;
      wordChangeTime.current = animationTime.current;
      
      // 次の音素の先行準備（予測動作）
      if (currentWord && currentWord.length > 0) {
        const nextChar = currentWord[0];
        const nextMapping = getPhonemeMapping(nextChar);
        
        // 先行動作として口の形を準備（50%の強度で）
        Object.entries(nextMapping).forEach(([morphName, value]) => {
          anticipationMorphs.current[morphName] = value * 0.5;
        });
      }
    }
    
    // 音声波形の分析と処理
    if (audioData && audioData.length > 0) {
      // 音声レベルの計算（RMS - Root Mean Square）
      let sum = 0;
      for (let i = 0; i < audioData.length; i++) {
        sum += audioData[i] * audioData[i];
      }
      const rms = Math.sqrt(sum / audioData.length);
      
      // 音声履歴を保持（過去10フレーム）
      audioHistory.current.push(rms);
      if (audioHistory.current.length > 10) {
        audioHistory.current.shift();
      }
      
      // 移動平均でスムージング
      const avgLevel = audioHistory.current.reduce((a, b) => a + b, 0) / audioHistory.current.length;
      smoothedAudioLevel.current = avgLevel;
      
      // ピーク検出（音節の区切りを検出）
      if (rms > peakDetectionThreshold.current && animationTime.current - lastPeakTime.current > 0.1) {
        lastPeakTime.current = animationTime.current;
        // ピーク時に次の音素への遷移を促進
        wordChangeTime.current = animationTime.current;
      }
    } else {
      smoothedAudioLevel.current *= 0.95; // 音声データがない場合は減衰
    }
    
    // リップシンクの計算（音声波形同期版）
    const targetMorphs: { [key: string]: number } = {};
    if (isSpeaking) {
      // 実際の音声レベルを使用（スムージング済み）
      const realAudioLevel = smoothedAudioLevel.current || audioLevel || 0.3;
      const baseLevel = Math.min(realAudioLevel * 2, 1.0); // 音声レベルを増幅
      
      // 周波数成分による口の形の調整
      let frequencyModifier = 1.0;
      if (audioFrequency > 0) {
        // 低周波（〜500Hz）: より大きく口を開ける（母音）
        if (audioFrequency < 500) {
          frequencyModifier = 1.2;
        }
        // 中周波（500-2000Hz）: 標準的な口の形
        else if (audioFrequency < 2000) {
          frequencyModifier = 1.0;
        }
        // 高周波（2000Hz〜）: 口を狭める（子音）
        else {
          frequencyModifier = 0.7;
        }
      }
      
      if (currentWord && currentWord.length > 0) {
        // 現在の文字と次の文字を考慮
        const currentChar = currentWord[0];
        const nextChar = currentWord.length > 1 ? currentWord[1] : null;
        
        const currentMapping = getPhonemeMapping(currentChar);
        
        // 音声レベルに完全に同期した口の動き
        Object.entries(currentMapping).forEach(([morphName, value]) => {
          // 音声波形の強度に直接連動
          const syncedValue = value * baseLevel * frequencyModifier;
          
          // 顎の動きは音声レベルに特に敏感に反応
          if (morphName === 'A25_Jaw_Open') {
            targetMorphs[morphName] = syncedValue * (0.8 + realAudioLevel * 0.4);
          } else {
            targetMorphs[morphName] = syncedValue;
          }
        });
        
        // 次の音素への準備（音声のピークを検出した場合により強く）
        if (nextChar) {
          const peakInfluence = (animationTime.current - lastPeakTime.current < 0.05) ? 0.4 : 0.2;
          const nextMapping = getPhonemeMapping(nextChar);
          Object.entries(nextMapping).forEach(([morphName, value]) => {
            const currentValue = targetMorphs[morphName] || 0;
            targetMorphs[morphName] = currentValue * (1 - peakInfluence) + value * baseLevel * peakInfluence;
          });
        }
        
        // 音声レベルによる追加の口の開き（リアルタイム同期）
        const additionalOpen = realAudioLevel * 0.3;
        targetMorphs['A25_Jaw_Open'] = (targetMorphs['A25_Jaw_Open'] || 0) + additionalOpen;
        targetMorphs['Mouth_Open'] = (targetMorphs['Mouth_Open'] || 0) + additionalOpen * 0.7;
        
      } else {
        // デフォルトでも音声レベルに応じて口を動かす
        targetMorphs['A25_Jaw_Open'] = 0.3 * baseLevel;
        targetMorphs['Mouth_Open'] = 0.2 * baseLevel;
      }
      
      // 音声の立ち上がりと立ち下がりを検出して先行動作
      if (audioHistory.current.length >= 2) {
        const trend = audioHistory.current[audioHistory.current.length - 1] - audioHistory.current[audioHistory.current.length - 2];
        if (trend > 0.05) {
          // 音が大きくなっている：口を開ける準備
          Object.keys(targetMorphs).forEach(morphName => {
            targetMorphs[morphName] *= 1.1;
          });
        } else if (trend < -0.05) {
          // 音が小さくなっている：口を閉じる準備
          Object.keys(targetMorphs).forEach(morphName => {
            targetMorphs[morphName] *= 0.9;
          });
        }
      }
    }
    
    // スムーズな補間（音声に即座に反応）
    Object.entries(targetMorphs).forEach(([morphName, targetValue]) => {
      const currentValue = currentMorphValues.current[morphName] || 0;
      // 音声波形に即座に反応するため補間速度を最大化（0.5）
      const lerpSpeed = isSpeaking ? 0.5 : 0.35;
      
      // モデル別の係数を適用
      let adjustedValue = targetValue;
      if (morphName.includes('Jaw')) {
        adjustedValue *= lipSyncConfig.jawMultiplier;
      } else if (morphName.includes('Mouth') || morphName.includes('Lip')) {
        adjustedValue *= lipSyncConfig.mouthMultiplier;
      }
      
      currentMorphValues.current[morphName] = currentValue + (adjustedValue - currentValue) * lerpSpeed;
    });
    
    // 使用されなくなったモーフを徐々に0に戻す
    Object.keys(currentMorphValues.current).forEach(morphName => {
      if (!targetMorphs[morphName]) {
        currentMorphValues.current[morphName] *= 0.85; // より速く閉じる
        if (currentMorphValues.current[morphName] < 0.01) {
          delete currentMorphValues.current[morphName];
        }
      }
    });
    
    // 先行動作もクリア
    Object.keys(anticipationMorphs.current).forEach(morphName => {
      anticipationMorphs.current[morphName] *= 0.9;
      if (anticipationMorphs.current[morphName] < 0.01) {
        delete anticipationMorphs.current[morphName];
      }
    });
    
    // 頭の微細な動き（控えめ）
    group.current.rotation.y = Math.sin(animationTime.current * 0.3) * 0.003;
    group.current.rotation.x = Math.sin(animationTime.current * 0.5) * 0.002;
    group.current.position.y = Math.sin(animationTime.current * 0.8) * 0.001;
    
    // 舌の位置と回転の変数（スコープ外でも使用するため）
    const tongueRotation = { x: 0, y: 0, z: 0 };
    const tonguePosition = { x: 0, y: 0, z: 0 };
    
    // 舌のモーフターゲット制御 - 下唇・下の歯と連動
    if (isSpeaking) {
      
      // 下唇の動きを取得して舌も連動させる
      const lowerLipLeft = currentMorphValues.current['A46_Mouth_Lower_Down_Left'] || 0;
      const lowerLipRight = currentMorphValues.current['A47_Mouth_Lower_Down_Right'] || 0;
      const jawOpen = currentMorphValues.current['A25_Jaw_Open'] || 0;
      const lowerLipAvg = (lowerLipLeft + lowerLipRight) / 2;
      
      // 顎が開くと舌も下がる - モーフターゲットで制御
      tongueRotation.x = 0; // 使用しない
      tongueRotation.y = 0; // 使用しない
      tongueRotation.z = 0; // 使用しない
      tonguePosition.x = 0; // 使用しない
      tonguePosition.y = (lowerLipAvg * 0.5 + jawOpen * 0.8) * lipSyncConfig.tongueMultiplier; // モデル別に調整
      tonguePosition.z = 0; // 使用しない
      
      if (currentWord && currentWord.length > 0) {
        const currentChar = currentWord[0];
        
        // 音素に応じた追加の調整
        // た行・だ行・な行・ら行：舌を上に（歯茎音）
        if ('たちつてとだぢづでどなにぬねのらりるれろタチツテトダヂヅデドナニヌネノラリルレロ'.includes(currentChar)) {
          // 回転なし、Y軸の移動のみ
          tonguePosition.y -= 0.05; // 上に移動（負の値で上）
        }
        // さ行・ざ行：舌を歯茎近くに（摩擦音）
        else if ('さしすせそざじずぜぞサシスセソザジズゼゾ'.includes(currentChar)) {
          // 回転なし、Y軸の移動のみ
          tonguePosition.y -= 0.04; // 上に移動（負の値で上）
        }
        // か行・が行：舌を後ろに（軟口蓋音）
        else if ('かきくけこがぎぐげごカキクケコガギグゲゴ'.includes(currentChar)) {
          // 回転なし、Y軸の移動のみ
          // 基本の動きに任せる
        }
        // い：舌を高く前に（前舌母音）
        else if ('いイ'.includes(currentChar)) {
          // 回転なし、Y軸の移動のみ
          tonguePosition.y -= 0.03; // 上に移動（負の値で上）
        }
        // う：舌を後ろに（後舌母音）
        else if ('うウ'.includes(currentChar)) {
          // 回転なし、Y軸の移動のみ
          // 基本の動きに任せる
        }
        // あ：口を大きく開ける（舌は下に）
        else if ('あア'.includes(currentChar)) {
          // 回転なし、Y軸の移動のみ
          tonguePosition.y += 0.08; // 下に大きく追加移動（正の値で下）
        }
      }
      
      // 音声レベルに応じて動きを増幅（控えめに）
      const amplification = Math.min((smoothedAudioLevel.current || audioLevel || 0.5) * 1.5, 1.2);
      
      // デバッグログ（2秒ごと）
      if (Math.floor(animationTime.current / 2) !== Math.floor((animationTime.current - delta) / 2)) {
        console.log('舌の制御状態:', {
          currentChar: currentWord && currentWord.length > 0 ? currentWord[0] : 'none',
          tongueRotation,
          tonguePosition,
          amplification,
          tongue01Exists: !!tongue01Bone.current,
          tongue02Exists: !!tongue02Bone.current,
          tongue03Exists: !!tongue03Bone.current,
          audioLevel: smoothedAudioLevel.current || audioLevel
        });
      }
      
      // 現在の回転値を取得（スムーズな補間のため）
      const lerpSpeed = 0.3; // 補間速度
      
      // ボーン制御は使用しない - モーフターゲットのみで制御
      /*
      // CC_Base_Tongue01（舌の根元）- Y軸の移動のみ
      if (tongue01Bone.current && tongueBonesOriginal.current['tongue01']) {
        const original = tongueBonesOriginal.current['tongue01'];
        // 回転なし
        tongue01Bone.current.rotation.x = original.rotation.x;
        tongue01Bone.current.rotation.y = original.rotation.y;
        tongue01Bone.current.rotation.z = original.rotation.z;
        // Y軸の位置のみ移動（負の値で下に移動）
        const targetY = original.position.y - tonguePosition.y * amplification * 3.0; // 根元も非常に大きく
        tongue01Bone.current.position.y += (targetY - tongue01Bone.current.position.y) * lerpSpeed;
        tongue01Bone.current.position.x = original.position.x; // X軸は元の位置
        tongue01Bone.current.position.z = original.position.z; // Z軸は元の位置
        tongue01Bone.current.updateMatrixWorld(true);
      }
      
      // CC_Base_Tongue02（舌の中間）- Y軸の移動のみ
      if (tongue02Bone.current && tongueBonesOriginal.current['tongue02']) {
        const original = tongueBonesOriginal.current['tongue02'];
        // 回転なし
        tongue02Bone.current.rotation.x = original.rotation.x;
        tongue02Bone.current.rotation.y = original.rotation.y;
        tongue02Bone.current.rotation.z = original.rotation.z;
        // Y軸の位置のみ移動（中間部分はより大きく、負の値で下に）
        const targetY = original.position.y - tonguePosition.y * amplification * 5.0; // 中間を極めて大きく
        tongue02Bone.current.position.y += (targetY - tongue02Bone.current.position.y) * lerpSpeed;
        tongue02Bone.current.position.x = original.position.x; // X軸は元の位置
        tongue02Bone.current.position.z = original.position.z; // Z軸は元の位置
        tongue02Bone.current.updateMatrixWorld(true);
      }
      
      // CC_Base_Tongue03（舌先）- Y軸の移動のみ
      if (tongue03Bone.current && tongueBonesOriginal.current['tongue03']) {
        const original = tongueBonesOriginal.current['tongue03'];
        // 回転なし
        tongue03Bone.current.rotation.x = original.rotation.x;
        tongue03Bone.current.rotation.y = original.rotation.y;
        tongue03Bone.current.rotation.z = original.rotation.z;
        // Y軸の位置のみ移動（舌先が最も大きく、負の値で下に）
        const targetY = original.position.y - tonguePosition.y * amplification * 8.0; // 舌先を極限まで大きく
        tongue03Bone.current.position.y += (targetY - tongue03Bone.current.position.y) * lerpSpeed;
        tongue03Bone.current.position.x = original.position.x; // X軸は元の位置
        tongue03Bone.current.position.z = original.position.z; // Z軸は元の位置
        tongue03Bone.current.updateMatrixWorld(true);
      }
      */
      
      // 舌メッシュのモーフターゲットも適用
      if (tongueMesh.current && tongueMesh.current.morphTargetInfluences && tongueMesh.current.morphTargetDictionary) {
        const applyTongueMorph = (name: string, value: number) => {
          const index = tongueMesh.current.morphTargetDictionary[name];
          if (index !== undefined && index < tongueMesh.current.morphTargetInfluences.length) {
            tongueMesh.current.morphTargetInfluences[index] = value * amplification;
          }
        };
        
        // 舌関連のモーフターゲットを適用
        // 下方向の動き（正の値の時に下に動く）
        applyTongueMorph('T02_Tongue_Down', tonguePosition.y > 0 ? tonguePosition.y * 2 : 0);
        applyTongueMorph('V_Tongue_Lower', tonguePosition.y > 0 ? tonguePosition.y * 2 : 0);
        applyTongueMorph('T07_Tongue_Tip_Down', tonguePosition.y > 0 ? tonguePosition.y * 3 : 0);
        
        // 上方向の動き（負の値の時に上に動く）
        applyTongueMorph('T01_Tongue_Up', tonguePosition.y < 0 ? -tonguePosition.y * 2 : 0);
        applyTongueMorph('V_Tongue_Raise', tonguePosition.y < 0 ? -tonguePosition.y * 2 : 0);
        applyTongueMorph('T06_Tongue_Tip_Up', tonguePosition.y < 0 ? -tonguePosition.y * 3 : 0);
        
        // 前後の動き（必要に応じて）
        applyTongueMorph('V_Tongue_Out', tonguePosition.z > 0 ? tonguePosition.z * 5 : 0);
        applyTongueMorph('A52_Tongue_Out', tonguePosition.z > 0 ? tonguePosition.z * 5 : 0);
      }
    } else {
      // 話していない時はモーフターゲットがリセットされる（ボーン制御は使用しない）
      /*
      // 話していない時は元の位置に戻す（Y軸のみ）
      if (tongue01Bone.current && tongueBonesOriginal.current['tongue01']) {
        const original = tongueBonesOriginal.current['tongue01'];
        // 回転は即座に元に戻す
        tongue01Bone.current.rotation.x = original.rotation.x;
        tongue01Bone.current.rotation.y = original.rotation.y;
        tongue01Bone.current.rotation.z = original.rotation.z;
        // Y軸の位置のみスムーズに戻す
        tongue01Bone.current.position.y += (original.position.y - tongue01Bone.current.position.y) * 0.1;
        tongue01Bone.current.position.x = original.position.x;
        tongue01Bone.current.position.z = original.position.z;
        tongue01Bone.current.updateMatrixWorld(true);
      }
      
      if (tongue02Bone.current && tongueBonesOriginal.current['tongue02']) {
        const original = tongueBonesOriginal.current['tongue02'];
        // 回転は即座に元に戻す
        tongue02Bone.current.rotation.x = original.rotation.x;
        tongue02Bone.current.rotation.y = original.rotation.y;
        tongue02Bone.current.rotation.z = original.rotation.z;
        // Y軸の位置のみスムーズに戻す
        tongue02Bone.current.position.y += (original.position.y - tongue02Bone.current.position.y) * 0.1;
        tongue02Bone.current.position.x = original.position.x;
        tongue02Bone.current.position.z = original.position.z;
        tongue02Bone.current.updateMatrixWorld(true);
      }
      
      if (tongue03Bone.current && tongueBonesOriginal.current['tongue03']) {
        const original = tongueBonesOriginal.current['tongue03'];
        // 回転は即座に元に戻す
        tongue03Bone.current.rotation.x = original.rotation.x;
        tongue03Bone.current.rotation.y = original.rotation.y;
        tongue03Bone.current.rotation.z = original.rotation.z;
        // Y軸の位置のみスムーズに戻す
        tongue03Bone.current.position.y += (original.position.y - tongue03Bone.current.position.y) * 0.1;
        tongue03Bone.current.position.x = original.position.x;
        tongue03Bone.current.position.z = original.position.z;
        tongue03Bone.current.updateMatrixWorld(true);
      }
      */
    }
    
    // 下の歯と歯茎を下唇の動きと連動させる（顎ボーンは使わない）
    // CC_Base_Teeth01とCC_Base_Teeth02が下の歯のボーンかチェック
    if (teeth01Bone.current) {
      if (isSpeaking) {
        // 下唇の動きを取得
        const lowerLipLeft = currentMorphValues.current['A46_Mouth_Lower_Down_Left'] || 0;
        const lowerLipRight = currentMorphValues.current['A47_Mouth_Lower_Down_Right'] || 0;
        const jawOpen = currentMorphValues.current['A25_Jaw_Open'] || 0;
        const combinedLipValue = (lowerLipLeft + lowerLipRight) / 2;
        
        // 下の歯を下唇に追従させる
        teeth01Bone.current.position.y = -(combinedLipValue * 0.005 + jawOpen * 0.003);
        teeth01Bone.current.rotation.x = -(combinedLipValue * 0.2 + jawOpen * 0.1);
        teeth01Bone.current.updateMatrixWorld(true);
        
        // デバッグ用（3秒ごとに表示）
        if (Math.floor(animationTime.current / 3) !== Math.floor((animationTime.current - delta) / 3)) {
          console.log('下の歯ボーン制御 (Teeth01):', {
            lipValue: combinedLipValue.toFixed(3),
            jawValue: jawOpen.toFixed(3),
            positionY: teeth01Bone.current.position.y.toFixed(4),
            rotationX: teeth01Bone.current.rotation.x.toFixed(4)
          });
        }
      } else {
        // 元の位置に戻す（スムーズに）
        if (Math.abs(teeth01Bone.current.position.y) > 0.0001) {
          teeth01Bone.current.position.y *= 0.85;
        } else {
          teeth01Bone.current.position.y = 0;
        }
        if (Math.abs(teeth01Bone.current.rotation.x) > 0.0001) {
          teeth01Bone.current.rotation.x *= 0.85;
        } else {
          teeth01Bone.current.rotation.x = 0;
        }
        teeth01Bone.current.updateMatrixWorld(true);
      }
    }
    
    if (teeth02Bone.current) {
      if (isSpeaking) {
        // 下唇の動きを取得
        const lowerLipLeft = currentMorphValues.current['A46_Mouth_Lower_Down_Left'] || 0;
        const lowerLipRight = currentMorphValues.current['A47_Mouth_Lower_Down_Right'] || 0;
        const jawOpen = currentMorphValues.current['A25_Jaw_Open'] || 0;
        const combinedLipValue = (lowerLipLeft + lowerLipRight) / 2;
        
        // 下の歯を下唇に追従させる
        teeth02Bone.current.position.y = -(combinedLipValue * 0.005 + jawOpen * 0.003);
        teeth02Bone.current.rotation.x = -(combinedLipValue * 0.2 + jawOpen * 0.1);
        teeth02Bone.current.updateMatrixWorld(true);
      } else {
        // 元の位置に戻す（スムーズに）
        if (Math.abs(teeth02Bone.current.position.y) > 0.0001) {
          teeth02Bone.current.position.y *= 0.85;
        } else {
          teeth02Bone.current.position.y = 0;
        }
        if (Math.abs(teeth02Bone.current.rotation.x) > 0.0001) {
          teeth02Bone.current.rotation.x *= 0.85;
        } else {
          teeth02Bone.current.rotation.x = 0;
        }
        teeth02Bone.current.updateMatrixWorld(true);
      }
    }
    
    // 下の歯メッシュ自体も制御（SkinnedMeshの場合、モーフターゲットで動く）
    if (lowerTeethMesh.current && lowerTeethMesh.current.morphTargetInfluences) {
      // このメッシュ自体のモーフターゲットも適用する
      const influences = lowerTeethMesh.current.morphTargetInfluences;
      if (lowerTeethMesh.current.morphTargetDictionary) {
        const jawOpenIndex = lowerTeethMesh.current.morphTargetDictionary['A25_Jaw_Open'];
        if (jawOpenIndex !== undefined) {
          if (isSpeaking) {
            const jawOpenValue = currentMorphValues.current['A25_Jaw_Open'] || 0;
            influences[jawOpenIndex] = jawOpenValue;
            
            // デバッグ用（5秒ごとに表示）
            if (Math.floor(animationTime.current / 5) !== Math.floor((animationTime.current - delta) / 5)) {
              console.log('下の歯のモーフターゲット制御:', {
                jawOpen: jawOpenValue.toFixed(3),
                index: jawOpenIndex,
                actualValue: influences[jawOpenIndex].toFixed(3)
              });
            }
          } else {
            influences[jawOpenIndex] = 0;
          }
        }
      }
    } else if (lowerTeethMesh.current && !lowerTeethMesh.current.isSkinnedMesh) {
      // SkinnedMeshでない場合は直接位置を制御
      if (isSpeaking) {
        const jawOpenValue = currentMorphValues.current['A25_Jaw_Open'] || 0;
        const mouthOpenValue = currentMorphValues.current['Mouth_Open'] || 0;
        const combinedValue = Math.max(jawOpenValue, mouthOpenValue);
        
        // 下の歯を下方向に移動
        lowerTeethMesh.current.position.y = -combinedValue * 0.05;
        lowerTeethMesh.current.rotation.x = -combinedValue * 0.4;
        lowerTeethMesh.current.position.z = -combinedValue * 0.02;
        
        // デバッグ用
        if (Math.floor(animationTime.current / 5) !== Math.floor((animationTime.current - delta) / 5)) {
          console.log('下の歯の直接制御:', {
            jawOpen: jawOpenValue.toFixed(3),
            positionY: lowerTeethMesh.current.position.y.toFixed(4),
            rotationX: lowerTeethMesh.current.rotation.x.toFixed(4)
          });
        }
      } else {
        // 話していない時は元の位置に戻す
        if (Math.abs(lowerTeethMesh.current.position.y) > 0.0001) {
          lowerTeethMesh.current.position.y *= 0.9;
        } else {
          lowerTeethMesh.current.position.y = 0;
        }
        if (Math.abs(lowerTeethMesh.current.position.z) > 0.0001) {
          lowerTeethMesh.current.position.z *= 0.9;
        } else {
          lowerTeethMesh.current.position.z = 0;
        }
        if (Math.abs(lowerTeethMesh.current.rotation.x) > 0.0001) {
          lowerTeethMesh.current.rotation.x *= 0.9;
        } else {
          lowerTeethMesh.current.rotation.x = 0;
        }
      }
    }
    
    // モーフターゲットの適用（口腔内メッシュも含む）
    morphTargets.forEach((mesh) => {
      if (!mesh.morphTargetInfluences) return;
      
      const influences = mesh.morphTargetInfluences;
      const isOralMesh = oralMeshes.includes(mesh);
      
      if (mesh.morphTargetDictionary && Object.keys(mesh.morphTargetDictionary).length > 0) {
        const applyMorph = (name: string, value: number) => {
          const index = mesh.morphTargetDictionary[name];
          if (index !== undefined && index < influences.length) {
            // 口腔内メッシュの場合、顎の動きを強調
            if (isOralMesh && name === 'A25_Jaw_Open') {
              influences[index] = value * 1.2; // 口腔内は少し強めに動かす
            } else {
              influences[index] = value;
            }
          }
        };
        
        // 瞬き（左右対称に、自然なカーブ）
        applyMorph('A14_Eye_Blink_Left', blinkValue);
        applyMorph('A15_Eye_Blink_Right', blinkValue);
        
        // 感情モーフの適用（話していない時はリセット）
        if (isSpeaking) {
          Object.entries(emotionMorphValues.current).forEach(([morphName, value]) => {
            if (value > 0.01) {
              applyMorph(morphName, value);
            }
          });
        }
        
        if (isSpeaking && Object.keys(currentMorphValues.current).length > 0) {
          // 名前ベースでモーフターゲットを適用（精度向上版）
          Object.entries(currentMorphValues.current).forEach(([morphName, value]) => {
            if (value > 0.01) {
              // 感情と口の動きを統合
              const emotionValue = emotionMorphValues.current[morphName] || 0;
              const combinedValue = Math.min(value + emotionValue * 0.3, 1.0);
              applyMorph(morphName, combinedValue);
            }
          });
          
          // 補助的な口の動き（リップシンクを強化）
          const jawValue = currentMorphValues.current['A25_Jaw_Open'] || 0;
          const mouthOpenValue = currentMorphValues.current['Mouth_Open'] || 0;
          
          if (jawValue > 0 || mouthOpenValue > 0) {
            const combinedValue = Math.max(jawValue, mouthOpenValue);
            
            // 上唇の動き
            applyMorph('A44_Mouth_Upper_Up_Left', combinedValue * 0.3);
            applyMorph('A45_Mouth_Upper_Up_Right', combinedValue * 0.3);
            applyMorph('Mouth_Top_Lip_Up', combinedValue * 0.2);
            
            // 下唇の動き（控えめに）
            applyMorph('A46_Mouth_Lower_Down_Left', combinedValue * 0.3);
            applyMorph('A47_Mouth_Lower_Down_Right', combinedValue * 0.3);
            
            // 顎の動き（自然に）
            applyMorph('A26_Jaw_Forward', combinedValue * 0.1);
            
            // 口の横の動き
            applyMorph('A50_Mouth_Stretch_Left', combinedValue * 0.2);
            applyMorph('A51_Mouth_Stretch_Right', combinedValue * 0.2);
            
            // 頬の動き（非常に控えめ）
            applyMorph('A21_Cheek_Squint_Left', combinedValue * 0.05);
            applyMorph('A22_Cheek_Squint_Right', combinedValue * 0.05);
            
            // 舌のモーフターゲットを適用（tonguePosition.yは正の値で下に）
            const tongueDown = tonguePosition.y > 0 ? tonguePosition.y : 0;
            const tongueUp = tonguePosition.y < 0 ? -tonguePosition.y : 0;
            
            // 下方向の動き（大きく強調）
            applyMorph('T02_Tongue_Down', tongueDown * 1.0);
            applyMorph('V_Tongue_Lower', tongueDown * 1.0);
            applyMorph('T07_Tongue_Tip_Down', tongueDown * 1.2);
            
            // 上方向の動き
            applyMorph('T01_Tongue_Up', tongueUp * 0.8);
            applyMorph('V_Tongue_Raise', tongueUp * 0.8);
            applyMorph('T06_Tongue_Tip_Up', tongueUp * 1.0);
          }
          
          // デバッグ用ログ（30秒ごと）
          if (Math.floor(animationTime.current / 30) !== Math.floor((animationTime.current - delta) / 30)) {
            console.log('リップシンク状態:', {
              morphValues: Object.entries(currentMorphValues.current)
                .filter(([_, v]) => v > 0.01)
                .map(([k, v]) => `${k}:${v.toFixed(2)}`),
              currentWord,
              audioLevel
            });
          }
        } else {
          // 話していない時は口関連をリセット（A25-A50）
          for (let i = 25; i <= 50; i++) {
            const key = `A${i.toString().padStart(2, '0')}_`;
            Object.keys(mesh.morphTargetDictionary).forEach(morphKey => {
              if (morphKey.startsWith(key)) {
                applyMorph(morphKey, 0);
              }
            });
          }
          
          // 眉と頬もリセット（瞬き以外）
          for (let i = 1; i <= 24; i++) {
            const key = `A${i.toString().padStart(2, '0')}_`;
            Object.keys(mesh.morphTargetDictionary).forEach(morphKey => {
              if (morphKey.startsWith(key) && !morphKey.includes('Blink')) {
                applyMorph(morphKey, 0);
              }
            });
          }
          
          // 舌のモーフターゲットもリセット
          applyMorph('T01_Tongue_Up', 0);
          applyMorph('T02_Tongue_Down', 0);
          applyMorph('T06_Tongue_Tip_Up', 0);
          applyMorph('T07_Tongue_Tip_Down', 0);
          applyMorph('V_Tongue_Lower', 0);
          applyMorph('V_Tongue_Raise', 0);
          applyMorph('V_Tongue_Out', 0);
          applyMorph('A52_Tongue_Out', 0);
        }
      } else {
        // morphTargetDictionaryがない場合の警告（1回だけ）
        if (Math.random() < 0.001) {
          console.warn('morphTargetDictionaryが存在しません。名前ベースの制御ができません。');
        }
      }
    });
  });
  
  return (
    <group ref={group} position={[0, 0, 0]}>
      <primitive object={scene} />
    </group>
  );
}

export default function FinalLipSyncAvatar({
  isSpeaking = false,
  audioLevel = 0,
  currentWord = '',
  currentPhoneme = '',
  speechProgress = 0,
  showDebug = false,
  audioData,
  audioFrequency = 0,
  modelPath = '/models/man-grey-suit-optimized.glb'
}: {
  isSpeaking?: boolean;
  audioLevel?: number;
  currentWord?: string;
  currentPhoneme?: string;
  speechProgress?: number;
  showDebug?: boolean;
  audioData?: Float32Array;
  audioFrequency?: number;
  modelPath?: string;
}) {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  
  const handleModelLoaded = () => {
    setIsModelLoaded(true);
  };
  
  // モデルごとの設定
  const isBoyModel = modelPath.includes('BOY_4');
  
  // カメラ設定（モデルごとに調整）
  const cameraSettings = isBoyModel 
    ? { position: [0, 1.2, 0.8], fov: 30, target: [0, 1.2, 0] } // 少年用：低めの位置
    : { position: [0, 1.68, 0.7], fov: 28, target: [0, 1.7, 0] }; // 成人男性用
  
  // リップシンク強度設定（少年は動きを大きめに）
  const lipSyncIntensity = isBoyModel ? 1.3 : 1.0;
  return (
    <div className="relative w-full h-[400px] rounded-xl overflow-hidden" style={{ 
      background: 'linear-gradient(135deg, #d4f1f4 0%, #bae6fd 50%, #d4f1f4 100%)'
    }}>
      {!isModelLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          {/* 背景の装飾的な円 */}
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-10 right-10 w-32 h-32 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-10 left-20 w-32 h-32 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          </div>
          
          {/* ローディングコンテンツ */}
          <div className="relative z-10 text-center">
            {/* アバターアイコン */}
            <div className="mb-4 mx-auto w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            
            {/* ローディングバー */}
            <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-loading-bar" style={{ willChange: 'transform' }}></div>
            </div>
            
            {/* テキスト */}
            <div className="text-gray-600 font-medium">
              AI患者アバターを準備中
            </div>
            <div className="text-gray-400 text-sm mt-1">
              3Dモデルを読み込んでいます...
            </div>
          </div>
          
          {/* スタイル定義 */}
          <style jsx>{`
            @keyframes blob {
              0% {
                transform: translate(0px, 0px) scale(1);
              }
              33% {
                transform: translate(30px, -50px) scale(1.1);
              }
              66% {
                transform: translate(-20px, 20px) scale(0.9);
              }
              100% {
                transform: translate(0px, 0px) scale(1);
              }
            }
            @keyframes loading-bar {
              0% {
                transform: translateX(-100%);
              }
              100% {
                transform: translateX(200%);
              }
            }
            .animate-blob {
              animation: blob 7s infinite;
            }
            .animation-delay-2000 {
              animation-delay: 2s;
            }
            .animation-delay-4000 {
              animation-delay: 4s;
            }
            .animate-loading-bar {
              animation: loading-bar 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
              width: 50%;
            }
          `}</style>
        </div>
      )}
      <Canvas
        camera={{ position: cameraSettings.position as [number, number, number], fov: cameraSettings.fov }}
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
          outputColorSpace: THREE.SRGBColorSpace
        }}
        style={{ opacity: isModelLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
      >
        <ambientLight intensity={0.5} color="#bae6fd" />
        <directionalLight
          position={[5, 10, 5]}
          intensity={0.6}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight position={[-5, 5, -5]} intensity={0.3} />
        <pointLight position={[0, 2, 1]} intensity={0.2} />
        
        <Suspense fallback={null}>
          <AvatarModel 
            isSpeaking={isSpeaking} 
            audioLevel={audioLevel}
            currentWord={currentWord}
            currentPhoneme={currentPhoneme}
            speechProgress={speechProgress}
            audioData={audioData}
            audioFrequency={audioFrequency}
            onLoaded={handleModelLoaded}
            modelPath={modelPath}
            lipSyncIntensity={lipSyncIntensity}
          />
          <Environment preset="studio" />
        </Suspense>
        
        <OrbitControls
          target={cameraSettings.target as [number, number, number]}
          enableRotate={false}
          enablePan={false}
          enableZoom={false}
        />
        
        {isModelLoaded && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[10, 10]} />
            <meshStandardMaterial color="#c7e9ed" />
          </mesh>
        )}
        
        <color attach="background" args={['#e0f2fe']} />
      </Canvas>
      
      {showDebug && (
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs p-2 rounded">
          <div>Stable Lip Sync</div>
          <div>Speaking: {isSpeaking ? 'Yes' : 'No'}</div>
          <div>Audio: {(audioLevel * 100).toFixed(0)}%</div>
          {currentWord && <div>Word: {currentWord}</div>}
        </div>
      )}
    </div>
  );
}

// Preload both models
useGLTF.preload('/models/man-grey-suit-optimized.glb');
useGLTF.preload('/models/BOY_4.glb');