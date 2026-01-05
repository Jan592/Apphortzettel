import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Shield, User, GraduationCap, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { api } from '../utils/api';
import type { AdminUser } from '../types/hortzettel';

interface UserRoleManagerProps {
  user: AdminUser;
  onUpdate: () => void;
}

export function UserRoleManager({ user, onUpdate }: UserRoleManagerProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [newRole, setNewRole] = useState<'parent' | 'hortner' | 'admin'>(user.role || 'parent');
  const [isUpdating, setIsUpdating] = useState(false);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'hortner':
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'hortner':
        return 'Hortner';
      default:
        return 'Eltern';
    }
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'hortner':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const handleUpdateRole = async () => {
    if (newRole === user.role) {
      setShowDialog(false);
      return;
    }

    setIsUpdating(true);
    try {
      await api.updateUserRole(user.userId || user.id, newRole);
      toast.success('Rolle aktualisiert', {
        description: `${user.firstName} ${user.lastName} ist jetzt ${getRoleLabel(newRole)}`
      });
      setShowDialog(false);
      onUpdate();
    } catch (error: any) {
      console.error('Role update error:', error);
      toast.error('Fehler beim Aktualisieren', {
        description: error.message || 'Rolle konnte nicht geändert werden'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Badge
        variant={getRoleBadgeVariant(user.role || 'parent')}
        className="cursor-pointer hover:opacity-80"
        onClick={() => setShowDialog(true)}
      >
        {getRoleIcon(user.role || 'parent')}
        <span className="ml-1">{getRoleLabel(user.role || 'parent')}</span>
      </Badge>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Benutzerrolle ändern</DialogTitle>
            <DialogDescription>
              Ändere die Rolle von {user.firstName} {user.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Aktuelle Rolle</label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                {getRoleIcon(user.role || 'parent')}
                <span>{getRoleLabel(user.role || 'parent')}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Neue Rolle</label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Eltern</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="hortner">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      <span>Hortner/in</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>Admin</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-md p-3">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Rollenbeschreibungen:</p>
                  <ul className="space-y-1 text-xs">
                    <li><strong>Eltern:</strong> Können Hortzettel für ihre Kinder erstellen</li>
                    <li><strong>Hortner/in:</strong> Können alle Hortzettel einsehen und verwalten</li>
                    <li><strong>Admin:</strong> Vollzugriff auf alle Funktionen und Einstellungen</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="flex-1"
                disabled={isUpdating}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleUpdateRole}
                className="flex-1"
                disabled={isUpdating || newRole === user.role}
              >
                {isUpdating ? 'Wird aktualisiert...' : 'Rolle ändern'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
