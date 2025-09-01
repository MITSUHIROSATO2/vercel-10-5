"""
シェイプキーを直接編集モードで作成
"""
import bpy

# オブジェクトを取得
face_obj = bpy.data.objects.get('HighQualityFaceAvatar')

if not face_obj:
    print("エラー: HighQualityFaceAvatar が見つかりません")
else:
    # すべてのオブジェクトの選択を解除
    bpy.ops.object.select_all(action='DESELECT')
    
    # 対象オブジェクトを選択してアクティブに
    face_obj.select_set(True)
    bpy.context.view_layer.objects.active = face_obj
    
    # オブジェクトモードに切り替え
    if bpy.context.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    
    print("シェイプキーのデバッグ情報:")
    mesh = face_obj.data
    
    # シェイプキーが存在するか確認
    if not mesh.shape_keys:
        print("シェイプキーが存在しません。作成します...")
        bpy.ops.object.shape_key_add(from_mix=False)
    
    shape_keys = mesh.shape_keys
    print(f"シェイプキーブロック: {shape_keys}")
    print(f"キー数: {len(shape_keys.key_blocks)}")
    
    # Mouth_Open を直接編集
    print("\nMouth_Open シェイプキーを作成中...")
    
    # Mouth_Openが存在しない場合は作成
    if "Mouth_Open" not in shape_keys.key_blocks:
        bpy.ops.object.shape_key_add(from_mix=False)
        shape_keys.key_blocks[-1].name = "Mouth_Open"
    
    # Mouth_Openをアクティブに
    mouth_open_index = shape_keys.key_blocks.find("Mouth_Open")
    face_obj.active_shape_key_index = mouth_open_index
    
    # 編集モードに切り替え
    bpy.ops.object.mode_set(mode='EDIT')
    
    # すべての頂点の選択を解除
    bpy.ops.mesh.select_all(action='DESELECT')
    
    # オブジェクトモードに戻る
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # 頂点を直接編集
    mouth_open = shape_keys.key_blocks["Mouth_Open"]
    basis = shape_keys.key_blocks["Basis"]
    
    # 口周辺の頂点を移動
    vertices = mesh.vertices
    modified_count = 0
    
    for i, vertex in enumerate(vertices):
        co = basis.data[i].co
        # 下顎付近の頂点（Z座標が低い）を下に移動
        if co.z < -0.5 and co.y > -0.5 and abs(co.x) < 0.8:
            # 頂点を下に移動
            mouth_open.data[i].co = co.copy()
            mouth_open.data[i].co.z -= 0.15  # 下に移動
            mouth_open.data[i].co.y -= 0.05  # 少し後ろに
            modified_count += 1
    
    print(f"変更した頂点数: {modified_count}")
    
    # Viseme_A を作成
    print("\nViseme_A シェイプキーを作成中...")
    
    if "Viseme_A" not in shape_keys.key_blocks:
        bpy.ops.object.shape_key_add(from_mix=False)
        shape_keys.key_blocks[-1].name = "Viseme_A"
    
    viseme_a_index = shape_keys.key_blocks.find("Viseme_A")
    face_obj.active_shape_key_index = viseme_a_index
    
    viseme_a = shape_keys.key_blocks["Viseme_A"]
    modified_count = 0
    
    for i, vertex in enumerate(vertices):
        co = basis.data[i].co
        # 口周辺を「あ」の形に
        if co.z < -0.4 and co.y > -0.5 and abs(co.x) < 0.7:
            viseme_a.data[i].co = co.copy()
            # 縦に開く
            if co.z < -0.6:
                viseme_a.data[i].co.z -= 0.12
            # 横幅を少し狭める
            viseme_a.data[i].co.x *= 0.9
            modified_count += 1
    
    print(f"変更した頂点数: {modified_count}")
    
    # メッシュを更新
    mesh.update()
    
    # テスト：シェイプキーの値を変更
    print("\nシェイプキーのテスト:")
    for key_name in ["Mouth_Open", "Viseme_A"]:
        key = shape_keys.key_blocks.get(key_name)
        if key:
            key.value = 1.0
            print(f"{key_name}: 値を1.0に設定")
            # 実際の頂点の変化を確認
            diff_count = 0
            for i in range(min(100, len(vertices))):
                diff = (key.data[i].co - basis.data[i].co).length
                if diff > 0.001:
                    diff_count += 1
            print(f"  最初の100頂点中 {diff_count} 個が変化")
            key.value = 0.0
    
    # ファイルを保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
    print("\n完了！")
    print("Blenderで以下を確認してください:")
    print("1. HighQualityFaceAvatarを選択")
    print("2. プロパティ > メッシュデータ > シェイプキー")
    print("3. Mouth_Open と Viseme_A のスライダーを動かす")