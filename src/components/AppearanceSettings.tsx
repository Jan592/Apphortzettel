import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ArrowLeft, Palette, CheckCircle2, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { toast } from "sonner@2.0.3";

interface AppearanceSettingsProps {
  firstName: string;
  lastName: string;
  onBack: () => void;
}

export default function AppearanceSettings({
  firstName,
  lastName,
  onBack
}: AppearanceSettingsProps) {
  const [basicInfoTheme, setBasicInfoTheme] = useState<string>('sky');
  const [weekPlanTheme, setWeekPlanTheme] = useState<string>('lavender');
  const [backgroundTheme, setBackgroundTheme] = useState<string>('sky');
  const [customBasicColor, setCustomBasicColor] = useState<string>('#0EA5E9');
  const [customWeekColor, setCustomWeekColor] = useState<string>('#A78BFA');
  const [customBackgroundColor, setCustomBackgroundColor] = useState<string>('#0EA5E9');

  const colorThemes = [
    { 
      name: "Himmelblau", 
      value: "sky", 
      color: "#0EA5E9",
      gradient: "from-sky-50/40 via-cyan-50/30 to-sky-50/40",
      description: "Frisch und luftig"
    },
    { 
      name: "Mint", 
      value: "mint", 
      color: "#14B8A6",
      gradient: "from-teal-50/40 via-cyan-50/30 to-emerald-50/40",
      description: "Erfrischend und modern"
    },
    { 
      name: "Lavendel", 
      value: "lavender", 
      color: "#A78BFA",
      gradient: "from-violet-50/40 via-purple-50/30 to-indigo-50/40",
      description: "Sanft und beruhigend"
    },
    { 
      name: "Pfirsich", 
      value: "peach", 
      color: "#FB923C",
      gradient: "from-orange-50/40 via-amber-50/30 to-rose-50/40",
      description: "Warm und freundlich"
    },
    { 
      name: "Rosa", 
      value: "rose", 
      color: "#F472B6",
      gradient: "from-pink-50/40 via-rose-50/30 to-fuchsia-50/40",
      description: "Verspielt und fröhlich"
    },
    { 
      name: "Sand", 
      value: "sand", 
      color: "#A8A29E",
      gradient: "from-stone-50/40 via-neutral-50/30 to-amber-50/40",
      description: "Natürlich und warm"
    },
  ];

  useEffect(() => {
    loadThemePreferences();
  }, []);

  const loadThemePreferences = () => {
    try {
      const savedBasicTheme = localStorage.getItem(`hortzettel_theme_basic_${firstName}_${lastName}`);
      const savedWeekTheme = localStorage.getItem(`hortzettel_theme_week_${firstName}_${lastName}`);
      const savedBackgroundTheme = localStorage.getItem(`hortzettel_theme_background_${firstName}_${lastName}`);
      const savedCustomBasic = localStorage.getItem(`hortzettel_custom_basic_${firstName}_${lastName}`);
      const savedCustomWeek = localStorage.getItem(`hortzettel_custom_week_${firstName}_${lastName}`);
      const savedCustomBackground = localStorage.getItem(`hortzettel_custom_background_${firstName}_${lastName}`);
      
      if (savedBasicTheme) setBasicInfoTheme(savedBasicTheme);
      if (savedWeekTheme) setWeekPlanTheme(savedWeekTheme);
      if (savedBackgroundTheme) setBackgroundTheme(savedBackgroundTheme);
      if (savedCustomBasic) setCustomBasicColor(savedCustomBasic);
      if (savedCustomWeek) setCustomWeekColor(savedCustomWeek);
      if (savedCustomBackground) setCustomBackgroundColor(savedCustomBackground);
    } catch (error) {
      console.error('Fehler beim Laden der Theme-Präferenzen:', error);
    }
  };

  const saveThemePreference = (section: 'basic' | 'week' | 'background', theme: string) => {
    try {
      const key = `hortzettel_theme_${section}_${firstName}_${lastName}`;
      localStorage.setItem(key, theme);
      
      if (section === 'basic') {
        setBasicInfoTheme(theme);
      } else if (section === 'week') {
        setWeekPlanTheme(theme);
      } else {
        setBackgroundTheme(theme);
      }
      
      const labels = {
        basic: 'Grundinfo',
        week: 'Wochenplan',
        background: 'Hintergrund'
      };
      
      const themeName = colorThemes.find(t => t.value === theme)?.name || theme;
      toast.success(`${labels[section]}-Farbe geändert zu ${themeName}!`, {
        duration: 2000,
        icon: '🎨'
      });
    } catch (error) {
      console.error('Fehler beim Speichern der Theme-Präferenz:', error);
      toast.error('Fehler beim Speichern');
    }
  };

  const saveCustomColor = (section: 'basic' | 'week' | 'background', color: string) => {
    try {
      const colorKey = `hortzettel_custom_${section}_${firstName}_${lastName}`;
      const themeKey = `hortzettel_theme_${section}_${firstName}_${lastName}`;
      
      localStorage.setItem(colorKey, color);
      localStorage.setItem(themeKey, 'custom');
      
      if (section === 'basic') {
        setCustomBasicColor(color);
        setBasicInfoTheme('custom');
      } else if (section === 'week') {
        setCustomWeekColor(color);
        setWeekPlanTheme('custom');
      } else {
        setCustomBackgroundColor(color);
        setBackgroundTheme('custom');
      }
      
      const labels = {
        basic: 'Grundinfo',
        week: 'Wochenplan',
        background: 'Hintergrund'
      };
      
      toast.success(`${labels[section]}-Farbe angepasst!`, {
        duration: 2000,
        icon: '🎨'
      });
    } catch (error) {
      console.error('Fehler beim Speichern der benutzerdefinierten Farbe:', error);
      toast.error('Fehler beim Speichern');
    }
  };

  const resetToDefaults = () => {
    saveThemePreference('basic', 'sky');
    saveThemePreference('week', 'lavender');
    saveThemePreference('background', 'sky');
    toast.success('Farben auf Standard zurückgesetzt!', {
      duration: 2000,
      icon: '♻️'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Zurück
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Palette className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl">Farb-Einstellungen</h1>
                <p className="text-sm text-muted-foreground">
                  Gestalte dein Hortzettel-Formular individuell
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Info Card */}
        <Card className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base mb-1">Personalisiere deine Hortzettel</h2>
              <p className="text-xs text-muted-foreground mb-3">
                Wähle für jeden Bereich des Hortzettel-Formulars deine Lieblingsfarbe.
              </p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  👤 Nur für dich sichtbar
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  💾 Automatisch gespeichert
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Color Settings Tabs */}
        <Card className="px-[21px] py-[11px]">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="basic" className="gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                Grundinfo
              </TabsTrigger>
              <TabsTrigger value="week" className="gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                Wochenplan
              </TabsTrigger>
              <TabsTrigger value="background" className="gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"></div>
                Hintergrund
              </TabsTrigger>
            </TabsList>

            {/* Basic Info Theme */}
            <TabsContent value="basic" className="space-y-4">
              <div className="mb-4">
                <h3 className="text-lg mb-2">Grundinformationen-Bereich</h3>
                <p className="text-sm text-muted-foreground">
                  Diese Farbe wird für den Bereich mit Name, Klasse und "Alleine nach Hause"-Frage verwendet.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                {colorThemes.map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => saveThemePreference('basic', theme.value)}
                    className="group flex flex-col items-center gap-2"
                  >
                    <div 
                      className={`relative w-16 h-16 rounded-full transition-all hover:scale-110 ${
                        basicInfoTheme === theme.value 
                          ? "ring-4 ring-offset-2 scale-110 shadow-lg" 
                          : "hover:ring-2 hover:ring-offset-2 shadow"
                      }`}
                      style={{ 
                        backgroundColor: theme.color,
                        ringColor: basicInfoTheme === theme.value ? theme.color : 'transparent'
                      }}
                    >
                      {basicInfoTheme === theme.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4" style={{ color: theme.color }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <span className={`text-sm ${basicInfoTheme === theme.value ? 'font-semibold' : 'text-muted-foreground'}`}>
                      {theme.name}
                    </span>
                  </button>
                ))}
              </div>
              
              {/* Custom Color Picker */}
              <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="text-sm mb-3">Eigene Farbe wählen</h4>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customBasicColor}
                    onChange={(e) => setCustomBasicColor(e.target.value)}
                    className="w-16 h-16 rounded-lg cursor-pointer border-2 border-slate-300 dark:border-slate-600"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2">
                      Wähle eine beliebige Farbe für den Grundinformationen-Bereich
                    </p>
                    <Button
                      onClick={() => saveCustomColor('basic', customBasicColor)}
                      variant={basicInfoTheme === 'custom' ? 'default' : 'outline'}
                      size="sm"
                      className="gap-2"
                    >
                      <Palette className="h-4 w-4" />
                      Benutzerdefinierte Farbe anwenden
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Week Plan Theme */}
            <TabsContent value="week" className="space-y-4">
              <div className="mb-4">
                <h3 className="text-lg mb-2">Wochenplan-Bereich</h3>
                <p className="text-sm text-muted-foreground">
                  Diese Farbe wird für den Bereich mit den Wochentagen (Montag bis Freitag) verwendet.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                {colorThemes.map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => saveThemePreference('week', theme.value)}
                    className="group flex flex-col items-center gap-2"
                  >
                    <div 
                      className={`relative w-16 h-16 rounded-full transition-all hover:scale-110 ${
                        weekPlanTheme === theme.value 
                          ? "ring-4 ring-offset-2 scale-110 shadow-lg" 
                          : "hover:ring-2 hover:ring-offset-2 shadow"
                      }`}
                      style={{ 
                        backgroundColor: theme.color,
                        ringColor: weekPlanTheme === theme.value ? theme.color : 'transparent'
                      }}
                    >
                      {weekPlanTheme === theme.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4" style={{ color: theme.color }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <span className={`text-sm ${weekPlanTheme === theme.value ? 'font-semibold' : 'text-muted-foreground'}`}>
                      {theme.name}
                    </span>
                  </button>
                ))}
              </div>
              
              {/* Custom Color Picker */}
              <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="text-sm mb-3">Eigene Farbe wählen</h4>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customWeekColor}
                    onChange={(e) => setCustomWeekColor(e.target.value)}
                    className="w-16 h-16 rounded-lg cursor-pointer border-2 border-slate-300 dark:border-slate-600"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2">
                      Wähle eine beliebige Farbe für den Wochenplan-Bereich
                    </p>
                    <Button
                      onClick={() => saveCustomColor('week', customWeekColor)}
                      variant={weekPlanTheme === 'custom' ? 'default' : 'outline'}
                      size="sm"
                      className="gap-2"
                    >
                      <Palette className="h-4 w-4" />
                      Benutzerdefinierte Farbe anwenden
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Background Theme */}
            <TabsContent value="background" className="space-y-4">
              <div className="mb-4">
                <h3 className="text-lg mb-2">Hintergrund-Farbe</h3>
                <p className="text-sm text-muted-foreground">
                  Diese Farbe wird als Hintergrund-Farbverlauf für das gesamte Formular verwendet.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                {colorThemes.map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => saveThemePreference('background', theme.value)}
                    className="group flex flex-col items-center gap-2"
                  >
                    <div 
                      className={`relative w-16 h-16 rounded-full overflow-hidden transition-all hover:scale-110 ${
                        backgroundTheme === theme.value 
                          ? "ring-4 ring-offset-2 scale-110 shadow-lg" 
                          : "hover:ring-2 hover:ring-offset-2 shadow"
                      }`}
                      style={{ 
                        ringColor: backgroundTheme === theme.value ? theme.color : 'transparent'
                      }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`} />
                      {backgroundTheme === theme.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center border-2" style={{ borderColor: theme.color }}>
                            <CheckCircle2 className="h-4 w-4" style={{ color: theme.color }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <span className={`text-sm ${backgroundTheme === theme.value ? 'font-semibold' : 'text-muted-foreground'}`}>
                      {theme.name}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => saveCustomColor('background', customBackgroundColor)}
                  className="group flex flex-col items-center gap-2"
                >
                  <div 
                    className={`relative w-16 h-16 rounded-full overflow-hidden transition-all hover:scale-110 ${
                      backgroundTheme === 'custom' 
                        ? "ring-4 ring-offset-2 scale-110 shadow-lg" 
                        : "hover:ring-2 hover:ring-offset-2 shadow"
                    }`}
                    style={{ 
                      ringColor: backgroundTheme === 'custom' ? customBackgroundColor : 'transparent'
                    }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${backgroundTheme === 'custom' ? 'from-sky-50/40 via-cyan-50/30 to-sky-50/40' : 'from-sky-50/40 via-cyan-50/30 to-sky-50/40'}`} />
                    {backgroundTheme === 'custom' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center border-2" style={{ borderColor: customBackgroundColor }}>
                          <CheckCircle2 className="h-4 w-4" style={{ color: customBackgroundColor }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <span className={`text-sm ${backgroundTheme === 'custom' ? 'font-semibold' : 'text-muted-foreground'}`}>
                    Benutzerdefiniert
                  </span>
                </button>
              </div>
              
              {/* Custom Color Picker */}
              <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="text-sm mb-3">Eigene Farbe wählen</h4>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customBackgroundColor}
                    onChange={(e) => setCustomBackgroundColor(e.target.value)}
                    className="w-16 h-16 rounded-lg cursor-pointer border-2 border-slate-300 dark:border-slate-600"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2">
                      Wähle eine beliebige Farbe für den Hintergrund
                    </p>
                    <Button
                      onClick={() => saveCustomColor('background', customBackgroundColor)}
                      variant={backgroundTheme === 'custom' ? 'default' : 'outline'}
                      size="sm"
                      className="gap-2"
                    >
                      <Palette className="h-4 w-4" />
                      Benutzerdefinierte Farbe anwenden
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Reset Button */}
        <div className="mt-6 flex justify-center">
          <Button 
            onClick={resetToDefaults}
            variant="outline"
            className="gap-2 px-[14px] py-[3px]"
          >
            ♻️ Auf Standard zurücksetzen
          </Button>
        </div>

        {/* Preview Info */}
        <Card className="mt-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 py-[10px] p-[10px]">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white">💡</span>
            </div>
            <div className="text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-400 mb-1">
                Vorschau der Änderungen
              </p>
              <p className="text-amber-800 dark:text-amber-500">
                Um deine gewählten Farben zu sehen, erstelle einen neuen Hortzettel oder bearbeite einen bestehenden.
                Die Farben werden automatisch angewendet!
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}