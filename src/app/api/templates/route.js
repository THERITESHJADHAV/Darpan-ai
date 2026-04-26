import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Template from '@/models/Template';
import { seedDatabase } from '@/lib/seed';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await dbConnect();
    await seedDatabase();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');

    let query = {};

    if (category && category !== 'all') {
      query.category = category;
    }
    if (type && type !== 'all') {
      query.type = type;
    }

    const templates = await Template.find(query).sort({ popularity: -1 }).lean();

    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}
