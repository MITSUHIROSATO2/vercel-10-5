"""
画像から判断して、実際の口の位置を正確に特定
"""
import bpy

obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj:
    mesh = obj.data
    vertices = mesh.vertices
    
    print("=== モデルの座標系を再分析 ===\n")
    
    # 画像から、口は顔の中央にあることが確認できた
    # シェイプキーで動いているのは首の部分
    
    # 顔の中心線上の頂点を取得
    centerline_verts = []
    for i, v in enumerate(vertices):
        if abs(v.co.x) < 0.05:  # X座標が0に近い（中心線）
            centerline_verts.append((i, v.co))
    
    # Y座標（前後）とZ座標（上下）でグループ化
    print("顔の前面（Y > 0.4）の頂点分布:")
    front_face_verts = [(i, co) for i, co in centerline_verts if co.y > 0.4]
    
    # Z座標でソート（上から下へ）
    front_face_verts.sort(key=lambda x: x[1].z, reverse=True)
    
    # 範囲を確認
    if front_face_verts:
        z_values = [v[1].z for v in front_face_verts]
        z_max = max(z_values)
        z_min = min(z_values)
        z_range = z_max - z_min
        
        print(f"前面のZ座標範囲: {z_min:.2f} 〜 {z_max:.2f}")
        print(f"範囲: {z_range:.2f}\n")
        
        # 口の位置を推定（顔の下から1/3あたり）
        mouth_z_upper = z_min + 0.4 * z_range  # 上唇
        mouth_z_lower = z_min + 0.2 * z_range  # 下唇
        
        print(f"推定される口の位置:")
        print(f"  上唇付近: Z = {mouth_z_upper:.2f}")
        print(f"  下唇付近: Z = {mouth_z_lower:.2f}")
        print(f"  口の中心: Z = {(mouth_z_upper + mouth_z_lower) / 2:.2f}")
    
    # 新しいテスト用シェイプキーを作成
    print("\n\n正しい位置でテスト用シェイプキーを作成...")
    
    # 古いテストキーを削除
    test_keys = ["Real_Mouth_Test", "Real_Upper_Lip", "Real_Lower_Lip"]
    for key_name in test_keys:
        if key_name in mesh.shape_keys.key_blocks:
            obj.active_shape_key_index = mesh.shape_keys.key_blocks.find(key_name)
            bpy.ops.object.shape_key_remove()
    
    # 口の実際の位置でテスト
    # 画像から判断すると、口は顔の適切な位置にある
    basis = mesh.shape_keys.key_blocks['Basis']
    
    # 顔の前面かつ中央付近の頂点を対象に
    obj.shape_key_add(name="Real_Mouth_Test", from_mix=False)
    mouth_test = mesh.shape_keys.key_blocks["Real_Mouth_Test"]
    
    modified = 0
    for i, v in enumerate(vertices):
        co = basis.data[i].co
        mouth_test.data[i].co = co.copy()
        
        # 条件: 顔の前面、中央付近、適切な高さ
        if (co.y > 0.35 and  # 前面
            abs(co.x) < 0.4 and  # 中央付近
            -0.1 < co.z < 0.15):  # 口の高さ（画像から推定）
            
            # 口を開く動き
            mouth_test.data[i].co.z -= 0.05
            mouth_test.data[i].co.y -= 0.02
            modified += 1
    
    print(f"Real_Mouth_Test: {modified}頂点を変形")
    
    # 別の範囲でもテスト
    obj.shape_key_add(name="Real_Mouth_Alt", from_mix=False)
    mouth_alt = mesh.shape_keys.key_blocks["Real_Mouth_Alt"]
    
    modified = 0
    for i, v in enumerate(vertices):
        co = basis.data[i].co
        mouth_alt.data[i].co = co.copy()
        
        # 別の条件
        if (co.y > 0.3 and  # より広い前面
            abs(co.x) < 0.5 and  # より広い中央
            0.0 < co.z < 0.25):  # 少し高め
            
            mouth_alt.data[i].co.z -= 0.04
            modified += 1
    
    print(f"Real_Mouth_Alt: {modified}頂点を変形")
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
    print("\n✅ 完了！")
    print("\n以下のシェイプキーを確認してください:")
    print("- Real_Mouth_Test: 推定位置1")
    print("- Real_Mouth_Alt: 推定位置2")
    print("\n正しく口が動くシェイプキーを教えてください。")