import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { content, type = 'story', title = '' } = body;

    if (!content || content.trim().length < 10) {
      return NextResponse.json({ error: 'Content must be at least 10 characters' }, { status: 400 });
    }

    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY;

    let blocks;
    let generatedTitle = title;

    if (apiKey) {
      // Use Gemini API
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = buildPrompt(content, type);
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Parse JSON from response
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        blocks = parsed.blocks || [];
        generatedTitle = parsed.title || generatedTitle;
      } else {
        blocks = generateFallbackBlocks(content, type);
      }
    } else {
      // Fallback: generate blocks without AI
      blocks = generateFallbackBlocks(content, type);
      if (!generatedTitle) {
        const words = content.split(/\s+/).slice(0, 6).join(' ');
        generatedTitle = words + (content.split(/\s+/).length > 6 ? '...' : '');
      }
    }

    // Save to DB
    const { getDb } = require('@/lib/db');
    const db = getDb();
    const id = `exp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    db.prepare(`
      INSERT INTO experiences (id, title, description, type, status, content, blocks, tags)
      VALUES (?, ?, ?, ?, 'draft', ?, ?, ?)
    `).run(
      id,
      generatedTitle,
      `AI-generated ${type} experience`,
      type,
      content,
      JSON.stringify(blocks),
      JSON.stringify([type, 'ai-generated'])
    );

    const experience = db.prepare('SELECT * FROM experiences WHERE id = ?').get(id);

    return NextResponse.json({
      ...experience,
      blocks: JSON.parse(experience.blocks),
      tags: JSON.parse(experience.tags),
    });
  } catch (error) {
    console.error('AI Transform error:', error);
    return NextResponse.json({ error: 'Failed to transform content' }, { status: 500 });
  }
}

function buildPrompt(content, type) {
  const typeInstructions = {
    story: 'Create an immersive, scrollable interactive story with a hero section, narrative text blocks, timeline events, image placeholders, and a call-to-action.',
    quiz: 'Create an interactive quiz experience with a hero section, 5 multiple-choice questions based on the content, and a results summary section. Include correct answers.',
    landing: 'Create a high-converting landing page with a hero, features section, testimonials, pricing comparison, and CTA buttons.',
    presentation: 'Create a slide-based presentation with 6-8 slides, each with a title, body text, and optional data points.',
    infographic: 'Create a data-driven infographic with stat blocks, charts data, key findings, and visual sections.',
    microsite: 'Create a multi-section microsite with hero, about, features, gallery, and contact sections.',
  };

  return `You are a content-to-experience transformation engine. Given the following content, transform it into a structured ${type} experience.

${typeInstructions[type] || typeInstructions.story}

CONTENT:
"""
${content.substring(0, 4000)}
"""

Respond with ONLY valid JSON in this exact format:
\`\`\`json
{
  "title": "Generated title based on content",
  "blocks": [
    {
      "id": "unique-id",
      "type": "hero|text|quiz|features|stat|cta|timeline|slide|gallery|accordion|divider|chart",
      "content": { ... block-specific content ... },
      "order": 0
    }
  ]
}
\`\`\`

Block types and their content structure:
- hero: { "title": "...", "subtitle": "..." }
- text: { "body": "..." }
- quiz: { "question": "...", "options": ["A","B","C","D"], "correct": 0 }
- features: { "items": [{ "icon": "emoji", "title": "...", "desc": "..." }] }
- stat: { "value": "85%", "label": "..." }
- cta: { "label": "...", "url": "#" }
- timeline: { "items": [{ "year": "2024", "text": "..." }] }
- slide: { "title": "...", "subtitle": "...", "body": "..." }
- gallery: { "images": [{ "url": "", "caption": "..." }] }
- accordion: { "items": [{ "title": "...", "body": "..." }] }
- divider: {}
- chart: { "type": "bar|line|pie", "data": [...], "labels": [...] }

Generate at least 5-8 blocks. Make the content engaging and professional.`;
}

function generateFallbackBlocks(content, type) {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const words = content.split(/\s+/);
  const titleWords = words.slice(0, 8).join(' ');

  const blocks = [
    {
      id: `block-${Date.now()}-1`,
      type: 'hero',
      content: {
        title: titleWords + (words.length > 8 ? '...' : ''),
        subtitle: 'An interactive experience crafted from your content'
      },
      order: 0
    }
  ];

  if (type === 'quiz') {
    // Generate quiz questions from content
    const chunks = sentences.slice(0, 5);
    chunks.forEach((sentence, i) => {
      blocks.push({
        id: `block-${Date.now()}-q${i}`,
        type: 'quiz',
        content: {
          question: `Based on the content: "${sentence.trim().substring(0, 100)}..."`,
          options: ['True', 'False', 'Partially correct', 'Not mentioned'],
          correct: 0
        },
        order: i + 1
      });
    });
  } else if (type === 'presentation') {
    const chunkSize = Math.ceil(sentences.length / 5);
    for (let i = 0; i < Math.min(6, Math.ceil(sentences.length / chunkSize) + 1); i++) {
      const chunk = sentences.slice(i * chunkSize, (i + 1) * chunkSize);
      blocks.push({
        id: `block-${Date.now()}-s${i}`,
        type: 'slide',
        content: {
          title: `Section ${i + 1}`,
          body: chunk.join('. ').trim() || 'Content section'
        },
        order: i + 1
      });
    }
  } else {
    // Story / landing / infographic / microsite
    if (sentences.length > 0) {
      blocks.push({
        id: `block-${Date.now()}-2`,
        type: 'text',
        content: { body: sentences.slice(0, 3).join('. ').trim() + '.' },
        order: 1
      });
    }

    blocks.push({
      id: `block-${Date.now()}-3`,
      type: 'features',
      content: {
        items: [
          { icon: '✨', title: 'Key Insight #1', desc: sentences[0]?.trim().substring(0, 100) || 'Discover more' },
          { icon: '🎯', title: 'Key Insight #2', desc: sentences[1]?.trim().substring(0, 100) || 'Learn more' },
          { icon: '🚀', title: 'Key Insight #3', desc: sentences[2]?.trim().substring(0, 100) || 'Explore further' },
        ]
      },
      order: 2
    });

    if (sentences.length > 3) {
      blocks.push({
        id: `block-${Date.now()}-4`,
        type: 'text',
        content: { body: sentences.slice(3, 6).join('. ').trim() + '.' },
        order: 3
      });
    }

    blocks.push({
      id: `block-${Date.now()}-5`,
      type: 'stat',
      content: { value: `${words.length}+`, label: 'Words Transformed' },
      order: blocks.length
    });

    blocks.push({
      id: `block-${Date.now()}-6`,
      type: 'cta',
      content: { label: 'Explore More', url: '#' },
      order: blocks.length
    });
  }

  return blocks;
}
