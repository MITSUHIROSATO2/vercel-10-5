"""
マテリアルや既存のシェイプキーから口の位置を特定
"""
import bpy

obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj:
    mesh = obj.data
    
    print("=== 既存のシェイプキーから口の位置を分析 ===\n")
    
    # 既存のシェイプキーで実際に動いている頂点を確認
    if mesh.shape_keys:
        basis = mesh.shape_keys.key_blocks['Basis']
        
        # 口関連のシェイプキーを探す
        mouth_related_keys = []
        for key in mesh.shape_keys.key_blocks:
            if any(word in key.name.lower() for word in ['mouth', 'lip', 'viseme', 'jp_']):
                mouth_related_keys.append(key.name)
        
        print(f"口関連のシェイプキー: {len(mouth_related_keys)}個")
        
        # 最初の口関連シェイプキーで動く頂点を分析
        if mouth_related_keys:
            for key_name in mouth_related_keys[:5]:  # 最初の5個をチェック
                key = mesh.shape_keys.key_blocks[key_name]
                
                # このシェイプキーで動く頂点を収集
                moving_verts = []
                for i in range(len(mesh.vertices)):
                    displacement = (key.data[i].co - basis.data[i].co).length
                    if displacement > 0.001:
                        moving_verts.append((i, basis.data[i].co, displacement))
                
                if moving_verts:
                    print(f"\n{key_name}: {len(moving_verts)}個の頂点が動く")
                    
                    # 動く頂点の座標範囲を計算
                    x_coords = [v[1].x for v in moving_verts]
                    y_coords = [v[1].y for v in moving_verts]
                    z_coords = [v[1].z for v in moving_verts]
                    
                    print(f"  X範囲: {min(x_coords):.2f} 〜 {max(x_coords):.2f}")
                    print(f"  Y範囲: {min(y_coords):.2f} 〜 {max(y_coords):.2f}")
                    print(f"  Z範囲: {min(z_coords):.2f} 〜 {max(z_coords):.2f}")
                    
                    # サンプル頂点を表示
                    print("  サンプル頂点:")
                    for i, (idx, co, disp) in enumerate(moving_verts[:3]):
                        print(f"    頂点{idx}: X={co.x:.2f}, Y={co.y:.2f}, Z={co.z:.2f}, 変位={disp:.3f}")
    
    # 画像から判断して、正しい口の位置でシェイプキーを作成
    print("\n\n画像の観察に基づいてシェイプキーを作成...")
    
    # 新しいアプローチ：小さな領域から始めて徐々に広げる
    test_regions = [
        ("Mouth_Center_Small", lambda co: abs(co.x) < 0.1 and 0.1 < co.y < 0.5 and -0.2 < co.z < 0.2),
        ("Mouth_Center_Medium", lambda co: abs(co.x) < 0.2 and 0.0 < co.y < 0.6 and -0.3 < co.z < 0.3),
        ("Mouth_Center_Large", lambda co: abs(co.x) < 0.3 and -0.1 < co.y < 0.7 and -0.4 < co.z < 0.4),
    ]
    
    basis = mesh.shape_keys.key_blocks['Basis']
    
    for key_name, test_func in test_regions:
        if key_name in mesh.shape_keys.key_blocks:
            obj.active_shape_key_index = mesh.shape_keys.key_blocks.find(key_name)
            bpy.ops.object.shape_key_remove()
        
        obj.shape_key_add(name=key_name, from_mix=False)
        shape_key = mesh.shape_keys.key_blocks[key_name]
        
        count = 0
        for i, v in enumerate(mesh.vertices):
            co = basis.data[i].co
            shape_key.data[i].co = co.copy()
            
            if test_func(co):
                # 頂点を少し下に動かす
                shape_key.data[i].co.z -= 0.05
                shape_key.data[i].co.y -= 0.02
                count += 1
        
        print(f"{key_name}: {count}頂点を変形")
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
    print("\n✅ 完了！")
    print("\n以下のシェイプキーをテストしてください：")
    print("- Mouth_Center_Small: 中央の小さな領域")
    print("- Mouth_Center_Medium: 中央の中程度の領域")
    print("- Mouth_Center_Large: 中央の大きな領域")
    print("\nどれかが口の位置で動いているはずです。")