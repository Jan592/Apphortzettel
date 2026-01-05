import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { 
  Smartphone, 
  Edit2, 
  Check, 
  X, 
  AlertCircle,
  Palette,
  Image as ImageIcon,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { Card } from "./ui/card";
import { api } from "../utils/api";

interface ManifestData {
  name: string;
  short_name: string;
  description: string;
  theme_color: string;
  background_color: string;
}

export function PWASettingsManager() {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [manifest, setManifest] = useState<ManifestData>({
    name: "Hortzettel App - Grundschule Auma",
    short_name: "Hortzettel",
    description: "Digitale Hortzettel-Verwaltung für die Grundschule Auma",
    theme_color: "#3B82F6",
    background_color: "#3B82F6"
  });

  useEffect(() => {
    loadManifest();
  }, []);

  const loadManifest = async () => {
    try {
      const response = await fetch('/manifest.json');
      if (!response.ok) {
        throw new Error('Failed to fetch manifest');
      }
      const data = await response.json();
      setManifest({
        name: data.name || manifest.name,
        short_name: data.short_name || manifest.short_name,
        description: data.description || manifest.description,
        theme_color: data.theme_color || manifest.theme_color,
        background_color: data.background_color || manifest.background_color
      });
    } catch (error) {
      console.error('Error loading manifest:', error);
      // Keep default values if loading fails
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Speichere die Manifest-Daten in den Settings
      await api.updatePWASettings(manifest);
      
      toast.success("PWA-Einstellungen gespeichert!", {
        description: "Die Änderungen werden beim nächsten App-Start wirksam."
      });
      
      setEditing(false);
    } catch (error: any) {
      console.error('Error saving PWA settings:', error);
      toast.error(error.message || "Fehler beim Speichern");
    }
  };

  const handleCancel = () => {
    setEditing(false);
    loadManifest();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="flex items-center gap-2 mb-2">
              <Smartphone className="h-5 w-5 text-blue-600" />
              PWA Einstellungen (Progressive Web App)
            </h3>
            <p className="text-sm text-muted-foreground">
              Passen Sie an, wie Ihre App auf Smartphones und Tablets angezeigt wird
            </p>
          </div>
          {!editing && (
            <Button onClick={() => setEditing(true)} variant="outline" size="sm">
              <Edit2 className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-400">
              <p className="font-medium mb-1">Was ist eine PWA?</p>
              <p>
                Eine Progressive Web App (PWA) kann wie eine native App auf dem Startbildschirm 
                installiert werden. Diese Einstellungen bestimmen, wie die App dort aussieht und heißt.
              </p>
            </div>
          </div>
        </div>

        {/* App Name Section */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="app-name">App-Name (vollständig)</Label>
              <Input
                id="app-name"
                value={manifest.name}
                onChange={(e) => setManifest({ ...manifest, name: e.target.value })}
                disabled={!editing}
                className="mt-1.5"
                placeholder="Hortzettel App - Grundschule Auma"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Wird im App-Store und bei der Installation angezeigt
              </p>
            </div>

            <div>
              <Label htmlFor="app-short-name">App-Name (kurz)</Label>
              <Input
                id="app-short-name"
                value={manifest.short_name}
                onChange={(e) => setManifest({ ...manifest, short_name: e.target.value })}
                disabled={!editing}
                className="mt-1.5"
                placeholder="Hortzettel"
                maxLength={12}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Wird unter dem App-Icon angezeigt (max. 12 Zeichen)
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="app-description">App-Beschreibung</Label>
            <Textarea
              id="app-description"
              value={manifest.description}
              onChange={(e) => setManifest({ ...manifest, description: e.target.value })}
              disabled={!editing}
              className="mt-1.5"
              placeholder="Digitale Hortzettel-Verwaltung für die Grundschule Auma"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Beschreibung der App für Suchmaschinen und App-Stores
            </p>
          </div>

          {/* Color Section */}
          <div className="border-t pt-4">
            <h4 className="flex items-center gap-2 mb-4">
              <Palette className="h-4 w-4 text-purple-600" />
              Farben
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="theme-color" className="flex items-center gap-2">
                  Theme-Farbe
                  <span 
                    className="w-6 h-6 rounded border-2 border-gray-300" 
                    style={{ backgroundColor: manifest.theme_color }}
                  />
                </Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    id="theme-color"
                    type="color"
                    value={manifest.theme_color}
                    onChange={(e) => setManifest({ ...manifest, theme_color: e.target.value })}
                    disabled={!editing}
                    className="w-20 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={manifest.theme_color}
                    onChange={(e) => setManifest({ ...manifest, theme_color: e.target.value })}
                    disabled={!editing}
                    className="flex-1"
                    placeholder="#3B82F6"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Farbe der Browser-Leiste und Statusbar
                </p>
              </div>

              <div>
                <Label htmlFor="background-color" className="flex items-center gap-2">
                  Hintergrund-Farbe
                  <span 
                    className="w-6 h-6 rounded border-2 border-gray-300" 
                    style={{ backgroundColor: manifest.background_color }}
                  />
                </Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    id="background-color"
                    type="color"
                    value={manifest.background_color}
                    onChange={(e) => setManifest({ ...manifest, background_color: e.target.value })}
                    disabled={!editing}
                    className="w-20 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={manifest.background_color}
                    onChange={(e) => setManifest({ ...manifest, background_color: e.target.value })}
                    disabled={!editing}
                    className="flex-1"
                    placeholder="#3B82F6"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Hintergrundfarbe beim App-Start (Splash Screen)
                </p>
              </div>
            </div>

            {/* Color Presets */}
            {editing && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Farbvorschläge:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: "Blau", color: "#3B82F6" },
                    { name: "Lila", color: "#A855F7" },
                    { name: "Grün", color: "#10B981" },
                    { name: "Orange", color: "#F97316" },
                    { name: "Rosa", color: "#EC4899" },
                    { name: "Türkis", color: "#14B8A6" }
                  ].map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      onClick={() => setManifest({ 
                        ...manifest, 
                        theme_color: preset.color,
                        background_color: preset.color 
                      })}
                      className="gap-2"
                    >
                      <span 
                        className="w-4 h-4 rounded border" 
                        style={{ backgroundColor: preset.color }}
                      />
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* App Icon Info */}
          <div className="border-t pt-4">
            <h4 className="flex items-center gap-2 mb-4">
              <ImageIcon className="h-4 w-4 text-purple-600" />
              App-Icon
            </h4>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ImageIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-purple-700 dark:text-purple-400">
                  <p className="font-medium mb-2">App-Icon ändern:</p>
                  <p className="mb-2">
                    Das App-Icon kann über den <strong>"Design"</strong>-Tab im <strong>"Logo-Einstellungen"</strong>-Bereich 
                    angepasst werden.
                  </p>
                  <p className="text-xs">
                    Das dort hochgeladene Logo wird automatisch als App-Icon verwendet.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {editing && (
            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={handleSave} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Speichern
              </Button>
              <Button variant="outline" onClick={handleCancel} className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Abbrechen
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Preview Section */}
      <Card className="p-6">
        <h4 className="flex items-center gap-2 mb-4">
          <Smartphone className="h-4 w-4 text-blue-600" />
          Vorschau
        </h4>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Mobile Preview */}
          <div>
            <p className="text-sm font-medium mb-3">Smartphone-Ansicht:</p>
            <div className="relative mx-auto" style={{ width: '200px' }}>
              {/* Phone Frame */}
              <div className="bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
                {/* Screen */}
                <div 
                  className="rounded-[2rem] overflow-hidden"
                  style={{ backgroundColor: manifest.background_color }}
                >
                  {/* Status Bar */}
                  <div 
                    className="h-8 px-4 flex items-center justify-between text-white text-xs"
                    style={{ backgroundColor: manifest.theme_color }}
                  >
                    <span>9:41</span>
                    <div className="flex gap-1">
                      <span>📶</span>
                      <span>🔋</span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="bg-white h-64 p-4">
                    <div className="text-center pt-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-2 flex items-center justify-center text-white text-2xl">
                        📋
                      </div>
                      <p className="text-xs font-medium mt-2 truncate px-2">
                        {manifest.short_name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Installation Preview */}
          <div>
            <p className="text-sm font-medium mb-3">Installation-Dialog:</p>
            <div className="bg-white dark:bg-slate-800 border rounded-lg p-4 shadow-lg">
              <div className="flex gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl flex-shrink-0">
                  📋
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{manifest.name}</p>
                  <p className="text-xs text-muted-foreground">
                    https://ihre-domain.de
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {manifest.description}
              </p>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" style={{ backgroundColor: manifest.theme_color }}>
                  Installieren
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  Abbrechen
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Help Section */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <RefreshCw className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
              Wann werden Änderungen wirksam?
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• <strong>Neue Installationen:</strong> Sofort beim nächsten Installieren der App</li>
              <li>• <strong>Bestehende Installationen:</strong> Nach dem Löschen und Neuinstallieren der App</li>
              <li>• <strong>Browser:</strong> Theme-Farbe wird sofort aktualisiert</li>
            </ul>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-3">
              💡 Tipp: Nutzer können die App vom Startbildschirm löschen und über den Browser neu installieren, 
              um die aktualisierten Einstellungen zu erhalten.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
