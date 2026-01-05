// Modern Parent Dashboard - Hilfe & Support Tab
import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { 
  Home, 
  FileText, 
  User, 
  MessageSquare, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  Info,
  MessageCircle,
  HelpCircle,
  Phone,
  Mail,
  Heart,
  AlertTriangle
} from "lucide-react";
import type { HortzettelData, Announcement, Message, TimeRestrictionSettings, HortzettelTemplate } from "../types/hortzettel";
import { getWeekNumber, formatWeekDisplay, isEditingAllowedAsync, getCachedTimeRestrictionSettings } from "../utils/weekUtils";
import { api } from "../utils/api";
import { toast } from "sonner@2.0.3";
import { ThemeToggle } from "./ThemeToggle";
import MessagingView from "./MessagingView";
import TemplateManager from "./TemplateManager";

interface ModernParentDashboardProps {
  user: {
    firstName: string;
    lastName: string;
    childProfile?: any;
    familyProfile?: any;
  };
  hortzettel: (HortzettelData & { id: string })[];
  onCreateNew: () => void;
  onEditHortzettel: (id: string) => void;
  onViewProfile: () => void;
  onViewAppearanceSettings?: () => void;
  onLogout: () => void;
  onViewAllHortzettel: () => void;
  schoolName: string;
  content?: any;
  onToggleDesign?: (useModern: boolean) => void;
}

export default function ModernParentDashboard({
  user,
  hortzettel: initialHortzettel,
  onCreateNew,
  onEditHortzettel,
  onViewProfile,
  onViewAppearanceSettings,
  onLogout,
  onViewAllHortzettel,
  schoolName,
  content = {},
  onToggleDesign
}: ModernParentDashboardProps) {
  const [currentTab, setCurrentTab] = useState<'home' | 'hortzettel' | 'support' | 'profile'>('home');
  const [hortzettel, setHortzettel] = useState(initialHortzettel);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [hasUnreadAnnouncements, setHasUnreadAnnouncements] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isEditingAllowedState, setIsEditingAllowedState] = useState(true);
  const [timeRestrictions, setTimeRestrictions] = useState<TimeRestrictionSettings>({
    enabled: false,
    blockStartHour: 15,
    blockEndHour: 18,
    blockWeekdaysOnly: true
  });
  const [loading, setLoading] = useState(true);
  
  // Swipe gesture state
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const currentWeekData = getWeekNumber(new Date());
  const currentWeek = currentWeekData.weekNumber;
  const currentYear = currentWeekData.year;

  // Debug logging
  console.log('[ModernParentDashboard] Current Week:', currentWeek, 'Year:', currentYear);
  console.log('[ModernParentDashboard] All Hortzettel:', hortzettel.map(h => ({
    id: h.id,
    weekNumber: h.weekNumber,
    year: h.year,
    status: h.status,
    childName: h.childName
  })));

  // Aktuelle Woche Hortzettel
  const currentWeekHortzettel = hortzettel.filter(
    h => h.weekNumber === currentWeek && h.year === currentYear && h.status === 'aktiv'
  );

  console.log('[ModernParentDashboard] Current Week Hortzettel:', currentWeekHortzettel.length);

  // Aktive Hortzettel insgesamt
  const activeHortzettel = hortzettel.filter(h => h.status === 'aktiv');

  // Update hortzettel when initialHortzettel changes
  useEffect(() => {
    setHortzettel(initialHortzettel);
  }, [initialHortzettel]);

  useEffect(() => {
    loadAnnouncements();
    loadMessages();
    checkEditingAllowed();
  }, []);

  const checkEditingAllowed = async () => {
    try {
      setLoading(true);
      const restrictions = getCachedTimeRestrictionSettings();
      setTimeRestrictions(restrictions);
      const allowed = await isEditingAllowedAsync();
      setIsEditingAllowedState(allowed);
    } catch (error) {
      console.error('Error checking editing allowed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const response = await api.getAnnouncements();
      const announcementData = response.announcements || response;
      setAnnouncements(announcementData);
      
      // Check for unread announcements
      if (announcementData.length > 0) {
        const lastViewedKey = `last_viewed_announcements_${user.firstName}_${user.lastName}`;
        const lastViewed = localStorage.getItem(lastViewedKey);
        const lastViewedTime = lastViewed ? new Date(lastViewed).getTime() : 0;
        
        // Check if there are announcements newer than last viewed time
        const hasNewAnnouncements = announcementData.some((ann: Announcement) => {
          const announcementTime = new Date(ann.createdAt).getTime();
          return announcementTime > lastViewedTime;
        });
        
        setHasUnreadAnnouncements(hasNewAnnouncements);
      } else {
        setHasUnreadAnnouncements(false);
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  const markAnnouncementsAsRead = () => {
    const lastViewedKey = `last_viewed_announcements_${user.firstName}_${user.lastName}`;
    localStorage.setItem(lastViewedKey, new Date().toISOString());
    setHasUnreadAnnouncements(false);
  };

  const loadMessages = async () => {
    // Nur Nachrichten laden wenn ein Access Token vorhanden ist
    if (!api.getAccessToken()) {
      console.log('[ModernParentDashboard] Kein Access Token - überspringe Nachrichten-Laden');
      return;
    }
    
    try {
      const response = await api.getMessages();
      const messagesData = response?.messages || [];
      setMessages(messagesData);
      const unread = messagesData.filter((m: any) => !m.read).length;
      const repliedCount = messagesData.filter((msg: Message) => msg.status === 'beantwortet').length;
      setUnreadMessages(repliedCount);
    } catch (error: any) {
      // Stilles Fehlerbehandlung für 401 (nicht eingeloggt)
      if (!error.message?.includes('401')) {
        console.error('Error loading messages:', error);
      }
    }
  };

  const getChildName = (hortzettel: HortzettelData) => {
    if (hortzettel.childName) return hortzettel.childName;
    if (user.familyProfile?.children) {
      const child = user.familyProfile.children.find((c: any) => c.id === hortzettel.childId);
      if (child) return `${child.firstName} ${child.lastName}`;
    }
    return `${user.firstName} ${user.lastName}`;
  };

  const getWeekStatus = (weekHortzettel: any[]) => {
    if (weekHortzettel.length === 0) {
      return { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Noch kein Hortzettel' };
    }
    return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: 'Hortzettel vorhanden' };
  };

  const currentWeekStatus = getWeekStatus(currentWeekHortzettel);

  // Template verwenden - erstellt einen neuen Hortzettel basierend auf der Vorlage
  const handleUseTemplateAsHortzettel = async (template: any) => {
    try {
      const { weekNumber, year } = getWeekNumber();
      
      const hortzettelData: any = {
        childName: template.childName || `${user.firstName} ${user.lastName}`,
        childId: template.childId,
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
      };

      const response = await api.createHortzettel(hortzettelData);
      
      setHortzettel(prev => [
        ...prev,
        response.hortzettel
      ]);
      
      toast.success(`Hortzettel aus Vorlage "${template.name}" erstellt!`);
    } catch (error: any) {
      console.error('Error creating hortzettel from template:', error);
      toast.error(error.message || 'Fehler beim Erstellen des Hortzettels');
    }
  };

  // Swipe gesture handlers
  const tabs = ['home', 'hortzettel', 'support', 'profile'] as const;
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50;
    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > swipeThreshold) {
      const currentIndex = tabs.indexOf(currentTab);
      
      if (diffX > 0) {
        if (currentIndex < tabs.length - 1) {
          setSwipeDirection('left');
          setCurrentTab(tabs[currentIndex + 1]);
          if (navigator.vibrate) {
            navigator.vibrate(10);
          }
        }
      } else {
        if (currentIndex > 0) {
          setSwipeDirection('right');
          setCurrentTab(tabs[currentIndex - 1]);
          if (navigator.vibrate) {
            navigator.vibrate(10);
          }
        }
      }
    }
    
    touchStartX.current = 0;
    touchStartY.current = 0;
    touchEndX.current = 0;
    touchEndY.current = 0;
  };

  // Show MessagingView if active
  if (showMessaging) {
    return <MessagingView onBack={() => {
      setShowMessaging(false);
      loadMessages();
    }} userType="parent" />;
  }

  // HOME TAB - Nur Willkommen & Ankündigungen
  const renderHomeTab = () => (
    <div className="space-y-6 pb-24">
      {/* Header mit Begrüßung */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl mb-1">Guten Tag, {user.firstName}! 👋</h1>
            <p className="text-slate-600 dark:text-slate-400">
              {schoolName || 'Hortzettel-Verwaltung'}
            </p>
          </div>
          <ThemeToggle />
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <button 
            onClick={() => setCurrentTab('hortzettel')}
            className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 text-center hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors active:scale-95 cursor-pointer"
          >
            <div className="text-2xl mb-1">{activeHortzettel.length}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Hortzettel</div>
          </button>
          <button 
            onClick={() => setShowMessaging(true)}
            className="bg-green-50 dark:bg-green-950/30 rounded-xl p-3 text-center hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors active:scale-95 cursor-pointer relative"
          >
            {unreadMessages > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 animate-pulse">
                <span className="text-white text-[10px] font-medium">{unreadMessages}</span>
              </div>
            )}
            <div className="text-2xl mb-1">{messages.length}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Mitteilungen</div>
          </button>
          <button 
            onClick={() => {
              setCurrentTab('home');
              markAnnouncementsAsRead();
            }}
            className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-3 text-center relative hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-colors active:scale-95 cursor-pointer"
          >
            {hasUnreadAnnouncements && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse" />
            )}
            <div className="text-2xl mb-1">{announcements.length}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Nachrichten</div>
          </button>
        </div>
      </div>

      {/* Sperrung Info - wird nur angezeigt wenn gesperrt */}
      {!isEditingAllowedState && !loading && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 backdrop-blur-sm rounded-xl border border-amber-300/50 dark:border-amber-700/50 shadow-sm animate-pulse p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-amber-900 dark:text-amber-100 mb-1 font-medium">⚠️ Hortzettel gesperrt</h3>
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

      {/* Willkommenstext */}
      <Card className="p-6 border-slate-200 dark:border-slate-700 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Info className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-medium mb-2">Willkommen im Hortzettel-Portal</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Hier kannst du die Hortbetreuung für dein Kind planen. Wechsle zum "Hortzettel"-Tab um neue Formulare zu erstellen oder bestehende zu bearbeiten.
            </p>
          </div>
        </div>
      </Card>

      {/* Ankündigungen */}
      <div className="space-y-3" onMouseEnter={markAnnouncementsAsRead} onClick={markAnnouncementsAsRead}>
        <div className="flex items-center gap-2 px-1">
          <h2 className="text-lg">Ankündigungen</h2>
          {hasUnreadAnnouncements && (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </div>
        
        {announcements.length > 0 ? (
          <>
            {announcements.slice(0, 5).map((announcement, index) => (
              <Card key={announcement.id} className="p-4 border-slate-200 dark:border-slate-700 shadow-sm relative">
                {hasUnreadAnnouncements && index === 0 && (
                  <div className="absolute -top-2 -right-2">
                    <Badge variant="destructive" className="animate-pulse shadow-lg text-xs">
                      NEU
                    </Badge>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    announcement.type === 'urgent' ? 'bg-red-100 dark:bg-red-950/30' :
                    announcement.type === 'warning' ? 'bg-orange-100 dark:bg-orange-950/30' :
                    'bg-blue-100 dark:bg-blue-950/30'
                  }`}>
                    <Bell className={`w-5 h-5 ${
                      announcement.type === 'urgent' ? 'text-red-600' :
                      announcement.type === 'warning' ? 'text-orange-600' :
                      'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium mb-1">{announcement.title}</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{announcement.message}</p>
                    <div className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                      {new Date(announcement.createdAt).toLocaleDateString('de-DE', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </>
        ) : (
          <Card className="p-12 text-center border-slate-200 dark:border-slate-700">
            <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg mb-2">Keine Ankündigungen</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Zurzeit gibt es keine neuen Mitteilungen vom Hort
            </p>
          </Card>
        )}
      </div>

      {/* Schnellzugriff */}
      <div className="space-y-2">
        <h2 className="text-lg px-1">Schnellzugriff</h2>
        
        <button 
          onClick={onViewProfile}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm"
        >
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <span>Profil bearbeiten</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-red-600 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5" />
            <span>Abmelden</span>
          </div>
          <ChevronRight className="w-5 h-5 text-red-400" />
        </button>
      </div>
    </div>
  );

  // HORTZETTEL TAB - Alle Hortzettel-Funktionen
  const renderHortzettelTab = () => (
    <div className="space-y-6 pb-24">
      {/* Zurück Button */}
      <Button 
        variant="ghost" 
        onClick={() => setCurrentTab('home')}
        className="mb-2 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <ChevronRight className="w-5 h-5 mr-2 rotate-180" />
        Zurück
      </Button>

      {/* Schnellaktionen */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={isEditingAllowedState ? onCreateNew : undefined}
          disabled={!isEditingAllowedState}
          className={`bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-6 shadow-lg transition-transform ${
            isEditingAllowedState ? 'active:scale-95 cursor-pointer' : 'opacity-60 cursor-not-allowed'
          }`}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-medium">Neuer Hortzettel</span>
          </div>
        </button>

        <button
          onClick={onViewAllHortzettel}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 active:scale-95 transition-transform"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <span className="font-medium">Alle anzeigen</span>
          </div>
        </button>
      </div>

      {/* Wochenübersicht */}
      <div className="space-y-3">
        <h2 className="text-lg px-1">Wochenübersicht</h2>
        
        {/* Aktuelle Woche */}
        <Card className="p-4 border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Diese Woche</span>
              <Badge variant="outline" className="ml-1">KW {currentWeek}</Badge>
            </div>
            <currentWeekStatus.icon className={`w-5 h-5 ${currentWeekStatus.color}`} />
          </div>
          
          {currentWeekHortzettel.length > 0 ? (
            <div className="space-y-2">
              {currentWeekHortzettel.map(hz => (
                <button
                  key={hz.id}
                  onClick={() => onEditHortzettel(hz.id)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950/30 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{hz.class}</span>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{getChildName(hz)}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Klasse {hz.class}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Noch kein Hortzettel für diese Woche
              </p>
              {isEditingAllowedState && (
                <Button onClick={onCreateNew} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Jetzt erstellen
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Vorlagen */}
      <div>
        <TemplateManager onUseAsHortzettel={handleUseTemplateAsHortzettel} />
      </div>
    </div>
  );

  // SUPPORT TAB - Hilfe & Support
  const renderSupportTab = () => (
    <div className="space-y-6 pb-24">
      {/* Zurück Button */}
      <Button 
        variant="ghost" 
        onClick={() => setCurrentTab('home')}
        className="mb-2 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <ChevronRight className="w-5 h-5 mr-2 rotate-180" />
        Zurück
      </Button>

      <h1 className="text-2xl">Hilfe & Support</h1>
      
      {/* Nachricht an Admin senden */}
      <Card 
        onClick={() => setShowMessaging(true)}
        className="p-6 cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/20 dark:to-indigo-950/20"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md relative">
            <MessageCircle className="w-7 h-7 text-white" />
            {unreadMessages > 0 && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                <span className="text-white text-xs font-medium">{unreadMessages}</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-medium mb-1">Nachricht an Admin senden</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Fragen, Anregungen oder Probleme mitteilen
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </div>
      </Card>

      {/* Mein Profil */}
      <div className="space-y-3">
        <h2 className="text-lg px-1">Meine Informationen</h2>
        
        {/* Benutzer Info */}
        <Card className="p-5 border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">{user.firstName[0]}{user.lastName[0]}</span>
            </div>
            <div>
              <div className="text-lg font-medium">{user.firstName} {user.lastName}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Eltern-Account</div>
            </div>
          </div>
          
          {/* Kontaktinformationen */}
          {user.familyProfile?.parentPhone && (
            <div className="flex items-center gap-3 py-2 border-t border-slate-200 dark:border-slate-700">
              <Phone className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span className="text-sm">{user.familyProfile.parentPhone}</span>
            </div>
          )}
        </Card>

        {/* Kinder */}
        {user.familyProfile?.children && user.familyProfile.children.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-base px-1 font-medium">Meine Kinder</h3>
            {user.familyProfile.children.map((child: any, index: number) => (
              <Card key={index} className="p-4 border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-medium">{child.class || '?'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium mb-1">{child.firstName} {child.lastName}</div>
                    {child.class && (
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Klasse {child.class}</div>
                    )}
                    
                    {/* Kind-spezifische Infos */}
                    <div className="space-y-1.5 text-sm">
                      {child.birthDate && (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Geb.: {new Date(child.birthDate).toLocaleDateString('de-DE')}</span>
                        </div>
                      )}
                      {child.allergies && (
                        <div className="flex items-start gap-2 text-orange-600 dark:text-orange-400">
                          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          <span>Allergien: {child.allergies}</span>
                        </div>
                      )}
                      {child.medicalNotes && (
                        <div className="flex items-start gap-2 text-red-600 dark:text-red-400">
                          <Heart className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          <span>Medizinisch: {child.medicalNotes}</span>
                        </div>
                      )}
                      {child.authorizedPickup && (
                        <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                          <User className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          <span>Abholberechtigt: {child.authorizedPickup}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Notfallkontakt */}
        {user.familyProfile?.emergencyContactName && (
          <Card className="p-4 border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="font-medium text-red-900 dark:text-red-100 mb-1">Notfallkontakt</div>
                <div className="text-sm text-red-800 dark:text-red-200">{user.familyProfile.emergencyContactName}</div>
                {user.familyProfile.emergencyContactPhone && (
                  <div className="text-sm text-red-700 dark:text-red-300 mt-1">{user.familyProfile.emergencyContactPhone}</div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Schnellzugriff */}
      <div className="space-y-2">
        <h2 className="text-lg px-1">Aktionen</h2>
        
        <button 
          onClick={onViewProfile}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm"
        >
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <span>Profil bearbeiten</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        {onViewAppearanceSettings && (
          <button 
            onClick={onViewAppearanceSettings}
            className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <span>Farb-Einstellungen</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Info Box */}
      <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-slate-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <HelpCircle className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="mb-1">Benötigen Sie Hilfe?</h3>
            <p className="text-sm text-muted-foreground">
              Bei Fragen oder Problemen können Sie jederzeit eine Nachricht an den Admin senden. Die Antwort erhalten Sie direkt hier in der App.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );

  // PROFILE TAB
  const renderProfileTab = () => (
    <div className="space-y-6 pb-24">
      {/* Zurück Button */}
      <Button 
        variant="ghost" 
        onClick={() => setCurrentTab('home')}
        className="mb-2 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <ChevronRight className="w-5 h-5 mr-2 rotate-180" />
        Zurück
      </Button>

      <h1 className="text-2xl">Einstellungen</h1>
      
      {/* Benutzer Info */}
      <Card className="p-6 border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xl">{user.firstName[0]}{user.lastName[0]}</span>
          </div>
          <div>
            <div className="text-xl font-medium">{user.firstName} {user.lastName}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Eltern-Account</div>
          </div>
        </div>
      </Card>

      {/* Einstellungen */}
      <div className="space-y-2">
        <h2 className="text-lg px-1">Kontoeinstellungen</h2>

        <button 
          onClick={onViewProfile}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm"
        >
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <span>Profil bearbeiten</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        {onViewAppearanceSettings && (
          <button 
            onClick={onViewAppearanceSettings}
            className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <span>Farb-Einstellungen</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        )}

        <button 
          onClick={() => setCurrentTab('support')}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm"
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <span>Hilfe & Support</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-red-600 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5" />
            <span>Abmelden</span>
          </div>
          <ChevronRight className="w-5 h-5 text-red-400" />
        </button>
      </div>

      {/* Design-Umschaltung */}
      {onToggleDesign && (
        <div className="space-y-2">
          <h2 className="text-lg px-1">App-Design</h2>
          <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="mb-1">Design wechseln</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Wähle zwischen dem klassischen und modernen Dashboard-Design
                </p>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-auto py-3 flex flex-col items-center gap-2 border-2 hover:border-blue-500 dark:hover:border-blue-400"
                    onClick={() => onToggleDesign(false)}
                  >
                    <span className="text-2xl">📋</span>
                    <span className="font-medium">Klassisch</span>
                    <span className="text-xs text-muted-foreground mt-1">Wechseln</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 h-auto py-3 flex flex-col items-center gap-2 border-2"
                    disabled
                  >
                    <span className="text-2xl">📱</span>
                    <span className="font-medium">Modern</span>
                    <Badge variant="default" className="mt-1">Aktiv</Badge>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  return (
    <div 
      className="min-h-screen bg-slate-50 dark:bg-slate-900"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {currentTab === 'home' && renderHomeTab()}
        {currentTab === 'hortzettel' && renderHortzettelTab()}
        {currentTab === 'support' && renderSupportTab()}
        {currentTab === 'profile' && renderProfileTab()}
      </div>

      {/* Bottom Navigation - Commerzbank Style */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg safe-area-inset-bottom">
        <div className="max-w-2xl mx-auto grid grid-cols-4 gap-1 px-2 py-2">
          <button
            onClick={() => setCurrentTab('home')}
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-colors relative ${
              currentTab === 'home' 
                ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Start</span>
            {hasUnreadAnnouncements && (
              <div className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setCurrentTab('hortzettel')}
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
            onClick={() => setCurrentTab('support')}
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-colors relative ${
              currentTab === 'support' 
                ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <HelpCircle className="w-6 h-6" />
            <span className="text-xs font-medium">Hilfe</span>
            {unreadMessages > 0 && (
              <div className="absolute top-1 right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">{unreadMessages}</span>
              </div>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('profile')}
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-colors ${
              currentTab === 'profile' 
                ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs font-medium">Mehr</span>
          </button>
        </div>
      </div>
    </div>
  );
}
