'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';

// 表情プリセット
const EXPRESSION_PRESETS = {
  neutral: { name: '😐 通常', morphs: {} },
  happy: { 
    name: '😊 喜び', 
    morphs: {
      'A38_Mouth_Smile_Left': 0.8,
      'A39_Mouth_Smile_Right': 0.8,
      'A01_Brow_Inner_Up': 0.3,
      'A06_Eye_Squint_Left': 0.3,
      'A07_Eye_Squint_Right': 0.3,
      'A20_Cheek_Puff': 0.2
    }
  },
  sad: {
    name: '😢 悲しみ',
    morphs: {
      'A02_Brow_Down_Left': 0.5,
      'A03_Brow_Down_Right': 0.5,
      'A01_Brow_Inner_Up': 0.6,
      'A31_Mouth_Frown_Left': 0.6,
      'A32_Mouth_Frown_Right': 0.6,
      'A16_Eye_Wide_Left': 0.2,
      'A17_Eye_Wide_Right': 0.2
    }
  },
  angry: {
    name: '😠 怒り',
    morphs: {
      'A02_Brow_Down_Left': 0.8,
      'A03_Brow_Down_Right': 0.8,
      'A04_Brow_Outer_Up_Left': 0.3,
      'A05_Brow_Outer_Up_Right': 0.3,
      'A25_Jaw_Open': 0.3,
      'A31_Mouth_Frown_Left': 0.5,
      'A32_Mouth_Frown_Right': 0.5,
      'A23_Nose_Sneer_Left': 0.4,
      'A24_Nose_Sneer_Right': 0.4
    }
  },
  surprised: {
    name: '😲 驚き',
    morphs: {
      'A01_Brow_Inner_Up': 0.8,
      'A04_Brow_Outer_Up_Left': 0.7,
      'A05_Brow_Outer_Up_Right': 0.7,
      'A16_Eye_Wide_Left': 0.8,
      'A17_Eye_Wide_Right': 0.8,
      'A25_Jaw_Open': 0.5,
      'Mouth_Open': 0.6
    }
  },
  disgusted: {
    name: '🤢 嫌悪',
    morphs: {
      'A23_Nose_Sneer_Left': 0.7,
      'A24_Nose_Sneer_Right': 0.7,
      'A02_Brow_Down_Left': 0.3,
      'A03_Brow_Down_Right': 0.3,
      'A44_Mouth_Upper_Up_Left': 0.5,
      'A45_Mouth_Upper_Up_Right': 0.5,
      'A31_Mouth_Frown_Left': 0.4,
      'A32_Mouth_Frown_Right': 0.4
    }
  },
  pain: {
    name: '😣 痛み',
    morphs: {
      'A02_Brow_Down_Left': 0.6,
      'A03_Brow_Down_Right': 0.6,
      'A01_Brow_Inner_Up': 0.7,
      'A14_Eye_Blink_Left': 0.5,
      'A15_Eye_Blink_Right': 0.5,
      'A25_Jaw_Open': 0.2,
      'A50_Mouth_Stretch_Left': 0.4,
      'A51_Mouth_Stretch_Right': 0.4,
      'A31_Mouth_Frown_Left': 0.3,
      'A32_Mouth_Frown_Right': 0.3
    }
  },
  fear: {
    name: '😰 恐怖',
    morphs: {
      'A01_Brow_Inner_Up': 0.9,
      'A04_Brow_Outer_Up_Left': 0.4,
      'A05_Brow_Outer_Up_Right': 0.4,
      'A16_Eye_Wide_Left': 0.9,
      'A17_Eye_Wide_Right': 0.9,
      'A25_Jaw_Open': 0.3,
      'A50_Mouth_Stretch_Left': 0.5,
      'A51_Mouth_Stretch_Right': 0.5
    }
  }
};

// 音素プリセット
const PHONEME_PRESETS = {
  a: { name: 'あ', morphs: { 'A25_Jaw_Open': 0.5, 'V_Open': 0.4, 'Mouth_Open': 0.35 } },
  i: { name: 'い', morphs: { 'A25_Jaw_Open': 0.15, 'V_Wide': 0.5, 'A50_Mouth_Stretch_Left': 0.4, 'A51_Mouth_Stretch_Right': 0.4 } },
  u: { name: 'う', morphs: { 'A25_Jaw_Open': 0.2, 'A30_Mouth_Pucker': 0.5, 'A29_Mouth_Funnel': 0.3 } },
  e: { name: 'え', morphs: { 'A25_Jaw_Open': 0.35, 'V_Wide': 0.3, 'Mouth_Open': 0.25 } },
  o: { name: 'お', morphs: { 'A25_Jaw_Open': 0.35, 'V_Open': 0.25, 'A29_Mouth_Funnel': 0.3 } }
};

function AvatarModel({ 
  modelPath, 
  expression, 
  customMorphs,
  showWireframe,
  onMorphListUpdate
}: { 
  modelPath: string; 
  expression: string;
  customMorphs: { [key: string]: number };
  showWireframe: boolean;
  onMorphListUpdate?: (morphs: string[]) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const [morphTargets, setMorphTargets] = useState<any[]>([]);
  const { scene } = useGLTF(modelPath);

  // モーフターゲットの初期化とテクスチャ適用
  useEffect(() => {
    const meshes: any[] = [];
    const allMorphNames = new Set<string>();
    const meshInfo: any[] = [];
    
    scene.traverse((child: any) => {
      if (child.isMesh || child.isSkinnedMesh) {
        // メッシュ情報を収集
        const info: any = {
          name: child.name,
          type: child.type,
          materialName: child.material?.name || 'unnamed',
          vertexCount: child.geometry?.attributes?.position?.count || 0,
          hasMorphTargets: !!child.morphTargetInfluences
        };
        
        if (child.morphTargetInfluences && child.morphTargetDictionary) {
          meshes.push(child);
          info.morphTargets = Object.keys(child.morphTargetDictionary);
          console.log('モーフターゲット付きメッシュ発見:', child.name);
          console.log('  利用可能なモーフ:', Object.keys(child.morphTargetDictionary));
          
          // すべてのモーフ名を収集
          Object.keys(child.morphTargetDictionary).forEach(name => {
            allMorphNames.add(name);
          });
        }
        
        meshInfo.push(info);
      }
    });
    
    // 女性アバターの場合、メッシュ情報をコンソールに出力
    if (modelPath.includes('Hayden')) {
      console.log('=== 女性アバター メッシュ分析 ===');
      console.log('メッシュ総数:', meshInfo.length);
      meshInfo.forEach((info, index) => {
        console.log(`メッシュ ${index + 1}:`, info);
      });
      
      // グローバル変数に保存（JSON出力用）
      (window as any).femaleAvatarMeshInfo = meshInfo;
    }
    
    setMorphTargets(meshes);
    console.log(`総モーフメッシュ数: ${meshes.length}`);
    console.log('利用可能なモーフ総数:', allMorphNames.size);
    
    // 親コンポーネントに利用可能なモーフリストを通知
    if (onMorphListUpdate) {
      onMorphListUpdate(Array.from(allMorphNames).sort());
    }
    
    // 少年アバターのテクスチャ適用
    const textureAppliedKey = `texture_applied_${modelPath}`;
    if (modelPath.includes('少年アバター') && !scene.userData[textureAppliedKey]) {
      scene.userData[textureAppliedKey] = true;
      import('@/utils/applyBoyAvatarTextures').then(async ({ applyBoyAvatarTextures }) => {
        // Avatar analyzer ではログを無効化（分析用途のため）
        await applyBoyAvatarTextures(scene, false);
      });
    } else if (modelPath.includes('少年改') && !scene.userData[textureAppliedKey]) {
      scene.userData[textureAppliedKey] = true;
      import('@/utils/applyClassicManTexturesImproved').then(async ({ applyClassicManTexturesImproved }) => {
        await applyClassicManTexturesImproved(scene);
        console.log('avatar-analyzer: 少年改アバターのテクスチャを適用しました');
      });
    } else if (modelPath.includes('Hayden') && !scene.userData[textureAppliedKey]) {
      scene.userData[textureAppliedKey] = true;
      // テクスチャ適用を一時的に無効化
      console.log('avatar-analyzer: 女性アバターのテクスチャ適用をスキップ（デバッグ用）');
      /*
      import('@/utils/applyFemaleAvatarTextures').then(async ({ applyFemaleAvatarTextures }) => {
        await applyFemaleAvatarTextures(scene, true);
        console.log('avatar-analyzer: 女性アバターのテクスチャを適用しました');
      });
      */
    }
  }, [scene, modelPath]);

  useFrame(() => {
    if (!group.current) return;

    // 表情プリセットまたはカスタムモーフを適用
    const targetMorphs = expression !== 'custom' 
      ? EXPRESSION_PRESETS[expression as keyof typeof EXPRESSION_PRESETS]?.morphs || {}
      : customMorphs;

    morphTargets.forEach((mesh) => {
      if (!mesh.morphTargetInfluences || !mesh.morphTargetDictionary) return;
      
      const influences = mesh.morphTargetInfluences;
      
      // すべてのモーフをリセット
      for (let i = 0; i < influences.length; i++) {
        influences[i] = 0;
      }
      
      // ターゲットモーフを適用
      Object.entries(targetMorphs).forEach(([morphName, value]) => {
        const index = mesh.morphTargetDictionary[morphName];
        if (index !== undefined && index < influences.length) {
          influences[index] = Math.min(value as number, 0.8); // 最大値制限
        }
      });
    });

    // 微細な頭の動き
    group.current.rotation.y = Math.sin(Date.now() * 0.0003) * 0.01;
    group.current.rotation.x = Math.sin(Date.now() * 0.0005) * 0.005;
  });

  // ワイヤーフレーム設定
  scene.traverse((child: any) => {
    if (child.isMesh || child.isSkinnedMesh) {
      child.material.wireframe = showWireframe;
    }
  });

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

export default function FacialExpressionAnalyzer() {
  const [selectedAvatar, setSelectedAvatar] = useState<'adult' | 'boy' | 'boy_improved' | 'female'>('boy_improved');
  const [selectedExpression, setSelectedExpression] = useState('neutral');
  const [customMorphs, setCustomMorphs] = useState<{ [key: string]: number }>({});
  const [showWireframe, setShowWireframe] = useState(false);
  const [activeTab, setActiveTab] = useState<'preset' | 'custom' | 'phoneme'>('preset');
  const [morphList, setMorphList] = useState<string[]>([]);

  const modelPath = 
    selectedAvatar === 'adult' ? '/models/成人男性.glb' :
    selectedAvatar === 'boy' ? '/models/少年アバター.glb' :
    selectedAvatar === 'boy_improved' ? '/models/少年改アバター.glb' :
    '/models/Hayden_059d-NO-GUI.glb';

  // 共通のモーフターゲット名（ARKit準拠）
  const commonMorphTargets = [
    // 眉
    'A01_Brow_Inner_Up', 'A02_Brow_Down_Left', 'A03_Brow_Down_Right',
    'A04_Brow_Outer_Up_Left', 'A05_Brow_Outer_Up_Right',
    // 目
    'A06_Eye_Squint_Left', 'A07_Eye_Squint_Right', 'A08_Eye_Wide_Left', 
    'A09_Eye_Wide_Right', 'A14_Eye_Blink_Left', 'A15_Eye_Blink_Right',
    'A16_Eye_Wide_Left', 'A17_Eye_Wide_Right',
    // 鼻
    'A23_Nose_Sneer_Left', 'A24_Nose_Sneer_Right',
    // 頬
    'A20_Cheek_Puff', 'A21_Cheek_Squint_Left', 'A22_Cheek_Squint_Right',
    // 口
    'A25_Jaw_Open', 'A29_Mouth_Funnel', 'A30_Mouth_Pucker',
    'A31_Mouth_Frown_Left', 'A32_Mouth_Frown_Right',
    'A38_Mouth_Smile_Left', 'A39_Mouth_Smile_Right',
    'A44_Mouth_Upper_Up_Left', 'A45_Mouth_Upper_Up_Right',
    'A46_Mouth_Lower_Down_Left', 'A47_Mouth_Lower_Down_Right',
    'A50_Mouth_Stretch_Left', 'A51_Mouth_Stretch_Right',
    // Viseme
    'V_Open', 'V_Wide', 'V_Tight_O', 'Mouth_Open', 'Mouth_Pucker', 'Mouth_Widen'
  ];

  const handleMorphChange = (morphName: string, value: number) => {
    setCustomMorphs(prev => ({
      ...prev,
      [morphName]: value
    }));
    setSelectedExpression('custom');
  };

  const resetMorphs = () => {
    setCustomMorphs({});
    setSelectedExpression('neutral');
  };

  const applyPhoneme = (phoneme: keyof typeof PHONEME_PRESETS) => {
    setCustomMorphs(PHONEME_PRESETS[phoneme].morphs);
    setSelectedExpression('custom');
  };

  const exportToJSON = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      avatar: selectedAvatar,
      expression: selectedExpression,
      morphTargets: customMorphs,
      metadata: {
        totalMorphs: Object.keys(customMorphs).length,
        activeMorphs: Object.entries(customMorphs).filter(([_, value]) => value > 0).length,
        maxValue: Math.max(...Object.values(customMorphs), 0)
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expression_${selectedAvatar}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportMeshInfoToJSON = () => {
    const meshInfo = (window as any).femaleAvatarMeshInfo;
    if (!meshInfo) {
      alert('女性アバターを選択してメッシュ情報を読み込んでください');
      return;
    }

    const exportData = {
      timestamp: new Date().toISOString(),
      avatar: selectedAvatar,
      modelPath: modelPath,
      meshCount: meshInfo.length,
      meshes: meshInfo,
      summary: {
        totalMeshes: meshInfo.length,
        meshesWithMorphTargets: meshInfo.filter((m: any) => m.hasMorphTargets).length,
        totalVertices: meshInfo.reduce((sum: number, m: any) => sum + m.vertexCount, 0),
        uniqueMaterials: Array.from(new Set(meshInfo.map((m: any) => m.materialName))),
        allMorphTargets: Array.from(new Set(meshInfo.flatMap((m: any) => m.morphTargets || [])))
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mesh_info_${selectedAvatar}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 全ての表情とモーフターゲット情報を一括出力
  const exportFullAnalysis = () => {
    const fullAnalysisData = {
      timestamp: new Date().toISOString(),
      avatar: {
        current: selectedAvatar,
        available: ['adult', 'boy', 'boy_improved', 'female']
      },
      availableMorphTargets: morphList,
      morphTargetCount: morphList.length,
      expressionPresets: Object.entries(EXPRESSION_PRESETS).map(([key, preset]) => ({
        id: key,
        name: preset.name,
        morphs: preset.morphs,
        morphCount: Object.keys(preset.morphs).length
      })),
      phonemePresets: Object.entries(PHONEME_PRESETS).map(([key, preset]) => ({
        id: key,
        name: preset.name,
        morphs: preset.morphs,
        morphCount: Object.keys(preset.morphs).length
      })),
      currentState: {
        expression: selectedExpression,
        customMorphs: customMorphs,
        activeMorphs: Object.entries(customMorphs).filter(([_, value]) => value > 0).map(([key, value]) => ({
          name: key,
          value: value
        }))
      },
      commonMorphTargets: commonMorphTargets,
      statistics: {
        totalPresetExpressions: Object.keys(EXPRESSION_PRESETS).length,
        totalPhonemes: Object.keys(PHONEME_PRESETS).length,
        totalCommonMorphs: commonMorphTargets.length,
        totalAvailableMorphs: morphList.length,
        currentActiveMorphs: Object.entries(customMorphs).filter(([_, value]) => value > 0).length
      }
    };

    const blob = new Blob([JSON.stringify(fullAnalysisData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `full_expression_analysis_${selectedAvatar}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // ユーザーへの通知
    console.log('表情分析データを出力しました:', fullAnalysisData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          表情アニメーション コントローラー
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側：3Dビューア */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-cyan-400">3Dプレビュー</h2>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showWireframe}
                  onChange={(e) => setShowWireframe(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">ワイヤーフレーム</span>
              </label>
            </div>
            
            {/* アバター選択 */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <button
                onClick={() => setSelectedAvatar('boy_improved')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedAvatar === 'boy_improved'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                青年改
              </button>
              <button
                onClick={() => setSelectedAvatar('boy')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedAvatar === 'boy'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                青年
              </button>
              <button
                onClick={() => setSelectedAvatar('adult')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedAvatar === 'adult'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                成人男性
              </button>
              <button
                onClick={() => setSelectedAvatar('female')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedAvatar === 'female'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                女性
              </button>
            </div>

            <div className="h-[500px] bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl overflow-hidden">
              <Canvas 
                camera={{ 
                  position: selectedAvatar.includes('boy') ? [0, 1.5, 1.8] : [0, 1.6, 1.5], 
                  fov: selectedAvatar.includes('boy') ? 28 : 25 
                }}
              >
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={0.5} />
                <directionalLight position={[-5, 5, -5]} intensity={0.3} />
                <Suspense fallback={null}>
                  <AvatarModel 
                    modelPath={modelPath}
                    expression={selectedExpression}
                    customMorphs={customMorphs}
                    showWireframe={showWireframe}
                    onMorphListUpdate={(morphs) => setMorphList(morphs)}
                  />
                  <Environment preset="studio" />
                </Suspense>
                <OrbitControls 
                  target={selectedAvatar.includes('boy') ? [0, 1.5, 0] : [0, 1.6, 0]}
                  enablePan={false}
                  maxDistance={3}
                  minDistance={0.5}
                />
              </Canvas>
            </div>
          </div>

          {/* 右側：コントロールパネル */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-cyan-400">表情コントロール</h2>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={exportToJSON}
                  className="px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg flex items-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  現在の状態
                </button>
                <button
                  onClick={exportFullAnalysis}
                  className="px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg flex items-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  完全分析
                </button>
                {selectedAvatar === 'female' && (
                  <button
                    onClick={exportMeshInfoToJSON}
                    className="px-3 py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg hover:from-pink-600 hover:to-rose-700 transition-all shadow-lg flex items-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                    メッシュ情報
                  </button>
                )}
              </div>
            </div>
            
            {/* タブ切り替え */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('preset')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'preset'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                プリセット表情
              </button>
              <button
                onClick={() => setActiveTab('phoneme')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'phoneme'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                音素
              </button>
              <button
                onClick={() => setActiveTab('custom')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'custom'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                カスタム
              </button>
            </div>

            {/* プリセット表情タブ */}
            {activeTab === 'preset' && (
              <div className="space-y-3">
                <h3 className="text-lg text-gray-300 mb-2">基本表情を選択</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(EXPRESSION_PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedExpression(key)}
                      className={`px-4 py-3 rounded-lg font-medium transition-all ${
                        selectedExpression === key
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 音素タブ */}
            {activeTab === 'phoneme' && (
              <div className="space-y-3">
                <h3 className="text-lg text-gray-300 mb-2">日本語音素</h3>
                <div className="grid grid-cols-5 gap-3">
                  {Object.entries(PHONEME_PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => applyPhoneme(key as keyof typeof PHONEME_PRESETS)}
                      className="px-4 py-3 bg-green-700 hover:bg-green-600 text-white rounded-lg font-bold text-lg transition-all"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-300">
                    音素ボタンをクリックして、リップシンクの基本形を確認できます。
                    これらは日本語の母音に対応した口の形です。
                  </p>
                </div>
              </div>
            )}

            {/* カスタムタブ */}
            {activeTab === 'custom' && (
              <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg text-gray-300">詳細調整</h3>
                  <button
                    onClick={resetMorphs}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                  >
                    リセット
                  </button>
                </div>
                
                {/* 眉 */}
                <div className="bg-gray-700 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-yellow-400 mb-2">🤨 眉</h4>
                  {['A01_Brow_Inner_Up', 'A02_Brow_Down_Left', 'A03_Brow_Down_Right', 
                    'A04_Brow_Outer_Up_Left', 'A05_Brow_Outer_Up_Right'].map(morph => (
                    <div key={morph} className="mb-2">
                      <label className="text-xs text-gray-400">{morph}</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={customMorphs[morph] || 0}
                        onChange={(e) => handleMorphChange(morph, parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>

                {/* 目 */}
                <div className="bg-gray-700 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-blue-400 mb-2">👁️ 目</h4>
                  {['A14_Eye_Blink_Left', 'A15_Eye_Blink_Right', 'A16_Eye_Wide_Left', 
                    'A17_Eye_Wide_Right', 'A06_Eye_Squint_Left', 'A07_Eye_Squint_Right'].map(morph => (
                    <div key={morph} className="mb-2">
                      <label className="text-xs text-gray-400">{morph}</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={customMorphs[morph] || 0}
                        onChange={(e) => handleMorphChange(morph, parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>

                {/* 口 */}
                <div className="bg-gray-700 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-orange-400 mb-2">👄 口</h4>
                  {['A25_Jaw_Open', 'Mouth_Open', 'A38_Mouth_Smile_Left', 'A39_Mouth_Smile_Right',
                    'A31_Mouth_Frown_Left', 'A32_Mouth_Frown_Right', 'A30_Mouth_Pucker',
                    'A50_Mouth_Stretch_Left', 'A51_Mouth_Stretch_Right'].map(morph => (
                    <div key={morph} className="mb-2">
                      <label className="text-xs text-gray-400">{morph}</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={customMorphs[morph] || 0}
                        onChange={(e) => handleMorphChange(morph, parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>

                {/* 鼻・頬 */}
                <div className="bg-gray-700 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-pink-400 mb-2">😊 鼻・頬</h4>
                  {['A23_Nose_Sneer_Left', 'A24_Nose_Sneer_Right', 'A20_Cheek_Puff'].map(morph => (
                    <div key={morph} className="mb-2">
                      <label className="text-xs text-gray-400">{morph}</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={customMorphs[morph] || 0}
                        onChange={(e) => handleMorphChange(morph, parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 利用可能なモーフターゲット一覧 */}
            {activeTab === 'custom' && morphList.length > 0 && (
              <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                <h4 className="text-sm font-semibold text-yellow-400 mb-2">
                  利用可能なモーフ ({morphList.length}個):
                </h4>
                <div className="text-xs font-mono text-gray-400 max-h-40 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-1">
                    {morphList.map(morph => (
                      <div key={morph} className="truncate">{morph}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* 現在の値表示 */}
            {selectedExpression === 'custom' && Object.keys(customMorphs).length > 0 && (
              <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">現在の値:</h4>
                <div className="text-xs font-mono text-gray-400 max-h-32 overflow-y-auto">
                  {Object.entries(customMorphs)
                    .filter(([_, value]) => value > 0)
                    .map(([key, value]) => (
                      <div key={key}>
                        {key}: {value.toFixed(2)}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 説明セクション */}
        <div className="mt-8 bg-gray-800 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-xl font-semibold text-cyan-400 mb-4">使い方</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">1. アバターを選択</h3>
              <p>左側のプレビューエリアで、成人男性または青年のアバターを選択できます。</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">2. 表情を選択</h3>
              <p>プリセット表情から選ぶか、カスタムタブで細かく調整できます。</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">3. プレビューを確認</h3>
              <p>3Dビューでマウスドラッグして角度を変えながら表情を確認できます。</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">4. データをエクスポート</h3>
              <p>「現在の状態」で今の表情を、「完全分析」で全データをJSON形式で保存できます。</p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-gray-700 rounded-lg">
            <h3 className="font-semibold text-yellow-400 mb-2">📊 エクスポート機能</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-white font-medium mb-1">「現在の状態」ボタン</h4>
                <p className="text-xs">現在設定中の表情とモーフターゲット値をエクスポート</p>
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">「完全分析」ボタン</h4>
                <p className="text-xs">利用可能な全モーフターゲット、プリセット、音素マッピング等の包括的データをエクスポート</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// モデルのプリロード
useGLTF.preload('/models/成人男性.glb');
useGLTF.preload('/models/少年アバター.glb');
useGLTF.preload('/models/少年改アバター.glb');