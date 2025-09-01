"""
顔のアニメーション用リグ（ボーン）を作成
"""
import bpy
import mathutils

print("=== 顔のリグ作成 ===\n")

# 既存のアーマチュアを削除
for obj in bpy.data.objects:
    if obj.type == 'ARMATURE' and 'Face' in obj.name:
        bpy.data.objects.remove(obj, do_unlink=True)

# 顔のメッシュを取得
face_obj = bpy.data.objects.get('HighQualityFaceAvatar')

if face_obj:
    # メッシュの境界を計算
    mesh = face_obj.data
    vertices = mesh.vertices
    
    # 顔の中心と範囲を計算
    x_coords = [v.co.x for v in vertices]
    y_coords = [v.co.y for v in vertices]
    z_coords = [v.co.z for v in vertices]
    
    center_x = sum(x_coords) / len(x_coords)
    center_y = sum(y_coords) / len(y_coords)
    center_z = sum(z_coords) / len(z_coords)
    
    # アーマチュアを作成
    armature = bpy.data.armatures.new("FaceRig")
    armature_obj = bpy.data.objects.new("FaceRig", armature)
    bpy.context.collection.objects.link(armature_obj)
    
    # アーマチュアをアクティブにして編集モード
    bpy.context.view_layer.objects.active = armature_obj
    bpy.ops.object.mode_set(mode='EDIT')
    
    # ルートボーン（頭）
    head_bone = armature.edit_bones.new("Head")
    head_bone.head = (center_x, center_y, center_z + 0.3)
    head_bone.tail = (center_x, center_y, center_z + 0.5)
    
    # 顎ボーン
    jaw_bone = armature.edit_bones.new("Jaw")
    jaw_bone.head = (center_x, center_y - 0.3, center_z - 0.3)
    jaw_bone.tail = (center_x, center_y - 0.4, center_z - 0.4)
    jaw_bone.parent = head_bone
    
    # 口の制御ボーン
    # 上唇中央
    upper_lip_center = armature.edit_bones.new("UpperLip_Center")
    upper_lip_center.head = (center_x, center_y - 0.6, center_z - 0.25)
    upper_lip_center.tail = (center_x, center_y - 0.65, center_z - 0.25)
    upper_lip_center.parent = head_bone
    
    # 下唇中央
    lower_lip_center = armature.edit_bones.new("LowerLip_Center")
    lower_lip_center.head = (center_x, center_y - 0.6, center_z - 0.35)
    lower_lip_center.tail = (center_x, center_y - 0.65, center_z - 0.35)
    lower_lip_center.parent = jaw_bone
    
    # 口角（左右）
    mouth_corner_l = armature.edit_bones.new("MouthCorner_L")
    mouth_corner_l.head = (center_x + 0.1, center_y - 0.6, center_z - 0.3)
    mouth_corner_l.tail = (center_x + 0.15, center_y - 0.6, center_z - 0.3)
    mouth_corner_l.parent = head_bone
    
    mouth_corner_r = armature.edit_bones.new("MouthCorner_R")
    mouth_corner_r.head = (center_x - 0.1, center_y - 0.6, center_z - 0.3)
    mouth_corner_r.tail = (center_x - 0.15, center_y - 0.6, center_z - 0.3)
    mouth_corner_r.parent = head_bone
    
    # 唇の詳細制御ボーン
    # 上唇左右
    upper_lip_l = armature.edit_bones.new("UpperLip_L")
    upper_lip_l.head = (center_x + 0.05, center_y - 0.6, center_z - 0.25)
    upper_lip_l.tail = (center_x + 0.05, center_y - 0.65, center_z - 0.25)
    upper_lip_l.parent = head_bone
    
    upper_lip_r = armature.edit_bones.new("UpperLip_R")
    upper_lip_r.head = (center_x - 0.05, center_y - 0.6, center_z - 0.25)
    upper_lip_r.tail = (center_x - 0.05, center_y - 0.65, center_z - 0.25)
    upper_lip_r.parent = head_bone
    
    # 下唇左右
    lower_lip_l = armature.edit_bones.new("LowerLip_L")
    lower_lip_l.head = (center_x + 0.05, center_y - 0.6, center_z - 0.35)
    lower_lip_l.tail = (center_x + 0.05, center_y - 0.65, center_z - 0.35)
    lower_lip_l.parent = jaw_bone
    
    lower_lip_r = armature.edit_bones.new("LowerLip_R")
    lower_lip_r.head = (center_x - 0.05, center_y - 0.6, center_z - 0.35)
    lower_lip_r.tail = (center_x - 0.05, center_y - 0.65, center_z - 0.35)
    lower_lip_r.parent = jaw_bone
    
    # オブジェクトモードに戻る
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # 頂点グループを作成
    print("\n頂点グループを作成中...")
    
    # 既存の頂点グループをクリア
    face_obj.vertex_groups.clear()
    
    # 各ボーンに対応する頂点グループを作成
    bone_vertex_groups = {
        "Jaw": [],
        "UpperLip_Center": [],
        "LowerLip_Center": [],
        "MouthCorner_L": [],
        "MouthCorner_R": [],
        "UpperLip_L": [],
        "UpperLip_R": [],
        "LowerLip_L": [],
        "LowerLip_R": []
    }
    
    # 顎の頂点を割り当て
    for i, v in enumerate(vertices):
        # 顎（下部）
        if v.co.z < -0.4 and v.co.y < -0.3:
            bone_vertex_groups["Jaw"].append((i, 1.0))
        
        # 口の領域
        if -0.65 < v.co.y < -0.54 and -0.45 < v.co.z < -0.15:
            # 上唇
            if v.co.z > -0.25:
                if abs(v.co.x) < 0.03:
                    bone_vertex_groups["UpperLip_Center"].append((i, 1.0))
                elif v.co.x > 0.03:
                    bone_vertex_groups["UpperLip_L"].append((i, 0.8))
                else:
                    bone_vertex_groups["UpperLip_R"].append((i, 0.8))
            
            # 下唇
            elif v.co.z < -0.35:
                if abs(v.co.x) < 0.03:
                    bone_vertex_groups["LowerLip_Center"].append((i, 1.0))
                elif v.co.x > 0.03:
                    bone_vertex_groups["LowerLip_L"].append((i, 0.8))
                else:
                    bone_vertex_groups["LowerLip_R"].append((i, 0.8))
            
            # 口角
            if abs(v.co.x) > 0.08:
                if v.co.x > 0:
                    bone_vertex_groups["MouthCorner_L"].append((i, 0.7))
                else:
                    bone_vertex_groups["MouthCorner_R"].append((i, 0.7))
    
    # 頂点グループに頂点を割り当て
    for bone_name, vertex_weights in bone_vertex_groups.items():
        if vertex_weights:
            vg = face_obj.vertex_groups.new(name=bone_name)
            for vertex_index, weight in vertex_weights:
                vg.add([vertex_index], weight, 'REPLACE')
            print(f"  {bone_name}: {len(vertex_weights)}頂点")
    
    # アーマチュアモディファイアを追加
    armature_mod = face_obj.modifiers.new("Armature", 'ARMATURE')
    armature_mod.object = armature_obj
    
    # アーマチュアを顔の親に設定
    face_obj.parent = armature_obj
    face_obj.parent_type = 'ARMATURE'
    
    print("\n✅ リグ作成完了！")
    print("\n作成したボーン：")
    print("- Head: 頭部の基本ボーン")
    print("- Jaw: 顎ボーン（口を開く動作）")
    print("- UpperLip_Center/L/R: 上唇の制御")
    print("- LowerLip_Center/L/R: 下唇の制御")
    print("- MouthCorner_L/R: 口角の制御")
    
    # ボーンのカスタムシェイプを設定（見やすくするため）
    bpy.ops.object.mode_set(mode='POSE')
    
    for bone in armature_obj.pose.bones:
        bone.custom_shape_scale = 0.5
        # ボーンの表示を見やすく
        if 'Lip' in bone.name or 'Mouth' in bone.name:
            bone.bone.show_wire = True
    
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
    print("\n次のステップ：")
    print("1. ポーズモードでボーンを動かしてテスト")
    print("2. シェイプキーとボーンを連携させる")
    print("3. アニメーションコントローラーを作成")