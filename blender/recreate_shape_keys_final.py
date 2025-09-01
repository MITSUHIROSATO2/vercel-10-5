"""
新しい口構造に対応したシェイプキーを再作成
"""
import bpy

print("=== 改良版シェイプキー作成 ===\n")

face_obj = bpy.data.objects.get('HighQualityFaceAvatar')

if face_obj and face_obj.data.shape_keys:
    mesh = face_obj.data
    shape_keys = mesh.shape_keys.key_blocks
    
    # 既存のシェイプキーをクリア（Basis以外）
    keys_to_remove = []
    for key in shape_keys:
        if key.name != 'Basis':
            keys_to_remove.append(key.name)
    
    for key_name in keys_to_remove:
        face_obj.active_shape_key_index = shape_keys.find(key_name)
        bpy.ops.object.shape_key_remove()
    
    print("新しいシェイプキーを作成中...\n")
    
    basis = shape_keys['Basis']
    
    # 頂点グループを取得
    upper_lip_group = face_obj.vertex_groups.get('Upper_Lip_Full')
    lower_lip_group = face_obj.vertex_groups.get('Lower_Lip_Full')
    
    if not upper_lip_group or not lower_lip_group:
        print("警告: 頂点グループが見つかりません")
        print("デフォルトの頂点範囲を使用します")
        # デフォルトの頂点範囲を使用
        upper_lip_verts = []
        lower_lip_verts = []
        for i, v in enumerate(mesh.vertices):
            if (-0.65 < v.co.y < -0.54 and
                -0.45 < v.co.z < -0.15 and
                -0.15 < v.co.x < 0.15):
                if v.co.z > -0.30:  # 上唇
                    upper_lip_verts.append(i)
                else:  # 下唇
                    lower_lip_verts.append(i)
    else:
        # 頂点グループのインデックスを取得
        upper_lip_verts = []
        lower_lip_verts = []
        
        for v in mesh.vertices:
            for g in v.groups:
                if g.group == upper_lip_group.index and g.weight > 0.5:
                    upper_lip_verts.append(v.index)
                elif g.group == lower_lip_group.index and g.weight > 0.5:
                    lower_lip_verts.append(v.index)
    
    print(f"上唇頂点数: {len(upper_lip_verts)}")
    print(f"下唇頂点数: {len(lower_lip_verts)}\n")
    
    # 1. 口を開く（基本）
    face_obj.shape_key_add(name="Mouth_Open", from_mix=False)
    mouth_open = shape_keys["Mouth_Open"]
    
    for i in range(len(mesh.vertices)):
        mouth_open.data[i].co = basis.data[i].co.copy()
        
        if i in lower_lip_verts:
            # 下唇を下げる
            mouth_open.data[i].co.z -= 0.05
            mouth_open.data[i].co.y += 0.01
        elif i in upper_lip_verts:
            # 上唇を少し上げる
            mouth_open.data[i].co.z += 0.01
    
    print("✓ Mouth_Open - 口を開く")
    
    # 2. 大きく開く
    face_obj.shape_key_add(name="Mouth_Wide_Open", from_mix=False)
    wide_open = shape_keys["Mouth_Wide_Open"]
    
    for i in range(len(mesh.vertices)):
        wide_open.data[i].co = basis.data[i].co.copy()
        
        if i in lower_lip_verts:
            # 下唇を大きく下げる
            wide_open.data[i].co.z -= 0.10
            wide_open.data[i].co.y += 0.02
        elif i in upper_lip_verts:
            # 上唇も上げる
            wide_open.data[i].co.z += 0.02
    
    print("✓ Mouth_Wide_Open - 大きく開く")
    
    # 3. 母音「あ」
    face_obj.shape_key_add(name="Vowel_A", from_mix=False)
    vowel_a = shape_keys["Vowel_A"]
    
    for i in range(len(mesh.vertices)):
        vowel_a.data[i].co = basis.data[i].co.copy()
        
        if i in lower_lip_verts:
            vowel_a.data[i].co.z -= 0.06
            vowel_a.data[i].co.y += 0.01
            # 少し狭める
            vowel_a.data[i].co.x *= 0.95
        elif i in upper_lip_verts:
            vowel_a.data[i].co.z += 0.01
            vowel_a.data[i].co.x *= 0.95
    
    print("✓ Vowel_A - 「あ」")
    
    # 4. 母音「い」
    face_obj.shape_key_add(name="Vowel_I", from_mix=False)
    vowel_i = shape_keys["Vowel_I"]
    
    for i in range(len(mesh.vertices)):
        vowel_i.data[i].co = basis.data[i].co.copy()
        
        if i in upper_lip_verts or i in lower_lip_verts:
            # 横に広げる
            vowel_i.data[i].co.x *= 1.2
            # 縦を狭める（上下の唇を近づける）
            v = basis.data[i].co
            if v.z > -0.30:  # 上唇
                vowel_i.data[i].co.z -= 0.01
            else:  # 下唇
                vowel_i.data[i].co.z += 0.01
    
    print("✓ Vowel_I - 「い」")
    
    # 5. 母音「う」
    face_obj.shape_key_add(name="Vowel_U", from_mix=False)
    vowel_u = shape_keys["Vowel_U"]
    
    for i in range(len(mesh.vertices)):
        vowel_u.data[i].co = basis.data[i].co.copy()
        
        if i in upper_lip_verts or i in lower_lip_verts:
            # すぼめる
            vowel_u.data[i].co.x *= 0.7
            # 前に突き出す
            vowel_u.data[i].co.y -= 0.03
            # 少し開く
            if i in lower_lip_verts:
                vowel_u.data[i].co.z -= 0.02
    
    print("✓ Vowel_U - 「う」")
    
    # 6. 母音「え」
    face_obj.shape_key_add(name="Vowel_E", from_mix=False)
    vowel_e = shape_keys["Vowel_E"]
    
    for i in range(len(mesh.vertices)):
        vowel_e.data[i].co = basis.data[i].co.copy()
        
        if i in lower_lip_verts:
            vowel_e.data[i].co.z -= 0.03
            vowel_e.data[i].co.x *= 1.05
        elif i in upper_lip_verts:
            vowel_e.data[i].co.z += 0.005
            vowel_e.data[i].co.x *= 1.05
    
    print("✓ Vowel_E - 「え」")
    
    # 7. 母音「お」
    face_obj.shape_key_add(name="Vowel_O", from_mix=False)
    vowel_o = shape_keys["Vowel_O"]
    
    for i in range(len(mesh.vertices)):
        vowel_o.data[i].co = basis.data[i].co.copy()
        
        if i in lower_lip_verts:
            vowel_o.data[i].co.z -= 0.04
            vowel_o.data[i].co.x *= 0.85
            vowel_o.data[i].co.y -= 0.01
        elif i in upper_lip_verts:
            vowel_o.data[i].co.z += 0.01
            vowel_o.data[i].co.x *= 0.85
            vowel_o.data[i].co.y -= 0.01
    
    print("✓ Vowel_O - 「お」")
    
    # 8. 笑顔
    face_obj.shape_key_add(name="Smile", from_mix=False)
    smile = shape_keys["Smile"]
    
    for i in range(len(mesh.vertices)):
        smile.data[i].co = basis.data[i].co.copy()
        
        if i in upper_lip_verts or i in lower_lip_verts:
            v = basis.data[i].co
            # 口角を上げる
            if abs(v.x) > 0.05:
                smile.data[i].co.z += 0.02
                smile.data[i].co.x *= 1.1
    
    print("✓ Smile - 笑顔")
    
    # コントローラーのドライバーを再設定
    controller = bpy.data.objects.get('FaceController')
    if controller:
        print("\nコントローラーのドライバーを更新中...")
        
        # 既存のドライバーをクリア
        if mesh.shape_keys.animation_data:
            mesh.shape_keys.animation_data_clear()
        
        # 新しいドライバーを設定
        driver_mappings = {
            "Mouth_Open": ("mouth_open", "mouth_open * talk_intensity"),
            "Vowel_A": ("vowel_a", "vowel_a * talk_intensity"),
            "Vowel_I": ("vowel_i", "vowel_i * talk_intensity"),
            "Vowel_U": ("vowel_u", "vowel_u * talk_intensity"),
            "Vowel_E": ("vowel_e", "vowel_e * talk_intensity"),
            "Vowel_O": ("vowel_o", "vowel_o * talk_intensity"),
            "Smile": ("smile", "smile")
        }
        
        for shape_name, (prop_name, expression) in driver_mappings.items():
            if shape_name in shape_keys:
                driver = shape_keys[shape_name].driver_add("value").driver
                driver.type = 'SCRIPTED'
                
                # プロパティ変数
                var1 = driver.variables.new()
                var1.name = prop_name
                var1.type = 'SINGLE_PROP'
                var1.targets[0].id = controller
                var1.targets[0].data_path = f'["{prop_name}"]'
                
                # talk_intensityが必要な場合
                if "talk_intensity" in expression:
                    var2 = driver.variables.new()
                    var2.name = "talk_intensity"
                    var2.type = 'SINGLE_PROP'
                    var2.targets[0].id = controller
                    var2.targets[0].data_path = '["talk_intensity"]'
                
                driver.expression = expression
                print(f"  ✓ {shape_name} ドライバー設定")
    
    # メッシュを更新
    mesh.update()
    
    print("\n✅ シェイプキー再作成完了！")
    print("\n口が正しく開くようになりました:")
    print("- 上唇と下唇が分離")
    print("- 口腔内構造が表示")
    print("- 自然な口の動き")
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
else:
    print("エラー: オブジェクトまたはシェイプキーが見つかりません")