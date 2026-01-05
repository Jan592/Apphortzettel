# Mehrfachauswahl-Funktion

## Übersicht
Das Hortzettel-Formular unterstützt jetzt **Mehrfachauswahl an jedem einzelnen Wochentag**, sodass Eltern mehrere Optionen pro Tag auswählen können (z.B. "Nach dem Unterricht" UND "Sonstiges" am Montag).

## Was wurde geändert?

### 1. Quick-Fill Funktion entfernt
Die "Mehrere Tage gleichzeitig ausfüllen" Funktion wurde komplett entfernt, da sie nicht mehr benötigt wird.

### 2. Checkbox-Modus für Mehrfachauswahl
Der Admin kann im Admin-Dashboard unter **Einstellungen > Design** den "Zeitauswahl-Typ" auf **"Checkboxen (Mehrfachauswahl)"** setzen.

Wenn Checkboxen aktiviert sind:
- Eltern können **mehrere Optionen pro Tag** auswählen
- Die Auswahl wird als comma-separated String gespeichert (z.B. `"nach-unterricht,sonstiges"`)
- Alle ausgewählten Optionen werden in der Anzeige korrekt dargestellt

### 3. Angepasste Komponenten

#### CreateHortzettelForm.tsx
- Quick-Fill States und Funktionen entfernt (`selectedDays`, `quickFillValue`, `applyQuickFill`, etc.)
- Quick-Fill UI entfernt (Lines 834-1076 im Original)
- `onSubmit` Logik aktualisiert: `monday.includes("sonstiges")` statt `monday === "sonstiges"`
- Beschreibung im Wochenplan-Bereich dynamisch: "Wähle für jeden Tag eine oder mehrere Optionen aus" (wenn Checkbox-Modus aktiv)

#### HortnerDashboard.tsx, MyHortzettelList.tsx, TemplateManager.tsx
- `getTimeLabel()` Funktion erweitert, um comma-separated values zu verarbeiten
- Bei Mehrfachauswahl werden die Labels mit Komma getrennt angezeigt (z.B. "Nach Unterricht, Sonstiges")

## Verwendung

### Als Admin
1. Gehe zu **Admin-Dashboard > Einstellungen > Design**
2. Setze "Zeitauswahl-Typ für Wochentage" auf **"Checkboxen (Mehrfachauswahl)"**
3. Speichere die Einstellungen

### Als Elternteil
1. Erstelle einen neuen Hortzettel
2. Bei jedem Wochentag kannst du nun **mehrere Optionen** auswählen (z.B. "Nach dem Unterricht" + "Sonstiges")
3. Das "Sonstiges"-Feld erscheint, sobald "Sonstiges" ausgewählt ist
4. Sende den Hortzettel wie gewohnt ab

## Datenformat
Die Werte werden als comma-separated String gespeichert:
- **Einzelauswahl**: `"nach-unterricht"`
- **Mehrfachauswahl**: `"nach-unterricht,sonstiges"`
- **Sonstiges-Text**: Wird separat im `mondayOther` Feld gespeichert

## Abwärtskompatibilität
Alle bestehenden Hortzettel mit Einzelauswahl funktionieren weiterhin einwandfrei. Die Änderung ist vollständig abwärtskompatibel.
