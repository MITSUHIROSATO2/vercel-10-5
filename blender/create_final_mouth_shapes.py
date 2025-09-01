"""
確定した座標で最終的な口のシェイプキーを作成
X範囲: ±0.15
Y範囲: Y < -0.5（顔の前面）
Z範囲: -0.25 < Z < -0.1（口の高さ）
"""
import bpy

obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj:
    mesh = obj.data
    vertices = mesh.vertices
    
    print("=== 最終的な口のシェイプキーを作成 ===")
    print("確定した口の位置：")
    print("- X範囲: ±0.15")
    print("- Y範囲: Y < -0.5（顔の前面）")
    print("- Z範囲: -0.25 < Z < -0.1（口の高さ）\n")
    
    # 既存のテストシェイプキーをすべて削除
    if mesh.shape_keys:
        keys_to_remove = []
        for key in mesh.shape_keys.key_blocks:
            if key.name != 'Basis':
                keys_to_remove.append(key.name)
        
        for key_name in keys_to_remove:
            obj.active_shape_key_index = mesh.shape_keys.key_blocks.find(key_name)
            bpy.ops.object.shape_key_remove()
        
        print(f"{len(keys_to_remove)}個のテストシェイプキーを削除\n")
    
    basis = mesh.shape_keys.key_blocks['Basis']
    
    # 口の領域の頂点を特定
    def is_mouth_vertex(co):
        return (co.y < -0.5 and  # 前面
                -0.25 < co.z < -0.1 and  # 口の高さ
                abs(co.x) < 0.15)  # 中央付近
    
    mouth_vertices = []
    for i, v in enumerate(vertices):
        if is_mouth_vertex(v.co):
            mouth_vertices.append(i)
    
    print(f"口の領域の頂点数: {len(mouth_vertices)}\n")
    
    # 最終的なシェイプキーを作成
    print("シェイプキーを作成中...")
    
    # 1. 口を開く
    obj.shape_key_add(name="Mouth_Open", from_mix=False)
    mouth_open = mesh.shape_keys.key_blocks["Mouth_Open"]
    
    for i in range(len(vertices)):
        co = basis.data[i].co
        mouth_open.data[i].co = co.copy()
        
        if i in mouth_vertices:
            # 下唇を大きく下げる
            if co.z < -0.18:
                mouth_open.data[i].co.z -= 0.08
                mouth_open.data[i].co.y += 0.02
            # 中間部分
            elif co.z < -0.15:
                mouth_open.data[i].co.z -= 0.05
            # 上唇は少し
            else:
                mouth_open.data[i].co.z -= 0.02
    
    print("✓ Mouth_Open")
    
    # 2. 母音「あ」
    obj.shape_key_add(name="Vowel_A", from_mix=False)
    vowel_a = mesh.shape_keys.key_blocks["Vowel_A"]
    
    for i in range(len(vertices)):
        co = basis.data[i].co
        vowel_a.data[i].co = co.copy()
        
        if i in mouth_vertices:
            # 大きく口を開く
            if co.z < -0.16:
                vowel_a.data[i].co.z -= 0.07
            # 横幅を少し狭める
            vowel_a.data[i].co.x *= 0.92
    
    print("✓ Vowel_A（あ）")
    
    # 3. 母音「い」
    obj.shape_key_add(name="Vowel_I", from_mix=False)
    vowel_i = mesh.shape_keys.key_blocks["Vowel_I"]
    
    for i in range(len(vertices)):
        co = basis.data[i].co
        vowel_i.data[i].co = co.copy()
        
        if i in mouth_vertices:
            # 横に広げる
            vowel_i.data[i].co.x *= 1.3
            # 縦を狭める
            vowel_i.data[i].co.z *= 0.95
            # 少し前に
            vowel_i.data[i].co.y -= 0.01
    
    print("✓ Vowel_I（い）")
    
    # 4. 母音「う」
    obj.shape_key_add(name="Vowel_U", from_mix=False)
    vowel_u = mesh.shape_keys.key_blocks["Vowel_U"]
    
    for i in range(len(vertices)):
        co = basis.data[i].co
        vowel_u.data[i].co = co.copy()
        
        if i in mouth_vertices:
            # すぼめる
            vowel_u.data[i].co.x *= 0.6
            # 前に突き出す
            vowel_u.data[i].co.y -= 0.04
            # 少し縦にも狭める
            if abs(co.z + 0.18) < 0.05:
                vowel_u.data[i].co.z *= 0.9
    
    print("✓ Vowel_U（う）")
    
    # 5. 母音「え」
    obj.shape_key_add(name="Vowel_E", from_mix=False)
    vowel_e = mesh.shape_keys.key_blocks["Vowel_E"]
    
    for i in range(len(vertices)):
        co = basis.data[i].co
        vowel_e.data[i].co = co.copy()
        
        if i in mouth_vertices:
            # 少し横に開く
            vowel_e.data[i].co.x *= 1.15
            # 少し開く
            if co.z < -0.17:
                vowel_e.data[i].co.z -= 0.04
    
    print("✓ Vowel_E（え）")
    
    # 6. 母音「お」
    obj.shape_key_add(name="Vowel_O", from_mix=False)
    vowel_o = mesh.shape_keys.key_blocks["Vowel_O"]
    
    for i in range(len(vertices)):
        co = basis.data[i].co
        vowel_o.data[i].co = co.copy()
        
        if i in mouth_vertices:
            # 丸める
            vowel_o.data[i].co.x *= 0.8
            # 縦に開く
            if co.z < -0.16:
                vowel_o.data[i].co.z -= 0.06
            # 少し前に
            vowel_o.data[i].co.y -= 0.025
    
    print("✓ Vowel_O（お）")
    
    # 7. 笑顔
    obj.shape_key_add(name="Smile", from_mix=False)
    smile = mesh.shape_keys.key_blocks["Smile"]
    
    for i in range(len(vertices)):
        co = basis.data[i].co
        smile.data[i].co = co.copy()
        
        if i in mouth_vertices:
            # 口角を上げる（外側の頂点）
            if abs(co.x) > 0.08:
                smile.data[i].co.z += 0.04
                smile.data[i].co.x *= 1.1
                # 前にも少し出す
                smile.data[i].co.y -= 0.01
    
    print("✓ Smile（笑顔）")
    
    # 8. 驚き
    obj.shape_key_add(name="Surprise", from_mix=False)
    surprise = mesh.shape_keys.key_blocks["Surprise"]
    
    for i in range(len(vertices)):
        co = basis.data[i].co
        surprise.data[i].co = co.copy()
        
        if i in mouth_vertices:
            # 口を丸く開く
            surprise.data[i].co.x *= 0.85
            if co.z < -0.16:
                surprise.data[i].co.z -= 0.1
                surprise.data[i].co.y += 0.02
    
    print("✓ Surprise（驚き）")
    
    # メッシュを更新
    mesh.update()
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
    print("\n✅ 完了！")
    print("\n作成したシェイプキー：")
    print("【基本】")
    print("- Mouth_Open: 口を開く")
    print("\n【母音】")
    print("- Vowel_A: 「あ」")
    print("- Vowel_I: 「い」")
    print("- Vowel_U: 「う」")
    print("- Vowel_E: 「え」")
    print("- Vowel_O: 「お」")
    print("\n【表情】")
    print("- Smile: 笑顔")
    print("- Surprise: 驚き")
    print("\nこれらのシェイプキーは正しい口の位置で動作します。")