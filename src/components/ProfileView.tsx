import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ArrowLeft, User, Lock, Save, Edit2, Shield, Phone, AlertCircle, Heart, Calendar as CalendarIcon, Home, GraduationCap, Download, FileText, BookOpen } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { Badge } from "./ui/badge";
import type { ChildProfile, FamilyProfile, Child } from "../types/hortzettel";
import { api } from "../utils/api";
import { ChildrenManager } from "./ChildrenManager";
import HelpGuide from "./HelpGuide";

// ProfileView Component - v2.1
interface ProfileViewProps {
  firstName: string;
  lastName: string;
  childProfile?: ChildProfile;
  familyProfile?: FamilyProfile;
  onBack: () => void;
  onUpdate: (firstName: string, lastName: string, childProfile: ChildProfile, familyProfile: FamilyProfile, password?: string) => void;
}

export default function ProfileView({ 
  firstName, 
  lastName, 
  childProfile = {},
  familyProfile,
  onBack,
  onUpdate
}: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [newFirstName, setNewFirstName] = useState(firstName);
  const [newLastName, setNewLastName] = useState(lastName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Family profile fields (new multi-child system)
  const [children, setChildren] = useState<Child[]>(() => {
    // If familyProfile exists, use it
    if (familyProfile?.children && familyProfile.children.length > 0) {
      return familyProfile.children;
    }
    // Otherwise, migrate from old childProfile if it exists
    if (childProfile?.class || childProfile?.birthDate || childProfile?.allergies) {
      return [{
        id: `child_${Date.now()}`,
        firstName: firstName,
        lastName: lastName,
        class: childProfile.class,
        birthDate: childProfile.birthDate,
        allergies: childProfile.allergies,
        medicalNotes: childProfile.medicalNotes,
        authorizedPickup: childProfile.authorizedPickup,
      }];
    }
    // Default: create one child with parent's name
    return [{
      id: `child_${Date.now()}`,
      firstName: firstName,
      lastName: lastName,
    }];
  });
  const [parentPhone, setParentPhone] = useState(familyProfile?.parentPhone || childProfile.parentPhone || "");
  const [emergencyContactName, setEmergencyContactName] = useState(familyProfile?.emergencyContactName || childProfile.emergencyContactName || "");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(familyProfile?.emergencyContactPhone || childProfile.emergencyContactPhone || "");
  
  // Legacy fields (kept for backward compatibility)
  const [childClass, setChildClass] = useState(childProfile.class || "");
  const [birthDate, setBirthDate] = useState(childProfile.birthDate || "");
  const [allergies, setAllergies] = useState(childProfile.allergies || "");
  const [medicalNotes, setMedicalNotes] = useState(childProfile.medicalNotes || "");
  const [authorizedPickup, setAuthorizedPickup] = useState(childProfile.authorizedPickup || "");
  
  const [availableClasses, setAvailableClasses] = useState<string[]>(["Hort 1", "Hort 2", "Hort 3", "Hort 4"]);

  // Load available classes from settings
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const response = await api.getSettings();
        if (response.settings?.classes) {
          setAvailableClasses(response.settings.classes.filter((c: string) => c && c.trim() !== ''));
        }
      } catch (error) {
        console.error('Fehler beim Laden der Klassen:', error);
        // Keep default classes if loading fails
      }
    };
    loadClasses();
  }, []);

  const handleSave = () => {
    if (!newFirstName.trim() || !newLastName.trim()) {
      toast.error("Bitte fülle alle Pflichtfelder aus");
      return;
    }

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        toast.error("Die Passwörter stimmen nicht überein");
        return;
      }
      if (newPassword.length < 6) {
        toast.error("Das Passwort muss mindestens 6 Zeichen lang sein");
        return;
      }
      
      // Check for at least one special character
      const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
      if (!specialCharRegex.test(newPassword)) {
        toast.error("Passwort muss mindestens ein Sonderzeichen enthalten (!@#$%^&*()_+-=[]{};\\':\\\"\\\\|,.<>/?)", {
          duration: 5000,
        });
        return;
      }
    }

    if (children.length === 0) {
      toast.error("Du musst mindestens ein Kind haben");
      return;
    }

    // Create new family profile
    const updatedFamilyProfile: FamilyProfile = {
      children,
      parentPhone: parentPhone || undefined,
      emergencyContactName: emergencyContactName || undefined,
      emergencyContactPhone: emergencyContactPhone || undefined,
    };

    // Legacy child profile for backward compatibility
    const updatedChildProfile: ChildProfile = {
      class: childClass || undefined,
      birthDate: birthDate || undefined,
      parentPhone: parentPhone || undefined,
      emergencyContactName: emergencyContactName || undefined,
      emergencyContactPhone: emergencyContactPhone || undefined,
      allergies: allergies || undefined,
      medicalNotes: medicalNotes || undefined,
      authorizedPickup: authorizedPickup || undefined,
    };

    onUpdate(newFirstName, newLastName, updatedChildProfile, updatedFamilyProfile, newPassword || undefined);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Profil erfolgreich gespeichert!");
  };

  if (showHelp) {
    return <HelpGuide onClose={() => setShowHelp(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 border-b border-white/20 shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="text-white hover:bg-white/20"
            >
              <Home className="h-4 w-4 mr-2" />
              Zur Startseite
            </Button>
            <Button 
              variant="ghost"
              onClick={() => setShowHelp(true)}
              className="text-white hover:bg-white/20"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Hilfe
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl mb-4 shadow-xl">
              <User className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Mein Profil
            </h1>
            <p className="text-muted-foreground">
              Verwalte deine persönlichen Informationen
            </p>
          </div>

          {/* Persönliche Daten */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl">Persönliche Daten</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Deine Kontoinformationen
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="firstName" className="text-base">Vorname *</Label>
                  <Input
                    id="firstName"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="Vorname"
                    className="h-12 bg-white border-2 text-base focus:border-primary"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="lastName" className="text-base">Nachname *</Label>
                  <Input
                    id="lastName"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="Nachname"
                    className="h-12 bg-white border-2 text-base focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Badge className="bg-green-100 text-green-700 border-0 px-4 py-2 text-sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Konto ist aktiv
                </Badge>
              </div>
            </div>
          </div>

          {/* Meine Kinder (New Multi-Child System) */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8">
            <ChildrenManager
              children={children}
              onChange={setChildren}
              availableClasses={availableClasses}
            />
          </div>

          {/* Kindinformationen - Legacy (hidden, kept for backward compatibility) */}
          <div className="hidden">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="childClass" className="text-base flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Klasse
                </Label>
                <Select value={childClass} onValueChange={setChildClass}>
                  <SelectTrigger 
                    id="childClass"
                    className="h-12 bg-white border-2 text-base focus:border-primary"
                  >
                    <SelectValue placeholder="Klasse wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClasses.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        Klasse {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="birthDate" className="text-base flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Geburtsdatum
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="h-12 bg-white border-2 text-base focus:border-primary"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="parentPhone" className="text-base flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefonnummer der Eltern
                  </Label>
                  <Input
                    id="parentPhone"
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="0123 456789"
                    className="h-12 bg-white border-2 text-base focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="allergies" className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Allergien & Unverträglichkeiten
                </Label>
                <Textarea
                  id="allergies"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="z.B. Nussallergie, Laktoseintoleranz..."
                  className="bg-white border-2 focus:border-primary resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="medicalNotes" className="text-base flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Medizinische Hinweise
                </Label>
                <Textarea
                  id="medicalNotes"
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  placeholder="z.B. Asthma, Diabetes, Medikamente..."
                  className="bg-white border-2 focus:border-primary resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="authorizedPickup" className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Abholberechtigt
                </Label>
                <Textarea
                  id="authorizedPickup"
                  value={authorizedPickup}
                  onChange={(e) => setAuthorizedPickup(e.target.value)}
                  placeholder="Namen der abholberechtigten Personen (z.B. Oma, Tante...)"
                  className="bg-white border-2 focus:border-primary resize-none"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Familieninformationen & Notfallkontakt */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-blue-200/60 p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl">Familieninformationen</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Kontaktdaten für alle Kinder
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="parentPhone" className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefonnummer der Eltern
                </Label>
                <Input
                  id="parentPhone"
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="0123 456789"
                  className="h-12 bg-white border-2 text-base focus:border-primary"
                />
                <p className="text-xs text-muted-foreground">Diese Nummer gilt für alle Kinder</p>
              </div>

              <div className="border-t pt-6 mt-6">
                <h4 className="mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Notfallkontakt
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Wird kontaktiert, falls die Eltern nicht erreichbar sind
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="emergencyContactName" className="text-base">Name des Notfallkontakts</Label>
                    <Input
                      id="emergencyContactName"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      placeholder="z.B. Oma Müller"
                      className="h-12 bg-white border-2 text-base focus:border-primary"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="emergencyContactPhone" className="text-base">Telefonnummer Notfallkontakt</Label>
                    <Input
                      id="emergencyContactPhone"
                      type="tel"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      placeholder="0123 456789"
                      className="h-12 bg-white border-2 text-base focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <strong>Wichtig:</strong> Dieser Kontakt wird nur im Notfall kontaktiert, wenn die Eltern nicht erreichbar sind.
                </p>
              </div>
            </div>
          </div>

          {/* Passwort ändern */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl">Passwort ändern</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Optional - Lasse die Felder leer, um das Passwort beizubehalten
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="newPassword" className="text-base">Neues Passwort</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mindestens 6 Zeichen"
                  className="h-12 bg-white border-2 text-base focus:border-primary"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="text-base">Passwort bestätigen</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Neues Passwort wiederholen"
                  className="h-12 bg-white border-2 text-base focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Speichern Button */}
          <div className="flex justify-center pb-8">
            <Button 
              onClick={handleSave}
              size="lg"
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white hover:opacity-90 shadow-xl px-12 py-6 text-lg"
            >
              <Save className="h-5 w-5 mr-2" />
              Änderungen speichern
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}