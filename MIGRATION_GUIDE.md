# 統一アバターコンポーネントへの移行ガイド

## 1. 即座に実施可能な変更

### 1.1 app/page.tsxの更新

現在のインポート:
```typescript
import WorkingLipSyncAvatar from '@/components/WorkingLipSyncAvatar';
```

新しいインポート:
```typescript
import OptimizedWorkingLipSyncAvatar from '@/components/avatar/OptimizedWorkingLipSyncAvatar';
```

コンポーネントの使用部分も同様に変更:
```typescript
// 変更前
<WorkingLipSyncAvatar
  isSpeaking={isSpeaking || isCurrentlySpeaking}
  currentWord={currentWord}
  audioLevel={audioLevel}
  speechProgress={speechProgress}
  showDebug={false}
/>

// 変更後
<OptimizedWorkingLipSyncAvatar
  isSpeaking={isSpeaking || isCurrentlySpeaking}
  currentWord={currentWord}
  audioLevel={audioLevel}
  speechProgress={speechProgress}
  showDebug={false}
/>
```

### 1.2 テストページの更新（必要に応じて）

他のテストページで古いアバターコンポーネントを使用している場合は、新しいUnifiedAvatarを使用するように更新:

```typescript
import UnifiedAvatar from '@/components/avatar/UnifiedAvatar';

// FBXモデルの例
<UnifiedAvatar
  modelPath="/models/uploads_files_4306156_Man_Grey_Suit_01_Blender/Man_Grey_Suit_01_Blender.Fbx"
  modelType="fbx"
  scale={0.01}
  isSpeaking={isSpeaking}
  audioLevel={audioLevel}
  showDebug={true}
/>

// GLBモデルの例
<UnifiedAvatar
  modelPath="/models/man-grey-suit-optimized.glb"
  modelType="glb"
  isSpeaking={isSpeaking}
  currentWord={currentWord}
  audioLevel={audioLevel}
  speechProgress={speechProgress}
  showDebug={true}
/>
```

## 2. 未使用ファイルの削除

以下のコマンドを実行して未使用ファイルを削除:

```bash
# バックアップを作成（念のため）
mkdir -p backup/components
mkdir -p backup/hooks

# コンポーネントのバックアップ
cp components/ManGreySuitAvatar.tsx backup/components/
cp "components/ManGreySuitAvatar 2.tsx" backup/components/
cp components/OptimizedManGreySuitAvatar.tsx backup/components/
cp components/LipSyncManGreySuitAvatar.tsx backup/components/
cp components/CC4LipSyncAvatar.tsx backup/components/
cp components/FixedCC4LipSyncAvatar.tsx backup/components/
cp components/SimpleBoxAvatar.tsx backup/components/

# hooksのバックアップ
cp hooks/useAdvancedLipSync.ts backup/hooks/
cp hooks/useAdvancedSpeechSynthesis.ts backup/hooks/
cp hooks/useAudioAnalyzer.ts backup/hooks/
cp hooks/useSpeechSynthesis.ts backup/hooks/

# 削除
rm components/ManGreySuitAvatar.tsx
rm "components/ManGreySuitAvatar 2.tsx"
rm components/OptimizedManGreySuitAvatar.tsx
rm components/LipSyncManGreySuitAvatar.tsx
rm components/CC4LipSyncAvatar.tsx
rm components/FixedCC4LipSyncAvatar.tsx
rm components/SimpleBoxAvatar.tsx

rm hooks/useAdvancedLipSync.ts
rm hooks/useAdvancedSpeechSynthesis.ts
rm hooks/useAudioAnalyzer.ts
rm hooks/useSpeechSynthesis.ts
```

## 3. 新しいコンポーネントの利点

### 3.1 統一されたインターフェース
- すべてのアバタータイプ（GLB、FBX）で同じプロップを使用
- 一貫したデバッグ表示
- 共通のエラーハンドリング

### 3.2 拡張性
- 新しいモデル形式の追加が容易
- カスタムアニメーション設定の追加が簡単
- 音素マッピングのカスタマイズが可能

### 3.3 パフォーマンス
- 共通コードの再利用によるバンドルサイズの削減
- 最適化されたレンダリングループ
- 効率的なモーフターゲット更新

## 4. カスタマイズ例

### 4.1 カスタム音素マッピングの使用

```typescript
import UnifiedAvatar from '@/components/avatar/UnifiedAvatar';
import { PhonemeMapping } from '@/lib/avatar/phonemeMapping';

const customPhonemeMapping: PhonemeMapping = {
  'a': { 'mouthOpen': 0.9, 'jawOpen': 0.7 },
  // ... 他の音素
};

// 将来的な実装のための準備
```

### 4.2 アニメーション設定のカスタマイズ

```typescript
<UnifiedAvatar
  modelPath="/models/man-grey-suit-optimized.glb"
  modelType="glb"
  isSpeaking={isSpeaking}
  morphAnimationConfig={{
    lerpSpeed: 0.3,              // より滑らかな補間
    audioInfluenceMultiplier: 0.5, // 音量の影響を強化
    jawOpenMultiplier: 0.6        // 顎の動きを大きく
  }}
/>
```

## 5. トラブルシューティング

### 5.1 モデルが表示されない場合
- モデルパスが正しいか確認
- モデルファイルが`public`ディレクトリに存在するか確認
- ブラウザのコンソールでエラーを確認

### 5.2 リップシンクが動作しない場合
- `isSpeaking`プロップが正しく設定されているか確認
- `audioLevel`が0より大きい値になっているか確認
- モデルにモーフターゲットが含まれているか確認

### 5.3 パフォーマンスの問題
- `showDebug`をtrueにして、レンダリング情報を確認
- モデルのポリゴン数を確認
- 不要なリレンダリングが発生していないか確認

## 6. 今後の開発

新しい統一システムにより、以下の機能追加が容易になります:

1. **新しいアバター形式のサポート**
2. **高度なリップシンクアルゴリズム**
3. **表情アニメーション**
4. **ボーン駆動アニメーション**
5. **リアルタイム音声解析との統合**