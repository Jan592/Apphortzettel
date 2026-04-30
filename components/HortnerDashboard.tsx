import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { 
  Shield, LogOut, FileText, Search, Users, 
  Info, Plus, Trash2, Bell, Archive, 
  HelpCircle, Printer, RefreshCw, CheckCircle,
  Clock, MoreHorizontal, ChevronUp, ChevronDown
} from "lucide-react";
import type { HortzettelData, Announcement } from "../types/hortzettel";
import { api } from "../utils/api";
import { toast } from "sonner@2.0.3";
import { ThemeToggle } from "./ThemeToggle";
import { HortzettelPrintView } from "./HortzettelPrintView";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Label } from "./ui/label";

const schoolImage = "https://images.unsplash.com/photo-1665270695165-93b5798522ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnZXJtYW4lMjBlbGVtZW50YXJ5JTIwc2Nob29sJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzYxNjkwNjQyfDA&ixlib=rb-4.1.0&q=80&w=1080";

interface HortnerDashboardProps {
  klasse: string;
  allHortzettel: (HortzettelData & { id: string; createdAt: Date })[];
  onLogout: () => void;
  onToggleDesign?: (useModern: boolean) => void;
  schoolPhotoUrl?: string;
}

export default function HortnerDashboard({ 
  klasse, 
  allHortzettel: initialHortzettel, 
  onLogout,
  onToggleDesign,
  schoolPhotoUrl
}: HortnerDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [weekFilter, setWeekFilter] = useState<"aktiv" | "archiv" | "alle">("aktiv");
  const [allHortzettel, setAllHortzettel] = useState(initialHortzettel);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<(HortzettelData & { id: string; createdAt: Date }) | null>(null);
  const [showChildInfo, setShowChildInfo] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState<"hortzettel" | "announcements">("hortzettel");
  
  const [selectedHortgruppe, setSelectedHortgruppe] = useState<string>("alle");
  
  // Announcement state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "warning" | "urgent",
  });

  // NEW: Day detail modal state
  const [selectedDayInfo, setSelectedDayInfo] = useState<{
    childName: string;
    day: string;
    time: string;
    notes?: string;
  } | null>(null);
  const [showDayInfo, setShowDayInfo] = useState(false);

  // NEW: Week overview modal
  const [selectedWeekChild, setSelectedWeekChild] = useState<(HortzettelData & { id: string; createdAt: Date }) | null>(null);
  const [showWeekOverview, setShowWeekOverview] = useState(false);

  // Stats visibility toggle
  const [showStats, setShowStats] = useState(true);
  
  useEffect(() => {
    const loadInitial = async () => {
      try {
        await loadHortzettel();
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
    loadAnnouncements();
    
    const handleSettingsUpdate = () => {
      console.log('[HortnerDashboard] Settings updated, reloading hortzettel...');
      loadHortzettel();
      toast.success('Einstellungen aktualisiert!', { duration: 2000 });
    };
    
    window.addEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
  }, []);

  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      console.log('[HortnerDashboard] Auto-refreshing hortzettel...');
      loadHortzettel(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, allHortzettel.length]);

  const loadAnnouncements = async () => {
    try {
      const response = await api.getAnnouncements();
      setAnnouncements(response.announcements);
    } catch (error) {
      console.error('Fehler beim Laden der Mitteilungen:', error);
      toast.error('Fehler beim Laden der Mitteilungen');
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.message) {
      toast.error('Bitte Titel und Nachricht eingeben');
      return;
    }

    try {
      await api.createAnnouncement(
        newAnnouncement.title,
        newAnnouncement.message,
        newAnnouncement.type,
        `Hortner ${getKlasseLabel(klasse)}`
      );
      toast.success('Mitteilung erfolgreich erstellt');
      setNewAnnouncement({ title: "", message: "", type: "info" });
      loadAnnouncements();
    } catch (error) {
      console.error('Fehler beim Erstellen der Mitteilung:', error);
      toast.error('Fehler beim Erstellen der Mitteilung');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Möchten Sie diese Mitteilung wirklich löschen?')) {
      return;
    }

    try {
      await api.deleteAnnouncement(id);
      toast.success('Mitteilung gelöscht');
      loadAnnouncements();
    } catch (error) {
      console.error('Fehler beim Löschen der Mitteilung:', error);
      toast.error('Fehler beim Löschen der Mitteilung');
    }
  };

  const handleArchiveOldHortzettel = async () => {
    if (!confirm('Möchten Sie wirklich alte Hortzettel archivieren?\n\nNur vollständig vergangene Wochen werden archiviert.')) {
      return;
    }

    try {
      const response = await api.autoArchiveOldHortzettel();
      if (response.archivedCount > 0) {
        toast.success(`🗃️ ${response.archivedCount} Hortzettel archiviert`, { duration: 5000 });
        await loadHortzettel();
      } else {
        toast.info('Keine alten Hortzettel zum Archivieren gefunden');
      }
    } catch (error) {
      console.error('Fehler beim Archivieren:', error);
      toast.error('Fehler beim Archivieren');
    }
  };

  const loadHortzettel = async (isAutoRefresh = false) => {
    try {
      const response = await api.getHortnerHortzettel();
      const hortzettel = response.hortzettel.map(h => ({
        ...h,
        createdAt: new Date(h.createdAt)
      }));
      
      if (isAutoRefresh && hortzettel.length > allHortzettel.length) {
        const newCount = hortzettel.length - allHortzettel.length;
        toast.success(`${newCount} neue${newCount === 1 ? 'r' : ''} Hortzettel verfügbar!`, {
          duration: 4000,
        });
      }
      
      setAllHortzettel(hortzettel);
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error('Error loading hortzettel:', error);
      if (!isAutoRefresh) {
        toast.error('Fehler beim Laden der Hortzettel');
      }
    }
  };

  const getKlasseLabel = (klasseKey: string) => {
    const labels: Record<string, string> = {
      "hort-1": "Hort 1",
      "hort-2": "Hort 2",
      "hort-3": "Hort 3",
      "hort-4": "Hort 4",
    };
    return labels[klasseKey] || klasseKey;
  };

  const availableHortgruppen = [...new Set(allHortzettel.map(h => h.class).filter(Boolean))].sort();
  
  const isMatchingClass = (classValue: string | undefined) => {
    if (!classValue) return false;
    if (selectedHortgruppe === "alle") return true;
    const selectedNum = selectedHortgruppe.replace("Hort ", "");
    return classValue === selectedNum || classValue === selectedHortgruppe;
  };

  const filteredHortzettel = allHortzettel.filter((h) => {
    if (!isMatchingClass(h.class)) return false;
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      h.childName.toLowerCase().includes(searchLower) ||
      h.class.toLowerCase().includes(searchLower);
    if (!matchesSearch) return false;
    
    if (weekFilter === "aktiv") {
      if (h.status === "archiviert") return false;
    } else if (weekFilter === "archiv") {
      if (h.status !== "archiviert") return false;
    }
    
    return true;
  });

  const activeCount = allHortzettel.filter(h => 
    isMatchingClass(h.class) && 
    (!h.status || h.status === "aktiv")
  ).length;
  
  const archivedCount = allHortzettel.filter(h => 
    isMatchingClass(h.class) && 
    h.status === "archiviert"
  ).length;

  const unreadAnnouncements = announcements.filter(a => !a.readBy?.includes(klasse)).length;

  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return 'Unbekanntes Datum';
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Ungültiges Datum';
    
    return dateObj.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeLabel = (value: string, otherValue?: string) => {
    const labels: Record<string, string> = {
      "nach-unterricht": "Nach Unterricht",
      "nach-mittagessen": "Nach Essen",
      "mittagsbus": "Mittagsbus",
      "nachmittagsbus": "Nachmittagsbus",
      "14:00": "14:00",
      "15:00": "15:00",
      "16:00": "16:00+",
      "krank": "Krank",
      "feiertag": "Feiertag",
      "sonstiges": otherValue || "Sonstiges",
    };
    
    if (value.includes(',')) {
      const values = value.split(',').map(v => v.trim()).filter(v => v);
      const labelParts = values.map(v => labels[v] || v).join(', ');
      return otherValue && !value.includes('sonstiges') 
        ? `${labelParts} (${otherValue})` 
        : labelParts;
    }
    
    const baseLabel = labels[value] || value;
    return otherValue && value !== 'sonstiges' 
      ? `${baseLabel} (${otherValue})` 
      : baseLabel;
  };

  if (showPrintView) {
    return (
      <HortzettelPrintView
        hortzettel={filteredHortzettel}
        onClose={() => setShowPrintView(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Top Navigation Bar */}
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Hort Dashboard</h1>
                  <p className="text-xs text-slate-500">Hort Auma</p>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadHortzettel()}
                className="text-slate-600 dark:text-slate-400"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Aktualisieren
              </Button>

              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setShowPrintView(true)}>
                    <Printer className="h-4 w-4 mr-2" />
                    Drucken
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleArchiveOldHortzettel}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archivieren
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowHelpDialog(true)}>
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Hilfe
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Abmelden
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        {/* Stats Cards */}
        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Aktive Hortzettel</p>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">{activeCount}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-500" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Archiviert</p>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">{archivedCount}</p>
                </div>
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                  <Archive className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Mitteilungen</p>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">{announcements.length}</p>
                  {unreadAnnouncements > 0 && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{unreadAnnouncements} ungelesen</p>
                  )}
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Bell className="h-6 w-6 text-blue-600 dark:text-blue-500" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Letzte Aktualisierung</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                    {lastUpdateTime.toLocaleTimeString("de-DE", { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Auto-Refresh {autoRefreshEnabled ? "aktiv" : "inaktiv"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-purple-600 dark:text-purple-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as "hortzettel" | "announcements")} className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <TabsList className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1">
              <TabsTrigger value="hortzettel" className="gap-2">
                <FileText className="h-4 w-4" />
                Hortzettel
              </TabsTrigger>
              <TabsTrigger value="announcements" className="gap-2">
                <Bell className="h-4 w-4" />
                Mitteilungen
                {unreadAnnouncements > 0 && (
                  <Badge variant="destructive" className="ml-1">{unreadAnnouncements}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              className="flex items-center gap-2"
            >
              {showStats ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showStats ? "Statistiken ausblenden" : "Statistiken anzeigen"}
            </Button>
          </div>

          {/* Hortzettel Tab */}
          <TabsContent value="hortzettel" className="space-y-4">
            {/* Toolbar */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex items-center gap-3 flex-wrap">
                  <Select value={selectedHortgruppe} onValueChange={setSelectedHortgruppe}>
                    <SelectTrigger className="w-[180px]">
                      <Users className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle Hortgruppen</SelectItem>
                      {availableHortgruppen.map((gruppe) => (
                        <SelectItem key={gruppe} value={gruppe}>{gruppe}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={weekFilter} onValueChange={(value: "aktiv" | "archiv" | "alle") => setWeekFilter(value)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aktiv">Aktiv</SelectItem>
                      <SelectItem value="archiv">Archiv</SelectItem>
                      <SelectItem value="alle">Alle</SelectItem>
                    </SelectContent>
                  </Select>

                  <Badge variant="outline" className="text-sm">
                    {filteredHortzettel.length} Einträge
                  </Badge>
                </div>

                <div className="relative w-full lg:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Kind oder Klasse suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Hortzettel Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  <p className="text-slate-500 mt-4">Lädt Hortzettel...</p>
                </div>
              ) : filteredHortzettel.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Keine Hortzettel gefunden</h3>
                  <p className="text-slate-500">Versuchen Sie andere Filter oder Suchbegriffe</p>
                </div>
              ) : (
                <>
                  {/* Mobile Card View (< lg) */}
                  <div className="lg:hidden divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredHortzettel.map((hortzettel) => (
                      <div
                        key={hortzettel.id}
                        className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="flex-1 cursor-pointer"
                                onClick={() => {
                                  setSelectedWeekChild(hortzettel);
                                  setShowWeekOverview(true);
                                }}
                              >
                                <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                                  {hortzettel.childName}
                                </h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                  Klasse {hortzettel.class}
                                </p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-xs">Klicken für Wochenübersicht</p>
                            </TooltipContent>
                          </Tooltip>
                          <Badge
                            variant={hortzettel.canGoHomeAlone ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {hortzettel.canGoHomeAlone ? "✓ Allein" : "✗ Abholung"}
                          </Badge>
                        </div>

                        {/* Week Schedule */}
                        <div className="space-y-2">
                          {/* Montag */}
                          <div className="flex items-start gap-3">
                            <div className="flex items-center gap-2 min-w-[90px]">
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Montag</span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 flex-1">
                              {getTimeLabel(hortzettel.monday, hortzettel.mondayOther)}
                            </p>
                          </div>

                          {/* Dienstag */}
                          <div className="flex items-start gap-3">
                            <div className="flex items-center gap-2 min-w-[90px]">
                              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Dienstag</span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 flex-1">
                              {getTimeLabel(hortzettel.tuesday, hortzettel.tuesdayOther)}
                            </p>
                          </div>

                          {/* Mittwoch */}
                          <div className="flex items-start gap-3">
                            <div className="flex items-center gap-2 min-w-[90px]">
                              <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mittwoch</span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 flex-1">
                              {getTimeLabel(hortzettel.wednesday, hortzettel.wednesdayOther)}
                            </p>
                          </div>

                          {/* Donnerstag */}
                          <div className="flex items-start gap-3">
                            <div className="flex items-center gap-2 min-w-[90px]">
                              <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Donnerstag</span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 flex-1">
                              {getTimeLabel(hortzettel.thursday, hortzettel.thursdayOther)}
                            </p>
                          </div>

                          {/* Freitag */}
                          <div className="flex items-start gap-3">
                            <div className="flex items-center gap-2 min-w-[90px]">
                              <div className="w-2 h-2 bg-pink-500 rounded-full flex-shrink-0"></div>
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Freitag</span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 flex-1">
                              {getTimeLabel(hortzettel.friday, hortzettel.fridayOther)}
                            </p>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                          <span className="text-xs text-slate-500">
                            {formatDate(hortzettel.createdAt)}
                          </span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedChild(hortzettel);
                                  setShowChildInfo(true);
                                }}
                                className="text-blue-600 dark:text-blue-400"
                              >
                                <Info className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Details anzeigen</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View (>= lg) */}
                  <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-900/50 border-b-2 border-slate-200 dark:border-slate-700">
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Kind</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Allein heim</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Montag
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Dienstag
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            Mittwoch
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            Donnerstag
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                            Freitag
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHortzettel.map((hortzettel, index) => (
                        <TableRow 
                          key={hortzettel.id} 
                          className={`
                            transition-all duration-150
                            ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/50'}
                            hover:bg-blue-50 dark:hover:bg-blue-900/10
                            hover:shadow-md hover:scale-[1.01]
                            border-b border-slate-100 dark:border-slate-700/50
                          `}
                        >
                          <TableCell className="py-4">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className="cursor-pointer"
                                  onClick={() => {
                                    setSelectedWeekChild(hortzettel);
                                    setShowWeekOverview(true);
                                  }}
                                >
                                  <p className="font-semibold text-slate-900 dark:text-white text-base">
                                    {hortzettel.childName}
                                  </p>
                                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                    Klasse {hortzettel.class}
                                  </p>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs">
                                <p className="text-xs">Klicken für Wochenübersicht</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge 
                              variant={hortzettel.canGoHomeAlone ? "default" : "secondary"} 
                              className="font-normal text-xs"
                            >
                              {hortzettel.canGoHomeAlone ? "✓ Ja" : "✗ Nein"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-normal break-words max-w-xs">
                              {getTimeLabel(hortzettel.monday, hortzettel.mondayOther)}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-normal break-words max-w-xs">
                              {getTimeLabel(hortzettel.tuesday, hortzettel.tuesdayOther)}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-normal break-words max-w-xs">
                              {getTimeLabel(hortzettel.wednesday, hortzettel.wednesdayOther)}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-normal break-words max-w-xs">
                              {getTimeLabel(hortzettel.thursday, hortzettel.thursdayOther)}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-normal break-words max-w-xs">
                              {getTimeLabel(hortzettel.friday, hortzettel.fridayOther)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-4">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedChild(hortzettel);
                                    setShowChildInfo(true);
                                  }}
                                  className="hover:bg-blue-100 dark:hover:bg-blue-900/20"
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p className="text-xs">Details anzeigen</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="space-y-4">
            {/* Create Announcement */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Neue Mitteilung erstellen</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Titel</Label>
                  <Input
                    id="title"
                    placeholder="z.B. Wichtige Information"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="message">Nachricht</Label>
                  <Textarea
                    id="message"
                    placeholder="Ihre Nachricht an die Eltern..."
                    value={newAnnouncement.message}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Label htmlFor="type">Typ</Label>
                    <Select
                      value={newAnnouncement.type}
                      onValueChange={(value: "info" | "warning" | "urgent") => 
                        setNewAnnouncement({ ...newAnnouncement, type: value })
                      }
                    >
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">📘 Information</SelectItem>
                        <SelectItem value="warning">⚠️ Warnung</SelectItem>
                        <SelectItem value="urgent">🚨 Dringend</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateAnnouncement} className="mt-6">
                    <Plus className="h-4 w-4 mr-2" />
                    Mitteilung erstellen
                  </Button>
                </div>
              </div>
            </div>

            {/* Announcements List */}
            {announcementsLoading ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                <p className="text-slate-500 mt-4">Lädt Mitteilungen...</p>
              </div>
            ) : announcements.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                <Bell className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Keine Mitteilungen vorhanden</h3>
                <p className="text-slate-500">Erstellen Sie Ihre erste Mitteilung oben</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {announcement.title}
                          </h4>
                          <Badge
                            variant={
                              announcement.type === "urgent" ? "destructive" :
                              announcement.type === "warning" ? "default" : "secondary"
                            }
                          >
                            {announcement.type === "urgent" ? "🚨 Dringend" :
                             announcement.type === "warning" ? "⚠️ Warnung" : "📘 Info"}
                          </Badge>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mb-3">
                          {announcement.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Von {announcement.author}</span>
                          <span>•</span>
                          <span>{formatDate(announcement.createdAt)}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Kind-Info Dialog */}
      <Dialog open={showChildInfo} onOpenChange={setShowChildInfo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kind-Details</DialogTitle>
            <DialogDescription>
              Detaillierte Informationen zum Kind
            </DialogDescription>
          </DialogHeader>
          {selectedChild && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium text-slate-500 uppercase">Name</Label>
                <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1">{selectedChild.childName}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500 uppercase">Hortgruppe</Label>
                <p className="text-slate-900 dark:text-white mt-1">{selectedChild.class}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500 uppercase">Kann allein nach Hause</Label>
                <Badge variant={selectedChild.canGoHomeAlone ? "default" : "secondary"} className="mt-1">
                  {selectedChild.canGoHomeAlone ? "Ja" : "Nein"}
                </Badge>
              </div>
              {selectedChild.emergencyContact && (
                <div>
                  <Label className="text-xs font-medium text-slate-500 uppercase">Notfallkontakt</Label>
                  <p className="text-slate-900 dark:text-white mt-1">{selectedChild.emergencyContact}</p>
                </div>
              )}
              {selectedChild.notes && (
                <div>
                  <Label className="text-xs font-medium text-slate-500 uppercase">Notizen</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedChild.notes}</p>
                </div>
              )}
              <div className="pt-2">
                <Label className="text-xs font-medium text-slate-500 uppercase">Erstellt am</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{formatDate(selectedChild.createdAt)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hilfe Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Hilfe & Anleitung</DialogTitle>
            <DialogDescription>
              So nutzen Sie das Hortner-Dashboard effektiv
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Hortzettel-Ansicht
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Zeigt alle Hortzettel der ausgewählten Hortgruppe. Filtern Sie nach aktiven oder archivierten Zetteln und nutzen Sie die Suchfunktion.
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-2 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Mitteilungen
              </h4>
              <p className="text-sm text-purple-800 dark:text-purple-300">
                Erstellen Sie wichtige Mitteilungen für Eltern. Diese werden im Eltern-Dashboard mit Benachrichtigung angezeigt.
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2 flex items-center gap-2">
                <Archive className="h-4 w-4" />
                Archivierung
              </h4>
              <p className="text-sm text-green-800 dark:text-green-300">
                Alte Hortzettel aus vergangenen Wochen werden automatisch archiviert. Nutzen Sie den Archivieren-Button für manuelle Archivierung.
              </p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
              <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-2 flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Auto-Aktualisierung
              </h4>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Die Ansicht wird automatisch alle 30 Sekunden aktualisiert, um neue Hortzettel anzuzeigen. Sie erhalten eine Benachrichtigung bei neuen Einträgen.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Day Detail Dialog */}
      <Dialog open={showDayInfo} onOpenChange={setShowDayInfo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tag-Details</DialogTitle>
            <DialogDescription>
              Detaillierte Informationen zum Tag
            </DialogDescription>
          </DialogHeader>
          {selectedDayInfo && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium text-slate-500 uppercase">Name</Label>
                <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1">{selectedDayInfo.childName}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500 uppercase">Tag</Label>
                <p className="text-slate-900 dark:text-white mt-1">{selectedDayInfo.day}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500 uppercase">Zeit</Label>
                <p className="text-slate-900 dark:text-white mt-1">{selectedDayInfo.time}</p>
              </div>
              {selectedDayInfo.notes && (
                <div>
                  <Label className="text-xs font-medium text-slate-500 uppercase">Notizen</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedDayInfo.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Week Overview Dialog */}
      <Dialog open={showWeekOverview} onOpenChange={setShowWeekOverview}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Wochen-Übersicht</DialogTitle>
            <DialogDescription>
              Komplette Woche für {selectedWeekChild?.childName}
            </DialogDescription>
          </DialogHeader>
          {selectedWeekChild && (
            <div className="space-y-6">
              {/* Kind-Info */}
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-slate-500 uppercase">Name</Label>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1">{selectedWeekChild.childName}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-500 uppercase">Hortgruppe</Label>
                    <p className="text-slate-900 dark:text-white mt-1">{selectedWeekChild.class}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-500 uppercase">Kann allein heim</Label>
                    <Badge variant={selectedWeekChild.canGoHomeAlone ? "default" : "secondary"} className="mt-1">
                      {selectedWeekChild.canGoHomeAlone ? "Ja" : "Nein"}
                    </Badge>
                  </div>
                  {selectedWeekChild.emergencyContact && (
                    <div>
                      <Label className="text-xs font-medium text-slate-500 uppercase">Notfallkontakt</Label>
                      <p className="text-sm text-slate-900 dark:text-white mt-1">{selectedWeekChild.emergencyContact}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Wochenplan */}
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Wochenplan</h4>
                <div className="space-y-3">
                  {/* Montag */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <Label className="text-sm font-semibold text-slate-900 dark:text-white">Montag</Label>
                        </div>
                        <p className="text-base text-slate-900 dark:text-white">
                          {getTimeLabel(selectedWeekChild.monday, selectedWeekChild.mondayOther)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dienstag */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          <Label className="text-sm font-semibold text-slate-900 dark:text-white">Dienstag</Label>
                        </div>
                        <p className="text-base text-slate-900 dark:text-white">
                          {getTimeLabel(selectedWeekChild.tuesday, selectedWeekChild.tuesdayOther)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mittwoch */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                          <Label className="text-sm font-semibold text-slate-900 dark:text-white">Mittwoch</Label>
                        </div>
                        <p className="text-base text-slate-900 dark:text-white">
                          {getTimeLabel(selectedWeekChild.wednesday, selectedWeekChild.wednesdayOther)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Donnerstag */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                          <Label className="text-sm font-semibold text-slate-900 dark:text-white">Donnerstag</Label>
                        </div>
                        <p className="text-base text-slate-900 dark:text-white">
                          {getTimeLabel(selectedWeekChild.thursday, selectedWeekChild.thursdayOther)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Freitag */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
                          <Label className="text-sm font-semibold text-slate-900 dark:text-white">Freitag</Label>
                        </div>
                        <p className="text-base text-slate-900 dark:text-white">
                          {getTimeLabel(selectedWeekChild.friday, selectedWeekChild.fridayOther)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notizen */}
              {selectedWeekChild.notes && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                  <Label className="text-xs font-medium text-amber-900 dark:text-amber-200 uppercase">Wichtige Notizen</Label>
                  <p className="text-sm text-amber-900 dark:text-amber-100 mt-2">{selectedWeekChild.notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500">
                  Erstellt am {formatDate(selectedWeekChild.createdAt)}
                </p>
                <Button onClick={() => setShowWeekOverview(false)}>
                  Schließen
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}