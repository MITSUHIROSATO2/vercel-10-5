"""
シンプルな方法でシェイプキーを作成
"""
import bpy
import bmesh

def create_shape_key_simple(obj, key_name):
    """シンプルにシェイプキーを作成"""
    # シェイプキーが存在しない場合は作成
    if key_name not in obj.data.shape_keys.key_blocks:
        obj.shape_key_add(name=key_name, from_mix=False)
    return obj.data.shape_keys.key_blocks[key_name]

# オブジェクトを取得
obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj:
    # オブジェクトをアクティブに
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    
    mesh = obj.data
    
    # シェイプキーが無い場合は基準を作成
    if not mesh.shape_keys:
        obj.shape_key_add(name='Basis', from_mix=False)
    
    print("口の動きシェイプキーを作成中...")
    
    # 1. 簡単なテスト用シェイプキーを作成
    test_key = create_shape_key_simple(obj, "Test_SimpleMove")
    basis = mesh.shape_keys.key_blocks['Basis']
    
    # アクティブにする
    obj.active_shape_key_index = mesh.shape_keys.key_blocks.find("Test_SimpleMove")
    
    # 編集モードで作業
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(mesh)
    
    # 頂点を取得
    verts = bm.verts
    verts.ensure_lookup_table()
    
    # 下部の頂点を選択
    bpy.ops.mesh.select_all(action='DESELECT')
    for v in verts:
        if v.co.z < -0.5:  # 下部の頂点
            v.select = True
    
    # 選択した頂点を下に移動
    bpy.ops.transform.translate(value=(0, 0, -0.2))
    
    # 編集モードを終了
    bpy.ops.object.mode_set(mode='OBJECT')
    
    print("Test_SimpleMove を作成しました")
    
    # 2. プログラムで別のシェイプキーを作成
    print("\nプログラムで Mouth_Open_V2 を作成中...")
    
    # 新しいシェイプキーを作成
    mouth_key = create_shape_key_simple(obj, "Mouth_Open_V2")
    
    # 頂点データを直接操作
    for i, vert in enumerate(mesh.vertices):
        # Basisの位置をコピー
        basis_pos = basis.data[i].co
        mouth_key.data[i].co = basis_pos.copy()
        
        # 口周辺の頂点を変形
        if basis_pos.z < -0.6 and abs(basis_pos.x) < 0.7:
            # 下に移動
            mouth_key.data[i].co.z = basis_pos.z - 0.15
            # 少し後ろに
            mouth_key.data[i].co.y = basis_pos.y - 0.05
    
    # 3. あいうえおの基本形を作成
    vowels = {
        'A_Simple': lambda p: (p.x * 0.95, p.y, p.z - 0.1 if p.z < -0.5 else p.z),
        'I_Simple': lambda p: (p.x * 1.2 if abs(p.x) > 0.2 else p.x, p.y, p.z),
        'U_Simple': lambda p: (p.x * 0.7, p.y + 0.05, p.z),
        'E_Simple': lambda p: (p.x * 1.1, p.y, p.z - 0.05 if p.z < -0.6 else p.z),
        'O_Simple': lambda p: (p.x * 0.85, p.y + 0.03, p.z - 0.08 if p.z < -0.5 else p.z)
    }
    
    for vowel_name, transform_func in vowels.items():
        print(f"作成中: {vowel_name}")
        vowel_key = create_shape_key_simple(obj, vowel_name)
        
        for i, vert in enumerate(mesh.vertices):
            basis_pos = basis.data[i].co
            
            # 口周辺のみ変形
            if basis_pos.z < -0.3 and abs(basis_pos.x) < 0.8:
                new_x, new_y, new_z = transform_func(basis_pos)
                vowel_key.data[i].co.x = new_x
                vowel_key.data[i].co.y = new_y
                vowel_key.data[i].co.z = new_z
            else:
                # それ以外は基準位置のまま
                vowel_key.data[i].co = basis_pos.copy()
    
    # メッシュを更新
    mesh.update()
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
    print("\n✅ 完了！")
    print("\n作成したシェイプキー:")
    print("- Test_SimpleMove: 編集モードで作成（確実に動作）")
    print("- Mouth_Open_V2: プログラムで作成")
    print("- A_Simple, I_Simple, U_Simple, E_Simple, O_Simple: 母音の基本形")
    print("\nBlenderで確認してください。")