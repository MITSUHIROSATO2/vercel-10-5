"""
正しい口の位置のシェイプキーを検証
"""
import bpy

obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj and obj.data.shape_keys:
    print("=== 正しい口のシェイプキー検証 ===\n")
    
    mesh = obj.data
    basis = mesh.shape_keys.key_blocks['Basis']
    
    # 新しいキーをテスト
    correct_keys = ['Mouth_Open_Correct', 'A_Correct', 'I_Correct', 'U_Correct', 
                   'E_Correct', 'O_Correct', 'Smile_Correct']
    
    for key_name in correct_keys:
        key = mesh.shape_keys.key_blocks.get(key_name)
        if key:
            # 変化している頂点の位置を確認
            changed_positions = []
            
            for i in range(len(mesh.vertices)):
                disp = (key.data[i].co - basis.data[i].co).length
                if disp > 0.001:
                    changed_positions.append(basis.data[i].co)
            
            if changed_positions:
                # 変化している領域の範囲を計算
                z_coords = [p.z for p in changed_positions]
                y_coords = [p.y for p in changed_positions]
                x_coords = [p.x for p in changed_positions]
                
                print(f"【{key_name}】")
                print(f"  変化した頂点数: {len(changed_positions)}")
                print(f"  Z座標範囲: {min(z_coords):.2f} 〜 {max(z_coords):.2f}")
                print(f"  Y座標範囲: {min(y_coords):.2f} 〜 {max(y_coords):.2f}")
                print(f"  X座標範囲: {min(x_coords):.2f} 〜 {max(x_coords):.2f}")
                
                # 部位判定
                avg_z = sum(z_coords) / len(z_coords)
                if -0.30 <= avg_z <= 0.00:
                    print(f"  → ✅ 正しく口の位置で動作しています")
                else:
                    print(f"  → ⚠️ 口以外の位置が動いています")
                print()
    
    print("\n確認完了！")
    print("Blenderでこれらのシェイプキーを確認してください：")
    print("- Mouth_Open_Correct")
    print("- A_Correct, I_Correct, U_Correct, E_Correct, O_Correct")
    print("- Smile_Correct")