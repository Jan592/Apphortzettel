import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { 
  Eye, 
  Settings, 
  Palette, 
  Layout, 
  Type,
  Calendar,
  Clock,
  Home,
  Bus,
  Save,
  RefreshCw,
  ChevronDown,
  GripVertical,
  Plus,
  X,
  Copy
} from "lucide-react";
import { api } from "../utils/api";
import { toast } from "sonner@2.0.3";

interface DropdownOption {
  value: string;
  label: string;
  enabled: boolean;
}

interface FormDesignSettings {
  showClassSelection: boolean;
  showHomeAloneQuestion: boolean;
  homeAloneQuestionPosition: "top" | "bottom";
  dayCardStyle: "card" | "compact" | "minimal";
  showDayIcons: boolean;
  showDayColors: boolean;
  dropdownStyle: "default" | "compact" | "large";
  labelStyle: "bold" | "normal" | "uppercase";
  spacing: "tight" | "normal" | "relaxed";
  showOtherTextField: boolean;
  colorTheme: string;
  // New input type settings
  timeSelectionType: "dropdown" | "checkbox" | "radio";
  allowMultipleTimeSelection: boolean;
  homeAloneInputType: "radio" | "checkbox" | "dropdown";
}

export default function HortzettelDesignPreview() {
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [timeOptions, setTimeOptions] = useState<DropdownOption[]>([]);
  const [classes, setClasses] = useState<DropdownOption[]>([]);
  const [designSettings, setDesignSettings] = useState<FormDesignSettings>({
    showClassSelection: true,
    showHomeAloneQuestion: true,
    homeAloneQuestionPosition: "top",
    dayCardStyle: "card",
    showDayIcons: true,
    showDayColors: true,
    dropdownStyle: "default",
    labelStyle: "bold",
    spacing: "normal",
    showOtherTextField: true,
    colorTheme: "blue",
    timeSelectionType: "dropdown",
    allowMultipleTimeSelection: false,
    homeAloneInputType: "radio"
  });

  // Preview form state
  const [previewData, setPreviewData] = useState({
    class: "",
    homeAlone: "no",
    monday: "",
    tuesday: "",
    wednesday: "",
    thursday: "",
    friday: ""
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [dropdownsRes, settingsRes] = await Promise.all([
        api.getDropdownOptions(),
        api.getFormDesignSettings().catch(() => ({ settings: designSettings }))
      ]);

      if (dropdownsRes.options) {
        setTimeOptions(dropdownsRes.options.timeOptions || []);
        setClasses(dropdownsRes.options.classes || []);
      }

      if (settingsRes.settings) {
        setDesignSettings({ ...designSettings, ...settingsRes.settings });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast.error("Fehler beim Laden der Einstellungen");
    }
  };

  const saveSettings = async () => {
    try {
      await api.saveFormDesignSettings(designSettings);
      toast.success("Design-Einstellungen gespeichert!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Fehler beim Speichern");
    }
  };

  const resetToDefaults = () => {
    setDesignSettings({
      showClassSelection: true,
      showHomeAloneQuestion: true,
      homeAloneQuestionPosition: "top",
      dayCardStyle: "card",
      showDayIcons: true,
      showDayColors: true,
      dropdownStyle: "default",
      labelStyle: "bold",
      spacing: "normal",
      showOtherTextField: true,
      colorTheme: "blue",
      timeSelectionType: "dropdown",
      allowMultipleTimeSelection: false,
      homeAloneInputType: "radio"
    });
    toast.info("Auf Standardeinstellungen zurückgesetzt");
  };

  const getSpacingClass = () => {
    switch (designSettings.spacing) {
      case "tight": return "space-y-3";
      case "relaxed": return "space-y-6";
      default: return "space-y-4";
    }
  };

  const getLabelClass = () => {
    switch (designSettings.labelStyle) {
      case "bold": return "font-semibold";
      case "uppercase": return "uppercase tracking-wide";
      default: return "";
    }
  };

  const getDropdownClass = () => {
    switch (designSettings.dropdownStyle) {
      case "compact": return "h-8 text-sm";
      case "large": return "h-12";
      default: return "h-10";
    }
  };

  const dayColors = {
    "Montag": { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-600" },
    "Dienstag": { bg: "bg-green-50", border: "border-green-200", icon: "text-green-600" },
    "Mittwoch": { bg: "bg-purple-50", border: "border-purple-200", icon: "text-purple-600" },
    "Donnerstag": { bg: "bg-orange-50", border: "border-orange-200", icon: "text-orange-600" },
    "Freitag": { bg: "bg-pink-50", border: "border-pink-200", icon: "text-pink-600" }
  };

  const renderTimeInput = (day: string, key: keyof typeof previewData) => {
    // Dropdown Selection
    if (designSettings.timeSelectionType === "dropdown") {
      return (
        <Select value={previewData[key]} onValueChange={(v) => setPreviewData({ ...previewData, [key]: v })}>
          <SelectTrigger className={getDropdownClass()}>
            <SelectValue placeholder="Wählen..." />
          </SelectTrigger>
          <SelectContent>
            {timeOptions.filter(opt => opt.enabled).map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Radio Buttons
    if (designSettings.timeSelectionType === "radio") {
      return (
        <RadioGroup value={previewData[key]} onValueChange={(v) => setPreviewData({ ...previewData, [key]: v })}>
          <div className="grid grid-cols-2 gap-3">
            {timeOptions.filter(opt => opt.enabled).map(opt => (
              <div key={opt.value} className="flex items-center space-x-2">
                <RadioGroupItem value={opt.value} id={`${day}-${opt.value}`} />
                <Label htmlFor={`${day}-${opt.value}`} className="cursor-pointer">{opt.label}</Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      );
    }

    // Checkboxes (Multiple Selection)
    if (designSettings.timeSelectionType === "checkbox") {
      const selectedValues = previewData[key] ? previewData[key].split(',') : [];
      
      const toggleCheckbox = (value: string) => {
        const newValues = selectedValues.includes(value)
          ? selectedValues.filter(v => v !== value)
          : [...selectedValues, value];
        setPreviewData({ ...previewData, [key]: newValues.join(',') });
      };

      return (
        <div className="grid grid-cols-2 gap-3">
          {timeOptions.filter(opt => opt.enabled).map(opt => (
            <div key={opt.value} className="flex items-center space-x-2">
              <Checkbox 
                id={`${day}-${opt.value}`}
                checked={selectedValues.includes(opt.value)}
                onCheckedChange={() => toggleCheckbox(opt.value)}
              />
              <Label htmlFor={`${day}-${opt.value}`} className="cursor-pointer">{opt.label}</Label>
            </div>
          ))}
        </div>
      );
    }
  };

  const renderDaySelection = (day: string, key: keyof typeof previewData) => {
    const colors = dayColors[day as keyof typeof dayColors];
    const baseCard = designSettings.showDayColors ? colors.bg : "bg-white";
    const baseBorder = designSettings.showDayColors ? colors.border : "border-gray-200";

    if (designSettings.dayCardStyle === "minimal") {
      return (
        <div key={day} className="space-y-2">
          <Label className={getLabelClass()}>
            {designSettings.showDayIcons && <Calendar className={`inline w-4 h-4 mr-2 ${colors.icon}`} />}
            {day}
          </Label>
          {renderTimeInput(day, key)}
        </div>
      );
    }

    if (designSettings.dayCardStyle === "compact") {
      return (
        <div key={day} className={`p-4 rounded-lg border ${baseBorder} ${baseCard}`}>
          <div className="flex items-center gap-2 mb-3">
            {designSettings.showDayIcons && (
              <Calendar className={`w-5 h-5 ${colors.icon}`} />
            )}
            <Label className={getLabelClass()}>{day}</Label>
          </div>
          {renderTimeInput(day, key)}
        </div>
      );
    }

    return (
      <Card key={day} className={`${baseBorder} ${baseCard}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {designSettings.showDayIcons && (
              <Calendar className={`w-5 h-5 ${colors.icon}`} />
            )}
            {day}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label className={getLabelClass()}>Abholzeit</Label>
            {renderTimeInput(day, key)}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPreview = () => {
    return (
      <div className={`${getSpacingClass()} p-6`}>
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl mb-2">Hortzettel erstellen</h2>
          <p className="text-gray-600">Vorschau des Formulars</p>
        </div>

        {/* Child Info */}
        <Card>
          <CardHeader>
            <CardTitle>Kindinformationen</CardTitle>
          </CardHeader>
          <CardContent className={getSpacingClass()}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={getLabelClass()}>Vorname</Label>
                <Input value="Max" disabled />
              </div>
              <div className="space-y-2">
                <Label className={getLabelClass()}>Nachname</Label>
                <Input value="Mustermann" disabled />
              </div>
            </div>

            {designSettings.showClassSelection && (
              <div className="space-y-2">
                <Label className={getLabelClass()}>Klasse</Label>
                <Select value={previewData.class} onValueChange={(v) => setPreviewData({ ...previewData, class: v })}>
                  <SelectTrigger className={getDropdownClass()}>
                    <SelectValue placeholder="Klasse wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.filter(c => c.enabled).map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Home Alone Question - Top */}
        {designSettings.showHomeAloneQuestion && designSettings.homeAloneQuestionPosition === "top" && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Label className={`text-base ${getLabelClass()}`}>
                  <Home className="inline w-4 h-4 mr-2" />
                  Darf mein Kind alleine nach Hause gehen?
                </Label>
                {designSettings.homeAloneInputType === "radio" && (
                  <RadioGroup value={previewData.homeAlone} onValueChange={(v) => setPreviewData({ ...previewData, homeAlone: v })}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="yes" />
                      <Label htmlFor="yes">Ja</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="no" />
                      <Label htmlFor="no">Nein</Label>
                    </div>
                  </RadioGroup>
                )}
                {designSettings.homeAloneInputType === "checkbox" && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="home-alone-yes" 
                        checked={previewData.homeAlone === "yes"}
                        onCheckedChange={(checked) => setPreviewData({ ...previewData, homeAlone: checked ? "yes" : "no" })}
                      />
                      <Label htmlFor="home-alone-yes">Ja, mein Kind darf alleine nach Hause gehen</Label>
                    </div>
                  </div>
                )}
                {designSettings.homeAloneInputType === "dropdown" && (
                  <Select value={previewData.homeAlone} onValueChange={(v) => setPreviewData({ ...previewData, homeAlone: v })}>
                    <SelectTrigger className={getDropdownClass()}>
                      <SelectValue placeholder="Wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Ja</SelectItem>
                      <SelectItem value="no">Nein</SelectItem>
                      <SelectItem value="with-siblings">Mit Geschwistern</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Days */}
        <div className={getSpacingClass()}>
          {renderDaySelection("Montag", "monday")}
          {renderDaySelection("Dienstag", "tuesday")}
          {renderDaySelection("Mittwoch", "wednesday")}
          {renderDaySelection("Donnerstag", "thursday")}
          {renderDaySelection("Freitag", "friday")}
        </div>

        {/* Home Alone Question - Bottom */}
        {designSettings.showHomeAloneQuestion && designSettings.homeAloneQuestionPosition === "bottom" && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Label className={`text-base ${getLabelClass()}`}>
                  <Home className="inline w-4 h-4 mr-2" />
                  Darf mein Kind alleine nach Hause gehen?
                </Label>
                {designSettings.homeAloneInputType === "radio" && (
                  <RadioGroup value={previewData.homeAlone} onValueChange={(v) => setPreviewData({ ...previewData, homeAlone: v })}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="yes-bottom" />
                      <Label htmlFor="yes-bottom">Ja</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="no-bottom" />
                      <Label htmlFor="no-bottom">Nein</Label>
                    </div>
                  </RadioGroup>
                )}
                {designSettings.homeAloneInputType === "checkbox" && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="home-alone-yes-bottom" 
                        checked={previewData.homeAlone === "yes"}
                        onCheckedChange={(checked) => setPreviewData({ ...previewData, homeAlone: checked ? "yes" : "no" })}
                      />
                      <Label htmlFor="home-alone-yes-bottom">Ja, mein Kind darf alleine nach Hause gehen</Label>
                    </div>
                  </div>
                )}
                {designSettings.homeAloneInputType === "dropdown" && (
                  <Select value={previewData.homeAlone} onValueChange={(v) => setPreviewData({ ...previewData, homeAlone: v })}>
                    <SelectTrigger className={getDropdownClass()}>
                      <SelectValue placeholder="Wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Ja</SelectItem>
                      <SelectItem value="no">Nein</SelectItem>
                      <SelectItem value="with-siblings">Mit Geschwistern</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <Button className="w-full" size="lg">
          Hortzettel absenden
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl flex items-center gap-2">
            <Eye className="w-6 h-6" />
            Formular-Vorschau & Design
          </h2>
          <p className="text-gray-600 mt-1">
            Passen Sie das Design des Hortzettel-Formulars an und sehen Sie eine Live-Vorschau
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Zurücksetzen
          </Button>
          <Button onClick={saveSettings}>
            <Save className="w-4 h-4 mr-2" />
            Speichern
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Eye className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Design-Anpassungen in Echtzeit</p>
            <p className="text-blue-700">
              Wählen Sie zwischen Dropdown-Menüs, Radio Buttons oder Checkboxen für die Zeitauswahl. 
              Alle Änderungen werden sofort in der Vorschau angezeigt. Speichern Sie die Einstellungen, 
              um sie auf das echte Formular anzuwenden.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Design-Einstellungen
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="w-4 h-4 mr-2" />
            Vorschau
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6 mt-6">
          {/* Layout Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="w-5 h-5" />
                Layout-Einstellungen
              </CardTitle>
              <CardDescription>
                Bestimmen Sie, welche Elemente im Formular angezeigt werden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Klassenauswahl anzeigen</Label>
                  <p className="text-sm text-gray-500">Zeigt ein Dropdown für die Klassenauswahl</p>
                </div>
                <Switch
                  checked={designSettings.showClassSelection}
                  onCheckedChange={(checked) => setDesignSettings({ ...designSettings, showClassSelection: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Frage "Alleine nach Hause" anzeigen</Label>
                  <p className="text-sm text-gray-500">Zeigt die Frage zur selbständigen Heimkehr</p>
                </div>
                <Switch
                  checked={designSettings.showHomeAloneQuestion}
                  onCheckedChange={(checked) => setDesignSettings({ ...designSettings, showHomeAloneQuestion: checked })}
                />
              </div>

              {designSettings.showHomeAloneQuestion && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Position der "Alleine nach Hause"-Frage</Label>
                    <Select
                      value={designSettings.homeAloneQuestionPosition}
                      onValueChange={(v: "top" | "bottom") => setDesignSettings({ ...designSettings, homeAloneQuestionPosition: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Oben (vor den Wochentagen)</SelectItem>
                        <SelectItem value="bottom">Unten (nach den Wochentagen)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Day Card Style */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Wochentag-Design
              </CardTitle>
              <CardDescription>
                Wählen Sie, wie die Wochentage dargestellt werden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Kartenstil</Label>
                <Select
                  value={designSettings.dayCardStyle}
                  onValueChange={(v: "card" | "compact" | "minimal") => setDesignSettings({ ...designSettings, dayCardStyle: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Karten (Standard)</SelectItem>
                    <SelectItem value="compact">Kompakt</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Wochentag-Icons anzeigen</Label>
                  <p className="text-sm text-gray-500">Kalender-Icons neben Wochentagen</p>
                </div>
                <Switch
                  checked={designSettings.showDayIcons}
                  onCheckedChange={(checked) => setDesignSettings({ ...designSettings, showDayIcons: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Farbige Wochentage</Label>
                  <p className="text-sm text-gray-500">Jeder Wochentag hat eine eigene Farbe</p>
                </div>
                <Switch
                  checked={designSettings.showDayColors}
                  onCheckedChange={(checked) => setDesignSettings({ ...designSettings, showDayColors: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Input Type Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChevronDown className="w-5 h-5" />
                Eingabefelder-Typ
              </CardTitle>
              <CardDescription>
                Wählen Sie, wie Benutzer ihre Auswahl treffen sollen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Zeitauswahl für Wochentage</Label>
                <Select
                  value={designSettings.timeSelectionType}
                  onValueChange={(v: "dropdown" | "checkbox" | "radio") => setDesignSettings({ ...designSettings, timeSelectionType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dropdown">Dropdown-Menü</SelectItem>
                    <SelectItem value="radio">Radio Buttons (Kästchen)</SelectItem>
                    <SelectItem value="checkbox">Checkboxen (Mehrfachauswahl)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {designSettings.timeSelectionType === "dropdown" && "Klassische Dropdown-Auswahl mit einem Klick"}
                  {designSettings.timeSelectionType === "radio" && "Einzelauswahl mit Radio Buttons - alle Optionen sichtbar"}
                  {designSettings.timeSelectionType === "checkbox" && "Mehrfachauswahl möglich - z.B. für flexible Abholzeiten"}
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>"Alleine nach Hause"-Frage</Label>
                <Select
                  value={designSettings.homeAloneInputType}
                  onValueChange={(v: "radio" | "checkbox" | "dropdown") => setDesignSettings({ ...designSettings, homeAloneInputType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="radio">Radio Buttons</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                    <SelectItem value="dropdown">Dropdown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Typography & Spacing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5" />
                Typografie & Abstände
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Label-Stil</Label>
                <Select
                  value={designSettings.labelStyle}
                  onValueChange={(v: "bold" | "normal" | "uppercase") => setDesignSettings({ ...designSettings, labelStyle: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bold">Fett</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="uppercase">Großbuchstaben</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Dropdown-Größe</Label>
                <Select
                  value={designSettings.dropdownStyle}
                  onValueChange={(v: "default" | "compact" | "large") => setDesignSettings({ ...designSettings, dropdownStyle: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Kompakt</SelectItem>
                    <SelectItem value="default">Standard</SelectItem>
                    <SelectItem value="large">Groß</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Abstände</Label>
                <Select
                  value={designSettings.spacing}
                  onValueChange={(v: "tight" | "normal" | "relaxed") => setDesignSettings({ ...designSettings, spacing: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tight">Eng</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="relaxed">Weit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Preview Mode Toggle */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Vorschau-Modus</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant={previewMode === "desktop" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreviewMode("desktop")}
                    >
                      Desktop
                    </Button>
                    <Button
                      variant={previewMode === "mobile" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreviewMode("mobile")}
                    >
                      Mobil
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Preview Container */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className={`mx-auto ${previewMode === "mobile" ? "max-w-md" : "max-w-4xl"} bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50`}>
                  {renderPreview()}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
