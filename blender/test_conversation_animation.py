"""
自然な会話アニメーションのテスト
"""
import bpy

obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj and obj.data.shape_keys:
    print("=== 会話アニメーションテスト ===\n")
    
    # アニメーション設定
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 120
    fps = 24
    scene.render.fps = fps
    
    # すべてのシェイプキーをリセット
    for key in obj.data.shape_keys.key_blocks:
        if key.name != 'Basis':
            key.value = 0
            key.keyframe_insert("value", frame=1)
    
    # 「こんにちは」のアニメーション例
    print("「こんにちは」のアニメーションを設定中...\n")
    
    animations = [
        # こ (ko)
        (10, [
            ("Consonant_H", 0.3),
            ("Vowel_O_Talk", 0.7),
            ("Talk_Open", 0.4)
        ]),
        # ん (n)
        (20, [
            ("Consonant_M", 0.6),
            ("Half_Open", 0.2)
        ]),
        # に (ni)
        (30, [
            ("Consonant_H", 0.2),
            ("Vowel_I_Talk", 0.8),
            ("Talk_Open", 0.3)
        ]),
        # ち (chi)
        (40, [
            ("Vowel_I_Talk", 0.6),
            ("Talk_Open", 0.5)
        ]),
        # は (wa)
        (50, [
            ("Consonant_H", 0.4),
            ("Vowel_A_Talk", 0.8),
            ("Talk_Open", 0.6),
            ("Smile_Subtle", 0.3)  # 挨拶なので微笑みを追加
        ]),
        # 終了
        (70, [
            ("Smile_Subtle", 0.5)  # 微笑みを維持
        ]),
        # リセット
        (90, [])
    ]
    
    # アニメーションキーフレームを設定
    for frame, shapes in animations:
        scene.frame_set(frame)
        
        # すべてのシェイプキーをリセット
        for key in obj.data.shape_keys.key_blocks:
            if key.name != 'Basis':
                # 現在のフレームで指定されているシェイプキー以外は0に
                shape_names = [s[0] for s in shapes]
                if key.name not in shape_names:
                    key.value = 0
                    key.keyframe_insert("value", frame=frame)
        
        # 指定されたシェイプキーを設定
        for shape_name, value in shapes:
            if shape_name in obj.data.shape_keys.key_blocks:
                key = obj.data.shape_keys.key_blocks[shape_name]
                key.value = value
                key.keyframe_insert("value", frame=frame)
                print(f"Frame {frame}: {shape_name} = {value}")
    
    # 補間をスムーズに
    if obj.animation_data and obj.animation_data.action:
        for fcurve in obj.animation_data.action.fcurves:
            for keyframe in fcurve.keyframe_points:
                keyframe.interpolation = 'BEZIER'
                keyframe.handle_left_type = 'AUTO'
                keyframe.handle_right_type = 'AUTO'
    
    print("\n✅ アニメーション設定完了！")
    print("\nテスト方法：")
    print("1. Blenderでファイルを開く")
    print("2. HighQualityFaceAvatarを選択")
    print("3. スペースキーでアニメーションを再生")
    print("\n設定内容：")
    print("- フレーム 1-120")
    print("- 「こんにちは」の口の動き")
    print("- 自然な補間とブレンド")
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
else:
    print("エラー: オブジェクトまたはシェイプキーが見つかりません")