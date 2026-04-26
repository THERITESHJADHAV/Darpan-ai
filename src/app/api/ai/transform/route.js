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
  return `You are a world-class Explainer Video Director who creates whiteboard animation storyboards. Your job is to turn complex content into a sequence of visually clear, perfectly synchronized scenes.

CONTENT TO EXPLAIN:
"""
${content.substring(0, 4000)}
"""

YOUR TASK:
Create a storyboard with as many scenes as necessary to fully explain the topic. EACH scene must have a narration and an image that PERFECTLY matches. Generate a complete and thorough explanation.

CRITICAL RULES:

**NARRATION RULES:**
1. SIMPLIFY the language. Use analogies, metaphors, and everyday comparisons. Never copy the input verbatim.
2. The narration should be natural and engaging, containing as much detail as necessary to explain the scene fully.
3. The narrations must flow together as a continuous explanation — the first scene introduces, middle scenes explain step-by-step, the last scene concludes.

**IMAGE PROMPT RULES (MOST IMPORTANT):**
1. The imagePrompt MUST describe EXACTLY what the narration is saying. If the narration says "DNA is like a twisted ladder", the image MUST show a twisted ladder that looks like DNA.
2. Be HYPER-SPECIFIC: describe the exact objects, their positions, colors, and relationships. 
3. Include specific visual details: "a red apple falling from a green tree onto a boy's head" NOT "an apple and gravity".
4. Every imagePrompt MUST end with: "clean whiteboard sketch, black ink on white background, simple line drawing, educational diagram style"
5. DO NOT use abstract concepts. Every image must show CONCRETE, DRAWABLE objects.
6. Think: "If I hand this description to an artist, could they draw it in 30 seconds?" If not, simplify.

**BAD imagePrompt example:** "gravity concept with space" (too vague, not drawable)
**GOOD imagePrompt example:** "A large bowling ball sitting on a stretched rubber sheet creating a deep curve, with a small marble rolling down the curve towards the bowling ball, arrows showing the direction of movement, clean whiteboard sketch, black ink on white background, simple line drawing, educational diagram style"

Respond with ONLY valid JSON:
\`\`\`json
{
  "title": "A catchy, descriptive title",
  "scenes": [
    {
      "id": "scene-1",
      "narration": "Short, simple narration sentence here.",
      "imagePrompt": "Hyper-detailed, specific visual description matching the narration exactly, clean whiteboard sketch, black ink on white background, simple line drawing, educational diagram style",
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
