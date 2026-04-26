import { Sequence, useVideoConfig } from 'remotion';
import { Scene } from './Scene';

export const ExplainerVideo = ({ scenes }) => {
  const { fps } = useVideoConfig();
  
  // Each scene defaults to 5 seconds
  const durationPerScene = 5 * fps;

  return (
    <>
      {scenes.map((scene, index) => {
        return (
          <Sequence 
            key={scene.id || index} 
            from={index * durationPerScene} 
            durationInFrames={durationPerScene}
          >
            <Scene scene={scene} />
          </Sequence>
        );
      })}
    </>
  );
};
