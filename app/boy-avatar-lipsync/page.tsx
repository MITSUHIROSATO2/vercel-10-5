'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// 少年アバター用の簡易リップシンクコンポーネント
function BoyAvatarWithLipSync({ isSpeaking }: { isSpeaking: boolean }) {
  const { scene } = useGLTF('/models/BOY_4.glb');
  const meshRef = useRef<THREE.Mesh>(null);
  const originalGeometry = useRef<THREE.BufferGeometry | null>(null);
  
  useEffect(() => {
    if (!scene) return;
    
    // モデル構造を分析
    scene.traverse((child: any) => {
      if (child.isMesh) {
        meshRef.current = child;
        
        // オリジナルのジオメトリを保存
        if (child.geometry) {
          originalGeometry.current = child.geometry.clone();
          
          // メッシュ情報を取得
          const info = {
            name: child.name,
            vertexCount: child.geometry.attributes.position?.count || 0,
            hasUV: !!child.geometry.attributes.uv,
            hasMorphTargets: !!child.morphTargetInfluences,
            morphTargetCount: child.morphTargetInfluences?.length || 0,
            material: child.material?.name || 'unknown',
            boundingBox: null as any
          };
          
          // バウンディングボックスを計算
          child.geometry.computeBoundingBox();
          if (child.geometry.boundingBox) {
            const box = child.geometry.boundingBox;
            info.boundingBox = {
              min: box.min.toArray(),
              max: box.max.toArray(),
              center: new THREE.Vector3().addVectors(box.min, box.max).multiplyScalar(0.5).toArray()
            };
          }
          
          console.log('Boy Avatar Mesh Info:', info);
        }
      }
    });
  }, [scene]);
  
  // 簡易的な口の動きアニメーション
  useFrame(() => {
    if (!meshRef.current || !originalGeometry.current) return;
    
    const mesh = meshRef.current;
    
    if (isSpeaking) {
      // 簡易的な顎の開閉アニメーション（スケールで代用）
      const time = Date.now() * 0.003;
      const mouthOpen = Math.sin(time * 5) * 0.5 + 0.5;
      
      // Y軸方向のスケールで口の開閉を表現
      mesh.scale.y = 1.0 + mouthOpen * 0.05;
      
      // 頭の微妙な動き
      mesh.rotation.y = Math.sin(time) * 0.02;
      mesh.rotation.x = Math.sin(time * 0.7) * 0.01;
    } else {
      // アイドル状態に戻す
      mesh.scale.y = 1.0;
      mesh.rotation.y = 0;
      mesh.rotation.x = 0;
    }
  });
  
  return <primitive object={scene} />;
}

export default function BoyAvatarLipSyncPage() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-cyan-400 mb-6">少年アバター リップシンク実装方法</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl text-yellow-400 mb-4">⚠️ 問題点</h2>
          <ul className="space-y-2 text-gray-300">
            <li>• BOY_4.glbにはシェイプキー（モーフターゲット）がありません</li>
            <li>• ボーン（スケルトン）もありません</li>
            <li>• メッシュが1つだけの静的モデルです</li>
          </ul>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl text-green-400 mb-4">✅ 実装可能な解決策</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-700 p-4 rounded">
              <h3 className="text-lg font-semibold text-cyan-300 mb-2">1. テクスチャアニメーション</h3>
              <p className="text-sm text-gray-300">口の部分のテクスチャを動的に変更して、異なる口の形を表現</p>
              <p className="text-xs text-gray-400 mt-1">難易度: ★★☆ | 効果: ★★★</p>
            </div>
            
            <div className="bg-gray-700 p-4 rounded">
              <h3 className="text-lg font-semibold text-cyan-300 mb-2">2. 頂点シェーダーアニメーション</h3>
              <p className="text-sm text-gray-300">シェーダーで口周辺の頂点を動的に変形</p>
              <p className="text-xs text-gray-400 mt-1">難易度: ★★★ | 効果: ★★★</p>
            </div>
            
            <div className="bg-gray-700 p-4 rounded">
              <h3 className="text-lg font-semibold text-cyan-300 mb-2">3. 2D口画像のオーバーレイ</h3>
              <p className="text-sm text-gray-300">3Dモデルの口の位置に2D画像をオーバーレイ</p>
              <p className="text-xs text-gray-400 mt-1">難易度: ★☆☆ | 効果: ★★☆</p>
            </div>
            
            <div className="bg-gray-700 p-4 rounded border-2 border-green-500">
              <h3 className="text-lg font-semibold text-green-300 mb-2">4. 簡易スケールアニメーション（現在実装中）</h3>
              <p className="text-sm text-gray-300">モデル全体または顔部分のスケールで口の開閉を表現</p>
              <p className="text-xs text-gray-400 mt-1">難易度: ★☆☆ | 効果: ★☆☆</p>
            </div>
            
            <div className="bg-gray-700 p-4 rounded">
              <h3 className="text-lg font-semibold text-cyan-300 mb-2">5. 動的モーフターゲット生成</h3>
              <p className="text-sm text-gray-300">Three.jsで口周辺の頂点を特定し、プログラムでモーフターゲットを作成</p>
              <p className="text-xs text-gray-400 mt-1">難易度: ★★★ | 効果: ★★★★</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl text-blue-400 mb-4">🎭 簡易デモ</h2>
          <div className="h-96 bg-gray-900 rounded mb-4">
            <Canvas camera={{ position: [0, 1.2, 1.5], fov: 30 }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[5, 5, 5]} intensity={0.5} />
              <BoyAvatarWithLipSync isSpeaking={isSpeaking} />
              <OrbitControls target={[0, 1.2, 0]} />
            </Canvas>
          </div>
          <button
            onClick={() => setIsSpeaking(!isSpeaking)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              isSpeaking 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isSpeaking ? '停止' : '話す'}
          </button>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl text-purple-400 mb-4">🔧 推奨される実装方法</h2>
          <div className="bg-gradient-to-r from-purple-900 to-blue-900 p-6 rounded">
            <h3 className="text-lg font-bold text-white mb-3">動的モーフターゲット生成 + テクスチャアニメーション</h3>
            <ol className="space-y-2 text-gray-200">
              <li>1. 口周辺の頂点をUV座標やY座標から特定</li>
              <li>2. Three.jsで動的にモーフターゲットを生成</li>
              <li>3. 基本的な口の形（あ、い、う、え、お）を定義</li>
              <li>4. 必要に応じてテクスチャも切り替えて表現力を向上</li>
            </ol>
            <p className="text-yellow-300 mt-4 text-sm">
              ※ または、リップシンク対応の少年モデルを新たに用意することも検討してください
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

useGLTF.preload('/models/BOY_4.glb');
