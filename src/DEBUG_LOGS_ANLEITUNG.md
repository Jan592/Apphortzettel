# Debug-Logs Anleitung

## Version Check
Es wurden umfassende Debug-Logs hinzugefügt am **3. November 2025, 14:30**.

## So prüfen Sie, ob die neue Version geladen wurde:

### 1. Browser-Cache leeren & Seite neu laden
1. **Drücken Sie**: `Strg + Shift + R` (Windows/Linux) oder `Cmd + Shift + R` (Mac)
2. **Oder**: 
   - Öffnen Sie die Entwicklerkonsole mit `F12`
   - Rechtsklick auf den Neu-Laden-Button
   - Wählen Sie "Cache leeren und erneut laden"

### 2. Backend neu deployen
1. Klicken Sie auf den **"Publish"** oder **"Deploy"** Button oben rechts
2. Warten Sie, bis das Backend neu deployed ist (ca. 10-30 Sekunden)

### 3. Browser-Konsole öffnen
1. Drücken Sie `F12` oder `Strg + Shift + I`
2. Wechseln Sie zum Tab **"Console"** bzw. **"Konsole"**

### 4. Version-Check-Logs suchen
Nach dem Neuladen der Seite sollten Sie folgende Logs sehen:

#### Frontend-Version-Check:
```
🔧 [APP LOADED] Version mit umfangreichem Debug-Logging - Nov 3, 2025, 14:30
```

#### Formular-Version-Check (beim Öffnen des Hortzettel-Formulars):
```
📝 [FORM LOADED] CreateHortzettelForm geladen - Nov 3, 2025, 14:30
```

#### Backend-Version-Check (beim ersten API-Call):
In der Konsole oder in den Network-Logs:
```
🚀 [BACKEND LOADED] Backend-Server gestartet - Nov 3, 2025, 14:30 - Mit umfangreichem Debug-Logging
```

## So testen Sie das Erstellen eines Hortzettels:

### 1. Melden Sie sich als Elternteil an
- Verwenden Sie Ihr normales Login

### 2. Erstellen Sie einen neuen Hortzettel
- Klicken Sie auf "Neuer Hortzettel"
- Füllen Sie alle Felder aus
- **WICHTIG**: Achten Sie darauf, welche Hortgruppe Sie auswählen (z.B. "Hort 1", "Hort 2", etc.)

### 3. Beobachten Sie die Konsole beim Absenden
Sie sollten folgende Logs sehen:

```
[FORM] Übermittle Hortzettel-Daten: { childName: "...", class: "Hort 1", selectedClass: "Hort 1" }
[APP] Speichere Hortzettel mit Daten: { childName: "...", class: "Hort 1", isEdit: false }
[API Request] POST https://...
[CREATE HORTZETTEL] =================================
[CREATE HORTZETTEL] Empfangene Daten: { childName: "...", class: "Hort 1", userId: "..." }
[CREATE HORTZETTEL] Speichere Hortzettel: { id: "...", childName: "...", class: "Hort 1", key: "hortzettel:..." }
[CREATE HORTZETTEL] ✅ Erfolgreich gespeichert
[CREATE HORTZETTEL] =================================
[APP] Neuer Hortzettel erstellt: { ... }
```

### 4. Öffnen Sie das Hortner-Dashboard
- Melden Sie sich als Hortner an (oder wechseln Sie die Ansicht)
- Wählen Sie die entsprechende Hortgruppe aus

### 5. Beobachten Sie die Konsole beim Laden
Sie sollten folgende Logs sehen:

```
[FRONTEND] Lade Hortzettel vom Backend...
[API Request] GET https://...
[HORTNER] =================================
[HORTNER] Geladene Hortzettel: 4
[HORTNER] Hortzettel-Details:
  - ID: ..., Kind: Max Mustermann, Hortgruppe: "Hort 1", Status: aktiv
  - ID: ..., Kind: Anna Schmidt, Hortgruppe: "Hort 2", Status: aktiv
  - ID: ..., Kind: Tom Müller, Hortgruppe: "Hort 3", Status: aktiv
  - ID: ..., Kind: Lisa Weber, Hortgruppe: "Hort 4", Status: aktiv
[HORTNER] Eindeutige Hortgruppen: ["Hort 1", "Hort 2", "Hort 3", "Hort 4"]
[HORTNER] =================================
[FRONTEND] Response vom Backend: { hortzettel: [...] }
[FRONTEND] Anzahl Hortzettel: 4
[FRONTEND] Verarbeitete Hortzettel: 4
[FRONTEND]   - ID: ..., Kind: Max Mustermann, Hortgruppe: "Hort 1", Status: aktiv
[FRONTEND]   - ID: ..., Kind: Anna Schmidt, Hortgruppe: "Hort 2", Status: aktiv
[FRONTEND]   - ID: ..., Kind: Tom Müller, Hortgruppe: "Hort 3", Status: aktiv
[FRONTEND]   - ID: ..., Kind: Lisa Weber, Hortgruppe: "Hort 4", Status: aktiv
[FRONTEND] Hortzettel erfolgreich geladen und State aktualisiert
```

## Troubleshooting

### Wenn Sie KEINE Logs sehen:
1. **Frontend-Cache**: Leeren Sie den Browser-Cache komplett (siehe oben)
2. **Backend nicht deployed**: Klicken Sie auf "Publish" oben rechts
3. **Console-Filter**: Prüfen Sie, ob in der Konsole ein Filter aktiv ist (sollte "All" oder "Alle" sein)
4. **Service Worker**: Deaktivieren Sie den Service Worker in den Browser-DevTools unter "Application" > "Service Workers" > "Unregister"

### Wenn Logs erscheinen, aber keine Hortzettel:
- **Achten Sie auf die Logs**: Die Debug-Informationen zeigen genau, welche Hortgruppen gespeichert wurden
- **Mögliche Ursachen**:
  1. Falsche Hortgruppen-Namen (z.B. "1a" statt "Hort 1")
  2. Status ist "archiviert" statt "aktiv"
  3. Filter im Hortner-Dashboard ist falsch eingestellt

### Wenn die Version-Logs nicht erscheinen:
- Die neue Version wurde noch nicht geladen
- Führen Sie einen **Hard Refresh** durch: `Strg + Shift + R`
- Oder: Löschen Sie den Site Data unter DevTools > Application > Clear site data

## Nächste Schritte

Sobald die Logs erscheinen, können wir genau sehen:
1. Welche Hortgruppe beim Erstellen gespeichert wird
2. Welche Hortzettel vom Backend zurückgegeben werden
3. Warum sie eventuell nicht angezeigt werden

Mit diesen Informationen können wir das Problem präzise identifizieren und beheben.
