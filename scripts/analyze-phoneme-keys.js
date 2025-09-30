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

// 音素・音韻関連のキーワード
const phonemeKeywords = [
  // Viseme patterns
  'viseme', 'v_', 'V_',
  // Common phoneme patterns
  'aa', 'ae', 'ah', 'ao', 'aw', 'ay',
  'eh', 'er', 'ey',
  'ih', 'iy',
  'ow', 'oy',
  'uh', 'uw',
  // Consonant patterns
  'ch', 'dh', 'th', 'sh', 'zh',
  'ng',
  // Lip sync patterns
  'lip', 'dental', 'affricate', 'explosive',
  'tight', 'wide', 'open',
  // Phonetic patterns
  'phoneme', 'phon',
  // Speech patterns
  'speech', 'talk', 'say',
  // Articulation
  'articul', 'artic'
];

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
        allShapeKeys: new Set(),
        phonemeRelated: {
          viseme: [],
          vowels: [],
          consonants: [],
          articulation: [],
          other: []
        }
      };

      gltf.scene.traverse((child) => {
        if (child.isMesh || child.isSkinnedMesh) {
          if (child.morphTargetInfluences && child.morphTargetDictionary) {
            Object.keys(child.morphTargetDictionary).forEach(key => {
              result.allShapeKeys.add(key);
            });
          }
        }
      });

      // Convert Set to Array and categorize
      const allKeys = Array.from(result.allShapeKeys).sort();

      allKeys.forEach(key => {
        const lowerKey = key.toLowerCase();

        // Viseme category (V_ prefix or contains viseme)
        if (lowerKey.startsWith('v_') || lowerKey.includes('viseme')) {
          result.phonemeRelated.viseme.push(key);
        }

        // Check for vowel patterns (AA, AE, AH, etc.)
        const vowelPatterns = ['AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW'];
        if (vowelPatterns.some(pattern => key.includes(pattern))) {
          result.phonemeRelated.vowels.push(key);
        }

        // Check for consonant patterns
        const consonantPatterns = ['CH', 'DH', 'TH', 'SH', 'ZH', 'NG', 'Explosive', 'Dental', 'Affricate'];
        if (consonantPatterns.some(pattern => lowerKey.includes(pattern.toLowerCase()))) {
          result.phonemeRelated.consonants.push(key);
        }

        // Articulation related
        if (lowerKey.includes('tongue') || lowerKey.includes('lip') || lowerKey.includes('teeth') ||
            lowerKey.includes('jaw') || lowerKey.includes('mouth')) {
          // Only add if it's specifically phoneme-related
          if (lowerKey.includes('open') || lowerKey.includes('wide') || lowerKey.includes('tight') ||
              lowerKey.includes('narrow') || lowerKey.includes('curl') || lowerKey.includes('raise')) {
            if (!result.phonemeRelated.articulation.includes(key)) {
              result.phonemeRelated.articulation.push(key);
            }
          }
        }

        // Other phoneme-related that don't fit above categories
        if (phonemeKeywords.some(keyword => lowerKey.includes(keyword)) &&
            !result.phonemeRelated.viseme.includes(key) &&
            !result.phonemeRelated.vowels.includes(key) &&
            !result.phonemeRelated.consonants.includes(key) &&
            !result.phonemeRelated.articulation.includes(key)) {
          result.phonemeRelated.other.push(key);
        }
      });

      resolve(result);
    }, reject);
  });
}

async function analyzeAllAvatars() {
  console.log('🔊 Phoneme/Viseme Shape Key Analysis\n');
  console.log('=' .repeat(80));

  const analysisResults = {};

  for (const avatar of avatarFiles) {
    try {
      console.log(`\n📦 ${avatar.name}`);
      console.log('-'.repeat(60));

      const result = await analyzeGLB(avatar);
      analysisResults[avatar.name] = result;

      // Count total phoneme-related keys
      const totalPhonemeKeys =
        result.phonemeRelated.viseme.length +
        result.phonemeRelated.vowels.length +
        result.phonemeRelated.consonants.length +
        result.phonemeRelated.articulation.length +
        result.phonemeRelated.other.length;

      console.log(`Total Shape Keys: ${result.allShapeKeys.size}`);
      console.log(`Phoneme-Related Keys: ${totalPhonemeKeys}`);

      // Display categorized results
      if (result.phonemeRelated.viseme.length > 0) {
        console.log('\n📍 VISEME Keys (音素視覚表現):');
        result.phonemeRelated.viseme.forEach(key => {
          console.log(`    • ${key}`);
        });
      }

      if (result.phonemeRelated.vowels.length > 0) {
        console.log('\n🔤 VOWEL Phonemes (母音):');
        result.phonemeRelated.vowels.forEach(key => {
          console.log(`    • ${key}`);
        });
      }

      if (result.phonemeRelated.consonants.length > 0) {
        console.log('\n🗣️ CONSONANT/Articulation (子音・調音):');
        result.phonemeRelated.consonants.forEach(key => {
          console.log(`    • ${key}`);
        });
      }

      if (result.phonemeRelated.articulation.length > 0) {
        console.log('\n👄 ARTICULATION Controls (調音器官制御):');
        // Group by type
        const tongueKeys = result.phonemeRelated.articulation.filter(k => k.toLowerCase().includes('tongue'));
        const lipKeys = result.phonemeRelated.articulation.filter(k => k.toLowerCase().includes('lip'));
        const mouthKeys = result.phonemeRelated.articulation.filter(k => k.toLowerCase().includes('mouth') && !k.toLowerCase().includes('lip'));

        if (tongueKeys.length > 0) {
          console.log('  👅 Tongue:');
          tongueKeys.forEach(key => console.log(`    • ${key}`));
        }
        if (lipKeys.length > 0) {
          console.log('  💋 Lips:');
          lipKeys.forEach(key => console.log(`    • ${key}`));
        }
        if (mouthKeys.length > 0) {
          console.log('  👄 Mouth:');
          mouthKeys.forEach(key => console.log(`    • ${key}`));
        }
      }

      if (totalPhonemeKeys === 0) {
        console.log('\n❌ No phoneme/viseme-specific shape keys found');
      }

    } catch (error) {
      console.error(`❌ Error analyzing ${avatar.name}:`, error.message);
    }
  }

  // Create comparison
  console.log('\n' + '='.repeat(80));
  console.log('📊 PHONEME SUPPORT COMPARISON');
  console.log('='.repeat(80));

  const comparison = [];
  for (const [name, result] of Object.entries(analysisResults)) {
    comparison.push({
      Avatar: name,
      'Viseme': result.phonemeRelated.viseme.length,
      'Vowels': result.phonemeRelated.vowels.length,
      'Consonants': result.phonemeRelated.consonants.length,
      'Articulation': result.phonemeRelated.articulation.length,
      'Total Phoneme Keys':
        result.phonemeRelated.viseme.length +
        result.phonemeRelated.vowels.length +
        result.phonemeRelated.consonants.length +
        result.phonemeRelated.articulation.length
    });
  }

  console.table(comparison);

  // Check for English alphabet pattern (A, B, C, D, etc.)
  console.log('\n🔤 ALPHABET PATTERN CHECK:');
  console.log('-'.repeat(60));

  for (const [name, result] of Object.entries(analysisResults)) {
    console.log(`\n${name}:`);
    const allKeys = Array.from(result.allShapeKeys);

    // Check for single letter patterns
    const singleLetterKeys = allKeys.filter(key => {
      // Match patterns like A, B, C or A_, B_, etc.
      return /^[A-Z](_|$)/i.test(key) || /^V_[A-Z]($|_)/i.test(key);
    });

    if (singleLetterKeys.length > 0) {
      console.log('  Found alphabet-based keys:');
      singleLetterKeys.forEach(key => console.log(`    • ${key}`));
    } else {
      console.log('  No direct alphabet pattern found');
    }

    // Check for phonetic alphabet (like "V_AA", "V_B", etc.)
    const phoneticKeys = allKeys.filter(key => {
      return /^V_[A-Z]{1,2}$/i.test(key) || /^[A-Z]{1,2}_/.test(key);
    });

    if (phoneticKeys.length > 0) {
      console.log('  Phonetic alphabet keys:');
      phoneticKeys.forEach(key => console.log(`    • ${key}`));
    }
  }

  // Save detailed results
  const outputPath = path.join(__dirname, 'phoneme-shape-keys-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(analysisResults, null, 2));
  console.log(`\n💾 Analysis saved to: ${outputPath}`);
}

// Run analysis
analyzeAllAvatars().catch(console.error);