import { useCallback, useRef, useState } from 'react';

interface ElevenLabsSpeechHook {
  speak: (text: string, onEnd?: () => void, onProgress?: (progress: number) => void) => Promise<void>;
  cancel: () => void;
  isCurrentlySpeaking: boolean;
  currentWord: string;
  speechProgress: number;
  isLoading: boolean;
  audioLevel: number;
  currentPhoneme: string;
  initializeAudio: () => void;
}

export function useElevenLabsSpeech(): ElevenLabsSpeechHook {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [isCurrentlySpeaking, setIsCurrentlySpeaking] = useState(false);
  const [currentWord, setCurrentWord] = useState('');
  const [speechProgress, setSpeechProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentPhoneme, setCurrentPhoneme] = useState('');
  const wordsRef = useRef<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioInitializedRef = useRef(false);
  const audioLevelRef = useRef(0);

  // テキストから感情を検出する関数（より精度を高めた判定）
  const detectEmotion = (text: string): string => {
    const lowerText = text.toLowerCase();
    
    // 痛みの強度をスコア化
    let painScore = 0;
    if (text.includes('痛い') || text.includes('いたい')) painScore += 2;
    if (text.includes('ズキズキ') || text.includes('ずきずき')) painScore += 2;
    if (text.includes('うずく') || text.includes('疼く')) painScore += 2;
    if (text.includes('激痛')) painScore += 3;
    // 「つらい」を一つの単語として認識
    if (text.includes('辛い') || text.includes('つらい') || text.includes('ツライ')) painScore += 2;
    if (text.includes('噏む') || text.includes('かむ')) painScore += 1;
    if (text.includes('しみる') || text.includes('シミル')) painScore += 1;
    if (text.includes('眠れない') || text.includes('ねむれない')) painScore += 1;
    if (text.includes('痛み')) painScore += 2;
    
    // 不安のスコア
    let anxietyScore = 0;
    if (text.includes('心配') || text.includes('しんぱい')) anxietyScore += 2;
    if (text.includes('不安') || text.includes('ふあん')) anxietyScore += 2;
    if (text.includes('怖い') || text.includes('こわい')) anxietyScore += 2;
    if (text.includes('大丈夫でしょうか')) anxietyScore += 2;
    if (text.includes('どうしよう')) anxietyScore += 1;
    if (text.includes('抜歯') && text.includes('避け')) anxietyScore += 1;
    
    // 不快感のスコア
    let discomfortScore = 0;
    if (text.includes('気持ち悪い') || text.includes('きもちわるい')) discomfortScore += 2;
    if (text.includes('違和感') || text.includes('いわかん')) discomfortScore += 2;
    if (text.includes('腫れ') || text.includes('はれ')) discomfortScore += 1;
    if (text.includes('血') || text.includes('ち')) discomfortScore += 1;
    
    // 安堵のスコア
    let reliefScore = 0;
    if (text.includes('安心') || text.includes('あんしん')) reliefScore += 2;
    if (text.includes('良かった') || text.includes('よかった')) reliefScore += 2;
    if (text.includes('ほっと')) reliefScore += 2;
    if (text.includes('ありがとう')) reliefScore += 1;
    
    // 困惑のスコア
    let confusionScore = 0;
    if (text.includes('えーと') || text.includes('ええと')) confusionScore += 2;
    if (text.includes('うーん')) confusionScore += 2;
    if (text.includes('わからない') || text.includes('わかりません')) confusionScore += 2;
    if (text.includes('たぶん') || text.includes('おそらく')) confusionScore += 1;
    if (text.includes('かもしれ')) confusionScore += 1;
    
    // 最も高いスコアの感情を返す
    const scores = [
      { emotion: 'pain', score: painScore },
      { emotion: 'anxiety', score: anxietyScore },
      { emotion: 'discomfort', score: discomfortScore },
      { emotion: 'relief', score: reliefScore },
      { emotion: 'confusion', score: confusionScore }
    ];
    
    const maxScore = Math.max(...scores.map(s => s.score));
    if (maxScore === 0) return 'neutral';
    
    const topEmotion = scores.find(s => s.score === maxScore);
    return topEmotion?.emotion || 'neutral';
  };

  const speak = useCallback(async (
    text: string, 
    onEnd?: () => void, 
    onProgress?: (progress: number) => void
  ) => {
    try {
      setIsLoading(true);
      setIsCurrentlySpeaking(false);
      setSpeechProgress(0);
      setCurrentWord('');

      // 既存の音声を停止
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      console.log('Requesting ElevenLabs speech synthesis...');

      // テキストから感情を検出
      const emotion = detectEmotion(text);
      console.log(`Detected emotion: ${emotion} for text: "${text.substring(0, 50)}..."`)

      // ElevenLabs APIを呼び出し（感情パラメータ付き）
      const response = await fetch('/api/elevenlabs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, emotion }),
      });

      if (!response.ok) {
        console.warn(`ElevenLabs API error: ${response.status}. Falling back to Web Speech API.`);
        console.log('Web Speech API available:', typeof window !== 'undefined' && window.speechSynthesis);
        setIsLoading(false); // ローディングを終了
        // 401 (Unauthorized/Quota exceeded) or other errors: Use Web Speech API
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          console.log('Using Web Speech API for fallback...');
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'ja-JP';
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 0.8;

          utterance.onstart = () => {
            setIsCurrentlySpeaking(true);
            setIsLoading(false);
          };

          utterance.onend = () => {
            setIsCurrentlySpeaking(false);
            setCurrentWord('');
            setSpeechProgress(100);
            setAudioLevel(0);
            setCurrentPhoneme('');
            if (onEnd) onEnd();
          };

          utterance.onerror = (error) => {
            console.error('Web Speech API error:', error);
            setIsCurrentlySpeaking(false);
            setIsLoading(false);
            if (onEnd) onEnd();
          };

          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);

          // Simple progress update
          const duration = text.length * 100;
          const startTime = Date.now();

          const updateProgress = () => {
            if (window.speechSynthesis.speaking) {
              const elapsed = Date.now() - startTime;
              const progress = Math.min((elapsed / duration) * 100, 100);
              setSpeechProgress(progress);
              if (onProgress) onProgress(progress);
              requestAnimationFrame(updateProgress);
            }
          };
          updateProgress();
          return;
        }
        throw new Error(`音声生成エラー: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        console.warn(`ElevenLabs API returned error: ${data.error}. Falling back to Web Speech API.`);
        setIsLoading(false); // ローディングを終了
        // Use Web Speech API as fallback
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'ja-JP';
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 0.8;

          utterance.onstart = () => {
            setIsCurrentlySpeaking(true);
            setIsLoading(false);
          };

          utterance.onend = () => {
            setIsCurrentlySpeaking(false);
            setCurrentWord('');
            setSpeechProgress(100);
            setAudioLevel(0);
            setCurrentPhoneme('');
            if (onEnd) onEnd();
          };

          utterance.onerror = (error) => {
            console.error('Web Speech API error:', error);
            setIsCurrentlySpeaking(false);
            setIsLoading(false);
            if (onEnd) onEnd();
          };

          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);

          // Simple progress update
          const duration = text.length * 100;
          const startTime = Date.now();

          const updateProgress = () => {
            if (window.speechSynthesis.speaking) {
              const elapsed = Date.now() - startTime;
              const progress = Math.min((elapsed / duration) * 100, 100);
              setSpeechProgress(progress);
              if (onProgress) onProgress(progress);
              requestAnimationFrame(updateProgress);
            }
          };
          updateProgress();
          return;
        }
        throw new Error(data.error);
      }

      // Base64音声データをAudioオブジェクトで再生
      // オーディオ要素を作成
      const audio = new Audio();
      audio.preload = 'auto'; // 自動プリロード
      
      // CSPエラーを回避するため、Blobを使用
      try {
        // より効率的なBase64デコード
        const byteCharacters = atob(data.audio);
        const byteArray = new Uint8Array(byteCharacters.length);
        // パフォーマンス改善: ループを最適化
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(blob);

        console.log('Audio blob size:', blob.size, 'bytes');
        console.log('Audio URL created:', audioUrl);

        audio.src = audioUrl;
        audioRef.current = audio;
        
        // メモリリークを防ぐため、URLを解放
        audio.addEventListener('loadend', () => {
          URL.revokeObjectURL(audioUrl);
        });
        
        // 音声を即座にロード開始
        audio.load();
      } catch (error) {
        console.error('Audio creation error:', error);
        console.error('音声の作成に失敗しました');
        setIsLoading(false);
        return;
      }

      // より精度の高い単語分割と音素マッピング
      // 句読点を保持しながら区切り文字として扱う
      const cleanText = text.replace(/([、。！？,!?])/g, ' $1 ');
      wordsRef.current = cleanText.split(/\s+/).filter(word => word.length > 0);
      
      // Web Audio APIのセットアップ
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        analyserRef.current.smoothingTimeConstant = 0.8;
        
        sourceRef.current = audioContextRef.current.createMediaElementSource(audio);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      } catch (error) {
        // console.warn('Web Audio API setup failed:', error);
      }
      
      // 音声の準備ができたら（より早いタイミングで）
      audio.onloadstart = () => {
        // console.log('Audio loading started');
      };
      
      audio.onloadeddata = () => {
        setIsLoading(false); // データロード完了時点でローディングを終了
        // console.log('Audio data loaded');
      };
      
      audio.onloadedmetadata = () => {
        // console.log('Audio loaded, duration:', audio.duration);
      };
      
      // canplayイベントで再生可能を検知
      audio.oncanplay = () => {
        // console.log('Audio can play');
        setIsLoading(false); // 念のため再度falseに
      };

      // 音声解析の準備
      let lastUpdateTime = 0;
      const analyzeAudio = (timestamp?: number) => {
        if (analyserRef.current && !audio.paused) {
            // 毎フレーム更新（最高精度でリップシンク）
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            
            // より精度の高い音声レベル計算
            // 低周波数帯域（声の基本周波数）に焦点を当てる
            const voiceRange = dataArray.slice(0, Math.floor(dataArray.length * 0.5));
            const average = voiceRange.reduce((sum, value) => sum + value, 0) / voiceRange.length;
            // より積極的な正規化（音声をより強く検出）
            const normalizedLevel = Math.max(0, Math.min((average - 10) / 60, 1));
            // 即座に反応（スムージングを最小化）
            const currentLevel = audioLevelRef.current || 0;
            const smoothedLevel = currentLevel * 0.1 + normalizedLevel * 0.9;  // ほぼ即座に反応
            audioLevelRef.current = smoothedLevel;
            setAudioLevel(Math.max(smoothedLevel, 0.2));  // 最小値を保証
            
            // 音素の推定（音声レベルと連動した改善版）
            const currentTime = audio.currentTime;
            const duration = audio.duration;
            const progress = currentTime / duration;
            
            // 現在の単語を取得（音声レベルが高い時だけ更新）
            if (wordsRef.current.length > 0) {
              const wordIndex = Math.floor(progress * wordsRef.current.length);
              const word = wordsRef.current[wordIndex] || '';
              setCurrentWord(word);
              
              // より精度の高い文字位置推定（音節単位）
              const wordStartProgress = wordIndex / wordsRef.current.length;
              const wordEndProgress = (wordIndex + 1) / wordsRef.current.length;
              const wordRelativeProgress = Math.max(0, Math.min(1, (progress - wordStartProgress) / (wordEndProgress - wordStartProgress)));
              
              // 日本語の音節（モーラ）単位で処理
              const moraCount = word.replace(/[ゃゅょャュョ]/g, '').length;
              const moraIndex = Math.min(Math.floor(wordRelativeProgress * moraCount), moraCount - 1);
              
              // 現在の音節を取得
              let currentMora = '';
              let count = 0;
              for (let i = 0; i < word.length; i++) {
                if (count === moraIndex) {
                  currentMora = word[i];
                  // 拗音をチェック
                  if (i + 1 < word.length && 'ゃゅょャュョ'.includes(word[i + 1])) {
                    currentMora += word[i + 1];
                  }
                  break;
                }
                if (!'ゃゅょャュョ'.includes(word[i])) {
                  count++;
                }
              }
              const currentChar = currentMora || word[0] || '';
              
              // 拡張された音素マッピング（より多くの文字に対応）
              const phonemeMap: { [key: string]: string } = {
                'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
                'か': 'a', 'き': 'i', 'く': 'u', 'け': 'e', 'こ': 'o',
                'さ': 'a', 'し': 'i', 'す': 'u', 'せ': 'e', 'そ': 'o',
                'た': 'a', 'ち': 'i', 'つ': 'u', 'て': 'e', 'と': 'o',
                'な': 'a', 'に': 'i', 'ぬ': 'u', 'ね': 'e', 'の': 'o',
                'は': 'a', 'ひ': 'i', 'ふ': 'u', 'へ': 'e', 'ほ': 'o',
                'ま': 'a', 'み': 'i', 'む': 'u', 'め': 'e', 'も': 'o',
                'や': 'a', 'ゆ': 'u', 'よ': 'o',
                'ら': 'a', 'り': 'i', 'る': 'u', 'れ': 'e', 'ろ': 'o',
                'わ': 'a', 'を': 'o', 'ん': 'n',
                'が': 'a', 'ぎ': 'i', 'ぐ': 'u', 'げ': 'e', 'ご': 'o',
                'ざ': 'a', 'じ': 'i', 'ず': 'u', 'ぜ': 'e', 'ぞ': 'o',
                'だ': 'a', 'ぢ': 'i', 'づ': 'u', 'で': 'e', 'ど': 'o',
                'ば': 'a', 'び': 'i', 'ぶ': 'u', 'べ': 'e', 'ぼ': 'o',
                'ぱ': 'a', 'ぴ': 'i', 'ぷ': 'u', 'ぺ': 'e', 'ぽ': 'o',
                // 拗音や特殊音
                'きゃ': 'a', 'きゅ': 'u', 'きょ': 'o',
                'しゃ': 'a', 'しゅ': 'u', 'しょ': 'o',
                'ちゃ': 'a', 'ちゅ': 'u', 'ちょ': 'o',
                'にゃ': 'a', 'にゅ': 'u', 'にょ': 'o',
                'ひゃ': 'a', 'ひゅ': 'u', 'ひょ': 'o',
                'みゃ': 'a', 'みゅ': 'u', 'みょ': 'o',
                'りゃ': 'a', 'りゅ': 'u', 'りょ': 'o',
                'ぎゃ': 'a', 'ぎゅ': 'u', 'ぎょ': 'o',
                'じゃ': 'a', 'じゅ': 'u', 'じょ': 'o',
                'びゃ': 'a', 'びゅ': 'u', 'びょ': 'o',
                'ぴゃ': 'a', 'ぴゅ': 'u', 'ぴょ': 'o'
              };
              
              // 拗音のチェックと音素マッピング
              let phoneme = '';
              // currentMora（現在の音節）が拗音を含む場合はそれを使用
              if (currentMora.length > 1 && phonemeMap[currentMora]) {
                phoneme = phonemeMap[currentMora];
              } else if (phonemeMap[currentChar]) {
                phoneme = phonemeMap[currentChar];
              } else {
                // マッピングがない場合はデフォルト値
                phoneme = currentChar.toLowerCase();
              }
              
              // 音素の詳細な分類
              const plosives = ['か', 'き', 'く', 'け', 'こ', 'が', 'ぎ', 'ぐ', 'げ', 'ご', 'た', 'て', 'と', 'だ', 'で', 'ど', 'ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'];
              const fricatives = ['さ', 'し', 'す', 'せ', 'そ', 'ざ', 'じ', 'ず', 'ぜ', 'ぞ', 'は', 'ひ', 'ふ', 'へ', 'ほ'];
              const nasals = ['な', 'に', 'ぬ', 'ね', 'の', 'ま', 'み', 'む', 'め', 'も', 'ん'];
              const liquids = ['ら', 'り', 'る', 'れ', 'ろ', 'わ', 'を'];
              const semivowels = ['や', 'ゆ', 'よ'];
              
              if (plosives.includes(currentChar[0])) {
                // 破裂音：一時的に口を閉じる
                setCurrentPhoneme('plosive:' + phoneme);
              } else if (fricatives.includes(currentChar[0])) {
                // 摩擦音：口を細める
                setCurrentPhoneme('fricative:' + phoneme);
              } else if (nasals.includes(currentChar[0])) {
                // 鼻音：鼻腔を使う
                setCurrentPhoneme('nasal:' + phoneme);
              } else if (liquids.includes(currentChar[0])) {
                // 流音：舌の位置が重要
                setCurrentPhoneme('liquid:' + phoneme);
              } else if (semivowels.includes(currentChar[0])) {
                // 半母音：母音に近い
                setCurrentPhoneme('semivowel:' + phoneme);
              } else if (currentChar === '、' || currentChar === '。') {
                // 句読点：口を閉じる
                setCurrentPhoneme('pause');
              } else {
                // 母音またはその他
                setCurrentPhoneme('vowel:' + phoneme);
              }
              
              // 進捗を更新
              setSpeechProgress(progress * 100);
              if (onProgress) onProgress(progress * 100);
            }
            
            animationRef.current = requestAnimationFrame(analyzeAudio);
        }
      };
      
      // 再生開始時の処理
      audio.onplay = () => {
        console.log('Audio actually playing, duration:', audio.duration, 'seconds');
        console.log('Audio currentTime:', audio.currentTime);
        console.log('Audio paused:', audio.paused);
        console.log('Audio readyState:', audio.readyState);
        analyzeAudio();
      };

      // 再生終了
      audio.onended = () => {
        console.log('Audio playback ended');
        console.log('Final duration was:', audio.duration, 'seconds');
        setIsCurrentlySpeaking(false);
        setCurrentWord('');
        setSpeechProgress(100);
        setAudioLevel(0);
        setCurrentPhoneme('');
        
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
        
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        
        if (onEnd) onEnd();
      };

      // エラーハンドリング
      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        setIsCurrentlySpeaking(false);
        setIsLoading(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        if (onEnd) onEnd();
      };

      // 音声を再生（ユーザーインタラクション後のみ可能）
      try {
        // 音声がロードされるまで待機（より高速に）
        await new Promise((resolve, reject) => {
          if (audio.readyState >= 2) { // HAVE_CURRENT_DATA以上で再生可能
            resolve(true);
          } else {
            // canplayイベントを使用してより早く再生開始
            audio.oncanplay = () => resolve(true);
            audio.onerror = () => reject(new Error('Audio load error'));
            // タイムアウトを短縮
            setTimeout(() => reject(new Error('Audio load timeout')), 3000);
          }
        });
        
        // 音声初期化がまだの場合は警告のみ
        if (!audioInitializedRef.current) {
          // console.log('Audio not initialized yet, but will try to play anyway');
        }
        
        // Safari対応: ブラウザ検出
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        // 音声要素の設定
        audio.muted = false;
        audio.volume = 1.0;  // 音量を最大に設定

        // Safari対応: playsinlineとcontrolsを設定
        if (isSafari) {
          audio.setAttribute('playsinline', 'true');
          // Safariで音声を強制的に有効化
          audio.load();
        }

        console.log('Audio volume set to:', audio.volume);
        console.log('Audio muted status:', audio.muted);
        console.log('Browser detected:', isSafari ? 'Safari' : 'Other');

        // リップシンクを先行させるため、先にスピーキング状態を設定
        setIsCurrentlySpeaking(true);

        // 音声再生を50ms遅延（リップシンクを先行させる）
        await new Promise(resolve => setTimeout(resolve, 50));

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise
            .then(() => {
              console.log('ElevenLabs audio playback started');
              console.log('Browser:', isSafari ? 'Safari' : 'Other');
              audioInitializedRef.current = true;
            })
            .catch((playError) => {
              // エラーをthrowして下のcatchブロックで処理
              throw playError;
            });
        }
      } catch (playError: any) {
        console.error('ElevenLabs playback error:', playError);

        // NotAllowedErrorの場合は、フォールバックとしてWeb Speech APIを使用
        if (playError.name === 'NotAllowedError') {
          console.warn('⚠️ 音声再生がブロックされました。Web Speech APIにフォールバックします。');
          
          // Web Speech APIを使用してフォールバック
          if (typeof window !== 'undefined' && window.speechSynthesis) {
            try {
              const utterance = new SpeechSynthesisUtterance(text);
              utterance.lang = 'ja-JP';
              utterance.rate = 1.0;
              utterance.pitch = 1.0;
              utterance.volume = 0.8;
              
              utterance.onstart = () => {
                setIsCurrentlySpeaking(true);
                setIsLoading(false);
                // console.log('Fallback to Web Speech API started');
              };
              
              utterance.onend = () => {
                setIsCurrentlySpeaking(false);
                setCurrentWord('');
                setSpeechProgress(100);
                setAudioLevel(0);
                setCurrentPhoneme('');
                if (onEnd) onEnd();
                // console.log('Fallback speech completed');
              };
              
              utterance.onerror = (error) => {
                // console.error('Web Speech API error:', error);
                setIsCurrentlySpeaking(false);
                setIsLoading(false);
                if (onEnd) onEnd();
              };
              
              // 既存の音声をキャンセルしてから再生
              window.speechSynthesis.cancel();
              window.speechSynthesis.speak(utterance);
              
              // 簡易的な進捗更新
              const duration = text.length * 100; // 文字数に基づく推定時間
              const startTime = Date.now();
              
              const updateProgress = () => {
                if (window.speechSynthesis.speaking) {
                  const elapsed = Date.now() - startTime;
                  const progress = Math.min((elapsed / duration) * 100, 100);
                  setSpeechProgress(progress);
                  if (onProgress) onProgress(progress);
                  requestAnimationFrame(updateProgress);
                }
              };
              updateProgress();
            } catch (fallbackError) {
              // console.error('Web Speech API fallback failed:', fallbackError);
              setIsCurrentlySpeaking(false);
              setIsLoading(false);
              if (onEnd) onEnd();
            }
          } else {
            // Web Speech APIも使用できない場合
            setIsCurrentlySpeaking(false);
            setIsLoading(false);
            if (onEnd) onEnd();
          }
          return;
        }
        
        
        // エラー時のクリーンアップ
        setIsCurrentlySpeaking(false);
        setIsLoading(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        if (onEnd) onEnd();
      }
    } catch (error) {
      // console.error('ElevenLabs speech error:', error);
      setIsLoading(false);
      setIsCurrentlySpeaking(false);
      if (onEnd) onEnd();
    }
  }, []);

  const cancel = useCallback(() => {
    // 音声を停止
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    
    // アニメーションフレームをキャンセル
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Audio Contextを閉じる
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // ブラウザの音声合成も停止
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    setIsCurrentlySpeaking(false);
    setCurrentWord('');
    setSpeechProgress(0);
    setAudioLevel(0);
    setCurrentPhoneme('');
    setIsLoading(false);
  }, []);

  // 音声を初期化する関数（ユーザーインタラクション時に呼び出す）
  const initializeAudio = useCallback(async () => {
    if (!audioInitializedRef.current) {
      try {
        // ダミーの音声コンテキストを作成して初期化
        const tempContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // コンテキストが中断状態の場合は再開
        if (tempContext.state === 'suspended') {
          await tempContext.resume();
        }
        
        const oscillator = tempContext.createOscillator();
        const gainNode = tempContext.createGain();
        gainNode.gain.value = 0; // 無音
        oscillator.connect(gainNode);
        gainNode.connect(tempContext.destination);
        oscillator.start();
        oscillator.stop(tempContext.currentTime + 0.01);
      
        setTimeout(() => {
          tempContext.close();
        }, 200);
        
        audioInitializedRef.current = true;
        // console.log('Audio context initialized successfully');
      } catch (error) {
        // console.error('Failed to initialize audio context:', error);
        // エラーが発生してもフラグは立てる（フォールバックを使用）
        audioInitializedRef.current = true;
      }
    }
  }, []);

  return { 
    speak, 
    cancel, 
    isCurrentlySpeaking, 
    currentWord, 
    speechProgress,
    isLoading,
    audioLevel,
    currentPhoneme,
    initializeAudio
  };
}