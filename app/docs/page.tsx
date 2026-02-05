import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GettingStarted from '@/components/docs/GettingStarted';
import HowItWorks from '@/components/docs/HowItWorks';
import CodeExamples from '@/components/docs/CodeExamples';
import FileStructure from '@/components/docs/FileStructure';
import Troubleshooting from '@/components/docs/Troubleshooting';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-gray-200 flex flex-col">

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="prose prose-invert prose-gray max-w-none">
          <h1 className="text-3xl font-bold text-white mb-6">how was your day honey? - documentation</h1>
          <p className="text-lg text-gray-400 mb-8">
            learn how to create beautiful ASCII art animations from your videos, all processed in your browser!
          </p>

          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-200 mb-2">quick start</h2>
            <p className="text-blue-300">
              upload a video → process in browser → download ASCII frames → display anywhere!
            </p>
          </div>

          <GettingStarted />
          <HowItWorks />
          <CodeExamples />
          <FileStructure />
          <Troubleshooting />

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">privacy & security</h2>
            <div className="bg-green-900/20 border border-green-800 rounded-lg p-6">
              <h3 className="font-semibold text-green-200 mb-3">your privacy matters</h3>
              <ul className="text-green-300 space-y-2">
                <li>• <strong>no uploads:</strong> your videos never leave your browser</li>
                <li>• <strong>no tracking:</strong> we don't collect or store any personal data</li>
                <li>• <strong>no servers:</strong> all processing happens on your device</li>
                <li>• <strong>no limits:</strong> process as many videos as you want</li>
              </ul>
              
              <p className="text-green-400 mt-4 text-sm">
                this is how video processing should be - private, secure, and entirely under your control.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}