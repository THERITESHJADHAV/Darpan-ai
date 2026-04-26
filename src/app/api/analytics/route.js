import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Experience from '@/models/Experience';
import AnalyticsEvent from '@/models/AnalyticsEvent';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get('period') || '30', 10);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    // Total views and engagements
    const [viewsCount, engagementsCount] = await Promise.all([
      AnalyticsEvent.countDocuments({ event_type: 'view', created_at: { $gte: startDate } }),
      AnalyticsEvent.countDocuments({ event_type: 'engagement', created_at: { $gte: startDate } })
    ]);

    const engagementRate = viewsCount > 0
      ? ((engagementsCount / viewsCount) * 100).toFixed(1)
      : 0;

    // Daily Data aggregation
    const dailyStats = await AnalyticsEvent.aggregate([
      { $match: { created_at: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
            type: "$event_type"
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const dateMap = {};
    dailyStats.forEach(stat => {
      const date = stat._id.date;
      if (!dateMap[date]) dateMap[date] = { date, views: 0, engagements: 0 };
      if (stat._id.type === 'view') dateMap[date].views = stat.count;
      else if (stat._id.type === 'engagement') dateMap[date].engagements = stat.count;
    });

    const dailyData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

    // Top Experiences
    const topExpStats = await AnalyticsEvent.aggregate([
      { $match: { event_type: 'view', created_at: { $gte: startDate } } },
      { $group: { _id: "$experience_id", views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 5 }
    ]);

    const topExperiences = [];
    for (const stat of topExpStats) {
      const exp = await Experience.findOne({ id: stat._id }).lean();
      if (exp) {
        topExperiences.push({ title: exp.title, type: exp.type, id: exp.id, views: stat.views });
      }
    }

    // Source breakdown
    const sourceStats = await AnalyticsEvent.aggregate([
      { $match: { event_type: 'view', created_at: { $gte: startDate } } },
      { $group: { _id: "$metadata.source", count: { $sum: 1 } } }
    ]);

    const sources = sourceStats.map(s => ({
      source: s._id || 'direct',
      count: s.count
    }));

    // Experience count
    const [totalExperiences, publishedExperiences] = await Promise.all([
      Experience.countDocuments(),
      Experience.countDocuments({ status: 'published' })
    ]);

    return NextResponse.json({
      overview: {
        totalViews: viewsCount,
        totalEngagements: engagementsCount,
        engagementRate: parseFloat(engagementRate),
        totalExperiences,
        publishedExperiences,
      },
      dailyData,
      topExperiences,
      sources,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
