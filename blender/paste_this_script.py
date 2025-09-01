# このスクリプトをBlenderのテキストエディタにコピー＆ペーストしてください

import bpy

# シーンをクリア
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# 頭部を作成
bpy.ops.mesh.primitive_uv_sphere_add(location=(0, 0, 0))
head = bpy.context.active_object
head.name = "Head"
head.scale = (0.95, 1.05, 0.9)

# スムーズシェーディング
bpy.ops.object.shade_smooth()

# Subdivision Surface
modifier = head.modifiers.new(name="Subdivision", type='SUBSURF')
modifier.levels = 2
modifier.render_levels = 2

# 肌のマテリアル
skin_mat = bpy.data.materials.new(name="Skin")
skin_mat.use_nodes = True
bsdf = skin_mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs[0].default_value = (1.0, 0.831, 0.702, 1.0)  # Base Color
head.data.materials.append(skin_mat)

# 目を作成
for i, x in enumerate([-0.15, 0.15]):
    # 白目
    bpy.ops.mesh.primitive_uv_sphere_add(
        location=(x, 0.12, 0.4),
        scale=(0.08, 0.08, 0.08)
    )
    eye_white = bpy.context.active_object
    eye_white.name = f"EyeWhite.{'L' if i == 0 else 'R'}"
    bpy.ops.object.shade_smooth()
    
    # 白目のマテリアル
    white_mat = bpy.data.materials.new(name=f"EyeWhite_{i}")
    white_mat.use_nodes = True
    white_bsdf = white_mat.node_tree.nodes["Principled BSDF"]
    white_bsdf.inputs[0].default_value = (0.95, 0.95, 0.95, 1.0)
    eye_white.data.materials.append(white_mat)
    
    # 瞳
    bpy.ops.mesh.primitive_uv_sphere_add(
        location=(x, 0.14, 0.4),
        scale=(0.03, 0.03, 0.02)
    )
    pupil = bpy.context.active_object
    pupil.name = f"Pupil.{'L' if i == 0 else 'R'}"
    
    # 瞳のマテリアル
    pupil_mat = bpy.data.materials.new(name=f"Pupil_{i}")
    pupil_mat.use_nodes = True
    pupil_bsdf = pupil_mat.node_tree.nodes["Principled BSDF"]
    pupil_bsdf.inputs[0].default_value = (0.05, 0.05, 0.05, 1.0)
    pupil.data.materials.append(pupil_mat)

# 口を作成
bpy.ops.mesh.primitive_cube_add(
    location=(0, -0.2, 0.45),
    scale=(0.15, 0.03, 0.04)
)
mouth = bpy.context.active_object
mouth.name = "Mouth"
modifier = mouth.modifiers.new(name="Subdivision", type='SUBSURF')
modifier.levels = 2

# 口のマテリアル
mouth_mat = bpy.data.materials.new(name="Lips")
mouth_mat.use_nodes = True
mouth_bsdf = mouth_mat.node_tree.nodes["Principled BSDF"]
mouth_bsdf.inputs[0].default_value = (0.8, 0.4, 0.4, 1.0)
mouth.data.materials.append(mouth_mat)

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

# 髪を作成
bpy.ops.mesh.primitive_uv_sphere_add(
    location=(0, 0.35, 0),
    scale=(0.52, 0.52, 0.52)
)
hair = bpy.context.active_object
hair.name = "Hair"

# 髪を半分にカット（編集モード）
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.bisect(plane_co=(0, 0, 0), plane_no=(0, 0, 1), clear_inner=True)
bpy.ops.object.mode_set(mode='OBJECT')

# 髪のマテリアル
hair_mat = bpy.data.materials.new(name="Hair")
hair_mat.use_nodes = True
hair_bsdf = hair_mat.node_tree.nodes["Principled BSDF"]
hair_bsdf.inputs[0].default_value = (0.1, 0.08, 0.06, 1.0)
hair.data.materials.append(hair_mat)

# すべてを頭部の子にする
for obj in bpy.data.objects:
    if obj.name != "Head" and obj.type == 'MESH':
        obj.parent = head

# カメラとライトを配置
bpy.ops.object.camera_add(location=(0, -3, 0.5), rotation=(1.5708, 0, 0))
bpy.ops.object.light_add(type='AREA', location=(2, -2, 2))

print("✅ アバターが作成されました！")
print("次のステップ:")
print("1. File → Export → glTF 2.0")
print("2. ファイル名: patient-avatar.glb")
print("3. Format: glTF Binary (.glb)")
print("4. +Y Up にチェック")