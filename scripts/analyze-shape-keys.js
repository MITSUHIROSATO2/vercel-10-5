import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Three.js setup
global.self = global;
global.window = global;
global.document = { createElement: () => ({ style: {} }) };

const loader = new GLTFLoader();

const avatarFiles = [
  { name: '成人男性', path: path.join(__dirname, '../public/models/成人男性.glb') },
  { name: '少年アバター', path: path.join(__dirname, '../public/models/少年アバター.glb') },
  { name: '少年改アバター', path: path.join(__dirname, '../public/models/少年改アバター.glb') },
  { name: 'Hayden (女性)', path: path.join(__dirname, '../public/models/Hayden_059d-NO-GUI.glb') }
];

const analyzeResults = {};

async function analyzeGLB(avatarInfo) {
  return new Promise((resolve, reject) => {
    const fileBuffer = fs.readFileSync(avatarInfo.path);
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );

    loader.parse(arrayBuffer, '', (gltf) => {
      const result = {
        name: avatarInfo.name,
        path: avatarInfo.path,
        meshes: [],
        allShapeKeys: new Set(),
        shapeKeysByMesh: {},
        summary: {
          totalMeshes: 0,
          meshesWithShapeKeys: 0,
          totalUniqueShapeKeys: 0
        }
      };

      gltf.scene.traverse((child) => {
        if (child.isMesh || child.isSkinnedMesh) {
          result.summary.totalMeshes++;

          const meshInfo = {
            name: child.name,
            type: child.type,
            hasShapeKeys: false,
            shapeKeys: []
          };

          // Check for morph targets (shape keys)
          if (child.morphTargetInfluences && child.morphTargetDictionary) {
            meshInfo.hasShapeKeys = true;
            meshInfo.shapeKeys = Object.keys(child.morphTargetDictionary);
            result.summary.meshesWithShapeKeys++;

            // Add to collection
            meshInfo.shapeKeys.forEach(key => {
              result.allShapeKeys.add(key);
            });

            result.shapeKeysByMesh[child.name] = meshInfo.shapeKeys;
          }

          result.meshes.push(meshInfo);
        }
      });

      // Convert Set to Array and sort
      result.allShapeKeys = Array.from(result.allShapeKeys).sort();
      result.summary.totalUniqueShapeKeys = result.allShapeKeys.length;

      resolve(result);
    }, reject);
  });
}

async function analyzeAllAvatars() {
  console.log('🔍 Avatar Shape Key Analysis\n');
  console.log('=' .repeat(80));

  for (const avatar of avatarFiles) {
    try {
      console.log(`\n📦 Analyzing: ${avatar.name}`);
      console.log('-'.repeat(40));

      const result = await analyzeGLB(avatar);
      analyzeResults[avatar.name] = result;

      // Display results
      console.log(`Total Meshes: ${result.summary.totalMeshes}`);
      console.log(`Meshes with Shape Keys: ${result.summary.meshesWithShapeKeys}`);
      console.log(`Total Unique Shape Keys: ${result.summary.totalUniqueShapeKeys}`);

      if (result.allShapeKeys.length > 0) {
        console.log('\n🔑 Available Shape Keys:');

        // Group shape keys by category
        const categories = {
          brow: [],
          eye: [],
          nose: [],
          cheek: [],
          jaw: [],
          mouth: [],
          tongue: [],
          viseme: [],
          other: []
        };

        result.allShapeKeys.forEach(key => {
          const lowerKey = key.toLowerCase();
          if (lowerKey.includes('brow')) categories.brow.push(key);
          else if (lowerKey.includes('eye')) categories.eye.push(key);
          else if (lowerKey.includes('nose')) categories.nose.push(key);
          else if (lowerKey.includes('cheek')) categories.cheek.push(key);
          else if (lowerKey.includes('jaw')) categories.jaw.push(key);
          else if (lowerKey.includes('mouth')) categories.mouth.push(key);
          else if (lowerKey.includes('tongue')) categories.tongue.push(key);
          else if (lowerKey.startsWith('v_') || lowerKey.includes('viseme')) categories.viseme.push(key);
          else categories.other.push(key);
        });

        Object.entries(categories).forEach(([category, keys]) => {
          if (keys.length > 0) {
            console.log(`\n  ${category.toUpperCase()} (${keys.length}):`);
            keys.forEach(key => console.log(`    • ${key}`));
          }
        });
      } else {
        console.log('\n❌ No shape keys found in this model');
      }

      // Show which meshes have shape keys
      if (Object.keys(result.shapeKeysByMesh).length > 0) {
        console.log('\n📋 Meshes with Shape Keys:');
        Object.entries(result.shapeKeysByMesh).forEach(([meshName, keys]) => {
          console.log(`  • ${meshName}: ${keys.length} shape keys`);
        });
      }

    } catch (error) {
      console.error(`❌ Error analyzing ${avatar.name}:`, error.message);
    }
  }

  // Save results to JSON
  const outputPath = path.join(__dirname, 'avatar-shape-keys-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(analyzeResults, null, 2));
  console.log(`\n💾 Analysis saved to: ${outputPath}`);

  // Create comparison table
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPARISON SUMMARY');
  console.log('='.repeat(80));

  const comparison = avatarFiles.map(avatar => {
    const result = analyzeResults[avatar.name];
    if (!result) return null;
    return {
      Avatar: avatar.name,
      'Total Meshes': result.summary.totalMeshes,
      'With Shape Keys': result.summary.meshesWithShapeKeys,
      'Unique Shape Keys': result.summary.totalUniqueShapeKeys
    };
  }).filter(Boolean);

  console.table(comparison);

  // Find common shape keys across avatars
  const allAvatarKeys = Object.values(analyzeResults).map(r => r.allShapeKeys || []);
  if (allAvatarKeys.length > 1) {
    const commonKeys = allAvatarKeys.reduce((common, keys) => {
      return common.filter(key => keys.includes(key));
    });

    console.log('\n🔗 Common Shape Keys Across All Avatars:');
    if (commonKeys.length > 0) {
      commonKeys.forEach(key => console.log(`  • ${key}`));
    } else {
      console.log('  None found - avatars use different shape key naming conventions');
    }
  }
}

// Run analysis
analyzeAllAvatars().catch(console.error);