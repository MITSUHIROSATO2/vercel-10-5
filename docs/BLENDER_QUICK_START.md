# Blenderアバター作成クイックスタート

## 手順1: Blenderでの作成

### 1. Blenderを開く
- 新規ファイルを作成
- デフォルトのキューブを削除（X → Delete）

### 2. 基本的な頭部を作成
```
1. Shift + A → Mesh → UV Sphere
2. Tabキーで編集モードに入る
3. Sキーでスケール調整
   - X軸: 0.95
   - Y軸: 1.05
   - Z軸: 0.9
4. Tabキーでオブジェクトモードに戻る
```

### 3. シンプルな顔のパーツ
```
目:
1. Shift + A → Mesh → UV Sphere
2. S → 0.16 (スケールを小さく)
3. G → X → 0.15 (右目の位置)
4. Shift + D (複製) → X → -0.3 (左目)

口:
1. Shift + A → Mesh → Cube
2. S → Shift + Z → 0.3 (平たくする)
3. S → 0.2 (全体を小さく)
4. G → Z → -0.2 (位置調整)
```

### 4. マテリアル設定
```
1. Shading タブに切り替え
2. 頭部を選択
3. 新規マテリアルを作成
4. Base Color: #FFD4B3
5. Roughness: 0.7
```

### 5. エクスポート
```
1. File → Export → glTF 2.0 (.glb/.gltf)
2. ファイル名: patient-avatar.glb
3. 設定:
   - Format: glTF Binary (.glb)
   - Transform → +Y Up: チェック
4. Export glTF 2.0
```

## 手順2: プロジェクトに配置

### 1. ファイルを配置
```bash
# publicフォルダにmodelsディレクトリを作成
mkdir -p public/models

# Blenderでエクスポートした.glbファイルを配置
# public/models/patient-avatar.glb
```

### 2. コンポーネントを使用
```typescript
// app/page.tsx で使用
import BlenderPatientAvatar from '@/components/BlenderPatientAvatar';

// 既存のアバターコンポーネントを置き換え
<BlenderPatientAvatar 
  isSpeaking={isSpeaking || isCurrentlySpeaking} 
  lastMessage={messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content}
  currentWord={currentWord}
  speechProgress={speechProgress}
  audioLevel={audioLevel}
  currentPhoneme={currentPhoneme}
/>
```

## より高度なアバターを作成する場合

### シェイプキーの追加（表情用）
```python
# Blenderのスクリプトエディタで実行
import bpy

# 選択中のオブジェクトを取得
obj = bpy.context.active_object

# ベースのシェイプキーを追加
bpy.ops.object.shape_key_add(from_mix=False)

# 口開きのシェイプキー
bpy.ops.object.shape_key_add(from_mix=False)
obj.data.shape_keys.key_blocks[-1].name = "mouth_open"

# 編集モードで口の頂点を選択して移動
# その後オブジェクトモードに戻る

# 他の表情も同様に追加
expressions = ["vowel_a", "vowel_i", "vowel_u", "vowel_e", "vowel_o", 
               "blink_left", "blink_right", "eyebrow_up", "pain", "worried", "happy"]

for expr in expressions:
    bpy.ops.object.shape_key_add(from_mix=False)
    obj.data.shape_keys.key_blocks[-1].name = expr
```

### ボーンの追加（アニメーション用）
```
1. オブジェクトモードで頭部を選択
2. Shift + A → Armature
3. 編集モードでボーンを配置
4. オブジェクトモードに戻る
5. 頭部を選択 → Armatureを選択 → Ctrl + P → With Automatic Weights
```

## トラブルシューティング

### モデルが表示されない場合
1. ブラウザのコンソールでエラーを確認
2. ファイルパスが正しいか確認
3. .glbファイルのサイズが大きすぎないか確認（10MB以下推奨）

### アニメーションが動かない場合
1. Blenderでアニメーションが正しくエクスポートされているか確認
2. Animation タブで Shape Keys と Skinning がONになっているか確認

### パフォーマンスが悪い場合
1. ポリゴン数を減らす（Decimate Modifier使用）
2. テクスチャサイズを小さくする
3. 不要なシェイプキーを削除