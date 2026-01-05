import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { User, Lock, Eye, EyeOff, ArrowRight, Key, Copy, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { toast } from "sonner@2.0.3";
import { api } from "../utils/api";

interface LoginFormProps {
  onLogin: (firstName: string, lastName: string, password: string, rememberMe: boolean) => Promise<void>;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetName, setResetName] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Split full name into first and last name
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      
      // Validate that both first and last name exist
      if (!firstName || !lastName) {
        toast.error("Bitte Vor- und Nachnamen eingeben", {
          description: "Gib deinen vollständigen Namen ein (z.B. Anna Müller)"
        });
        setLoading(false);
        return;
      }
      
      await onLogin(firstName, lastName, password, rememberMe);
    } catch (error) {
      // Error is handled in the onLogin function
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const nameParts = resetName.trim().split(/\s+/);
    if (nameParts.length < 2) {
      toast.error("Bitte gib Vor- und Nachnamen ein");
      return;
    }

    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ");

    setResetLoading(true);
    try {
      const response = await api.requestPasswordReset(firstName, lastName);
      setTempPassword(response.temporaryPassword);
      
      // Set the full name in the login form for convenience
      setFullName(resetName);
      
      toast.success("Temporäres Passwort wurde erstellt!");
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast.error(error.message || "Passwort konnte nicht zurückgesetzt werden");
    } finally {
      setResetLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      toast.success("Passwort in Zwischenablage kopiert!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCloseResetDialog = () => {
    setShowResetDialog(false);
    setResetName("");
    setTempPassword(null);
    setCopied(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <div className="mb-6">
        <h3 className="mb-2">Willkommen zurück</h3>
        <p className="text-muted-foreground text-sm">
          Melde dich mit deinem Account an
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="login-fullname" className="text-sm">Ihr Name (Eltern)</Label>
          <div className="relative group">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400 transition-colors group-focus-within:text-primary" />
            <Input
              id="login-fullname"
              name="name"
              type="text"
              placeholder="Anna Müller"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="pl-10 h-11 bg-background/50 backdrop-blur-sm border-muted-foreground/20 focus:border-primary/50 transition-all"
              autoComplete="name"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">Ihr Vor- und Nachname</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password" className="text-sm">Passwort</Label>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400 transition-colors group-focus-within:text-primary" />
            <Input
              id="login-password"
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

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-muted-foreground/30" 
            />
            <span className="text-muted-foreground">Angemeldet bleiben (24h)</span>
          </label>
          <button 
            type="button" 
            onClick={() => setShowResetDialog(true)}
            className="text-primary hover:underline transition-colors"
          >
            Passwort vergessen?
          </button>
        </div>

        <Button type="submit" className="w-full h-11 group" disabled={loading}>
          {loading ? "Wird angemeldet..." : "Anmelden"}
          {!loading && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />}
        </Button>
      </form>

      {/* Password Reset Dialog */}
      <Dialog open={showResetDialog} onOpenChange={handleCloseResetDialog}>
        <DialogContent className="sm:max-w-lg border-0 shadow-2xl overflow-hidden p-0">
          {!tempPassword ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <DialogHeader className="sr-only">
                <DialogTitle>Passwort zurücksetzen</DialogTitle>
                <DialogDescription>
                  Gib den Namen des Kindes ein, um ein temporäres Passwort zu erhalten.
                </DialogDescription>
              </DialogHeader>

              {/* Gradient Header */}
              <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 pb-6">
                <div className="absolute inset-0 bg-grid-white/5" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 backdrop-blur-xl border border-primary/20 flex items-center justify-center mb-4">
                    <Key className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-2xl mb-2">Passwort vergessen?</h2>
                  <p className="text-muted-foreground">
                    Kein Problem! Gib einfach den Namen des Kindes ein und wir erstellen ein neues temporäres Passwort.
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-name" className="text-sm">
                      Name des Kindes
                    </Label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400 transition-colors group-focus-within:text-primary" />
                      <Input
                        id="reset-name"
                        placeholder="z.B. Max Mustermann"
                        value={resetName}
                        onChange={(e) => setResetName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && resetName.trim()) {
                            handlePasswordReset();
                          }
                        }}
                        className="pl-11 h-12 text-base bg-background/50 backdrop-blur-sm border-muted-foreground/20 focus:border-primary/50 transition-all"
                        disabled={resetLoading}
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                      Bitte Vor- und Nachname eingeben
                    </p>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 mt-8">
                  <Button
                    variant="outline"
                    onClick={handleCloseResetDialog}
                    disabled={resetLoading}
                    className="flex-1 h-11"
                  >
                    Abbrechen
                  </Button>
                  <Button
                    onClick={handlePasswordReset}
                    disabled={resetLoading || !resetName.trim()}
                    className="flex-1 h-11 group"
                  >
                    {resetLoading ? (
                      "Wird erstellt..."
                    ) : (
                      <>
                        Passwort zurücksetzen
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <DialogHeader className="sr-only">
                <DialogTitle>Passwort erstellt</DialogTitle>
                <DialogDescription>
                  Dein temporäres Passwort wurde erfolgreich generiert.
                </DialogDescription>
              </DialogHeader>

              {/* Success Header */}
              <div className="relative bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent p-8 pb-6">
                <div className="absolute inset-0 bg-grid-white/5" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-green-500/10 backdrop-blur-xl border border-green-500/20 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-500" />
                  </div>
                  <h2 className="text-2xl mb-2">Passwort erstellt!</h2>
                  <p className="text-muted-foreground">
                    Dein temporäres Passwort wurde erfolgreich generiert.
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 pt-6 space-y-6">
                {/* Password Display */}
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">
                    Dein temporäres Passwort
                  </Label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                    <div className="relative bg-gradient-to-br from-background to-muted/30 backdrop-blur-sm border-2 border-primary/20 rounded-xl p-5 flex items-center gap-3">
                      <Lock className="h-5 w-5 text-primary shrink-0" />
                      <code className="flex-1 text-xl font-mono tracking-wider select-all">
                        {tempPassword}
                      </code>
                      <Button
                        size="icon"
                        variant={copied ? "default" : "outline"}
                        onClick={handleCopyPassword}
                        className="shrink-0 h-10 w-10 transition-all"
                      >
                        {copied ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Warning Box */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-900/50 p-4"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-orange-400/10 rounded-full blur-3xl" />
                  <div className="relative flex gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                        Wichtiger Hinweis
                      </p>
                      <p className="text-sm text-amber-800 dark:text-amber-300/90">
                        Dieses Passwort wird nur einmal angezeigt. Bitte notiere es dir und ändere es nach dem Login in deinem Profil.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Instructions */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm">
                    <strong className="text-foreground">Nächste Schritte:</strong>
                  </p>
                  <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
                    <li>Kopiere das temporäre Passwort oben</li>
                    <li>Melde dich mit deinem Namen und dem neuen Passwort an</li>
                    <li>Ändere das Passwort in deinem Profil</li>
                  </ol>
                </div>

                {/* Action Button */}
                <Button 
                  onClick={handleCloseResetDialog} 
                  className="w-full h-12 text-base group"
                >
                  Alles klar, zum Login!
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
