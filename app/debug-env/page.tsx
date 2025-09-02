'use client';

export default function DebugEnvPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">環境変数デバッグ</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold mb-4">Blob Storage URLs</h2>
        
        <div className="space-y-2">
          <div>
            <span className="font-mono text-gray-400">NEXT_PUBLIC_MODEL_ADULT:</span>
            <div className="font-mono text-sm text-green-400 break-all">
              {process.env.NEXT_PUBLIC_MODEL_ADULT || '❌ 未設定'}
            </div>
          </div>
          
          <div>
            <span className="font-mono text-gray-400">NEXT_PUBLIC_MODEL_BOY:</span>
            <div className="font-mono text-sm text-green-400 break-all">
              {process.env.NEXT_PUBLIC_MODEL_BOY || '❌ 未設定'}
            </div>
          </div>
          
          <div>
            <span className="font-mono text-gray-400">NEXT_PUBLIC_MODEL_BOY_IMPROVED:</span>
            <div className="font-mono text-sm text-green-400 break-all">
              {process.env.NEXT_PUBLIC_MODEL_BOY_IMPROVED || '❌ 未設定'}
            </div>
          </div>
          
          <div>
            <span className="font-mono text-gray-400">NEXT_PUBLIC_MODEL_FEMALE:</span>
            <div className="font-mono text-sm text-green-400 break-all">
              {process.env.NEXT_PUBLIC_MODEL_FEMALE || '❌ 未設定'}
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-700 rounded">
          <h3 className="font-semibold mb-2">チェックリスト:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>環境変数をVercelダッシュボードで設定した ✓</li>
            <li>「Save」ボタンをクリックした ✓</li>
            <li>再デプロイを実行した（キャッシュなし）</li>
            <li>デプロイが完了するまで待った</li>
          </ul>
        </div>
      </div>
    </div>
  );
}