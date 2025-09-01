'use client';

import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';

interface AvatarModelProps {
  isSpeaking: boolean;
  audioLevel?: number;
  currentWord?: string;
}

// 実際に動作が確認されたインデックス（これらを調整）
const MORPH_INDICES = {
  MOUTH_OPEN: 0,  // 口を開く
  MOUTH_WIDE: 1,   // 口を横に広げる
  MOUTH_ROUND: 2,  // 口を丸める
  EYE_BLINK_L: 8,  // 左目瞬き
  EYE_BLINK_R: 9,  // 右目瞬き
};

// 日本語の音素マッピング（インデックスベース）
const JAPANESE_PHONEME_INDICES: { [key: string]: number[] } = {
  'あ': [0],     // 口を大きく開く
  'い': [1],     // 口を横に引く
  'う': [2],     // 口をすぼめる
  'え': [0, 1],  // 口を少し開いて横に
  'お': [0, 2],  // 口を開いて丸める
};

function AvatarModel({ isSpeaking, audioLevel = 0, currentWord = '' }: AvatarModelProps) {
  const group = useRef<THREE.Group>(null);
  const [mainMesh, setMainMesh] = useState<any>(null);
  const animationTime = useRef(0);
  const blinkTimer = useRef(0);
  const nextBlinkTime = useRef(3 + Math.random() * 3);
  const isBlinking = useRef(false);
  const currentPhonemeIndices = useRef<number[]>([]);
  
  // GLBファイルを読み込む
  const { scene } = useGLTF('/models/man-grey-suit-optimized.glb');
  
  useEffect(() => {
    if (!scene) return;
    
    // 最初に見つかったモーフターゲットを持つメッシュを使用
    scene.traverse((child: any) => {
      if (!mainMesh && (child.isMesh || child.isSkinnedMesh)) {
        if (child.morphTargetInfluences && child.morphTargetInfluences.length > 0) {
          setMainMesh(child);
          console.log(`Using mesh: ${child.name} with ${child.morphTargetInfluences.length} morph targets`);
        }
        
        // マテリアル設定
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
  }, [scene, mainMesh]);
  
  // 現在の音素を更新
  useEffect(() => {
    if (currentWord && currentWord.length > 0) {
      const lastChar = currentWord[currentWord.length - 1];
      currentPhonemeIndices.current = JAPANESE_PHONEME_INDICES[lastChar] || [0];
    } else {
      currentPhonemeIndices.current = [];
    }
  }, [currentWord]);
  
  // アニメーションループ
  useFrame((state, delta) => {
    if (!group.current || !mainMesh || !mainMesh.morphTargetInfluences) return;
    
    animationTime.current += delta;
    const time = state.clock.getElapsedTime();
    
    // 瞬きアニメーション
    blinkTimer.current += delta;
    if (blinkTimer.current >= nextBlinkTime.current) {
      isBlinking.current = true;
      blinkTimer.current = 0;
      nextBlinkTime.current = 2 + Math.random() * 4;
    }
    
    let blinkValue = 0;
    if (isBlinking.current) {
      const blinkProgress = blinkTimer.current / 0.15;
      if (blinkProgress < 1) {
        blinkValue = blinkProgress < 0.5 ? blinkProgress * 2 : 2 - blinkProgress * 2;
      } else {
        isBlinking.current = false;
      }
    }
    
    // 頭の自然な動き
    group.current.rotation.y = Math.sin(time * 0.3) * 0.003;
    group.current.rotation.x = Math.sin(time * 0.5) * 0.002;
    
    const influences = mainMesh.morphTargetInfluences;
    
    // すべてのモーフターゲットをリセット
    for (let i = 0; i < influences.length; i++) {
      influences[i] = 0;
    }
    
    // 瞬きを適用（インデックス8, 9）
    if (influences.length > 9) {
      influences[8] = blinkValue;
      influences[9] = blinkValue;
    }
    
    // リップシンク
    if (isSpeaking) {
      const effectiveLevel = audioLevel || 0.5;
      const vibration = Math.sin(animationTime.current * 10) * 0.1;
      
      // 現在の音素に対応するインデックスをアニメーション
      if (currentPhonemeIndices.current.length > 0) {
        currentPhonemeIndices.current.forEach(idx => {
          if (idx < influences.length) {
            influences[idx] = effectiveLevel * 0.8 + vibration * effectiveLevel;
          }
        });
      } else {
        // デフォルト：口を開く（インデックス0）
        if (influences.length > 0) {
          influences[0] = effectiveLevel * 0.6 + vibration * effectiveLevel;
        }
      }
      
      // 音声レベルに応じた追加の動き
      if (influences.length > 2) {
        influences[1] = Math.sin(animationTime.current * 8) * effectiveLevel * 0.3;
        influences[2] = Math.sin(animationTime.current * 6 + 1) * effectiveLevel * 0.2;
      }
    }
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
        <div className="text-lg font-semibold">Loading...</div>
        <div className="text-sm text-gray-600">{progress.toFixed(0)}%</div>
      </div>
    </Html>
  );
}

export default function DirectIndexAvatar({
  isSpeaking = false,
  audioLevel = 0,
  currentWord = '',
  showDebug = false
}: {
  isSpeaking?: boolean;
  audioLevel?: number;
  currentWord?: string;
  showDebug?: boolean;
}) {
  const [testMode, setTestMode] = useState(false);
  const [testIndex, setTestIndex] = useState(0);
  
  return (
    <div className="relative w-full h-[400px] rounded-xl overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
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
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={0.6}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight position={[-5, 5, -5]} intensity={0.3} />
        <pointLight position={[0, 2, 1]} intensity={0.2} />
        
        <Suspense fallback={<Loader />}>
          <AvatarModel 
            isSpeaking={isSpeaking} 
            audioLevel={audioLevel}
            currentWord={currentWord}
          />
          <Environment preset="studio" />
        </Suspense>
        
        <OrbitControls
          target={[0, 1.7, 0]}
          enableRotate={false}
          enablePan={false}
          enableZoom={false}
        />
        
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#f0f0f0" />
        </mesh>
        
        <color attach="background" args={['#ffffff']} />
      </Canvas>
      
      {showDebug && (
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs p-2 rounded">
          <div className="font-bold mb-1">Direct Index Mode</div>
          <div>Speaking: {isSpeaking ? 'Yes' : 'No'}</div>
          <div>Audio: {(audioLevel * 100).toFixed(0)}%</div>
          <div>Word: {currentWord}</div>
          <div className="mt-1 text-yellow-300">
            Using indices: 0(mouth), 1(wide), 2(round), 8-9(blink)
          </div>
        </div>
      )}
    </div>
  );
}

useGLTF.preload('/models/man-grey-suit-optimized.glb');