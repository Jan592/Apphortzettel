import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Trash2, Plus, Megaphone, Info, AlertTriangle, AlertCircle, Clock } from "lucide-react";
import { api } from "../utils/api";
import { toast } from "sonner@2.0.3";
import type { Announcement } from "../types/hortzettel";

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New announcement form state
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "warning" | "urgent"
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await api.getAnnouncements();
      setAnnouncements(response.announcements || []);
    } catch (error) {
      console.error('Fehler beim Laden der Mitteilungen:', error);
      toast.error('Fehler beim Laden der Mitteilungen');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.message) {
      toast.error('Bitte Titel und Nachricht eingeben');
      return;
    }

    try {
      await api.createAnnouncement(
        newAnnouncement.title,
        newAnnouncement.message,
        newAnnouncement.type,
        "Admin" // Set creator as Admin
      );
      toast.success('Mitteilung erfolgreich gesendet');
      setNewAnnouncement({ title: "", message: "", type: "info" });
      loadAnnouncements();
    } catch (error) {
      console.error('Fehler beim Erstellen:', error);
      toast.error('Fehler beim Erstellen der Mitteilung');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm('Möchten Sie diese Mitteilung wirklich löschen?')) {
      return;
    }

    try {
      await api.deleteAnnouncement(id);
      toast.success('Mitteilung gelöscht');
      loadAnnouncements();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      toast.error('Fehler beim Löschen der Mitteilung');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-amber-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50";
      case 'warning': return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50";
      default: return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'urgent': return "Dringend";
      case 'warning': return "Warnung";
      default: return "Info";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Column: Form */}
        <div className="w-full md:w-1/3">
          <Card className="sticky top-6">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Megaphone className="h-5 w-5 text-blue-600" />
                Neue Mitteilung
              </CardTitle>
              <CardDescription>
                Diese Nachricht wird allen Eltern auf ihrem Dashboard angezeigt.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Titel / Betreff</label>
                <Input 
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  placeholder="z.B. Hitzefrei am Freitag"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nachricht</label>
                <Textarea 
                  value={newAnnouncement.message}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, message: e.target.value})}
                  placeholder="Ihre Nachricht an die Eltern..."
                  rows={5}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priorität</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={newAnnouncement.type === 'info' ? 'default' : 'outline'}
                    size="sm"
                    className={newAnnouncement.type === 'info' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                    onClick={() => setNewAnnouncement({...newAnnouncement, type: 'info'})}
                  >
                    Info
                  </Button>
                  <Button
                    variant={newAnnouncement.type === 'warning' ? 'default' : 'outline'}
                    size="sm"
                    className={newAnnouncement.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                    onClick={() => setNewAnnouncement({...newAnnouncement, type: 'warning'})}
                  >
                    Wichtig
                  </Button>
                  <Button
                    variant={newAnnouncement.type === 'urgent' ? 'default' : 'outline'}
                    size="sm"
                    className={newAnnouncement.type === 'urgent' ? 'bg-red-600 hover:bg-red-700' : ''}
                    onClick={() => setNewAnnouncement({...newAnnouncement, type: 'urgent'})}
                  >
                    Dringend
                  </Button>
                </div>
              </div>

              <Button 
                onClick={handleCreateAnnouncement}
                className="w-full mt-4"
                disabled={!newAnnouncement.title || !newAnnouncement.message}
              >
                <Plus className="h-4 w-4 mr-2" />
                Mitteilung senden
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: List */}
        <div className="w-full md:w-2/3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aktive Mitteilungen ({announcements.length})</CardTitle>
              <CardDescription>Übersicht aller derzeit sichtbaren Mitteilungen</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-muted-foreground flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  Lade Mitteilungen...
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
                  <Megaphone className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                  <p>Keine aktiven Mitteilungen vorhanden.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div 
                      key={announcement.id} 
                      className={`p-4 rounded-xl border relative overflow-hidden flex flex-col sm:flex-row gap-4 ${getTypeColor(announcement.type)}`}
                    >
                      {/* Decoration stripe */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                        announcement.type === 'urgent' ? 'bg-red-500' : 
                        announcement.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      
                      <div className="pl-2 pt-1 hidden sm:block">
                        {getTypeIcon(announcement.type)}
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="sm:hidden">{getTypeIcon(announcement.type)}</span>
                              <h3 className="font-bold text-lg">{announcement.title}</h3>
                            </div>
                            <div className="flex items-center gap-2 text-xs opacity-70">
                              <Badge variant="outline" className="bg-white/50 border-current">
                                {getTypeLabel(announcement.type)}
                              </Badge>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(announcement.createdAt).toLocaleString('de-DE', {
                                  day: '2-digit', month: '2-digit', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                })}
                              </span>
                              {announcement.createdBy && (
                                <span>• Von: {announcement.createdBy}</span>
                              )}
                            </div>
                          </div>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 -mt-2 -mr-2"
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                            title="Löschen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <p className="text-sm whitespace-pre-wrap">{announcement.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
