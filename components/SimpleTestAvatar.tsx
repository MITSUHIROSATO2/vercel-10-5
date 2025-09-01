'use client';

import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';

function TestAvatarModel() {
  const group = useRef<THREE.Group>(null);
  const [testIndices, setTestIndices] = useState<number[]>([0, 1, 2, 8, 9, 25, 26]);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [meshInfo, setMeshInfo] = useState<any[]>([]);
  const animationTime = useRef(0);
  
  // GLBファイルを読み込む
  const { scene } = useGLTF('/models/man-grey-suit-optimized.glb');
  
  useEffect(() => {
    if (!scene) return;
    
    const info: any[] = [];
    
    // すべてのメッシュを収集
    scene.traverse((child: any) => {
      if ((child.isMesh || child.isSkinnedMesh) && child.morphTargetInfluences) {
        const meshData = {
          name: child.name,
          mesh: child,
          morphCount: child.morphTargetInfluences.length,
          dictionary: child.morphTargetDictionary ? Object.keys(child.morphTargetDictionary) : []
        };
        info.push(meshData);
        
        console.log(`Mesh found: ${child.name}`);
        console.log(`  Morph targets: ${child.morphTargetInfluences.length}`);
        if (child.morphTargetDictionary) {
          console.log(`  Dictionary:`, child.morphTargetDictionary);
        }
      }
    });
    
    setMeshInfo(info);
  }, [scene]);
  
  // アニメーションループ
  useFrame((state, delta) => {
    if (!group.current) return;
    
    animationTime.current += delta;
    const value = Math.sin(animationTime.current * 2) * 0.5 + 0.5;
    
    // 各メッシュの指定インデックスをアニメーション
    meshInfo.forEach(({ mesh }) => {
      if (mesh.morphTargetInfluences) {
        // すべてリセット
        for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
          mesh.morphTargetInfluences[i] = 0;
        }
        
        // 現在のテストインデックスをアニメーション
        if (currentTestIndex < mesh.morphTargetInfluences.length) {
          mesh.morphTargetInfluences[currentTestIndex] = value;
        }
      }
    });
  });
  
  return (
    <group ref={group} position={[0, 0, 0]}>
      <primitive object={scene} />
      
      <Html position={[0, 2.5, 0]} center>
        <div className="bg-black/90 text-white p-3 rounded-lg">
          <h3 className="text-lg font-bold mb-2">Simple Test</h3>
          
          <div className="mb-2">
            <label className="block text-sm">Test Index: {currentTestIndex}</label>
            <input
              type="range"
              min="0"
              max="150"
              value={currentTestIndex}
              onChange={(e) => setCurrentTestIndex(parseInt(e.target.value))}
              className="w-48"
            />
          </div>
          
          <div className="grid grid-cols-4 gap-1 mb-2">
            {[0, 1, 2, 8, 9, 25, 26, 73, 74, 114, 115].map(idx => (
              <button
                key={idx}
                onClick={() => setCurrentTestIndex(idx)}
                className={`px-2 py-1 text-xs rounded ${
                  currentTestIndex === idx ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                {idx}
              </button>
            ))}
          </div>
          
          <div className="text-xs">
            {meshInfo.map((info, idx) => (
              <div key={idx}>
                <div className="font-bold">{info.name}</div>
                <div>Morphs: {info.morphCount}</div>
              </div>
            ))}
          </div>
        </div>
      </Html>
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

export default function SimpleTestAvatar() {
  return (
    <div className="relative w-full h-[500px] bg-white rounded-xl overflow-hidden">
      <Canvas camera={{ position: [0, 1.68, 1.5], fov: 28 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} />
        
        <Suspense fallback={<Loader />}>
          <TestAvatarModel />
        </Suspense>
        
        <OrbitControls target={[0, 1.6, 0]} />
        <gridHelper args={[10, 10]} />
      </Canvas>
    </div>
  );
}

useGLTF.preload('/models/man-grey-suit-optimized.glb');