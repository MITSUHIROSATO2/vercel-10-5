#!/bin/bash

# Blenderアバター生成スクリプト
# このスクリプトはBlenderがインストールされている場合に
# コマンドラインからアバターを自動生成します

echo "🎨 歯科患者アバター生成スクリプト"
echo "=================================="

# スクリプトのディレクトリを取得
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Blenderのパスを確認（macOS）
BLENDER_PATH="/Applications/Blender.app/Contents/MacOS/Blender"

# Blenderが見つからない場合、他の場所を確認
if [ ! -f "$BLENDER_PATH" ]; then
    # Homebrewでインストールした場合
    if [ -f "/usr/local/bin/blender" ]; then
        BLENDER_PATH="/usr/local/bin/blender"
    # Linuxの一般的な場所
    elif [ -f "/usr/bin/blender" ]; then
        BLENDER_PATH="/usr/bin/blender"
    else
        echo "❌ エラー: Blenderが見つかりません"
        echo ""
        echo "Blenderをインストールしてください:"
        echo "1. https://www.blender.org/download/ からダウンロード"
        echo "2. または: brew install blender (macOS)"
        echo ""
        echo "インストール後、このスクリプトを再実行してください。"
        exit 1
    fi
fi

echo "✅ Blenderが見つかりました: $BLENDER_PATH"

# 出力ディレクトリを作成
mkdir -p "$PROJECT_ROOT/public/models"

# Pythonスクリプトを作成
TEMP_SCRIPT="$PROJECT_ROOT/blender/temp_generate.py"
cat > "$TEMP_SCRIPT" << 'EOF'
import bpy
import os
import math

# シーンをクリア
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# 頭部を作成
bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, location=(0, 0, 0))
head = bpy.context.active_object
head.name = "Head"
head.scale = (0.95, 1.05, 0.9)

# Subdivision Surface
modifier = head.modifiers.new(name="Subdivision", type='SUBSURF')
modifier.levels = 2

# 肌のマテリアル
skin_mat = bpy.data.materials.new(name="Skin")
skin_mat.use_nodes = True
bsdf = skin_mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs['Base Color'].default_value = (1.0, 0.831, 0.702, 1.0)
bsdf.inputs['Roughness'].default_value = 0.7
bsdf.inputs['Subsurface'].default_value = 0.1
bsdf.inputs['Subsurface Color'].default_value = (1.0, 0.6, 0.6, 1.0)
head.data.materials.append(skin_mat)

# 目を作成
eye_mat = bpy.data.materials.new(name="Eyes")
eye_mat.use_nodes = True
eye_bsdf = eye_mat.node_tree.nodes["Principled BSDF"]
eye_bsdf.inputs['Base Color'].default_value = (0.1, 0.1, 0.1, 1.0)
eye_bsdf.inputs['Roughness'].default_value = 0.1
eye_bsdf.inputs['IOR'].default_value = 1.45

for i, x in enumerate([-0.15, 0.15]):
    # 眼球
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=24, ring_count=12,
        location=(x, 0.12, 0.4),
        scale=(0.08, 0.08, 0.08)
    )
    eye = bpy.context.active_object
    eye.name = f"Eye.{'L' if i == 0 else 'R'}"
    eye.data.materials.append(eye_mat)
    eye.parent = head

# 口を作成
bpy.ops.mesh.primitive_cube_add(location=(0, -0.2, 0.45), scale=(0.2, 0.05, 0.05))
mouth = bpy.context.active_object
mouth.name = "Mouth"
mouth_modifier = mouth.modifiers.new(name="Subdivision", type='SUBSURF')
mouth_modifier.levels = 2

# 口のマテリアル
mouth_mat = bpy.data.materials.new(name="Lips")
mouth_mat.use_nodes = True
mouth_bsdf = mouth_mat.node_tree.nodes["Principled BSDF"]
mouth_bsdf.inputs['Base Color'].default_value = (0.8, 0.4, 0.4, 1.0)
mouth_bsdf.inputs['Roughness'].default_value = 0.6
mouth.data.materials.append(mouth_mat)
mouth.parent = head

# 髪を作成
bpy.ops.mesh.primitive_uv_sphere_add(
    segments=32, ring_count=16,
    location=(0, 0.3, 0),
    scale=(0.52, 0.52, 0.52)
)
hair = bpy.context.active_object
hair.name = "Hair"

# 下半分を削除して髪型にする
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='DESELECT')
bpy.ops.mesh.select_mode(type="VERT")
bpy.ops.object.mode_set(mode='OBJECT')

# 下半分の頂点を選択
for vert in hair.data.vertices:
    if vert.co.z < -0.1:
        vert.select = True

bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.delete(type='VERT')
bpy.ops.object.mode_set(mode='OBJECT')

# 髪のマテリアル
hair_mat = bpy.data.materials.new(name="Hair")
hair_mat.use_nodes = True
hair_bsdf = hair_mat.node_tree.nodes["Principled BSDF"]
hair_bsdf.inputs['Base Color'].default_value = (0.15, 0.1, 0.08, 1.0)
hair_bsdf.inputs['Roughness'].default_value = 0.85
hair.data.materials.append(hair_mat)
hair.parent = head

# シェイプキーを追加
bpy.context.view_layer.objects.active = head
bpy.ops.object.shape_key_add(from_mix=False)  # Basis

# 表情のシェイプキー
shape_keys = [
    "mouth_open", "mouth_smile", "vowel_a", "vowel_i", "vowel_u", 
    "vowel_e", "vowel_o", "blink_left", "blink_right", "eyebrow_up",
    "pain", "worried", "happy"
]

for key_name in shape_keys:
    bpy.ops.object.shape_key_add(from_mix=False)
    key_block = head.data.shape_keys.key_blocks[-1]
    key_block.name = key_name
    # デフォルト値を0に設定
    key_block.value = 0

# すべてを選択
bpy.ops.object.select_all(action='SELECT')

# エクスポートパス
script_dir = os.path.dirname(os.path.abspath(__file__))
output_path = os.path.join(script_dir, "../public/models/patient-avatar.glb")

# GLBとしてエクスポート
bpy.ops.export_scene.gltf(
    filepath=output_path,
    export_format='GLB',
    export_yup=True,
    export_apply=True,
    export_animations=True,
    export_morph=True,
    export_morph_normal=True,
    use_selection=True
)

print(f"✅ アバターをエクスポートしました: {output_path}")
EOF

echo ""
echo "📦 アバターを生成中..."

# Blenderをバックグラウンドで実行
"$BLENDER_PATH" --background --python "$TEMP_SCRIPT"

# 一時ファイルを削除
rm -f "$TEMP_SCRIPT"

# 結果を確認
if [ -f "$PROJECT_ROOT/public/models/patient-avatar.glb" ]; then
    echo ""
    echo "✅ 成功！アバターが生成されました。"
    echo "📁 場所: public/models/patient-avatar.glb"
    echo ""
    echo "次のステップ:"
    echo "1. ブラウザでアプリケーションをリロード"
    echo "2. BlenderPatientAvatarコンポーネントが新しいモデルを表示します"
else
    echo ""
    echo "❌ エラー: アバターの生成に失敗しました。"
    echo "Blenderを手動で開いて、blender/create_dental_avatar.py を実行してください。"
fi