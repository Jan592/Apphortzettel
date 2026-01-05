import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { 
  Code, 
  User, 
  FileText, 
  List, 
  Shield, 
  Settings, 
  Bell,
  UserCircle,
  LogIn,
  UserPlus,
  Scale,
  X
} from "lucide-react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import PersonalDashboard from "./PersonalDashboard";
import CreateHortzettelForm from "./CreateHortzettelForm";
import MyHortzettelList from "./MyHortzettelList";
import HortnerLogin from "./HortnerLogin";
import HortnerDashboard from "./HortnerDashboard";
import ProfileView from "./ProfileView";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import { LegalPages } from "./LegalPages";
import type { ChildProfile, HortzettelData } from "../types/hortzettel";

type PageView = 
  | "overview"
  | "login"
  | "register"
  | "personalDashboard"
  | "createHortzettel"
  | "myHortzettel"
  | "profile"
  | "hortnerLogin"
  | "hortnerDashboard"
  | "adminLogin"
  | "adminDashboard"
  | "legal";

interface Page {
  id: PageView;
  name: string;
  description: string;
  icon: any;
  category: "Eltern" | "Hortner" | "Admin" | "Legal";
  requiresData?: boolean;
}

const pages: Page[] = [
  {
    id: "login",
    name: "Login Seite",
    description: "Eltern Login mit Vor-/Nachname",
    icon: LogIn,
    category: "Eltern"
  },
  {
    id: "register",
    name: "Registrierung",
    description: "Neues Elternkonto erstellen",
    icon: UserPlus,
    category: "Eltern"
  },
  {
    id: "personalDashboard",
    name: "Persönliches Dashboard",
    description: "Eltern Dashboard Übersicht",
    icon: User,
    category: "Eltern",
    requiresData: true
  },
  {
    id: "createHortzettel",
    name: "Hortzettel erstellen",
    description: "Neuen Hortzettel ausfüllen",
    icon: FileText,
    category: "Eltern",
    requiresData: true
  },
  {
    id: "myHortzettel",
    name: "Meine Hortzettel",
    description: "Liste aller Hortzettel",
    icon: List,
    category: "Eltern",
    requiresData: true
  },
  {
    id: "profile",
    name: "Profil",
    description: "Kind-Profil und Einstellungen",
    icon: UserCircle,
    category: "Eltern",
    requiresData: true
  },
  {
    id: "hortnerLogin",
    name: "Hortner Login",
    description: "Login für Hortner/innen",
    icon: Shield,
    category: "Hortner"
  },
  {
    id: "hortnerDashboard",
    name: "Hortner Dashboard",
    description: "Übersicht aller Hortzettel",
    icon: FileText,
    category: "Hortner",
    requiresData: true
  },
  {
    id: "adminLogin",
    name: "Admin Login",
    description: "Admin Login Seite",
    icon: Settings,
    category: "Admin"
  },
  {
    id: "adminDashboard",
    name: "Admin Dashboard",
    description: "Admin Verwaltungsbereich",
    icon: Settings,
    category: "Admin",
    requiresData: true
  },
  {
    id: "legal",
    name: "Rechtliche Seiten",
    description: "Datenschutz & Nutzungsbedingungen",
    icon: Scale,
    category: "Legal"
  }
];

// Mock-Daten für Vorschau
const mockUser = {
  firstName: "Max",
  lastName: "Mustermann",
  childProfile: {
    birthDate: "2015-05-15",
    parentPhone: "0123456789",
    allergies: "Keine",
    medicalNotes: "Keine",
    pickupAuthorization: "Oma: Maria Mustermann",
    emergencyContact: "Opa: Hans Mustermann, 0987654321"
  } as ChildProfile
};

const mockHortzettel: (HortzettelData & { id: string; createdAt: Date })[] = [
  {
    id: "mock-1",
    firstName: "Max",
    lastName: "Mustermann",
    klasse: "2a",
    canGoHomeAlone: false,
    weekNumber: 45,
    year: 2024,
    schedule: {
      Montag: { attending: true, pickupTime: "15:00", pickupPerson: "Mama" },
      Dienstag: { attending: true, pickupTime: "16:00", pickupPerson: "Papa" },
      Mittwoch: { attending: true, pickupTime: "15:30", pickupPerson: "Oma" },
      Donnerstag: { attending: false, pickupTime: "", pickupPerson: "" },
      Freitag: { attending: true, pickupTime: "14:00", pickupPerson: "Mama" }
    },
    createdAt: new Date(),
    childProfile: mockUser.childProfile
  }
];

export default function DeveloperMode({ onClose }: { onClose: () => void }) {
  const [currentPage, setCurrentPage] = useState<PageView>("overview");
  const [selectedCategory, setSelectedCategory] = useState<string>("Alle");

  const categories = ["Alle", "Eltern", "Hortner", "Admin", "Legal"];

  const filteredPages = selectedCategory === "Alle" 
    ? pages 
    : pages.filter(p => p.category === selectedCategory);

  const renderPage = () => {
    switch (currentPage) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl flex items-center gap-3">
                  <Code className="h-8 w-8 text-purple-600" />
                  Developer Mode
                </h2>
                <p className="text-muted-foreground mt-2">
                  Alle Seiten der App in der Übersicht - zum schnellen Testen und Entwickeln
                </p>
              </div>
              <Button onClick={onClose} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Schließen
              </Button>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <Button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                >
                  {cat}
                </Button>
              ))}
            </div>

            {/* Pages Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPages.map(page => {
                const Icon = page.icon;
                return (
                  <Card
                    key={page.id}
                    className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-purple-500"
                    onClick={() => setCurrentPage(page.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1">{page.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {page.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                            {page.category}
                          </span>
                          {page.requiresData && (
                            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                              Mit Mock-Daten
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Info Box */}
            <Card className="p-6 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
              <div className="flex gap-3">
                <Code className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-2 text-purple-900 dark:text-purple-100">
                    Hinweis zum Developer Mode
                  </h4>
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    Dieser Modus ist nur für Entwicklungs- und Testzwecke gedacht. 
                    Seiten mit "Mock-Daten" verwenden vorgefertigte Testdaten. 
                    Klicken Sie auf eine Karte, um die entsprechende Seite anzuzeigen.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        );

      case "login":
        return (
          <div className="max-w-md mx-auto">
            <Button onClick={() => setCurrentPage("overview")} variant="outline" className="mb-4">
              ← Zurück zur Übersicht
            </Button>
            <LoginForm 
              onLogin={(firstName, lastName, profile) => {
                console.log("Login (Preview):", firstName, lastName);
              }} 
            />
          </div>
        );

      case "register":
        return (
          <div className="max-w-md mx-auto">
            <Button onClick={() => setCurrentPage("overview")} variant="outline" className="mb-4">
              ← Zurück zur Übersicht
            </Button>
            <RegisterForm 
              onRegister={(firstName, lastName, password) => {
                console.log("Register (Preview):", firstName, lastName);
                return Promise.resolve();
              }} 
            />
          </div>
        );

      case "personalDashboard":
        return (
          <div>
            <Button onClick={() => setCurrentPage("overview")} variant="outline" className="mb-4">
              ← Zurück zur Übersicht
            </Button>
            <PersonalDashboard 
              firstName={mockUser.firstName}
              lastName={mockUser.lastName}
              onCreateHortzettel={() => console.log("Create Hortzettel")}
              onViewHortzettel={() => console.log("View Hortzettel")}
              onViewProfile={() => console.log("View Profile")}
              onLogout={() => console.log("Logout")}
              childProfile={mockUser.childProfile}
            />
          </div>
        );

      case "createHortzettel":
        return (
          <div>
            <Button onClick={() => setCurrentPage("overview")} variant="outline" className="mb-4">
              ← Zurück zur Übersicht
            </Button>
            <CreateHortzettelForm 
              firstName={mockUser.firstName}
              lastName={mockUser.lastName}
              onBack={() => setCurrentPage("overview")}
              onSave={(data) => console.log("Save (Preview):", data)}
              editingHortzettel={null}
            />
          </div>
        );

      case "myHortzettel":
        return (
          <div>
            <Button onClick={() => setCurrentPage("overview")} variant="outline" className="mb-4">
              ← Zurück zur Übersicht
            </Button>
            <MyHortzettelList 
              hortzettelList={mockHortzettel}
              onBack={() => setCurrentPage("overview")}
              onEdit={(id) => console.log("Edit:", id)}
              onDelete={(id) => console.log("Delete:", id)}
            />
          </div>
        );

      case "profile":
        return (
          <div>
            <Button onClick={() => setCurrentPage("overview")} variant="outline" className="mb-4">
              ← Zurück zur Übersicht
            </Button>
            <ProfileView 
              firstName={mockUser.firstName}
              lastName={mockUser.lastName}
              childProfile={mockUser.childProfile!}
              onBack={() => setCurrentPage("overview")}
              onUpdateProfile={(profile) => console.log("Update Profile:", profile)}
            />
          </div>
        );

      case "hortnerLogin":
        return (
          <div className="max-w-md mx-auto">
            <Button onClick={() => setCurrentPage("overview")} variant="outline" className="mb-4">
              ← Zurück zur Übersicht
            </Button>
            <HortnerLogin 
              onLogin={(klasse) => console.log("Hortner Login:", klasse)}
            />
          </div>
        );

      case "hortnerDashboard":
        return (
          <div>
            <Button onClick={() => setCurrentPage("overview")} variant="outline" className="mb-4 ml-4">
              ← Zurück zur Übersicht
            </Button>
            <HortnerDashboard 
              klasse="1a, 1b, 2a"
              allHortzettel={mockHortzettel}
              onLogout={() => setCurrentPage("overview")}
            />
          </div>
        );

      case "adminLogin":
        return (
          <div className="max-w-md mx-auto">
            <Button onClick={() => setCurrentPage("overview")} variant="outline" className="mb-4">
              ← Zurück zur Übersicht
            </Button>
            <AdminLogin 
              onLogin={() => console.log("Admin Login")}
            />
          </div>
        );

      case "adminDashboard":
        return (
          <div>
            <Button onClick={() => setCurrentPage("overview")} variant="outline" className="mb-4 ml-4">
              ← Zurück zur Übersicht
            </Button>
            <AdminDashboard 
              onLogout={() => setCurrentPage("overview")}
            />
          </div>
        );

      case "legal":
        return (
          <div>
            <Button onClick={() => setCurrentPage("overview")} variant="outline" className="mb-4">
              ← Zurück zur Übersicht
            </Button>
            <LegalPages />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {renderPage()}
      </div>
    </div>
  );
}
