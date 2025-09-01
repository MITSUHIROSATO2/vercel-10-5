"""
前後が逆と判明したので、正しい座標で口のシェイプキーを作成
"""
import bpy

obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj:
    mesh = obj.data
    vertices = mesh.vertices
    
    print("=== 正しい座標系で口のシェイプキーを作成 ===\n")
    print("座標系の理解：")
    print("- Y < 0: 顔の前面")
    print("- Y > 0: 後頭部")
    print("- Z > 0: 上（額）")
    print("- Z < 0: 下（顎）\n")
    
    # 既存のシェイプキーを削除
    shape_keys_to_create = [
        "Mouth_Open_FINAL",
        "Vowel_A_FINAL", 
        "Vowel_I_FINAL",
        "Vowel_U_FINAL",
        "Vowel_E_FINAL",
        "Vowel_O_FINAL",
        "Smile_FINAL"
    ]
    
    for key_name in shape_keys_to_create:
        if key_name in mesh.shape_keys.key_blocks:
            obj.active_shape_key_index = mesh.shape_keys.key_blocks.find(key_name)
            bpy.ops.object.shape_key_remove()
    
    basis = mesh.shape_keys.key_blocks['Basis']
    
    # 口の正しい領域を定義
    # Y < -0.3 (顔の前面)
    # -0.3 < Z < 0.1 (鼻の下、顎の上)
    # |X| < 0.4 (中央付近)
    
    def is_mouth_region(co):
        return (co.y < -0.3 and  # 顔の前面
                -0.3 < co.z < 0.1 and  # 口の高さ
                abs(co.x) < 0.4)  # 中央付近
    
    # 口の領域の頂点を収集
    mouth_vertices = []
    for i, v in enumerate(vertices):
        if is_mouth_region(v.co):
            mouth_vertices.append(i)
    
    print(f"口の領域の頂点数: {len(mouth_vertices)}")
    
    # 1. 口を開く
    obj.shape_key_add(name="Mouth_Open_FINAL", from_mix=False)
    mouth_open = mesh.shape_keys.key_blocks["Mouth_Open_FINAL"]
    
    for i, v in enumerate(vertices):
        co = basis.data[i].co
        mouth_open.data[i].co = co.copy()
        
        if i in mouth_vertices:
            # 下唇を下げる
            if co.z < -0.1:
                mouth_open.data[i].co.z -= 0.08
                mouth_open.data[i].co.y += 0.02  # 前後が逆なので符号も逆
    
    print("✓ Mouth_Open_FINAL 作成完了")
    
    # 2. 母音「あ」
    obj.shape_key_add(name="Vowel_A_FINAL", from_mix=False)
    vowel_a = mesh.shape_keys.key_blocks["Vowel_A_FINAL"]
    
    for i, v in enumerate(vertices):
        co = basis.data[i].co
        vowel_a.data[i].co = co.copy()
        
        if i in mouth_vertices:
            # 口を大きく開く
            if co.z < -0.05:
                vowel_a.data[i].co.z -= 0.06
            # 少し狭める
            vowel_a.data[i].co.x *= 0.95
    
    print("✓ Vowel_A_FINAL 作成完了")
    
    # 3. 母音「い」
    obj.shape_key_add(name="Vowel_I_FINAL", from_mix=False)
    vowel_i = mesh.shape_keys.key_blocks["Vowel_I_FINAL"]
    
    for i, v in enumerate(vertices):
        co = basis.data[i].co
        vowel_i.data[i].co = co.copy()
        
        if i in mouth_vertices:
            # 横に広げる
            vowel_i.data[i].co.x *= 1.25
            # 縦を狭める
            vowel_i.data[i].co.z *= 0.9
    
    print("✓ Vowel_I_FINAL 作成完了")
    
    # 4. 母音「う」
    obj.shape_key_add(name="Vowel_U_FINAL", from_mix=False)
    vowel_u = mesh.shape_keys.key_blocks["Vowel_U_FINAL"]
    
    for i, v in enumerate(vertices):
        co = basis.data[i].co
        vowel_u.data[i].co = co.copy()
        
        if i in mouth_vertices:
            # すぼめる
            vowel_u.data[i].co.x *= 0.65
            # 前に突き出す（Y軸が逆なので）
            vowel_u.data[i].co.y -= 0.04
    
    print("✓ Vowel_U_FINAL 作成完了")
    
    # 5. 母音「え」
    obj.shape_key_add(name="Vowel_E_FINAL", from_mix=False)
    vowel_e = mesh.shape_keys.key_blocks["Vowel_E_FINAL"]
    
    for i, v in enumerate(vertices):
        co = basis.data[i].co
        vowel_e.data[i].co = co.copy()
        
        if i in mouth_vertices:
            # 少し横に開く
            vowel_e.data[i].co.x *= 1.1
            # 少し開く
            if co.z < -0.1:
                vowel_e.data[i].co.z -= 0.03
    
    print("✓ Vowel_E_FINAL 作成完了")
    
    # 6. 母音「お」
    obj.shape_key_add(name="Vowel_O_FINAL", from_mix=False)
    vowel_o = mesh.shape_keys.key_blocks["Vowel_O_FINAL"]
    
    for i, v in enumerate(vertices):
        co = basis.data[i].co
        vowel_o.data[i].co = co.copy()
        
        if i in mouth_vertices:
            # 丸める
            vowel_o.data[i].co.x *= 0.85
            # 縦に開く
            if co.z < -0.08:
                vowel_o.data[i].co.z -= 0.05
            # 少し前に
            vowel_o.data[i].co.y -= 0.02
    
    print("✓ Vowel_O_FINAL 作成完了")
    
    # 7. 笑顔
    obj.shape_key_add(name="Smile_FINAL", from_mix=False)
    smile = mesh.shape_keys.key_blocks["Smile_FINAL"]
    
    for i, v in enumerate(vertices):
        co = basis.data[i].co
        smile.data[i].co = co.copy()
        
        if i in mouth_vertices:
            # 口角を上げる
            if abs(co.x) > 0.2:
                smile.data[i].co.z += 0.04
                smile.data[i].co.x *= 1.08
    
    print("✓ Smile_FINAL 作成完了")
    
    # メッシュを更新
    mesh.update()
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
    print("\n✅ 完了！")
    print("\n作成したシェイプキー（_FINAL付き）:")
    print("- Mouth_Open_FINAL: 口を開く")
    print("- Vowel_A_FINAL: 「あ」")
    print("- Vowel_I_FINAL: 「い」")
    print("- Vowel_U_FINAL: 「う」")
    print("- Vowel_E_FINAL: 「え」")
    print("- Vowel_O_FINAL: 「お」")
    print("- Smile_FINAL: 笑顔")
    print("\nこれらは正しい顔の前面（Y < 0）で動作するはずです。")