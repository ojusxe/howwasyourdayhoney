# ASCII Frame Generator

A Next.js 15 web application that converts short videos into ASCII art frames using serverless processing.

## Features

- Upload videos (MP4/WebM, max 15 seconds, 25MB)
- Configurable ASCII conversion settings
- Frame rate and resolution scaling options
- Multiple color modes (B&W, two-tone, full-color)
- ZIP download of ASCII frames
- Ephemeral processing (no data persistence)

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- TailwindCSS
- ffmpeg.wasm
- JSZip
- Vercel deployment

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## License

This project uses conversion logic inspired by [Ghostty](https://github.com/ghostty-org/ghostty), licensed under MIT License.

## Development

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build
```


Video Upload → Frame Extraction → ASCII Conversion → TXT File Creation → ZIP Packaging → Download Ready
      ↓              ↓                   ↓                 ↓                ↓              ↓
   Validation    PNG Files         ASCII Frames      Individual TXT    ZIP Archive    Frontend
                                                         Files                         Notification