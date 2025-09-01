"""
解剖学的分析に基づいて正確な口のシェイプキーを作成
"""
import bpy

obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj:
    mesh = obj.data
    vertices = mesh.vertices
    
    print("=== 解剖学的分析に基づく口のシェイプキー作成 ===\n")
    
    # すべてのテストシェイプキーを削除
    if mesh.shape_keys:
        keys_to_remove = []
        for key in mesh.shape_keys.key_blocks:
            if key.name.startswith('Test_'):
                keys_to_remove.append(key.name)
        
        for key_name in keys_to_remove:
            obj.active_shape_key_index = mesh.shape_keys.key_blocks.find(key_name)
            bpy.ops.object.shape_key_remove()
    
    basis = mesh.shape_keys.key_blocks['Basis']
    
    # 解剖学的分析から判明した口の位置
    print("口の正確な位置（解剖学的分析より）：")
    print("- Y座標: -0.642 〜 -0.550")
    print("- Z座標: -0.298 〜 -0.100")
    print("- X座標: -0.140 〜 0.131\n")
    
    # 口の領域の頂点を収集
    mouth_vertices = []
    for i, v in enumerate(vertices):
        if (-0.65 < v.co.y < -0.54 and
            -0.30 < v.co.z < -0.09 and
            -0.15 < v.co.x < 0.15):
            mouth_vertices.append(i)
    
    print(f"口の領域の頂点数: {len(mouth_vertices)}\n")
    
    # 上唇と下唇を分離
    upper_lip_vertices = []
    lower_lip_vertices = []
    
    for i in mouth_vertices:
        if vertices[i].co.z > -0.18:  # 上部
            upper_lip_vertices.append(i)
        else:  # 下部
            lower_lip_vertices.append(i)
    
    print(f"上唇の頂点数: {len(upper_lip_vertices)}")
    print(f"下唇の頂点数: {len(lower_lip_vertices)}\n")
    
    # シェイプキーを作成
    print("シェイプキーを作成中...\n")
    
    # 1. 口を開く
    obj.shape_key_add(name="Mouth_Open", from_mix=False)
    mouth_open = mesh.shape_keys.key_blocks["Mouth_Open"]
    
    for i in range(len(vertices)):
        mouth_open.data[i].co = basis.data[i].co.copy()
        
        if i in lower_lip_vertices:
            # 下唇を下げる
            mouth_open.data[i].co.z -= 0.08
            mouth_open.data[i].co.y += 0.02
        elif i in upper_lip_vertices:
            # 上唇は少しだけ
            mouth_open.data[i].co.z += 0.01
    
    print("✓ Mouth_Open - 口を開く")
    
    # 2. 母音「あ」
    obj.shape_key_add(name="Vowel_A", from_mix=False)
    vowel_a = mesh.shape_keys.key_blocks["Vowel_A"]
    
    for i in range(len(vertices)):
        vowel_a.data[i].co = basis.data[i].co.copy()
        
        if i in mouth_vertices:
            co = basis.data[i].co
            # 大きく開く
            if co.z < -0.18:  # 下唇
                vowel_a.data[i].co.z -= 0.07
            else:  # 上唇
                vowel_a.data[i].co.z += 0.01
            # 少し狭める
            vowel_a.data[i].co.x *= 0.92
    
    print("✓ Vowel_A - 「あ」")
    
    # 3. 母音「い」
    obj.shape_key_add(name="Vowel_I", from_mix=False)
    vowel_i = mesh.shape_keys.key_blocks["Vowel_I"]
    
    for i in range(len(vertices)):
        vowel_i.data[i].co = basis.data[i].co.copy()
        
        if i in mouth_vertices:
            # 横に広げる
            vowel_i.data[i].co.x *= 1.25
            # 縦を狭める
            vowel_i.data[i].co.z *= 0.98
    
    print("✓ Vowel_I - 「い」")
    
    # 4. 母音「う」
    obj.shape_key_add(name="Vowel_U", from_mix=False)
    vowel_u = mesh.shape_keys.key_blocks["Vowel_U"]
    
    for i in range(len(vertices)):
        vowel_u.data[i].co = basis.data[i].co.copy()
        
        if i in mouth_vertices:
            # すぼめる
            vowel_u.data[i].co.x *= 0.65
            # 前に突き出す
            vowel_u.data[i].co.y -= 0.04
    
    print("✓ Vowel_U - 「う」")
    
    # 5. 母音「え」
    obj.shape_key_add(name="Vowel_E", from_mix=False)
    vowel_e = mesh.shape_keys.key_blocks["Vowel_E"]
    
    for i in range(len(vertices)):
        vowel_e.data[i].co = basis.data[i].co.copy()
        
        if i in mouth_vertices:
            co = basis.data[i].co
            # 少し横に
            vowel_e.data[i].co.x *= 1.1
            # 少し開く
            if co.z < -0.18:
                vowel_e.data[i].co.z -= 0.03
    
    print("✓ Vowel_E - 「え」")
    
    # 6. 母音「お」
    obj.shape_key_add(name="Vowel_O", from_mix=False)
    vowel_o = mesh.shape_keys.key_blocks["Vowel_O"]
    
    for i in range(len(vertices)):
        vowel_o.data[i].co = basis.data[i].co.copy()
        
        if i in mouth_vertices:
            co = basis.data[i].co
            # 丸める
            vowel_o.data[i].co.x *= 0.8
            # 縦に開く
            if co.z < -0.18:
                vowel_o.data[i].co.z -= 0.05
            # 少し前に
            vowel_o.data[i].co.y -= 0.02
    
    print("✓ Vowel_O - 「お」")
    
    # 7. 笑顔
    obj.shape_key_add(name="Smile", from_mix=False)
    smile = mesh.shape_keys.key_blocks["Smile"]
    
    for i in range(len(vertices)):
        smile.data[i].co = basis.data[i].co.copy()
        
        if i in mouth_vertices:
            co = basis.data[i].co
            # 口角を上げる
            if abs(co.x) > 0.08:
                smile.data[i].co.z += 0.04
                smile.data[i].co.x *= 1.08
    
    print("✓ Smile - 笑顔")
    
    # メッシュを更新
    mesh.update()
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
    print("\n✅ 完了！")
    print("\n作成したシェイプキー：")
    print("- Mouth_Open: 口を開く")
    print("- Vowel_A/I/U/E/O: 母音「あいうえお」")
    print("- Smile: 笑顔")
    print("\nこれらは解剖学的に正確な口の位置で動作します。")