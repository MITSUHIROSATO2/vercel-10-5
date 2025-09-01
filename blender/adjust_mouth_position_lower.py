"""
口の位置を下に調整してシェイプキーを再作成
"""
import bpy

obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj:
    mesh = obj.data
    vertices = mesh.vertices
    
    print("=== 口の位置を下に調整 ===\n")
    
    # 既存のシェイプキーを削除
    if mesh.shape_keys:
        keys_to_remove = []
        for key in mesh.shape_keys.key_blocks:
            if key.name in ['Mouth_Open', 'Vowel_A', 'Vowel_I', 'Vowel_U', 'Vowel_E', 'Vowel_O', 'Smile']:
                keys_to_remove.append(key.name)
        
        for key_name in keys_to_remove:
            obj.active_shape_key_index = mesh.shape_keys.key_blocks.find(key_name)
            bpy.ops.object.shape_key_remove()
    
    basis = mesh.shape_keys.key_blocks['Basis']
    
    # Z座標を段階的に下げてテスト
    print("異なるZ座標でテスト用シェイプキーを作成...\n")
    
    # 現在の設定より下の範囲をテスト
    z_ranges = [
        {
            'name': 'Test_Mouth_Z1',
            'z_min': -0.35,
            'z_max': -0.15,
            'desc': 'Z: -0.35 〜 -0.15（現在より少し下）'
        },
        {
            'name': 'Test_Mouth_Z2',
            'z_min': -0.40,
            'z_max': -0.20,
            'desc': 'Z: -0.40 〜 -0.20（さらに下）'
        },
        {
            'name': 'Test_Mouth_Z3',
            'z_min': -0.45,
            'z_max': -0.25,
            'desc': 'Z: -0.45 〜 -0.25（もっと下）'
        },
        {
            'name': 'Test_Mouth_Z4',
            'z_min': -0.50,
            'z_max': -0.30,
            'desc': 'Z: -0.50 〜 -0.30（かなり下）'
        }
    ]
    
    # Y座標とX座標は前回の分析結果を使用
    y_min, y_max = -0.65, -0.54
    x_min, x_max = -0.15, 0.15
    
    for test in z_ranges:
        obj.shape_key_add(name=test['name'], from_mix=False)
        shape_key = mesh.shape_keys.key_blocks[test['name']]
        
        count = 0
        upper_count = 0
        lower_count = 0
        
        for i, v in enumerate(vertices):
            co = basis.data[i].co
            shape_key.data[i].co = co.copy()
            
            # 指定の範囲内の頂点
            if (y_min < co.y < y_max and
                test['z_min'] < co.z < test['z_max'] and
                x_min < co.x < x_max):
                
                # 口を開く動き
                z_center = (test['z_min'] + test['z_max']) / 2
                if co.z < z_center:  # 下半分
                    shape_key.data[i].co.z -= 0.06
                    lower_count += 1
                else:  # 上半分
                    shape_key.data[i].co.z -= 0.02
                    upper_count += 1
                
                count += 1
        
        print(f"{test['name']}: {count}頂点（上{upper_count}/下{lower_count}） - {test['desc']}")
    
    # より細かい調整用
    print("\n\n細かい調整用テスト：")
    
    fine_tests = [
        ('Test_Fine_1', -0.32, -0.12, '少し下'),
        ('Test_Fine_2', -0.34, -0.14, 'もう少し下'),
        ('Test_Fine_3', -0.36, -0.16, 'さらに下'),
        ('Test_Fine_4', -0.38, -0.18, 'もっと下')
    ]
    
    for name, z_min, z_max, desc in fine_tests:
        obj.shape_key_add(name=name, from_mix=False)
        shape_key = mesh.shape_keys.key_blocks[name]
        
        count = 0
        for i, v in enumerate(vertices):
            co = basis.data[i].co
            shape_key.data[i].co = co.copy()
            
            if (y_min < co.y < y_max and
                z_min < co.z < z_max and
                x_min < co.x < x_max):
                
                # 下唇を大きく動かす
                if co.z < (z_min + z_max) / 2:
                    shape_key.data[i].co.z -= 0.08
                    shape_key.data[i].co.y += 0.02
                else:
                    shape_key.data[i].co.z -= 0.01
                
                count += 1
        
        print(f"{name}: {count}頂点 - {desc}")
    
    # 口の中心位置を特定するための参照点
    print("\n\n口の中心位置の参照：")
    
    center_refs = [
        ('Ref_Upper_Lip', -0.25, -0.15, '上唇の位置'),
        ('Ref_Mouth_Center', -0.30, -0.20, '口の中心線'),
        ('Ref_Lower_Lip', -0.35, -0.25, '下唇の位置'),
        ('Ref_Chin', -0.45, -0.35, '顎の位置')
    ]
    
    for name, z_min, z_max, desc in center_refs:
        obj.shape_key_add(name=name, from_mix=False)
        shape_key = mesh.shape_keys.key_blocks[name]
        
        count = 0
        for i, v in enumerate(vertices):
            co = basis.data[i].co
            shape_key.data[i].co = co.copy()
            
            if (y_min < co.y < y_max and
                z_min < co.z < z_max and
                abs(co.x) < 0.1):  # 中央のみ
                
                # 前に少し出す
                shape_key.data[i].co.y -= 0.05
                count += 1
        
        print(f"{name}: {count}頂点 - {desc}")
    
    # メッシュを更新
    mesh.update()
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
    print("\n✅ 完了！")
    print("\n以下のテストシェイプキーで口の正確な位置を確認してください：")
    print("\n【大まかな範囲】")
    print("- Test_Mouth_Z1〜Z4")
    print("\n【細かい調整】")
    print("- Test_Fine_1〜4")
    print("\n【参照位置】")
    print("- Ref_Upper_Lip（上唇）")
    print("- Ref_Mouth_Center（口の中心）")
    print("- Ref_Lower_Lip（下唇）")
    print("- Ref_Chin（顎）")
    print("\n正しい口の位置が特定できたら教えてください。")