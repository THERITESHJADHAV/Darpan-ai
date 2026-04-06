'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Save, Eye, ArrowLeft, Plus, Trash2, GripVertical, ChevronUp, ChevronDown,
  Type, Image, HelpCircle, MousePointer, BarChart3, List as ListIcon,
  Clock, Minus, Layout, Monitor, Tablet, Smartphone, Undo2, Redo2,
  Settings, Sparkles, Check, Loader2
} from 'lucide-react';
import styles from './page.module.css';

const BLOCK_TYPES = [
  { type: 'hero', label: 'Hero Section', icon: Layout, color: '#a78bfa' },
  { type: 'text', label: 'Text Block', icon: Type, color: '#60a5fa' },
  { type: 'features', label: 'Features', icon: ListIcon, color: '#34d399' },
  { type: 'stat', label: 'Stat Counter', icon: BarChart3, color: '#f59e0b' },
  { type: 'quiz', label: 'Quiz Question', icon: HelpCircle, color: '#f472b6' },
  { type: 'cta', label: 'Call to Action', icon: MousePointer, color: '#22d3ee' },
  { type: 'timeline', label: 'Timeline', icon: Clock, color: '#fb923c' },
  { type: 'divider', label: 'Divider', icon: Minus, color: '#64748b' },
];

function getDefaultContent(type) {
  const defaults = {
    hero: { title: 'Your Heading Here', subtitle: 'A captivating subtitle' },
    text: { body: 'Add your content here. This is a rich text block that supports detailed paragraphs.' },
    features: { items: [{ icon: '✨', title: 'Feature 1', desc: 'Description' }, { icon: '🎯', title: 'Feature 2', desc: 'Description' }, { icon: '🚀', title: 'Feature 3', desc: 'Description' }] },
    stat: { value: '100+', label: 'Amazing Stats' },
    quiz: { question: 'Your question here?', options: ['Option A', 'Option B', 'Option C', 'Option D'], correct: 0 },
    cta: { label: 'Get Started', url: '#' },
    timeline: { items: [{ year: '2024', text: 'Event description' }, { year: '2025', text: 'Another event' }] },
    divider: {},
    slide: { title: 'Slide Title', subtitle: '', body: 'Slide content goes here' },
  };
  return defaults[type] || {};
}

export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();
  const [experience, setExperience] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('desktop');

  useEffect(() => {
    fetch(`/api/experiences/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setExperience(data);
        setBlocks(data.blocks || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await fetch(`/api/experiences/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: experience.title,
          description: experience.description,
          blocks,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Save failed:', e);
    } finally {
      setSaving(false);
    }
  }, [blocks, experience, params.id]);

  function addBlock(type) {
    const newBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      content: getDefaultContent(type),
      order: blocks.length,
    };
    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlock(newBlock.id);
  }

  function removeBlock(id) {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (selectedBlock === id) setSelectedBlock(null);
  }

  function moveBlock(id, dir) {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if ((dir === -1 && idx === 0) || (dir === 1 && idx === prev.length - 1)) return prev;
      const arr = [...prev];
      [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]];
      return arr;
    });
  }

  function updateBlockContent(id, updates) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content: { ...b.content, ...updates } } : b));
  }

  const selected = blocks.find(b => b.id === selectedBlock);

  if (loading) {
    return <div className={styles.page}><div className={`skeleton ${styles.loadingSkeleton}`} /></div>;
  }

  if (!experience) {
    return (
      <div className={styles.page}>
        <div className={styles.notFound}>
          <h2>Experience not found</h2>
          <button className="btn btn-primary" onClick={() => router.push('/experiences')}>Back to Experiences</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.builderLayout}>
      {/* Top Toolbar */}
      <div className={styles.builderToolbar}>
        <div className={styles.toolbarLeft}>
          <button className="btn btn-ghost btn-sm" onClick={() => router.push('/experiences')}>
            <ArrowLeft size={16} /> Back
          </button>
          <div className={styles.divider} />
          <input
            className={styles.titleInput}
            value={experience.title}
            onChange={(e) => setExperience(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Experience title..."
          />
          <span className={`badge ${experience.status === 'published' ? 'badge-success' : 'badge-neutral'}`}>
            {experience.status}
          </span>
        </div>
        <div className={styles.toolbarCenter}>
          <div className={styles.deviceToggle}>
            {[{ icon: Monitor, val: 'desktop' }, { icon: Tablet, val: 'tablet' }, { icon: Smartphone, val: 'mobile' }].map(d => {
              const Icon = d.icon;
              return (
                <button key={d.val} className={`${styles.deviceBtn} ${previewDevice === d.val ? styles.deviceActive : ''}`} onClick={() => setPreviewDevice(d.val)}>
                  <Icon size={16} />
                </button>
              );
            })}
          </div>
        </div>
        <div className={styles.toolbarRight}>
          <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/preview/${params.id}`)}>
            <Eye size={16} /> Preview
          </button>
          <button className={`btn btn-primary btn-sm`} onClick={save} disabled={saving}>
            {saving ? <Loader2 size={16} className={styles.spinning} /> : saved ? <Check size={16} /> : <Save size={16} />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      <div className={styles.builderBody}>
        {/* Block Palette - Left */}
        <div className={styles.palette}>
          <h3 className={styles.paletteTitle}>Add Block</h3>
          <div className={styles.paletteGrid}>
            {BLOCK_TYPES.map(bt => {
              const Icon = bt.icon;
              return (
                <button key={bt.type} className={styles.paletteItem} onClick={() => addBlock(bt.type)}>
                  <div className={styles.paletteIcon} style={{ color: bt.color, background: `${bt.color}18` }}>
                    <Icon size={18} />
                  </div>
                  <span className={styles.paletteLabel}>{bt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Canvas - Center */}
        <div className={styles.canvasWrapper}>
          <div className={`${styles.canvas} ${styles[`canvas_${previewDevice}`]}`}>
            {blocks.length === 0 ? (
              <div className={styles.canvasEmpty}>
                <Sparkles size={40} style={{ color: 'var(--text-tertiary)', marginBottom: 16 }} />
                <h3>Empty Canvas</h3>
                <p>Add blocks from the palette to start building your experience</p>
              </div>
            ) : (
              blocks.map((block, i) => (
                <div
                  key={block.id}
                  className={`${styles.canvasBlock} ${selectedBlock === block.id ? styles.canvasBlockSelected : ''}`}
                  onClick={() => setSelectedBlock(block.id)}
                >
                  <div className={styles.blockControls}>
                    <span className={styles.blockBadge}>{block.type}</span>
                    <div className={styles.blockBtns}>
                      <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, -1); }} disabled={i === 0}><ChevronUp size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 1); }} disabled={i === blocks.length - 1}><ChevronDown size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }} className={styles.deleteBlockBtn}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className={styles.blockContent}>
                    {renderBlockPreview(block)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Properties Panel - Right */}
        <div className={styles.propsPanel}>
          {selected ? (
            <>
              <h3 className={styles.propsTitle}>
                <Settings size={16} /> Properties
              </h3>
              <div className={styles.propGroup}>
                <label className={styles.propLabel}>Block Type</label>
                <span className={`badge badge-primary`}>{selected.type}</span>
              </div>

              {selected.type === 'hero' && (
                <>
                  <div className={styles.propGroup}>
                    <label className={styles.propLabel}>Title</label>
                    <input className="input-field" value={selected.content?.title || ''} onChange={(e) => updateBlockContent(selected.id, { title: e.target.value })} />
                  </div>
                  <div className={styles.propGroup}>
                    <label className={styles.propLabel}>Subtitle</label>
                    <input className="input-field" value={selected.content?.subtitle || ''} onChange={(e) => updateBlockContent(selected.id, { subtitle: e.target.value })} />
                  </div>
                </>
              )}

              {selected.type === 'text' && (
                <div className={styles.propGroup}>
                  <label className={styles.propLabel}>Body</label>
                  <textarea className="input-field textarea-field" value={selected.content?.body || ''} onChange={(e) => updateBlockContent(selected.id, { body: e.target.value })} rows={6} />
                </div>
              )}

              {selected.type === 'stat' && (
                <>
                  <div className={styles.propGroup}>
                    <label className={styles.propLabel}>Value</label>
                    <input className="input-field" value={selected.content?.value || ''} onChange={(e) => updateBlockContent(selected.id, { value: e.target.value })} />
                  </div>
                  <div className={styles.propGroup}>
                    <label className={styles.propLabel}>Label</label>
                    <input className="input-field" value={selected.content?.label || ''} onChange={(e) => updateBlockContent(selected.id, { label: e.target.value })} />
                  </div>
                </>
              )}

              {selected.type === 'cta' && (
                <>
                  <div className={styles.propGroup}>
                    <label className={styles.propLabel}>Button Label</label>
                    <input className="input-field" value={selected.content?.label || ''} onChange={(e) => updateBlockContent(selected.id, { label: e.target.value })} />
                  </div>
                  <div className={styles.propGroup}>
                    <label className={styles.propLabel}>URL</label>
                    <input className="input-field" value={selected.content?.url || ''} onChange={(e) => updateBlockContent(selected.id, { url: e.target.value })} />
                  </div>
                </>
              )}

              {selected.type === 'quiz' && (
                <>
                  <div className={styles.propGroup}>
                    <label className={styles.propLabel}>Question</label>
                    <input className="input-field" value={selected.content?.question || ''} onChange={(e) => updateBlockContent(selected.id, { question: e.target.value })} />
                  </div>
                  {(selected.content?.options || []).map((opt, i) => (
                    <div key={i} className={styles.propGroup}>
                      <label className={styles.propLabel}>Option {i + 1} {i === selected.content?.correct ? '✓' : ''}</label>
                      <input className="input-field" value={opt} onChange={(e) => {
                        const opts = [...(selected.content?.options || [])];
                        opts[i] = e.target.value;
                        updateBlockContent(selected.id, { options: opts });
                      }} />
                    </div>
                  ))}
                  <div className={styles.propGroup}>
                    <label className={styles.propLabel}>Correct Answer</label>
                    <select className="input-field" style={{ padding: '10px 14px', cursor: 'pointer' }} value={selected.content?.correct || 0} onChange={(e) => updateBlockContent(selected.id, { correct: parseInt(e.target.value) })}>
                      {(selected.content?.options || []).map((_, i) => <option key={i} value={i}>Option {i + 1}</option>)}
                    </select>
                  </div>
                </>
              )}

              {selected.type === 'slide' && (
                <>
                  <div className={styles.propGroup}>
                    <label className={styles.propLabel}>Title</label>
                    <input className="input-field" value={selected.content?.title || ''} onChange={(e) => updateBlockContent(selected.id, { title: e.target.value })} />
                  </div>
                  <div className={styles.propGroup}>
                    <label className={styles.propLabel}>Body</label>
                    <textarea className="input-field textarea-field" value={selected.content?.body || ''} onChange={(e) => updateBlockContent(selected.id, { body: e.target.value })} rows={4} />
                  </div>
                </>
              )}

              {(selected.type === 'features') && (
                <div className={styles.propGroup}>
                  <label className={styles.propLabel}>Features ({selected.content?.items?.length || 0})</label>
                  {(selected.content?.items || []).map((item, i) => (
                    <div key={i} className={styles.featureEdit}>
                      <input className="input-field" value={item.icon} onChange={(e) => {
                        const items = [...(selected.content?.items || [])];
                        items[i] = { ...items[i], icon: e.target.value };
                        updateBlockContent(selected.id, { items });
                      }} style={{ width: 50, textAlign: 'center' }} placeholder="🎯" />
                      <input className="input-field" value={item.title} onChange={(e) => {
                        const items = [...(selected.content?.items || [])];
                        items[i] = { ...items[i], title: e.target.value };
                        updateBlockContent(selected.id, { items });
                      }} placeholder="Title" />
                    </div>
                  ))}
                </div>
              )}

              {selected.type === 'divider' && (
                <p className={styles.propHint}>Divider block — no configurable properties.</p>
              )}
            </>
          ) : (
            <div className={styles.propsEmpty}>
              <Settings size={24} style={{ color: 'var(--text-tertiary)' }} />
              <p>Select a block to edit its properties</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function renderBlockPreview(block) {
  const c = block.content || {};
  switch (block.type) {
    case 'hero':
      return (
        <div style={{ textAlign: 'center', padding: '24px 16px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>{c.title || 'Hero Title'}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{c.subtitle || 'Subtitle'}</p>
        </div>
      );
    case 'text':
      return <p style={{ fontSize: '0.875rem', lineHeight: 1.8, color: 'var(--text-secondary)', padding: '8px 0' }}>{c.body || 'Text content...'}</p>;
    case 'features':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(c.items?.length || 3, 3)}, 1fr)`, gap: 12, padding: '8px 0' }}>
          {(c.items || []).map((item, i) => (
            <div key={i} style={{ textAlign: 'center', padding: 8 }}>
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{item.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      );
    case 'stat':
      return (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-light)' }}>{c.value || '0'}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.label || 'Label'}</div>
        </div>
      );
    case 'quiz':
      return (
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>{c.question || 'Question?'}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(c.options || []).map((opt, i) => (
              <div key={i} style={{ padding: '8px 12px', background: i === c.correct ? 'rgba(52,211,153,0.15)' : 'var(--glass-bg)', borderRadius: 8, fontSize: 13, border: '1px solid var(--glass-border)' }}>
                {opt}
              </div>
            ))}
          </div>
        </div>
      );
    case 'cta':
      return (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <span style={{ padding: '10px 24px', background: 'var(--primary)', color: 'white', borderRadius: 10, fontWeight: 600, fontSize: 14, display: 'inline-block' }}>{c.label || 'Click Here'}</span>
        </div>
      );
    case 'timeline':
      return (
        <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(c.items || []).map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 700, color: 'var(--primary-light)', fontSize: 13, flexShrink: 0, minWidth: 40 }}>{item.year}</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.text}</span>
            </div>
          ))}
        </div>
      );
    case 'slide':
      return (
        <div style={{ textAlign: 'center', padding: '20px 16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>{c.title || 'Slide'}</h3>
          {c.subtitle && <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 8 }}>{c.subtitle}</p>}
          {c.body && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.body}</p>}
        </div>
      );
    case 'divider':
      return <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />;
    default:
      return <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Unknown block type: {block.type}</p>;
  }
}
