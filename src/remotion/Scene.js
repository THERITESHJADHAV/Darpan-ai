import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Img, Audio } from 'remotion';

export const Scene = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const content = scene.content || {};
  // Animations based on type
  const isZoom = content.animation === 'zoomIn';
  const isPanLeft = content.animation === 'panLeft';
  const isPanRight = content.animation === 'panRight';

  const scale = interpolate(
    frame,
    [0, durationInFrames],
    [isZoom ? 1 : 1.1, isZoom ? 1.2 : 1.1],
    { extrapolateRight: 'clamp' }
  );

  const translateX = interpolate(
    frame,
    [0, durationInFrames],
    isPanLeft ? [0, -50] : isPanRight ? [-50, 0] : [0, 0],
    { extrapolateRight: 'clamp' }
  );

  const opacity = interpolate(
    frame,
    [0, 15, durationInFrames - 15, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateRight: 'clamp' }
  );

  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(content.imagePrompt || '')}?width=1920&height=1080&nologo=true`;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f111a', overflow: 'hidden' }}>
      <AbsoluteFill style={{ 
        transform: `scale(${scale}) translateX(${translateX}px)`,
        opacity
      }}>
        <Img src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </AbsoluteFill>
      
      {content.audioUrl && <Audio src={content.audioUrl} />}
      
      <AbsoluteFill style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: '80px',
        opacity
      }}>
        <div style={{
          backgroundColor: 'rgba(15, 17, 26, 0.85)',
          padding: '24px 48px',
          borderRadius: '24px',
          color: 'white',
          fontSize: '42px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: '600',
          textAlign: 'center',
          maxWidth: '85%',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)'
        }}>
          {content.narration}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
