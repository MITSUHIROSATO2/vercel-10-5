#!/usr/bin/env python3
"""
ClassicMan.blendのマテリアルを完全に修正してGLBエクスポート
マテリアルの色を確実に反映させるバージョン
"""

import bpy
import os

def clean_and_setup_materials():
    """すべてのマテリアルをクリーンアップして再設定"""
    
    print("=== マテリアル完全修正開始 ===")
    
    # マテリアル設定マップ
    material_colors = {
        'skin': (0.95, 0.8, 0.7, 1.0),      # 肌色
        'hair': (0.08, 0.06, 0.05, 1.0),    # 黒髪
        'eye': (0.3, 0.2, 0.1, 1.0),        # 茶色の虹彩
        'teeth': (0.95, 0.92, 0.88, 1.0),   # 歯
        'tongue': (0.8, 0.4, 0.4, 1.0),     # 舌
        'nail': (0.95, 0.85, 0.8, 1.0),     # 爪
        'lash': (0.05, 0.04, 0.03, 1.0),    # まつ毛
        'shirt': (0.3, 0.5, 0.7, 1.0),      # 青いシャツ
        'pant': (0.9, 0.9, 0.9, 1.0),       # 白いパンツ
        'shoe': (0.2, 0.15, 0.1, 1.0),      # 茶色の靴
    }
    
    # すべてのメッシュオブジェクトを処理
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            print(f"\nオブジェクト処理: {obj.name}")
            
            # メッシュにマテリアルがない場合は追加
            if len(obj.data.materials) == 0:
                # オブジェクト名から適切なマテリアルを推測
                obj_lower = obj.name.lower()
                mat_type = 'skin'  # デフォルト
                
                for key in material_colors.keys():
                    if key in obj_lower:
                        mat_type = key
                        break
                
                # 新規マテリアル作成
                mat_name = f"Material_{obj.name}"
                mat = bpy.data.materials.new(name=mat_name)
                mat.use_nodes = True
                obj.data.materials.append(mat)
                print(f"  新規マテリアル作成: {mat_name} (タイプ: {mat_type})")
            
            # 各マテリアルスロットを処理
            for slot_idx, slot in enumerate(obj.material_slots):
                if not slot.material:
                    continue
                    
                mat = slot.material
                mat_lower = mat.name.lower()
                obj_lower = obj.name.lower()
                
                print(f"  マテリアル処理: {mat.name}")
                
                # ノードを有効化
                mat.use_nodes = True
                nodes = mat.node_tree.nodes
                links = mat.node_tree.links
                
                # 既存のノードをクリア
                nodes.clear()
                
                # 新しいPrincipled BSDFとOutput作成
                principled = nodes.new(type='ShaderNodeBsdfPrincipled')
                principled.location = (0, 0)
                output = nodes.new(type='ShaderNodeOutputMaterial')
                output.location = (300, 0)
                
                # 接続
                links.new(principled.outputs['BSDF'], output.inputs['Surface'])
                
                # マテリアルタイプを判定
                mat_type = None
                
                # オブジェクト名とマテリアル名から判定
                combined_name = f"{obj_lower} {mat_lower}"
                
                # 優先順位の高い順に判定
                if any(x in combined_name for x in ['nug_base_body', 'head', 'face', 'body', 'skin', 'arm', 'leg', 'hand', 'foot']):
                    mat_type = 'skin'
                elif any(x in combined_name for x in ['hair', 'beard', 'eyebrow', 'mustache']):
                    mat_type = 'hair'
                elif any(x in combined_name for x in ['cornea', 'sclera', 'iris', 'eye']) and not 'lash' in combined_name:
                    if 'cornea' in combined_name:
                        mat_type = 'cornea'
                    else:
                        mat_type = 'eye'
                elif any(x in combined_name for x in ['teeth', 'tooth']):
                    mat_type = 'teeth'
                elif any(x in combined_name for x in ['tongue']):
                    mat_type = 'tongue'
                elif any(x in combined_name for x in ['nail']):
                    mat_type = 'nail'
                elif any(x in combined_name for x in ['lash', 'eyelash']):
                    mat_type = 'lash'
                elif any(x in combined_name for x in ['shirt', 'fit_shirt', 'top', 'tshirt']):
                    mat_type = 'shirt'
                elif any(x in combined_name for x in ['pant', 'trouser', 'bottom', 'jean']):
                    mat_type = 'pant'
                elif any(x in combined_name for x in ['shoe', 'boot', 'sneaker']):
                    mat_type = 'shoe'
                else:
                    # デフォルトは肌色
                    mat_type = 'skin'
                
                # 色を設定
                if mat_type == 'cornea':
                    # 角膜は透明
                    principled.inputs['Base Color'].default_value = (1.0, 1.0, 1.0, 1.0)
                    principled.inputs['Roughness'].default_value = 0.0
                    principled.inputs['Metallic'].default_value = 0.0
                    principled.inputs['Alpha'].default_value = 0.1
                    if 'Transmission Weight' in principled.inputs:
                        principled.inputs['Transmission Weight'].default_value = 0.95
                    mat.blend_method = 'BLEND'
                    print(f"    -> 角膜（透明）設定")
                elif mat_type in material_colors:
                    color = material_colors[mat_type]
                    principled.inputs['Base Color'].default_value = color
                    
                    # マテリアルタイプ別のラフネス設定
                    roughness_map = {
                        'skin': 0.5,
                        'hair': 0.6,
                        'eye': 0.2,
                        'teeth': 0.2,
                        'tongue': 0.7,
                        'nail': 0.2,
                        'lash': 0.8,
                        'shirt': 0.8,
                        'pant': 0.8,
                        'shoe': 0.4,
                    }
                    
                    principled.inputs['Roughness'].default_value = roughness_map.get(mat_type, 0.5)
                    principled.inputs['Metallic'].default_value = 0.0
                    
                    # 肌にはサブサーフェス追加
                    if mat_type == 'skin':
                        if 'Subsurface Weight' in principled.inputs:
                            principled.inputs['Subsurface Weight'].default_value = 0.1
                        elif 'Subsurface' in principled.inputs:
                            principled.inputs['Subsurface'].default_value = 0.1
                        if 'Subsurface Radius' in principled.inputs:
                            principled.inputs['Subsurface Radius'].default_value = (1.0, 0.3, 0.1)
                    
                    print(f"    -> {mat_type}色設定: RGB{color[:3]}")
                
                # ブレンドモード設定
                if mat_type in ['lash', 'hair']:
                    mat.blend_method = 'BLEND'
                    mat.show_transparent_back = False
                else:
                    mat.blend_method = 'OPAQUE'
                
                # マテリアル更新
                mat.use_backface_culling = False
    
    print("\n=== マテリアル修正完了 ===")

def export_glb():
    """GLB形式でエクスポート"""
    
    # 出力パス
    blend_path = bpy.data.filepath
    if not blend_path:
        print("❌ Blendファイルが保存されていません")
        return False
    
    output_path = blend_path.replace('.blend', '_materials_fixed.glb')
    
    print(f"\nエクスポート先: {output_path}")
    
    # エクスポート設定
    try:
        # すべてのオブジェクトを選択
        bpy.ops.object.select_all(action='SELECT')
        
        # GLBエクスポート（最新の設定）
        bpy.ops.export_scene.gltf(
            filepath=output_path,
            export_format='GLB',
            export_keep_originals=False,
            export_texcoords=True,
            export_normals=True,
            export_tangents=True,
            export_materials='EXPORT',
            export_image_format='AUTO',
            export_texture_dir='',
            export_jpeg_quality=75,
            export_animations=True,
            export_frame_range=True,
            export_frame_step=1,
            export_force_sampling=True,
            export_animation_mode='ACTIONS',
            export_nla_strips_merged_animation_name='Animation',
            export_morph=True,
            export_morph_normal=True,
            export_morph_tangent=False,
            export_skins=True,
            export_all_influences=False,
            export_colors=True,
            export_attributes=False,
            use_mesh_edges=False,
            use_mesh_vertices=False,
            export_cameras=False,
            use_selection=False,
            use_visible=False,
            use_renderable=False,
            use_active_collection_with_nested=True,
            use_active_collection=False,
            use_active_scene=False,
            export_extras=False,
            export_yup=True,
            export_apply=True,
            export_optimize_animation_size=False,
            export_optimize_animation_keep_anim_armature=True,
            export_optimize_animation_keep_anim_object=False,
            export_negative_frame='CROP',
            export_anim_slide_to_zero=False,
            export_bake_animation=False,
            export_anim_single_armature=True,
            export_reset_pose_bones=True,
            export_current_frame=False,
            export_rest_position_armature=True,
            export_anim_scene_split_object=True,
            export_def_bones=False,
            export_hierarchy_flatten_bones=False,
            export_armature_object_name=False,
            export_leaf_bone=False,
            export_normalize_weights=False,
            export_try_sparse_sk=True,
            export_try_omit_sparse_sk=False,
            export_gpu_instances=False
        )
        
        print("✅ エクスポート成功！")
        print(f"ファイル: {os.path.basename(output_path)}")
        file_size = os.path.getsize(output_path) / (1024 * 1024)
        print(f"サイズ: {file_size:.1f} MB")
        return True
        
    except Exception as e:
        print(f"❌ エクスポートエラー: {e}")
        
        # 簡略化したエクスポートを試す
        try:
            print("\n簡略化したエクスポートを試行中...")
            bpy.ops.export_scene.gltf(
                filepath=output_path,
                export_format='GLB'
            )
            print("✅ 簡略エクスポート成功！")
            return True
        except Exception as e2:
            print(f"❌ 簡略エクスポートも失敗: {e2}")
            return False

def main():
    print("=" * 50)
    print("ClassicMan マテリアル完全修正スクリプト")
    print("=" * 50)
    
    # ファイル情報
    print(f"\nBlendファイル: {bpy.data.filepath}")
    print(f"Blenderバージョン: {bpy.app.version_string}")
    print(f"オブジェクト数: {len([o for o in bpy.data.objects if o.type == 'MESH'])}")
    print(f"マテリアル数: {len(bpy.data.materials)}")
    
    # マテリアル修正
    clean_and_setup_materials()
    
    # テクスチャをパック（存在する場合）
    try:
        bpy.ops.file.pack_all()
        print("\nテクスチャをパックしました")
    except:
        print("\nテクスチャのパックをスキップ")
    
    # エクスポート
    success = export_glb()
    
    if success:
        print("\n" + "=" * 50)
        print("✅ 処理完了！")
        print("ClassicMan_materials_fixed.glbが作成されました")
        print("=" * 50)
    else:
        print("\n❌ 処理失敗")

if __name__ == "__main__":
    main()