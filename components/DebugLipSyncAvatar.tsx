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
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [morphMeshes, setMorphMeshes] = useState<any[]>([]);
  const animationTime = useRef(0);
  
  // GLBファイルを読み込む - gltf全体を取得
  const gltf = useGLTF('/models/man-grey-suit-optimized.glb');
  
  useEffect(() => {
    if (!gltf) {
      console.error('GLTF not loaded');
      return;
    }
    
    const info: string[] = [];
    const meshList: any[] = [];
    
    info.push('=== DEBUG: GLB Structure ===');
    info.push(`GLTF loaded: ${!!gltf}`);
    info.push(`Scene: ${!!gltf.scene}`);
    info.push(`Animations: ${gltf.animations?.length || 0}`);
    
    console.log('GLTF Object:', gltf);
    console.log('Scene:', gltf.scene);
    console.log('Animations:', gltf.animations);
    
    let meshCount = 0;
    let morphCount = 0;
    
    // シーンを走査
    gltf.scene.traverse((child: any) => {
      // オブジェクトの種類をログ
      if (child.type) {
        console.log(`Object: ${child.name} (Type: ${child.type})`);
      }
      
      // メッシュの詳細確認
      if (child.isMesh || child.isSkinnedMesh) {
        meshCount++;
        const meshInfo = `Mesh ${meshCount}: ${child.name} (${child.type})`;
        info.push(meshInfo);
        console.log(meshInfo);
        
        // ジオメトリ情報
        if (child.geometry) {
          console.log(`  Geometry: ${child.geometry.type}`);
          console.log(`  Vertices: ${child.geometry.attributes?.position?.count || 0}`);
        }
        
        // モーフターゲット確認
        if (child.morphTargetInfluences) {
          const morphInfo = `  Morph targets: ${child.morphTargetInfluences.length}`;
          info.push(morphInfo);
          console.log(morphInfo);
          morphCount += child.morphTargetInfluences.length;
          
          // モーフターゲット辞書
          if (child.morphTargetDictionary) {
            const keys = Object.keys(child.morphTargetDictionary);
            console.log('  Dictionary keys:', keys);
            if (keys.length > 0) {
              info.push(`  Dict keys: ${keys.slice(0, 5).join(', ')}...`);
            }
          }
          
          // このメッシュを保存
          meshList.push({
            mesh: child,
            name: child.name,
            morphCount: child.morphTargetInfluences.length
          });
        } else {
          info.push('  No morph targets');
        }
        
        // マテリアル設定
        if (child.material) {
          const processMaterial = (mat: any) => {
            mat.depthWrite = true;
            mat.depthTest = true;
            mat.side = THREE.FrontSide;
            mat.needsUpdate = true;
          };
          
          if (Array.isArray(child.material)) {
            child.material.forEach(processMaterial);
          } else {
            processMaterial(child.material);
          }
        }
      }
      
      // ボーン情報
      if (child.isBone) {
        console.log(`Bone: ${child.name}`);
      }
    });
    
    info.push(`Total meshes: ${meshCount}`);
    info.push(`Total morph targets: ${morphCount}`);
    info.push(`Meshes with morphs: ${meshList.length}`);
    
    setDebugInfo(info);
    setMorphMeshes(meshList);
    
    console.log('=== Setup Complete ===');
    console.log('Morph meshes:', meshList);
  }, [gltf]);
  
  // アニメーションループ
  useFrame((state, delta) => {
    if (!group.current) return;
    
    animationTime.current += delta;
    const time = animationTime.current;
    
    // グループの基本的な動き
    group.current.rotation.y = Math.sin(time * 0.5) * 0.01;
    group.current.position.y = Math.sin(time * 0.8) * 0.002;
    
    // モーフターゲットアニメーション
    morphMeshes.forEach(({ mesh }) => {
      if (!mesh.morphTargetInfluences) return;
      
      const influences = mesh.morphTargetInfluences;
      
      if (isSpeaking) {
        // シンプルなテストアニメーション
        // すべてのモーフターゲットを波形でアニメーション
        for (let i = 0; i < Math.min(influences.length, 10); i++) {
          influences[i] = Math.sin(time * (5 + i)) * audioLevel * 0.5;
        }
      } else {
        // 徐々に0に戻す
        for (let i = 0; i < influences.length; i++) {
          influences[i] *= 0.95;
        }
      }
    });
  });
  
  return (
    <group ref={group} position={[0, 0, 0]}>
      <primitive object={gltf.scene} />
      <Html position={[0, 2.5, 0]} center>
        <div className="bg-black/90 text-white p-2 rounded text-xs max-w-md">
          <div className="font-bold text-green-400 mb-1">Debug Info</div>
          {debugInfo.map((info, idx) => (
            <div key={idx} className="font-mono">{info}</div>
          ))}
        </div>
      </Html>
    </group>
  );
}

// プログレス表示
function Loader() {
  const { progress, errors } = useProgress();
  return (
    <Html center>
      <div className="text-center">
        <div className="w-24 h-24 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-lg font-semibold">読み込み中...</div>
        <div className="text-sm text-gray-600">{progress.toFixed(0)}%</div>
        {errors.length > 0 && (
          <div className="text-red-500 mt-2">
            エラー: {errors.join(', ')}
          </div>
        )}
      </div>
    </Html>
  );
}

export default function DebugLipSyncAvatar({
  isSpeaking = false,
  audioLevel = 0,
  showDebug = true
}: {
  isSpeaking?: boolean;
  audioLevel?: number;
  showDebug?: boolean;
}) {
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // エラーハンドリング
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Loading error:', error);
      setLoadError(error.message);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  return (
    <div className="relative w-full h-[400px] bg-white rounded-xl overflow-hidden">
      {loadError && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-2 z-10">
          エラー: {loadError}
        </div>
      )}
      
      <Canvas
        camera={{ position: [0, 1.68, 1.5], fov: 28 }}
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
          outputColorSpace: THREE.SRGBColorSpace
        }}
        onCreated={(state) => {
          console.log('Canvas created:', state);
        }}
      >
        {/* ライティング */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={0.5} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.3} />
        
        {/* アバターモデル */}
        <Suspense fallback={<Loader />}>
          <AvatarModel isSpeaking={isSpeaking} audioLevel={audioLevel} />
          <Environment preset="studio" intensity={0.5} />
        </Suspense>
        
        {/* カメラコントロール */}
        <OrbitControls
          target={[0, 1.6, 0]}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />
        
        {/* グリッド */}
        <gridHelper args={[10, 10]} />
        
        {/* 軸ヘルパー */}
        <axesHelper args={[5]} />
      </Canvas>
      
      {/* ステータス表示 */}
      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs p-2 rounded">
        <div>Status: {isSpeaking ? 'Speaking' : 'Idle'}</div>
        <div>Audio: {(audioLevel * 100).toFixed(0)}%</div>
        <div className="text-yellow-300">Debug Mode Active</div>
      </div>
    </div>
  );
}

// GLBファイルをプリロード
useGLTF.preload('/models/man-grey-suit-optimized.glb');