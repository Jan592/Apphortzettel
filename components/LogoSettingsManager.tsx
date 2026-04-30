import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Upload, X, RotateCcw, GraduationCap, ZoomIn, ZoomOut } from "lucide-react";
import { api } from "../utils/api";
import { toast } from "sonner@2.0.3";
import { Card } from "./ui/card";
import { Slider } from "./ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";

export default function LogoSettingsManager() {
  const [logo, setLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [imageScale, setImageScale] = useState(100);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadLogo();
  }, []);

  const loadLogo = async () => {
    try {
      const response = await api.getLogo();
      setLogo(response.logo);
    } catch (error) {
      console.error('Fehler beim Laden des Logos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Bitte wählen Sie eine Bilddatei aus');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Die Datei ist zu groß. Maximale Größe: 5MB');
      return;
    }

    // Convert to base64 and open editor
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setTempImage(base64);
      setImageScale(100);
      setShowEditor(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveScaledImage = async () => {
    if (!tempImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = async () => {
      // Set canvas size to desired output size
      const outputSize = 512;
      canvas.width = outputSize;
      canvas.height = outputSize;

      // Clear canvas
      ctx.clearRect(0, 0, outputSize, outputSize);

      // Calculate scaled dimensions
      const scale = imageScale / 100;
      const scaledWidth = outputSize * scale;
      const scaledHeight = outputSize * scale;

      // Center the image
      const x = (outputSize - scaledWidth) / 2;
      const y = (outputSize - scaledHeight) / 2;

      // Draw scaled image
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

      // Convert to base64
      const scaledBase64 = canvas.toDataURL('image/png');
      
      // Upload the scaled image
      await uploadLogo(scaledBase64);
      setShowEditor(false);
      setTempImage(null);
    };
    img.src = tempImage;
  };

  const handleCancelEdit = () => {
    setShowEditor(false);
    setTempImage(null);
    setImageScale(100);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadLogo = async (base64: string) => {
    setUploading(true);
    try {
      await api.uploadLogo(base64);
      setLogo(base64);
      toast.success('Logo erfolgreich hochgeladen!');
      
      // Dispatch event to update other components
      window.dispatchEvent(new CustomEvent('logoUpdated'));
    } catch (error: any) {
      console.error('Fehler beim Hochladen des Logos:', error);
      toast.error(error.message || 'Fehler beim Hochladen des Logos');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Möchten Sie das Logo wirklich auf das Standard-Icon zurücksetzen?')) {
      return;
    }

    setUploading(true);
    try {
      await api.deleteLogo();
      setLogo(null);
      toast.success('Logo auf Standard zurückgesetzt');
      
      // Dispatch event to update other components
      window.dispatchEvent(new CustomEvent('logoUpdated'));
    } catch (error: any) {
      console.error('Fehler beim Zurücksetzen des Logos:', error);
      toast.error(error.message || 'Fehler beim Zurücksetzen des Logos');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Lädt...</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h3 className="mb-1">App-Logo</h3>
          <p className="text-sm text-muted-foreground">
            Laden Sie ein benutzerdefiniertes Logo hoch, das im Header angezeigt wird
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            {/* Preview */}
            <div>
              <Label className="mb-2 block">Vorschau</Label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl ring-4 ring-blue-200/50 p-3">
                  {logo ? (
                    <img 
                      src={logo} 
                      alt="Logo" 
                      className="w-14 h-14 object-contain"
                    />
                  ) : (
                    <GraduationCap className="h-10 w-10 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    {logo ? 'Benutzerdefiniertes Logo' : 'Standard-Icon (GraduationCap)'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Empfohlen: Quadratisches Bild, PNG oder SVG, max. 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Upload Button */}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Logo hochladen
              </Button>

              {logo && (
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={uploading}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Zurücksetzen
                </Button>
              )}
            </div>

            {/* Tips */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-sm mb-2">Tipps für das beste Ergebnis:</h4>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Verwenden Sie ein quadratisches Bild (z.B. 512x512px)</li>
                <li>PNG-Dateien mit transparentem Hintergrund funktionieren am besten</li>
                <li>Nach dem Hochladen können Sie die Größe anpassen</li>
                <li>Maximale Dateigröße: 5MB</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Image Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Logo-Größe anpassen</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Preview */}
            <div className="flex justify-center">
              <div 
                className="w-64 h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl ring-4 ring-blue-200/50 overflow-hidden"
              >
                {tempImage && (
                  <img 
                    src={tempImage} 
                    alt="Logo Vorschau" 
                    style={{
                      width: `${imageScale}%`,
                      height: `${imageScale}%`,
                      objectFit: 'contain',
                      maxWidth: '100%',
                      maxHeight: '100%'
                    }}
                  />
                )}
              </div>
            </div>

            {/* Size Control */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <ZoomOut className="h-4 w-4" />
                  Größe
                  <ZoomIn className="h-4 w-4" />
                </Label>
                <span className="text-sm text-muted-foreground">{imageScale}%</span>
              </div>
              <Slider
                value={[imageScale]}
                onValueChange={(value) => setImageScale(value[0])}
                min={20}
                max={150}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground text-center">
                Ziehen Sie den Regler, um die Größe des Logos anzupassen
              </p>
            </div>

            {/* Hidden canvas for processing */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit} disabled={uploading}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveScaledImage} disabled={uploading}>
              {uploading ? 'Wird hochgeladen...' : 'Speichern & Hochladen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
