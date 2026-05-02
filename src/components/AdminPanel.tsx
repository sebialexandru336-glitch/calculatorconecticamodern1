import React, { useState, useEffect } from "react";
import type { Operatie } from "@/types/operatie";
import { AVAILABLE_ICONS, parseOperationName, formatOperationName, formatComplexOperationName, OperationVariant } from "@/lib/iconMap";
import { Image, Plus, Trash2 } from "lucide-react";

interface AdminPanelProps {
  operatii: Operatie[];
  editingOp: Operatie | null;
  onSave: (denumire: string, valoare: number) => void;
  onCancelEdit: () => void;
  onAddLine?: (lineName: string) => void;
  onDeleteLine?: (lineName: string) => void;
}

const AdminPanel = React.memo(function AdminPanel({ operatii, editingOp, onSave, onCancelEdit, onAddLine, onDeleteLine }: AdminPanelProps) {
  const [denumire, setDenumire] = useState("");
  const [valoare, setValoare] = useState("");
  const [iconId, setIconId] = useState<string | null>(null);
  const [category, setCategory] = useState("FLAKAFIX");
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [catSearch, setCatSearch] = useState("");

  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<OperationVariant[]>([]);

  const [tab, setTab] = useState<"operatii" | "linii">("operatii");
  const [newLineName, setNewLineName] = useState("");

  const categories = React.useMemo(() => {
    const cats = new Set<string>(["FLAKAFIX"]);
    operatii.forEach(op => {
      const parsed = parseOperationName(op.denumire);
      if (parsed.category?.toUpperCase() !== "TEST") {
        cats.add(parsed.category || "FLAKAFIX");
      }
    });
    return Array.from(cats).sort();
  }, [operatii]);

  useEffect(() => {
    if (editingOp) {
      const parsed = parseOperationName(editingOp.denumire);
      setDenumire(parsed.displayName);
      setCategory(parsed.category || "FLAKAFIX");
      
      if (parsed.isComplex) {
        setHasVariants(true);
        setVariants(parsed.variants || []);
        setValoare(editingOp.valoare.toFixed(3));
        setIconId(null);
      } else {
        setHasVariants(false);
        setVariants([]);
        setIconId(parsed.iconId || null);
        setValoare(editingOp.valoare.toFixed(3));
      }
    } else {
      setDenumire("");
      setValoare("");
      setIconId(null);
      setHasVariants(false);
      setVariants([]);
    }
  }, [editingOp]);

  const handleSave = () => {
    let finalDenumire = "";
    let finalValoare = 0;

    if (hasVariants) {
      if (!denumire.trim() || variants.length === 0) return;
      finalDenumire = formatComplexOperationName(denumire, variants, category);
      finalValoare = parseFloat(variants[0].valoare.replace(",", "."));
      if (isNaN(finalValoare)) finalValoare = 0;
    } else {
      const val = parseFloat(valoare.replace(",", "."));
      if (!denumire.trim() || isNaN(val) || val <= 0) return;
      finalDenumire = formatOperationName(denumire, iconId, category);
      finalValoare = val;
    }
    
    onSave(finalDenumire, finalValoare);
    
    if (!editingOp) {
      setDenumire("");
      setValoare("");
      setIconId(null);
      setHasVariants(false);
      setVariants([]);
      // Keep the same category to easily add multiple operations to it
    }
  };

  const addVariant = () => {
    setVariants([...variants, { id: Date.now().toString(), nume: "", iconId: null, valoare: "" }]);
  };

  const updateVariant = (id: string, updates: Partial<OperationVariant>) => {
    setVariants(variants.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const removeVariant = (id: string) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  return (
    <div className="flex flex-col gap-3 mt-1.5">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h2 className="font-bold text-[17px]">Panou Admin</h2>
        <div className="text-xs text-muted-foreground">
          {tab === "operatii" 
            ? (editingOp ? "Editezi operația selectată" : "Adaugă sau editează operații")
            : "Gestionează liniile de producție"}
        </div>
      </div>

      <div className="flex bg-white/5 rounded-lg p-1 mb-2">
        <button
          className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${tab === "operatii" ? "bg-primary text-white shadow-md" : "text-white/50 hover:text-white/80"}`}
          onClick={() => setTab("operatii")}
        >
          Operații
        </button>
        <button
          className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${tab === "linii" ? "bg-primary text-white shadow-md" : "text-white/50 hover:text-white/80"}`}
          onClick={() => setTab("linii")}
        >
          Linii
        </button>
      </div>

      {tab === "operatii" ? (
        <>
          <div className="relative mb-2 mt-2">
            {isCatOpen && (
              <div className="fixed inset-0 z-40" onClick={() => setIsCatOpen(false)} />
            )}
            <div className="relative z-50">
          <label className="text-xs font-semibold opacity-80 mb-1.5 block">Categorie / Linie</label>
          <div
            className={`custom-select-trigger ${isCatOpen ? "active" : ""}`}
            onClick={() => {
              setIsCatOpen(!isCatOpen);
              if (!isCatOpen) setCatSearch("");
            }}
          >
            <div className="truncate flex-1 font-bold text-primary/90">{category}</div>
            <div className={`select-arrow ${isCatOpen ? "open" : ""}`} />
          </div>

          <div className={`dropdown-panel mt-2 ${isCatOpen ? "open" : ""}`}>
            <div className="pb-2 relative z-[2]">
              <input
                className="calc-input py-2 text-sm"
                type="text"
                placeholder="Caută sau adaugă linie nouă..."
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoComplete="off"
              />
            </div>
            <div className="max-h-[160px] overflow-auto rounded-[10px]">
              {categories
                .filter((c) => c.toLowerCase().includes(catSearch.trim().toLowerCase()))
                .map((c) => (
                  <div
                    key={c}
                    className={`dropdown-item ${category === c ? 'bg-primary/20 text-white font-bold' : ''}`}
                    onClick={() => {
                      setCategory(c);
                      setCatSearch("");
                      setIsCatOpen(false);
                    }}
                  >
                    {c}
                  </div>
                ))}
              {catSearch.trim().length > 0 && !categories.some(c => c.toLowerCase() === catSearch.trim().toLowerCase()) && (
                <div
                  className="dropdown-item text-primary font-bold bg-primary/10"
                  onClick={() => {
                    setCategory(catSearch.trim().toUpperCase());
                    setCatSearch("");
                    setIsCatOpen(false);
                  }}
                >
                  + Adaugă linia "{catSearch.trim().toUpperCase()}"
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-1">
        <input
          className="calc-input flex-1"
          type="text"
          placeholder="Numele general al op. (ex: Inserare)"
          value={denumire}
          onChange={(e) => setDenumire(e.target.value)}
        />
        <button 
          onClick={() => setHasVariants(!hasVariants)}
          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${hasVariants ? 'bg-primary border-primary text-white' : 'bg-muted border-border/50 text-muted-foreground hover:bg-muted/80'}`}
        >
          {hasVariants ? "Cu sub-piese" : "Piesă simplă"}
        </button>
      </div>
      
      {!hasVariants ? (
        <>
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
              onChange={(e) => setValoare(e.target.value)}
            />
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold opacity-80">Tipuri de piese (Variante)</label>
            <button onClick={addVariant} className="flex items-center gap-1 text-xs bg-primary/20 text-primary px-2 py-1 rounded-md font-semibold hover:bg-primary/30">
              <Plus size={14} /> Adaugă piesă
            </button>
          </div>
          {variants.length === 0 ? (
            <div className="text-xs text-center text-white/40 py-2">Adaugă cel puțin o piesă.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {variants.map((v, i) => (
                <div key={v.id} className="flex flex-col gap-2 p-3 bg-black/20 rounded-lg border border-white/5 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/50">Piesa #{i + 1}</span>
                    <button onClick={() => removeVariant(v.id)} className="text-rose-400/70 hover:text-rose-400 transition-colors p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="calc-input text-sm p-2"
                      type="text"
                      placeholder="Nume (ex: Conector Normal)"
                      value={v.nume}
                      onChange={(e) => updateVariant(v.id, { nume: e.target.value })}
                    />
                    <input
                      className="calc-input text-sm p-2"
                      type="text"
                      placeholder="Valoare (ex: 0.100)"
                      inputMode="decimal"
                      value={v.valoare}
                      onChange={(e) => updateVariant(v.id, { valoare: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold opacity-60 mb-1 block">Iconiță</label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => updateVariant(v.id, { iconId: null })}
                        className={`px-2 py-1 rounded-md text-[10px] font-semibold border transition-all ${!v.iconId ? 'bg-primary/20 border-primary/50 text-white' : 'bg-white/5 border-transparent text-white/50 hover:bg-white/10'}`}
                      >
                        Fără
                      </button>
                      {AVAILABLE_ICONS.map((ico) => (
                        <button
                          key={ico.id}
                          onClick={() => updateVariant(v.id, { iconId: ico.id })}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border transition-all ${v.iconId === ico.id ? 'bg-primary/20 border-primary/50 text-white' : 'bg-white/5 border-transparent text-white/50 hover:bg-white/10'}`}
                        >
                          <img src={ico.path} alt={ico.label} className="w-4 h-4 object-contain" />
                          {ico.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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
    </>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold opacity-80">Linii Existente</label>
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col">
              {categories.map(c => (
                <div key={c} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0">
                  <span className="font-bold text-sm text-white/90">{c}</span>
                  <button 
                    onClick={() => {
                      if (categories.length > 1) {
                        onDeleteLine?.(c);
                      } else {
                        alert("Nu poți șterge ultima linie rămasă! Aplicația are nevoie de cel puțin o linie activă.");
                      }
                    }} 
                    className={`p-1.5 rounded-md transition-colors ${categories.length <= 1 ? 'text-white/20 cursor-not-allowed' : 'text-rose-400 hover:bg-rose-400/10'}`}
                    title={categories.length <= 1 ? "Nu poți șterge singura linie existentă" : `Șterge linia ${c}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {categories.length === 0 && <div className="p-4 text-center text-xs opacity-50">Nicio linie găsită.</div>}
            </div>
          </div>
          
          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
            <label className="text-xs font-semibold opacity-80">Crează Linie Nouă</label>
            <div className="flex gap-2">
              <input
                className="calc-input flex-1"
                type="text"
                placeholder="Numele liniei"
                value={newLineName}
                onChange={(e) => setNewLineName(e.target.value)}
              />
              <button 
                className="bg-primary hover:bg-primary/90 text-white font-bold px-4 rounded-xl text-sm transition-all"
                onClick={() => {
                  if (newLineName.trim() && onAddLine) {
                    onAddLine(newLineName.trim().toUpperCase());
                    setNewLineName("");
                  }
                }}
              >
                Adaugă
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
});

export default AdminPanel;
