# Blenderで歯科患者アバターを作成する詳細手順

## 準備

### 必要なソフトウェア
- Blender 3.6以上（無料）: https://www.blender.org/download/

## 方法1: 自動生成スクリプトを使用（推奨）

### 手順1: Blenderを起動
1. Blenderを開く
2. 新規ファイルで開始

### 手順2: スクリプトエディタを開く
1. 上部のタブから「Scripting」をクリック
2. 中央にテキストエディタが表示される

### 手順3: スクリプトを実行
1. `create_dental_avatar.py`の内容をコピー
2. Blenderのテキストエディタにペースト
3. 「Run Script」ボタンをクリック（▶️アイコン）

### 手順4: エクスポート
1. File → Export → glTF 2.0 (.glb/.gltf)
2. ファイル名: `patient-avatar.glb`
3. 設定:
   - Format: glTF Binary (.glb)
   - Transform → +Y Up: ✓
4. Export glTF 2.0

## 方法2: 手動で作成

### 1. 頭部の作成

#### 基本形状
```
1. デフォルトのキューブを削除: X → Delete
2. Shift + A → Mesh → UV Sphere
3. Properties → Modifier → Add Modifier → Subdivision Surface
4. Levels: 2
```

#### 形状調整
```
1. Tab（編集モード）
2. Alt + A（全選択解除）
3. B（ボックス選択）で下半分を選択
4. S → Z → 0.9（顎を細く）
5. Tab（オブジェクトモード）
```

### 2. 目の作成

#### 左目
```
1. Shift + A → Mesh → UV Sphere
2. S → 0.08（スケール）
3. G → X → -0.15（左に移動）
4. G → Y → 0.1（前に移動）
5. G → Z → 0.1（上に移動）
```

#### 右目（複製）
```
1. 左目を選択
2. Shift + D（複製）
3. X → 0.3（右に移動）
```

### 3. 口の作成

```
1. Shift + A → Mesh → Cube
2. S → 0.2（全体を縮小）
3. S → Z → 0.3（薄くする）
4. G → Z → -0.2（下に移動）
5. Modifier → Subdivision Surface
```

### 4. 髪の作成

```
1. Shift + A → Mesh → UV Sphere
2. S → 1.05（少し大きく）
3. G → Z → 0.3（上に移動）
4. Tab（編集モード）
5. Alt + A → B（下半分を選択）
6. X → Vertices（削除）
7. Tab（オブジェクトモード）
```

### 5. マテリアルの設定

#### 肌のマテリアル
```
1. Shading タブに切り替え
2. 頭部を選択
3. Material Properties → New
4. Base Color: #FFD4B3
5. Subsurface: 0.1
6. Subsurface Color: #FF9999
7. Roughness: 0.7
```

#### 髪のマテリアル
```
1. 髪を選択
2. Material Properties → New
3. Base Color: #2A1F1A
4. Roughness: 0.85
5. Metallic: 0.05
```

### 6. シェイプキーの追加（表情）

```
1. 頭部を選択
2. Object Data Properties（緑の三角形アイコン）
3. Shape Keys → + ボタン（Basis作成）
4. もう一度 + ボタン → 名前を「mouth_open」に変更
5. Tab（編集モード）
6. 口の周りの頂点を選択して下に移動
7. Tab（オブジェクトモード）
```

他の表情も同様に作成:
- vowel_a, vowel_i, vowel_u, vowel_e, vowel_o（口の形）
- blink_left, blink_right（まばたき）
- eyebrow_up, eyebrow_down（眉の動き）
- pain, worried, happy（感情表現）

### 7. 最適化

#### ポリゴン数の削減
```
1. オブジェクトを選択
2. Modifier → Decimate
3. Ratio: 0.5（半分に削減）
4. Apply
```

### 8. エクスポート

```
1. すべてのオブジェクトを選択（A）
2. File → Export → glTF 2.0
3. 設定:
   - ファイル名: patient-avatar.glb
   - Format: glTF Binary (.glb)
   - Include → Selected Objects: ✓
   - Transform → +Y Up: ✓
   - Geometry → Apply Modifiers: ✓
   - Animation → Shape Keys: ✓
4. Export glTF 2.0
```

## プロジェクトへの統合

### 1. ファイルの配置
```bash
cd /Users/satoumitsuhiro/Desktop/東京科学大学/interview/dental-ai-simulator
mkdir -p public/models
# patient-avatar.glb を public/models/ にコピー
```

### 2. コンポーネントの使用
```typescript
// app/page.tsx で
import BlenderPatientAvatar from '@/components/BlenderPatientAvatar';

// ImprovedPatientAvatar を BlenderPatientAvatar に置き換え
```

## トラブルシューティング

### エクスポートしたモデルが暗い
- ライトを含めないようにする
- マテリアルのEmissionを0にする

### シェイプキーが動作しない
- Export時に「Shape Keys」がONになっているか確認
- シェイプキーの値が0になっていないか確認

### ファイルサイズが大きい
- テクスチャを使用している場合は解像度を下げる
- Decimateモディファイアでポリゴン数を削減
- 不要なオブジェクトを削除

## より高度なテクニック

### リアルな髪
- Particle System → Hair を使用
- または、Hair Curves（Blender 3.5以上）

### 詳細な表情
- Sculpt Mode で細かい表情を作成
- より多くのシェイプキーを追加

### アニメーション
- アーマチュアを追加してボーンアニメーション
- Action Editor でアニメーションクリップを作成