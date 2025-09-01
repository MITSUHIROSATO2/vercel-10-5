'use client';

import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';

interface AvatarModelProps {
  isSpeaking: boolean;
  audioLevel?: number;
}

function AvatarModel({ isSpeaking, audioLevel = 0 }: AvatarModelProps) {
  const group = useRef<THREE.Group>(null);
  const [meshWithMorph, setMeshWithMorph] = useState<any>(null);
  const animationTime = useRef(0);
  const blinkTimer = useRef(0);
  const nextBlinkTime = useRef(3 + Math.random() * 3);
  const isBlinking = useRef(false);
  
  const { scene } = useGLTF('/models/man-grey-suit-optimized.glb');
  
  useEffect(() => {
    if (!scene) return;
    
    console.log('=== SimplestLipSync: モーフターゲット調査 ===');
    
    // モーフターゲットを持つメッシュを探す
    let foundMesh: any = null;
    scene.traverse((child: any) => {
      if ((child.isMesh || child.isSkinnedMesh) && !foundMesh) {
        // モーフターゲットを持つメッシュを探す
        if (child.morphTargetInfluences && child.morphTargetInfluences.length > 0) {
          console.log(`モーフターゲットメッシュ発見: ${child.name}`);
          console.log(`  モーフターゲット数: ${child.morphTargetInfluences.length}`);
          
          // 最初の50個のインデックスをテスト用に表示
          console.log('  最初の50個のインデックスをテスト対象とします');
          
          foundMesh = child;
        }
      }
    });
    
    if (foundMesh) {
      setMeshWithMorph(foundMesh);
      console.log('モーフターゲットメッシュを設定しました');
    } else {
      console.warn('モーフターゲットを持つメッシュが見つかりませんでした');
    }
  }, [scene]);
  
  useFrame((state, delta) => {
    if (!group.current) return;
    
    animationTime.current += delta;
    
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
    
    // 頭の微細な動き
    group.current.rotation.y = Math.sin(animationTime.current * 0.3) * 0.003;
    group.current.rotation.x = Math.sin(animationTime.current * 0.5) * 0.002;
    
    // モーフターゲットアニメーション
    if (meshWithMorph && meshWithMorph.morphTargetInfluences) {
      const influences = meshWithMorph.morphTargetInfluences;
      
      // すべてのモーフターゲットをリセット
      for (let i = 0; i < influences.length; i++) {
        influences[i] = 0;
      }
      
      // 瞬き（一般的なインデックス）
      if (influences.length > 9) influences[9] = blinkValue;
      if (influences.length > 10) influences[10] = blinkValue;
      
      if (isSpeaking) {
        // シンプルな口の開閉
        const time = animationTime.current;
        const mouthOpen = (0.5 + Math.sin(time * 4) * 0.5) * Math.max(audioLevel, 0.5);
        
        // 様々なインデックスを試す（どれかが口のはず）
        const possibleMouthIndices = [
          0, 1, 2, 3, 4, 5,     // 最初の方
          24, 25, 26, 27, 28,   // 25周辺
          72, 73, 74, 75, 76,   // 73周辺
        ];
        
        possibleMouthIndices.forEach(idx => {
          if (idx < influences.length) {
            influences[idx] = mouthOpen;
          }
        });
        
        // デバッグ用（1秒ごとにログ）
        if (Math.floor(time) !== Math.floor(time - delta)) {
          console.log(`口の開き: ${mouthOpen.toFixed(2)}, 試したインデックス: ${possibleMouthIndices.filter(i => i < influences.length)}`);
        }
      }
    }
  });
  
  return (
    <group ref={group} position={[0, 0, 0]}>
      <primitive object={scene} />
    </group>
  );
}

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

export default function SimplestLipSync({
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
          />
          <Environment preset="studio" intensity={0.5} />
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
          <div>Simplest Lip Sync</div>
          <div>Speaking: {isSpeaking ? 'Yes' : 'No'}</div>
          <div>Audio: {(audioLevel * 100).toFixed(0)}%</div>
        </div>
      )}
    </div>
  );
}

useGLTF.preload('/models/man-grey-suit-optimized.glb');