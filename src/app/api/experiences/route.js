import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { getDb } = require('@/lib/db');
    const db = getDb();

    const experiences = db.prepare('SELECT * FROM experiences ORDER BY updated_at DESC').all();

    const parsed = experiences.map(exp => ({
      ...exp,
      blocks: exp.blocks ? JSON.parse(exp.blocks) : [],
      tags: exp.tags ? JSON.parse(exp.tags) : [],
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('GET /api/experiences error:', error);
    return NextResponse.json({ error: 'Failed to fetch experiences' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { getDb } = require('@/lib/db');
    const db = getDb();
    const body = await request.json();

    const id = `exp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const {
      title = 'Untitled Experience',
      description = '',
      type = 'story',
      content = '',
      blocks = [],
      tags = [],
    } = body;

    db.prepare(`
      INSERT INTO experiences (id, title, description, type, status, content, blocks, tags)
      VALUES (?, ?, ?, ?, 'draft', ?, ?, ?)
    `).run(id, title, description, type, content, JSON.stringify(blocks), JSON.stringify(tags));

    const experience = db.prepare('SELECT * FROM experiences WHERE id = ?').get(id);

    return NextResponse.json({
      ...experience,
      blocks: JSON.parse(experience.blocks || '[]'),
      tags: JSON.parse(experience.tags || '[]'),
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/experiences error:', error);
    return NextResponse.json({ error: 'Failed to create experience' }, { status: 500 });
  }
}
