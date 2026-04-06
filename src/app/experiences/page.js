'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers, Eye, TrendingUp, Search, Filter, Grid3X3, List,
  Plus, Trash2, ExternalLink, MoreVertical, BookOpen, Brain,
  Rocket, Presentation, PieChart, Globe, Clock, Sparkles
} from 'lucide-react';
import styles from './page.module.css';

const typeIcons = { story: BookOpen, quiz: Brain, landing: Rocket, presentation: Presentation, infographic: PieChart, microsite: Globe };
const typeColors = { story: '#a78bfa', quiz: '#34d399', landing: '#f59e0b', presentation: '#60a5fa', infographic: '#f472b6', microsite: '#22d3ee' };

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetch('/api/experiences')
      .then(r => r.json())
      .then(data => { setExperiences(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    if (!confirm('Delete this experience?')) return;
    await fetch(`/api/experiences/${id}`, { method: 'DELETE' });
    setExperiences(prev => prev.filter(e => e.id !== id));
  }

  async function toggleStatus(exp) {
    const newStatus = exp.status === 'published' ? 'draft' : 'published';
    const res = await fetch(`/api/experiences/${exp.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    const updated = await res.json();
    setExperiences(prev => prev.map(e => e.id === exp.id ? { ...e, ...updated } : e));
  }

  const filtered = experiences.filter(exp => {
    if (search && !exp.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== 'all' && exp.status !== filterStatus) return false;
    if (filterType !== 'all' && exp.type !== filterType) return false;
    return true;
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Experiences</h1>
          <p className={styles.subtitle}>{experiences.length} total experiences</p>
        </div>
        <Link href="/studio" className="btn btn-primary">
          <Plus size={18} /> Create New
        </Link>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBar}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search experiences..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filters}>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={styles.filterSelect}>
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={styles.filterSelect}>
            <option value="all">All Types</option>
            <option value="story">Story</option>
            <option value="quiz">Quiz</option>
            <option value="landing">Landing</option>
            <option value="presentation">Presentation</option>
            <option value="infographic">Infographic</option>
            <option value="microsite">Microsite</option>
          </select>
          <div className={styles.viewToggle}>
            <button className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewActive : ''}`} onClick={() => setViewMode('grid')}>
              <Grid3X3 size={16} />
            </button>
            <button className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewActive : ''}`} onClick={() => setViewMode('list')}>
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.grid}>
          {[1,2,3,4,5,6].map(i => <div key={i} className={`skeleton ${styles.skeletonCard}`} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className={`glass-card ${styles.empty}`}>
          <div className={styles.emptyIcon}><Layers size={32} /></div>
          <h3>No experiences found</h3>
          <p>{search || filterStatus !== 'all' || filterType !== 'all' ? 'Try adjusting your filters' : 'Create your first experience to get started'}</p>
          <Link href="/studio" className="btn btn-primary"><Plus size={16} /> Create Experience</Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className={styles.grid}>
          {filtered.map((exp, i) => {
            const TypeIcon = typeIcons[exp.type] || BookOpen;
            return (
              <div key={exp.id} className={`glass-card ${styles.card}`} style={{ animationDelay: `${i * 0.04}s` }}>
                <div className={styles.cardTop} style={{ background: `linear-gradient(135deg, ${typeColors[exp.type]}15, transparent)` }}>
                  <TypeIcon size={22} style={{ color: typeColors[exp.type] }} />
                  <div className={styles.cardActions}>
                    <button className={styles.actionBtn} onClick={() => toggleStatus(exp)} title={exp.status === 'published' ? 'Unpublish' : 'Publish'}>
                      <span className={`badge ${exp.status === 'published' ? 'badge-success' : 'badge-neutral'}`}>
                        {exp.status}
                      </span>
                    </button>
                  </div>
                </div>
                <Link href={`/builder/${exp.id}`} className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{exp.title}</h3>
                  <p className={styles.cardDesc}>{exp.description}</p>
                </Link>
                <div className={styles.cardFooter}>
                  <span className={styles.cardStat}><Eye size={13} /> {exp.views}</span>
                  <span className={styles.cardStat}><TrendingUp size={13} /> {exp.engagement_rate}%</span>
                  <div className={styles.cardFooterActions}>
                    <Link href={`/builder/${exp.id}`} className={styles.miniBtn} title="Edit"><ExternalLink size={14} /></Link>
                    <button className={`${styles.miniBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(exp.id)} title="Delete"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map((exp, i) => {
            const TypeIcon = typeIcons[exp.type] || BookOpen;
            return (
              <Link key={exp.id} href={`/builder/${exp.id}`} className={`glass-card ${styles.listItem}`} style={{ animationDelay: `${i * 0.03}s` }}>
                <div className={styles.listIcon} style={{ background: `${typeColors[exp.type]}18`, color: typeColors[exp.type] }}>
                  <TypeIcon size={20} />
                </div>
                <div className={styles.listContent}>
                  <h3>{exp.title}</h3>
                  <p>{exp.description}</p>
                </div>
                <span className={`badge ${exp.status === 'published' ? 'badge-success' : 'badge-neutral'}`}>{exp.status}</span>
                <span className={styles.listStat}><Eye size={14} /> {exp.views}</span>
                <span className={styles.listStat}><TrendingUp size={14} /> {exp.engagement_rate}%</span>
                <span className={styles.listType}>{exp.type}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
