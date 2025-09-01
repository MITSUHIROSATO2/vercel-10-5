#!/usr/bin/env python3
"""
Blenderファイルをglb形式にエクスポートするスクリプト
"""

import bpy
import sys
import os

def export_avatar_to_glb():
    # 引数からBlenderファイルのパスを取得
    if len(sys.argv) < 6:
        print("Usage: blender --background --python export_blender_avatar.py -- input.blend output.glb")
        sys.exit(1)
    
    input_path = sys.argv[5]
    output_path = sys.argv[6]
    
    # Blenderファイルを開く
    bpy.ops.wm.open_mainfile(filepath=input_path)
    
    # シーン内のすべてのオブジェクトを選択
    bpy.ops.object.select_all(action='SELECT')
    
    # GLB形式でエクスポート
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        export_selected=False,
        export_apply=True,
        export_animations=True,
        export_morph=True,
        export_skins=True,
        export_materials='EXPORT',
        export_colors=True,
        export_cameras=False,
        export_lights=False,
        export_extras=True,
        export_yup=True,
        export_tangents=True,
        export_normals=True,
        export_draco_mesh_compression_enable=False,
        export_optimize_animation_size=True
    )
    
    print(f"Successfully exported {input_path} to {output_path}")

if __name__ == "__main__":
    export_avatar_to_glb()