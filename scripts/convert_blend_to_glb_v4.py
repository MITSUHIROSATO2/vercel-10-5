#!/usr/bin/env python3
"""
Blender 4.x用 GLBエクスポートスクリプト
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
            
            # マテリアル名に基づいて色を設定
            mat_name = mat.name.lower()
            
            if 'skin' in mat_name or 'body' in mat_name or 'head' in mat_name:
                # 肌色
                principled.inputs['Base Color'].default_value = (1.0, 0.85, 0.7, 1.0)
                principled.inputs['Roughness'].default_value = 0.5
                principled.inputs['Metallic'].default_value = 0.0
            elif 'hair' in mat_name:
                # 髪色（黒髪）
                principled.inputs['Base Color'].default_value = (0.1, 0.08, 0.06, 1.0)
                principled.inputs['Roughness'].default_value = 0.6
                principled.inputs['Metallic'].default_value = 0.0
            elif 'eye' in mat_name:
                # 目の色
                if 'white' in mat_name or 'sclera' in mat_name:
                    principled.inputs['Base Color'].default_value = (0.95, 0.95, 0.95, 1.0)
                elif 'iris' in mat_name:
                    principled.inputs['Base Color'].default_value = (0.2, 0.3, 0.4, 1.0)
                elif 'pupil' in mat_name:
                    principled.inputs['Base Color'].default_value = (0.05, 0.05, 0.05, 1.0)
                else:
                    principled.inputs['Base Color'].default_value = (0.2, 0.3, 0.4, 1.0)
                principled.inputs['Roughness'].default_value = 0.1
                principled.inputs['Metallic'].default_value = 0.0
            elif 'cloth' in mat_name or 'shirt' in mat_name or 'pants' in mat_name:
                # 服の色（青系）
                principled.inputs['Base Color'].default_value = (0.2, 0.4, 0.7, 1.0)
                principled.inputs['Roughness'].default_value = 0.8
                principled.inputs['Metallic'].default_value = 0.0
            elif 'shoe' in mat_name:
                # 靴の色（茶色）
                principled.inputs['Base Color'].default_value = (0.3, 0.2, 0.1, 1.0)
                principled.inputs['Roughness'].default_value = 0.4
                principled.inputs['Metallic'].default_value = 0.0
            elif 'teeth' in mat_name or 'tooth' in mat_name:
                # 歯の色
                principled.inputs['Base Color'].default_value = (0.95, 0.92, 0.88, 1.0)
                principled.inputs['Roughness'].default_value = 0.2
                principled.inputs['Metallic'].default_value = 0.0
            elif 'tongue' in mat_name:
                # 舌の色
                principled.inputs['Base Color'].default_value = (0.8, 0.4, 0.4, 1.0)
                principled.inputs['Roughness'].default_value = 0.7
                principled.inputs['Metallic'].default_value = 0.0
            else:
                # デフォルト（グレー）
                principled.inputs['Base Color'].default_value = (0.5, 0.5, 0.5, 1.0)
                principled.inputs['Roughness'].default_value = 0.5
                principled.inputs['Metallic'].default_value = 0.0
    
    print(f"マテリアル設定完了: {len(bpy.data.materials)}個のマテリアルを処理")

def export_glb_simple(output_path):
    """シンプルなGLBエクスポート（Blender 4.x対応）"""
    
    # マテリアルを設定
    setup_materials()
    
    # テクスチャをパック
    try:
        bpy.ops.file.pack_all()
        print("テクスチャをパックしました")
    except:
        print("テクスチャのパックをスキップ")
    
    # エクスポート実行（最小限のパラメータ）
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
        print(f"エクスポート成功: {output_path}")
        return True
    except Exception as e:
        print(f"エクスポートエラー: {e}")
        print("代替方法を試します...")
        
        # 代替エクスポート（さらにシンプル）
        try:
            bpy.ops.export_scene.gltf(
                filepath=output_path,
                export_format='GLB'
            )
            print(f"代替エクスポート成功: {output_path}")
            return True
        except Exception as e2:
            print(f"代替エクスポートも失敗: {e2}")
            return False

def main():
    """メイン処理"""
    # Blendファイルのパス
    blend_file = bpy.data.filepath
    if not blend_file:
        print("エラー: Blendファイルが保存されていません")
        return
    
    # 出力パス
    output_path = blend_file.replace('.blend', '_converted.glb')
    
    print(f"変換開始: {blend_file}")
    print(f"出力先: {output_path}")
    print(f"Blenderバージョン: {bpy.app.version_string}")
    
    # オブジェクト情報を表示
    print(f"\nシーン情報:")
    print(f"  オブジェクト数: {len(bpy.data.objects)}")
    print(f"  メッシュ数: {len(bpy.data.meshes)}")
    print(f"  マテリアル数: {len(bpy.data.materials)}")
    print(f"  アーマチュア数: {len(bpy.data.armatures)}")
    
    # シェイプキーの確認
    shape_key_count = 0
    for mesh in bpy.data.meshes:
        if mesh.shape_keys:
            shape_key_count += len(mesh.shape_keys.key_blocks) - 1  # Basisを除く
    print(f"  シェイプキー数: {shape_key_count}")
    
    # エクスポート実行
    success = export_glb_simple(output_path)
    
    if success:
        print(f"\n✅ 変換完了！")
        print(f"出力ファイル: {output_path}")
        
        # ファイルサイズを確認
        if os.path.exists(output_path):
            size = os.path.getsize(output_path)
            print(f"ファイルサイズ: {size / 1024 / 1024:.2f} MB")
    else:
        print("\n❌ 変換失敗")
        print("\n手動でエクスポートしてください:")
        print("1. Blenderで ClassicMan.blend を開く")
        print("2. File > Export > glTF 2.0 (.glb/.gltf)")
        print("3. Format: glTF Binary (.glb) を選択")
        print("4. Materials: Export を選択")
        print("5. エクスポート")
        sys.exit(1)

if __name__ == "__main__":
    main()