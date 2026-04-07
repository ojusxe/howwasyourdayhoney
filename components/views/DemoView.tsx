"use client";

interface DemoViewProps {
  status: "idle" | "processing" | "ready" | "error";
  progress: number;
  error: string | null;
  videoSrc: string;
  currentFrame: string;
}

export default function DemoView({
  status,
  progress,
  error,
  videoSrc,
  currentFrame,
}: DemoViewProps) {
  return (
    <div className="w-full h-full flex flex-col gap-4 md:gap-6">
      {status === "processing" && (
        <div className="border border-white/15 bg-white/5 p-5 space-y-3">
          <p className="text-xs uppercase tracking-[0.16em] text-white/70">Preparing demo frames...</p>
          <div className="h-2 w-full bg-white/10 overflow-hidden">
            <div className="h-full bg-green-400 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-white/60">{progress}% complete</p>
        </div>
      )}

      {status === "error" && (
        <div className="border border-red-500/35 bg-red-950/30 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-red-200">Demo failed</p>
          <p className="text-sm text-red-100 mt-2">{error}</p>
        </div>
      )}

      {status === "ready" && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
            <article className="border border-white/15 bg-black/70 p-3 md:p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/60 mb-3">Original video</p>
              <div className="w-full aspect-video border border-white/10 bg-black/70 flex items-center justify-center overflow-hidden">
                <video
                  src={videoSrc}
                  muted
                  loop
                  playsInline
                  autoPlay
                  className="h-full w-full object-contain"
                />
              </div>
            </article>

            <article className="border border-white/15 bg-black/70 p-3 md:p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-green-300/80 mb-3">ASCII playback</p>
              <div className="w-full aspect-video border border-green-500/25 bg-black overflow-auto p-2 md:p-3">
                <pre className="text-green-400 text-[0.34rem] md:text-[0.44rem] leading-[0.4rem] md:leading-[0.5rem] whitespace-pre">
                  {currentFrame}
                </pre>
              </div>
            </article>
          </div>
        </>
      )}
    </div>
  );
}