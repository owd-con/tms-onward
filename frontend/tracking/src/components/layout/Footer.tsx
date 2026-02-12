import { HeartIcon } from '@heroicons/react/24/outline';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
          {/* Copyright */}
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <span>&copy; {currentYear} TMS Onward</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">All rights reserved</span>
          </div>

          {/* Powered By */}
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Powered by</span>
            <a
              href="https://onward.example.com"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              TMS Onward
            </a>
          </div>

          {/* Made with Love (optional) */}
          <div className="flex items-center space-x-1 text-sm text-gray-400">
            <span>Made with</span>
            <HeartIcon className="h-4 w-4 text-red-500" />
            <span>for logistics</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
