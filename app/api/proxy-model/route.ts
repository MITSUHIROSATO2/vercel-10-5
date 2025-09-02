import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // URLをクリーンアップ（改行や余分な空白を削除）
    const cleanUrl = url.trim().replace(/[\r\n]/g, '');
    
    console.log('Proxy fetching URL:', cleanUrl);

    // Blob StorageのURLをプロキシ
    const response = await fetch(cleanUrl);
    
    if (!response.ok) {
      console.error('Failed to fetch model:', response.status, response.statusText);
      return NextResponse.json({ error: `Failed to fetch model: ${response.status}` }, { status: response.status });
    }

    const data = await response.arrayBuffer();
    
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': 'model/gltf-binary',
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}