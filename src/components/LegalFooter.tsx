import { useState, useEffect } from 'react';
import { LegalPages } from './LegalPages';
import { api } from '../utils/api';

type LegalPageType = 'privacy' | 'terms' | null;

export function LegalFooter() {
  const [showLegal, setShowLegal] = useState(false);
  const [activePage, setActivePage] = useState<LegalPageType>(null);
  const [legalSettings, setLegalSettings] = useState<any>(null);

  useEffect(() => {
    loadLegalSettings();
  }, []);

  const loadLegalSettings = async () => {
    try {
      const response = await api.getLegalSettings();
      if (response.settings) {
        setLegalSettings(response.settings);
      }
    } catch (error) {
      console.error('Error loading legal settings:', error);
    }
  };

  if (showLegal) {
    return (
      <LegalPages 
        defaultPage={activePage}
        onClose={() => {
          setShowLegal(false);
          setActivePage(null);
        }} 
      />
    );
  }

  return (
    <footer className="border-t mt-auto py-6 px-4 bg-slate-50 dark:bg-slate-900">
      <div className="container max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div>
            <p>© 2025 {legalSettings?.schoolName || 'Grundschule Auma'} - Hortzettel-App</p>
          </div>
          
          <div className="flex gap-6">
            <button 
              onClick={() => {
                setActivePage('privacy');
                setShowLegal(true);
              }}
              className="hover:text-foreground underline transition-colors"
            >
              Datenschutz
            </button>
            <button 
              onClick={() => {
                setActivePage('terms');
                setShowLegal(true);
              }}
              className="hover:text-foreground underline transition-colors"
            >
              Nutzungsbedingungen
            </button>
            <a 
              href={`mailto:${legalSettings?.schoolEmail || 'kontakt@grundschule-auma.de'}`}
              className="hover:text-foreground transition-colors"
            >
              Kontakt
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
