import Link from 'next/link';

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link 
            href="/" 
            className="text-xl font-semibold text-gray-900 hover:text-gray-700 transition-colors"
          >
            ASCII Frame Generator
          </Link>
          <nav>
            <Link 
              href="/docs" 
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Docs
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}