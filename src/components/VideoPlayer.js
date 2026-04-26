'use client';

import { useState, useRef } from 'react';
import { Play, Maximize, Loader2, Film } from 'lucide-react';
import styles from './VideoPlayer.module.css';

export default function VideoPlayer({ scenes }) {
  const [videoUrl, setVideoUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  async function generateFullVideo() {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes }),
      });

      const data = await res.json();

      if (data.videoUrl) {
        setVideoUrl(data.videoUrl);
      } else {
        setError(data.error || 'Failed to generate video');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }

  if (!scenes || scenes.length === 0) {
    return <div className={styles.emptyState}><p>No video scenes found.</p></div>;
  }

  return (
    <div className={styles.player} ref={containerRef}>
      <div className={styles.screen}>
        {/* Video element */}
        {videoUrl ? (
          <video
            className={styles.video}
            src={videoUrl}
            controls
            autoPlay
            playsInline
          />
        ) : (
          <div className={styles.placeholder}>
            {isGenerating ? (
              <div className={styles.genLoading}>
                <Loader2 size={40} className={styles.spinner} />
                <h3>Generating Full Video with AI...</h3>
                <p>This process takes a minute. Please wait.</p>
                <p className={styles.hint}>Generating visuals, animating scenes, creating voiceovers, and stitching.</p>
              </div>
            ) : error ? (
              <div className={styles.genError}>
                <Film size={40} />
                <h3>Generation Issue</h3>
                <p>{error}</p>
                <button className={styles.retryBtn} onClick={generateFullVideo}>
                  Retry Generation
                </button>
              </div>
            ) : (
              <div className={styles.genReady}>
                <Film size={48} />
                <h3>Video Ready to Generate</h3>
                <p>Click "Generate Video" to begin the full pipeline.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      {!videoUrl && (
        <div className={styles.controls}>
          <button className={styles.mainBtn} onClick={generateFullVideo} disabled={isGenerating}>
            {isGenerating ? <Loader2 size={20} className={styles.spinner} /> : <Play size={20} />}
            <span>{isGenerating ? 'Generating...' : 'Generate Full Video'}</span>
          </button>
        </div>
      )}
      
      {videoUrl && (
        <div className={styles.controls}>
          <button className={styles.iconBtn} onClick={toggleFullscreen}>
            <Maximize size={18} />
            <span style={{marginLeft: '8px', fontSize: '14px', fontWeight: 'bold'}}>Full Screen</span>
          </button>
        </div>
      )}
    </div>
  );
}
