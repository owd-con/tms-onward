import { useLanguageContext } from './context';
import { translations } from './translations';

export function useTranslation() {
  const { language } = useLanguageContext();

  const t = (key: keyof typeof translations.id) => {
    return translations[language][key] || translations.id[key];
  };

  return { t, language };
}
