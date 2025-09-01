"""
手動設定のため、すべてのシェイプキーを削除し、上唇・下唇の基準シェイプキーを作成
"""
import bpy

obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj:
    mesh = obj.data
    
    print("=== シェイプキーのリセットと基準作成 ===\n")
    
    # 1. すべてのシェイプキーを削除（Basis以外）
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
    
    # 2. 基準となるシェイプキーを作成
    print("基準シェイプキーを作成中...\n")
    
    basis = mesh.shape_keys.key_blocks['Basis']
    
    # 上唇の基準シェイプキー
    obj.shape_key_add(name="Upper_Lip_Reference", from_mix=False)
    upper_lip = mesh.shape_keys.key_blocks["Upper_Lip_Reference"]
    
    # すべての頂点をBasisからコピー
    for i in range(len(mesh.vertices)):
        upper_lip.data[i].co = basis.data[i].co.copy()
    
    print("✓ Upper_Lip_Reference - 上唇の基準（手動で編集してください）")
    
    # 下唇の基準シェイプキー
    obj.shape_key_add(name="Lower_Lip_Reference", from_mix=False)
    lower_lip = mesh.shape_keys.key_blocks["Lower_Lip_Reference"]
    
    # すべての頂点をBasisからコピー
    for i in range(len(mesh.vertices)):
        lower_lip.data[i].co = basis.data[i].co.copy()
    
    print("✓ Lower_Lip_Reference - 下唇の基準（手動で編集してください）")
    
    # 口全体の基準シェイプキー
    obj.shape_key_add(name="Mouth_Region_Reference", from_mix=False)
    mouth_region = mesh.shape_keys.key_blocks["Mouth_Region_Reference"]
    
    # すべての頂点をBasisからコピー
    for i in range(len(mesh.vertices)):
        mouth_region.data[i].co = basis.data[i].co.copy()
    
    print("✓ Mouth_Region_Reference - 口全体の基準（手動で編集してください）")
    
    # メッシュを更新
    mesh.update()
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
    print("\n✅ 完了！")
    print("\n作成した基準シェイプキー：")
    print("1. Upper_Lip_Reference - 上唇の基準")
    print("2. Lower_Lip_Reference - 下唇の基準")
    print("3. Mouth_Region_Reference - 口全体の基準")
    print("\n【使い方】")
    print("1. Blenderで各シェイプキーを選択")
    print("2. 編集モードに入る（Tab キー）")
    print("3. 該当する頂点を選択")
    print("4. 少し移動させて、どの頂点が唇/口なのかマーク")
    print("5. オブジェクトモードに戻る")
    print("\nこれらの基準シェイプキーで口の正確な位置を特定してください。")