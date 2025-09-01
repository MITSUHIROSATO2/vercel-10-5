"""
頂点の位置を分析して、実際の口の位置を特定
"""
import bpy

obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj:
    mesh = obj.data
    vertices = mesh.vertices
    
    print("=== 頂点位置の分析 ===\n")
    
    # Z座標の分布を調べる
    z_coords = [v.co.z for v in vertices]
    z_min = min(z_coords)
    z_max = max(z_coords)
    
    print(f"Z座標の範囲: {z_min:.2f} 〜 {z_max:.2f}")
    print(f"範囲: {z_max - z_min:.2f}\n")
    
    # Z座標を10段階に分けて分析
    step = (z_max - z_min) / 10
    print("高さ別の頂点分布:")
    
    for i in range(10):
        z_start = z_min + i * step
        z_end = z_min + (i + 1) * step
        count = sum(1 for z in z_coords if z_start <= z < z_end)
        
        # 推定される部位
        if i < 2:
            part = "首・顎下"
        elif i < 4:
            part = "顎・口下部"
        elif i < 6:
            part = "口・鼻"
        elif i < 8:
            part = "目・頬"
        else:
            part = "額・頭頂"
            
        print(f"  レベル {i}: Z={z_start:.2f}〜{z_end:.2f} : {count:,}頂点 ({part})")
    
    # Y座標（前後）も確認
    print("\n前後位置の分析:")
    y_coords = [v.co.y for v in vertices]
    y_min = min(y_coords)
    y_max = max(y_coords)
    print(f"Y座標の範囲: {y_min:.2f} 〜 {y_max:.2f}")
    
    # 口の可能性が高い領域を特定
    print("\n口の可能性が高い頂点を探索中...")
    
    # 口は通常、顔の中央下部、前方にある
    mouth_candidates = []
    for i, v in enumerate(vertices):
        # 条件：中央付近、下部、前方
        if (abs(v.co.x) < 0.5 and  # 中央付近
            z_min + 0.3 * (z_max - z_min) < v.co.z < z_min + 0.5 * (z_max - z_min) and  # 下部
            v.co.y > y_min + 0.7 * (y_max - y_min)):  # 前方
            mouth_candidates.append((i, v.co))
    
    print(f"口候補の頂点数: {len(mouth_candidates)}")
    
    if mouth_candidates:
        # サンプルを表示
        print("\n口候補のサンプル頂点:")
        for i, (idx, co) in enumerate(mouth_candidates[:5]):
            print(f"  頂点{idx}: X={co.x:.2f}, Y={co.y:.2f}, Z={co.z:.2f}")
        
        # 口領域の中心を計算
        avg_x = sum(co.x for _, co in mouth_candidates) / len(mouth_candidates)
        avg_y = sum(co.y for _, co in mouth_candidates) / len(mouth_candidates)
        avg_z = sum(co.z for _, co in mouth_candidates) / len(mouth_candidates)
        
        print(f"\n推定される口の中心位置:")
        print(f"  X: {avg_x:.2f}")
        print(f"  Y: {avg_y:.2f}")
        print(f"  Z: {avg_z:.2f}")
        
        print(f"\n口の変形に適したZ座標範囲:")
        print(f"  {avg_z - 0.2:.2f} 〜 {avg_z + 0.1:.2f}")
    
    # 現在動いている頂点を確認
    print("\n現在のシェイプキーで動いている頂点の位置:")
    test_key = mesh.shape_keys.key_blocks.get('Test_SimpleMove')
    if test_key:
        basis = mesh.shape_keys.key_blocks['Basis']
        moved_z_coords = []
        
        for i in range(len(vertices)):
            if (test_key.data[i].co - basis.data[i].co).length > 0.001:
                moved_z_coords.append(basis.data[i].co.z)
        
        if moved_z_coords:
            print(f"  動いている頂点のZ座標範囲: {min(moved_z_coords):.2f} 〜 {max(moved_z_coords):.2f}")
            print(f"  → これは首の領域です！")