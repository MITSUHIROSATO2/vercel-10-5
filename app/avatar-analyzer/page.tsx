'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { applyMotherAvatarTextures } from '@/utils/applyMotherAvatarTextures';

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

// 日本語音素プリセット
const PHONEME_PRESETS_JP = {
  a: { name: 'あ', morphs: { 'A25_Jaw_Open': 0.5, 'V_Open': 0.4, 'Mouth_Open': 0.35 } },
  i: { name: 'い', morphs: { 'A25_Jaw_Open': 0.15, 'V_Wide': 0.5, 'A50_Mouth_Stretch_Left': 0.4, 'A51_Mouth_Stretch_Right': 0.4 } },
  u: { name: 'う', morphs: { 'A25_Jaw_Open': 0.2, 'A30_Mouth_Pucker': 0.5, 'A29_Mouth_Funnel': 0.3 } },
  e: { name: 'え', morphs: { 'A25_Jaw_Open': 0.35, 'V_Wide': 0.3, 'Mouth_Open': 0.25 } },
  o: { name: 'お', morphs: { 'A25_Jaw_Open': 0.35, 'V_Open': 0.25, 'A29_Mouth_Funnel': 0.3 } }
};

// 英語音素プリセット（拡張版）
const PHONEME_PRESETS_EN = {
  // 母音
  AA: { name: 'AA (father)', morphs: { 'A25_Jaw_Open': 0.6, 'V_Open': 0.5, 'Mouth_Open': 0.45 } },
  AE: { name: 'AE (cat)', morphs: { 'A25_Jaw_Open': 0.5, 'V_Wide': 0.4, 'A50_Mouth_Stretch_Left': 0.3, 'A51_Mouth_Stretch_Right': 0.3 } },
  AH: { name: 'AH (but)', morphs: { 'A25_Jaw_Open': 0.35, 'V_Open': 0.3, 'Mouth_Open': 0.25 } },
  AO: { name: 'AO (dog)', morphs: { 'A25_Jaw_Open': 0.45, 'V_Open': 0.35, 'A29_Mouth_Funnel': 0.25 } },
  AW: { name: 'AW (how)', morphs: { 'A25_Jaw_Open': 0.5, 'A30_Mouth_Pucker': 0.4, 'A29_Mouth_Funnel': 0.35 } },
  AY: { name: 'AY (hide)', morphs: { 'A25_Jaw_Open': 0.4, 'V_Wide': 0.35, 'A50_Mouth_Stretch_Left': 0.25, 'A51_Mouth_Stretch_Right': 0.25 } },
  EH: { name: 'EH (bed)', morphs: { 'A25_Jaw_Open': 0.3, 'V_Wide': 0.25, 'Mouth_Open': 0.2 } },
  ER: { name: 'ER (her)', morphs: { 'A25_Jaw_Open': 0.25, 'A30_Mouth_Pucker': 0.3, 'V_Tight_O': 0.2 } },
  EY: { name: 'EY (take)', morphs: { 'A25_Jaw_Open': 0.2, 'V_Wide': 0.45, 'A50_Mouth_Stretch_Left': 0.35, 'A51_Mouth_Stretch_Right': 0.35 } },
  IH: { name: 'IH (it)', morphs: { 'A25_Jaw_Open': 0.15, 'V_Wide': 0.35, 'A50_Mouth_Stretch_Left': 0.25, 'A51_Mouth_Stretch_Right': 0.25 } },
  IY: { name: 'IY (eat)', morphs: { 'A25_Jaw_Open': 0.1, 'V_Wide': 0.6, 'A50_Mouth_Stretch_Left': 0.5, 'A51_Mouth_Stretch_Right': 0.5 } },
  OW: { name: 'OW (go)', morphs: { 'A25_Jaw_Open': 0.3, 'A30_Mouth_Pucker': 0.5, 'A29_Mouth_Funnel': 0.4 } },
  OY: { name: 'OY (toy)', morphs: { 'A25_Jaw_Open': 0.35, 'A30_Mouth_Pucker': 0.35, 'V_Wide': 0.2 } },
  UH: { name: 'UH (hood)', morphs: { 'A25_Jaw_Open': 0.2, 'A30_Mouth_Pucker': 0.35, 'V_Tight_O': 0.25 } },
  UW: { name: 'UW (two)', morphs: { 'A25_Jaw_Open': 0.15, 'A30_Mouth_Pucker': 0.6, 'A29_Mouth_Funnel': 0.5 } },

  // 子音
  B: { name: 'B', morphs: { 'A25_Jaw_Open': 0.05, 'A44_Mouth_Upper_Up_Left': 0.1, 'A45_Mouth_Upper_Up_Right': 0.1 } },
  CH: { name: 'CH', morphs: { 'A25_Jaw_Open': 0.15, 'A30_Mouth_Pucker': 0.25, 'V_Tight_O': 0.15 } },
  D: { name: 'D', morphs: { 'A25_Jaw_Open': 0.1, 'V_Wide': 0.15, 'Mouth_Open': 0.08 } },
  DH: { name: 'DH (the)', morphs: { 'A25_Jaw_Open': 0.12, 'V_Wide': 0.2, 'Mouth_Open': 0.1 } },
  F: { name: 'F', morphs: { 'A25_Jaw_Open': 0.08, 'A44_Mouth_Upper_Up_Left': 0.15, 'A45_Mouth_Upper_Up_Right': 0.15 } },
  G: { name: 'G', morphs: { 'A25_Jaw_Open': 0.15, 'V_Open': 0.1, 'Mouth_Open': 0.12 } },
  HH: { name: 'HH', morphs: { 'A25_Jaw_Open': 0.2, 'V_Open': 0.15, 'Mouth_Open': 0.15 } },
  JH: { name: 'JH', morphs: { 'A25_Jaw_Open': 0.15, 'A30_Mouth_Pucker': 0.3, 'V_Tight_O': 0.2 } },
  K: { name: 'K', morphs: { 'A25_Jaw_Open': 0.12, 'V_Open': 0.08, 'Mouth_Open': 0.1 } },
  L: { name: 'L', morphs: { 'A25_Jaw_Open': 0.18, 'V_Wide': 0.25, 'Mouth_Open': 0.15 } },
  M: { name: 'M', morphs: { 'A25_Jaw_Open': 0.02, 'A44_Mouth_Upper_Up_Left': 0.05, 'A45_Mouth_Upper_Up_Right': 0.05 } },
  N: { name: 'N', morphs: { 'A25_Jaw_Open': 0.08, 'V_Wide': 0.1, 'Mouth_Open': 0.05 } },
  NG: { name: 'NG', morphs: { 'A25_Jaw_Open': 0.1, 'V_Open': 0.12, 'Mouth_Open': 0.08 } },
  P: { name: 'P', morphs: { 'A25_Jaw_Open': 0.03, 'A44_Mouth_Upper_Up_Left': 0.08, 'A45_Mouth_Upper_Up_Right': 0.08 } },
  R: { name: 'R', morphs: { 'A25_Jaw_Open': 0.2, 'A30_Mouth_Pucker': 0.25, 'V_Tight_O': 0.18 } },
  S: { name: 'S', morphs: { 'A25_Jaw_Open': 0.1, 'V_Wide': 0.3, 'A50_Mouth_Stretch_Left': 0.2, 'A51_Mouth_Stretch_Right': 0.2 } },
  SH: { name: 'SH', morphs: { 'A25_Jaw_Open': 0.12, 'A30_Mouth_Pucker': 0.35, 'V_Tight_O': 0.25 } },
  T: { name: 'T', morphs: { 'A25_Jaw_Open': 0.08, 'V_Wide': 0.12, 'Mouth_Open': 0.06 } },
  TH: { name: 'TH', morphs: { 'A25_Jaw_Open': 0.1, 'V_Wide': 0.18, 'Mouth_Open': 0.08 } },
  V: { name: 'V', morphs: { 'A25_Jaw_Open': 0.1, 'A44_Mouth_Upper_Up_Left': 0.12, 'A45_Mouth_Upper_Up_Right': 0.12 } },
  W: { name: 'W', morphs: { 'A25_Jaw_Open': 0.12, 'A30_Mouth_Pucker': 0.45, 'A29_Mouth_Funnel': 0.35 } },
  Y: { name: 'Y', morphs: { 'A25_Jaw_Open': 0.15, 'V_Wide': 0.4, 'A50_Mouth_Stretch_Left': 0.3, 'A51_Mouth_Stretch_Right': 0.3 } },
  Z: { name: 'Z', morphs: { 'A25_Jaw_Open': 0.12, 'V_Wide': 0.25, 'A50_Mouth_Stretch_Left': 0.18, 'A51_Mouth_Stretch_Right': 0.18 } },
  ZH: { name: 'ZH', morphs: { 'A25_Jaw_Open': 0.15, 'A30_Mouth_Pucker': 0.3, 'V_Tight_O': 0.22 } }
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
  const safeModelPath = encodeURI(modelPath);
  const { scene } = useGLTF(safeModelPath);

  // モーフターゲットの初期化とテクスチャ適用
  useEffect(() => {
    const meshes: any[] = [];
    const allMorphNames = new Set<string>();
    const meshInfo: any[] = [];

    if (!scene) return;

    const decodedModelPath = decodeURIComponent(modelPath);
    if (
      decodedModelPath.includes('Mother') ||
      decodedModelPath.toLowerCase().includes('female')
    ) {
      applyMotherAvatarTextures(scene);
    }

    scene.updateMatrixWorld(true);

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
    
    // 女性アバター（Mother.glb）の場合、詳細分析
    if (modelPath.includes('Mother') || modelPath.includes('female')) {
      console.log('=== 女性アバター 詳細分析 ===');
      const femaleAvatarAnalysis: any = {
        timestamp: new Date().toISOString(),
        modelPath: modelPath,
        allMeshes: [],
        materials: [],
        summary: {
          totalMeshes: 0,
          totalMaterials: 0,
          visibleMeshes: 0,
          hiddenMeshes: 0,
          meshesWithVertexColors: 0
        }
      };

      const processedMaterials = new Set<string>();

      scene.traverse((child: any) => {
        if (child.isMesh) {
          const meshData: any = {
            name: child.name,
            visible: child.visible,
            hasVertexColors: false,
            position: child.position ? { x: child.position.x, y: child.position.y, z: child.position.z } : null,
            geometry: {
              verticesCount: child.geometry?.attributes?.position?.count || 0,
              hasUV: !!child.geometry?.attributes?.uv,
              hasMorphTargets: !!child.morphTargetInfluences,
              morphTargetCount: child.morphTargetInfluences?.length || 0
            },
            materials: []
          };

          // マテリアル情報を詳細に収集
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat: any) => {
            if (mat) {
              const matData = {
                name: mat.name || 'unnamed',
                type: mat.type,
                color: mat.color ? `#${mat.color.getHexString()}` : null,
                emissive: mat.emissive ? `#${mat.emissive.getHexString()}` : null,
                emissiveIntensity: mat.emissiveIntensity,
                vertexColors: mat.vertexColors,
                transparent: mat.transparent,
                opacity: mat.opacity,
                depthWrite: mat.depthWrite,
                renderOrder: mat.renderOrder,
                side: mat.side === THREE.FrontSide ? 'FrontSide' : mat.side === THREE.BackSide ? 'BackSide' : 'DoubleSide',
                map: !!mat.map,
                normalMap: !!mat.normalMap,
                aoMap: !!mat.aoMap,
                emissiveMap: !!mat.emissiveMap,
                roughness: mat.roughness,
                metalness: mat.metalness,
                // MeshPhysicalMaterial固有のプロパティ
                clearcoat: mat.clearcoat,
                clearcoatRoughness: mat.clearcoatRoughness,
                sheen: mat.sheen,
                transmission: mat.transmission,
                reflectivity: mat.reflectivity,
                ior: mat.ior
              };

              meshData.materials.push(matData);

              if (mat.vertexColors) {
                meshData.hasVertexColors = true;
                femaleAvatarAnalysis.summary.meshesWithVertexColors++;
              }

              // ユニークなマテリアルを記録
              const matKey = `${mat.name}_${mat.uuid}`;
              if (!processedMaterials.has(matKey)) {
                processedMaterials.add(matKey);
                femaleAvatarAnalysis.materials.push({
                  ...matData,
                  uuid: mat.uuid,
                  usedInMeshes: [child.name]
                });
              }
            }
          });

          femaleAvatarAnalysis.allMeshes.push(meshData);
          femaleAvatarAnalysis.summary.totalMeshes++;

          if (child.visible) {
            femaleAvatarAnalysis.summary.visibleMeshes++;
          } else {
            femaleAvatarAnalysis.summary.hiddenMeshes++;
          }
        }
      });

      femaleAvatarAnalysis.summary.totalMaterials = femaleAvatarAnalysis.materials.length;

      // コンソールに概要を表示
      console.log('メッシュ総数:', femaleAvatarAnalysis.summary.totalMeshes);
      console.log('マテリアル総数:', femaleAvatarAnalysis.summary.totalMaterials);
      console.log('表示メッシュ:', femaleAvatarAnalysis.summary.visibleMeshes);
      console.log('非表示メッシュ:', femaleAvatarAnalysis.summary.hiddenMeshes);

      console.log('\n=== マテリアル一覧 ===');
      femaleAvatarAnalysis.materials.forEach((mat: any, index: number) => {
        console.log(`${index + 1}. ${mat.name} (${mat.type})`);
        console.log(`   色: ${mat.color}, エミッシブ: ${mat.emissive}`);
        console.log(`   使用メッシュ:`, mat.usedInMeshes);
      });

      // グローバル変数に保存（JSON出力用）
      (window as any).femaleAvatarAnalysis = femaleAvatarAnalysis;
      console.log('\n✅ 分析データを window.femaleAvatarAnalysis に保存しました');
      console.log('💡 JSONファイルをダウンロードするには「マテリアル情報をJSON出力」ボタンをクリックしてください');
    }
    
    setMorphTargets(meshes);
    console.log(`総モーフメッシュ数: ${meshes.length}`);
    console.log('利用可能なモーフ総数:', allMorphNames.size);
    
    // 親コンポーネントに利用可能なモーフリストを通知
    if (onMorphListUpdate) {
      onMorphListUpdate(Array.from(allMorphNames).sort());
    }
    
    // 少年アバターの詳細分析（目のメッシュに特化）
    if (modelPath.includes('少年アバター') && !modelPath.includes('少年改')) {
      console.log('=== 少年アバター 目のメッシュ詳細分析 ===');
      const boyAvatarAnalysis: any = {
        timestamp: new Date().toISOString(),
        modelPath: modelPath,
        eyeMeshes: [],  // 目関連のメッシュ専用
        allMeshes: [],
        materials: [],
        eyeMaterials: [], // 目関連のマテリアル専用
        summary: {
          totalMeshes: 0,
          totalMaterials: 0,
          visibleMeshes: 0,
          hiddenMeshes: 0,
          meshesWithVertexColors: 0,
          eyeRelatedMeshes: 0,
          eyeRelatedMaterials: 0
        }
      };
      
      const processedMaterials = new Set<string>();
      
      // 目関連のキーワード
      const eyeKeywords = ['eye', 'cornea', 'iris', 'pupil', 'sclera', 'tearline', 'eyelash', 'occlusion', 'onuglusion'];
      
      scene.traverse((child: any) => {
        if (child.isMesh) {
          const lowerName = child.name.toLowerCase();
          const isEyeRelated = eyeKeywords.some(keyword => lowerName.includes(keyword));
          
          const meshData: any = {
            name: child.name,
            visible: child.visible,
            hasVertexColors: false,
            isEyeRelated: isEyeRelated,
            position: child.position ? { x: child.position.x, y: child.position.y, z: child.position.z } : null,
            geometry: {
              verticesCount: child.geometry?.attributes?.position?.count || 0,
              hasUV: !!child.geometry?.attributes?.uv,
              hasMorphTargets: !!child.morphTargetInfluences
            },
            materials: []
          };
          
          // マテリアル情報を詳細に収集
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat: any) => {
            if (mat) {
              const matData = {
                name: mat.name || 'unnamed',
                type: mat.type,
                color: mat.color ? `#${mat.color.getHexString()}` : null,
                emissive: mat.emissive ? `#${mat.emissive.getHexString()}` : null,
                emissiveIntensity: mat.emissiveIntensity,
                vertexColors: mat.vertexColors,
                transparent: mat.transparent,
                opacity: mat.opacity,
                depthWrite: mat.depthWrite,
                renderOrder: mat.renderOrder,
                side: mat.side,
                map: !!mat.map,
                normalMap: !!mat.normalMap,
                aoMap: !!mat.aoMap,
                emissiveMap: !!mat.emissiveMap,
                roughness: mat.roughness,
                metalness: mat.metalness
              };
              
              meshData.materials.push(matData);
              
              if (mat.vertexColors) {
                meshData.hasVertexColors = true;
                boyAvatarAnalysis.summary.meshesWithVertexColors++;
              }
              
              // ユニークなマテリアルを記録
              const matKey = `${mat.name}_${mat.uuid}`;
              if (!processedMaterials.has(matKey)) {
                processedMaterials.add(matKey);
                boyAvatarAnalysis.materials.push({
                  ...matData,
                  uuid: mat.uuid,
                  usedInMeshes: [child.name]
                });
                
                // 目関連のマテリアルを別途記録
                if (isEyeRelated) {
                  boyAvatarAnalysis.eyeMaterials.push({
                    ...matData,
                    meshName: child.name
                  });
                  boyAvatarAnalysis.summary.eyeRelatedMaterials++;
                }
              }
            }
          });
          
          // メッシュをカテゴリごとに保存
          boyAvatarAnalysis.allMeshes.push(meshData);
          if (isEyeRelated) {
            boyAvatarAnalysis.eyeMeshes.push(meshData);
            boyAvatarAnalysis.summary.eyeRelatedMeshes++;
          }
          
          boyAvatarAnalysis.summary.totalMeshes++;
          if (child.visible) {
            boyAvatarAnalysis.summary.visibleMeshes++;
          } else {
            boyAvatarAnalysis.summary.hiddenMeshes++;
          }
        }
      });
      
      boyAvatarAnalysis.summary.totalMaterials = boyAvatarAnalysis.materials.length;
      
      // 目関連メッシュを詳細表示
      console.log('=== 👁️ 目関連メッシュ詳細 ===');
      boyAvatarAnalysis.eyeMeshes.forEach((mesh: any) => {
        console.log(`\n📍 ${mesh.name}`);
        console.log(`  表示: ${mesh.visible ? '✅' : '❌'}`);
        console.log(`  頂点数: ${mesh.geometry.verticesCount}`);
        console.log(`  マテリアル:`, mesh.materials);
      });
      
      console.log('\n=== 📊 分析サマリー ===');
      console.log(JSON.stringify(boyAvatarAnalysis.summary, null, 2));
      
      // グローバル変数に保存（JSON出力用）
      (window as any).boyAvatarAnalysis = boyAvatarAnalysis;
      
      // JSON出力関数を追加
      (window as any).downloadEyeAnalysis = () => {
        const blob = new Blob([JSON.stringify(boyAvatarAnalysis, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `boy_avatar_eye_analysis_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        console.log('✅ JSONファイルをダウンロードしました');
      };
      
      console.log('\n💡 使用方法:');
      console.log('  コンソールで以下を実行:');
      console.log('  - boyAvatarAnalysis で分析結果を確認');
      console.log('  - downloadEyeAnalysis() でJSONファイルをダウンロード');
    }
    
    // 少年アバターのテクスチャ適用（分析のみモードでスキップ）
    const textureAppliedKey = `texture_applied_${modelPath}`;
    if (modelPath.includes('少年アバター') && !scene.userData[textureAppliedKey]) {
      scene.userData[textureAppliedKey] = true;
      // 分析モードではテクスチャ適用をスキップ（色が変わると分析が困難になるため）
      console.log('avatar-analyzer: 少年アバターのテクスチャ適用をスキップ（分析モード）');
    } else if (modelPath.includes('少年改') && !scene.userData[textureAppliedKey]) {
      scene.userData[textureAppliedKey] = true;
      // 小児アバターはテクスチャ適用をスキップ（FinalLipSyncAvatarで専用処理）
      console.log('avatar-analyzer: 小児アバターのテクスチャ適用をスキップ');
    } else if (modelPath.includes('Hayden') && !scene.userData[textureAppliedKey]) {
      scene.userData[textureAppliedKey] = true;
      // テクスチャ適用を一時的に無効化
      console.log('avatar-analyzer: 女性アバターのテクスチャ適用をスキップ（デバッグ用）');
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
  const [phonemeLanguage, setPhonemeLanguage] = useState<'jp' | 'en'>('jp');

  const modelPath =
    selectedAvatar === 'adult' ? '/models/成人男性.glb' :
    selectedAvatar === 'boy' ? '/models/少年アバター.glb' :
    selectedAvatar === 'boy_improved' ? '/models/Baby main.glb' :
    '/models/Mother.glb';

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

  // 現在の言語に応じた音素プリセットを取得
  const PHONEME_PRESETS = phonemeLanguage === 'jp' ? PHONEME_PRESETS_JP : PHONEME_PRESETS_EN;

  const applyPhoneme = (phoneme: string) => {
    const preset = PHONEME_PRESETS[phoneme as keyof typeof PHONEME_PRESETS];
    if (preset) {
      setCustomMorphs(preset.morphs);
      setSelectedExpression('custom');
    }
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

  const exportMaterialInfoToJSON = () => {
    const analysisData = (window as any).femaleAvatarAnalysis;
    if (!analysisData) {
      alert('女性アバターを選択してマテリアル情報を読み込んでください');
      return;
    }

    const blob = new Blob([JSON.stringify(analysisData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `female_avatar_materials_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('✅ マテリアル情報をJSONファイルとして出力しました');
  };

  const exportMeshInfoToJSON = () => {
    const meshInfo = (window as any).femaleAvatarMeshInfo;
    if (!meshInfo) {
      alert('メッシュ情報を読み込んでください');
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

  const exportBoyAvatarAnalysis = () => {
    const boyAnalysis = (window as any).boyAvatarAnalysis;
    if (!boyAnalysis) {
      alert('少年アバターを選択してメッシュ情報を読み込んでください');
      return;
    }

    const blob = new Blob([JSON.stringify(boyAnalysis, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `boy_avatar_analysis_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('少年アバター分析データをダウンロードしました');
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
                    onClick={exportMaterialInfoToJSON}
                    className="px-3 py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg hover:from-pink-600 hover:to-rose-700 transition-all shadow-lg flex items-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    マテリアル情報
                  </button>
                )}
                {selectedAvatar === 'boy' && (
                  <button
                    onClick={exportBoyAvatarAnalysis}
                    className="px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg flex items-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    構造分析
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
                      onClick={() => applyPhoneme(key)}
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
useGLTF.preload(encodeURI('/models/Baby main.glb'));
