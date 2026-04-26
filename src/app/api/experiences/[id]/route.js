import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Experience from '@/models/Experience';
import AnalyticsEvent from '@/models/AnalyticsEvent';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const experience = await Experience.findOne({ id }).lean();
    if (!experience) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(experience);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch experience' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const experience = await Experience.findOneAndUpdate({ id }, body, { new: true }).lean();

    if (!experience) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(experience);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update experience' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    await AnalyticsEvent.deleteMany({ experience_id: id });
    await Experience.deleteOne({ id });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete experience' }, { status: 500 });
  }
}
