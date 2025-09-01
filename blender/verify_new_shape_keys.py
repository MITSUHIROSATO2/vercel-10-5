"""
新しく作成したシェイプキーの検証
"""
import bpy

obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj and obj.data.shape_keys:
    print("=== 新しいシェイプキーの検証 ===\n")
    
    mesh = obj.data
    basis = mesh.shape_keys.key_blocks['Basis']
    
    # 新しく作成したキーをテスト
    new_keys = ['Test_SimpleMove', 'Mouth_Open_V2', 'A_Simple', 'I_Simple', 'U_Simple', 'E_Simple', 'O_Simple']
    
    for key_name in new_keys:
        key = mesh.shape_keys.key_blocks.get(key_name)
        if key:
            # 変化している頂点を数える
            changed = 0
            max_disp = 0
            sample_changes = []
            
            for i in range(len(mesh.vertices)):
                disp = (key.data[i].co - basis.data[i].co).length
                if disp > 0.001:
                    changed += 1
                    max_disp = max(max_disp, disp)
                    if len(sample_changes) < 3:
                        sample_changes.append((i, disp, mesh.vertices[i].co))
            
            print(f"【{key_name}】")
            print(f"  変化した頂点: {changed:,} / {len(mesh.vertices):,} ({changed/len(mesh.vertices)*100:.1f}%)")
            print(f"  最大変位: {max_disp:.3f}")
            
            if sample_changes:
                print("  サンプル変化:")
                for idx, disp, pos in sample_changes:
                    print(f"    頂点{idx}: 変位{disp:.3f} (位置: {pos.z:.2f})")
            else:
                print("  ⚠️ 変化なし")
            
            print()
    
    print("\n既存のシェイプキーも確認:")
    existing_keys = ['Mouth_Open', 'Viseme_A']
    
    for key_name in existing_keys:
        key = mesh.shape_keys.key_blocks.get(key_name)
        if key:
            changed = sum(1 for i in range(len(mesh.vertices)) 
                         if (key.data[i].co - basis.data[i].co).length > 0.001)
            print(f"{key_name}: {changed:,} 頂点が変化")
    
    print("\n✅ 検証完了")
    print("\nBlenderでの確認手順:")
    print("1. HighQualityFaceAvatarを選択")
    print("2. プロパティパネル > メッシュデータ > シェイプキー")
    print("3. 特に 'Test_SimpleMove' のスライダーを動かしてみてください")
    print("   （これは編集モードで作成したので確実に動作します）")