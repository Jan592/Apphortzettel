import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { 
  Shield, 
  FileText, 
  ChevronLeft, 
  Download,
  ExternalLink,
  Mail,
  Phone,
  AlertCircle
} from 'lucide-react';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { api } from '../utils/api';
import { DynamicPrivacyPolicy, DynamicTermsOfService } from './DynamicLegalContent';
import type { LegalSettings } from '../types/legal';
import { defaultLegalSettings } from '../types/legal';

type LegalPageType = 'privacy' | 'terms' | null;

interface LegalPagesProps {
  onClose?: () => void;
  defaultPage?: LegalPageType;
}

export function LegalPages({ onClose, defaultPage = null }: LegalPagesProps) {
  const [activePage, setActivePage] = useState<LegalPageType>(defaultPage);
  const [legalSettings, setLegalSettings] = useState<LegalSettings>(defaultLegalSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLegalSettings();
  }, []);

  const loadLegalSettings = async () => {
    try {
      const response = await api.getLegalSettings();
      if (response.settings) {
        setLegalSettings({ ...defaultLegalSettings, ...response.settings });
      }
    } catch (error) {
      console.error('Error loading legal settings:', error);
      // Use defaults on error
    } finally {
      setLoading(false);
    }
  };

  if (activePage === null) {
    return (
      <div className="container max-w-4xl mx-auto py-6 md:py-8 px-3 md:px-4">
        <div className="space-y-4 md:space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold">Rechtliche Hinweise</h1>
            <p className="text-sm md:text-base text-muted-foreground px-4">
              Informationen zu Datenschutz und Nutzungsbedingungen
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-blue-500"
              onClick={() => setActivePage('privacy')}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle>Datenschutzerklärung</CardTitle>
                    <p className="text-sm text-muted-foreground">DSGVO-konform</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  Erfahren Sie, wie wir Ihre Daten verarbeiten und schützen.
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    <span>Ihre Rechte und Kontrollmöglichkeiten</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    <span>Datenspeicherung und -löschung</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    <span>Besonderer Schutz von Kinderdaten</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-purple-500"
              onClick={() => setActivePage('terms')}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle>Nutzungsbedingungen</CardTitle>
                    <p className="text-sm text-muted-foreground">AGB</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  Die Regeln und Bedingungen für die Nutzung der App.
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    <span>Rechte und Pflichten der Nutzer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    <span>Haftungsregelungen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    <span>Kündigung und Datenexport</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Zurück
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-4 md:py-8 px-3 md:px-4">
      <div className="space-y-4">
        {/* Header mit zentrierter Überschrift */}
        <div className="relative">
          {/* Zurück-Button links oben */}
          <div className="absolute left-0 top-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (onClose && defaultPage) {
                  onClose();
                } else {
                  setActivePage(null);
                }
              }}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Zurück
            </Button>
          </div>
          
          {/* Zentrierte Überschrift */}
          <div className="text-center pt-12 md:pt-0 px-12 md:px-20">
            <div className="flex items-center justify-center gap-2 mb-2">
              {activePage === 'privacy' ? (
                <Shield className="w-5 h-5 md:w-6 md:h-6 text-blue-600 flex-shrink-0" />
              ) : (
                <FileText className="w-5 h-5 md:w-6 md:h-6 text-purple-600 flex-shrink-0" />
              )}
              <h1 className="text-lg md:text-2xl font-bold leading-tight">
                {activePage === 'privacy' ? 'Datenschutzerklärung' : 'Nutzungsbedingungen'}
              </h1>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mb-3">
              Version {legalSettings.version} • Stand: {legalSettings.lastUpdated}
            </p>
            
            {/* Kleiner Download-Button unter der Überschrift */}
            <Button 
              variant="ghost" 
              size="sm"
              className="text-xs h-8"
              onClick={() => {
                const content = activePage === 'privacy' 
                  ? document.getElementById('privacy-content')?.innerText
                  : document.getElementById('terms-content')?.innerText;
                if (content) {
                  const blob = new Blob([content], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = activePage === 'privacy' 
                    ? 'Datenschutzerklärung.txt' 
                    : 'Nutzungsbedingungen.txt';
                  a.click();
                }
              }}
            >
              <Download className="w-3 h-3 mr-1.5" />
              Als Textdatei herunterladen
            </Button>
          </div>
        </div>

        <Card>
          <ScrollArea className="h-[calc(100vh-16rem)] md:h-[70vh] p-4 md:p-6">
            <div id={activePage === 'privacy' ? 'privacy-content' : 'terms-content'}>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Lade Dokument...</p>
                  </div>
                </div>
              ) : activePage === 'privacy' ? (
                <DynamicPrivacyPolicy settings={legalSettings} />
              ) : (
                <DynamicTermsOfService settings={legalSettings} />
              )}
            </div>
          </ScrollArea>
        </Card>

        {!loading && (
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-2">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-base md:text-lg">Kontakt & Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Datenschutzbeauftragter
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Bei Fragen zum Datenschutz:
                  </p>
                  <div>
                    <p className="font-medium text-sm">{legalSettings.dsbName}</p>
                    <a 
                      href={`mailto:${legalSettings.dsbEmail}`}
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {legalSettings.dsbEmail}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {legalSettings.dsbPhone && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {legalSettings.dsbPhone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Support
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Technische Fragen:
                  </p>
                  <div>
                    <a 
                      href={`mailto:${legalSettings.supportEmail}`}
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {legalSettings.supportEmail}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {legalSettings.supportPhone && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {legalSettings.supportPhone}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {legalSettings.supportHours}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                    Beschwerderecht
                  </p>
                  <p className="text-amber-800 dark:text-amber-200">
                    Sie haben das Recht, sich bei der Datenschutz-Aufsichtsbehörde zu beschweren:
                    <strong className="block mt-1">Thüringer Landesbeauftragter für den Datenschutz</strong>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
