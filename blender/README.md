# Blenderアバター作成ガイド

このフォルダには、歯科患者アバターをBlenderで作成するためのリソースが含まれています。

## 📁 ファイル構成

- **create_dental_avatar.py** - 自動でアバターを生成するPythonスクリプト
- **STEP_BY_STEP_GUIDE.md** - 詳細な手順ガイド
- **README.md** - このファイル

## 🚀 クイックスタート

### 最も簡単な方法（5分で完成）

1. **Blenderをダウンロード**
   - https://www.blender.org/download/
   - 無料でダウンロード可能

2. **スクリプトを実行**
   ```
   1. Blenderを起動
   2. Scriptingタブをクリック
   3. create_dental_avatar.pyの内容をコピー＆ペースト
   4. Run Scriptボタンをクリック
   ```

3. **エクスポート**
   ```
   1. File → Export → glTF 2.0
   2. ファイル名: patient-avatar.glb
   3. Format: glTF Binary (.glb)を選択
   4. Transform → +Y Up にチェック
   5. Export glTF 2.0
   ```

4. **プロジェクトに配置**
   ```bash
   # ターミナルで実行
   mkdir -p public/models
   # patient-avatar.glbをpublic/models/にコピー
   ```

## 🎨 カスタマイズ

### 表情の追加
スクリプトには以下の表情（シェイプキー）が含まれています：
- 口の動き（あいうえお）
- まばたき
- 眉の動き
- 感情表現（痛み、心配、喜び）

### 見た目の調整
- 肌の色: Skinマテリアルの Base Color を変更
- 髪の色: Hairマテリアルの Base Color を変更
- 顔の形: 編集モードで頂点を調整

## 📊 推奨スペック

- **ポリゴン数**: 10,000以下
- **ファイルサイズ**: 5MB以下
- **テクスチャ**: 使用しない（マテリアルのみ）

## 🛠️ トラブルシューティング

### スクリプトが動作しない
- Blender 3.6以上を使用しているか確認
- Pythonコンソールでエラーを確認

### エクスポートしたファイルが大きい
- Decimateモディファイアでポリゴン数を削減
- 不要なオブジェクトを削除

### Webで表示されない
- ファイルパスが正しいか確認
- ブラウザのコンソールでエラーを確認

## 📚 参考リソース

- [Blender公式ドキュメント](https://docs.blender.org/)
- [glTF 2.0仕様](https://www.khronos.org/gltf/)
- [Three.js GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader)

## 💡 ヒント

1. **初めての方へ**
   - まずはスクリプトを実行して基本的なアバターを作成
   - その後、手動で調整を加える

2. **パフォーマンス重視**
   - Subdivision Surfaceのレベルを1に下げる
   - 髪を簡略化する

3. **リアリティ重視**
   - より多くのシェイプキーを追加
   - 髪にParticle Systemを使用

## 🎯 完成イメージ

作成されるアバターには以下が含まれます：
- リアルな頭部形状
- 動く目と口
- 基本的な髪型
- 15種類の表情
- 最適化された構造

準備ができたら、`STEP_BY_STEP_GUIDE.md`で詳細な手順を確認してください！