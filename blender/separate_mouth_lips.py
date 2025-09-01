"""
口の上唇と下唇を分離して開けるようにする
"""
import bpy
import bmesh
from mathutils import Vector

print("=== 口の分離処理 ===\n")

obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj and obj.type == 'MESH':
    # バックアップを作成
    backup = obj.copy()
    backup.data = obj.data.copy()
    backup.name = "HighQualityFaceAvatar_Backup"
    bpy.context.collection.objects.link(backup)
    backup.hide_set(True)
    print("バックアップを作成しました")
    
    # オブジェクトをアクティブにして編集モードへ
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='EDIT')
    
    # BMeshを作成
    bm = bmesh.from_edit_mesh(obj.data)
    bm.verts.ensure_lookup_table()
    bm.edges.ensure_lookup_table()
    
    # 選択をクリア
    for v in bm.verts:
        v.select = False
    for e in bm.edges:
        e.select = False
    
    print("口の輪郭を検出中...")
    
    # 口の中心線を定義（Z座標）
    mouth_center_z = -0.30
    
    # 口の輪郭となる頂点を選択
    mouth_outline_verts = []
    
    for v in bm.verts:
        # 口の領域内
        if (-0.65 < v.co.y < -0.54 and
            -0.45 < v.co.z < -0.15 and
            -0.15 < v.co.x < 0.15):
            
            # 中心線に近い頂点を選択
            if abs(v.co.z - mouth_center_z) < 0.02:
                mouth_outline_verts.append(v)
                v.select = True
    
    print(f"口の輪郭頂点数: {len(mouth_outline_verts)}")
    
    # エッジを選択
    selected_edges = []
    for e in bm.edges:
        if e.verts[0].select and e.verts[1].select:
            e.select = True
            selected_edges.append(e)
    
    print(f"選択されたエッジ数: {len(selected_edges)}")
    
    # メッシュを更新
    bmesh.update_edit_mesh(obj.data)
    
    # エッジ分割を実行
    if selected_edges:
        print("\nエッジ分割を実行中...")
        bpy.ops.mesh.edge_split()
        
        # BMeshを再取得
        bm = bmesh.from_edit_mesh(obj.data)
        bm.verts.ensure_lookup_table()
    
    # 上唇と下唇の頂点グループを作成
    print("\n頂点グループを作成中...")
    
    # 既存の口関連グループをクリア
    for vg in obj.vertex_groups:
        if 'Lip' in vg.name or 'Mouth' in vg.name:
            obj.vertex_groups.remove(vg)
    
    # 新しいグループを作成
    upper_lip_group = obj.vertex_groups.new(name="Upper_Lip_Full")
    lower_lip_group = obj.vertex_groups.new(name="Lower_Lip_Full")
    mouth_interior_group = obj.vertex_groups.new(name="Mouth_Interior")
    
    # オブジェクトモードに戻る
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # 頂点をグループに割り当て
    mesh = obj.data
    upper_count = 0
    lower_count = 0
    
    for i, v in enumerate(mesh.vertices):
        if (-0.65 < v.co.y < -0.54 and
            -0.45 < v.co.z < -0.15 and
            -0.15 < v.co.x < 0.15):
            
            # 上唇（中心線より上）
            if v.co.z > mouth_center_z + 0.01:
                upper_lip_group.add([i], 1.0, 'REPLACE')
                upper_count += 1
            # 下唇（中心線より下）
            elif v.co.z < mouth_center_z - 0.01:
                lower_lip_group.add([i], 1.0, 'REPLACE')
                lower_count += 1
            # 口の内側
            else:
                mouth_interior_group.add([i], 1.0, 'REPLACE')
    
    print(f"\n頂点グループ割り当て:")
    print(f"上唇: {upper_count}頂点")
    print(f"下唇: {lower_count}頂点")
    
    # 口腔内の基本構造を作成
    print("\n口腔内構造を作成中...")
    
    # 新しいメッシュオブジェクトを作成
    mouth_interior_mesh = bpy.data.meshes.new("MouthInterior")
    mouth_interior_obj = bpy.data.objects.new("MouthInterior", mouth_interior_mesh)
    bpy.context.collection.objects.link(mouth_interior_obj)
    
    # 簡単な口腔内構造を作成
    verts = []
    faces = []
    
    # 口腔内の基本形状（簡略化）
    # 奥行き
    depth = 0.1
    
    # 口の中心位置
    center_x = 0.0
    center_y = -0.58
    center_z = mouth_center_z
    
    # 上顎
    verts.extend([
        (center_x - 0.1, center_y, center_z + 0.05),
        (center_x + 0.1, center_y, center_z + 0.05),
        (center_x - 0.1, center_y + depth, center_z + 0.05),
        (center_x + 0.1, center_y + depth, center_z + 0.05),
    ])
    
    # 下顎
    verts.extend([
        (center_x - 0.1, center_y, center_z - 0.05),
        (center_x + 0.1, center_y, center_z - 0.05),
        (center_x - 0.1, center_y + depth, center_z - 0.05),
        (center_x + 0.1, center_y + depth, center_z - 0.05),
    ])
    
    # 面を定義
    faces = [
        (0, 1, 3, 2),  # 上顎
        (4, 6, 7, 5),  # 下顎
        (0, 2, 6, 4),  # 左側
        (1, 5, 7, 3),  # 右側
        (2, 3, 7, 6),  # 奥
    ]
    
    # メッシュを作成
    mouth_interior_mesh.from_pydata(verts, [], faces)
    mouth_interior_mesh.update()
    
    # マテリアルを設定（暗い赤色）
    mat = bpy.data.materials.new(name="MouthInteriorMat")
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs[0].default_value = (0.1, 0.05, 0.05, 1.0)
    mouth_interior_obj.data.materials.append(mat)
    
    # 親子関係を設定
    mouth_interior_obj.parent = obj
    
    print("\n✅ 口の分離処理完了！")
    print("\n実行内容:")
    print("1. 口の中心線でメッシュを分離")
    print("2. 上唇・下唇の頂点グループを作成")
    print("3. 基本的な口腔内構造を追加")
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
else:
    print("エラー: オブジェクトが見つかりません")