import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    const jobId = Date.now().toString() + Math.random().toString(36).substring(2, 7);
    const tempDir = path.join(process.cwd(), 'public', 'temp');
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const playlistPath = path.join(tempDir, `playlist-${jobId}.m3u8`);
    
    // Initialize an HLS Event Playlist
    // EVENT type allows appending new segments while clients are watching
    const initialContent = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:15
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:EVENT
`;

    fs.writeFileSync(playlistPath, initialContent);

    return NextResponse.json({ 
      jobId, 
      playlistUrl: `/temp/playlist-${jobId}.m3u8`,
      status: 'initialized' 
    });

  } catch (error) {
    console.error('Playlist init error:', error);
    return NextResponse.json({ error: 'Failed to initialize playlist: ' + error.message }, { status: 500 });
  }
}
