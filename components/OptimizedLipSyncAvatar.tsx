'use client';

import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';

interface AvatarModelProps {
  isSpeaking: boolean;
  audioLevel?: number;
  currentWord?: string;
  currentPhoneme?: string;
  speechProgress?: number;
}

// 日本語の音素マッピング（シンプル版）
const JAPANESE_VOWELS: { [key: string]: number } = {
  'あ': 0.9, 'い': 0.3, 'う': 0.5, 'え': 0.6, 'お': 0.7,
  'ア': 0.9, 'イ': 0.3, 'ウ': 0.5, 'エ': 0.6, 'オ': 0.7,
};

function AvatarModel({ isSpeaking, audioLevel = 0, currentWord = '' }: AvatarModelProps) {
  const group = useRef<THREE.Group>(null);
  const [morphTargets, setMorphTargets] = useState<any[]>([]);
  
  // アニメーション状態
  const animationState = useRef({
    time: 0,
    blinkTimer: 0,
    nextBlinkTime: 3 + Math.random() * 3,
    isBlinking: false,
    mouthOpenTarget: 0,
    mouthOpenCurrent: 0,
    breathingPhase: 0
  });
  
  // GLBファイルを読み込む
  const { scene } = useGLTF('/models/man-grey-suit-optimized.glb');
  
  useEffect(() => {
    if (!scene) return;
    
    console.log('=== Optimized Avatar Loading ===');
    const morphMeshes: any[] = [];
    
    // シーンを走査してモーフターゲットを持つメッシュを収集
    scene.traverse((child: any) => {
      if (child.isMesh || child.isSkinnedMesh) {
        console.log(`Found mesh: ${child.name}`);
        
        // 基本的なメッシュ設定
        child.frustumCulled = true;
        child.castShadow = true;
        child.receiveShadow = true;
        
        // モーフターゲットを持つメッシュを収集
        if (child.morphTargetInfluences && child.morphTargetInfluences.length > 0) {
          console.log(`  Has ${child.morphTargetInfluences.length} morph targets`);
          
          // モーフターゲット辞書を確認
          if (child.morphTargetDictionary) {
            const names = Object.keys(child.morphTargetDictionary);
            console.log(`  Dictionary keys (sample):`, names.slice(0, 10));
          }
          
          morphMeshes.push(child);
        }
        
        // マテリアルの基本設定（透明度処理なし）
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
    
    console.log(`Found ${morphMeshes.length} meshes with morph targets`);
    setMorphTargets(morphMeshes);
  }, [scene]);
  
  // アニメーションループ
  useFrame((state, delta) => {
    if (!group.current) return;
    
    const anim = animationState.current;
    anim.time += delta;
    
    // 呼吸アニメーション
    anim.breathingPhase += delta * 0.8;
    const breathing = Math.sin(anim.breathingPhase) * 0.5 + 0.5;
    
    // 瞬きアニメーション
    anim.blinkTimer += delta;
    if (anim.blinkTimer >= anim.nextBlinkTime) {
      anim.isBlinking = true;
      anim.blinkTimer = 0;
      anim.nextBlinkTime = 2 + Math.random() * 4;
    }
    
    let blinkValue = 0;
    if (anim.isBlinking) {
      const blinkProgress = anim.blinkTimer / 0.15;
      if (blinkProgress < 1) {
        blinkValue = blinkProgress < 0.5 ? blinkProgress * 2 : 2 - blinkProgress * 2;
      } else {
        anim.isBlinking = false;
      }
    }
    
    // リップシンクターゲットの計算
    if (isSpeaking) {
      const baseLevel = audioLevel || 0.5;
      
      // 日本語の音素から口の開き具合を決定
      if (currentWord && currentWord.length > 0) {
        const firstChar = currentWord[0];
        const vowelOpen = JAPANESE_VOWELS[firstChar] || 0.5;
        anim.mouthOpenTarget = vowelOpen * baseLevel;
      } else {
        // デフォルトの口の動き
        anim.mouthOpenTarget = baseLevel * 0.7;
      }
      
      // 振動を追加
      anim.mouthOpenTarget += Math.sin(anim.time * 10) * baseLevel * 0.2;
    } else {
      anim.mouthOpenTarget = 0;
    }
    
    // スムーズな補間
    const lerpSpeed = 0.15;
    anim.mouthOpenCurrent += (anim.mouthOpenTarget - anim.mouthOpenCurrent) * lerpSpeed;
    
    // 頭の自然な動き（控えめ）
    if (isSpeaking) {
      group.current.rotation.y = Math.sin(anim.time * 0.5) * 0.008;
      group.current.rotation.x = Math.sin(anim.time * 0.8) * 0.004;
    } else {
      group.current.rotation.y = Math.sin(anim.time * 0.2) * 0.004;
      group.current.rotation.x = 0;
    }
    
    // 呼吸による上下動
    group.current.position.y = breathing * 0.002;
    
    // モーフターゲットアニメーション
    morphTargets.forEach((mesh) => {
      if (!mesh.morphTargetInfluences) return;
      
      const influences = mesh.morphTargetInfluences;
      
      // 瞬きのアニメーション（目のインデックス）
      const eyeIndices = [9, 10, 11, 12, 45, 46, 47, 48];
      eyeIndices.forEach(idx => {
        if (idx < influences.length) {
          influences[idx] = blinkValue;
        }
      });
      
      if (isSpeaking) {
        // 口のアニメーション（主要インデックス）
        const mouthOpen = anim.mouthOpenCurrent;
        
        // 基本的な口の開閉
        if (influences.length > 0) {
          influences[0] = mouthOpen;
        }
        if (influences.length > 1) {
          influences[1] = Math.sin(anim.time * 15) * mouthOpen * 0.4;
        }
        if (influences.length > 2) {
          influences[2] = Math.sin(anim.time * 12 + 1) * mouthOpen * 0.3;
        }
        
        // 追加の口のインデックス
        const additionalMouthIndices = [25, 26, 27, 73, 74, 75, 114, 115];
        additionalMouthIndices.forEach((idx, i) => {
          if (idx < influences.length) {
            const phase = anim.time * (8 + i) + i * 0.5;
            influences[idx] = Math.sin(phase) * mouthOpen * 0.4;
          }
        });
        
        // 他のモーフターゲットに微細な動きを追加（口と眉以外）
        for (let i = 13; i < Math.min(25, influences.length); i++) {
          // 目と口のインデックスは除外
          if (!eyeIndices.includes(i) && ![0, 1, 2, 25, 26, 27, 73, 74, 75, 114, 115].includes(i)) {
            influences[i] = Math.sin(anim.time * 2 + i) * 0.02;
          }
        }
      } else {
        // 話していない時は口を閉じる（瞬きは継続）
        const mouthIndices = [0, 1, 2, 25, 26, 27, 73, 74, 75, 114, 115];
        mouthIndices.forEach(idx => {
          if (idx < influences.length) {
            influences[idx] *= 0.92; // スムーズに減衰
          }
        });
        
        // その他のモーフターゲットも減衰
        for (let i = 13; i < Math.min(25, influences.length); i++) {
          if (!eyeIndices.includes(i)) {
            influences[i] *= 0.95;
          }
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

// プログレス表示
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="text-center">
        <div className="w-24 h-24 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-lg font-semibold">読み込み中...</div>
        <div className="text-sm text-gray-600">{progress.toFixed(0)}%</div>
      </div>
    </Html>
  );
}

export default function OptimizedLipSyncAvatar({
  isSpeaking = false,
  audioLevel = 0,
  currentWord = '',
  currentPhoneme = '',
  speechProgress = 0,
  showDebug = false
}: {
  isSpeaking?: boolean;
  audioLevel?: number;
  currentWord?: string;
  currentPhoneme?: string;
  speechProgress?: number;
  showDebug?: boolean;
}) {
  return (
    <div className="relative w-full h-[400px] bg-white rounded-xl overflow-hidden">
      <Canvas
        camera={{ position: [0, 1.68, 0.7], fov: 28 }}
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
          outputColorSpace: THREE.SRGBColorSpace
        }}
      >
        {/* ライティング（CleanLipSyncAvatarと同じ設定） */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={0.6}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight position={[-5, 5, -5]} intensity={0.3} />
        <pointLight position={[0, 2, 1]} intensity={0.2} />
        
        {/* アバターモデル */}
        <Suspense fallback={<Loader />}>
          <AvatarModel 
            isSpeaking={isSpeaking} 
            audioLevel={audioLevel}
            currentWord={currentWord}
            currentPhoneme={currentPhoneme}
            speechProgress={speechProgress}
          />
          <Environment preset="studio" intensity={0.5} />
        </Suspense>
        
        {/* カメラコントロール（回転無効） */}
        <OrbitControls
          target={[0, 1.7, 0]}
          enableRotate={false}
          enablePan={false}
          enableZoom={false}
        />
        
        {/* 床 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#f0f0f0" />
        </mesh>
        
        {/* 背景色 */}
        <color attach="background" args={['#ffffff']} />
      </Canvas>
      
      {/* デバッグ情報 */}
      {showDebug && (
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs p-2 rounded">
          <div>Speaking: {isSpeaking ? 'Yes' : 'No'}</div>
          <div>Audio Level: {(audioLevel * 100).toFixed(0)}%</div>
          {currentWord && <div>Word: {currentWord}</div>}
          <div className="text-green-300">Optimized Lip Sync</div>
        </div>
      )}
    </div>
  );
}

// GLBファイルをプリロード
useGLTF.preload('/models/man-grey-suit-optimized.glb');