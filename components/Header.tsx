import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link 
            href="/" 
            className=""
          >
            <Image
              src="/hwydh.png"
              alt="ASCII Frame Generator"
              width={240}
              height={32}
              className="inline-block"
            />
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