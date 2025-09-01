"""
修正したシェイプキーのテスト
"""
import bpy

face_obj = bpy.data.objects.get('HighQualityFaceAvatar')

if face_obj and face_obj.data.shape_keys:
    print("=== シェイプキー動作確認 ===\n")
    
    mesh = face_obj.data
    basis = mesh.shape_keys.key_blocks['Basis']
    
    # テストするシェイプキー
    test_keys = ['Viseme_A', 'Viseme_I', 'Viseme_U', 'JP_A', 'Mouth_Smile', 'Mouth_Open']
    
    for key_name in test_keys:
        shape_key = mesh.shape_keys.key_blocks.get(key_name)
        if shape_key:
            # 変化している頂点を数える
            changed_vertices = 0
            max_displacement = 0
            
            for i in range(len(mesh.vertices)):
                displacement = (shape_key.data[i].co - basis.data[i].co).length
                if displacement > 0.001:
                    changed_vertices += 1
                    max_displacement = max(max_displacement, displacement)
            
            print(f"{key_name}:")
            print(f"  変化した頂点: {changed_vertices:,} / {len(mesh.vertices):,} ({changed_vertices/len(mesh.vertices)*100:.1f}%)")
            print(f"  最大変位: {max_displacement:.3f}")
            
            # テスト：値を変更して視覚的に確認できるようにする
            original_value = shape_key.value
            shape_key.value = 1.0
            
            # いくつかの頂点の変化を詳細に表示
            print("  サンプル頂点の変化:")
            sample_indices = [100, 500, 1000, 5000, 10000]
            for idx in sample_indices:
                if idx < len(mesh.vertices):
                    basis_pos = basis.data[idx].co
                    shape_pos = shape_key.data[idx].co
                    diff = (shape_pos - basis_pos).length
                    if diff > 0.001:
                        print(f"    頂点{idx}: 変位 {diff:.3f}")
            
            # 値を元に戻す
            shape_key.value = original_value
            print()
    
    print("\n✅ テスト完了")
    print("Blenderで各シェイプキーのスライダーを動かして視覚的に確認してください。")
    
else:
    print("エラー: オブジェクトが見つかりません")