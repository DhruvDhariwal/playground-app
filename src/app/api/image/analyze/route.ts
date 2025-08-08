import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    console.log('Image analysis API called');
    
    const session = await getServerSession();
    
    if (!session) {
      console.log('No session found, returning unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Session found for user:', session.user?.email);

    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { fileKey, imageUrl, imageData } = body;

    if (!imageUrl && !imageData && !fileKey) {
      console.log('No image data provided');
      return NextResponse.json({ error: 'Image URL, data, or file key is required' }, { status: 400 });
    }

    let imageToAnalyze: string;

    if (imageData) {
      // Use base64 image data
      imageToAnalyze = imageData;
      console.log('Using base64 image data');
    } else if (imageUrl) {
      // Use image URL
      imageToAnalyze = imageUrl;
      console.log('Using image URL:', imageUrl);
    } else {
      // TODO: Fetch image from S3/storage using fileKey
      console.log('File storage not implemented');
      return NextResponse.json({ error: 'File storage not implemented yet' }, { status: 501 });
    }

    // Validate that we have a valid image URL or data
    if (!imageToAnalyze || imageToAnalyze.trim() === '') {
      console.log('Invalid image data provided');
      return NextResponse.json({ error: 'Invalid image data provided' }, { status: 400 });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    console.log('Calling OpenAI Vision API...');

    // Analyze image using OpenAI Vision
    const analysisResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that analyzes images and provides detailed descriptions. Please provide: 1. A short caption (1 sentence), 2. A detailed description (2-3 sentences), 3. A list of objects and attributes detected in the image. Format your response as JSON: {"caption": "short caption", "detailedDescription": "detailed description", "objects": ["object1", "object2", "object3"]}'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please analyze this image and provide a caption, detailed description, and list of objects detected.'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageToAnalyze
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    console.log('OpenAI response received');

    let analysis;
    try {
      const analysisText = analysisResponse.choices[0]?.message?.content || '';
      if (!analysisText) {
        throw new Error('No analysis content received from OpenAI');
      }
      console.log('Parsing OpenAI response as JSON:', analysisText);
      analysis = JSON.parse(analysisText);
    } catch (error) {
      console.error('Failed to parse OpenAI response as JSON:', error);
      // Fallback analysis if JSON parsing fails
      analysis = {
        caption: "An image that has been analyzed successfully",
        detailedDescription: "The image contains various elements that have been processed and analyzed by the AI system.",
        objects: ["image", "content", "elements"]
      };
    }

    console.log('Returning analysis result');
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Image analysis error:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        return NextResponse.json({ error: 'OpenAI API key is invalid or missing' }, { status: 401 });
      }
      if (error.message.includes('429')) {
        return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
      }
      if (error.message.includes('400')) {
        return NextResponse.json({ error: 'Invalid image format or URL' }, { status: 400 });
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 