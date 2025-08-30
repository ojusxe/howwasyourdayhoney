// Debug script to test frame extraction with exact Ghostty settings
const fs = require('fs');
const path = require('path');

async function debugFrameExtraction() {
  try {
    // Dynamic import for ES modules
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { fetchFile, toBlobURL } = await import('@ffmpeg/util');
    
    const ffmpeg = new FFmpeg();
    
    console.log('Loading FFmpeg...');
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    
    ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    console.log('FFmpeg loaded successfully');

    // Load the reference video
    const videoPath = 'e:\\web-dev\\howwasyourdayhoney\\reference-logic\\bin\\video-to-terminal\\video.mp4';
    const videoBuffer = fs.readFileSync(videoPath);
    
    console.log(`Video file size: ${videoBuffer.length} bytes`);

    // Write input file to FFmpeg filesystem
    const inputFileName = 'input.mp4';
    const outputPattern = 'frame_%04d.png';
    
    await ffmpeg.writeFile(inputFileName, new Uint8Array(videoBuffer));
    console.log('Video written to FFmpeg filesystem');

    // Get video info first
    console.log('Getting video information...');
    await ffmpeg.exec(['-i', inputFileName, '-f', 'null', '-']);

    // Build exact Ghostty FFmpeg command
    const GHOSTTY_OUTPUT_COLUMNS = 100;
    const GHOSTTY_OUTPUT_FPS = 24;
    
    const command = [
      '-loglevel', 'info', // More verbose for debugging
      '-i', inputFileName,
      '-vf', `scale=${GHOSTTY_OUTPUT_COLUMNS}:-2,fps=${GHOSTTY_OUTPUT_FPS}`,
      '-y', // Overwrite output files
      outputPattern
    ];

    console.log('Running FFmpeg command:', command.join(' '));
    await ffmpeg.exec(command);

    // Count extracted frames
    let frameCount = 0;
    let frameIndex = 1;

    while (true) {
      try {
        const frameFileName = `frame_${frameIndex.toString().padStart(4, '0')}.png`;
        const frameData = await ffmpeg.readFile(frameFileName);
        
        if (frameData instanceof Uint8Array) {
          frameCount++;
          console.log(`Found frame ${frameIndex}: ${frameData.length} bytes`);
          frameIndex++;
        } else {
          break;
        }
      } catch (error) {
        // No more frames
        break;
      }
    }

    console.log(`\nTotal frames extracted: ${frameCount}`);
    console.log(`Expected frames (from reference): 235`);
    console.log(`Frame extraction ${frameCount >= 235 ? 'SUCCESS' : 'FAILED'}`);

    // Calculate actual video duration
    console.log(`\nExpected duration: ${235 / 24} seconds (9.79s)`);
    console.log(`Actual frames at 24fps: ${frameCount} frames = ${frameCount / 24} seconds`);

  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugFrameExtraction().then(() => {
  console.log('Debug complete');
}).catch(console.error);
