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

// シンプルな日本語音素マッピング（大きく開くように調整）
const JapaneseVowels: { [key: string]: number } = {
  'あ': 1.5, 'い': 0.8, 'う': 0.9, 'え': 1.1, 'お': 1.2,
  'ア': 1.5, 'イ': 0.8, 'ウ': 0.9, 'エ': 1.1, 'オ': 1.2,
};

function getVowelValue(char: string): number {
  // 直接母音の場合
  if (JapaneseVowels[char]) return JapaneseVowels[char];
  
  // 子音を含む場合、母音部分を抽出
  const vowelMap: { [key: string]: string } = {
    'か': 'あ', 'き': 'い', 'く': 'う', 'け': 'え', 'こ': 'お',
    'さ': 'あ', 'し': 'い', 'す': 'う', 'せ': 'え', 'そ': 'お',
    'た': 'あ', 'ち': 'い', 'つ': 'う', 'て': 'え', 'と': 'お',
    'な': 'あ', 'に': 'い', 'ぬ': 'う', 'ね': 'え', 'の': 'お',
    'は': 'あ', 'ひ': 'い', 'ふ': 'う', 'へ': 'え', 'ほ': 'お',
    'ま': 'あ', 'み': 'い', 'む': 'う', 'め': 'え', 'も': 'お',
    'や': 'あ', 'ゆ': 'う', 'よ': 'お',
    'ら': 'あ', 'り': 'い', 'る': 'う', 'れ': 'え', 'ろ': 'お',
    'わ': 'あ', 'を': 'お', 'ん': 'う',
  };
  
  const vowel = vowelMap[char];
  return vowel ? JapaneseVowels[vowel] : 1.0; // デフォルト値（大きく開く）
}

function AvatarModel({ isSpeaking, audioLevel = 0, currentWord = '' }: AvatarModelProps) {
  const group = useRef<THREE.Group>(null);
  const [morphTargets, setMorphTargets] = useState<any[]>([]);
  const animationTime = useRef(0);
  const blinkTimer = useRef(0);
  const nextBlinkTime = useRef(3 + Math.random() * 3);
  const isBlinking = useRef(false);
  const currentMouthOpen = useRef(0);
  
  const { scene } = useGLTF('/models/man-grey-suit-optimized.glb');
  
  useEffect(() => {
    if (!scene) return;
    
    console.log('=== StableLipSyncAvatar: モーフターゲット調査 ===');
    const morphMeshes: any[] = [];
    
    scene.traverse((child: any) => {
      if (child.isMesh || child.isSkinnedMesh) {
        child.frustumCulled = true;
        child.castShadow = true;
        child.receiveShadow = true;
        
        if (child.morphTargetInfluences && child.morphTargetInfluences.length > 0) {
          morphMeshes.push(child);
          console.log(`モーフターゲットメッシュ発見: ${child.name}`);
          console.log(`  インフルエンス数: ${child.morphTargetInfluences.length}`);
          
          if (child.morphTargetDictionary) {
            const keys = Object.keys(child.morphTargetDictionary);
            console.log(`  辞書キー数: ${keys.length}`);
            
            // A25_Jaw_Openの存在確認
            const jawKey = keys.find(k => k.includes('Jaw_Open') || k.includes('jaw'));
            if (jawKey) {
              console.log(`  顎キー発見: ${jawKey} (index: ${child.morphTargetDictionary[jawKey]})`);
            } else {
              console.log('  警告: Jaw_Openキーが見つかりません');
            }
            
            // すべてのキーを表示（口関連を探す）
            console.log('  全キー数:', keys.length);
            
            // 口関連のキーを抽出
            const mouthRelatedKeys = keys.filter(k => 
              k.toLowerCase().includes('mouth') || 
              k.toLowerCase().includes('jaw') || 
              k.toLowerCase().includes('lip') ||
              k.toLowerCase().includes('open') ||
              k.includes('A25') ||
              k.includes('A26') ||
              k.includes('A43') ||
              k.includes('A44') ||
              k.includes('A45') ||
              k.includes('A46')
            );
            
            if (mouthRelatedKeys.length > 0) {
              console.log('  口関連キー:', mouthRelatedKeys);
              mouthRelatedKeys.forEach(key => {
                console.log(`    ${key}: index=${child.morphTargetDictionary[key]}`);
              });
            } else {
              console.log('  警告: 口関連のキーが見つかりません');
              console.log('  最初の20個のキー:', keys.slice(0, 20));
            }
          } else {
            console.log('  警告: morphTargetDictionaryが存在しません');
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
    setMorphTargets(morphMeshes);
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
    
    // リップシンクの計算
    let targetMouthOpen = 0;
    if (isSpeaking) {
      const baseLevel = Math.max(audioLevel || 0.8, 0.7); // 最低70%の強度
      
      if (currentWord && currentWord.length > 0) {
        const firstChar = currentWord[0];
        const vowelValue = getVowelValue(firstChar);
        targetMouthOpen = vowelValue * baseLevel;
      } else {
        targetMouthOpen = 1.2 * baseLevel; // デフォルトで大きく開く
      }
      
      // 最小値を保証（常に口が開くように）
      targetMouthOpen = Math.max(targetMouthOpen, 0.8);
    }
    
    // スムーズな補間
    currentMouthOpen.current += (targetMouthOpen - currentMouthOpen.current) * 0.2;
    
    // 頭の微細な動き（控えめ）
    group.current.rotation.y = Math.sin(animationTime.current * 0.3) * 0.003;
    group.current.rotation.x = Math.sin(animationTime.current * 0.5) * 0.002;
    group.current.position.y = Math.sin(animationTime.current * 0.8) * 0.001;
    
    // モーフターゲットの適用
    morphTargets.forEach((mesh) => {
      if (!mesh.morphTargetInfluences) return;
      
      const influences = mesh.morphTargetInfluences;
      
      if (mesh.morphTargetDictionary && Object.keys(mesh.morphTargetDictionary).length > 0) {
        const applyMorph = (name: string, value: number) => {
          const index = mesh.morphTargetDictionary[name];
          if (index !== undefined && index < influences.length) {
            influences[index] = value;
            
            // デバッグ: 実際に値が設定されているか確認
            if (name === 'A25_Jaw_Open' && value > 0) {
              if (Math.random() < 0.01) { // 1%の確率でログ出力（頻度を減らす）
                console.log(`A25_Jaw_Open設定: index=${index}, value=${value.toFixed(3)}, 実際の値=${influences[index].toFixed(3)}`);
              }
            }
          } else if (name === 'A25_Jaw_Open') {
            // A25_Jaw_Openが見つからない場合の警告
            if (Math.random() < 0.001) { // 0.1%の確率でログ
              console.warn(`A25_Jaw_Openが見つかりません。辞書のキー:`, Object.keys(mesh.morphTargetDictionary).filter(k => k.includes('25') || k.includes('Jaw')));
            }
          }
        };
        
        // 瞬き（左右対称に）
        applyMorph('A14_Eye_Blink_Left', blinkValue);
        applyMorph('A15_Eye_Blink_Right', blinkValue);
        
        if (isSpeaking && currentMouthOpen.current > 0) {
          const mouthValue = Math.min(currentMouthOpen.current, 1.0); // 最大値を制限
          
          // === 方法1: ARKit標準キーで試す ===
          // 主要な口の動き（左右対称を保証）- 大きく開く
          applyMorph('A25_Jaw_Open', mouthValue);
          applyMorph('A26_Jaw_Forward', mouthValue * 0.3);
          
          // === 方法2: インデックスで直接アクセス ===
          // 様々なインデックスを試す（A25_Jaw_Openは111/132で効果なし）
          if (influences.length > 0) {
            // 口の開閉として可能性の高いインデックスをすべて試す
            const possibleMouthIndices = [
              0, 1, 2, 3, 4, 5,  // 最初の方
              24, 25, 26, 27, 28, 29, 30,  // 25周辺
              72, 73, 74, 75, 76, 77, 78,  // 73周辺
              110, 112, 113, 114, 115,  // 111周辺（111は効果なし）
              131, 133, 134, 135,  // 132周辺（132は効果なし）
            ];
            
            possibleMouthIndices.forEach(idx => {
              if (idx < influences.length && idx !== 111 && idx !== 132) {
                influences[idx] = mouthValue;
              }
            });
            
            // デバッグ: どのインデックスが実際に変化を起こすか確認
            if (Math.random() < 0.001) {
              console.log('試したインデックス:', possibleMouthIndices.filter(i => i < influences.length));
            }
          }
          
          // 唇の動き（左右同じ値）- より大きく動かす
          const lipValue = mouthValue * 0.6;
          applyMorph('A43_Mouth_Upper_Up_Left', lipValue);
          applyMorph('A44_Mouth_Upper_Up_Right', lipValue);
          applyMorph('A45_Mouth_Lower_Down_Left', lipValue);
          applyMorph('A46_Mouth_Lower_Down_Right', lipValue);
          
          // 口の横の動き（左右同じ値）
          const stretchValue = mouthValue * 0.4;
          applyMorph('A35_Mouth_Stretch_Left', stretchValue);
          applyMorph('A36_Mouth_Stretch_Right', stretchValue);
          
          // 頬の動き（左右同じ値）
          const cheekValue = mouthValue * 0.1;
          applyMorph('A21_Cheek_Squint_Left', cheekValue);
          applyMorph('A22_Cheek_Squint_Right', cheekValue);
          
          // 眉の動き（非常に控えめ、左右同じ値）
          const browValue = mouthValue * 0.02;
          applyMorph('A01_Brow_Inner_Up', browValue);
          applyMorph('A04_Brow_Outer_Up_Left', browValue * 0.5);
          applyMorph('A05_Brow_Outer_Up_Right', browValue * 0.5);
          
          // デバッグ用ログ（5秒ごと）
          if (Math.floor(animationTime.current / 5) !== Math.floor((animationTime.current - delta) / 5)) {
            console.log('リップシンク状態:', {
              mouthValue: mouthValue.toFixed(3),
              currentWord,
              audioLevel,
              targetMouthOpen: targetMouthOpen.toFixed(3)
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
        }
      } else {
        // morphTargetDictionaryがない場合、インデックスベースで動作
        if (isSpeaking && currentMouthOpen.current > 0) {
          const mouthValue = Math.min(currentMouthOpen.current, 1.0);
          
          // すべてのモーフターゲットに小さな値を適用してテスト
          for (let i = 0; i < Math.min(influences.length, 100); i++) {
            // 瞬きのインデックスは除外
            if (i !== 8 && i !== 9 && i !== 14 && i !== 15) {
              influences[i] = mouthValue * 0.3;
            }
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

export default function StableLipSyncAvatar({
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
            currentWord={currentWord}
            currentPhoneme={currentPhoneme}
            speechProgress={speechProgress}
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
          <div>Stable Lip Sync</div>
          <div>Speaking: {isSpeaking ? 'Yes' : 'No'}</div>
          <div>Audio: {(audioLevel * 100).toFixed(0)}%</div>
          {currentWord && <div>Word: {currentWord}</div>}
        </div>
      )}
    </div>
  );
}

useGLTF.preload('/models/man-grey-suit-optimized.glb');