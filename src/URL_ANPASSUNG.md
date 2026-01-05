# 🌐 URL-Anpassung für Hortzettel App

## ⚠️ Wichtig zu wissen

Die **URL der App** wird **nicht im Code** festgelegt, sondern durch deinen **Hosting-Provider** (z.B. Vercel, Netlify, Supabase, etc.).

## 🔧 Was kann ich ändern?

### ✅ 1. Custom Domain einrichten (Empfohlen)

Statt: `https://dein-projekt-xyz.vercel.app`  
→ **Eigene Domain**: `https://hortzettel-auma.de`

#### Wie geht das?

**Bei Vercel:**
1. Gehe zu deinem Projekt → **Settings** → **Domains**
2. Füge deine Domain hinzu (z.B. `hortzettel-auma.de`)
3. Folge den DNS-Anweisungen (A-Record oder CNAME setzen)

**Bei Netlify:**
1. **Site settings** → **Domain management**
2. **Add custom domain**
3. DNS-Einstellungen beim Domain-Anbieter anpassen

**Bei anderen Hostern:**
- Ähnlicher Prozess in den Projekt-Einstellungen
- Meist unter "Domains" oder "Custom Domain"

### ✅ 2. PWA Start-URL anpassen

In `/public/manifest.json` ist bereits konfiguriert:

```json
{
  "start_url": "/",
  "scope": "/"
}
```

Das bedeutet: Die PWA startet immer auf der Hauptseite.

### ✅ 3. Open Graph & Meta URLs

Für Social Media Sharing kannst du die URL in den Meta-Tags setzen:

#### In `/public/head-tags.html`:
```html
<meta property="og:url" content="https://deine-domain.de" />
```

**Diese Datei ist nur Dokumentation!** Ich füge die URL dynamisch im Code hinzu.

## 📝 Domain-Anbieter (Beispiele)

Wo kann ich eine Domain kaufen?

| Anbieter | Preis/Jahr | Link |
|----------|------------|------|
| **IONOS** | ab 1€ | ionos.de |
| **Strato** | ab 5€ | strato.de |
| **Namecheap** | ab 8€ | namecheap.com |
| **Google Domains** | ab 12€ | domains.google |
| **GoDaddy** | ab 10€ | godaddy.com |

**Tipp:** `.de` Domains sind für deutsche Schulen ideal!

## 🚀 Empfohlene URLs für deine App

Beispiele für gute Domain-Namen:

✅ `hortzettel-auma.de`  
✅ `hort-grundschule-auma.de`  
✅ `grundschule-auma-hort.de`  
✅ `hortapp-auma.de`  
✅ `mein-hortzettel.de`  

## 🔄 Subdomain nutzen (Falls Schule schon Domain hat)

Falls die Schule bereits eine Website hat (z.B. `grundschule-auma.de`):

**Subdomain erstellen:**
- `hort.grundschule-auma.de`
- `app.grundschule-auma.de`
- `hortzettel.grundschule-auma.de`

**Vorteil:** 
- Keine neue Domain kaufen nötig
- Bleibt bei der Schul-Domain
- Professioneller Auftritt

## 📱 Was passiert nach Domain-Einrichtung?

### Automatisch aktualisiert:
✅ Browser-URL in der Adressleiste  
✅ Lesezeichen-Links  
✅ Geteilte Links  
✅ PWA-Installation  

### Manuell aktualisieren (im Code):

Ich erstelle eine Datei `/config/domain.ts` für dich:

```typescript
export const APP_CONFIG = {
  domain: "https://hortzettel-auma.de",
  name: "Hortzettel App",
  schoolName: "Grundschule Auma"
};
```

Diese kann dann in Meta-Tags verwendet werden.

## 🛠️ Schritt-für-Schritt: Custom Domain

### 1️⃣ Domain kaufen
- Bei Anbieter registrieren (z.B. IONOS, Strato)
- Domain suchen und kaufen (z.B. `hortzettel-auma.de`)

### 2️⃣ Domain mit Hosting verbinden
- Im Hosting (Vercel/Netlify/etc.) Domain hinzufügen
- DNS-Einstellungen kopieren (A-Record oder CNAME)

### 3️⃣ DNS konfigurieren
- Beim Domain-Anbieter in DNS-Verwaltung
- A-Record oder CNAME eintragen
- **Wartezeit:** 24-48 Stunden (meist schneller)

### 4️⃣ SSL-Zertifikat
- Wird automatisch erstellt (Let's Encrypt)
- HTTPS automatisch aktiviert
- ✅ Sichere Verbindung!

### 5️⃣ App-Code aktualisieren (optional)
- Meta-Tags mit neuer Domain
- Config-Datei anpassen
- Fertig! 🎉

## ⚡ Ohne Domain: Projekt-Name ändern

Falls du **keine eigene Domain** möchtest, kannst du zumindest den **Projekt-Namen** beim Hosting ändern:

**Bei Vercel:**
1. **Settings** → **General**
2. **Project Name** ändern zu `hortzettel-auma`
3. URL wird zu: `hortzettel-auma.vercel.app`

**Bei Netlify:**
1. **Site settings** → **General** → **Site information**
2. **Change site name** zu `hortzettel-auma`
3. URL wird zu: `hortzettel-auma.netlify.app`

## 🎯 Zusammenfassung

| Was | Wo ändern | Kosten |
|-----|-----------|--------|
| **URL komplett** | Hosting-Provider + Domain-Kauf | 1-15€/Jahr |
| **Projekt-Name** | Hosting-Einstellungen | Kostenlos |
| **Browser-Titel** | ✅ Bereits erledigt im Code | Kostenlos |
| **App-Name (PWA)** | ✅ Bereits erledigt im Code | Kostenlos |
| **Subdomain** | DNS bei bestehender Domain | Kostenlos |

## 💡 Meine Empfehlung

**Für eine Schul-App:**

1. **Kurz:** Domain kaufen wie `hortzettel-auma.de` (10-15€/Jahr)
2. **Mittel:** Subdomain nutzen falls Schule Domain hat (kostenlos)
3. **Lang:** Projekt-Namen beim Hoster ändern (kostenlos)

**Wichtig:** Browser-Tab zeigt bereits "Hortzettel" statt der URL! ✅

---

**Brauchst du Hilfe bei der Einrichtung?** 
→ Sag mir deinen Hosting-Provider (Vercel/Netlify/etc.) und ich gebe dir eine spezifische Anleitung!
