import React, { useEffect, useState } from 'react';

interface LandingPageProps {
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const [websiteSrc, setWebsiteSrc] = useState<string>('/website.html');

  useEffect(() => {
    const detectLanguageAndCountry = async () => {
      // 1. Check URL override (/en, /es, ?lang=en)
      const pathname = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (pathname.includes('/en') || search.includes('lang=en')) {
        setWebsiteSrc('/website-en.html');
        return;
      }
      if (pathname.includes('/es') || search.includes('lang=es')) {
        setWebsiteSrc('/website.html');
        return;
      }

      // 2. Check Browser Language
      const navLang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase();
      const isEnglishBrowser = navLang.startsWith('en');

      if (isEnglishBrowser) {
        setWebsiteSrc('/website-en.html');
      }

      // 3. Geolocation IP check for English vs Spanish speaking countries
      try {
        const res = await fetch('https://ipapi.co/json/', { cache: 'force-cache' });
        if (res.ok) {
          const data = await res.json();
          const country = (data.country_code || '').toUpperCase();
          const englishCountries = ['US', 'CA', 'GB', 'AU', 'NZ', 'IE', 'ZA', 'IN', 'SG', 'PH'];
          if (englishCountries.includes(country)) {
            setWebsiteSrc('/website-en.html');
          } else if (['CU', 'MX', 'CO', 'AR', 'CL', 'PE', 'ES', 'UY', 'VE', 'EC', 'GT', 'DO', 'BO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PR'].includes(country)) {
            setWebsiteSrc('/website.html');
          }
        }
      } catch {
        // Fallback to browser language
      }
    };

    detectLanguageAndCountry();
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'OPEN_AUTH') {
        onOpenAuth();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onOpenAuth]);

  return (
    <div className="w-full h-screen overflow-hidden bg-[#20201F]">
      <iframe
        src={websiteSrc}
        title="HeraWallet — Financial AI Assistant"
        className="w-full h-full border-none m-0 p-0 block"
        style={{ border: 'none', width: '100%', height: '100vh' }}
      />
    </div>
  );
};
