import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Experience from '@/models/Experience';
import { seedDatabase } from '@/lib/seed';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    await seedDatabase();

    const experiences = await Experience.find().sort({ updated_at: -1 }).lean();

    return NextResponse.json(experiences);
  } catch (error) {
    console.error('GET /api/experiences error:', error);
    return NextResponse.json({ error: 'Failed to fetch experiences' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
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

    const experience = await Experience.create({
      id,
      title,
      description,
      type,
      status: 'draft',
      content,
      blocks,
      tags
    });

    return NextResponse.json(experience, { status: 201 });
  } catch (error) {
    console.error('POST /api/experiences error:', error);
    return NextResponse.json({ error: 'Failed to create experience' }, { status: 500 });
  }
}
