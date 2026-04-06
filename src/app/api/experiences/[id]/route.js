import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { getDb } = require('@/lib/db');
    const db = getDb();
    const { id } = await params;

    const experience = db.prepare('SELECT * FROM experiences WHERE id = ?').get(id);
    if (!experience) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...experience,
      blocks: JSON.parse(experience.blocks || '[]'),
      tags: JSON.parse(experience.tags || '[]'),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch experience' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { getDb } = require('@/lib/db');
    const db = getDb();
    const { id } = await params;
    const body = await request.json();

    const updates = [];
    const values = [];

    if (body.title !== undefined) { updates.push('title = ?'); values.push(body.title); }
    if (body.description !== undefined) { updates.push('description = ?'); values.push(body.description); }
    if (body.type !== undefined) { updates.push('type = ?'); values.push(body.type); }
    if (body.status !== undefined) { updates.push('status = ?'); values.push(body.status); }
    if (body.content !== undefined) { updates.push('content = ?'); values.push(body.content); }
    if (body.blocks !== undefined) { updates.push('blocks = ?'); values.push(JSON.stringify(body.blocks)); }
    if (body.tags !== undefined) { updates.push('tags = ?'); values.push(JSON.stringify(body.tags)); }

    updates.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE experiences SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const experience = db.prepare('SELECT * FROM experiences WHERE id = ?').get(id);

    return NextResponse.json({
      ...experience,
      blocks: JSON.parse(experience.blocks || '[]'),
      tags: JSON.parse(experience.tags || '[]'),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update experience' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { getDb } = require('@/lib/db');
    const db = getDb();
    const { id } = await params;

    db.prepare('DELETE FROM analytics_events WHERE experience_id = ?').run(id);
    db.prepare('DELETE FROM experiences WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete experience' }, { status: 500 });
  }
}
