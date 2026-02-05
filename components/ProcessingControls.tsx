interface ProcessingControlsProps {
  canStartProcessing: boolean;
  onStartProcessing: () => void;
}

export default function ProcessingControls({
  canStartProcessing,
  onStartProcessing,
}: ProcessingControlsProps) {
  return (
    <div>
      <button
        onClick={onStartProcessing}
        disabled={!canStartProcessing}
        className="px-8 py-4 border border-green-400/80 bg-green-500/20 backdrop-blur-sm text-green-400 uppercase tracking-[0.2em] text-sm font-semibold hover:bg-green-400 hover:text-black transition-all duration-300 font-mono disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-500/20 disabled:hover:text-green-400"
      >
        Start Conversion
      </button>
    </div>
  );
}
