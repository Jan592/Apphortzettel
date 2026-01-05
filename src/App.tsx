import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Button } from "./components/ui/button";
import { Shield, HelpCircle, X, ChevronRight } from "lucide-react";
import { Toaster, toast } from "sonner@2.0.3";
import { LoginForm } from "./components/LoginForm";
import { RegisterForm } from "./components/RegisterForm";
import CreateHortzettelForm from "./components/CreateHortzettelForm";
import MyHortzettelList from "./components/MyHortzettelList";
import type { HortzettelData, ChildProfile, FamilyProfile } from "./types/hortzettel";
import { AppLogo } from "./components/AppLogo";
import ProfileView from "./components/ProfileView";
import SplashScreen from "./components/SplashScreen";
import HortnerLogin from "./components/HortnerLogin";
import HortnerDashboard from "./components/HortnerDashboard";
import ModernParentDashboard from "./components/ModernParentDashboard";
import PersonalDashboard from "./components/PersonalDashboard";
import AppearanceSettings from "./components/AppearanceSettings";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import { api } from "./utils/api";
import { ThemeProvider } from "./utils/themeContext";
import { LegalPages } from "./components/LegalPages";
import { initializeDesignSettings } from "./components/DesignSettingsManager";
import { APP_CONFIG } from "./config/app-config";
import { saveSession, getSession, clearSession } from "./utils/sessionManager";
import { FirstChildSetup } from "./components/FirstChildSetup";
import HelpGuide from "./components/HelpGuide";
import type { Child } from "./types/hortzettel";
import { Card } from "./components/ui/card";

type View = "login" | "dashboard" | "createHortzettel" | "myHortzettel" | "profile" | "appearanceSettings" | "hortnerLogin" | "hortnerDashboard" | "adminLogin" | "adminDashboard" | "firstChildSetup";

type StoredHortzettel = HortzettelData & { 
  id: string; 
  createdAt: Date;
};

function AppContent() {
  // Version Check Log
  console.log('🔧 [APP LOADED] Version mit Hilfe & Support Tab - Nov 3, 2025, 15:00');
  
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [currentView, setCurrentView] = useState<View>("login");
  const [user, setUser] = useState<{ firstName: string; lastName: string; childProfile?: ChildProfile; familyProfile?: FamilyProfile; role?: 'parent' | 'hortner' | 'admin' } | null>(null);
  const [hortzettelList, setHortzettelList] = useState<StoredHortzettel[]>([]);
  const [editingHortzettelId, setEditingHortzettelId] = useState<string | null>(null);
  const [hortnerKlasse, setHortnerKlasse] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [schoolName, setSchoolName] = useState<string>("Grundschule Auma");
  const [appContent, setAppContent] = useState<any>({
    appTitle: "Hortzettel App",
    loginTitle: "Anmelden",
    registerTitle: "Registrieren",
  });
  const [showLegalDialog, setShowLegalDialog] = useState(false);
  const [legalPage, setLegalPage] = useState<'privacy' | 'terms' | null>(null);
  const [showAdminButtons, setShowAdminButtons] = useState(false);
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [showLoginHelpDialog, setShowLoginHelpDialog] = useState(false);
  const [useModernDesign, setUseModernDesign] = useState(() => {
    // Load design preference from localStorage
    const saved = localStorage.getItem('dashboard_design_preference');
    return saved === 'modern';
  });

  const [availableClasses, setAvailableClasses] = useState<string[]>(["Hort 1", "Hort 2", "Hort 3", "Hort 4"]);

  const loadSchoolName = async () => {
    try {
      const response = await api.getSettings();
      console.log("🔍 [App.tsx] Loaded settings:", response.settings);
      
      if (response.settings?.schoolName) {
        setSchoolName(response.settings.schoolName);
        console.log("✅ [App.tsx] School name set to:", response.settings.schoolName);
      } else {
        console.warn("⚠️ [App.tsx] No schoolName in settings, using default");
      }
      
      if (response.settings?.content) {
        setAppContent(response.settings.content);
        console.log("✅ [App.tsx] App content loaded:", response.settings.content);
      } else {
        console.log("ℹ️ [App.tsx] Using default app content (Backend settings not available)");
      }

      if (response.settings?.classes) {
        setAvailableClasses(response.settings.classes.filter((c: string) => c && c.trim() !== ''));
        console.log("✅ [App.tsx] Available classes loaded:", response.settings.classes);
      }
    } catch (error) {
      console.error('❌ [App.tsx] Error loading settings:', error);
    }
  };

  // Check URL parameters for admin access
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('admin')) {
      setShowAdminButtons(true);
      setCurrentView('adminLogin');
      console.log('🔑 Admin-Zugang über URL aktiviert');
    }
  }, []);

  // Load app settings (schoolName, appContent) on mount
  useEffect(() => {
    loadSchoolName();
    
    // Load design settings
    initializeDesignSettings();
    
    // Listen for settings updates from AdminDashboard
    const handleSettingsUpdate = (event: CustomEvent) => {
      console.log('[App.tsx] Settings updated event received', event.detail);
      // Reload all settings
      loadSchoolName();
      initializeDesignSettings();
      
      // Force a re-render by updating a dummy state if needed
      console.log('✅ [App.tsx] Settings reloaded successfully');
    };
    
    window.addEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
  }, []);

  // Update document title based on current view
  useEffect(() => {
    // Set title based on current view
    const viewTitles: Record<View, string> = {
      login: "Hortzettel",
      dashboard: "Hortzettel - Dashboard",
      createHortzettel: "Hortzettel - Erstellen",
      myHortzettel: "Hortzettel - Meine Zettel",
      profile: "Hortzettel - Profil",
      appearanceSettings: "Hortzettel - Einstellungen",
      hortnerLogin: "Hortzettel - Hortner Login",
      hortnerDashboard: "Hortzettel - Hortner",
      adminLogin: "Hortzettel - Admin Login",
      adminDashboard: "Hortzettel - Admin",
      firstChildSetup: "Hortzettel - Kind hinzufügen"
    };
    
    document.title = viewTitles[currentView] || "Hortzettel";
  }, [currentView]);

  // Debug: Log when editingHortzettelId changes
  useEffect(() => {
    console.log('[App.tsx] editingHortzettelId changed to:', editingHortzettelId);
    console.log('[App.tsx] currentView:', currentView);
  }, [editingHortzettelId, currentView]);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for Hortner session first
        const hortnerSession = localStorage.getItem('hortner_session');
        if (hortnerSession) {
          try {
            const session = JSON.parse(hortnerSession);
            console.log('🔍 [App.tsx] Hortner session found:', session);
            // Check if session is less than 30 days old
            const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
            if (Date.now() - session.timestamp < thirtyDaysInMs && session.klasse) {
              console.log('✅ [App.tsx] Restoring Hortner session for:', session.klasse);
              setHortnerKlasse(session.klasse);
              setCurrentView("hortnerDashboard");
              setLoading(false);
              return;
            } else {
              // Session expired or invalid
              console.log('❌ [App.tsx] Hortner session expired or invalid');
              localStorage.removeItem('hortner_session');
            }
          } catch (error) {
            console.error('Error parsing hortner session:', error);
            localStorage.removeItem('hortner_session');
          }
        }

        // Check for "Angemeldet bleiben" session
        const userSession = getSession();
        if (userSession) {
          try {
            console.log('🔄 Auto-Login mit gespeicherter Session...');
            // Try to get user data with existing token
            const token = api.getAccessToken();
            if (token) {
              const userData = await api.getUser();
              const userRole = userData.role || 'parent';
              
              setUser({
                firstName: userData.firstName,
                lastName: userData.lastName,
                childProfile: userData.childProfile,
                familyProfile: userData.familyProfile,
                role: userRole
              });
              
              // Route basierend auf Rolle
              if (userRole === 'admin') {
                setCurrentView("adminDashboard");
              } else if (userRole === 'hortner') {
                // Hortner zum Hortner-Dashboard
                // Extrahiere Klassennummer aus dem Nachnamen
                const klassennummer = userData.lastName; // "1", "2", "3", oder "4"
                setHortnerKlasse(`hort-${klassennummer}`);
                setCurrentView("hortnerDashboard");
                console.log(`🎓 Hortner-Session wiederhergestellt - Klasse: hort-${klassennummer}`);
              } else {
                // Eltern-Dashboard
                setCurrentView("dashboard");
                await loadHortzettel();
              }
              
              console.log('✅ Auto-Login erfolgreich');
              setLoading(false);
              return;
            }
          } catch (error) {
            console.log('⚠️ Auto-Login fehlgeschlagen, Session wird gelöscht');
            clearSession();
            api.logout();
            // Don't log the error details, just clean up
          }
        }

        // Check for normal user session (without "Angemeldet bleiben")
        const token = api.getAccessToken();
        if (token) {
          try {
            const userData = await api.getUser();
            const userRole = userData.role || 'parent';
            
            setUser({
              firstName: userData.firstName,
              lastName: userData.lastName,
              childProfile: userData.childProfile,
              familyProfile: userData.familyProfile,
              role: userRole
            });
            
            // Route basierend auf Rolle
            if (userRole === 'admin') {
              setCurrentView("adminDashboard");
            } else if (userRole === 'hortner') {
              // Hortner zum Hortner-Dashboard
              // Extrahiere Klassennummer aus dem Nachnamen
              const klassennummer = userData.lastName; // "1", "2", "3", oder "4"
              setHortnerKlasse(`hort-${klassennummer}`);
              setCurrentView("hortnerDashboard");
              console.log(`🎓 Hortner-Session wiederhergestellt - Klasse: hort-${klassennummer}`);
            } else {
              // Eltern-Dashboard
              setCurrentView("dashboard");
              await loadHortzettel();
            }
            
            console.log('✅ Session wiederhergestellt');
          } catch (error) {
            // Invalid token - silently clean up
            console.log('⚠️ Ungültige Session - wird bereinigt');
            api.logout();
            clearSession();
          }
        }
      } catch (error) {
        console.error('Critical error in checkAuth:', error);
      } finally {
        // Always set loading to false, even if there's an error
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const loadHortzettel = async () => {
    try {
      const response = await api.getHortzettel();
      const hortzettel = response.hortzettel.map(h => ({
        ...h,
        createdAt: new Date(h.createdAt)
      }));
      setHortzettelList(hortzettel);
    } catch (error) {
      console.error('Error loading hortzettel:', error);
      toast.error('Fehler beim Laden der Hortzettel');
    }
  };

  const handleLogin = async (firstName: string, lastName: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await api.login(firstName, lastName, password);
      const userRole = response.user.role || 'parent';
      
      setUser({
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        childProfile: response.user.childProfile,
        familyProfile: response.user.familyProfile,
        role: userRole
      });
      
      // Speichere Session wenn "Angemeldet bleiben" aktiviert ist
      if (rememberMe) {
        saveSession(firstName, lastName);
        toast.success('Erfolgreich angemeldet!', {
          description: 'Du bleibst für 24 Stunden angemeldet.'
        });
      } else {
        // Lösche bestehende Session wenn nicht aktiviert
        clearSession();
        toast.success('Erfolgreich angemeldet!');
      }
      
      // Route basierend auf Rolle
      if (userRole === 'hortner') {
        // Hortner sehen alle Hortzettel, gefiltert nach ihrer Klasse
        // Extrahiere Klassennummer aus dem Namen (z.B. "Hort" + "1" -> "hort-1")
        const klassennummer = lastName; // "1", "2", "3", oder "4"
        setHortnerKlasse(`hort-${klassennummer}`); // z.B. "hort-1"
        setCurrentView("hortnerDashboard");
        console.log(`🎓 Hortner-Login erfolgreich - Klasse: hort-${klassennummer}`);
      } else if (userRole === 'admin') {
        // Admin zum Admin-Dashboard
        setCurrentView("adminDashboard");
        console.log('🔑 Admin-Login erfolgreich');
      } else {
        // Normale Eltern zum normalen Dashboard
        setCurrentView("dashboard");
        await loadHortzettel();
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Anmeldung fehlgeschlagen');
      throw error;
    }
  };

  const handleRegister = async (
    firstName: string, 
    lastName: string, 
    password: string,
    childFirstName: string,
    childLastName: string,
    childClass: string
  ) => {
    try {
      // Erstelle das Kind-Objekt
      const child: Child = {
        id: `child_${Date.now()}`,
        firstName: childFirstName,
        lastName: childLastName,
        class: childClass,
      };

      // Erstelle FamilyProfile mit dem Kind
      const familyProfile: FamilyProfile = {
        children: [child]
      };

      // Erstelle ChildProfile für Rückwärtskompatibilität
      const childProfile: ChildProfile = {
        class: childClass
      };

      console.log('[App.tsx] Registrierung mit Kind:', {
        parent: `${firstName} ${lastName}`,
        child: `${childFirstName} ${childLastName}`,
        class: childClass
      });

      // Registriere den Benutzer mit Kind-Informationen
      await api.signup(firstName, lastName, password, childProfile, familyProfile);
      
      // Automatisches Login nach Registrierung
      const response = await api.login(firstName, lastName, password);
      const userRole = response.user.role || 'parent';
      
      setUser({
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        childProfile: response.user.childProfile,
        familyProfile: response.user.familyProfile,
        role: userRole
      });
      
      toast.success('Registrierung erfolgreich!', {
        description: `Kind ${childFirstName} ${childLastName} wurde hinzugefügt.`
      });
      
      // Direkt zum Dashboard, da Kind bereits hinzugefügt wurde
      setCurrentView("dashboard");
      await loadHortzettel();
    } catch (error: any) {
      console.error('Register error:', error);
      toast.error(error.message || 'Registrierung fehlgeschlagen');
      throw error;
    }
  };

  const handleLogout = () => {
    api.logout();
    clearSession(); // Lösche "Angemeldet bleiben" Session
    setCurrentView("login");
    setUser(null);
    setHortzettelList([]);
    setActiveTab("login");
    toast.success('Erfolgreich abgemeldet');
  };

  const handleCreateHortzettel = () => {
    setEditingHortzettelId(null);
    setCurrentView("createHortzettel");
  };

  const handleViewMyHortzettel = () => {
    setCurrentView("myHortzettel");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
  };

  const handleSubmitHortzettel = async (data: HortzettelData) => {
    try {
      console.log('[APP] Speichere Hortzettel mit Daten:', {
        childName: data.childName,
        class: data.class,
        isEdit: !!editingHortzettelId
      });
      
      if (editingHortzettelId) {
        // Update existing
        const response = await api.updateHortzettel(editingHortzettelId, {
          ...data,
          childProfile: user?.childProfile
        });
        
        console.log('[APP] Hortzettel aktualisiert:', response.hortzettel);
        
        setHortzettelList(prev => 
          prev.map(h => 
            h.id === editingHortzettelId 
              ? { ...response.hortzettel, createdAt: new Date(response.hortzettel.createdAt) }
              : h
          )
        );
        
        toast.success("Hortzettel erfolgreich aktualisiert!");
      } else {
        // Create new
        const response = await api.createHortzettel({
          ...data,
          childProfile: user?.childProfile
        });
        
        console.log('[APP] Neuer Hortzettel erstellt:', response.hortzettel);
        
        setHortzettelList(prev => [
          ...prev,
          { ...response.hortzettel, createdAt: new Date(response.hortzettel.createdAt) }
        ]);
        
        toast.success("Hortzettel erfolgreich erstellt!");
      }
      
      setEditingHortzettelId(null);
      setCurrentView("dashboard");
    } catch (error: any) {
      console.error('[APP] ❌ Error saving hortzettel:', error);
      toast.error(error.message || 'Fehler beim Speichern');
    }
  };

  const handleEditHortzettel = (id: string) => {
    console.log('[App.tsx] handleEditHortzettel called with id:', id);
    console.log('[App.tsx] Current hortzettelList:', hortzettelList);
    const hortzettel = hortzettelList.find(h => h.id === id);
    console.log('[App.tsx] Found hortzettel:', hortzettel);
    
    if (!hortzettel) {
      toast.error('Hortzettel nicht gefunden');
      return;
    }
    
    setEditingHortzettelId(id);
    setCurrentView("createHortzettel");
  };

  const handleDeleteHortzettel = async (id: string) => {
    try {
      await api.deleteHortzettel(id);
      setHortzettelList(prev => prev.filter(h => h.id !== id));
      toast.success("Hortzettel erfolgreich gelöscht!");
    } catch (error: any) {
      console.error('Error deleting hortzettel:', error);
      toast.error(error.message || 'Fehler beim Löschen');
    }
  };

  const handleHortnerLogin = async (klasse: string, password: string) => {
    try {
      await api.hortnerLogin(klasse, password);
      setHortnerKlasse(klasse);
      setCurrentView("hortnerDashboard");
      toast.success('Erfolgreich angemeldet!');
    } catch (error: any) {
      console.error('Hortner login error:', error);
      toast.error(error.message || 'Ungültiges Passwort');
      throw error;
    }
  };

  const handleHortnerLogout = () => {
    // Remove Hortner session from localStorage
    localStorage.removeItem('hortner_session');
    setCurrentView("login");
    setHortnerKlasse(null);
    toast.success('Erfolgreich abgemeldet');
  };

  const handleAdminLogin = () => {
    setCurrentView("adminDashboard");
    toast.success('Erfolgreich als Admin angemeldet!');
  };

  const handleAdminLogout = () => {
    api.logout();
    setCurrentView("login");
    toast.success('Erfolgreich abgemeldet');
  };

  const handleViewProfile = () => {
    setCurrentView("profile");
  };

  const handleViewAppearanceSettings = () => {
    setCurrentView("appearanceSettings");
  };

  const handleUpdateProfile = async (
    firstName: string, 
    lastName: string, 
    childProfile: ChildProfile,
    familyProfile: FamilyProfile,
    password?: string
  ) => {
    try {
      await api.updateProfile(firstName, lastName, childProfile, familyProfile, password);
      setUser({ firstName, lastName, childProfile, familyProfile });
      toast.success('Profil erfolgreich aktualisiert!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Fehler beim Aktualisieren');
    }
  };

  const handleCreateFromTemplate = async () => {
    // Reload Hortzettel list after creating from template
    await loadHortzettel();
  };

  const handleFirstChildComplete = async (child: Child) => {
    try {
      if (!user) return;

      console.log('[App.tsx] First child setup - child data:', child);

      // Erstelle ein neues FamilyProfile mit dem ersten Kind
      const newFamilyProfile: FamilyProfile = {
        children: [child],
        parentPhone: user.familyProfile?.parentPhone || user.childProfile?.parentPhone,
        emergencyContactName: user.familyProfile?.emergencyContactName || user.childProfile?.emergencyContactName,
        emergencyContactPhone: user.familyProfile?.emergencyContactPhone || user.childProfile?.emergencyContactPhone
      };

      // Behalte childProfile für Rückwärtskompatibilität, aber mit Kinderdaten
      const legacyChildProfile: ChildProfile = {
        class: child.class,
        birthDate: child.birthDate,
        parentPhone: newFamilyProfile.parentPhone,
        emergencyContactName: newFamilyProfile.emergencyContactName,
        emergencyContactPhone: newFamilyProfile.emergencyContactPhone,
        allergies: child.allergies,
        medicalNotes: child.medicalNotes,
        authorizedPickup: child.authorizedPickup
      };

      console.log('[App.tsx] Updating profile with familyProfile:', newFamilyProfile);

      // Aktualisiere das Profil im Backend
      await api.updateProfile(
        user.firstName, 
        user.lastName, 
        legacyChildProfile,
        newFamilyProfile
      );

      // Aktualisiere den lokalen User-State
      setUser({
        ...user,
        childProfile: legacyChildProfile,
        familyProfile: newFamilyProfile
      });

      console.log('[App.tsx] User state updated with familyProfile:', newFamilyProfile);

      toast.success('Kind erfolgreich hinzugefügt!', {
        description: 'Du kannst jetzt Hortzettel erstellen.'
      });

      // Wechsle zum Dashboard
      setCurrentView("dashboard");
      await loadHortzettel();
    } catch (error: any) {
      console.error('Error saving first child:', error);
      toast.error(error.message || 'Fehler beim Speichern des Kindes');
    }
  };

  // Handle design preference change
  const handleToggleDesign = (newDesign: boolean) => {
    setUseModernDesign(newDesign);
    localStorage.setItem('dashboard_design_preference', newDesign ? 'modern' : 'classic');
    toast.success(`Design gewechselt zu: ${newDesign ? 'Modern' : 'Klassisch'}`);
  };

  // Handle Hortner design preference change
  const handleToggleHortnerDesign = (newDesign: boolean) => {
    // Design toggle entfernt - nur klassisches Design verfügbar
    toast.info('Nur klassisches Design verfügbar');
  };

  // Splash Screen
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} schoolName={schoolName} appTitle={appContent.appTitle} />;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Wird geladen...</p>
        </div>
      </div>
    );
  }

  // Admin Login
  if (currentView === "adminLogin") {
    return (
      <>
        <AdminLogin 
          onSuccess={handleAdminLogin}
          onBack={() => setCurrentView("login")}
        />
        <Toaster />
      </>
    );
  }

  // Admin Dashboard
  if (currentView === "adminDashboard") {
    return (
      <>
        <AdminDashboard onLogout={handleAdminLogout} />
        <Toaster />
      </>
    );
  }

  // First Child Setup (after registration)
  if (currentView === "firstChildSetup") {
    return (
      <>
        <FirstChildSetup 
          onComplete={handleFirstChildComplete}
          availableClasses={availableClasses}
        />
        <Toaster />
      </>
    );
  }

  // Profile view
  if (currentView === "profile" && user) {
    return (
      <>
        <ProfileView
          firstName={user.firstName}
          lastName={user.lastName}
          childProfile={user.childProfile}
          familyProfile={user.familyProfile}
          onBack={handleBackToDashboard}
          onUpdate={handleUpdateProfile}
        />
        <Toaster />
      </>
    );
  }

  // Appearance Settings view
  if (currentView === "appearanceSettings" && user) {
    return (
      <>
        <AppearanceSettings
          firstName={user.firstName}
          lastName={user.lastName}
          onBack={handleBackToDashboard}
        />
        <Toaster />
      </>
    );
  }

  // Hortner Dashboard
  if (currentView === "hortnerDashboard" && hortnerKlasse) {
    return (
      <>
        <HortnerDashboard
          klasse={hortnerKlasse}
          allHortzettel={hortzettelList}
          onLogout={handleHortnerLogout}
          onToggleDesign={handleToggleHortnerDesign}
        />
        <Toaster />
      </>
    );
  }

  // Hortner Login
  if (currentView === "hortnerLogin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4 transition-colors">
        <div className="w-full max-w-md">
          <Button
            variant="ghost"
            onClick={() => setCurrentView("login")}
            className="mb-4"
          >
            ← Zurück zur Anmeldung
          </Button>
          <HortnerLogin onLogin={handleHortnerLogin} />
        </div>
        <Toaster />
      </div>
    );
  }

  // User Dashboard Views
  if (currentView === "dashboard" && user) {
    return (
      <>
        {useModernDesign ? (
          <ModernParentDashboard
            user={user}
            hortzettel={hortzettelList}
            onCreateNew={handleCreateHortzettel}
            onEditHortzettel={handleEditHortzettel}
            onViewProfile={handleViewProfile}
            onViewAppearanceSettings={handleViewAppearanceSettings}
            onLogout={handleLogout}
            onViewAllHortzettel={handleViewMyHortzettel}
            schoolName={schoolName}
            content={appContent}
            onToggleDesign={handleToggleDesign}
          />
        ) : (
          <PersonalDashboard
            firstName={user.firstName}
            lastName={user.lastName}
            onCreateHortzettel={handleCreateHortzettel}
            onViewMyHortzettel={handleViewMyHortzettel}
            onViewProfile={handleViewProfile}
            onViewAppearanceSettings={handleViewAppearanceSettings}
            onLogout={handleLogout}
            hortzettelList={hortzettelList}
            onCreateFromTemplate={handleCreateFromTemplate}
            onToggleDesign={handleToggleDesign}
          />
        )}
        <Toaster />
      </>
    );
  }

  if (currentView === "createHortzettel" && user) {
    const editingHortzettel = editingHortzettelId
      ? hortzettelList.find(h => h.id === editingHortzettelId)
      : null;

    console.log('[App.tsx] Rendering CreateHortzettelForm:', {
      editingHortzettelId,
      foundHortzettel: !!editingHortzettel,
      hortzettelListLength: hortzettelList.length,
      user
    });

    return (
      <>
        <CreateHortzettelForm
          childFirstName={user.firstName}
          childLastName={user.lastName}
          childProfile={user.childProfile}
          familyProfile={user.familyProfile}
          onSubmit={handleSubmitHortzettel}
          onBack={handleBackToDashboard}
          existingData={editingHortzettel || undefined}
          isEditMode={!!editingHortzettelId}
          allHortzettel={hortzettelList}
        />
        <Toaster />
      </>
    );
  }

  if (currentView === "myHortzettel" && user) {
    return (
      <>
        <MyHortzettelList
          hortzettelList={hortzettelList}
          onBack={handleBackToDashboard}
          onEdit={handleEditHortzettel}
          onDelete={handleDeleteHortzettel}
          onCreateNew={handleCreateHortzettel}
        />
        <Toaster />
      </>
    );
  }

  // Login/Register View
  const schoolImage = "https://images.unsplash.com/photo-1665270695165-93b5798522ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnZXJtYW4lMjBlbGVtZW50YXJ5JTIwc2Nob29sJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzYxNjkwNjQyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-3 transition-colors">
      {/* School Image Background */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${schoolImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/95 via-purple-600/90 to-pink-600/95 dark:from-slate-900/95 dark:via-slate-800/90 dark:to-slate-900/95 backdrop-blur-sm transition-colors" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
      </div>

      <div className="relative w-full" style={{ maxWidth: 'var(--login-card-max-width)' }}>
        <div className="text-center mb-8">
          <div 
            className="inline-block cursor-pointer"
            onClick={() => {
              const newCount = logoTapCount + 1;
              setLogoTapCount(newCount);
              
              // Nach 5 schnellen Taps: Aktiviere Admin-Buttons
              if (newCount === 5) {
                setShowAdminButtons(true);
                toast.success('🔓 Entwickler-Modus aktiviert', {
                  description: 'Hortner- und Admin-Zugang freigeschaltet'
                });
                console.log('🔓 Entwickler-Modus durch 5x Logo-Tap aktiviert');
              }
              
              // Reset nach 2 Sekunden
              setTimeout(() => setLogoTapCount(0), 2000);
            }}
          >
            <AppLogo 
              className="inline-flex items-center justify-center w-16 h-16 bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-2xl mb-3 shadow-2xl ring-2 ring-white/20 transition-colors p-2 hover:scale-105 active:scale-95 transition-transform"
              iconClassName="h-12 w-12 text-white"
            />
            {logoTapCount > 0 && logoTapCount < 5 && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white/90 text-primary rounded-full flex items-center justify-center text-sm font-bold">
                {logoTapCount}
              </div>
            )}
          </div>
          <h1 className="mb-1.5 text-white">
            {appContent.appTitle}
          </h1>
          <p className="text-white/90">
            {schoolName}
          </p>
        </div>

        <div 
          className="bg-white/95 dark:bg-slate-700/95 backdrop-blur-xl shadow-2xl shadow-black/20 border border-white/30 dark:border-slate-600/30 transition-colors"
          style={{ 
            padding: 'var(--login-card-padding)',
            borderRadius: 'calc(var(--border-radius) * 2)',
          }}
        >
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50 dark:bg-slate-600/50">
              <TabsTrigger value="login">{appContent.loginTitle}</TabsTrigger>
              <TabsTrigger value="register">{appContent.registerTitle}</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm onLogin={handleLogin} />
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm onRegister={handleRegister} availableClasses={availableClasses} />
            </TabsContent>
          </Tabs>
        </div>

        {showAdminButtons && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={() => setCurrentView("adminLogin")}
              className="bg-red-500/20 hover:bg-red-500/30 dark:bg-red-500/20 dark:hover:bg-red-500/30 text-white border-red-300/30 backdrop-blur-md transition-colors px-8"
            >
              <Shield className="h-4 w-4 mr-2" />
              Admin-Zugang
            </Button>
          </div>
        )}

        {/* Hilfe Button */}
        <div className="mt-6 flex justify-center">
          <Button
            variant="ghost"
            onClick={() => setShowLoginHelpDialog(true)}
            className="bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 text-white border border-white/20 backdrop-blur-md transition-colors px-6"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Anleitung & Hilfe
          </Button>
        </div>
      </div>
      <Toaster />

      {/* Legal Dialog */}
      {showLegalDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <LegalPages 
              defaultPage={legalPage}
              onClose={() => {
                setShowLegalDialog(false);
                setLegalPage(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Login Help Dialog */}
      {showLoginHelpDialog && (
        <HelpGuide onClose={() => setShowLoginHelpDialog(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}