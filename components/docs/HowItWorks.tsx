export default function HowItWorks() {
  return (
    <section>
      <h2 className="text-xl font-bold text-green-400 mb-4 font-mono">how it works</h2>
      
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
          <h3 className="font-semibold text-green-400 mb-2 font-mono">1. upload video</h3>
          <p className="text-sm text-gray-400 font-mono">
            drag & drop or select your video file. supports MP4 and WebM formats.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
          <h3 className="font-semibold text-green-400 mb-2 font-mono">2. browser magic</h3>
          <p className="text-sm text-gray-400 font-mono">
            FFmpeg.wasm extracts frames and converts them to ASCII art using luminance mapping.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
          <h3 className="font-semibold text-green-400 mb-2 font-mono">3. download & enjoy</h3>
          <p className="text-sm text-gray-400 font-mono">
            get a ZIP with ASCII frames, usage examples, and complete documentation.
          </p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-2 font-mono">character set options</h3>
        <p className="text-sm text-gray-400 mb-3 font-mono">choose from our optimized set or create your own:</p>
        
        <div className="space-y-3">
          <div>
            <h4 className="text-xs font-medium text-gray-300 mb-1 font-mono">default (70+ characters):</h4>
            <div className="bg-black/50 border border-white/10 px-3 py-2 rounded font-mono text-xs tracking-tight break-all text-green-400">
              {' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$'}
            </div>
          </div>
          
          <div>
            <h4 className="text-xs font-medium text-gray-300 mb-1 font-mono">custom examples:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-gray-500">classic:</span>
                <code className="ml-1 bg-black/50 text-green-400 px-1 rounded">.:-=+*#%@</code>
              </div>
              <div>
                <span className="text-gray-500">numbers:</span>
                <code className="ml-1 bg-black/50 text-green-400 px-1 rounded"> 0123456789</code>
              </div>
              <div>
                <span className="text-gray-500">letters:</span>
                <code className="ml-1 bg-black/50 text-green-400 px-1 rounded"> abcdefg</code>
              </div>
              <div>
                <span className="text-gray-500">blocks:</span>
                <code className="ml-1 bg-black/50 text-green-400 px-1 rounded"> ░▒▓█</code>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-2 font-mono">
          tip: order characters from lightest to darkest for best results
        </p>
      </div>
    </section>
  );
}
