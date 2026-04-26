import { NextResponse } from 'next/server';
import * as googleTTS from 'google-tts-api';

export async function POST(request) {
  try {
    const { text, lang = 'en' } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Google TTS limits to 200 chars. We just use the first URL.
    // The AI should be prompted to keep narration short per scene.
    const url = googleTTS.getAudioUrl(text.substring(0, 200), {
      lang,
      slow: false,
      host: 'https://translate.google.com',
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: 'Failed to generate TTS' }, { status: 500 });
  }
}
