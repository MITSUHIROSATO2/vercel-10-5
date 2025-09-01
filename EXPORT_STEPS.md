# BlenderからGLBファイルをエクスポートする手順

## エクスポート手順

1. **File メニューを開く**
   - 画面左上の「File」をクリック

2. **Export を選択**
   - File → Export → glTF 2.0 (.glb/.gltf)

3. **エクスポート設定**
   左側のパネルで以下を設定：
   
   - **Format**: glTF Binary (.glb) を選択
   - **Include**:
     - ✓ Selected Objects
     - ✓ Custom Properties
     - ✓ Cameras (不要ならオフ)
     - ✓ Punctual Lights (不要ならオフ)
   
   - **Transform**:
     - ✓ +Y Up （重要！）
   
   - **Geometry**:
     - ✓ Apply Modifiers
     - ✓ UVs
     - ✓ Normals
     - ✓ Tangents
     - ✓ Vertex Colors
   
   - **Animation**:
     - ✓ Animation
     - ✓ Shape Keys
     - ✓ Skinning

4. **保存先を指定**
   - ファイル名: `patient-avatar.glb`
   - 保存先: `/Users/satoumitsuhiro/Desktop/東京科学大学/interview/dental-ai-simulator/public/models/`

5. **Export glTF 2.0 ボタンをクリック**

## エクスポート完了後

ブラウザでアプリケーションをリロードすると、新しいアバターが表示されます。