import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ArrowLeft, Send, MessageCircle, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../utils/api';
import { toast } from 'sonner@2.0.3';
import type { Message } from '../types/hortzettel';

interface MessagingViewProps {
  onBack: () => void;
  userType: 'parent' | 'hortner';
  klasse?: string;
}

export default function MessagingView({ onBack, userType, klasse }: MessagingViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    // Nur Nachrichten laden wenn ein Access Token vorhanden ist
    if (!api.getAccessToken()) {
      console.log('[MessagingView] Kein Access Token - überspringe Nachrichten-Laden');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      let response;
      if (userType === 'parent') {
        response = await api.getMessages();
      } else if (userType === 'hortner' && klasse) {
        response = await api.getHortnerMessages(klasse);
      }
      setMessages(response?.messages || []);
    } catch (error: any) {
      console.error('Fehler beim Laden der Nachrichten:', error);
      // Nur Toast anzeigen wenn es kein Auth-Fehler ist (401)
      if (!error.message?.includes('401')) {
        toast.error('Fehler beim Laden der Nachrichten: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = async (msg: Message) => {
    const newExpandedId = expandedMessage === msg.id ? null : msg.id;
    setExpandedMessage(newExpandedId);

    // Wenn die Nachricht eine Admin-Antwort hat und noch nicht als gelesen markiert wurde
    if (newExpandedId && msg.adminReply && msg.status === 'beantwortet' && !msg.replyRead) {
      try {
        await api.markReplyAsRead(msg.id);
        // Aktualisiere die lokale Nachricht
        setMessages(prevMessages => 
          prevMessages.map(m => 
            m.id === msg.id ? { ...m, replyRead: true } : m
          )
        );
      } catch (error) {
        console.error('Fehler beim Markieren der Antwort als gelesen:', error);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      toast.error('Bitte füllen Sie alle Felder aus');
      return;
    }

    try {
      setSending(true);
      if (userType === 'parent') {
        await api.sendMessage(subject, message);
      } else if (userType === 'hortner' && klasse) {
        await api.sendHortnerMessage(klasse, subject, message);
      }
      
      toast.success('Nachricht erfolgreich gesendet!');
      setSubject('');
      setMessage('');
      await loadMessages();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Fehler beim Senden der Nachricht');
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ungelesen':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Ungelesen</Badge>;
      case 'gelesen':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><CheckCircle2 className="h-3 w-3 mr-1" />Gelesen</Badge>;
      case 'beantwortet':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><MessageCircle className="h-3 w-3 mr-1" />Beantwortet</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) {
      return 'Unbekanntes Datum';
    }
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Ungültiges Datum';
    }
    
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4 transition-colors">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* New Message Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Neue Nachricht an Admin
              </CardTitle>
              <CardDescription>
                Senden Sie eine Nachricht an die Administration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="text-sm mb-2 block">Betreff</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="z.B. Frage zu Hortzeiten"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm mb-2 block">Nachricht</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ihre Nachricht..."
                    rows={6}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full"
                >
                  {sending ? 'Wird gesendet...' : 'Nachricht senden'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Message List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Meine Nachrichten
              </CardTitle>
              <CardDescription>
                {messages.length} {messages.length === 1 ? 'Nachricht' : 'Nachrichten'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Lade Nachrichten...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Noch keine Nachrichten vorhanden</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer relative"
                      onClick={() => handleMessageClick(msg)}
                    >
                      {/* Red dot indicator for replied messages that haven't been read */}
                      {msg.status === 'beantwortet' && !msg.replyRead && (
                        <div className="absolute top-2 right-2">
                          <div className="relative">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <div className="absolute top-0 left-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75"></div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between mb-2 pr-6">
                        <h4 className="font-semibold flex items-center gap-2">
                          {msg.subject}
                          {msg.status === 'beantwortet' && !msg.replyRead && (
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white rounded-full text-xs">!</span>
                          )}
                        </h4>
                        {getStatusBadge(msg.status)}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {expandedMessage === msg.id ? msg.message : msg.message.substring(0, 100) + (msg.message.length > 100 ? '...' : '')}
                      </p>

                      {!expandedMessage && msg.adminReply && !msg.replyRead && (
                        <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <p className="text-xs text-red-700 dark:text-red-300">
                            Neue Antwort vom Admin verfügbar - Klicken zum Anzeigen
                          </p>
                        </div>
                      )}

                      {expandedMessage === msg.id && msg.adminReply && (
                        <div className="mt-3 pt-3 border-t bg-green-50 dark:bg-green-900/20 p-3 rounded border-l-4 border-l-green-500">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                              Antwort vom Admin:
                            </p>
                          </div>
                          <p className="text-sm">{msg.adminReply}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDate(msg.repliedAt!)}
                          </p>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(msg.createdAt)}
                      </p>
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
