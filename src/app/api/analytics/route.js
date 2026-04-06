import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { getDb } = require('@/lib/db');
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30';

    const daysAgo = parseInt(period);

    // Total views
    const totalViews = db.prepare(`
      SELECT COUNT(*) as count FROM analytics_events
      WHERE event_type = 'view' AND created_at >= datetime('now', '-${daysAgo} days')
    `).get();

    // Total engagements
    const totalEngagements = db.prepare(`
      SELECT COUNT(*) as count FROM analytics_events
      WHERE event_type = 'engagement' AND created_at >= datetime('now', '-${daysAgo} days')
    `).get();

    // Engagement rate
    const engagementRate = totalViews.count > 0
      ? ((totalEngagements.count / totalViews.count) * 100).toFixed(1)
      : 0;

    // Views per day
    const viewsByDay = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as views
      FROM analytics_events
      WHERE event_type = 'view' AND created_at >= datetime('now', '-${daysAgo} days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).all();

    // Engagements per day
    const engagementsByDay = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as engagements
      FROM analytics_events
      WHERE event_type = 'engagement' AND created_at >= datetime('now', '-${daysAgo} days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).all();

    // Merge views and engagements by day
    const dateMap = {};
    viewsByDay.forEach(d => { dateMap[d.date] = { date: d.date, views: d.views, engagements: 0 }; });
    engagementsByDay.forEach(d => {
      if (dateMap[d.date]) dateMap[d.date].engagements = d.engagements;
      else dateMap[d.date] = { date: d.date, views: 0, engagements: d.engagements };
    });
    const dailyData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

    // Top experiences
    const topExperiences = db.prepare(`
      SELECT e.title, e.type, e.id, COUNT(a.id) as views
      FROM experiences e
      LEFT JOIN analytics_events a ON a.experience_id = e.id AND a.event_type = 'view'
        AND a.created_at >= datetime('now', '-${daysAgo} days')
      GROUP BY e.id
      ORDER BY views DESC
      LIMIT 5
    `).all();

    // Source breakdown
    const sources = db.prepare(`
      SELECT json_extract(metadata, '$.source') as source, COUNT(*) as count
      FROM analytics_events
      WHERE event_type = 'view' AND created_at >= datetime('now', '-${daysAgo} days')
      GROUP BY source
    `).all();

    // Experience count
    const totalExperiences = db.prepare('SELECT COUNT(*) as count FROM experiences').get();
    const publishedExperiences = db.prepare("SELECT COUNT(*) as count FROM experiences WHERE status = 'published'").get();

    return NextResponse.json({
      overview: {
        totalViews: totalViews.count,
        totalEngagements: totalEngagements.count,
        engagementRate: parseFloat(engagementRate),
        totalExperiences: totalExperiences.count,
        publishedExperiences: publishedExperiences.count,
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
