import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';
import { 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  User, 
  Save, 
  Eye,
  AlertCircle,
  CheckCircle2,
  Download
} from 'lucide-react';
import { api } from '../utils/api';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { DynamicPrivacyPolicy, DynamicTermsOfService } from './DynamicLegalContent';
import type { LegalSettings } from '../types/legal';
import { defaultLegalSettings } from '../types/legal';

const defaultSettings: LegalSettings = {
  ...defaultLegalSettings,
  schoolStreet: '',
  schoolZip: '',
  schoolPhone: '',
  schoolEmail: '',
  dsbName: '',
  dsbEmail: '',
  principalName: '',
  principalEmail: '',
  supportEmail: '',
};

export function LegalSettingsManager() {
  const [settings, setSettings] = useState<LegalSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.getLegalSettings();
      if (response.settings) {
        setSettings({ ...defaultSettings, ...response.settings });
      }
    } catch (error) {
      console.error('Error loading legal settings:', error);
      toast.error('Fehler beim Laden der Einstellungen');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Update lastUpdated
      const updatedSettings = {
        ...settings,
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      
      await api.saveLegalSettings(updatedSettings);
      setSettings(updatedSettings);
      
      toast.success('Rechtliche Einstellungen gespeichert!');
    } catch (error: any) {
      console.error('Error saving legal settings:', error);
      toast.error(error.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rechtliche-einstellungen-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success('Einstellungen exportiert');
  };

  const getCompletionPercentage = () => {
    const requiredFields = [
      'schoolStreet', 'schoolZip', 'schoolPhone', 'schoolEmail',
      'dsbName', 'dsbEmail',
      'principalName', 'principalEmail',
      'supportEmail'
    ];
    
    const filled = requiredFields.filter(key => {
      const value = settings[key as keyof LegalSettings];
      return value && value.toString().trim().length > 0;
    }).length;
    
    return Math.round((filled / requiredFields.length) * 100);
  };

  const completionPercentage = getCompletionPercentage();
  const isComplete = completionPercentage === 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Lade Einstellungen...</p>
        </div>
      </div>
    );
  }

  if (showPreview) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Vorschau der generierten Dokumente</h3>
          <Button variant="outline" onClick={() => setShowPreview(false)}>
            Zurück zur Bearbeitung
          </Button>
        </div>
        <PreviewDocuments settings={settings} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header mit Status */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Rechtliche Einstellungen</h2>
          <p className="text-muted-foreground">
            Vervollständigen Sie alle Informationen für DSGVO-konforme Datenschutzerklärung und Nutzungsbedingungen
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 mb-2">
            {isComplete ? (
              <Badge className="bg-green-500">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Vollständig
              </Badge>
            ) : (
              <Badge variant="outline" className="border-orange-500 text-orange-600">
                <AlertCircle className="w-3 h-3 mr-1" />
                {completionPercentage}% ausgefüllt
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Version {settings.version} • Zuletzt aktualisiert: {settings.lastUpdated}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Fortschritt</span>
          <span className="text-sm font-medium">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              isComplete ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Warning wenn nicht vollständig */}
      {!isComplete && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Achtung:</strong> Bitte füllen Sie alle Pflichtfelder aus, bevor Sie die App produktiv nutzen. 
            Unvollständige Datenschutzerklärungen können rechtliche Probleme verursachen.
          </AlertDescription>
        </Alert>
      )}

      {/* Formular */}
      <Tabs defaultValue="school" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="school">
            <Building2 className="w-4 h-4 mr-2" />
            Schule
          </TabsTrigger>
          <TabsTrigger value="dsb">
            <User className="w-4 h-4 mr-2" />
            Datenschutz
          </TabsTrigger>
          <TabsTrigger value="contacts">
            <Phone className="w-4 h-4 mr-2" />
            Kontakte
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Globe className="w-4 h-4 mr-2" />
            Erweitert
          </TabsTrigger>
        </TabsList>

        {/* Tab: Schulinformationen */}
        <TabsContent value="school" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schulinformationen</CardTitle>
              <CardDescription>
                Grundlegende Informationen über Ihre Schule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">
                    Schulname <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="schoolName"
                    value={settings.schoolName}
                    onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                    placeholder="z.B. Grundschule Auma"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolCity">
                    Ort
                  </Label>
                  <Input
                    id="schoolCity"
                    value={settings.schoolCity}
                    onChange={(e) => setSettings({ ...settings, schoolCity: e.target.value })}
                    placeholder="z.B. Auma-Weidatal"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="schoolStreet">
                    Straße und Hausnummer <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="schoolStreet"
                    value={settings.schoolStreet}
                    onChange={(e) => setSettings({ ...settings, schoolStreet: e.target.value })}
                    placeholder="z.B. Schulstraße 12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolZip">
                    PLZ <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="schoolZip"
                    value={settings.schoolZip}
                    onChange={(e) => setSettings({ ...settings, schoolZip: e.target.value })}
                    placeholder="z.B. 07955"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolPhone">
                    Telefon <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="schoolPhone"
                      value={settings.schoolPhone}
                      onChange={(e) => setSettings({ ...settings, schoolPhone: e.target.value })}
                      placeholder="z.B. 036626 12345"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolEmail">
                    E-Mail <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="schoolEmail"
                      type="email"
                      value={settings.schoolEmail}
                      onChange={(e) => setSettings({ ...settings, schoolEmail: e.target.value })}
                      placeholder="z.B. kontakt@grundschule-auma.de"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schoolWebsite">
                  Website (optional)
                </Label>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="schoolWebsite"
                    type="url"
                    value={settings.schoolWebsite}
                    onChange={(e) => setSettings({ ...settings, schoolWebsite: e.target.value })}
                    placeholder="z.B. www.grundschule-auma.de"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Datenschutzbeauftragter */}
        <TabsContent value="dsb" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Datenschutzbeauftragter</CardTitle>
              <CardDescription>
                Kontaktdaten des Datenschutzbeauftragten (DSB)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <strong>Wichtig:</strong> Ein Datenschutzbeauftragter ist Pflicht, wenn Sie personenbezogene Daten verarbeiten. 
                  Falls Sie keinen DSB haben, kontaktieren Sie bitte den Schulträger oder eine externe Datenschutzberatung.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="dsbName">
                  Name des Datenschutzbeauftragten <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dsbName"
                  value={settings.dsbName}
                  onChange={(e) => setSettings({ ...settings, dsbName: e.target.value })}
                  placeholder="z.B. Max Mustermann"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dsbEmail">
                    E-Mail <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="dsbEmail"
                      type="email"
                      value={settings.dsbEmail}
                      onChange={(e) => setSettings({ ...settings, dsbEmail: e.target.value })}
                      placeholder="z.B. dsb@grundschule-auma.de"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dsbPhone">
                    Telefon (optional)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="dsbPhone"
                      value={settings.dsbPhone}
                      onChange={(e) => setSettings({ ...settings, dsbPhone: e.target.value })}
                      placeholder="z.B. 036626 12346"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-sm">
                <p className="font-semibold mb-2">Externe Datenschutzbeauftrage finden:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Kontaktieren Sie Ihren Schulträger (Kommune/Kreis)</li>
                  <li>Thüringer Landesbeauftragter: 0361 57 3112900</li>
                  <li>Externe Datenschutzberatungen (ab ca. 80 €/Monat)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Kontaktpersonen */}
        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schulleitung</CardTitle>
              <CardDescription>
                Kontaktdaten der Schulleitung
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="principalName">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="principalName"
                  value={settings.principalName}
                  onChange={(e) => setSettings({ ...settings, principalName: e.target.value })}
                  placeholder="z.B. Frau Müller"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="principalEmail">
                    E-Mail <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="principalEmail"
                    type="email"
                    value={settings.principalEmail}
                    onChange={(e) => setSettings({ ...settings, principalEmail: e.target.value })}
                    placeholder="z.B. leitung@grundschule-auma.de"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="principalPhone">
                    Telefon
                  </Label>
                  <Input
                    id="principalPhone"
                    value={settings.principalPhone}
                    onChange={(e) => setSettings({ ...settings, principalPhone: e.target.value })}
                    placeholder="z.B. 036626 12345"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hortleitung</CardTitle>
              <CardDescription>
                Kontaktdaten der Hortleitung
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hortLeaderName">
                  Name
                </Label>
                <Input
                  id="hortLeaderName"
                  value={settings.hortLeaderName}
                  onChange={(e) => setSettings({ ...settings, hortLeaderName: e.target.value })}
                  placeholder="z.B. Frau Schmidt"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hortLeaderPhone">
                    Telefon
                  </Label>
                  <Input
                    id="hortLeaderPhone"
                    value={settings.hortLeaderPhone}
                    onChange={(e) => setSettings({ ...settings, hortLeaderPhone: e.target.value })}
                    placeholder="z.B. 036626 12347"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hortLeaderHours">
                    Sprechzeiten
                  </Label>
                  <Input
                    id="hortLeaderHours"
                    value={settings.hortLeaderHours}
                    onChange={(e) => setSettings({ ...settings, hortLeaderHours: e.target.value })}
                    placeholder="z.B. Montag - Freitag, 12:00 - 17:00 Uhr"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Technischer Support</CardTitle>
              <CardDescription>
                Kontakt für technische Fragen zur App
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">
                    E-Mail <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    placeholder="z.B. support@grundschule-auma.de"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supportPhone">
                    Telefon
                  </Label>
                  <Input
                    id="supportPhone"
                    value={settings.supportPhone}
                    onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                    placeholder="z.B. 036626 12345"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supportHours">
                  Erreichbarkeit
                </Label>
                <Input
                  id="supportHours"
                  value={settings.supportHours}
                  onChange={(e) => setSettings({ ...settings, supportHours: e.target.value })}
                  placeholder="z.B. Montag - Freitag, 8:00 - 16:00 Uhr"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Erweitert */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Versionsverwaltung</CardTitle>
              <CardDescription>
                Verwaltung der Dokumentenversion und Aktualisierungsdatum
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={settings.version}
                    onChange={(e) => setSettings({ ...settings, version: e.target.value })}
                    placeholder="z.B. 1.0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Erhöhen Sie die Version bei größeren Änderungen (z.B. 1.0 → 1.1)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastUpdated">Letztes Update</Label>
                  <Input
                    id="lastUpdated"
                    type="date"
                    value={settings.lastUpdated}
                    onChange={(e) => setSettings({ ...settings, lastUpdated: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Wird automatisch beim Speichern aktualisiert
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold">Aktionen</h4>
                
                <Button 
                  variant="outline" 
                  onClick={handleExport}
                  className="w-full justify-start"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Einstellungen exportieren (JSON)
                </Button>

                <p className="text-xs text-muted-foreground">
                  Exportieren Sie Ihre Einstellungen als Backup oder zur Verwendung in anderen Instanzen.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-900 dark:text-amber-100">
                ⚖️ Rechtlicher Hinweis
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-800 dark:text-amber-200 space-y-3">
              <p>
                <strong>Wichtig:</strong> Die generierten Datenschutzerklärung und Nutzungsbedingungen 
                sind Vorlagen und sollten von einem Rechtsexperten geprüft werden.
              </p>
              
              <div className="bg-white/50 dark:bg-black/20 p-3 rounded">
                <p className="font-semibold mb-2">Empfohlene Prüfung durch:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Datenschutzbeauftragten (Minimum!)</li>
                  <li>Rechtsanwalt mit Schwerpunkt Datenschutz</li>
                  <li>Externe Datenschutzberatung</li>
                </ul>
              </div>

              <p className="text-xs">
                Kosten: ca. 300-800 € für rechtliche Prüfung (einmalig)
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-4 sticky bottom-0 bg-background/95 backdrop-blur py-4 border-t">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="flex-1"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Speichern...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Einstellungen speichern
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => setShowPreview(true)}
          disabled={!isComplete}
        >
          <Eye className="w-4 h-4 mr-2" />
          Vorschau
        </Button>
      </div>
    </div>
  );
}

function PreviewDocuments({ settings }: { settings: LegalSettings }) {
  const [activeDoc, setActiveDoc] = useState<'privacy' | 'terms'>('privacy');

  return (
    <div className="space-y-4">
      <Tabs value={activeDoc} onValueChange={(v) => setActiveDoc(v as 'privacy' | 'terms')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="privacy">Datenschutzerklärung</TabsTrigger>
          <TabsTrigger value="terms">Nutzungsbedingungen</TabsTrigger>
        </TabsList>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Vollständige Datenschutzerklärung</CardTitle>
              <CardDescription>
                So sehen Nutzer Ihre vollständige DSGVO-konforme Datenschutzerklärung
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh] pr-4">
                <DynamicPrivacyPolicy settings={settings} />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="terms">
          <Card>
            <CardHeader>
              <CardTitle>Vollständige Nutzungsbedingungen</CardTitle>
              <CardDescription>
                So sehen Nutzer Ihre vollständigen Nutzungsbedingungen (AGB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh] pr-4">
                <DynamicTermsOfService settings={settings} />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
