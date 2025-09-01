"""
シンプルなアバター生成スクリプト（Blender 4.x対応）
"""
import bpy
import os

# シーンをクリア
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# 頭部を作成
bpy.ops.mesh.primitive_uv_sphere_add(
    segments=32, 
    ring_count=16, 
    location=(0, 0, 0)
)
head = bpy.context.active_object
head.name = "Head"
head.scale = (0.95, 1.05, 0.9)

# Subdivision Surface
modifier = head.modifiers.new(name="Subdivision", type='SUBSURF')
modifier.levels = 2

# シンプルな肌のマテリアル
skin_mat = bpy.data.materials.new(name="Skin")
skin_mat.use_nodes = True
# ノード名を動的に取得（Blender 4.x対応）
nodes = skin_mat.node_tree.nodes
bsdf = None
for node in nodes:
    if node.type == 'BSDF_PRINCIPLED':
        bsdf = node
        break
if bsdf:
    # Base Colorのみ設定（Blender 4.x互換）
    bsdf.inputs[0].default_value = (1.0, 0.831, 0.702, 1.0)  # Base Color
    bsdf.inputs[2].default_value = 0.7  # Roughness
head.data.materials.append(skin_mat)

# 目を作成
for i, x in enumerate([-0.15, 0.15]):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=16,
        ring_count=8,
        location=(x, 0.12, 0.4),
        scale=(0.08, 0.08, 0.08)
    )
    eye = bpy.context.active_object
    eye.name = f"Eye.{'L' if i == 0 else 'R'}"
    
    # 目のマテリアル（黒）
    eye_mat = bpy.data.materials.new(name=f"Eye_{i}")
    eye_mat.use_nodes = True
    # ノード名を動的に取得
    eye_nodes = eye_mat.node_tree.nodes
    eye_bsdf = None
    for node in eye_nodes:
        if node.type == 'BSDF_PRINCIPLED':
            eye_bsdf = node
            break
    if eye_bsdf:
        eye_bsdf.inputs[0].default_value = (0.05, 0.05, 0.05, 1.0)
    eye.data.materials.append(eye_mat)
    eye.parent = head

# 口を作成
bpy.ops.mesh.primitive_cube_add(
    location=(0, -0.2, 0.45),
    scale=(0.15, 0.03, 0.04)
)
mouth = bpy.context.active_object
mouth.name = "Mouth"

# 口を滑らかに
modifier = mouth.modifiers.new(name="Subdivision", type='SUBSURF')
modifier.levels = 2

# 口のマテリアル
mouth_mat = bpy.data.materials.new(name="Lips")
mouth_mat.use_nodes = True
# ノード名を動的に取得
mouth_nodes = mouth_mat.node_tree.nodes
mouth_bsdf = None
for node in mouth_nodes:
    if node.type == 'BSDF_PRINCIPLED':
        mouth_bsdf = node
        break
if mouth_bsdf:
    mouth_bsdf.inputs[0].default_value = (0.8, 0.4, 0.4, 1.0)
mouth.data.materials.append(mouth_mat)
mouth.parent = head

# 鼻を作成
bpy.ops.mesh.primitive_cube_add(
    location=(0, 0.05, 0.48),
    scale=(0.04, 0.06, 0.03)
)
nose = bpy.context.active_object
nose.name = "Nose"
modifier = nose.modifiers.new(name="Subdivision", type='SUBSURF')
modifier.levels = 2
nose.data.materials.append(skin_mat)
nose.parent = head

# 髪を作成（シンプルなキャップ型）
bpy.ops.mesh.primitive_uv_sphere_add(
    segments=32,
    ring_count=16,
    location=(0, 0.35, 0),
    scale=(0.52, 0.52, 0.52)
)
hair = bpy.context.active_object
hair.name = "Hair"

# 髪のマテリアル
hair_mat = bpy.data.materials.new(name="Hair")
hair_mat.use_nodes = True
# ノード名を動的に取得
hair_nodes = hair_mat.node_tree.nodes
hair_bsdf = None
for node in hair_nodes:
    if node.type == 'BSDF_PRINCIPLED':
        hair_bsdf = node
        break
if hair_bsdf:
    hair_bsdf.inputs[0].default_value = (0.1, 0.08, 0.06, 1.0)
    hair_bsdf.inputs[2].default_value = 0.9
hair.data.materials.append(hair_mat)
hair.parent = head

# シェイプキーを追加（頭部のみ）
bpy.context.view_layer.objects.active = head
bpy.ops.object.shape_key_add(from_mix=False)  # Basis

# 基本的なシェイプキー
shape_keys = ["mouth_open", "vowel_a", "vowel_i", "vowel_u", "vowel_e", "vowel_o", "blink", "happy", "sad"]
for key_name in shape_keys:
    bpy.ops.object.shape_key_add(from_mix=False)
    key_block = head.data.shape_keys.key_blocks[-1]
    key_block.name = key_name
    key_block.value = 0

# すべてを選択
bpy.ops.object.select_all(action='SELECT')

# エクスポート先を設定
script_dir = os.path.dirname(os.path.abspath(__file__))
output_path = os.path.join(script_dir, "../public/models/patient-avatar.glb")
output_dir = os.path.dirname(output_path)

# ディレクトリを作成
os.makedirs(output_dir, exist_ok=True)

# GLBとしてエクスポート
bpy.ops.export_scene.gltf(
    filepath=output_path,
    export_format='GLB',
    export_yup=True,
    export_apply=True,
    export_animations=True,
    export_morph=True,
    use_selection=True
)

print(f"✅ アバターが生成されました: {output_path}")