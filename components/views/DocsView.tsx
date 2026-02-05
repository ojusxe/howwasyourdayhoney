"use client";

import GettingStarted from "@/components/docs/GettingStarted";
import HowItWorks from "@/components/docs/HowItWorks";
import CodeExamples from "@/components/docs/CodeExamples";
import Troubleshooting from "@/components/docs/Troubleshooting";

export default function DocsView() {
  return (
    <div className="space-y-6 w-full max-w-3xl overflow-y-auto max-h-[70vh]">
      <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-lg p-6 space-y-6">
        <GettingStarted />
      </div>

      <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-lg p-6 space-y-6">
        <HowItWorks />
      </div>

      <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-lg p-6 space-y-6">
        <CodeExamples />
      </div>

      <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-lg p-6 space-y-6">
        <Troubleshooting />
      </div>

      <div className="bg-black/60 backdrop-blur-md border border-green-500/30 rounded-lg p-6">
        <h3 className="text-lg font-bold text-green-400 mb-4 font-mono">
          Privacy & Security
        </h3>
        <ul className="space-y-2 text-sm text-gray-300 font-mono">
          <li className="flex items-start gap-2">
            <span className="text-green-400">•</span>
            <span>All processing happens in your browser - no server uploads</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">•</span>
            <span>Your videos never leave your device</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">•</span>
            <span>No data is stored or transmitted to external servers</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
