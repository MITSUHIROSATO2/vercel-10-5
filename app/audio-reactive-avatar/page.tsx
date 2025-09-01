'use client';

import { useState, useRef, useEffect } from 'react';
import AudioReactiveAvatar from '@/components/avatar/AudioReactiveAvatar';

export default function AudioReactiveAvatarDemo() {
  const [isListening, setIsListening] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentPhoneme, setCurrentPhoneme] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // 音素検出のシミュレーション（実際の実装では音声認識APIを使用）
  const simulatePhonemeDetection = (audioLevel: number) => {
    const phonemes = ['あ', 'い', 'う', 'え', 'お', 'ん'];
    if (audioLevel > 0.3) {
      const randomPhoneme = phonemes[Math.floor(Math.random() * phonemes.length)];
      setCurrentPhoneme(randomPhoneme);
    } else {
      setCurrentPhoneme('');
    }
  };

  // オーディオコンテキストの初期化
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
    }
  };

  // マイク入力の開始
  const startMicrophone = async () => {
    try {
      initAudioContext();
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      
      const source = audioContextRef.current!.createMediaStreamSource(stream);
      source.connect(analyserRef.current!);
      
      setIsListening(true);
      
      // 音量レベルの監視
      const dataArray = new Uint8Array(analyserRef.current!.frequencyBinCount);
      const updateAudioLevel = () => {
        if (!isListening) return;
        
        analyserRef.current!.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length / 255;
        setAudioLevel(average);
        simulatePhonemeDetection(average);
        
        requestAnimationFrame(updateAudioLevel);
      };
      updateAudioLevel();
    } catch (error) {
      console.error('マイクアクセスエラー:', error);
      alert('マイクへのアクセスが拒否されました。');
    }
  };

  // マイク入力の停止
  const stopMicrophone = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    setIsListening(false);
    setCurrentPhoneme('');
    setAudioLevel(0);
  };

  // 音声ファイルの再生
  const playAudioFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      initAudioContext();
      
      const audioUrl = URL.createObjectURL(file);
      
      if (!audioElementRef.current) {
        audioElementRef.current = new Audio();
      }
      
      audioElementRef.current.src = audioUrl;
      
      const source = audioContextRef.current!.createMediaElementSource(audioElementRef.current);
      source.connect(analyserRef.current!);
      analyserRef.current!.connect(audioContextRef.current!.destination);
      
      audioElementRef.current.play();
      setIsPlayingAudio(true);
      
      // 音量レベルの監視
      const dataArray = new Uint8Array(analyserRef.current!.frequencyBinCount);
      const updateAudioLevel = () => {
        if (!audioElementRef.current || audioElementRef.current.paused) {
          setIsPlayingAudio(false);
          setCurrentPhoneme('');
          setAudioLevel(0);
          return;
        }
        
        analyserRef.current!.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length / 255;
        setAudioLevel(average);
        simulatePhonemeDetection(average);
        
        requestAnimationFrame(updateAudioLevel);
      };
      updateAudioLevel();
      
      audioElementRef.current.onended = () => {
        setIsPlayingAudio(false);
        setCurrentPhoneme('');
        setAudioLevel(0);
      };
    } catch (error) {
      console.error('音声ファイル再生エラー:', error);
    }
  };

  // サンプル音声の再生
  const playSampleText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.9;
      
      // Web Speech APIの音声をAudioContextに接続することは困難なため、
      // ここでは音素を手動でシミュレート
      const phonemeSequence = text.split('').map(char => {
        const mapping: { [key: string]: string } = {
          'こ': 'お', 'ん': 'ん', 'に': 'い', 'ち': 'い', 'は': 'あ',
          'わ': 'あ', 'た': 'あ', 'し': 'い', 'の': 'お', '歯': 'あ',
          'が': 'あ', '痛': 'い', 'く': 'う', 'て': 'え'
        };
        return mapping[char] || 'あ';
      });
      
      let index = 0;
      const animatePhonemes = () => {
        if (index < phonemeSequence.length) {
          setCurrentPhoneme(phonemeSequence[index]);
          setAudioLevel(0.5 + Math.random() * 0.3);
          index++;
          setTimeout(animatePhonemes, 150);
        } else {
          setCurrentPhoneme('');
          setAudioLevel(0);
        }
      };
      
      utterance.onstart = () => {
        setIsPlayingAudio(true);
        animatePhonemes();
      };
      
      utterance.onend = () => {
        setIsPlayingAudio(false);
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // クリーンアップ
  useEffect(() => {
    return () => {
      stopMicrophone();
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-400 mb-8">音声反応型アバターデモ</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl text-blue-300 mb-4">音声入力オプション</h2>
              
              <div className="space-y-4">
                {/* マイク入力 */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">1. マイク入力</h3>
                  <button
                    onClick={isListening ? stopMicrophone : startMicrophone}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                      isListening 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isListening ? '🎤 録音停止' : '🎤 マイクで話す'}
                  </button>
                </div>

                {/* 音声ファイル */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">2. 音声ファイル</h3>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={playAudioFile}
                    className="block w-full text-sm text-gray-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-600 file:text-white
                      hover:file:bg-blue-700"
                  />
                </div>

                {/* サンプル音声 */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">3. サンプル音声</h3>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => playSampleText('こんにちは')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
                    >
                      「こんにちは」
                    </button>
                    <button
                      onClick={() => playSampleText('わたしの歯が痛くて')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
                    >
                      「わたしの歯が痛くて」
                    </button>
                    <button
                      onClick={() => playSampleText('あいうえお')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
                    >
                      「あいうえお」
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ステータス表示 */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl text-blue-300 mb-4">ステータス</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>音声入力:</span>
                  <span className={isListening || isPlayingAudio ? 'text-green-400' : 'text-gray-400'}>
                    {isListening ? 'マイク入力中' : isPlayingAudio ? '音声再生中' : '停止'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>音量レベル:</span>
                  <span className="text-yellow-400">{(audioLevel * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>検出音素:</span>
                  <span className="text-purple-400">{currentPhoneme || 'なし'}</span>
                </div>
              </div>
              
              {/* 音量バー */}
              <div className="mt-4">
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-yellow-400 h-4 rounded-full transition-all duration-150"
                    style={{ width: `${audioLevel * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 説明 */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl text-blue-300 mb-4">アニメーション説明</h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>シェイプキー: 音素に応じて口の形が変化</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>顎ボーン: 低周波数に反応して開閉</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>頭部ボーン: 音量に応じて自然な揺れ</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>胸部ボーン: 呼吸のシミュレーション</span>
                </div>
              </div>
            </div>
          </div>

          {/* アバター表示 */}
          <div className="bg-gray-800 rounded-lg p-6 h-[600px]">
            <AudioReactiveAvatar
              audioAnalyser={analyserRef.current}
              isSpeaking={isListening || isPlayingAudio}
              currentPhoneme={currentPhoneme}
              showDebug={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}