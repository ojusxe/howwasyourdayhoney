# How Was Your Day Honey <img width="63" height="63" alt="3" src="https://github.com/user-attachments/assets/fcc3b576-ee86-431d-86f7-a916328d302d" />
 
<img width="63" height="63" alt="4" src="https://github.com/user-attachments/assets/c432c4cb-24c2-4801-8f6e-ad20a3feaa60" />



An ASCII animation generation app that converts videos into ASCII art frames and exports them as downloadable text files.

## Abstracted Client Side Processing Flow

![Logo](public/workflow.png)

## Details

- **Frame Extraction**: FFmpeg.wasm extracts PNG frames from video input in the browser
- **ASCII Conversion**: Canvas API and JavaScript convert images to ASCII using luminance mapping
- **Character Mapping**: Uses optimized 70+ character set by default, with option for custom character sets
- **File Export**: Each frame becomes a standalone text file ready for terminal display

All processing happens locally - your videos never leave your browser
The ASCII conversion engine uses advanced luminance calculation and optimized character mapping to create stunning terminal animations from any video content.

- Next.js 15
- TypeScript
- FFmpeg.wasm (WebAssembly-based video processing)
- Canvas API for image manipulation
- JSZip for client-side archive creation
- TailwindCSS for styling

## Local Dev

Prerequisites: Node.js, pnpm (no system tools required)

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
