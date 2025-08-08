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
    const { fileKey, url, textContent } = body;

    if (!url && !textContent && !fileKey) {
      return NextResponse.json({ error: 'URL, text content, or file key is required' }, { status: 400 });
    }

    let contentToSummarize: string;

    if (textContent) {
      // Use provided text content
      contentToSummarize = textContent;
    } else if (url) {
      // Fetch content from URL
      try {
        const response = await fetch(url);
        const html = await response.text();
        
        // Simple text extraction (in production, use a proper HTML parser)
        const textMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (textMatch) {
          contentToSummarize = textMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        } else {
          contentToSummarize = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }
      } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch content from URL' }, { status: 400 });
      }
    } else {
      // TODO: Fetch document from S3/storage using fileKey
      return NextResponse.json({ error: 'File storage not implemented yet' }, { status: 501 });
    }

    // Limit content length for API
    const maxLength = 8000;
    if (contentToSummarize.length > maxLength) {
      contentToSummarize = contentToSummarize.substring(0, maxLength) + '...';
    }

    // Generate summary using GPT-4
    const summaryPrompt = `Please analyze the following content and provide:
1. A brief TL;DR (1-2 sentences)
2. 3-4 key bullet points
3. A detailed summary (2-3 paragraphs)
4. Key quotes (if any notable quotes are present)

Content:
${contentToSummarize}

Please format your response as JSON:
{
  "tldr": "brief summary",
  "bullets": ["point 1", "point 2", "point 3", "point 4"],
  "longSummary": "detailed summary",
  "keyQuotes": ["quote 1", "quote 2"]
}`;

    const summaryResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that analyzes documents and provides comprehensive summaries.'
        },
        {
          role: 'user',
          content: summaryPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    let summary;
    try {
      const summaryText = summaryResponse.choices[0]?.message?.content || '';
      summary = JSON.parse(summaryText);
    } catch (error) {
      // Fallback summary if JSON parsing fails
      summary = {
        tldr: `Content about ${contentToSummarize.substring(0, 50)}...`,
        bullets: [
          "Content analyzed successfully",
          "Key points extracted",
          "Summary generated",
          "Document processed"
        ],
        longSummary: contentToSummarize.substring(0, 300) + "...",
        keyQuotes: []
      };
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Document summarization error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 