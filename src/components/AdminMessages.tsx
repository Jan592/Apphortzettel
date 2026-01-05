import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { 
  MessageCircle, 
  Clock, 
  CheckCircle2, 
  Reply, 
  Trash2, 
  Search,
  User,
  Shield
} from 'lucide-react';
import { api } from '../utils/api';
import { toast } from 'sonner@2.0.3';
import type { Message } from '../types/hortzettel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

export default function AdminMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ungelesen' | 'gelesen' | 'beantwortet'>('all');

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await api.getAdminMessages();
      setMessages(response.messages || []);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast.error('Fehler beim Laden der Nachrichten');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markMessageAsRead(id);
      toast.success('Als gelesen markiert');
      await loadMessages();
    } catch (error: any) {
      console.error('Error marking as read:', error);
      toast.error('Fehler beim Markieren');
    }
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim()) {
      toast.error('Bitte geben Sie eine Antwort ein');
      return;
    }

    try {
      setReplying(true);
      await api.replyToMessage(selectedMessage.id, replyText);
      toast.success('Antwort erfolgreich gesendet!');
      setReplyText('');
      setSelectedMessage(null);
      await loadMessages();
    } catch (error: any) {
      console.error('Error replying:', error);
      toast.error('Fehler beim Senden der Antwort');
    } finally {
      setReplying(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie diese Nachricht wirklich löschen?')) {
      return;
    }

    try {
      console.log('🗑️ [Frontend] Starting delete for message ID:', id);
      console.log('🗑️ [Frontend] Message ID type:', typeof id);
      console.log('🗑️ [Frontend] Message ID length:', id.length);
      
      const result = await api.deleteMessage(id);
      console.log('✅ [Frontend] Delete API response:', result);
      
      if (result.success === false) {
        console.error('❌ [Frontend] Delete failed on backend:', result.error);
        toast.error(result.error || 'Fehler beim Löschen der Nachricht');
        return;
      }
      
      toast.success('Nachricht gelöscht');
      console.log('🔄 [Frontend] Reloading messages...');
      await loadMessages();
      console.log('✅ [Frontend] Messages reloaded');
    } catch (error: any) {
      console.error('❌ [Frontend] Error deleting message:', error);
      console.error('❌ [Frontend] Error details:', error.message, error.stack);
      toast.error(error.message || 'Fehler beim Löschen der Nachricht');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ungelesen':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"><Clock className="h-3 w-3 mr-1" />Ungelesen</Badge>;
      case 'gelesen':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"><CheckCircle2 className="h-3 w-3 mr-1" />Gelesen</Badge>;
      case 'beantwortet':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"><MessageCircle className="h-3 w-3 mr-1" />Beantwortet</Badge>;
      default:
        return null;
    }
  };

  const getSenderIcon = (senderType: string) => {
    return senderType === 'hortner' 
      ? <Shield className="h-4 w-4 text-blue-600" />
      : <User className="h-4 w-4 text-purple-600" />;
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

  const filteredMessages = messages.filter((msg) => {
    const matchesSearch = 
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.senderName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || msg.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const unreadCount = messages.filter(m => m.status === 'ungelesen').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl flex items-center gap-2">
            <MessageCircle className="h-6 w-6" />
            Nachrichten
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">{unreadCount} neu</Badge>
            )}
          </h2>
          <p className="text-muted-foreground">
            Kommunikation mit Eltern und Hortnern
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nachrichten durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                size="sm"
              >
                Alle
              </Button>
              <Button
                variant={filterStatus === 'ungelesen' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('ungelesen')}
                size="sm"
              >
                Ungelesen
              </Button>
              <Button
                variant={filterStatus === 'gelesen' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('gelesen')}
                size="sm"
              >
                Gelesen
              </Button>
              <Button
                variant={filterStatus === 'beantwortet' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('beantwortet')}
                size="sm"
              >
                Beantwortet
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredMessages.length} {filteredMessages.length === 1 ? 'Nachricht' : 'Nachrichten'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Lade Nachrichten...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Keine Nachrichten gefunden' 
                  : 'Noch keine Nachrichten vorhanden'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    msg.status === 'ungelesen' ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getSenderIcon(msg.senderType)}
                      <div>
                        <h4 className="font-semibold">{msg.subject}</h4>
                        <p className="text-sm text-muted-foreground">
                          von {msg.senderName}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(msg.status)}
                  </div>

                  <p className="text-sm mb-4 whitespace-pre-wrap">{msg.message}</p>

                  {msg.adminReply && (
                    <div className="mt-3 pt-3 border-t bg-green-50 dark:bg-green-900/20 p-3 rounded">
                      <p className="text-sm font-medium mb-2 text-green-800 dark:text-green-200">
                        Ihre Antwort:
                      </p>
                      <p className="text-sm">{msg.adminReply}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(msg.repliedAt!)}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      {formatDate(msg.createdAt)}
                    </p>
                    <div className="flex gap-2">
                      {msg.status === 'ungelesen' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsRead(msg.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Gelesen
                        </Button>
                      )}
                      {msg.status !== 'beantwortet' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedMessage(msg);
                            if (msg.status === 'ungelesen') {
                              handleMarkAsRead(msg.id);
                            }
                          }}
                        >
                          <Reply className="h-4 w-4 mr-1" />
                          Antworten
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(msg.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reply Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Auf Nachricht antworten</DialogTitle>
            <DialogDescription>
              Antwort an {selectedMessage?.senderName}
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-semibold text-sm mb-2">{selectedMessage.subject}</p>
                <p className="text-sm text-muted-foreground">{selectedMessage.message}</p>
              </div>

              <div>
                <label className="text-sm mb-2 block">Ihre Antwort</label>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Ihre Antwort an den Absender..."
                  rows={6}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedMessage(null);
                setReplyText('');
              }}
            >
              Abbrechen
            </Button>
            <Button onClick={handleReply} disabled={replying}>
              {replying ? 'Wird gesendet...' : 'Antwort senden'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
