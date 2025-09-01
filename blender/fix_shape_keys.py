"""
シェイプキーを正しく更新して保存する
"""
import bpy
import math

def set_shape_key_active(obj, shape_key_name):
    """シェイプキーをアクティブにして編集可能にする"""
    shape_key_index = obj.data.shape_keys.key_blocks.find(shape_key_name)
    if shape_key_index >= 0:
        obj.active_shape_key_index = shape_key_index
        return True
    return False

# メインオブジェクトを取得
face_obj = bpy.data.objects.get('HighQualityFaceAvatar')

if face_obj and face_obj.data.shape_keys:
    mesh = face_obj.data
    
    # オブジェクトを選択してアクティブにする
    bpy.context.view_layer.objects.active = face_obj
    face_obj.select_set(True)
    
    print("シェイプキーの修正を開始...\n")
    
    # 基本的なシェイプキーを修正
    shape_key_configs = {
        'Viseme_A': {
            'description': '「あ」の口形 - 口を大きく開く',
            'changes': lambda v: {
                'z': v.z - 0.1 if v.z < -0.5 and abs(v.x) < 0.6 else v.z,
                'x': v.x * 0.95 if abs(v.x) < 0.6 and v.z < -0.3 else v.x,
                'y': v.y
            }
        },
        'JP_A': {
            'description': '日本語「あ」',
            'changes': lambda v: {
                'z': v.z - 0.1 if v.z < -0.5 and abs(v.x) < 0.6 else v.z,
                'x': v.x * 0.95 if abs(v.x) < 0.6 and v.z < -0.3 else v.x,
                'y': v.y
            }
        },
        'Viseme_I': {
            'description': '「い」の口形 - 横に引く',
            'changes': lambda v: {
                'x': v.x * 1.2 if abs(v.x) > 0.1 and v.z < -0.3 else v.x,
                'z': v.z * 0.95 if abs(v.z + 0.8) < 0.2 else v.z,
                'y': v.y
            }
        },
        'JP_I': {
            'description': '日本語「い」',
            'changes': lambda v: {
                'x': v.x * 1.2 if abs(v.x) > 0.1 and v.z < -0.3 else v.x,
                'z': v.z * 0.95 if abs(v.z + 0.8) < 0.2 else v.z,
                'y': v.y
            }
        },
        'Viseme_U': {
            'description': '「う」の口形 - すぼめる',
            'changes': lambda v: {
                'x': v.x * 0.7 if abs(v.x) < 0.6 and v.z < -0.3 else v.x,
                'y': v.y + 0.05 if v.z < -0.5 and abs(v.x) < 0.4 else v.y,
                'z': v.z
            }
        },
        'JP_U': {
            'description': '日本語「う」',
            'changes': lambda v: {
                'x': v.x * 0.7 if abs(v.x) < 0.6 and v.z < -0.3 else v.x,
                'y': v.y + 0.05 if v.z < -0.5 and abs(v.x) < 0.4 else v.y,
                'z': v.z
            }
        },
        'Mouth_Smile': {
            'description': '笑顔 - 口角を上げる',
            'changes': lambda v: {
                'x': v.x * 1.05 if abs(v.x) > 0.3 and v.z < -0.3 else v.x,
                'z': v.z + 0.05 if abs(v.x) > 0.3 and v.z < -0.3 else v.z,
                'y': v.y
            }
        }
    }
    
    # 各シェイプキーを処理
    for shape_key_name, config in shape_key_configs.items():
        shape_key = mesh.shape_keys.key_blocks.get(shape_key_name)
        if shape_key:
            print(f"処理中: {shape_key_name} - {config['description']}")
            
            # シェイプキーをアクティブにする
            set_shape_key_active(face_obj, shape_key_name)
            
            # Basisの頂点位置を取得
            basis = mesh.shape_keys.key_blocks['Basis']
            
            # 頂点を更新
            changed_count = 0
            for i, vertex in enumerate(mesh.vertices):
                basis_co = basis.data[i].co
                new_pos = config['changes'](basis_co)
                
                # 変更があった場合のみ更新
                if (new_pos['x'] != basis_co.x or 
                    new_pos['y'] != basis_co.y or 
                    new_pos['z'] != basis_co.z):
                    shape_key.data[i].co.x = new_pos['x']
                    shape_key.data[i].co.y = new_pos['y']
                    shape_key.data[i].co.z = new_pos['z']
                    changed_count += 1
            
            print(f"  → {changed_count}個の頂点を変更しました")
            
            # メッシュを更新
            mesh.update()
    
    # オブジェクトモードに戻る
    if bpy.context.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    
    # 変更を保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
    print("\n✅ シェイプキーの修正が完了しました！")
    print("Blenderで確認してください：")
    print("1. オブジェクトモードで HighQualityFaceAvatar を選択")
    print("2. プロパティパネル > オブジェクトデータプロパティ > シェイプキー")
    print("3. 各シェイプキーのスライダーを動かして確認")
    
else:
    print("エラー: オブジェクトまたはシェイプキーが見つかりません")