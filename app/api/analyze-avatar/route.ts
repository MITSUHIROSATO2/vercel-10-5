import { NextRequest, NextResponse } from 'next/server';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import fs from 'fs/promises';
import path from 'path';

// Node.js環境でThree.jsを使うための設定
if (typeof window === 'undefined') {
  // @ts-ignore
  global.self = global;
}

interface MeshInfo {
  name: string;
  type: string;
  shapeKeys: string[];
  vertexCount: number;
  faceCount: number;
  hasSkeleton: boolean;
  position?: { x: number; y: number; z: number };
  boundingBox?: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
    center: { x: number; y: number; z: number };
    size: { x: number; y: number; z: number };
  };
  isMouthRelated?: boolean;
  isEyeRelated?: boolean;
  materials?: Array<{
    name: string;
    type: string;
    color?: { r: number; g: number; b: number };
  }>;
}

interface BoneInfo {
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  children: string[];
}

interface ModelData {
  meshes: MeshInfo[];
  bones: BoneInfo[];
  animations: any[];
  hierarchy: string;
  stats: {
    totalMeshes: number;
    totalShapeKeys: number;
    totalBones: number;
    totalVertices: number;
    totalFaces: number;
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const modelType = searchParams.get('type') || 'glb';
  const modelName = searchParams.get('model') || 'man-grey-suit-optimized';

  try {
    let modelPath: string;
    let modelData: ModelData;

    if (modelType === 'glb') {
      let fileName;
      if (modelName === 'boy') {
        fileName = '少年アバター.glb';
      } else if (modelName === 'boy_improved') {
        fileName = '少年改アバター.glb';
      } else if (modelName === 'adult_improved') {
        fileName = '成人男性.glb';
      } else {
        fileName = '成人男性.glb';
      }
      modelPath = path.join(process.cwd(), 'public', 'models', fileName);
      modelData = await analyzeGLB(modelPath);
    } else {
      modelPath = path.join(process.cwd(), 'public', 'models', 'uploads_files_4306156_Man_Grey_Suit_01_Blender', 'Man_Grey_Suit_01_Blender.Fbx');
      modelData = await analyzeFBX(modelPath);
    }

    return NextResponse.json({
      success: true,
      modelType,
      data: modelData
    });

  } catch (error) {
    console.error('Error analyzing model:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function analyzeGLB(filePath: string): Promise<ModelData> {
  const fileBuffer = await fs.readFile(filePath);
  const loader = new GLTFLoader();
  
  return new Promise((resolve, reject) => {
    // Convert Buffer to ArrayBuffer
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );
    
    loader.parse(
      arrayBuffer as ArrayBuffer,
      '',
      (gltf) => {
        console.log('=== GLTF解析開始 ===');
        console.log('GLTF構造:', {
          hasAnimations: gltf.animations?.length > 0,
          animationCount: gltf.animations?.length || 0,
          hasCameras: gltf.cameras?.length > 0,
          hasScene: !!gltf.scene
        });
        
        // GLTFのparser情報を確認
        if (gltf.parser && gltf.parser.json) {
          const json = gltf.parser.json;
          if (json.meshes) {
            console.log('GLTFメッシュ情報:');
            json.meshes.forEach((mesh: any, index: number) => {
              if (mesh.extras && mesh.extras.targetNames) {
                console.log(`メッシュ[${index}] targetNames:`, mesh.extras.targetNames);
              }
              if (mesh.primitives) {
                mesh.primitives.forEach((prim: any, primIndex: number) => {
                  if (prim.targets) {
                    console.log(`  プリミティブ[${primIndex}] targets数:`, prim.targets.length);
                  }
                  if (prim.extras && prim.extras.targetNames) {
                    console.log(`  プリミティブ[${primIndex}] targetNames:`, prim.extras.targetNames);
                  }
                });
              }
            });
          }
        }
        
        const data = analyzeModel(gltf.scene, gltf);
        resolve(data);
      },
      (error) => {
        reject(error);
      }
    );
  });
}

async function analyzeFBX(filePath: string): Promise<ModelData> {
  const fileBuffer = await fs.readFile(filePath);
  const loader = new FBXLoader();
  
  return new Promise((resolve, reject) => {
    try {
      // FBXLoader requires ArrayBuffer
      const fbx = loader.parse(fileBuffer.buffer, '');
      const data = analyzeModel(fbx);
      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
}

function analyzeModel(scene: THREE.Object3D, gltf?: any): ModelData {
  // GLTFからシェイプキー名を取得
  const targetNamesMap = new Map<string, string[]>();
  
  if (gltf && gltf.parser && gltf.parser.json) {
    const json = gltf.parser.json;
    
    // ノード情報からメッシュインデックスを取得
    if (json.nodes) {
      json.nodes.forEach((node: any) => {
        if (node.mesh !== undefined && node.name) {
          const meshIndex = node.mesh;
          if (json.meshes && json.meshes[meshIndex]) {
            const mesh = json.meshes[meshIndex];
            
            // メッシュレベルのtargetNames
            if (mesh.extras && mesh.extras.targetNames) {
              targetNamesMap.set(node.name, mesh.extras.targetNames);
            }
            
            // プリミティブレベルのtargetNames
            if (mesh.primitives) {
              mesh.primitives.forEach((prim: any) => {
                if (prim.extras && prim.extras.targetNames) {
                  targetNamesMap.set(node.name, prim.extras.targetNames);
                }
              });
            }
          }
        }
      });
    }
  }
  
  console.log('TargetNames マップ:', targetNamesMap);
  const data: ModelData = {
    meshes: [],
    bones: [],
    animations: [],
    hierarchy: buildHierarchy(scene),
    stats: {
      totalMeshes: 0,
      totalShapeKeys: 0,
      totalBones: 0,
      totalVertices: 0,
      totalFaces: 0
    }
  };

  // メッシュとシェイプキーの解析
  scene.traverse((child: any) => {
    if (child.isMesh || child.isSkinnedMesh) {
      const meshInfo: MeshInfo = {
        name: child.name || 'Unnamed Mesh',
        type: child.type,
        shapeKeys: [],
        vertexCount: 0,
        faceCount: 0,
        hasSkeleton: !!child.skeleton
      };

      // 位置情報
      meshInfo.position = {
        x: child.position.x,
        y: child.position.y,
        z: child.position.z
      };

      // ジオメトリ情報とバウンディングボックス
      if (child.geometry) {
        meshInfo.vertexCount = child.geometry.attributes.position?.count || 0;
        if (child.geometry.index) {
          meshInfo.faceCount = child.geometry.index.count / 3;
        }
        data.stats.totalVertices += meshInfo.vertexCount;
        data.stats.totalFaces += meshInfo.faceCount;

        // バウンディングボックスの計算
        child.geometry.computeBoundingBox();
        if (child.geometry.boundingBox) {
          const box = child.geometry.boundingBox;
          const center = new THREE.Vector3();
          const size = new THREE.Vector3();
          box.getCenter(center);
          box.getSize(size);
          
          // ワールド座標に変換
          child.updateWorldMatrix(true, false);
          center.applyMatrix4(child.matrixWorld);
          
          meshInfo.boundingBox = {
            min: { x: box.min.x, y: box.min.y, z: box.min.z },
            max: { x: box.max.x, y: box.max.y, z: box.max.z },
            center: { x: center.x, y: center.y, z: center.z },
            size: { x: size.x, y: size.y, z: size.z }
          };
        }
      }

      // 口関連のメッシュかどうかを判定
      const nameLower = meshInfo.name.toLowerCase();
      const mouthKeywords = ['mouth', 'lip', 'teeth', 'tooth', 'tongue', 'jaw', 'oral', 'gum'];
      meshInfo.isMouthRelated = mouthKeywords.some(keyword => nameLower.includes(keyword));
      
      // 目関連のメッシュかどうかを判定
      const eyeKeywords = ['eye', 'cornea', 'sclera', 'iris', 'pupil', 'tearline', 'lash'];
      meshInfo.isEyeRelated = eyeKeywords.some(keyword => nameLower.includes(keyword));
      
      // マテリアル情報を収集
      meshInfo.materials = [];
      if (child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat: any) => {
          const matInfo: any = {
            name: mat.name || 'Unnamed Material',
            type: mat.type || 'Unknown'
          };
          
          // 色情報を取得
          if (mat.color) {
            matInfo.color = {
              r: mat.color.r,
              g: mat.color.g,
              b: mat.color.b
            };
          }
          
          meshInfo.materials!.push(matInfo);
        });
      }
      
      // マテリアル名も確認
      if (!meshInfo.isMouthRelated && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat: any) => {
          if (mat.name) {
            const matNameLower = mat.name.toLowerCase();
            if (mouthKeywords.some(keyword => matNameLower.includes(keyword))) {
              meshInfo.isMouthRelated = true;
            }
          }
        });
      }

      // シェイプキー（モーフターゲット）の取得
      if (child.morphTargetDictionary && Object.keys(child.morphTargetDictionary).length > 0) {
        meshInfo.shapeKeys = Object.keys(child.morphTargetDictionary);
        data.stats.totalShapeKeys += meshInfo.shapeKeys.length;
        console.log(`メッシュ ${meshInfo.name} のシェイプキー:`, meshInfo.shapeKeys);
      } else if (child.geometry && child.geometry.morphAttributes && child.geometry.morphAttributes.position) {
        // morphTargetDictionaryがない場合はmorphAttributesから取得
        meshInfo.shapeKeys = Object.keys(child.geometry.morphAttributes.position);
        data.stats.totalShapeKeys += meshInfo.shapeKeys.length;
        console.log(`メッシュ ${meshInfo.name} のモーフアトリビュート:`, meshInfo.shapeKeys);
      } else if (child.geometry && child.geometry.morphTargets) {
        // 旧形式のmorphTargetsから取得
        meshInfo.shapeKeys = child.geometry.morphTargets.map((target: any, index: number) => 
          target.name || `morph_${index}`
        );
        data.stats.totalShapeKeys += meshInfo.shapeKeys.length;
        console.log(`メッシュ ${meshInfo.name} の旧形式モーフターゲット:`, meshInfo.shapeKeys);
      }
      
      // シェイプキーに口関連のキーワードがあるか確認
      if (meshInfo.shapeKeys.length > 0) {
        
        // 口関連のシェイプキーがある場合
        const hasMouthMorphs = meshInfo.shapeKeys.some(key => {
          const keyLower = key.toLowerCase();
          return mouthKeywords.some(keyword => keyLower.includes(keyword)) ||
                 keyLower.includes('jaw') || keyLower.includes('a25') || // 顎関連
                 keyLower.includes('a30') || keyLower.includes('a37'); // 口関連
        });
        if (hasMouthMorphs) {
          meshInfo.isMouthRelated = true;
        }
      }

      data.meshes.push(meshInfo);
      data.stats.totalMeshes++;
    }

    // ボーン情報
    if (child.isBone) {
      const boneInfo: BoneInfo = {
        name: child.name || 'Unnamed Bone',
        position: {
          x: child.position.x,
          y: child.position.y,
          z: child.position.z
        },
        rotation: {
          x: child.rotation.x,
          y: child.rotation.y,
          z: child.rotation.z
        },
        scale: {
          x: child.scale.x,
          y: child.scale.y,
          z: child.scale.z
        },
        children: child.children.filter((c: any) => c.isBone).map((c: any) => c.name)
      };
      data.bones.push(boneInfo);
      data.stats.totalBones++;
    }
  });

  // アニメーション情報（GLTFの場合）
  if (gltf && gltf.animations) {
    data.animations = gltf.animations.map((anim: any) => ({
      name: anim.name,
      duration: anim.duration,
      tracks: anim.tracks.length
    }));
  }

  return data;
}

function buildHierarchy(object: THREE.Object3D, indent: string = ''): string {
  let result = `${indent}${object.name || object.type} (${object.type})`;
  
  if ((object as any).isMesh) {
    result += ' [Mesh]';
    if ((object as any).morphTargetDictionary) {
      result += ` [ShapeKeys: ${Object.keys((object as any).morphTargetDictionary).length}]`;
    }
  }
  if ((object as any).isBone) {
    result += ' [Bone]';
  }
  
  result += '\n';

  for (const child of object.children) {
    result += buildHierarchy(child, indent + '  ');
  }

  return result;
}