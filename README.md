# How Was Your Day Honey

![Logo](public/hwydh.png)

A Next.js application that converts videos into ASCII art frames and exports them as downloadable text files.

## What It Does

```
Video Upload → Frame Extraction → ASCII Conversion → TXT File Creation → ZIP Packaging → Download Ready
      ↓              ↓                   ↓                 ↓                ↓              ↓
   Validation    PNG Files         ASCII Frames      Individual TXT    ZIP Archive    Frontend
                                                         Files                         Notification
```

Upload a video file and get a ZIP archive containing ASCII art representations of each frame as individual text files.

## Engine Details

- **Frame Extraction**: FFmpeg extracts PNG frames from video input
- **ASCII Conversion**: Custom algorithm converts images to ASCII using luminance mapping
- **Character Mapping**: Uses optimized character set for visual density representation
- **File Export**: Each frame becomes a standalone text file ready for terminal display

The ASCII conversion algorithm is inspired by Ghostty's terminal rendering approach.

## Technical Stack

- Next.js 15 with App Router
- TypeScript
- Native system tools (FFmpeg, ImageMagick)
- JSZip for archive creation
- TailwindCSS for styling

## Development

Prerequisites: Node.js, pnpm, FFmpeg, ImageMagick

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000

### Build Commands

```bash
pnpm build          # Production build
pnpm lint           # Code linting
pnpm test           # Run tests
pnpm test:watch     # Watch mode testing
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

