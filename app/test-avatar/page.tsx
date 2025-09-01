'use client';

import { useState } from 'react';
// SimplifiedLipSyncAvatar component is not implemented yet
// import SimplifiedLipSyncAvatar from '@/components/SimplifiedLipSyncAvatar';

export default function TestAvatarPage() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0.5);
  const [currentWord, setCurrentWord] = useState('テスト');
  
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">アバターアニメーションテスト</h1>
        
        {/* アバター表示 */}
        <div className="mb-8 bg-gray-800 rounded-lg p-6 h-[400px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 mb-4">SimplifiedLipSyncAvatar component is not implemented yet</p>
            <p className="text-sm text-gray-500">
              Speaking: {isSpeaking ? 'Yes' : 'No'}<br />
              Audio Level: {(audioLevel * 100).toFixed(0)}%<br />
              Current Word: {currentWord}
            </p>
          </div>
        </div>
        
        {/* コントロールパネル */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">コントロール</h2>
          
          <div className="space-y-4">
            {/* 話す/停止ボタン */}
            <div>
              <button
                onClick={() => setIsSpeaking(!isSpeaking)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isSpeaking 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isSpeaking ? '停止' : '話す'}
              </button>
            </div>
            
            {/* オーディオレベル */}
            <div>
              <label className="text-white block mb-2">
                オーディオレベル: {(audioLevel * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={audioLevel}
                onChange={(e) => setAudioLevel(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            {/* テストワード */}
            <div>
              <label className="text-white block mb-2">テストワード:</label>
              <input
                type="text"
                value={currentWord}
                onChange={(e) => setCurrentWord(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                placeholder="日本語のテキストを入力"
              />
            </div>
            
            {/* プリセットボタン */}
            <div>
              <label className="text-white block mb-2">プリセット:</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    setCurrentWord('こんにちは');
                    setIsSpeaking(true);
                    setAudioLevel(0.7);
                  }}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
                >
                  こんにちは
                </button>
                <button
                  onClick={() => {
                    setCurrentWord('ありがとうございます');
                    setIsSpeaking(true);
                    setAudioLevel(0.8);
                  }}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
                >
                  ありがとう
                </button>
                <button
                  onClick={() => {
                    setCurrentWord('痛みはありますか');
                    setIsSpeaking(true);
                    setAudioLevel(0.6);
                  }}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
                >
                  痛みはありますか
                </button>
              </div>
            </div>
            
            {/* アニメーションテスト */}
            <div>
              <label className="text-white block mb-2">アニメーションテスト:</label>
              <button
                onClick={() => {
                  let level = 0;
                  const interval = setInterval(() => {
                    level += 0.1;
                    if (level > 1) {
                      level = 0;
                    }
                    setAudioLevel(level);
                  }, 100);
                  
                  setTimeout(() => {
                    clearInterval(interval);
                    setAudioLevel(0.5);
                  }, 5000);
                  
                  setIsSpeaking(true);
                }}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded"
              >
                5秒間のアニメーション
              </button>
            </div>
          </div>
        </div>
        
        {/* 説明 */}
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">説明</h2>
          <ul className="text-gray-300 space-y-2">
            <li>• 「話す」ボタンでリップシンクアニメーションを開始/停止</li>
            <li>• オーディオレベルで口の開き具合を調整</li>
            <li>• プリセットボタンで一般的なフレーズをテスト</li>
            <li>• アニメーションテストで動的な変化を確認</li>
            <li>• ブラウザのコンソールでデバッグ情報を確認</li>
          </ul>
        </div>
      </div>
    </div>
  );
}