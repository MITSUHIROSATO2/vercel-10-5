import { useEffect, useRef, useState } from 'react';

interface AudioAnalyzerHook {
  volume: number;
  frequency: number;
  startAnalyzing: () => void;
  stopAnalyzing: () => void;
}

export function useAudioAnalyzer(): AudioAnalyzerHook {
  const [volume, setVolume] = useState(0);
  const [frequency, setFrequency] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const startAnalyzing = async () => {
    try {
      // Web Audio APIのセットアップ
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      // マイクからの音声を取得
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      // 音声データの解析
      const analyze = () => {
        if (!analyserRef.current) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // 音量を計算
        const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
        setVolume(average / 255); // 0-1の範囲に正規化

        // 主要周波数を計算
        const maxIndex = dataArray.indexOf(Math.max(...Array.from(dataArray)));
        const freq = (maxIndex * audioContextRef.current!.sampleRate) / (analyserRef.current.fftSize * 2);
        setFrequency(freq);

        animationRef.current = requestAnimationFrame(analyze);
      };

      analyze();
    } catch (error) {
      console.error('Failed to start audio analysis:', error);
    }
  };

  const stopAnalyzing = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setVolume(0);
    setFrequency(0);
  };

  useEffect(() => {
    return () => {
      stopAnalyzing();
    };
  }, []);

  return { volume, frequency, startAnalyzing, stopAnalyzing };
}