"""
すべてのシェイプキーを削除して、口の位置を確認
"""
import bpy

obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj:
    mesh = obj.data
    
    print("=== シェイプキーのリセットと口の位置確認 ===\n")
    
    # 1. Basis以外のすべてのシェイプキーを削除
    if mesh.shape_keys:
        print("既存のシェイプキーを削除中...")
        keys_to_remove = []
        
        for key in mesh.shape_keys.key_blocks:
            if key.name != 'Basis':
                keys_to_remove.append(key.name)
        
        for key_name in keys_to_remove:
            obj.active_shape_key_index = mesh.shape_keys.key_blocks.find(key_name)
            bpy.ops.object.shape_key_remove()
        
        print(f"{len(keys_to_remove)}個のシェイプキーを削除しました\n")
    
    # 2. 口の位置を段階的に探す
    print("口の位置を探索するためのテストシェイプキーを作成...\n")
    
    basis = mesh.shape_keys.key_blocks['Basis']
    vertices = mesh.vertices
    
    # 顔の各部分でテスト
    test_regions = [
        {
            'name': 'Test_Forehead',
            'condition': lambda co: co.y < -0.4 and co.z > 0.4,
            'desc': '額の領域（Y<-0.4, Z>0.4）'
        },
        {
            'name': 'Test_Eyes',
            'condition': lambda co: co.y < -0.4 and 0.1 < co.z < 0.4,
            'desc': '目の領域（Y<-0.4, 0.1<Z<0.4）'
        },
        {
            'name': 'Test_Nose',
            'condition': lambda co: co.y < -0.4 and -0.1 < co.z < 0.1,
            'desc': '鼻の領域（Y<-0.4, -0.1<Z<0.1）'
        },
        {
            'name': 'Test_Mouth_Upper',
            'condition': lambda co: co.y < -0.4 and -0.2 < co.z < -0.1,
            'desc': '口の上部（Y<-0.4, -0.2<Z<-0.1）'
        },
        {
            'name': 'Test_Mouth_Lower',
            'condition': lambda co: co.y < -0.4 and -0.3 < co.z < -0.2,
            'desc': '口の下部（Y<-0.4, -0.3<Z<-0.2）'
        },
        {
            'name': 'Test_Chin',
            'condition': lambda co: co.y < -0.4 and -0.4 < co.z < -0.3,
            'desc': '顎（Y<-0.4, -0.4<Z<-0.3）'
        },
        {
            'name': 'Test_Neck',
            'condition': lambda co: co.y < -0.4 and co.z < -0.4,
            'desc': '首（Y<-0.4, Z<-0.4）'
        }
    ]
    
    for test in test_regions:
        obj.shape_key_add(name=test['name'], from_mix=False)
        shape_key = mesh.shape_keys.key_blocks[test['name']]
        
        count = 0
        for i, v in enumerate(vertices):
            co = basis.data[i].co
            shape_key.data[i].co = co.copy()
            
            # 中央付近のみ
            if abs(co.x) < 0.35 and test['condition'](co):
                # 少し前に出す
                shape_key.data[i].co.y -= 0.05
                count += 1
        
        print(f"{test['name']}: {count}頂点 - {test['desc']}")
    
    # 3. 視覚的に分かりやすい色分けテスト
    print("\n\n追加の位置確認テスト...")
    
    # Y軸の値でテスト（前後の確認）
    y_tests = [
        ('Test_Y_Front', lambda co: co.y < -0.5, 'Y < -0.5（最前面）'),
        ('Test_Y_Middle', lambda co: -0.5 < co.y < 0, '-0.5 < Y < 0（中間）'),
        ('Test_Y_Back', lambda co: co.y > 0, 'Y > 0（後方）')
    ]
    
    for name, condition, desc in y_tests:
        obj.shape_key_add(name=name, from_mix=False)
        shape_key = mesh.shape_keys.key_blocks[name]
        
        count = 0
        for i, v in enumerate(vertices):
            co = basis.data[i].co
            shape_key.data[i].co = co.copy()
            
            if condition(co) and abs(co.x) < 0.3 and -0.2 < co.z < 0:
                shape_key.data[i].co.z -= 0.05
                count += 1
        
        print(f"{name}: {count}頂点 - {desc}")
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
    print("\n✅ 完了！")
    print("\n以下のテストシェイプキーを順番に確認してください：")
    print("\n【部位別テスト】")
    print("- Test_Forehead: 額")
    print("- Test_Eyes: 目")
    print("- Test_Nose: 鼻")
    print("- Test_Mouth_Upper: 口の上部")
    print("- Test_Mouth_Lower: 口の下部")
    print("- Test_Chin: 顎")
    print("- Test_Neck: 首")
    print("\n【前後確認】")
    print("- Test_Y_Front: 最前面")
    print("- Test_Y_Middle: 中間")
    print("- Test_Y_Back: 後方")
    print("\nどのシェイプキーが実際の口の位置で動いているか教えてください。")