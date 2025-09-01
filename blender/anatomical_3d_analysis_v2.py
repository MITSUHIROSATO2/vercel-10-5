"""
解剖学的な観点から3次元で顔の構造を分析（修正版）
"""
import bpy
import math
from collections import defaultdict

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
    
    # 2. 対称性分析
    print("\n【2. 対称性分析】")
    
    # 中心線からの距離で分析
    left_side = [v for v in vertices if v.co.x < -0.05]
    right_side = [v for v in vertices if v.co.x > 0.05]
    center_line = [v for v in vertices if -0.05 <= v.co.x <= 0.05]
    
    print(f"左側: {len(left_side)}頂点")
    print(f"右側: {len(right_side)}頂点")
    print(f"中央: {len(center_line)}頂点")
    print(f"左右の差: {abs(len(left_side) - len(right_side))}頂点")
    
    # 3. 解剖学的ランドマークの推定
    print("\n【3. 解剖学的ランドマークの推定】")
    
    # Y軸の分位点を計算
    y_coords = sorted([v.co.y for v in vertices])
    y_percentiles = {
        'P10': y_coords[int(len(y_coords) * 0.1)],
        'P25': y_coords[int(len(y_coords) * 0.25)],
        'P50': y_coords[int(len(y_coords) * 0.5)],
        'P75': y_coords[int(len(y_coords) * 0.75)],
        'P90': y_coords[int(len(y_coords) * 0.9)]
    }
    
    print("\nY座標の分位点:")
    for name, value in y_percentiles.items():
        print(f"  {name}: {value:.3f}")
    
    # 最前面10%の頂点を分析
    front_threshold = y_percentiles['P10']
    front_vertices = [v for v in vertices if v.co.y < front_threshold]
    
    print(f"\n最前面10%の頂点（Y < {front_threshold:.3f}）: {len(front_vertices)}個")
    
    # 4. 高さ別の解剖学的分析
    print("\n【4. 高さ別の解剖学的分析】")
    
    # Z座標で10分割
    z_coords = [v.co.z for v in vertices]
    z_min, z_max = min(z_coords), max(z_coords)
    z_step = (z_max - z_min) / 10
    
    print("\n前面頂点の高さ別分布:")
    print("Z範囲      頂点数  推定部位")
    print("-" * 50)
    
    for i in range(10):
        z_start = z_max - (i + 1) * z_step
        z_end = z_max - i * z_step
        
        # この高さ範囲の前面頂点
        count = sum(1 for v in front_vertices if z_start <= v.co.z < z_end)
        
        # 解剖学的部位の推定
        z_center = (z_start + z_end) / 2
        if z_center > 0.5:
            part = "頭頂部"
        elif z_center > 0.3:
            part = "額"
        elif z_center > 0.1:
            part = "眉・目"
        elif z_center > -0.1:
            part = "鼻"
        elif z_center > -0.3:
            part = "口" # ← ここが重要
        elif z_center > -0.5:
            part = "顎"
        else:
            part = "首"
        
        print(f"{z_start:6.2f}〜{z_end:5.2f}  {count:6d}  {part}")
    
    # 5. 口の位置の詳細分析
    print("\n【5. 口の位置の詳細分析】")
    
    # 解剖学的に口は鼻の下、顎の上
    mouth_z_range = (-0.3, -0.1)
    
    # 異なるY座標での口の候補を探す
    print("\nY座標別の口候補分析:")
    print("Y座標   口の高さの頂点数  X座標範囲")
    print("-" * 50)
    
    y_values = sorted(set(int(v.co.y * 20) / 20 for v in vertices))
    
    for y_val in y_values:
        # このY座標付近の頂点
        y_vertices = [v for v in vertices if abs(v.co.y - y_val) < 0.025]
        
        # 口の高さの頂点
        mouth_height_vertices = [v for v in y_vertices 
                               if mouth_z_range[0] < v.co.z < mouth_z_range[1]]
        
        if mouth_height_vertices:
            x_coords = [v.co.x for v in mouth_height_vertices]
            x_min, x_max = min(x_coords), max(x_coords)
            
            print(f"{y_val:6.2f}  {len(mouth_height_vertices):15d}  {x_min:.2f} 〜 {x_max:.2f}")
    
    # 6. 3D座標での口の特定
    print("\n【6. 3D座標での口の特定】")
    
    # 各Y座標での断面を詳細に分析
    significant_y_values = []
    
    for y_val in y_values:
        y_vertices = [v for v in vertices if abs(v.co.y - y_val) < 0.025]
        mouth_vertices = [v for v in y_vertices 
                         if mouth_z_range[0] < v.co.z < mouth_z_range[1] and
                         abs(v.co.x) < 0.3]
        
        if len(mouth_vertices) > 100:  # 十分な数の頂点がある
            significant_y_values.append((y_val, len(mouth_vertices)))
    
    if significant_y_values:
        print("\n口の可能性が高いY座標:")
        for y_val, count in sorted(significant_y_values, key=lambda x: x[1], reverse=True)[:5]:
            print(f"  Y={y_val:.2f}: {count}頂点")
    
    # 7. 最終的な口の位置推定
    print("\n【7. 最終的な口の位置推定】")
    
    # 最も可能性の高い口の位置を特定
    if significant_y_values:
        best_y = significant_y_values[0][0]
        
        # その位置での頂点を詳しく分析
        mouth_vertices = [v for v in vertices 
                         if abs(v.co.y - best_y) < 0.05 and
                         mouth_z_range[0] < v.co.z < mouth_z_range[1] and
                         abs(v.co.x) < 0.3]
        
        if mouth_vertices:
            # 統計情報
            x_coords = [v.co.x for v in mouth_vertices]
            y_coords_mouth = [v.co.y for v in mouth_vertices]
            z_coords_mouth = [v.co.z for v in mouth_vertices]
            
            print(f"\n推定される口の位置:")
            print(f"  Y座標: {min(y_coords_mouth):.3f} 〜 {max(y_coords_mouth):.3f}")
            print(f"  Z座標: {min(z_coords_mouth):.3f} 〜 {max(z_coords_mouth):.3f}")
            print(f"  X座標: {min(x_coords):.3f} 〜 {max(x_coords):.3f}")
            print(f"  頂点数: {len(mouth_vertices)}")
    
    print("\n" + "="*60)