export default function Footer() {
  return (
    <footer className="border-t border-gray-200 mt-auto bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <p>
            Inspired by{' '}
            <a 
              href="https://github.com/ghostty-org/ghostty" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-gray-700 transition-colors underline"
            >
              Ghostty
            </a>
            {' '}(MIT License)
          </p>
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-gray-700 transition-colors underline"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}