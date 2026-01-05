# 🎓 Hortzettel App - Grundschule Auma

Eine moderne Web-App zur Verwaltung von Hortzetteln mit vollständiger Backend-Integration.

---

## 🚀 Schnellstart

### Für Eltern
1. **Registrieren** mit Vor- und Nachname
2. **Hortzettel ausfüllen** für jede Woche
3. **Profil verwalten** mit Kindinformationen und Notfallkontakt

### Für Hortner/innen
1. Klick auf **"Hortner"** Button
2. Klasse auswählen (1-4)
3. Passwort eingeben (z.B. `hortner1` für Klasse 1)
4. Alle Hortzettel der Klasse einsehen

### Für Admins
1. **Einmaliges Setup:**
   - Klick auf **"✨ Admin-Account einrichten"**
   - Siehe: [`ADMIN_AUTO_SETUP.md`](./ADMIN_AUTO_SETUP.md) für Details
   
2. **Login:**
   - Klick auf **"Admin"** Button
   - Mit E-Mail und Passwort anmelden

---

## 📚 Dokumentation

| Datei | Beschreibung |
|-------|--------------|
| [`ADMIN_AUTO_SETUP.md`](./ADMIN_AUTO_SETUP.md) | ✨ **Automatisches Admin-Setup** (empfohlen!) |
| [`ADMIN_FEATURES.md`](./ADMIN_FEATURES.md) | Vollständige Feature-Übersicht Admin-Bereich |
| [`DEPLOYMENT.md`](./DEPLOYMENT.md) | Deployment-Anleitung & technische Details |
| [`BROWSER_UND_URL.md`](./BROWSER_UND_URL.md) | 🌐 Browser-Titel & URL komplett erklärt |
| [`URL_ANPASSUNG.md`](./URL_ANPASSUNG.md) | 🔗 Custom Domain einrichten |
| [`SCHNELLSTART_DOMAIN.md`](./SCHNELLSTART_DOMAIN.md) | ⚡ Domain in 2 Minuten konfigurieren |

---

## ✨ Hauptfunktionen

### 👨‍👩‍👧 Für Eltern
- ✅ Einfache Registrierung (nur Vor-/Nachname, kein Email)
- ✅ Hortzettel online erstellen und bearbeiten
- ✅ Kindinformationen verwalten (Geburtsdatum, Allergien, etc.)
- ✅ Notfallkontakte hinterlegen
- ✅ Verschiedene Farbthemen
- ✅ Dark Mode
- ✅ Vorlagen-System für wiederkehrende Hortzettel

### 🏫 Für Hortner/innen
- ✅ Übersicht aller Hortzettel pro Klasse
- ✅ Suche nach Kindernamen
- ✅ Farbcodierte Änderungsverfolgung
- ✅ Kindinformationen auf Klick
- ✅ Wochen-basiertes Archivierungssystem
- ✅ Info-Center mit Mitteilungen

### 🛡️ Für Admins
- ✅ Vollständiges Admin-Dashboard
- ✅ Benutzer-Verwaltung
- ✅ Statistiken & Analysen
- ✅ Daten-Export (JSON/CSV)
- ✅ System-Einstellungen
- ✅ Passwort zurücksetzen

---

## 🎨 Features

### Design
- 🌈 6 verschiedene Farbthemen
- 🌙 Eleganter Dark Mode (Navy/Slate)
- 📱 Vollständig responsiv
- ✨ Moderne UI mit Blur-Effekten
- 🎯 Intuitive Benutzeroberfläche
- 🎨 Professionelles App-Icon (siehe `/public/ICON_PREVIEW.md`)

### Technologie
- ⚛️ React + TypeScript
- 🎨 Tailwind CSS v4
- 🗄️ Supabase Backend
- 🔐 Sichere Authentifizierung
- 💾 Persistente Datenspeicherung
- 🚀 Edge Functions mit Hono

---

## 🔐 Standard-Passwörter

### Hortner-Bereich
- **Klasse 1:** `hortner1`
- **Klasse 2:** `hortner2`
- **Klasse 3:** `hortner3`
- **Klasse 4:** `hortner4`

### Admin-Bereich
Verwenden Sie das **automatische Setup-Tool** - siehe [`ADMIN_AUTO_SETUP.md`](./ADMIN_AUTO_SETUP.md)

---

## 📦 Deployment

Die App ist deployment-ready! Siehe [`DEPLOYMENT.md`](./DEPLOYMENT.md) für Details.

**Kurz:**
1. App in Figma Make publishen
2. Fertig! ✅

Das Supabase-Backend ist bereits vollständig konfiguriert.

---

## 🗂️ Projekt-Struktur

```
├── components/              # React Komponenten
│   ├── ui/                 # ShadCN UI Komponenten
│   ├── AdminDashboard.tsx  # Admin-Bereich
│   ├── HortnerDashboard.tsx # Hortner-Bereich
│   └── ...
├── supabase/
│   └── functions/server/   # Backend (Hono + Supabase)
├── utils/                  # Hilfsfunktionen & API
├── types/                  # TypeScript Definitionen
└── styles/                 # CSS & Design-Tokens
```

---

## 🆘 Support

### Häufige Fragen

**Q: Admin-Login funktioniert nicht?**  
**A:** Verwenden Sie das automatische Setup-Tool! Siehe [`ADMIN_AUTO_SETUP.md`](./ADMIN_AUTO_SETUP.md)

**Q: Wie ändere ich die Hortner-Passwörter?**  
**A:** In `/supabase/functions/server/index.tsx` - siehe [`DEPLOYMENT.md`](./DEPLOYMENT.md)

**Q: Kann ich eigene Klassen hinzufügen?**  
**A:** Ja! Im Admin-Dashboard unter "Einstellungen"

---

## 📊 Status

- ✅ **Produktionsbereit**
- ✅ **Vollständig dokumentiert**
- ✅ **Backend integriert**
- ✅ **Getestet**

---

## 🎯 Nächste Schritte

1. **Admin einrichten** - [`ADMIN_AUTO_SETUP.md`](./ADMIN_AUTO_SETUP.md) ⚡ ~3 Minuten
2. **App deployen** - [`DEPLOYMENT.md`](./DEPLOYMENT.md)
3. **Eltern einladen** - Registrierung starten!

---

**Viel Erfolg mit Ihrer Hortzettel-App!** 🚀

---

## 📄 Lizenz

Erstellt mit Figma Make für Grundschule Auma.

**Version:** 1.0.0  
**Letzte Aktualisierung:** Januar 2025
