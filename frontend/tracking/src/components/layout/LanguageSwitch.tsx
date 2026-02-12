import { useState, useEffect } from 'react';

type Language = 'id' | 'en';

const STORAGE_KEY = 'tms-tracking-language';

export function LanguageSwitch() {
  const [language, setLanguage] = useState<Language>(() => {
    // Get from localStorage or default to 'id'
    const stored = localStorage.getItem(STORAGE_KEY) as Language;
    return stored || 'id';
  });

  useEffect(() => {
    // Persist to localStorage whenever language changes
    localStorage.setItem(STORAGE_KEY, language);

    // Trigger custom event for other components to listen
    window.dispatchEvent(new CustomEvent('languageChange', { detail: { language } }));
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'id' ? 'en' : 'id');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
      aria-label="Toggle language"
    >
      <span className={`text-sm font-medium ${language === 'id' ? 'text-primary' : 'text-gray-500'}`}>
        ID
      </span>
      <span className="text-gray-400">/</span>
      <span className={`text-sm font-medium ${language === 'en' ? 'text-primary' : 'text-gray-500'}`}>
        EN
      </span>
    </button>
  );
}

// Helper hook to get current language
export function useLanguage(): Language {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language;
    return stored || 'id';
  });

  useEffect(() => {
    const handleLanguageChange = (e: CustomEvent) => {
      setLanguage(e.detail.language);
    };

    window.addEventListener('languageChange', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChange', handleLanguageChange as EventListener);
    };
  }, []);

  return language;
}
