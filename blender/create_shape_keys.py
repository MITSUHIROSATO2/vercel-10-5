"""
シェイプキーに実際の変形データを作成するスクリプト
"""
import bpy
import math

def get_face_regions(mesh):
    """顔の各領域の頂点インデックスを取得"""
    vertices = mesh.vertices
    
    # Z座標で領域を分類
    z_coords = [v.co.z for v in vertices]
    z_min, z_max = min(z_coords), max(z_coords)
    z_range = z_max - z_min
    
    regions = {
        'mouth': [],
        'jaw': [],
        'cheek': [],
        'nose': [],
        'eye': [],
        'forehead': []
    }
    
    for i, v in enumerate(vertices):
        x, y, z = v.co.x, v.co.y, v.co.z
        
        # 口周辺（下部前方）
        if z < z_min + 0.35 * z_range and y > -0.5:
            if abs(x) < 0.6:  # 中央付近
                regions['mouth'].append(i)
            
        # 顎（最下部）
        if z < z_min + 0.2 * z_range:
            regions['jaw'].append(i)
            
        # 頬（中部側面）
        if z_min + 0.2 * z_range < z < z_min + 0.6 * z_range and abs(x) > 0.5:
            regions['cheek'].append(i)
            
        # 鼻周辺（中部前方）
        if z_min + 0.4 * z_range < z < z_min + 0.6 * z_range and abs(x) < 0.3 and y > 0:
            regions['nose'].append(i)
            
        # 目周辺（上部）
        if z_min + 0.55 * z_range < z < z_min + 0.75 * z_range and abs(x) < 0.8:
            regions['eye'].append(i)
            
        # 額（最上部）
        if z > z_min + 0.7 * z_range:
            regions['forehead'].append(i)
    
    return regions

def create_mouth_open(mesh, shape_key, regions):
    """口を開けるシェイプキー"""
    basis = mesh.shape_keys.key_blocks['Basis']
    
    for i in regions['mouth']:
        v = basis.data[i].co
        # 口の下部を下げる
        if v.z < -0.8:
            shape_key.data[i].co.z = v.z - 0.15
            # 少し後ろに引く
            shape_key.data[i].co.y = v.y - 0.05
    
    # 顎も少し下げる
    for i in regions['jaw']:
        v = basis.data[i].co
        shape_key.data[i].co.z = v.z - 0.08

def create_viseme_a(mesh, shape_key, regions):
    """「あ」の口形"""
    basis = mesh.shape_keys.key_blocks['Basis']
    
    for i in regions['mouth']:
        v = basis.data[i].co
        # 口を縦に開く
        if v.z < -0.5:
            shape_key.data[i].co.z = v.z - 0.1
        # 横幅を少し狭める
        shape_key.data[i].co.x = v.x * 0.95

def create_viseme_i(mesh, shape_key, regions):
    """「い」の口形"""
    basis = mesh.shape_keys.key_blocks['Basis']
    
    for i in regions['mouth']:
        v = basis.data[i].co
        # 横に引く
        shape_key.data[i].co.x = v.x * 1.2
        # 縦を狭める
        if abs(v.z + 0.8) < 0.2:
            shape_key.data[i].co.z = v.z * 0.95

def create_viseme_u(mesh, shape_key, regions):
    """「う」の口形"""
    basis = mesh.shape_keys.key_blocks['Basis']
    
    for i in regions['mouth']:
        v = basis.data[i].co
        # 口をすぼめる
        shape_key.data[i].co.x = v.x * 0.7
        # 前に突き出す
        shape_key.data[i].co.y = v.y + 0.05

def create_viseme_e(mesh, shape_key, regions):
    """「え」の口形"""
    basis = mesh.shape_keys.key_blocks['Basis']
    
    for i in regions['mouth']:
        v = basis.data[i].co
        # 横に少し引く
        shape_key.data[i].co.x = v.x * 1.1
        # 少し開く
        if v.z < -0.7:
            shape_key.data[i].co.z = v.z - 0.05

def create_viseme_o(mesh, shape_key, regions):
    """「お」の口形"""
    basis = mesh.shape_keys.key_blocks['Basis']
    
    for i in regions['mouth']:
        v = basis.data[i].co
        # 丸める
        shape_key.data[i].co.x = v.x * 0.85
        # 縦に開く
        if v.z < -0.6:
            shape_key.data[i].co.z = v.z - 0.08
        # 少し前に
        shape_key.data[i].co.y = v.y + 0.03

def create_smile(mesh, shape_key, regions):
    """笑顔"""
    basis = mesh.shape_keys.key_blocks['Basis']
    
    # 口角を上げる
    for i in regions['mouth']:
        v = basis.data[i].co
        if abs(v.x) > 0.3:  # 口の端
            shape_key.data[i].co.z = v.z + 0.05
            shape_key.data[i].co.x = v.x * 1.05
    
    # 頬を少し上げる
    for i in regions['cheek']:
        v = basis.data[i].co
        if v.z < 0:
            shape_key.data[i].co.z = v.z + 0.02

def create_frown(mesh, shape_key, regions):
    """しかめ面"""
    basis = mesh.shape_keys.key_blocks['Basis']
    
    # 口角を下げる
    for i in regions['mouth']:
        v = basis.data[i].co
        if abs(v.x) > 0.3:  # 口の端
            shape_key.data[i].co.z = v.z - 0.03

def create_surprise(mesh, shape_key, regions):
    """驚き"""
    basis = mesh.shape_keys.key_blocks['Basis']
    
    # 口を大きく開く
    for i in regions['mouth']:
        v = basis.data[i].co
        if v.z < -0.5:
            shape_key.data[i].co.z = v.z - 0.12
        # 丸くする
        shape_key.data[i].co.x = v.x * 0.9
    
    # 眉を上げる（額を少し上げる）
    for i in regions['forehead']:
        v = basis.data[i].co
        shape_key.data[i].co.z = v.z + 0.03

# メイン処理
face_obj = bpy.data.objects.get('HighQualityFaceAvatar')

if face_obj and face_obj.data.shape_keys:
    mesh = face_obj.data
    regions = get_face_regions(mesh)
    
    print(f"顔の領域分析:")
    print(f"  口周辺: {len(regions['mouth'])}頂点")
    print(f"  顎: {len(regions['jaw'])}頂点")
    print(f"  頬: {len(regions['cheek'])}頂点")
    print(f"  鼻: {len(regions['nose'])}頂点")
    print(f"  目: {len(regions['eye'])}頂点")
    print(f"  額: {len(regions['forehead'])}頂点")
    
    # シェイプキーに変形を適用
    shape_functions = {
        'Mouth_Open': create_mouth_open,
        'Viseme_A': create_viseme_a,
        'Viseme_I': create_viseme_i,
        'Viseme_U': create_viseme_u,
        'Viseme_E': create_viseme_e,
        'Viseme_O': create_viseme_o,
        'JP_A': create_viseme_a,  # 日本語の「あ」も同じ
        'JP_I': create_viseme_i,
        'JP_U': create_viseme_u,
        'JP_E': create_viseme_e,
        'JP_O': create_viseme_o,
        'Mouth_Smile': create_smile,
        'Mouth_Frown': create_frown,
        'Mouth_Surprise': create_surprise
    }
    
    print("\nシェイプキーの作成:")
    for key_name, func in shape_functions.items():
        shape_key = mesh.shape_keys.key_blocks.get(key_name)
        if shape_key:
            # まず基準位置をコピー
            basis = mesh.shape_keys.key_blocks['Basis']
            for i in range(len(mesh.vertices)):
                shape_key.data[i].co = basis.data[i].co.copy()
            
            # 変形を適用
            func(mesh, shape_key, regions)
            print(f"  ✓ {key_name}")
    
    # ファイルを保存
    print("\n変更を保存中...")
    bpy.ops.wm.save_mainfile()
    print("✅ 完了！")
    
else:
    print("エラー: 顔オブジェクトまたはシェイプキーが見つかりません")