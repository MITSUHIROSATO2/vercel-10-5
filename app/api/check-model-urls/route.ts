import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    adult: process.env.NEXT_PUBLIC_MODEL_ADULT || 'not set',
    boy: process.env.NEXT_PUBLIC_MODEL_BOY || 'not set',
    boy_improved: process.env.NEXT_PUBLIC_MODEL_BOY_IMPROVED || 'not set',
    female: process.env.NEXT_PUBLIC_MODEL_FEMALE || 'not set',
  });
}