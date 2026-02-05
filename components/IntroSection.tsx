export default function IntroSection() {
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        How Was Your Day Honey?
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">
        Turn your videos into beautiful ASCII art animations! 
        Upload a short video and watch it transform into retro-style terminal art.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          Video Requirements
        </h3>
        <div className="text-xs text-blue-800 space-y-1">
          <p>
            <strong>Formats:</strong> MP4, WebM, AVI, MOV
          </p>
          <p>
            <strong>Max Size:</strong> 50MB | <strong>Max Duration:</strong>{" "}
            30 seconds
          </p>
          <p>
            <strong>Frame Rate:</strong> 24 FPS for smooth animations
          </p>
          <p>
            <strong>Processing:</strong> Done entirely in your browser - no server upload needed!
          </p>
          <p className="text-xs text-blue-600 mt-2">
            <strong>Works with:</strong> Any animated content - movies, games, animations, screen recordings
          </p>
          <p className="text-xs text-blue-600">
            <strong>Customizable:</strong> Use your own characters for unique ASCII art styles
          </p>
        </div>
      </div>
    </div>
  );
}
