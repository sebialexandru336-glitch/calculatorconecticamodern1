import { useState, useEffect } from "react";
import type { Operatie } from "@/types/operatie";

interface AdminPanelProps {
  editingOp: Operatie | null;
  onSave: (denumire: string, valoare: number) => void;
  onCancelEdit: () => void;
}

export default function AdminPanel({ editingOp, onSave, onCancelEdit }: AdminPanelProps) {
  const [denumire, setDenumire] = useState("");
  const [valoare, setValoare] = useState("");

  useEffect(() => {
    if (editingOp) {
      setDenumire(editingOp.denumire);
      setValoare(editingOp.valoare.toFixed(3));
    } else {
      setDenumire("");
      setValoare("");
    }
  }, [editingOp]);

  const handleSave = () => {
    const val = parseFloat(valoare.replace(",", "."));
    if (!denumire.trim() || isNaN(val) || val <= 0) return;
    onSave(denumire.trim(), val);
    if (!editingOp) {
      setDenumire("");
      setValoare("");
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

      <input
        className="calc-input"
        type="text"
        placeholder="Denumire operație"
        value={denumire}
        onChange={(e) => setDenumire(e.target.value)}
      />
      <div className="flex gap-3">
        <input
          className="calc-input flex-1"
          type="text"
          placeholder="Valoare fișă (0.080)"
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
