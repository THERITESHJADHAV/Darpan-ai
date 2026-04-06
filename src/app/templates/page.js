'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutTemplate, Search, Filter, BookOpen, Brain, Rocket,
  Presentation, PieChart, Globe, Eye, Star, ArrowRight, Sparkles, Zap
} from 'lucide-react';
import styles from './page.module.css';

const typeIcons = { story: BookOpen, quiz: Brain, landing: Rocket, presentation: Presentation, infographic: PieChart, microsite: Globe };
const typeColors = { story: '#a78bfa', quiz: '#34d399', landing: '#f59e0b', presentation: '#60a5fa', infographic: '#f472b6', microsite: '#22d3ee' };

const categories = [
  { id: 'all', label: 'All' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'education', label: 'Education' },
  { id: 'business', label: 'Business' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'events', label: 'Events' },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetch(`/api/templates?category=${category}`)
      .then(r => r.json())
      .then(data => { setTemplates(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [category]);

  const filtered = templates.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase())
  );

  async function useTemplate(template) {
    const res = await fetch('/api/experiences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: template.title,
        description: template.description,
        type: template.type,
        blocks: template.blocks,
      }),
    });
    const exp = await res.json();
    window.location.href = `/builder/${exp.id}`;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerIcon}><LayoutTemplate size={28} /></div>
        <div>
          <h1 className={styles.title}>Template Gallery</h1>
          <p className={styles.subtitle}>Start with a professionally designed template</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className={styles.toolbar}>
        <div className={styles.searchBar}>
          <Search size={18} />
          <input type="text" placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} className={styles.searchInput} />
        </div>
        <div className={styles.categoryTabs}>
          {categories.map(cat => (
            <button key={cat.id} className={`${styles.catTab} ${category === cat.id ? styles.catActive : ''}`} onClick={() => setCategory(cat.id)}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className={styles.grid}>
          {[1,2,3,4,5,6].map(i => <div key={i} className={`skeleton ${styles.skeleton}`} />)}
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((template, i) => {
            const TypeIcon = typeIcons[template.type] || BookOpen;
            return (
              <div key={template.id} className={`glass-card ${styles.card}`} style={{ animationDelay: `${i * 0.05}s` }}>
                <div className={styles.cardPreview} style={{ background: `linear-gradient(135deg, ${typeColors[template.type]}15, ${typeColors[template.type]}05)` }}>
                  <span className={styles.cardEmoji}>{template.thumbnail}</span>
                  <div className={styles.cardOverlay}>
                    <button className="btn btn-primary btn-sm" onClick={() => setPreview(template)}><Eye size={14} /> Preview</button>
                    <button className="btn btn-accent btn-sm" onClick={() => useTemplate(template)}><Zap size={14} /> Use</button>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardMeta}>
                    <span className={styles.cardType} style={{ color: typeColors[template.type], background: `${typeColors[template.type]}18` }}>
                      <TypeIcon size={12} /> {template.type}
                    </span>
                    <span className={styles.cardCat}>{template.category}</span>
                  </div>
                  <h3 className={styles.cardTitle}>{template.title}</h3>
                  <p className={styles.cardDesc}>{template.description}</p>
                  <div className={styles.cardStats}>
                    <span><Star size={12} /> {template.popularity} uses</span>
                    <span>{template.blocks?.length || 0} blocks</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h2 className="modal-title">{preview.title}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setPreview(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginBottom: 'var(--space-lg)' }}>{preview.description}</p>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
              <span className="badge badge-primary">{preview.type}</span>
              <span className="badge badge-neutral">{preview.category}</span>
              <span className="badge badge-neutral">{preview.blocks?.length} blocks</span>
            </div>
            <h4 style={{ fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Experience Structure</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
              {preview.blocks?.map((block, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)', background: 'var(--glass-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                  <span style={{ padding: '2px 10px', borderRadius: 'var(--radius-full)', background: 'var(--primary)', color: 'white', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{block.type}</span>
                  <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                    {block.content?.title || block.content?.question || block.content?.label || block.content?.body?.substring(0, 60) || 'Content block'}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <button className="btn btn-secondary" onClick={() => setPreview(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => useTemplate(preview)}>
                <Sparkles size={16} /> Use This Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
