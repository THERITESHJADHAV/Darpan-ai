'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3, Eye, TrendingUp, Users, Share2, ArrowUp, ArrowDown,
  Calendar
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend
} from 'recharts';
import styles from './page.module.css';

const COLORS = ['#a78bfa', '#60a5fa', '#34d399', '#f59e0b', '#f472b6', '#22d3ee'];

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetch(`/api/analytics?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingGrid}>
          {[1,2,3,4].map(i => <div key={i} className={`skeleton ${styles.loadingCard}`} />)}
        </div>
        <div className={`skeleton ${styles.loadingChart}`} />
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    { icon: Eye, label: 'Total Views', value: data.overview?.totalViews?.toLocaleString() || '0', change: '+18.2%', positive: true, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
    { icon: TrendingUp, label: 'Engagement Rate', value: `${data.overview?.engagementRate || 0}%`, change: '+4.5%', positive: true, color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
    { icon: Users, label: 'Total Interactions', value: data.overview?.totalEngagements?.toLocaleString() || '0', change: '+22.1%', positive: true, color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
    { icon: Share2, label: 'Published', value: data.overview?.publishedExperiences || '0', change: 'Active', positive: true, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipLabel}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontSize: '13px' }}>
            {p.name}: <strong>{p.value?.toLocaleString()}</strong>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerIcon}><BarChart3 size={28} /></div>
        <div>
          <h1 className={styles.title}>Analytics</h1>
          <p className={styles.subtitle}>Track your experience performance</p>
        </div>
        <div className={styles.periodSelector}>
          {[{ v: '7', l: '7 days' }, { v: '14', l: '14 days' }, { v: '30', l: '30 days' }].map(p => (
            <button key={p.v} className={`${styles.periodBtn} ${period === p.v ? styles.periodActive : ''}`} onClick={() => setPeriod(p.v)}>
              {p.l}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className={`${styles.statsGrid} stagger-children`}>
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`glass-card stat-card`}>
              <div className="stat-icon" style={{ background: stat.bg, color: stat.color }}><Icon size={22} /></div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <div className={`stat-change positive`}><ArrowUp size={12} /> {stat.change}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className={styles.chartsRow}>
        {/* Main Chart */}
        <div className={`glass-card ${styles.chartCard} ${styles.mainChart}`}>
          <div className={styles.chartHeader}>
            <h3>Views & Engagement</h3>
          </div>
          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.dailyData || []}>
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => v?.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                <Area type="monotone" dataKey="views" name="Views" stroke="#60a5fa" fill="url(#viewsGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="engagements" name="Engagements" stroke="#a78bfa" fill="url(#engGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sources */}
        <div className={`glass-card ${styles.chartCard} ${styles.sideChart}`}>
          <div className={styles.chartHeader}>
            <h3>Traffic Sources</h3>
          </div>
          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.sources || []} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="count" nameKey="source">
                  {(data.sources || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.legendList}>
              {(data.sources || []).map((s, i) => (
                <div key={i} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: COLORS[i % COLORS.length] }} />
                  <span className={styles.legendLabel}>{s.source || 'Unknown'}</span>
                  <span className={styles.legendValue}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Experiences */}
      <div className={`glass-card ${styles.chartCard}`}>
        <div className={styles.chartHeader}>
          <h3>Top Performing Experiences</h3>
        </div>
        <div className={styles.chartBody}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.topExperiences || []} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="title" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="views" name="Views" radius={[0, 6, 6, 0]} maxBarSize={24}>
                {(data.topExperiences || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
