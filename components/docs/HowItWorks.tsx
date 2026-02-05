export default function HowItWorks() {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">how it works</h2>
      
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <h3 className="font-semibold text-gray-900 mb-2">1. upload video</h3>
          <p className="text-sm text-gray-600">
            drag & drop or select your video file. supports MP4 and WebM formats.
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-4 text-center">
          <h3 className="font-semibold text-gray-900 mb-2">2. browser magic</h3>
          <p className="text-sm text-gray-600">
            FFmpeg.wasm extracts frames and converts them to ASCII art using luminance mapping.
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <h3 className="font-semibold text-gray-900 mb-2">3. download & enjoy</h3>
          <p className="text-sm text-gray-600">
            get a ZIP with ASCII frames, usage examples, and complete documentation.
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">character set options</h3>
        <p className="text-sm text-gray-600 mb-3">choose from our optimized set or create your own:</p>
        
        <div className="space-y-3">
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-1">default (70+ characters):</h4>
            <div className="bg-white px-3 py-2 rounded font-mono text-xs tracking-tight break-all">
              {' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$'}
            </div>
          </div>
          
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-1">custom examples:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">classic:</span>
                <code className="ml-1 bg-white px-1 rounded">.:-=+*#%@</code>
              </div>
              <div>
                <span className="text-gray-500">numbers:</span>
                <code className="ml-1 bg-white px-1 rounded"> 0123456789</code>
              </div>
              <div>
                <span className="text-gray-500">letters:</span>
                <code className="ml-1 bg-white px-1 rounded"> abcdefg</code>
              </div>
              <div>
                <span className="text-gray-500">blocks:</span>
                <code className="ml-1 bg-white px-1 rounded"> ░▒▓█</code>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          tip: order characters from lightest to darkest for best results
        </p>
      </div>
    </section>
  );
}
