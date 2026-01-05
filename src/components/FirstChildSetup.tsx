import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Users, ArrowRight } from "lucide-react";
import { toast } from "sonner@2.0.3";
import type { Child } from "../types/hortzettel";
import { motion } from "motion/react";

interface FirstChildSetupProps {
  onComplete: (child: Child) => void;
  availableClasses: string[];
}

export function FirstChildSetup({ onComplete, availableClasses }: FirstChildSetupProps) {
  const [formData, setFormData] = useState<Partial<Child>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName) {
      toast.error("Bitte Vor- und Nachname eingeben");
      return;
    }

    if (!formData.class) {
      toast.error("Bitte Klasse auswählen");
      return;
    }

    setLoading(true);
    try {
      const newChild: Child = {
        id: `child_${Date.now()}`,
        firstName: formData.firstName!,
        lastName: formData.lastName!,
        class: formData.class!,
        birthDate: formData.birthDate,
        allergies: formData.allergies,
        medicalNotes: formData.medicalNotes,
        authorizedPickup: formData.authorizedPickup,
      };

      onComplete(newChild);
    } catch (error) {
      toast.error("Fehler beim Erstellen des Kindes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4 transition-colors">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-2xl border-0">
          <CardHeader className="bg-gradient-to-br from-purple-500 to-pink-600 text-white pb-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl">Willkommen! 🎉</CardTitle>
                <CardDescription className="text-white/90 text-base mt-1">
                  Bitte füge zuerst dein Kind hinzu
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-8 pb-8">
            <div className="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                💡 <strong>Wichtiger Schritt:</strong> Um Hortzettel zu erstellen, benötigen wir die Informationen über dein Kind. Du kannst später weitere Kinder hinzufügen.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm">
                    Vorname des Kindes *
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName || ""}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Max"
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm">
                    Nachname des Kindes *
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName || ""}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Mustermann"
                    required
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="class" className="text-sm">
                  Hortgruppe / Klasse *
                </Label>
                <Select
                  value={formData.class || ""}
                  onValueChange={(value) => setFormData({ ...formData, class: value })}
                  required
                >
                  <SelectTrigger id="class" className="h-11">
                    <SelectValue placeholder="Hortgruppe wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClasses.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Wähle die Hortgruppe oder Klasse deines Kindes
                </p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-4">
                  <strong>Optional:</strong> Diese Informationen kannst du auch später im Profil hinzufügen
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="birthDate" className="text-sm">
                      Geburtsdatum (optional)
                    </Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate || ""}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base group" 
                  disabled={loading || !formData.firstName || !formData.lastName || !formData.class}
                >
                  {loading ? "Wird gespeichert..." : "Kind hinzufügen und fortfahren"}
                  {!loading && <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Nach dem Hinzufügen des Kindes kannst du sofort Hortzettel erstellen
        </p>
      </motion.div>
    </div>
  );
}
