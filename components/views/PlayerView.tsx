"use client";

interface PlayerViewProps {
  asciiFrames: string[];
  currentFrameIndex: number;
}

export default function PlayerView({
  asciiFrames,
  currentFrameIndex,
}: PlayerViewProps) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <pre className="text-green-400 font-mono text-[0.5rem] md:text-xs leading-tight whitespace-pre overflow-auto max-h-full">
        {asciiFrames[currentFrameIndex]}
      </pre>
    </div>
  );
}
