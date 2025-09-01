'use client';

import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations, Html } from '@react-three/drei';
import * as THREE from 'three';

interface TestResult {
  meshName: string;
  hasMorphTargets: boolean;
  morphCount: number;
  dictionaryKeys: string[];
  testResults: { [key: string]: string };
}

function AvatarInvestigator() {
  const gltf = useGLTF('/models/man-grey-suit-optimized.glb');
  const { actions, mixer } = useAnimations(gltf.animations, gltf.scene);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const morphMeshes = useRef<any[]>([]);
  const testTimer = useRef(0);
  
  useEffect(() => {
    if (!gltf) return;
    
    console.log('=== INVESTIGATION START ===');
    console.log('GLTF structure:', gltf);
    console.log('Animations:', gltf.animations);
    console.log('Scene:', gltf.scene);
    
    const results: TestResult[] = [];
    const meshList: any[] = [];
    
    // アニメーション情報をログ
    if (gltf.animations && gltf.animations.length > 0) {
      console.log(`Found ${gltf.animations.length} animations:`);
      gltf.animations.forEach((clip, idx) => {
        console.log(`  ${idx}: ${clip.name} (${clip.duration}s, ${clip.tracks.length} tracks)`);
      });
    }
    
    // シーン内のすべてのオブジェクトを調査
    gltf.scene.traverse((child: any) => {
      // メッシュの調査
      if (child.isMesh || child.isSkinnedMesh) {
        const result: TestResult = {
          meshName: child.name,
          hasMorphTargets: !!child.morphTargetInfluences,
          morphCount: child.morphTargetInfluences?.length || 0,
          dictionaryKeys: [],
          testResults: {}
        };
        
        // モーフターゲット辞書の詳細
        if (child.morphTargetDictionary) {
          result.dictionaryKeys = Object.keys(child.morphTargetDictionary);
          console.log(`\nMesh: ${child.name}`);
          console.log('Dictionary keys:', result.dictionaryKeys);
          
          // 重要なキーを探す
          const importantKeys = result.dictionaryKeys.filter(key => {
            const lower = key.toLowerCase();
            return lower.includes('eye') || 
                   lower.includes('mouth') || 
                   lower.includes('jaw') || 
                   lower.includes('blink') ||
                   lower.includes('smile') ||
                   lower.includes('open') ||
                   lower.includes('close') ||
                   lower.includes('brow');
          });
          
          if (importantKeys.length > 0) {
            console.log('Important morph targets found:', importantKeys);
            importantKeys.forEach(key => {
              result.testResults[key] = 'Found';
            });
          }
        }
        
        // ジオメトリのモーフ属性を確認
        if (child.geometry && child.geometry.morphAttributes) {
          const attrs = Object.keys(child.geometry.morphAttributes);
          console.log(`Geometry morph attributes for ${child.name}:`, attrs);
        }
        
        if (child.morphTargetInfluences && child.morphTargetInfluences.length > 0) {
          meshList.push(child);
        }
        
        results.push(result);
      }
      
      // ボーンの調査
      if (child.isBone) {
        console.log(`Bone found: ${child.name}`);
      }
    });
    
    morphMeshes.current = meshList;
    setTestResults(results);
    
    // アニメーションアクションを開始
    if (actions) {
      console.log('Available actions:', Object.keys(actions));
      Object.values(actions).forEach(action => {
        action.play();
        action.setEffectiveWeight(0.1);
      });
    }
    
    console.log('=== INVESTIGATION COMPLETE ===');
  }, [gltf, actions]);
  
  // アニメーションテスト
  useFrame((state, delta) => {
    if (!isAnimating) return;
    
    testTimer.current += delta;
    
    // 各メッシュのモーフターゲットを順番にテスト
    morphMeshes.current.forEach((mesh, meshIdx) => {
      if (!mesh.morphTargetInfluences) return;
      
      // すべてリセット
      for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
        mesh.morphTargetInfluences[i] = 0;
      }
      
      // 現在のインデックスをアニメーション
      if (currentTestIndex < mesh.morphTargetInfluences.length) {
        const value = Math.sin(testTimer.current * 2) * 0.5 + 0.5;
        mesh.morphTargetInfluences[currentTestIndex] = value;
      }
    });
    
    // ミキサーの更新
    if (mixer) {
      mixer.update(delta);
    }
  });
  
  return (
    <>
      <primitive object={gltf.scene} />
      
      <Html position={[0, 2.8, 0]} center style={{ width: '500px' }}>
        <div className="bg-black/90 text-white p-4 rounded-lg text-xs">
          <h3 className="text-lg font-bold mb-2 text-yellow-400">🔍 Animation Investigation</h3>
          
          <div className="mb-3">
            <button 
              onClick={() => setIsAnimating(!isAnimating)}
              className={`px-4 py-2 rounded mr-2 ${isAnimating ? 'bg-red-600' : 'bg-green-600'}`}
            >
              {isAnimating ? 'Stop Test' : 'Start Test'}
            </button>
            
            <button 
              onClick={() => setCurrentTestIndex(prev => (prev + 1) % 151)}
              className="px-4 py-2 bg-blue-600 rounded mr-2"
            >
              Next Index ({currentTestIndex})
            </button>
            
            <button 
              onClick={() => {
                // 特定のインデックスをテスト
                const testIndices = [0, 1, 2, 8, 9, 10, 25, 26, 73, 74, 114, 115];
                const nextIdx = testIndices.find(idx => idx > currentTestIndex) || 0;
                setCurrentTestIndex(nextIdx);
              }}
              className="px-4 py-2 bg-purple-600 rounded"
            >
              Jump to Key Index
            </button>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {testResults.filter(r => r.hasMorphTargets).map((result, idx) => (
              <div key={idx} className="mb-2 p-2 bg-gray-800 rounded">
                <div className="font-bold text-green-400">{result.meshName}</div>
                <div>Morph count: {result.morphCount}</div>
                {result.dictionaryKeys.length > 0 && (
                  <div className="mt-1">
                    <div className="text-yellow-300">Key morph targets:</div>
                    {result.dictionaryKeys.slice(0, 10).map((key, kidx) => (
                      <div key={kidx} className="ml-2 text-xs">• {key}</div>
                    ))}
                    {result.dictionaryKeys.length > 10 && (
                      <div className="ml-2 text-xs text-gray-400">
                        ... and {result.dictionaryKeys.length - 10} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-2 text-yellow-200">
            Testing Index: {currentTestIndex}
          </div>
        </div>
      </Html>
    </>
  );
}

export default function InvestigationAvatar({
  isSpeaking = false,
  audioLevel = 0,
  showDebug = true
}: {
  isSpeaking?: boolean;
  audioLevel?: number;
  showDebug?: boolean;
}) {
  return (
    <div className="relative w-full h-[500px] bg-white rounded-xl overflow-hidden">
      <Canvas camera={{ position: [0, 1.68, 1.5], fov: 28 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} />
        
        <Suspense fallback={null}>
          <AvatarInvestigator />
        </Suspense>
        
        <OrbitControls target={[0, 1.6, 0]} />
        <gridHelper args={[10, 10]} />
      </Canvas>
      
      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs p-2 rounded">
        <div>🔬 Investigation Mode</div>
        <div>Speak: {isSpeaking ? 'Yes' : 'No'}</div>
        <div>Audio: {(audioLevel * 100).toFixed(0)}%</div>
      </div>
    </div>
  );
}

useGLTF.preload('/models/man-grey-suit-optimized.glb');