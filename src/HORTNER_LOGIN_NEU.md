# 🎓 Hortner Login - Neues System

## Wichtige Änderung! ⚠️

**Hortner nutzen jetzt die normale Anmeldung!**

Es gibt keinen separaten Hortner-Login mehr. Stattdessen wird die **Benutzerrolle** im System festgelegt.

---

## So funktioniert's

### 1️⃣ **Normale Registrierung**

Hortner müssen sich zuerst ganz normal registrieren:
- Vorname eingeben
- Nachname eingeben
- Passwort erstellen (min. 6 Zeichen + Sonderzeichen)
- Auf "Registrieren" klicken

Nach der Registrierung haben sie zunächst die Rolle **"Eltern"** (Standard).

---

### 2️⃣ **Rolle durch Admin ändern**

Der Admin muss die Rolle dann im Admin-Dashboard ändern:

1. **Als Admin einloggen:**
   - URL mit `?admin` öffnen: `https://ihre-domain.de/?admin`
   - Oder 5x schnell auf Logo tippen
   - Mit Admin-Zugangsdaten anmelden

2. **Zum Benutzer-Tab:**
   - Im Admin-Dashboard auf Tab "Benutzer" klicken
   - Alle registrierten Benutzer werden angezeigt

3. **Rolle ändern:**
   - Auf das **Rollen-Badge** des Benutzers klicken (z.B. "Eltern")
   - Dialog öffnet sich
   - Neue Rolle auswählen: **"Hortner/in"**
   - Auf "Rolle ändern" klicken
   - Fertig! ✅

---

### 3️⃣ **Hortner Login**

Sobald die Rolle geändert wurde:
- Hortner meldet sich **normal** an (Vorname + Nachname + Passwort)
- System erkennt automatisch die Rolle "hortner"
- Hortner wird **automatisch zum Hortner-Dashboard** weitergeleitet
- Sieht alle Hortzettel aller Klassen

**Kein separater Login-Button mehr nötig!** 🎉

---

## Rollen-Übersicht

| Rolle | Beschreibung | Zugriff |
|-------|-------------|---------|
| **Eltern** | Standard für neue Benutzer | Eigene Hortzettel erstellen |
| **Hortner/in** | Hort-Betreuer | Alle Hortzettel einsehen + verwalten |
| **Admin** | Vollzugriff | Alle Funktionen + Einstellungen |

---

## Workflow für neue Hortner

```
1. Registrierung (Normal)
   ↓
2. Admin ändert Rolle zu "Hortner/in"
   ↓
3. Hortner meldet sich normal an
   ↓
4. Automatische Weiterleitung zum Hortner-Dashboard ✅
```

---

## Admin-Anleitung: Rolle ändern

### Schritt-für-Schritt:

**Schritt 1: Admin-Bereich öffnen**
```
URL: https://ihre-domain.de/?admin
```
(Als Lesezeichen speichern empfohlen!)

**Schritt 2: Als Admin anmelden**
- Vorname: [Admin-Vorname]
- Nachname: [Admin-Nachname]
- Passwort: [Admin-Passwort]

**Schritt 3: Benutzer-Tab öffnen**
- Klicken Sie auf "Benutzer" in der Tab-Leiste

**Schritt 4: Benutzer finden**
- Liste zeigt alle registrierten Benutzer
- Spalten: Name, E-Mail, **Rolle**, Erstellt, Aktionen

**Schritt 5: Rolle ändern**
- Klicken Sie auf das Rollen-Badge (z.B. "Eltern")
- Es öffnet sich ein Dialog
- Wählen Sie die neue Rolle:
  - 👤 **Eltern** - Standard-Benutzer
  - 🎓 **Hortner/in** - Hort-Betreuer
  - 🛡️ **Admin** - Administrator
- Klicken Sie auf "Rolle ändern"
- Toast-Benachrichtigung bestätigt die Änderung

**Fertig!** 🎉

---

## Vorteile des neuen Systems

### ✅ Für Eltern:
- Übersichtliche Login-Seite
- Keine verwirrenden Hortner-Buttons
- Klarer Fokus auf ihre Funktionen

### ✅ Für Hortner:
- **Keine Extra-Credentials nötig**
- Normale Anmeldung wie gewohnt
- Automatische Weiterleitung zum richtigen Dashboard
- Zugriff auf alle Hortzettel aller Klassen

### ✅ Für Admins:
- Zentrale Benutzer-Verwaltung
- Einfaches Ändern von Rollen
- Übersichtliche Rollen-Badges
- Klare Trennung der Zugriffsrechte

---

## Technische Details

### Datenbank
```typescript
// Benutzer im KV Store:
{
  userId: "uuid",
  firstName: "Max",
  lastName: "Mustermann",
  email: "max.mustermann@hort-auma.local",
  role: "hortner", // ← Hier wird die Rolle gespeichert
  childProfile: {},
  familyProfile: {},
  createdAt: "2024-11-03T..."
}
```

### Login-Flow
```typescript
1. Login-Request mit firstName, lastName, password
   ↓
2. Backend prüft Credentials (Supabase Auth)
   ↓
3. Backend liest Benutzer aus KV Store
   ↓
4. Response enthält: accessToken + user (inkl. role)
   ↓
5. Frontend routing basierend auf role:
   - role === 'parent' → Dashboard
   - role === 'hortner' → HortnerDashboard
   - role === 'admin' → AdminDashboard
```

### API-Endpunkt
```
PUT /admin/users/:userId/role
Body: { role: 'hortner' | 'parent' | 'admin' }
```

---

## Häufige Fragen (FAQ)

### Q: Müssen Hortner ihr Passwort ändern?
**A:** Nein! Sie nutzen weiterhin ihr normales Passwort.

### Q: Was passiert mit bestehenden Hortner-Accounts?
**A:** Diese müssen einmalig vom Admin die Rolle "hortner" zugewiesen bekommen.

### Q: Kann ein Hortner auch Hortzettel für eigene Kinder erstellen?
**A:** Aktuell sehen Hortner nur das Hortner-Dashboard. Wenn ein Hortner auch Eltern-Funktionen braucht, könnte man einen zweiten Account mit Rolle "parent" erstellen.

### Q: Wie viele Admins kann es geben?
**A:** Unbegrenzt! Jeder Benutzer kann die Rolle "admin" erhalten.

### Q: Kann ich die Rolle wieder zurückändern?
**A:** Ja! Einfach wieder auf das Rollen-Badge klicken und eine andere Rolle wählen.

### Q: Sieht der Benutzer, wenn seine Rolle geändert wurde?
**A:** Beim nächsten Login wird er automatisch zum passenden Dashboard weitergeleitet.

---

## Sicherheits-Hinweis

⚠️ **Wichtig:**
- Nur vertrauenswürdigen Personen die Rolle "hortner" oder "admin" geben
- Hortner sehen **alle** Hortzettel mit Kinderinformationen
- Admins haben **Vollzugriff** auf alle Daten und Einstellungen
- Rollen-Änderungen werden sofort wirksam

---

## Migrationsleitfaden

### Für existierende Systeme:

**Schritt 1: Alle Hortner informieren**
- E-Mail/Info: "Ab sofort normale Anmeldung nutzen"
- Falls noch nicht registriert: Jetzt registrieren

**Schritt 2: Admin ändert alle Rollen**
- Für jeden Hortner: Rolle auf "hortner" setzen
- Liste führen, wer umgestellt wurde

**Schritt 3: Testen**
- Hortner probeweise anmelden lassen
- Prüfen, ob Weiterleitung zum Hortner-Dashboard funktioniert
- Prüfen, ob alle Hortzettel sichtbar sind

**Schritt 4: Alte Credentials löschen**
- Falls vorhanden: Alte separate Hortner-Logins entfernen

---

## Zusammenfassung

🎯 **Eine Login-Seite für alle**
- Eltern → normale Anmeldung → Eltern-Dashboard
- Hortner → normale Anmeldung → Hortner-Dashboard
- Admin → versteckter Zugang → Admin-Dashboard

🔐 **Einfache Verwaltung**
- Rollen über Admin-Dashboard ändern
- Klickbarer Rollen-Badge
- Sofortige Änderung

🚀 **Bessere UX**
- Übersichtliche Login-Seite
- Keine Verwirrung für Eltern
- Automatisches Routing

---

**Letzte Aktualisierung:** November 2024  
**Version:** 2.0 - Vereinfachtes Rollen-System
