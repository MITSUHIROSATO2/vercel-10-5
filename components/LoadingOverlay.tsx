'use client';

import React from 'react';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export default function LoadingOverlay({ isLoading, message = 'アバターを読み込み中...' }: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-sky-50/95 backdrop-blur-sm">
      <div className="text-center">
        {/* シンプルな回転サークル */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          {/* メインの回転サークル */}
          <div className="absolute inset-0">
            <div className="w-20 h-20 border-4 border-sky-200 rounded-full"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-sky-500 rounded-full animate-spin"></div>
          </div>
          
          {/* 中央の歯科アイコン */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-sky-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C9.62 2 7.56 3.56 7.11 5.68C6.76 5.42 6.32 5.26 5.84 5.26c-1.16 0-2.11.95-2.11 2.11 0 .27.05.52.14.76C2.72 8.88 2 10.17 2 11.61 2 13.84 3.74 15.65 5.95 15.91c.44 1.55 1.59 2.83 3.06 3.52.65.89 1.71 1.47 2.91 1.47s2.26-.58 2.91-1.47c1.47-.69 2.62-1.97 3.06-3.52C20.1 15.65 21.84 13.84 21.84 11.61c0-1.44-.72-2.73-1.87-3.48.09-.24.14-.49.14-.76 0-1.16-.95-2.11-2.11-2.11-.48 0-.92.16-1.27.42C16.28 3.56 14.22 2 11.84 2H12zm0 2.5c1.5 0 2.75 1.06 3.07 2.47.13.58.65.98 1.23.98.1 0 .2-.01.3-.03.18-.04.37-.06.56-.06.14 0 .25.11.25.25s-.11.25-.25.25c-.61 0-1.18.23-1.62.62-.31.28-.47.68-.43 1.09.04.41.26.78.59 1.01 1.07.72 1.71 1.92 1.71 3.23 0 1.3-.64 2.52-1.71 3.24-.48.32-.62 1-.29 1.47.24.35.36.77.36 1.2 0 .38-.1.74-.27 1.06-.42-.32-.92-.56-1.48-.69.07-.19.11-.39.11-.61 0-1.04-.84-1.88-1.88-1.88s-1.88.84-1.88 1.88c0 .22.04.42.11.61-.56.13-1.06.37-1.48.69-.17-.32-.27-.68-.27-1.06 0-.43.12-.85.36-1.2.33-.47.19-1.15-.29-1.47-1.07-.72-1.71-1.94-1.71-3.24 0-1.31.64-2.51 1.71-3.23.33-.23.55-.6.59-1.01.04-.41-.12-.81-.43-1.09-.44-.39-1.01-.62-1.62-.62-.14 0-.25-.11-.25-.25s.11-.25.25-.25c.19 0 .38.02.56.06.1.02.2.03.3.03.58 0 1.1-.4 1.23-.98C9.09 5.56 10.34 4.5 11.84 4.5H12z"/>
            </svg>
          </div>
        </div>
        
        {/* ローディングテキスト */}
        <p className="text-sky-900 text-lg font-medium">{message}</p>
      </div>
    </div>
  );
}