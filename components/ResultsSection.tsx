import PreviewPlayer from "@/components/PreviewPlayer";
import ClientDownloadButton from "@/components/ClientDownloadButton";

interface ResultsSectionProps {
  isComplete: boolean;
  asciiFrames: string[];
  onDownload: () => void;
}

export default function ResultsSection({
  isComplete,
  asciiFrames,
  onDownload,
}: ResultsSectionProps) {
  if (!isComplete || asciiFrames.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          ASCII Animation Preview
        </h3>
        <PreviewPlayer 
          frames={asciiFrames}
          fps={24}
        />
      </div>

      <ClientDownloadButton
        frames={asciiFrames}
        disabled={!isComplete}
        onDownload={onDownload}
        filename="ascii-animation"
      />
    </div>
  );
}
