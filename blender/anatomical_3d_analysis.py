"""
解剖学的な観点から3次元で顔の構造を分析
"""
import bpy
import math
from collections import defaultdict
import numpy as np

obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj:
    mesh = obj.data
    vertices = mesh.vertices
    
    print("=== 解剖学的3次元分析 ===\n")
    
    # 1. 重心の計算
    print("【1. モデルの重心分析】")
    center_x = sum(v.co.x for v in vertices) / len(vertices)
    center_y = sum(v.co.y for v in vertices) / len(vertices)
    center_z = sum(v.co.z for v in vertices) / len(vertices)
    
    print(f"重心座標: ({center_x:.3f}, {center_y:.3f}, {center_z:.3f})")
    
    # 2. 対称性分析（解剖学的に顔は左右対称）
    print("\n【2. 対称性分析】")
    
    # 左右の頂点をペアリング
    tolerance = 0.05
    symmetric_pairs = 0
    asymmetric_vertices = []
    
    for v in vertices:
        if v.co.x > 0.01:  # 右側の頂点
            # 対応する左側の頂点を探す
            mirror_found = False
            for u in vertices:
                if (abs(u.co.x + v.co.x) < tolerance and 
                    abs(u.co.y - v.co.y) < tolerance and 
                    abs(u.co.z - v.co.z) < tolerance):
                    symmetric_pairs += 1
                    mirror_found = True
                    break
            if not mirror_found:
                asymmetric_vertices.append(v)
    
    print(f"対称的な頂点ペア: {symmetric_pairs}")
    print(f"非対称な頂点: {len(asymmetric_vertices)}")
    
    # 3. 表面の曲率分析（顔の凸凹）
    print("\n【3. 表面の曲率分析】")
    
    # 隣接頂点との角度を計算して凸凹を推定
    convex_regions = defaultdict(list)  # 凸領域
    concave_regions = defaultdict(list)  # 凹領域
    
    # メッシュのエッジ情報を使用
    for edge in mesh.edges[:1000]:  # サンプリング
        v1 = vertices[edge.vertices[0]]
        v2 = vertices[edge.vertices[1]]
        
        # エッジの中点
        mid_point = (v1.co + v2.co) / 2
        
        # 中点から重心への方向
        to_center = (mid_point - mathutils.Vector((center_x, center_y, center_z))).normalized()
        
        # エッジの法線方向（簡易計算）
        edge_normal = (v2.co - v1.co).normalized()
        
        # Z座標でグループ化
        z_group = int(mid_point.z * 10) / 10
        
        # 簡易的な凸凹判定
        if mid_point.y < center_y:  # 前面
            if mid_point.z > 0:
                convex_regions[z_group].append(mid_point)
            else:
                concave_regions[z_group].append(mid_point)
    
    # 4. 解剖学的ランドマークの推定
    print("\n【4. 解剖学的ランドマークの推定】")
    
    # 顔の前面の頂点を収集
    front_vertices = [(i, v) for i, v in enumerate(vertices) if v.co.y < center_y - 0.2]
    
    if front_vertices:
        # Z座標でソート
        front_vertices.sort(key=lambda x: x[1].co.z, reverse=True)
        
        # 高さ別にグループ化
        height_groups = defaultdict(list)
        for i, v in front_vertices:
            z_group = int(v.co.z * 5) / 5  # 0.2単位
            height_groups[z_group].append((i, v))
        
        print("\n解剖学的部位の推定（前面のみ）:")
        
        # 各高さグループの分析
        for z_val in sorted(height_groups.keys(), reverse=True):
            group = height_groups[z_val]
            
            # グループ内の平均Y座標（前後位置）
            avg_y = sum(v.co.y for _, v in group) / len(group)
            
            # X座標の分散（幅）
            x_coords = [v.co.x for _, v in group]
            if x_coords:
                x_min, x_max = min(x_coords), max(x_coords)
                width = x_max - x_min
            else:
                width = 0
            
            # 解剖学的部位の推定
            if z_val > 0.6:
                part = "前頭部（Frontal）"
            elif z_val > 0.4:
                part = "眉間（Glabella）"
            elif z_val > 0.2:
                part = "眼窩上縁（Supraorbital）"
            elif z_val > 0.0:
                part = "鼻根（Nasion）"
            elif z_val > -0.2:
                part = "鼻尖・鼻翼（Nasal tip/Ala）"
            elif z_val > -0.4:
                part = "人中・上唇（Philtrum/Upper lip）"
            elif z_val > -0.6:
                part = "下唇・オトガイ（Lower lip/Chin）"
            else:
                part = "下顎（Mandible）"
            
            print(f"\nZ={z_val:.1f}: {len(group)}頂点")
            print(f"  推定部位: {part}")
            print(f"  平均Y座標: {avg_y:.3f}")
            print(f"  幅: {width:.3f}")
    
    # 5. 口の解剖学的位置の特定
    print("\n\n【5. 口の解剖学的位置の特定】")
    
    # 解剖学的に口は：
    # - 鼻の下、オトガイの上
    # - 顔の前面
    # - 左右対称
    
    # 前面かつ適切な高さの頂点を探す
    mouth_candidates = []
    
    for i, v in enumerate(vertices):
        # 解剖学的な口の条件
        if (v.co.y < center_y - 0.3 and  # 前面（重心より前）
            -0.5 < v.co.z < 0.0 and      # 鼻の下、顎の上
            abs(v.co.x) < 0.4):          # 中央付近
            
            mouth_candidates.append((i, v))
    
    if mouth_candidates:
        # Y座標でグループ化
        y_groups = defaultdict(list)
        for i, v in mouth_candidates:
            y_group = int(v.co.y * 10) / 10
            y_groups[y_group].append((i, v))
        
        print("前面の頂点分布（Y座標別）:")
        for y_val in sorted(y_groups.keys()):
            group = y_groups[y_val]
            
            # Z座標の分布
            z_coords = [v.co.z for _, v in group]
            if z_coords:
                z_min, z_max = min(z_coords), max(z_coords)
                z_avg = sum(z_coords) / len(z_coords)
                
                print(f"\nY≈{y_val:.1f}: {len(group)}頂点")
                print(f"  Z範囲: {z_min:.3f} 〜 {z_max:.3f}")
                print(f"  Z平均: {z_avg:.3f}")
                
                # 口の可能性を評価
                if -0.3 < z_avg < -0.1:
                    print(f"  → 口の可能性: 高")
                elif -0.1 < z_avg < 0.0:
                    print(f"  → 鼻の可能性: 高")
                elif z_avg < -0.3:
                    print(f"  → 顎の可能性: 高")
    
    # 6. 3D空間での口の探索
    print("\n【6. 3D空間での口の探索】")
    
    # 異なるY座標での断面分析
    y_slices = [-0.7, -0.6, -0.5, -0.4, -0.3, -0.2, -0.1, 0.0, 0.1]
    
    for y_slice in y_slices:
        # Y座標付近の頂点を収集
        slice_vertices = [v for v in vertices if abs(v.co.y - y_slice) < 0.05]
        
        if slice_vertices:
            # Z座標の分布を分析
            z_coords = [v.co.z for v in slice_vertices]
            z_min, z_max = min(z_coords), max(z_coords)
            
            # 口の高さ（-0.3 < z < -0.1）の頂点数
            mouth_height_count = sum(1 for z in z_coords if -0.3 < z < -0.1)
            
            print(f"\nY={y_slice:.1f}の断面:")
            print(f"  頂点数: {len(slice_vertices)}")
            print(f"  Z範囲: {z_min:.2f} 〜 {z_max:.2f}")
            print(f"  口の高さの頂点: {mouth_height_count}")
            
            if mouth_height_count > 50:
                print(f"  → 口がある可能性: 高")
    
    print("\n" + "="*60)