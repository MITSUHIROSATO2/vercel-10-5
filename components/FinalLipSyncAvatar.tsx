'use client';

import React, { useRef, useEffect, useLayoutEffect, useState, Suspense, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { getModelPath } from '@/lib/modelPaths';
import { textToPhonemes, phonemeToViseme } from '@/lib/englishPhonemeConverter';
import { applyMotherAvatarTextures, resetMotherAvatarTextureCache } from '@/utils/applyMotherAvatarTextures';

// WebGLコンテキストロスト対策コンポーネント
function WebGLContextHandler() {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    console.log('[WebGL] Context handler initialized');

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.warn('[WebGL] Context lost, attempting to restore...');
      resetMotherAvatarTextureCache();
      const femaleScene = (window as any).__FEMALE_AVATAR_SCENE__;
      if (femaleScene) {
        femaleScene.userData.femaleTexturesApplied = false;
      }
    };

    const handleContextRestored = () => {
      console.log('[WebGL] Context restored successfully');
      resetMotherAvatarTextureCache();
      const femaleScene = (window as any).__FEMALE_AVATAR_SCENE__;
      console.log('[WebGL] Female scene found:', !!femaleScene);
      if (femaleScene) {
        try {
          console.log('[WebGL] Reapplying female textures and hiding cornea...');
          femaleScene.userData.femaleTexturesApplied = false;
          applyMotherAvatarTextures(femaleScene);
          console.log('[WebGL] Female textures reapplied successfully');
        } catch (error) {
          console.warn('[WebGL] Failed to reapply female textures after context restore:', error);
        }
      } else {
        console.log('[WebGL] No female scene to restore');
      }
    };

    const eventOptions = { capture: true } as const;
    canvas.addEventListener('webglcontextlost', handleContextLost, eventOptions);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, eventOptions);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost, eventOptions);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored, eventOptions);
    };
  }, [gl]);

  return null;
}

// モデルURLをプリロード（クライアントサイドのみ）
if (typeof window !== 'undefined') {
  // boy_improved は現在使用していないためプリロードから除外
  const modelTypes: ('adult' | 'boy' | 'female')[] = ['adult', 'boy', 'female'];

  modelTypes.forEach(type => {
    try {
      const modelPath = getModelPath(type);
      const safePath = encodeURI(modelPath);
      useGLTF.preload(safePath);
      // console.log(`Preloading model ${type}: ${modelPath}`);
    } catch (error) {
      console.warn(`Model preload skipped for ${type}:`, error);
    }
  });
}


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
  selectedAvatar?: string;
}

// 英語の音素に基づくモーフターゲットマッピング
const EnglishPhonemeToMorphs: { [key: string]: { [morphName: string]: number } } = {
  // === 母音 (Vowels) ===
  // AA - father, hot
  'AA': {
    'A25_Jaw_Open': 0.6,
    'V_Open': 0.5,
    'Mouth_Open': 0.45,
    'A44_Mouth_Upper_Up_Left': 0.2,
    'A45_Mouth_Upper_Up_Right': 0.2,
    'A46_Mouth_Lower_Down_Left': 0.25,
    'A47_Mouth_Lower_Down_Right': 0.25,
    'V_Lip_Open': 0.4
  },
  // AE - cat, hat
  'AE': {
    'A25_Jaw_Open': 0.5,
    'V_Wide': 0.4,
    'A50_Mouth_Stretch_Left': 0.3,
    'A51_Mouth_Stretch_Right': 0.3,
    'Mouth_Open': 0.35,
    'A44_Mouth_Upper_Up_Left': 0.15,
    'A45_Mouth_Upper_Up_Right': 0.15
  },
  // AH - but, sun
  'AH': {
    'A25_Jaw_Open': 0.35,
    'V_Open': 0.3,
    'Mouth_Open': 0.25,
    'V_Lip_Open': 0.2
  },
  // AO - dog, law
  'AO': {
    'A25_Jaw_Open': 0.45,
    'V_Open': 0.35,
    'A29_Mouth_Funnel': 0.25,
    'V_Tight_O': 0.3,
    'A33_Mouth_Roll_Upper': 0.15,
    'A34_Mouth_Roll_Lower': 0.15
  },
  // AW - how, now
  'AW': {
    'A25_Jaw_Open': 0.5,
    'A30_Mouth_Pucker': 0.4,
    'A29_Mouth_Funnel': 0.35,
    'V_Tight_O': 0.3,
    'Mouth_Pucker_Open': 0.3
  },
  // AY - hide, my
  'AY': {
    'A25_Jaw_Open': 0.4,
    'V_Wide': 0.35,
    'A50_Mouth_Stretch_Left': 0.25,
    'A51_Mouth_Stretch_Right': 0.25,
    'Mouth_Widen': 0.2
  },
  // EH - bed, said
  'EH': {
    'A25_Jaw_Open': 0.3,
    'V_Wide': 0.25,
    'Mouth_Open': 0.2,
    'A50_Mouth_Stretch_Left': 0.15,
    'A51_Mouth_Stretch_Right': 0.15
  },
  // ER - her, bird
  'ER': {
    'A25_Jaw_Open': 0.25,
    'A30_Mouth_Pucker': 0.3,
    'V_Tight_O': 0.2,
    'V_Tongue_Curl_U': 0.4,
    'T06_Tongue_Tip_Up': 0.3
  },
  // EY - take, day
  'EY': {
    'A25_Jaw_Open': 0.2,
    'V_Wide': 0.45,
    'A50_Mouth_Stretch_Left': 0.35,
    'A51_Mouth_Stretch_Right': 0.35,
    'A38_Mouth_Smile_Left': 0.15,
    'A39_Mouth_Smile_Right': 0.15
  },
  // IH - it, sit
  'IH': {
    'A25_Jaw_Open': 0.15,
    'V_Wide': 0.35,
    'A50_Mouth_Stretch_Left': 0.25,
    'A51_Mouth_Stretch_Right': 0.25,
    'Mouth_Widen': 0.2
  },
  // IY - eat, see
  'IY': {
    'A25_Jaw_Open': 0.1,
    'V_Wide': 0.6,
    'A50_Mouth_Stretch_Left': 0.5,
    'A51_Mouth_Stretch_Right': 0.5,
    'A38_Mouth_Smile_Left': 0.25,
    'A39_Mouth_Smile_Right': 0.25,
    'Mouth_Widen_Sides': 0.4
  },
  // OW - go, home
  'OW': {
    'A25_Jaw_Open': 0.3,
    'A30_Mouth_Pucker': 0.5,
    'A29_Mouth_Funnel': 0.4,
    'V_Tight_O': 0.35,
    'A33_Mouth_Roll_Upper': 0.2,
    'A34_Mouth_Roll_Lower': 0.2
  },
  // OY - toy, boy
  'OY': {
    'A25_Jaw_Open': 0.35,
    'A30_Mouth_Pucker': 0.35,
    'V_Wide': 0.2,
    'A29_Mouth_Funnel': 0.25,
    'V_Tight_O': 0.2
  },
  // UH - hood, could
  'UH': {
    'A25_Jaw_Open': 0.2,
    'A30_Mouth_Pucker': 0.35,
    'V_Tight_O': 0.25,
    'A29_Mouth_Funnel': 0.2
  },
  // UW - two, blue
  'UW': {
    'A25_Jaw_Open': 0.15,
    'A30_Mouth_Pucker': 0.6,
    'A29_Mouth_Funnel': 0.5,
    'V_Tight_O': 0.4,
    'Mouth_Pucker_Open': 0.35,
    'A33_Mouth_Roll_Upper': 0.25,
    'A34_Mouth_Roll_Lower': 0.25
  },

  // === 子音 (Consonants) ===
  // B - boy, cab
  'B': {
    'A25_Jaw_Open': 0.02,
    'V_Explosive': 0.35,
    'A44_Mouth_Upper_Up_Left': 0.05,
    'A45_Mouth_Upper_Up_Right': 0.05,
    'A48_Mouth_Press_Left': 0.28,
    'A49_Mouth_Press_Right': 0.28,
    'A37_Mouth_Close': 0.12,
    'Mouth_Lips_Part': 0.05
  },
  // CH - chair, match
  'CH': {
    'A25_Jaw_Open': 0.15,
    'A30_Mouth_Pucker': 0.25,
    'V_Tight_O': 0.15,
    'V_Affricate': 0.4,
    'V_Tongue_Raise': 0.3
  },
  // D - dog, sad
  'D': {
    'A25_Jaw_Open': 0.1,
    'V_Wide': 0.15,
    'Mouth_Open': 0.08,
    'V_Dental_Lip': 0.3,
    'V_Tongue_up': 0.4
  },
  // DH - the, this
  'DH': {
    'A25_Jaw_Open': 0.12,
    'V_Wide': 0.2,
    'Mouth_Open': 0.1,
    'V_Dental_Lip': 0.4,
    'V_Tongue_Out': 0.2,
    'T06_Tongue_Tip_Up': 0.15
  },
  // F - five, off
  'F': {
    'A25_Jaw_Open': 0.08,
    'A44_Mouth_Upper_Up_Left': 0.15,
    'A45_Mouth_Upper_Up_Right': 0.15,
    'V_Dental_Lip': 0.5,
    'Mouth_Bottom_Lip_Bite': 0.3
  },
  // G - go, big
  'G': {
    'A25_Jaw_Open': 0.15,
    'V_Open': 0.1,
    'Mouth_Open': 0.12,
    'V_Explosive': 0.3,
    'V_Tongue_Lower': 0.2
  },
  // HH - he, how
  'HH': {
    'A25_Jaw_Open': 0.2,
    'V_Open': 0.15,
    'Mouth_Open': 0.15
  },
  // JH - judge, age
  'JH': {
    'A25_Jaw_Open': 0.15,
    'A30_Mouth_Pucker': 0.3,
    'V_Tight_O': 0.2,
    'V_Affricate': 0.4,
    'V_Tongue_Raise': 0.35
  },
  // K - key, back
  'K': {
    'A25_Jaw_Open': 0.12,
    'V_Open': 0.08,
    'Mouth_Open': 0.1,
    'V_Explosive': 0.35,
    'V_Tongue_Lower': 0.25
  },
  // L - let, ball
  'L': {
    'A25_Jaw_Open': 0.18,
    'V_Wide': 0.25,
    'Mouth_Open': 0.15,
    'V_Tongue_up': 0.4,
    'T06_Tongue_Tip_Up': 0.35
  },
  // M - man, sum
  'M': {
    'A25_Jaw_Open': 0.02,
    'A44_Mouth_Upper_Up_Left': 0.05,
    'A45_Mouth_Upper_Up_Right': 0.05,
    'A37_Mouth_Close': 0.08,
    'A48_Mouth_Press_Left': 0.24,
    'A49_Mouth_Press_Right': 0.24,
    'Mouth_Lips_Part': 0.05
  },
  // N - no, sun
  'N': {
    'A25_Jaw_Open': 0.08,
    'V_Wide': 0.1,
    'Mouth_Open': 0.05,
    'V_Tongue_up': 0.35,
    'T06_Tongue_Tip_Up': 0.3
  },
  // NG - sing, long
  'NG': {
    'A25_Jaw_Open': 0.1,
    'V_Open': 0.12,
    'Mouth_Open': 0.08,
    'V_Tongue_Lower': 0.3,
    'A20_Cheek_Puff': 0.05
  },
  // P - pen, top
  'P': {
    'A25_Jaw_Open': 0.02,
    'A44_Mouth_Upper_Up_Left': 0,
    'A45_Mouth_Upper_Up_Right': 0,
    'V_Explosive': 0.4,
    'A48_Mouth_Press_Left': 0.32,
    'A49_Mouth_Press_Right': 0.32,
    'A37_Mouth_Close': 0.08,
    'Mouth_Plosive': 0.35,
    'Mouth_Lips_Part': 0.05
  },
  // R - run, car
  'R': {
    'A25_Jaw_Open': 0.2,
    'A30_Mouth_Pucker': 0.25,
    'V_Tight_O': 0.18,
    'V_Tongue_Curl_U': 0.45,
    'T05_Tongue_Roll': 0.3
  },
  // S - see, pass
  'S': {
    'A25_Jaw_Open': 0.1,
    'V_Wide': 0.3,
    'A50_Mouth_Stretch_Left': 0.2,
    'A51_Mouth_Stretch_Right': 0.2,
    'V_Tight': 0.4,
    'V_Tongue_Raise': 0.25
  },
  // SH - she, push
  'SH': {
    'A25_Jaw_Open': 0.12,
    'A30_Mouth_Pucker': 0.35,
    'V_Tight_O': 0.25,
    'V_Affricate': 0.3,
    'V_Tongue_Raise': 0.3,
    'A29_Mouth_Funnel': 0.2
  },
  // T - top, cat
  'T': {
    'A25_Jaw_Open': 0.08,
    'V_Wide': 0.12,
    'Mouth_Open': 0.06,
    'V_Dental_Lip': 0.25,
    'V_Tongue_up': 0.45,
    'T06_Tongue_Tip_Up': 0.4
  },
  // TH - think, both
  'TH': {
    'A25_Jaw_Open': 0.1,
    'V_Wide': 0.18,
    'Mouth_Open': 0.08,
    'V_Dental_Lip': 0.45,
    'V_Tongue_Out': 0.25,
    'T06_Tongue_Tip_Up': 0.2
  },
  // V - voice, have
  'V': {
    'A25_Jaw_Open': 0.1,
    'A44_Mouth_Upper_Up_Left': 0.12,
    'A45_Mouth_Upper_Up_Right': 0.12,
    'V_Dental_Lip': 0.45,
    'Mouth_Bottom_Lip_Bite': 0.25
  },
  // W - win, away
  'W': {
    'A25_Jaw_Open': 0.12,
    'A30_Mouth_Pucker': 0.45,
    'A29_Mouth_Funnel': 0.35,
    'V_Tight_O': 0.3,
    'Mouth_Pucker_Open': 0.25
  },
  // Y - yes, you
  'Y': {
    'A25_Jaw_Open': 0.15,
    'V_Wide': 0.4,
    'A50_Mouth_Stretch_Left': 0.3,
    'A51_Mouth_Stretch_Right': 0.3,
    'V_Tongue_Raise': 0.2
  },
  // Z - zoo, buzz
  'Z': {
    'A25_Jaw_Open': 0.12,
    'V_Wide': 0.25,
    'A50_Mouth_Stretch_Left': 0.18,
    'A51_Mouth_Stretch_Right': 0.18,
    'V_Tight': 0.35,
    'V_Tongue_Raise': 0.2
  },
  // ZH - measure, vision
  'ZH': {
    'A25_Jaw_Open': 0.15,
    'A30_Mouth_Pucker': 0.3,
    'V_Tight_O': 0.22,
    'V_Affricate': 0.25,
    'V_Tongue_Raise': 0.25,
    'A29_Mouth_Funnel': 0.15
  },

  // === 基本アルファベット対応 ===
  'A': { 'A25_Jaw_Open': 0.5, 'V_Open': 0.4, 'Mouth_Open': 0.35, 'V_Lip_Open': 0.3 },
  'E': { 'A25_Jaw_Open': 0.3, 'V_Wide': 0.25, 'Mouth_Open': 0.2 },
  'I': { 'A25_Jaw_Open': 0.15, 'V_Wide': 0.5, 'A50_Mouth_Stretch_Left': 0.4, 'A51_Mouth_Stretch_Right': 0.4 },
  'O': { 'A25_Jaw_Open': 0.35, 'A30_Mouth_Pucker': 0.4, 'V_Tight_O': 0.3 },
  'U': { 'A25_Jaw_Open': 0.2, 'A30_Mouth_Pucker': 0.5, 'V_Tight_O': 0.35 }
};

// 日本語の音素に基づくモーフターゲットマッピング（精度向上版）
const PhonemeToMorphs: { [key: string]: { [morphName: string]: number } } = {
  // 母音（より詳細なビジームと口の形）
  'あ': { 
    'A25_Jaw_Open': 0.5, 
    'V_Open': 0.4,
    'Mouth_Open': 0.35,
    'A44_Mouth_Upper_Up_Left': 0.15,
    'A45_Mouth_Upper_Up_Right': 0.15,
    'A46_Mouth_Lower_Down_Left': 0.2,
    'A47_Mouth_Lower_Down_Right': 0.2,
    'V_Lip_Open': 0.3
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
    'A25_Jaw_Open': 0.25,
    // Mouth_Puckerを完全に削除
    'A29_Mouth_Funnel': 0.25,  // 唇を前に出す動き
    'V_Tight_O': 0.25,         // 「お」と同じ値
    'A33_Mouth_Roll_Upper': 0.1,  // 「お」と同じ値に増加
    'A34_Mouth_Roll_Lower': 0.1   // 「お」と同じ値に増加
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
    'A25_Jaw_Open': 0.35,
    'V_Open': 0.25,
    'A29_Mouth_Funnel': 0.3,
    'V_Tight_O': 0.25,
    'Mouth_Open': 0.25,
    'A33_Mouth_Roll_Upper': 0.1,
    'A34_Mouth_Roll_Lower': 0.1
  },
  
  // カタカナ（同じパターン）
  'ア': { 
    'A25_Jaw_Open': 0.5, 
    'V_Open': 0.4,
    'Mouth_Open': 0.35,
    'A44_Mouth_Upper_Up_Left': 0.15,
    'A45_Mouth_Upper_Up_Right': 0.15,
    'A46_Mouth_Lower_Down_Left': 0.2,
    'A47_Mouth_Lower_Down_Right': 0.2,
    'V_Lip_Open': 0.3
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
    'A25_Jaw_Open': 0.25,
    // Mouth_Puckerを完全に削除
    'A29_Mouth_Funnel': 0.25,  // 唇を前に出す動き
    'V_Tight_O': 0.25,         // 「オ」と同じ値
    'A33_Mouth_Roll_Upper': 0.1,  // 「オ」と同じ値
    'A34_Mouth_Roll_Lower': 0.1   // 「オ」と同じ値
  },
  'エ': { 
    'A25_Jaw_Open': 0.35,
    'V_Wide': 0.3,
    'Mouth_Open': 0.25,
    'A50_Mouth_Stretch_Left': 0.2,
    'A51_Mouth_Stretch_Right': 0.2
  },
  'オ': { 
    'A25_Jaw_Open': 0.35,
    'V_Open': 0.25,
    'A29_Mouth_Funnel': 0.3,
    'V_Tight_O': 0.25,
    'Mouth_Open': 0.25
  },
  
  // ま行（唇を使う音）
  'ま': {
    'A37_Mouth_Close': 0.1,
    'V_Explosive': 0.2,
    'A25_Jaw_Open': 0.25,
    'A48_Mouth_Press_Left': 0.2,
    'A49_Mouth_Press_Right': 0.2,
    'Mouth_Lips_Part': 0.3
  },
  'み': {
    'A37_Mouth_Close': 0.0,
    'V_Wide': 0.15,
    'A25_Jaw_Open': 0.1,
    'A48_Mouth_Press_Left': 0.15,
    'A49_Mouth_Press_Right': 0.15
  },
  'む': {
    'A37_Mouth_Close': 0.0,
    'A25_Jaw_Open': 0.1,
    'A48_Mouth_Press_Left': 0.15,
    'A49_Mouth_Press_Right': 0.15
  },
  'め': {
    'A37_Mouth_Close': 0.0,
    'Mouth_Open': 0.2,
    'A25_Jaw_Open': 0.2,
    'V_Wide': 0.1
  },
  'も': {
    'A37_Mouth_Close': 0.0,
    'A29_Mouth_Funnel': 0.25,
    'A25_Jaw_Open': 0.3,
    'V_Tight_O': 0.2
  },
  
  // ば行・ぱ行（破裂音）
  'ば': { 'V_Explosive': 0.4, 'A25_Jaw_Open': 0.5, 'V_Open': 0.3 },
  'び': { 'V_Explosive': 0.3, 'A25_Jaw_Open': 0.15, 'V_Wide': 0.3 },
  'ぶ': { 'V_Explosive': 0.3, 'A25_Jaw_Open': 0.2 },
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
  'す': { 'V_Tight': 0.3, 'A25_Jaw_Open': 0.15, 'V_Tight_O': 0.2 },
  'せ': { 'V_Tight': 0.2, 'A25_Jaw_Open': 0.25, 'V_Wide': 0.15 },
  'そ': { 'V_Tight': 0.2, 'A25_Jaw_Open': 0.35, 'V_Tight_O': 0.15 },
  
  // ん（鼻音）
  'ん': {
    'A37_Mouth_Close': 0.3,
    'Mouth_Lips_Part': 0.05,
    'A20_Cheek_Puff': 0.05,
    'V_None': 0.3
  },
  'ン': {
    'A37_Mouth_Close': 0.3,
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
  },
  'happy': {
    'A38_Mouth_Smile_Left': 0.3,
    'A39_Mouth_Smile_Right': 0.3,
    'A21_Cheek_Squint_Left': 0.2,
    'A22_Cheek_Squint_Right': 0.2,
    'A04_Brow_Outer_Up_Left': 0.1,
    'A05_Brow_Outer_Up_Right': 0.1
  },
  'sad': {
    'A01_Brow_Inner_Up': 0.3,
    'A40_Mouth_Frown_Left': 0.2,
    'A41_Mouth_Frown_Right': 0.2,
    'A46_Mouth_Lower_Down_Left': 0.1,
    'A47_Mouth_Lower_Down_Right': 0.1
  },
  'surprised': {
    'A01_Brow_Inner_Up': 0.4,
    'A04_Brow_Outer_Up_Left': 0.3,
    'A05_Brow_Outer_Up_Right': 0.3,
    'A18_Eye_Wide_Left': 0.4,
    'A19_Eye_Wide_Right': 0.4,
    'A25_Jaw_Open': 0.2
  },
  'angry': {
    'A02_Brow_Down_Left': 0.4,
    'A03_Brow_Down_Right': 0.4,
    'A23_Nose_Sneer_Left': 0.2,
    'A24_Nose_Sneer_Right': 0.2,
    'A40_Mouth_Frown_Left': 0.2,
    'A41_Mouth_Frown_Right': 0.2
  },
  'confused': {
    'A01_Brow_Inner_Up': 0.2,
    'A02_Brow_Down_Left': 0.1,
    'A05_Brow_Outer_Up_Right': 0.2,
    'A31_Mouth_Left': 0.15,
    'A16_Eye_Squint_Left': 0.1
  }
};

// 少年改アバター専用の感情プリセット（より繊細で自然な表情）
const BoyImprovedEmotionPresets: { [key: string]: { [morphName: string]: number } } = {
  'neutral': {},
  'friendly': {
    'A38_Mouth_Smile_Left': 0.15,
    'A39_Mouth_Smile_Right': 0.15,
    'A21_Cheek_Squint_Left': 0.08,
    'A22_Cheek_Squint_Right': 0.08,
    'Cheek_Raise_L': 0.1,
    'Cheek_Raise_R': 0.1
  },
  'concentrating': {
    'A02_Brow_Down_Left': 0.1,
    'A03_Brow_Down_Right': 0.1,
    'A16_Eye_Squint_Left': 0.08,
    'A17_Eye_Squint_Right': 0.08,
    'A35_Mouth_Shrug_Upper': 0.05,
    'A48_Mouth_Press_Left': 0.05,
    'A49_Mouth_Press_Right': 0.05
  },
  'curious': {
    'A01_Brow_Inner_Up': 0.15,
    'A04_Brow_Outer_Up_Left': 0.12,
    'A05_Brow_Outer_Up_Right': 0.12,
    'A18_Eye_Wide_Left': 0.15,
    'A19_Eye_Wide_Right': 0.15,
    'Head_Tilt_L': 0.05,  // 頭を少し傾ける
    'A06_Eye_Look_Up_Left': 0.05,
    'A07_Eye_Look_Up_Right': 0.05
  },
  'happy': {
    'A38_Mouth_Smile_Left': 0.25,
    'A39_Mouth_Smile_Right': 0.25,
    'A21_Cheek_Squint_Left': 0.15,
    'A22_Cheek_Squint_Right': 0.15,
    'Cheek_Blow_L': 0.05,
    'Cheek_Blow_R': 0.05,
    'A42_Mouth_Dimple_Left': 0.1,
    'A43_Mouth_Dimple_Right': 0.1
  },
  'shy': {
    'A38_Mouth_Smile_Left': 0.1,
    'A39_Mouth_Smile_Right': 0.1,
    'A02_Brow_Down_Left': 0.05,
    'A03_Brow_Down_Right': 0.05,
    'A14_Eye_Blink_Left': 0.1,
    'A15_Eye_Blink_Right': 0.1,
    'Cheek_Blow_L': 0.08,
    'Cheek_Blow_R': 0.08
  },
  'worried': {
    'A01_Brow_Inner_Up': 0.2,
    'A40_Mouth_Frown_Left': 0.1,
    'A41_Mouth_Frown_Right': 0.1,
    'A48_Mouth_Press_Left': 0.08,
    'A49_Mouth_Press_Right': 0.08,
    'A31_Mouth_Left': 0.05
  },
  'excited': {
    'A18_Eye_Wide_Left': 0.2,
    'A19_Eye_Wide_Right': 0.2,
    'A38_Mouth_Smile_Left': 0.2,
    'A39_Mouth_Smile_Right': 0.2,
    'A04_Brow_Outer_Up_Left': 0.15,
    'A05_Brow_Outer_Up_Right': 0.15,
    'A25_Jaw_Open': 0.08
  }
};

// 少年アバター用の最適化された音素マッピング
const BoyPhonemeMap: { [key: string]: { [morphName: string]: number } } = {
  // 基本母音 - 少年用に調整
  'あ': { 
    'Move_Jaw_Down': 0.5,
    'V_Open': 0.45,
    'Mouth_Open': 0.4,
    'Mouth_Top_Lip_Up': 0.1,
    'Mouth_Bottom_Lip_Down': 0.15,
    'V_Lip_Open': 0.3,
    'Mouth_Lips_Part': 0.35
  },
  'い': { 
    'Move_Jaw_Down': 0.1,
    'V_Wide': 0.55,
    'Mouth_Widen': 0.45,
    'Mouth_Smile_L': 0.25,
    'Mouth_Smile_R': 0.25,
    'Mouth_Smile': 0.2,
    'Mouth_Widen_Sides': 0.3
  },
  'う': { 
    'Move_Jaw_Down': 0.15,
    'V_Tight_O': 0.45,
    'V_Tight': 0.35,
    'Mouth_Blow': 0.2
  },
  'え': { 
    'Move_Jaw_Down': 0.3,
    'V_Wide': 0.35,
    'Mouth_Open': 0.25,
    'Mouth_Widen': 0.25,
    'Mouth_Widen_Sides': 0.2,
    'Mouth_Top_Lip_Up': 0.05
  },
  'お': { 
    'Move_Jaw_Down': 0.3,
    'V_Open': 0.3,
    'V_Tight_O': 0.35,
    'Mouth_Open': 0.25,
    'Mouth_Blow': 0.15
  },
  // カタカナも同様
  'ア': { 
    'Move_Jaw_Down': 0.5,
    'V_Open': 0.45,
    'Mouth_Open': 0.4,
    'Mouth_Top_Lip_Up': 0.1,
    'Mouth_Bottom_Lip_Down': 0.15,
    'V_Lip_Open': 0.3,
    'Mouth_Lips_Part': 0.35
  },
  'イ': { 
    'Move_Jaw_Down': 0.1,
    'V_Wide': 0.55,
    'Mouth_Widen': 0.45,
    'Mouth_Smile_L': 0.25,
    'Mouth_Smile_R': 0.25,
    'Mouth_Smile': 0.2,
    'Mouth_Widen_Sides': 0.3
  },
  'ウ': { 
    'Move_Jaw_Down': 0.15,
    'V_Tight_O': 0.45,
    'V_Tight': 0.35,
    'Mouth_Blow': 0.2
  },
  'エ': { 
    'Move_Jaw_Down': 0.3,
    'V_Wide': 0.35,
    'Mouth_Open': 0.25,
    'Mouth_Widen': 0.25,
    'Mouth_Widen_Sides': 0.2,
    'Mouth_Top_Lip_Up': 0.05
  },
  'オ': { 
    'Move_Jaw_Down': 0.3,
    'V_Open': 0.3,
    'V_Tight_O': 0.35,
    'Mouth_Open': 0.25,
    'Mouth_Blow': 0.15
  }
};

// 少年改アバター用の最適化された音素マッピング（ARKitブレンドシェイプを使用）
const BoyImprovedPhonemeMap: { [key: string]: { [morphName: string]: number } } = {
  // 基本母音 - ARKitブレンドシェイプと追加モーフを活用
  'あ': { 
    'A25_Jaw_Open': 0.45,  // 少年用に控えめ
    'A44_Mouth_Upper_Up_Left': 0.08,
    'A45_Mouth_Upper_Up_Right': 0.08,
    'A46_Mouth_Lower_Down_Left': 0.1,
    'A47_Mouth_Lower_Down_Right': 0.1,
    'Mouth_Open': 0.35,
    'Mouth_Lips_Part': 0.3,
    'T02_Tongue_Down': 0.15,  // 舌を下に
    'V_Open': 0.4
  },
  'い': { 
    'A25_Jaw_Open': 0.08,
    'A50_Mouth_Stretch_Left': 0.35,
    'A51_Mouth_Stretch_Right': 0.35,
    'A38_Mouth_Smile_Left': 0.15,
    'A39_Mouth_Smile_Right': 0.15,
    'V_Wide': 0.45,
    'Mouth_Widen': 0.3,
    'Mouth_Widen_Sides': 0.25,
    'T01_Tongue_Up': 0.1,  // 舌を上に
    'T06_Tongue_Tip_Up': 0.08  // 舌先を上に
  },
  'う': { 
    'A25_Jaw_Open': 0.12,
    'A29_Mouth_Funnel': 0.35,
    'A33_Mouth_Roll_Upper': 0.08,
    'A34_Mouth_Roll_Lower': 0.08,
    'V_Tight_O': 0.4,
    'Mouth_Blow': 0.15,
    'T04_Tongue_Right': 0.05,  // 舌を少し後退
    'T08_Tongue_Width': -0.1  // 舌を細く
  },
  'え': { 
    'A25_Jaw_Open': 0.25,
    'A50_Mouth_Stretch_Left': 0.25,
    'A51_Mouth_Stretch_Right': 0.25,
    'A44_Mouth_Upper_Up_Left': 0.05,
    'A45_Mouth_Upper_Up_Right': 0.05,
    'V_Wide': 0.3,
    'Mouth_Open': 0.2,
    'Mouth_Widen': 0.2,
    'T01_Tongue_Up': 0.05  // 舌を少し上に
  },
  'お': { 
    'A25_Jaw_Open': 0.25,
    'A29_Mouth_Funnel': 0.3,
    'A33_Mouth_Roll_Upper': 0.08,
    'A34_Mouth_Roll_Lower': 0.08,
    'V_Open': 0.25,
    'V_Tight_O': 0.3,
    'Mouth_Blow': 0.1,
    'T05_Tongue_Roll': 0.05  // 舌を少し丸める
  },
  // カタカナも同様（舌の動きを含む）
  'ア': { 
    'A25_Jaw_Open': 0.45,
    'A44_Mouth_Upper_Up_Left': 0.08,
    'A45_Mouth_Upper_Up_Right': 0.08,
    'A46_Mouth_Lower_Down_Left': 0.1,
    'A47_Mouth_Lower_Down_Right': 0.1,
    'Mouth_Open': 0.35,
    'Mouth_Lips_Part': 0.3,
    'T02_Tongue_Down': 0.15,
    'V_Open': 0.4
  },
  'イ': { 
    'A25_Jaw_Open': 0.08,
    'A50_Mouth_Stretch_Left': 0.35,
    'A51_Mouth_Stretch_Right': 0.35,
    'A38_Mouth_Smile_Left': 0.15,
    'A39_Mouth_Smile_Right': 0.15,
    'V_Wide': 0.45,
    'Mouth_Widen': 0.3,
    'Mouth_Widen_Sides': 0.25,
    'T01_Tongue_Up': 0.1,
    'T06_Tongue_Tip_Up': 0.08
  },
  'ウ': { 
    'A25_Jaw_Open': 0.12,
    'A29_Mouth_Funnel': 0.35,
    'A33_Mouth_Roll_Upper': 0.08,
    'A34_Mouth_Roll_Lower': 0.08,
    'V_Tight_O': 0.4,
    'Mouth_Blow': 0.15,
    'T04_Tongue_Right': 0.05,
    'T08_Tongue_Width': -0.1
  },
  'エ': { 
    'A25_Jaw_Open': 0.25,
    'A50_Mouth_Stretch_Left': 0.25,
    'A51_Mouth_Stretch_Right': 0.25,
    'A44_Mouth_Upper_Up_Left': 0.05,
    'A45_Mouth_Upper_Up_Right': 0.05,
    'V_Wide': 0.3,
    'Mouth_Open': 0.2,
    'Mouth_Widen': 0.2,
    'T01_Tongue_Up': 0.05
  },
  'オ': { 
    'A25_Jaw_Open': 0.25,
    'A29_Mouth_Funnel': 0.3,
    'A33_Mouth_Roll_Upper': 0.08,
    'A34_Mouth_Roll_Lower': 0.08,
    'V_Open': 0.25,
    'V_Tight_O': 0.3,
    'Mouth_Blow': 0.1,
    'T05_Tongue_Roll': 0.05
  }
};

// 成人男性改アバター用の最適化された音素マッピング
const AdultImprovedPhonemeMap: { [key: string]: { [morphName: string]: number } } = {
  // 基本母音 - より精密で自然な口の形状
  'あ': { 
    'A25_Jaw_Open': 0.45,
    'V_Open': 0.5,
    'Mouth_Open': 0.4,
    'A44_Mouth_Upper_Up_Left': 0.08,
    'A45_Mouth_Upper_Up_Right': 0.08,
    'A46_Mouth_Lower_Down_Left': 0.12,
    'A47_Mouth_Lower_Down_Right': 0.12,
    'V_Lip_Open': 0.35,
    'Mouth_Lips_Part': 0.25
  },
  'い': { 
    'A25_Jaw_Open': 0.08,
    'V_Wide': 0.6,
    'A50_Mouth_Stretch_Left': 0.5,
    'A51_Mouth_Stretch_Right': 0.5,
    'A38_Mouth_Smile_Left': 0.3,
    'A39_Mouth_Smile_Right': 0.3,
    'Mouth_Widen': 0.4,
    'Mouth_Smile': 0.25
  },
  'う': { 
    'A25_Jaw_Open': 0.12,
    'A29_Mouth_Funnel': 0.4,
    'V_Tight_O': 0.5,
    'A33_Mouth_Roll_Upper': 0.18,
    'A34_Mouth_Roll_Lower': 0.18,
  },
  'え': { 
    'A25_Jaw_Open': 0.28,
    'V_Wide': 0.4,
    'Mouth_Open': 0.22,
    'A50_Mouth_Stretch_Left': 0.3,
    'A51_Mouth_Stretch_Right': 0.3,
    'A44_Mouth_Upper_Up_Left': 0.06,
    'A45_Mouth_Upper_Up_Right': 0.06,
    'Mouth_Widen_Sides': 0.25
  },
  'お': { 
    'A25_Jaw_Open': 0.28,
    'V_Open': 0.35,
    'A29_Mouth_Funnel': 0.4,
    'V_Tight_O': 0.35,
    'Mouth_Open': 0.22,
    'A33_Mouth_Roll_Upper': 0.1,
    'A34_Mouth_Roll_Lower': 0.1,
    'Mouth_Blow': 0.18
  },
  // カタカナも同様に最適化
  'ア': { 
    'A25_Jaw_Open': 0.45,
    'V_Open': 0.5,
    'Mouth_Open': 0.4,
    'A44_Mouth_Upper_Up_Left': 0.08,
    'A45_Mouth_Upper_Up_Right': 0.08,
    'A46_Mouth_Lower_Down_Left': 0.12,
    'A47_Mouth_Lower_Down_Right': 0.12,
    'V_Lip_Open': 0.35,
    'Mouth_Lips_Part': 0.25
  },
  'イ': { 
    'A25_Jaw_Open': 0.08,
    'V_Wide': 0.6,
    'A50_Mouth_Stretch_Left': 0.5,
    'A51_Mouth_Stretch_Right': 0.5,
    'A38_Mouth_Smile_Left': 0.3,
    'A39_Mouth_Smile_Right': 0.3,
    'Mouth_Widen': 0.4,
    'Mouth_Smile': 0.25
  },
  'ウ': { 
    'A25_Jaw_Open': 0.12,
    'A29_Mouth_Funnel': 0.4,
    'V_Tight_O': 0.5,
    'A33_Mouth_Roll_Upper': 0.18,
    'A34_Mouth_Roll_Lower': 0.18,
  },
  'エ': { 
    'A25_Jaw_Open': 0.28,
    'V_Wide': 0.4,
    'Mouth_Open': 0.22,
    'A50_Mouth_Stretch_Left': 0.3,
    'A51_Mouth_Stretch_Right': 0.3,
    'A44_Mouth_Upper_Up_Left': 0.06,
    'A45_Mouth_Upper_Up_Right': 0.06,
    'Mouth_Widen_Sides': 0.25
  },
  'オ': { 
    'A25_Jaw_Open': 0.28,
    'V_Open': 0.35,
    'A29_Mouth_Funnel': 0.4,
    'V_Tight_O': 0.35,
    'Mouth_Open': 0.22,
    'A33_Mouth_Roll_Upper': 0.1,
    'A34_Mouth_Roll_Lower': 0.1,
    'Mouth_Blow': 0.18
  }
};

// 文字から音素マッピングを取得（アバター対応版）
function getPhonemeMapping(char: string, avatarType?: string): { [morphName: string]: number } {
  // 英語の音素マッピングをチェック（大文字）
  const upperChar = char.toUpperCase();

  // Direct phoneme check first (for phonemes passed from hook)
  if (EnglishPhonemeToMorphs[upperChar]) {
    // Enhance the mapping for boy avatars
    if (avatarType === 'boy' || avatarType === 'boy_improved') {
      const baseMapping = EnglishPhonemeToMorphs[upperChar];
      const enhancedMapping: { [key: string]: number } = {};

      // Convert standard morph names to boy-specific ones where applicable
      Object.entries(baseMapping).forEach(([morphName, value]) => {
        if (morphName === 'A25_Jaw_Open') {
          enhancedMapping['Move_Jaw_Down'] = value * 1.2;
        }
        if (morphName === 'V_Wide') {
          enhancedMapping['Mouth_Widen'] = value;
          enhancedMapping['Mouth_Widen_Sides'] = value * 0.8;
        }
        if (morphName === 'A30_Mouth_Pucker') {
          enhancedMapping['Mouth_Pucker'] = value;
        }
        // Keep original mapping as well
        enhancedMapping[morphName] = value;
      });

      return enhancedMapping;
    }

    return EnglishPhonemeToMorphs[upperChar];
  }

  // 2文字の英語音素をチェック（例: CH, SH, TH）
  if (char.length >= 2) {
    const twoChar = char.substring(0, 2).toUpperCase();
    if (EnglishPhonemeToMorphs[twoChar]) {
      return EnglishPhonemeToMorphs[twoChar];
    }
  }

  // アルファベット1文字の場合
  if (/^[a-zA-Z]$/.test(char)) {
    // 基本母音にマッピング
    const vowelMap: { [key: string]: string } = {
      'a': 'A', 'e': 'E', 'i': 'I', 'o': 'O', 'u': 'U',
      'A': 'A', 'E': 'E', 'I': 'I', 'O': 'O', 'U': 'U'
    };

    const consonantMap: { [key: string]: string } = {
      'b': 'B', 'c': 'K', 'd': 'D', 'f': 'F', 'g': 'G',
      'h': 'HH', 'j': 'JH', 'k': 'K', 'l': 'L', 'm': 'M',
      'n': 'N', 'p': 'P', 'q': 'K', 'r': 'R', 's': 'S',
      't': 'T', 'v': 'V', 'w': 'W', 'x': 'K', 'y': 'Y', 'z': 'Z'
    };

    const lowerChar = char.toLowerCase();
    if (vowelMap[lowerChar] && EnglishPhonemeToMorphs[vowelMap[lowerChar]]) {
      return EnglishPhonemeToMorphs[vowelMap[lowerChar]];
    }
    if (consonantMap[lowerChar] && EnglishPhonemeToMorphs[consonantMap[lowerChar]]) {
      return EnglishPhonemeToMorphs[consonantMap[lowerChar]];
    }
  }

  // 少年アバター用の最適化されたマッピングを使用
  if (avatarType === 'boy' && BoyPhonemeMap[char]) {
    return BoyPhonemeMap[char];
  }
  
  // 少年改アバター用の最適化されたマッピングを使用（ARKitブレンドシェイプ対応）
  if (avatarType === 'boy_improved' && BoyImprovedPhonemeMap[char]) {
    return BoyImprovedPhonemeMap[char];
  }
  
  // 成人男性改用の最適化されたマッピングを使用
  if (avatarType === 'adult_improved' && AdultImprovedPhonemeMap[char]) {
    return AdultImprovedPhonemeMap[char];
  }
  
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

const ENGLISH_BILABIAL_PHONEMES = new Set(['M', 'B', 'P']);
const ENGLISH_ROUNDED_VOWELS = new Set(['UW', 'OW', 'UH', 'AO', 'OO', 'OY']);

type VisemeProfile = { [morph: string]: number };

const EnglishVisemeProfiles: Record<string, VisemeProfile> = {
  neutral: {
    'A25_Jaw_Open': 0.05,
    'Mouth_Open': 0.05,
    'Mouth_Lips_Part': 0.1,
  },
  bilabial: {
    'A37_Mouth_Close': 0.3,
    'A48_Mouth_Press_Left': 0.35,
    'A49_Mouth_Press_Right': 0.35,
    'Mouth_Lips_Part': 0.05,
  },
  labiodental: {
    'V_Dental_Lip': 0.55,
    'A44_Mouth_Upper_Up_Left': 0.18,
    'A45_Mouth_Upper_Up_Right': 0.18,
    'Mouth_Bottom_Lip_Bite': 0.35,
  },
  dental: {
    'A25_Jaw_Open': 0.18,
    'Mouth_Open': 0.22,
    'T06_Tongue_Tip_Up': 0.35,
    'Mouth_Lips_Part': 0.2,
  },
  alveolar: {
    'A25_Jaw_Open': 0.15,
    'Mouth_Open': 0.18,
    'V_Tongue_up': 0.4,
    'T06_Tongue_Tip_Up': 0.38,
    'A50_Mouth_Stretch_Left': 0.25,
    'A51_Mouth_Stretch_Right': 0.25,
  },
  postalveolar: {
    'A25_Jaw_Open': 0.16,
    'Mouth_Open': 0.2,
    'A30_Mouth_Pucker': 0.25,
    'V_Tongue_Raise': 0.35,
  },
  velar: {
    'A25_Jaw_Open': 0.22,
    'Mouth_Open': 0.24,
    'V_Tongue_Lower': 0.3,
  },
  glottal: {
    'A25_Jaw_Open': 0.18,
    'Mouth_Open': 0.18,
    'Mouth_Lips_Part': 0.25,
  },
  rounded: {
    'A30_Mouth_Pucker': 0.45,
    'A29_Mouth_Funnel': 0.35,
    'V_Tight_O': 0.35,
    'Mouth_Pucker_Open': 0.25,
  },
  spread: {
    'A25_Jaw_Open': 0.12,
    'A50_Mouth_Stretch_Left': 0.45,
    'A51_Mouth_Stretch_Right': 0.45,
    'Mouth_Widen': 0.35,
    'A38_Mouth_Smile_Left': 0.3,
    'A39_Mouth_Smile_Right': 0.3,
  },
  open: {
    'A25_Jaw_Open': 0.65,
    'Mouth_Open': 0.55,
    'V_Open': 0.45,
    'Mouth_Lips_Part': 0.35,
  },
  open_mid: {
    'A25_Jaw_Open': 0.5,
    'Mouth_Open': 0.45,
    'V_Open': 0.35,
  },
  mid: {
    'A25_Jaw_Open': 0.35,
    'Mouth_Open': 0.3,
    'V_Open': 0.25,
  },
  mid_spread: {
    'A25_Jaw_Open': 0.3,
    'Mouth_Open': 0.2,
    'A50_Mouth_Stretch_Left': 0.35,
    'A51_Mouth_Stretch_Right': 0.35,
    'Mouth_Widen': 0.25,
  },
  mid_rounded: {
    'A25_Jaw_Open': 0.28,
    'Mouth_Open': 0.25,
    'A30_Mouth_Pucker': 0.35,
    'V_Tight_O': 0.3,
  },
  close_spread: {
    'A25_Jaw_Open': 0.18,
    'Mouth_Open': 0.15,
    'A50_Mouth_Stretch_Left': 0.4,
    'A51_Mouth_Stretch_Right': 0.4,
    'Mouth_Widen': 0.3,
  },
  close_rounded: {
    'A25_Jaw_Open': 0.12,
    'A30_Mouth_Pucker': 0.55,
    'A29_Mouth_Funnel': 0.45,
    'V_Tight_O': 0.4,
  },
  open_rounded: {
    'A25_Jaw_Open': 0.55,
    'Mouth_Open': 0.48,
    'A30_Mouth_Pucker': 0.35,
    'V_Tight_O': 0.3,
  },
  open_to_close: {
    'A25_Jaw_Open': 0.45,
    'Mouth_Open': 0.4,
    'A29_Mouth_Funnel': 0.3,
    'Mouth_Widen': 0.2,
  },
  rounded_to_spread: {
    'A25_Jaw_Open': 0.35,
    'A30_Mouth_Pucker': 0.25,
    'A50_Mouth_Stretch_Left': 0.25,
    'A51_Mouth_Stretch_Right': 0.25,
    'Mouth_Widen': 0.2,
  },
};

const JapaneseVisemeProfiles: Record<string, VisemeProfile> = {
  neutral: {
    'A25_Jaw_Open': 0.1,
    'Mouth_Open': 0.08,
    'Mouth_Lips_Part': 0.12,
  },
  ja_vowel_a: {
    'A25_Jaw_Open': 0.6,
    'Mouth_Open': 0.52,
    'V_Open': 0.35,
    'Mouth_Lips_Part': 0.28,
  },
  ja_vowel_i: {
    'A25_Jaw_Open': 0.24,
    'Mouth_Open': 0.18,
    'A50_Mouth_Stretch_Left': 0.42,
    'A51_Mouth_Stretch_Right': 0.42,
    'Mouth_Widen': 0.32,
  },
  ja_vowel_u: {
    'A25_Jaw_Open': 0.22,
    'A30_Mouth_Pucker': 0.38,
    'A29_Mouth_Funnel': 0.3,
    'V_Tight_O': 0.28,
  },
  ja_vowel_e: {
    'A25_Jaw_Open': 0.32,
    'Mouth_Open': 0.25,
    'A50_Mouth_Stretch_Left': 0.32,
    'A51_Mouth_Stretch_Right': 0.32,
  },
  ja_vowel_o: {
    'A25_Jaw_Open': 0.42,
    'Mouth_Open': 0.36,
    'A30_Mouth_Pucker': 0.32,
    'V_Tight_O': 0.28,
  },
  ja_bilabial: {
    'A37_Mouth_Close': 0.22,
    'A48_Mouth_Press_Left': 0.28,
    'A49_Mouth_Press_Right': 0.28,
    'Mouth_Lips_Part': 0.07,
  },
  ja_labiodental: {
    'V_Dental_Lip': 0.48,
    'A30_Mouth_Pucker': 0.22,
    'A25_Jaw_Open': 0.2,
  },
  ja_alveolar: {
    'A25_Jaw_Open': 0.18,
    'Mouth_Open': 0.2,
    'V_Tongue_up': 0.38,
    'T06_Tongue_Tip_Up': 0.34,
  },
  ja_postalveolar: {
    'A25_Jaw_Open': 0.2,
    'Mouth_Open': 0.22,
    'A30_Mouth_Pucker': 0.24,
    'V_Tongue_Raise': 0.32,
  },
  ja_velar: {
    'A25_Jaw_Open': 0.24,
    'Mouth_Open': 0.26,
    'V_Tongue_Lower': 0.32,
  },
  ja_semivowel: {
    'A25_Jaw_Open': 0.2,
    'Mouth_Lips_Part': 0.22,
    'A30_Mouth_Pucker': 0.3,
  },
  ja_nasal: {
    'A25_Jaw_Open': 0.14,
    'A37_Mouth_Close': 0.18,
    'Mouth_Lips_Part': 0.12,
  },
  ja_hold: {
    'A37_Mouth_Close': 0.26,
    'A48_Mouth_Press_Left': 0.22,
    'A49_Mouth_Press_Right': 0.22,
  },
};

const JapaneseCharToViseme: Record<string, string> = {
  'あ': 'ja_vowel_a', 'ア': 'ja_vowel_a', 'ぁ': 'ja_vowel_a', 'ァ': 'ja_vowel_a',
  'い': 'ja_vowel_i', 'イ': 'ja_vowel_i', 'ぃ': 'ja_vowel_i', 'ィ': 'ja_vowel_i',
  'う': 'ja_vowel_u', 'ウ': 'ja_vowel_u', 'ぅ': 'ja_vowel_u', 'ゥ': 'ja_vowel_u',
  'え': 'ja_vowel_e', 'エ': 'ja_vowel_e', 'ぇ': 'ja_vowel_e', 'ェ': 'ja_vowel_e',
  'お': 'ja_vowel_o', 'オ': 'ja_vowel_o', 'ぉ': 'ja_vowel_o', 'ォ': 'ja_vowel_o',
  'か': 'ja_velar', 'き': 'ja_velar', 'く': 'ja_velar', 'け': 'ja_velar', 'こ': 'ja_velar',
  'カ': 'ja_velar', 'キ': 'ja_velar', 'ク': 'ja_velar', 'ケ': 'ja_velar', 'コ': 'ja_velar',
  'が': 'ja_velar', 'ぎ': 'ja_velar', 'ぐ': 'ja_velar', 'げ': 'ja_velar', 'ご': 'ja_velar',
  'ガ': 'ja_velar', 'ギ': 'ja_velar', 'グ': 'ja_velar', 'ゲ': 'ja_velar', 'ゴ': 'ja_velar',
  'さ': 'ja_alveolar', 'す': 'ja_alveolar', 'せ': 'ja_alveolar', 'そ': 'ja_alveolar',
  'サ': 'ja_alveolar', 'ス': 'ja_alveolar', 'セ': 'ja_alveolar', 'ソ': 'ja_alveolar',
  'ざ': 'ja_alveolar', 'ず': 'ja_alveolar', 'ぜ': 'ja_alveolar', 'ぞ': 'ja_alveolar',
  'ザ': 'ja_alveolar', 'ズ': 'ja_alveolar', 'ゼ': 'ja_alveolar', 'ゾ': 'ja_alveolar',
  'し': 'ja_postalveolar', 'シ': 'ja_postalveolar', 'じ': 'ja_postalveolar', 'ジ': 'ja_postalveolar',
  'ち': 'ja_postalveolar', 'チ': 'ja_postalveolar', 'ぢ': 'ja_postalveolar', 'ヂ': 'ja_postalveolar',
  'つ': 'ja_postalveolar', 'ツ': 'ja_postalveolar',
  'た': 'ja_alveolar', 'て': 'ja_alveolar', 'と': 'ja_alveolar', 'だ': 'ja_alveolar', 'で': 'ja_alveolar', 'ど': 'ja_alveolar',
  'タ': 'ja_alveolar', 'テ': 'ja_alveolar', 'ト': 'ja_alveolar', 'ダ': 'ja_alveolar', 'デ': 'ja_alveolar', 'ド': 'ja_alveolar',
  'な': 'ja_alveolar', 'に': 'ja_alveolar', 'ぬ': 'ja_alveolar', 'ね': 'ja_alveolar', 'の': 'ja_alveolar',
  'ナ': 'ja_alveolar', 'ニ': 'ja_alveolar', 'ヌ': 'ja_alveolar', 'ネ': 'ja_alveolar', 'ノ': 'ja_alveolar',
  'ら': 'ja_alveolar', 'り': 'ja_alveolar', 'る': 'ja_alveolar', 'れ': 'ja_alveolar', 'ろ': 'ja_alveolar',
  'ラ': 'ja_alveolar', 'リ': 'ja_alveolar', 'ル': 'ja_alveolar', 'レ': 'ja_alveolar', 'ロ': 'ja_alveolar',
  'は': 'ja_bilabial', 'ひ': 'ja_bilabial', 'へ': 'ja_bilabial', 'ほ': 'ja_bilabial',
  'ハ': 'ja_bilabial', 'ヒ': 'ja_bilabial', 'ヘ': 'ja_bilabial', 'ホ': 'ja_bilabial',
  'ば': 'ja_bilabial', 'び': 'ja_bilabial', 'ぶ': 'ja_bilabial', 'べ': 'ja_bilabial', 'ぼ': 'ja_bilabial',
  'バ': 'ja_bilabial', 'ビ': 'ja_bilabial', 'ブ': 'ja_bilabial', 'ベ': 'ja_bilabial', 'ボ': 'ja_bilabial',
  'ぱ': 'ja_bilabial', 'ぴ': 'ja_bilabial', 'ぷ': 'ja_bilabial', 'ぺ': 'ja_bilabial', 'ぽ': 'ja_bilabial',
  'パ': 'ja_bilabial', 'ピ': 'ja_bilabial', 'プ': 'ja_bilabial', 'ペ': 'ja_bilabial', 'ポ': 'ja_bilabial',
  'ま': 'ja_bilabial', 'み': 'ja_bilabial', 'む': 'ja_bilabial', 'め': 'ja_bilabial', 'も': 'ja_bilabial',
  'マ': 'ja_bilabial', 'ミ': 'ja_bilabial', 'ム': 'ja_bilabial', 'メ': 'ja_bilabial', 'モ': 'ja_bilabial',
  'ふ': 'ja_labiodental', 'フ': 'ja_labiodental',
  'や': 'ja_semivowel', 'ゆ': 'ja_semivowel', 'よ': 'ja_semivowel',
  'ヤ': 'ja_semivowel', 'ユ': 'ja_semivowel', 'ヨ': 'ja_semivowel',
  'わ': 'ja_semivowel', 'ゐ': 'ja_semivowel', 'ゑ': 'ja_semivowel', 'を': 'ja_semivowel',
  'ワ': 'ja_semivowel', 'ヰ': 'ja_semivowel', 'ヱ': 'ja_semivowel', 'ヲ': 'ja_semivowel',
  'ん': 'ja_nasal', 'ン': 'ja_nasal',
  'ゃ': 'ja_semivowel', 'ゅ': 'ja_semivowel', 'ょ': 'ja_semivowel',
  'ャ': 'ja_semivowel', 'ュ': 'ja_semivowel', 'ョ': 'ja_semivowel',
  'っ': 'ja_hold', 'ッ': 'ja_hold',
  'ー': 'neutral',
};

function getJapaneseVisemeKey(char: string): string {
  return JapaneseCharToViseme[char] || 'neutral';
}

function adjustJapaneseMorphs(char: string | null, baseMapping: { [key: string]: number }): { [key: string]: number } {
  const mapping: { [key: string]: number } = { ...baseMapping };
  const clampList: [string, number][] = [
    ['A50_Mouth_Stretch_Left', 0.45],
    ['A51_Mouth_Stretch_Right', 0.45],
    ['Mouth_Widen', 0.35],
    ['Mouth_Widen_Sides', 0.3],
    ['A30_Mouth_Pucker', 0.45],
    ['A29_Mouth_Funnel', 0.4],
    ['V_Tight_O', 0.4],
  ];

  clampList.forEach(([key, max]) => {
    if (mapping[key] !== undefined) {
      mapping[key] = Math.min(mapping[key], max);
    }
  });

  if (mapping['Mouth_Lips_Part'] !== undefined) {
    mapping['Mouth_Lips_Part'] = Math.max(0.06, Math.min(mapping['Mouth_Lips_Part'], 0.3));
  }

  // 鼻音は口の開きを軽減
  if (char && (char === 'ん' || char === 'ン')) {
    mapping['A25_Jaw_Open'] = Math.min(mapping['A25_Jaw_Open'] ?? 0.2, 0.2);
    mapping['Mouth_Open'] = Math.min(mapping['Mouth_Open'] ?? 0.15, 0.15);
  }

  return mapping;
}

const JAPANESE_CHAR_REGEX = /[぀-ヿ]/;

function isJapaneseCharacter(char: string): boolean {
  return JAPANESE_CHAR_REGEX.test(char);
}

const LOWER_TEETH_REST_POSE: Record<string, { y: number; rotX: number; z: number }> = {
  adult: { y: -0.02, rotX: -0.08, z: 0 },
  adult_improved: { y: -0.02, rotX: -0.08, z: 0 }
};


function setupBoyAvatarMaterials(scene: THREE.Object3D, onReady?: () => void): boolean {
  if (!scene || scene.userData.texturesApplied) {
    return false;
  }

  const originalVisibility = scene.visible;
  const hiddenOralMeshes: THREE.Object3D[] = [];

  try {
    const hideOralMesh = (mesh: any) => {
      if (!mesh) return;
      if (!hiddenOralMeshes.includes(mesh)) {
        hiddenOralMeshes.push(mesh);
      }
      mesh.visible = false;
    };
    const applyBoyOralBase = () => {
      scene.traverse((child: any) => {
        if (!child.isMesh) return;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        const lowerName = child.name?.toLowerCase?.() || '';
        if (
          lowerName.includes('nug_base_teeth') ||
          lowerName.includes('nug_base_tongue') ||
          lowerName.includes('nug_teeth') ||
          lowerName.includes('tongue')
        ) {
          hideOralMesh(child);
        }
        materials.forEach((material: THREE.Material) => {
          if (!material) return;
          const mat = material as any;
          const matName = material.name?.toLowerCase() || '';

          if (matName.includes('nug_upper_teeth')) {
            mat.color = new THREE.Color(0xe7d2ba);
            mat.roughness = 0.22;
            mat.metalness = 0.0;
            if (mat.emissive) {
              mat.emissive = new THREE.Color(0x1f120c);
              mat.emissiveIntensity = 0.03;
            }
            mat.needsUpdate = true;
          } else if (matName.includes('nug_lower_teeth')) {
            mat.color = new THREE.Color(0xe3cab3);
            mat.roughness = 0.24;
            mat.metalness = 0.0;
            if (mat.emissive) {
              mat.emissive = new THREE.Color(0x1b110c);
              mat.emissiveIntensity = 0.03;
            }
            mat.needsUpdate = true;
          } else if (matName.includes('nug_tongue')) {
            mat.color = new THREE.Color(0xb54f60);
            mat.roughness = 0.15;
            mat.metalness = 0.0;
            if (mat.emissive) {
              mat.emissive = new THREE.Color(0xb54f60);
              mat.emissiveIntensity = 1.0;
            }
            mat.needsUpdate = true;
          }
        });
      });
    };

    const processBoyMaterials = () => {
      const materialsToUpdate: Set<THREE.Material> = new Set();

      scene.traverse((child: any) => {
        if (!child.isMesh) return;

        const meshName = child.name;
        const lowerMeshName = meshName.toLowerCase();

        if (
          lowerMeshName.includes('beard') ||
          lowerMeshName.includes('mustache') ||
          lowerMeshName.includes('goatee') ||
          lowerMeshName.includes('stubble')
        ) {
          child.visible = false;
          console.log(`  -> 非表示: ${meshName}`);
          return;
        }

        if (lowerMeshName.includes('cornea')) {
          child.visible = false;
          console.log(`  -> 角膜を非表示: ${meshName}`);
          return;
        }

        const materials = Array.isArray(child.material) ? child.material : [child.material];
        const lowerName = child.name?.toLowerCase?.() || '';
        if (
          lowerName.includes('nug_base_teeth') ||
          lowerName.includes('nug_base_tongue') ||
          lowerName.includes('nug_teeth') ||
          lowerName.includes('tongue')
        ) {
          hideOralMesh(child);
        }

        materials.forEach((material: THREE.Material) => {
          if (!material) return;
          materialsToUpdate.add(material);
        });
      });

      console.log(`マテリアル総数: ${materialsToUpdate.size}`);

      materialsToUpdate.forEach((material: THREE.Material) => {
        const mat = material as any;
        const matName = material.name?.toLowerCase() || '';

        console.log(`マテリアル処理: ${material.name} (type: ${material.type})`);

        mat.vertexColors = false;
        mat.side = THREE.DoubleSide;

        if (
          !matName.includes('nug_eye_r') &&
          !matName.includes('nug_eye_l') &&
          !matName.includes('nug_cornea_r') &&
          !matName.includes('nug_cornea_l') &&
          !matName.includes('nug_upper_teeth') &&
          !matName.includes('nug_lower_teeth') &&
          !matName.includes('nug_tongue')
        ) {
          if (mat.map) {
            mat.map.dispose?.();
            mat.map = null;
          }
          mat.normalMap = null;
          mat.aoMap = null;
          mat.emissiveMap = null;
        }

        if (
          !matName.includes('nug_cornea_r') &&
          !matName.includes('nug_cornea_l') &&
          !matName.includes('nug_tearline_r') &&
          !matName.includes('nug_tearline_l') &&
          !matName.includes('nug_eyelash')
        ) {
          mat.transparent = false;
          mat.opacity = 1.0;
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
          case 'hair_transparency':
            mat.color = new THREE.Color(0x1a1511);
            mat.emissive = new THREE.Color(0x000000);
            mat.emissiveIntensity = 0.0;
            mat.roughness = 1.0; // 完全にマット
            mat.metalness = 0.0;
            // テクスチャとnormalMapを削除してマット仕上げ
            mat.map = null;
            mat.normalMap = null;
            mat.bumpMap = null;
            if (mat.envMapIntensity !== undefined) {
              mat.envMapIntensity = 0.0; // 環境反射を無効化
            }
            mat.needsUpdate = true; // マテリアル更新を強制
            console.log(`  -> 髪: 茶色（完全マット・テクスチャなし）`);
            break;

          case 'eyebrow_transparency':
            mat.color = new THREE.Color(0x1a1511);
            mat.emissive = new THREE.Color(0x000000);
            mat.emissiveIntensity = 0.0;
            mat.roughness = 1.0; // 完全にマット
            mat.metalness = 0.0;
            // テクスチャとnormalMapを削除してマット仕上げ
            mat.map = null;
            mat.normalMap = null;
            mat.bumpMap = null;
            if (mat.envMapIntensity !== undefined) {
              mat.envMapIntensity = 0.0; // 環境反射を無効化
            }
            mat.needsUpdate = true; // マテリアル更新を強制
            console.log(`  -> 眉毛: 茶色（完全マット・テクスチャなし）`);
            break;

          case 'nug_eye_r': {
            mat.color = new THREE.Color(0x8b6f47);
            mat.emissive = new THREE.Color(0x443322);
            mat.emissiveIntensity = 0.15;
            mat.transparent = false;
            mat.opacity = 1.0;
            mat.roughness = 0.3;
            mat.metalness = 0.0;
            mat.depthWrite = true;
            mat.side = THREE.FrontSide;

            const textureLoaderR = new THREE.TextureLoader();
            textureLoaderR.load(
              '/models/ClassicMan.fbm/Std_Cornea_R_Pbr_Diffuse.jpg',
              (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                mat.map = texture;
                mat.color = new THREE.Color(0xffffff);
                mat.needsUpdate = true;
                console.log(`  -> 右目: テクスチャ読み込み完了`);
              },
              undefined,
              (error) => {
                console.error(`  -> 右目: テクスチャ読み込みエラー`, error);
              }
            );
            console.log(`  -> 右目: 茶色虹彩（フォールバック色設定）`);
            break;
          }

          case 'nug_eye_l': {
            mat.color = new THREE.Color(0x8b6f47);
            mat.emissive = new THREE.Color(0x443322);
            mat.emissiveIntensity = 0.15;
            mat.transparent = false;
            mat.opacity = 1.0;
            mat.roughness = 0.3;
            mat.metalness = 0.0;
            mat.depthWrite = true;
            mat.side = THREE.FrontSide;

            const textureLoaderL = new THREE.TextureLoader();
            textureLoaderL.load(
              '/models/ClassicMan.fbm/Std_Cornea_R_Pbr_Diffuse.jpg',
              (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                mat.map = texture;
                mat.color = new THREE.Color(0xffffff);
                mat.needsUpdate = true;
                console.log(`  -> 左目: テクスチャ読み込み完了`);
              },
              undefined,
              (error) => {
                console.error(`  -> 左目: テクスチャ読み込みエラー`, error);
              }
            );
            console.log(`  -> 左目: 茶色虹彩（フォールバック色設定）`);
            break;
          }

          case 'nug_cornea_r':
          case 'nug_cornea_l':
            mat.map = null;
            mat.transparent = true;
            mat.opacity = 0.0;
            mat.roughness = 0.05;
            mat.metalness = 0.0;
            mat.depthWrite = false;
            mat.visible = false;
            console.log(`  -> 角膜: 完全透明（非表示）`);
            break;

          case 'nug_skin_head':
          case 'nug_skin_body':
          case 'nug_skin_arm':
          case 'nug_skin_leg':
            mat.color = new THREE.Color(0xa87860);
            mat.emissive = new THREE.Color(0xa87860);
            mat.emissiveIntensity = 0.15;
            mat.roughness = 0.45;
            mat.metalness = 0.0;
            console.log(`  -> 肌: 自然なベージュ`);
            break;

          case 'nug_upper_teeth':
            mat.color = new THREE.Color(0xe7d2ba);
            mat.roughness = 0.22;
            mat.metalness = 0.0;
            if (mat.emissive) {
              mat.emissive = new THREE.Color(0x1f120c);
              mat.emissiveIntensity = 0.03;
            }
            mat.transparent = false;
            mat.opacity = 1.0;
            console.log(`  -> 上の歯: アイボリー`);
            break;

          case 'nug_lower_teeth':
            mat.color = new THREE.Color(0xe3cab3);
            mat.roughness = 0.24;
            mat.metalness = 0.0;
            if (mat.emissive) {
              mat.emissive = new THREE.Color(0x1b110c);
              mat.emissiveIntensity = 0.03;
            }
            mat.transparent = false;
            mat.opacity = 1.0;
            console.log(`  -> 下の歯: アイボリー`);
            break;

          case 'nug_tongue':
            mat.color = new THREE.Color(0xb54f60);
            mat.roughness = 0.15;
            mat.metalness = 0.0;
            if (mat.emissive) {
              mat.emissive = new THREE.Color(0xb54f60);
              mat.emissiveIntensity = 1.0;
            }
            mat.transparent = false;
            mat.opacity = 1.0;
            console.log(`  -> 舌: 暗めのピンク (ライト影響なし)`);
            break;

          case 'nug_nails':
            mat.color = new THREE.Color(0xf5c9a6);
            mat.roughness = 0.3;
            mat.metalness = 0.0;
            console.log(`  -> 爪: 薄いベージュ`);
            break;

          case 'fit_shirts':
            mat.color = new THREE.Color(0x4a7c59);
            mat.emissive = new THREE.Color(0x4a7c59);
            mat.emissiveIntensity = 0.1;
            mat.roughness = 0.7;
            mat.metalness = 0.0;
            console.log(`  -> シャツ: 緑`);
            break;

          case 'pants':
            mat.color = new THREE.Color(0x3b4c5a);
            mat.emissive = new THREE.Color(0x3b4c5a);
            mat.emissiveIntensity = 0.1;
            mat.roughness = 0.6;
            mat.metalness = 0.0;
            console.log(`  -> パンツ: 青`);
            break;

          case 'boat_shoes':
            mat.color = new THREE.Color(0x4a3c28);
            mat.roughness = 0.4;
            mat.metalness = 0.1;
            console.log(`  -> 靴: 茶色`);
            break;

          case 'nug_eyelash':
          case 'nug_tearline_r':
          case 'nug_tearline_l':
            mat.color = new THREE.Color(0xa87860);
            mat.emissive = new THREE.Color(0xa87860);
            mat.emissiveIntensity = 0.15;
            mat.roughness = 0.5;
            mat.metalness = 0.0;
            console.log(`  -> まつ毛/ティアライン: 肌色`);
            break;

          case 'beard_base_transparency':
          case 'nug_eye_onuglusion_r':
          case 'nug_eye_onuglusion_l':
            console.log(`  -> スキップ: ${matName}`);
            break;

          default:
            mat.color = new THREE.Color(0xc08870);
            mat.roughness = 0.5;
            mat.metalness = 0.0;
            console.log(`  -> デフォルト肌色: ${matName}`);
            break;
        }

        mat.needsUpdate = true;

        if (mat.color) {
          console.log(`  最終的な色: #${mat.color.getHexString()}`);
        }
      });

      scene.traverse((child: any) => {
        if (!child.isMesh) return;
        const lowerMeshName = child.name.toLowerCase();

        if (lowerMeshName.includes('occlusion') || lowerMeshName.includes('onuglusion')) {
          child.visible = false;
          console.log(`  -> 非表示設定: ${child.name}`);
        }

        if (lowerMeshName.includes('nug_base_eye') && !lowerMeshName.includes('onuglusion')) {
          child.visible = true;
          console.log(`  -> 目を表示: ${child.name}`);
        }

        if (lowerMeshName.includes('cornea')) {
          child.visible = true;
          console.log(`  -> 角膜を表示: ${child.name}`);
        }
      });
    };

    applyBoyOralBase();
    processBoyMaterials();

    console.log('[AvatarModel] 少年アバターの色設定完了');
    scene.userData.texturesApplied = true;
    const restoreVisibility = () => {
      hiddenOralMeshes.forEach(mesh => {
        mesh.visible = true;
      });
      scene.visible = originalVisibility;
      onReady?.();
    };
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(restoreVisibility);
    } else {
      restoreVisibility();
    }
    return true;
  } catch (error) {
    console.warn('[AvatarModel] 少年アバターのマテリアル処理でエラー（初期化時）:', error);
    hiddenOralMeshes.forEach(mesh => {
      mesh.visible = true;
    });
    scene.visible = originalVisibility;
    onReady?.();
    return false;
  }
}


function adjustEnglishMorphs(
  phoneme: string | null,
  baseMapping: { [key: string]: number }
): { [key: string]: number } {
  if (!phoneme) {
    return baseMapping;
  }

  const mapping: { [key: string]: number } = { ...baseMapping };

  if (ENGLISH_BILABIAL_PHONEMES.has(phoneme)) {
    if (mapping['A37_Mouth_Close'] !== undefined) {
      mapping['A37_Mouth_Close'] = Math.min(mapping['A37_Mouth_Close'], 0.36);
    }
    if (mapping['A48_Mouth_Press_Left'] !== undefined) {
      mapping['A48_Mouth_Press_Left'] = Math.min(mapping['A48_Mouth_Press_Left'], 0.3);
    }
    if (mapping['A49_Mouth_Press_Right'] !== undefined) {
      mapping['A49_Mouth_Press_Right'] = Math.min(mapping['A49_Mouth_Press_Right'], 0.3);
    }
    if (mapping['Mouth_Lips_Part'] !== undefined) {
      mapping['Mouth_Lips_Part'] = Math.max(mapping['Mouth_Lips_Part'], 0.08);
    } else {
      mapping['Mouth_Lips_Part'] = 0.08;
    }
  } else if (ENGLISH_ROUNDED_VOWELS.has(phoneme)) {
    if (mapping['A30_Mouth_Pucker'] !== undefined) {
      mapping['A30_Mouth_Pucker'] = Math.min(mapping['A30_Mouth_Pucker'] * 1.1, 0.45);
    }
    if (mapping['V_Tight_O'] !== undefined) {
      mapping['V_Tight_O'] = Math.min(mapping['V_Tight_O'] * 1.1, 0.45);
    }
    mapping['Mouth_Lips_Part'] = Math.max((mapping['Mouth_Lips_Part'] ?? 0.1), 0.1);
  }

  const cornerLimitKeys: [string, number][] = [
    ['A50_Mouth_Stretch_Left', 0.35],
    ['A51_Mouth_Stretch_Right', 0.35],
    ['A38_Mouth_Smile_Left', 0.25],
    ['A39_Mouth_Smile_Right', 0.25],
    ['Mouth_Widen', 0.35],
    ['Mouth_Widen_Sides', 0.3],
  ];

  cornerLimitKeys.forEach(([key, max]) => {
    if (mapping[key] !== undefined) {
      mapping[key] = Math.min(mapping[key], max);
    }
  });

  return mapping;
}


function AvatarModel({ 
  isSpeaking, 
  audioLevel = 0, 
  currentWord = '', 
  currentPhoneme: _currentPhoneme = '',
  speechProgress: _speechProgress = 0,
  audioData,
  audioFrequency = 0,
  onLoaded,
  modelPath = '/models/adult-male.glb',
  selectedAvatar = 'adult'
}: AvatarModelProps) {
  // モデルタイプの判定（URLエンコードされた文字列も考慮）
  const decodedModelPath = decodeURIComponent(modelPath);

  const isBoyImprovedModel =
    decodedModelPath.includes('少年改アバター') ||
    decodedModelPath.includes('少年改') ||
    decodedModelPath.includes('Baby main') ||
    decodedModelPath.includes('baby') ||
    modelPath.includes('Baby%20main') ||
    modelPath.includes('boy-improved-avatar') ||
    modelPath.includes('ClassicMan-3のコピー');
  const isBoyModel = !isBoyImprovedModel && (decodedModelPath.includes('少年アバター') || modelPath.includes('boy-avatar') || modelPath.includes('ClassicMan') || modelPath.includes('BOY_4'));
  const isAdultImprovedModel = decodedModelPath.includes('成人男性改');
  const isAdultModel = !isAdultImprovedModel && (decodedModelPath.includes('成人男性') || modelPath.includes('adult-male') || modelPath.includes('man-grey-suit'));
  const isFemaleModel =
    modelPath.includes('Hayden') ||
    modelPath.includes('female') ||
    modelPath.includes('Mother') ||
    modelPath.includes('mother') ||
    decodedModelPath.includes('Hayden') ||
    decodedModelPath.includes('Mother') ||
    (typeof selectedAvatar === 'string' && selectedAvatar === 'female');
  const isChildModel = decodedModelPath.includes('Baby main') || decodedModelPath.includes('baby') || modelPath.includes('Baby%20main');

  // デバッグログ
  console.log('[Model Detection]', {
    modelPath,
    decodedModelPath,
    selectedAvatar,
    isBoyModel,
    isAdultModel,
    isFemaleModel,
    isBoyImprovedModel
  });

  // モデル別のリップシンク設定
  const lipSyncConfig = {
    jawMultiplier: isFemaleModel ? 0.85 : (isBoyImprovedModel ? 0.9 : (isBoyModel ? 0.9 : 1.0)),  // 少年アバターを少年改と同じに
    mouthMultiplier: isFemaleModel ? 0.9 : (isBoyImprovedModel ? 0.95 : (isBoyModel ? 0.95 : 1.0)), // 少年アバターを少年改と同じに
    tongueMultiplier: isBoyModel ? 1.0 : 1.0, // 舌の動きは変更なし
    blinkInterval: isFemaleModel ? 3 : (isBoyImprovedModel ? 3.5 : (isBoyModel ? 3 : 3)), // 男性1（青年）の瞬き頻度
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
  const nugLowerTeethMesh = useRef<any>(null); // 少年アバター用の下の歯メッシュ
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
  const anticipationReady = useRef(false);
  const audioHistory = useRef<number[]>([]);
  const smoothedAudioLevel = useRef<number>(0);
  const peakDetectionThreshold = useRef<number>(0.3);
  const lastPeakTime = useRef<number>(0);
  const lastDebugTime = useRef<number>(0);
  const applyLowerTeethRestPose = useCallback(() => {
    const restPose = LOWER_TEETH_REST_POSE[selectedAvatar];
    if (!restPose) {
      return;
    }

    if (teeth01Bone.current) {
      teeth01Bone.current.position.set(0, restPose.y, restPose.z);
      teeth01Bone.current.rotation.set(restPose.rotX, 0, 0);
      teeth01Bone.current.updateMatrixWorld(true);
    }

    if (teeth02Bone.current) {
      teeth02Bone.current.position.set(0, restPose.y, restPose.z);
      teeth02Bone.current.rotation.set(restPose.rotX, 0, 0);
      teeth02Bone.current.updateMatrixWorld(true);
    }

    if (lowerTeethMesh.current && !lowerTeethMesh.current.isSkinnedMesh) {
      lowerTeethMesh.current.position.y = lowerTeethOriginalY.current + restPose.y;
      lowerTeethMesh.current.position.z = restPose.z;
      lowerTeethMesh.current.rotation.x = restPose.rotX;
      lowerTeethMesh.current.updateMatrixWorld(true);
    }

    if (nugLowerTeethMesh.current) {
      nugLowerTeethMesh.current.position.y = lowerTeethOriginalY.current + restPose.y;
      nugLowerTeethMesh.current.position.z = restPose.z;
      nugLowerTeethMesh.current.rotation.x = restPose.rotX;
      nugLowerTeethMesh.current.updateMatrixWorld(true);
    }
  }, [selectedAvatar]);
  
  // GLBファイル読み込み（Suspenseと連携）
  // modelPathは既にmodelPaths.tsでクリーニング済み
  const hasLoggedRef = useRef(false);
  if (!hasLoggedRef.current) {
    console.log(`[FinalLipSyncAvatar] Loading model: ${modelPath} for avatar: ${selectedAvatar}`);
    hasLoggedRef.current = true;
  }
  const safeModelPath = encodeURI(modelPath);
  const gltf = useGLTF(safeModelPath);
  const scene = gltf.scene;

  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  useIsomorphicLayoutEffect(() => {
    if (!scene) return;

    const notifyLoaded = () => {
      if (onLoaded) {
        Promise.resolve().then(onLoaded);
      }
    };

    // async処理を含むため、即時実行async関数で囲む
    (async () => {

    if (isChildModel && !scene.userData.childAvatarAdjusted) {
      try {
        // ステージ装飾など不要なメッシュを非表示
        const hiddenKeywords = ['Backdrop', 'Joystic'];
        scene.traverse((child: any) => {
          if (child.isMesh) {
            const name = child.name || '';
            if (hiddenKeywords.some(keyword => name.includes(keyword))) {
              child.visible = false;
            }
          }
        });

        // 身長を大きめに正規化（上半身が強調されるサイズ）
        const targetHeight = 12;
        scene.updateMatrixWorld(true);
        const rigRoot = scene.getObjectByName('bb_Rigify') || scene;
        const initialBox = new THREE.Box3().setFromObject(rigRoot);
        const size = new THREE.Vector3();
        initialBox.getSize(size);
        if (size.y > 0.0001) {
          const scaleFactor = targetHeight / size.y;
          scene.scale.setScalar(scaleFactor);
          scene.updateMatrixWorld(true);
        }

        // 床位置を原点に合わせ、中心をX/Z原点へ移動
        const scaledBox = new THREE.Box3().setFromObject(rigRoot);
        const center = new THREE.Vector3();
        scaledBox.getCenter(center);
        scene.position.x -= center.x;
        scene.position.z -= center.z;
        const desiredCenterY = 0.9;
        scene.position.y += desiredCenterY - center.y;
        scene.updateMatrixWorld(true);
      } catch (error) {
        console.warn('[AvatarModel] 小児アバターの正規化中にエラー:', error);
      }

      scene.userData.childAvatarAdjusted = true;
    }

    // 少年アバターの場合のみログ出力
    const isBoyAvatar = modelPath.includes('少年');
    
    // モデルごとのテクスチャ適用
    // URLエンコードされた文字列とデコードされた文字列の両方をチェック
    const decodedPath = decodeURIComponent(modelPath);
    
    if (modelPath.includes('少年アバター') || modelPath.includes('%E5%B0%91%E5%B9%B4%E3%82%A2%E3%83%90%E3%82%BF%E3%83%BC') || modelPath.includes('boy-avatar') || isBoyModel) {
      // マテリアル処理は1回のみ実行（開発モードでもリセットしない）
      console.log('[AvatarModel] Applying boy avatar materials');
      const applied = setupBoyAvatarMaterials(scene, notifyLoaded);
      if (!applied) {
        notifyLoaded();
      }
    } else if (modelPath.includes('少年改') || modelPath.includes('%E5%B0%91%E5%B9%B4%E6%94%B9') || decodedPath.includes('少年改') || isBoyImprovedModel) {
      // 少年改アバターのテクスチャ適用を一時的にスキップ
      console.log('[AvatarModel] 少年改アバターのテクスチャ適用を一時的にスキップ');
      
      if (onLoaded) {
        console.log(`[FinalLipSyncAvatar] Model loaded, calling onLoaded for ${selectedAvatar}`);
        notifyLoaded();
      }
    } else if (isAdultModel) {
      if (!scene.userData.adultTexturesApplied) {
        const processAdultMaterials = () => {
          try {
            const materialsToUpdate: Set<THREE.Material> = new Set();

            scene.traverse((child: any) => {
              if (!child.isMesh) return;
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              materials.forEach((material: THREE.Material) => {
                if (!material) return;
                materialsToUpdate.add(material);
              });
            });

            materialsToUpdate.forEach((material: THREE.Material) => {
              const mat = material as any;
              const matName = material.name?.toLowerCase() || '';

              if (matName.includes('std_upper_teeth')) {
                mat.color = new THREE.Color(0xfaf6ef);
                if (mat.emissive) {
                  mat.emissive = new THREE.Color(0x2b201a);
                  mat.emissiveIntensity = 0.06;
                }
                mat.roughness = 0.22;
                mat.metalness = 0.04;
                mat.transparent = false;
                mat.opacity = 1.0;
              } else if (matName.includes('std_lower_teeth')) {
                mat.color = new THREE.Color(0xf8f2e9);
                if (mat.emissive) {
                  mat.emissive = new THREE.Color(0x241a15);
                  mat.emissiveIntensity = 0.05;
                }
                mat.roughness = 0.24;
                mat.metalness = 0.04;
                mat.transparent = false;
                mat.opacity = 1.0;
              } else if (matName.includes('std_tongue')) {
                mat.color = new THREE.Color(0x0000ff);
                mat.roughness = 0.2;
                mat.metalness = 0.02;
                if (mat.emissive) {
                  mat.emissive = new THREE.Color(0x0000ff);
                  mat.emissiveIntensity = 1.0;
                }
                mat.transparent = false;
                mat.opacity = 1.0;
                mat.depthWrite = true;
              }

              if (matName.includes('std_upper_teeth') || matName.includes('std_lower_teeth') || matName.includes('std_tongue')) {
                mat.needsUpdate = true;
              }
            });

            scene.userData.adultTexturesApplied = true;
            applyLowerTeethRestPose();
          } catch (error) {
            console.warn('[AvatarModel] 成人男性アバターのマテリアル処理でエラー:', error);
          }

          notifyLoaded();
        };

        processAdultMaterials();
      } else if (onLoaded) {
        notifyLoaded();
      }
    } else if (
      modelPath.includes('Hayden') ||
      modelPath.includes('female') ||
      modelPath.includes('Mother') ||
      modelPath.includes('mother') ||
      decodedPath.includes('Hayden') ||
      decodedPath.includes('Mother') ||
      selectedAvatar === 'female'
    ) {
      // WebGLコンテキストロス時の再適用のため、グローバルに保存
      (window as any).__FEMALE_AVATAR_SCENE__ = scene;

      // テクスチャ適用は初回のみ（フラグで管理）
      if (!scene.userData.femaleTexturesApplied) {
        try {
          console.log('[AvatarModel] Starting texture application for female avatar');
          // テクスチャ適用完了を待ってからonLoadedを呼ぶ
          await applyMotherAvatarTextures(scene);
          console.log('[AvatarModel] 女性アバターのマテリアル適用を完了');

          // テクスチャ適用完了後にonLoadedを呼ぶ
          if (onLoaded) {
            console.log(`[FinalLipSyncAvatar] Female model ready, calling onLoaded for ${selectedAvatar}`);
            notifyLoaded();
          }
        } catch (error) {
          console.warn('[AvatarModel] 女性アバターのマテリアル処理でエラー:', error);
          // エラーが発生してもonLoadedは呼ぶ
          if (onLoaded) {
            notifyLoaded();
          }
        }
      } else {
        console.log('[AvatarModel] 女性アバターのテクスチャは既に適用済み');
        if (onLoaded) {
          console.log(`[FinalLipSyncAvatar] Female model ready, calling onLoaded for ${selectedAvatar}`);
          notifyLoaded();
        }
      }
    } else {
      // 成人男性モデルの場合はすぐに通知
      if (onLoaded) {
        console.log(`[FinalLipSyncAvatar] Model loaded, calling onLoaded for ${selectedAvatar}`);
        notifyLoaded();
      }
    }
    const morphMeshes: any[] = [];
    const oralMeshList: any[] = [];
    
    // まずボーンを探す
    scene.traverse((child: any) => {
      if (child.isBone) {
        // CC_Base_JawRootが下顎のルートボーン（少年アバターのjaw, DEF-jawも対応）
        if (child.name === 'CC_Base_JawRoot' || child.name === 'jaw' || child.name === 'DEF-jaw' || child.name === 'jaw_master') {
          jawBone.current = child;
          jawBoneOriginalRotation.current = child.rotation.clone();
        } else if (child.name === 'CC_Base_Teeth01' || child.name === 'DEF-teethT' || child.name === 'teethT') {
          teeth01Bone.current = child;
          const restPose = LOWER_TEETH_REST_POSE[selectedAvatar];
          if (restPose) {
            child.position.set(0, restPose.y, restPose.z);
            child.rotation.set(restPose.rotX, 0, 0);
            child.updateMatrixWorld(true);
          }
        } else if (child.name === 'CC_Base_Teeth02') {
          // CC_Base_Teeth02を優先的に使用
          teeth02Bone.current = child;
          lowerTeethBone.current = child;  // 下の歯ボーンとして記録
          const restPose = LOWER_TEETH_REST_POSE[selectedAvatar];
          if (restPose) {
            child.position.set(0, restPose.y, restPose.z);
            child.rotation.set(restPose.rotX, 0, 0);
            child.updateMatrixWorld(true);
          }
        } else if ((child.name === 'DEF-teethB' || child.name === 'teethB') && !teeth02Bone.current) {
          // CC_Base_Teeth02が見つからない場合のフォールバック
          teeth02Bone.current = child;
          lowerTeethBone.current = child;
          const restPose = LOWER_TEETH_REST_POSE[selectedAvatar];
          if (restPose) {
            child.position.set(0, restPose.y, restPose.z);
            child.rotation.set(restPose.rotX, 0, 0);
            child.updateMatrixWorld(true);
          }
        } else if (child.name === 'CC_Base_Tongue01') {
          tongue01Bone.current = child;
          tongueBonesOriginal.current['tongue01'] = {
            position: child.position.clone(),
            rotation: child.rotation.clone()
          };
        } else if (child.name === 'CC_Base_Tongue02') {
          tongue02Bone.current = child;
          tongueBonesOriginal.current['tongue02'] = {
            position: child.position.clone(),
            rotation: child.rotation.clone()
          };
        } else if (child.name === 'CC_Base_Tongue03') {
          tongue03Bone.current = child;
          tongueBonesOriginal.current['tongue03'] = {
            position: child.position.clone(),
            rotation: child.rotation.clone()
          };
        }
      }
    });
    
    // 女性アバターの角膜メッシュを完全に削除
    const corneaMeshesToRemove: any[] = [];
    scene.traverse((child: any) => {
      if (child.isMesh || child.isSkinnedMesh) {
        // 女性アバターの角膜メッシュを検出して削除リストに追加
        if (child.material && (selectedAvatar === 'female' || modelPath.includes('Mother') || modelPath.includes('mother'))) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          const hasCorneaMaterial = materials.some((mat: THREE.Material) => {
            const matName = (mat?.name || '').toLowerCase();
            return matName.includes('cornea');
          });
          if (hasCorneaMaterial) {
            console.log('[FinalLipSyncAvatar] Found cornea mesh to remove in traverse:', child.name);
            corneaMeshesToRemove.push(child);
            return; // このメッシュの処理をスキップ
          }
        }

        child.frustumCulled = true;
        // 陰影を減らすため、キャストシャドウとレシーブシャドウを無効化
        child.castShadow = false;
        child.receiveShadow = false;

        // 特定のメッシュを識別（名前とマテリアルで判定）
        // 少年アバター用の下の歯メッシュ (NUG_Base_Teeth_2)
        if (child.name === 'NUG_Base_Teeth_2' || 
            (child.name.includes('NUG') && child.name.includes('Teeth') && child.name.includes('2'))) {
          nugLowerTeethMesh.current = child;
          // ワールド座標での位置を取得
          const worldPos = new THREE.Vector3();
          child.getWorldPosition(worldPos);
          lowerTeethOriginalY.current = worldPos.y;
        }
        // 成人モデル用の下の歯メッシュ
        else if (child.name === 'CC_Base_Body_9' || 
            (child.material && child.material.name && child.material.name.includes('Std_Lower_Teeth'))) {
          lowerTeethMesh.current = child;
          // ワールド座標での位置を取得
          const worldPos = new THREE.Vector3();
          child.getWorldPosition(worldPos);
          lowerTeethOriginalY.current = worldPos.y;
          const restPose = LOWER_TEETH_REST_POSE[selectedAvatar];
          if (restPose && !child.isSkinnedMesh) {
            child.position.y = worldPos.y + restPose.y;
            child.position.z = restPose.z;
            child.rotation.x = restPose.rotX;
            child.updateMatrixWorld(true);
            const updatedPos = new THREE.Vector3();
            child.getWorldPosition(updatedPos);
            lowerTeethOriginalY.current = updatedPos.y - restPose.y;
          }
        } else if (child.name === 'CC_Base_Body_8' ||
            (child.material && child.material.name && child.material.name.includes('Std_Upper_Teeth'))) {
          upperTeethMesh.current = child;
        } else if (child.name === 'CC_Base_Body_1' ||
                   (child.material && child.material.name && child.material.name.includes('Std_Tongue'))) {
          tongueMesh.current = child;
          tongueBonesOriginal.current['tongueMesh'] = {
            position: child.position.clone(),
            rotation: child.rotation.clone()
          };
          if (isBoyAvatar) {
            console.log('舌メッシュ発見:', child.name);
            console.log('  元の位置:', child.position);
          }
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

    // 角膜メッシュを削除
    corneaMeshesToRemove.forEach((mesh) => {
      if (mesh.parent) {
        mesh.parent.remove(mesh);
        console.log('[FinalLipSyncAvatar] Removed cornea mesh from scene:', mesh.name);
      }
    });
    if (corneaMeshesToRemove.length > 0) {
      console.log(`[FinalLipSyncAvatar] Total cornea meshes removed: ${corneaMeshesToRemove.length}`);
    }

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
    
    // 下の歯メッシュを初期位置にリセット - 無効化（元の位置を保持）
    /*
    if (lowerTeethMesh.current) {
      lowerTeethMesh.current.position.set(0, 0, 0);
      lowerTeethMesh.current.rotation.set(0, 0, 0);
    }
    */

    setMorphTargets(morphMeshes);
    setOralMeshes(oralMeshList);
    })(); // async即時実行関数の終了
  }, [scene, onLoaded, modelPath, selectedAvatar, isBoyImprovedModel, applyLowerTeethRestPose]); // 依存配列を適切に設定
  
  useFrame((state, delta) => {
    if (!group.current) return;

    if (!isSpeaking) {
      anticipationReady.current = false;
      if (Object.keys(anticipationMorphs.current).length > 0) {
        anticipationMorphs.current = {};
      }
    }

    // 少年アバターの髪と眉毛の環境マップを強制的に削除（マット仕上げを維持）
    if (selectedAvatar === 'boy' && scene) {
      scene.traverse((child: any) => {
        if (child.isMesh) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat: any) => {
            const matName = mat?.name?.toLowerCase() || '';
            if (matName === 'hair_transparency' || matName === 'eyebrow_transparency') {
              // 環境マップを削除
              if (mat.envMap !== null) {
                mat.envMap = null;
              }
              // マット仕上げを強制
              mat.roughness = 1.0;
              mat.metalness = 0.0;
              // MeshPhysicalMaterialの場合の追加設定
              if (mat.clearcoat !== undefined) {
                mat.clearcoat = 0;
                mat.clearcoatRoughness = 1;
              }
              if (mat.sheen !== undefined) {
                mat.sheen = 0;
              }
              if (mat.reflectivity !== undefined) {
                mat.reflectivity = 0;
              }
              // 環境マップ強度を0に
              if (mat.envMapIntensity !== undefined) {
                mat.envMapIntensity = 0.0;
              }
              // 一度だけログ出力
              if (animationTime.current < 0.1) {
                console.log(`[useFrame] Enforcing matte for ${matName}: roughness=${mat.roughness}, metalness=${mat.metalness}, type=${mat.type}`);
              }
            }
          });
        }
      });
    }

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
      // 少年改アバターは瞬きを少し長めに（0.2秒）
      const blinkDuration = selectedAvatar === 'boy_improved' ? 0.2 : 0.15;
      const blinkProgress = blinkTimer.current / blinkDuration;
      
      if (blinkProgress < 1) {
        // より自然な瞬きカーブ
        if (selectedAvatar === 'boy_improved') {
          // 少年改アバター用の改善されたカーブ
          // 最初は早く閉じて、ゆっくり開く
          if (blinkProgress < 0.4) {
            // 閉じる段階（早め）
            blinkValue = Math.sin((blinkProgress / 0.4) * Math.PI * 0.5) * 1.0;
          } else {
            // 開く段階（ゆっくり）
            blinkValue = Math.cos(((blinkProgress - 0.4) / 0.6) * Math.PI * 0.5) * 1.0;
          }
          
          // デバッグ：瞬きの値をログ出力（10秒に1回）
          const currentTime = Date.now();
          if (currentTime - lastDebugTime.current > 10000 && blinkValue > 0.5) {
            // console.log(`[${selectedAvatar}] Blinking - Progress: ${blinkProgress.toFixed(2)}, Value: ${blinkValue.toFixed(2)}`);
            lastDebugTime.current = currentTime;
          }
        } else {
          // 他のアバター
          blinkValue = Math.sin(blinkProgress * Math.PI);
        }
      } else {
        isBlinking.current = false;
      }
    }
    
    // 感情に基づく微表情（マイクロエクスプレッション）
    if (isSpeaking) {
      if (selectedAvatar === 'boy_improved') {
        // 少年改アバターは話している時に自然な表情変化
        currentEmotion.current = 'friendly';
        
        // より繊細な微表情変化
        const microExpression = Math.sin(microExpressionTimer.current * 2) * 0.02;
        emotionMorphValues.current['A01_Brow_Inner_Up'] = microExpression;
        emotionMorphValues.current['A38_Mouth_Smile_Left'] = Math.max(0, microExpression * 0.5);
        emotionMorphValues.current['A39_Mouth_Smile_Right'] = Math.max(0, microExpression * 0.5);
        
        // ランダムな微細な動き（自然さを追加）
        if (Math.random() < 0.01) {
          emotionMorphValues.current['A21_Cheek_Squint_Left'] = 0.05;
          emotionMorphValues.current['A22_Cheek_Squint_Right'] = 0.05;
        }
      } else {
        // 他のアバターは中立的な表情
        currentEmotion.current = 'neutral';
        
        // 微細な表情変化（リアリティ向上）
        const microExpression = Math.sin(microExpressionTimer.current * 2) * 0.03;
        emotionMorphValues.current['A01_Brow_Inner_Up'] = microExpression;
      }
    } else {
      // 話していない時
      if (selectedAvatar === 'boy_improved') {
        // 少年改アバターはより表情豊か
        const idleTime = animationTime.current % 10;
        if (idleTime < 3) {
          currentEmotion.current = 'neutral';
        } else if (idleTime < 6) {
          currentEmotion.current = 'curious';
        } else {
          currentEmotion.current = 'friendly';
        }
      } else {
        currentEmotion.current = 'neutral';
      }
    }
    
    // 感情モーフの適用（アバター別のプリセットを使用）
    let emotionPreset = {};
    if (selectedAvatar === 'boy_improved') {
      // 少年改アバターは専用の感情プリセットを使用
      emotionPreset = BoyImprovedEmotionPresets[currentEmotion.current] || 
                      BoyImprovedEmotionPresets['neutral'] || {};
    } else {
      // その他のアバターは標準プリセットを使用
      emotionPreset = EmotionPresets[currentEmotion.current] || {};
    }
    
    Object.entries(emotionPreset).forEach(([morphName, targetValue]) => {
      const currentValue = emotionMorphValues.current[morphName] || 0;
      const target = targetValue as number;
      emotionMorphValues.current[morphName] = currentValue + (target - currentValue) * 0.1;
    });
    
    // 単語が変わったかチェック（先行動作のため）
    if (currentWord !== previousWord.current) {
      previousWord.current = currentWord;
      wordChangeTime.current = animationTime.current;
      
      // 次の音素の先行準備（予測動作）
      if (currentWord && currentWord.length > 0) {
        const nextChar = currentWord[0];
        const nextMapping = getPhonemeMapping(nextChar, selectedAvatar);
        
        // 先行動作として口の形を準備（50%の強度で）
        if (anticipationReady.current) {
          Object.entries(nextMapping).forEach(([morphName, value]) => {
            anticipationMorphs.current[morphName] = value * 0.5;
          });
        } else {
          anticipationMorphs.current = {};
        }
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
      
      // 即座に反応（スムージング最小化）
      smoothedAudioLevel.current = rms;
      
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
    let phonemeContext: 'english' | 'japanese' | 'other' = 'other';
    if (isSpeaking) {
      // 実際の音声レベルを使用（スムージング済み）
      const realAudioLevel = smoothedAudioLevel.current || audioLevel || 0.3;
      const baseLevel = Math.min(realAudioLevel * 2, 1.0); // 音声レベルを増幅
      if (realAudioLevel > 0.06) {
        anticipationReady.current = true;
      }
      
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
        // Check if current word is an English phoneme (all caps, 1-2 letters)
        const isPhoneme = /^[A-Z]{1,2}$/.test(currentWord);
        const isEnglishText = /^[a-zA-Z\s\d.,!?';:\-()]+$/.test(currentWord);
        const isEnglishContext = isPhoneme || (isEnglishText && currentWord.length > 1);

        let currentMapping: { [key: string]: number } = {};
        let currentPhonemeLabel: string | null = null;

        if (isPhoneme) {
          // Direct phoneme passed from demo hook
          currentPhonemeLabel = currentWord;
          currentMapping = getPhonemeMapping(currentWord, selectedAvatar);
        } else if (isEnglishText && currentWord.length > 1) {
          // English word - convert to phonemes
          const phonemes = textToPhonemes(currentWord);
          if (phonemes.length > 0) {
            // Use the first phoneme for now (could be improved with timing)
            const firstPhoneme = phonemes[0];
            currentPhonemeLabel = firstPhoneme.phoneme;
            currentMapping = getPhonemeMapping(firstPhoneme.phoneme, selectedAvatar);
          }
        } else {
          // Single character or Japanese
          const currentChar = currentWord[0];
          currentPhonemeLabel = currentChar;
          currentMapping = getPhonemeMapping(currentChar, selectedAvatar);
        }

        if (isEnglishContext) {
          const visemeKey = currentPhonemeLabel ? phonemeToViseme(currentPhonemeLabel) : 'neutral';
          const visemeProfile = EnglishVisemeProfiles[visemeKey] || EnglishVisemeProfiles.neutral;
          const combinedMapping: { [key: string]: number } = { ...visemeProfile };

          Object.entries(currentMapping).forEach(([morphName, value]) => {
            combinedMapping[morphName] = Math.max(combinedMapping[morphName] ?? 0, value);
          });

          currentMapping = adjustEnglishMorphs(currentPhonemeLabel, combinedMapping);
          phonemeContext = 'english';
        } else if (currentPhonemeLabel && isJapaneseCharacter(currentPhonemeLabel)) {
          const visemeKey = getJapaneseVisemeKey(currentPhonemeLabel);
          const visemeProfile = JapaneseVisemeProfiles[visemeKey] || JapaneseVisemeProfiles.neutral;
          const combinedMapping: { [key: string]: number } = { ...visemeProfile };

          Object.entries(currentMapping).forEach(([morphName, value]) => {
            combinedMapping[morphName] = Math.max(combinedMapping[morphName] ?? 0, value);
          });

          currentMapping = adjustJapaneseMorphs(currentPhonemeLabel, combinedMapping);
          phonemeContext = 'japanese';
        }

        if (!(phonemeContext === 'english' && !anticipationReady.current)) {
          // 音声レベルに完全に同期した口の動き
          Object.entries(currentMapping).forEach(([morphName, value]) => {
            const syncedValue = value * baseLevel * frequencyModifier;

            if (morphName === 'A25_Jaw_Open' || morphName === 'Move_Jaw_Down') {
              targetMorphs[morphName] = syncedValue * (0.8 + realAudioLevel * 0.4);
            } else {
              targetMorphs[morphName] = syncedValue;
            }
          });
        }

        // 次の音素への準備は削除（予備動作なし）

        if (phonemeContext === 'english' && anticipationReady.current) {
          const flapLevel = baseLevel;
          const animeJaw = flapLevel < 0.22 ? 0.05 : flapLevel < 0.45 ? 0.26 : 0.48;
          const animeMouth = animeJaw * 0.65;
          targetMorphs['A25_Jaw_Open'] = Math.min(Math.max(targetMorphs['A25_Jaw_Open'] || 0, animeJaw), 0.5);
          targetMorphs['Mouth_Open'] = Math.min(Math.max(targetMorphs['Mouth_Open'] || 0, animeMouth), 0.38);
        }

        if (anticipationReady.current || phonemeContext !== 'english') {
          const additionalOpen = realAudioLevel * 0.18;
          targetMorphs['A25_Jaw_Open'] = (targetMorphs['A25_Jaw_Open'] || 0) + additionalOpen;
          targetMorphs['Mouth_Open'] = (targetMorphs['Mouth_Open'] || 0) + additionalOpen * 0.7;
        }
        
      } else {
        // デフォルトでも音声レベルに応じて口を動かす
        targetMorphs['A25_Jaw_Open'] = 0.3 * baseLevel;
        targetMorphs['Mouth_Open'] = 0.2 * baseLevel;
      }
      
      // 音声の立ち上がり・立ち下がり検出は削除（予備動作なし）
    }

    if (anticipationReady.current && Object.keys(anticipationMorphs.current).length > 0) {
      Object.entries(anticipationMorphs.current).forEach(([morphName, value]) => {
        const anticipationWeight = phonemeContext === 'english' ? 0.3 : phonemeContext === 'japanese' ? 0.25 : 0.2;
        const weightedValue = value * anticipationWeight;
        if (weightedValue > 0) {
          targetMorphs[morphName] = Math.max(targetMorphs[morphName] || 0, weightedValue);
        }
      });
      // 予測モーフは徐々に減衰させる
      Object.keys(anticipationMorphs.current).forEach((key) => {
        anticipationMorphs.current[key] *= 0.6;
        if (anticipationMorphs.current[key] < 0.01) {
          delete anticipationMorphs.current[key];
        }
      });
    }

    // ダイレクトな値の適用（補間なし）
    Object.entries(targetMorphs).forEach(([morphName, targetValue]) => {
      // モデル別の係数を適用
      let adjustedValue = targetValue;
      if (morphName.includes('Jaw')) {
        adjustedValue *= lipSyncConfig.jawMultiplier;
      } else if (morphName.includes('Mouth') || morphName.includes('Lip')) {
        adjustedValue *= lipSyncConfig.mouthMultiplier;
      }
      
      // アバター別の最大値制限
      let maxLimit = 0.8;
      if (selectedAvatar === 'boy') {
        maxLimit = 0.5; // 少年アバターは0.5に制限
      } else if (selectedAvatar === 'boy_improved') {
        maxLimit = 0.4; // 少年改アバターはさらに控えめに0.4に制限
      }
      if (phonemeContext === 'english') {
        maxLimit = Math.min(maxLimit, 0.7);
      } else if (phonemeContext === 'japanese') {
        maxLimit = Math.min(maxLimit, 0.75);
      }
      
      // 最大値を制限（自然な動きのため）
      adjustedValue = Math.min(adjustedValue, maxLimit);
      
      // 直接値を設定（補間なし）
      const currentValue = currentMorphValues.current[morphName] || 0;
      const approachSpeed = phonemeContext === 'english' ? 0.45 : phonemeContext === 'japanese' ? 0.5 : 0.6;

      if (isSpeaking) {
        const blendedValue = currentValue + (adjustedValue - currentValue) * approachSpeed;
        currentMorphValues.current[morphName] = blendedValue;
      } else {
        // 話していない時は少し補間
        const blendedValue = currentValue + (adjustedValue - currentValue) * 0.75;
        currentMorphValues.current[morphName] = blendedValue;
      }
    });
    
    // 使用されなくなったモーフを徐々に0に戻す
    Object.keys(currentMorphValues.current).forEach(morphName => {
      if (!targetMorphs[morphName]) {
        const decayFactor = phonemeContext === 'english' ? 0.7 : phonemeContext === 'japanese' ? 0.75 : 0.82;
        currentMorphValues.current[morphName] *= decayFactor;
        if (currentMorphValues.current[morphName] < 0.01) {
          delete currentMorphValues.current[morphName];
        }
      }
    });
    
    // 先行動作は使用しない
    
    // 頭の微細な動き（自然な呼吸と体の揺れ）
    if (group.current) {
      // 左右の首振り（ゆっくり）
      group.current.rotation.y = Math.sin(animationTime.current * 0.3) * 0.005;  // 控えめに
      // 上下の頷き（呼吸のリズム）
      group.current.rotation.x = Math.sin(animationTime.current * 0.5) * 0.003;  // 控えめに
      // 上下の位置移動（呼吸による体の上下）
      group.current.position.y = Math.sin(animationTime.current * 0.8) * 0.002;  // 控えめに
    }
    
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
    
    // 下の歯と歯茎を下唇の動きと連動させる（改善版）
    // CC_Base_Teeth01とCC_Base_Teeth02が下の歯のボーンかチェック
    if (LOWER_TEETH_REST_POSE[selectedAvatar]) {
      applyLowerTeethRestPose();
    } else {
      if (teeth01Bone.current) {
        if (isSpeaking) {
          const lowerLipLeft = currentMorphValues.current['A46_Mouth_Lower_Down_Left'] || 0;
          const lowerLipRight = currentMorphValues.current['A47_Mouth_Lower_Down_Right'] || 0;
          const jawOpen = currentMorphValues.current['A25_Jaw_Open'] || currentMorphValues.current['Move_Jaw_Down'] || 0;
          const mouthOpen = currentMorphValues.current['Mouth_Open'] || 0;
          const mouthBottomLipDown = currentMorphValues.current['Mouth_Bottom_Lip_Down'] || 0;

          const combinedLipValue = Math.max(
            (lowerLipLeft + lowerLipRight) / 2,
            mouthBottomLipDown
          );

          const teethMovementY = -(combinedLipValue * 0.015 + jawOpen * 0.008 + mouthOpen * 0.005);
          const teethRotationX = -(combinedLipValue * 0.4 + jawOpen * 0.3 + mouthOpen * 0.2);

          const lerpSpeed = 1.0;
          teeth01Bone.current.position.y += (teethMovementY - teeth01Bone.current.position.y) * lerpSpeed;
          teeth01Bone.current.rotation.x += (teethRotationX - teeth01Bone.current.rotation.x) * lerpSpeed;
          teeth01Bone.current.position.z = -jawOpen * 0.002;
          teeth01Bone.current.updateMatrixWorld(true);
        } else {
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
          const lowerLipLeft = currentMorphValues.current['A46_Mouth_Lower_Down_Left'] || 0;
          const lowerLipRight = currentMorphValues.current['A47_Mouth_Lower_Down_Right'] || 0;
          const jawOpen = currentMorphValues.current['A25_Jaw_Open'] || currentMorphValues.current['Move_Jaw_Down'] || 0;
          const mouthOpen = currentMorphValues.current['Mouth_Open'] || 0;
          const mouthBottomLipDown = currentMorphValues.current['Mouth_Bottom_Lip_Down'] || 0;

          const combinedLipValue = Math.max(
            (lowerLipLeft + lowerLipRight) / 2,
            mouthBottomLipDown
          );

          const teethMovementY = -(combinedLipValue * 0.015 + jawOpen * 0.008 + mouthOpen * 0.005);
          const teethRotationX = -(combinedLipValue * 0.4 + jawOpen * 0.3 + mouthOpen * 0.2);

          const lerpSpeed = 1.0;
          teeth02Bone.current.position.y += (teethMovementY - teeth02Bone.current.position.y) * lerpSpeed;
          teeth02Bone.current.rotation.x += (teethRotationX - teeth02Bone.current.rotation.x) * lerpSpeed;
          teeth02Bone.current.position.z = -jawOpen * 0.002;
          teeth02Bone.current.updateMatrixWorld(true);
        } else {
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
    }
    
    // 下の歯メッシュ自体も制御（SkinnedMeshの場合、モーフターゲットで動く） - 一時的に停止
    /*
    if (lowerTeethMesh.current && lowerTeethMesh.current.morphTargetInfluences) {
      // このメッシュ自体のモーフターゲットも適用する
      const influences = lowerTeethMesh.current.morphTargetInfluences;
      if (lowerTeethMesh.current.morphTargetDictionary) {
        const jawOpenIndex = lowerTeethMesh.current.morphTargetDictionary['A25_Jaw_Open'];
        if (jawOpenIndex !== undefined) {
          if (isSpeaking) {
            const jawOpenValue = currentMorphValues.current['A25_Jaw_Open'] || 0;
            influences[jawOpenIndex] = jawOpenValue;
            
          } else {
            influences[jawOpenIndex] = 0;
          }
        }
      }
    } else if (lowerTeethMesh.current && !lowerTeethMesh.current.isSkinnedMesh) {
      // SkinnedMeshでない場合は直接位置を制御（改善版）
      if (isSpeaking) {
        const jawOpenValue = currentMorphValues.current['A25_Jaw_Open'] || currentMorphValues.current['Move_Jaw_Down'] || 0;
        const mouthOpenValue = currentMorphValues.current['Mouth_Open'] || 0;
        const lowerLipLeft = currentMorphValues.current['A46_Mouth_Lower_Down_Left'] || 0;
        const lowerLipRight = currentMorphValues.current['A47_Mouth_Lower_Down_Right'] || 0;
        const mouthBottomLipDown = currentMorphValues.current['Mouth_Bottom_Lip_Down'] || 0;
        
        // 下唇の動きを優先的に追従
        const lipMovement = Math.max(
          (lowerLipLeft + lowerLipRight) / 2,
          mouthBottomLipDown
        );
        const combinedValue = Math.max(jawOpenValue * 0.7, mouthOpenValue * 0.5, lipMovement);
        
        // 下の歯を下唇に強く連動させる
        const targetY = -(lipMovement * 0.08 + combinedValue * 0.04);
        const targetRotX = -(lipMovement * 0.5 + combinedValue * 0.3);
        const targetZ = -(combinedValue * 0.015);
        
        // 直接適用で動かす
        const lerpSpeed = 1.0;
        lowerTeethMesh.current.position.y += (targetY - lowerTeethMesh.current.position.y) * lerpSpeed;
        lowerTeethMesh.current.rotation.x += (targetRotX - lowerTeethMesh.current.rotation.x) * lerpSpeed;
        lowerTeethMesh.current.position.z += (targetZ - lowerTeethMesh.current.position.z) * lerpSpeed;
        
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
    */
    
    // 女性アバター用の下の歯制御（固定位置）
    if ((teeth02Bone.current || nugLowerTeethMesh.current) && selectedAvatar === 'female') {
      const fixedOffsetY = -0.6; // 下に固定

      if (teeth02Bone.current) {
        teeth02Bone.current.position.y = fixedOffsetY;
        teeth02Bone.current.rotation.x = 0;
        teeth02Bone.current.position.z = 0;
        teeth02Bone.current.updateMatrix();
        teeth02Bone.current.updateMatrixWorld(true);
      }

      if (nugLowerTeethMesh.current) {
        nugLowerTeethMesh.current.position.y = lowerTeethOriginalY.current + fixedOffsetY;
        nugLowerTeethMesh.current.rotation.x = 0;
        nugLowerTeethMesh.current.position.z = 0;
        nugLowerTeethMesh.current.updateMatrix();
        nugLowerTeethMesh.current.updateMatrixWorld(true);
      }
    }

    // 少年アバター用の下の歯制御
    // NUG_Base_Teeth_2メッシュとCC_Base_Teeth02ボーンの両方を制御
    if ((teeth02Bone.current || nugLowerTeethMesh.current) && (selectedAvatar === 'boy' || selectedAvatar === 'boy_improved')) {
      if (isSpeaking) {
        const jawOpenValue = currentMorphValues.current['A25_Jaw_Open'] || currentMorphValues.current['Move_Jaw_Down'] || 0;
        const mouthOpenValue = currentMorphValues.current['Mouth_Open'] || 0;
        const lowerLipLeft = currentMorphValues.current['A46_Mouth_Lower_Down_Left'] || 0;
        const lowerLipRight = currentMorphValues.current['A47_Mouth_Lower_Down_Right'] || 0;
        const mouthBottomLipDown = currentMorphValues.current['Mouth_Bottom_Lip_Down'] || 0;
        
        // 下唇の動きを最優先で追従
        const lowerLipAvg = Math.max(
          (lowerLipLeft + lowerLipRight) / 2,
          mouthBottomLipDown
        );
        
        // 下唇の動きを反映した計算（唇自体の動きは通常のまま）
        const lipFactor = lowerLipAvg * 1.0; // 唇の動きは強調しない
        const jawFactor = jawOpenValue * 0.6;
        const mouthFactor = mouthOpenValue * 0.4;
        const combinedValue = Math.max(lipFactor, jawFactor, mouthFactor);
        
        // 少年・女性アバター用の下の歯制御
        // 女性アバターは位置を調整（より控えめに）
        const yMultiplier = selectedAvatar === 'female' ? 0.05 : 0.3;
        const yAddMultiplier = selectedAvatar === 'female' ? 0.03 : 0.2;
        const rotMultiplier = selectedAvatar === 'female' ? 0.15 : 0.8;
        const rotAddMultiplier = selectedAvatar === 'female' ? 0.1 : 0.5;

        // Y軸: 下唇に連動して下の歯を下に移動（唇と重ならないように）
        const targetY = -(lowerLipAvg * yMultiplier + combinedValue * yAddMultiplier);

        // X軸の回転: 自然な傾き
        const targetRotX = -(lowerLipAvg * rotMultiplier + combinedValue * rotAddMultiplier);

        // Z軸: 後ろに移動
        const targetZ = -(combinedValue * 0.05);
        
        // CC_Base_Teeth02ボーンを制御
        if (teeth02Bone.current) {
          teeth02Bone.current.position.y = targetY;
          teeth02Bone.current.rotation.x = targetRotX;
          teeth02Bone.current.position.z = targetZ;
          
          // ボーンの変更を強制的に適用
          teeth02Bone.current.updateMatrix();
          teeth02Bone.current.updateMatrixWorld(true);
        }
        
        // NUG_Base_Teeth_2メッシュも直接制御（SkinnedMeshの場合）
        if (nugLowerTeethMesh.current) {
          // メッシュ自体も動かす
          nugLowerTeethMesh.current.position.y = lowerTeethOriginalY.current + targetY;
          nugLowerTeethMesh.current.rotation.x = targetRotX;
          nugLowerTeethMesh.current.position.z = targetZ;
          
          // メッシュの更新
          nugLowerTeethMesh.current.updateMatrix();
          nugLowerTeethMesh.current.updateMatrixWorld(true);
        }
        
        // デバッグ出力（少年アバターのみ）- 設定後の値を確認
        const now = Date.now();
        if (now - lastDebugTime.current > 10000) { // 10秒ごとに1回だけ出力
          lastDebugTime.current = now;
          if (teeth02Bone.current) {
            // console.log('ボーン制御 Y:', teeth02Bone.current.position.y.toFixed(3));
          }
          if (nugLowerTeethMesh.current) {
            // console.log('メッシュ制御 Y:', nugLowerTeethMesh.current.position.y.toFixed(3));
          }
        }

      } else {
        // 話していない時は元の位置にスムーズに戻す（ボーン制御）
        const lerpSpeed = 0.15; // 補間速度

        if (teeth02Bone.current) {
          if (Math.abs(teeth02Bone.current.position.y) > 0.0001) {
            teeth02Bone.current.position.y *= (1 - lerpSpeed);
          } else {
            teeth02Bone.current.position.y = 0;
          }

          if (Math.abs(teeth02Bone.current.rotation.x) > 0.0001) {
            teeth02Bone.current.rotation.x *= (1 - lerpSpeed);
          } else {
            teeth02Bone.current.rotation.x = 0;
          }

          if (Math.abs(teeth02Bone.current.position.z) > 0.0001) {
            teeth02Bone.current.position.z *= (1 - lerpSpeed);
          } else {
            teeth02Bone.current.position.z = 0;
          }

          teeth02Bone.current.updateMatrixWorld(true);
        }
      }
    }
    
    // モーフターゲットの適用（口腔内メッシュも含む）
    morphTargets.forEach((mesh) => {
      if (!mesh.morphTargetInfluences) return;
      
      const influences = mesh.morphTargetInfluences;
      const isOralMesh = oralMeshes.includes(mesh);
      // selectedAvatarから成人男性改アバターかを判定
      const isAdultImproved = selectedAvatar === 'adult_improved';
      
      if (mesh.morphTargetDictionary && Object.keys(mesh.morphTargetDictionary).length > 0) {
        const applyMorph = (name: string, value: number) => {
          const index = mesh.morphTargetDictionary[name];
          if (index !== undefined && index < influences.length) {
            // 成人男性改アバターの場合、モーフ強度を調整
            let adjustedValue = value;
            if (isAdultImproved) {
              // Viseme（音素）を強化
              if (name.startsWith('V_')) {
                adjustedValue = value * 1.3;
              }
              // ARKitブレンドシェイプの調整
              else if (name.startsWith('A')) {
                adjustedValue = value * 1.2;
              }
              // 口の動きを強調
              else if (name.includes('Mouth') || name.includes('Lip')) {
                adjustedValue = value * 1.25;
              }
            }
            
            // アバター別の最大値制限
            let maxLimit = 0.8;
            if (selectedAvatar === 'boy') {
              maxLimit = 0.5; // 少年アバターは0.5に制限
            } else if (selectedAvatar === 'boy_improved') {
              maxLimit = 0.4; // 少年改アバターはさらに控えめに0.4に制限
            } else if (selectedAvatar === 'female') {
              maxLimit = 0.88; // 女性アバターは男性Aと同程度のナチュラルな閉眼に制限
            }
            
            // 最大値を制限（自然な動きのため）
            adjustedValue = Math.min(adjustedValue, maxLimit);
            
            // 口腔内メッシュの場合、顎の動きを強調
            if (isOralMesh && name === 'A25_Jaw_Open') {
              influences[index] = Math.min(adjustedValue * 1.2, maxLimit); // 口腔内も同じ制限
            } else {
              influences[index] = adjustedValue;
            }
          }
        };
        
        // 瞬き（左右対称に、自然なカーブ）
        if (selectedAvatar === 'boy') {
          // 少年アバターは異なるモーフターゲット名を使用
          applyMorph('Eye_Blink_L', blinkValue);
          applyMorph('Eye_Blink_R', blinkValue);
          applyMorph('Eyes_Blink', blinkValue * 0.5); // 補助的な瞬き
        } else if (selectedAvatar === 'boy_improved') {
          // 少年改アバターは複数のモーフターゲットを組み合わせて完全な瞬きを実現
          // ARKit準拠のモーフターゲット（メイン）
          applyMorph('A14_Eye_Blink_Left', blinkValue * 1.2);  // 強化
          applyMorph('A15_Eye_Blink_Right', blinkValue * 1.2);
          
          // 追加の瞬きモーフターゲット（JSONファイルから確認済み）
          applyMorph('Eye_Blink_L', blinkValue);  // フル強度
          applyMorph('Eye_Blink_R', blinkValue);   // フル強度
          applyMorph('Eyes_Blink', blinkValue * 0.8);    // 統合瞬き
          
          // 目の周辺の詳細な制御（EO系モーフターゲット）
          applyMorph('EO Upper Depth L', blinkValue * 0.3);
          applyMorph('EO Upper Depth R', blinkValue * 0.3);
          applyMorph('EO Lower Depth L', blinkValue * 0.3);
          applyMorph('EO Lower Depth R', blinkValue * 0.3);
          
          // 瞬きの際の頬と眉の動き（より自然に）
          applyMorph('A21_Cheek_Squint_Left', blinkValue * 0.25);
          applyMorph('A22_Cheek_Squint_Right', blinkValue * 0.25);
          applyMorph('Cheek_Raise_L', blinkValue * 0.15);
          applyMorph('Cheek_Raise_R', blinkValue * 0.15);
          
          // 眉も少し下がる
          applyMorph('Brow_Drop_Left', blinkValue * 0.1);
          applyMorph('Brow_Drop_Right', blinkValue * 0.1);
          
          // デバッグ：適用されたモーフターゲットを確認（一度だけ）
          if (blinkValue > 0.9 && !(window as any).blinkDebugLogged) {
            /* console.log(`[boy_improved] Applying blink morphs:
              A14/A15: ${(blinkValue * 1.2).toFixed(2)}
              Eye_Blink_L/R: ${blinkValue.toFixed(2)}
              Eyes_Blink: ${(blinkValue * 0.8).toFixed(2)}
              EO morphs: ${(blinkValue * 0.3).toFixed(2)}
              Cheek/Brow: ${(blinkValue * 0.25).toFixed(2)} / ${(blinkValue * 0.1).toFixed(2)}`); */
            (window as any).blinkDebugLogged = true;
          }
        } else if (selectedAvatar === 'female') {
          // 女性アバター: 瞬きの強度を0.95に制限
          applyMorph('A14_Eye_Blink_Left', blinkValue * 0.95);
          applyMorph('A15_Eye_Blink_Right', blinkValue * 0.95);
          applyMorph('Eye_Blink_L', blinkValue * 0.95);
          applyMorph('Eye_Blink_R', blinkValue * 0.95);
        } else {
          // 成人アバター（男性A）: 瞬きの強度1.0
          applyMorph('A14_Eye_Blink_Left', blinkValue);
          applyMorph('A15_Eye_Blink_Right', blinkValue);
        }
        
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
            applyMorph('A46_Mouth_Upper_Up_Left', combinedValue * 0.25); // ARKit追加
            applyMorph('A47_Mouth_Upper_Up_Right', combinedValue * 0.25); // ARKit追加
            applyMorph('Mouth_Top_Lip_Up', combinedValue * 0.2);
            
            // 下唇の動き（控えめに）
            applyMorph('A46_Mouth_Lower_Down_Left', combinedValue * 0.3);
            applyMorph('A47_Mouth_Lower_Down_Right', combinedValue * 0.3);
            applyMorph('A48_Mouth_Lower_Down_Left', combinedValue * 0.25); // ARKit追加
            applyMorph('A49_Mouth_Lower_Down_Right', combinedValue * 0.25); // ARKit追加
            
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
            
            // 成人男性改アバター専用の追加モーフ
            if (isAdultImproved) {
              // すべてのVisemeを確認して適用
              const visemes = ['V_Open', 'V_Explosive', 'V_Dental_Lip', 'V_Tight_O', 
                              'V_Tight', 'V_Wide', 'V_Affricate', 'V_Lip_Open'];
              visemes.forEach(viseme => {
                const value = currentMorphValues.current[viseme] || 0;
                if (value > 0.01) {
                  applyMorph(viseme, value * 1.2);
                }
              });
              
              // 詳細な口の形状
              const mouthMorphs = ['Mouth_Blow',
                                  'Mouth_Widen', 'Mouth_Widen_Sides', 'Mouth_Plosive',
                                  'Mouth_Lips_Tight', 'Mouth_Lips_Tuck', 'Mouth_Lips_Part',
                                  'Mouth_Bottom_Lip_Under', 'Mouth_Top_Lip_Under',
                                  'Mouth_Lips_Jaw_Adjust', 'Mouth_Skewer'];
              mouthMorphs.forEach(morph => {
                const value = currentMorphValues.current[morph] || 0;
                if (value > 0.01) {
                  applyMorph(morph, value);
                }
              });
              
              // 微笑み要素（控えめ）
              applyMorph('Mouth_Smile', 0.08);
              applyMorph('Mouth_Smile_L', 0.06);
              applyMorph('Mouth_Smile_R', 0.06);
              applyMorph('A38_Mouth_Smile_Left', 0.05);
              applyMorph('A39_Mouth_Smile_Right', 0.05);
            }
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

function FinalLipSyncAvatarComponent({
  isSpeaking = false,
  audioLevel = 0,
  currentWord = '',
  currentPhoneme: _currentPhoneme = '',
  speechProgress: _speechProgress = 0,
  showDebug = false,
  audioData,
  audioFrequency = 0,
  modelPath = '/models/adult-male.glb',
  selectedAvatar: propSelectedAvatar,
  onLoaded
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
  selectedAvatar?: string;
  onLoaded?: () => void;
}) {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [currentModelPath, setCurrentModelPath] = useState(modelPath);
  
  // モデルパスまたはアバタータイプが変更されたらローディング状態をリセット
  useEffect(() => {
    if (modelPath !== currentModelPath) {
      console.log('[FinalLipSyncAvatar] Model path changed:');
      console.log('- Previous:', currentModelPath);
      console.log('- New:', modelPath);
      console.log('- Is URL:', modelPath.startsWith('http'));
      setIsModelLoaded(false);
      setCurrentModelPath(modelPath);
    }
  }, [modelPath, currentModelPath]);
  
  // selectedAvatarが変更されたときも再ロード（削除 - keyプロップで処理される）
  // このuseEffectは不要で点滅の原因になる
  
  const handleModelLoaded = () => {
    setIsModelLoaded(true);
    if (onLoaded) {
      onLoaded();
    }
  };

  // モデルタイプの判定（URLエンコードされた文字列も考慮）
  const decodedModelPath = decodeURIComponent(modelPath);

  const isBoyImprovedModel =
    decodedModelPath.includes('少年改アバター') ||
    decodedModelPath.includes('少年改') ||
    decodedModelPath.includes('Baby main') ||
    decodedModelPath.includes('baby') ||
    modelPath.includes('Baby%20main') ||
    modelPath.includes('boy-improved-avatar') ||
    modelPath.includes('ClassicMan-3のコピー');
  const isBoyModel = !isBoyImprovedModel && (decodedModelPath.includes('少年アバター') || modelPath.includes('ClassicMan') || modelPath.includes('BOY_4'));
  const isAdultImprovedModel = decodedModelPath.includes('成人男性改');
  const isChildModel = decodedModelPath.includes('Baby main') || decodedModelPath.includes('baby') || modelPath.includes('Baby%20main');
  const pathSuggestsFemale =
    modelPath.includes('Hayden') ||
    modelPath.includes('female') ||
    modelPath.includes('Mother') ||
    modelPath.includes('mother') ||
    decodedModelPath.includes('Hayden') ||
    decodedModelPath.includes('Mother');

  // selectedAvatarの判定（propSelectedAvatarを優先）
  const selectedAvatar = propSelectedAvatar || (
    isAdultImprovedModel ? 'adult_improved'
    : isBoyImprovedModel ? 'boy_improved'
    : pathSuggestsFemale ? 'female'
    : isBoyModel ? 'boy'
    : 'adult'
  );

  const isFemaleModel = selectedAvatar === 'female';
  
  // カメラ設定（モデルごとに調整）
  const cameraSettings = isChildModel
    ? { position: [0, 1.1, 0.25], fov: 14, target: [0, 0.9, 0] }
    : (isBoyModel || isBoyImprovedModel)
    ? { position: [0, 1.71, 0.8], fov: 27, target: [0, 1.71, 0] } // 少年用：拡大（fov 30→27）
    : isFemaleModel
    ? { position: [0, 1.49, 0.8], fov: 30, target: [0, 1.49, 0] } // 女性用：水平視点
    : { position: [0, 1.68, 0.7], fov: 28, target: [0, 1.7, 0] }; // 成人男性用
  
  // リップシンク強度設定（少年と少年改は同じ強度）
  const lipSyncIntensity = (isBoyModel || isBoyImprovedModel) ? 1.0 : 1.0;
  return (
    <div className="relative w-full h-[400px] rounded-xl overflow-hidden" style={{ 
      background: 'linear-gradient(135deg, #d4f1f4 0%, #bae6fd 50%, #d4f1f4 100%)'
    }}>
      {!isModelLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          {/* 背景の装飾的な円 */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute bottom-10 left-20 w-32 h-32 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
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
          frameloop="always"
          dpr={[1, 2]}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0,
            outputColorSpace: THREE.SRGBColorSpace,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance',
            alpha: false
          }}
          style={{ opacity: isModelLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
        >
          <WebGLContextHandler />
          {/* 陰影を減らすため、アンビエントライトを強化 */}
          <ambientLight intensity={1.2} color="#ffffff" />
          {/* 左右のメインライト */}
          <directionalLight
            position={[3, 8, 5]}
            intensity={0}
            castShadow={false}
          />
          <directionalLight
            position={[-3, 8, 5]}
            intensity={0}
            castShadow={false}
          />
          {/* 上からの均等な照明 */}
          <directionalLight position={[0, 10, 3]} intensity={0.2} />
          {/* フロントライトで顔を明るく（左） */}
          <pointLight position={[-0.7, 1.5, 4]} intensity={0.6} />
          
          <Suspense fallback={null}>
            <AvatarModel 
              key={modelPath}  // modelPathのみをkeyとして使用（安定性向上）
              isSpeaking={isSpeaking} 
              audioLevel={audioLevel}
              currentWord={currentWord}
              currentPhoneme={_currentPhoneme}
              speechProgress={_speechProgress}
              audioData={audioData}
              audioFrequency={audioFrequency}
              onLoaded={handleModelLoaded}
              modelPath={modelPath}
              selectedAvatar={selectedAvatar}
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
          
          <color attach="background" args={['#c8e6fc']} />
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

// メモ化してexport（不要な再レンダリングを防ぐ）
export default React.memo(FinalLipSyncAvatarComponent);
