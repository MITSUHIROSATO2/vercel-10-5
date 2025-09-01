'use client';

import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';

interface MorphMapping {
  meshName: string;
  dictionaryKeys: string[];
  influenceCount: number;
  testResults: {
    index: number;
    activated: boolean;
    description: string;
  }[];
}

function DetailedAvatarInvestigator() {
  const gltf = useGLTF('/models/man-grey-suit-optimized.glb');
  const [morphMappings, setMorphMappings] = useState<MorphMapping[]>([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(-1);
  const [isAutoTesting, setIsAutoTesting] = useState(false);
  const [testValue, setTestValue] = useState(0);
  const [selectedMesh, setSelectedMesh] = useState<any>(null);
  const testTimer = useRef(0);
  const autoTestTimer = useRef(0);
  
  useEffect(() => {
    if (!gltf) return;
    
    console.log('=== DETAILED INVESTIGATION START ===');
    console.log('Full GLTF Object:', gltf);
    
    const mappings: MorphMapping[] = [];
    
    // Traverse scene and collect all morph target information
    gltf.scene.traverse((child: any) => {
      if ((child.isMesh || child.isSkinnedMesh) && child.morphTargetInfluences) {
        const mapping: MorphMapping = {
          meshName: child.name || 'Unnamed',
          dictionaryKeys: [],
          influenceCount: child.morphTargetInfluences.length,
          testResults: []
        };
        
        // Get dictionary keys if available
        if (child.morphTargetDictionary) {
          mapping.dictionaryKeys = Object.keys(child.morphTargetDictionary);
          console.log(`\n=== Mesh: ${child.name} ===`);
          console.log('Morph Target Dictionary:');
          Object.entries(child.morphTargetDictionary).forEach(([key, value]) => {
            console.log(`  "${key}" => index ${value}`);
          });
        }
        
        // Log geometry morph attributes
        if (child.geometry && child.geometry.morphAttributes) {
          console.log('Geometry Morph Attributes:', Object.keys(child.geometry.morphAttributes));
        }
        
        // Initialize test results for each influence
        for (let i = 0; i < child.morphTargetInfluences.length; i++) {
          mapping.testResults.push({
            index: i,
            activated: false,
            description: ''
          });
        }
        
        mappings.push(mapping);
        
        // Store reference to first mesh with morph targets
        if (!selectedMesh && child.morphTargetInfluences.length > 0) {
          setSelectedMesh(child);
        }
      }
    });
    
    setMorphMappings(mappings);
    console.log('=== INVESTIGATION COMPLETE ===');
    console.log('Total meshes with morph targets:', mappings.length);
  }, [gltf]);
  
  // Animation frame for testing
  useFrame((state, delta) => {
    testTimer.current += delta;
    
    // Animate test value
    setTestValue(Math.sin(testTimer.current * 2) * 0.5 + 0.5);
    
    // Auto test mode
    if (isAutoTesting) {
      autoTestTimer.current += delta;
      if (autoTestTimer.current > 1) {
        autoTestTimer.current = 0;
        setCurrentTestIndex(prev => {
          const next = prev + 1;
          if (selectedMesh && next >= selectedMesh.morphTargetInfluences.length) {
            setIsAutoTesting(false);
            return -1;
          }
          return next;
        });
      }
    }
    
    // Apply test animation to selected mesh
    if (selectedMesh && selectedMesh.morphTargetInfluences && currentTestIndex >= 0) {
      // Reset all
      for (let i = 0; i < selectedMesh.morphTargetInfluences.length; i++) {
        selectedMesh.morphTargetInfluences[i] = 0;
      }
      
      // Apply test value to current index
      if (currentTestIndex < selectedMesh.morphTargetInfluences.length) {
        selectedMesh.morphTargetInfluences[currentTestIndex] = testValue;
      }
    }
  });
  
  const testSpecificMorph = (meshName: string, targetName: string) => {
    gltf.scene.traverse((child: any) => {
      if (child.name === meshName && child.morphTargetDictionary) {
        const index = child.morphTargetDictionary[targetName];
        if (index !== undefined) {
          setSelectedMesh(child);
          setCurrentTestIndex(index);
          console.log(`Testing: ${meshName} -> ${targetName} (index ${index})`);
        }
      }
    });
  };
  
  const findAndTestPattern = (pattern: string) => {
    const results: {mesh: string, target: string, index: number}[] = [];
    
    gltf.scene.traverse((child: any) => {
      if (child.morphTargetDictionary) {
        Object.entries(child.morphTargetDictionary).forEach(([key, value]: [string, any]) => {
          if (key.toLowerCase().includes(pattern.toLowerCase())) {
            results.push({
              mesh: child.name,
              target: key,
              index: value
            });
          }
        });
      }
    });
    
    console.log(`Pattern "${pattern}" found in:`, results);
    return results;
  };
  
  return (
    <>
      <primitive object={gltf.scene} />
      
      <Html position={[0, 2.8, 0]} center style={{ width: '600px' }}>
        <div className="bg-black/95 text-white p-4 rounded-lg text-xs max-h-[500px] overflow-y-auto">
          <h3 className="text-lg font-bold mb-2 text-yellow-400">🔬 Detailed Morph Target Investigation</h3>
          
          {/* Control Panel */}
          <div className="mb-3 p-2 bg-gray-900 rounded">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <button 
                onClick={() => setIsAutoTesting(!isAutoTesting)}
                className={`px-3 py-1 rounded ${isAutoTesting ? 'bg-red-600' : 'bg-green-600'}`}
              >
                {isAutoTesting ? 'Stop Auto' : 'Start Auto'}
              </button>
              
              <button 
                onClick={() => setCurrentTestIndex(-1)}
                className="px-3 py-1 bg-gray-600 rounded"
              >
                Reset
              </button>
              
              <button 
                onClick={() => {
                  const patterns = ['eye', 'blink', 'mouth', 'jaw', 'smile', 'open'];
                  patterns.forEach(p => findAndTestPattern(p));
                }}
                className="px-3 py-1 bg-purple-600 rounded"
              >
                Find All Patterns
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => findAndTestPattern('eyeBlink')}
                className="px-3 py-1 bg-blue-600 rounded"
              >
                Test Eye Blink
              </button>
              
              <button 
                onClick={() => findAndTestPattern('mouth')}
                className="px-3 py-1 bg-blue-600 rounded"
              >
                Test Mouth
              </button>
              
              <button 
                onClick={() => findAndTestPattern('jaw')}
                className="px-3 py-1 bg-blue-600 rounded"
              >
                Test Jaw
              </button>
              
              <button 
                onClick={() => findAndTestPattern('smile')}
                className="px-3 py-1 bg-blue-600 rounded"
              >
                Test Smile
              </button>
            </div>
            
            <div className="mt-2">
              <input 
                type="number" 
                value={currentTestIndex}
                onChange={(e) => setCurrentTestIndex(parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 bg-gray-800 rounded text-white"
                placeholder="Manual index (0-150)"
              />
            </div>
          </div>
          
          {/* Current Test Info */}
          {currentTestIndex >= 0 && (
            <div className="mb-3 p-2 bg-yellow-900 rounded">
              <div className="font-bold text-yellow-300">Currently Testing:</div>
              <div>Index: {currentTestIndex}</div>
              <div>Value: {testValue.toFixed(2)}</div>
              {selectedMesh && (
                <div>Mesh: {selectedMesh.name}</div>
              )}
            </div>
          )}
          
          {/* Morph Mappings */}
          <div className="space-y-2">
            {morphMappings.map((mapping, idx) => (
              <div key={idx} className="p-2 bg-gray-800 rounded">
                <div className="font-bold text-green-400">{mapping.meshName}</div>
                <div className="text-gray-300">Influences: {mapping.influenceCount}</div>
                
                {mapping.dictionaryKeys.length > 0 && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-yellow-300">
                      Dictionary Keys ({mapping.dictionaryKeys.length})
                    </summary>
                    <div className="mt-1 pl-2 max-h-40 overflow-y-auto">
                      {mapping.dictionaryKeys.map((key, kidx) => (
                        <div 
                          key={kidx} 
                          className="text-xs hover:bg-gray-700 cursor-pointer px-1"
                          onClick={() => testSpecificMorph(mapping.meshName, key)}
                        >
                          • {key}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
                
                <button
                  onClick={() => {
                    gltf.scene.traverse((child: any) => {
                      if (child.name === mapping.meshName) {
                        setSelectedMesh(child);
                        setCurrentTestIndex(0);
                      }
                    });
                  }}
                  className="mt-1 px-2 py-1 bg-blue-700 rounded text-xs"
                >
                  Select This Mesh
                </button>
              </div>
            ))}
          </div>
        </div>
      </Html>
    </>
  );
}

// Loader component
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="text-center">
        <div className="w-24 h-24 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-lg font-semibold">Loading...</div>
        <div className="text-sm text-gray-600">{progress.toFixed(0)}%</div>
      </div>
    </Html>
  );
}

export default function DetailedInvestigationAvatar({
  showDebug = true
}: {
  showDebug?: boolean;
}) {
  return (
    <div className="relative w-full h-[600px] bg-gray-100 rounded-xl overflow-hidden">
      <Canvas camera={{ position: [0, 1.68, 2], fov: 28 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} />
        
        <Suspense fallback={<Loader />}>
          <DetailedAvatarInvestigator />
        </Suspense>
        
        <OrbitControls target={[0, 1.6, 0]} />
        <gridHelper args={[10, 10]} />
        <axesHelper args={[5]} />
      </Canvas>
      
      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs p-2 rounded">
        <div className="font-bold">🔍 Detailed Investigation Mode</div>
        <div>Use controls to test individual morph targets</div>
      </div>
    </div>
  );
}

useGLTF.preload('/models/man-grey-suit-optimized.glb');