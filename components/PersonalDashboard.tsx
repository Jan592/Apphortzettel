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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";

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
  schoolPhotoUrl?: string;
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
  schoolPhotoUrl: externalSchoolPhotoUrl
}: PersonalDashboardProps) {
  const [currentTab, setCurrentTab] = useState<'home' | 'hortzettel' | 'mitteilungen' | 'profil'>('home');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolName, setSchoolName] = useState<string>("Grundschule Auma");
  const [schoolPhotoUrl, setSchoolPhotoUrl] = useState<string>(externalSchoolPhotoUrl || "https://images.unsplash.com/photo-1665270695165-93b5798522ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnZXJtYW4lMjBlbGVtZW50YXJ5JTIwc2Nob29sJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzYyODU4MzU5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral");
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
      {/* Welcome Hero Section - Modernized */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl border border-blue-200/50 dark:border-blue-700/50 shadow-lg my-6 backdrop-blur-sm"
      >
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{ 
              duration: 20,
              repeat: Infinity,
              ease: "linear" 
            }}
            className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              rotate: [90, 0, 90],
            }}
            transition={{ 
              duration: 15,
              repeat: Infinity,
              ease: "linear" 
            }}
            className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-400/20 to-transparent rounded-full blur-3xl"
          />
        </div>

        <div className="relative flex flex-col items-center text-center space-y-4 px-8 py-8">
          {/* Welcome Icon mit Schulfoto */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              delay: 0.2,
              type: "spring",
              stiffness: 200 
            }}
            className="relative"
          >
            <div className="w-24 h-24 rounded-full overflow-hidden shadow-2xl ring-4 ring-white/50 dark:ring-slate-800/50">
              <ImageWithFallback
                src={schoolPhotoUrl}
                alt="Schulgebäude"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Pulse Ring Animation */}
            <motion.div 
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5] 
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity 
              }}
              className="absolute inset-0 rounded-full bg-blue-400/30"
            />
          </motion.div>
          
          {/* Welcome Text */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Willkommen zurück!
              </h2>
              {hasUnreadAnnouncements && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    delay: 0.5,
                    type: "spring",
                    stiffness: 300 
                  }}
                >
                  <Badge variant="destructive" className="animate-pulse shadow-lg">
                    Neu
                  </Badge>
                </motion.div>
              )}
            </div>
            <p className="text-2xl font-semibold text-slate-700 dark:text-slate-200">
              {firstName} 👋
            </p>
            <p className="text-base text-slate-600 dark:text-slate-400 max-w-md">
              Alles Wichtige für deine Hortzettel auf einen Blick
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Quick Stats - Modernized */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Card 
            onClick={() => setCurrentTab('hortzettel')}
            className="relative overflow-hidden p-6 text-center bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/30 border-blue-200/50 dark:border-blue-700/50 cursor-pointer shadow-lg hover:shadow-xl transition-all group"
          >
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-blue-500/10 group-hover:from-blue-400/10 group-hover:to-blue-500/20 transition-all duration-300" />
            
            <div className="relative flex flex-col items-center space-y-3">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <div className="text-4xl font-bold bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
                {hortzettelList.filter(h => h.status === 'aktiv').length}
              </div>
              <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Aktive<br/>Hortzettel
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Card 
            onClick={() => {
              setCurrentTab('mitteilungen');
              markAnnouncementsAsRead();
            }}
            className="relative overflow-hidden p-6 text-center bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/40 dark:to-purple-900/30 border-purple-200/50 dark:border-purple-700/50 cursor-pointer shadow-lg hover:shadow-xl transition-all group"
          >
            {/* Notification Badge */}
            {hasUnreadAnnouncements && (
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 shadow-lg z-10"
              />
            )}
            
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 to-purple-500/10 group-hover:from-purple-400/10 group-hover:to-purple-500/20 transition-all duration-300" />
            
            <div className="relative flex flex-col items-center space-y-3">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                <Bell className="h-7 w-7 text-white" />
              </div>
              <div className="text-4xl font-bold bg-gradient-to-br from-purple-600 to-purple-800 dark:from-purple-400 dark:to-purple-600 bg-clip-text text-transparent">
                {announcements.length}
              </div>
              <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Mitteilungen<br/>vom Hort
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Card 
            onClick={() => setShowMessaging(true)}
            className="relative overflow-hidden p-6 text-center bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/40 dark:to-green-900/30 border-green-200/50 dark:border-green-700/50 cursor-pointer shadow-lg hover:shadow-xl transition-all group"
          >
            {/* Notification Badge */}
            {repliedMessagesCount > 0 && (
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-lg z-10"
              >
                <span className="text-white text-xs font-bold">{repliedMessagesCount}</span>
              </motion.div>
            )}
            
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/0 to-green-500/10 group-hover:from-green-400/10 group-hover:to-green-500/20 transition-all duration-300" />
            
            <div className="relative flex flex-col items-center space-y-3">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                <MessageCircle className="h-7 w-7 text-white" />
              </div>
              <div className="text-4xl font-bold bg-gradient-to-br from-green-600 to-green-800 dark:from-green-400 dark:to-green-600 bg-clip-text text-transparent">
                {repliedMessagesCount}
              </div>
              <div className="text-sm font-medium text-green-700 dark:text-green-300">
                Nachrichten<br/>vom Admin
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Card 
            onClick={() => setShowHelpGuide(true)}
            className="relative overflow-hidden p-6 text-center bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/30 border-amber-200/50 dark:border-amber-700/50 cursor-pointer shadow-lg hover:shadow-xl transition-all group"
          >
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/0 to-amber-500/10 group-hover:from-amber-400/10 group-hover:to-amber-500/20 transition-all duration-300" />
            
            <div className="relative flex flex-col items-center space-y-3">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                <HelpCircle className="h-7 w-7 text-white" />
              </div>
              <div className="text-4xl font-bold">
                <span className="text-transparent">0</span>
              </div>
              <div className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Anleitung &<br/>Hilfe
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Sperrung Info - wird nur angezeigt wenn gesperrt */}
      {!isEditingAllowedState && !loading && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/40 dark:via-orange-950/40 dark:to-red-950/40 rounded-2xl border-2 border-amber-300 dark:border-amber-800 p-5 shadow-lg">
            {/* Animated Warning Stripes */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500 to-transparent animate-pulse" />
            </div>
            
            <div className="relative flex items-start gap-4">
              <motion.div 
                animate={{ rotate: [0, 10, 0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
              >
                <AlertTriangle className="h-6 w-6 text-white" />
              </motion.div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-2">
                  ⚠️ Hortzettel gesperrt
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200/90 leading-relaxed">
                  Das Erstellen und Bearbeiten von Hortzetteln ist aktuell nicht möglich.
                  {timeRestrictions.enabled && (
                    <span className="block mt-2 font-medium">
                      📅 Bearbeitungen sind {timeRestrictions.blockWeekdaysOnly ? "Mo-Fr" : "täglich"} ab {timeRestrictions.blockEndHour}:00 Uhr wieder möglich.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Info Box - Modernized */}
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="bg-blue-50/50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-700 p-6 shadow-lg">
            <div className="flex items-center justify-center h-20">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-3 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Lade Informationen...</span>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 rounded-2xl border border-blue-200/50 dark:border-blue-700/50 p-6 shadow-lg">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-transparent to-purple-500" />
            </div>
            
            <div className="relative flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Info className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  ℹ️ Wichtige Informationen
                </h3>
                <div className="space-y-2.5 text-sm text-blue-800 dark:text-blue-200/90">
                  {timeRestrictions.enabled ? (
                    <>
                      <div className="flex items-start gap-3 bg-white/50 dark:bg-slate-800/50 rounded-lg p-3">
                        <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">
                          <strong className="text-blue-900 dark:text-blue-100">Zeitbeschränkung:</strong> {timeRestrictions.blockWeekdaysOnly ? "Montag-Freitag" : "Täglich"} zwischen {timeRestrictions.blockStartHour}:00 und {timeRestrictions.blockEndHour}:00 Uhr können keine Hortzettel erstellt oder bearbeitet werden
                        </span>
                      </div>
                      <div className="flex items-start gap-3 bg-white/50 dark:bg-slate-800/50 rounded-lg p-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">
                          <strong className="text-blue-900 dark:text-blue-100">Erlaubt:</strong> {timeRestrictions.blockWeekdaysOnly ? "Mo-Fr" : "Täglich"} bis {timeRestrictions.blockStartHour}:00 Uhr und ab {timeRestrictions.blockEndHour}:00 Uhr
                          {timeRestrictions.blockWeekdaysOnly && ", am Wochenende jederzeit"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-start gap-3 bg-white/50 dark:bg-slate-800/50 rounded-lg p-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">
                        <strong className="text-blue-900 dark:text-blue-100">Zeitbeschränkung:</strong> Deaktiviert - Hortzettel können jederzeit erstellt und bearbeitet werden
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );

  // HORTZETTEL TAB - Alle Hortzettel-Funktionen
  const renderHortzettelTab = () => (
    <div className="space-y-6 pb-24">
      {/* Hero Section - Modernized */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-3xl border border-blue-200/50 dark:border-blue-700/50 shadow-lg my-6 backdrop-blur-sm"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-transparent to-purple-500" />
        </div>
        <div className="relative flex flex-col items-center text-center space-y-3 px-6 py-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-xl"
          >
            <FileText className="h-8 w-8 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Hortzettel-Verwaltung
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400">
            Erstelle und verwalte deine Hortzettel
          </p>
        </div>
      </motion.div>

      {/* Schnellaktionen - Modernized */}
      <div className="grid grid-cols-2 gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: isEditingAllowedState ? 1.05 : 1 }}
              whileTap={{ scale: isEditingAllowedState ? 0.95 : 1 }}
            >
              <Card
                onClick={isEditingAllowedState ? onCreateHortzettel : undefined}
                className={`relative overflow-hidden p-6 text-center ${
                  isEditingAllowedState
                    ? 'bg-gradient-to-br from-blue-50 via-blue-100/50 to-indigo-50 dark:from-blue-950/30 dark:via-blue-900/20 dark:to-indigo-950/30 border-blue-200 dark:border-blue-700 cursor-pointer shadow-lg hover:shadow-xl'
                    : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-gray-300 dark:border-gray-700'
                } transition-all group`}
              >
                {isEditingAllowedState && (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                <div className="relative flex flex-col items-center space-y-3">
                  <div className={`w-14 h-14 ${
                    isEditingAllowedState ? 'bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg' : 'bg-gray-400'
                  } rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Plus className="h-7 w-7 text-white" />
                  </div>
                  <span className="text-sm font-semibold">Neuer Hortzettel</span>
                </div>
              </Card>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{isEditingAllowedState ? 'Neuen Hortzettel erstellen' : 'Aktuell nicht verfügbar'}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card
                onClick={onViewMyHortzettel}
                className="relative overflow-hidden text-center bg-gradient-to-br from-purple-50 via-purple-100/50 to-pink-50 dark:from-purple-950/30 dark:via-purple-900/20 dark:to-pink-950/30 border-purple-200 dark:border-purple-700 cursor-pointer shadow-lg hover:shadow-xl transition-all group p-6"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex flex-col items-center space-y-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                  <span className="text-sm font-semibold">Alle anzeigen</span>
                </div>
              </Card>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Alle Hortzettel anzeigen</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Aktuelle Woche - Modernized */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-800/50 dark:via-blue-900/10 dark:to-indigo-900/10 border-slate-200 dark:border-slate-700 shadow-lg p-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-full blur-3xl" />

          <div className="relative flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="mb-0 text-lg font-bold">Diese Woche</h3>
                <p className="text-sm text-muted-foreground font-medium">KW {currentWeek} • {currentYear}</p>
              </div>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
            >
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${currentWeekStatus.bg} shadow-md`}>
                <currentWeekStatus.icon className={`w-5 h-5 ${currentWeekStatus.color}`} />
                <span className={`text-sm font-bold ${currentWeekStatus.color}`}>
                  {currentWeekStatus.label}
                </span>
              </div>
            </motion.div>
          </div>

          {currentWeekHortzettel.length > 0 ? (
            <div className="space-y-3">
              {currentWeekHortzettel.map((hz, index) => (
                <Tooltip key={hz.id}>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        onClick={onViewMyHortzettel}
                        className="relative overflow-hidden p-4 cursor-pointer bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-md hover:shadow-xl transition-all group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <span className="text-white font-bold text-base">{hz.class}</span>
                            </div>
                            <div>
                              <div className="font-semibold text-base">{hz.childName || `${firstName} ${lastName}`}</div>
                              <div className="text-sm text-muted-foreground">Klasse {hz.class}</div>
                            </div>
                          </div>
                          <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Card>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Details anzeigen und bearbeiten</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-center bg-gradient-to-br from-orange-50 via-amber-50/50 to-orange-50 dark:from-orange-950/30 dark:via-amber-950/20 dark:to-orange-950/30 rounded-2xl border-2 border-orange-200/50 dark:border-orange-800/50 py-8 px-4 shadow-lg">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                <p className="text-base font-medium text-slate-700 dark:text-slate-300 mb-4">
                  Noch kein Hortzettel für diese Woche
                </p>
                {isEditingAllowedState && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button onClick={onCreateHortzettel} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg font-semibold">
                      <Plus className="w-5 h-5 mr-2" />
                      Jetzt erstellen
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </Card>
      </motion.div>

      {/* Alle Hortzettel - Modernized */}
      {activeHortzettel.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Weitere Hortzettel
            </h3>
          </div>

          <div className="space-y-3">
            {activeHortzettel.slice(0, 3).map((hz, index) => (
              <Tooltip key={hz.id}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      onClick={onViewMyHortzettel}
                      className="relative overflow-hidden p-5 cursor-pointer bg-gradient-to-br from-white to-indigo-50/30 dark:from-slate-800 dark:to-indigo-950/20 border-slate-200 dark:border-slate-700 shadow-md hover:shadow-xl transition-all group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <span className="text-white font-bold text-lg">{hz.class}</span>
                          </div>
                          <div>
                            <div className="font-bold text-base">{hz.childName || `${firstName} ${lastName}`}</div>
                            <div className="text-sm text-muted-foreground font-medium">
                              KW {hz.weekNumber} • {hz.year}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={hz.status === 'aktiv' ? 'default' : 'secondary'}
                            className="shadow-sm font-semibold"
                          >
                            {hz.status}
                          </Badge>
                          <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Hortzettel öffnen und verwalten</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {activeHortzettel.length > 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={onViewMyHortzettel}
                variant="outline"
                className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-md hover:shadow-lg font-semibold text-base py-6"
              >
                Alle {activeHortzettel.length} Hortzettel anzeigen
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Vorlagen - Modernized */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50/50 to-teal-50/30 dark:from-emerald-950/30 dark:via-green-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-700 shadow-lg p-5">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-400/10 to-teal-500/10 rounded-full blur-3xl" />

          <div className="relative flex items-center gap-4 mb-5">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="mb-0 text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Vorlagen
              </h3>
              <p className="text-sm text-muted-foreground font-medium">
                Schnell Hortzettel erstellen
              </p>
            </div>
          </div>

          <div className="relative">
            <TemplateManager onUseTemplate={handleUseTemplateAsHortzettel} />
          </div>
        </Card>
      </motion.div>
    </div>
  );

  // MITTEILUNGEN TAB
  const renderMitteilungenTab = () => (
    <div className="space-y-6 pb-24" onMouseEnter={markAnnouncementsAsRead} onClick={markAnnouncementsAsRead}>
      {/* Hero Section - Modernized */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-rose-500/10 rounded-3xl border border-purple-200/50 dark:border-purple-700/50 shadow-lg my-6 backdrop-blur-sm"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500" />
        </div>
        <div className="relative flex flex-col items-center text-center space-y-3 px-6 py-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="relative"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
              <Bell className="h-8 w-8 text-white" />
            </div>
            {hasUnreadAnnouncements && (
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 shadow-lg"
              />
            )}
          </motion.div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
            Mitteilungen vom Hort
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400">
            Wichtige Informationen für Eltern
          </p>
        </div>
      </motion.div>

      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl border border-blue-200 dark:border-blue-700 p-8 shadow-lg">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                <Bell className="h-8 w-8 text-white animate-pulse" />
              </div>
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Lade Mitteilungen...</div>
            </div>
          </div>
        </motion.div>
      ) : announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((announcement, index) => {
            const style = getAnnouncementStyle(announcement.type);
            const IconComponent = style.icon;
            return (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`relative overflow-hidden bg-gradient-to-r ${style.gradient} border-2 ${style.border} p-6 shadow-lg hover:shadow-xl transition-all`}
                >
                  {hasUnreadAnnouncements && index === 0 && (
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute -top-2 -right-2"
                    >
                      <Badge variant="destructive" className="shadow-lg font-bold">
                        🔔 NEU
                      </Badge>
                    </motion.div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 ${style.iconBg} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <IconComponent className={`h-7 w-7 ${style.iconColor}`} />
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
            </motion.div>
            )
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="text-center p-12 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50 border-slate-200 dark:border-slate-700 shadow-lg rounded-2xl">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Bell className="h-12 w-12 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-slate-600 to-slate-800 dark:from-slate-300 dark:to-slate-100 bg-clip-text text-transparent">
              Keine Mitteilungen
            </h3>
            <p className="text-base text-muted-foreground">
              Es gibt derzeit keine Mitteilungen vom Hort.
            </p>
          </Card>
        </motion.div>
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

      {/* Hero Section - Modernized */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-slate-500/10 via-indigo-500/10 to-blue-500/10 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg backdrop-blur-sm"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-500 via-transparent to-blue-500" />
        </div>
        <div className="relative flex flex-col items-center text-center space-y-3 px-6 py-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-gradient-to-br from-slate-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-xl"
          >
            <Settings className="h-8 w-8 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Einstellungen & Profil
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400">
            Verwalte dein Konto und deine Einstellungen
          </p>
        </div>
      </motion.div>

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