const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

const files = [
  { path: 'public/models/成人男性.glb', newName: 'adult-male.glb' },
  { path: 'public/models/少年アバター.glb', newName: 'boy-avatar.glb' },
  { path: 'public/models/少年改アバター.glb', newName: 'boy-improved-avatar.glb' },
  { path: 'public/models/Mother.glb', newName: 'mother.glb' }
];

async function uploadFiles() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    console.error('BLOB_READ_WRITE_TOKEN is not set');
    process.exit(1);
  }

  console.log('Using token:', token.substring(0, 30) + '...\n');

  for (const file of files) {
    try {
      const fileBuffer = fs.readFileSync(file.path);

      console.log(`Uploading ${file.newName} (${fileBuffer.length} bytes)...`);

      const blob = await put(file.newName, fileBuffer, {
        access: 'public',
        token: token,
        addRandomSuffix: false
      });

      console.log(`✓ Uploaded ${file.newName}`);
      console.log(`  URL: ${blob.url}`);
      console.log('');
    } catch (error) {
      console.error(`✗ Failed to upload ${file.path}:`);
      console.error(`  Error: ${error.message}`);
      console.log('');
    }
  }
}

uploadFiles();
