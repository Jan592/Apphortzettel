# 🐛 Bugfix: Hortgruppen-Filter - Hortzettel unsichtbar

## Problem
Obwohl Hortzettel erstellt wurden, wurden sie im Hortner-Dashboard nicht angezeigt.

## Ursache

### 1. Inkonsistente Klassen-Namen
- **Hortzettel wurden gespeichert mit**: `class: "1"`, `"2"`, `"3"`, `"4"`
- **Hortner-Dashboard filterte nach**: `"Hort 1"`, `"Hort 2"`, `"Hort 3"`, `"Hort 4"`
- **Ergebnis**: Keine Übereinstimmung → keine sichtbaren Hortzettel

### 2. Falsches Präfix beim Auto-Login
- **Alter Code**: `setHortnerKlasse('klasse-1')`
- **Erwartet**: `setHortnerKlasse('hort-1')`
- **Problem**: Filter im Dashboard funktionierte nicht korrekt

## Lösung

### 1. Flexible Filterlogik (beide Formate akzeptieren)
In `HortnerDashboard.tsx`:

```typescript
// Helper function to check if a class value matches this Hortner's group
const isMatchingClass = (classValue: string | undefined) => {
  if (!classValue) return false;
  // Match both "1" and "Hort 1" formats
  return classValue === hortNum || classValue === visibleHortgruppe;
};
```

Jetzt werden beide Formate akzeptiert:
- ✅ `class: "1"` matched für Hortner "hort-1"
- ✅ `class: "Hort 1"` matched für Hortner "hort-1"

### 2. Korrektur des Auto-Login-Präfix
In `App.tsx`:

```typescript
// Alt (falsch):
setHortnerKlasse(`klasse-${klassennummer}`);

// Neu (korrekt):
setHortnerKlasse(`hort-${klassennummer}`);
```

### 3. Verbessertes Debug-Logging
Beide Dashboards zeigen jetzt:
```
[HORTNER FILTER] Klasse: hort-2, hortNum: 2, visibleHortgruppe: Hort 2
[HORTNER FILTER] Total Hortzettel: 12, Filtered: 3, Active: 3, Archived: 0
```

Und im Detail-Log:
```
  - ✅ MATCH ID: xyz, Kind: Max Mustermann, Hortgruppe: "2", Status: aktiv
  - ❌ NO MATCH ID: abc, Kind: Anna Schmidt, Hortgruppe: "1", Status: aktiv
```

## Dateien geändert
- ✅ `/components/HortnerDashboard.tsx` - Flexible Filterlogik + Debug-Logs
- ✅ `/App.tsx` - Korrektur: `klasse-` → `hort-`

## Test-Anleitung

1. **Browser-Cache leeren**: `Strg + Shift + R` (Hard Refresh)
2. **Als Hortner anmelden**: z.B. "Hort 1" / "Hort 2" / "Hort 3" / "Hort 4"
3. **Console überprüfen**: Sollte `[HORTNER FILTER]` Logs zeigen
4. **Hortzettel sollten erscheinen**: Alle Hortzettel mit matching class

## Erwartete Console-Ausgabe

```
=== [HortnerDashboard] Filter Debug ===
Hortner-Gruppe: hort-2
Hortnummer: 2
Sichtbare Hortgruppe: Hort 2
Gesamt Hortzettel: 13
Hortzettel-Details:
  - ✅ MATCH ID: 1762193186386-aijomavfs, Kind: jan Zörkler, Hortgruppe: "2", Status: aktiv
  - ✅ MATCH ID: 1762191008032-kgvzq577r, Kind: jan Zörkler, Hortgruppe: "2", Status: aktiv
  - ✅ MATCH ID: 1762182563770-1juw5k9ur, Kind: jan Zörkler, Hortgruppe: "2", Status: aktiv
  - ❌ NO MATCH ID: 1762192891237-qwdqcsiim, Kind: julian 1, Hortgruppe: "1", Status: aktiv
  - ❌ NO MATCH ID: 1762191060194-s0cg96vsw, Kind: julian 1, Hortgruppe: "4", Status: aktiv
Eindeutige Hortgruppen: ["2", "1", "4", "3", "2b", "1b"]
=======================================
[HORTNER FILTER] Total Hortzettel: 13, Filtered: 3, Active: 3, Archived: 0
```

## Status
✅ **Behoben** - Hortzettel werden jetzt korrekt gefiltert und angezeigt

## Hinweis für die Zukunft

Falls die Klassen-Namen in den Admin-Einstellungen geändert werden sollen:
- **Option 1**: Behalten Sie "1", "2", "3", "4" (aktuell empfohlen)
- **Option 2**: Ändern Sie auf "Hort 1", "Hort 2", etc. (funktioniert dank flexibler Filter auch)
- Die Filter-Logik unterstützt beide Formate automatisch!
