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

// Japanese phoneme to viseme mapping
const JAPANESE_TO_VISEME: { [key: string]: { mouth: number, jaw: number } } = {
  'あ': { mouth: 0.8, jaw: 0.7 },
  'い': { mouth: 0.3, jaw: 0.2 },
  'う': { mouth: 0.4, jaw: 0.3 },
  'え': { mouth: 0.5, jaw: 0.4 },
  'お': { mouth: 0.6, jaw: 0.5 },
  'か': { mouth: 0.4, jaw: 0.3 },
  'き': { mouth: 0.3, jaw: 0.2 },
  'く': { mouth: 0.4, jaw: 0.3 },
  'け': { mouth: 0.5, jaw: 0.4 },
  'こ': { mouth: 0.6, jaw: 0.5 },
  'さ': { mouth: 0.3, jaw: 0.2 },
  'し': { mouth: 0.3, jaw: 0.2 },
  'す': { mouth: 0.3, jaw: 0.2 },
  'せ': { mouth: 0.4, jaw: 0.3 },
  'そ': { mouth: 0.5, jaw: 0.4 },
  'た': { mouth: 0.3, jaw: 0.2 },
  'ち': { mouth: 0.3, jaw: 0.2 },
  'つ': { mouth: 0.3, jaw: 0.2 },
  'て': { mouth: 0.4, jaw: 0.3 },
  'と': { mouth: 0.5, jaw: 0.4 },
  'な': { mouth: 0.5, jaw: 0.4 },
  'に': { mouth: 0.3, jaw: 0.2 },
  'ぬ': { mouth: 0.4, jaw: 0.3 },
  'ね': { mouth: 0.4, jaw: 0.3 },
  'の': { mouth: 0.5, jaw: 0.4 },
  'は': { mouth: 0.6, jaw: 0.5 },
  'ひ': { mouth: 0.3, jaw: 0.2 },
  'ふ': { mouth: 0.3, jaw: 0.2 },
  'へ': { mouth: 0.4, jaw: 0.3 },
  'ほ': { mouth: 0.6, jaw: 0.5 },
  'ま': { mouth: 0.2, jaw: 0.1 },
  'み': { mouth: 0.2, jaw: 0.1 },
  'む': { mouth: 0.2, jaw: 0.1 },
  'め': { mouth: 0.3, jaw: 0.2 },
  'も': { mouth: 0.4, jaw: 0.3 },
  'や': { mouth: 0.5, jaw: 0.4 },
  'ゆ': { mouth: 0.3, jaw: 0.2 },
  'よ': { mouth: 0.5, jaw: 0.4 },
  'ら': { mouth: 0.5, jaw: 0.4 },
  'り': { mouth: 0.3, jaw: 0.2 },
  'る': { mouth: 0.4, jaw: 0.3 },
  'れ': { mouth: 0.4, jaw: 0.3 },
  'ろ': { mouth: 0.5, jaw: 0.4 },
  'わ': { mouth: 0.6, jaw: 0.5 },
  'を': { mouth: 0.5, jaw: 0.4 },
  'ん': { mouth: 0.1, jaw: 0.1 },
};

function AvatarModel({ isSpeaking, audioLevel = 0, currentWord = '' }: AvatarModelProps) {
  const group = useRef<THREE.Group>(null);
  const [morphMeshes, setMorphMeshes] = useState<any[]>([]);
  const [morphIndices, setMorphIndices] = useState<{
    eyeBlinkLeft: number,
    eyeBlinkRight: number,
    mouthOpen: number,
    jawOpen: number,
    mouthSmile: number,
    browInnerUp: number
  }>({ 
    eyeBlinkLeft: -1, 
    eyeBlinkRight: -1, 
    mouthOpen: -1, 
    jawOpen: -1, 
    mouthSmile: -1,
    browInnerUp: -1 
  });
  
  const animationTime = useRef(0);
  const blinkTimer = useRef(0);
  const nextBlinkTime = useRef(3 + Math.random() * 3);
  const isBlinking = useRef(false);
  const currentPhoneme = useRef({ mouth: 0, jaw: 0 });
  const targetPhoneme = useRef({ mouth: 0, jaw: 0 });
  
  // GLBファイルを読み込む
  const { scene } = useGLTF('/models/man-grey-suit-optimized.glb');
  
  useEffect(() => {
    if (!scene) return;
    
    const meshList: any[] = [];
    const indices = { 
      eyeBlinkLeft: -1, 
      eyeBlinkRight: -1, 
      mouthOpen: -1, 
      jawOpen: -1, 
      mouthSmile: -1,
      browInnerUp: -1 
    };
    
    // シーンを走査してモーフターゲットを持つメッシュを収集
    scene.traverse((child: any) => {
      if (child.isMesh || child.isSkinnedMesh) {
        // 基本的なメッシュ設定
        child.frustumCulled = true;
        child.castShadow = true;
        child.receiveShadow = true;
        
        // モーフターゲットを持つメッシュを収集
        if (child.morphTargetInfluences && child.morphTargetInfluences.length > 0) {
          meshList.push(child);
          
          // モーフターゲット辞書から正しいインデックスを探す
          if (child.morphTargetDictionary) {
            console.log(`Mesh: ${child.name}, Dictionary:`, child.morphTargetDictionary);
            
            // ARKit標準のブレンドシェイプ名を探す
            const searchKeys = {
              eyeBlinkLeft: ['eyeBlinkLeft', 'eyeBlink_L', 'eye_blink_left', 'EyeBlink_L'],
              eyeBlinkRight: ['eyeBlinkRight', 'eyeBlink_R', 'eye_blink_right', 'EyeBlink_R'],
              mouthOpen: ['mouthOpen', 'mouth_open', 'MouthOpen', 'jawOpen'],
              jawOpen: ['jawOpen', 'jaw_open', 'JawOpen', 'jawForward'],
              mouthSmile: ['mouthSmile', 'mouth_smile', 'MouthSmile', 'mouthSmileLeft'],
              browInnerUp: ['browInnerUp', 'brow_inner_up', 'BrowInnerUp', 'browDown_L']
            };
            
            Object.entries(searchKeys).forEach(([key, searchTerms]) => {
              for (const term of searchTerms) {
                if (child.morphTargetDictionary[term] !== undefined) {
                  indices[key as keyof typeof indices] = child.morphTargetDictionary[term];
                  console.log(`Found ${key}: ${term} at index ${child.morphTargetDictionary[term]}`);
                  break;
                }
              }
            });
          }
        }
        
        // マテリアルの基本設定
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
    
    setMorphMeshes(meshList);
    setMorphIndices(indices);
    
    console.log('Morph indices found:', indices);
  }, [scene]);
  
  // 日本語の文字から現在の音素を取得
  useEffect(() => {
    if (currentWord && currentWord.length > 0) {
      const char = currentWord[currentWord.length - 1];
      const viseme = JAPANESE_TO_VISEME[char];
      if (viseme) {
        targetPhoneme.current = viseme;
      }
    } else {
      targetPhoneme.current = { mouth: 0, jaw: 0 };
    }
  }, [currentWord]);
  
  // アニメーションループ
  useFrame((state, delta) => {
    if (!group.current) return;
    
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
    
    // 頭の自然な動き（非常に控えめ）
    group.current.rotation.y = Math.sin(time * 0.3) * 0.003;
    group.current.rotation.x = Math.sin(time * 0.5) * 0.002;
    group.current.position.y = Math.sin(time * 0.8) * 0.001;
    
    // 音素の補間
    const lerpSpeed = 10 * delta;
    currentPhoneme.current.mouth += (targetPhoneme.current.mouth - currentPhoneme.current.mouth) * lerpSpeed;
    currentPhoneme.current.jaw += (targetPhoneme.current.jaw - currentPhoneme.current.jaw) * lerpSpeed;
    
    // リップシンクアニメーション
    morphMeshes.forEach((mesh) => {
      if (!mesh.morphTargetInfluences) return;
      
      const influences = mesh.morphTargetInfluences;
      
      // すべてのインフルエンスをリセット
      for (let i = 0; i < influences.length; i++) {
        influences[i] = 0;
      }
      
      // モーフターゲット辞書を使用
      if (mesh.morphTargetDictionary) {
        const applyMorph = (name: string, value: number) => {
          const index = mesh.morphTargetDictionary[name];
          if (index !== undefined && index < influences.length) {
            influences[index] = value;
          }
        };
        
        // 瞬き
        applyMorph('eyeBlinkLeft', blinkValue);
        applyMorph('eyeBlinkRight', blinkValue);
        applyMorph('eyeBlink_L', blinkValue);
        applyMorph('eyeBlink_R', blinkValue);
        
        if (isSpeaking) {
          const effectiveLevel = audioLevel || 0.5;
          
          // 音素ベースの口の動き
          const mouthOpen = currentPhoneme.current.mouth * effectiveLevel;
          const jawOpen = currentPhoneme.current.jaw * effectiveLevel;
          
          // 音声レベルによる微細な振動
          const vibration = Math.sin(animationTime.current * 10) * effectiveLevel * 0.1;
          
          // 口のアニメーション
          applyMorph('mouthOpen', mouthOpen + vibration);
          applyMorph('jawOpen', jawOpen);
          applyMorph('jawForward', jawOpen * 0.3);
          applyMorph('mouthSmile', Math.sin(animationTime.current * 3) * 0.05);
          applyMorph('mouthSmileLeft', Math.sin(animationTime.current * 3) * 0.05);
          applyMorph('mouthSmileRight', Math.sin(animationTime.current * 3) * 0.05);
          
          // 代替名称
          applyMorph('mouth_open', mouthOpen + vibration);
          applyMorph('jaw_open', jawOpen);
        }
      } else if (morphIndices.mouthOpen >= 0) {
        // 辞書がない場合は発見したインデックスを使用
        if (morphIndices.eyeBlinkLeft >= 0) influences[morphIndices.eyeBlinkLeft] = blinkValue;
        if (morphIndices.eyeBlinkRight >= 0) influences[morphIndices.eyeBlinkRight] = blinkValue;
        
        if (isSpeaking) {
          const effectiveLevel = audioLevel || 0.5;
          const mouthOpen = currentPhoneme.current.mouth * effectiveLevel;
          const jawOpen = currentPhoneme.current.jaw * effectiveLevel;
          const vibration = Math.sin(animationTime.current * 10) * effectiveLevel * 0.1;
          
          if (morphIndices.mouthOpen >= 0) influences[morphIndices.mouthOpen] = mouthOpen + vibration;
          if (morphIndices.jawOpen >= 0) influences[morphIndices.jawOpen] = jawOpen;
          if (morphIndices.mouthSmile >= 0) influences[morphIndices.mouthSmile] = Math.sin(animationTime.current * 3) * 0.05;
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
        <div className="text-lg font-semibold">Loading...</div>
        <div className="text-sm text-gray-600">{progress.toFixed(0)}%</div>
      </div>
    </Html>
  );
}

export default function ImprovedLipSyncAvatar({
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
        {/* ライティング設定 */}
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
        
        {/* 背景色を白に設定 */}
        <color attach="background" args={['#ffffff']} />
      </Canvas>
      
      {showDebug && (
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs p-2 rounded">
          <div>Speaking: {isSpeaking ? 'Yes' : 'No'}</div>
          <div>Audio Level: {(audioLevel * 100).toFixed(0)}%</div>
          <div>Current Word: {currentWord}</div>
        </div>
      )}
    </div>
  );
}

// GLBファイルをプリロード
useGLTF.preload('/models/man-grey-suit-optimized.glb');