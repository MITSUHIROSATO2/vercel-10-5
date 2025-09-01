"""
X軸を調整して口の位置を特定
"""
import bpy

obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj:
    mesh = obj.data
    vertices = mesh.vertices
    
    print("=== X軸（左右）を調整して口の位置を特定 ===\n")
    
    # 既存のテストシェイプキーを削除
    if mesh.shape_keys:
        keys_to_remove = []
        for key in mesh.shape_keys.key_blocks:
            if key.name.startswith('Test_') or key.name.startswith('X_'):
                keys_to_remove.append(key.name)
        
        for key_name in keys_to_remove:
            obj.active_shape_key_index = mesh.shape_keys.key_blocks.find(key_name)
            bpy.ops.object.shape_key_remove()
    
    basis = mesh.shape_keys.key_blocks['Basis']
    
    # X軸の範囲を変えてテスト
    print("X軸の異なる範囲でテスト：\n")
    
    x_tests = [
        {
            'name': 'X_Center_Narrow',
            'x_range': 0.1,
            'desc': '中央の狭い範囲（|X| < 0.1）'
        },
        {
            'name': 'X_Center_Small',
            'x_range': 0.2,
            'desc': '中央の小範囲（|X| < 0.2）'
        },
        {
            'name': 'X_Center_Medium',
            'x_range': 0.3,
            'desc': '中央の中範囲（|X| < 0.3）'
        },
        {
            'name': 'X_Center_Wide',
            'x_range': 0.4,
            'desc': '中央の広範囲（|X| < 0.4）'
        },
        {
            'name': 'X_Left_Side',
            'condition': lambda x: -0.4 < x < -0.1,
            'desc': '左側（-0.4 < X < -0.1）'
        },
        {
            'name': 'X_Right_Side',
            'condition': lambda x: 0.1 < x < 0.4,
            'desc': '右側（0.1 < X < 0.4）'
        }
    ]
    
    # 口と思われる高さで、X軸の範囲を変えてテスト
    for test in x_tests:
        obj.shape_key_add(name=test['name'], from_mix=False)
        shape_key = mesh.shape_keys.key_blocks[test['name']]
        
        count = 0
        for i, v in enumerate(vertices):
            co = basis.data[i].co
            shape_key.data[i].co = co.copy()
            
            # 条件：前面、口の高さ、指定のX範囲
            x_condition = False
            if 'x_range' in test:
                x_condition = abs(co.x) < test['x_range']
            else:
                x_condition = test['condition'](co.x)
            
            if (co.y < -0.4 and  # 前面
                -0.25 < co.z < -0.1 and  # 口の高さ
                x_condition):  # X範囲
                
                # 前に少し出す
                shape_key.data[i].co.y -= 0.05
                count += 1
        
        print(f"{test['name']}: {count}頂点 - {test['desc']}")
    
    # 口の正確な位置を探るため、グリッドテスト
    print("\n\nグリッドテスト（詳細な位置特定）：\n")
    
    grid_tests = [
        {
            'name': 'Grid_UpperLip',
            'z_min': -0.15, 'z_max': -0.05,
            'desc': '上唇候補'
        },
        {
            'name': 'Grid_LowerLip',
            'z_min': -0.25, 'z_max': -0.15,
            'desc': '下唇候補'
        },
        {
            'name': 'Grid_MouthCenter',
            'z_min': -0.20, 'z_max': -0.10,
            'desc': '口の中央'
        }
    ]
    
    for test in grid_tests:
        obj.shape_key_add(name=test['name'], from_mix=False)
        shape_key = mesh.shape_keys.key_blocks[test['name']]
        
        count = 0
        for i, v in enumerate(vertices):
            co = basis.data[i].co
            shape_key.data[i].co = co.copy()
            
            # 中央の適度な範囲で
            if (co.y < -0.4 and  # 前面
                test['z_min'] < co.z < test['z_max'] and  # 指定の高さ
                abs(co.x) < 0.25):  # 中央付近
                
                shape_key.data[i].co.y -= 0.05
                count += 1
        
        print(f"{test['name']}: {count}頂点 - {test['desc']}")
    
    # 視覚的な確認用
    print("\n\n視覚確認用シェイプキー：")
    
    # 口を開く動きのテスト（異なるX範囲）
    for x_max in [0.15, 0.2, 0.25, 0.3]:
        name = f'Mouth_Open_X{int(x_max*100)}'
        obj.shape_key_add(name=name, from_mix=False)
        shape_key = mesh.shape_keys.key_blocks[name]
        
        count = 0
        for i, v in enumerate(vertices):
            co = basis.data[i].co
            shape_key.data[i].co = co.copy()
            
            if (co.y < -0.4 and  # 前面
                -0.25 < co.z < -0.1 and  # 口の高さ
                abs(co.x) < x_max):  # X範囲
                
                # 口を開く動き
                if co.z < -0.15:  # 下唇
                    shape_key.data[i].co.z -= 0.06
                    shape_key.data[i].co.y += 0.02
                count += 1
        
        print(f"{name}: {count}頂点 - X範囲±{x_max}")
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
    print("\n✅ 完了！")
    print("\n以下の順番で確認してください：")
    print("\n1. X軸範囲テスト（どの範囲が口に相当するか）：")
    print("   - X_Center_Narrow/Small/Medium/Wide")
    print("\n2. グリッドテスト（高さの確認）：")
    print("   - Grid_UpperLip/LowerLip/MouthCenter")
    print("\n3. 口を開くテスト（異なるX範囲）：")
    print("   - Mouth_Open_X15/X20/X25/X30")
    print("\n正しく口が動くシェイプキーを教えてください。")