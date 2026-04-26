import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Experience from '@/models/Experience';

export async function POST(request) {
  try {
    const body = await request.json();
    const { content, type = 'story', title = '' } = body;

    if (!content || content.trim().length < 10) {
      return NextResponse.json({ error: 'Content must be at least 10 characters' }, { status: 400 });
    }

    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY;

    let scenes;
    let generatedTitle = title;

    if (apiKey) {
      // Use Gemini API
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemma-3-27b-it' });

      try {
        const prompt = buildVideoPrompt(content);
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Parse JSON from response
        const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            scenes = parsed.scenes || [];
            generatedTitle = parsed.title || generatedTitle;
          } catch (e) {
            scenes = generateFallbackScenes(content);
          }
        } else {
          scenes = generateFallbackScenes(content);
        }
      } catch (geminiError) {
        console.error('Gemini API Error, falling back:', geminiError.message);
        scenes = generateFallbackScenes(content);
        if (!generatedTitle) {
          const words = content.split(/\s+/).slice(0, 6).join(' ');
          generatedTitle = words + (content.split(/\s+/).length > 6 ? '...' : '');
        }
      }
    } else {
      // Fallback: generate blocks without AI
      scenes = generateFallbackScenes(content);
      if (!generatedTitle) {
        const words = content.split(/\s+/).slice(0, 6).join(' ');
        generatedTitle = words + (content.split(/\s+/).length > 6 ? '...' : '');
      }
    }

    // Save to DB
    await dbConnect();
    const id = `exp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const experience = await Experience.create({
      id,
      title: generatedTitle,
      description: `Animated Explainer Video`,
      type: 'video',
      status: 'draft',
      content,
      blocks: scenes.map((s, i) => ({ 
        id: `scene-${i}`,
        type: 'scene', 
        content: { ...s } 
      })),
      tags: ['video', 'ai-generated']
    });

    return NextResponse.json(experience);
  } catch (error) {
    console.error('AI Transform error:', error);
    return NextResponse.json({ error: 'Failed to transform content' }, { status: 500 });
  }
}

function buildVideoPrompt(content) {
  return `You are an expert Explainer Video Director (like Kurzgesagt or TED-Ed). Given the following complex educational content, break it down into a highly engaging, visually descriptive 4-6 scene video storyboard.

CONTENT:
"""
${content.substring(0, 4000)}
"""

RULES:
1. Create a dynamic number of scenes (between 2 and 8) depending on the length and complexity of the content to perfectly explain the topic without rushing. The scenes must flow seamlessly as one single explaining video.
2. SIMPLIFY THE LANGUAGE: Do not just copy the user's text. Convert it into simpler language using analogies and visual metaphors without changing the actual meaning.
3. For each scene, write a "narration" script. THIS MUST BE SHORT (1-2 sentences max) so the text annotation doesn't cover the whole screen.
4. For each scene, write a highly descriptive "imagePrompt" that visualizes the metaphor so the user doesn't have to imagine it. It should end with "flat vector illustration, bold vibrant colors, minimalist, high quality, whiteboard style".

Respond with ONLY valid JSON in this exact format:
\`\`\`json
{
  "title": "A catchy title for the video",
  "scenes": [
    {
      "id": "scene-1",
      "narration": "Imagine gravity not as a pull, but as a giant cosmic trampoline...",
      "imagePrompt": "A bowling ball resting on a trampoline fabric creating a dip, flat vector illustration, bold vibrant colors, minimalist, high quality, whiteboard style",
      "animation": "zoomIn"
    }
  ]
}
\`\`\`
The "animation" field must be one of: "zoomIn", "panLeft", "panRight".`;
}

function generateFallbackScenes(content) {
  const words = content.split(/\s+/);
  const titleWords = words.slice(0, 8).join(' ');

  return [
    {
      id: `scene-1`,
      narration: "Welcome to this interactive video. We make complex ideas simple.",
      imagePrompt: "A cartoon teacher pointing at a simple diagram on a whiteboard, flat vector illustration, bold vibrant colors, whiteboard style",
      animation: "zoomIn"
    },
    {
      id: `scene-2`,
      narration: "Instead of hard words, we use pictures and metaphors you can see.",
      imagePrompt: "A magical glowing brain emitting colorful lightbulbs, flat vector illustration, bold vibrant colors, whiteboard style",
      animation: "panRight"
    }
  ];
}
