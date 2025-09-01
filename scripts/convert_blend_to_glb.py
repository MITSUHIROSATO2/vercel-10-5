#!/usr/bin/env python3
"""
Blender Python Script to convert .blend file to .glb with proper materials
Run this script in Blender or via command line:
blender ClassicMan.blend --background --python convert_blend_to_glb.py
"""

import bpy
import os
import sys

def setup_materials():
    """マテリアルをglTF互換に設定"""
    for mat in bpy.data.materials:
        if mat.use_nodes:
            nodes = mat.node_tree.nodes
            
            # Principled BSDFノードを探す
            principled = None
            for node in nodes:
                if node.type == 'BSDF_PRINCIPLED':
                    principled = node
                    break
            
            # Principled BSDFがない場合は作成
            if not principled:
                # 既存のノードをクリア
                nodes.clear()
                
                # Principled BSDFを追加
                principled = nodes.new(type='ShaderNodeBsdfPrincipled')
                principled.location = (0, 0)
                
                # Material Outputを追加
                output = nodes.new(type='ShaderNodeOutputMaterial')
                output.location = (300, 0)
                
                # 接続
                mat.node_tree.links.new(principled.outputs['BSDF'], output.inputs['Surface'])
            
            # デフォルトカラーを設定（必要に応じて調整）
            if mat.name.lower().find('skin') >= 0 or mat.name.lower().find('body') >= 0:
                principled.inputs['Base Color'].default_value = (1.0, 0.85, 0.7, 1.0)  # 肌色
                principled.inputs['Roughness'].default_value = 0.5
                principled.inputs['Metallic'].default_value = 0.0
            elif mat.name.lower().find('hair') >= 0:
                principled.inputs['Base Color'].default_value = (0.15, 0.08, 0.05, 1.0)  # 髪色
                principled.inputs['Roughness'].default_value = 0.7
                principled.inputs['Metallic'].default_value = 0.0
            elif mat.name.lower().find('eye') >= 0:
                principled.inputs['Base Color'].default_value = (0.2, 0.3, 0.4, 1.0)  # 目の色
                principled.inputs['Roughness'].default_value = 0.2
                principled.inputs['Metallic'].default_value = 0.0
            elif mat.name.lower().find('cloth') >= 0 or mat.name.lower().find('shirt') >= 0:
                principled.inputs['Base Color'].default_value = (0.3, 0.5, 0.8, 1.0)  # 服の色
                principled.inputs['Roughness'].default_value = 0.8
                principled.inputs['Metallic'].default_value = 0.0
            else:
                # デフォルト
                principled.inputs['Base Color'].default_value = (0.5, 0.5, 0.5, 1.0)
                principled.inputs['Roughness'].default_value = 0.5
                principled.inputs['Metallic'].default_value = 0.0

def pack_textures():
    """テクスチャをパック"""
    try:
        bpy.ops.file.pack_all()
        print("テクスチャをパックしました")
    except:
        print("テクスチャのパックをスキップ")

def export_glb(output_path):
    """GLB形式でエクスポート"""
    
    # マテリアルを設定
    setup_materials()
    
    # テクスチャをパック
    pack_textures()
    
    # エクスポート設定
    export_settings = {
        'filepath': output_path,
        'export_format': 'GLB',  # バイナリ形式
        
        # Include
        'use_selection': False,  # すべてのオブジェクトをエクスポート
        'use_visible': False,  # 非表示も含む
        'use_renderable': False,
        'use_active_collection': False,
        'use_active_scene': False,
        
        # Transform
        'export_yup': True,  # Y軸を上に
        
        # Geometry
        'export_apply': True,  # モディファイアを適用
        'export_texcoords': True,  # UV座標
        'export_normals': True,  # 法線
        'export_tangents': True,  # 接線
        'export_vertex_colors': True,  # 頂点カラー（Blender 4.x用）
        'export_attributes': False,
        'use_mesh_edges': False,
        'use_mesh_vertices': False,
        
        # Material
        'export_materials': 'EXPORT',  # マテリアルをエクスポート
        'export_image_format': 'AUTO',  # 自動でテクスチャ形式を決定
        'export_texture_dir': '',  # GLBに埋め込み
        'export_jpeg_quality': 85,
        'export_keep_originals': False,
        
        # Animation
        'export_animations': True,  # アニメーション
        'export_frame_range': True,
        'export_frame_step': 1,
        'export_force_sampling': True,
        'export_nla_strips': True,
        'export_def_bones': True,
        'export_optimize_animation_size': False,
        
        # Shape Keys
        'export_morph': True,  # シェイプキー（モーフターゲット）
        'export_morph_normal': True,
        'export_morph_tangent': False,
        
        # Skinning
        'export_skins': True,  # スキニング
        'export_all_influences': False,
        'export_rest_position_armature': True,
        
        # その他
        'export_extras': False,
        'export_cameras': False,
        'export_lights': False,
        'export_copyright': 'Dental AI Simulator'
    }
    
    # エクスポート実行
    try:
        bpy.ops.export_scene.gltf(**export_settings)
        print(f"エクスポート成功: {output_path}")
        return True
    except Exception as e:
        print(f"エクスポートエラー: {e}")
        return False

def main():
    """メイン処理"""
    # Blendファイルのパス
    blend_file = bpy.data.filepath
    if not blend_file:
        print("エラー: Blendファイルが保存されていません")
        return
    
    # 出力パス（同じディレクトリにGLBファイルを作成）
    output_path = blend_file.replace('.blend', '_converted.glb')
    
    print(f"変換開始: {blend_file} -> {output_path}")
    
    # エクスポート実行
    success = export_glb(output_path)
    
    if success:
        print(f"\n✅ 変換完了！")
        print(f"出力ファイル: {output_path}")
        print("\nThree.jsでの使用例:")
        print("```javascript")
        print("const loader = new GLTFLoader();")
        print(f"loader.load('{os.path.basename(output_path)}', (gltf) => {{")
        print("  scene.add(gltf.scene);")
        print("});")
        print("```")
    else:
        print("\n❌ 変換失敗")
        sys.exit(1)

if __name__ == "__main__":
    main()