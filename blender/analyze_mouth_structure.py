"""
口のメッシュ構造を詳細に分析
"""
import bpy
import bmesh
from mathutils import Vector

print("=== 口のメッシュ構造分析 ===\n")

obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj and obj.type == 'MESH':
    mesh = obj.data
    
    # BMeshを作成して分析
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.verts.ensure_lookup_table()
    bm.edges.ensure_lookup_table()
    
    print(f"【基本情報】")
    print(f"頂点数: {len(bm.verts)}")
    print(f"エッジ数: {len(bm.edges)}")
    print(f"面数: {len(bm.faces)}")
    
    # 口の領域を特定（前回の分析結果を使用）
    mouth_verts = []
    for v in bm.verts:
        if (-0.65 < v.co.y < -0.54 and
            -0.45 < v.co.z < -0.15 and
            -0.15 < v.co.x < 0.15):
            mouth_verts.append(v)
    
    print(f"\n【口の領域】")
    print(f"口の頂点数: {len(mouth_verts)}")
    
    # エッジの接続性を分析
    print(f"\n【エッジ接続性分析】")
    
    # 境界エッジを検出
    boundary_edges = []
    internal_edges = []
    
    for edge in bm.edges:
        if edge.is_boundary:
            boundary_edges.append(edge)
        else:
            # 口の領域内のエッジか確認
            v1, v2 = edge.verts
            if v1 in mouth_verts and v2 in mouth_verts:
                internal_edges.append(edge)
    
    print(f"境界エッジ数: {len(boundary_edges)}")
    print(f"内部エッジ数: {len(internal_edges)}")
    
    # 口の中心線付近のエッジを探す
    center_edges = []
    for edge in bm.edges:
        v1, v2 = edge.verts
        # X座標が0に近い（中心線付近）
        if (abs(v1.co.x) < 0.02 and abs(v2.co.x) < 0.02 and
            -0.65 < v1.co.y < -0.54 and -0.65 < v2.co.y < -0.54):
            center_edges.append(edge)
    
    print(f"中心線付近のエッジ数: {len(center_edges)}")
    
    # 上唇と下唇の境界を探す
    print(f"\n【唇の境界分析】")
    
    # Z座標でグループ化
    z_groups = {}
    for v in mouth_verts:
        z_key = round(v.co.z, 2)
        if z_key not in z_groups:
            z_groups[z_key] = []
        z_groups[z_key].append(v)
    
    print(f"Z座標グループ数: {len(z_groups)}")
    for z_key in sorted(z_groups.keys(), reverse=True)[:10]:
        print(f"  Z={z_key}: {len(z_groups[z_key])}頂点")
    
    # 口の開口部を探す
    print(f"\n【開口部の検出】")
    
    # 中央付近の頂点で、上下の唇が接している部分を探す
    lip_contact_verts = []
    z_center = -0.30  # 口の中心高さ（推定）
    
    for v in mouth_verts:
        if abs(v.co.x) < 0.1 and abs(v.co.z - z_center) < 0.05:
            lip_contact_verts.append(v)
    
    print(f"唇接触部の候補頂点数: {len(lip_contact_verts)}")
    
    # 重複頂点や近接頂点を検出
    print(f"\n【重複・近接頂点分析】")
    
    duplicate_pairs = []
    close_pairs = []
    
    for i, v1 in enumerate(lip_contact_verts):
        for v2 in lip_contact_verts[i+1:]:
            dist = (v1.co - v2.co).length
            if dist < 0.001:
                duplicate_pairs.append((v1, v2, dist))
            elif dist < 0.01:
                close_pairs.append((v1, v2, dist))
    
    print(f"重複頂点ペア数: {len(duplicate_pairs)}")
    print(f"近接頂点ペア数: {len(close_pairs)}")
    
    # メッシュの連続性を確認
    print(f"\n【メッシュ連続性】")
    
    # 選択した頂点から連結成分を調べる
    if mouth_verts:
        visited = set()
        components = []
        
        for start_vert in mouth_verts[:5]:  # 最初の5頂点でテスト
            if start_vert in visited:
                continue
            
            component = []
            stack = [start_vert]
            
            while stack:
                v = stack.pop()
                if v in visited or v not in mouth_verts:
                    continue
                
                visited.add(v)
                component.append(v)
                
                for edge in v.link_edges:
                    other = edge.other_vert(v)
                    if other not in visited and other in mouth_verts:
                        stack.append(other)
            
            if component:
                components.append(component)
        
        print(f"連結成分数: {len(components)}")
        for i, comp in enumerate(components):
            print(f"  成分{i+1}: {len(comp)}頂点")
    
    # 口の開閉に関する問題点
    print(f"\n【問題の診断】")
    
    if len(duplicate_pairs) > 0:
        print("⚠️  重複頂点が存在 - 口が融合している可能性")
    
    if len(boundary_edges) == 0:
        print("⚠️  境界エッジなし - 口が完全に閉じている")
    
    if len(components) == 1:
        print("⚠️  単一の連結メッシュ - 上下の唇が分離していない")
    
    # メッシュをクリーンアップ
    bm.free()
    
    print("\n=== 分析完了 ===")
    print("\n推奨される対処法:")
    print("1. 口の輪郭に沿ってエッジを分離")
    print("2. 上唇と下唇を別々のメッシュ部分に")
    print("3. 口腔内の構造を追加")

else:
    print("エラー: オブジェクトが見つかりません")