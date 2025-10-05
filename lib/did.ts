const DID_API_KEY = process.env.DID_API_KEY || process.env.NEXT_PUBLIC_DID_API_KEY;
const DID_API_URL = 'https://api.d-id.com';

export interface TalkResponse {
  id: string;
  status: string;
  result_url?: string;
}

export async function createTalkingHead(text: string, sourceUrl?: string): Promise<TalkResponse> {
  if (!DID_API_KEY) {
    throw new Error('D-ID API key is not configured');
  }

  try {
    // D-ID API requires Bearer token, not Basic auth
    const response = await fetch(`${DID_API_URL}/talks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: sourceUrl || "https://d-id-public-bucket.s3.amazonaws.com/alice.jpg",
        script: {
          type: "text",
          subtitles: false,
          provider: {
            type: "microsoft",
            voice_id: "ja-JP-NanamiNeural"
          },
          input: text
        },
        config: {
          fluent: true,
          pad_audio: 0.0
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('D-ID API Response:', errorData);
      throw new Error(`D-ID API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('D-ID API Error:', error);
    throw error;
  }
}

export async function getTalkStatus(talkId: string): Promise<TalkResponse> {
  if (!DID_API_KEY) {
    throw new Error('D-ID API key is not configured');
  }

  try {
    const response = await fetch(`${DID_API_URL}/talks/${talkId}`, {
      headers: {
        'Authorization': `Bearer ${DID_API_KEY}`,
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('D-ID API Response:', errorData);
      throw new Error(`D-ID API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('D-ID Get Talk Error:', error);
    throw error;
  }
}
