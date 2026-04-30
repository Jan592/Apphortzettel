import { useEffect, useState } from 'react';
import { LegalPages } from './LegalPages';
import { ThemeProvider } from '../utils/themeContext';

export default function LegalStandalone() {
  const [activePage, setActivePage] = useState<'privacy' | 'terms' | null>(null);

  useEffect(() => {
    // Read hash from URL
    const hash = window.location.hash.substring(1); // Remove #
    if (hash === 'privacy') {
      setActivePage('privacy');
    } else if (hash === 'terms') {
      setActivePage('terms');
    }
  }, []);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <LegalPages 
          defaultPage={activePage}
          onClose={() => window.close()}
        />
      </div>
    </ThemeProvider>
  );
}
