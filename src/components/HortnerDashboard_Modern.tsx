import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { 
  Shield, LogOut, FileText, Search, Users, Phone,
  Info, Archive, Calendar, ChevronDown,
  Bell, User, Maximize2, RefreshCw, X,
  MoreVertical, Palette, AlertCircle
} from "lucide-react";
import type { HortzettelData, Announcement } from "../types/hortzettel";
import { api } from "../utils/api";
import { toast } from "sonner@2.0.3";
import { ThemeToggle } from "./ThemeToggle";
import { HortzettelPrintView } from "./HortzettelPrintView";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";

interface HortnerDashboardProps {
  klasse: string;
  allHortzettel: (HortzettelData & { id: string; createdAt: Date })[];
  onLogout: () => void;
  onToggleDesign?: (useModern: boolean) => void;
}

export default function HortnerDashboardModern({ 
  klasse, 
  allHortzettel: initialHortzettel, 
  onLogout,
  onToggleDesign
}: HortnerDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [hortgruppeFilter, setHortgruppeFilter] = useState<string>("alle");
  const [weekFilter, setWeekFilter] = useState<"aktiv" | "archiv" | "alle">("aktiv");
  const [allHortzettel, setAllHortzettel] = useState(initialHortzettel);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<(HortzettelData & { id: string; createdAt: Date }) | null>(null);
  const [showChildInfo, setShowChildInfo] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<"hortzettel" | "announcements">("hortzettel");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const visibleHortgruppe = klasse === "alle" ? "Alle Hortgruppen" : klasse;

  useEffect(() => {
    loadHortzettel();
    loadAnnouncements();
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!autoRefreshEnabled) return;
    
    const interval = setInterval(() => {
      loadHortzettel(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefreshEnabled]);

  const loadHortzettel = async (isAutoRefresh = false) => {
    try {
      const response = await api.getHortnerHortzettel();
      const hortzettel = response.hortzettel.map(h => ({
        ...h,
        createdAt: new Date(h.createdAt)
      }));
      
      if (isAutoRefresh && hortzettel.length > allHortzettel.length) {
        const newCount = hortzettel.length - allHortzettel.length;
        toast.success(`${newCount} neue${newCount === 1 ? 'r' : ''} Hortzettel verfügbar!`);
      }
      
      setAllHortzettel(hortzettel);
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error('Error loading hortzettel:', error);
      if (!isAutoRefresh) {
        toast.error('Fehler beim Laden der Hortzettel');
      }
    }
  };

  const loadAnnouncements = async () => {
    try {
      const response = await api.getAnnouncements();
      setAnnouncements(response.announcements || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  const handleArchiveWeek = async () => {
    try {
      const confirmed = confirm(
        'Möchten Sie alle Hortzettel der aktuellen Woche archivieren?\n\n' +
        'Archivierte Hortzettel bleiben erhalten und können über den "Archiv" Filter eingesehen werden.'
      );
      
      if (!confirmed) return;

      const activeHortzettel = allHortzettel.filter(h => h.status === 'aktiv');
      
      for (const hz of activeHortzettel) {
        await api.updateHortzettelStatus(hz.id, 'archiviert');
      }
      
      await loadHortzettel();
      toast.success('Woche erfolgreich abgeschlossen und archiviert!');
    } catch (error) {
      console.error('Error archiving week:', error);
      toast.error('Fehler beim Archivieren');
    }
  };

  const handleDeleteHortzettel = async (id: string) => {
    try {
      const confirmed = confirm('Möchten Sie diesen Hortzettel wirklich löschen?');
      if (!confirmed) return;

      await api.deleteHortzettel(id);
      await loadHortzettel();
      toast.success('Hortzettel gelöscht');
    } catch (error) {
      console.error('Error deleting hortzettel:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  const availableHortgruppen = Array.from(
    new Set(allHortzettel.map(h => h.class).filter(Boolean))
  ).sort();

  const filteredHortzettel = allHortzettel.filter(h => {
    const matchesSearch = h.childName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
    const matchesHortgruppe = hortgruppeFilter === "alle" || h.class === hortgruppeFilter;
    const matchesWeek = weekFilter === "alle" || h.status === weekFilter;
    
    return matchesSearch && matchesHortgruppe && matchesWeek;
  });

  const hortzettelByGroup = filteredHortzettel.reduce((acc, hz) => {
    const group = hz.class || 'Unbekannt';
    if (!acc[group]) acc[group] = [];
    acc[group].push(hz);
    return acc;
  }, {} as Record<string, typeof filteredHortzettel>);

  const activeCount = allHortzettel.filter(h => h.status === 'aktiv').length;
  const archivedCount = allHortzettel.filter(h => h.status === 'archiviert').length;

  const getDayDisplay = (day: string, dayOther: string) => {
    if (!day) return <span className="text-slate-400">-</span>;
    if (day === "andere" && dayOther) {
      return <span>{dayOther}</span>;
    }
    const displayMap: Record<string, string> = {
      "hort": "Hort",
      "heim": "Heim",
      "keine-betreuung": "Keine",
    };
    return <span>{displayMap[day] || day}</span>;
  };

  if (showPrintView) {
    return (
      <HortzettelPrintView 
        hortzettel={filteredHortzettel}
        onClose={() => setShowPrintView(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-slate-900 dark:text-white" />
              <div>
                <h1 className="text-lg">Hortner-Dashboard</h1>
                <p className="text-sm text-slate-500">{visibleHortgruppe}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 border border-slate-200 dark:border-slate-800 rounded">
                <div className={`w-1.5 h-1.5 rounded-full ${autoRefreshEnabled ? 'bg-slate-900 dark:bg-white' : 'bg-slate-300'}`}></div>
                {lastUpdateTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                <button
                  onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                  className="ml-1"
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
              </div>

              <ThemeToggle />

              {onToggleDesign && (
                <Button onClick={() => onToggleDesign(false)} variant="outline" size="sm">
                  <Palette className="h-4 w-4 mr-2" />
                  Klassisch
                </Button>
              )}

              <Button onClick={onLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Abmelden
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 border border-slate-200 dark:border-slate-800 rounded">
            <div className="text-sm text-slate-500 mb-1">Gesamt</div>
            <div className="text-2xl">{allHortzettel.length}</div>
          </div>
          <div className="p-4 border border-slate-200 dark:border-slate-800 rounded">
            <div className="text-sm text-slate-500 mb-1">Aktiv</div>
            <div className="text-2xl">{activeCount}</div>
          </div>
          <div className="p-4 border border-slate-200 dark:border-slate-800 rounded">
            <div className="text-sm text-slate-500 mb-1">Archiv</div>
            <div className="text-2xl">{archivedCount}</div>
          </div>
          <div className="p-4 border border-slate-200 dark:border-slate-800 rounded">
            <div className="text-sm text-slate-500 mb-1">Gruppen</div>
            <div className="text-2xl">{availableHortgruppen.length}</div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "hortzettel" | "announcements")}>
          <TabsList className="w-full mb-6 bg-transparent border-b border-slate-200 dark:border-slate-800 rounded-none h-auto p-0">
            <TabsTrigger 
              value="hortzettel" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 dark:data-[state=active]:border-white data-[state=active]:bg-transparent"
            >
              Hortzettel ({filteredHortzettel.length})
            </TabsTrigger>
            <TabsTrigger 
              value="announcements"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 dark:data-[state=active]:border-white data-[state=active]:bg-transparent"
            >
              Mitteilungen ({announcements.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hortzettel" className="space-y-6">
            {/* Filter & Search */}
            <div className="p-4 border border-slate-200 dark:border-slate-800 rounded">
              <div className="space-y-3">
                <Input
                  placeholder="Nach Kindname suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10"
                />

                <div className="grid grid-cols-3 gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="h-10 justify-between">
                        <span className="truncate">
                          {hortgruppeFilter === "alle" ? "Alle Gruppen" : `Hort ${hortgruppeFilter}`}
                        </span>
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => setHortgruppeFilter("alle")}>
                        Alle Gruppen
                      </DropdownMenuItem>
                      {availableHortgruppen.map((gruppe) => (
                        <DropdownMenuItem key={gruppe} onClick={() => setHortgruppeFilter(gruppe)}>
                          Hort {gruppe}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant={weekFilter === "aktiv" ? "default" : "outline"}
                    onClick={() => setWeekFilter("aktiv")}
                    className="h-10"
                  >
                    Aktiv
                  </Button>

                  <Button
                    variant={weekFilter === "archiv" ? "default" : "outline"}
                    onClick={() => setWeekFilter("archiv")}
                    className="h-10"
                  >
                    Archiv
                  </Button>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleArchiveWeek} variant="outline" className="flex-1 h-10">
                    Woche abschließen
                  </Button>
                  <Button onClick={() => setShowPrintView(true)} variant="outline" className="flex-1 h-10">
                    Vollansicht
                  </Button>
                </div>
              </div>
            </div>

            {/* Hortzettel Liste */}
            {loading ? (
              <div className="p-12 text-center border border-slate-200 dark:border-slate-800 rounded">
                <div className="w-8 h-8 border-2 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-500">Lade Hortzettel...</p>
              </div>
            ) : filteredHortzettel.length === 0 ? (
              <div className="p-12 text-center border border-slate-200 dark:border-slate-800 rounded">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="mb-2">Keine Hortzettel gefunden</p>
                <p className="text-sm text-slate-500">
                  {searchTerm ? "Passe deine Suchkriterien an" : "Noch keine Hortzettel eingereicht"}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(hortzettelByGroup).map(([gruppe, hortzettel]) => (
                  <div key={gruppe} className="space-y-3">
                    <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
                      <h3>Hort {gruppe}</h3>
                      <p className="text-sm text-slate-500">{hortzettel.length} Kinder</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {hortzettel.map((hz) => (
                        <div
                          key={hz.id}
                          className="p-4 border border-slate-200 dark:border-slate-800 rounded hover:border-slate-400 dark:hover:border-slate-600 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedChild(hz);
                            setShowChildInfo(true);
                          }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{hz.childName}</h4>
                              <p className="text-sm text-slate-500">Klasse {hz.class}</p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <button className="p-1">
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedChild(hz);
                                    setShowChildInfo(true);
                                  }}
                                >
                                  Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteHortzettel(hz.id);
                                  }}
                                  className="text-red-600"
                                >
                                  Löschen
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="mb-3 p-2 bg-slate-50 dark:bg-slate-900 text-sm rounded">
                            <div className="text-xs text-slate-500 mb-1">Allein nach Hause?</div>
                            <div>
                              {hz.canGoHomeAlone === "ja" ? "Ja" : hz.canGoHomeAlone === "nein" ? "Nein" : hz.canGoHomeAloneOther || "-"}
                            </div>
                          </div>

                          <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-900">
                              <span className="text-slate-500">Mo</span>
                              {getDayDisplay(hz.monday, hz.mondayOther)}
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-900">
                              <span className="text-slate-500">Di</span>
                              {getDayDisplay(hz.tuesday, hz.tuesdayOther)}
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-900">
                              <span className="text-slate-500">Mi</span>
                              {getDayDisplay(hz.wednesday, hz.wednesdayOther)}
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-900">
                              <span className="text-slate-500">Do</span>
                              {getDayDisplay(hz.thursday, hz.thursdayOther)}
                            </div>
                            <div className="flex justify-between py-1.5">
                              <span className="text-slate-500">Fr</span>
                              {getDayDisplay(hz.friday, hz.fridayOther)}
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                            <Badge variant={hz.status === 'aktiv' ? 'default' : 'secondary'}>
                              {hz.status}
                            </Badge>
                            <span className="text-slate-500">
                              {new Date(hz.createdAt).toLocaleDateString('de-DE')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="announcements" className="space-y-3">
            {announcements.length === 0 ? (
              <div className="p-12 text-center border border-slate-200 dark:border-slate-800 rounded">
                <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="mb-2">Keine Mitteilungen</p>
                <p className="text-sm text-slate-500">Es gibt derzeit keine Mitteilungen</p>
              </div>
            ) : (
              announcements.map((announcement) => (
                <div key={announcement.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{announcement.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{announcement.content}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(announcement.createdAt).toLocaleString('de-DE')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Child Info Dialog */}
      <Dialog open={showChildInfo} onOpenChange={setShowChildInfo}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hortzettel: {selectedChild?.childName}</DialogTitle>
          </DialogHeader>

          {selectedChild && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded">
                  <p className="text-sm text-slate-500 mb-1">Hortgruppe</p>
                  <p>{selectedChild.class}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded">
                  <p className="text-sm text-slate-500 mb-1">Status</p>
                  <Badge variant={selectedChild.status === 'aktiv' ? 'default' : 'secondary'}>
                    {selectedChild.status}
                  </Badge>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded">
                <p className="text-sm text-slate-500 mb-1">Darf alleine nach Hause gehen?</p>
                <p>
                  {selectedChild.canGoHomeAlone === "ja" ? "Ja" : selectedChild.canGoHomeAlone === "nein" ? "Nein" : selectedChild.canGoHomeAloneOther || "-"}
                </p>
              </div>

              <div>
                <h4 className="mb-3">Wochenplan</h4>
                <div className="space-y-2">
                  {[
                    { day: 'Montag', value: selectedChild.monday, other: selectedChild.mondayOther },
                    { day: 'Dienstag', value: selectedChild.tuesday, other: selectedChild.tuesdayOther },
                    { day: 'Mittwoch', value: selectedChild.wednesday, other: selectedChild.wednesdayOther },
                    { day: 'Donnerstag', value: selectedChild.thursday, other: selectedChild.thursdayOther },
                    { day: 'Freitag', value: selectedChild.friday, other: selectedChild.fridayOther },
                  ].map(({ day, value, other }) => (
                    <div key={day} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded">
                      <span>{day}</span>
                      <span>{getDayDisplay(value, other)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedChild.familyProfile && (
                <div className="border-t pt-4">
                  <h4 className="mb-3">Zusätzliche Informationen</h4>
                  <div className="space-y-2">
                    {selectedChild.familyProfile.children?.map((child: any, idx: number) => 
                      child.firstName === selectedChild.childName?.split(' ')[0] ? (
                        <div key={idx} className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900 rounded">
                          {child.birthDate && (
                            <p className="text-sm"><strong>Geburtsdatum:</strong> {new Date(child.birthDate).toLocaleDateString('de-DE')}</p>
                          )}
                          {child.allergies && (
                            <p className="text-sm text-red-600"><strong>Allergien:</strong> {child.allergies}</p>
                          )}
                          {child.medicalNotes && (
                            <p className="text-sm"><strong>Med. Hinweise:</strong> {child.medicalNotes}</p>
                          )}
                        </div>
                      ) : null
                    )}
                    {selectedChild.familyProfile.parentPhone && (
                      <p className="text-sm flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <strong>Telefon:</strong> {selectedChild.familyProfile.parentPhone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t pt-3 text-sm text-slate-500">
                <p>Erstellt am: {new Date(selectedChild.createdAt).toLocaleString('de-DE')}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
