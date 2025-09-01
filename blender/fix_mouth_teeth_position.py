"""
口と歯の位置を正確に修正
"""
import bpy
import bmesh
from mathutils import Vector

print("=== 口と歯の位置修正 ===\n")

# 顔のオブジェクトを取得
face_obj = bpy.data.objects.get('HighQualityFaceAvatar')

if face_obj:
    mesh = face_obj.data
    
    # 口の正確な位置を再分析
    print("口の位置を分析中...")
    
    # BMeshを作成
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.verts.ensure_lookup_table()
    
    # 口の領域の頂点を収集（前回の分析結果より）
    mouth_verts = []
    mouth_coords = {
        'x_min': float('inf'), 'x_max': float('-inf'),
        'y_min': float('inf'), 'y_max': float('-inf'),
        'z_min': float('inf'), 'z_max': float('-inf')
    }
    
    # 正確な口の位置（Y: -0.642 〜 -0.550, Z: -0.45 〜 -0.15）
    for v in bm.verts:
        if (-0.65 < v.co.y < -0.54 and
            -0.45 < v.co.z < -0.15 and
            -0.15 < v.co.x < 0.15):
            mouth_verts.append(v)
            
            # 範囲を更新
            mouth_coords['x_min'] = min(mouth_coords['x_min'], v.co.x)
            mouth_coords['x_max'] = max(mouth_coords['x_max'], v.co.x)
            mouth_coords['y_min'] = min(mouth_coords['y_min'], v.co.y)
            mouth_coords['y_max'] = max(mouth_coords['y_max'], v.co.y)
            mouth_coords['z_min'] = min(mouth_coords['z_min'], v.co.z)
            mouth_coords['z_max'] = max(mouth_coords['z_max'], v.co.z)
    
    # 口の中心を計算
    mouth_center = Vector((
        (mouth_coords['x_min'] + mouth_coords['x_max']) / 2,
        (mouth_coords['y_min'] + mouth_coords['y_max']) / 2,
        (mouth_coords['z_min'] + mouth_coords['z_max']) / 2
    ))
    
    print(f"\n口の実際の位置:")
    print(f"  X範囲: {mouth_coords['x_min']:.3f} 〜 {mouth_coords['x_max']:.3f}")
    print(f"  Y範囲: {mouth_coords['y_min']:.3f} 〜 {mouth_coords['y_max']:.3f}")
    print(f"  Z範囲: {mouth_coords['z_min']:.3f} 〜 {mouth_coords['z_max']:.3f}")
    print(f"  中心: ({mouth_center.x:.3f}, {mouth_center.y:.3f}, {mouth_center.z:.3f})")
    
    # 唇の境界線を特定
    lip_line_z = mouth_center.z  # 口の中心Z座標
    
    # 上唇と下唇の正確な範囲
    upper_lip_z_min = lip_line_z
    upper_lip_z_max = mouth_coords['z_max']
    lower_lip_z_max = lip_line_z
    lower_lip_z_min = mouth_coords['z_min']
    
    print(f"\n唇の境界:")
    print(f"  上唇: Z {upper_lip_z_min:.3f} 〜 {upper_lip_z_max:.3f}")
    print(f"  下唇: Z {lower_lip_z_min:.3f} 〜 {lower_lip_z_max:.3f}")
    
    bm.free()
    
    # 既存の口腔内オブジェクトを削除
    print("\n既存の口腔内構造を削除中...")
    for obj in bpy.data.objects:
        if obj.name in ['UpperTeeth', 'LowerTeeth', 'Tongue', 'Palate', 'MouthInterior']:
            bpy.data.objects.remove(obj, do_unlink=True)
    
    # 新しい歯を正確な位置に作成
    print("\n正確な位置に歯を作成中...")
    
    # 上の歯
    upper_teeth_mesh = bpy.data.meshes.new("UpperTeeth")
    upper_teeth_obj = bpy.data.objects.new("UpperTeeth", upper_teeth_mesh)
    bpy.context.collection.objects.link(upper_teeth_obj)
    
    teeth_verts = []
    teeth_faces = []
    
    # 歯の配置パラメータ
    num_teeth = 6  # 前歯6本
    teeth_width = (mouth_coords['x_max'] - mouth_coords['x_min']) * 0.8  # 口の幅の80%
    tooth_width = teeth_width / num_teeth
    tooth_height = 0.015
    tooth_depth = 0.01
    
    # 上の歯の位置（上唇の内側）
    upper_teeth_y = mouth_center.y + 0.01  # 少し奥
    upper_teeth_z = upper_lip_z_min + 0.01  # 上唇の少し下
    
    for i in range(num_teeth):
        x_pos = mouth_center.x - teeth_width/2 + (i + 0.5) * tooth_width
        
        base_idx = len(teeth_verts)
        # 歯の頂点
        teeth_verts.extend([
            # 前面下
            (x_pos - tooth_width*0.4, upper_teeth_y - tooth_depth/2, upper_teeth_z),
            (x_pos + tooth_width*0.4, upper_teeth_y - tooth_depth/2, upper_teeth_z),
            # 前面上
            (x_pos - tooth_width*0.3, upper_teeth_y - tooth_depth/2, upper_teeth_z + tooth_height),
            (x_pos + tooth_width*0.3, upper_teeth_y - tooth_depth/2, upper_teeth_z + tooth_height),
            # 背面下
            (x_pos - tooth_width*0.4, upper_teeth_y + tooth_depth/2, upper_teeth_z),
            (x_pos + tooth_width*0.4, upper_teeth_y + tooth_depth/2, upper_teeth_z),
            # 背面上
            (x_pos - tooth_width*0.3, upper_teeth_y + tooth_depth/2, upper_teeth_z + tooth_height),
            (x_pos + tooth_width*0.3, upper_teeth_y + tooth_depth/2, upper_teeth_z + tooth_height),
        ])
        
        # 面
        teeth_faces.extend([
            # 前面
            (base_idx, base_idx+1, base_idx+3, base_idx+2),
            # 背面
            (base_idx+4, base_idx+6, base_idx+7, base_idx+5),
            # 底面
            (base_idx, base_idx+4, base_idx+5, base_idx+1),
            # 上面
            (base_idx+2, base_idx+3, base_idx+7, base_idx+6),
            # 左側
            (base_idx, base_idx+2, base_idx+6, base_idx+4),
            # 右側
            (base_idx+1, base_idx+5, base_idx+7, base_idx+3),
        ])
    
    upper_teeth_mesh.from_pydata(teeth_verts, [], teeth_faces)
    upper_teeth_mesh.update()
    
    # 下の歯
    lower_teeth_mesh = bpy.data.meshes.new("LowerTeeth")
    lower_teeth_obj = bpy.data.objects.new("LowerTeeth", lower_teeth_mesh)
    bpy.context.collection.objects.link(lower_teeth_obj)
    
    teeth_verts = []
    teeth_faces = []
    
    # 下の歯の位置（下唇の内側）
    lower_teeth_y = mouth_center.y + 0.01
    lower_teeth_z = lower_lip_z_max - 0.01  # 下唇の少し上
    
    for i in range(num_teeth):
        x_pos = mouth_center.x - teeth_width/2 + (i + 0.5) * tooth_width
        
        base_idx = len(teeth_verts)
        teeth_verts.extend([
            # 前面上
            (x_pos - tooth_width*0.4, lower_teeth_y - tooth_depth/2, lower_teeth_z),
            (x_pos + tooth_width*0.4, lower_teeth_y - tooth_depth/2, lower_teeth_z),
            # 前面下
            (x_pos - tooth_width*0.3, lower_teeth_y - tooth_depth/2, lower_teeth_z - tooth_height),
            (x_pos + tooth_width*0.3, lower_teeth_y - tooth_depth/2, lower_teeth_z - tooth_height),
            # 背面上
            (x_pos - tooth_width*0.4, lower_teeth_y + tooth_depth/2, lower_teeth_z),
            (x_pos + tooth_width*0.4, lower_teeth_y + tooth_depth/2, lower_teeth_z),
            # 背面下
            (x_pos - tooth_width*0.3, lower_teeth_y + tooth_depth/2, lower_teeth_z - tooth_height),
            (x_pos + tooth_width*0.3, lower_teeth_y + tooth_depth/2, lower_teeth_z - tooth_height),
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
    
    # 舌を正確な位置に作成
    print("舌を作成中...")
    
    tongue_mesh = bpy.data.meshes.new("Tongue")
    tongue_obj = bpy.data.objects.new("Tongue", tongue_mesh)
    bpy.context.collection.objects.link(tongue_obj)
    
    # 舌の位置（下の歯の後ろ）
    tongue_y_front = lower_teeth_y
    tongue_z = lower_teeth_z - 0.005
    
    tongue_verts = [
        # 先端
        (mouth_center.x, tongue_y_front, tongue_z),
        # 幅広部分
        (mouth_center.x - 0.02, tongue_y_front + 0.02, tongue_z),
        (mouth_center.x + 0.02, tongue_y_front + 0.02, tongue_z),
        (mouth_center.x - 0.03, tongue_y_front + 0.04, tongue_z - 0.005),
        (mouth_center.x + 0.03, tongue_y_front + 0.04, tongue_z - 0.005),
        # 根元
        (mouth_center.x - 0.02, tongue_y_front + 0.06, tongue_z - 0.01),
        (mouth_center.x + 0.02, tongue_y_front + 0.06, tongue_z - 0.01),
        # 底面頂点（同じ形状で少し下）
        (mouth_center.x, tongue_y_front, tongue_z - 0.01),
        (mouth_center.x - 0.02, tongue_y_front + 0.02, tongue_z - 0.01),
        (mouth_center.x + 0.02, tongue_y_front + 0.02, tongue_z - 0.01),
        (mouth_center.x - 0.03, tongue_y_front + 0.04, tongue_z - 0.015),
        (mouth_center.x + 0.03, tongue_y_front + 0.04, tongue_z - 0.015),
        (mouth_center.x - 0.02, tongue_y_front + 0.06, tongue_z - 0.02),
        (mouth_center.x + 0.02, tongue_y_front + 0.06, tongue_z - 0.02),
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
    
    # マテリアルを設定
    print("\nマテリアルを設定中...")
    
    # 歯のマテリアル
    teeth_mat = bpy.data.materials.get("TeethMaterial")
    if not teeth_mat:
        teeth_mat = bpy.data.materials.new(name="TeethMaterial")
        teeth_mat.use_nodes = True
        for node in teeth_mat.node_tree.nodes:
            if node.type == 'BSDF_PRINCIPLED':
                node.inputs[0].default_value = (0.95, 0.95, 0.9, 1.0)
                break
    
    upper_teeth_obj.data.materials.append(teeth_mat)
    lower_teeth_obj.data.materials.append(teeth_mat)
    
    # 舌のマテリアル
    tongue_mat = bpy.data.materials.get("TongueMaterial")
    if not tongue_mat:
        tongue_mat = bpy.data.materials.new(name="TongueMaterial")
        tongue_mat.use_nodes = True
        for node in tongue_mat.node_tree.nodes:
            if node.type == 'BSDF_PRINCIPLED':
                node.inputs[0].default_value = (0.8, 0.4, 0.4, 1.0)
                break
    
    tongue_obj.data.materials.append(tongue_mat)
    
    # 親子関係とボーン連携
    upper_teeth_obj.parent = face_obj
    
    armature_obj = bpy.data.objects.get('FaceRig')
    if armature_obj:
        # 下の歯と舌を顎ボーンに連動
        lower_teeth_obj.parent = armature_obj
        lower_teeth_obj.parent_type = 'BONE'
        lower_teeth_obj.parent_bone = 'Jaw'
        
        tongue_obj.parent = armature_obj
        tongue_obj.parent_type = 'BONE'
        tongue_obj.parent_bone = 'Jaw'
    
    print("\n✅ 口と歯の位置を修正完了！")
    print("\n修正内容:")
    print(f"- 口の正確な位置に基づいて配置")
    print(f"- 上の歯: Y={upper_teeth_y:.3f}, Z={upper_teeth_z:.3f}")
    print(f"- 下の歯: Y={lower_teeth_y:.3f}, Z={lower_teeth_z:.3f}")
    print(f"- 舌: 下の歯の後ろに配置")
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
else:
    print("エラー: 顔オブジェクトが見つかりません")