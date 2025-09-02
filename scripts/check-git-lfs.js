#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Checking Git LFS files...\n');

const modelsDir = path.join(process.cwd(), 'public', 'models');

// Check if models directory exists
if (!fs.existsSync(modelsDir)) {
  console.error('❌ Models directory not found at:', modelsDir);
  process.exit(1);
}

// List of expected GLB files
const expectedFiles = [
  '成人男性.glb',
  '成人男性改アバター.glb',
  '少年アバター.glb',
  '少年改アバター.glb'
];

let hasErrors = false;

expectedFiles.forEach(filename => {
  const filePath = path.join(modelsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filename}`);
    hasErrors = true;
    return;
  }
  
  const stats = fs.statSync(filePath);
  const content = fs.readFileSync(filePath, 'utf8').slice(0, 200);
  
  // Check if it's a Git LFS pointer file (small text file)
  if (stats.size < 500 && content.includes('version https://git-lfs.github.com')) {
    console.error(`❌ ${filename} is a Git LFS pointer file, not the actual GLB file`);
    console.log(`   Size: ${stats.size} bytes (too small for a GLB file)`);
    console.log(`   This will cause loading errors in production!`);
    hasErrors = true;
  } else if (content.startsWith('glTF')) {
    console.log(`✅ ${filename} appears to be a valid GLB file`);
    console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  } else {
    console.warn(`⚠️  ${filename} may not be a valid GLB file`);
    console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  }
});

if (hasErrors) {
  console.log('\n⚠️  Git LFS Issues Detected!\n');
  console.log('To fix this issue:');
  console.log('1. Make sure Git LFS is installed: git lfs install');
  console.log('2. Pull the actual files: git lfs pull');
  console.log('3. For Vercel deployment, you may need to:');
  console.log('   - Host GLB files on a CDN (recommended)');
  console.log('   - Or use Vercel\'s build command: git lfs pull && npm run build');
  console.log('\nAlternatively, consider hosting large files externally.');
  process.exit(1);
} else {
  console.log('\n✅ All GLB files appear to be properly downloaded');
}