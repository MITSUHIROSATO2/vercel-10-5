"""
シェイプキーとボーンをドライバーで連携
"""
import bpy
import math

print("=== シェイプキードライバー設定 ===\n")

face_obj = bpy.data.objects.get('HighQualityFaceAvatar')
armature_obj = bpy.data.objects.get('FaceRig')

if face_obj and armature_obj and face_obj.data.shape_keys:
    shape_keys = face_obj.data.shape_keys.key_blocks
    
    # 既存のドライバーをクリア
    if face_obj.data.shape_keys.animation_data:
        face_obj.data.shape_keys.animation_data_clear()
    
    print("ドライバーを設定中...\n")
    
    # 1. 顎ボーンと口開きの連携
    if "Talk_Open" in shape_keys and "Jaw" in armature_obj.pose.bones:
        driver = shape_keys["Talk_Open"].driver_add("value").driver
        driver.type = 'SCRIPTED'
        
        # 変数を追加
        var = driver.variables.new()
        var.name = "jaw_rotation"
        var.type = 'TRANSFORMS'
        
        target = var.targets[0]
        target.id = armature_obj
        target.bone_target = "Jaw"
        target.transform_type = 'ROT_X'
        target.transform_space = 'LOCAL_SPACE'
        
        # 顎の回転角度に応じて口を開く（ラジアンを正規化）
        driver.expression = "max(0, min(1, -jaw_rotation * 2))"
        
        print("✓ Talk_Open ← Jaw ボーンの回転")
    
    # 2. 口角ボーンと笑顔の連携
    if "Smile_Subtle" in shape_keys:
        # 左口角
        if "MouthCorner_L" in armature_obj.pose.bones:
            driver = shape_keys["Smile_Subtle"].driver_add("value").driver
            driver.type = 'SCRIPTED'
            
            # 左右の口角の位置を変数に
            var_l = driver.variables.new()
            var_l.name = "corner_l_z"
            var_l.type = 'TRANSFORMS'
            target_l = var_l.targets[0]
            target_l.id = armature_obj
            target_l.bone_target = "MouthCorner_L"
            target_l.transform_type = 'LOC_Z'
            target_l.transform_space = 'LOCAL_SPACE'
            
            var_r = driver.variables.new()
            var_r.name = "corner_r_z"
            var_r.type = 'TRANSFORMS'
            target_r = var_r.targets[0]
            target_r.id = armature_obj
            target_r.bone_target = "MouthCorner_R"
            target_r.transform_type = 'LOC_Z'
            target_r.transform_space = 'LOCAL_SPACE'
            
            # 口角が上がったら笑顔に
            driver.expression = "max(0, min(1, (corner_l_z + corner_r_z) * 10))"
            
            print("✓ Smile_Subtle ← MouthCorner ボーンの位置")
    
    # 3. カスタムプロパティを使った母音制御
    # アーマチュアにカスタムプロパティを追加
    armature_obj["vowel_a"] = 0.0
    armature_obj["vowel_i"] = 0.0
    armature_obj["vowel_u"] = 0.0
    armature_obj["vowel_e"] = 0.0
    armature_obj["vowel_o"] = 0.0
    
    # プロパティの範囲を設定
    if "_RNA_UI" not in armature_obj:
        armature_obj["_RNA_UI"] = {}
    
    for vowel in ["vowel_a", "vowel_i", "vowel_u", "vowel_e", "vowel_o"]:
        armature_obj["_RNA_UI"][vowel] = {
            "min": 0.0,
            "max": 1.0,
            "soft_min": 0.0,
            "soft_max": 1.0,
            "description": f"Control for {vowel}"
        }
    
    # 母音シェイプキーにドライバーを設定
    vowel_mapping = {
        "Vowel_A_Talk": "vowel_a",
        "Vowel_I_Talk": "vowel_i",
        "Vowel_U_Talk": "vowel_u",
        "Vowel_E_Talk": "vowel_e",
        "Vowel_O_Talk": "vowel_o"
    }
    
    for shape_name, prop_name in vowel_mapping.items():
        if shape_name in shape_keys:
            driver = shape_keys[shape_name].driver_add("value").driver
            driver.type = 'SCRIPTED'
            
            var = driver.variables.new()
            var.name = prop_name
            var.type = 'SINGLE_PROP'
            
            target = var.targets[0]
            target.id = armature_obj
            target.data_path = f'["{prop_name}"]'
            
            driver.expression = prop_name
            
            print(f"✓ {shape_name} ← カスタムプロパティ {prop_name}")
    
    # 4. 複合的な動き（唇のすぼめ）
    # 唇中央ボーンの前後移動で「う」の形を制御
    if "Vowel_U_Talk" in shape_keys and "UpperLip_Center" in armature_obj.pose.bones:
        # 既存のドライバーがあれば上書き
        shape_keys["Vowel_U_Talk"].driver_remove("value")
        
        driver = shape_keys["Vowel_U_Talk"].driver_add("value").driver
        driver.type = 'SCRIPTED'
        
        # 上唇中央の前後位置
        var1 = driver.variables.new()
        var1.name = "lip_forward"
        var1.type = 'TRANSFORMS'
        target1 = var1.targets[0]
        target1.id = armature_obj
        target1.bone_target = "UpperLip_Center"
        target1.transform_type = 'LOC_Y'
        target1.transform_space = 'LOCAL_SPACE'
        
        # カスタムプロパティも考慮
        var2 = driver.variables.new()
        var2.name = "vowel_u"
        var2.type = 'SINGLE_PROP'
        target2 = var2.targets[0]
        target2.id = armature_obj
        target2.data_path = '["vowel_u"]'
        
        # 唇が前に出たら「う」の形に
        driver.expression = "max(vowel_u, min(1, -lip_forward * 20))"
        
        print("✓ Vowel_U_Talk ← UpperLip_Center の前後移動 + プロパティ")
    
    print("\n✅ ドライバー設定完了！")
    print("\n使用方法：")
    print("1. FaceRigをポーズモードで選択")
    print("2. ボーンを動かすとシェイプキーが連動")
    print("3. Nキーでサイドパネルを開き、カスタムプロパティで母音を制御")
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
else:
    print("エラー: 必要なオブジェクトが見つかりません")