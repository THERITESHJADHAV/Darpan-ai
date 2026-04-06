'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles, Eye, TrendingUp, Layers, ArrowRight, Clock,
  Zap, BarChart3, Plus, BookOpen, Brain, Rocket, Presentation,
  PieChart, Globe
} from 'lucide-react';
import styles from './page.module.css';

const typeIcons = {
  story: BookOpen,
  quiz: Brain,
  landing: Rocket,
  presentation: Presentation,
  infographic: PieChart,
  microsite: Globe,
};

const typeColors = {
  story: '#a78bfa',
  quiz: '#34d399',
  landing: '#f59e0b',
  presentation: '#60a5fa',
  infographic: '#f472b6',
  microsite: '#22d3ee',
};

export default function Dashboard() {
  const [experiences, setExperiences] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [expRes, analyticsRes] = await Promise.all([
          fetch('/api/experiences'),
          fetch('/api/analytics?period=30'),
        ]);
        const expData = await expRes.json();
        const analyticsData = await analyticsRes.json();
        setExperiences(Array.isArray(expData) ? expData : []);
        setAnalytics(analyticsData);
      } catch (e) {
        console.error('Dashboard fetch error:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = [
    {
      icon: Layers,
      label: 'Experiences',
      value: analytics?.overview?.totalExperiences || 0,
      change: '+3 this week',
      positive: true,
      color: '#a78bfa',
      bg: 'rgba(167, 139, 250, 0.12)',
    },
    {
      icon: Eye,
      label: 'Total Views',
      value: analytics?.overview?.totalViews?.toLocaleString() || '0',
      change: '+12.5%',
      positive: true,
      color: '#60a5fa',
      bg: 'rgba(96, 165, 250, 0.12)',
    },
    {
      icon: TrendingUp,
      label: 'Engagement',
      value: `${analytics?.overview?.engagementRate || 0}%`,
      change: '+4.2%',
      positive: true,
      color: '#34d399',
      bg: 'rgba(52, 211, 153, 0.12)',
    },
    {
      icon: Zap,
      label: 'Published',
      value: analytics?.overview?.publishedExperiences || 0,
      change: 'Active now',
      positive: true,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
    },
  ];

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingGrid}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`skeleton ${styles.loadingCard}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Hero Welcome */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Welcome back, <span className={styles.heroName}>Ritesh</span> ✨
          </h1>
          <p className={styles.heroSubtitle}>
            Transform your content into interactive experiences that captivate your audience.
          </p>
          <div className={styles.heroActions}>
            <Link href="/studio" className="btn btn-primary btn-lg">
              <Sparkles size={20} />
              Create with AI
            </Link>
            <Link href="/templates" className="btn btn-secondary btn-lg">
              Browse Templates
            </Link>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.orb1} />
          <div className={styles.orb2} />
          <div className={styles.heroCard}>
            <div className={styles.heroCardInner}>
              <Sparkles size={32} className={styles.heroCardIcon} />
              <span>Content → Experience</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className={`${styles.statsGrid} stagger-children`}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`glass-card stat-card ${styles.statCard}`}>
              <div className="stat-icon" style={{ background: stat.bg, color: stat.color }}>
                <Icon size={22} />
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <div className={`stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                <TrendingUp size={12} />
                {stat.change}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Experiences */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Recent Experiences</h2>
            <p className={styles.sectionSubtitle}>Your latest creations</p>
          </div>
          <Link href="/experiences" className="btn btn-ghost">
            View All <ArrowRight size={16} />
          </Link>
        </div>

        {experiences.length === 0 ? (
          <div className={`glass-card ${styles.emptyCard}`}>
            <div className={styles.emptyIcon}>
              <Layers size={32} />
            </div>
            <h3>No experiences yet</h3>
            <p>Create your first experience using AI or start from a template.</p>
            <Link href="/studio" className="btn btn-primary">
              <Plus size={16} /> Create First Experience
            </Link>
          </div>
        ) : (
          <div className={styles.experienceGrid}>
            {experiences.slice(0, 6).map((exp, i) => {
              const TypeIcon = typeIcons[exp.type] || BookOpen;
              return (
                <Link
                  key={exp.id}
                  href={`/builder/${exp.id}`}
                  className={`glass-card ${styles.expCard}`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div
                    className={styles.expCardHeader}
                    style={{ background: `linear-gradient(135deg, ${typeColors[exp.type] || '#a78bfa'}20, transparent)` }}
                  >
                    <TypeIcon size={24} style={{ color: typeColors[exp.type] || '#a78bfa' }} />
                    <span
                      className="badge"
                      style={{
                        background: exp.status === 'published' ? 'hsla(152, 68%, 52%, 0.15)' : 'rgba(255,255,255,0.08)',
                        color: exp.status === 'published' ? 'var(--success)' : 'var(--text-secondary)'
                      }}
                    >
                      {exp.status}
                    </span>
                  </div>
                  <div className={styles.expCardBody}>
                    <h3 className={styles.expTitle}>{exp.title}</h3>
                    <p className={styles.expDesc}>{exp.description}</p>
                  </div>
                  <div className={styles.expCardFooter}>
                    <span className={styles.expStat}>
                      <Eye size={14} /> {exp.views}
                    </span>
                    <span className={styles.expStat}>
                      <TrendingUp size={14} /> {exp.engagement_rate}%
                    </span>
                    <span className={styles.expType}>{exp.type}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Start Templates */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Quick Start Templates</h2>
            <p className={styles.sectionSubtitle}>Jump-start your next experience</p>
          </div>
          <Link href="/templates" className="btn btn-ghost">
            All Templates <ArrowRight size={16} />
          </Link>
        </div>

        <div className={styles.quickTemplates}>
          {[
            { icon: '📖', title: 'Interactive Story', type: 'story', desc: 'Immersive narrative' },
            { icon: '🧠', title: 'Knowledge Quiz', type: 'quiz', desc: 'Engaging assessments' },
            { icon: '🚀', title: 'Landing Page', type: 'landing', desc: 'High-converting' },
            { icon: '📊', title: 'Presentation', type: 'presentation', desc: 'Slide decks' },
            { icon: '📈', title: 'Infographic', type: 'infographic', desc: 'Data stories' },
            { icon: '🎪', title: 'Microsite', type: 'microsite', desc: 'Complete sites' },
          ].map((tmpl, i) => (
            <Link
              key={tmpl.type}
              href={`/studio?type=${tmpl.type}`}
              className={`glass-card ${styles.quickCard}`}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <span className={styles.quickIcon}>{tmpl.icon}</span>
              <span className={styles.quickTitle}>{tmpl.title}</span>
              <span className={styles.quickDesc}>{tmpl.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
