# Angemeldet bleiben Funktion

## Übersicht
Die "Angemeldet bleiben" Funktion ermöglicht es Benutzern, 24 Stunden lang angemeldet zu bleiben, ohne sich nach dem Schließen der App erneut einloggen zu müssen.

## Funktionsweise

### Session-Management
- **Speicherort**: `localStorage` unter dem Schlüssel `hortzettel_user_session`
- **Session-Dauer**: 24 Stunden (86.400.000 Millisekunden)
- **Daten**: Vorname, Nachname und Zeitstempel

### Ablauf

#### 1. Login mit "Angemeldet bleiben"
Wenn der Benutzer sich anmeldet und die Checkbox "Angemeldet bleiben (24h)" aktiviert:
1. Der normale Login-Prozess wird durchgeführt
2. Nach erfolgreichem Login wird eine Session im localStorage gespeichert:
   ```typescript
   {
     firstName: "Anna",
     lastName: "Müller",
     timestamp: 1699012345678
   }
   ```
3. Eine Toast-Benachrichtigung bestätigt: "Du bleibst für 24 Stunden angemeldet"

#### 2. App-Neustart / Auto-Login
Beim Start der App (oder Neuladen der Seite):
1. Die App prüft, ob eine gespeicherte Session existiert
2. Das Alter der Session wird berechnet
3. Wenn die Session < 24 Stunden alt ist:
   - Ein Auto-Login wird durchgeführt
   - Der Benutzer wird direkt zum Dashboard weitergeleitet
   - Console-Log: "✅ Auto-Login erfolgreich"
4. Wenn die Session ≥ 24 Stunden alt ist:
   - Die Session wird automatisch gelöscht
   - Der Benutzer muss sich neu anmelden
   - Console-Log: "⏰ Session abgelaufen nach 24 Stunden"

#### 3. Logout
Beim manuellen Logout:
- Die gespeicherte Session wird sofort gelöscht
- Der Benutzer muss sich beim nächsten Besuch neu anmelden

## Implementierung

### Dateien
- **`/utils/sessionManager.ts`**: Zentrale Logik für Session-Verwaltung
- **`/components/LoginForm.tsx`**: UI für Checkbox und Login
- **`/App.tsx`**: Integration in den App-Lifecycle

### API

#### `saveSession(firstName, lastName)`
Speichert eine neue Session mit aktuellem Zeitstempel.

#### `getSession()`
Gibt die Session zurück, wenn sie noch gültig ist, ansonsten `null`.

#### `clearSession()`
Löscht die gespeicherte Session.

#### `hasValidSession()`
Prüft, ob eine gültige Session existiert.

## Sicherheitshinweise

### Was gespeichert wird
- ✅ Nur Vor- und Nachname (keine sensiblen Daten)
- ✅ Zeitstempel für Ablauf-Prüfung
- ❌ KEIN Passwort
- ❌ KEIN Access-Token (dieser wird separat von der API verwaltet)

### Datenschutz
- Die Session wird nur lokal im Browser gespeichert
- Nach 24 Stunden wird sie automatisch gelöscht
- Der Benutzer kann sich jederzeit manuell abmelden

## Benutzer-Erfahrung

### Vorteile
- ✅ Keine wiederholte Eingabe von Anmeldedaten nötig
- ✅ Schneller Zugriff auf die App
- ✅ Besonders praktisch für häufige Nutzung

### Transparenz
- Die Checkbox zeigt deutlich "(24h)" an
- Toast-Benachrichtigungen informieren über den Status
- Console-Logs für Entwickler zur Fehlersuche

## Unterschied zu Hortner-Session

| Feature | Eltern-Login | Hortner-Login |
|---------|--------------|---------------|
| Session-Dauer | 24 Stunden | 30 Tage |
| Opt-in | Checkbox erforderlich | Automatisch |
| Storage-Key | `hortzettel_user_session` | `hortner_session` |
| Speichert | Vor-/Nachname | Klasse |

## Testing

### Manueller Test
1. ✅ Anmelden mit aktivierter Checkbox
2. ✅ Browser-Tab schließen
3. ✅ Browser neu öffnen → Sollte automatisch eingeloggt sein
4. ✅ 24 Stunden warten (oder localStorage manuell ändern)
5. ✅ Browser neu öffnen → Sollte Login-Seite zeigen

### Console-Logs
```
✅ Session gespeichert - gültig bis: [Datum/Zeit]
✅ Gültige Session gefunden - noch 23h gültig
🔄 Auto-Login mit gespeicherter Session...
✅ Auto-Login erfolgreich
⏰ Session abgelaufen nach 24 Stunden
🗑️ Session gelöscht
```

## Fehlerbehebung

### Problem: Auto-Login funktioniert nicht
1. Console öffnen und nach Logs suchen
2. Prüfen ob Session gespeichert wurde
3. localStorage inspizieren: `localStorage.getItem('hortzettel_user_session')`
4. API-Token prüfen: Könnte abgelaufen sein

### Problem: Session läuft zu früh ab
- Zeitstempel im localStorage überprüfen
- System-Uhrzeit korrekt?

### Problem: Session wird nicht gelöscht
- Logout aufrufen sollte `clearSession()` triggern
- Browser-Cache leeren falls nötig
