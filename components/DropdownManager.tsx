import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { 
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  GripVertical,
  Clock,
  Home
} from "lucide-react";

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownManagerProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  options: DropdownOption[];
  onChange: (options: DropdownOption[]) => void;
}

export default function DropdownManager({ 
  title, 
  description, 
  icon: Icon,
  options, 
  onChange 
}: DropdownManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(options[index].value);
    setEditLabel(options[index].label);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    
    const newOptions = [...options];
    newOptions[editingIndex] = {
      value: editValue.trim(),
      label: editLabel.trim()
    };
    onChange(newOptions);
    setEditingIndex(null);
    setEditValue("");
    setEditLabel("");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
    setEditLabel("");
  };

  const handleDelete = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    onChange(newOptions);
  };

  const handleAdd = () => {
    if (!newValue.trim() || !newLabel.trim()) return;
    
    const newOption = {
      value: newValue.trim(),
      label: newLabel.trim()
    };
    onChange([...options, newOption]);
    setNewValue("");
    setNewLabel("");
    setIsAdding(false);
  };

  const handleCancelAdd = () => {
    setNewValue("");
    setNewLabel("");
    setIsAdding(false);
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          {Icon && (
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {options.map((option, index) => (
          <div 
            key={`${option.value}-${index}`}
            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border group hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {editingIndex === index ? (
              <>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="Wert (z.B. nach-unterricht)"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      placeholder="Anzeigename (z.B. Nach dem Unterricht)"
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSaveEdit}
                    className="h-9 w-9 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono text-xs">
                      {option.value}
                    </Badge>
                    <span>{option.label}</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(index)}
                    className="h-9 w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(index)}
                    className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}

        {isAdding && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border-2 border-blue-300 dark:border-blue-700">
            <Plus className="h-4 w-4 text-blue-600" />
            <div className="flex-1 grid grid-cols-2 gap-2">
              <div>
                <Input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Wert (z.B. 17:00)"
                  className="h-9"
                  autoFocus
                />
              </div>
              <div>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Anzeigename (z.B. 17:00 Uhr)"
                  className="h-9"
                />
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAdd}
                className="h-9 w-9 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                disabled={!newValue.trim() || !newLabel.trim()}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelAdd}
                className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {!isAdding && (
          <Button
            variant="outline"
            onClick={() => setIsAdding(true)}
            className="w-full border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Neue Option hinzufügen
          </Button>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>💡 Tipp:</strong> Der <strong>Wert</strong> ist der interne Bezeichner (sollte kleingeschrieben und ohne Leerzeichen sein). 
          Der <strong>Anzeigename</strong> ist das, was Benutzer sehen.
        </p>
      </div>
    </Card>
  );
}
