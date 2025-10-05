const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

// Get token from environment variable or use provided token
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || 'vercel_blob_rw_iUAM5oeUaGUJiBOESNxuZCTl';

const files = [
  'public/models/成人男性.glb',
  'public/models/少年アバター.glb',
  'public/models/少年改アバター.glb',
  'public/models/Mother.glb'
];

async function uploadFiles() {
  for (const filePath of files) {
    try {
      const fileName = path.basename(filePath);
      const fileBuffer = fs.readFileSync(filePath);

      console.log(`Uploading ${fileName}...`);

      const blob = await put(fileName, fileBuffer, {
        access: 'public',
        token: BLOB_TOKEN,
        addRandomSuffix: false
      });

      console.log(`✓ Uploaded ${fileName}`);
      console.log(`  URL: ${blob.url}`);
      console.log('');
    } catch (error) {
      console.error(`✗ Failed to upload ${filePath}:`, error.message);
    }
  }
}

uploadFiles();
