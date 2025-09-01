"""
3次元的に顔の各部位の位置を分析
"""
import bpy
import math

obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj:
    mesh = obj.data
    vertices = mesh.vertices
    
    print("=== 3次元座標の詳細分析 ===\n")
    
    # 1. 極値の頂点を見つけて顔の向きを特定
    print("【極値の頂点】")
    
    # 各軸の極値
    x_min_vert = min(vertices, key=lambda v: v.co.x)
    x_max_vert = max(vertices, key=lambda v: v.co.x)
    y_min_vert = min(vertices, key=lambda v: v.co.y)
    y_max_vert = max(vertices, key=lambda v: v.co.y)
    z_min_vert = min(vertices, key=lambda v: v.co.z)
    z_max_vert = max(vertices, key=lambda v: v.co.z)
    
    print(f"X最小 (左端): ({x_min_vert.co.x:.2f}, {x_min_vert.co.y:.2f}, {x_min_vert.co.z:.2f})")
    print(f"X最大 (右端): ({x_max_vert.co.x:.2f}, {x_max_vert.co.y:.2f}, {x_max_vert.co.z:.2f})")
    print(f"Y最小: ({y_min_vert.co.x:.2f}, {y_min_vert.co.y:.2f}, {y_min_vert.co.z:.2f})")
    print(f"Y最大: ({y_max_vert.co.x:.2f}, {y_max_vert.co.y:.2f}, {y_max_vert.co.z:.2f})")
    print(f"Z最小 (下端): ({z_min_vert.co.x:.2f}, {z_min_vert.co.y:.2f}, {z_min_vert.co.z:.2f})")
    print(f"Z最大 (上端): ({z_max_vert.co.x:.2f}, {z_max_vert.co.y:.2f}, {z_max_vert.co.z:.2f})")
    
    # 2. 各象限の頂点数を数える
    print("\n【象限別の頂点分布】")
    
    quadrants = {
        "前上": 0, "前下": 0,
        "後上": 0, "後下": 0
    }
    
    for v in vertices:
        if v.co.y >= 0:  # 前
            if v.co.z >= 0:  # 上
                quadrants["前上"] += 1
            else:  # 下
                quadrants["前下"] += 1
        else:  # 後
            if v.co.z >= 0:  # 上
                quadrants["後上"] += 1
            else:  # 下
                quadrants["後下"] += 1
    
    for name, count in quadrants.items():
        print(f"{name}: {count:,}頂点")
    
    # 3. 顔の中心線上の点を分析
    print("\n【中心線上の頂点分析】")
    
    # X=0付近の頂点を取得
    centerline = []
    for v in vertices:
        if abs(v.co.x) < 0.05:  # 中心線上
            centerline.append(v)
    
    # Y-Z平面でソート
    centerline.sort(key=lambda v: (v.co.y, v.co.z))
    
    # サンプリング
    sample_size = min(20, len(centerline))
    step = len(centerline) // sample_size
    
    print("Y座標, Z座標 → 推定部位")
    print("-" * 40)
    
    for i in range(0, len(centerline), step):
        v = centerline[i]
        y, z = v.co.y, v.co.z
        
        # 部位を推定
        if y < -0.4:
            part = "後頭部"
        elif y < 0:
            part = "側頭部/後方"
        elif y < 0.4:
            part = "顔の側面"
        else:
            if z > 0.5:
                part = "額"
            elif z > 0.2:
                part = "目・鼻"
            elif z > -0.1:
                part = "鼻・口（上）"
            elif z > -0.3:
                part = "口・顎"
            else:
                part = "首"
        
        print(f"Y={y:6.2f}, Z={z:6.2f} → {part}")
    
    # 4. 口の正確な位置を特定するためのテスト
    print("\n\n【口の位置特定テスト】")
    
    # 既存のテストキーを削除
    test_keys = ["Face_Front_Test", "Face_Back_Test", "Mouth_Region_Test"]
    for key_name in test_keys:
        if key_name in mesh.shape_keys.key_blocks:
            obj.active_shape_key_index = mesh.shape_keys.key_blocks.find(key_name)
            bpy.ops.object.shape_key_remove()
    
    basis = mesh.shape_keys.key_blocks['Basis']
    
    # 顔の前面テスト（最もYが大きい領域）
    obj.shape_key_add(name="Face_Front_Test", from_mix=False)
    front_test = mesh.shape_keys.key_blocks["Face_Front_Test"]
    
    front_count = 0
    for i, v in enumerate(vertices):
        co = basis.data[i].co
        front_test.data[i].co = co.copy()
        
        # Y > 0.5 の領域（前面の候補）
        if co.y > 0.5 and abs(co.x) < 0.3 and -0.2 < co.z < 0.2:
            front_test.data[i].co.z -= 0.05
            front_count += 1
    
    print(f"Face_Front_Test: {front_count}頂点")
    
    # 後頭部テスト（最もYが小さい領域）
    obj.shape_key_add(name="Face_Back_Test", from_mix=False)
    back_test = mesh.shape_keys.key_blocks["Face_Back_Test"]
    
    back_count = 0
    for i, v in enumerate(vertices):
        co = basis.data[i].co
        back_test.data[i].co = co.copy()
        
        # Y < -0.5 の領域（後頭部の候補）
        if co.y < -0.5 and abs(co.x) < 0.3 and -0.2 < co.z < 0.2:
            back_test.data[i].co.z -= 0.05
            back_count += 1
    
    print(f"Face_Back_Test: {back_count}頂点")
    
    # 画像から推定される口の位置でテスト
    # 顔が正面を向いているなら、Y値が大きく、Z値が0付近
    obj.shape_key_add(name="Mouth_Region_Test", from_mix=False)
    mouth_test = mesh.shape_keys.key_blocks["Mouth_Region_Test"]
    
    mouth_count = 0
    for i, v in enumerate(vertices):
        co = basis.data[i].co
        mouth_test.data[i].co = co.copy()
        
        # 最も前面（Y最大付近）で、顔の下半分
        if co.y > 0.4 and abs(co.x) < 0.35 and -0.1 < co.z < 0.1:
            mouth_test.data[i].co.z -= 0.05
            mouth_count += 1
    
    print(f"Mouth_Region_Test: {mouth_count}頂点")
    
    # 保存
    print("\n保存中...")
    bpy.ops.wm.save_mainfile()
    
    print("\n✅ 完了！")
    print("\n以下のシェイプキーで顔の向きを確認してください：")
    print("1. Face_Front_Test - 顔の前面候補（Y > 0.5）")
    print("2. Face_Back_Test - 後頭部候補（Y < -0.5）")
    print("3. Mouth_Region_Test - 口の候補位置")
    print("\nどれが実際の顔/口で動いているか教えてください。")