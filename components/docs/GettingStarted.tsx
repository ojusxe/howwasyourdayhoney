export default function GettingStarted() {
  return (
    <section>
      <h2 className="text-xl font-bold text-green-400 mb-4 font-mono">getting started</h2>
      <p className="text-gray-300 mb-4 font-mono text-sm">
        "how was your day honey?" converts short videos (up to 30 seconds, 50MB max) 
        into beautiful ASCII art animations. all processing happens in your browser - 
        your videos never leave your device!
      </p>

      <h3 className="text-lg font-semibold text-white mb-3 font-mono">supported formats</h3>
      <ul className="text-gray-300 mb-4 space-y-1 text-sm font-mono">
        <li><span className="text-green-400">•</span> <strong className="text-white">video formats:</strong> MP4, WebM, AVI, MOV</li>
        <li><span className="text-green-400">•</span> <strong className="text-white">maximum file size:</strong> 50MB</li>
        <li><span className="text-green-400">•</span> <strong className="text-white">maximum duration:</strong> 30 seconds</li>
        <li><span className="text-green-400">•</span> <strong className="text-white">frame rate:</strong> 24 FPS (cinema standard)</li>
        <li><span className="text-green-400">•</span> <strong className="text-white">works with:</strong> any animated content - movies, games, animations, screen recordings</li>
      </ul>

      <h3 className="text-lg font-semibold text-white mb-3 font-mono">usage instructions</h3>
      <ol className="text-gray-300 space-y-2 text-sm font-mono">
        <li><span className="text-green-400">1.</span> upload a video file using drag-and-drop or file selection</li>
        <li><span className="text-green-400">2.</span> click "start conversion" and watch the magic happen in your browser</li>
        <li><span className="text-green-400">3.</span> preview your ASCII animation with the built-in player</li>
        <li><span className="text-green-400">4.</span> download the ZIP file containing your ASCII frames and documentation</li>
      </ol>
    </section>
  );
}
