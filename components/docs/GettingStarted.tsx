export default function GettingStarted() {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">getting started</h2>
      <p className="text-gray-700 mb-4">
        "how was your day honey?" converts short videos (up to 30 seconds, 50MB max) 
        into beautiful ASCII art animations. all processing happens in your browser - 
        your videos never leave your device!
      </p>

      <h3 className="text-xl font-semibold text-gray-900 mb-3">supported formats</h3>
      <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
        <li><strong>video formats:</strong> MP4, WebM, AVI, MOV</li>
        <li><strong>maximum file size:</strong> 50MB</li>
        <li><strong>maximum duration:</strong> 30 seconds</li>
        <li><strong>frame rate:</strong> 24 FPS (cinema standard)</li>
        <li><strong>works with:</strong> any animated content - movies, games, animations, screen recordings</li>
      </ul>

      <h3 className="text-xl font-semibold text-gray-900 mb-3">usage instructions</h3>
      <ol className="list-decimal list-inside text-gray-700 space-y-2">
        <li>upload a video file using drag-and-drop or file selection</li>
        <li>click "start conversion" and watch the magic happen in your browser</li>
        <li>preview your ASCII animation with the built-in player</li>
        <li>download the ZIP file containing your ASCII frames and documentation</li>
      </ol>
    </section>
  );
}
