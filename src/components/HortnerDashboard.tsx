import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Shield, LogOut, DoorOpen, FileText, Search, Filter, Users, Phone, AlertCircle, Heart, Info, Plus, Trash2, AlertTriangle, Bell, Archive, Calendar, Maximize2, Minimize2, X, ChevronDown, Menu, MoreVertical, GripVertical, ChevronRight, ExternalLink, HelpCircle } from "lucide-react";
import type { HortzettelData, Announcement } from "../types/hortzettel";
import { api } from "../utils/api";
import { toast } from "sonner@2.0.3";
import { ThemeToggle } from "./ThemeToggle";
import { HortzettelPrintView } from "./HortzettelPrintView";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const schoolImage = "https://images.unsplash.com/photo-1665270695165-93b5798522ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnZXJtYW4lMjBlbGVtZW50YXJ5JTIwc2Nob29sJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzYxNjkwNjQyfDA&ixlib=rb-4.1.0&q=80&w=1080";
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
import { Label } from "./ui/label";

interface HortnerDashboardProps {
  klasse: string;
  allHortzettel: (HortzettelData & { id: string; createdAt: Date })[];
  onLogout: () => void;
  onToggleDesign?: (useModern: boolean) => void;
}

export default function HortnerDashboard({ 
  klasse, 
  allHortzettel: initialHortzettel, 
  onLogout,
  onToggleDesign
}: HortnerDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [klassenFilter, setKlassenFilter] = useState("alle");
  const [weekFilter, setWeekFilter] = useState<"aktiv" | "archiv" | "alle">("aktiv");
  const [allHortzettel, setAllHortzettel] = useState(initialHortzettel);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<(HortzettelData & { id: string; createdAt: Date }) | null>(null);
  const [showChildInfo, setShowChildInfo] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"hortzettel" | "announcements">("hortzettel");
  const [announcementTypeFilter, setAnnouncementTypeFilter] = useState<"alle" | "info" | "warning" | "urgent">("alle");
  
  // Column widths state for main table
  const [columnWidths, setColumnWidths] = useState({
    name: 200,
    canGoHome: 180,
    monday: 150,
    tuesday: 150,
    wednesday: 150,
    thursday: 150,
    friday: 150,
  });
  
  // Column widths state for fullscreen table
  const [fullscreenColumnWidths, setFullscreenColumnWidths] = useState({
    name: 200,
    canGoHome: 160,
    monday: 160,
    tuesday: 160,
    wednesday: 160,
    thursday: 160,
    friday: 160,
  });
  
  // Collapsible state for stats cards
  const [activeZettelOpen, setActiveZettelOpen] = useState(false);
  const [archiviertOpen, setArchiviertOpen] = useState(false);
  const [klassenOpen, setKlassenOpen] = useState(false);
  const [mitteilungenOpen, setMitteilungenOpen] = useState(false);
  
  // Announcement state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "warning" | "urgent",
  });

  // Load all hortzettel for hortner on mount
  useEffect(() => {
    const loadInitial = async () => {
      try {
        await loadHortzettel();
        // Check for auto-archiving after loading
        await checkAndAutoArchive();
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
    loadAnnouncements();
    
    // Listen for settings updates from AdminDashboard
    const handleSettingsUpdate = () => {
      console.log('[HortnerDashboard] Settings updated, reloading hortzettel...');
      loadHortzettel();
      // Show visual feedback
      toast.success('Einstellungen aktualisiert!', { duration: 2000 });
    };
    
    window.addEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
  }, []);

  // Auto-refresh hortzettel every 30 seconds
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      console.log('[HortnerDashboard] Auto-refreshing hortzettel...');
      loadHortzettel(true);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, allHortzettel.length]);

  // Check for auto-archiving every 6 hours
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('[HortnerDashboard] Checking for auto-archiving...');
      checkAndAutoArchive();
    }, 6 * 60 * 60 * 1000); // 6 hours

    return () => clearInterval(interval);
  }, []);

  // Handle orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

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

  const handleArchiveWeek = async () => {
    if (!confirm('Möchten Sie wirklich alle abgeschlossenen Schulwochen archivieren?\n\nNur vollständig vergangene Wochen (Montag-Freitag) werden archiviert.\nDie aktuelle Woche bleibt aktiv.')) {
      return;
    }

    try {
      const response = await api.archiveCurrentWeek();
      toast.success(response.message, { duration: 5000 });
      loadHortzettel();
    } catch (error) {
      console.error('Fehler beim Archivieren:', error);
      toast.error('Fehler beim Archivieren');
    }
  };

  // Automatic archiving - archives all Hortzettel from past weeks
  const checkAndAutoArchive = async () => {
    try {
      console.log('[HortnerDashboard] Führe automatische Archivierung durch...');
      
      // Call the new auto-archive API that archives all old Hortzettel
      const response = await api.autoArchiveOldHortzettel();
      
      if (response.archivedCount > 0) {
        console.log(`[HortnerDashboard] ${response.archivedCount} alte Hortzettel wurden archiviert`);
        toast.success(
          `🗃️ ${response.archivedCount} Hortzettel aus vergangenen Wochen wurden archiviert`,
          { duration: 5000 }
        );
        
        // Reload hortzettel to show updated status
        await loadHortzettel();
      } else {
        console.log('[HortnerDashboard] Keine alten Hortzettel zum Archivieren gefunden');
      }
    } catch (error) {
      console.error('[HortnerDashboard] Fehler bei Auto-Archivierung:', error);
      // Silent fail - don't show error toast for automatic operation
    }
  };

  const loadHortzettel = async (isAutoRefresh = false) => {
    try {
      console.log('[FRONTEND] Lade Hortzettel vom Backend...');
      const response = await api.getHortnerHortzettel();
      console.log('[FRONTEND] Response vom Backend:', response);
      console.log('[FRONTEND] Anzahl Hortzettel:', response.hortzettel?.length || 0);
      
      const hortzettel = response.hortzettel.map(h => ({
        ...h,
        createdAt: new Date(h.createdAt)
      }));
      
      console.log('[FRONTEND] Verarbeitete Hortzettel:', hortzettel.length);
      hortzettel.forEach(h => {
        console.log(`[FRONTEND]   - ID: ${h.id}, Kind: ${h.childName}, Hortgruppe: "${h.class}", Status: ${h.status || 'aktiv'}`);
      });
      
      // Check if there are new hortzettel
      if (isAutoRefresh && hortzettel.length > allHortzettel.length) {
        const newCount = hortzettel.length - allHortzettel.length;
        toast.success(`${newCount} neue${newCount === 1 ? 'r' : ''} Hortzettel verfügbar!`, {
          duration: 4000,
        });
      }
      
      setAllHortzettel(hortzettel);
      setLastUpdateTime(new Date());
      console.log('[FRONTEND] Hortzettel erfolgreich geladen und State aktualisiert');
    } catch (error) {
      console.error('[FRONTEND] ❌ Error loading hortzettel:', error);
      if (!isAutoRefresh) {
        toast.error('Fehler beim Laden der Hortzettel');
      }
    }
  };

  const toggleFullScreen = async () => {
    try {
      if (!isFullScreen) {
        // Enter fullscreen
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        }
        
        // Request landscape orientation
        if (screen.orientation && screen.orientation.lock) {
          try {
            await screen.orientation.lock('landscape');
            console.log('Orientation locked to landscape');
            toast.success('Vollbildmodus aktiviert - Gerät im Querformat halten');
          } catch (err) {
            console.warn('Orientation lock not supported or failed:', err);
            toast.info('Vollbildmodus aktiviert - Bitte Gerät ins Querformat drehen');
          }
        } else {
          toast.info('Vollbildmodus aktiviert - Bitte Gerät ins Querformat drehen');
        }
        
        setIsFullScreen(true);
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        
        // Unlock orientation
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
          console.log('Orientation unlocked');
        }
        
        setIsFullScreen(false);
        toast.info('Vollbildmodus beendet');
      }
    } catch (err) {
      console.error('Fullscreen toggle failed:', err);
      toast.error('Vollbild konnte nicht aktiviert werden');
    }
  };

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      
      if (!isCurrentlyFullscreen && isFullScreen) {
        // User exited fullscreen manually (e.g., pressing ESC)
        setIsFullScreen(false);
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isFullScreen]);

  const getKlasseLabel = (klasseKey: string) => {
    const labels: Record<string, string> = {
      "hort-1": "Hort 1",
      "hort-2": "Hort 2",
      "hort-3": "Hort 3",
      "hort-4": "Hort 4",
    };
    return labels[klasseKey] || klasseKey;
  };

  // Bestimme welche Hortgruppe dieser Hortner sehen darf
  const hortNum = klasse?.split("-")[1]; // "hort-1" -> "1"
  const visibleHortgruppe = hortNum ? `Hort ${hortNum}` : klasse || "Hort (nicht definiert)"; // "Hort 1"
  
  // Helper function to check if a class value matches this Hortner's group
  const isMatchingClass = (classValue: string | undefined) => {
    if (!classValue) return false;
    // Match both "1" and "Hort 1" formats
    return classValue === hortNum || classValue === visibleHortgruppe;
  };

  // Debug logging - zeigt genau, welche Hortzettel geladen wurden
  useEffect(() => {
    console.log('=== [HortnerDashboard] Filter Debug ===');
    console.log('Hortner-Gruppe:', klasse);
    console.log('Hortnummer:', hortNum);
    console.log('Sichtbare Hortgruppe:', visibleHortgruppe);
    console.log('Gesamt Hortzettel:', allHortzettel.length);
    console.log('Hortzettel-Details:');
    allHortzettel.forEach(h => {
      const matches = isMatchingClass(h.class) ? '✅ MATCH' : '❌ NO MATCH';
      console.log(`  - ${matches} ID: ${h.id}, Kind: ${h.childName}, Hortgruppe: "${h.class}", Status: ${h.status || 'aktiv'}`);
    });
    console.log('Eindeutige Hortgruppen:', [...new Set(allHortzettel.map(h => h.class))]);
    console.log('=======================================');
  }, [allHortzettel, klasse]);

  // Filtere Hortzettel nach Hortgruppe
  const filteredHortzettel = allHortzettel.filter((h) => {
    // 1. Hortgruppen-Filter: h.class muss der Hortgruppe entsprechen (flexibel: "1" oder "Hort 1")
    if (!isMatchingClass(h.class)) {
      return false;
    }
    
    // 2. Suchfilter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      h.childName.toLowerCase().includes(searchLower) ||
      h.class.toLowerCase().includes(searchLower);
    if (!matchesSearch) {
      return false;
    }
    
    // 3. Wochenfilter (aktiv/archiviert)
    if (weekFilter === "aktiv") {
      if (h.status === "archiviert") return false;
    } else if (weekFilter === "archiv") {
      if (h.status !== "archiviert") return false;
    }
    
    return true;
  });

  // Zähle aktive und archivierte Hortzettel
  const activeCount = allHortzettel.filter(h => 
    isMatchingClass(h.class) && 
    (!h.status || h.status === "aktiv")
  ).length;
  
  const archivedCount = allHortzettel.filter(h => 
    isMatchingClass(h.class) && 
    h.status === "archiviert"
  ).length;

  const scrollToTabs = () => {
    const tabsElement = document.getElementById('tabs-content');
    if (tabsElement) {
      setTimeout(() => {
        tabsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) {
      return 'Unbekanntes Datum';
    }
    
    const dateObj = new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Ungültiges Datum';
    }
    
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
    
    // Handle comma-separated values (multiple selections)
    if (value.includes(',')) {
      const values = value.split(',').map(v => v.trim()).filter(v => v);
      const labelParts = values.map(v => labels[v] || v).join(', ');
      // Add additional note if provided and not just "sonstiges"
      return otherValue && !value.includes('sonstiges') 
        ? `${labelParts} (${otherValue})` 
        : labelParts;
    }
    
    const baseLabel = labels[value] || value;
    // Add additional note if provided and not "sonstiges"
    return otherValue && value !== 'sonstiges' 
      ? `${baseLabel} (${otherValue})` 
      : baseLabel;
  };

  const getDayCellColor = (editCount: number = 0) => {
    if (editCount === 0) return "";
    
    const colors = [
      "", // 0 - Original (keine Farbe)
      "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 font-semibold dark:text-red-100", // 1 - Erste Änderung
      "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 font-semibold dark:text-orange-100", // 2 - Zweite Änderung
      "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 font-semibold dark:text-yellow-100", // 3 - Dritte Änderung
      "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 font-semibold dark:text-green-100", // 4+ - Weitere Änderungen
    ];
    return colors[Math.min(editCount, 4)] || colors[4];
  };

  const formatWeekLabel = (weekNumber?: number, year?: number) => {
    if (!weekNumber || !year) return "Alte Version";
    return `KW ${weekNumber}, ${year}`;
  };

  // Show print view if requested
  if (showPrintView) {
    return (
      <HortzettelPrintView
        hortzettel={filteredHortzettel}
        onClose={() => setShowPrintView(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors">
      {/* Header with School Image */}
      <header className="relative overflow-hidden border-b border-white/20 dark:border-slate-700/20 shadow-lg">
        {/* Background Image */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${schoolImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/95 via-indigo-500/90 to-purple-500/95 dark:from-slate-900/95 dark:via-slate-800/90 dark:to-slate-900/95 backdrop-blur-sm transition-colors" />
        </div>
        
        {/* Content */}
        <div className="relative container mx-auto px-[20px] py-[0px] pt-[0px] pr-[25px] pb-[0px] pl-[30px] my-[0px] mx-[0px] my-[10px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/20">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-white text-xl mx-[30px] text-center font-bold text-[20px] py-[0px] pt-[0px] pr-[35px] pb-[0px] pl-[75px] my-[0px]">{visibleHortgruppe}</h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setShowHelpDialog(true)}
                className="bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 text-white border-white/30 backdrop-blur-md transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
              <ThemeToggle />
              <Button 
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 text-red-600 border-white/30 backdrop-blur-md transition-colors"
              >
                <DoorOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 py-4 dark:bg-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Kompakte Badge-Leiste - Stats */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-2.5">
            <div className="flex flex-wrap gap-2">
              {/* Aktive Zettel Badge */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all group">
                    <div className="w-7 h-7 bg-slate-600 dark:bg-slate-500 rounded flex items-center justify-center">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{activeCount}</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">Aktiv</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 group-hover:translate-y-0.5 transition-transform" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Aktive Hortzettel</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setActiveTab("hortzettel");
                      setWeekFilter("aktiv");
                      setKlassenFilter("alle");
                      scrollToTabs();
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2 text-green-600" />
                    Alle aktiven Zettel
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setActiveTab("hortzettel");
                      setWeekFilter("alle");
                      setKlassenFilter("alle");
                      scrollToTabs();
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2 text-gray-600" />
                    Inkl. Archiv anzeigen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Archiviert Badge */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all group">
                    <div className="w-7 h-7 bg-slate-600 dark:bg-slate-500 rounded flex items-center justify-center">
                      <Archive className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{archivedCount}</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">Archiv</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 group-hover:translate-y-0.5 transition-transform" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel>Archivierte Hortzettel</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md p-2 mx-2 my-2">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-800 dark:text-blue-300">
                        <strong>Auto-Archiv:</strong> Jeden Freitag 18:00 Uhr
                      </div>
                    </div>
                  </div>
                  <DropdownMenuItem
                    onClick={() => {
                      setActiveTab("hortzettel");
                      setWeekFilter("archiv");
                      setKlassenFilter("alle");
                      scrollToTabs();
                    }}
                  >
                    <Archive className="h-4 w-4 mr-2 text-gray-600" />
                    Archivierte Zettel
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setActiveTab("hortzettel");
                      setWeekFilter("alle");
                      setKlassenFilter("alle");
                      scrollToTabs();
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2 text-gray-600" />
                    Alle Zettel anzeigen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Hortgruppe Badge */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                <div className="w-7 h-7 bg-slate-600 dark:bg-slate-500 rounded flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{visibleHortgruppe}</span>
                </div>
              </div>

              {/* Mitteilungen Badge */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all group">
                    <div className="w-7 h-7 bg-slate-600 dark:bg-slate-500 rounded flex items-center justify-center">
                      <Bell className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{announcements.length}</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">News</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 group-hover:translate-y-0.5 transition-transform" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Mitteilungen</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setActiveTab("announcements");
                      setAnnouncementTypeFilter("alle");
                      scrollToTabs();
                    }}
                  >
                    <Bell className="h-4 w-4 mr-2 text-blue-600" />
                    Alle Mitteilungen
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setActiveTab("announcements");
                      setAnnouncementTypeFilter("info");
                      scrollToTabs();
                    }}
                  >
                    <Info className="h-4 w-4 mr-2 text-blue-500" />
                    Nur Informationen
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setActiveTab("announcements");
                      setAnnouncementTypeFilter("warning");
                      scrollToTabs();
                    }}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                    Nur Warnungen
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setActiveTab("announcements");
                      setAnnouncementTypeFilter("urgent");
                      scrollToTabs();
                    }}
                  >
                    <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                    Nur Dringende
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Auto-Refresh Control & Archive Button */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-2.5 transition-colors">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${autoRefreshEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                <div>
                  <p className="text-sm font-medium">Auto-Refresh {autoRefreshEnabled ? 'an' : 'aus'}</p>
                  <p className="text-xs text-muted-foreground">
                    {lastUpdateTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setAutoRefreshEnabled(!autoRefreshEnabled);
                    toast.success(autoRefreshEnabled ? 'Auto-Aktualisierung deaktiviert' : 'Auto-Aktualisierung aktiviert');
                  }}
                  variant={autoRefreshEnabled ? "default" : "outline"}
                  className="gap-1"
                  size="sm"
                >
                  <Bell className={`h-3.5 w-3.5 ${autoRefreshEnabled ? 'text-white' : 'text-gray-400'}`} />
                  {autoRefreshEnabled ? 'Aus' : 'An'}
                </Button>
                <Button
                  onClick={async () => {
                    toast.loading('Archiviere alte Hortzettel...', { id: 'archiving' });
                    await checkAndAutoArchive();
                    toast.dismiss('archiving');
                  }}
                  variant="outline"
                  className="gap-1"
                  size="sm"
                >
                  <Archive className="h-3.5 w-3.5" />
                  Alte archivieren
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "hortzettel" | "announcements")} className="w-full" id="tabs-content">
            <TabsList className="grid w-full grid-cols-2 h-auto p-1 gap-1 bg-white dark:bg-slate-800 md:h-10">
              <TabsTrigger value="hortzettel" className="flex-col gap-0.5 h-auto py-1.5 md:flex-row md:gap-1.5 md:h-8 md:py-0 data-[state=active]:bg-slate-600 data-[state=active]:text-white">
                <FileText className="h-4 w-4 md:h-3.5 md:w-3.5" />
                <span className="text-xs">Hortzettel</span>
              </TabsTrigger>
              <TabsTrigger value="announcements" className="flex-col gap-0.5 h-auto py-1.5 md:flex-row md:gap-1.5 md:h-8 md:py-0 data-[state=active]:bg-slate-600 data-[state=active]:text-white">
                <Bell className="h-4 w-4 md:h-3.5 md:w-3.5" />
                <span className="text-xs">Mitteilungen</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hortzettel" className="space-y-4 mt-3">
              {/* Filter & Search */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-3 transition-colors">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-600 dark:bg-slate-500 rounded-lg flex items-center justify-center">
                  <Filter className="h-4 w-4 text-white" />
                </div>
                <h3>Filter</h3>
                <div className="flex gap-1">
                  {weekFilter !== "alle" && (
                    <Badge variant="secondary" className="gap-1">
                      {weekFilter === "aktiv" ? <FileText className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
                      {weekFilter === "aktiv" ? "Aktive" : "Archiviert"}
                    </Badge>
                  )}

                </div>
              </div>
              <Button
                onClick={handleArchiveWeek}
                variant="outline"
                className="gap-1.5"
                size="sm"
              >
                <Archive className="h-3.5 w-3.5" />
                Woche abschließen
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Nach Name suchen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 h-9 bg-background/50"
                    />
                  </div>
                </div>
              </div>
              
              {/* Week Filter */}
              <div className="flex gap-2">
                <Button
                  variant={weekFilter === "aktiv" ? "default" : "outline"}
                  onClick={() => setWeekFilter("aktiv")}
                  className="flex-1"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Aktive Woche ({activeCount})
                </Button>
                <Button
                  variant={weekFilter === "archiv" ? "default" : "outline"}
                  onClick={() => setWeekFilter("archiv")}
                  className="flex-1"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archiv ({archivedCount})
                </Button>
                <Button
                  variant={weekFilter === "alle" ? "default" : "outline"}
                  onClick={() => setWeekFilter("alle")}
                  className="flex-1"
                >
                  Alle
                </Button>
              </div>
            </div>
          </div>

          {/* Hortzettel Liste */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 transition-colors px-[15px] px-[25px] py-[10px] py-[0px]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="mb-2">Eingereichte Hortzettel</h3>
                <p className="text-sm text-muted-foreground">
                  Übersicht aller Hortzettel für {visibleHortgruppe}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <GripVertical className="h-3 w-3" />
                  <span>Spaltenbreite per Drag & Drop anpassbar</span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 flex-shrink-0"
                  >
                    <Maximize2 className="h-4 w-4" />
                    <span className="hidden md:inline">Vollansicht</span>
                    <ChevronDown className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowPrintView(true)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Im aktuellen Tab öffnen
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsFullScreen(true)}>
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Vollbild-Modus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Lade Hortzettel...</p>
              </div>
            ) : filteredHortzettel.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? "Keine Hortzettel gefunden" 
                    : "Noch keine Hortzettel eingereicht"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/50 dark:to-amber-900/50">
                      <th 
                        className="font-bold text-foreground dark:text-orange-100 sticky left-0 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/50 dark:to-amber-900/50 z-10 p-4 text-left border-b-2 border-orange-200 dark:border-orange-800 relative group"
                        style={{ width: columnWidths.name }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="break-words">Name des Kindes</span>
                          <div 
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-orange-400 dark:hover:bg-orange-600 transition-colors flex items-center justify-center group-hover:w-2"
                            onMouseDown={(e) => {
                              const startX = e.clientX;
                              const startWidth = columnWidths.name;
                              
                              const handleMouseMove = (e: MouseEvent) => {
                                const newWidth = Math.max(100, startWidth + (e.clientX - startX));
                                setColumnWidths(prev => ({ ...prev, name: newWidth }));
                              };
                              
                              const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                              };
                              
                              document.addEventListener('mousemove', handleMouseMove);
                              document.addEventListener('mouseup', handleMouseUp);
                            }}
                          >
                            <GripVertical className="h-4 w-4 text-orange-400 dark:text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </th>
                      <th 
                        className="font-bold text-center text-foreground dark:text-orange-100 p-4 border-b-2 border-orange-200 dark:border-orange-800 relative group"
                        style={{ width: columnWidths.canGoHome }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex-1 break-words">Darf allein heim gehen?</span>
                          <div 
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-orange-400 dark:hover:bg-orange-600 transition-colors flex items-center justify-center group-hover:w-2"
                            onMouseDown={(e) => {
                              const startX = e.clientX;
                              const startWidth = columnWidths.canGoHome;
                              
                              const handleMouseMove = (e: MouseEvent) => {
                                const newWidth = Math.max(100, startWidth + (e.clientX - startX));
                                setColumnWidths(prev => ({ ...prev, canGoHome: newWidth }));
                              };
                              
                              const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                              };
                              
                              document.addEventListener('mousemove', handleMouseMove);
                              document.addEventListener('mouseup', handleMouseUp);
                            }}
                          >
                            <GripVertical className="h-4 w-4 text-orange-400 dark:text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </th>
                      {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const).map((day, index) => {
                        const dayLabels = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
                        return (
                          <th 
                            key={day}
                            className="font-bold text-center text-foreground dark:text-orange-100 p-4 border-b-2 border-orange-200 dark:border-orange-800 relative group"
                            style={{ width: columnWidths[day] }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex-1 break-words">{dayLabels[index]}</span>
                              <div 
                                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-orange-400 dark:hover:bg-orange-600 transition-colors flex items-center justify-center group-hover:w-2"
                                onMouseDown={(e) => {
                                  const startX = e.clientX;
                                  const startWidth = columnWidths[day];
                                  
                                  const handleMouseMove = (e: MouseEvent) => {
                                    const newWidth = Math.max(100, startWidth + (e.clientX - startX));
                                    setColumnWidths(prev => ({ ...prev, [day]: newWidth }));
                                  };
                                  
                                  const handleMouseUp = () => {
                                    document.removeEventListener('mousemove', handleMouseMove);
                                    document.removeEventListener('mouseup', handleMouseUp);
                                  };
                                  
                                  document.addEventListener('mousemove', handleMouseMove);
                                  document.addEventListener('mouseup', handleMouseUp);
                                }}
                              >
                                <GripVertical className="h-4 w-4 text-orange-400 dark:text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHortzettel.map((hortzettel) => {
                      const totalEdits = (hortzettel.mondayEdits || 0) + 
                                        (hortzettel.tuesdayEdits || 0) + 
                                        (hortzettel.wednesdayEdits || 0) + 
                                        (hortzettel.thursdayEdits || 0) + 
                                        (hortzettel.fridayEdits || 0);
                      
                      return (
                        <tr 
                          key={hortzettel.id} 
                          className="border-b bg-white dark:bg-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td 
                            className="sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-700 p-4"
                            style={{ width: columnWidths.name }}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold dark:text-gray-200 break-words">{hortzettel.childName}</span>
                                <Badge className="bg-orange-600 text-white text-xs">
                                  {hortzettel.class}
                                </Badge>
                                {hortzettel.status === "archiviert" ? (
                                  <Badge variant="outline" className="text-xs bg-gray-100">
                                    <Archive className="h-3 w-3 mr-1" />
                                    Archiv
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {formatWeekLabel(hortzettel.weekNumber, hortzettel.year)}
                                  </Badge>
                                )}
                                {totalEdits > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {totalEdits} {totalEdits === 1 ? 'Änderung' : 'Änderungen'}
                                  </Badge>
                                )}
                                {hortzettel.updatedAt && hortzettel.createdAt && new Date(hortzettel.updatedAt).getTime() > new Date(hortzettel.createdAt).getTime() + 1000 && (
                                  <Badge className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300 dark:border-orange-700">
                                    Bearbeitet
                                  </Badge>
                                )}
                                {hortzettel.childProfile && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => {
                                      setSelectedChild(hortzettel);
                                      setShowChildInfo(true);
                                    }}
                                  >
                                    <Info className="h-4 w-4 text-blue-600" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </td>
                          <td 
                            className="text-center border-r dark:text-gray-200 p-4"
                            style={{ width: columnWidths.canGoHome }}
                          >
                            <div className="text-sm break-words">
                              {hortzettel.canGoHomeAlone === "sonstiges" 
                                ? hortzettel.canGoHomeAloneOther 
                                : hortzettel.canGoHomeAloneOther && hortzettel.canGoHomeAlone
                                  ? `${hortzettel.canGoHomeAlone} (${hortzettel.canGoHomeAloneOther})`
                                  : hortzettel.canGoHomeAlone}
                            </div>
                          </td>
                          <td 
                            className={`text-center border-l p-4 ${getDayCellColor(hortzettel.mondayEdits || 0)}`}
                            style={{ width: columnWidths.monday }}
                          >
                            <div className="text-sm break-words">
                              {getTimeLabel(hortzettel.monday, hortzettel.mondayOther)}
                            </div>
                          </td>
                          <td 
                            className={`text-center border-l p-4 ${getDayCellColor(hortzettel.tuesdayEdits || 0)}`}
                            style={{ width: columnWidths.tuesday }}
                          >
                            <div className="text-sm break-words">
                              {getTimeLabel(hortzettel.tuesday, hortzettel.tuesdayOther)}
                            </div>
                          </td>
                          <td 
                            className={`text-center border-l p-4 ${getDayCellColor(hortzettel.wednesdayEdits || 0)}`}
                            style={{ width: columnWidths.wednesday }}
                          >
                            <div className="text-sm break-words">
                              {getTimeLabel(hortzettel.wednesday, hortzettel.wednesdayOther)}
                            </div>
                          </td>
                          <td 
                            className={`text-center border-l p-4 ${getDayCellColor(hortzettel.thursdayEdits || 0)}`}
                            style={{ width: columnWidths.thursday }}
                          >
                            <div className="text-sm break-words">
                              {getTimeLabel(hortzettel.thursday, hortzettel.thursdayOther)}
                            </div>
                          </td>
                          <td 
                            className={`text-center border-l p-4 ${getDayCellColor(hortzettel.fridayEdits || 0)}`}
                            style={{ width: columnWidths.friday }}
                          >
                            <div className="text-sm break-words">
                              {getTimeLabel(hortzettel.friday, hortzettel.fridayOther)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
            </TabsContent>

            <TabsContent value="announcements" className="space-y-6 mt-6">
              {/* Create New Announcement */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 p-6 transition-colors">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <h3>Neue Mitteilung erstellen</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Titel</Label>
                    <Input
                      id="title"
                      placeholder="z.B. Wichtiger Hinweis"
                      value={newAnnouncement.title}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Nachricht</Label>
                    <Textarea
                      id="message"
                      placeholder="Ihre Mitteilung an die Eltern..."
                      value={newAnnouncement.message}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                      rows={4}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Typ</Label>
                    <Select 
                      value={newAnnouncement.type} 
                      onValueChange={(value: "info" | "warning" | "urgent") => 
                        setNewAnnouncement({ ...newAnnouncement, type: value })
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-blue-600" />
                            Information
                          </div>
                        </SelectItem>
                        <SelectItem value="warning">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            Warnung
                          </div>
                        </SelectItem>
                        <SelectItem value="urgent">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            Dringend
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleCreateAnnouncement}
                    className="w-full"
                    disabled={!newAnnouncement.title || !newAnnouncement.message}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Mitteilung veröffentlichen
                  </Button>
                </div>
              </div>

              {/* Existing Announcements */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 p-6 transition-colors">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3>Aktuelle Mitteilungen</h3>
                    {announcementTypeFilter !== "alle" && (
                      <Badge variant="secondary" className="gap-1">
                        {announcementTypeFilter === "info" && <Info className="h-3 w-3" />}
                        {announcementTypeFilter === "warning" && <AlertTriangle className="h-3 w-3" />}
                        {announcementTypeFilter === "urgent" && <AlertCircle className="h-3 w-3" />}
                        Filter: {announcementTypeFilter === "info" ? "Info" : announcementTypeFilter === "warning" ? "Warnung" : "Dringend"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Diese Mitteilungen werden allen Eltern angezeigt
                  </p>
                </div>

                {announcementsLoading ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Lade Mitteilungen...</p>
                  </div>
                ) : announcements.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Bell className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">Noch keine Mitteilungen vorhanden</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {announcements
                      .filter(announcement => announcementTypeFilter === "alle" || announcement.type === announcementTypeFilter)
                      .map((announcement) => {
                      const typeConfig = {
                        info: {
                          gradient: 'from-blue-500/10 via-indigo-500/10 to-purple-500/10',
                          border: 'border-blue-200/50',
                          icon: Info,
                          iconBg: 'bg-blue-500/20',
                          iconColor: 'text-blue-600',
                          textColor: 'text-blue-900',
                          badge: 'bg-blue-100 text-blue-700'
                        },
                        warning: {
                          gradient: 'from-amber-500/10 via-yellow-500/10 to-amber-500/10',
                          border: 'border-amber-200/50',
                          icon: AlertTriangle,
                          iconBg: 'bg-amber-500/20',
                          iconColor: 'text-amber-600',
                          textColor: 'text-amber-900',
                          badge: 'bg-amber-100 text-amber-700'
                        },
                        urgent: {
                          gradient: 'from-red-500/10 via-orange-500/10 to-red-500/10',
                          border: 'border-red-200/50',
                          icon: AlertCircle,
                          iconBg: 'bg-red-500/20',
                          iconColor: 'text-red-600',
                          textColor: 'text-red-900',
                          badge: 'bg-red-100 text-red-700'
                        }
                      }[announcement.type];

                      const IconComponent = typeConfig.icon;

                      return (
                        <div
                          key={announcement.id}
                          className={`bg-gradient-to-r ${typeConfig.gradient} backdrop-blur-sm rounded-xl border ${typeConfig.border} p-4`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 ${typeConfig.iconBg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                              <IconComponent className={`h-5 w-5 ${typeConfig.iconColor}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className={`${typeConfig.textColor}`}>{announcement.title}</h4>
                                <Badge className={`${typeConfig.badge} flex-shrink-0`}>
                                  {announcement.type === 'info' && 'Info'}
                                  {announcement.type === 'warning' && 'Warnung'}
                                  {announcement.type === 'urgent' && 'Dringend'}
                                </Badge>
                              </div>
                              <p className={`text-sm ${typeConfig.textColor}/80 mb-2 whitespace-pre-line`}>
                                {announcement.message}
                              </p>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                  {announcement.createdBy} • {new Date(announcement.createdAt).toLocaleDateString('de-DE', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteAnnouncement(announcement.id)}
                                  className="h-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Löschen
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Child Info Dialog */}
      <Dialog open={showChildInfo} onOpenChange={(open) => {
        setShowChildInfo(open);
        if (!open && isFullScreen) {
          // Exit fullscreen when closing dialog
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
          if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
          }
          setIsFullScreen(false);
        }
      }}>
        <DialogContent className={`${isFullScreen ? 'max-w-full h-screen p-6' : 'max-w-2xl max-h-[80vh]'} overflow-y-auto transition-all`}>
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <Info className="h-6 w-6 text-blue-600" />
                  Kindinformationen
                </DialogTitle>
                <DialogDescription>
                  Detaillierte Informationen zu {selectedChild?.childName}
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullScreen}
                className="gap-2 flex-shrink-0"
              >
                {isFullScreen ? (
                  <>
                    <Minimize2 className="h-4 w-4" />
                    Beenden
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4" />
                    Vollbild
                  </>
                )}
              </Button>
            </div>
          </DialogHeader>

          {selectedChild?.childProfile && (
            <div className={`mt-4 ${isFullScreen ? 'grid grid-cols-2 gap-6' : 'space-y-6'}`}>
              {/* Grundinformationen */}
              <div className="rounded-xl p-4 space-y-3 dark:bg-blue-900/20" style={{ backgroundColor: 'var(--info-card-background, #EFF6FF)' }}>
                <h4 className={`font-semibold flex items-center gap-2 ${isFullScreen ? 'text-lg' : ''}`}>
                  <Users className={`${isFullScreen ? 'h-5 w-5' : 'h-4 w-4'}`} />
                  Grundinformationen
                </h4>
                <div className={`grid ${isFullScreen ? 'grid-cols-1' : 'grid-cols-2'} gap-4 text-sm`}>
                  <div>
                    <p className="text-muted-foreground mb-1">Name</p>
                    <p className="font-medium">{selectedChild.childName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Hortgruppe</p>
                    <p className="font-medium">{selectedChild.class}</p>
                  </div>
                  {selectedChild.childProfile.birthDate && (
                    <div>
                      <p className="text-muted-foreground mb-1">Geburtsdatum</p>
                      <p className="font-medium">
                        {new Date(selectedChild.childProfile.birthDate).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  )}
                  {selectedChild.childProfile.parentPhone && (
                    <div>
                      <p className="text-muted-foreground mb-1">Telefon Eltern</p>
                      <p className="font-medium flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedChild.childProfile.parentPhone}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notfallkontakt */}
              {(selectedChild.childProfile.emergencyContactName || selectedChild.childProfile.emergencyContactPhone) && (
                <div className="rounded-xl p-4 space-y-3 border border-red-200 dark:border-red-800 dark:bg-red-900/20" style={{ backgroundColor: 'var(--emergency-card-background, #FEF2F2)' }}>
                  <h4 className={`font-semibold flex items-center gap-2 text-red-900 ${isFullScreen ? 'text-lg' : ''}`}>
                    <AlertCircle className={`${isFullScreen ? 'h-5 w-5' : 'h-4 w-4'}`} />
                    Notfallkontakt
                  </h4>
                  <div className={`grid ${isFullScreen ? 'grid-cols-1' : 'grid-cols-2'} gap-4 text-sm`}>
                    {selectedChild.childProfile.emergencyContactName && (
                      <div>
                        <p className="text-muted-foreground mb-1">Name</p>
                        <p className="font-medium">{selectedChild.childProfile.emergencyContactName}</p>
                      </div>
                    )}
                    {selectedChild.childProfile.emergencyContactPhone && (
                      <div>
                        <p className="text-muted-foreground mb-1">Telefon</p>
                        <p className="font-medium flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {selectedChild.childProfile.emergencyContactPhone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Medizinische Informationen */}
              {(selectedChild.childProfile.allergies || selectedChild.childProfile.medicalNotes) && (
                <div className="rounded-xl p-4 space-y-3 border border-yellow-200 dark:border-yellow-800 dark:bg-yellow-900/20" style={{ backgroundColor: 'var(--warning-card-background, #FFFBEB)' }}>
                  <h4 className={`font-semibold flex items-center gap-2 text-yellow-900 ${isFullScreen ? 'text-lg' : ''}`}>
                    <Heart className={`${isFullScreen ? 'h-5 w-5' : 'h-4 w-4'}`} />
                    Medizinische Informationen
                  </h4>
                  {selectedChild.childProfile.allergies && (
                    <div>
                      <p className="text-muted-foreground text-sm mb-1">Allergien & Unverträglichkeiten</p>
                      <p className="text-sm whitespace-pre-line">{selectedChild.childProfile.allergies}</p>
                    </div>
                  )}
                  {selectedChild.childProfile.medicalNotes && (
                    <div>
                      <p className="text-muted-foreground text-sm mb-1">Medizinische Hinweise</p>
                      <p className="text-sm whitespace-pre-line">{selectedChild.childProfile.medicalNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Abholberechtigung */}
              {selectedChild.childProfile.authorizedPickup && (
                <div className="rounded-xl p-4 space-y-3 dark:bg-green-900/20" style={{ backgroundColor: 'var(--info-card-background, #EFF6FF)' }}>
                  <h4 className={`font-semibold flex items-center gap-2 ${isFullScreen ? 'text-lg' : ''}`}>
                    <Users className={`${isFullScreen ? 'h-5 w-5' : 'h-4 w-4'}`} />
                    Abholberechtigt
                  </h4>
                  <p className="text-sm whitespace-pre-line">{selectedChild.childProfile.authorizedPickup}</p>
                </div>
              )}

              {/* Keine Informationen */}
              {!selectedChild.childProfile.birthDate && 
               !selectedChild.childProfile.parentPhone &&
               !selectedChild.childProfile.emergencyContactName &&
               !selectedChild.childProfile.emergencyContactPhone &&
               !selectedChild.childProfile.allergies &&
               !selectedChild.childProfile.medicalNotes &&
               !selectedChild.childProfile.authorizedPickup && (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Keine zusätzlichen Informationen vorhanden</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Vollbild-Dialog für Tabelle */}
      <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
        <DialogContent className="max-w-[98vw] w-[98vw] h-[98vh] max-h-[98vh] p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Hortzettel Vollansicht</DialogTitle>
            <DialogDescription>
              Vollbildansicht aller eingereichten Hortzettel für {getKlasseLabel(klasse)}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className={`flex items-center justify-between border-b bg-gradient-to-r from-orange-600 to-amber-600 ${isLandscape ? 'px-4 py-2' : 'px-4 py-3'}`}>
              <div>
                <h3 className={`text-white ${isLandscape ? 'text-sm mb-0' : 'text-base mb-0.5'}`} aria-hidden="true">Hortzettel Vollansicht</h3>
                <p className={`text-white/80 ${isLandscape ? 'text-xs' : 'text-xs'}`}>
                  {filteredHortzettel.length} {filteredHortzettel.length === 1 ? 'Eintrag' : 'Einträge'}
                  {isLandscape && ' • Querformat'}
                </p>
              </div>
              <Button
                onClick={() => setIsFullScreen(false)}
                variant="ghost"
                className={`text-white hover:bg-white/20 p-0 ${isLandscape ? 'h-7 w-7' : 'h-8 w-8'}`}
                aria-label="Vollansicht schließen"
              >
                <X className={isLandscape ? 'h-4 w-4' : 'h-4 w-4'} />
              </Button>
            </div>

            {/* Tabelle */}
            <div className={`flex-1 overflow-auto bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 ${isLandscape ? 'p-2' : 'p-3'}`}>
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Lade Hortzettel...</p>
                  </div>
                </div>
              ) : filteredHortzettel.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">
                      {searchTerm || klassenFilter !== "alle" 
                        ? "Keine Hortzettel gefunden" 
                        : "Noch keine Hortzettel eingereicht"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 overflow-x-auto">
                  <table className="w-full min-w-max border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/50 dark:to-amber-900/50">
                        <th 
                          className={`font-bold text-foreground dark:text-orange-100 sticky left-0 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/50 dark:to-amber-900/50 z-10 text-left border-b-2 border-orange-200 dark:border-orange-800 relative group ${isLandscape ? 'py-2 px-3' : 'py-2.5 px-3'}`}
                          style={{ width: isLandscape ? fullscreenColumnWidths.name : fullscreenColumnWidths.name * 0.8 }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={`break-words ${isLandscape ? 'text-sm' : 'text-xs'}`}>Name</span>
                            <div 
                              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-orange-400 dark:hover:bg-orange-600 transition-colors flex items-center justify-center group-hover:w-2"
                              onMouseDown={(e) => {
                                const startX = e.clientX;
                                const startWidth = fullscreenColumnWidths.name;
                                
                                const handleMouseMove = (e: MouseEvent) => {
                                  const newWidth = Math.max(80, startWidth + (e.clientX - startX));
                                  setFullscreenColumnWidths(prev => ({ ...prev, name: newWidth }));
                                };
                                
                                const handleMouseUp = () => {
                                  document.removeEventListener('mousemove', handleMouseMove);
                                  document.removeEventListener('mouseup', handleMouseUp);
                                };
                                
                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', handleMouseUp);
                              }}
                            >
                              <GripVertical className={`text-orange-400 dark:text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity ${isLandscape ? 'h-4 w-4' : 'h-3 w-3'}`} />
                            </div>
                          </div>
                        </th>
                        <th 
                          className={`font-bold text-center text-foreground dark:text-orange-100 border-b-2 border-orange-200 dark:border-orange-800 relative group ${isLandscape ? 'py-2 px-3' : 'py-2.5 px-2'}`}
                          style={{ width: isLandscape ? fullscreenColumnWidths.canGoHome : fullscreenColumnWidths.canGoHome * 0.8 }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={`flex-1 break-words ${isLandscape ? 'text-sm' : 'text-xs'}`}>Allein heim?</span>
                            <div 
                              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-orange-400 dark:hover:bg-orange-600 transition-colors flex items-center justify-center group-hover:w-2"
                              onMouseDown={(e) => {
                                const startX = e.clientX;
                                const startWidth = fullscreenColumnWidths.canGoHome;
                                
                                const handleMouseMove = (e: MouseEvent) => {
                                  const newWidth = Math.max(60, startWidth + (e.clientX - startX));
                                  setFullscreenColumnWidths(prev => ({ ...prev, canGoHome: newWidth }));
                                };
                                
                                const handleMouseUp = () => {
                                  document.removeEventListener('mousemove', handleMouseMove);
                                  document.removeEventListener('mouseup', handleMouseUp);
                                };
                                
                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', handleMouseUp);
                              }}
                            >
                              <GripVertical className={`text-orange-400 dark:text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity ${isLandscape ? 'h-4 w-4' : 'h-3 w-3'}`} />
                            </div>
                          </div>
                        </th>
                        {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const).map((day, index) => {
                          const dayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];
                          return (
                            <th 
                              key={day}
                              className={`font-bold text-center text-foreground dark:text-orange-100 border-b-2 border-orange-200 dark:border-orange-800 relative group ${isLandscape ? 'py-2 px-3' : 'py-2.5 px-2'}`}
                              style={{ width: isLandscape ? fullscreenColumnWidths[day] : fullscreenColumnWidths[day] * 0.8 }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className={`flex-1 break-words ${isLandscape ? 'text-sm' : 'text-xs'}`}>{dayLabels[index]}</span>
                                <div 
                                  className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-orange-400 dark:hover:bg-orange-600 transition-colors flex items-center justify-center group-hover:w-2"
                                  onMouseDown={(e) => {
                                    const startX = e.clientX;
                                    const startWidth = fullscreenColumnWidths[day];
                                    
                                    const handleMouseMove = (e: MouseEvent) => {
                                      const newWidth = Math.max(60, startWidth + (e.clientX - startX));
                                      setFullscreenColumnWidths(prev => ({ ...prev, [day]: newWidth }));
                                    };
                                    
                                    const handleMouseUp = () => {
                                      document.removeEventListener('mousemove', handleMouseMove);
                                      document.removeEventListener('mouseup', handleMouseUp);
                                    };
                                    
                                    document.addEventListener('mousemove', handleMouseMove);
                                    document.addEventListener('mouseup', handleMouseUp);
                                  }}
                                >
                                  <GripVertical className={`text-orange-400 dark:text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity ${isLandscape ? 'h-4 w-4' : 'h-3 w-3'}`} />
                                </div>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHortzettel.map((hortzettel) => {
                        const totalEdits = (hortzettel.mondayEdits || 0) + 
                                          (hortzettel.tuesdayEdits || 0) + 
                                          (hortzettel.wednesdayEdits || 0) + 
                                          (hortzettel.thursdayEdits || 0) + 
                                          (hortzettel.fridayEdits || 0);
                        
                        return (
                          <tr 
                            key={hortzettel.id} 
                            className="border-b bg-white dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <td 
                              className={`sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-700 ${isLandscape ? 'py-2 px-3' : 'py-2.5 px-2'}`}
                              style={{ width: isLandscape ? fullscreenColumnWidths.name : fullscreenColumnWidths.name * 0.8 }}
                            >
                              <div className="space-y-1">
                                <div className={`break-words font-semibold dark:text-gray-200 leading-tight ${isLandscape ? 'text-sm' : 'text-xs'}`}>
                                  {hortzettel.childName}
                                </div>
                                <div className="flex items-center gap-1 flex-wrap">
                                  <Badge className={`bg-orange-600 text-white ${isLandscape ? 'text-[10px] px-1.5 py-0.5' : 'text-[9px] px-1 py-0'}`}>
                                    {hortzettel.class}
                                  </Badge>
                                  {hortzettel.status === "archiviert" ? (
                                    <Badge variant="outline" className={`bg-gray-100 ${isLandscape ? 'text-[10px] px-1.5 py-0.5' : 'text-[9px] px-1 py-0'}`}>
                                      <Archive className={`mr-0.5 ${isLandscape ? 'h-2.5 w-2.5' : 'h-2 w-2'}`} />
                                      A
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className={`bg-green-50 text-green-700 border-green-300 ${isLandscape ? 'text-[10px] px-1.5 py-0.5' : 'text-[9px] px-1 py-0'}`}>
                                      {hortzettel.weekNumber}
                                    </Badge>
                                  )}
                                  {totalEdits > 0 && (
                                    <Badge variant="outline" className={isLandscape ? 'text-[10px] px-1.5 py-0.5' : 'text-[9px] px-1 py-0'}>
                                      {totalEdits}
                                    </Badge>
                                  )}
                                  {hortzettel.childProfile && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={isLandscape ? 'p-0.5 h-5 w-5' : 'p-0 h-4 w-4'}
                                      onClick={() => {
                                        setSelectedChild(hortzettel);
                                        setShowChildInfo(true);
                                      }}
                                    >
                                      <Info className={`text-blue-600 ${isLandscape ? 'h-3.5 w-3.5' : 'h-3 w-3'}`} />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td 
                              className={`text-center border-r dark:text-gray-200 ${isLandscape ? 'py-2 px-3' : 'py-2.5 px-2'}`}
                              style={{ width: isLandscape ? fullscreenColumnWidths.canGoHome : fullscreenColumnWidths.canGoHome * 0.8 }}
                            >
                              <div className={`break-words leading-tight ${isLandscape ? 'text-sm' : 'text-xs'}`}>
                                {hortzettel.canGoHomeAlone === "sonstiges" 
                                  ? hortzettel.canGoHomeAloneOther 
                                  : hortzettel.canGoHomeAlone}
                              </div>
                            </td>
                            <td 
                              className={`text-center border-l ${getDayCellColor(hortzettel.mondayEdits || 0)} ${isLandscape ? 'py-2 px-3' : 'py-2.5 px-2'}`}
                              style={{ width: isLandscape ? fullscreenColumnWidths.monday : fullscreenColumnWidths.monday * 0.8 }}
                            >
                              <div className={`break-words leading-tight ${isLandscape ? 'text-sm' : 'text-xs'}`}>
                                {getTimeLabel(hortzettel.monday, hortzettel.mondayOther)}
                              </div>
                            </td>
                            <td 
                              className={`text-center border-l ${getDayCellColor(hortzettel.tuesdayEdits || 0)} ${isLandscape ? 'py-2 px-3' : 'py-2.5 px-2'}`}
                              style={{ width: isLandscape ? fullscreenColumnWidths.tuesday : fullscreenColumnWidths.tuesday * 0.8 }}
                            >
                              <div className={`break-words leading-tight ${isLandscape ? 'text-sm' : 'text-xs'}`}>
                                {getTimeLabel(hortzettel.tuesday, hortzettel.tuesdayOther)}
                              </div>
                            </td>
                            <td 
                              className={`text-center border-l ${getDayCellColor(hortzettel.wednesdayEdits || 0)} ${isLandscape ? 'py-2 px-3' : 'py-2.5 px-2'}`}
                              style={{ width: isLandscape ? fullscreenColumnWidths.wednesday : fullscreenColumnWidths.wednesday * 0.8 }}
                            >
                              <div className={`break-words leading-tight ${isLandscape ? 'text-sm' : 'text-xs'}`}>
                                {getTimeLabel(hortzettel.wednesday, hortzettel.wednesdayOther)}
                              </div>
                            </td>
                            <td 
                              className={`text-center border-l ${getDayCellColor(hortzettel.thursdayEdits || 0)} ${isLandscape ? 'py-2 px-3' : 'py-2.5 px-2'}`}
                              style={{ width: isLandscape ? fullscreenColumnWidths.thursday : fullscreenColumnWidths.thursday * 0.8 }}
                            >
                              <div className={`break-words leading-tight ${isLandscape ? 'text-sm' : 'text-xs'}`}>
                                {getTimeLabel(hortzettel.thursday, hortzettel.thursdayOther)}
                              </div>
                            </td>
                            <td 
                              className={`text-center border-l ${getDayCellColor(hortzettel.fridayEdits || 0)} ${isLandscape ? 'py-2 px-3' : 'py-2.5 px-2'}`}
                              style={{ width: isLandscape ? fullscreenColumnWidths.friday : fullscreenColumnWidths.friday * 0.8 }}
                            >
                              <div className={`break-words leading-tight ${isLandscape ? 'text-sm' : 'text-xs'}`}>
                                {getTimeLabel(hortzettel.friday, hortzettel.fridayOther)}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hilfe Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="bg-gradient-to-r from-blue-500 to-purple-600 -m-6 mb-0 p-6 text-white">
            <DialogTitle className="text-white">Hilfe & Anleitungen</DialogTitle>
            <DialogDescription className="text-white/90">
              Tipps zur Verwendung des Hortner-Dashboards
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Hortzettel durchsuchen */}
            <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20 rounded-r-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Search className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">Hortzettel durchsuchen</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                    <li>Verwenden Sie die Suchleiste, um nach Kindernamen zu suchen</li>
                    <li>Filtern Sie nach Klasse über das Dropdown-Menü</li>
                    <li>Wechseln Sie zwischen "Aktiv", "Archiv" und "Alle"</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Zwischen Wochen navigieren */}
            <div className="p-4 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-950/20 rounded-r-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-2 text-purple-900 dark:text-purple-100">Zwischen Wochen navigieren</h4>
                  <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1 list-disc list-inside">
                    <li>Nutzen Sie die Pfeiltasten ← → über der Tabelle</li>
                    <li>Die aktuelle Kalenderwoche wird oben angezeigt</li>
                    <li>Archivierte Wochen können über den Filter eingesehen werden</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Kind-Details ansehen */}
            <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20 rounded-r-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-2 text-green-900 dark:text-green-100">Kind-Details ansehen</h4>
                  <ul className="text-sm text-green-800 dark:text-green-200 space-y-1 list-disc list-inside">
                    <li>Klicken Sie auf einen Kindernamen in der Tabelle</li>
                    <li>Sehen Sie wichtige Informationen wie Allergien und medizinische Hinweise</li>
                    <li>Telefonnummern der Eltern und Notfallkontakte werden angezeigt</li>
                    <li>Abholberechtigungen sind ebenfalls einsehbar</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Vollbild-Modus */}
            <div className="p-4 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20 rounded-r-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Maximize2 className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-2 text-orange-900 dark:text-orange-100">Vollbild-Modus verwenden</h4>
                  <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1 list-disc list-inside">
                    <li>Klicken Sie auf das Vollbild-Icon in der oberen rechten Ecke</li>
                    <li>Ideal für Tablets im Querformat</li>
                    <li>Bessere Übersicht über alle Wochentage</li>
                    <li>Zum Beenden drücken Sie ESC oder klicken Sie erneut auf das Icon</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Hortzettel exportieren */}
            <div className="p-4 border-l-4 border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 rounded-r-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-2 text-indigo-900 dark:text-indigo-100">Hortzettel exportieren</h4>
                  <ul className="text-sm text-indigo-800 dark:text-indigo-200 space-y-1 list-disc list-inside">
                    <li>Klicken Sie auf "Drucken/Export" über der Tabelle</li>
                    <li>Wählen Sie die gewünschte Woche aus</li>
                    <li>Exportieren Sie als PDF oder drucken Sie direkt</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Ankündigungen verwalten */}
            <div className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20 rounded-r-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-2 text-red-900 dark:text-red-100">Ankündigungen verwalten</h4>
                  <ul className="text-sm text-red-800 dark:text-red-200 space-y-1 list-disc list-inside">
                    <li>Wechseln Sie zum Tab "Ankündigungen"</li>
                    <li>Erstellen Sie neue Mitteilungen für Eltern</li>
                    <li>Wählen Sie zwischen Info, Warnung und Dringend</li>
                    <li>Bearbeiten oder löschen Sie bestehende Ankündigungen</li>
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
