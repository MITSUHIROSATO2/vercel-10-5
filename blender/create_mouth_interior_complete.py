"""
完全な口腔内構造（歯、舌、口蓋）を作成
"""
import bpy
import math
from mathutils import Vector

print("=== 完全な口腔内構造作成 ===\n")

# 既存の口腔内オブジェクトを削除
for obj in bpy.data.objects:
    if 'MouthInterior' in obj.name or 'Teeth' in obj.name or 'Tongue' in obj.name:
        bpy.data.objects.remove(obj, do_unlink=True)

# メインオブジェクトを取得
face_obj = bpy.data.objects.get('HighQualityFaceAvatar')

if face_obj:
    # 口の中心位置
    center_x = 0.0
    center_y = -0.58
    center_z = -0.30
    
    # 1. 歯の作成
    print("歯を作成中...")
    
    # 上の歯
    upper_teeth_mesh = bpy.data.meshes.new("UpperTeeth")
    upper_teeth_obj = bpy.data.objects.new("UpperTeeth", upper_teeth_mesh)
    bpy.context.collection.objects.link(upper_teeth_obj)
    
    # 簡略化された歯の形状
    teeth_verts = []
    teeth_faces = []
    
    # 歯の数と配置
    num_teeth = 8  # 片側4本
    teeth_width = 0.12
    tooth_size = teeth_width / num_teeth * 2
    
    # 上の歯を生成
    for i in range(num_teeth):
        x_pos = -teeth_width + (i + 0.5) * tooth_size
        
        # 各歯の頂点（簡略化）
        base_idx = len(teeth_verts)
        teeth_verts.extend([
            (x_pos - tooth_size/3, center_y - 0.02, center_z + 0.02),
            (x_pos + tooth_size/3, center_y - 0.02, center_z + 0.02),
            (x_pos - tooth_size/3, center_y + 0.02, center_z + 0.02),
            (x_pos + tooth_size/3, center_y + 0.02, center_z + 0.02),
            (x_pos - tooth_size/3, center_y - 0.02, center_z + 0.04),
            (x_pos + tooth_size/3, center_y - 0.02, center_z + 0.04),
            (x_pos - tooth_size/3, center_y + 0.02, center_z + 0.04),
            (x_pos + tooth_size/3, center_y + 0.02, center_z + 0.04),
        ])
        
        # 面を定義
        teeth_faces.extend([
            (base_idx, base_idx+1, base_idx+3, base_idx+2),
            (base_idx+4, base_idx+6, base_idx+7, base_idx+5),
            (base_idx, base_idx+4, base_idx+5, base_idx+1),
            (base_idx+2, base_idx+3, base_idx+7, base_idx+6),
            (base_idx, base_idx+2, base_idx+6, base_idx+4),
            (base_idx+1, base_idx+5, base_idx+7, base_idx+3),
        ])
    
    upper_teeth_mesh.from_pydata(teeth_verts, [], teeth_faces)
    upper_teeth_mesh.update()
    
    # 下の歯（同様に作成）
    lower_teeth_mesh = bpy.data.meshes.new("LowerTeeth")
    lower_teeth_obj = bpy.data.objects.new("LowerTeeth", lower_teeth_mesh)
    bpy.context.collection.objects.link(lower_teeth_obj)
    
    teeth_verts = []
    teeth_faces = []
    
    for i in range(num_teeth):
        x_pos = -teeth_width + (i + 0.5) * tooth_size
        
        base_idx = len(teeth_verts)
        teeth_verts.extend([
            (x_pos - tooth_size/3, center_y - 0.02, center_z - 0.06),
            (x_pos + tooth_size/3, center_y - 0.02, center_z - 0.06),
            (x_pos - tooth_size/3, center_y + 0.02, center_z - 0.06),
            (x_pos + tooth_size/3, center_y + 0.02, center_z - 0.06),
            (x_pos - tooth_size/3, center_y - 0.02, center_z - 0.04),
            (x_pos + tooth_size/3, center_y - 0.02, center_z - 0.04),
            (x_pos - tooth_size/3, center_y + 0.02, center_z - 0.04),
            (x_pos + tooth_size/3, center_y + 0.02, center_z - 0.04),
        ])
        
        teeth_faces.extend([
            (base_idx, base_idx+1, base_idx+3, base_idx+2),
            (base_idx+4, base_idx+6, base_idx+7, base_idx+5),
            (base_idx, base_idx+4, base_idx+5, base_idx+1),
            (base_idx+2, base_idx+3, base_idx+7, base_idx+6),
            (base_idx, base_idx+2, base_idx+6, base_idx+4),
            (base_idx+1, base_idx+5, base_idx+7, base_idx+3),
        ])
    
    lower_teeth_mesh.from_pydata(teeth_verts, [], teeth_faces)
    lower_teeth_mesh.update()
    
    # 2. 舌の作成
    print("舌を作成中...")
    
    tongue_mesh = bpy.data.meshes.new("Tongue")
    tongue_obj = bpy.data.objects.new("Tongue", tongue_mesh)
    bpy.context.collection.objects.link(tongue_obj)
    
    # 舌の形状（簡略化）
    tongue_verts = [
        # 先端
        (0.0, center_y - 0.05, center_z - 0.04),
        # 中央部
        (-0.03, center_y, center_z - 0.04),
        (0.03, center_y, center_z - 0.04),
        (-0.04, center_y + 0.05, center_z - 0.04),
        (0.04, center_y + 0.05, center_z - 0.04),
        # 根元
        (-0.03, center_y + 0.08, center_z - 0.05),
        (0.03, center_y + 0.08, center_z - 0.05),
        # 底面
        (0.0, center_y - 0.05, center_z - 0.06),
        (-0.03, center_y, center_z - 0.06),
        (0.03, center_y, center_z - 0.06),
        (-0.04, center_y + 0.05, center_z - 0.06),
        (0.04, center_y + 0.05, center_z - 0.06),
        (-0.03, center_y + 0.08, center_z - 0.06),
        (0.03, center_y + 0.08, center_z - 0.06),
    ]
    
    tongue_faces = [
        # 上面
        (0, 1, 2),
        (1, 3, 4, 2),
        (3, 5, 6, 4),
        # 底面
        (7, 9, 8),
        (8, 9, 11, 10),
        (10, 11, 13, 12),
        # 側面
        (0, 7, 8, 1),
        (1, 8, 10, 3),
        (3, 10, 12, 5),
        (2, 4, 11, 9),
        (4, 6, 13, 11),
        (0, 2, 9, 7),
        (5, 12, 13, 6),
    ]
    
    tongue_mesh.from_pydata(tongue_verts, [], tongue_faces)
    tongue_mesh.update()
    
    # 3. 口蓋の作成
    print("口蓋を作成中...")
    
    palate_mesh = bpy.data.meshes.new("Palate")
    palate_obj = bpy.data.objects.new("Palate", palate_mesh)
    bpy.context.collection.objects.link(palate_obj)
    
    # 口蓋の形状
    palate_verts = [
        (-0.1, center_y - 0.02, center_z + 0.05),
        (0.1, center_y - 0.02, center_z + 0.05),
        (-0.1, center_y + 0.1, center_z + 0.05),
        (0.1, center_y + 0.1, center_z + 0.05),
        (-0.08, center_y, center_z + 0.07),
        (0.08, center_y, center_z + 0.07),
        (-0.08, center_y + 0.08, center_z + 0.07),
        (0.08, center_y + 0.08, center_z + 0.07),
    ]
    
    palate_faces = [
        (0, 1, 5, 4),
        (4, 5, 7, 6),
        (2, 6, 7, 3),
        (0, 4, 6, 2),
        (1, 3, 7, 5),
    ]
    
    palate_mesh.from_pydata(palate_verts, [], palate_faces)
    palate_mesh.update()
    
    # マテリアルを設定
    print("マテリアルを設定中...")
    
    # 歯のマテリアル（白）
    teeth_mat = bpy.data.materials.new(name="TeethMaterial")
    teeth_mat.use_nodes = True
    bsdf = None
    for node in teeth_mat.node_tree.nodes:
        if node.type == 'BSDF_PRINCIPLED':
            bsdf = node
            break
    if bsdf:
        bsdf.inputs[0].default_value = (0.95, 0.95, 0.9, 1.0)  # Base Color
    
    upper_teeth_obj.data.materials.append(teeth_mat)
    lower_teeth_obj.data.materials.append(teeth_mat)
    
    # 舌のマテリアル（ピンク）
    tongue_mat = bpy.data.materials.new(name="TongueMaterial")
    tongue_mat.use_nodes = True
    bsdf = None
    for node in tongue_mat.node_tree.nodes:
        if node.type == 'BSDF_PRINCIPLED':
            bsdf = node
            break
    if bsdf:
        bsdf.inputs[0].default_value = (0.8, 0.4, 0.4, 1.0)  # Base Color
    
    tongue_obj.data.materials.append(tongue_mat)
    
    # 口蓋のマテリアル（薄いピンク）
    palate_mat = bpy.data.materials.new(name="PalateMaterial")
    palate_mat.use_nodes = True
    bsdf = None
    for node in palate_mat.node_tree.nodes:
        if node.type == 'BSDF_PRINCIPLED':
            bsdf = node
            break
    if bsdf:
        bsdf.inputs[0].default_value = (0.9, 0.6, 0.6, 1.0)  # Base Color
    
    palate_obj.data.materials.append(palate_mat)
    
    # 親子関係を設定
    for obj in [upper_teeth_obj, lower_teeth_obj, tongue_obj, palate_obj]:
        obj.parent = face_obj
    
    # 顎ボーンとの連携
    armature_obj = bpy.data.objects.get('FaceRig')
    if armature_obj:
        # 下の歯と舌を顎ボーンに連動
        lower_teeth_obj.parent = armature_obj
        lower_teeth_obj.parent_type = 'BONE'
        lower_teeth_obj.parent_bone = 'Jaw'
        
        tongue_obj.parent = armature_obj
        tongue_obj.parent_type = 'BONE'
        tongue_obj.parent_bone = 'Jaw'
    
    print("\n✅ 口腔内構造作成完了！")
    print("\n作成した構造:")
    print("- UpperTeeth: 上の歯")
    print("- LowerTeeth: 下の歯（顎ボーンに連動）")
    print("- Tongue: 舌（顎ボーンに連動）")
    print("- Palate: 口蓋")
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
else:
    print("エラー: 顔オブジェクトが見つかりません")