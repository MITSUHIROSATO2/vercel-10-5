"""
歯科患者アバター自動生成スクリプト
Blender 3.6以上で実行してください

使用方法:
1. Blenderを開く
2. Scripting タブに切り替え
3. このスクリプトをコピー＆ペースト
4. Run Script ボタンをクリック
"""

import bpy
import math

# シーンをクリア
def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # カメラとライトも削除
    for obj in bpy.data.objects:
        bpy.data.objects.remove(obj, do_unlink=True)

# マテリアルを作成
def create_material(name, color, roughness=0.5, subsurface=0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs['Base Color'].default_value = (*color, 1.0)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Subsurface'].default_value = subsurface
    
    if subsurface > 0:
        bsdf.inputs['Subsurface Color'].default_value = (1.0, 0.6, 0.6, 1.0)
    
    return mat

# 頭部を作成
def create_head():
    # UV球を追加
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=64, 
        ring_count=32,
        location=(0, 0, 0)
    )
    
    head = bpy.context.active_object
    head.name = "Head"
    
    # 編集モードで形状を調整
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    
    # 頭の形に変形
    bpy.ops.transform.resize(value=(0.95, 1.05, 0.9))
    
    # 顎のラインを作る
    bpy.ops.mesh.select_all(action='DESELECT')
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # Subdivision Surfaceを追加
    modifier = head.modifiers.new(name="Subdivision", type='SUBSURF')
    modifier.levels = 2
    modifier.render_levels = 2
    
    # 肌のマテリアルを適用
    skin_mat = create_material("Skin", (1.0, 0.831, 0.702), roughness=0.7, subsurface=0.1)
    head.data.materials.append(skin_mat)
    
    return head

# 目を作成
def create_eyes():
    eyes = []
    
    for i, (x, name) in enumerate([(-0.15, "Eye.L"), (0.15, "Eye.R")]):
        # 眼球
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=32,
            ring_count=16,
            location=(x, 0.1, 0.4),
            scale=(0.08, 0.08, 0.08)
        )
        eye = bpy.context.active_object
        eye.name = name
        
        # 眼球のマテリアル
        eye_mat = create_material(f"Eye_White_{name}", (0.95, 0.95, 0.95), roughness=0.2)
        eye.data.materials.append(eye_mat)
        
        # 虹彩
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=32,
            ring_count=16,
            location=(x, 0.14, 0.4),
            scale=(0.04, 0.04, 0.02)
        )
        iris = bpy.context.active_object
        iris.name = f"Iris_{name}"
        iris.parent = eye
        
        # 虹彩のマテリアル
        iris_mat = create_material(f"Iris_{name}", (0.3, 0.2, 0.1), roughness=0.3)
        iris.data.materials.append(iris_mat)
        
        # 瞳孔
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=16,
            ring_count=8,
            location=(x, 0.16, 0.4),
            scale=(0.02, 0.02, 0.01)
        )
        pupil = bpy.context.active_object
        pupil.name = f"Pupil_{name}"
        pupil.parent = eye
        
        # 瞳孔のマテリアル
        pupil_mat = create_material(f"Pupil_{name}", (0.0, 0.0, 0.0), roughness=0.0)
        pupil.data.materials.append(pupil_mat)
        
        eyes.append(eye)
    
    return eyes

# 口を作成
def create_mouth():
    # 口の基本形状
    bpy.ops.mesh.primitive_cube_add(
        location=(0, -0.2, 0.45),
        scale=(0.2, 0.05, 0.05)
    )
    
    mouth = bpy.context.active_object
    mouth.name = "Mouth"
    
    # 編集モードで形状調整
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.subdivide(number_cuts=2)
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # Subdivision Surface
    modifier = mouth.modifiers.new(name="Subdivision", type='SUBSURF')
    modifier.levels = 2
    
    # 口のマテリアル
    mouth_mat = create_material("Lips", (0.8, 0.4, 0.4), roughness=0.6)
    mouth.data.materials.append(mouth_mat)
    
    return mouth

# 鼻を作成
def create_nose():
    bpy.ops.mesh.primitive_cube_add(
        location=(0, 0, 0.48),
        scale=(0.06, 0.08, 0.05)
    )
    
    nose = bpy.context.active_object
    nose.name = "Nose"
    
    # Subdivision Surface
    modifier = nose.modifiers.new(name="Subdivision", type='SUBSURF')
    modifier.levels = 2
    
    # 鼻のマテリアル（肌と同じ）
    skin_mat = bpy.data.materials.get("Skin")
    if skin_mat:
        nose.data.materials.append(skin_mat)
    
    return nose

# 髪を作成
def create_hair():
    # ベースの髪
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=32,
        ring_count=16,
        location=(0, 0.3, 0),
        scale=(0.52, 0.52, 0.52)
    )
    
    hair = bpy.context.active_object
    hair.name = "Hair"
    
    # 編集モードで上半分だけにする
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='DESELECT')
    
    # 下半分を削除
    bpy.ops.mesh.bisect(
        plane_co=(0, 0, 0), 
        plane_no=(0, 0, 1), 
        use_fill=False, 
        clear_inner=True
    )
    
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # 髪のマテリアル
    hair_mat = create_material("Hair", (0.15, 0.1, 0.08), roughness=0.85)
    hair.data.materials.append(hair_mat)
    
    return hair

# シェイプキーを追加
def add_shape_keys(head):
    # ベースシェイプキー
    bpy.ops.object.shape_key_add(from_mix=False)
    
    # 表情のシェイプキー
    shape_keys = [
        "mouth_open",
        "mouth_smile",
        "mouth_frown",
        "vowel_a",
        "vowel_i", 
        "vowel_u",
        "vowel_e",
        "vowel_o",
        "blink_left",
        "blink_right",
        "eyebrow_up",
        "eyebrow_down",
        "pain",
        "worried",
        "happy"
    ]
    
    for key_name in shape_keys:
        bpy.ops.object.shape_key_add(from_mix=False)
        key_block = head.data.shape_keys.key_blocks[-1]
        key_block.name = key_name
        
    print(f"追加されたシェイプキー: {len(shape_keys)}個")

# アーマチュア（骨格）を作成
def create_armature():
    # アーマチュアを追加
    bpy.ops.object.armature_add(location=(0, 0, 0))
    armature = bpy.context.active_object
    armature.name = "Avatar_Armature"
    
    # 編集モードでボーンを設定
    bpy.ops.object.mode_set(mode='EDIT')
    
    # ボーンを取得
    bones = armature.data.edit_bones
    root_bone = bones[0]
    root_bone.name = "Root"
    
    # 首のボーン
    neck = bones.new("Neck")
    neck.head = (0, 0, -0.3)
    neck.tail = (0, 0, 0)
    neck.parent = root_bone
    
    # 頭のボーン
    head = bones.new("Head")
    head.head = (0, 0, 0)
    head.tail = (0, 0, 0.5)
    head.parent = neck
    
    # 顎のボーン
    jaw = bones.new("Jaw")
    jaw.head = (0, -0.1, -0.1)
    jaw.tail = (0, -0.2, 0)
    jaw.parent = head
    
    bpy.ops.object.mode_set(mode='OBJECT')
    
    return armature

# ライティングとカメラをセットアップ
def setup_scene():
    # カメラを追加
    bpy.ops.object.camera_add(location=(0, -3, 0.5), rotation=(1.5708, 0, 0))
    camera = bpy.context.active_object
    camera.name = "Main_Camera"
    
    # キーライト
    bpy.ops.object.light_add(type='AREA', location=(2, -2, 2))
    key_light = bpy.context.active_object
    key_light.name = "Key_Light"
    key_light.data.energy = 100
    key_light.data.size = 1
    
    # フィルライト
    bpy.ops.object.light_add(type='AREA', location=(-2, -2, 1))
    fill_light = bpy.context.active_object
    fill_light.name = "Fill_Light"
    fill_light.data.energy = 50
    fill_light.data.size = 1
    fill_light.data.color = (1.0, 0.95, 0.9)
    
    # リムライト
    bpy.ops.object.light_add(type='SPOT', location=(0, 2, 2))
    rim_light = bpy.context.active_object
    rim_light.name = "Rim_Light"
    rim_light.data.energy = 80
    rim_light.data.spot_size = 0.8

# エクスポート設定
def export_avatar(filepath):
    # すべてのオブジェクトを選択
    bpy.ops.object.select_all(action='SELECT')
    
    # GLTFエクスポート
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        export_texcoords=True,
        export_normals=True,
        export_materials='EXPORT',
        export_cameras=False,
        export_lights=False,
        export_yup=True,
        export_apply=True,
        export_animations=True,
        export_morph=True,
        export_morph_normal=True,
        export_morph_tangent=False
    )
    
    print(f"アバターがエクスポートされました: {filepath}")

# メイン実行関数
def main():
    print("歯科患者アバターの作成を開始します...")
    
    # シーンをクリア
    clear_scene()
    
    # パーツを作成
    head = create_head()
    eyes = create_eyes()
    mouth = create_mouth()
    nose = create_nose()
    hair = create_hair()
    
    # すべてのパーツを頭部の子にする
    for obj in eyes + [mouth, nose, hair]:
        obj.parent = head
    
    # シェイプキーを追加
    bpy.context.view_layer.objects.active = head
    add_shape_keys(head)
    
    # アーマチュアを作成
    armature = create_armature()
    
    # シーンをセットアップ
    setup_scene()
    
    print("アバターの作成が完了しました！")
    print("\nエクスポートするには:")
    print("1. File > Export > glTF 2.0")
    print("2. ファイル名: patient-avatar.glb")
    print("3. Format: glTF Binary (.glb)")
    print("4. Transform > +Y Up にチェック")
    print("5. Export glTF 2.0 をクリック")

# スクリプトを実行
if __name__ == "__main__":
    main()