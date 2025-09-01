"""
シェイプキーの問題を診断
"""
import bpy

face_obj = bpy.data.objects.get('HighQualityFaceAvatar')

if face_obj:
    print("=== シェイプキー診断 ===\n")
    
    # メッシュデータの確認
    mesh = face_obj.data
    print(f"オブジェクト名: {face_obj.name}")
    print(f"メッシュ名: {mesh.name}")
    print(f"頂点数: {len(mesh.vertices)}")
    
    # シェイプキーの存在確認
    if mesh.shape_keys:
        print(f"\nシェイプキーデータ: 存在")
        print(f"シェイプキー数: {len(mesh.shape_keys.key_blocks)}")
        
        # 各シェイプキーの状態を確認
        print("\n各シェイプキーの状態:")
        for i, key in enumerate(mesh.shape_keys.key_blocks):
            print(f"\n{i}. {key.name}")
            print(f"   現在の値: {key.value}")
            print(f"   最小値: {key.slider_min}")
            print(f"   最大値: {key.slider_max}")
            print(f"   ミュート: {key.mute}")
            
            # 頂点位置の差を確認（最初の5頂点のみ）
            if i > 0:  # Basis以外
                basis = mesh.shape_keys.key_blocks[0]
                diff_count = 0
                for j in range(min(5, len(mesh.vertices))):
                    diff = (key.data[j].co - basis.data[j].co).length
                    if diff > 0.001:
                        diff_count += 1
                        print(f"   頂点{j}: 差分 {diff:.4f}")
                
                if diff_count == 0:
                    print(f"   ⚠️ 最初の5頂点に変化なし")
                    
        # アクティブなシェイプキーインデックス
        print(f"\nアクティブシェイプキー: {face_obj.active_shape_key_index}")
        
        # relative_keyの確認
        for key in mesh.shape_keys.key_blocks:
            if key.relative_key:
                print(f"\n{key.name} の relative_key: {key.relative_key.name}")
            else:
                print(f"\n{key.name} の relative_key: None")
                
    else:
        print(f"\nシェイプキーデータ: なし")
        
    # モディファイアの確認
    print("\n\nモディファイア:")
    for mod in face_obj.modifiers:
        print(f"  - {mod.name} ({mod.type})")
        
else:
    print("HighQualityFaceAvatar オブジェクトが見つかりません")