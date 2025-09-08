# How Was Your Day Honey

![Logo](public/hwydh.png)

An ASCII animation generation app that converts videos into ASCII art frames and exports them as downloadable text files.

## Client-Side Processing Flow

```
Video Upload → Frame Extraction → ASCII Conversion → TXT File Creation → ZIP Packaging → Download Ready
      ↓              ↓                   ↓                 ↓                ↓              ↓
   Browser        FFmpeg.wasm       Canvas API        JavaScript        JSZip          Browser
  Validation      PNG Frames       ASCII Frames      Individual TXT    ZIP Archive     Download
```

Upload a video file and get a ZIP archive containing ASCII art representations of each frame as individual text files - all processed locally in your browser.

## Engine Details

- **Frame Extraction**: FFmpeg.wasm extracts PNG frames from video input in the browser
- **ASCII Conversion**: Canvas API and JavaScript convert images to ASCII using luminance mapping
- **Character Mapping**: Uses Ghostty-inspired character set (·~ox+=*%$@) for visual density representation
- **File Export**: Each frame becomes a standalone text file ready for terminal display
- **Privacy First**: All processing happens locally - your videos never leave your browser

The ASCII conversion engine uses advanced luminance calculation and character mapping techniques for quality results.

## Technical Stack

- Next.js 15
- TypeScript
- FFmpeg.wasm (WebAssembly-based video processing)
- Canvas API for image manipulation
- JSZip for client-side archive creation
- TailwindCSS for styling

## Client-Side Processing

This application now runs entirely in your browser! No server-side processing or system dependencies required.

- **Video Processing**: Uses FFmpeg.wasm for frame extraction
- **ASCII Conversion**: Canvas API and JavaScript for image-to-ASCII conversion
- **File Generation**: Client-side ZIP creation with JSZip
- **Privacy**: Your videos never leave your browser

## Local Dev

Prerequisites: Node.js, pnpm (no system tools required!)

```bash
pnpm install
pnpm dev
```

Go to -> http://localhost:3000

### Build Commands

```bash
pnpm build         
pnpm lint          
pnpm test         
pnpm test:watch   
```

## How to Use Git in This Repo

We work on branches off of main. Follow these steps to contribute:

1. `git checkout main`
2. `git pull`
3. `git checkout -b your-github-username/your-branch-name`
4. Make your changes
5. Lint the code with `pnpm lint`
6. `git add .`
7. `git commit -m "your message"`
8. Push your branch commits to the remote repository
9. Go to GitHub and raise a pull request of your branch
10. Wait for approval
11. Resolution of errors (if any)
12. Merge completion
13. `git checkout main`
14. `git pull`
15. `git branch -d your-github-username/your-branch-name`

You are now ready to start the process over again.

## File Limits

- Maximum file size: 25MB
- Maximum duration: 15 seconds
- Supported formats: MP4, WebM

