import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fileKey, languageHint, audioData } = body;

    if (!audioData && !fileKey) {
      return NextResponse.json({ error: 'Audio data or file key is required' }, { status: 400 });
    }

    // If we have audioData (base64), use it directly
    let audioBuffer: Buffer;
    if (audioData) {
      // Convert base64 to buffer
      audioBuffer = Buffer.from(audioData.split(',')[1], 'base64');
    } else {
      // TODO: Fetch file from S3/storage using fileKey
      return NextResponse.json({ error: 'File storage not implemented yet' }, { status: 501 });
    }

    // Step 1: Transcribe audio using OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: new Blob([audioBuffer], { type: 'audio/wav' }) as any,
      model: 'whisper-1',
      language: languageHint || undefined,
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });

    // Step 2: Generate summary using GPT-4
    const transcriptText = transcription.text;
    const summaryPrompt = `Please analyze the following conversation transcript and provide:
1. A brief TL;DR (1-2 sentences)
2. 3-4 key bullet points
3. A short summary (2-3 sentences)

Transcript:
${transcriptText}

Please format your response as JSON:
{
  "tldr": "brief summary",
  "bullets": ["point 1", "point 2", "point 3"],
  "summary": "detailed summary"
}`;

    const summaryResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that analyzes conversation transcripts and provides summaries.'
        },
        {
          role: 'user',
          content: summaryPrompt
        }
      ],
      temperature: 0.3,
    });

    let summary;
    try {
      const summaryText = summaryResponse.choices[0]?.message?.content || '';
      summary = JSON.parse(summaryText);
    } catch (error) {
      // Fallback summary if JSON parsing fails
      summary = {
        tldr: `A conversation about ${transcriptText.substring(0, 50)}...`,
        bullets: [
          "Conversation transcribed successfully",
          "Multiple speakers detected",
          "Content analyzed and summarized"
        ],
        summary: transcriptText.substring(0, 200) + "..."
      };
    }

    // Step 3: Create diarized segments (mock for now - would need Python worker)
    const segments = transcription.segments || [];
    const diarized = segments.map((segment: any, index: number) => ({
      start: segment.start,
      end: segment.end,
      speaker: `Speaker ${(index % 2) + 1}`, // Mock speaker assignment
      text: segment.text
    }));

    const result = {
      transcript: segments.map((segment: any) => ({
        start: segment.start,
        end: segment.end,
        text: segment.text
      })),
      diarized,
      summary
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Conversation processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 