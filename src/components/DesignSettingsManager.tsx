import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';
import { api } from '../utils/api';
import { Palette, Layout, Type, Boxes, Sparkles, ImageIcon, Calendar } from 'lucide-react';
import { Slider } from './ui/slider';
import LogoSettingsManager from './LogoSettingsManager';

interface DesignSettings {
  // Layout
  loginCardMaxWidth: number;
  loginCardPadding: number;
  borderRadius: number;
  
  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  cardBackground: string;
  textColor: string;
  
  // Info Card Colors
  infoCardBackground: string;
  emergencyCardBackground: string;
  warningCardBackground: string;
  
  // Day Tab Colors
  mondayColor: string;
  tuesdayColor: string;
  wednesdayColor: string;
  thursdayColor: string;
  fridayColor: string;
  
  // Section Color Themes
  basicInfoTheme: string;
  weekPlanTheme: string;
  
  // Typography
  headingSize: number;
  bodySize: number;
  
  // Spacing
  componentSpacing: number;
  sectionSpacing: number;
  
  // Effects
  shadowIntensity: number;
  buttonHoverScale: number;
}

const defaultSettings: DesignSettings = {
  loginCardMaxWidth: 400,
  loginCardPadding: 24,
  borderRadius: 8,
  primaryColor: '#3B82F6',
  secondaryColor: '#8B5CF6',
  accentColor: '#F59E0B',
  backgroundColor: '#F3F4F6',
  cardBackground: '#FFFFFF',
  textColor: '#1F2937',
  infoCardBackground: '#EFF6FF',
  emergencyCardBackground: '#FEF2F2',
  warningCardBackground: '#FFFBEB',
  mondayColor: '#3B82F6',
  tuesdayColor: '#10B981',
  wednesdayColor: '#8B5CF6',
  thursdayColor: '#F97316',
  fridayColor: '#EC4899',
  basicInfoTheme: 'blue',
  weekPlanTheme: 'purple',
  headingSize: 24,
  bodySize: 16,
  componentSpacing: 16,
  sectionSpacing: 32,
  shadowIntensity: 10,
  buttonHoverScale: 1.05,
};

export function DesignSettingsManager() {
  const [settings, setSettings] = useState<DesignSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.getSettings();
      if (response.settings?.designSettings) {
        setSettings({ ...defaultSettings, ...response.settings.designSettings });
      }
    } catch (error) {
      console.error('Fehler beim Laden der Design-Einstellungen:', error);
      toast.error('Design-Einstellungen konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await api.updateSettings({ designSettings: settings });
      
      // Apply settings to CSS variables
      applyDesignSettings(settings);
      
      toast.success('Design-Einstellungen gespeichert!');
      
      // Notify other components with the new settings
      window.dispatchEvent(new CustomEvent('settingsUpdated', {
        detail: { settings: result.settings, designSettings: settings }
      }));
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      toast.error('Fehler beim Speichern der Design-Einstellungen');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    applyDesignSettings(defaultSettings);
    toast.info('Design-Einstellungen zurückgesetzt');
  };

  const updateSetting = (key: keyof DesignSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    // Live preview
    applyDesignSettings(newSettings);
  };

  if (loading) {
    return <div className="text-center p-8">Lade Design-Einstellungen...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl mb-2">Design-Einstellungen</h2>
          <p className="text-muted-foreground">
            Passen Sie das Aussehen der App individuell an. Änderungen werden live angezeigt.
          </p>
        </div>
        
        {/* Visual Theme Overview */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full shadow-lg">
          <Calendar className="w-5 h-5" />
          <span className="font-medium whitespace-nowrap">Bereichs-Themes</span>
          <div className="flex gap-2 ml-2">
            {[
              { name: "Grundinfo", theme: settings.basicInfoTheme },
              { name: "Wochenplan", theme: settings.weekPlanTheme }
            ].map((section, idx) => {
              const themeColor = 
                section.theme === 'blue' ? '#3B82F6' :
                section.theme === 'green' ? '#10B981' :
                section.theme === 'purple' ? '#8B5CF6' :
                section.theme === 'orange' ? '#F97316' :
                section.theme === 'pink' ? '#EC4899' :
                '#64748B';
              
              return (
                <div key={idx} className="relative group">
                  <div 
                    className="w-9 h-9 rounded-full border-2 border-white/80 shadow-md transition-transform hover:scale-110"
                    style={{ backgroundColor: themeColor }}
                    title={`${section.name}: ${section.theme}`}
                  />
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/75 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {section.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Tabs defaultValue="logo" className="w-full">
        {/* Desktop: Grid Layout */}
        <TabsList className="hidden lg:grid w-full grid-cols-6">
          <TabsTrigger value="logo" className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            <span>Logo</span>
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Layout className="w-4 h-4" />
            <span>Layout</span>
          </TabsTrigger>
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span>Farben</span>
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            <span>Typografie</span>
          </TabsTrigger>
          <TabsTrigger value="spacing" className="flex items-center gap-2">
            <Boxes className="w-4 h-4" />
            <span>Abstände</span>
          </TabsTrigger>
          <TabsTrigger value="effects" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>Effekte</span>
          </TabsTrigger>
        </TabsList>

        {/* Mobile: Scrollbare Reihe */}
        <div className="lg:hidden overflow-x-auto -mx-4 px-4">
          <TabsList className="inline-flex bg-transparent h-auto p-0 gap-1 min-w-full">
            <TabsTrigger 
              value="logo" 
              className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white whitespace-nowrap"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="font-medium">Logo</span>
            </TabsTrigger>
            <TabsTrigger 
              value="layout" 
              className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white whitespace-nowrap"
            >
              <Layout className="w-3.5 h-3.5" />
              <span className="font-medium">Layout</span>
            </TabsTrigger>
            <TabsTrigger 
              value="colors" 
              className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white whitespace-nowrap"
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="font-medium">Farben</span>
            </TabsTrigger>
            <TabsTrigger 
              value="typography" 
              className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white whitespace-nowrap"
            >
              <Type className="w-3.5 h-3.5" />
              <span className="font-medium">Typografie</span>
            </TabsTrigger>
            <TabsTrigger 
              value="spacing" 
              className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white whitespace-nowrap"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span className="font-medium">Abstände</span>
            </TabsTrigger>
            <TabsTrigger 
              value="effects" 
              className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-medium">Effekte</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Logo Tab */}
        <TabsContent value="logo" className="space-y-4">
          <LogoSettingsManager />
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Layout-Einstellungen</CardTitle>
              <CardDescription>
                Größe und Form der Anmeldefenster und Karten
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Anmeldefenster Breite: {settings.loginCardMaxWidth}px</Label>
                <Slider
                  value={[settings.loginCardMaxWidth]}
                  onValueChange={(value) => updateSetting('loginCardMaxWidth', value[0])}
                  min={300}
                  max={800}
                  step={10}
                />
                <p className="text-sm text-muted-foreground">
                  Maximale Breite des Anmelde- und Registrierungsfensters
                </p>
              </div>

              <div className="space-y-2">
                <Label>Karten-Innenabstand: {settings.loginCardPadding}px</Label>
                <Slider
                  value={[settings.loginCardPadding]}
                  onValueChange={(value) => updateSetting('loginCardPadding', value[0])}
                  min={12}
                  max={48}
                  step={4}
                />
                <p className="text-sm text-muted-foreground">
                  Abstand zwischen Kartenrand und Inhalt
                </p>
              </div>

              <div className="space-y-2">
                <Label>Ecken-Rundung: {settings.borderRadius}px</Label>
                <Slider
                  value={[settings.borderRadius]}
                  onValueChange={(value) => updateSetting('borderRadius', value[0])}
                  min={0}
                  max={24}
                  step={2}
                />
                <p className="text-sm text-muted-foreground">
                  Rundung der Ecken von Karten und Buttons
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Section Themes */}
          <Card>
            <CardHeader>
              <CardTitle>Bereichs-Farbthemen</CardTitle>
              <CardDescription>
                Wähle für jeden Bereich im Hortzettel-Formular ein eigenes Farbthema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Grundinformationen Theme */}
              <div className="space-y-3">
                <Label>Grundinformationen-Karte</Label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { name: "Blau", value: "blue", gradient: "from-slate-50 via-blue-50 to-indigo-50", color: "#3B82F6" },
                    { name: "Grün", value: "green", gradient: "from-emerald-50 via-green-50 to-teal-50", color: "#10B981" },
                    { name: "Violett", value: "purple", gradient: "from-purple-50 via-pink-50 to-rose-50", color: "#8B5CF6" },
                    { name: "Orange", value: "orange", gradient: "from-orange-50 via-amber-50 to-yellow-50", color: "#F97316" },
                    { name: "Rosa", value: "pink", gradient: "from-pink-50 via-rose-50 to-red-50", color: "#EC4899" },
                    { name: "Grau", value: "gray", gradient: "from-slate-50 via-gray-50 to-zinc-50", color: "#64748B" },
                  ].map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => updateSetting('basicInfoTheme', theme.value)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        settings.basicInfoTheme === theme.value
                          ? 'border-gray-900 dark:border-white scale-110 shadow-lg'
                          : 'border-gray-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: theme.color }}
                      title={theme.name}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Aktuell: {settings.basicInfoTheme === 'blue' ? 'Blau' : 
                           settings.basicInfoTheme === 'green' ? 'Grün' : 
                           settings.basicInfoTheme === 'purple' ? 'Violett' : 
                           settings.basicInfoTheme === 'orange' ? 'Orange' : 
                           settings.basicInfoTheme === 'pink' ? 'Rosa' : 'Grau'}
                </p>
                {/* Preview */}
                <div className={`mt-3 p-4 rounded-xl bg-gradient-to-br ${
                  settings.basicInfoTheme === 'blue' ? 'from-slate-50 via-blue-50 to-indigo-50' :
                  settings.basicInfoTheme === 'green' ? 'from-emerald-50 via-green-50 to-teal-50' :
                  settings.basicInfoTheme === 'purple' ? 'from-purple-50 via-pink-50 to-rose-50' :
                  settings.basicInfoTheme === 'orange' ? 'from-orange-50 via-amber-50 to-yellow-50' :
                  settings.basicInfoTheme === 'pink' ? 'from-pink-50 via-rose-50 to-red-50' :
                  'from-slate-50 via-gray-50 to-zinc-50'
                }`}>
                  <p className="font-medium">Vorschau: Grundinformationen</p>
                  <p className="text-sm text-muted-foreground mt-1">So wird die Karte aussehen</p>
                </div>
              </div>

              {/* Wochenplan Theme */}
              <div className="space-y-3">
                <Label>Wochenplan-Karte</Label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { name: "Blau", value: "blue", gradient: "from-slate-50 via-blue-50 to-indigo-50", color: "#3B82F6" },
                    { name: "Grün", value: "green", gradient: "from-emerald-50 via-green-50 to-teal-50", color: "#10B981" },
                    { name: "Violett", value: "purple", gradient: "from-purple-50 via-pink-50 to-rose-50", color: "#8B5CF6" },
                    { name: "Orange", value: "orange", gradient: "from-orange-50 via-amber-50 to-yellow-50", color: "#F97316" },
                    { name: "Rosa", value: "pink", gradient: "from-pink-50 via-rose-50 to-red-50", color: "#EC4899" },
                    { name: "Grau", value: "gray", gradient: "from-slate-50 via-gray-50 to-zinc-50", color: "#64748B" },
                  ].map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => updateSetting('weekPlanTheme', theme.value)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        settings.weekPlanTheme === theme.value
                          ? 'border-gray-900 dark:border-white scale-110 shadow-lg'
                          : 'border-gray-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: theme.color }}
                      title={theme.name}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Aktuell: {settings.weekPlanTheme === 'blue' ? 'Blau' : 
                           settings.weekPlanTheme === 'green' ? 'Grün' : 
                           settings.weekPlanTheme === 'purple' ? 'Violett' : 
                           settings.weekPlanTheme === 'orange' ? 'Orange' : 
                           settings.weekPlanTheme === 'pink' ? 'Rosa' : 'Grau'}
                </p>
                {/* Preview */}
                <div className={`mt-3 p-4 rounded-xl bg-gradient-to-br ${
                  settings.weekPlanTheme === 'blue' ? 'from-slate-50 via-blue-50 to-indigo-50' :
                  settings.weekPlanTheme === 'green' ? 'from-emerald-50 via-green-50 to-teal-50' :
                  settings.weekPlanTheme === 'purple' ? 'from-purple-50 via-pink-50 to-rose-50' :
                  settings.weekPlanTheme === 'orange' ? 'from-orange-50 via-amber-50 to-yellow-50' :
                  settings.weekPlanTheme === 'pink' ? 'from-pink-50 via-rose-50 to-red-50' :
                  'from-slate-50 via-gray-50 to-zinc-50'
                }`}>
                  <p className="font-medium">Vorschau: Wochenplan</p>
                  <p className="text-sm text-muted-foreground mt-1">So wird die Karte aussehen</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Farbschema</CardTitle>
              <CardDescription>
                Haupt- und Akzentfarben der Anwendung
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primärfarbe</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => updateSetting('primaryColor', e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.primaryColor}
                      onChange={(e) => updateSetting('primaryColor', e.target.value)}
                      placeholder="#3B82F6"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">Hauptfarbe für Buttons und Links</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Sekundärfarbe</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={settings.secondaryColor}
                      onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.secondaryColor}
                      onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                      placeholder="#8B5CF6"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">Zweite Akzentfarbe</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accentColor">Akzentfarbe</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={settings.accentColor}
                      onChange={(e) => updateSetting('accentColor', e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.accentColor}
                      onChange={(e) => updateSetting('accentColor', e.target.value)}
                      placeholder="#F59E0B"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">Highlight-Farbe</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backgroundColor">Hintergrundfarbe</Label>
                  <div className="flex gap-2">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={settings.backgroundColor}
                      onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.backgroundColor}
                      onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                      placeholder="#F3F4F6"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">Farbe des Seitenhintergrunds</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardBackground">Karten-Hintergrund</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cardBackground"
                      type="color"
                      value={settings.cardBackground}
                      onChange={(e) => updateSetting('cardBackground', e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.cardBackground}
                      onChange={(e) => updateSetting('cardBackground', e.target.value)}
                      placeholder="#FFFFFF"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">Hintergrund von Karten und Panels</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="textColor">Textfarbe</Label>
                  <div className="flex gap-2">
                    <Input
                      id="textColor"
                      type="color"
                      value={settings.textColor}
                      onChange={(e) => updateSetting('textColor', e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.textColor}
                      onChange={(e) => updateSetting('textColor', e.target.value)}
                      placeholder="#1F2937"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">Farbe des Haupttextes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Info Card Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Informationskarten-Farben</CardTitle>
              <CardDescription>
                Hintergrundfarben für verschiedene Karten-Typen in Profilen und Dialogen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="infoCardBackground">Info-Karten (Blau)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="infoCardBackground"
                      type="color"
                      value={settings.infoCardBackground}
                      onChange={(e) => updateSetting('infoCardBackground', e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.infoCardBackground}
                      onChange={(e) => updateSetting('infoCardBackground', e.target.value)}
                      placeholder="#EFF6FF"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">Grundinformationen, allgemeine Infos</p>
                  <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: settings.infoCardBackground }}>
                    <p className="text-sm">Beispiel: Grundinformationen</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyCardBackground">Notfall-Karten (Rot)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="emergencyCardBackground"
                      type="color"
                      value={settings.emergencyCardBackground}
                      onChange={(e) => updateSetting('emergencyCardBackground', e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.emergencyCardBackground}
                      onChange={(e) => updateSetting('emergencyCardBackground', e.target.value)}
                      placeholder="#FEF2F2"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">Notfallkontakte, wichtige Hinweise</p>
                  <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: settings.emergencyCardBackground }}>
                    <p className="text-sm">Beispiel: Notfallkontakt</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warningCardBackground">Warnungs-Karten (Gelb)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="warningCardBackground"
                      type="color"
                      value={settings.warningCardBackground}
                      onChange={(e) => updateSetting('warningCardBackground', e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.warningCardBackground}
                      onChange={(e) => updateSetting('warningCardBackground', e.target.value)}
                      placeholder="#FFFBEB"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">Allergien, medizinische Hinweise</p>
                  <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: settings.warningCardBackground }}>
                    <p className="text-sm">Beispiel: Allergien & Medizin</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Day Tab Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Wochentags-Farben</CardTitle>
              <CardDescription>
                Farben für die Wochentags-Tabs im Hortzettel-Formular
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mondayColor">Montag</Label>
                  <div className="flex gap-2">
                    <Input
                      id="mondayColor"
                      type="color"
                      value={settings.mondayColor}
                      onChange={(e) => updateSetting('mondayColor', e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.mondayColor}
                      onChange={(e) => updateSetting('mondayColor', e.target.value)}
                      placeholder="#3B82F6"
                    />
                  </div>
                  <div className="mt-2 p-2 rounded-lg flex items-center gap-2" style={{ backgroundColor: `${settings.mondayColor}20` }}>
                    <Calendar className="h-4 w-4" style={{ color: settings.mondayColor }} />
                    <span className="text-sm" style={{ color: settings.mondayColor }}>Montag</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tuesdayColor">Dienstag</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tuesdayColor"
                      type="color"
                      value={settings.tuesdayColor}
                      onChange={(e) => updateSetting('tuesdayColor', e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.tuesdayColor}
                      onChange={(e) => updateSetting('tuesdayColor', e.target.value)}
                      placeholder="#10B981"
                    />
                  </div>
                  <div className="mt-2 p-2 rounded-lg flex items-center gap-2" style={{ backgroundColor: `${settings.tuesdayColor}20` }}>
                    <Calendar className="h-4 w-4" style={{ color: settings.tuesdayColor }} />
                    <span className="text-sm" style={{ color: settings.tuesdayColor }}>Dienstag</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wednesdayColor">Mittwoch</Label>
                  <div className="flex gap-2">
                    <Input
                      id="wednesdayColor"
                      type="color"
                      value={settings.wednesdayColor}
                      onChange={(e) => updateSetting('wednesdayColor', e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.wednesdayColor}
                      onChange={(e) => updateSetting('wednesdayColor', e.target.value)}
                      placeholder="#8B5CF6"
                    />
                  </div>
                  <div className="mt-2 p-2 rounded-lg flex items-center gap-2" style={{ backgroundColor: `${settings.wednesdayColor}20` }}>
                    <Calendar className="h-4 w-4" style={{ color: settings.wednesdayColor }} />
                    <span className="text-sm" style={{ color: settings.wednesdayColor }}>Mittwoch</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thursdayColor">Donnerstag</Label>
                  <div className="flex gap-2">
                    <Input
                      id="thursdayColor"
                      type="color"
                      value={settings.thursdayColor}
                      onChange={(e) => updateSetting('thursdayColor', e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.thursdayColor}
                      onChange={(e) => updateSetting('thursdayColor', e.target.value)}
                      placeholder="#F97316"
                    />
                  </div>
                  <div className="mt-2 p-2 rounded-lg flex items-center gap-2" style={{ backgroundColor: `${settings.thursdayColor}20` }}>
                    <Calendar className="h-4 w-4" style={{ color: settings.thursdayColor }} />
                    <span className="text-sm" style={{ color: settings.thursdayColor }}>Donnerstag</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fridayColor">Freitag</Label>
                  <div className="flex gap-2">
                    <Input
                      id="fridayColor"
                      type="color"
                      value={settings.fridayColor}
                      onChange={(e) => updateSetting('fridayColor', e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.fridayColor}
                      onChange={(e) => updateSetting('fridayColor', e.target.value)}
                      placeholder="#EC4899"
                    />
                  </div>
                  <div className="mt-2 p-2 rounded-lg flex items-center gap-2" style={{ backgroundColor: `${settings.fridayColor}20` }}>
                    <Calendar className="h-4 w-4" style={{ color: settings.fridayColor }} />
                    <span className="text-sm" style={{ color: settings.fridayColor }}>Freitag</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Typografie</CardTitle>
              <CardDescription>
                Schriftgrößen für Überschriften und Text
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Überschriften-Größe: {settings.headingSize}px</Label>
                <Slider
                  value={[settings.headingSize]}
                  onValueChange={(value) => updateSetting('headingSize', value[0])}
                  min={18}
                  max={40}
                  step={2}
                />
                <p className="text-sm text-muted-foreground">
                  Schriftgröße für Hauptüberschriften
                </p>
              </div>

              <div className="space-y-2">
                <Label>Text-Größe: {settings.bodySize}px</Label>
                <Slider
                  value={[settings.bodySize]}
                  onValueChange={(value) => updateSetting('bodySize', value[0])}
                  min={12}
                  max={20}
                  step={1}
                />
                <p className="text-sm text-muted-foreground">
                  Schriftgröße für normalen Text
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Spacing Tab */}
        <TabsContent value="spacing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Abstände</CardTitle>
              <CardDescription>
                Abstände zwischen Elementen und Bereichen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Element-Abstand: {settings.componentSpacing}px</Label>
                <Slider
                  value={[settings.componentSpacing]}
                  onValueChange={(value) => updateSetting('componentSpacing', value[0])}
                  min={8}
                  max={32}
                  step={4}
                />
                <p className="text-sm text-muted-foreground">
                  Abstand zwischen Formular-Feldern und kleinen Elementen
                </p>
              </div>

              <div className="space-y-2">
                <Label>Bereichs-Abstand: {settings.sectionSpacing}px</Label>
                <Slider
                  value={[settings.sectionSpacing]}
                  onValueChange={(value) => updateSetting('sectionSpacing', value[0])}
                  min={16}
                  max={64}
                  step={8}
                />
                <p className="text-sm text-muted-foreground">
                  Abstand zwischen großen Bereichen und Sektionen
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Effects Tab */}
        <TabsContent value="effects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visuelle Effekte</CardTitle>
              <CardDescription>
                Schatten und Animationen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Schatten-Intensität: {settings.shadowIntensity}%</Label>
                <Slider
                  value={[settings.shadowIntensity]}
                  onValueChange={(value) => updateSetting('shadowIntensity', value[0])}
                  min={0}
                  max={30}
                  step={5}
                />
                <p className="text-sm text-muted-foreground">
                  Stärke der Schatten unter Karten und Buttons
                </p>
              </div>

              <div className="space-y-2">
                <Label>Button Hover-Effekt: {((settings.buttonHoverScale - 1) * 100).toFixed(0)}%</Label>
                <Slider
                  value={[settings.buttonHoverScale]}
                  onValueChange={(value) => updateSetting('buttonHoverScale', value[0])}
                  min={1}
                  max={1.1}
                  step={0.01}
                />
                <p className="text-sm text-muted-foreground">
                  Vergrößerung von Buttons beim Darüberfahren
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? 'Speichere...' : 'Einstellungen speichern'}
        </Button>
        <Button onClick={handleReset} variant="outline">
          Zurücksetzen
        </Button>
      </div>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Vorschau</CardTitle>
          <CardDescription>
            So sehen Ihre Einstellungen aus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            style={{
              maxWidth: `${settings.loginCardMaxWidth}px`,
              padding: `${settings.loginCardPadding}px`,
              borderRadius: `${settings.borderRadius}px`,
              backgroundColor: settings.cardBackground,
              boxShadow: `0 4px ${settings.shadowIntensity * 2}px rgba(0,0,0,${settings.shadowIntensity / 100})`,
              margin: '0 auto',
            }}
          >
            <h3 
              style={{ 
                fontSize: `${settings.headingSize}px`,
                color: settings.textColor,
                marginBottom: `${settings.componentSpacing}px`,
              }}
            >
              Beispiel-Überschrift
            </h3>
            <p 
              style={{ 
                fontSize: `${settings.bodySize}px`,
                color: settings.textColor,
                marginBottom: `${settings.componentSpacing}px`,
              }}
            >
              Dies ist ein Beispieltext, um die Typografie und Abstände zu zeigen.
            </p>
            <div className="space-y-2" style={{ marginBottom: `${settings.componentSpacing}px` }}>
              <input
                type="text"
                placeholder="Beispiel-Eingabefeld"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: `${settings.borderRadius}px`,
                  border: '1px solid #e5e7eb',
                  fontSize: `${settings.bodySize}px`,
                }}
              />
            </div>
            <button
              style={{
                backgroundColor: settings.primaryColor,
                color: 'white',
                padding: '8px 16px',
                borderRadius: `${settings.borderRadius}px`,
                border: 'none',
                fontSize: `${settings.bodySize}px`,
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = `scale(${settings.buttonHoverScale})`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Beispiel-Button
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to apply design settings to CSS variables
export function applyDesignSettings(settings: DesignSettings) {
  const root = document.documentElement;
  
  // Apply CSS variables
  root.style.setProperty('--login-card-max-width', `${settings.loginCardMaxWidth}px`);
  root.style.setProperty('--login-card-padding', `${settings.loginCardPadding}px`);
  root.style.setProperty('--border-radius', `${settings.borderRadius}px`);
  
  root.style.setProperty('--primary-color', settings.primaryColor);
  root.style.setProperty('--secondary-color', settings.secondaryColor);
  root.style.setProperty('--accent-color', settings.accentColor);
  root.style.setProperty('--background-color', settings.backgroundColor);
  root.style.setProperty('--card-background', settings.cardBackground);
  root.style.setProperty('--text-color', settings.textColor);
  
  root.style.setProperty('--info-card-background', settings.infoCardBackground);
  root.style.setProperty('--emergency-card-background', settings.emergencyCardBackground);
  root.style.setProperty('--warning-card-background', settings.warningCardBackground);
  
  root.style.setProperty('--monday-color', settings.mondayColor);
  root.style.setProperty('--tuesday-color', settings.tuesdayColor);
  root.style.setProperty('--wednesday-color', settings.wednesdayColor);
  root.style.setProperty('--thursday-color', settings.thursdayColor);
  root.style.setProperty('--friday-color', settings.fridayColor);
  
  root.style.setProperty('--basic-info-theme', settings.basicInfoTheme);
  root.style.setProperty('--week-plan-theme', settings.weekPlanTheme);
  
  root.style.setProperty('--heading-size', `${settings.headingSize}px`);
  root.style.setProperty('--body-size', `${settings.bodySize}px`);
  
  root.style.setProperty('--component-spacing', `${settings.componentSpacing}px`);
  root.style.setProperty('--section-spacing', `${settings.sectionSpacing}px`);
  
  root.style.setProperty('--shadow-intensity', `${settings.shadowIntensity / 100}`);
  root.style.setProperty('--button-hover-scale', `${settings.buttonHoverScale}`);
}

// Initialize design settings on app load
export async function initializeDesignSettings() {
  try {
    const response = await api.getSettings();
    if (response.settings?.designSettings) {
      applyDesignSettings(response.settings.designSettings);
    }
  } catch (error) {
    console.error('Failed to load design settings:', error);
  }
}
