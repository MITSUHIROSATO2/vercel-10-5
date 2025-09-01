# ClassicMan.blend を GLB形式に変換する手順

## 方法1: Blender GUI を使用

1. **Blenderでファイルを開く**
   ```
   /Users/satoumitsuhiro/Desktop/東京科学大学/interview/dental-ai-simulator/public/models/ClassicMan.blend
   ```

2. **マテリアルの確認と修正**
   - Shading タブに切り替え
   - 各マテリアルを選択
   - Shader EditorでPrincipled BSDFノードを使用していることを確認
   - 複雑なノードがある場合は削除してPrincipled BSDFのみにする

3. **テクスチャをパック（必要な場合）**
   - File > External Data > Pack Resources

4. **GLBエクスポート**
   - File > Export > glTF 2.0 (.glb/.gltf)
   - 保存先: `/Users/satoumitsuhiro/Desktop/東京科学大学/interview/dental-ai-simulator/public/models/ClassicMan_new.glb`
   
   **エクスポート設定:**
   
   **Format:**
   - Format: glTF Binary (.glb) ✓
   
   **Include:**
   - [x] Selected Objects（オフにしてすべてエクスポート）
   - [ ] Custom Properties
   - [ ] Cameras
   - [ ] Punctual Lights
   
   **Transform:**
   - [x] +Y Up
   
   **Geometry:**
   - [x] Apply Modifiers
   - [x] UVs
   - [x] Normals
   - [x] Tangents
   - [x] Vertex Colors
   
   **Material:**
   - Materials: Export ✓
   - Images: Automatic
   - [x] Compression: 85
   
   **Animation:**（アニメーションがある場合）
   - [x] Animation
   - [x] Shape Keys
   - [x] Skinning
   - [x] Bake All Actions
   
   **Shape Keys:**
   - [x] Shape Keys
   - [x] Shape Keys Normals

5. **Export glTF 2.0 をクリック**

## 方法2: Blender スクリプトエディタを使用

1. Blenderで`ClassicMan.blend`を開く
2. Scripting タブに切り替え
3. 新規スクリプトを作成
4. 以下のコードを貼り付けて実行:

```python
import bpy
import os

# マテリアルを簡素化
for mat in bpy.data.materials:
    if mat.use_nodes:
        nodes = mat.node_tree.nodes
        principled = None
        
        for node in nodes:
            if node.type == 'BSDF_PRINCIPLED':
                principled = node
                break
        
        if not principled:
            nodes.clear()
            principled = nodes.new(type='ShaderNodeBsdfPrincipled')
            output = nodes.new(type='ShaderNodeOutputMaterial')
            mat.node_tree.links.new(principled.outputs['BSDF'], output.inputs['Surface'])

# テクスチャをパック
bpy.ops.file.pack_all()

# 出力パス
output_path = bpy.data.filepath.replace('.blend', '_new.glb')

# GLBエクスポート
bpy.ops.export_scene.gltf(
    filepath=output_path,
    export_format='GLB',
    export_yup=True,
    export_apply=True,
    export_texcoords=True,
    export_normals=True,
    export_colors=True,
    export_materials='EXPORT',
    export_image_format='AUTO',
    export_animations=True,
    export_morph=True,
    export_skins=True
)

print(f"エクスポート完了: {output_path}")
```

## 方法3: コマンドライン（Blenderがパスに設定されている場合）

```bash
# macOSでBlenderアプリケーションを使用
/Applications/Blender.app/Contents/MacOS/Blender \
  /Users/satoumitsuhiro/Desktop/東京科学大学/interview/dental-ai-simulator/public/models/ClassicMan.blend \
  --background \
  --python /Users/satoumitsuhiro/Desktop/東京科学大学/interview/dental-ai-simulator/scripts/convert_blend_to_glb.py
```

## エクスポート後の確認

1. **ファイルサイズの確認**
   - GLBファイルが生成されていることを確認
   - ファイルサイズが0KBでないことを確認

2. **オンラインビューアでテスト**
   - https://gltf-viewer.donmccurdy.com/
   - ファイルをドラッグ&ドロップ

3. **Three.jsでの確認**
   - ブラウザで`/avatar-analyzer`ページを開く
   - ClassicManを選択して構造を確認

## トラブルシューティング

### マテリアルが黒い場合
- Blenderで各マテリアルのBase Colorを確認
- Principled BSDFノードのBase Colorに色を設定

### テクスチャが表示されない場合
- File > External Data > Pack Resources を実行
- エクスポート時にImages: Automaticを選択

### モーフターゲットがない場合
- Shape Keysタブを確認
- エクスポート設定でShape Keysにチェック