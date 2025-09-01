"""
分析結果に基づいて口の位置を確認するシェイプキーを作成
"""
import bpy

obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj:
    mesh = obj.data
    vertices = mesh.vertices
    
    print("=== 口の位置確認用シェイプキーを作成 ===\n")
    
    # 既存のReferenceシェイプキーを保持し、新しいテスト用を追加
    basis = mesh.shape_keys.key_blocks['Basis']
    
    # 分析結果に基づいた口の候補領域
    print("分析結果に基づく口の位置：")
    print("- Y < -0.59（顔の前面）")
    print("- -0.2 < Z < -0.1（口の高さ）")
    print("- |X| < 0.2（中央付近）\n")
    
    # 1. 鼻の位置確認（参考用）
    obj.shape_key_add(name="Test_Nose_Area", from_mix=False)
    nose_test = mesh.shape_keys.key_blocks["Test_Nose_Area"]
    
    nose_count = 0
    for i, v in enumerate(vertices):
        co = basis.data[i].co
        nose_test.data[i].co = co.copy()
        
        # 鼻の領域（Z=0付近）
        if (co.y < -0.59 and
            -0.05 < co.z < 0.1 and
            abs(co.x) < 0.1):
            nose_test.data[i].co.y -= 0.05  # 前に出す
            nose_count += 1
    
    print(f"Test_Nose_Area: {nose_count}頂点 - 鼻の領域（参考）")
    
    # 2. 口の上部（上唇候補）
    obj.shape_key_add(name="Test_Upper_Lip_Area", from_mix=False)
    upper_lip_test = mesh.shape_keys.key_blocks["Test_Upper_Lip_Area"]
    
    upper_count = 0
    for i, v in enumerate(vertices):
        co = basis.data[i].co
        upper_lip_test.data[i].co = co.copy()
        
        # 口の上部
        if (co.y < -0.59 and
            -0.15 < co.z < -0.05 and
            abs(co.x) < 0.2):
            upper_lip_test.data[i].co.y -= 0.05
            upper_lip_test.data[i].co.z -= 0.02  # 少し下げる
            upper_count += 1
    
    print(f"Test_Upper_Lip_Area: {upper_count}頂点 - 上唇候補")
    
    # 3. 口の中央（口の中心線）
    obj.shape_key_add(name="Test_Mouth_Center", from_mix=False)
    mouth_center_test = mesh.shape_keys.key_blocks["Test_Mouth_Center"]
    
    center_count = 0
    for i, v in enumerate(vertices):
        co = basis.data[i].co
        mouth_center_test.data[i].co = co.copy()
        
        # 口の中央
        if (co.y < -0.59 and
            -0.18 < co.z < -0.12 and
            abs(co.x) < 0.2):
            mouth_center_test.data[i].co.y -= 0.05
            mouth_center_test.data[i].co.z -= 0.03
            center_count += 1
    
    print(f"Test_Mouth_Center: {center_count}頂点 - 口の中心線")
    
    # 4. 口の下部（下唇候補）
    obj.shape_key_add(name="Test_Lower_Lip_Area", from_mix=False)
    lower_lip_test = mesh.shape_keys.key_blocks["Test_Lower_Lip_Area"]
    
    lower_count = 0
    for i, v in enumerate(vertices):
        co = basis.data[i].co
        lower_lip_test.data[i].co = co.copy()
        
        # 口の下部
        if (co.y < -0.59 and
            -0.22 < co.z < -0.15 and
            abs(co.x) < 0.2):
            lower_lip_test.data[i].co.y -= 0.05
            lower_lip_test.data[i].co.z -= 0.04  # より下げる
            lower_count += 1
    
    print(f"Test_Lower_Lip_Area: {lower_count}頂点 - 下唇候補")
    
    # 5. 口全体（推定範囲）
    obj.shape_key_add(name="Test_Mouth_Full", from_mix=False)
    mouth_full_test = mesh.shape_keys.key_blocks["Test_Mouth_Full"]
    
    full_count = 0
    for i, v in enumerate(vertices):
        co = basis.data[i].co
        mouth_full_test.data[i].co = co.copy()
        
        # 口全体
        if (co.y < -0.59 and
            -0.25 < co.z < -0.05 and
            abs(co.x) < 0.2):
            # 口を開く動き
            if co.z < -0.15:  # 下唇
                mouth_full_test.data[i].co.z -= 0.06
            else:  # 上唇
                mouth_full_test.data[i].co.z -= 0.02
            mouth_full_test.data[i].co.y -= 0.03
            full_count += 1
    
    print(f"Test_Mouth_Full: {full_count}頂点 - 口全体")
    
    # 6. 顎の確認（参考用）
    obj.shape_key_add(name="Test_Chin_Area", from_mix=False)
    chin_test = mesh.shape_keys.key_blocks["Test_Chin_Area"]
    
    chin_count = 0
    for i, v in enumerate(vertices):
        co = basis.data[i].co
        chin_test.data[i].co = co.copy()
        
        # 顎の領域
        if (co.y < -0.59 and
            -0.35 < co.z < -0.25 and
            abs(co.x) < 0.2):
            chin_test.data[i].co.y -= 0.05
            chin_count += 1
    
    print(f"Test_Chin_Area: {chin_count}頂点 - 顎の領域（参考）")
    
    # 7. X軸の範囲別テスト
    x_ranges = [0.1, 0.15, 0.2, 0.25]
    for x_max in x_ranges:
        name = f"Test_Mouth_X{int(x_max*100)}"
        obj.shape_key_add(name=name, from_mix=False)
        shape_key = mesh.shape_keys.key_blocks[name]
        
        count = 0
        for i, v in enumerate(vertices):
            co = basis.data[i].co
            shape_key.data[i].co = co.copy()
            
            if (co.y < -0.59 and
                -0.2 < co.z < -0.1 and
                abs(co.x) < x_max):
                shape_key.data[i].co.y -= 0.05
                shape_key.data[i].co.z -= 0.03
                count += 1
        
        print(f"{name}: {count}頂点 - X範囲±{x_max}")
    
    # メッシュを更新
    mesh.update()
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
    print("\n✅ 完了！")
    print("\n作成したテスト用シェイプキー：")
    print("\n【部位別確認】")
    print("1. Test_Nose_Area - 鼻（参考）")
    print("2. Test_Upper_Lip_Area - 上唇候補")
    print("3. Test_Mouth_Center - 口の中心")
    print("4. Test_Lower_Lip_Area - 下唇候補")
    print("5. Test_Mouth_Full - 口全体")
    print("6. Test_Chin_Area - 顎（参考）")
    print("\n【X範囲確認】")
    print("7. Test_Mouth_X10/X15/X20/X25 - 異なる幅")
    print("\nこれらのシェイプキーで口の正確な位置を確認してください。")