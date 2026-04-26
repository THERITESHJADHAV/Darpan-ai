'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles, FileText, Link as LinkIcon, Upload, PenTool,
  BookOpen, Brain, Rocket, Presentation, PieChart, Globe,
  ArrowRight, ArrowLeft, Loader2, Check, Wand2, Eye, Play,
  MonitorPlay, Network
} from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';
import MindMapViewer from '@/components/MindMapViewer';
import styles from './page.module.css';

const experienceTypes = [
  { id: 'story', icon: MonitorPlay, label: 'Whiteboard animation', desc: 'Hand-drawn explainer video', color: '#a78bfa' },
  { id: 'quiz', icon: Brain, label: 'Knowledge Quiz', desc: 'Interactive assessments', color: '#34d399' },
  { id: 'landing', icon: Rocket, label: 'Landing Page', desc: 'High-converting pages', color: '#f59e0b' },
  { id: 'presentation', icon: Network, label: 'Mind map', desc: 'Visual concept connection', color: '#60a5fa' },
  { id: 'infographic', icon: PieChart, label: 'Infographic', desc: 'Data visualization', color: '#f472b6' },
  { id: 'microsite', icon: Globe, label: 'Microsite', desc: 'Complete mini-site', color: '#22d3ee' },
];

const inputMethods = [
  { id: 'paste', icon: FileText, label: 'Paste Text' },
  { id: 'url', icon: LinkIcon, label: 'Enter URL' },
  { id: 'write', icon: PenTool, label: 'Write Content' },
];

function StudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedType = searchParams.get('type');

  const [step, setStep] = useState(1);
  const [inputMethod, setInputMethod] = useState('paste');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [selectedType, setSelectedType] = useState(preselectedType || 'story');
  const [isTransforming, setIsTransforming] = useState(false);
  const [result, setResult] = useState(null);
  const [mindMapData, setMindMapData] = useState(null);
  const [error, setError] = useState('');

  const steps = [
    { num: 1, label: 'Input Content' },
    { num: 2, label: 'Choose Type' },
    { num: 3, label: 'Transform' },
    { num: 4, label: 'Preview' },
  ];

  async function handleTransform() {
    setIsTransforming(true);
    setError('');
    setMindMapData(null);

    try {
      const finalContent = inputMethod === 'url'
        ? `URL: ${url}\n\nPlease create content based on the topic of this URL.`
        : content;

      if (selectedType === 'presentation') {
        // Mind Map flow
        const res = await fetch('/api/ai/mindmap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: finalContent }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Mind map generation failed');
        }

        const data = await res.json();
        setMindMapData(data);
        setResult({ title: data.title, type: 'mindmap' });
        setStep(4);
      } else {
        // Video flow
        const res = await fetch('/api/ai/transform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: finalContent,
            type: selectedType,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Transform failed');
        }

        const data = await res.json();
        const scenesWithAudio = data.blocks || [];
        data.blocks = scenesWithAudio;
        setResult(data);
        setStep(4);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setIsTransforming(false);
    }
  }

  const canProceedStep1 = inputMethod === 'url' ? url.trim().length > 5 : content.trim().length > 10;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <Sparkles size={28} />
        </div>
        <div>
          <h1 className={styles.title}>AI Studio</h1>
          <p className={styles.subtitle}>Transform any content into interactive experiences with AI</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="progress-steps">
        {steps.map((s, i) => (
          <div key={s.num} className="progress-step" style={{ flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div
              className={`step-circle ${step === s.num ? 'active' : ''} ${step > s.num ? 'completed' : ''}`}
              onClick={() => step > s.num && setStep(s.num)}
              style={{ cursor: step > s.num ? 'pointer' : 'default' }}
            >
              {step > s.num ? <Check size={16} /> : s.num}
            </div>
            <span className={`step-label ${step >= s.num ? 'active' : ''}`}>{s.label}</span>
            {i < steps.length - 1 && (
              <div className={`step-line ${step > s.num ? 'completed' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Input Content */}
      {step === 1 && (
        <div className={`${styles.stepContent} animate-slide-up`}>
          <h2 className={styles.stepTitle}>What content do you want to transform?</h2>
          <p className={styles.stepDesc}>Paste your text, enter a URL, or write new content</p>

          <div className={styles.inputMethodTabs}>
            {inputMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  className={`${styles.methodTab} ${inputMethod === method.id ? styles.methodActive : ''}`}
                  onClick={() => setInputMethod(method.id)}
                >
                  <Icon size={18} />
                  {method.label}
                </button>
              );
            })}
          </div>

          <div className={styles.inputArea}>
            {inputMethod === 'url' ? (
              <div className={styles.urlInput}>
                <LinkIcon size={20} className={styles.urlIcon} />
                <input
                  type="url"
                  placeholder="https://example.com/article-to-transform"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className={`input-field ${styles.urlField}`}
                />
              </div>
            ) : (
              <textarea
                placeholder={inputMethod === 'write'
                  ? 'Start writing your content here...\n\nThe AI will transform your ideas into an interactive experience.'
                  : 'Paste your article, blog post, documentation, or any content here...\n\nThe AI will analyze it and transform it into an engaging interactive experience.'}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`input-field textarea-field ${styles.contentTextarea}`}
                rows={12}
              />
            )}
            <div className={styles.inputMeta}>
              {inputMethod !== 'url' && (
                <span className={styles.charCount}>{content.length} characters</span>
              )}
            </div>
          </div>

          <div className={styles.stepActions}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
            >
              Continue <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Choose Experience Type */}
      {step === 2 && (
        <div className={`${styles.stepContent} animate-slide-up`}>
          <h2 className={styles.stepTitle}>What type of experience do you want?</h2>
          <p className={styles.stepDesc}>Choose the format that best fits your content</p>

          <div className={styles.typeGrid}>
            {experienceTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  className={`glass-card ${styles.typeCard} ${selectedType === type.id ? styles.typeSelected : ''}`}
                  onClick={() => setSelectedType(type.id)}
                  style={{
                    '--type-color': type.color,
                    ...(selectedType === type.id ? { borderColor: type.color, boxShadow: `0 0 30px ${type.color}30` } : {})
                  }}
                >
                  <div className={styles.typeIconWrap} style={{ background: `${type.color}18`, color: type.color }}>
                    <Icon size={28} />
                  </div>
                  <span className={styles.typeLabel}>{type.label}</span>
                  <span className={styles.typeDesc}>{type.desc}</span>
                  {selectedType === type.id && (
                    <div className={styles.typeCheck}>
                      <Check size={16} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className={styles.stepActions}>
            <button className="btn btn-secondary btn-lg" onClick={() => setStep(1)}>
              <ArrowLeft size={18} /> Back
            </button>
            <button className="btn btn-primary btn-lg" onClick={() => { setStep(3); handleTransform(); }}>
              <Wand2 size={18} /> Transform with AI
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Transforming */}
      {step === 3 && (
        <div className={`${styles.stepContent} animate-slide-up`}>
          <div className={styles.transformingState}>
            {isTransforming ? (
              <>
                <div className={styles.transformLoader}>
                  <div className={styles.loaderOrb} />
                  <Sparkles size={40} className={styles.loaderIcon} />
                </div>
                <h2 className={styles.transformTitle}>Transforming Your Content...</h2>
                <p className={styles.transformSubtitle}>
                  {selectedType === 'presentation'
                    ? 'AI is mapping your content into an interactive mind map...'
                    : `AI is analyzing your content and crafting an interactive ${selectedType} experience`}
                </p>
                <div className={styles.transformSteps}>
                  {['Analyzing content structure', 'Identifying key themes', 'Generating interactive blocks', 'Optimizing experience flow'].map((s, i) => (
                    <div key={i} className={styles.transformStep}>
                      <Loader2 size={14} className={styles.spinning} />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : error ? (
              <>
                <h2 className={styles.transformTitle}>Something went wrong</h2>
                <p className={styles.transformSubtitle}>{error}</p>
                <button className="btn btn-primary" onClick={() => { setStep(2); setError(''); }}>
                  Try Again
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Step 4: Preview Result */}
      {step === 4 && result && (
        <div className={`${styles.stepContent} animate-slide-up`} style={mindMapData ? { maxWidth: '100%' } : {}}>
          <div className={styles.resultHeader}>
            <div>
              <h2 className={styles.stepTitle}>Your experience is ready! ✨</h2>
              <p className={styles.stepDesc}>Review the generated experience and customize it in the builder</p>
            </div>
          </div>

          <div className={`glass-card ${styles.resultPreview}`}>
            <div className={styles.resultMeta}>
              <h3>{result.title}</h3>
              <span className="badge badge-primary">{result.type}</span>
              <span className="badge badge-success">Draft</span>
            </div>

            {mindMapData ? (
              <div style={{ marginTop: '24px' }}>
                <MindMapViewer data={mindMapData} />
              </div>
            ) : (
              <div className={styles.videoContainer} style={{ marginTop: '24px', borderRadius: '16px', overflow: 'hidden', background: '#000' }}>
                <VideoPlayer scenes={result.blocks} />
              </div>
            )}
          </div>

          <div className={styles.stepActions}>
            <button className="btn btn-secondary btn-lg" onClick={() => setStep(1)}>
              Start Over
            </button>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => router.push(`/builder/${result.id}`)}
            >
              <PenTool size={18} /> Open in Builder
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div className={styles.page}><div className="skeleton" style={{ height: 400 }} /></div>}>
      <StudioContent />
    </Suspense>
  );
}
