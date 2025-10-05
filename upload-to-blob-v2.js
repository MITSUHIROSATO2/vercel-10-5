const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

const files = [
  'public/models/成人男性.glb',
  'public/models/少年アバター.glb',
  'public/models/少年改アバター.glb',
  'public/models/Mother.glb'
];

async function uploadFiles() {
  // Token from environment variable (already set in .env.development.local)
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    console.error('BLOB_READ_WRITE_TOKEN is not set');
    process.exit(1);
  }

  console.log('Using token:', token.substring(0, 30) + '...');

  for (const filePath of files) {
    try {
      const fileName = path.basename(filePath);
      const fileBuffer = fs.readFileSync(filePath);

      console.log(`Uploading ${fileName} (${fileBuffer.length} bytes)...`);

      const blob = await put(fileName, fileBuffer, {
        access: 'public',
        token: token,
        addRandomSuffix: false
      });

      console.log(`✓ Uploaded ${fileName}`);
      console.log(`  URL: ${blob.url}`);
      console.log('');
    } catch (error) {
      console.error(`✗ Failed to upload ${filePath}:`);
      console.error(`  Error: ${error.message}`);
      if (error.response) {
        console.error(`  Response:`, error.response);
      }
      console.log('');
    }
  }
}

uploadFiles();
