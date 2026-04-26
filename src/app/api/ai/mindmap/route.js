import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length < 10) {
      return NextResponse.json({ error: 'Content must be at least 10 characters' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fallback without AI
      return NextResponse.json(generateFallbackMindMap(content));
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemma-3-27b-it' });

    const prompt = buildMindMapPrompt(content);

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          return NextResponse.json({
            title: parsed.title || 'Mind Map',
            nodes: parsed.nodes || [],
          });
        } catch (e) {
          console.error('JSON parse error:', e.message);
          return NextResponse.json(generateFallbackMindMap(content));
        }
      } else {
        return NextResponse.json(generateFallbackMindMap(content));
      }
    } catch (geminiError) {
      console.error('Gemini API Error:', geminiError.message);
      return NextResponse.json(generateFallbackMindMap(content));
    }
  } catch (error) {
    console.error('Mind Map API error:', error);
    return NextResponse.json({ error: 'Failed to generate mind map' }, { status: 500 });
  }
}

function buildMindMapPrompt(content) {
  return `You are a brilliant knowledge architect. Your task is to analyze the following content and produce a deeply structured, hierarchical MIND MAP in JSON format.

CONTENT:
"""
${content.substring(0, 5000)}
"""

RULES:
1. Identify the MAIN TOPIC from the content. This becomes the root title.
2. Break it into 4-8 top-level subtopics (these are the primary branches).
3. Each subtopic MUST have 2-5 children (secondary branches) that go deeper into that subtopic.
4. Each secondary branch SHOULD have 1-4 leaf children (tertiary details) for drill-down.
5. Labels should be SHORT (2-6 words max). They must be clear and meaningful.
6. Cover the ENTIRE content — don't skip important ideas.
7. Organize logically — group related concepts under the same parent.

Respond with ONLY valid JSON:
\`\`\`json
{
  "title": "Main Topic Title",
  "nodes": [
    {
      "id": "node-1",
      "label": "Subtopic A",
      "color": "#a78bfa",
      "children": [
        {
          "id": "node-1-1",
          "label": "Detail A.1",
          "children": [
            { "id": "node-1-1-1", "label": "Leaf Detail", "children": [] }
          ]
        },
        {
          "id": "node-1-2",
          "label": "Detail A.2",
          "children": []
        }
      ]
    }
  ]
}
\`\`\`

IMPORTANT: Every node MUST have an "id", "label", and "children" array (empty if leaf). Do NOT add any text outside the JSON block.`;
}

function generateFallbackMindMap(content) {
  const words = content.split(/\s+/);
  const title = words.slice(0, 5).join(' ');

  // Extract some sentences to create a basic structure
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10).slice(0, 6);

  const nodes = sentences.map((sentence, i) => {
    const label = sentence.trim().split(/\s+/).slice(0, 5).join(' ');
    return {
      id: `node-${i + 1}`,
      label: label,
      children: [
        { id: `node-${i + 1}-1`, label: `Key point ${i + 1}.1`, children: [] },
        { id: `node-${i + 1}-2`, label: `Key point ${i + 1}.2`, children: [] },
      ],
    };
  });

  return { title, nodes };
}
