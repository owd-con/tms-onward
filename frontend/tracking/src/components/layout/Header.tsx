import { useState, useEffect } from 'react';
import { LanguageSwitch } from './LanguageSwitch';
import { IconTruck } from '@/assets/icons';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`bg-white sticky top-0 z-50 transition-shadow duration-200 ${
      isScrolled ? 'shadow-md' : 'border-b border-gray-200'
    }`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Tagline */}
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <IconTruck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">TMS Onward</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Track Your Shipment</p>
            </div>
          </div>

          {/* Language Switch */}
          <LanguageSwitch />
        </div>
      </div>
    </header>
  );
}
