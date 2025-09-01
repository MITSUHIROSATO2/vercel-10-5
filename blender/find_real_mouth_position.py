"""
実際の口の位置を特定するため、顔の中心付近の頂点を可視化
"""
import bpy

obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj:
    mesh = obj.data
    vertices = mesh.vertices
    
    print("=== 実際の口の位置を探索 ===\n")
    
    # 顔の正面中央の頂点を探す（X=0付近、Y=正の値）
    center_front_vertices = []
    
    for i, v in enumerate(vertices):
        # 正面中央付近の頂点
        if abs(v.co.x) < 0.1 and v.co.y > 0:
            center_front_vertices.append((i, v.co))
    
    # Z座標でソート
    center_front_vertices.sort(key=lambda x: x[1].z, reverse=True)
    
    print("顔の正面中央の頂点（上から順）:")
    print("頂点番号 : X, Y, Z座標")
    print("-" * 40)
    
    # 10個ずつグループ化して表示
    for i in range(0, min(50, len(center_front_vertices)), 10):
        group = center_front_vertices[i:i+10]
        if group:
            avg_z = sum(v[1].z for v in group) / len(group)
            
            # 推定部位
            if avg_z > 0.7:
                part = "額"
            elif avg_z > 0.4:
                part = "目・眉"
            elif avg_z > 0.1:
                part = "鼻"
            elif avg_z > -0.2:
                part = "口（上唇）"  # ← ここが口！
            elif avg_z > -0.5:
                part = "口（下唇）・顎"
            else:
                part = "首"
            
            print(f"\n【{part}】平均Z: {avg_z:.2f}")
            for idx, co in group[:3]:  # 最初の3つを表示
                print(f"  頂点{idx}: X={co.x:.3f}, Y={co.y:.3f}, Z={co.z:.3f}")
    
    # テスト用シェイプキーを作成
    print("\n\nテスト用シェイプキーを作成中...")
    
    # 既存のテストキーを削除
    if "Mouth_Test_Visual" in mesh.shape_keys.key_blocks:
        obj.active_shape_key_index = mesh.shape_keys.key_blocks.find("Mouth_Test_Visual")
        bpy.ops.object.shape_key_remove()
    
    # 新しいテストキーを作成
    obj.shape_key_add(name="Mouth_Test_Visual", from_mix=False)
    test_key = mesh.shape_keys.key_blocks["Mouth_Test_Visual"]
    basis = mesh.shape_keys.key_blocks["Basis"]
    
    # 異なる高さで小さな変形を加える
    test_regions = [
        ("Upper_Lip_Test", lambda z: 0.0 < z < 0.2, 0.05),     # 上唇候補
        ("Lower_Lip_Test", lambda z: -0.2 < z < 0.0, -0.05),  # 下唇候補
        ("Chin_Test", lambda z: -0.4 < z < -0.2, -0.03),      # 顎候補
    ]
    
    for region_name, z_check, displacement in test_regions:
        if region_name in mesh.shape_keys.key_blocks:
            obj.active_shape_key_index = mesh.shape_keys.key_blocks.find(region_name)
            bpy.ops.object.shape_key_remove()
        
        obj.shape_key_add(name=region_name, from_mix=False)
        region_key = mesh.shape_keys.key_blocks[region_name]
        
        count = 0
        for i, v in enumerate(vertices):
            co = basis.data[i].co
            region_key.data[i].co = co.copy()
            
            # 顔の前面中央で、指定された高さの頂点を動かす
            if abs(co.x) < 0.3 and co.y > 0.3 and z_check(co.z):
                region_key.data[i].co.z = co.z + displacement
                count += 1
        
        print(f"{region_name}: {count}頂点を変形")
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
    print("\n✅ 完了！")
    print("\nBlenderで以下のテスト用シェイプキーを確認してください：")
    print("- Upper_Lip_Test: 上唇候補（Z: 0.0〜0.2）")
    print("- Lower_Lip_Test: 下唇候補（Z: -0.2〜0.0）")
    print("- Chin_Test: 顎候補（Z: -0.4〜-0.2）")
    print("\nどれが実際の口の位置か確認してください。")