<img width="6000" height="566" alt="howwasyourdayhoney" src="https://github.com/user-attachments/assets/119ca802-2e26-4af6-b12c-a70c44e8f03f" />

an ASCII frames generation app that converts videos into ASCII art frames and exports them as downloadable text files

## process pipeline

| stage | process | description |
|-------|---------|-------------|
| **video upload** | user uploads a video file | accepts MP4/WebM files up to 25MB |
| **frame extraction** | .gif frames are extracted to be processed | FFmpeg.wasm extracts PNG frames from video |
| **ascii conversion** | frame by frame ASCII art created on server | Canvas API converts pixels to ASCII characters using luminance mapping |
| **txt file creation** | individual TXT files are packaged | each frame becomes a standalone text file |
| **zip packaging** | ZIP with the txt files is created | JSZip bundles all frames into a single archive |
| **download ready** | download ZIP file | user receives complete ASCII animation package |

### tech && details

all processing happens locally - your videos never leave your browser
the ASCII conversion engine uses advanced luminance calculation and optimized character mapping to create stunning terminal animations from any video content

**Technologies:**
- next.js 15
- typeScript
- FFmpeg.wasm (WebAssembly-based video processing)
- canvas API for image manipulation
- JSZip for client-side archive creation
- tailwindCSS for styling

### local setup

needs: node.js, pnpm (dont need imagemagick OR ffmpeg system tools)

```bash
pnpm install
pnpm dev
```

goto http://localhost:3000

### how to Use Git in This Repo

we work on branches off of main; follow these steps to contribute:

1. `git checkout main`
2. `git pull`
3. `git checkout -b your-github-username/your-branch-name`
4. make your changes
5. lint the code with `pnpm lint`
6. `git add .`
7. `git commit -m "your message"`
8. push your branch commits to the remote repository
9. go to GitHub and raise a pull request of your branch
10. wait for approval
11. resolution of errors (if any)
12. merge completion
13. `git checkout main`
14. `git pull`
15. `git branch -d your-github-username/your-branch-name`

you are now ready to start the process over again.

## File Limits

- maximum file size: 25MB
- maximum duration: 15 seconds
- supported formats: mp4, webm
