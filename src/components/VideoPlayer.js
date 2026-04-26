'use client';

import { useState, useRef } from 'react';
import { Play, Maximize, Loader2, Film, Download } from 'lucide-react';
import styles from './VideoPlayer.module.css';

export default function VideoPlayer({ scenes }) {
  const [videoUrl, setVideoUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [error, setError] = useState(null);
  
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  const handleStart = async () => {
    setIsStarted(true);
    setIsGenerating(true);
    setError(null);

    try {
      // Make a single call to generate the entire video
      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes }),
      });

      const data = await res.json();
      
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate video');
      }

      // The backend returns a perfectly concatenated single MP4 file
      setVideoUrl(data.videoUrl);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }

  if (!scenes || scenes.length === 0) {
    return <div className={styles.emptyState}><p>No video scenes found.</p></div>;
  }

  const showPlayer = videoUrl !== null;

  return (
    <div className={styles.player} ref={containerRef}>
      <div className={styles.screen}>
        {showPlayer ? (
          <div className={styles.seamlessContainer}>
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              autoPlay
              style={{ width: '100%', height: '100%', backgroundColor: '#000', outline: 'none' }}
            />
          </div>
        ) : (
          <div className={styles.placeholder}>
            {!isStarted ? (
              <div className={styles.genReady}>
                <Film size={48} />
                <h3>Ready to Generate Full Video</h3>
                <p>{scenes.length} scenes will be combined into one perfect video.</p>
                <p style={{fontSize: '13px', opacity: 0.7}}>This takes roughly ~20-30 seconds. No stops, no audio drops!</p>
              </div>
            ) : error ? (
              <div className={styles.genError}>
                <Film size={40} />
                <h3>Generation Issue</h3>
                <p>{error}</p>
                <button className={styles.retryBtn} onClick={handleStart}>
                  Retry Generation
                </button>
              </div>
            ) : null}
          </div>
        )}

        {isGenerating && (
           <div className={styles.genLoading} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#000', zIndex: 10 }}>
              <Loader2 size={40} className={styles.spinner} />
              <h3>Generating Full Video...</h3>
              <p>Creating visuals, voiceovers, and merging {scenes.length} scenes natively.</p>
              <p className={styles.hint}>Please wait (~30s). The final video will play flawlessly.</p>
           </div>
        )}
      </div>

      <div className={styles.controls}>
        {!isStarted ? (
          <button className={styles.mainBtn} onClick={handleStart}>
            <Play size={20} />
            <span>Generate & Play Video</span>
          </button>
        ) : (
          <>
            {isGenerating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '13px', fontWeight: 500 }}>
                <Loader2 size={14} className={styles.spinner} />
                Processing video on server...
              </div>
            )}
            
            {!isGenerating && showPlayer && (
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                Generation Complete
              </div>
            )}

            <div className={styles.separator} />

            {showPlayer && (
              <a href={videoUrl} download="AI_Video.mp4" className={styles.iconBtn} style={{textDecoration: 'none'}}>
                <Download size={18} />
                <span style={{marginLeft: '6px', fontSize: '13px'}}>Download</span>
              </a>
            )}

            <button className={styles.iconBtn} onClick={toggleFullscreen}>
              <Maximize size={18} />
              <span style={{marginLeft: '6px', fontSize: '13px'}}>Full Screen</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
