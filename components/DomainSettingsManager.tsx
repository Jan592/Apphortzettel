import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner@2.0.3";
import { api } from "../utils/api";
import { Globe, ExternalLink, Copy, Check, Info } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

/**
 * 🌐 Domain-Einstellungen Manager
 * 
 * Ermöglicht Admins, Domain und App-Konfiguration zu verwalten.
 */

export default function DomainSettingsManager() {
  const [domain, setDomain] = useState("https://deine-domain.de");
  const [appName, setAppName] = useState("Hortzettel");
  const [schoolName, setSchoolName] = useState("Grundschule Auma");
  const [shortDescription, setShortDescription] = useState("Digitale Hortzettel-Verwaltung");
  const [fullDescription, setFullDescription] = useState(
    "Digitale Hortzettel-Verwaltung für die Grundschule Auma - Einfach, sicher und übersichtlich"
  );
  const [supportEmail, setSupportEmail] = useState("hort@grundschule-auma.de");
  const [schoolAddress, setSchoolAddress] = useState("Schulstraße 1, 07955 Auma-Weidatal");
  const [schoolPhone, setSchoolPhone] = useState("+49 36626 12345");
  
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Aktuelle URL abrufen
  const currentUrl = window.location.origin;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.getSettings();
      if (response.settings) {
        const config = response.settings.domainConfig || {};
        setDomain(config.domain || currentUrl);
        setAppName(config.appName || "Hortzettel");
        setSchoolName(config.schoolName || response.settings.schoolName || "Grundschule Auma");
        setShortDescription(config.shortDescription || "Digitale Hortzettel-Verwaltung");
        setFullDescription(
          config.fullDescription || 
          "Digitale Hortzettel-Verwaltung für die Grundschule Auma - Einfach, sicher und übersichtlich"
        );
        setSupportEmail(config.supportEmail || "hort@grundschule-auma.de");
        setSchoolAddress(config.schoolAddress || "Schulstraße 1, 07955 Auma-Weidatal");
        setSchoolPhone(config.schoolPhone || "+49 36626 12345");
      }
    } catch (error) {
      console.error("Fehler beim Laden der Domain-Einstellungen:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const domainConfig = {
        domain,
        appName,
        schoolName,
        shortDescription,
        fullDescription,
        supportEmail,
        schoolAddress,
        schoolPhone,
        lastUpdated: new Date().toISOString(),
      };

      await api.saveSettings({ domainConfig });
      
      toast.success("✅ Domain-Einstellungen gespeichert!", {
        description: "Die Änderungen werden bei der nächsten Seiten-Aktualisierung aktiv."
      });

      // Trigger reload event
      window.dispatchEvent(new CustomEvent('domainConfigUpdated', { detail: domainConfig }));
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      toast.error("❌ Fehler beim Speichern der Einstellungen");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("📋 In Zwischenablage kopiert!");
    setTimeout(() => setCopied(false), 2000);
  };

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isDomainValid = validateUrl(domain);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domain & App-Konfiguration
          </CardTitle>
          <CardDescription>
            Verwalte Domain, App-Namen und Kontaktinformationen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current URL Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Aktuelle URL:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded text-sm">
                    {currentUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(currentUrl)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Die URL wird durch deinen Hosting-Provider festgelegt. 
                  <a 
                    href="/URL_ANPASSUNG.md" 
                    target="_blank"
                    className="text-primary hover:underline ml-1"
                  >
                    Mehr erfahren →
                  </a>
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Domain Configuration */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">
                🌐 Domain URL
                <span className="text-xs text-muted-foreground ml-2">
                  (für Meta-Tags & Social Sharing)
                </span>
              </Label>
              <Input
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="https://hortzettel-auma.de"
                className={!isDomainValid ? "border-red-500" : ""}
              />
              {!isDomainValid && (
                <p className="text-xs text-red-500">
                  Bitte eine gültige URL eingeben (z.B. https://domain.de)
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Diese URL wird in Meta-Tags verwendet. Sie ändert nicht die Browser-URL.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appName">📱 App-Name</Label>
                <Input
                  id="appName"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Hortzettel"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schoolName">🏫 Schulname</Label>
                <Input
                  id="schoolName"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Grundschule Auma"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">📝 Kurzbeschreibung</Label>
              <Input
                id="shortDescription"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Digitale Hortzettel-Verwaltung"
              />
              <p className="text-xs text-muted-foreground">
                Wird in App-Stores und Suchergebnissen angezeigt
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullDescription">📄 Vollständige Beschreibung</Label>
              <Textarea
                id="fullDescription"
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                placeholder="Digitale Hortzettel-Verwaltung für die Grundschule Auma - Einfach, sicher und übersichtlich"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Wird in Meta-Tags und Social Media Shares verwendet
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium">📧 Kontaktinformationen</h3>
            
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Support E-Mail</Label>
              <Input
                id="supportEmail"
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="hort@grundschule-auma.de"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schoolAddress">Schuladresse</Label>
              <Input
                id="schoolAddress"
                value={schoolAddress}
                onChange={(e) => setSchoolAddress(e.target.value)}
                placeholder="Schulstraße 1, 07955 Auma-Weidatal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schoolPhone">Telefonnummer</Label>
              <Input
                id="schoolPhone"
                type="tel"
                value={schoolPhone}
                onChange={(e) => setSchoolPhone(e.target.value)}
                placeholder="+49 36626 12345"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={loadSettings}
              disabled={loading}
            >
              Zurücksetzen
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading || !isDomainValid}
            >
              {loading ? "Speichern..." : "✅ Speichern"}
            </Button>
          </div>

          {/* Help Links */}
          <div className="pt-4 border-t space-y-2">
            <p className="text-sm font-medium">📚 Hilfreiche Dokumentation:</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={() => window.open('/BROWSER_UND_URL.md', '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Browser & URL Übersicht
              </Button>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={() => window.open('/URL_ANPASSUNG.md', '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Custom Domain einrichten
              </Button>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={() => window.open('/SCHNELLSTART_DOMAIN.md', '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Schnellstart
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
