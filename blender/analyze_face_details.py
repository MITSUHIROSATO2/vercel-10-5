"""
無題.blendファイルの顔の詳細構造を分析
"""
import bpy
import math

print('\n' + '='*60)
print('顔モデルの詳細分析')
print('='*60)

# メインアバターを取得
main_avatar = None
for obj in bpy.data.objects:
    if obj.name == "HighQualityFaceAvatar":
        main_avatar = obj
        break

if main_avatar:
    print(f'\n【メインアバター】: {main_avatar.name}')
    print(f'  総頂点数: {len(main_avatar.data.vertices):,}')
    print(f'  総ポリゴン数: {len(main_avatar.data.polygons):,}')
    
    # バウンディングボックスから顔のサイズを推定
    bbox_corners = [main_avatar.matrix_world @ v.co for v in main_avatar.data.vertices]
    if bbox_corners:
        min_x = min(v.x for v in bbox_corners)
        max_x = max(v.x for v in bbox_corners)
        min_y = min(v.y for v in bbox_corners)
        max_y = max(v.y for v in bbox_corners)
        min_z = min(v.z for v in bbox_corners)
        max_z = max(v.z for v in bbox_corners)
        
        print(f'\n  顔のサイズ:')
        print(f'    幅（X軸）: {max_x - min_x:.2f}')
        print(f'    奥行（Y軸）: {max_y - min_y:.2f}')
        print(f'    高さ（Z軸）: {max_z - min_z:.2f}')
    
    # マテリアル詳細
    print(f'\n  使用マテリアル:')
    for mat_slot in main_avatar.material_slots:
        if mat_slot.material:
            mat = mat_slot.material
            print(f'    - {mat.name}')
            if mat.use_nodes:
                for node in mat.node_tree.nodes:
                    if node.type == 'BSDF_PRINCIPLED':
                        base_color = node.inputs['Base Color'].default_value
                        print(f'      基本色: R={base_color[0]:.2f}, G={base_color[1]:.2f}, B={base_color[2]:.2f}')
    
    # シェイプキーの詳細分析
    if main_avatar.data.shape_keys:
        print(f'\n  シェイプキー分析:')
        shape_keys = main_avatar.data.shape_keys.key_blocks
        
        # カテゴリ別に分類
        visemes = [k for k in shape_keys if k.name.startswith('Viseme_')]
        mouth = [k for k in shape_keys if k.name.startswith('Mouth_')]
        japanese = [k for k in shape_keys if k.name.startswith('JP_')]
        
        print(f'    英語音素（Viseme）: {len(visemes)}個')
        for v in visemes:
            print(f'      - {v.name}')
            
        print(f'\n    口の表情: {len(mouth)}個')
        for m in mouth:
            print(f'      - {m.name}')
            
        print(f'\n    日本語音素: {len(japanese)}個')
        # 日本語音素を種類別に整理
        vowels = [k for k in japanese if k.name in ['JP_A', 'JP_I', 'JP_U', 'JP_E', 'JP_O']]
        consonants = [k for k in japanese if k.name not in vowels and not k.name.endswith('on') and not k.name.endswith('ya')]
        special = [k for k in japanese if k.name.endswith('on') or k.name.endswith('ya')]
        
        print(f'      母音: {", ".join([k.name for k in vowels])}')
        print(f'      子音: {", ".join([k.name for k in consonants])}')
        print(f'      特殊音: {", ".join([k.name for k in special])}')

# 口腔内パーツの詳細
print(f'\n【口腔内パーツ】')
oral_parts = ['UpperTeeth', 'LowerTeeth', 'Tongue']
for part_name in oral_parts:
    part = bpy.data.objects.get(part_name)
    if part:
        print(f'\n  {part_name}:')
        print(f'    位置: X={part.location.x:.2f}, Y={part.location.y:.2f}, Z={part.location.z:.2f}')
        print(f'    スケール: X={part.scale.x:.2f}, Y={part.scale.y:.2f}, Z={part.scale.z:.2f}')
        print(f'    頂点数: {len(part.data.vertices)}')
        
        # マテリアル
        if part.material_slots:
            for mat_slot in part.material_slots:
                if mat_slot.material:
                    print(f'    マテリアル: {mat_slot.material.name}')

# アバターの比較
print(f'\n【2つのアバターの比較】')
avatar1 = bpy.data.objects.get('HighQualityFaceAvatar')
avatar2 = bpy.data.objects.get('HighQualityFaceAvatar.001')

if avatar1 and avatar2:
    print(f'  HighQualityFaceAvatar: 頂点数 {len(avatar1.data.vertices):,}')
    print(f'  HighQualityFaceAvatar.001: 頂点数 {len(avatar2.data.vertices):,}')
    
    # シェイプキーの違いを確認
    if avatar2.data.shape_keys:
        for key in avatar2.data.shape_keys.key_blocks:
            if key.value > 0:
                print(f'  ⚠️ HighQualityFaceAvatar.001 で "{key.name}" が値 {key.value} に設定されています')

print('\n' + '='*60)