"""
正しい口の位置でシェイプキーを作成
"""
import bpy

def create_mouth_shape_key(obj, key_name, transform_func):
    """口のシェイプキーを作成"""
    mesh = obj.data
    
    # シェイプキーが存在しない場合は作成
    if key_name not in mesh.shape_keys.key_blocks:
        obj.shape_key_add(name=key_name, from_mix=False)
    
    shape_key = mesh.shape_keys.key_blocks[key_name]
    basis = mesh.shape_keys.key_blocks['Basis']
    
    # 正しい口の領域で変形を適用
    modified_count = 0
    for i, vert in enumerate(mesh.vertices):
        co = basis.data[i].co
        
        # 口の領域: Z座標 -0.30 〜 0.00、中央付近、前方
        if (-0.30 <= co.z <= 0.00 and  # 正しい口の高さ
            abs(co.x) < 0.6 and         # 中央付近
            co.y > 0.2):                # 前方
            
            # 変形を適用
            new_x, new_y, new_z = transform_func(co.x, co.y, co.z)
            shape_key.data[i].co.x = new_x
            shape_key.data[i].co.y = new_y
            shape_key.data[i].co.z = new_z
            modified_count += 1
        else:
            # それ以外は基準位置のまま
            shape_key.data[i].co = co.copy()
    
    return modified_count

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
    
    print("正しい口の位置でシェイプキーを作成中...")
    print("口の領域: Z=-0.30〜0.00, Y>0.2\n")
    
    # 口の開閉
    def mouth_open_transform(x, y, z):
        # 下唇を下げる
        if z < -0.15:
            new_z = z - 0.08
        else:
            new_z = z
        # 少し後ろに引く
        new_y = y - 0.03
        return x, new_y, new_z
    
    count = create_mouth_shape_key(obj, "Mouth_Open_Correct", mouth_open_transform)
    print(f"Mouth_Open_Correct: {count}頂点を変形")
    
    # 母音の作成
    vowels = {
        'A_Correct': lambda x, y, z: (
            x * 0.95,  # 少し狭める
            y,
            z - 0.06 if z < -0.1 else z  # 下部を開く
        ),
        'I_Correct': lambda x, y, z: (
            x * 1.3 if abs(x) > 0.1 else x,  # 横に広げる
            y,
            z * 0.98  # 縦を少し狭める
        ),
        'U_Correct': lambda x, y, z: (
            x * 0.6,  # すぼめる
            y + 0.04,  # 前に突き出す
            z
        ),
        'E_Correct': lambda x, y, z: (
            x * 1.15,  # 少し横に
            y,
            z - 0.03 if z < -0.15 else z  # 少し開く
        ),
        'O_Correct': lambda x, y, z: (
            x * 0.8,  # 丸める
            y + 0.02,  # 少し前に
            z - 0.04 if z < -0.1 else z  # 縦に開く
        )
    }
    
    for vowel_name, transform in vowels.items():
        count = create_mouth_shape_key(obj, vowel_name, transform)
        print(f"{vowel_name}: {count}頂点を変形")
    
    # 表情
    def smile_transform(x, y, z):
        # 口角を上げる
        if abs(x) > 0.2:  # 口の端
            new_z = z + 0.04
            new_x = x * 1.05
        else:
            new_x = x
            new_z = z
        return new_x, y, new_z
    
    count = create_mouth_shape_key(obj, "Smile_Correct", smile_transform)
    print(f"Smile_Correct: {count}頂点を変形")
    
    # メッシュを更新
    mesh.update()
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
    print("\n✅ 完了！")
    print("\n作成したシェイプキー（正しい口の位置）:")
    print("- Mouth_Open_Correct: 口を開く")
    print("- A_Correct, I_Correct, U_Correct, E_Correct, O_Correct: 母音")
    print("- Smile_Correct: 笑顔")
    print("\nこれらは口の正しい位置（顔の中央下部）で動作します。")