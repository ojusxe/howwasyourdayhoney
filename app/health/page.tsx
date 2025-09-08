export default function HealthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">✅ App is Running</h1>
        <p className="text-gray-600 mb-4">Client-side processing is ready!</p>
        <div className="space-y-2 text-sm text-gray-500">
          <p>✅ No server APIs needed</p>
          <p>✅ Client-side processing only</p>
          <p>✅ Privacy-first architecture</p>
        </div>
        <a 
          href="/" 
          className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Go to App
        </a>
      </div>
    </div>
  );
}