import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { getDb } = require('@/lib/db');
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');

    let query = 'SELECT * FROM templates';
    const conditions = [];
    const params = [];

    if (category && category !== 'all') {
      conditions.push('category = ?');
      params.push(category);
    }
    if (type && type !== 'all') {
      conditions.push('type = ?');
      params.push(type);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY popularity DESC';

    const templates = db.prepare(query).all(...params);

    const parsed = templates.map(t => ({
      ...t,
      blocks: JSON.parse(t.blocks || '[]'),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}
