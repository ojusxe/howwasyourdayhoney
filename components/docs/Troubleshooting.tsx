export default function Troubleshooting() {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">troubleshooting</h2>
      
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">animation appears choppy</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• try using 24 FPS instead of 12 FPS</li>
            <li>• ensure consistent timing in your animation loop</li>
            <li>• use requestAnimationFrame for browser animations</li>
          </ul>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">characters don't align properly</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• use a monospace font (Courier New, Consolas, Monaco)</li>
            <li>• set line-height to 1 and white-space to pre</li>
            <li>• ensure consistent font size across all frames</li>
          </ul>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">performance issues</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• preload all frames before starting animation</li>
            <li>• consider reducing frame rate or resolution scale</li>
            <li>• use efficient DOM manipulation techniques</li>
            <li>• implement frame caching for repeated playback</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
