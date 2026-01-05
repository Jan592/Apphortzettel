import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { 
  Bookmark, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Eye,
  Loader2,
  FileCheck 
} from "lucide-react";
import type { HortzettelTemplate } from "../types/hortzettel";
import { api } from "../utils/api";
import { toast } from "sonner@2.0.3";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface TemplateManagerProps {
  onLoadTemplate?: (template: HortzettelTemplate) => void;
  onUseAsHortzettel?: (template: HortzettelTemplate) => void;
}

export default function TemplateManager({ onLoadTemplate, onUseAsHortzettel }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<HortzettelTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<HortzettelTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    // Nur Templates laden wenn ein Access Token vorhanden ist
    if (!api.getAccessToken()) {
      console.log('[TemplateManager] Kein Access Token - überspringe Template-Laden');
      setLoading(false);
      return;
    }

    try {
      const response = await api.getTemplates();
      setTemplates(response.templates);
    } catch (error: any) {
      // Nur Fehler anzeigen wenn es kein Auth-Fehler ist
      if (error?.message?.includes('401')) {
        console.log('[TemplateManager] 401 - Überspringe Template-Laden');
      } else {
        console.error('Fehler beim Laden der Vorlagen:', error);
        toast.error('Fehler beim Laden der Vorlagen');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Möchten Sie die Vorlage "${name}" wirklich löschen?`)) {
      return;
    }

    try {
      await api.deleteTemplate(id);
      toast.success('Vorlage gelöscht');
      loadTemplates();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      toast.error('Fehler beim Löschen der Vorlage');
    }
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) {
      toast.error('Name darf nicht leer sein');
      return;
    }

    try {
      await api.updateTemplate(id, editName);
      toast.success('Vorlage umbenannt');
      setEditingId(null);
      setEditName("");
      loadTemplates();
    } catch (error) {
      console.error('Fehler beim Umbenennen:', error);
      toast.error('Fehler beim Umbenennen der Vorlage');
    }
  };

  const getTimeLabel = (value: string, otherValue?: string) => {
    const labels: Record<string, string> = {
      "nach-unterricht": "Nach Unterricht",
      "nach-mittagessen": "Nach Essen",
      "mittagsbus": "Mittagsbus",
      "nachmittagsbus": "Nachmittagsbus",
      "14:00": "14:00",
      "15:00": "15:00",
      "16:00": "16:00+",
      "krank": "Krank",
      "feiertag": "Feiertag",
      "sonstiges": otherValue || "Sonstiges",
    };
    
    // Handle comma-separated values (multiple selections)
    if (value.includes(',')) {
      const values = value.split(',').map(v => v.trim()).filter(v => v);
      return values.map(v => labels[v] || v).join(', ');
    }
    
    return labels[value] || value;
  };

  const formatDate = (date: string | undefined | null) => {
    if (!date) {
      return 'Unbekanntes Datum';
    }
    
    const dateObj = new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Ungültiges Datum';
    }
    
    return dateObj.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm rounded-xl shadow-md border border-white/50 dark:border-slate-600/50 transition-colors px-[24px] py-[0px] px-[14px]">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transition-all border border-white/50 dark:border-slate-600/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center shadow-sm">
            <Bookmark className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm mb-0">Meine Vorlagen</h3>
            <p className="text-xs text-muted-foreground">
              {templates.length} {templates.length === 1 ? 'Vorlage' : 'Vorlagen'} gespeichert
            </p>
          </div>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-2">
              <Bookmark className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Noch keine Vorlagen</p>
            <p className="text-xs text-muted-foreground mb-3">
              Speichern Sie häufig verwendete Wochenpläne als Vorlage
            </p>
            <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800 rounded-lg text-left p-2">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                <strong>💡 Tipp:</strong> Erstellen Sie einen Hortzettel und klicken Sie auf "Als Vorlage speichern". 
                Danach können Sie die Vorlage mit einem Klick als neuen Hortzettel verwenden!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-slate-800 dark:to-slate-800 rounded-lg p-3 border border-purple-200/50 dark:border-slate-600 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {editingId === template.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(template.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRename(template.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="h-3 w-3 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate">{template.name}</span>
                          <Badge variant="outline" className="text-xs py-0 h-5">
                            {template.class}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(template.createdAt)}
                        </p>
                      </>
                    )}
                  </div>

                  {editingId !== template.id && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPreviewTemplate(template)}
                        className="h-8 w-8 p-0"
                        title="Vorschau"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      {onUseAsHortzettel && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => onUseAsHortzettel(template)}
                          className="h-8 px-2 text-xs bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                          title="Als Hortzettel verwenden"
                        >
                          <FileCheck className="h-3 w-3 mr-1" />
                          Verwenden
                        </Button>
                      )}
                      {onLoadTemplate && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onLoadTemplate(template)}
                          className="h-8 px-2 text-xs"
                          title="In Editor laden"
                        >
                          Laden
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(template.id);
                          setEditName(template.name);
                        }}
                        className="h-8 w-8 p-0"
                        title="Umbenennen"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(template.id, template.name)}
                        className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Löschen"
                      >
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-purple-600" />
              Vorlagen-Vorschau: {previewTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              Klasse {previewTemplate?.class}
            </DialogDescription>
          </DialogHeader>

          {previewTemplate && (
            <div className="space-y-4">
              {/* Allein Heim gehen */}
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm mb-2">
                  <strong>Darf alleine heim gehen:</strong>
                </p>
                <p className="text-sm">
                  {previewTemplate.canGoHomeAlone === "sonstiges" 
                    ? previewTemplate.canGoHomeAloneOther 
                    : previewTemplate.canGoHomeAlone}
                </p>
              </div>

              {/* Wochenplan */}
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm mb-3">
                  <strong>Wochenplan:</strong>
                </p>
                <div className="grid gap-2">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium">Montag</span>
                    <span className="text-sm">{getTimeLabel(previewTemplate.monday, previewTemplate.mondayOther)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium">Dienstag</span>
                    <span className="text-sm">{getTimeLabel(previewTemplate.tuesday, previewTemplate.tuesdayOther)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium">Mittwoch</span>
                    <span className="text-sm">{getTimeLabel(previewTemplate.wednesday, previewTemplate.wednesdayOther)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium">Donnerstag</span>
                    <span className="text-sm">{getTimeLabel(previewTemplate.thursday, previewTemplate.thursdayOther)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium">Freitag</span>
                    <span className="text-sm">{getTimeLabel(previewTemplate.friday, previewTemplate.fridayOther)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {onUseAsHortzettel && (
                  <Button
                    onClick={() => {
                      onUseAsHortzettel(previewTemplate);
                      setPreviewTemplate(null);
                    }}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <FileCheck className="h-4 w-4 mr-2" />
                    Als Hortzettel verwenden
                  </Button>
                )}
                {onLoadTemplate && (
                  <Button
                    onClick={() => {
                      onLoadTemplate(previewTemplate);
                      setPreviewTemplate(null);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <Bookmark className="h-4 w-4 mr-2" />
                    In Editor laden
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}