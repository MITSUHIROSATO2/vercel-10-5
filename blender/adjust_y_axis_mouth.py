"""
Y軸を調整して口の位置を特定（X範囲±0.15で固定）
"""
import bpy

obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj:
    mesh = obj.data
    vertices = mesh.vertices
    
    print("=== Y軸（前後）を調整して口の位置を特定 ===")
    print("X範囲: ±0.15で固定\n")
    
    # 既存のテストシェイプキーを削除
    if mesh.shape_keys:
        keys_to_remove = []
        for key in mesh.shape_keys.key_blocks:
            if key.name.startswith('Test_') or key.name.startswith('X_') or key.name.startswith('Grid_') or key.name.startswith('Mouth_Open_X') or key.name.startswith('Y_'):
                keys_to_remove.append(key.name)
        
        for key_name in keys_to_remove:
            obj.active_shape_key_index = mesh.shape_keys.key_blocks.find(key_name)
            bpy.ops.object.shape_key_remove()
    
    basis = mesh.shape_keys.key_blocks['Basis']
    
    # Y軸の範囲を細かく調整
    print("Y軸の異なる範囲でテスト：\n")
    
    y_tests = [
        {
            'name': 'Y_Test_-0.6',
            'y_max': -0.6,
            'desc': 'Y < -0.6（最前面）'
        },
        {
            'name': 'Y_Test_-0.5',
            'y_max': -0.5,
            'desc': 'Y < -0.5'
        },
        {
            'name': 'Y_Test_-0.4',
            'y_max': -0.4,
            'desc': 'Y < -0.4'
        },
        {
            'name': 'Y_Test_-0.3',
            'y_max': -0.3,
            'desc': 'Y < -0.3'
        },
        {
            'name': 'Y_Test_-0.2',
            'y_max': -0.2,
            'desc': 'Y < -0.2'
        },
        {
            'name': 'Y_Range_-0.5_-0.3',
            'y_min': -0.5,
            'y_max': -0.3,
            'desc': '-0.5 < Y < -0.3'
        },
        {
            'name': 'Y_Range_-0.4_-0.2',
            'y_min': -0.4,
            'y_max': -0.2,
            'desc': '-0.4 < Y < -0.2'
        }
    ]
    
    for test in y_tests:
        obj.shape_key_add(name=test['name'], from_mix=False)
        shape_key = mesh.shape_keys.key_blocks[test['name']]
        
        count = 0
        for i, v in enumerate(vertices):
            co = basis.data[i].co
            shape_key.data[i].co = co.copy()
            
            # Y条件
            y_condition = False
            if 'y_min' in test:
                y_condition = test['y_min'] < co.y < test['y_max']
            else:
                y_condition = co.y < test['y_max']
            
            # 条件：指定のY範囲、口の高さ、X範囲±0.15
            if (y_condition and
                -0.25 < co.z < -0.1 and  # 口の高さ
                abs(co.x) < 0.15):  # X範囲
                
                # 口を開く動き
                if co.z < -0.15:  # 下唇
                    shape_key.data[i].co.z -= 0.06
                else:  # 上唇
                    shape_key.data[i].co.z -= 0.03
                count += 1
        
        print(f"{test['name']}: {count}頂点 - {test['desc']}")
    
    # より詳細なY軸テスト
    print("\n\n詳細なY軸位置テスト：\n")
    
    # 0.1刻みで細かくテスト
    for y_val in [-0.65, -0.55, -0.45, -0.35, -0.25]:
        name = f'Y_Exact_{abs(y_val)*100:.0f}'
        obj.shape_key_add(name=name, from_mix=False)
        shape_key = mesh.shape_keys.key_blocks[name]
        
        count = 0
        for i, v in enumerate(vertices):
            co = basis.data[i].co
            shape_key.data[i].co = co.copy()
            
            # 特定のY値付近（±0.05の範囲）
            if (y_val - 0.05 < co.y < y_val + 0.05 and
                -0.25 < co.z < -0.1 and
                abs(co.x) < 0.15):
                
                shape_key.data[i].co.z -= 0.05
                shape_key.data[i].co.y -= 0.03
                count += 1
        
        print(f"{name}: {count}頂点 - Y≈{y_val}")
    
    # 最終的な口のシェイプキーテスト
    print("\n\n口の動きテスト（Y軸調整版）：")
    
    # 異なるY範囲で口を開く動き
    mouth_tests = [
        ('Mouth_Y_Far', lambda y: y < -0.5, 'Y < -0.5'),
        ('Mouth_Y_Mid', lambda y: -0.5 < y < -0.3, '-0.5 < Y < -0.3'),
        ('Mouth_Y_Near', lambda y: -0.3 < y < -0.1, '-0.3 < Y < -0.1')
    ]
    
    for name, y_condition, desc in mouth_tests:
        obj.shape_key_add(name=name, from_mix=False)
        shape_key = mesh.shape_keys.key_blocks[name]
        
        count = 0
        for i, v in enumerate(vertices):
            co = basis.data[i].co
            shape_key.data[i].co = co.copy()
            
            if (y_condition(co.y) and
                -0.25 < co.z < -0.1 and
                abs(co.x) < 0.15):
                
                # 口を開く
                if co.z < -0.18:  # 下唇
                    shape_key.data[i].co.z -= 0.08
                    shape_key.data[i].co.y += 0.02
                elif co.z < -0.15:  # 口の中間
                    shape_key.data[i].co.z -= 0.05
                else:  # 上唇
                    shape_key.data[i].co.z -= 0.02
                count += 1
        
        print(f"{name}: {count}頂点 - {desc}")
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
    print("\n✅ 完了！")
    print("\n以下の順番で確認してください：")
    print("\n1. Y軸範囲テスト：")
    print("   - Y_Test_-0.6 〜 Y_Test_-0.2")
    print("\n2. 詳細な位置：")
    print("   - Y_Exact_65 〜 Y_Exact_25")
    print("\n3. 口の動きテスト：")
    print("   - Mouth_Y_Far/Mid/Near")
    print("\nどのY座標で口が正しく動くか教えてください。")