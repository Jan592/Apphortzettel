import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { LogOut, User, FileText, Plus, Info, Clock, CheckCircle2, AlertTriangle, AlertCircle, MessageCircle, Palette, Home, Bell, Settings, ChevronRight, Calendar, HelpCircle } from "lucide-react";
import type { HortzettelData, Announcement, Message } from "../types/hortzettel";
import { AppLogo } from "./AppLogo";
import { api } from "../utils/api";
import { ThemeToggle } from "./ThemeToggle";
import TemplateManager from "./TemplateManager";
import MessagingView from "./MessagingView";
import HelpGuide from "./HelpGuide";
import type { HortzettelTemplate } from "../types/hortzettel";
import { getWeekNumber, isEditingAllowedAsync, getCachedTimeRestrictionSettings } from "../utils/weekUtils";
import { toast } from "sonner@2.0.3";
import type { TimeRestrictionSettings } from "../types/hortzettel";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { motion, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface PersonalDashboardProps {
  firstName: string;
  lastName: string;
  onLogout: () => void;
  onCreateHortzettel: () => void;
  onViewMyHortzettel: () => void;
  onViewProfile: () => void;
  onViewAppearanceSettings?: () => void;
  hortzettelList?: (HortzettelData & { id: string; createdAt: Date })[];
  onCreateFromTemplate?: (templateData: HortzettelTemplate) => void;
}

export default function PersonalDashboard({ 
  firstName, 
  lastName, 
  onLogout, 
  onCreateHortzettel, 
  onViewMyHortzettel,
  onViewProfile,
  onViewAppearanceSettings,
  hortzettelList = [],
  onCreateFromTemplate,
}: PersonalDashboardProps) {
  const [currentTab, setCurrentTab] = useState<'home' | 'hortzettel' | 'mitteilungen' | 'profil'>('home');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolName, setSchoolName] = useState<string>("Grundschule Auma");
  const [schoolPhotoUrl, setSchoolPhotoUrl] = useState<string>("https://images.unsplash.com/photo-1665270695165-93b5798522ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnZXJtYW4lMjBlbGVtZW50YXJ5JTIwc2Nob29sJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzYyODU4MzU5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral");
  const [showMessaging, setShowMessaging] = useState(false);
  const [timeRestrictions, setTimeRestrictions] = useState<TimeRestrictionSettings>({
    enabled: true,
    blockStartHour: 12,
    blockEndHour: 17,
    blockWeekdaysOnly: true,
  });
  const [isEditingAllowedState, setIsEditingAllowedState] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [repliedMessagesCount, setRepliedMessagesCount] = useState(0);
  const [hasUnreadAnnouncements, setHasUnreadAnnouncements] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  
  // Theme preferences
  const [basicInfoTheme, setBasicInfoTheme] = useState<string>('blue');
  const [weekPlanTheme, setWeekPlanTheme] = useState<string>('purple');
  const [backgroundTheme, setBackgroundTheme] = useState<string>('blue');

  // Swipe gesture state
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    loadAnnouncements();
    loadSchoolName();
    loadSchoolPhoto();
    loadTimeRestrictions();
    checkEditingAllowed();
    loadMessages();
    loadThemePreferences();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const response = await api.getAnnouncements();
      setAnnouncements(response.announcements);
      
      // Check for unread announcements
      if (response.announcements.length > 0) {
        const lastViewedKey = `last_viewed_announcements_${firstName}_${lastName}`;
        const lastViewed = localStorage.getItem(lastViewedKey);
        const lastViewedTime = lastViewed ? new Date(lastViewed).getTime() : 0;
        
        // Check if there are announcements newer than last viewed time
        const hasNewAnnouncements = response.announcements.some((ann: Announcement) => {
          const announcementTime = new Date(ann.createdAt).getTime();
          return announcementTime > lastViewedTime;
        });
        
        setHasUnreadAnnouncements(hasNewAnnouncements);
      } else {
        setHasUnreadAnnouncements(false);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Mitteilungen:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAnnouncementsAsRead = () => {
    const lastViewedKey = `last_viewed_announcements_${firstName}_${lastName}`;
    localStorage.setItem(lastViewedKey, new Date().toISOString());
    setHasUnreadAnnouncements(false);
  };

  const loadSchoolName = async () => {
    try {
      const schoolNameData = localStorage.getItem('school_name');
      if (schoolNameData) {
        setSchoolName(schoolNameData);
      }
    } catch (error) {
      console.error('Fehler beim Laden des Schulnamens:', error);
    }
  };

  const loadSchoolPhoto = async () => {
    try {
      const response = await api.getAppSettings();
      if (response?.settings?.content?.schoolPhotoUrl) {
        setSchoolPhotoUrl(response.settings.content.schoolPhotoUrl);
      }
    } catch (error) {
      console.error('Fehler beim Laden des Schulfotos:', error);
    }
  };

  const loadTimeRestrictions = async () => {
    try {
      const restrictions = await getCachedTimeRestrictionSettings();
      setTimeRestrictions(restrictions);
    } catch (error) {
      console.error('Fehler beim Laden der Zeitbeschränkungen:', error);
    }
  };

  const checkEditingAllowed = async () => {
    try {
      const allowed = await isEditingAllowedAsync();
      setIsEditingAllowedState(allowed);
    } catch (error) {
      console.error('Fehler beim Prüfen der Bearbeitungsberechtigung:', error);
    }
  };

  const loadThemePreferences = () => {
    try {
      const savedBasicTheme = localStorage.getItem(`hortzettel_theme_basic_${firstName}_${lastName}`);
      const savedWeekTheme = localStorage.getItem(`hortzettel_theme_week_${firstName}_${lastName}`);
      const savedBackgroundTheme = localStorage.getItem(`hortzettel_theme_background_${firstName}_${lastName}`);
      
      if (savedBasicTheme) setBasicInfoTheme(savedBasicTheme);
      if (savedWeekTheme) setWeekPlanTheme(savedWeekTheme);
      if (savedBackgroundTheme) setBackgroundTheme(savedBackgroundTheme);
    } catch (error) {
      console.error('Fehler beim Laden der Theme-Präferenzen:', error);
    }
  };

  const loadMessages = async () => {
    // Nur Nachrichten laden wenn ein Access Token vorhanden ist
    if (!api.getAccessToken()) {
      console.log('[PersonalDashboard] Kein Access Token - überspringe Nachrichten-Laden');
      return;
    }
    
    try {
      const response = await api.getMessages();
      setMessages(response?.messages || []);
      // Nur beantwortete Nachrichten zählen, deren Antwort noch nicht gelesen wurde
      const repliedCount = response?.messages.filter((msg: Message) => 
        msg.status === 'beantwortet' && !msg.replyRead
      ).length || 0;
      setRepliedMessagesCount(repliedCount);
    } catch (error: any) {
      // Stilles Fehlerbehandlung für 401 (nicht eingeloggt)
      if (!error.message?.includes('401')) {
        console.error('Fehler beim Laden der Nachrichten:', error);
      }
    }
  };

  // Swipe gesture handlers
  const tabs = ['home', 'hortzettel', 'mitteilungen', 'profil'] as const;
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50; // Minimum swipe distance
    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;

    // Nur horizontale Swipes erkennen (wenn horizontale Bewegung größer als vertikale)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > swipeThreshold) {
      const currentIndex = tabs.indexOf(currentTab);
      
      if (diffX > 0) {
        // Nach links gewischt → nächster Tab
        if (currentIndex < tabs.length - 1) {
          setSwipeDirection('left');
          setCurrentTab(tabs[currentIndex + 1]);
          
          // Haptic feedback auf unterstützten Geräten
          if (navigator.vibrate) {
            navigator.vibrate(10);
          }
        }
      } else {
        // Nach rechts gewischt → vorheriger Tab
        if (currentIndex > 0) {
          setSwipeDirection('right');
          setCurrentTab(tabs[currentIndex - 1]);
          
          // Haptic feedback auf unterstützten Geräten
          if (navigator.vibrate) {
            navigator.vibrate(10);
          }
        }
      }
    }
    
    // Reset
    touchStartX.current = 0;
    touchStartY.current = 0;
    touchEndX.current = 0;
    touchEndY.current = 0;
  };

  // Wochenlogik für Hortzettel-Übersicht
  const { weekNumber: currentWeek, year: currentYear } = getWeekNumber();
  
  const currentWeekHortzettel = hortzettelList.filter(
    h => h.weekNumber === currentWeek && h.year === currentYear && h.status === 'aktiv'
  );
  
  const activeHortzettel = hortzettelList.filter(h => h.status === 'aktiv');

  const getWeekStatus = (weekHortzettel: any[]) => {
    if (weekHortzettel.length === 0) {
      return { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30', label: 'Noch kein Hortzettel' };
    }
    return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30', label: 'Hortzettel vorhanden' };
  };

  const currentWeekStatus = getWeekStatus(currentWeekHortzettel);

  const getAnnouncementStyle = (type: string) => {
    switch (type) {
      case 'urgent':
        return {
          gradient: 'from-red-500/10 via-orange-500/10 to-red-500/10',
          border: 'border-red-200/50',
          icon: AlertCircle,
          iconBg: 'bg-red-500/20',
          iconColor: 'text-red-600',
          textColor: 'text-red-900'
        };
      case 'warning':
        return {
          gradient: 'from-amber-500/10 via-yellow-500/10 to-amber-500/10',
          border: 'border-amber-200/50',
          icon: AlertTriangle,
          iconBg: 'bg-amber-500/20',
          iconColor: 'text-amber-600',
          textColor: 'text-amber-900'
        };
      default:
        return {
          gradient: 'from-blue-500/10 via-indigo-500/10 to-purple-500/10',
          border: 'border-blue-200/50',
          icon: Info,
          iconBg: 'bg-blue-500/20',
          iconColor: 'text-blue-600',
          textColor: 'text-blue-900'
        };
    }
  };

  const handleUseTemplateAsHortzettel = async (template: HortzettelTemplate) => {
    try {
      const { weekNumber, year } = getWeekNumber();
      
      // Check if a Hortzettel already exists for this week
      const existingHortzettel = hortzettelList.find(
        h => h.weekNumber === weekNumber && h.year === year
      );

      if (existingHortzettel) {
        const confirmed = confirm(
          `Sie haben bereits einen Hortzettel für KW ${weekNumber}, ${year}.\n\nMöchten Sie diesen mit der Vorlage "${template.name}" überschreiben?`
        );
        
        if (!confirmed) {
          return;
        }
      }

      // Convert template to HortzettelData
      const hortzettelData: HortzettelData = {
        childName: `${firstName} ${lastName}`,
        class: template.class,
        canGoHomeAlone: template.canGoHomeAlone,
        canGoHomeAloneOther: template.canGoHomeAloneOther,
        monday: template.monday,
        mondayOther: template.mondayOther,
        tuesday: template.tuesday,
        tuesdayOther: template.tuesdayOther,
        wednesday: template.wednesday,
        wednesdayOther: template.wednesdayOther,
        thursday: template.thursday,
        thursdayOther: template.thursdayOther,
        friday: template.friday,
        fridayOther: template.fridayOther,
        weekNumber,
        year,
        status: 'aktiv'
      };

      if (onCreateFromTemplate) {
        onCreateFromTemplate(hortzettelData);
        toast.success(`Hortzettel aus Vorlage "${template.name}" erstellt!`);
      }
    } catch (error: any) {
      console.error('Error creating Hortzettel from template:', error);
      toast.error(error.message || 'Fehler beim Erstellen des Hortzettels');
    }
  };

  if (showMessaging) {
    return <MessagingView 
      onBack={() => {
        setShowMessaging(false);
        loadMessages(); // Nachrichten neu laden, um Badge zu aktualisieren
      }} 
      userType="parent" 
    />;
  }

  // HOME TAB
  const renderHomeTab = () => (
    <div className="space-y-6 pb-24">
      {/* Welcome Hero Section */}
      <div className="bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/30 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm my-[20px] mx-[0px] px-[28px] py-[15px]">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Welcome Icon mit Schulfoto */}
          <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg ring-4 ring-blue-200/50 dark:ring-blue-700/50">
            <ImageWithFallback
              src={schoolPhotoUrl}
              alt="Schulgebäude"
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Welcome Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-3xl">
                Willkommen, {firstName}!
              </h2>
              {hasUnreadAnnouncements && (
                <Badge variant="destructive" className="animate-pulse">
                  Neu
                </Badge>
              )}
            </div>
            <p className="text-lg text-muted-foreground">
              Schön, dass du da bist! 🎉
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card 
          onClick={() => setCurrentTab('hortzettel')}
          className="p-6 text-center bg-blue-50/50 dark:from-blue-950/20 dark:to-blue-900/20 border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md hover:scale-105 active:scale-95 transition-all group"
        >
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-blue-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="text-3xl">{hortzettelList.filter(h => h.status === 'aktiv').length}</div>
            <div className="text-sm text-muted-foreground">Aktive<br/>Hortzettel</div>
          </div>
        </Card>
        <Card 
          onClick={() => {
            setCurrentTab('mitteilungen');
            markAnnouncementsAsRead();
          }}
          className="p-6 text-center bg-purple-50/50 dark:from-purple-950/20 dark:to-purple-900/20 border-slate-200 dark:border-slate-700 relative cursor-pointer hover:shadow-md hover:scale-105 active:scale-95 transition-all group"
        >
          {hasUnreadAnnouncements && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse" />
          )}
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-purple-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div className="text-3xl">{announcements.length}</div>
            <div className="text-sm text-muted-foreground">Mitteilungen vom Hort</div>
          </div>
        </Card>
        <Card 
          onClick={() => setShowMessaging(true)}
          className="p-6 text-center bg-green-50/50 dark:from-green-950/20 dark:to-green-900/20 border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md hover:scale-105 active:scale-95 transition-all relative group"
        >
          {repliedMessagesCount > 0 && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 animate-pulse">
              <span className="text-white text-xs font-medium">{repliedMessagesCount}</span>
            </div>
          )}
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-green-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div className="text-3xl">{repliedMessagesCount}</div>
            <div className="text-sm text-muted-foreground">Nachrichten vom Admin</div>
          </div>
        </Card>
        <Card 
          onClick={() => setShowHelpGuide(true)}
          className="p-6 text-center bg-amber-50/50 dark:from-amber-950/20 dark:to-amber-900/20 border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md hover:scale-105 active:scale-95 transition-all group"
        >
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <HelpCircle className="h-6 w-6 text-white" />
            </div>
            <div className="text-3xl"><span className="text-transparent">0</span></div>
            <div className="text-sm text-muted-foreground">Anleitung &<br/>Hilfe</div>
          </div>
        </Card>
      </div>

      {/* Sperrung Info - wird nur angezeigt wenn gesperrt */}
      {!isEditingAllowedState && !loading && (
        <div className="bg-gradient-to-r from-amber-50/50 via-orange-50/30 to-red-50/30 rounded-xl border border-amber-200 dark:border-amber-800 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-amber-900 dark:text-amber-100 mb-1">⚠️ Hortzettel gesperrt</h3>
              <p className="text-sm text-amber-800/90 dark:text-amber-200/90">
                Das Erstellen und Bearbeiten von Hortzetteln ist aktuell nicht möglich.
                {timeRestrictions.enabled && (
                  <span className="block mt-1">
                    Bearbeitungen sind {timeRestrictions.blockWeekdaysOnly ? "Mo-Fr" : "täglich"} ab {timeRestrictions.blockEndHour}:00 Uhr wieder möglich.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      {loading ? (
        <div className="bg-blue-50/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <div className="flex items-center justify-center h-20">
            <div className="text-sm text-muted-foreground">Lade Informationen...</div>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Info className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-blue-900 dark:text-blue-100">Wichtige Informationen</h3>
              <div className="space-y-1.5 text-sm text-blue-800/80 dark:text-blue-200/80">
                {timeRestrictions.enabled ? (
                  <>
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Zeitbeschränkung:</strong> {timeRestrictions.blockWeekdaysOnly ? "Montag-Freitag" : "Täglich"} zwischen {timeRestrictions.blockStartHour}:00 und {timeRestrictions.blockEndHour}:00 Uhr können keine Hortzettel erstellt oder bearbeitet werden
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Erlaubt:</strong> {timeRestrictions.blockWeekdaysOnly ? "Mo-Fr" : "Täglich"} bis {timeRestrictions.blockStartHour}:00 Uhr und ab {timeRestrictions.blockEndHour}:00 Uhr
                        {timeRestrictions.blockWeekdaysOnly && ", am Wochenende jederzeit"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Zeitbeschränkung:</strong> Deaktiviert - Hortzettel können jederzeit erstellt und bearbeitet werden</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // HORTZETTEL TAB - Alle Hortzettel-Funktionen
  const renderHortzettelTab = () => (
    <div className="space-y-6 pb-24">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center space-y-2 mb-6 mt-4">
        <h2 className="text-2xl font-bold">Hortzettel-Verwaltung</h2>
        <p className="text-muted-foreground">
          Erstelle und verwalte deine Hortzettel
        </p>
      </div>

      {/* Schnellaktionen */}
      <div className="grid grid-cols-2 gap-4">
        <Card
          onClick={isEditingAllowedState ? onCreateHortzettel : undefined}
          className={`p-6 text-center ${
            isEditingAllowedState 
              ? 'bg-blue-50/50 dark:from-blue-950/20 dark:to-blue-900/20 border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md hover:scale-105 active:scale-95' 
              : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          } transition-all group`}
        >
          <div className="flex flex-col items-center space-y-2">
            <div className={`w-12 h-12 ${
              isEditingAllowedState ? 'bg-blue-400' : 'bg-gray-400'
            } rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
              <Plus className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-medium">Neuer Hortzettel</span>
          </div>
        </Card>

        <Card
          onClick={onViewMyHortzettel}
          className="text-center bg-purple-50/50 dark:from-purple-950/20 dark:to-purple-900/20 border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md hover:scale-105 active:scale-95 transition-all group px-[21px] py-[15px] p-[21px]"
        >
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-purple-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-medium">Alle anzeigen</span>
          </div>
        </Card>
      </div>

      {/* Aktuelle Woche */}
      <Card className="bg-slate-50/50 dark:from-slate-800/50 dark:to-slate-900/50 border-slate-200 dark:border-slate-700 py-[10px] py-[5px] px-[17px] m-[0px]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-400 rounded-xl flex items-center justify-center shadow-sm">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="mb-0 text-base font-medium">Diese Woche</h3>
              <p className="text-xs text-muted-foreground">KW {currentWeek} • {currentYear}</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${currentWeekStatus.bg} shadow-sm`}>
            <currentWeekStatus.icon className={`w-4 h-4 ${currentWeekStatus.color}`} />
            <span className={`text-xs font-medium ${currentWeekStatus.color}`}>
              {currentWeekStatus.label}
            </span>
          </div>
        </div>
        
        {currentWeekHortzettel.length > 0 ? (
          <div className="space-y-2">
            {currentWeekHortzettel.map(hz => (
              <Card
                key={hz.id}
                onClick={onViewMyHortzettel}
                className="p-4 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all bg-white dark:bg-slate-800"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-white font-medium text-sm">{hz.class}</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">{hz.childName || `${firstName} ${lastName}`}</div>
                      <div className="text-xs text-muted-foreground">Klasse {hz.class}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center bg-orange-50/50 dark:bg-orange-950/20 rounded-xl border border-orange-200/50 dark:border-orange-900 py-[10px] px-[0px] pt-[10px] pr-[0px] pb-[0px] pl-[0px]">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto my-[0px] mx-[139px]">
              <AlertCircle className="w-6 h-6 text-orange-500" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Noch kein Hortzettel für diese Woche
            </p>
            {isEditingAllowedState && (
              <Button onClick={onCreateHortzettel} className="bg-blue-500 hover:bg-blue-600 shadow-sm px-[10px] py-[0px] mt-[0px] mr-[0px] mb-[10px] ml-[0px]">
                <Plus className="w-4 h-4 mr-2" />
                Jetzt erstellen
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Alle Hortzettel */}
      {activeHortzettel.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Weitere Hortzettel</h3>
          {activeHortzettel.slice(0, 3).map(hz => (
            <Card 
              key={hz.id}
              onClick={onViewMyHortzettel}
              className="p-4 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-white font-medium">{hz.class}</span>
                  </div>
                  <div>
                    <div className="font-medium">{hz.childName || `${firstName} ${lastName}`}</div>
                    <div className="text-sm text-muted-foreground">
                      KW {hz.weekNumber} • {hz.year}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={hz.status === 'aktiv' ? 'default' : 'secondary'}>
                    {hz.status}
                  </Badge>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </Card>
          ))}
          {activeHortzettel.length > 3 && (
            <Button onClick={onViewMyHortzettel} variant="outline" className="w-full">
              Alle {activeHortzettel.length} Hortzettel anzeigen
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      )}

      {/* Vorlagen */}
      <Card className="bg-green-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border-slate-200 dark:border-slate-700 px-[14px] px-[15px] py-[0px]">
        <div className="flex items-center gap-3 my-[10px] mx-[0px]">
          <div className="w-10 h-10 bg-green-400 rounded-xl flex items-center justify-center shadow-sm">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="mb-0 text-base font-medium">Vorlagen</h3>
            <p className="text-xs text-muted-foreground">Schnell Hortzettel erstellen</p>
          </div>
        </div>
        <TemplateManager onUseTemplate={handleUseTemplateAsHortzettel} />
      </Card>
    </div>
  );

  // MITTEILUNGEN TAB
  const renderMitteilungenTab = () => (
    <div className="space-y-6 pb-24" onMouseEnter={markAnnouncementsAsRead} onClick={markAnnouncementsAsRead}>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-50/50 via-pink-50/30 to-rose-50/30 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm px-[21px] p-[21px] my-[30px] mx-[0px]">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-md">
            <Bell className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl mb-1">Mitteilungen vom Hort</h2>
            <p className="text-sm text-muted-foreground">
              Wichtige Informationen für Eltern
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-blue-50/50 rounded-xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center animate-pulse">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-sm text-muted-foreground">Lade Mitteilungen...</div>
          </div>
        </div>
      ) : announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((announcement, index) => {
            const style = getAnnouncementStyle(announcement.type);
            const IconComponent = style.icon;
            return (
              <Card
                key={announcement.id}
                className={`bg-gradient-to-r ${style.gradient} border ${style.border} p-5 shadow-sm relative hover:shadow-md transition-shadow`}
              >
                {hasUnreadAnnouncements && index === 0 && (
                  <div className="absolute -top-2 -right-2">
                    <Badge variant="destructive" className="animate-pulse shadow-sm">
                      🔔 NEU
                    </Badge>
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 ${style.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <IconComponent className={`h-6 w-6 ${style.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg mb-1 ${style.textColor} dark:opacity-90`}>{announcement.title}</h3>
                    <p className={`text-sm ${style.textColor}/80 dark:opacity-80 mt-2 leading-relaxed`}>
                      {announcement.message}
                    </p>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-current/10">
                      <div className={`w-7 h-7 ${style.iconBg} rounded-full flex items-center justify-center`}>
                        <User className={`h-4 w-4 ${style.iconColor}`} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">{announcement.createdBy}</span>
                        <span className="mx-1.5">•</span>
                        <span>{new Date(announcement.createdAt).toLocaleDateString('de-DE', { 
                          day: '2-digit', 
                          month: 'long', 
                          year: 'numeric' 
                        })}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center p-12 bg-slate-50/50 dark:from-slate-800/50 dark:to-slate-900/50 border-slate-200 dark:border-slate-700">
          <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="h-10 w-10 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-xl mb-2">Keine Mitteilungen</h3>
          <p className="text-sm text-muted-foreground">
            Es gibt derzeit keine Mitteilungen vom Hort.
          </p>
        </Card>
      )}
    </div>
  );

  // PROFIL TAB
  const renderProfilTab = () => (
    <div className="space-y-6 pb-24">
      {/* Zurück Button */}
      <Button 
        variant="ghost" 
        onClick={() => setCurrentTab('home')}
        className="mb-2 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <ChevronRight className="h-5 w-5 mr-2 rotate-180" />
        Zurück
      </Button>

      <h2 className="my-[15px] font-bold text-[24px] text-center mx-[0px]">Einstellungen & Profil</h2>

      {/* Farb-Einstellungen */}
      {onViewAppearanceSettings && (
        <Card 
          onClick={onViewAppearanceSettings}
          className="p-4 cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all group"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-110 transition-transform">
                <Palette className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="mb-0 text-base">Farb-Einstellungen</h3>
                <p className="text-xs text-muted-foreground">
                  Gestalte dein Hortzettel-Formular individuell
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                🎨 {basicInfoTheme.charAt(0).toUpperCase() + basicInfoTheme.slice(1)}
              </Badge>
              <svg className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Card>
      )}

      {/* Profil bearbeiten */}
      <Card 
        onClick={onViewProfile}
        className="p-4 cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all group"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-110 transition-transform">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="mb-0 text-base">Profil bearbeiten</h3>
              <p className="text-xs text-muted-foreground">
                Persönliche Daten und Kindinformationen verwalten
              </p>
            </div>
          </div>
          <svg className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Card>

      {/* Hilfe & Anleitung */}
      <Card 
        onClick={() => setShowHelpGuide(true)}
        className="p-4 cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all group"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-110 transition-transform">
              <HelpCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="mb-0 text-base">Anleitung & Hilfe</h3>
              <p className="text-xs text-muted-foreground">
                Benutzerhandbuch und Hilfestellung
              </p>
            </div>
          </div>
          <svg className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Card>

      {/* Nachrichten an Admin */}
      <Card 
        onClick={() => setShowMessaging(true)}
        className="p-4 cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all group"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-110 transition-transform relative">
              <MessageCircle className="h-5 w-5 text-white" />
              {repliedMessagesCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">{repliedMessagesCount}</span>
                </div>
              )}
            </div>
            <div>
              <h3 className="mb-0 text-base">Nachrichten</h3>
              <p className="text-xs text-muted-foreground">
                Kommunikation mit dem Admin
              </p>
            </div>
          </div>
          <svg className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Card>
    </div>
  );

  // Animation variants
  const pageVariants = {
    initial: (direction: 'left' | 'right' | null) => ({
      x: direction === 'left' ? 300 : direction === 'right' ? -300 : 0,
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: (direction: 'left' | 'right' | null) => ({
      x: direction === 'left' ? -300 : direction === 'right' ? 300 : 0,
      opacity: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    })
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors">
      {/* Header with School Image */}
      <header className="relative overflow-hidden border-b border-white/20 dark:border-slate-700/20 shadow-lg">
        {/* Background Image */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${schoolPhotoUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/95 via-indigo-600/90 to-purple-600/95 dark:from-slate-900/95 dark:via-slate-800/90 dark:to-slate-900/95 backdrop-blur-sm transition-colors" />
        </div>
        
        {/* Content */}
        <div className="relative container mx-auto py-[10px] py-[0px] px-[14px]">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Icon */}
            <AppLogo 
              className="w-12 h-12 bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl ring-4 ring-white/30 transition-colors flex-shrink-0 p-2"
              iconClassName="h-8 w-8 text-white"
            />
            
            {/* Center: Title */}
            <div className="flex-1 text-center">
              <h1 className="text-white">Hortzettel {schoolName}</h1>
              <p className="text-sm text-blue-100 dark:text-gray-300">
                {firstName} {lastName}
              </p>
            </div>
            
            {/* Right: Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <ThemeToggle />
              <Button 
                variant="secondary" 
                onClick={onLogout}
                className="bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 text-white border-white/30 backdrop-blur-md transition-colors px-[5px] py-[0px]"
              >
                <LogOut className="h-4 w-4 mr-2" />

                
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main 
        className="container mx-auto px-4 py-8 max-w-6xl overflow-hidden px-[16px] py-[0px]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait" custom={swipeDirection}>
          {currentTab === 'home' && (
            <motion.div
              key="home"
              custom={swipeDirection}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {renderHomeTab()}
            </motion.div>
          )}
          {currentTab === 'hortzettel' && (
            <motion.div
              key="hortzettel"
              custom={swipeDirection}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {renderHortzettelTab()}
            </motion.div>
          )}
          {currentTab === 'mitteilungen' && (
            <motion.div
              key="mitteilungen"
              custom={swipeDirection}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {renderMitteilungenTab()}
            </motion.div>
          )}
          {currentTab === 'profil' && (
            <motion.div
              key="profil"
              custom={swipeDirection}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {renderProfilTab()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg safe-area-inset-bottom z-50">
        <div className="max-w-6xl mx-auto grid grid-cols-4 gap-1 px-2 py-2 py-[0px] px-[7px]">
          <button
            onClick={() => {
              const currentIndex = tabs.indexOf(currentTab);
              const targetIndex = 0;
              setSwipeDirection(targetIndex > currentIndex ? 'left' : 'right');
              setCurrentTab('home');
            }}
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-colors relative ${
              currentTab === 'home' 
                ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Start</span>
          </button>

          <button
            onClick={() => {
              const currentIndex = tabs.indexOf(currentTab);
              const targetIndex = 1;
              setSwipeDirection(targetIndex > currentIndex ? 'left' : 'right');
              setCurrentTab('hortzettel');
            }}
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-colors ${
              currentTab === 'hortzettel' 
                ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <FileText className="w-6 h-6" />
            <span className="text-xs font-medium">Hortzettel</span>
          </button>

          <button
            onClick={() => {
              const currentIndex = tabs.indexOf(currentTab);
              const targetIndex = 2;
              setSwipeDirection(targetIndex > currentIndex ? 'left' : 'right');
              setCurrentTab('mitteilungen');
            }}
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-colors relative ${
              currentTab === 'mitteilungen' 
                ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <Bell className="w-6 h-6" />
            <span className="text-xs font-medium">Mitteilungen</span>
            {hasUnreadAnnouncements && (
              <div className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>

          <button
            onClick={() => {
              const currentIndex = tabs.indexOf(currentTab);
              const targetIndex = 3;
              setSwipeDirection(targetIndex > currentIndex ? 'left' : 'right');
              setCurrentTab('profil');
            }}
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-colors ${
              currentTab === 'profil' 
                ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs font-medium">Profil</span>
          </button>
        </div>
      </div>
      
      {/* Help Guide Modal */}
      {showHelpGuide && (
        <HelpGuide onClose={() => setShowHelpGuide(false)} />
      )}
    </div>
  );
}