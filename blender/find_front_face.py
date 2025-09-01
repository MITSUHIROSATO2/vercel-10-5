"""
顔の前面を正しく特定する
"""
import bpy

obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj:
    mesh = obj.data
    vertices = mesh.vertices
    
    print("=== 座標系の再確認 ===\n")
    
    # マテリアルから顔の部分を特定
    print("マテリアル情報:")
    for mat_slot in obj.material_slots:
        if mat_slot.material:
            print(f"  - {mat_slot.material.name}")
    
    # 座標の分布を詳しく分析
    print("\n座標分布の分析:")
    
    # Y座標の分布を確認（前後）
    y_coords = [v.co.y for v in vertices]
    y_min, y_max = min(y_coords), max(y_coords)
    
    # Y座標を10分割して頂点数を数える
    print("\nY座標（前後）の分布:")
    step = (y_max - y_min) / 10
    for i in range(10):
        y_start = y_min + i * step
        y_end = y_min + (i + 1) * step
        count = sum(1 for y in y_coords if y_start <= y < y_end)
        
        # 推定
        if i < 3:
            side = "後方"
        elif i < 7:
            side = "中央"
        else:
            side = "前方"
        
        print(f"  Y={y_start:.2f}〜{y_end:.2f}: {count:4d}頂点 ({side})")
    
    # 前面と思われる領域でテスト
    print("\n\n顔の前面を特定するためのテスト...")
    
    # 既存のテストキーを削除
    test_keys = ["Front_Test_Negative", "Front_Test_Center", "Front_Test_Positive"]
    for key_name in test_keys:
        if key_name in mesh.shape_keys.key_blocks:
            obj.active_shape_key_index = mesh.shape_keys.key_blocks.find(key_name)
            bpy.ops.object.shape_key_remove()
    
    basis = mesh.shape_keys.key_blocks['Basis']
    
    # Y座標の異なる領域でテスト
    test_regions = [
        ("Front_Test_Negative", lambda co: co.y < -0.3, "Y < -0.3（後ろ？）"),
        ("Front_Test_Center", lambda co: -0.2 < co.y < 0.2, "-0.2 < Y < 0.2（中央）"),
        ("Front_Test_Positive", lambda co: co.y > 0.3, "Y > 0.3（前？）"),
    ]
    
    for key_name, test_func, desc in test_regions:
        obj.shape_key_add(name=key_name, from_mix=False)
        shape_key = mesh.shape_keys.key_blocks[key_name]
        
        count = 0
        for i, v in enumerate(vertices):
            co = basis.data[i].co
            shape_key.data[i].co = co.copy()
            
            # 中央付近で指定のY範囲
            if abs(co.x) < 0.3 and test_func(co) and -0.2 < co.z < 0.2:
                # 下に動かす
                shape_key.data[i].co.z -= 0.05
                count += 1
        
        print(f"{key_name}: {count}頂点を変形 ({desc})")
    
    # より細かくテスト
    print("\n\n口の正確な位置を特定...")
    
    # 顔の向きが分かったら、その前面で口を探す
    mouth_test_keys = ["Mouth_Exact_1", "Mouth_Exact_2", "Mouth_Exact_3"]
    for key_name in mouth_test_keys:
        if key_name in mesh.shape_keys.key_blocks:
            obj.active_shape_key_index = mesh.shape_keys.key_blocks.find(key_name)
            bpy.ops.object.shape_key_remove()
    
    # 異なるY値でテスト
    y_tests = [
        ("Mouth_Exact_1", -0.5, -0.3),
        ("Mouth_Exact_2", -0.3, -0.1),
        ("Mouth_Exact_3", -0.1, 0.1),
    ]
    
    for key_name, y_min, y_max in y_tests:
        obj.shape_key_add(name=key_name, from_mix=False)
        shape_key = mesh.shape_keys.key_blocks[key_name]
        
        count = 0
        for i, v in enumerate(vertices):
            co = basis.data[i].co
            shape_key.data[i].co = co.copy()
            
            # 指定のY範囲、中央、適切な高さ
            if (y_min < co.y < y_max and 
                abs(co.x) < 0.3 and 
                -0.2 < co.z < 0.1):
                
                shape_key.data[i].co.z -= 0.05
                count += 1
        
        print(f"{key_name}: {count}頂点 (Y: {y_min:.1f}〜{y_max:.1f})")
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
    print("\n✅ 完了！")
    print("\nまず以下の3つで顔の向きを確認してください：")
    print("- Front_Test_Negative: Y < -0.3")
    print("- Front_Test_Center: -0.2 < Y < 0.2")
    print("- Front_Test_Positive: Y > 0.3")
    print("\nその後、Mouth_Exact_1〜3で口の位置を確認してください。")