"""
Z軸を調整して口の位置を特定
X範囲: ±0.15
Y範囲: Y < -0.5
"""
import bpy

obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj:
    mesh = obj.data
    vertices = mesh.vertices
    
    print("=== Z軸（上下）を調整して口の位置を特定 ===")
    print("固定パラメータ：")
    print("- X範囲: ±0.15")
    print("- Y範囲: Y < -0.5\n")
    
    # 既存のシェイプキーを削除
    if mesh.shape_keys:
        keys_to_remove = []
        for key in mesh.shape_keys.key_blocks:
            if key.name != 'Basis':
                keys_to_remove.append(key.name)
        
        for key_name in keys_to_remove:
            obj.active_shape_key_index = mesh.shape_keys.key_blocks.find(key_name)
            bpy.ops.object.shape_key_remove()
    
    basis = mesh.shape_keys.key_blocks['Basis']
    
    # Z軸の範囲を細かく調整
    print("Z軸の異なる範囲でテスト：\n")
    
    z_tests = [
        {
            'name': 'Z_High',
            'z_min': 0.0,
            'z_max': 0.2,
            'desc': '高い位置（0.0 < Z < 0.2）'
        },
        {
            'name': 'Z_Upper',
            'z_min': -0.1,
            'z_max': 0.0,
            'desc': '上部（-0.1 < Z < 0.0）'
        },
        {
            'name': 'Z_Middle_High',
            'z_min': -0.15,
            'z_max': -0.05,
            'desc': '中上部（-0.15 < Z < -0.05）'
        },
        {
            'name': 'Z_Middle',
            'z_min': -0.2,
            'z_max': -0.1,
            'desc': '中央（-0.2 < Z < -0.1）'
        },
        {
            'name': 'Z_Middle_Low',
            'z_min': -0.25,
            'z_max': -0.15,
            'desc': '中下部（-0.25 < Z < -0.15）'
        },
        {
            'name': 'Z_Lower',
            'z_min': -0.3,
            'z_max': -0.2,
            'desc': '下部（-0.3 < Z < -0.2）'
        },
        {
            'name': 'Z_Bottom',
            'z_min': -0.35,
            'z_max': -0.25,
            'desc': '最下部（-0.35 < Z < -0.25）'
        },
        {
            'name': 'Z_Very_Low',
            'z_min': -0.4,
            'z_max': -0.3,
            'desc': 'かなり低い（-0.4 < Z < -0.3）'
        }
    ]
    
    for test in z_tests:
        obj.shape_key_add(name=test['name'], from_mix=False)
        shape_key = mesh.shape_keys.key_blocks[test['name']]
        
        count = 0
        for i, v in enumerate(vertices):
            co = basis.data[i].co
            shape_key.data[i].co = co.copy()
            
            # 条件：Y < -0.5、X±0.15、指定のZ範囲
            if (co.y < -0.5 and
                abs(co.x) < 0.15 and
                test['z_min'] < co.z < test['z_max']):
                
                # 前に少し出す
                shape_key.data[i].co.y -= 0.05
                count += 1
        
        print(f"{test['name']}: {count}頂点 - {test['desc']}")
    
    # より詳細なZ軸テスト（0.05刻み）
    print("\n\n詳細なZ軸位置テスト（0.05刻み）：\n")
    
    for z_center in [0.1, 0.05, 0.0, -0.05, -0.1, -0.15, -0.2, -0.25, -0.3]:
        name = f'Z_Exact_{abs(z_center)*100:.0f}{"N" if z_center < 0 else "P"}'
        obj.shape_key_add(name=name, from_mix=False)
        shape_key = mesh.shape_keys.key_blocks[name]
        
        count = 0
        for i, v in enumerate(vertices):
            co = basis.data[i].co
            shape_key.data[i].co = co.copy()
            
            # 特定のZ値付近（±0.025の範囲）
            if (co.y < -0.5 and
                abs(co.x) < 0.15 and
                z_center - 0.025 < co.z < z_center + 0.025):
                
                shape_key.data[i].co.y -= 0.05
                shape_key.data[i].co.z -= 0.03
                count += 1
        
        print(f"{name}: {count}頂点 - Z≈{z_center:.2f}")
    
    # 口の動きテスト（異なるZ範囲）
    print("\n\n口の動きテスト（Z軸調整版）：")
    
    mouth_z_tests = [
        ('Mouth_Z_Upper', -0.15, -0.05, '上唇領域'),
        ('Mouth_Z_Middle', -0.2, -0.15, '口の中央'),
        ('Mouth_Z_Lower', -0.25, -0.2, '下唇領域'),
        ('Mouth_Z_Wide', -0.3, -0.05, '口全体（広め）'),
        ('Mouth_Z_Narrow', -0.2, -0.1, '口中心（狭め）')
    ]
    
    for name, z_min, z_max, desc in mouth_z_tests:
        obj.shape_key_add(name=name, from_mix=False)
        shape_key = mesh.shape_keys.key_blocks[name]
        
        count = 0
        for i, v in enumerate(vertices):
            co = basis.data[i].co
            shape_key.data[i].co = co.copy()
            
            if (co.y < -0.5 and
                abs(co.x) < 0.15 and
                z_min < co.z < z_max):
                
                # 口を開く動き
                relative_z = (co.z - z_min) / (z_max - z_min)
                if relative_z < 0.3:  # 下部
                    shape_key.data[i].co.z -= 0.08
                elif relative_z < 0.7:  # 中部
                    shape_key.data[i].co.z -= 0.05
                else:  # 上部
                    shape_key.data[i].co.z -= 0.02
                count += 1
        
        print(f"{name}: {count}頂点 - {desc}")
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
    print("\n✅ 完了！")
    print("\n以下の順番で確認してください：")
    print("\n1. Z軸範囲テスト：")
    print("   - Z_High 〜 Z_Very_Low")
    print("\n2. 詳細な位置（0.05刻み）：")
    print("   - Z_Exact_10P 〜 Z_Exact_30N")
    print("\n3. 口の動きテスト：")
    print("   - Mouth_Z_Upper/Middle/Lower/Wide/Narrow")
    print("\nどのZ座標範囲が実際の口の位置か教えてください。")