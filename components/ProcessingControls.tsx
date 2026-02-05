interface ProcessingControlsProps {
  canStartProcessing: boolean;
  onStartProcessing: () => void;
}

export default function ProcessingControls({
  canStartProcessing,
  onStartProcessing,
}: ProcessingControlsProps) {
  if (!canStartProcessing) return null;

  return (
    <div className="text-center">
      <button
        onClick={onStartProcessing}
        className="btn-primary px-8 py-3 text-lg"
      >
        Start Conversion
      </button>
    </div>
  );
}
