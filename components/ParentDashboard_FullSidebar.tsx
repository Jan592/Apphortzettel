// OPTION 2: Full Sidebar - Hamburger + Slide-Out auf Mobile, Fixe Sidebar auf Desktop
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
  AlertTriangle,
  Menu,
  X
} from "lucide-react";
import type { HortzettelData, Announcement, Message, TimeRestrictionSettings, HortzettelTemplate } from "../types/hortzettel";
import { getWeekNumber, formatWeekDisplay, isEditingAllowedAsync, getCachedTimeRestrictionSettings } from "../utils/weekUtils";
import { api } from "../utils/api";
import { toast } from "sonner@2.0.3";
import { ThemeToggle } from "./ThemeToggle";
import MessagingView from "./MessagingView";
import TemplateManager from "./TemplateManager";
import { motion, AnimatePresence } from "motion/react";

interface ParentDashboardFullSidebarProps {
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

export default function ParentDashboardFullSidebar({
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
}: ParentDashboardFullSidebarProps) {
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentWeekData = getWeekNumber(new Date());
  const currentWeek = currentWeekData.weekNumber;
  const currentYear = currentWeekData.year;

  const currentWeekHortzettel = hortzettel.filter(
    h => h.weekNumber === currentWeek && h.year === currentYear && h.status === 'aktiv'
  );
  const activeHortzettel = hortzettel.filter(h => h.status === 'aktiv');

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
      
      if (announcementData.length > 0) {
        const lastViewedKey = `last_viewed_announcements_${user.firstName}_${user.lastName}`;
        const lastViewed = localStorage.getItem(lastViewedKey);
        const lastViewedTime = lastViewed ? new Date(lastViewed).getTime() : 0;
        
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
    if (!api.getAccessToken()) {
      return;
    }
    
    try {
      const response = await api.getMessages();
      const messagesData = response?.messages || [];
      setMessages(messagesData);
      const repliedCount = messagesData.filter((msg: Message) => msg.status === 'beantwortet').length;
      setUnreadMessages(repliedCount);
    } catch (error: any) {
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

  if (showMessaging) {
    return <MessagingView onBack={() => {
      setShowMessaging(false);
      loadMessages();
    }} userType="parent" />;
  }

  // Sidebar Navigation Items
  const navItems = [
    { 
      id: 'home' as const, 
      icon: Home, 
      label: 'Start', 
      badge: hasUnreadAnnouncements 
    },
    { 
      id: 'hortzettel' as const, 
      icon: FileText, 
      label: 'Hortzettel', 
      badge: false 
    },
    { 
      id: 'support' as const, 
      icon: HelpCircle, 
      label: 'Hilfe', 
      badge: unreadMessages > 0,
      badgeCount: unreadMessages 
    },
    { 
      id: 'profile' as const, 
      icon: Settings, 
      label: 'Einstellungen', 
      badge: false 
    },
  ];

  const handleNavClick = (tabId: typeof currentTab) => {
    setCurrentTab(tabId);
    setSidebarOpen(false);
  };

  // SIDEBAR COMPONENT (used for both mobile and desktop)
  const SidebarContent = () => (
    <>
      {/* Logo & Branding */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">Hortzettel</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Eltern-Portal</p>
            </div>
          </div>
          {/* Close button - only on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative ${
              currentTab === item.id
                ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-medium shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && !item.badgeCount && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
            {item.badgeCount && item.badgeCount > 0 && (
              <Badge variant="destructive" className="text-xs px-1.5 min-w-[20px] h-5 flex items-center justify-center">
                {item.badgeCount}
              </Badge>
            )}
          </button>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">{user.firstName[0]}{user.lastName[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Eltern-Account</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Abmelden
          </Button>
        </div>
      </div>
    </>
  );

  // CONTENT RENDERING (same as hybrid version)
  const renderContent = () => {
    if (currentTab === 'home') {
      return (
        <div className="space-y-6">
          {/* Header mit Begrüßung */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl mb-1">Guten Tag, {user.firstName}! 👋</h1>
                <p className="text-slate-600 dark:text-slate-400">
                  {schoolName || 'Hortzettel-Verwaltung'}
                </p>
              </div>
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

          {/* Sperrung Info */}
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
        </div>
      );
    }

    if (currentTab === 'hortzettel') {
      return (
        <div className="space-y-6">
          <h1 className="text-2xl">Hortzettel</h1>

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
    }

    if (currentTab === 'support') {
      return (
        <div className="space-y-6">
          <h1 className="text-2xl">Hilfe & Support</h1>
          
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
        </div>
      );
    }

    if (currentTab === 'profile') {
      return (
        <div className="space-y-6">
          <h1 className="text-2xl">Einstellungen</h1>
          
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

          <div className="space-y-2">
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
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      {/* DESKTOP SIDEBAR (≥ 768px) - Fixed */}
      <aside className="hidden md:flex md:flex-col md:w-64 lg:w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 fixed h-screen z-40">
        <SidebarContent />
      </aside>

      {/* MOBILE SIDEBAR (< 768px) - Slide-out with backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            
            {/* Sidebar */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-800 shadow-2xl z-50 flex flex-col"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-64 lg:ml-72">
        {/* Mobile Header with Hamburger */}
        <div className="md:hidden sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-semibold">Hortzettel</h1>
          </div>
          <ThemeToggle />
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
