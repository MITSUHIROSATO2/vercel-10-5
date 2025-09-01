/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 大きなファイルを処理するための設定
  experimental: {
    largePageDataBytes: 200 * 1024 * 1024, // 200MB
  },
  
  // ESLintエラーがあってもビルドを続行
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 静的ファイルの最適化
  staticPageGenerationTimeout: 120, // 120秒
  
  // WebAssemblyサポート（DRACOローダー用）
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };
    
    // GLBファイル用のローダー設定
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      type: 'asset/resource',
    });
    
    return config;
  },
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https://www.gstatic.com; img-src 'self' data: blob: https:; media-src * 'self' blob: data: https: *.elevenlabs.io; connect-src 'self' https: wss: ws: data: blob:; frame-src 'self' https://app.a2e.ai https://*.a2e.ai https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; object-src 'self' data: blob:; worker-src 'self' blob:;",
          },
        ],
      },
      // GLBファイル用のキャッシュ設定
      {
        source: '/models/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig