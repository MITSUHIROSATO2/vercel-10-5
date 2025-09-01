#!/usr/bin/env python3
"""
Blenderをコマンドラインから実行してアバターを自動生成・エクスポートするスクリプト

使用方法:
python3 auto_export.py

または

blender --background --python auto_export.py
"""

import subprocess
import os
import sys

# Blenderのパスを設定（macOSの場合）
BLENDER_PATH = "/Applications/Blender.app/Contents/MacOS/Blender"

# Windowsの場合:
# BLENDER_PATH = "C:/Program Files/Blender Foundation/Blender 3.6/blender.exe"

# Linuxの場合:
# BLENDER_PATH = "blender"

def check_blender_installed():
    """Blenderがインストールされているか確認"""
    if not os.path.exists(BLENDER_PATH):
        print("エラー: Blenderが見つかりません")
        print(f"確認したパス: {BLENDER_PATH}")
        print("\n以下のいずれかを実行してください：")
        print("1. Blenderをインストール: https://www.blender.org/download/")
        print("2. BLENDER_PATHを正しいパスに修正")
        return False
    return True

def create_blender_script():
    """Blender内で実行するPythonスクリプトを作成"""
    script_content = '''
import bpy
import os

# シーンをクリア
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# 簡単なアバターを作成
# 頭部
bpy.ops.mesh.primitive_uv_sphere_add(location=(0, 0, 0))
head = bpy.context.active_object
head.name = "Head"
head.scale = (0.95, 1.05, 0.9)

# Subdivision Surface
modifier = head.modifiers.new(name="Subdivision", type='SUBSURF')
modifier.levels = 2

# マテリアル
mat = bpy.data.materials.new(name="Skin")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs['Base Color'].default_value = (1.0, 0.831, 0.702, 1.0)
bsdf.inputs['Roughness'].default_value = 0.7
bsdf.inputs['Subsurface'].default_value = 0.1
head.data.materials.append(mat)

# 目
for x in [-0.15, 0.15]:
    bpy.ops.mesh.primitive_uv_sphere_add(
        location=(x, 0.1, 0.4),
        scale=(0.08, 0.08, 0.08)
    )
    eye = bpy.context.active_object
    eye_mat = bpy.data.materials.new(name=f"Eye_{x}")
    eye_mat.use_nodes = True
    bsdf = eye_mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs['Base Color'].default_value = (0.1, 0.1, 0.1, 1.0)
    eye.data.materials.append(eye_mat)

# シェイプキーを追加
bpy.context.view_layer.objects.active = head
bpy.ops.object.shape_key_add(from_mix=False)  # Basis

shape_keys = ["mouth_open", "vowel_a", "vowel_i", "vowel_u", "vowel_e", "vowel_o", "blink", "pain", "worried", "happy"]
for key_name in shape_keys:
    bpy.ops.object.shape_key_add(from_mix=False)
    head.data.shape_keys.key_blocks[-1].name = key_name

# エクスポート
output_path = os.path.join(os.path.dirname(__file__), "../public/models/patient-avatar.glb")
output_dir = os.path.dirname(output_path)

# ディレクトリが存在しない場合は作成
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# すべてを選択
bpy.ops.object.select_all(action='SELECT')

# GLBとしてエクスポート
bpy.ops.export_scene.gltf(
    filepath=output_path,
    export_format='GLB',
    export_yup=True,
    export_apply=True,
    export_animations=True,
    export_morph=True
)

print(f"アバターをエクスポートしました: {output_path}")
'''
    
    # 一時スクリプトファイルを作成
    temp_script = "temp_blender_script.py"
    with open(temp_script, 'w', encoding='utf-8') as f:
        f.write(script_content)
    
    return temp_script

def run_blender_background():
    """Blenderをバックグラウンドで実行"""
    temp_script = create_blender_script()
    
    try:
        # Blenderをバックグラウンドモードで実行
        cmd = [
            BLENDER_PATH,
            "--background",
            "--python", temp_script
        ]
        
        print("Blenderでアバターを生成中...")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ アバターの生成が完了しました！")
            print("📁 ファイル: public/models/patient-avatar.glb")
            return True
        else:
            print("❌ エラーが発生しました:")
            print(result.stderr)
            return False
            
    finally:
        # 一時ファイルを削除
        if os.path.exists(temp_script):
            os.remove(temp_script)

def main():
    """メイン処理"""
    print("🎨 Blenderアバター自動生成ツール")
    print("=" * 50)
    
    # Blenderの確認
    if not check_blender_installed():
        sys.exit(1)
    
    # アバターを生成
    if run_blender_background():
        print("\n✨ 完了！")
        print("次のステップ:")
        print("1. アプリケーションをリロード")
        print("2. BlenderPatientAvatarコンポーネントが自動的に新しいモデルを読み込みます")
    else:
        print("\n生成に失敗しました。")
        print("手動でBlenderを開いて create_dental_avatar.py を実行してください。")

if __name__ == "__main__":
    main()