"use client";

import ProgressBar from "@/components/ProgressBar";
import { ProgressBarProps } from "@/lib/types";

interface ProcessingViewProps {
  progressProps: ProgressBarProps;
}

export default function ProcessingView({ progressProps }: ProcessingViewProps) {
  return (
    <div className="space-y-6 w-full text-center">
      <div className="space-y-2">
        <p className="text-xs md:text-sm tracking-widest opacity-60 uppercase font-mono">
          Processing
        </p>
        <h2 className="text-xl md:text-2xl font-bold tracking-wide font-mono text-green-400">
          CONVERTING TO ASCII
        </h2>
      </div>

      <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-lg p-6">
        <ProgressBar {...progressProps} />
      </div>

      <p className="text-xs text-gray-400 font-mono opacity-70">
        This may take a moment depending on video length and settings...
      </p>
    </div>
  );
}
