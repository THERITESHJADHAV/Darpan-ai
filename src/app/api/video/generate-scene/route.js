import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function POST(request) {
  try {
    const { scene, sceneIndex, jobId: providedJobId, isLastScene } = await request.json();

    if (!scene || !scene.content) {
      return NextResponse.json({ error: 'Scene data is required' }, { status: 400 });
    }

    const jobId = providedJobId || Date.now().toString() + Math.random().toString(36).substring(2, 7);
    const tempDir = path.join(process.cwd(), 'public', 'temp');
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const imagePrompt = scene.content.imagePrompt || '';
    const narration = scene.content.narration || 'Explaining the concept';
    const idx = sceneIndex || 0;

    const imagePath = path.join(tempDir, `scene-${jobId}-${idx}.png`);
    const rawVideoPath = path.join(tempDir, `scene-${jobId}-${idx}_raw.mp4`);
    const audioPath = path.join(tempDir, `scene-${jobId}-${idx}.mp3`);
    const tsPath = path.join(tempDir, `scene-${jobId}-${idx}.ts`);

    // ─── 1. Fetch AI Image from Freepik API ───
    const shortPrompt = imagePrompt.substring(0, 500);
    let gotRealImage = false;
    const freepikKey = process.env.FREEPIK_API_KEY || 'FPSX0bed0888740fec79b873f4dd12b19278';

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000); 

      const imgRes = await fetch('https://api.freepik.com/v1/ai/text-to-image', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-freepik-api-key': freepikKey
        },
        body: JSON.stringify({ prompt: shortPrompt, styling: { style: 'comic' } }),
        signal: controller.signal
      });
      clearTimeout(timer);

      if (imgRes.ok) {
        const data = await imgRes.json();
        if (data.data && data.data.length > 0 && data.data[0].base64) {
          const buffer = Buffer.from(data.data[0].base64, 'base64');
          fs.writeFileSync(imagePath, buffer);
          gotRealImage = true;
        }
      } else {
        console.warn(`Freepik API failed for scene ${idx}`);
      }
    } catch (e) {
      console.warn(`Freepik request failed for scene ${idx}: ${e.message}`);
    }

    if (!gotRealImage) {
      console.warn(`Freepik failed for scene ${idx}, using Pillow fallback`);
      const fallbackScript = path.join(process.cwd(), 'scripts', 'generate_fallback_image.py');
      const safeNarration = narration.replace(/"/g, '\\"');
      await execPromise(`python "${fallbackScript}" "${safeNarration}" "${imagePath}"`);
    }

    // ─── 2. Generate Audio ───
    const audioScript = path.join(process.cwd(), 'scripts', 'generate_audio.py');
    const safeText = narration.replace(/"/g, '\\"');
    await execPromise(`python "${audioScript}" "${safeText}" "${audioPath}"`);

    // ─── 3. Probe audio duration ───
    let audioDuration = 5;
    try {
      const { stdout } = await execPromise(`ffprobe -i "${audioPath}" -show_entries format=duration -v quiet -of csv="p=0"`);
      const parsed = parseFloat(stdout.trim());
      if (!isNaN(parsed) && parsed > 0) audioDuration = parsed;
    } catch (e) {
      console.warn(`Could not probe audio for scene ${idx}`);
    }

    // ─── 4. Generate whiteboard animation ───
    const drawScript = path.join(process.cwd(), 'scripts', 'draw-whiteboard-animations.py');
    await execPromise(`python "${drawScript}" "${imagePath}" "${rawVideoPath}" ${audioDuration}`);

    // ─── 5. Merge audio + video into HLS TS Segment ───
    const mergeCmd = `ffmpeg -i "${rawVideoPath}" -i "${audioPath}" -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest -bsf:v h264_mp4toannexb -f mpegts -y "${tsPath}"`;
    await execPromise(mergeCmd);

    // ─── 6. Append to Playlist ───
    const playlistPath = path.join(tempDir, `playlist-${jobId}.m3u8`);
    if (fs.existsSync(playlistPath)) {
      const extInf = `#EXTINF:${audioDuration.toFixed(3)},\nscene-${jobId}-${idx}.ts\n`;
      fs.appendFileSync(playlistPath, extInf);

      if (isLastScene) {
        fs.appendFileSync(playlistPath, '#EXT-X-ENDLIST\n');
      }
    }

    const playlistUrl = `/temp/playlist-${jobId}.m3u8`;
    return NextResponse.json({ playlistUrl, status: 'complete', sceneIndex: idx });

  } catch (error) {
    console.error('Scene generation error:', error);
    return NextResponse.json({ error: 'Scene generation failed: ' + error.message }, { status: 500 });
  }
}
