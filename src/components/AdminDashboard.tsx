// Admin Dashboard Component v2
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { 
  Shield, 
  LogOut, 
  Users, 
  FileText, 
  Settings, 
  TrendingUp,
  Edit2,
  Trash2,
  Key,
  Download,
  Plus,
  X,
  Check,
  BarChart3,
  AlertCircle,
  User,
  Clock,
  Type,
  MessageCircle,
  Smartphone,
  Home,
  Code,
  HelpCircle,
  Upload,
  Eye,
  EyeOff
} from "lucide-react";
import { api } from "../utils/api";
import { toast } from "sonner@2.0.3";
import type { AdminUser, SystemStats, AppSettings, TimeRestrictionSettings } from "../types/hortzettel";
import { invalidateTimeRestrictionCache } from "../utils/weekUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import DropdownManager from "./DropdownManager";
import AdminMessages from "./AdminMessages";
import { LegalSettingsManager } from "./LegalSettingsManager";
import { DesignSettingsManager } from "./DesignSettingsManager";
import { PWASettingsManager } from "./PWASettingsManager";
import HortzettelDesignPreview from "./HortzettelDesignPreview";
import DomainSettingsManager from "./DomainSettingsManager";
import DeveloperMode from "./DeveloperMode";
import { UserRoleManager } from "./UserRoleManager";

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [editingSettings, setEditingSettings] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ firstName: "", lastName: "", password: "" });
  const [showTimeRestrictionDialog, setShowTimeRestrictionDialog] = useState(false);
  const [timeRestrictions, setTimeRestrictions] = useState<import('../types/hortzettel').TimeRestrictionSettings>({
    enabled: true,
    blockStartHour: 12,
    blockEndHour: 17,
    blockWeekdaysOnly: true,
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [showDeveloperMode, setShowDeveloperMode] = useState(false);
  const [showPasswordFor, setShowPasswordFor] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log("[AdminDashboard] Loading admin data...");
      console.log("[AdminDashboard] Access token:", api.getAccessToken() ? "Present" : "Missing");
      
      const [statsRes, usersRes, settingsRes, timeRestrictionsRes] = await Promise.all([
        api.getAdminStats().catch(e => {
          console.error("[AdminDashboard] getAdminStats failed:", e);
          throw e;
        }),
        api.getAllUsers().catch(e => {
          console.error("[AdminDashboard] getAllUsers failed:", e);
          throw e;
        }),
        api.getSettings().catch(e => {
          console.error("[AdminDashboard] getSettings failed:", e);
          throw e;
        }),
        api.getTimeRestrictions().catch(e => {
          console.error("[AdminDashboard] getTimeRestrictions failed:", e);
          return { settings: { enabled: true, blockStartHour: 12, blockEndHour: 17, blockWeekdaysOnly: true } };
        }),
      ]);
      setStats(statsRes.stats);
      setUsers(usersRes.users);
      setTimeRestrictions(timeRestrictionsRes.settings);
      console.log("AdminDashboard - loaded settings:", settingsRes.settings);
      console.log("AdminDashboard - content field:", settingsRes.settings?.content);
      
      // If content field is missing, initialize it
      if (settingsRes.settings && !settingsRes.settings.content) {
        console.log("AdminDashboard - content field missing, initializing with defaults");
        const defaultContent = {
          appTitle: 'Hortzettel App',
          appSubtitle: 'Digitale Hortzettel-Verwaltung',
          welcomeMessage: 'Willkommen zurück!',
          loginTitle: 'Anmelden',
          loginSubtitle: 'Melden Sie sich mit Ihren Zugangsdaten an',
          registerTitle: 'Registrieren',
          registerSubtitle: 'Erstellen Sie ein neues Konto',
          loginButtonText: 'Anmelden',
          registerButtonText: 'Registrieren',
          dashboardWelcome: 'Willkommen',
          dashboardSubtitle: 'Verwalten Sie Ihre Hortzettel einfach und übersichtlich',
          createHortzettelButton: 'Neuer Hortzettel',
          myHortzettelButton: 'Meine Hortzettel',
          profileButton: 'Profil',
          hortzettelTitle: 'Hortzettel erstellen',
          hortzettelDescription: 'Füllen Sie die Betreuungszeiten für die kommende Woche aus',
          childNameLabel: 'Name des Kindes',
          classLabel: 'Klasse',
          homeAloneQuestion: 'Darf mein Kind alleine nach Hause gehen?',
          weekdayLabel: 'Wochentag',
          profileTitle: 'Profil & Kindinformationen',
          profileDescription: 'Verwalten Sie Ihre persönlichen Daten und Kindinformationen',
          adminDashboardTitle: 'Admin-Dashboard',
          settingsDescription: 'Verwalten Sie alle App-Einstellungen und Inhalte',
          hortnerDashboardTitle: 'Hortner-Dashboard',
          hortnerSubtitle: 'Übersicht aller Hortzettel',
          footerText: 'Erstellt mit ❤️ für Ihre Schule',
          privacyNotice: 'Ihre Daten werden vertraulich behandelt',
        };
        settingsRes.settings.content = defaultContent;
      }
      
      setSettings(settingsRes.settings);
    } catch (error) {
      console.error("Error loading admin data:", error);
      toast.error("Fehler beim Laden der Daten");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!confirm(`Möchten Sie den Benutzer "${user.firstName} ${user.lastName}" wirklich löschen?`)) {
      return;
    }

    try {
      await api.deleteUser(user.userId || user.id);
      toast.success("Benutzer gelöscht");
      loadData();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Fehler beim Löschen");
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser || !newPassword) {
      toast.error("Bitte Passwort eingeben");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Passwort muss mindestens 6 Zeichen lang sein");
      return;
    }

    // Check for at least one special character
    const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    if (!specialCharRegex.test(newPassword)) {
      toast.error("Passwort muss mindestens ein Sonderzeichen enthalten (!@#$%^&*()_+-=[]{};\':\"\\|,.<>/?)");
      return;
    }

    try {
      await api.resetUserPassword(resetPasswordUser.userId || resetPasswordUser.id, newPassword);
      toast.success("Passwort zurückgesetzt und ist jetzt sichtbar");
      setResetPasswordUser(null);
      setNewPassword("");
      // Reload data to show updated password
      loadData();
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("Fehler beim Zurücksetzen");
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.firstName || !newUser.lastName || !newUser.password) {
      toast.error("Bitte alle Felder ausfüllen");
      return;
    }

    if (newUser.password.length < 6) {
      toast.error("Passwort muss mindestens 6 Zeichen lang sein");
      return;
    }

    // Check for at least one special character
    const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    if (!specialCharRegex.test(newUser.password)) {
      toast.error("Passwort muss mindestens ein Sonderzeichen enthalten (!@#$%^&*()_+-=[]{};\':\"\\|,.<>/?)");
      return;
    }

    try {
      await api.createUser(newUser.firstName, newUser.lastName, newUser.password);
      toast.success("Benutzer erfolgreich erstellt");
      setShowCreateUser(false);
      setNewUser({ firstName: "", lastName: "", password: "" });
      loadData();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Fehler beim Erstellen des Benutzers");
    }
  };

  const handleUpdateSettings = async () => {
    if (!settings) return;

    try {
      console.log("Saving settings:", settings);
      const result = await api.updateAppSettings(settings);
      console.log("Settings saved successfully:", result);
      
      // Emit custom event to notify other components
      window.dispatchEvent(new CustomEvent('settingsUpdated', { 
        detail: { settings: result.settings } 
      }));
      
      toast.success("Einstellungen gespeichert!", {
        duration: 3000,
        description: "Die Änderungen werden automatisch übernommen."
      });
      setEditingSettings(false);
      
      // Reload settings to reflect changes in admin panel
      await loadData();
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Fehler beim Speichern");
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const result = await api.exportData(format);
      const blob = new Blob([result.data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export erfolgreich");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Fehler beim Exportieren");
    }
  };

  const handleUpdateTimeRestrictions = async () => {
    try {
      console.log('[AdminDashboard] Speichere Sperrzeit-Einstellungen:', timeRestrictions);
      
      const result = await api.updateTimeRestrictions(timeRestrictions);
      console.log('[AdminDashboard] ✅ Speichern erfolgreich:', result);
      
      invalidateTimeRestrictionCache(); // Cache leeren
      
      toast.success("Sperrzeit-Einstellungen gespeichert!", {
        duration: 3000,
        description: "Die Änderungen werden sofort wirksam."
      });
      setShowTimeRestrictionDialog(false);
    } catch (error) {
      console.error("[AdminDashboard] ❌ Error updating time restrictions:", error);
      
      // Extract error message from response if available
      let errorMessage = "Fehler beim Speichern der Sperrzeit-Einstellungen";
      if (error && typeof error === 'object' && 'error' in error) {
        errorMessage = String(error.error);
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        description: "Bitte prüfen Sie die Konsole für Details."
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Lade Admin-Daten...</p>
        </div>
      </div>
    );
  }

  // Show Developer Mode if requested
  if (showDeveloperMode) {
    return <DeveloperMode onClose={() => setShowDeveloperMode(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 border-b border-white/20 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-white">Admin-Dashboard</h1>
                <p className="text-white/80 text-sm">Hortzettel Verwaltung</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowDeveloperMode(true)}
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Code className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Developer</span>
              </Button>
              <Button
                onClick={onLogout}
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Abmelden</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Verbesserte Navigation mit Gruppierung */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border p-3">
            {/* Gruppierungslabels für Desktop */}
            <div className="hidden lg:flex gap-4 mb-3 px-2">
              <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex-1 text-center uppercase tracking-wider">
                ⚡ Verwaltung
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold flex-1 text-center uppercase tracking-wider">
                🎨 Inhalt & Gestaltung
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400 font-semibold flex-1 text-center uppercase tracking-wider">
                ⚙️ System & Rechtliches
              </div>
            </div>

            {/* Mobile Gruppierungsanzeige */}
            <div className="lg:hidden mb-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Navigationsbereich:</p>
              <div className="flex items-center justify-center gap-2">
                {(activeTab === 'overview' || activeTab === 'users' || activeTab === 'messages') && (
                  <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950">
                    ⚡ Verwaltung
                  </Badge>
                )}
                {(activeTab === 'content' || activeTab === 'design' || activeTab === 'formular' || activeTab === 'pwa') && (
                  <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-50 dark:bg-purple-950">
                    🎨 Inhalt & Gestaltung
                  </Badge>
                )}
                {(activeTab === 'legal' || activeTab === 'data' || activeTab === 'settings') && (
                  <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-950">
                    ⚙️ System & Rechtliches
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Desktop: Gruppierte Tabs */}
            <TabsList className="hidden lg:flex w-full bg-transparent h-auto p-0 gap-1">
              {/* Hauptbereich */}
              <div className="flex flex-nowrap gap-1 flex-1">
                <TabsTrigger 
                  value="overview" 
                  className="flex items-center gap-2 flex-shrink-0 px-3 py-2 text-sm justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="font-medium">Übersicht</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="users" 
                  className="flex items-center gap-2 flex-shrink-0 px-3 py-2 text-sm justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap"
                >
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Benutzer</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="messages" 
                  className="flex items-center gap-2 flex-shrink-0 px-3 py-2 text-sm justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="font-medium">Nachrichten</span>
                </TabsTrigger>
              </div>

              {/* Separator */}
              <div className="w-px bg-gradient-to-b from-blue-300 via-purple-300 to-purple-300 h-8 self-center mx-1" />

              {/* Inhalt & Gestaltung */}
              <div className="flex flex-nowrap gap-1 flex-1">
                <TabsTrigger 
                  value="content" 
                  className="flex items-center gap-2 flex-shrink-0 px-3 py-2 text-sm justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap"
                >
                  <Type className="h-4 w-4" />
                  <span className="font-medium">Texte</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="design" 
                  className="flex items-center gap-2 flex-shrink-0 px-3 py-2 text-sm justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap"
                >
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">Design</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="formular" 
                  className="flex items-center gap-2 flex-shrink-0 px-3 py-2 text-sm justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap"
                >
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Formular</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="pwa" 
                  className="flex items-center gap-2 flex-shrink-0 px-3 py-2 text-sm justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap"
                >
                  <Smartphone className="h-4 w-4" />
                  <span className="font-medium">PWA / App</span>
                </TabsTrigger>
              </div>

              {/* Separator */}
              <div className="w-px bg-gradient-to-b from-purple-300 via-orange-300 to-orange-300 h-8 self-center mx-1" />

              {/* System & Rechtliches */}
              <div className="flex flex-nowrap gap-1 flex-1">
                <TabsTrigger 
                  value="legal" 
                  className="flex items-center gap-2 flex-shrink-0 px-3 py-2 text-sm justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap"
                >
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">Rechtliches</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="data" 
                  className="flex items-center gap-2 flex-shrink-0 px-3 py-2 text-sm justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap"
                >
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Daten</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="settings" 
                  className="flex items-center gap-2 flex-shrink-0 px-3 py-2 text-sm justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap"
                >
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">Einstellungen</span>
                </TabsTrigger>
              </div>
            </TabsList>

            {/* Mobile: Alle Tabs in einer scrollbaren Reihe */}
            <div className="lg:hidden overflow-x-auto -mx-3 px-3">
              <TabsList className="inline-flex bg-transparent h-auto p-0 gap-1 min-w-full">
                <TabsTrigger 
                  value="overview" 
                  className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-2 text-xs justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span className="font-medium">Übersicht</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="users" 
                  className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-2 text-xs justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span className="font-medium">Benutzer</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="messages" 
                  className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-2 text-xs justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span className="font-medium">Nachrichten</span>
                </TabsTrigger>

                <div className="w-px bg-gradient-to-b from-blue-300 via-purple-300 to-purple-300 h-8 self-center mx-0.5" />
                
                <TabsTrigger 
                  value="content" 
                  className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-2 text-xs justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap"
                >
                  <Type className="h-3.5 w-3.5" />
                  <span className="font-medium">Texte</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="design" 
                  className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-2 text-xs justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span className="font-medium">Design</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="formular" 
                  className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-2 text-xs justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span className="font-medium">Formular</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="pwa" 
                  className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-2 text-xs justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span className="font-medium">App</span>
                </TabsTrigger>

                <div className="w-px bg-gradient-to-b from-purple-300 via-orange-300 to-orange-300 h-8 self-center mx-0.5" />
                
                <TabsTrigger 
                  value="legal" 
                  className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-2 text-xs justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap"
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span className="font-medium">Rechtliches</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="data" 
                  className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-2 text-xs justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span className="font-medium">Daten</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="settings" 
                  className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-2 text-xs justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span className="font-medium">Einstellungen</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Navigation Info */}
            <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    Willkommen im Admin-Dashboard
                    <Badge variant="secondary" className="text-xs">Neu strukturiert</Badge>
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    Die Navigation ist jetzt in drei übersichtliche Bereiche gegliedert:
                  </p>
                  <div className="grid sm:grid-cols-3 gap-3 text-sm">
                    <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-1 text-blue-700 dark:text-blue-300 font-semibold">
                        ⚡ Verwaltung
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Übersicht, Benutzer & Nachrichten
                      </p>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 mb-1 text-purple-700 dark:text-purple-300 font-semibold">
                        🎨 Inhalt & Gestaltung
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Texte, Design, Formular & PWA
                      </p>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-2 mb-1 text-orange-700 dark:text-orange-300 font-semibold">
                        ⚙️ System & Rechtliches
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Rechtliches, Daten & Einstellungen
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground">Benutzer</p>
                <p className="text-2xl mt-1">{stats?.totalUsers || 0}</p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <Badge variant="outline" className="text-xs">Aktiv</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Hortzettel</p>
                <p className="text-2xl mt-1">{stats?.activeHortzettel || 0}</p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <Badge variant="outline" className="text-xs">Diese Woche</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Neue Einträge</p>
                <p className="text-2xl mt-1">{stats?.thisWeekSubmissions || 0}</p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <Badge variant="outline" className="text-xs">Archiv</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Archiviert</p>
                <p className="text-2xl mt-1">{stats?.archivedHortzettel || 0}</p>
              </div>
            </div>

            {/* Class Distribution */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border">
              <h3 className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Klassenverteilung
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(stats?.classCounts || {}).map(([cls, count]) => (
                  <div key={cls} className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border">
                    <p className="text-sm text-muted-foreground">Klasse {cls}</p>
                    <p className="text-xl mt-1">{count} Kinder</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Times */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border">
              <h3 className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Beliebteste Abholzeiten
              </h3>
              <div className="space-y-2">
                {Object.entries(stats?.popularTimes || {})
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 5)
                  .map(([time, count]) => (
                    <div key={time} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                      <span className="text-sm">{time}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                            style={{
                              width: `${((count as number) / Math.max(...Object.values(stats?.popularTimes || {}))) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-blue-900 dark:text-blue-100 mb-1">Passwort-Verwaltung</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Als Admin können Sie die Passwörter aller Benutzer einsehen. Klicken Sie auf das Auge-Symbol, um ein Passwort anzuzeigen.
                    <span className="block mt-1 text-xs text-blue-700 dark:text-blue-300">
                      <strong>Hinweis:</strong> Passwörter sind nur für neue Benutzer und nach Passwort-Resets verfügbar.
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Alle Benutzer
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {users.length} registrierte Benutzer
                    </p>
                  </div>
                  <Button onClick={() => setShowCreateUser(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Benutzer hinzufügen
                  </Button>
                </div>
              </div>

              {/* Info Box for Password Visibility */}
              {users.some(u => !u.adminPasswordNote) && (
                <div className="mx-6 mt-6 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        Hinweis zu Passwort-Anzeige
                      </p>
                      <p className="text-blue-700 dark:text-blue-300 mt-1">
                        Passwörter werden nur für neu erstellte Accounts oder nach einem Passwort-Reset angezeigt. 
                        Um das Passwort für ältere Accounts sichtbar zu machen, klicken Sie auf den <strong>"Setzen"</strong>-Button 
                        oder verwenden Sie das <Key className="h-3 w-3 inline" />-Symbol zum Zurücksetzen.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                    <tr>
                      <th className="text-left p-4 text-sm">Name</th>
                      <th className="text-left p-4 text-sm">E-Mail</th>
                      <th className="text-left p-4 text-sm">Passwort</th>
                      <th className="text-left p-4 text-sm">Rolle</th>
                      <th className="text-left p-4 text-sm">Erstellt</th>
                      <th className="text-right p-4 text-sm">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((user) => (
                      <tr key={user.userId || user.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <User className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-medium">
                              {user.firstName} {user.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{user.email}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {user.adminPasswordNote ? (
                              <>
                                <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border">
                                  {showPasswordFor === (user.userId || user.id) 
                                    ? user.adminPasswordNote 
                                    : '••••••••'}
                                </code>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const userId = user.userId || user.id;
                                    setShowPasswordFor(showPasswordFor === userId ? null : userId);
                                  }}
                                  className="h-7 w-7 p-0"
                                >
                                  {showPasswordFor === (user.userId || user.id) ? (
                                    <EyeOff className="h-3.5 w-3.5" />
                                  ) : (
                                    <Eye className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground italic">
                                  Nicht verfügbar
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setResetPasswordUser(user)}
                                  className="h-7 px-2 text-xs"
                                  title="Passwort setzen, um es sichtbar zu machen"
                                >
                                  <Key className="h-3 w-3 mr-1" />
                                  Setzen
                                </Button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <UserRoleManager user={user} onUpdate={loadData} />
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString('de-DE')}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setResetPasswordUser(user)}
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteUser(user)}
                              disabled={user.role === 'admin'}
                              className="hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <AdminMessages />
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border">
              <h3 className="mb-4 flex items-center gap-2">
                <Download className="h-5 w-5 text-blue-600" />
                Daten exportieren
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Exportieren Sie alle Hortzettel und Benutzerdaten
              </p>
              <div className="flex gap-4">
                <Button onClick={() => handleExport('json')} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Als JSON exportieren
                </Button>
                <Button onClick={() => handleExport('csv')} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Als CSV exportieren
                </Button>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-400">
                    Hinweis zur Datensicherheit
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                    Exportierte Daten enthalten personenbezogene Informationen. 
                    Bitte behandeln Sie diese vertraulich und gemäß DSGVO.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Content Tab - Texte & Inhalte bearbeiten */}
          <TabsContent value="content" className="space-y-6">
            {!settings?.content ? (
              <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-amber-900 dark:text-amber-400 mb-2">Content-Feld fehlt</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-500 mb-4">
                      Die Settings enthalten noch kein Content-Feld. Dies kann passieren, wenn Sie bestehende Einstellungen haben.
                    </p>
                    <Button
                      onClick={async () => {
                        try {
                          // Initialize content field with defaults
                          const defaultContent = {
                            appTitle: 'Hortzettel App',
                            appSubtitle: 'Digitale Hortzettel-Verwaltung',
                            welcomeMessage: 'Willkommen zurück!',
                            schoolPhotoUrl: 'https://images.unsplash.com/photo-1665270695165-93b5798522ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnZXJtYW4lMjBlbGVtZW50YXJ5JTIwc2Nob29sJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzYyODU4MzU5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
                            loginTitle: 'Anmelden',
                            loginSubtitle: 'Melden Sie sich mit Ihren Zugangsdaten an',
                            registerTitle: 'Registrieren',
                            registerSubtitle: 'Erstellen Sie ein neues Konto',
                            loginButtonText: 'Anmelden',
                            registerButtonText: 'Registrieren',
                            dashboardWelcome: 'Willkommen',
                            dashboardSubtitle: 'Verwalten Sie Ihre Hortzettel einfach und übersichtlich',
                            createHortzettelButton: 'Neuer Hortzettel',
                            myHortzettelButton: 'Meine Hortzettel',
                            profileButton: 'Profil',
                            hortzettelTitle: 'Hortzettel erstellen',
                            hortzettelDescription: 'Füllen Sie die Betreuungszeiten für die kommende Woche aus',
                            childNameLabel: 'Name des Kindes',
                            classLabel: 'Hortgruppe',
                            homeAloneQuestion: 'Darf mein Kind alleine nach Hause gehen?',
                            weekdayLabel: 'Wochentag',
                            profileTitle: 'Profil & Kindinformationen',
                            profileDescription: 'Verwalten Sie Ihre persönlichen Daten und Kindinformationen',
                            adminDashboardTitle: 'Admin-Dashboard',
                            settingsDescription: 'Verwalten Sie alle App-Einstellungen und Inhalte',
                            hortnerDashboardTitle: 'Hortner-Dashboard',
                            hortnerSubtitle: 'Übersicht aller Hortzettel',
                            footerText: 'Erstellt mit ❤️ für Ihre Schule',
                            privacyNotice: 'Ihre Daten werden vertraulich behandelt',
                          };
                          
                          const updatedSettings = {
                            ...settings,
                            content: defaultContent
                          };
                          
                          await api.updateAppSettings(updatedSettings);
                          toast.success('Content-Feld erfolgreich initialisiert!');
                          loadData();
                        } catch (error) {
                          console.error('Error initializing content:', error);
                          toast.error('Fehler beim Initialisieren');
                        }
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Settings aktualisieren
                    </Button>
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-3">
                      Alternativ: Laden Sie die Seite mit F5 neu, das Backend sollte die Settings automatisch reparieren.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="flex items-center gap-2">
                      <Type className="h-5 w-5 text-purple-600" />
                      Texte & Inhalte
                    </h3>
                    {!editingSettings && (
                      <Button
                        onClick={() => setEditingSettings(true)}
                        variant="outline"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Bearbeiten
                      </Button>
                    )}
                  </div>

                  <div className="space-y-8">
                    {/* Allgemein */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-lg border-b pb-2">Allgemein</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>App-Titel</Label>
                          <Input
                            value={settings.content.appTitle}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                content: { ...settings.content, appTitle: e.target.value },
                              })
                            }
                            disabled={!editingSettings}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label>App-Untertitel</Label>
                          <Input
                            value={settings.content.appSubtitle}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                content: { ...settings.content, appSubtitle: e.target.value },
                              })
                            }
                            disabled={!editingSettings}
                            className="mt-1.5"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Willkommensnachricht</Label>
                        <Input
                          value={settings.content.welcomeMessage}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              content: { ...settings.content, welcomeMessage: e.target.value },
                            })
                          }
                          disabled={!editingSettings}
                          className="mt-1.5"
                        />
                      </div>

                      <div>
                        <Label>Schulname</Label>
                        <Input
                          value={settings.schoolName}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              schoolName: e.target.value,
                            })
                          }
                          disabled={!editingSettings}
                          className="mt-1.5"
                          placeholder="Grundschule Auma"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Wird auf der Anmeldeseite angezeigt
                        </p>
                      </div>

                      <div>
                        <Label>Schulfoto 🏫</Label>
                        
                        {/* Preview */}
                        {settings.content.schoolPhotoUrl && (
                          <div className="mt-2 mb-3 flex items-center gap-3">
                            <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg ring-4 ring-blue-200/50">
                              <img 
                                src={settings.content.schoolPhotoUrl} 
                                alt="Schulfoto Vorschau" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-sm text-muted-foreground">Aktuelles Schulfoto</p>
                          </div>
                        )}

                        {/* Upload Button */}
                        {editingSettings && (
                          <div className="space-y-2">
                            <input
                              type="file"
                              id="school-photo-upload"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                // Validate file size (5MB)
                                if (file.size > 5242880) {
                                  toast.error('Datei zu groß! Maximale Größe: 5MB');
                                  return;
                                }

                                try {
                                  toast.loading('Bild wird hochgeladen...');
                                  const result = await api.uploadSchoolPhoto(file);
                                  
                                  if (result.success && result.url) {
                                    setSettings({
                                      ...settings,
                                      content: { ...settings.content, schoolPhotoUrl: result.url },
                                    });
                                    toast.dismiss();
                                    toast.success('Schulfoto erfolgreich hochgeladen! 🎉');
                                  } else {
                                    toast.dismiss();
                                    toast.error(result.error || 'Upload fehlgeschlagen');
                                  }
                                } catch (error: any) {
                                  toast.dismiss();
                                  toast.error('Fehler beim Upload: ' + error.message);
                                }
                                
                                // Reset input
                                e.target.value = '';
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById('school-photo-upload')?.click()}
                              className="w-full"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Bild hochladen
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              JPG, PNG, GIF oder WebP • Max. 5MB
                            </p>
                          </div>
                        )}

                        {/* URL Input (alternative) */}
                        <div className="mt-3">
                          <Label className="text-xs text-muted-foreground">Oder URL eingeben:</Label>
                          <Input
                            value={settings.content.schoolPhotoUrl || ''}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                content: { ...settings.content, schoolPhotoUrl: e.target.value },
                              })
                            }
                            disabled={!editingSettings}
                            className="mt-1.5"
                            placeholder="https://images.unsplash.com/photo-..."
                          />
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-2">
                          Wird im Dashboard als rundes Foto angezeigt
                        </p>
                      </div>
                    </div>

                    {/* Login/Register */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-lg border-b pb-2">Login & Registrierung</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Login-Titel</Label>
                          <Input
                            value={settings.content.loginTitle}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                content: { ...settings.content, loginTitle: e.target.value },
                              })
                            }
                            disabled={!editingSettings}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label>Login-Untertitel</Label>
                          <Input
                            value={settings.content.loginSubtitle}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                content: { ...settings.content, loginSubtitle: e.target.value },
                              })
                            }
                            disabled={!editingSettings}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label>Register-Titel</Label>
                          <Input
                            value={settings.content.registerTitle}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                content: { ...settings.content, registerTitle: e.target.value },
                              })
                            }
                            disabled={!editingSettings}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label>Register-Untertitel</Label>
                          <Input
                            value={settings.content.registerSubtitle}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                content: { ...settings.content, registerSubtitle: e.target.value },
                              })
                            }
                            disabled={!editingSettings}
                            className="mt-1.5"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Dashboard */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-lg border-b pb-2">Dashboard</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Dashboard Willkommen</Label>
                          <Input
                            value={settings.content.dashboardWelcome}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                content: { ...settings.content, dashboardWelcome: e.target.value },
                              })
                            }
                            disabled={!editingSettings}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label>Dashboard Untertitel</Label>
                          <Input
                            value={settings.content.dashboardSubtitle}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                content: { ...settings.content, dashboardSubtitle: e.target.value },
                              })
                            }
                            disabled={!editingSettings}
                            className="mt-1.5"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Neuer Hortzettel Button</Label>
                          <Input
                            value={settings.content.createHortzettelButton}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                content: { ...settings.content, createHortzettelButton: e.target.value },
                              })
                            }
                            disabled={!editingSettings}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label>Meine Hortzettel Button</Label>
                          <Input
                            value={settings.content.myHortzettelButton}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                content: { ...settings.content, myHortzettelButton: e.target.value },
                              })
                            }
                            disabled={!editingSettings}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label>Profil Button</Label>
                          <Input
                            value={settings.content.profileButton}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                content: { ...settings.content, profileButton: e.target.value },
                              })
                            }
                            disabled={!editingSettings}
                            className="mt-1.5"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Hortzettel-Formular */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-lg border-b pb-2">Hortzettel-Formular</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Formular-Titel</Label>
                          <Input
                            value={settings.content.hortzettelTitle}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                content: { ...settings.content, hortzettelTitle: e.target.value },
                              })
                            }
                            disabled={!editingSettings}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label>Formular-Beschreibung</Label>
                          <Input
                            value={settings.content.hortzettelDescription}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                content: { ...settings.content, hortzettelDescription: e.target.value },
                              })
                            }
                            disabled={!editingSettings}
                            className="mt-1.5"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Name des Kindes Label</Label>
                          <Input
                            value={settings.content.childNameLabel}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                content: { ...settings.content, childNameLabel: e.target.value },
                              })
                            }
                            disabled={!editingSettings}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label>Hortgruppe Label</Label>
                          <Input
                            value={settings.content.classLabel}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                content: { ...settings.content, classLabel: e.target.value },
                              })
                            }
                            disabled={!editingSettings}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label>Allein nach Hause Frage</Label>
                          <Input
                            value={settings.content.homeAloneQuestion}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                content: { ...settings.content, homeAloneQuestion: e.target.value },
                              })
                            }
                            disabled={!editingSettings}
                            className="mt-1.5"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sonstiges */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-lg border-b pb-2">Sonstiges</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Footer-Text</Label>
                          <Input
                            value={settings.content.footerText}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                content: { ...settings.content, footerText: e.target.value },
                              })
                            }
                            disabled={!editingSettings}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label>Datenschutz-Hinweis</Label>
                          <Input
                            value={settings.content.privacyNotice}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                content: { ...settings.content, privacyNotice: e.target.value },
                              })
                            }
                            disabled={!editingSettings}
                            className="mt-1.5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {editingSettings && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border">
                    <div className="flex gap-3">
                      <Button onClick={handleUpdateSettings} className="flex-1">
                        <Check className="h-4 w-4 mr-2" />
                        Alle Änderungen speichern
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingSettings(false);
                          loadData();
                        }}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Alle Änderungen verwerfen
                      </Button>
                    </div>
                  </div>
                )}

                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <Type className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-purple-900 dark:text-purple-400 mb-2">
                        Wo werden die Texte angezeigt?
                      </p>
                      <div className="text-sm text-purple-700 dark:text-purple-500 space-y-2">
                        <p className="flex items-start gap-2">
                          <span className="font-medium min-w-[140px]">App-Titel:</span>
                          <span>Login-Seite Header, SplashScreen, Browser-Tab</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <span className="font-medium min-w-[140px]">Login/Register:</span>
                          <span>Login- und Registrierungsformulare (wird in Zukunft implementiert)</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <span className="font-medium min-w-[140px]">Dashboard:</span>
                          <span>Persönliches Dashboard nach dem Login (wird in Zukunft implementiert)</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <span className="font-medium min-w-[140px]">Hortzettel:</span>
                          <span>Formular-Labels und Beschreibungen (wird in Zukunft implementiert)</span>
                        </p>
                        <div className="mt-3 space-y-2">
                          <p className="font-medium bg-purple-100 dark:bg-purple-900/40 p-3 rounded-lg">
                            💡 Tipp: Änderungen werden automatisch in allen Komponenten übernommen!
                          </p>
                          <p className="font-medium bg-blue-100 dark:bg-blue-900/40 p-3 rounded-lg">
                            🔓 App-Titel sehen: Loggen Sie sich aus, um den neuen Titel auf der Login-Seite zu sehen!
                          </p>
                          <p className="font-medium bg-green-100 dark:bg-green-900/40 p-3 rounded-lg">
                            ✅ Hortzettel-Labels: Werden sofort nach dem Speichern aktualisiert!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {settings && (
              <>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-blue-600" />
                      App-Einstellungen
                    </h3>
                    {!editingSettings && (
                      <Button
                        onClick={() => setEditingSettings(true)}
                        variant="outline"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Bearbeiten
                      </Button>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label>Schulname</Label>
                      <Input
                        value={settings.schoolName}
                        onChange={(e) =>
                          setSettings({ ...settings, schoolName: e.target.value })
                        }
                        disabled={!editingSettings}
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label>Hortgruppen (kommagetrennt)</Label>
                      <Input
                        value={settings.classes.join(", ")}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            classes: e.target.value.split(",").map((c) => c.trim()),
                          })
                        }
                        disabled={!editingSettings}
                        className="mt-1.5"
                      />
                    </div>

                    {editingSettings && (
                      <div className="flex gap-3 pt-4">
                        <Button onClick={handleUpdateSettings} className="flex-1">
                          <Check className="h-4 w-4 mr-2" />
                          Änderungen speichern
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingSettings(false);
                            loadData();
                          }}
                          className="flex-1"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Abbrechen
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dropdown Options Management */}
                <div className="space-y-6">
                  <DropdownManager
                    title="Abholzeiten"
                    description="Verwalten Sie die Auswahlmöglichkeiten für Abholzeiten in Hortzetteln"
                    icon={Clock}
                    options={settings.timeOptions}
                    onChange={(newOptions) => 
                      setSettings({ ...settings, timeOptions: newOptions })
                    }
                  />

                  <DropdownManager
                    title="Allein nach Hause gehen"
                    description="Verwalten Sie die Auswahlmöglichkeiten für die Frage 'Darf mein Kind alleine nach Hause gehen?'"
                    icon={Home}
                    options={settings.allowedHomeAloneOptions}
                    onChange={(newOptions) => 
                      setSettings({ ...settings, allowedHomeAloneOptions: newOptions })
                    }
                  />
                </div>

                {editingSettings && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border">
                    <div className="flex gap-3">
                      <Button onClick={handleUpdateSettings} className="flex-1">
                        <Check className="h-4 w-4 mr-2" />
                        Alle Änderungen speichern
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingSettings(false);
                          loadData();
                        }}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Alle Änderungen verwerfen
                      </Button>
                    </div>
                  </div>
                )}

                {/* Time Restriction Settings */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-orange-600" />
                        Zeitbeschränkungen für Hortzettel
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Verwalten Sie, wann Eltern Hortzettel erstellen und bearbeiten können
                      </p>
                    </div>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-orange-900 dark:text-orange-400 mb-1">
                          Aktuelle Einstellungen:
                        </p>
                        <div className="text-orange-700 dark:text-orange-500 space-y-1">
                          <p>
                            <strong>Status:</strong> {timeRestrictions.enabled ? "Aktiv" : "Deaktiviert"}
                          </p>
                          {timeRestrictions.enabled && (
                            <>
                              <p>
                                <strong>Sperrzeit:</strong> {timeRestrictions.blockStartHour}:00 - {timeRestrictions.blockEndHour}:00 Uhr
                              </p>
                              <p>
                                <strong>Tage:</strong> {timeRestrictions.blockWeekdaysOnly ? "Nur Montag-Freitag" : "Alle Tage"}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={() => setShowTimeRestrictionDialog(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Sperrzeit ändern
                  </Button>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-blue-900 dark:text-blue-400 mb-2">
                        Was wird automatisch aktualisiert?
                      </p>
                      <div className="text-sm text-blue-700 dark:text-blue-500 space-y-2">
                        <p className="flex items-start gap-2">
                          <span className="font-medium min-w-[140px]">Schulname:</span>
                          <span>Header und alle Dashboards</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <span className="font-medium min-w-[140px]">Klassen:</span>
                          <span>Dropdown im Hortzettel-Formular und Hortner-Dashboard</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <span className="font-medium min-w-[140px]">Abholzeiten:</span>
                          <span>Dropdown-Optionen im Hortzettel-Formular</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <span className="font-medium min-w-[140px]">Allein nach Hause:</span>
                          <span>Dropdown-Optionen im Hortzettel-Formular</span>
                        </p>
                        <div className="mt-3">
                          <p className="font-medium bg-blue-100 dark:bg-blue-900/40 p-3 rounded-lg">
                            ✅ Alle geöffneten Formulare werden automatisch aktualisiert!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Design Settings Tab */}
          <TabsContent value="design" className="space-y-6">
            <DesignSettingsManager />
          </TabsContent>

          {/* Formular Design Preview Tab */}
          <TabsContent value="formular" className="space-y-6">
            <HortzettelDesignPreview />
          </TabsContent>

          {/* Legal Settings Tab */}
          <TabsContent value="legal" className="space-y-6">
            <LegalSettingsManager />
          </TabsContent>

          {/* PWA Settings Tab */}
          <TabsContent value="pwa" className="space-y-6">
            <PWASettingsManager />
          </TabsContent>
        </Tabs>
      </main>

      {/* Create User Dialog */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuen Benutzer erstellen</DialogTitle>
            <DialogDescription>
              Erstellen Sie ein neues Eltern-Konto für einen Benutzer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Vorname</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                  placeholder="Max"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nachname</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  placeholder="Mustermann"
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Mindestens 6 Zeichen"
                className="mt-1.5"
              />
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>Hinweis:</strong> Der Benutzer kann sich mit "Vorname Nachname" (z.B. "Max Mustermann") und dem Passwort anmelden.
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleCreateUser} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Benutzer erstellen
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateUser(false);
                  setNewUser({ firstName: "", lastName: "", password: "" });
                }}
                className="flex-1"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetPasswordUser} onOpenChange={() => setResetPasswordUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Passwort zurücksetzen</DialogTitle>
            <DialogDescription>
              Neues Passwort für {resetPasswordUser?.firstName} {resetPasswordUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
              <div className="flex items-start gap-2">
                <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-blue-700 dark:text-blue-300">
                  Das neue Passwort wird im Admin-Dashboard angezeigt und kann dem Benutzer mitgeteilt werden.
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="newPassword">Neues Passwort</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen + Sonderzeichen"
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Muss mindestens 6 Zeichen und ein Sonderzeichen enthalten
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleResetPassword} className="flex-1">
                <Key className="h-4 w-4 mr-2" />
                Passwort zurücksetzen
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setResetPasswordUser(null);
                  setNewPassword("");
                }}
                className="flex-1"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Time Restriction Settings Dialog */}
      <Dialog open={showTimeRestrictionDialog} onOpenChange={setShowTimeRestrictionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Zeitbeschränkungen konfigurieren
            </DialogTitle>
            <DialogDescription>
              Legen Sie fest, wann Eltern Hortzettel erstellen und bearbeiten dürfen
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
              <div className="flex-1">
                <Label className="text-base font-medium">Zeitbeschränkung aktivieren</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Aktivieren oder deaktivieren Sie die zeitliche Sperre für Hortzettel
                </p>
              </div>
              <input
                type="checkbox"
                checked={timeRestrictions.enabled}
                onChange={(e) => 
                  setTimeRestrictions({ ...timeRestrictions, enabled: e.target.checked })
                }
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>

            {timeRestrictions.enabled && (
              <>
                {/* Time Range */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium mb-3 block">Sperrzeit festlegen</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Während dieser Zeit können keine Hortzettel erstellt oder bearbeitet werden
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="blockStartHour">Von (Stunde)</Label>
                      <Input
                        id="blockStartHour"
                        type="number"
                        min="0"
                        max="23"
                        value={timeRestrictions.blockStartHour}
                        onChange={(e) => 
                          setTimeRestrictions({ 
                            ...timeRestrictions, 
                            blockStartHour: parseInt(e.target.value) || 0 
                          })
                        }
                        className="mt-1.5"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {timeRestrictions.blockStartHour}:00 Uhr
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="blockEndHour">Bis (Stunde)</Label>
                      <Input
                        id="blockEndHour"
                        type="number"
                        min="0"
                        max="23"
                        value={timeRestrictions.blockEndHour}
                        onChange={(e) => 
                          setTimeRestrictions({ 
                            ...timeRestrictions, 
                            blockEndHour: parseInt(e.target.value) || 0 
                          })
                        }
                        className="mt-1.5"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {timeRestrictions.blockEndHour}:00 Uhr
                      </p>
                    </div>
                  </div>

                  {timeRestrictions.blockStartHour >= timeRestrictions.blockEndHour && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <p className="text-sm text-red-700 dark:text-red-400">
                        ⚠️ Die Startzeit muss vor der Endzeit liegen
                      </p>
                    </div>
                  )}
                </div>

                {/* Weekdays Only */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                  <div className="flex-1">
                    <Label className="text-base font-medium">Nur an Wochentagen sperren</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Wenn aktiviert, gilt die Sperre nur Montag-Freitag. Am Wochenende ist immer erlaubt.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={timeRestrictions.blockWeekdaysOnly}
                    onChange={(e) => 
                      setTimeRestrictions({ ...timeRestrictions, blockWeekdaysOnly: e.target.checked })
                    }
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                {/* Preview */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-400 mb-2">
                        Zusammenfassung:
                      </p>
                      <div className="text-blue-700 dark:text-blue-500 space-y-1">
                        <p>
                          📅 <strong>Tage:</strong> {timeRestrictions.blockWeekdaysOnly ? "Montag-Freitag" : "Alle Tage"}
                        </p>
                        <p>
                          🚫 <strong>Gesperrt:</strong> {timeRestrictions.blockStartHour}:00 - {timeRestrictions.blockEndHour}:00 Uhr
                        </p>
                        <p>
                          ✅ <strong>Erlaubt:</strong> Außerhalb der Sperrzeit
                          {timeRestrictions.blockWeekdaysOnly && " + am Wochenende jederzeit"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!timeRestrictions.enabled && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div className="text-sm text-green-700 dark:text-green-500">
                    Zeitbeschränkung ist deaktiviert. Eltern können jederzeit Hortzettel erstellen und bearbeiten.
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={handleUpdateTimeRestrictions} 
                className="flex-1"
                disabled={timeRestrictions.enabled && timeRestrictions.blockStartHour >= timeRestrictions.blockEndHour}
              >
                <Check className="h-4 w-4 mr-2" />
                Einstellungen speichern
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowTimeRestrictionDialog(false);
                  loadData(); // Reload original settings
                }}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Abbrechen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Export cache buster v2
