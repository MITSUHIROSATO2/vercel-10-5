#!/usr/bin/env python3
"""
ClassicMan.blendのマテリアルを修正してGLBエクスポート
"""

import bpy
import os

def fix_and_export():
    """マテリアルを修正してエクスポート"""
    
    print("=== マテリアル修正開始 ===")
    
    # すべてのメッシュオブジェクトを処理
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            print(f"\nオブジェクト: {obj.name}")
            
            # メッシュにマテリアルがない場合は新規作成
            if len(obj.data.materials) == 0:
                mat_name = f"Material_{obj.name}"
                mat = bpy.data.materials.new(name=mat_name)
                mat.use_nodes = True
                obj.data.materials.append(mat)
                print(f"  新規マテリアル作成: {mat_name}")
            
            # 各マテリアルを処理
            for slot in obj.material_slots:
                if slot.material:
                    mat = slot.material
                    print(f"  マテリアル: {mat.name}")
                    
                    if mat.use_nodes:
                        nodes = mat.node_tree.nodes
                        links = mat.node_tree.links
                        
                        # Principled BSDFを取得または作成
                        principled = None
                        for node in nodes:
                            if node.type == 'BSDF_PRINCIPLED':
                                principled = node
                                break
                        
                        if not principled:
                            # ノードをクリアして新規作成
                            nodes.clear()
                            principled = nodes.new(type='ShaderNodeBsdfPrincipled')
                            principled.location = (0, 0)
                            output = nodes.new(type='ShaderNodeOutputMaterial')
                            output.location = (300, 0)
                            links.new(principled.outputs['BSDF'], output.inputs['Surface'])
                            print(f"    Principled BSDF作成")
                        
                        # オブジェクト名とマテリアル名から適切な色を設定
                        obj_lower = obj.name.lower()
                        mat_lower = mat.name.lower()
                        
                        # 頭部・顔
                        if any(x in obj_lower or x in mat_lower for x in ['head', 'face', 'body', 'skin']):
                            # 肌色
                            principled.inputs['Base Color'].default_value = (0.95, 0.8, 0.7, 1.0)
                            principled.inputs['Roughness'].default_value = 0.5
                            principled.inputs['Metallic'].default_value = 0.0
                            principled.inputs['Subsurface Weight'].default_value = 0.1
                            principled.inputs['Subsurface Color'].default_value = (0.9, 0.7, 0.6, 1.0)
                            print(f"    -> 肌色設定")
                            
                        # 髪
                        elif any(x in obj_lower or x in mat_lower for x in ['hair', 'beard', 'eyebrow', 'mustache']):
                            # 暗い茶色/黒髪
                            principled.inputs['Base Color'].default_value = (0.08, 0.06, 0.05, 1.0)
                            principled.inputs['Roughness'].default_value = 0.6
                            principled.inputs['Metallic'].default_value = 0.0
                            print(f"    -> 髪色設定")
                            
                        # 目
                        elif any(x in obj_lower or x in mat_lower for x in ['eye', 'iris', 'cornea']):
                            if 'sclera' in mat_lower or 'white' in mat_lower:
                                # 白目
                                principled.inputs['Base Color'].default_value = (0.95, 0.95, 0.95, 1.0)
                                principled.inputs['Roughness'].default_value = 0.3
                            elif 'pupil' in mat_lower:
                                # 瞳孔
                                principled.inputs['Base Color'].default_value = (0.02, 0.02, 0.02, 1.0)
                                principled.inputs['Roughness'].default_value = 0.1
                            else:
                                # 虹彩（茶色）
                                principled.inputs['Base Color'].default_value = (0.3, 0.2, 0.1, 1.0)
                                principled.inputs['Roughness'].default_value = 0.2
                            principled.inputs['Metallic'].default_value = 0.0
                            print(f"    -> 目の色設定")
                            
                        # 歯
                        elif any(x in obj_lower or x in mat_lower for x in ['teeth', 'tooth']):
                            principled.inputs['Base Color'].default_value = (0.95, 0.92, 0.88, 1.0)
                            principled.inputs['Roughness'].default_value = 0.2
                            principled.inputs['Metallic'].default_value = 0.0
                            print(f"    -> 歯の色設定")
                            
                        # 舌
                        elif any(x in obj_lower or x in mat_lower for x in ['tongue']):
                            principled.inputs['Base Color'].default_value = (0.8, 0.4, 0.4, 1.0)
                            principled.inputs['Roughness'].default_value = 0.7
                            principled.inputs['Metallic'].default_value = 0.0
                            print(f"    -> 舌の色設定")
                            
                        # シャツ
                        elif any(x in obj_lower or x in mat_lower for x in ['shirt', 'fit_shirt', 'top']):
                            principled.inputs['Base Color'].default_value = (0.3, 0.5, 0.7, 1.0)  # 青いシャツ
                            principled.inputs['Roughness'].default_value = 0.8
                            principled.inputs['Metallic'].default_value = 0.0
                            print(f"    -> シャツの色設定")
                            
                        # パンツ
                        elif any(x in obj_lower or x in mat_lower for x in ['pant', 'trouser', 'bottom']):
                            principled.inputs['Base Color'].default_value = (0.9, 0.9, 0.9, 1.0)  # 白いパンツ
                            principled.inputs['Roughness'].default_value = 0.8
                            principled.inputs['Metallic'].default_value = 0.0
                            print(f"    -> パンツの色設定")
                            
                        # 靴
                        elif any(x in obj_lower or x in mat_lower for x in ['shoe', 'boot']):
                            principled.inputs['Base Color'].default_value = (0.2, 0.15, 0.1, 1.0)  # 茶色の靴
                            principled.inputs['Roughness'].default_value = 0.4
                            principled.inputs['Metallic'].default_value = 0.0
                            print(f"    -> 靴の色設定")
                        
                        # その他（グレー）
                        else:
                            # 白くならないようにグレーに設定
                            if principled.inputs['Base Color'].default_value[:3] == (0.8, 0.8, 0.8):
                                principled.inputs['Base Color'].default_value = (0.5, 0.5, 0.5, 1.0)
                                principled.inputs['Roughness'].default_value = 0.5
                                principled.inputs['Metallic'].default_value = 0.0
                                print(f"    -> デフォルト色設定")
    
    # テクスチャをパック
    try:
        bpy.ops.file.pack_all()
        print("\nテクスチャをパックしました")
    except:
        print("\nテクスチャのパックをスキップ")
    
    # エクスポート設定
    output_path = bpy.data.filepath.replace('.blend', '_fixed.glb')
    
    print(f"\nエクスポート先: {output_path}")
    
    # GLBエクスポート
    try:
        bpy.ops.export_scene.gltf(
            filepath=output_path,
            export_format='GLB',
            export_keep_originals=False,
            export_texcoords=True,
            export_normals=True,
            export_tangents=True,
            export_materials='EXPORT',
            export_image_format='AUTO',
            export_animations=True,
            export_morph=True,
            export_skins=True,
            export_apply=True,
            export_yup=True
        )
        print(f"✅ エクスポート成功!")
        return True
    except Exception as e:
        print(f"❌ エクスポートエラー: {e}")
        return False

def main():
    print("ClassicMan マテリアル修正スクリプト")
    print("=" * 40)
    
    # 現在のファイル情報
    print(f"Blendファイル: {bpy.data.filepath}")
    print(f"オブジェクト数: {len(bpy.data.objects)}")
    print(f"マテリアル数: {len(bpy.data.materials)}")
    
    # マテリアル一覧
    print("\n現在のマテリアル:")
    for mat in bpy.data.materials:
        print(f"  - {mat.name}")
    
    # 修正とエクスポート
    success = fix_and_export()
    
    if success:
        print("\n✅ 処理完了！")
        print("ClassicMan_fixed.glbが作成されました")
    else:
        print("\n❌ 処理失敗")

if __name__ == "__main__":
    main()