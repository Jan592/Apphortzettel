import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Shield, Lock, ArrowLeft, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

const schoolImage = "https://images.unsplash.com/photo-1665270695165-93b5798522ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnZXJtYW4lMjBlbGVtZW50YXJ5JTIwc2Nob29sJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzYxNjkwNjQyfDA&ixlib=rb-4.1.0&q=80&w=1080";

interface HortnerLoginProps {
  onLogin: (klasse: string, password: string) => Promise<void>;
}

// Hardcodierte Zugangsdaten für Hortner/innen
const HORTNER_CREDENTIALS = {
  "hort-1": { password: "Hort2024_K1", label: "Hort 1" },
  "hort-2": { password: "Hort2024_K2", label: "Hort 2" },
  "hort-3": { password: "Hort2024_K3", label: "Hort 3" },
  "hort-4": { password: "Hort2024_K4", label: "Hort 4" },
};

function HortnerLogin({ onLogin }: HortnerLoginProps) {
  const [selectedKlasse, setSelectedKlasse] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedKlasse) {
      setError("Bitte wähle eine Hortgruppe aus");
      return;
    }

    if (!password) {
      setError("Bitte gib das Passwort ein");
      return;
    }

    setLoading(true);
    try {
      await onLogin(selectedKlasse, password);
      
      // Save to localStorage if "Remember me" is checked
      if (rememberMe) {
        localStorage.setItem('hortner_session', JSON.stringify({
          klasse: selectedKlasse,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      setError("Falsches Passwort");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* School Image Background */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${schoolImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/95 via-amber-900/90 to-red-900/95 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
      </div>

      {/* Content */}
      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >

          </motion.div>

          {/* Logo & Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl mb-4 shadow-2xl shadow-orange-500/40 ring-4 ring-white/20"
            >
              <Shield className="h-10 w-10 text-white" />
            </motion.div>
            <h2 className="mb-2 text-white">Hortner-Bereich</h2>
            <p className="text-orange-100 text-sm">
              Anmeldung für Hortner/innen
            </p>
          </motion.div>

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 border border-white/30 p-6 sm:p-8"
          >
            <div className="mb-6">
              <h3 className="mb-2">Anmelden</h3>
              <p className="text-muted-foreground text-sm">
                Zugriff auf Hortzettel der zugewiesenen Hortgruppe
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Klassenauswahl */}
              <div className="space-y-2">
                <Label htmlFor="klasse" className="text-sm">Hortgruppe *</Label>
                <Select value={selectedKlasse} onValueChange={setSelectedKlasse}>
                  <SelectTrigger 
                    id="klasse"
                    className="h-11 bg-background/50 backdrop-blur-sm border-muted-foreground/20 focus:border-primary/50 transition-all"
                  >
                    <SelectValue placeholder="Wähle deine zugewiesene Hortgruppe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hort-1">Hort 1</SelectItem>
                    <SelectItem value="hort-2">Hort 2</SelectItem>
                    <SelectItem value="hort-3">Hort 3</SelectItem>
                    <SelectItem value="hort-4">Hort 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Passwort */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">Passwort *</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400 transition-colors group-focus-within:text-primary" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Passwort eingeben"
                    className="pl-10 h-11 bg-background/50 backdrop-blur-sm border-muted-foreground/20 focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              {/* Angemeldet bleiben */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm cursor-pointer select-none"
                >
                  Angemeldet bleiben
                </label>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm flex items-start gap-2"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? "Wird angemeldet..." : "Anmelden"}
              </Button>
            </form>

            {/* Zugangsdaten Hinweis */}
            <div className="mt-6 p-4 bg-amber-50/80 backdrop-blur-sm border border-amber-200/50 rounded-xl">
              <p className="text-sm text-amber-900">
                <span className="font-medium">Hinweis:</span> Die Zugangsdaten wurden dir von der Schulleitung mitgeteilt. 
                Bei Fragen wende dich bitte an die Verwaltung.
              </p>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <p className="text-center text-xs text-orange-100 mt-8">
              Dieser Bereich ist nur für autorisierte Hortner/innen zugänglich.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default HortnerLogin;
