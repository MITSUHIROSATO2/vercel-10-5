import { NextRequest, NextResponse } from 'next/server';
import { generatePatientResponse, PatientMessage } from '@/lib/openai';
import { getRandomMockResponse } from '@/lib/mockResponses';

export async function POST(request: NextRequest) {
  console.log('Chat API called');
  
  try {
    const { messages, patientScenario } = await request.json();
    console.log('Received messages:', messages?.length, 'Patient scenario:', patientScenario?.substring(0, 50) + '...');

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'メッセージが必要です' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('Environment check:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- API Key exists:', !!apiKey);
    console.log('- API Key length:', apiKey?.length);
    console.log('- API Key starts with:', apiKey?.substring(0, 7) + '...');
    console.log('- Is dummy key:', apiKey === 'dummy-key-for-build');
    
    if (!apiKey || apiKey === 'your_openai_api_key_here' || apiKey === 'dummy-key-for-build') {
      console.log('No valid API key found, using mock response');
      console.log('Reason: ', !apiKey ? 'No key' : apiKey === 'dummy-key-for-build' ? 'Dummy key' : 'Placeholder key');
      const mockResponse = getRandomMockResponse();
      return NextResponse.json({ response: mockResponse });
    }

    try {
      console.log('Calling OpenAI API...');
      const response = await generatePatientResponse(messages, patientScenario);
      console.log('OpenAI API response received:', response?.substring(0, 50) + '...');
      return NextResponse.json({ response });
    } catch (apiError: any) {
      console.error('OpenAI API Error Details:');
      console.error('Error message:', apiError?.message);
      console.error('Error response:', apiError?.response?.data);
      console.error('Error status:', apiError?.response?.status);
      console.error('Full error:', JSON.stringify(apiError, null, 2));
      
      // If API fails, fall back to mock response
      const mockResponse = getRandomMockResponse();
      console.log('Falling back to mock response:', mockResponse);
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