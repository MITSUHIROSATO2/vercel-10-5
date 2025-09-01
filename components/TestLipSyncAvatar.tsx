'use client';

import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';

interface AvatarModelProps {
  isSpeaking: boolean;
  audioLevel?: number;
  testIndex?: number;
}

function AvatarModel({ isSpeaking, audioLevel = 0, testIndex = 0 }: AvatarModelProps) {
  const group = useRef<THREE.Group>(null);
  const [morphTargets, setMorphTargets] = useState<any[]>([]);
  const animationTime = useRef(0);
  const currentTestIndex = useRef(0);
  const lastLogTime = useRef(0);
  
  const { scene } = useGLTF('/models/man-grey-suit-optimized.glb');
  
  useEffect(() => {
    if (!scene) return;
    
    console.log('=== TestLipSyncAvatar: モーフターゲット完全調査 ===');
    const morphMeshes: any[] = [];
    
    scene.traverse((child: any) => {
      if (child.isMesh || child.isSkinnedMesh) {
        if (child.morphTargetInfluences && child.morphTargetInfluences.length > 0) {
          morphMeshes.push(child);
          console.log(`メッシュ: ${child.name}`);
          console.log(`  モーフターゲット数: ${child.morphTargetInfluences.length}`);
          
          if (child.morphTargetDictionary) {
            const keys = Object.keys(child.morphTargetDictionary);
            console.log('=== 全モーフターゲットキー ===');
            keys.forEach((key, idx) => {
              const index = child.morphTargetDictionary[key];
              console.log(`  ${idx}: "${key}" => index ${index}`);
            });
          }
        }
      }
    });
    
    console.log(`総メッシュ数: ${morphMeshes.length}`);
    setMorphTargets(morphMeshes);
  }, [scene]);
  
  useFrame((state, delta) => {
    if (!group.current) return;
    
    animationTime.current += delta;
    
    // テストモード：各インデックスを順番に試す
    morphTargets.forEach((mesh) => {
      if (!mesh.morphTargetInfluences) return;
      
      const influences = mesh.morphTargetInfluences;
      
      // すべてをリセット
      for (let i = 0; i < influences.length; i++) {
        influences[i] = 0;
      }
      
      if (isSpeaking) {
        // 5秒ごとに次のインデックスに移動
        const testInterval = 5;
        const newIndex = Math.floor(animationTime.current / testInterval) % influences.length;
        
        if (newIndex !== currentTestIndex.current) {
          currentTestIndex.current = newIndex;
          console.log(`=== テスト中のインデックス: ${newIndex} / ${influences.length} ===`);
          
          // morphTargetDictionaryから名前を探す
          if (mesh.morphTargetDictionary) {
            const keyForIndex = Object.keys(mesh.morphTargetDictionary).find(
              key => mesh.morphTargetDictionary[key] === newIndex
            );
            if (keyForIndex) {
              console.log(`  インデックス ${newIndex} のキー名: "${keyForIndex}"`);
            }
          }
        }
        
        // 現在のインデックスに大きな値を設定
        influences[currentTestIndex.current] = 1.0;
        
        // ログ出力（1秒ごと）
        if (animationTime.current - lastLogTime.current > 1) {
          lastLogTime.current = animationTime.current;
          console.log(`インデックス ${currentTestIndex.current} に値 1.0 を設定中...`);
        }
      }
    });
    
    // 頭の微細な動き
    group.current.rotation.y = Math.sin(animationTime.current * 0.3) * 0.003;
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

export default function TestLipSyncAvatar({
  isSpeaking = true,
  audioLevel = 1,
  showDebug = true
}: {
  isSpeaking?: boolean;
  audioLevel?: number;
  showDebug?: boolean;
}) {
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestIndex(prev => prev + 1);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
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
            testIndex={currentTestIndex}
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
          <div className="text-yellow-300 font-bold">テストモード</div>
          <div>5秒ごとに次のモーフターゲットをテスト</div>
          <div>コンソールで現在のインデックスを確認</div>
        </div>
      )}
    </div>
  );
}

useGLTF.preload('/models/man-grey-suit-optimized.glb');