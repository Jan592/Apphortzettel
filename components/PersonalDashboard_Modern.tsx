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
  schoolPhotoUrl?: string;
}

export default function PersonalDashboard_Modern({ 
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
          `Sie haben bereits einen Hortzettel für KW ${weekNumber}, ${year}.\\n\\nMöchten Sie diesen mit der Vorlage "${template.name}" überschreiben?`
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

  if (showHelpGuide) {
    return <HelpGuide onBack={() => setShowHelpGuide(false)} />;
  }

  // Rest of the component implementation is the same as PersonalDashboard.tsx
  // This is a placeholder for now - the actual component would need all the render functions
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-4">
        <p>Modern Dashboard - Component Implementation Needed</p>
        <Button onClick={onLogout}>Logout</Button>
      </div>
    </div>
  );
}
