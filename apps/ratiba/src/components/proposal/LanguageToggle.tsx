'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Globe } from 'lucide-react';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'Fran\u00e7ais',
  de: 'Deutsch',
  es: 'Espa\u00f1ol',
  it: 'Italiano',
  pt: 'Portugu\u00eas',
  nl: 'Nederlands',
  zh: '\u4e2d\u6587',
  ja: '\u65e5\u672c\u8a9e',
  ko: '\ud55c\uad6d\uc5b4',
  ar: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629',
  ru: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439',
  hi: '\u0939\u093f\u0928\u094d\u0926\u0940',
  sw: 'Kiswahili',
  pl: 'Polski',
  tr: 'T\u00fcrk\u00e7e',
  he: '\u05e2\u05d1\u05e8\u05d9\u05ea',
};

interface LanguageToggleProps {
  proposalId: string;
  currentLang: string;
  targetLang: string;
}

export function LanguageToggle({ proposalId, currentLang, targetLang }: LanguageToggleProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isShowingTranslation = currentLang !== 'en';
  const toggleLang = isShowingTranslation ? 'en' : targetLang;
  const toggleLabel = isShowingTranslation
    ? 'English'
    : (LANGUAGE_NAMES[targetLang] || targetLang);

  const handleToggle = () => {
    const params = new URLSearchParams();
    if (toggleLang !== targetLang) {
      params.set('lang', toggleLang);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <button
      onClick={handleToggle}
      className="fixed left-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-xs text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-black/80"
    >
      <Globe className="h-3.5 w-3.5" />
      {toggleLabel}
    </button>
  );
}
