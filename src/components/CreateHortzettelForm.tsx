import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ArrowLeft, Send, Palette, Copy, Calendar, Clock, Home, Bus, AlertCircle, Bookmark, Save, HelpCircle, X } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { AppLogo } from "./AppLogo";
import type { HortzettelData, HortzettelTemplate, AppSettings, ChildProfile, FamilyProfile, Child } from "../types/hortzettel";
import { Badge } from "./ui/badge";
import { api } from "../utils/api";
import { isEditingAllowedAsync, getNextEditingTimeMessage } from "../utils/weekUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface CreateHortzettelFormProps {
  childFirstName: string;
  childLastName: string;
  childProfile?: ChildProfile;
  familyProfile?: FamilyProfile;
  onBack: () => void;
  onSubmit: (data: HortzettelData) => void;
  existingData?: HortzettelData;
  isEditMode?: boolean;
  allHortzettel?: (HortzettelData & { id: string; createdAt: Date })[];
}

// Default options (fallback)
const defaultTimeOptions = [
  { value: "nach-unterricht", label: "Nach dem Unterricht" },
  { value: "nach-mittagessen", label: "Nach dem Mittagessen" },
  { value: "mittagsbus", label: "Mittagsbus" },
  { value: "nachmittagsbus", label: "Nachmittagsbus" },
  { value: "14:00", label: "14:00 Uhr" },
  { value: "15:00", label: "15:00 Uhr" },
  { value: "16:00", label: "ab 16:00 Uhr" },
  { value: "krank", label: "Krank" },
  { value: "feiertag", label: "Feiertag" },
  { value: "sonstiges", label: "Sonstiges:" },
];

const defaultColorThemes = [
  { name: "Himmelblau", value: "sky", gradient: "from-sky-50/40 via-cyan-50/30 to-sky-50/40", darkGradient: "from-sky-700 via-cyan-800 to-blue-800" },
  { name: "Mint", value: "mint", gradient: "from-teal-50/40 via-cyan-50/30 to-emerald-50/40", darkGradient: "from-teal-800 via-cyan-800 to-emerald-800" },
  { name: "Lavendel", value: "lavender", gradient: "from-violet-50/40 via-purple-50/30 to-indigo-50/40", darkGradient: "from-violet-800 via-purple-800 to-indigo-800" },
  { name: "Pfirsich", value: "peach", gradient: "from-orange-50/40 via-amber-50/30 to-rose-50/40", darkGradient: "from-orange-800 via-amber-800 to-rose-800" },
  { name: "Rosa", value: "rose", gradient: "from-pink-50/40 via-rose-50/30 to-fuchsia-50/40", darkGradient: "from-pink-800 via-rose-800 to-fuchsia-800" },
  { name: "Sand", value: "sand", gradient: "from-stone-50/40 via-neutral-50/30 to-amber-50/40", darkGradient: "from-stone-700 via-neutral-700 to-amber-700" },
];

// Get gradient theme from CSS variable or theme name
const getThemeGradient = (themeName: string, customColor?: string): string => {
  if (themeName === 'custom' && customColor) {
    // Return a custom gradient based on the custom color
    return `from-slate-50/40 via-gray-50/30 to-slate-50/40`;
  }
  const theme = defaultColorThemes.find(t => t.value === themeName);
  return theme ? theme.gradient : defaultColorThemes[0].gradient;
};

const getThemeDarkGradient = (themeName: string, customColor?: string): string => {
  if (themeName === 'custom' && customColor) {
    return `from-slate-700 via-gray-700 to-slate-700`;
  }
  const theme = defaultColorThemes.find(t => t.value === themeName);
  return theme ? theme.darkGradient : defaultColorThemes[0].darkGradient;
};

// Get day color from CSS variable with fallback
const getDayColor = (day: string): string => {
  const root = document.documentElement;
  const colorMap: Record<string, string> = {
    "Montag": root.style.getPropertyValue('--monday-color') || '#64748B',
    "Dienstag": root.style.getPropertyValue('--tuesday-color') || '#64748B',
    "Mittwoch": root.style.getPropertyValue('--wednesday-color') || '#64748B',
    "Donnerstag": root.style.getPropertyValue('--thursday-color') || '#64748B',
    "Freitag": root.style.getPropertyValue('--friday-color') || '#64748B',
  };
  return colorMap[day] || '#64748B';
};

const dayIcons: Record<string, { icon: any; color: string; bg: string }> = {
  "Montag": { icon: Calendar, color: "text-blue-600", bg: "bg-blue-100" },
  "Dienstag": { icon: Calendar, color: "text-green-600", bg: "bg-green-100" },
  "Mittwoch": { icon: Calendar, color: "text-purple-600", bg: "bg-purple-100" },
  "Donnerstag": { icon: Calendar, color: "text-orange-600", bg: "bg-orange-100" },
  "Freitag": { icon: Calendar, color: "text-pink-600", bg: "bg-pink-100" },
};

function DaySelection({ 
  label, 
  value, 
  onChange, 
  otherValue, 
  onOtherChange,
  timeOptions,
  inputType = "radio",
  colorKey = 0,
  editCount = 0
}: { 
  label: string;
  value: string;
  onChange: (value: string) => void;
  otherValue: string;
  onOtherChange: (value: string) => void;
  timeOptions: { value: string; label: string }[];
  inputType?: "dropdown" | "checkbox" | "radio";
  colorKey?: number;
  editCount?: number;
}) {
  const dayConfig = dayIcons[label];
  const DayIcon = dayConfig.icon;
  const dayColor = getDayColor(label);
  
  // Convert hex to rgb for opacity
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  const rgb = hexToRgb(dayColor);
  const bgColor = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)` : `${dayColor}20`;

  // Get edit count color
  const getEditBadgeColor = (count: number) => {
    if (count === 0) return null;
    
    const colors = [
      null, // 0 - Original (keine Farbe)
      { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", border: "border-red-300 dark:border-red-700" }, // 1
      { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", border: "border-orange-300 dark:border-orange-700" }, // 2
      { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300", border: "border-yellow-300 dark:border-yellow-700" }, // 3
      { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", border: "border-green-300 dark:border-green-700" }, // 4+
    ];
    
    return colors[Math.min(count, 4)] || colors[4];
  };

  const editBadgeColor = getEditBadgeColor(editCount);
  
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <Badge 
          className="border-2 px-4 py-2 text-base gap-2 shadow-md backdrop-blur-sm"
          style={{ 
            backgroundColor: `${bgColor}dd`,
            color: dayColor,
            borderColor: dayColor
          }}
        >
          <DayIcon className="h-4 w-4" />
          <span className="font-semibold">{label}</span>
        </Badge>
        {editCount > 0 && editBadgeColor && (
          <Badge 
            className={`${editBadgeColor.bg} ${editBadgeColor.text} ${editBadgeColor.border} border-2 px-3 py-1 text-xs gap-1.5 shadow-sm`}
          >
            <AlertCircle className="h-3 w-3" />
            <span className="font-semibold">{editCount} {editCount === 1 ? 'Änderung' : 'Änderungen'}</span>
          </Badge>
        )}
      </div>

      {/* Dropdown-Modus */}
      {inputType === "dropdown" && (
        <div className="space-y-3">
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="h-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-2 border-gray-300 dark:border-slate-600 shadow-sm">
              <SelectValue placeholder="Wählen Sie eine Option..." />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Always show "Zusätzlicher Hinweis" field, not just for "sonstiges" */}
          {value && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Zusätzlicher Hinweis (optional)
              </Label>
              <Input
                className="h-11 bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 focus:border-primary shadow-sm"
                placeholder="z.B. Treffpunkt, besondere Abholung, etc..."
                value={otherValue}
                onChange={(e) => onOtherChange(e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {/* Radio-Button-Modus */}
      {inputType === "radio" && (
        <div className="space-y-4">
          <RadioGroup value={value} onValueChange={onChange}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {timeOptions.map((option) => (
                <div key={option.value}>
                  <label 
                    className={`group flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 shadow-sm ${
                      value === option.value 
                        ? "border-primary bg-white/95 dark:bg-slate-800/95 shadow-lg scale-[1.02] ring-2 ring-primary/20" 
                        : "border-gray-300 dark:border-slate-600 hover:border-primary/50 hover:bg-white/80 dark:hover:bg-slate-800/80 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm"
                    }`}
                  >
                    <RadioGroupItem value={option.value} className="shrink-0" />
                    <span className={`${value === option.value ? "font-semibold text-primary" : "text-gray-900 dark:text-gray-100"} transition-colors`}>
                      {option.label}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </RadioGroup>
          {/* Always show "Zusätzlicher Hinweis" field when something is selected */}
          {value && (
            <div className="space-y-2 mt-4">
              <Label className="text-sm text-muted-foreground">
                Zusätzlicher Hinweis (optional)
              </Label>
              <Input
                className="h-11 bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 focus:border-primary shadow-sm"
                placeholder="z.B. Treffpunkt, besondere Abholung, etc..."
                value={otherValue}
                onChange={(e) => onOtherChange(e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {/* Checkbox-Modus (Mehrfachauswahl) */}
      {inputType === "checkbox" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {timeOptions.map((option) => (
              <div key={option.value}>
                <label
                  className={`group flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 shadow-sm ${
                    value.includes(option.value)
                      ? "border-primary bg-white/95 dark:bg-slate-800/95 shadow-lg scale-[1.02] ring-2 ring-primary/20"
                      : "border-gray-300 dark:border-slate-600 hover:border-primary/50 hover:bg-white/80 dark:hover:bg-slate-800/80 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm"
                  }`}
                >
                  <Checkbox
                    checked={value.includes(option.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        const newValue = value ? `${value},${option.value}` : option.value;
                        onChange(newValue);
                      } else {
                        const values = value.split(',').filter(v => v !== option.value);
                        onChange(values.join(','));
                      }
                    }}
                    className="shrink-0"
                  />
                  <span className={`${value.includes(option.value) ? "font-semibold text-primary" : "text-gray-900 dark:text-gray-100"} transition-colors`}>
                    {option.label}
                  </span>
                </label>
              </div>
            ))}
          </div>
          {/* Always show "Zusätzlicher Hinweis" field when something is selected */}
          {value && (
            <div className="space-y-2 mt-4">
              <Label className="text-sm text-muted-foreground">
                Zusätzlicher Hinweis (optional)
              </Label>
              <Input
                className="h-11 bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 focus:border-primary shadow-sm"
                placeholder="z.B. Treffpunkt, besondere Abholung, etc..."
                value={otherValue}
                onChange={(e) => onOtherChange(e.target.value)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HomeAloneSelection({
  value,
  onChange,
  otherValue,
  onOtherChange,
  options,
  inputType = "radio",
  label
}: {
  value: string;
  onChange: (value: string) => void;
  otherValue: string;
  onOtherChange: (value: string) => void;
  options: { value: string; label: string }[];
  inputType?: "radio" | "checkbox" | "dropdown";
  label: string;
}) {
  const getIcon = (val: string) => {
    if (val.includes('ja') || val.includes('allein')) return Home;
    if (val.includes('nein') || val.includes('nicht')) return AlertCircle;
    if (val.includes('bus')) return Bus;
    return Clock;
  };

  return (
    <div className="space-y-4">
      <Label className="text-base flex items-center gap-2">
        <Home className="h-4 w-4" />
        {label} *
      </Label>

      {/* Radio-Button-Modus */}
      {inputType === "radio" && (
        <div className="space-y-4">
          <RadioGroup value={value} onValueChange={onChange}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {options.map((option) => {
                const OptionIcon = getIcon(option.value);
                return (
                  <div key={option.value}>
                    <label 
                      className={`group flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 shadow-sm ${
                        value === option.value 
                          ? "border-primary bg-white/95 dark:bg-slate-800/95 shadow-lg scale-[1.02] ring-2 ring-primary/20" 
                          : "border-gray-300 dark:border-slate-600 hover:border-primary/50 hover:bg-white/80 dark:hover:bg-slate-800/80 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm"
                      }`}
                    >
                      <RadioGroupItem value={option.value} className="shrink-0" />
                      <OptionIcon className={`h-5 w-5 ${value === option.value ? "text-primary" : "text-gray-400 dark:text-gray-500"} transition-colors`} />
                      <span className={`${value === option.value ? "font-semibold text-primary" : "text-gray-900 dark:text-gray-100"} transition-colors`}>
                        {option.label}
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
          {/* Always show "Zusätzlicher Hinweis" field when something is selected */}
          {value && (
            <div className="space-y-2 mt-4">
              <Label className="text-sm text-muted-foreground">
                Zusätzlicher Hinweis (optional)
              </Label>
              <Input
                className="h-11 bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 focus:border-primary shadow-sm"
                placeholder="z.B. Besondere Umstände, Einschränkungen..."
                value={otherValue}
                onChange={(e) => onOtherChange(e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {/* Dropdown-Modus */}
      {inputType === "dropdown" && (
        <div className="space-y-3">
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="h-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-2 border-gray-300 dark:border-slate-600 shadow-sm">
              <SelectValue placeholder="Wählen Sie eine Option..." />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Always show "Zusätzlicher Hinweis" field when something is selected */}
          {value && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Zusätzlicher Hinweis (optional)
              </Label>
              <Input
                className="h-11 bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 focus:border-primary shadow-sm"
                placeholder="z.B. Besondere Umstände, Einschränkungen..."
                value={otherValue}
                onChange={(e) => onOtherChange(e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {/* Checkbox-Modus */}
      {inputType === "checkbox" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options.map((option) => {
              const OptionIcon = getIcon(option.value);
              return (
                <div key={option.value}>
                  <label
                    className={`group flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 shadow-sm ${
                      value === option.value
                        ? "border-primary bg-white/95 dark:bg-slate-800/95 shadow-lg scale-[1.02] ring-2 ring-primary/20"
                        : "border-gray-300 dark:border-slate-600 hover:border-primary/50 hover:bg-white/80 dark:hover:bg-slate-800/80 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm"
                    }`}
                  >
                    <Checkbox
                      checked={value === option.value}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onChange(option.value);
                        } else {
                          onChange("");
                        }
                      }}
                      className="shrink-0"
                    />
                    <OptionIcon className={`h-5 w-5 ${value === option.value ? "text-primary" : "text-gray-400 dark:text-gray-500"} transition-colors`} />
                    <span className={`${value === option.value ? "font-semibold text-primary" : "text-gray-900 dark:text-gray-100"} transition-colors`}>
                      {option.label}
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
          {/* Always show "Zusätzlicher Hinweis" field when something is selected */}
          {value && (
            <div className="space-y-2 mt-4">
              <Label className="text-sm text-muted-foreground">
                Zusätzlicher Hinweis (optional)
              </Label>
              <Input
                className="h-11 bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 focus:border-primary shadow-sm"
                placeholder="z.B. Besondere Umstände, Einschränkungen..."
                value={otherValue}
                onChange={(e) => onOtherChange(e.target.value)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CreateHortzettelForm({ 
  childFirstName, 
  childLastName, 
  childProfile,
  familyProfile,
  onBack,
  onSubmit,
  existingData,
  isEditMode = false,
  allHortzettel = []
}: CreateHortzettelFormProps) {
  // Version check
  console.log('📝 [FORM LOADED] CreateHortzettelForm geladen - Nov 3, 2025, 14:30');
  
  // Debug logging
  useEffect(() => {
    console.log('[CreateHortzettelForm] Mounted with:', {
      isEditMode,
      hasExistingData: !!existingData,
      existingData,
      childFirstName,
      childLastName,
      childProfile,
      familyProfile
    });
  }, []);

  // Selected child state (for multi-child support)
  const [selectedChildId, setSelectedChildId] = useState<string>(existingData?.childId || "");
  const [childName, setChildName] = useState(existingData?.childName || `${childFirstName} ${childLastName}`);
  // Use class from existingData (if editing), or from childProfile (if creating), or empty string
  const [selectedClass, setSelectedClass] = useState(existingData?.class || childProfile?.class || "");

  // Get available children from familyProfile
  const availableChildren = familyProfile?.children || [];
  const hasMultipleChildren = availableChildren.length > 1;

  // Handle child selection
  const handleChildSelection = (childId: string) => {
    setSelectedChildId(childId);
    const child = availableChildren.find(c => c.id === childId);
    if (child) {
      setChildName(`${child.firstName} ${child.lastName}`);
      setSelectedClass(child.class || "");
    }
  };

  // Auto-select first child if not editing and no child selected
  useEffect(() => {
    console.log('[CreateHortzettelForm] Auto-select check:', {
      isEditMode,
      selectedChildId,
      availableChildrenCount: availableChildren.length,
      availableChildren
    });
    
    if (!isEditMode && !selectedChildId && availableChildren.length > 0) {
      const firstChild = availableChildren[0];
      console.log('[CreateHortzettelForm] Auto-selecting first child:', firstChild);
      setSelectedChildId(firstChild.id);
      setChildName(`${firstChild.firstName} ${firstChild.lastName}`);
      setSelectedClass(firstChild.class || "");
    }
  }, [isEditMode, selectedChildId, availableChildren]);
  const [canGoHomeAlone, setCanGoHomeAlone] = useState(existingData?.canGoHomeAlone || "");
  const [canGoHomeAloneOther, setCanGoHomeAloneOther] = useState(existingData?.canGoHomeAloneOther || "");
  
  const [monday, setMonday] = useState(existingData?.monday || "");
  const [mondayOther, setMondayOther] = useState(existingData?.mondayOther || "");
  const [tuesday, setTuesday] = useState(existingData?.tuesday || "");
  const [tuesdayOther, setTuesdayOther] = useState(existingData?.tuesdayOther || "");
  const [wednesday, setWednesday] = useState(existingData?.wednesday || "");
  const [wednesdayOther, setWednesdayOther] = useState(existingData?.wednesdayOther || "");
  const [thursday, setThursday] = useState(existingData?.thursday || "");
  const [thursdayOther, setThursdayOther] = useState(existingData?.thursdayOther || "");
  const [friday, setFriday] = useState(existingData?.friday || "");
  const [fridayOther, setFridayOther] = useState(existingData?.fridayOther || "");

  // Template states
  const [templates, setTemplates] = useState<HortzettelTemplate[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [showHelpDialog, setShowHelpDialog] = useState(false);

  // Settings state for dynamic options
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [settingsLoadKey, setSettingsLoadKey] = useState(0); // Force reload trigger
  const [isEditingAllowedState, setIsEditingAllowedState] = useState(true); // State für Zeitbeschränkung
  const [designSettings, setDesignSettings] = useState<any>(null); // Form design settings
  const [colorUpdateTrigger, setColorUpdateTrigger] = useState(0); // Force color re-render
  const [basicInfoTheme, setBasicInfoTheme] = useState<string>('blue');
  const [weekPlanTheme, setWeekPlanTheme] = useState<string>('purple');
  const [backgroundTheme, setBackgroundTheme] = useState<string>('blue');
  const timeOptions = settings?.timeOptions || defaultTimeOptions;
  const colorThemes = settings?.colorThemes || defaultColorThemes;
  const allowedHomeAloneOptions = settings?.allowedHomeAloneOptions || [
    { value: "ja", label: "Ja" },
    { value: "nein", label: "Nein" },
    { value: "mit-geschwistern", label: "Mit Geschwistern" },
    { value: "sonstiges", label: "Sonstiges:" },
  ];
  
  // Content texts with fallbacks
  const content = settings?.content || {
    childNameLabel: 'Name des Kindes',
    classLabel: 'Klasse',
    homeAloneQuestion: 'Darf mein Kind alleine nach Hause gehen?',
    hortzettelTitle: 'Hortzettel erstellen',
    hortzettelDescription: 'Füllen Sie die Betreuungszeiten für die kommende Woche aus',
    weekdayLabel: 'Wochentag',
  };

  // Load templates and settings on mount and when settings are updated
  useEffect(() => {
    loadTemplates();
    loadSettings();
    checkEditingAllowed(); // Prüfe initial
    
    // Listen for settings updates from AdminDashboard
    const handleSettingsUpdate = (event: CustomEvent) => {
      console.log('[CreateHortzettelForm] Settings updated event received:', event.detail);
      
      // Update section themes if provided
      if (event.detail?.designSettings) {
        if (event.detail.designSettings.basicInfoTheme) {
          setBasicInfoTheme(event.detail.designSettings.basicInfoTheme);
        }
        if (event.detail.designSettings.weekPlanTheme) {
          setWeekPlanTheme(event.detail.designSettings.weekPlanTheme);
        }
      }
      
      // Always reload from API to ensure we have the latest data
      loadSettings();
      // Force color re-render for day tabs
      setColorUpdateTrigger(prev => prev + 1);
      toast.success('Einstellungen aktualisiert!', { duration: 2000 });
    };
    
    // Also reload when window regains focus (covers cases where update event was missed)
    const handleFocus = () => {
      console.log('[CreateHortzettelForm] Window focused, checking for settings updates...');
      loadSettings();
      checkEditingAllowed(); // Prüfe auch Zeitbeschränkung
    };
    
    window.addEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
    window.addEventListener('focus', handleFocus);
    
    // Prüfe Zeitbeschränkung jede Minute
    const interval = setInterval(checkEditingAllowed, 60000);
    
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  const checkEditingAllowed = async () => {
    const allowed = await isEditingAllowedAsync();
    setIsEditingAllowedState(allowed);
  };

  const loadTemplates = async () => {
    try {
      const response = await api.getTemplates();
      setTemplates(response.templates);
    } catch (error) {
      console.error('Fehler beim Laden der Vorlagen:', error);
    }
  };

  const loadSettings = async () => {
    try {
      console.log('[CreateHortzettelForm] Loading settings...');
      const [settingsRes, designRes] = await Promise.all([
        api.getSettings(),
        api.getFormDesignSettings().catch(() => ({ settings: null }))
      ]);
      console.log('[CreateHortzettelForm] Settings loaded:', settingsRes.settings);
      console.log('[CreateHortzettelForm] Design settings loaded:', designRes.settings);
      console.log('[CreateHortzettelForm] Time selection type:', designRes.settings?.timeSelectionType);
      console.log('[CreateHortzettelForm] Home alone input type:', designRes.settings?.homeAloneInputType);
      console.log('[CreateHortzettelForm] Content field:', settingsRes.settings?.content);
      setSettings(settingsRes.settings);
      setDesignSettings(designRes.settings);
      
      // Load section themes from localStorage (set in PersonalDashboard)
      const userBasicTheme = localStorage.getItem(`hortzettel_theme_basic_${childFirstName}_${childLastName}`);
      const userWeekTheme = localStorage.getItem(`hortzettel_theme_week_${childFirstName}_${childLastName}`);
      const userBackgroundTheme = localStorage.getItem(`hortzettel_theme_background_${childFirstName}_${childLastName}`);
      
      if (userBasicTheme) {
        setBasicInfoTheme(userBasicTheme);
      } else {
        setBasicInfoTheme('blue'); // Default
      }
      
      if (userWeekTheme) {
        setWeekPlanTheme(userWeekTheme);
      } else {
        setWeekPlanTheme('purple'); // Default
      }
      
      if (userBackgroundTheme) {
        setBackgroundTheme(userBackgroundTheme);
      } else {
        setBackgroundTheme('blue'); // Default
      }
    } catch (error) {
      console.error('Fehler beim Laden der Einstellungen:', error);
    }
  };

  const loadTemplate = (template: HortzettelTemplate) => {
    setSelectedClass(template.class);
    setCanGoHomeAlone(template.canGoHomeAlone);
    setCanGoHomeAloneOther(template.canGoHomeAloneOther || "");
    setMonday(template.monday);
    setMondayOther(template.mondayOther || "");
    setTuesday(template.tuesday);
    setTuesdayOther(template.tuesdayOther || "");
    setWednesday(template.wednesday);
    setWednesdayOther(template.wednesdayOther || "");
    setThursday(template.thursday);
    setThursdayOther(template.thursdayOther || "");
    setFriday(template.friday);
    setFridayOther(template.fridayOther || "");
    
    toast.success(`Vorlage "${template.name}" geladen!`);
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Bitte gib einen Namen für die Vorlage ein");
      return;
    }

    if (!selectedClass) {
      toast.error("Bitte wähle zuerst eine Klasse aus");
      return;
    }

    try {
      await api.createTemplate(templateName, {
        class: selectedClass,
        canGoHomeAlone,
        canGoHomeAloneOther,
        monday,
        mondayOther,
        tuesday,
        tuesdayOther,
        wednesday,
        wednesdayOther,
        thursday,
        thursdayOther,
        friday,
        fridayOther,
      });
      
      toast.success(`Vorlage "${templateName}" gespeichert!`);
      setShowSaveDialog(false);
      setTemplateName("");
      loadTemplates();
    } catch (error) {
      console.error('Fehler beim Speichern der Vorlage:', error);
      toast.error('Fehler beim Speichern der Vorlage');
    }
  };

  const copyLastWeek = () => {
    if (allHortzettel.length === 0) {
      toast.error("Keine vorherige Woche gefunden");
      return;
    }
    const sorted = [...allHortzettel].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const lastWeek = sorted[0];
    
    setSelectedClass(lastWeek.class);
    setCanGoHomeAlone(lastWeek.canGoHomeAlone);
    setCanGoHomeAloneOther(lastWeek.canGoHomeAloneOther || "");
    setMonday(lastWeek.monday);
    setMondayOther(lastWeek.mondayOther || "");
    setTuesday(lastWeek.tuesday);
    setTuesdayOther(lastWeek.tuesdayOther || "");
    setWednesday(lastWeek.wednesday);
    setWednesdayOther(lastWeek.wednesdayOther || "");
    setThursday(lastWeek.thursday);
    setThursdayOther(lastWeek.thursdayOther || "");
    setFriday(lastWeek.friday);
    setFridayOther(lastWeek.fridayOther || "");
    
    toast.success("Letzte Woche kopiert!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prüfe Bearbeitungszeiten für ALLE Aktionen (Erstellen UND Bearbeiten)
    const isAllowed = await isEditingAllowedAsync();
    if (!isAllowed) {
      toast.error(
        isEditMode ? "Bearbeitung derzeit nicht möglich" : "Erstellen derzeit nicht möglich", 
        { 
          description: getNextEditingTimeMessage(),
          duration: 6000 
        }
      );
      return;
    }
    
    if (!childName.trim()) {
      toast.error("Bitte gib den Namen des Kindes ein");
      return;
    }
    if (!selectedClass) {
      toast.error("Bitte wähle eine Klasse aus");
      return;
    }
    if (!canGoHomeAlone) {
      toast.error("Bitte gib an, ob das Kind alleine heim gehen darf");
      return;
    }
    if (!monday || !tuesday || !wednesday || !thursday || !friday) {
      toast.error("Bitte fülle alle Wochentage aus");
      return;
    }

    const hortzettelData = {
      childName,
      childId: selectedChildId || undefined, // Include child ID for multi-child support
      class: selectedClass,
      canGoHomeAlone,
      // Always save "Other" field if it has content, not just when "sonstiges" is selected
      canGoHomeAloneOther: canGoHomeAloneOther?.trim() ? canGoHomeAloneOther : undefined,
      monday,
      mondayOther: mondayOther?.trim() ? mondayOther : undefined,
      tuesday,
      tuesdayOther: tuesdayOther?.trim() ? tuesdayOther : undefined,
      wednesday,
      wednesdayOther: wednesdayOther?.trim() ? wednesdayOther : undefined,
      thursday,
      thursdayOther: thursdayOther?.trim() ? thursdayOther : undefined,
      friday,
      fridayOther: fridayOther?.trim() ? fridayOther : undefined,
    };

    console.log('[FORM] Übermittle Hortzettel-Daten:', {
      childName: hortzettelData.childName,
      class: hortzettelData.class,
      selectedClass: selectedClass,
    });

    onSubmit(hortzettelData);
  };

  const currentTheme = colorThemes.find(t => t.value === backgroundTheme) || colorThemes[0];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.gradient}`}>
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 border-b border-white/20 shadow-lg">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Left Side - Back Button */}
            <Button 
              variant="secondary" 
              onClick={onBack}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 w-full sm:w-auto"
            >
              <Home className="h-4 w-4 mr-2" />
              Zur Startseite
            </Button>
            
            {/* Right Side - Controls in Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 w-full sm:w-auto">
              {/* Hilfe Button */}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowHelpDialog(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 h-full"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Hilfe
              </Button>
              
              {/* Template Dropdown */}
              {templates.length > 0 && (
                <Select onValueChange={(value) => {
                  const template = templates.find(t => t.id === value);
                  if (template) loadTemplate(template);
                }}>
                  <SelectTrigger className="bg-white/20 hover:bg-white/30 text-white border-white/30 h-full">
                    <Bookmark className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Vorlage laden" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.filter(t => t.id && t.id.trim() !== '').map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {/* Copy Last Week Button */}
              {!isEditMode && allHortzettel.length > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={copyLastWeek}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 h-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  <span className="hidden lg:inline">Wie letzte Woche</span>
                  <span className="lg:hidden">Letzte Woche</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-3 py-3 sm:py-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-2 sm:mb-3 text-center">
            <AppLogo 
              className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 rounded-lg mb-1.5 shadow-lg ring-2 ring-orange-200/50 p-1"
              iconClassName="h-5 w-5 sm:h-6 sm:w-6 text-white"
            />
            <h1 className="text-sm sm:text-base md:text-lg mb-0.5 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {isEditMode ? "Hortzettel bearbeiten" : content.hortzettelTitle || "Neuer Hortzettel"}
            </h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground max-w-2xl mx-auto">
              {isEditMode ? "Ändere die Einstellungen deines Hortzettels" : content.hortzettelDescription || "Fülle den wöchentlichen Hortzettel für dein Kind aus"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Grundinformationen */}
            <div className={`bg-gradient-to-br ${getThemeGradient(basicInfoTheme)} dark:bg-gradient-to-br dark:${getThemeDarkGradient(basicInfoTheme)} backdrop-blur-sm rounded-lg shadow-lg border border-white/60 dark:border-slate-600/60 p-3 sm:p-4 transition-all`}>
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <AppLogo 
                  className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md p-1"
                  iconClassName="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white"
                />
                <h3 className="text-sm sm:text-base">Grundinformationen</h3>
              </div>
              <div className="space-y-2.5 sm:space-y-3">
                {/* Child Selection (Multi-Child Support) */}
                {hasMultipleChildren && !isEditMode && (
                  <div className="space-y-3">
                    <Label htmlFor="selectChild" className="text-base flex items-center gap-2">
                      👶 Wähle das Kind
                    </Label>
                    <Select value={selectedChildId} onValueChange={handleChildSelection}>
                      <SelectTrigger id="selectChild" className="h-12 bg-white border-2 text-base">
                        <SelectValue placeholder="Kind auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableChildren.map((child) => (
                          <SelectItem key={child.id} value={child.id}>
                            {child.firstName} {child.lastName} {child.class ? `(Klasse ${child.class})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Du hast mehrere Kinder registriert. Wähle das Kind für diesen Hortzettel aus.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <Label htmlFor="childName" className="text-base">{content.childNameLabel || 'Name des Kindes'} (Vor- und Nachname) *</Label>
                  <Input
                    id="childName"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="Vorname Nachname"
                    className="h-12 bg-white border-2 text-base focus:border-primary"
                    disabled={hasMultipleChildren && !isEditMode}
                  />
                  {hasMultipleChildren && !isEditMode && (
                    <p className="text-xs text-muted-foreground">
                      Name wird automatisch vom ausgewählten Kind übernommen
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="class" className="text-base">{content.classLabel || 'Klasse'} *</Label>
                  {!selectedClass && selectedChildId && (
                    <div className="mb-3 p-4 bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <p className="text-sm text-amber-900 dark:text-amber-200">
                            <strong>Keine Klasse hinterlegt</strong>
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-300">
                            Bitte gehe zu deinem Profil und füge die Klasse für {childName} hinzu, bevor du einen Hortzettel erstellst.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger id="class" className="h-12 bg-white border-2 text-base">
                      <SelectValue placeholder="Klasse auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {(settings?.classes || ['Hort 1', 'Hort 2', 'Hort 3', 'Hort 4'])
                        .filter(cls => cls && cls.trim() !== '')
                        .map((cls) => (
                          <SelectItem key={cls} value={cls}>
                            {cls}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <HomeAloneSelection
                  value={canGoHomeAlone}
                  onChange={setCanGoHomeAlone}
                  otherValue={canGoHomeAloneOther}
                  onOtherChange={setCanGoHomeAloneOther}
                  options={allowedHomeAloneOptions}
                  inputType={designSettings?.homeAloneInputType || "radio"}
                  label={content.homeAloneQuestion || 'Darf mein Kind alleine Heim gehen?'}
                />
              </div>
            </div>

            {/* Wochenplan */}
            <div className={`bg-gradient-to-br ${getThemeGradient(weekPlanTheme)} dark:bg-gradient-to-br dark:${getThemeDarkGradient(weekPlanTheme)} backdrop-blur-sm rounded-lg shadow-lg border border-white/60 dark:border-slate-600/60 p-3 sm:p-4 transition-all`}>
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base">Wochenplan</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {designSettings?.timeSelectionType === "checkbox" 
                      ? "Wähle für jeden Tag eine oder mehrere Optionen aus" 
                      : "Bitte wähle für jeden Tag die gewünschte Option"}
                  </p>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <DaySelection
                  label="Montag"
                  value={monday}
                  onChange={setMonday}
                  otherValue={mondayOther}
                  onOtherChange={setMondayOther}
                  timeOptions={timeOptions}
                  inputType={designSettings?.timeSelectionType || "radio"}
                  colorKey={colorUpdateTrigger}
                  editCount={existingData?.mondayEdits || 0}
                />
                <DaySelection
                  label="Dienstag"
                  value={tuesday}
                  onChange={setTuesday}
                  otherValue={tuesdayOther}
                  onOtherChange={setTuesdayOther}
                  timeOptions={timeOptions}
                  inputType={designSettings?.timeSelectionType || "radio"}
                  colorKey={colorUpdateTrigger}
                  editCount={existingData?.tuesdayEdits || 0}
                />
                <DaySelection
                  label="Mittwoch"
                  value={wednesday}
                  onChange={setWednesday}
                  otherValue={wednesdayOther}
                  onOtherChange={setWednesdayOther}
                  timeOptions={timeOptions}
                  inputType={designSettings?.timeSelectionType || "radio"}
                  colorKey={colorUpdateTrigger}
                  editCount={existingData?.wednesdayEdits || 0}
                />
                <DaySelection
                  label="Donnerstag"
                  value={thursday}
                  onChange={setThursday}
                  otherValue={thursdayOther}
                  onOtherChange={setThursdayOther}
                  timeOptions={timeOptions}
                  inputType={designSettings?.timeSelectionType || "radio"}
                  colorKey={colorUpdateTrigger}
                  editCount={existingData?.thursdayEdits || 0}
                />
                <DaySelection
                  label="Freitag"
                  value={friday}
                  onChange={setFriday}
                  otherValue={fridayOther}
                  onOtherChange={setFridayOther}
                  timeOptions={timeOptions}
                  inputType={designSettings?.timeSelectionType || "radio"}
                  colorKey={colorUpdateTrigger}
                  editCount={existingData?.fridayEdits || 0}
                />
              </div>
            </div>

            {/* Time Restriction Notice */}
            {!isEditingAllowedState && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-orange-900 dark:text-orange-400 mb-2">
                      ⏰ {isEditMode ? 'Bearbeitung' : 'Erstellen'} derzeit nicht möglich
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-500">
                      {getNextEditingTimeMessage()}
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-500 mt-2">
                      📅 <strong>Montag-Freitag:</strong> Gesperrt zwischen 12:00 und 17:00 Uhr
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-500 mt-1">
                      ✅ <strong>Erlaubt:</strong> Mo-Fr bis 12:00 Uhr und ab 17:00 Uhr, am Wochenende jederzeit
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex flex-col gap-4 pt-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onBack} 
                  className="flex-1 h-14 bg-white/80 hover:bg-white border-2 text-base"
                >
                  Abbrechen
                </Button>
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => setShowSaveDialog(true)}
                  className="flex-1 h-14 shadow-lg hover:shadow-xl transition-all text-base"
                >
                  <Bookmark className="h-5 w-5 mr-2" />
                  Als Vorlage speichern
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 h-14 shadow-lg hover:shadow-xl transition-all text-base"
                  disabled={!isEditingAllowedState}
                >
                  {!isEditingAllowedState ? (
                    <>
                      <Clock className="h-5 w-5 mr-2" />
                      Derzeit gesperrt
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      {isEditMode ? "Änderungen speichern" : "Hortzettel abschicken"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Save Template Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Als Vorlage speichern</DialogTitle>
            <DialogDescription>
              Gib deiner Vorlage einen Namen, damit du sie später schnell wiederfinden kannst.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="templateName">Vorlagen-Name</Label>
              <Input
                id="templateName"
                placeholder="z.B. 'Normale Woche' oder 'Sport-Woche'"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="mt-1.5"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveAsTemplate();
                }}
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowSaveDialog(false);
                  setTemplateName("");
                }}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                type="button"
                onClick={saveAsTemplate}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Speichern
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hilfe Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="bg-gradient-to-r from-blue-500 to-purple-600 -m-6 mb-0 p-6 text-white">
            <DialogTitle className="text-white">Hilfe zum Hortzettel-Formular</DialogTitle>
            <DialogDescription className="text-white/90">
              Tipps zum Ausfüllen des Hortzettels
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Formular ausfüllen */}
            <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20 rounded-r-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Send className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">Formular ausfüllen</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                    <li>Fülle alle Pflichtfelder (*) aus</li>
                    <li>Wähle für jeden Wochentag eine Option aus</li>
                    <li>Nutze das Feld "Zusätzlicher Hinweis" für besondere Informationen</li>
                    <li>Prüfe alle Angaben vor dem Abschicken</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Vorlagen verwenden */}
            <div className="p-4 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-950/20 rounded-r-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bookmark className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-2 text-purple-900 dark:text-purple-100">Vorlagen verwenden</h4>
                  <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1 list-disc list-inside">
                    <li>Erstelle Vorlagen für häufig verwendete Zeitpläne</li>
                    <li>Lade Vorlagen über das Dropdown "Vorlage laden"</li>
                    <li>Speichere Vorlagen mit dem Button "Als Vorlage speichern"</li>
                    <li>Spare Zeit bei wiederkehrenden Zeitplänen</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Letzte Woche kopieren */}
            <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20 rounded-r-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Copy className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-2 text-green-900 dark:text-green-100">Letzte Woche kopieren</h4>
                  <ul className="text-sm text-green-800 dark:text-green-200 space-y-1 list-disc list-inside">
                    <li>Klicke auf "Wie letzte Woche" um den vorherigen Hortzettel zu kopieren</li>
                    <li>Alle Felder werden automatisch ausgefüllt</li>
                    <li>Du kannst die kopierten Daten anpassen</li>
                    <li>Ideal wenn sich der Zeitplan nicht ändert</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Zeitbeschränkungen */}
            <div className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20 rounded-r-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-2 text-red-900 dark:text-red-100">Zeitbeschränkungen beachten</h4>
                  <ul className="text-sm text-red-800 dark:text-red-200 space-y-1 list-disc list-inside">
                    <li>Montag-Freitag: Gesperrt zwischen 12:00 und 17:00 Uhr</li>
                    <li>Erstellen und Bearbeiten ist nur außerhalb dieser Zeiten möglich</li>
                    <li>Am Wochenende sind Hortzettel jederzeit bearbeitbar</li>
                    <li>Plane deine Hortzettel entsprechend</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <Button onClick={() => setShowHelpDialog(false)} className="w-full">
              Schließen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}