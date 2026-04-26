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
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Helper: fetch with a strict timeout so we never hang
    async function fetchWithTimeout(url, timeoutMs = 30000) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        return res;
      } catch {
        clearTimeout(timer);
        return null;
      }
    }

    // Helper: generate a fallback image using Pillow (instant, never fails)
    async function generateFallbackImage(text, imagePath) {
      const fallbackScript = path.join(process.cwd(), 'scripts', 'generate_fallback_image.py');
      const safeText = text.replace(/"/g, '\\"');
      await execPromise(`python "${fallbackScript}" "${safeText}" "${imagePath}"`);
    }

    // ─── STEP 1: Fetch ALL images CONCURRENTLY from Freepik API ───
    const freepikKey = process.env.FREEPIK_API_KEY || 'FPSX0bed0888740fec79b873f4dd12b19278';
    
    const imagePromises = scenes.map(async (scene, i) => {
      const imagePrompt = scene?.content?.imagePrompt || '';
      const narration = scene?.content?.narration || 'Explaining the concept';
      const imagePath = path.join(tempDir, `scene-${jobId}-${i}.png`);

      const shortPrompt = imagePrompt.substring(0, 500);
      let gotRealImage = false;

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const imgRes = await fetch('https://api.freepik.com/v1/ai/text-to-image', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-freepik-api-key': freepikKey
          },
          body: JSON.stringify({
            prompt: shortPrompt,
            styling: { style: 'comic' }
          }),
          signal: controller.signal
        });
        clearTimeout(timer);

        if (imgRes.ok) {
          const data = await imgRes.json();
          if (data.data && data.data.length > 0 && data.data[0].base64) {
            const base64Data = data.data[0].base64;
            const buffer = Buffer.from(base64Data, 'base64');
            fs.writeFileSync(imagePath, buffer);
            gotRealImage = true;
          }
        } else {
          console.warn(`Freepik API failed for scene ${i} with status ${imgRes.status}`);
        }
      } catch (e) {
        console.warn(`Freepik request failed for scene ${i}: ${e.message}`);
      }

      if (!gotRealImage) {
        console.warn(`Scene ${i}: Freepik failed, using Pillow fallback`);
        await generateFallbackImage(narration, imagePath);
      }
    });

    await Promise.all(imagePromises);

    // ─── STEP 2: Generate Audio → Probe Duration → Draw Animation → Merge ───
    const scenePromises = scenes.map(async (scene, i) => {
      const text = scene?.content?.narration || ' ';
      
      const imagePath = path.join(tempDir, `scene-${jobId}-${i}.png`);
      const rawVideoPath = path.join(tempDir, `scene-${jobId}-${i}_raw.mp4`);
      const audioPath = path.join(tempDir, `scene-${jobId}-${i}.mp3`);
      const mergedVideoPath = path.join(tempDir, `scene-${jobId}-${i}_merged.mp4`);

      // 2a. Generate Audio
      const audioScript = path.join(process.cwd(), 'scripts', 'generate_audio.py');
      const safeText = text.replace(/"/g, '\\"');
      await execPromise(`python "${audioScript}" "${safeText}" "${audioPath}"`);

      // 2b. Probe audio duration
      let audioDuration = 5;
      try {
        const { stdout } = await execPromise(`ffprobe -i "${audioPath}" -show_entries format=duration -v quiet -of csv="p=0"`);
        const parsed = parseFloat(stdout.trim());
        if (!isNaN(parsed) && parsed > 0) audioDuration = parsed;
      } catch (e) {
        console.warn(`Could not probe audio for scene ${i}`);
      }

      // 2c. Draw whiteboard animation (padded with 2 seconds so the final drawing lingers and audio is never cut off)
      const paddedDuration = audioDuration + 2.0;
      const drawScript = path.join(process.cwd(), 'scripts', 'draw-whiteboard-animations.py');
      await execPromise(`python "${drawScript}" "${imagePath}" "${rawVideoPath}" ${paddedDuration}`);

      // 2d. Merge audio + video (removed -shortest so the video holds its final frame for the full padded duration)
      const mergeCmd = `ffmpeg -i "${rawVideoPath}" -i "${audioPath}" -c:v libx264 -pix_fmt yuv420p -c:a aac -y "${mergedVideoPath}"`;
      await execPromise(mergeCmd);

      return { index: i, filePath: mergedVideoPath };
    });

    const completedScenes = await Promise.all(scenePromises);
    
    completedScenes.sort((a, b) => a.index - b.index);
    const mergedVideos = completedScenes.map(s => `file '${path.basename(s.filePath)}'`);

    // ─── STEP 3: Concatenate all scenes into one final video ───
    const concatFilePath = path.join(tempDir, `concat-${jobId}.txt`);
    fs.writeFileSync(concatFilePath, mergedVideos.join('\n'));
    
    const finalVideoPath = path.join(tempDir, `final-${jobId}.mp4`);
    const finalVideoUrl = `/temp/final-${jobId}.mp4`;
    
    await execPromise(`ffmpeg -f concat -safe 0 -i "${concatFilePath}" -c copy -y "${finalVideoPath}"`);

    return NextResponse.json({ videoUrl: finalVideoUrl, status: 'complete' });

  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
