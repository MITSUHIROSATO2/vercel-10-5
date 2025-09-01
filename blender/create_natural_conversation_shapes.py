"""
自然な会話のための改善されたシェイプキーを作成
"""
import bpy
import math

obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj:
    mesh = obj.data
    vertices = mesh.vertices
    
    print("=== 自然な会話用シェイプキー作成 ===\n")
    
    # 既存のテストシェイプキーを削除
    if mesh.shape_keys:
        keys_to_remove = []
        for key in mesh.shape_keys.key_blocks:
            if (key.name.startswith('Test_') or 
                key.name.startswith('Ref_') or
                key.name in ['Mouth_Open', 'Vowel_A', 'Vowel_I', 'Vowel_U', 'Vowel_E', 'Vowel_O', 'Smile']):
                keys_to_remove.append(key.name)
        
        for key_name in keys_to_remove:
            obj.active_shape_key_index = mesh.shape_keys.key_blocks.find(key_name)
            bpy.ops.object.shape_key_remove()
    
    basis = mesh.shape_keys.key_blocks['Basis']
    
    # 正しい口の位置（Ref_Upper_Lip〜Ref_Chinから確認）
    y_min, y_max = -0.65, -0.54
    z_min, z_max = -0.45, -0.15  # 調整後の正しい範囲
    x_min, x_max = -0.15, 0.15
    
    # 口の領域の頂点を収集
    mouth_vertices = []
    upper_lip_vertices = []
    lower_lip_vertices = []
    corner_vertices = []
    
    for i, v in enumerate(vertices):
        if (y_min < v.co.y < y_max and
            z_min < v.co.z < z_max and
            x_min < v.co.x < x_max):
            
            mouth_vertices.append(i)
            
            # 上唇（Z座標上部）
            if v.co.z > -0.25:
                upper_lip_vertices.append(i)
            # 下唇（Z座標下部）
            elif v.co.z < -0.35:
                lower_lip_vertices.append(i)
            
            # 口角（X座標の端）
            if abs(v.co.x) > 0.08:
                corner_vertices.append(i)
    
    print(f"口の頂点数: {len(mouth_vertices)}")
    print(f"上唇: {len(upper_lip_vertices)}, 下唇: {len(lower_lip_vertices)}, 口角: {len(corner_vertices)}\n")
    
    # 1. 基本的な口の開閉（会話用）
    obj.shape_key_add(name="Talk_Open", from_mix=False)
    talk_open = mesh.shape_keys.key_blocks["Talk_Open"]
    
    for i in range(len(vertices)):
        talk_open.data[i].co = basis.data[i].co.copy()
        
        if i in lower_lip_vertices:
            # 下唇を自然に下げる
            talk_open.data[i].co.z -= 0.03
            talk_open.data[i].co.y += 0.01
        elif i in upper_lip_vertices:
            # 上唇はわずかに動かす
            talk_open.data[i].co.z += 0.005
    
    print("✓ Talk_Open - 会話時の自然な開口")
    
    # 2. 母音「あ」（会話用）
    obj.shape_key_add(name="Vowel_A_Talk", from_mix=False)
    vowel_a = mesh.shape_keys.key_blocks["Vowel_A_Talk"]
    
    for i in range(len(vertices)):
        vowel_a.data[i].co = basis.data[i].co.copy()
        
        if i in mouth_vertices:
            co = basis.data[i].co
            # 適度に開く
            if i in lower_lip_vertices:
                vowel_a.data[i].co.z -= 0.04
                vowel_a.data[i].co.y += 0.01
            elif i in upper_lip_vertices:
                vowel_a.data[i].co.z += 0.01
            
            # 少し狭める
            if abs(co.x) > 0.05:
                vowel_a.data[i].co.x *= 0.95
    
    print("✓ Vowel_A_Talk - 「あ」（会話用）")
    
    # 3. 母音「い」（会話用）
    obj.shape_key_add(name="Vowel_I_Talk", from_mix=False)
    vowel_i = mesh.shape_keys.key_blocks["Vowel_I_Talk"]
    
    for i in range(len(vertices)):
        vowel_i.data[i].co = basis.data[i].co.copy()
        
        if i in mouth_vertices:
            # 横に広げる（控えめに）
            vowel_i.data[i].co.x *= 1.15
            
            # 縦を狭める
            z_center = -0.30
            if basis.data[i].co.z > z_center:
                vowel_i.data[i].co.z -= 0.01
            else:
                vowel_i.data[i].co.z += 0.01
    
    print("✓ Vowel_I_Talk - 「い」（会話用）")
    
    # 4. 母音「う」（会話用）
    obj.shape_key_add(name="Vowel_U_Talk", from_mix=False)
    vowel_u = mesh.shape_keys.key_blocks["Vowel_U_Talk"]
    
    for i in range(len(vertices)):
        vowel_u.data[i].co = basis.data[i].co.copy()
        
        if i in mouth_vertices:
            # すぼめる
            vowel_u.data[i].co.x *= 0.75
            # 前に突き出す（控えめに）
            vowel_u.data[i].co.y -= 0.02
            
            # 上下の唇を近づける
            z_center = -0.30
            if basis.data[i].co.z > z_center:
                vowel_u.data[i].co.z -= 0.015
            else:
                vowel_u.data[i].co.z += 0.015
    
    print("✓ Vowel_U_Talk - 「う」（会話用）")
    
    # 5. 母音「え」（会話用）
    obj.shape_key_add(name="Vowel_E_Talk", from_mix=False)
    vowel_e = mesh.shape_keys.key_blocks["Vowel_E_Talk"]
    
    for i in range(len(vertices)):
        vowel_e.data[i].co = basis.data[i].co.copy()
        
        if i in mouth_vertices:
            # 少し横に
            vowel_e.data[i].co.x *= 1.08
            
            # 少し開く
            if i in lower_lip_vertices:
                vowel_e.data[i].co.z -= 0.02
            elif i in upper_lip_vertices:
                vowel_e.data[i].co.z += 0.005
    
    print("✓ Vowel_E_Talk - 「え」（会話用）")
    
    # 6. 母音「お」（会話用）
    obj.shape_key_add(name="Vowel_O_Talk", from_mix=False)
    vowel_o = mesh.shape_keys.key_blocks["Vowel_O_Talk"]
    
    for i in range(len(vertices)):
        vowel_o.data[i].co = basis.data[i].co.copy()
        
        if i in mouth_vertices:
            # 丸める
            vowel_o.data[i].co.x *= 0.85
            
            # 適度に開く
            if i in lower_lip_vertices:
                vowel_o.data[i].co.z -= 0.025
            
            # 少し前に
            vowel_o.data[i].co.y -= 0.015
    
    print("✓ Vowel_O_Talk - 「お」（会話用）")
    
    # 7. 子音用シェイプキー
    # ま行（唇を閉じる）
    obj.shape_key_add(name="Consonant_M", from_mix=False)
    consonant_m = mesh.shape_keys.key_blocks["Consonant_M"]
    
    for i in range(len(vertices)):
        consonant_m.data[i].co = basis.data[i].co.copy()
        
        if i in mouth_vertices:
            z_center = -0.30
            # 上下の唇を合わせる
            if basis.data[i].co.z > z_center:
                consonant_m.data[i].co.z -= 0.04
            else:
                consonant_m.data[i].co.z += 0.04
            
            # 少し前に出す
            consonant_m.data[i].co.y -= 0.01
    
    print("✓ Consonant_M - ま行（唇を閉じる）")
    
    # は行（少し開く）
    obj.shape_key_add(name="Consonant_H", from_mix=False)
    consonant_h = mesh.shape_keys.key_blocks["Consonant_H"]
    
    for i in range(len(vertices)):
        consonant_h.data[i].co = basis.data[i].co.copy()
        
        if i in mouth_vertices:
            # わずかに開く
            if i in lower_lip_vertices:
                consonant_h.data[i].co.z -= 0.015
    
    print("✓ Consonant_H - は行（わずかに開く）")
    
    # 8. 表情系シェイプキー
    # 微笑み
    obj.shape_key_add(name="Smile_Subtle", from_mix=False)
    smile_subtle = mesh.shape_keys.key_blocks["Smile_Subtle"]
    
    for i in range(len(vertices)):
        smile_subtle.data[i].co = basis.data[i].co.copy()
        
        if i in corner_vertices:
            # 口角を上げる
            smile_subtle.data[i].co.z += 0.02
            smile_subtle.data[i].co.x *= 1.05
    
    print("✓ Smile_Subtle - 微笑み")
    
    # 困り顔
    obj.shape_key_add(name="Frown", from_mix=False)
    frown = mesh.shape_keys.key_blocks["Frown"]
    
    for i in range(len(vertices)):
        frown.data[i].co = basis.data[i].co.copy()
        
        if i in corner_vertices:
            # 口角を下げる
            frown.data[i].co.z -= 0.015
    
    print("✓ Frown - 困り顔")
    
    # 9. ブレンド用の中間シェイプキー
    # 半開き
    obj.shape_key_add(name="Half_Open", from_mix=False)
    half_open = mesh.shape_keys.key_blocks["Half_Open"]
    
    for i in range(len(vertices)):
        half_open.data[i].co = basis.data[i].co.copy()
        
        if i in lower_lip_vertices:
            half_open.data[i].co.z -= 0.015
    
    print("✓ Half_Open - 半開き（ブレンド用）")
    
    # メッシュを更新
    mesh.update()
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
    print("\n✅ 完了！")
    print("\n作成したシェイプキー：")
    print("\n【会話用母音】")
    print("- Vowel_A/I/U/E/O_Talk: 自然な会話用の母音")
    print("\n【子音】")
    print("- Consonant_M: ま行（唇を閉じる）")
    print("- Consonant_H: は行（わずかに開く）")
    print("\n【基本動作】")
    print("- Talk_Open: 会話時の自然な開口")
    print("- Half_Open: 半開き（ブレンド用）")
    print("\n【表情】")
    print("- Smile_Subtle: 微笑み")
    print("- Frown: 困り顔")
    print("\nこれらのシェイプキーをブレンドすることで、自然な会話アニメーションが可能です。")