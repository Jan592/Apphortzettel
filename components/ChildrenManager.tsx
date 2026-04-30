import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Users, Plus, Edit2, Trash2, GraduationCap, Calendar, AlertCircle, Heart, UserCheck } from "lucide-react";
import { toast } from "sonner@2.0.3";
import type { Child } from "../types/hortzettel";

interface ChildrenManagerProps {
  children: Child[];
  onChange: (children: Child[]) => void;
  availableClasses: string[];
}

export function ChildrenManager({ children, onChange, availableClasses }: ChildrenManagerProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [formData, setFormData] = useState<Partial<Child>>({});

  const handleAddChild = () => {
    setEditingChild(null);
    setFormData({});
    setShowDialog(true);
  };

  const handleEditChild = (child: Child) => {
    setEditingChild(child);
    setFormData(child);
    setShowDialog(true);
  };

  const handleDeleteChild = (childId: string) => {
    if (children.length === 1) {
      toast.error("Du musst mindestens ein Kind haben");
      return;
    }
    
    onChange(children.filter(c => c.id !== childId));
    toast.success("Kind erfolgreich gelöscht");
  };

  const handleSaveChild = () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error("Bitte Vor- und Nachname eingeben");
      return;
    }

    if (editingChild) {
      // Update existing child
      onChange(children.map(c => c.id === editingChild.id ? { ...editingChild, ...formData } : c));
      toast.success("Kind erfolgreich aktualisiert");
    } else {
      // Add new child
      const newChild: Child = {
        id: `child_${Date.now()}`,
        firstName: formData.firstName!,
        lastName: formData.lastName!,
        class: formData.class,
        birthDate: formData.birthDate,
        allergies: formData.allergies,
        medicalNotes: formData.medicalNotes,
        authorizedPickup: formData.authorizedPickup,
      };
      onChange([...children, newChild]);
      toast.success("Kind erfolgreich hinzugefügt");
    }

    setShowDialog(false);
    setFormData({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl">Meine Kinder</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Verwalte die Informationen deiner Kinder
            </p>
          </div>
        </div>
        <Button onClick={handleAddChild} className="gap-2">
          <Plus className="h-4 w-4" />
          Kind hinzufügen
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children.map((child) => (
          <Card key={child.id} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">
                    {child.firstName} {child.lastName}
                  </CardTitle>
                  {child.class && (
                    <CardDescription className="mt-2">
                      <Badge variant="secondary" className="gap-1">
                        <GraduationCap className="h-3 w-3" />
                        Klasse {child.class}
                      </Badge>
                    </CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditChild(child)}
                    className="h-8 w-8"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteChild(child.id)}
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-sm">
              {child.birthDate && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Geboren: {new Date(child.birthDate).toLocaleDateString('de-DE')}</span>
                </div>
              )}
              {child.allergies && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{child.allergies}</span>
                </div>
              )}
              {child.medicalNotes && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <Heart className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{child.medicalNotes}</span>
                </div>
              )}
              {child.authorizedPickup && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <UserCheck className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{child.authorizedPickup}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingChild ? "Kind bearbeiten" : "Kind hinzufügen"}
            </DialogTitle>
            <DialogDescription>
              Fülle die Informationen über dein Kind aus
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Vorname *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName || ""}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Max"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nachname *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName || ""}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Mustermann"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class">Klasse</Label>
                <Select
                  value={formData.class || ""}
                  onValueChange={(value) => setFormData({ ...formData, class: value })}
                >
                  <SelectTrigger id="class">
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
              <div className="space-y-2">
                <Label htmlFor="birthDate">Geburtsdatum</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate || ""}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">Allergien & Unverträglichkeiten</Label>
              <Textarea
                id="allergies"
                value={formData.allergies || ""}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                placeholder="z.B. Nussallergie, Laktoseintoleranz..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalNotes">Medizinische Hinweise</Label>
              <Textarea
                id="medicalNotes"
                value={formData.medicalNotes || ""}
                onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                placeholder="z.B. Asthma, Diabetes, Medikamente..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="authorizedPickup">Abholberechtigung</Label>
              <Textarea
                id="authorizedPickup"
                value={formData.authorizedPickup || ""}
                onChange={(e) => setFormData({ ...formData, authorizedPickup: e.target.value })}
                placeholder="Namen der abholberechtigten Personen..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveChild}>
              {editingChild ? "Aktualisieren" : "Hinzufügen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
