// Custom kuromoji loader for Next.js server-side
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Create a custom dictionary loader for server-side use
export class ServerDictionaryLoader {
  private dicPath: string;

  constructor(dicPath: string) {
    this.dicPath = dicPath;
  }

  async loadArrayBuffer(file: string): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const filePath = path.join(this.dicPath, file);
      
      fs.readFile(filePath, (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        // Check if file is gzipped
        if (file.endsWith('.gz')) {
          zlib.gunzip(data, (err, decompressed) => {
            if (err) {
              reject(err);
              return;
            }
            // Convert Buffer to ArrayBuffer
            const arrayBuffer = decompressed.buffer.slice(
              decompressed.byteOffset,
              decompressed.byteOffset + decompressed.byteLength
            );
            resolve(arrayBuffer as ArrayBuffer);
          });
        } else {
          // Convert Buffer to ArrayBuffer
          const arrayBuffer = data.buffer.slice(
            data.byteOffset,
            data.byteOffset + data.byteLength
          );
          resolve(arrayBuffer as ArrayBuffer);
        }
      });
    });
  }
}

// Custom tokenizer builder for server-side
export async function createServerTokenizer(): Promise<any> {
  // Use absolute path for dictionary
  const dicPath = path.resolve(process.cwd(), 'node_modules', 'kuromoji', 'dict');
  
  // Check if dictionary exists
  if (!fs.existsSync(dicPath)) {
    console.error(`Dictionary path does not exist: ${dicPath}`);
    throw new Error(`Dictionary path does not exist: ${dicPath}`);
  }
  
  // Check if we're in a Node.js environment
  if (typeof process === 'undefined' || !process.versions || !process.versions.node) {
    throw new Error('Not in Node.js environment');
  }
  
  // Dynamic import kuromoji
  const kuromoji = require('kuromoji');
  
  return new Promise((resolve, reject) => {
    try {
      // Create builder with custom configuration for server-side
      const builder = kuromoji.builder({
        dicPath: dicPath
      });
      
      // Override the loader to ensure it uses Node.js fs
      if (builder.loader && typeof builder.loader === 'object') {
        const originalLoader = builder.loader;
        builder.loader = {
          ...originalLoader,
          load: function(url: string, callback: (err: any, data: any) => void) {
            // Force file system loading
            const fileName = url.replace(/^.*\//, '');
            const filePath = path.join(dicPath, fileName);
            
            fs.readFile(filePath, (err, data) => {
              if (err) {
                console.error(`Failed to load dictionary file: ${filePath}`, err);
                callback(err, null);
                return;
              }
              
              // Handle gzipped files
              if (fileName.endsWith('.gz')) {
                zlib.gunzip(data, (gunzipErr, decompressed) => {
                  if (gunzipErr) {
                    console.error(`Failed to decompress: ${fileName}`, gunzipErr);
                    callback(gunzipErr, null);
                    return;
                  }
                  callback(null, decompressed);
                });
              } else {
                callback(null, data);
              }
            });
          }
        };
      }
      
      builder.build((err: any, tokenizer: any) => {
        if (err) {
          console.error('Kuromoji build error:', err);
          reject(err);
        } else {
          console.log('Kuromoji tokenizer built successfully');
          resolve(tokenizer);
        }
      });
    } catch (error) {
      console.error('Error creating kuromoji builder:', error);
      reject(error);
    }
  });
}