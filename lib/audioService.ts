// 統一された音声再生とリップシンクサービス
// デモと本番の両方で使用可能

interface AudioPlaybackOptions {
  text: string;
  base64Audio: string;
  onProgress?: (currentChar: string, audioLevel: number) => void;
  onEnd?: () => void;
  enableRealTimeAnalysis?: boolean; // 本番モードでのみ有効
}

class AudioService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private isInitialized = false;

  // オーディオコンテキストの初期化（本番モードのみ）
  private initializeAudioContext(): void {
    if (this.isInitialized || this.audioContext) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      this.isInitialized = true;
    } catch (error) {
      console.warn('AudioContext initialization failed:', error);
    }
  }

  // 日本語の音素パターンを定義（より精密な音声レベル生成のため）
  private getPhonemeAudioLevel(char: string): number {
    const vowels = ['あ', 'い', 'う', 'え', 'お', 'ア', 'イ', 'ウ', 'エ', 'オ', 'a', 'i', 'u', 'e', 'o'];
    const nasalConsonants = ['ん', 'ン', 'n', 'm'];
    const plosiveConsonants = ['か', 'き', 'く', 'け', 'こ', 'が', 'ぎ', 'ぐ', 'げ', 'ご', 
                                'た', 'ち', 'つ', 'て', 'と', 'だ', 'ぢ', 'づ', 'で', 'ど',
                                'ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ', 'ば', 'び', 'ぶ', 'べ', 'ぼ'];
    const fricativeConsonants = ['さ', 'し', 'す', 'せ', 'そ', 'ざ', 'じ', 'ず', 'ぜ', 'ぞ',
                                  'は', 'ひ', 'ふ', 'へ', 'ほ'];
    
    // 母音は高い音声レベル
    if (vowels.includes(char)) {
      return 0.5 + Math.random() * 0.3; // 0.5-0.8
    }
    // 鼻音は中程度
    else if (nasalConsonants.includes(char)) {
      return 0.3 + Math.random() * 0.2; // 0.3-0.5
    }
    // 破裂音は短い高いピーク
    else if (plosiveConsonants.includes(char)) {
      return 0.6 + Math.random() * 0.3; // 0.6-0.9
    }
    // 摩擦音は低めで持続
    else if (fricativeConsonants.includes(char)) {
      return 0.2 + Math.random() * 0.2; // 0.2-0.4
    }
    // その他（子音など）
    else if (char !== '、' && char !== '。' && char !== ' ') {
      return 0.3 + Math.random() * 0.3; // 0.3-0.6
    }
    // 句読点・スペース
    return 0;
  }

  // テキストベースのリップシンクシミュレーション（改良版）
  private simulateLipSync(
    text: string,
    duration: number,
    onProgress?: (currentChar: string, audioLevel: number) => void
  ): { start: () => void; stop: () => void } {
    let intervalId: NodeJS.Timeout | null = null;
    let animationFrameId: number | null = null;
    let charIndex = 0;
    const characters = text.split('');
    
    // 実際の発話速度に近づけるため、文字ごとの時間を調整
    // 日本語の平均発話速度: 約5-7音節/秒
    const charDuration = Math.max(80, Math.min(200, duration / characters.length));
    let lastCharTime = Date.now();
    let currentChar = '';
    let targetAudioLevel = 0;
    let currentAudioLevel = 0;
    
    const start = () => {
      // 文字の進行を管理
      intervalId = setInterval(() => {
        if (charIndex < characters.length) {
          currentChar = characters[charIndex];
          targetAudioLevel = this.getPhonemeAudioLevel(currentChar);
          charIndex++;
        } else {
          // 文の終わりに達したら停止
          targetAudioLevel = 0;
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      }, charDuration);
      
      // スムーズなアニメーション用のフレーム更新
      const animate = () => {
        // 音声レベルをスムーズに遷移
        const smoothingFactor = 0.15;
        currentAudioLevel += (targetAudioLevel - currentAudioLevel) * smoothingFactor;
        
        // 自然な変動を追加
        const naturalVariation = Math.sin(Date.now() / 50) * 0.05;
        const finalAudioLevel = Math.max(0, Math.min(1, currentAudioLevel + naturalVariation));
        
        if (onProgress) {
          onProgress(currentChar, finalAudioLevel);
        }
        
        if (intervalId || currentAudioLevel > 0.01) {
          animationFrameId = requestAnimationFrame(animate);
        }
      };
      
      animate();
    };

    const stop = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (onProgress) {
        onProgress('', 0);
      }
    };

    return { start, stop };
  }

  // リアルタイム音声分析（改良版 - デモと本番の両方で使用可能）
  private startRealTimeAnalysis(
    audio: HTMLAudioElement,
    text: string,
    onProgress?: (currentChar: string, audioLevel: number) => void,
    useWordMode: boolean = true
  ): void {
    if (!this.audioContext || !this.analyser || !onProgress) return;

    try {
      // MediaElementSourceは一度だけ作成可能なので、既存のものがあるかチェック
      let source: MediaElementAudioSourceNode;
      
      // audio要素にソースが既に関連付けられているかチェック
      if (!(audio as any)._audioSource) {
        source = this.audioContext.createMediaElementSource(audio);
        (audio as any)._audioSource = source;
        source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
      }

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      // 句読点を保持しながら区切り文字として扱う（本番と同じ処理）
      const cleanText = text.replace(/([、。！？,!?])/g, ' $1 ');
      const words = cleanText.split(/\s+/).filter(word => word.length > 0);
      
      let wordIndex = 0;
      let currentWord = '';
      let lastProgress = 0;

      const updateAnalysis = () => {
        if (audio.paused || audio.ended) {
          onProgress('', 0);
          return;
        }

        // 周波数データを取得
        this.analyser!.getByteFrequencyData(dataArray);
        
        // より精密な音声レベル計算
        let sum = 0;
        let weightedSum = 0;
        let count = 0;
        
        for (let i = 0; i < dataArray.length; i++) {
          const freq = i * this.audioContext!.sampleRate / (2 * dataArray.length);
          
          // 人の声の基本周波数範囲（80-250Hz）と倍音（250-4000Hz）
          if (freq >= 80 && freq <= 250) {
            // 基本周波数帯域（最重要）
            weightedSum += dataArray[i] * 2.0;
            count++;
          } else if (freq > 250 && freq <= 1000) {
            // 第1フォルマント帯域
            weightedSum += dataArray[i] * 1.5;
            count++;
          } else if (freq > 1000 && freq <= 3000) {
            // 第2フォルマント帯域
            weightedSum += dataArray[i] * 1.2;
            count++;
          } else if (freq > 3000 && freq <= 4000) {
            // 高周波数帯域（子音）
            weightedSum += dataArray[i] * 1.0;
            count++;
          } else {
            sum += dataArray[i] * 0.5;
            count++;
          }
        }
        
        const average = count > 0 ? (weightedSum + sum) / count : 0;
        const audioLevel = Math.min(1, average / 180); // より適切な正規化

        // 音声の進行に基づいて単語を更新
        const progress = audio.currentTime / audio.duration;
        
        if (!isNaN(progress) && progress !== lastProgress) {
          const targetWordIndex = Math.min(
            Math.floor(progress * words.length),
            words.length - 1
          );
          
          if (targetWordIndex !== wordIndex && targetWordIndex >= 0) {
            wordIndex = targetWordIndex;
            currentWord = words[wordIndex] || '';
          }
          
          // 単語内での詳細な音節位置を計算（本番と同じロジック）
          if (currentWord && useWordMode) {
            const wordStartProgress = wordIndex / words.length;
            const wordEndProgress = (wordIndex + 1) / words.length;
            const wordRelativeProgress = Math.max(0, Math.min(1, 
              (progress - wordStartProgress) / (wordEndProgress - wordStartProgress)
            ));
            
            // 日本語の音節（モーラ）単位で処理
            const moraCount = currentWord.replace(/[ゃゅょャュョ]/g, '').length;
            const moraIndex = Math.min(
              Math.floor(wordRelativeProgress * moraCount), 
              moraCount - 1
            );
            
            // 現在の音節を取得
            let currentMora = '';
            let count = 0;
            for (let i = 0; i < currentWord.length; i++) {
              if (count === moraIndex) {
                currentMora = currentWord[i];
                // 拗音をチェック
                if (i + 1 < currentWord.length && 'ゃゅょャュョ'.includes(currentWord[i + 1])) {
                  currentMora += currentWord[i + 1];
                }
                break;
              }
              if (!'ゃゅょャュョ'.includes(currentWord[i])) {
                count++;
              }
            }
            
            // FinalLipSyncAvatarに渡す文字
            onProgress(currentMora || currentWord[0] || '', audioLevel);
          } else {
            // 単語全体を渡す
            onProgress(currentWord, audioLevel);
          }
          
          lastProgress = progress;
        }

        requestAnimationFrame(updateAnalysis);
      };

      // 再生開始時に分析を開始
      const playHandler = () => updateAnalysis();
      audio.addEventListener('play', playHandler, { once: true });
      
      // 既に再生中の場合はすぐに開始
      if (!audio.paused && !audio.ended) {
        updateAnalysis();
      }
    } catch (error) {
      console.warn('Real-time analysis setup failed:', error);
      // フォールバックとしてテキストベースのリップシンクを使用
      if (onProgress) {
        this.simulateLipSync(text, audio.duration * 1000, onProgress).start();
      }
    }
  }

  // 統一された音声再生メソッド
  async playAudio(options: AudioPlaybackOptions): Promise<void> {
    const { text, base64Audio, onProgress, onEnd, enableRealTimeAnalysis = false } = options;

    return new Promise((resolve, reject) => {
      try {
        // Base64をBlobに変換
        const byteCharacters = atob(base64Audio);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(blob);
        
        const audio = new Audio(audioUrl);
        audio.preload = 'auto';
        audio.volume = 1.0;
        audio.crossOrigin = 'anonymous'; // CORS対応
        
        let lipSyncController: { start: () => void; stop: () => void } | null = null;

        // 音声準備完了時の処理
        audio.addEventListener('canplaythrough', () => {
          // AudioContextの初期化（全モードで使用を試みる）
          this.initializeAudioContext();
          if (this.audioContext?.state === 'suspended') {
            this.audioContext.resume();
          }

          // 再生開始
          audio.play()
            .then(() => {
              console.log('🔊 Audio playback started');
              
              // デモモードでもAudioContextを試みる
              if (this.audioContext && this.analyser) {
                // リアルタイム分析を試みる（単語モードで）
                this.startRealTimeAnalysis(audio, text, onProgress, true);
              } else {
                // AudioContextが使用できない場合のフォールバック
                const estimatedDuration = audio.duration * 1000 || 3000;
                lipSyncController = this.simulateLipSync(text, estimatedDuration, onProgress);
                lipSyncController.start();
              }
            })
            .catch((error) => {
              console.warn('Audio playback blocked:', error);
              URL.revokeObjectURL(audioUrl);
              resolve(); // エラーでも続行
            });
        }, { once: true });

        // エラーハンドリング
        audio.onerror = (error) => {
          console.error('Audio loading error:', error);
          URL.revokeObjectURL(audioUrl);
          if (lipSyncController) lipSyncController.stop();
          reject(new Error('Audio loading failed'));
        };

        // 再生終了時
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          if (lipSyncController) lipSyncController.stop();
          if (onProgress) onProgress('', 0);
          if (onEnd) onEnd();
          resolve();
        };

        // 音声のロード開始
        audio.load();
      } catch (error) {
        console.error('Audio processing error:', error);
        reject(error);
      }
    });
  }

  // クリーンアップ
  cleanup(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
    this.isInitialized = false;
  }
}

// シングルトンインスタンス
export const audioService = new AudioService();