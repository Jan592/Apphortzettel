# 📝 Content Management System (CMS)

## Übersicht

Die Hortzettel App verfügt über ein **vollständiges Content Management System**, mit dem Sie als Admin **alle Texte, Titel, Beschreibungen und Untertitel** in der gesamten App bearbeiten können.

## 🎯 Wo finde ich den Content-Editor?

1. **Login** als Admin
2. **Admin-Dashboard** öffnen
3. Tab **"Texte"** auswählen (mit Type-Icon 📝)

## ✏️ Was kann ich bearbeiten?

### Allgemein
- **App-Titel**: Der Haupttitel der App (z.B. "Hortzettel App")
- **App-Untertitel**: Untertitel/Beschreibung (z.B. "Digitale Hortzettel-Verwaltung")
- **Willkommensnachricht**: Begrüßungstext

### Login & Registrierung
- **Login-Titel**: Titel der Login-Seite
- **Login-Untertitel**: Beschreibung der Login-Seite
- **Register-Titel**: Titel der Registrierungsseite
- **Register-Untertitel**: Beschreibung der Registrierungsseite
- **Button-Texte**: "Anmelden", "Registrieren"

### Dashboard
- **Dashboard Willkommen**: Willkommenstext im Dashboard
- **Dashboard Untertitel**: Beschreibung des Dashboards
- **Button-Texte**: 
  - Neuer Hortzettel Button
  - Meine Hortzettel Button
  - Profil Button

### Hortzettel-Formular
- **Formular-Titel**: Titel des Hortzettel-Formulars
- **Formular-Beschreibung**: Beschreibung/Anleitung
- **Labels**: 
  - Name des Kindes
  - Klasse
  - Allein nach Hause Frage

### Sonstiges
- **Footer-Text**: Text im Footer
- **Datenschutz-Hinweis**: Datenschutz-Informationen

## 🔧 Wie bearbeite ich Texte?

### Schritt-für-Schritt:

1. **Admin-Dashboard** öffnen
2. Tab **"Texte"** klicken
3. Button **"Bearbeiten"** klicken (oben rechts)
4. **Texte ändern** in den Eingabefeldern
5. Nach unten scrollen
6. Button **"Alle Änderungen speichern"** klicken ✅

### Wichtig:
- ⚠️ Vergessen Sie nicht, auf **"Alle Änderungen speichern"** zu klicken!
- Die Änderungen werden **sofort** für alle Benutzer wirksam
- Sie können mit **"Alle Änderungen verwerfen"** zurücksetzen

## 📱 Wo werden die Texte angezeigt?

### Aktuell implementiert ✅

| Feld | Wo sichtbar | Wann sichtbar |
|------|-------------|---------------|
| **App-Titel** | Login-Seite Header | Beim Ausloggen/Starten |
| **App-Titel** | SplashScreen | Nur beim ersten Laden (2 Sekunden) |
| **App-Titel** | Browser-Tab | Immer (im Tab-Titel) |
| **Schulname** | Login-Seite Header | Beim Ausloggen/Starten |

### In Zukunft implementiert 🚧

Die folgenden Texte werden in zukünftigen Versionen dynamisch verwendet:
- **Login-Texte**: Login- und Registrierungsformulare
- **Dashboard-Texte**: Persönliches Dashboard nach dem Login
- **Hortzettel-Texte**: Formular-Labels und Beschreibungen
- **Button-Texte**: Alle Buttons in der App
- **Footer & Datenschutz**: Fußzeile und Hinweise

## 💡 Tipps

### Für verschiedene Schulen:
Sie können die App komplett **umbenennen**:
- "Hortzettel App" → "Betreuungs-Portal"
- "Grundschule Auma" → "Ihre Schule"
- Alle Button-Texte anpassen

### Für mehrsprachige Schulen:
Sie können die Texte in **Ihre Sprache** übersetzen:
- "Anmelden" → "Login"
- "Neuer Hortzettel" → "New Care Form"

### Für eigene Begriffe:
Sie können **eigene Begriffe** verwenden:
- "Hortzettel" → "Betreuungszettel"
- "Hortner" → "Betreuer"

## 🔐 Kombiniert mit anderen Einstellungen

Der Content-Editor ist Teil des Admin-Bereichs und arbeitet zusammen mit:

1. **Schulname** (Tab "Einstellungen")
2. **Klassen** (Tab "Einstellungen")
3. **Dropdown-Optionen** (Tab "Einstellungen")
   - Abholzeiten
   - Allein nach Hause Optionen
4. **Farbthemen** (Tab "Einstellungen")

## 🎨 Beispiel: Vollständig angepasste App

**Vor:**
- App-Titel: "Hortzettel App"
- Schulname: "Grundschule Auma"
- Login-Titel: "Anmelden"

**Nach:**
- App-Titel: "Betreuungs-Portal"
- Schulname: "Max-Mustermann-Schule"
- Login-Titel: "Willkommen zurück"

➡️ **Ergebnis:** Eine komplett personalisierte App für Ihre Schule!

## 📊 Technische Details

- **Speicherort**: Supabase KV Store (`app:settings`)
- **Format**: JSON mit verschachteltem `content`-Objekt
- **API-Endpunkt**: `GET/PUT /admin/settings`
- **Berechtigung**: Nur Admins können Texte bearbeiten
- **Aktualisierung**: Sofort nach Speichern (kein Cache)

## ❓ Häufige Fragen

**F: Muss ich nach dem Speichern die Seite neu laden?**  
A: **JA!** Nach dem Speichern erscheint eine Meldung mit einem "Neu laden"-Button. Klicken Sie darauf oder drücken Sie F5.

**F: Warum sehe ich meine Änderungen nicht sofort?**  
A: Die App lädt die Settings nur beim Start. Drücken Sie F5 oder klicken Sie auf "Neu laden" in der Toast-Meldung.

**F: Wo sehe ich den geänderten App-Titel?**  
A: 
- **Login-Seite**: Loggen Sie sich aus, dann sehen Sie den neuen Titel
- **Browser-Tab**: Nach F5 sollte der Tab-Titel aktualisiert sein
- **SplashScreen**: Nur beim ersten Öffnen der App sichtbar (2 Sekunden)

**F: Können Eltern die Texte sehen?**  
A: Ja! Alle Benutzer sehen die aktualisierten Texte sofort.

**F: Was passiert, wenn ich einen Text lösche?**  
A: Das Feld wird leer sein. Besser: Setzen Sie einen Platzhalter wie "-" oder "Kein Titel".

**F: Kann ich HTML-Code in die Texte einfügen?**  
A: Nein, nur reiner Text wird unterstützt (Sicherheit).

**F: Gibt es eine Zeichen-Begrenzung?**  
A: Technisch nein, aber kurze, prägnante Texte sind besser für die Benutzererfahrung.

## 🎉 Fertig!

Sie haben jetzt **volle Kontrolle** über alle Texte in Ihrer Hortzettel App!

---

**Version:** 2.0.0  
**Letzte Aktualisierung:** Januar 2025
