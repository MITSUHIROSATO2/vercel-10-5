"""
シェイプキーの動作テストと変化量の分析
"""
import bpy
import math

def calculate_vertex_displacement(mesh, shape_key):
    """シェイプキーによる頂点の移動量を計算"""
    basis = mesh.shape_keys.key_blocks['Basis']
    
    max_displacement = 0
    total_displacement = 0
    affected_vertices = 0
    
    # 各頂点の変位を計算
    displacements = []
    for i in range(len(mesh.vertices)):
        basis_co = basis.data[i].co
        shape_co = shape_key.data[i].co
        
        # 変位ベクトル
        displacement = (shape_co - basis_co).length
        displacements.append(displacement)
        
        if displacement > 0.001:  # 0.001以上動いた頂点をカウント
            affected_vertices += 1
            total_displacement += displacement
            max_displacement = max(max_displacement, displacement)
    
    return {
        'max': max_displacement,
        'average': total_displacement / affected_vertices if affected_vertices > 0 else 0,
        'affected_count': affected_vertices,
        'displacements': displacements
    }

def analyze_affected_region(mesh, displacements):
    """影響を受ける領域を分析"""
    affected_vertices = []
    for i, disp in enumerate(displacements):
        if disp > 0.001:
            affected_vertices.append(mesh.vertices[i].co)
    
    if not affected_vertices:
        return None
    
    # 影響範囲のバウンディングボックスを計算
    min_x = min(v.x for v in affected_vertices)
    max_x = max(v.x for v in affected_vertices)
    min_y = min(v.y for v in affected_vertices)
    max_y = max(v.y for v in affected_vertices)
    min_z = min(v.z for v in affected_vertices)
    max_z = max(v.z for v in affected_vertices)
    
    center_x = (min_x + max_x) / 2
    center_y = (min_y + max_y) / 2
    center_z = (min_z + max_z) / 2
    
    return {
        'center': (center_x, center_y, center_z),
        'size': (max_x - min_x, max_y - min_y, max_z - min_z),
        'bounds': {
            'min': (min_x, min_y, min_z),
            'max': (max_x, max_y, max_z)
        }
    }

# メインの顔オブジェクトを取得
face_obj = bpy.data.objects.get('HighQualityFaceAvatar')

if face_obj and face_obj.data.shape_keys:
    print('\n' + '='*80)
    print('🔬 シェイプキー動作分析レポート')
    print('='*80)
    
    mesh = face_obj.data
    shape_keys = mesh.shape_keys.key_blocks
    
    # カテゴリ別にテスト
    test_categories = {
        '基本母音': ['Viseme_A', 'Viseme_I', 'Viseme_U', 'Viseme_E', 'Viseme_O'],
        '口の動き': ['Mouth_Open', 'Mouth_Smile', 'Mouth_Frown'],
        '日本語音素': ['JP_A', 'JP_K', 'JP_S']
    }
    
    for category, test_keys in test_categories.items():
        print(f'\n【{category}のテスト】')
        print('-' * 60)
        
        for key_name in test_keys:
            shape_key = shape_keys.get(key_name)
            if shape_key:
                # シェイプキーを一時的に適用
                original_value = shape_key.value
                shape_key.value = 1.0
                
                # 変位を分析
                result = calculate_vertex_displacement(mesh, shape_key)
                region = analyze_affected_region(mesh, result['displacements'])
                
                print(f'\n📍 {key_name}:')
                print(f'   影響を受ける頂点数: {result["affected_count"]:,} / {len(mesh.vertices):,} ({result["affected_count"]/len(mesh.vertices)*100:.1f}%)')
                print(f'   最大変位量: {result["max"]:.3f}')
                print(f'   平均変位量: {result["average"]:.3f}')
                
                if region:
                    print(f'   影響領域の中心: X={region["center"][0]:.2f}, Y={region["center"][1]:.2f}, Z={region["center"][2]:.2f}')
                    print(f'   影響領域のサイズ: {region["size"][0]:.2f} x {region["size"][1]:.2f} x {region["size"][2]:.2f}')
                    
                    # 領域から顔の部位を推定
                    z_pos = region["center"][2]
                    if z_pos > 0.5:
                        area = "上部（額・目の周辺）"
                    elif z_pos > -0.5:
                        area = "中部（鼻・頬）"
                    elif z_pos > -1.5:
                        area = "下部（口・顎）"
                    else:
                        area = "最下部（首・顎下）"
                    
                    print(f'   推定される影響部位: {area}')
                
                # 値を元に戻す
                shape_key.value = original_value
    
    # 詳細な口の動きテスト
    print('\n\n【口の動きの詳細分析】')
    print('='*60)
    
    mouth_keys = ['Mouth_Open', 'Viseme_A', 'JP_A']
    for key_name in mouth_keys:
        shape_key = shape_keys.get(key_name)
        if shape_key:
            shape_key.value = 1.0
            result = calculate_vertex_displacement(mesh, shape_key)
            
            # 大きく動く頂点トップ10を特定
            vertex_displacements = [(i, d) for i, d in enumerate(result['displacements'])]
            vertex_displacements.sort(key=lambda x: x[1], reverse=True)
            
            print(f'\n🎯 {key_name} - 最も動く頂点:')
            for i, (vid, disp) in enumerate(vertex_displacements[:5]):
                v = mesh.vertices[vid]
                print(f'   {i+1}. 頂点 {vid}: 変位 {disp:.3f} (位置: {v.co.x:.2f}, {v.co.y:.2f}, {v.co.z:.2f})')
            
            shape_key.value = 0.0
    
    print('\n' + '='*80)
    print('✅ シェイプキー分析完了')
    print('='*80)
else:
    print("エラー: 顔オブジェクトまたはシェイプキーが見つかりません")