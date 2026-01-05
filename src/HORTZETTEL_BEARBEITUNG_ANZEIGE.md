# Hortzettel Bearbeitungs-Anzeige

## Übersicht
Bearbeitete Hortzettel werden nun mit einem orangenen "Bearbeitet" Badge visuell markiert, damit Hortner sofort erkennen können, welche Hortzettel von Eltern nachträglich geändert wurden.

## Implementierung

### Backend
- **Datei**: `/supabase/functions/server/index.tsx`
- Bei Erstellung: `updatedAt` wird beim Erstellen eines neuen Hortzettels gesetzt
- Bei Bearbeitung: `updatedAt` wird beim Update eines Hortzettels aktualisiert
- Das Backend gibt `updatedAt` bei allen Hortzettel-Abfragen zurück

### Type Definition
- **Datei**: `/types/hortzettel.ts`
- `updatedAt?: string` wurde zum `HortzettelData` Interface hinzugefügt

### Frontend-Anzeige

#### 1. HortnerDashboard
- **Datei**: `/components/HortnerDashboard.tsx`
- Zeigt orangenes "Bearbeitet" Badge in der Tabelle an

#### 2. HortzettelPrintView
- **Datei**: `/components/HortzettelPrintView.tsx`
- Zeigt "✏️ Bearbeitet" Badge in der Druckansicht/Vollbild-Ansicht an
- Sichtbar in allen 4 Hortbereichen (Hort 1-4)

#### 3. MyHortzettelList (Eltern-Ansicht)
- **Datei**: `/components/MyHortzettelList.tsx`
- Eltern sehen ebenfalls das "Bearbeitet" Badge bei ihren eigenen Hortzetteln
- Hilft Eltern zu erkennen, welche Zettel sie nachträglich geändert haben

## Farben
- **Hintergrund**: `bg-orange-100` (light mode) / `bg-orange-900/30` (dark mode)
- **Text**: `text-orange-700` (light mode) / `text-orange-300` (dark mode)
- **Border**: `border-orange-300` (light mode) / `border-orange-700` (dark mode)

## Logik
```typescript
hortzettel.updatedAt && 
hortzettel.createdAt && 
new Date(hortzettel.updatedAt).getTime() > new Date(hortzettel.createdAt).getTime() + 1000
```

Die 1000ms (1 Sekunde) Toleranz verhindert, dass Hortzettel als "bearbeitet" markiert werden, wenn `updatedAt` und `createdAt` nur minimal unterschiedlich sind (z.B. durch Verarbeitungszeit).

## Debug-Logs
Debug-Logs wurden hinzugefügt um die `updatedAt`-Information zu überprüfen:
- Backend: Zeigt `createdAt`, `updatedAt` und Bearbeitet-Status
- Frontend (Modern): Console-Logs beim Laden der Hortzettel
- Frontend (Klassisch): Console-Logs beim Laden der Hortzettel

## Funktioniert in allen 4 Hortbereichen
Die Implementierung funktioniert korrekt für:
- ✅ Hort 1
- ✅ Hort 2
- ✅ Hort 3
- ✅ Hort 4

Jeder Hortner sieht nur die Hortzettel seiner eigenen Gruppe und kann sofort erkennen, welche davon bearbeitet wurden.

## Testen
1. Als Eltern einen Hortzettel erstellen
2. Den Hortzettel bearbeiten und speichern
3. Als Hortner anmelden
4. Der bearbeitete Hortzettel sollte nun ein orangenes "Bearbeitet" Badge haben
5. Test in allen 4 Hortbereichen durchführen
6. Auch in der Druckansicht/Vollbild-Ansicht überprüfen
