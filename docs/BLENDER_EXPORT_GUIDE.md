# BlenderアバターのGLBエクスポート手順

## 手順

1. Blenderで `/Users/satoumitsuhiro/Desktop/無題.blend` を開く

2. ファイルメニューから「エクスポート」→「glTF 2.0 (.glb/.gltf)」を選択

3. エクスポート設定：
   - Format: `glTF Binary (.glb)`
   - Include:
     - ✅ Selected Objects（選択したオブジェクトのみの場合）
     - ✅ Custom Properties
     - ✅ Cameras（カメラを含む場合）
     - ✅ Punctual Lights（ライトを含む場合）
   - Transform:
     - ✅ +Y Up
   - Geometry:
     - ✅ Apply Modifiers
     - ✅ UVs
     - ✅ Normals
     - ✅ Tangents
     - ✅ Vertex Colors
     - Materials: `Export`
   - Animation:
     - ✅ Animation
     - ✅ Shape Keys
     - ✅ Skinning
     - Animation mode: `Actions`

4. 保存先：`/Users/satoumitsuhiro/Desktop/東京科学大学/interview/dental-ai-simulator/public/models/blender-avatar.glb`

5. 「Export glTF 2.0」ボタンをクリック

## エクスポート後の確認

エクスポートしたGLBファイルは以下のツールで確認できます：
- https://gltf-viewer.donmccurdy.com/
- https://sandbox.babylonjs.com/