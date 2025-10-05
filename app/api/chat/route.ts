import { NextRequest, NextResponse } from 'next/server';
import { generatePatientResponse } from '@/lib/openai';
import { getRandomMockResponse } from '@/lib/mockResponses';

export async function POST(request: NextRequest) {
  console.log('Chat API called');

  try {
    const { messages, patientScenario, language = 'ja' } = await request.json();
    console.log('Received messages:', messages?.length, 'Language:', language, 'Patient scenario:', patientScenario?.substring(0, 50) + '...');

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'メッセージが必要です' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    const isProduction = process.env.NODE_ENV === 'production';

    if (!isProduction) {
      console.log('Environment check:');
      console.log('- NODE_ENV:', process.env.NODE_ENV);
      console.log('- API Key configured:', !!apiKey);
      console.log('- Using dummy key:', apiKey === 'dummy-key-for-build');
    }
    
    if (!apiKey || apiKey === 'your_openai_api_key_here' || apiKey === 'dummy-key-for-build') {
      if (!isProduction) {
        console.log('No valid API key found, using mock response');
        console.log('Reason: ', !apiKey ? 'No key' : apiKey === 'dummy-key-for-build' ? 'Dummy key' : 'Placeholder key');
      }
      const mockResponse = getRandomMockResponse(language);
      return NextResponse.json({ response: mockResponse });
    }

    try {
      if (!isProduction) {
        console.log('Calling OpenAI API...');
      }
      const response = await generatePatientResponse(messages, patientScenario, language);
      if (!isProduction) {
        console.log('OpenAI API response received');
      }
      return NextResponse.json({ response });
    } catch (apiError: any) {
      if (!isProduction) {
        console.error('OpenAI API Error Details:');
        console.error('Error message:', apiError?.message);
        console.error('Error response:', apiError?.response?.data);
        console.error('Error status:', apiError?.response?.status);
      } else {
        console.error('OpenAI API request failed');
      }

      // If API fails, fall back to mock response
      const mockResponse = getRandomMockResponse();
      if (!isProduction) {
        console.log('Falling back to mock response');
      }
      return NextResponse.json({ response: mockResponse });
    }
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'エラーが発生しました' },
      { status: 500 }
    );
  }
}
