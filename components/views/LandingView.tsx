"use client";

interface LandingViewProps {
  onNavigateToUpload: () => void;
}

export default function LandingView({ onNavigateToUpload }: LandingViewProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs md:text-sm tracking-widest opacity-60 uppercase font-mono">
          WEB ASSEMBLY IS HAWT
        </p>
        <h1 className="text-2xl md:text-4xl font-bold tracking-wide leading-tight max-w-xl font-mono">
          TRANSFORM YOUR VIDEOS
          <br />
          <span className="text-green-400">INTO ASCII ART</span>
        </h1>
      </div>
      <p className="text-sm md:text-base text-gray-300 max-w-md opacity-80 font-mono">
        Client-side video processing. No uploads. Pure browser magic.
      </p>

      <button
        onClick={onNavigateToUpload}
        className="group relative px-8 py-4 border border-white/80 bg-black/30 backdrop-blur-sm text-white uppercase tracking-[0.2em] text-sm font-semibold hover:bg-white hover:text-black transition-all duration-300 font-mono"
      >
        Start Converting
      </button>
    </div>
  );
}
