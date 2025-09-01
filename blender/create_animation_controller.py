"""
アニメーションコントローラーの作成
"""
import bpy

print("=== アニメーションコントローラー作成 ===\n")

# オブジェクトを取得
face_obj = bpy.data.objects.get('HighQualityFaceAvatar')
armature_obj = bpy.data.objects.get('FaceRig')

if face_obj and armature_obj:
    # UIコントローラー用のEmpty objectを作成
    controller = bpy.data.objects.new("FaceController", None)
    bpy.context.collection.objects.link(controller)
    controller.empty_display_type = 'PLAIN_AXES'
    controller.empty_display_size = 0.5
    controller.location = (0, -1, 0)
    
    # カスタムプロパティを追加
    print("カスタムプロパティを設定中...")
    
    # 基本的な口の動き
    controller["mouth_open"] = 0.0
    controller["jaw_rotation"] = 0.0
    
    # 母音
    controller["vowel_a"] = 0.0
    controller["vowel_i"] = 0.0
    controller["vowel_u"] = 0.0
    controller["vowel_e"] = 0.0
    controller["vowel_o"] = 0.0
    
    # 表情
    controller["smile"] = 0.0
    controller["frown"] = 0.0
    
    # 会話の強度
    controller["talk_intensity"] = 1.0
    
    # プロパティの範囲を設定
    if "_RNA_UI" not in controller:
        controller["_RNA_UI"] = {}
    
    # 各プロパティの設定
    props_config = {
        "mouth_open": {"min": 0.0, "max": 1.0, "description": "口の開き具合"},
        "jaw_rotation": {"min": -0.5, "max": 0.5, "description": "顎の回転"},
        "vowel_a": {"min": 0.0, "max": 1.0, "description": "母音「あ」"},
        "vowel_i": {"min": 0.0, "max": 1.0, "description": "母音「い」"},
        "vowel_u": {"min": 0.0, "max": 1.0, "description": "母音「う」"},
        "vowel_e": {"min": 0.0, "max": 1.0, "description": "母音「え」"},
        "vowel_o": {"min": 0.0, "max": 1.0, "description": "母音「お」"},
        "smile": {"min": 0.0, "max": 1.0, "description": "笑顔"},
        "frown": {"min": 0.0, "max": 1.0, "description": "困り顔"},
        "talk_intensity": {"min": 0.0, "max": 2.0, "description": "会話の強度"}
    }
    
    for prop_name, config in props_config.items():
        controller["_RNA_UI"][prop_name] = {
            "min": config["min"],
            "max": config["max"],
            "soft_min": config["min"],
            "soft_max": config["max"],
            "description": config["description"]
        }
    
    # シェイプキーのドライバーを設定
    if face_obj.data.shape_keys:
        shape_keys = face_obj.data.shape_keys.key_blocks
        
        # 既存のドライバーをクリア
        if face_obj.data.shape_keys.animation_data:
            face_obj.data.shape_keys.animation_data_clear()
        
        print("\nドライバーを設定中...")
        
        # 口の開き（Talk_Open）
        if "Talk_Open" in shape_keys:
            driver = shape_keys["Talk_Open"].driver_add("value").driver
            driver.type = 'SCRIPTED'
            
            var1 = driver.variables.new()
            var1.name = "mouth_open"
            var1.type = 'SINGLE_PROP'
            var1.targets[0].id = controller
            var1.targets[0].data_path = '["mouth_open"]'
            
            var2 = driver.variables.new()
            var2.name = "intensity"
            var2.type = 'SINGLE_PROP'
            var2.targets[0].id = controller
            var2.targets[0].data_path = '["talk_intensity"]'
            
            driver.expression = "mouth_open * intensity"
            print("✓ Talk_Open ドライバー設定")
        
        # 母音のドライバー
        vowel_shapes = {
            "Vowel_A_Talk": "vowel_a",
            "Vowel_I_Talk": "vowel_i",
            "Vowel_U_Talk": "vowel_u",
            "Vowel_E_Talk": "vowel_e",
            "Vowel_O_Talk": "vowel_o"
        }
        
        for shape_name, prop_name in vowel_shapes.items():
            if shape_name in shape_keys:
                driver = shape_keys[shape_name].driver_add("value").driver
                driver.type = 'SCRIPTED'
                
                var1 = driver.variables.new()
                var1.name = prop_name
                var1.type = 'SINGLE_PROP'
                var1.targets[0].id = controller
                var1.targets[0].data_path = f'["{prop_name}"]'
                
                var2 = driver.variables.new()
                var2.name = "intensity"
                var2.type = 'SINGLE_PROP'
                var2.targets[0].id = controller
                var2.targets[0].data_path = '["talk_intensity"]'
                
                driver.expression = f"{prop_name} * intensity"
                print(f"✓ {shape_name} ドライバー設定")
        
        # 表情のドライバー
        if "Smile_Subtle" in shape_keys:
            driver = shape_keys["Smile_Subtle"].driver_add("value").driver
            driver.type = 'SCRIPTED'
            
            var = driver.variables.new()
            var.name = "smile"
            var.type = 'SINGLE_PROP'
            var.targets[0].id = controller
            var.targets[0].data_path = '["smile"]'
            
            driver.expression = "smile"
            print("✓ Smile_Subtle ドライバー設定")
        
        if "Frown" in shape_keys:
            driver = shape_keys["Frown"].driver_add("value").driver
            driver.type = 'SCRIPTED'
            
            var = driver.variables.new()
            var.name = "frown"
            var.type = 'SINGLE_PROP'
            var.targets[0].id = controller
            var.targets[0].data_path = '["frown"]'
            
            driver.expression = "frown"
            print("✓ Frown ドライバー設定")
    
    # ボーンのコンストレイントを設定
    if armature_obj.pose:
        print("\nボーンコンストレイントを設定中...")
        
        # 顎ボーンの回転
        if "Jaw" in armature_obj.pose.bones:
            jaw_bone = armature_obj.pose.bones["Jaw"]
            
            # 回転制限
            constraint = jaw_bone.constraints.new('LIMIT_ROTATION')
            constraint.use_limit_x = True
            constraint.min_x = -0.5  # 約-28度
            constraint.max_x = 0.1   # 約5度
            constraint.owner_space = 'LOCAL'
            
            # ドライバーで制御
            if jaw_bone.rotation_mode != 'XYZ':
                jaw_bone.rotation_mode = 'XYZ'
            
            driver = jaw_bone.driver_add("rotation_euler", 0).driver
            driver.type = 'SCRIPTED'
            
            var = driver.variables.new()
            var.name = "jaw_rot"
            var.type = 'SINGLE_PROP'
            var.targets[0].id = controller
            var.targets[0].data_path = '["jaw_rotation"]'
            
            driver.expression = "jaw_rot"
            print("✓ Jaw ボーン制御設定")
    
    # アニメーションアクションを作成
    print("\nサンプルアニメーションを作成中...")
    
    # 新しいアクションを作成
    action = bpy.data.actions.new("Conversation_Sample")
    controller.animation_data_create()
    controller.animation_data.action = action
    
    # キーフレームを設定
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 120
    
    # 「こんにちは」のアニメーション
    keyframes = [
        (1, {"mouth_open": 0, "vowel_o": 0, "vowel_i": 0, "vowel_a": 0}),
        (10, {"mouth_open": 0.3, "vowel_o": 0.7}),  # こ
        (20, {"mouth_open": 0.1}),  # ん
        (30, {"mouth_open": 0.3, "vowel_i": 0.8}),  # に
        (40, {"mouth_open": 0.4, "vowel_i": 0.6}),  # ち
        (50, {"mouth_open": 0.5, "vowel_a": 0.8, "smile": 0.3}),  # は
        (60, {"smile": 0.5}),  # 笑顔維持
        (90, {"mouth_open": 0, "vowel_o": 0, "vowel_i": 0, "vowel_a": 0, "smile": 0})
    ]
    
    for frame, values in keyframes:
        scene.frame_set(frame)
        for prop, value in values.items():
            controller[prop] = value
            controller.keyframe_insert(data_path=f'["{prop}"]', frame=frame)
    
    print("✓ サンプルアニメーション作成完了")
    
    print("\n✅ アニメーションコントローラー作成完了！")
    print("\n使用方法：")
    print("1. FaceControllerオブジェクトを選択")
    print("2. Nキーでプロパティパネルを開く")
    print("3. カスタムプロパティで口の動きを制御")
    print("4. スペースキーでサンプルアニメーションを再生")
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
else:
    print("エラー: 必要なオブジェクトが見つかりません")