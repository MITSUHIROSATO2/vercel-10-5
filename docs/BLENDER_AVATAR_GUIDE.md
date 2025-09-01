# Blenderを使用した歯科患者アバター作成ガイド

## 1. Blenderでのモデリング手順

### 必要なもの
- Blender 3.6以上
- GLTFエクスポートアドオン（標準搭載）

### 基本的なモデリング手順

#### 1.1 頭部の作成
```
1. UV球を追加（Shift + A → Mesh → UV Sphere）
2. 編集モード（Tab）に切り替え
3. Proportional Editing（O）を有効化
4. 頭部の形状に変形：
   - スケール: X=0.95, Y=1.05, Z=0.9
   - 頬の部分を少し膨らませる
   - 顎のラインを調整
```

#### 1.2 顔のパーツ作成
```
目：
- 球体を2つ配置
- 瞳孔用の小さい球体を追加
- まぶた用のカーブを作成

口：
- カーブで唇の輪郭を作成
- 内部にメッシュを追加
- 歯は個別のキューブから作成

鼻：
- キューブから開始
- Subdivision Surfaceモディファイアを適用
```

#### 1.3 髪の作成
```
1. ヘアパーティクルシステムを使用
   または
2. メッシュベースの髪：
   - ベースメッシュを作成
   - 髪の束を個別に配置
   - Array Modifierで複製
```

### 2. マテリアル設定

```
肌のマテリアル：
- Base Color: #FFD4B3
- Subsurface: 0.1
- Subsurface Color: #FF9999
- Roughness: 0.7
- Specular: 0.5

髪のマテリアル：
- Base Color: #2A1F1A
- Roughness: 0.85
- Metallic: 0.05
```

### 3. リギング（骨格設定）

```
必要なボーン：
- 頭部（Head）
- 首（Neck）
- 顎（Jaw）- 口の開閉用
- 左目（Eye.L）
- 右目（Eye.R）
- 左まぶた上（Eyelid.Upper.L）
- 右まぶた上（Eyelid.Upper.R）
- 左まぶた下（Eyelid.Lower.L）
- 右まぶた下（Eyelid.Lower.R）
- 左眉（Eyebrow.L）
- 右眉（Eyebrow.R）
```

### 4. シェイプキー（表情）の設定

```
基本的なシェイプキー：
1. Basis（基本形状）
2. 口の形状：
   - mouth_open（口開き）
   - mouth_smile（笑顔）
   - mouth_frown（しかめ面）
   - vowel_a（あ）
   - vowel_i（い）
   - vowel_u（う）
   - vowel_e（え）
   - vowel_o（お）
3. 目の表情：
   - blink_left（左まばたき）
   - blink_right（右まばたき）
   - eyes_wide（目を見開く）
4. 眉の動き：
   - eyebrow_up（眉上げ）
   - eyebrow_down（眉下げ）
   - eyebrow_worried（心配そうな眉）
5. 感情表現：
   - pain（痛み）
   - worried（心配）
   - happy（幸せ）
```

### 5. エクスポート設定

```
GLTFエクスポート設定：
1. File → Export → glTF 2.0
2. 設定：
   - Format: glTF Binary (.glb)
   - Transform → +Y Up: ON
   - Geometry → Apply Modifiers: ON
   - Geometry → UVs: ON
   - Geometry → Normals: ON
   - Geometry → Tangents: ON
   - Animation → Shape Keys: ON
   - Animation → Skinning: ON
```

## 実装用のBlenderスクリプト

```python
import bpy

# アバター作成の自動化スクリプト
def create_patient_avatar():
    # 既存のオブジェクトを削除
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # 頭部を作成
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=64, 
        ring_count=32,
        location=(0, 0, 0)
    )
    head = bpy.context.active_object
    head.name = "Head"
    head.scale = (0.95, 1.05, 0.9)
    
    # Subdivision Surfaceを追加
    bpy.ops.object.modifier_add(type='SUBSURF')
    head.modifiers["Subdivision"].levels = 2
    
    # 目を作成
    for i, x in enumerate([-0.15, 0.15]):
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=32,
            ring_count=16,
            location=(x, 0.4, 0.1),
            scale=(0.08, 0.08, 0.08)
        )
        eye = bpy.context.active_object
        eye.name = f"Eye.{'L' if i == 0 else 'R'}"
        eye.parent = head
    
    # マテリアルを作成
    skin_mat = bpy.data.materials.new(name="Skin")
    skin_mat.use_nodes = True
    nodes = skin_mat.node_tree.nodes
    
    # Principled BSDFノードを取得
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs['Base Color'].default_value = (1.0, 0.831, 0.702, 1.0)
    bsdf.inputs['Subsurface'].default_value = 0.1
    bsdf.inputs['Subsurface Color'].default_value = (1.0, 0.6, 0.6, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.7
    
    # マテリアルを適用
    head.data.materials.append(skin_mat)
    
    # シェイプキーを追加
    bpy.ops.object.shape_key_add(from_mix=False)  # Basis
    
    # 口開きのシェイプキー
    bpy.ops.object.shape_key_add(from_mix=False)
    head.data.shape_keys.key_blocks[-1].name = "mouth_open"
    
    print("アバターの基本構造が作成されました")

# スクリプトを実行
create_patient_avatar()
```

## React Three Fiberでの使用方法

1. アバターファイルをpublic/models/に配置
2. コンポーネントで読み込み（次のステップで実装）