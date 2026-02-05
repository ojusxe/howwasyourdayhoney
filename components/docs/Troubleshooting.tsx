export default function Troubleshooting() {
  return (
    <section>
      <h2 className="text-xl font-bold text-green-400 mb-4 font-mono">troubleshooting</h2>
      
      <div className="space-y-4">
        <div className="border border-white/10 bg-white/5 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-2 font-mono">animation appears choppy</h3>
          <ul className="text-sm text-gray-400 space-y-1 font-mono">
            <li><span className="text-green-400">•</span> try using 24 FPS instead of 12 FPS</li>
            <li><span className="text-green-400">•</span> ensure consistent timing in your animation loop</li>
            <li><span className="text-green-400">•</span> use requestAnimationFrame for browser animations</li>
          </ul>
        </div>

        <div className="border border-white/10 bg-white/5 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-2 font-mono">characters don't align properly</h3>
          <ul className="text-sm text-gray-400 space-y-1 font-mono">
            <li><span className="text-green-400">•</span> use a monospace font (Courier New, Consolas, Monaco)</li>
            <li><span className="text-green-400">•</span> set line-height to 1 and white-space to pre</li>
            <li><span className="text-green-400">•</span> ensure consistent font size across all frames</li>
          </ul>
        </div>

        <div className="border border-white/10 bg-white/5 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-2 font-mono">performance issues</h3>
          <ul className="text-sm text-gray-400 space-y-1 font-mono">
            <li><span className="text-green-400">•</span> preload all frames before starting animation</li>
            <li><span className="text-green-400">•</span> consider reducing frame rate or resolution scale</li>
            <li><span className="text-green-400">•</span> use efficient DOM manipulation techniques</li>
            <li><span className="text-green-400">•</span> implement frame caching for repeated playback</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
