import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ArrowLeft, Edit2, Trash2, Plus, FileText, Home, Calendar, Archive, Clock } from "lucide-react";
import type { HortzettelData } from "../types/hortzettel";
import { ThemeToggle } from "./ThemeToggle";
import { AppLogo } from "./AppLogo";
import { isEditingAllowedAsync, getNextEditingTimeMessage } from "../utils/weekUtils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

interface MyHortzettelListProps {
  hortzettelList: (HortzettelData & { id: string; createdAt: Date; updatedAt?: string })[];
  onBack: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

export default function MyHortzettelList({
  hortzettelList,
  onBack,
  onEdit,
  onDelete,
  onCreateNew,
}: MyHortzettelListProps) {
  const [showArchived, setShowArchived] = useState(false);
  const [isEditingAllowedState, setIsEditingAllowedState] = useState(true);

  useEffect(() => {
    checkEditingAllowed();
    
    // Prüfe Zeitbeschränkung jede Minute
    const interval = setInterval(checkEditingAllowed, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const checkEditingAllowed = async () => {
    const allowed = await isEditingAllowedAsync();
    setIsEditingAllowedState(allowed);
  };

  const formatDate = (date: Date | string | undefined | null) => {
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
      const labelParts = values.map(v => labels[v] || v).join(', ');
      // Add additional note if provided and not just "sonstiges"
      return otherValue && !value.includes('sonstiges') 
        ? `${labelParts} (${otherValue})` 
        : labelParts;
    }
    
    const baseLabel = labels[value] || value;
    // Add additional note if provided and not "sonstiges"
    return otherValue && value !== 'sonstiges' 
      ? `${baseLabel} (${otherValue})` 
      : baseLabel;
  };

  const formatWeekLabel = (weekNumber?: number, year?: number) => {
    if (!weekNumber || !year) return "Alte Version";
    return `KW ${weekNumber}, ${year}`;
  };

  const getDayCellColor = (editCount: number = 0) => {
    if (editCount === 0) return "";
    
    const colors = [
      "", // 0 - Original (keine Farbe)
      "bg-red-100 border-red-300 font-semibold", // 1 - Erste Änderung
      "bg-orange-100 border-orange-300 font-semibold", // 2 - Zweite Änderung
      "bg-yellow-100 border-yellow-300 font-semibold", // 3 - Dritte Änderung
      "bg-green-100 border-green-300 font-semibold", // 4+ - Weitere Änderungen
    ];
    return colors[Math.min(editCount, 4)] || colors[4];
  };

  const activeList = hortzettelList.filter(h => h.status === "aktiv" || !h.status);
  const archivedList = hortzettelList.filter(h => h.status === "archiviert");
  const displayList = showArchived ? archivedList : activeList;
  
  const editingTimeMessage = getNextEditingTimeMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-white/20 dark:border-slate-700/20 shadow-lg transition-colors">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button 
                variant="secondary" 
                onClick={onBack}
                className="bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 text-white border-white/30 transition-colors"
              >
                <Home className="h-4 w-4 mr-2" />
                Zur Startseite
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <AppLogo 
                className="w-12 h-12 bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl ring-4 ring-white/30 p-2"
                iconClassName="h-8 w-8 text-white"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="mb-2">Meine Hortzettel</h2>
            <p className="text-muted-foreground">
              Alle eingereichten Hortzettel im Überblick
            </p>
          </div>
          <Button onClick={onCreateNew} size="lg" className="shadow-lg" disabled={!isEditingAllowedState}>
            {isEditingAllowedState ? (
              <>
                <Plus className="h-5 w-5 mr-2" />
                Neuer Hortzettel
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 mr-2" />
                Derzeit gesperrt
              </>
            )}
          </Button>
        </div>

        {/* Editing Time Notice */}
        {!showArchived && activeList.length > 0 && (
          <div className={`mb-6 p-4 rounded-lg border ${
            isEditingAllowedState 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
              : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
          }`}>
            <div className="flex items-start gap-3">
              <Clock className={`h-5 w-5 mt-0.5 ${
                isEditingAllowedState 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-orange-600 dark:text-orange-400'
              }`} />
              <div className="flex-1">
                <p className={`font-medium ${
                  isEditingAllowedState 
                    ? 'text-green-900 dark:text-green-400' 
                    : 'text-orange-900 dark:text-orange-400'
                }`}>
                  {isEditingAllowedState ? '✓ Bearbeitung möglich' : '⏰ Bearbeitung derzeit gesperrt'}
                </p>
                <p className={`text-sm mt-1 ${
                  isEditingAllowedState 
                    ? 'text-green-700 dark:text-green-500' 
                    : 'text-orange-700 dark:text-orange-500'
                }`}>
                  {editingTimeMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        {hortzettelList.length > 0 && (
          <div className="mb-6 flex gap-2">
            <Button
              variant={!showArchived ? "default" : "outline"}
              onClick={() => setShowArchived(false)}
              className="flex-1"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Aktive Zettel ({activeList.length})
            </Button>
            <Button
              variant={showArchived ? "default" : "outline"}
              onClick={() => setShowArchived(true)}
              className="flex-1"
            >
              <Archive className="h-4 w-4 mr-2" />
              Archiv ({archivedList.length})
            </Button>
          </div>
        )}

        {hortzettelList.length === 0 ? (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 p-12 text-center transition-colors">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2">Noch keine Hortzettel</h3>
            <p className="text-muted-foreground mb-6">
              Du hast noch keine Hortzettel eingereicht
            </p>
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Ersten Hortzettel erstellen
            </Button>
          </div>
        ) : displayList.length === 0 ? (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 p-12 text-center transition-colors">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              {showArchived ? (
                <Archive className="h-8 w-8 text-muted-foreground" />
              ) : (
                <FileText className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <h3 className="mb-2">
              {showArchived ? "Kein Archiv vorhanden" : "Keine aktiven Hortzettel"}
            </h3>
            <p className="text-muted-foreground">
              {showArchived 
                ? "Du hast noch keine archivierten Hortzettel" 
                : "Du hast keine aktiven Hortzettel für diese Woche"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayList.map((hortzettel) => (
              <div
                key={hortzettel.id}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-md border border-white/50 dark:border-gray-700/50 p-3 sm:p-4 transition-colors"
              >
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="text-base sm:text-lg truncate">{hortzettel.childName}</h4>
                      <Badge className="bg-blue-100 text-blue-700 text-xs">
                        {hortzettel.class}
                      </Badge>
                      {hortzettel.status === "archiviert" ? (
                        <Badge variant="outline" className="text-xs bg-gray-100">
                          <Archive className="h-3 w-3 mr-1" />
                          Archiv
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatWeekLabel(hortzettel.weekNumber, hortzettel.year)}
                        </Badge>
                      )}
                      {(() => {
                        const totalEdits = (hortzettel.mondayEdits || 0) + 
                                          (hortzettel.tuesdayEdits || 0) + 
                                          (hortzettel.wednesdayEdits || 0) + 
                                          (hortzettel.thursdayEdits || 0) + 
                                          (hortzettel.fridayEdits || 0);
                        return totalEdits > 0 ? (
                          <Badge variant="outline" className="text-xs">
                            {totalEdits} {totalEdits === 1 ? 'Änderung' : 'Änderungen'}
                          </Badge>
                        ) : null;
                      })()}
                      {hortzettel.updatedAt && hortzettel.createdAt && new Date(hortzettel.updatedAt).getTime() > new Date(hortzettel.createdAt).getTime() + 1000 && (
                        <Badge className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300 dark:border-orange-700">
                          Bearbeitet
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(hortzettel.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {hortzettel.status !== "archiviert" && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => isEditingAllowedState && onEdit(hortzettel.id)}
                                className="h-8 px-2 sm:px-3"
                                disabled={!isEditingAllowedState}
                              >
                                {isEditingAllowedState ? (
                                  <Edit2 className="h-3 w-3 sm:mr-1" />
                                ) : (
                                  <Clock className="h-3 w-3 sm:mr-1" />
                                )}
                                <span className="hidden sm:inline">
                                  {isEditingAllowedState ? "Bearbeiten" : "Gesperrt"}
                                </span>
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {!isEditingAllowedState && (
                            <TooltipContent>
                              <p className="font-medium">Bearbeitung derzeit nicht möglich</p>
                              <p className="text-xs mt-1">{editingTimeMessage}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 px-2">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hortzettel löschen?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Möchtest du den Hortzettel für {hortzettel.childName} wirklich löschen?
                            Diese Aktion kann nicht rückgängig gemacht werden.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(hortzettel.id)}>
                            Löschen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Wochenplan - Kompakt */}
                <div className="overflow-x-auto -mx-1">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b">
                        <TableHead className="text-xs p-2 h-8">Mo</TableHead>
                        <TableHead className="text-xs p-2 h-8">Di</TableHead>
                        <TableHead className="text-xs p-2 h-8">Mi</TableHead>
                        <TableHead className="text-xs p-2 h-8">Do</TableHead>
                        <TableHead className="text-xs p-2 h-8">Fr</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="hover:bg-transparent">
                        <TableCell className={`text-xs p-2 ${getDayCellColor(hortzettel.mondayEdits || 0)}`}>
                          {getTimeLabel(hortzettel.monday, hortzettel.mondayOther)}
                        </TableCell>
                        <TableCell className={`text-xs p-2 ${getDayCellColor(hortzettel.tuesdayEdits || 0)}`}>
                          {getTimeLabel(hortzettel.tuesday, hortzettel.tuesdayOther)}
                        </TableCell>
                        <TableCell className={`text-xs p-2 ${getDayCellColor(hortzettel.wednesdayEdits || 0)}`}>
                          {getTimeLabel(hortzettel.wednesday, hortzettel.wednesdayOther)}
                        </TableCell>
                        <TableCell className={`text-xs p-2 ${getDayCellColor(hortzettel.thursdayEdits || 0)}`}>
                          {getTimeLabel(hortzettel.thursday, hortzettel.thursdayOther)}
                        </TableCell>
                        <TableCell className={`text-xs p-2 ${getDayCellColor(hortzettel.fridayEdits || 0)}`}>
                          {getTimeLabel(hortzettel.friday, hortzettel.fridayOther)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
