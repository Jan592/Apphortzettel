import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Lock, User, Eye, EyeOff, ArrowRight, CheckCircle2, Users, GraduationCap } from "lucide-react";
import { motion } from "motion/react";
import { LegalPages } from "./LegalPages";

interface RegisterFormProps {
  onRegister: (firstName: string, lastName: string, password: string, childFirstName: string, childLastName: string, childClass: string) => Promise<void>;
  availableClasses?: string[];
}

type LegalPageType = 'privacy' | 'terms' | null;

export function RegisterForm({ onRegister, availableClasses = ["Hort 1", "Hort 2", "Hort 3", "Hort 4"] }: RegisterFormProps) {
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [childFirstName, setChildFirstName] = useState("");
  const [childLastName, setChildLastName] = useState("");
  const [childClass, setChildClass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [activeLegalPage, setActiveLegalPage] = useState<LegalPageType>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Split full name into first and last name
    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length < 2) {
      setError("Bitte gib Vor- und Nachnamen ein");
      return;
    }
    
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Validate child information
    if (!childFirstName.trim()) {
      setError("Bitte gib den Vornamen deines Kindes ein");
      return;
    }

    if (!childLastName.trim()) {
      setError("Bitte gib den Nachnamen deines Kindes ein");
      return;
    }

    if (!childClass) {
      setError("Bitte wähle die Klasse deines Kindes aus");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwörter stimmen nicht überein");
      return;
    }

    if (password.length < 6) {
      setError("Passwort muss mindestens 6 Zeichen lang sein");
      return;
    }

    // Check for at least one special character
    const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    if (!specialCharRegex.test(password)) {
      setError("Passwort muss mindestens ein Sonderzeichen enthalten (!@#$%^&*()_+-=[]{};\\':\\\"\\|,.<>/?)");
      return;
    }

    setLoading(true);
    try {
      await onRegister(firstName, lastName, password, childFirstName.trim(), childLastName.trim(), childClass);
    } catch (error) {
      // Error is handled in the onRegister function
    } finally {
      setLoading(false);
    }
  };

  const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
  
  const passwordRequirements = [
    { met: fullName.trim().split(/\s+/).length >= 2, text: "Eltern-Name: Vor- und Nachname" },
    { met: childFirstName.trim().length > 0 && childLastName.trim().length > 0, text: "Kind-Name: Vor- und Nachname" },
    { met: childClass.length > 0, text: "Klasse ausgewählt" },
    { met: password.length >= 6, text: "Mindestens 6 Zeichen" },
    { met: specialCharRegex.test(password), text: "Mindestens ein Sonderzeichen (!@#$%...)" },
    { met: password === confirmPassword && password.length > 0, text: "Passwörter stimmen überein" },
  ];

  const handleOpenLegal = (page: 'privacy' | 'terms') => {
    setActiveLegalPage(page);
    setShowLegal(true);
  };

  const handleCloseLegal = () => {
    setShowLegal(false);
    setActiveLegalPage(null);
  };

  if (showLegal) {
    return (
      <LegalPages 
        defaultPage={activeLegalPage}
        onClose={handleCloseLegal}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <div className="mb-6">
        <h3 className="mb-2">Account erstellen</h3>
        <p className="text-muted-foreground text-sm">
          Erstelle einen Eltern-Account für deine Familie
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Eltern-Informationen */}
        <div className="space-y-4 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">Eltern-Informationen</h4>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="register-fullname" className="text-sm">Ihr Name (Eltern) *</Label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400 transition-colors group-focus-within:text-primary" />
              <Input
                id="register-fullname"
                name="name"
                type="text"
                placeholder="Anna Müller"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10 h-11 bg-white dark:bg-slate-900 border-muted-foreground/20 focus:border-primary/50 transition-all"
                autoComplete="name"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">Ihr Vor- und Nachname (getrennt durch Leerzeichen)</p>
          </div>
        </div>

        {/* Kind-Informationen */}
        <div className="space-y-4 p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border-2 border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h4 className="font-semibold text-purple-900 dark:text-purple-100">Kind-Informationen</h4>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="child-firstname" className="text-sm">Vorname des Kindes *</Label>
              <Input
                id="child-firstname"
                type="text"
                placeholder="Max"
                value={childFirstName}
                onChange={(e) => setChildFirstName(e.target.value)}
                className="h-11 bg-white dark:bg-slate-900 border-muted-foreground/20 focus:border-primary/50 transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="child-lastname" className="text-sm">Nachname des Kindes *</Label>
              <Input
                id="child-lastname"
                type="text"
                placeholder="Mustermann"
                value={childLastName}
                onChange={(e) => setChildLastName(e.target.value)}
                className="h-11 bg-white dark:bg-slate-900 border-muted-foreground/20 focus:border-primary/50 transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="child-class" className="text-sm flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Klasse / Hortgruppe *
            </Label>
            <Select value={childClass} onValueChange={setChildClass}>
              <SelectTrigger id="child-class" className="h-11 bg-white dark:bg-slate-900 border-muted-foreground/20">
                <SelectValue placeholder="Klasse auswählen" />
              </SelectTrigger>
              <SelectContent>
                {availableClasses.filter(cls => cls && cls.trim() !== '').map((cls) => (
                  <SelectItem key={cls} value={cls}>
                    {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 rounded-lg bg-purple-100/50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700">
            <p className="text-xs text-purple-800 dark:text-purple-300">
              💡 <strong>Hinweis:</strong> Weitere Kinder können später im Profil hinzugefügt werden.
            </p>
          </div>
        </div>

        {/* Passwort */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="register-password" className="text-sm">Passwort *</Label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400 transition-colors group-focus-within:text-primary" />
              <Input
                id="register-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-11 bg-background/50 backdrop-blur-sm border-muted-foreground/20 focus:border-primary/50 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-gray-400 hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-confirm-password" className="text-sm">Passwort bestätigen *</Label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400 transition-colors group-focus-within:text-primary" />
              <Input
                id="register-confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 h-11 bg-background/50 backdrop-blur-sm border-muted-foreground/20 focus:border-primary/50 transition-all"
                required
              />
            </div>
          </div>
        </div>

        {/* Password Requirements */}
        <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-muted-foreground/10">
          <p className="text-xs text-muted-foreground mb-2">Anforderungen:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {passwordRequirements.map((req, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <CheckCircle2 
                  className={`h-3.5 w-3.5 flex-shrink-0 transition-colors ${
                    req.met ? "text-green-600" : "text-muted-foreground/30"
                  }`} 
                />
                <span className={req.met ? "text-green-600" : "text-muted-foreground"}>
                  {req.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3"
          >
            {error}
          </motion.div>
        )}

        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/20 border border-muted-foreground/10">
          <input type="checkbox" id="terms" className="mt-0.5 rounded border-muted-foreground/30" required />
          <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer select-none">
            Ich akzeptiere die{" "}
            <button 
              type="button" 
              onClick={(e) => {
                e.preventDefault();
                handleOpenLegal('terms');
              }}
              className="text-primary hover:underline font-medium"
            >
              Nutzungsbedingungen
            </button>{" "}
            und{" "}
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleOpenLegal('privacy');
              }}
              className="text-primary hover:underline font-medium"
            >
              Datenschutzrichtlinien
            </button>
          </label>
        </div>

        <Button type="submit" className="w-full h-11 group" disabled={loading}>
          {loading ? "Wird registriert..." : "Registrieren"}
          {!loading && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />}
        </Button>
      </form>
    </motion.div>
  );
}
