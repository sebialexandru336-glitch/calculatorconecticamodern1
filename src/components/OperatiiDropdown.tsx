import { useState } from "react";
import type { Operatie } from "@/types/operatie";
import { Pencil, Trash2 } from "lucide-react";

interface OperatiiDropdownProps {
  operatii: Operatie[];
  selectedId: string | null;
  isAdmin: boolean;
  onSelect: (op: Operatie) => void;
  onEdit: (op: Operatie) => void;
  onDelete: (op: Operatie) => void;
}

export default function OperatiiDropdown({
  operatii,
  selectedId,
  isAdmin,
  onSelect,
  onEdit,
  onDelete,
}: OperatiiDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = operatii.find((o) => o.id === selectedId);

  const filtered = operatii.filter((op) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return op.denumire.toLowerCase().includes(q) || String(op.valoare).includes(q);
  });

  return (
    <div>
      <div
        className={`custom-select-trigger ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="truncate">
          {selected
            ? `${selected.denumire} | ${selected.valoare.toFixed(3)}`
            : "Selectează operație"}
        </div>
        <div className={`select-arrow ${isOpen ? "open" : ""}`} />
      </div>

      <div className={`dropdown-panel mt-2 ${isOpen ? "open" : ""}`}>
        <div className="pb-2.5 relative z-[2]">
          <input
            className="calc-input"
            type="text"
            placeholder="Caută operație..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="max-h-[min(56vh,420px)] overflow-auto rounded-[14px]">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nu există operații pentru căutarea asta.
            </div>
          ) : (
            filtered.map((op) => (
              <div key={op.id} className="dropdown-item" onClick={(e) => e.stopPropagation()}>
                <div
                  className="flex-1 min-w-0 cursor-pointer flex flex-col gap-1 p-0.5"
                  onClick={() => {
                    onSelect(op);
                    setIsOpen(false);
                    setSearch("");
                  }}
                >
                  <div className="text-sm font-semibold truncate">{op.denumire}</div>
                  <div className="text-xs text-muted-foreground">
                    Valoare fișă: {op.valoare.toFixed(3)} • {Math.round(60 / op.valoare)} buc/oră
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-2 items-center">
                    <button
                      className="icon-btn-edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(op);
                        setIsOpen(false);
                      }}
                      aria-label="Editează"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      className="icon-btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(op);
                      }}
                      aria-label="Șterge"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
