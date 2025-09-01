"""
顔の構造を完全に把握するための詳細分析
"""
import bpy
import math
from collections import defaultdict

obj = bpy.data.objects.get('HighQualityFaceAvatar')

if obj:
    mesh = obj.data
    vertices = mesh.vertices
    
    print("=== 顔の構造の完全分析 ===\n")
    
    # 1. 基本情報
    print("【基本情報】")
    print(f"総頂点数: {len(vertices):,}")
    print(f"総エッジ数: {len(mesh.edges):,}")
    print(f"総面数: {len(mesh.polygons):,}")
    
    # 2. 座標系の分析
    print("\n【座標系の詳細分析】")
    
    # 各軸の統計
    x_coords = [v.co.x for v in vertices]
    y_coords = [v.co.y for v in vertices]
    z_coords = [v.co.z for v in vertices]
    
    print(f"\nX軸（左右）:")
    print(f"  最小: {min(x_coords):.3f}")
    print(f"  最大: {max(x_coords):.3f}")
    print(f"  中央値: {sorted(x_coords)[len(x_coords)//2]:.3f}")
    print(f"  平均: {sum(x_coords)/len(x_coords):.3f}")
    
    print(f"\nY軸（前後）:")
    print(f"  最小: {min(y_coords):.3f}")
    print(f"  最大: {max(y_coords):.3f}")
    print(f"  中央値: {sorted(y_coords)[len(y_coords)//2]:.3f}")
    print(f"  平均: {sum(y_coords)/len(y_coords):.3f}")
    
    print(f"\nZ軸（上下）:")
    print(f"  最小: {min(z_coords):.3f}")
    print(f"  最大: {max(z_coords):.3f}")
    print(f"  中央値: {sorted(z_coords)[len(z_coords)//2]:.3f}")
    print(f"  平均: {sum(z_coords)/len(z_coords):.3f}")
    
    # 3. 顔の向きを特定
    print("\n【顔の向きの特定】")
    
    # 対称性をチェック（左右の頂点数）
    left_count = sum(1 for x in x_coords if x < -0.05)
    right_count = sum(1 for x in x_coords if x > 0.05)
    center_count = sum(1 for x in x_coords if -0.05 <= x <= 0.05)
    
    print(f"\n左側頂点（X < -0.05）: {left_count:,}")
    print(f"中央頂点（-0.05 ≤ X ≤ 0.05）: {center_count:,}")
    print(f"右側頂点（X > 0.05）: {right_count:,}")
    
    # 4. 3D空間での頂点分布
    print("\n【3D空間での頂点分布】")
    
    # 8つの空間に分割
    octants = defaultdict(int)
    for v in vertices:
        x_sign = "+" if v.co.x >= 0 else "-"
        y_sign = "+" if v.co.y >= 0 else "-"
        z_sign = "+" if v.co.z >= 0 else "-"
        octants[f"X{x_sign}Y{y_sign}Z{z_sign}"] += 1
    
    print("\n空間別頂点数:")
    for octant, count in sorted(octants.items()):
        print(f"  {octant}: {count:,}頂点")
    
    # 5. 顔の主要部位の推定
    print("\n【顔の主要部位の推定】")
    
    # Y軸の最小値（最前面）付近の頂点を分析
    y_min = min(y_coords)
    front_vertices = [(i, v) for i, v in enumerate(vertices) if v.co.y < y_min + 0.1]
    
    if front_vertices:
        print(f"\n最前面の頂点群（Y < {y_min + 0.1:.2f}）: {len(front_vertices)}個")
        
        # Z座標で分類
        z_groups = defaultdict(list)
        for i, v in front_vertices:
            z_bucket = int(v.co.z * 10) / 10  # 0.1単位でグループ化
            z_groups[z_bucket].append((i, v))
        
        print("\n高さ別分布（最前面のみ）:")
        for z_val in sorted(z_groups.keys(), reverse=True):
            count = len(z_groups[z_val])
            # 部位推定
            if z_val > 0.5:
                part = "頭頂部"
            elif z_val > 0.3:
                part = "額"
            elif z_val > 0.1:
                part = "目・眉"
            elif z_val > -0.1:
                part = "鼻"
            elif z_val > -0.3:
                part = "口"
            elif z_val > -0.5:
                part = "顎"
            else:
                part = "首"
            
            print(f"  Z≈{z_val:.1f}: {count:3d}頂点 ({part})")
    
    # 6. 中心線上の頂点の詳細分析
    print("\n【中心線上の頂点分析】")
    
    centerline_vertices = [(i, v) for i, v in enumerate(vertices) if abs(v.co.x) < 0.02]
    print(f"\n中心線上の頂点（|X| < 0.02）: {len(centerline_vertices)}個")
    
    if centerline_vertices:
        # Y-Z平面での分布を可視化
        print("\nY-Z平面での分布:")
        
        # 10x10のグリッドで分布を表示
        grid_size = 10
        y_range = max(y_coords) - min(y_coords)
        z_range = max(z_coords) - min(z_coords)
        
        grid = [[0 for _ in range(grid_size)] for _ in range(grid_size)]
        
        for i, v in centerline_vertices:
            y_idx = int((v.co.y - min(y_coords)) / y_range * (grid_size - 1))
            z_idx = int((v.co.z - min(z_coords)) / z_range * (grid_size - 1))
            grid[grid_size - 1 - z_idx][y_idx] += 1
        
        print("\n   後 ← Y → 前")
        print("上 ┌" + "─" * (grid_size * 3) + "┐")
        for i, row in enumerate(grid):
            z_val = max(z_coords) - (i / (grid_size - 1)) * z_range
            row_str = "│"
            for count in row:
                if count == 0:
                    row_str += "   "
                elif count < 10:
                    row_str += f" {count} "
                else:
                    row_str += " * "
            print(f"Z  {row_str}│ {z_val:.1f}")
        print("下 └" + "─" * (grid_size * 3) + "┘")
        
        # Y値のラベル
        y_labels = "   "
        for i in range(grid_size):
            y_val = min(y_coords) + (i / (grid_size - 1)) * y_range
            if i == 0:
                y_labels += f"{y_val:.1f}"
            elif i == grid_size - 1:
                y_labels += f"  {y_val:.1f}"
        print(y_labels)
    
    # 7. 極値の頂点の詳細
    print("\n【極値の頂点の詳細】")
    
    # 各方向の極値頂点
    extremes = {
        "最左": min(vertices, key=lambda v: v.co.x),
        "最右": max(vertices, key=lambda v: v.co.x),
        "最前": min(vertices, key=lambda v: v.co.y),
        "最後": max(vertices, key=lambda v: v.co.y),
        "最下": min(vertices, key=lambda v: v.co.z),
        "最上": max(vertices, key=lambda v: v.co.z)
    }
    
    for name, v in extremes.items():
        print(f"\n{name}の頂点:")
        print(f"  座標: ({v.co.x:.3f}, {v.co.y:.3f}, {v.co.z:.3f})")
        
        # 近傍の頂点数を数える
        nearby = sum(1 for u in vertices if (v.co - u.co).length < 0.1)
        print(f"  近傍頂点数（距離<0.1）: {nearby}")
    
    # 8. 顔の向きの最終判定
    print("\n【顔の向きの最終判定】")
    
    # Y値が最小の領域の頂点の平均Z座標
    front_z_avg = sum(v.co.z for i, v in front_vertices) / len(front_vertices) if front_vertices else 0
    
    print(f"\n最前面の平均Z座標: {front_z_avg:.3f}")
    
    if front_z_avg > 0:
        print("→ 顔は上を向いている可能性")
    elif front_z_avg < -0.3:
        print("→ 顔は下を向いている可能性")
    else:
        print("→ 顔は正面を向いている")
    
    # Y軸の向き判定
    if min(y_coords) < -0.5:
        print("→ Y軸負の方向が顔の前面")
    else:
        print("→ Y軸正の方向が顔の前面")
    
    print("\n" + "="*60)