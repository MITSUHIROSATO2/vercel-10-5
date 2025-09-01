"""
顔の向きと各部位の座標を可視化
"""
import bpy

obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj:
    mesh = obj.data
    
    print("=== 顔の向きと座標系の確認 ===\n")
    
    # 全頂点のバウンディングボックスを計算
    vertices = mesh.vertices
    x_coords = [v.co.x for v in vertices]
    y_coords = [v.co.y for v in vertices]
    z_coords = [v.co.z for v in vertices]
    
    print("モデル全体の座標範囲:")
    print(f"X (左右): {min(x_coords):.2f} 〜 {max(x_coords):.2f}")
    print(f"Y (前後): {min(y_coords):.2f} 〜 {max(y_coords):.2f}")
    print(f"Z (上下): {min(z_coords):.2f} 〜 {max(z_coords):.2f}")
    
    # 顔の各部位を特定するため、特徴的な点を探す
    print("\n\n特徴的な部位の座標を探索:")
    
    # 1. 最も前に出ている点（おそらく鼻先）
    front_vert = max(vertices, key=lambda v: v.co.y)
    print(f"\n最前面の頂点（鼻先?）:")
    print(f"  座標: X={front_vert.co.x:.2f}, Y={front_vert.co.y:.2f}, Z={front_vert.co.z:.2f}")
    
    # 2. 最も高い点（頭頂部）
    top_vert = max(vertices, key=lambda v: v.co.z)
    print(f"\n最上部の頂点（頭頂?）:")
    print(f"  座標: X={top_vert.co.x:.2f}, Y={top_vert.co.y:.2f}, Z={top_vert.co.z:.2f}")
    
    # 3. 画像から、口は鼻より下、顎より上にあるはず
    nose_z = front_vert.co.z
    print(f"\n鼻の高さ: Z = {nose_z:.2f}")
    
    # 口の推定位置（鼻より0.1〜0.3下）
    mouth_z_estimate = nose_z - 0.2
    print(f"口の推定高さ: Z = {mouth_z_estimate:.2f}")
    
    # 4. 実際に口がありそうな領域でシェイプキーを作成
    print("\n\n視覚的に確認できるシェイプキーを作成...")
    
    # 既存のキーを削除
    visual_keys = ["Mouth_Visual_1", "Mouth_Visual_2", "Mouth_Visual_3"]
    for key_name in visual_keys:
        if key_name in mesh.shape_keys.key_blocks:
            obj.active_shape_key_index = mesh.shape_keys.key_blocks.find(key_name)
            bpy.ops.object.shape_key_remove()
    
    basis = mesh.shape_keys.key_blocks['Basis']
    
    # 異なる高さで口の動きをテスト
    test_configs = [
        ("Mouth_Visual_1", nose_z - 0.15, nose_z - 0.05, "鼻のすぐ下"),
        ("Mouth_Visual_2", nose_z - 0.25, nose_z - 0.15, "鼻の下方"),
        ("Mouth_Visual_3", nose_z - 0.35, nose_z - 0.25, "さらに下"),
    ]
    
    for key_name, z_min, z_max, desc in test_configs:
        obj.shape_key_add(name=key_name, from_mix=False)
        shape_key = mesh.shape_keys.key_blocks[key_name]
        
        count = 0
        for i, v in enumerate(vertices):
            co = basis.data[i].co
            shape_key.data[i].co = co.copy()
            
            # 顔の前面中央で指定の高さ範囲
            if (abs(co.x) < 0.35 and  # 中央
                co.y > 0.2 and  # 前面
                z_min < co.z < z_max):  # 高さ範囲
                
                # 下に動かす（口を開く）
                shape_key.data[i].co.z -= 0.06
                count += 1
        
        print(f"{key_name}: {count}頂点を変形 ({desc})")
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
    print("\n✅ 完了！")
    print("\n以下の3つのシェイプキーを確認してください：")
    print("1. Mouth_Visual_1: 鼻のすぐ下")
    print("2. Mouth_Visual_2: 鼻の下方")  
    print("3. Mouth_Visual_3: さらに下")
    print("\nどれが実際の口の位置で動いているか教えてください。")