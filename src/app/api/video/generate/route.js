import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function POST(request) {
  try {
    const { scenes } = await request.json();

    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return NextResponse.json({ error: 'Array of scenes is required' }, { status: 400 });
    }

    const jobId = Date.now().toString() + Math.random().toString(36).substring(2, 7);
    const tempDir = path.join(process.cwd(), 'public', 'temp');
    
    // Ensure temp dir exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Step 1: Fetch images sequentially to prevent rate limits, without dummy fallbacks
    // We will let the API take the time it needs so the user gets accurate images.
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const prompt = scene?.content?.imagePrompt || '';
      const imagePath = path.join(tempDir, `scene-${jobId}-${i}.png`);
      const enhancedPrompt = `${prompt}, whiteboard animation style, black outlines on white background, minimalist flat sketch`;
      const encodedPrompt = encodeURIComponent(enhancedPrompt);
      const imgUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true`;

      let imgRes = await fetch(imgUrl);
      if (!imgRes.ok) {
        console.warn(`Pollinations AI failed for scene ${i}, retrying...`);
        // Wait slightly before retry to let the free API recover
        await new Promise(resolve => setTimeout(resolve, 4000));
        imgRes = await fetch(imgUrl);
        if (!imgRes.ok) throw new Error('Failed to generate base image after retry');
      }
      
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      fs.writeFileSync(imagePath, buffer);
    }

    // Step 2: Run Python drawing, Audio, and FFmpeg concurrently for maximum speed!
    const scenePromises = scenes.map(async (scene, i) => {
      const text = scene?.content?.narration || ' ';
      
      const imagePath = path.join(tempDir, `scene-${jobId}-${i}.png`);
      const rawVideoPath = path.join(tempDir, `scene-${jobId}-${i}_raw.mp4`);
      const audioPath = path.join(tempDir, `scene-${jobId}-${i}.mp3`);
      const mergedVideoPath = path.join(tempDir, `scene-${jobId}-${i}_merged.mp4`);

      // 2a. Generate Whiteboard Animation (Python)
      const drawScript = path.join(process.cwd(), 'scripts', 'draw-whiteboard-animations.py');
      await execPromise(`python "${drawScript}" "${imagePath}" "${rawVideoPath}"`);

      // 2b. Generate Audio (Python gTTS)
      const audioScript = path.join(process.cwd(), 'scripts', 'generate_audio.py');
      const safeText = text.replace(/"/g, '\\"');
      await execPromise(`python "${audioScript}" "${safeText}" "${audioPath}"`);

      // 2c. Merge Audio and Video with FFmpeg
      const mergeCommand = `ffmpeg -stream_loop -1 -i "${rawVideoPath}" -i "${audioPath}" -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest -y "${mergedVideoPath}"`;
      await execPromise(mergeCommand);

      return { index: i, filePath: mergedVideoPath };
    });

    const completedScenes = await Promise.all(scenePromises);
    
    // Sort by index to maintain correct order
    completedScenes.sort((a, b) => a.index - b.index);
    const mergedVideos = completedScenes.map(s => `file '${path.basename(s.filePath)}'`);

    // 5. Concatenate all merged videos
    const concatFilePath = path.join(tempDir, `concat-${jobId}.txt`);
    // FIXED: Use actual newline character instead of literal string \n
    fs.writeFileSync(concatFilePath, mergedVideos.join('\n'));
    
    const finalVideoPath = path.join(tempDir, `final-${jobId}.mp4`);
    const finalVideoUrl = `/temp/final-${jobId}.mp4`;
    
    const concatCommand = `ffmpeg -f concat -safe 0 -i "${concatFilePath}" -c copy -y "${finalVideoPath}"`;
    await execPromise(concatCommand);

    // Return the URL of the final stitched video
    return NextResponse.json({ videoUrl: finalVideoUrl, status: 'complete' });

  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
