"""
顔モデルの視覚的構造を詳細に分析
"""
import bpy
import math

print('\n' + '='*80)
print('🔍 顔モデル構造の詳細分析レポート')
print('='*80)

# すべてのオブジェクトをリスト
print('\n📋 シーン内の全オブジェクト:')
for i, obj in enumerate(bpy.data.objects):
    print(f'  {i+1}. {obj.name} ({obj.type})')

# メインの顔モデルを分析
face_obj = bpy.data.objects.get('HighQualityFaceAvatar')
if face_obj:
    print(f'\n👤 メイン顔モデル: {face_obj.name}')
    print(f'  ├─ メッシュ統計:')
    print(f'  │  ├─ 頂点数: {len(face_obj.data.vertices):,}')
    print(f'  │  ├─ エッジ数: {len(face_obj.data.edges):,}')
    print(f'  │  └─ 面数: {len(face_obj.data.polygons):,}')
    
    # 頂点位置から顔の各部位を推定
    vertices = [face_obj.matrix_world @ v.co for v in face_obj.data.vertices]
    
    # Z座標でグループ分け（高さ別）
    z_coords = [v.z for v in vertices]
    z_min, z_max = min(z_coords), max(z_coords)
    z_range = z_max - z_min
    
    print(f'  │')
    print(f'  ├─ 顔の領域分析（高さ別）:')
    print(f'  │  ├─ 頭頂部 (Z > {z_min + 0.7*z_range:.2f}): 約{sum(1 for z in z_coords if z > z_min + 0.7*z_range):,}頂点')
    print(f'  │  ├─ 目・鼻領域 (Z: {z_min + 0.4*z_range:.2f}～{z_min + 0.7*z_range:.2f}): 約{sum(1 for z in z_coords if z_min + 0.4*z_range <= z <= z_min + 0.7*z_range):,}頂点')
    print(f'  │  ├─ 口領域 (Z: {z_min + 0.2*z_range:.2f}～{z_min + 0.4*z_range:.2f}): 約{sum(1 for z in z_coords if z_min + 0.2*z_range <= z <= z_min + 0.4*z_range):,}頂点')
    print(f'  │  └─ 顎領域 (Z < {z_min + 0.2*z_range:.2f}): 約{sum(1 for z in z_coords if z < z_min + 0.2*z_range):,}頂点')

# 口腔内パーツの相対位置分析
print(f'\n🦷 口腔内パーツの配置:')
oral_parts = {
    'UpperTeeth': '上顎歯列',
    'LowerTeeth': '下顎歯列', 
    'Tongue': '舌'
}

for eng_name, jp_name in oral_parts.items():
    obj = bpy.data.objects.get(eng_name)
    if obj:
        print(f'\n  《{jp_name}》 ({eng_name}):')
        print(f'    位置: X={obj.location.x:.3f}, Y={obj.location.y:.3f}, Z={obj.location.z:.3f}')
        print(f'    スケール: {obj.scale.x:.1f}x{obj.scale.y:.1f}x{obj.scale.z:.1f}')
        
        # 親子関係
        if obj.parent:
            print(f'    親オブジェクト: {obj.parent.name}')
        
        # メッシュの複雑さ
        if obj.type == 'MESH':
            complexity = len(obj.data.polygons)
            if complexity < 100:
                detail = "低ポリゴン"
            elif complexity < 1000:
                detail = "中ポリゴン"
            else:
                detail = "高ポリゴン"
            print(f'    メッシュ詳細度: {detail} ({complexity}面)')

# シェイプキーの機能別分類
if face_obj and face_obj.data.shape_keys:
    print(f'\n🎭 表情・発音制御システム:')
    keys = face_obj.data.shape_keys.key_blocks[1:]  # Basis以外
    
    # 機能別に分類
    categories = {
        '基本母音': ['Viseme_A', 'Viseme_E', 'Viseme_I', 'Viseme_O', 'Viseme_U'],
        '子音': ['Viseme_M', 'Viseme_F', 'Viseme_S', 'Viseme_T', 'Viseme_L', 'Viseme_R', 'Viseme_TH'],
        '表情': ['Mouth_Smile', 'Mouth_Frown', 'Mouth_Surprise', 'Mouth_Angry'],
        '口の動き': ['Mouth_Open', 'Mouth_Closed', 'Mouth_Pucker', 'Mouth_Wide'],
        '日本語母音': ['JP_A', 'JP_I', 'JP_U', 'JP_E', 'JP_O'],
        '日本語子音': ['JP_K', 'JP_S', 'JP_T', 'JP_N', 'JP_H', 'JP_M', 'JP_Y', 'JP_R', 'JP_W'],
        '日本語特殊音': ['JP_Sokuon', 'JP_Hatsuon', 'JP_Long'],
        '日本語拗音': ['JP_Kya', 'JP_Sha', 'JP_Cha', 'JP_Nya', 'JP_Hya', 'JP_Mya', 'JP_Rya']
    }
    
    for category, key_names in categories.items():
        available = [k for k in key_names if any(key.name == k for key in keys)]
        if available:
            print(f'\n  【{category}】')
            for key_name in available:
                print(f'    ✓ {key_name}')

# マテリアル分析
print(f'\n🎨 マテリアル設定:')
materials = {
    'Material_0.010': '顔の肌',
    'TeethMaterial': '歯',
    'TongueMaterial': '舌'
}

for mat_name, description in materials.items():
    mat = bpy.data.materials.get(mat_name)
    if mat:
        print(f'\n  {description} ({mat_name}):')
        if mat.use_nodes:
            for node in mat.node_tree.nodes:
                if node.type == 'BSDF_PRINCIPLED':
                    color = node.inputs['Base Color'].default_value
                    roughness = node.inputs['Roughness'].default_value
                    print(f'    色: RGB({color[0]:.2f}, {color[1]:.2f}, {color[2]:.2f})')
                    print(f'    粗さ: {roughness:.2f}')

print('\n' + '='*80)
print('✅ 分析完了')
print('='*80)