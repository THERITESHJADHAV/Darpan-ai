'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Monitor, Tablet, Smartphone, ExternalLink,
  Share2, Check, Copy, Eye, Edit3
} from 'lucide-react';
import styles from './page.module.css';

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState('desktop');
  const [copied, setCopied] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showResults, setShowResults] = useState({});

  useEffect(() => {
    fetch(`/api/experiences/${params.id}`)
      .then(r => r.json())
      .then(data => { setExperience(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function answerQuiz(blockId, optionIdx) {
    setQuizAnswers(prev => ({ ...prev, [blockId]: optionIdx }));
  }

  function checkQuiz(blockId) {
    setShowResults(prev => ({ ...prev, [blockId]: true }));
  }

  if (loading) return <div className={styles.page}><div className={`skeleton`} style={{ height: '80vh', borderRadius: 20 }} /></div>;
  if (!experience) return <div className={styles.page}><h2>Experience not found</h2></div>;

  const blocks = experience.blocks || [];

  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>
            <ArrowLeft size={16} /> Back
          </button>
          <span className={styles.previewTitle}>{experience.title}</span>
          <span className={`badge ${experience.status === 'published' ? 'badge-success' : 'badge-neutral'}`}>
            {experience.status}
          </span>
        </div>
        <div className={styles.toolbarCenter}>
          {[{ icon: Monitor, val: 'desktop' }, { icon: Tablet, val: 'tablet' }, { icon: Smartphone, val: 'mobile' }].map(d => {
            const Icon = d.icon;
            return (
              <button key={d.val} className={`${styles.deviceBtn} ${device === d.val ? styles.deviceActive : ''}`} onClick={() => setDevice(d.val)}>
                <Icon size={16} />
              </button>
            );
          })}
        </div>
        <div className={styles.toolbarRight}>
          <button className="btn btn-secondary btn-sm" onClick={copyLink}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => router.push(`/builder/${params.id}`)}>
            <Edit3 size={14} /> Edit
          </button>
        </div>
      </div>

      {/* Preview Frame */}
      <div className={styles.frameWrapper}>
        <div className={`${styles.frame} ${styles[`frame_${device}`]}`}>
          <div className={styles.experienceContent}>
            {blocks.map((block, i) => (
              <div key={block.id || i} className={`${styles.block} ${styles[`block_${block.type}`]}`}>
                {renderLiveBlock(block, { quizAnswers, answerQuiz, showResults, checkQuiz })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderLiveBlock(block, { quizAnswers, answerQuiz, showResults, checkQuiz }) {
  const c = block.content || {};
  const st = styles;

  switch (block.type) {
    case 'hero':
      return (
        <div className={styles.liveHero}>
          <h1 className={styles.liveHeroTitle}>{c.title}</h1>
          {c.subtitle && <p className={styles.liveHeroSub}>{c.subtitle}</p>}
        </div>
      );
    case 'text':
      return <div className={styles.liveText}><p>{c.body}</p></div>;
    case 'features':
      return (
        <div className={styles.liveFeatures}>
          {(c.items || []).map((item, i) => (
            <div key={i} className={styles.liveFeatureCard}>
              <span className={styles.liveFeatureIcon}>{item.icon}</span>
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      );
    case 'stat':
      return (
        <div className={styles.liveStat}>
          <span className={styles.liveStatValue}>{c.value}</span>
          <span className={styles.liveStatLabel}>{c.label}</span>
        </div>
      );
    case 'quiz':
      const answered = quizAnswers[block.id] !== undefined;
      const showResult = showResults[block.id];
      return (
        <div className={styles.liveQuiz}>
          <h3 className={styles.liveQuizQ}>{c.question}</h3>
          <div className={styles.liveQuizOptions}>
            {(c.options || []).map((opt, i) => (
              <button
                key={i}
                className={`${styles.liveQuizOpt} ${quizAnswers[block.id] === i ? styles.liveQuizSelected : ''} ${showResult ? (i === c.correct ? styles.liveQuizCorrect : quizAnswers[block.id] === i ? styles.liveQuizWrong : '') : ''}`}
                onClick={() => !showResult && answerQuiz(block.id, i)}
              >
                <span className={styles.optLetter}>{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            ))}
          </div>
          {answered && !showResult && (
            <button className={`btn btn-primary btn-sm ${styles.checkBtn}`} onClick={() => checkQuiz(block.id)}>Check Answer</button>
          )}
          {showResult && (
            <p className={styles.quizResult}>
              {quizAnswers[block.id] === c.correct ? '✅ Correct!' : `❌ Incorrect. The answer is: ${c.options[c.correct]}`}
            </p>
          )}
        </div>
      );
    case 'cta':
      return (
        <div className={styles.liveCta}>
          <a href={c.url || '#'} className={styles.liveCtaBtn}>{c.label || 'Click Here'}</a>
        </div>
      );
    case 'timeline':
      return (
        <div className={styles.liveTimeline}>
          {(c.items || []).map((item, i) => (
            <div key={i} className={styles.liveTimelineItem}>
              <div className={styles.timelineDot} />
              <div className={styles.timelineContent}>
                <span className={styles.timelineYear}>{item.year}</span>
                <p>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      );
    case 'slide':
      return (
        <div className={styles.liveSlide}>
          <h2>{c.title}</h2>
          {c.subtitle && <p className={styles.slideSub}>{c.subtitle}</p>}
          {c.body && <p className={styles.slideBody}>{c.body}</p>}
        </div>
      );
    case 'divider':
      return <hr className={styles.liveDivider} />;
    default:
      return <p style={{ color: 'var(--text-tertiary)' }}>Unknown block</p>;
  }
}
