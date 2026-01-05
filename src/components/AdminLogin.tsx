import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Shield, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { api } from "../utils/api";
import { AdminSetup } from "./AdminSetup";

interface AdminLoginProps {
  onSuccess: () => void;
  onBack: () => void;
}

export default function AdminLogin({ onSuccess, onBack }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Bitte alle Felder ausfüllen");
      return;
    }

    setLoading(true);

    try {
      await api.adminLogin(email, password);
      toast.success("Erfolgreich als Admin angemeldet!");
      onSuccess();
    } catch (error: any) {
      console.error("Admin login error:", error);
      
      // If credentials are invalid, suggest setup
      if (error.message.includes('Ungültige Anmeldedaten') || error.message.includes('Invalid login credentials')) {
        toast.error("Ungültige Anmeldedaten. Wurde das Admin-Konto bereits erstellt?");
      } else {
        toast.error(error.message || "Anmeldung fehlgeschlagen");
      }
    } finally {
      setLoading(false);
    }
  };

  if (showSetup) {
    return (
      <AdminSetup
        onSetupComplete={() => {
          setShowSetup(false);
          toast.success("Admin-Konto erstellt! Melden Sie sich jetzt an.");
        }}
        onCancel={() => setShowSetup(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl shadow-lg mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-white mb-2">Admin-Bereich</h1>
            <p className="text-white/60 text-sm">
              Melden Sie sich mit Ihren Admin-Zugangsdaten an
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                E-Mail-Adresse
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@hort-auma.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Passwort
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Wird angemeldet...
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5 mr-2" />
                  Als Admin anmelden
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-white/40 text-xs">
              Nur für autorisierte Administratoren
            </p>
            <Button
              type="button"
              variant="link"
              onClick={() => setShowSetup(true)}
              className="text-white/60 hover:text-white text-xs"
            >
              Noch kein Admin-Konto? Jetzt erstellen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
