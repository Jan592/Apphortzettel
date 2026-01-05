import { useEffect, useState } from "react";
import type { HortzettelData } from "../types/hortzettel";
import { X } from "lucide-react";
import { Button } from "./ui/button";

interface HortzettelPrintViewProps {
  hortzettel: (HortzettelData & { 
    id: string; 
    createdAt: Date | string;
    updatedAt?: string;
    mondayEdits?: number;
    tuesdayEdits?: number;
    wednesdayEdits?: number;
    thursdayEdits?: number;
    fridayEdits?: number;
    weekNumber?: number;
    year?: number;
    status?: string;
    childProfile?: {
      birthDate?: string;
      parentPhone?: string;
      allergies?: string;
      medicalNotes?: string;
      pickupAuthorization?: string;
      emergencyContact?: string;
    };
  })[];
  onClose: () => void;
}

export function HortzettelPrintView({ hortzettel: hortzettelList, onClose }: HortzettelPrintViewProps) {
  const [columnWidths, setColumnWidths] = useState({
    name: 200,
    canGoHome: 140,
    monday: 140,
    tuesday: 140,
    wednesday: 140,
    thursday: 140,
    friday: 140,
  });

  const getTimeLabel = (value: string, otherValue?: string) => {
    if (!value) return "-";
    
    const labels: Record<string, string> = {
      "hort": "Hort",
      "heim": "Heim",
      "keine-betreuung": "Keine Betreuung",
      "nach-unterricht": "Nach Unterricht",
      "nach-mittagessen": "Nach Essen",
      "mittagsbus": "Mittagsbus",
      "nachmittagsbus": "Nachmittagsbus",
      "14:00": "14:00",
      "15:00": "15:00",
      "16:00": "16:00+",
      "krank": "Krank",
      "feiertag": "Feiertag",
      "sonstiges": otherValue || "Sonstiges",
      "andere": otherValue || "Andere",
    };
    
    if (value.includes(',')) {
      const values = value.split(',').map(v => v.trim()).filter(v => v);
      const labelParts = values.map(v => labels[v] || v).join(', ');
      return otherValue && !value.includes('sonstiges') && !value.includes('andere')
        ? `${labelParts} (${otherValue})` 
        : labelParts;
    }
    
    const baseLabel = labels[value] || value;
    return otherValue && value !== 'sonstiges' && value !== 'andere'
      ? `${baseLabel} (${otherValue})` 
      : baseLabel;
  };

  const getDayCellColor = (editCount: number = 0) => {
    if (editCount === 0) return "";
    
    const colors = [
      "",
      "bg-red-100 border-red-300 font-semibold",
      "bg-orange-100 border-orange-300 font-semibold",
      "bg-yellow-100 border-yellow-300 font-semibold",
      "bg-green-100 border-green-300 font-semibold",
    ];
    return colors[Math.min(editCount, 4)] || colors[4];
  };

  const formatWeekLabel = (weekNumber?: number, year?: number) => {
    if (!weekNumber || !year) return "Unbekannte Woche";
    return `KW ${weekNumber}, ${year}`;
  };

  // Verwende die bereits gefilterten Hortzettel direkt, mit Fallback
  const filteredHortzettel = hortzettelList || [];

  // Print on mount
  useEffect(() => {
    const timeout = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="min-h-screen bg-white p-8">
      {/* Header - nur auf Bildschirm sichtbar, nicht beim Drucken */}
      <div className="print:hidden mb-4 flex items-center justify-between border-b pb-4">
        <h1 className="text-2xl">Hortzettel Vollansicht</h1>
        <div className="flex gap-2">
          <Button onClick={() => window.print()} variant="default">
            Drucken
          </Button>
          <Button onClick={onClose} variant="outline" size="icon">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Druckkopf - nur beim Drucken sichtbar */}
      <div className="hidden print:block mb-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Hortzettel Übersicht</h1>
        <p className="text-sm text-gray-600">
          {new Date().toLocaleDateString('de-DE', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
          })}
        </p>
      </div>

      {filteredHortzettel.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Keine aktiven Hortzettel vorhanden</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-3 text-left" style={{ width: columnWidths.name }}>
                  Kind & Klasse
                </th>
                <th className="border border-gray-300 p-3 text-center" style={{ width: columnWidths.canGoHome }}>
                  Alleine Heim?
                </th>
                <th className="border border-gray-300 p-3 text-center bg-blue-50" style={{ width: columnWidths.monday }}>
                  Montag
                </th>
                <th className="border border-gray-300 p-3 text-center bg-green-50" style={{ width: columnWidths.tuesday }}>
                  Dienstag
                </th>
                <th className="border border-gray-300 p-3 text-center bg-yellow-50" style={{ width: columnWidths.wednesday }}>
                  Mittwoch
                </th>
                <th className="border border-gray-300 p-3 text-center bg-orange-50" style={{ width: columnWidths.thursday }}>
                  Donnerstag
                </th>
                <th className="border border-gray-300 p-3 text-center bg-purple-50" style={{ width: columnWidths.friday }}>
                  Freitag
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredHortzettel.map((hortzettel) => (
                <tr key={hortzettel.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-3">
                    <div>
                      <div className="font-semibold">{hortzettel.childName}</div>
                      <div className="text-sm text-gray-600">Klasse {hortzettel.class}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatWeekLabel(hortzettel.weekNumber, hortzettel.year)}
                      </div>
                      {hortzettel.updatedAt && hortzettel.createdAt && new Date(hortzettel.updatedAt).getTime() > new Date(hortzettel.createdAt).getTime() + 1000 && (
                        <div className="inline-block mt-1 px-2 py-0.5 text-xs bg-orange-100 text-orange-700 border border-orange-300 rounded">
                          ✏️ Bearbeitet
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 p-3 text-center">
                    <div className="text-sm break-words">
                      {hortzettel.canGoHomeAlone === "andere" || hortzettel.canGoHomeAlone === "sonstiges"
                        ? hortzettel.canGoHomeAloneOther || "Sonstiges"
                        : hortzettel.canGoHomeAlone === "ja" 
                          ? "✅ Ja" 
                          : hortzettel.canGoHomeAlone === "nein" 
                            ? "❌ Nein" 
                            : hortzettel.canGoHomeAlone || "-"}
                    </div>
                  </td>
                  <td className={`border border-gray-300 p-3 text-center ${getDayCellColor(hortzettel.mondayEdits || 0)}`}>
                    <div className="text-sm break-words">
                      {getTimeLabel(hortzettel.monday, hortzettel.mondayOther)}
                    </div>
                  </td>
                  <td className={`border border-gray-300 p-3 text-center ${getDayCellColor(hortzettel.tuesdayEdits || 0)}`}>
                    <div className="text-sm break-words">
                      {getTimeLabel(hortzettel.tuesday, hortzettel.tuesdayOther)}
                    </div>
                  </td>
                  <td className={`border border-gray-300 p-3 text-center ${getDayCellColor(hortzettel.wednesdayEdits || 0)}`}>
                    <div className="text-sm break-words">
                      {getTimeLabel(hortzettel.wednesday, hortzettel.wednesdayOther)}
                    </div>
                  </td>
                  <td className={`border border-gray-300 p-3 text-center ${getDayCellColor(hortzettel.thursdayEdits || 0)}`}>
                    <div className="text-sm break-words">
                      {getTimeLabel(hortzettel.thursday, hortzettel.thursdayOther)}
                    </div>
                  </td>
                  <td className={`border border-gray-300 p-3 text-center ${getDayCellColor(hortzettel.fridayEdits || 0)}`}>
                    <div className="text-sm break-words">
                      {getTimeLabel(hortzettel.friday, hortzettel.fridayOther)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Legende */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg print:bg-white print:border print:border-gray-300">
            <h3 className="font-semibold mb-2 text-sm">Legende - Farbcodierung für Änderungen:</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border border-gray-300"></div>
                <span>Original</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border border-red-300"></div>
                <span>1x geändert</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-100 border border-orange-300"></div>
                <span>2x geändert</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-300"></div>
                <span>3x geändert</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-300"></div>
                <span>4+ Änderungen</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          @page {
            margin: 1cm;
            size: landscape;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:block {
            display: block !important;
          }
          
          .print\\:bg-white {
            background-color: white !important;
          }
          
          .print\\:border {
            border: 1px solid #d1d5db !important;
          }
          
          .print\\:border-gray-300 {
            border-color: #d1d5db !important;
          }
          
          table {
            page-break-inside: auto;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          thead {
            display: table-header-group;
          }
          
          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>
    </div>
  );
}
