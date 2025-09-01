"""
実際に動作する口のシェイプキーを作成
"""
import bpy
import bmesh

obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj:
    print("=== 新しいアプローチで口のシェイプキーを作成 ===\n")
    
    # オブジェクトをアクティブに
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    
    mesh = obj.data
    
    # 編集モードに切り替えて口の頂点を直接選択
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='DESELECT')
    
    # BMeshを取得
    bm = bmesh.from_edit_mesh(mesh)
    bm.verts.ensure_lookup_table()
    
    # 口の位置を画像から推定：
    # - 顔の前面（Y > 0.3）
    # - 鼻の下、顎の上（Z座標は中間あたり）
    # - 左右は中央付近
    
    print("口の頂点を選択中...")
    
    # 頂点を選択
    selected_count = 0
    mouth_verts = []
    
    for v in bm.verts:
        # 画像から推定される口の位置
        if (v.co.y > 0.35 and  # 前面
            abs(v.co.x) < 0.35 and  # 中央付近
            -0.15 < v.co.z < 0.05):  # 口の高さ（調整）
            
            v.select = True
            selected_count += 1
            mouth_verts.append(v.index)
    
    print(f"選択された頂点数: {selected_count}")
    
    # メッシュを更新
    bmesh.update_edit_mesh(mesh)
    
    # オブジェクトモードに戻る
    bpy.ops.object.mode_set(mode='OBJECT')
    
    if selected_count > 0:
        # 新しいシェイプキーを作成
        print("\nシェイプキーを作成中...")
        
        # 古いテストキーを削除
        test_keys = ["Mouth_Open_NEW", "Mouth_A_NEW", "Mouth_I_NEW", "Mouth_U_NEW", "Mouth_Smile_NEW"]
        for key_name in test_keys:
            if key_name in mesh.shape_keys.key_blocks:
                obj.active_shape_key_index = mesh.shape_keys.key_blocks.find(key_name)
                bpy.ops.object.shape_key_remove()
        
        basis = mesh.shape_keys.key_blocks['Basis']
        
        # 1. 口を開く
        obj.shape_key_add(name="Mouth_Open_NEW", from_mix=False)
        mouth_open = mesh.shape_keys.key_blocks["Mouth_Open_NEW"]
        
        for i in mouth_verts:
            co = basis.data[i].co
            mouth_open.data[i].co = co.copy()
            # 下顎部分を下に
            if co.z < 0:
                mouth_open.data[i].co.z -= 0.08
                mouth_open.data[i].co.y -= 0.02
        
        # 2. 「あ」の口
        obj.shape_key_add(name="Mouth_A_NEW", from_mix=False)
        mouth_a = mesh.shape_keys.key_blocks["Mouth_A_NEW"]
        
        for i in mouth_verts:
            co = basis.data[i].co
            mouth_a.data[i].co = co.copy()
            # 縦に開く
            if co.z < -0.05:
                mouth_a.data[i].co.z -= 0.06
            # 少し狭める
            mouth_a.data[i].co.x *= 0.95
        
        # 3. 「い」の口
        obj.shape_key_add(name="Mouth_I_NEW", from_mix=False)
        mouth_i = mesh.shape_keys.key_blocks["Mouth_I_NEW"]
        
        for i in mouth_verts:
            co = basis.data[i].co
            mouth_i.data[i].co = co.copy()
            # 横に引く
            mouth_i.data[i].co.x *= 1.2
            # 縦を狭める
            mouth_i.data[i].co.z *= 0.95
        
        # 4. 「う」の口
        obj.shape_key_add(name="Mouth_U_NEW", from_mix=False)
        mouth_u = mesh.shape_keys.key_blocks["Mouth_U_NEW"]
        
        for i in mouth_verts:
            co = basis.data[i].co
            mouth_u.data[i].co = co.copy()
            # すぼめる
            mouth_u.data[i].co.x *= 0.7
            # 前に突き出す
            mouth_u.data[i].co.y += 0.03
        
        # 5. 笑顔
        obj.shape_key_add(name="Mouth_Smile_NEW", from_mix=False)
        mouth_smile = mesh.shape_keys.key_blocks["Mouth_Smile_NEW"]
        
        for i in mouth_verts:
            co = basis.data[i].co
            mouth_smile.data[i].co = co.copy()
            # 口角を上げる
            if abs(co.x) > 0.15:
                mouth_smile.data[i].co.z += 0.03
                mouth_smile.data[i].co.x *= 1.05
        
        print("\n作成完了:")
        print("- Mouth_Open_NEW")
        print("- Mouth_A_NEW")
        print("- Mouth_I_NEW") 
        print("- Mouth_U_NEW")
        print("- Mouth_Smile_NEW")
    
    else:
        print("\n⚠️ 口の頂点が見つかりませんでした")
        print("Z座標の範囲を調整して再試行します...")
        
        # 別の高さで試す
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='DESELECT')
        
        bm = bmesh.from_edit_mesh(mesh)
        
        # より広い範囲で選択
        for v in bm.verts:
            if (v.co.y > 0.3 and  # 前面
                abs(v.co.x) < 0.4 and  # 中央
                -0.3 < v.co.z < 0.1):  # より広い高さ
                
                v.select = True
        
        bmesh.update_edit_mesh(mesh)
        bpy.ops.object.mode_set(mode='OBJECT')
        
        print("より広い範囲で選択しました")
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
    print("\n✅ 完了！")
    print("\nBlenderで以下を確認してください:")
    print("1. 編集モードで選択されている頂点を確認")
    print("2. Mouth_Open_NEW などのシェイプキーをテスト")
    print("\n口が動かない場合は、選択されている頂点の位置を教えてください。")