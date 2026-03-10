import { useState, useEffect } from "react";
import type { Operatie } from "@/types/operatie";
import { AVAILABLE_ICONS, parseOperationName, formatOperationName } from "@/lib/iconMap";
import { Image } from "lucide-react";

interface AdminPanelProps {
  editingOp: Operatie | null;
  onSave: (denumire: string, valoare: number) => void;
  onCancelEdit: () => void;
}

export default function AdminPanel({ editingOp, onSave, onCancelEdit }: AdminPanelProps) {
  const [denumire, setDenumire] = useState("");
  const [valoare, setValoare] = useState("");
  const [iconId, setIconId] = useState<string | null>(null);

  useEffect(() => {
    if (editingOp) {
      const parsed = parseOperationName(editingOp.denumire);
      setDenumire(parsed.displayName);
      setIconId(parsed.iconId);
      setValoare(editingOp.valoare.toFixed(3));
    } else {
      setDenumire("");
      setValoare("");
      setIconId(null);
    }
  }, [editingOp]);

  const handleSave = () => {
    const val = parseFloat(valoare.replace(",", "."));
    if (!denumire.trim() || isNaN(val) || val <= 0) return;
    
    const formattedDenumire = formatOperationName(denumire, iconId);
    onSave(formattedDenumire, val);
    
    if (!editingOp) {
      setDenumire("");
      setValoare("");
      setIconId(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 mt-1.5">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h2 className="font-bold text-[17px]">Panou Admin</h2>
        <div className="text-xs text-muted-foreground">
          {editingOp ? "Editezi operația selectată" : "Adaugă sau editează operații"}
        </div>
      </div>

      <div className="flex gap-2 mb-1">
        <input
          className="calc-input flex-1"
          type="text"
          placeholder="Denumire operație"
          value={denumire}
          onChange={(e) => setDenumire(e.target.value)}
        />
      </div>
      
      {/* Icon Selector */}
      <div>
        <label className="text-xs font-semibold opacity-80 mb-1.5 block flex items-center gap-1.5">
          <Image size={14} /> Alege o iconiță (Opțional)
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIconId(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${!iconId ? 'bg-primary/20 border-primary/50 text-white' : 'bg-muted border-border/50 text-muted-foreground hover:bg-muted/80'}`}
          >
            Fără
          </button>
          {AVAILABLE_ICONS.map((ico) => (
            <button
              key={ico.id}
              onClick={() => setIconId(ico.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${iconId === ico.id ? 'bg-primary/20 border-primary/50 text-white' : 'bg-muted border-border/50 text-muted-foreground hover:bg-muted/80'}`}
            >
              <img src={ico.path} alt={ico.label} className="w-7 h-7 object-contain rounded-md bg-white/5" />
              {ico.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <input
          className="calc-input flex-1"
          type="text"
          placeholder="Valoare fișă: ex: (0.080)"
          inputMode="decimal"
          value={valoare}
          onChange={(e) => setValoare(e.target.value.replace(/[^0-9.,]/g, ""))}
        />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <button className="btn-primary" onClick={handleSave}>
          {editingOp ? "Salvează modificările" : "Salvează Operație"}
        </button>
        {editingOp && (
          <button className="btn-secondary" onClick={onCancelEdit}>
            Anulează editarea
          </button>
        )}
      </div>

    </div>
  );
}
