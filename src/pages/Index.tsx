import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { Operatie, OperatieZi } from "@/types/operatie";
import {
  fetchOperatii,
  adminVerify,
  adminAddOperatie,
  adminUpdateOperatie,
  adminDeleteOperatie,
} from "@/lib/api";
import OperatiiDropdown from "@/components/OperatiiDropdown";
import AdminPanel from "@/components/AdminPanel";
import DaySummary from "@/components/DaySummary";
import PasswordModal from "@/components/PasswordModal";
import ConfirmModal from "@/components/ConfirmModal";
import { CalculatorWidget } from "@/components/CalculatorWidget";
import { Instagram } from "lucide-react";
import { parseOperationName, AVAILABLE_ICONS, formatOperationName } from "@/lib/iconMap";

const STORAGE_DAY = "ziCurenta_v2";
const TARGET_DEFAULT = 7.5;

export default function Index() {
  const initialLine = localStorage.getItem("global_selected_line") || null;

  const initialState = (() => {
    try {
      const raw = initialLine ? (localStorage.getItem(`${STORAGE_DAY}_${initialLine}`) || (initialLine === "FLAKAFIX" ? localStorage.getItem(STORAGE_DAY) : null)) : null;
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("Cannot parse initial state:", e);
    }
    return null;
  })();

  const [operatii, setOperatii] = useState<Operatie[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialState?.selectedId || null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  
  // Global line selection
  const [selectedLine, setSelectedLine] = useState<string | null>(initialLine);
  const [showLineModal, setShowLineModal] = useState(false);
  const loadedLineRef = useRef<string | null>(initialLine);

  const [piese, setPiese] = useState("");
  const [targetOreZi, setTargetOreZi] = useState(Number(initialState?.targetOreZi) > 0 ? Number(initialState?.targetOreZi) : TARGET_DEFAULT);

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [editingOp, setEditingOp] = useState<Operatie | null>(null);

  const [operatiiZi, setOperatiiZi] = useState<OperatieZi[]>(Array.isArray(initialState?.operatiiZi) ? initialState.operatiiZi : []);
  const [totalOre, setTotalOre] = useState(Number(initialState?.totalOre) || 0);

  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    icon: string;
    okText: string;
    variant: "danger" | "primary";
    onOk: () => void;
  }>({ open: false, title: "", message: "", icon: "", okText: "", variant: "danger", onOk: () => { } });

  const loadOperatii = useCallback(async () => {
    try {
      const data = await fetchOperatii();
      setOperatii(data);
    } catch (e) {
      console.error("Failed to load operatii:", e);
    }
  }, []);

  useEffect(() => {
    loadOperatii();
  }, [loadOperatii]);

  const saveDay = useCallback(() => {
    if (!selectedLine || loadedLineRef.current !== selectedLine) return;
    try {
      localStorage.setItem("global_selected_line", selectedLine);
      localStorage.setItem(
        `${STORAGE_DAY}_${selectedLine}`,
        JSON.stringify({ totalOre, operatiiZi, selectedId, targetOreZi })
      );
    } catch (e) {
      console.warn("Cannot save day:", e);
    }
  }, [totalOre, operatiiZi, selectedId, targetOreZi, selectedLine]);

  useEffect(() => {
    saveDay();
  }, [saveDay]);

  useEffect(() => {
    const handleVisChange = () => {
      if (document.visibilityState === "hidden") saveDay();
    };
    document.addEventListener("visibilitychange", handleVisChange);
    window.addEventListener("beforeunload", saveDay);
    return () => {
      document.removeEventListener("visibilitychange", handleVisChange);
      window.removeEventListener("beforeunload", saveDay);
    };
  }, [saveDay]);

  useEffect(() => {
    if (selectedLine) {
      try {
        const raw = localStorage.getItem(`${STORAGE_DAY}_${selectedLine}`) || (selectedLine === "FLAKAFIX" ? localStorage.getItem(STORAGE_DAY) : null);
        if (raw) {
          const parsed = JSON.parse(raw);
          setOperatiiZi(Array.isArray(parsed.operatiiZi) ? parsed.operatiiZi : []);
          setTotalOre(Number(parsed.totalOre) || 0);
          setSelectedId(parsed.selectedId || null);
          setTargetOreZi(Number(parsed.targetOreZi) > 0 ? Number(parsed.targetOreZi) : TARGET_DEFAULT);
          loadedLineRef.current = selectedLine;
          return;
        }
      } catch (e) {
        console.warn("Cannot parse line state:", e);
      }
      
      // If no valid data found for the line, reset to clean slate
      setOperatiiZi([]);
      setTotalOre(0);
      setSelectedId(null);
      loadedLineRef.current = selectedLine;
    } else {
      loadedLineRef.current = null;
    }
  }, [selectedLine]);

  const selectedOp = operatii.find((o) => o.id === selectedId) || null;

  const categories = useMemo(() => {
    const cats = new Set<string>(["FLAKAFIX"]);
    operatii.forEach(op => {
      const parsed = parseOperationName(op.denumire);
      if (parsed.category?.toUpperCase() !== "TEST") {
        cats.add(parsed.category || "FLAKAFIX");
      }
    });
    return Array.from(cats).sort();
  }, [operatii]);

  const operatiiPentruLinie = useMemo(() => {
    if (!selectedLine) return [];
    return operatii.filter(op => {
      if (op.denumire.includes("___INIT___")) return false;
      const parsed = parseOperationName(op.denumire);
      return (parsed.category || "FLAKAFIX") === selectedLine;
    });
  }, [operatii, selectedLine]);

  const handleAdminLogin = async (password: string) => {
    setPasswordLoading(true);
    setPasswordError("");
    try {
      const ok = await adminVerify(password);
      if (ok) {
        setIsAdmin(true);
        setAdminPassword(password);
        setShowPasswordModal(false);
      } else {
        setPasswordError("Parolă greșită. Încearcă din nou.");
      }
    } catch {
      setPasswordError("Eroare de conexiune.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAddToDay = () => {
    const p = parseInt(piese.replace(/[^0-9]/g, ""), 10);

    if (!selectedOp || isNaN(p) || p <= 0) return;

    const baseParsed = parseOperationName(selectedOp.denumire);

    let activeVal = selectedOp.valoare;
    let finalDenumire = selectedOp.denumire;

    if (baseParsed.isComplex) {
      if (!selectedVariantId) return;
      const variant = baseParsed.variants.find(v => v.id === selectedVariantId);
      if (!variant) return;

      activeVal = parseFloat(variant.valoare.replace(",", "."));
      if (isNaN(activeVal) || activeVal <= 0) return;

      finalDenumire = formatOperationName(`${baseParsed.displayName} - ${variant.nume}`, variant.iconId);
    } else {
      finalDenumire = formatOperationName(baseParsed.displayName, baseParsed.iconId);
    }

    const bucOra = 60 / activeVal;
    const ore = p / bucOra;

    setTotalOre((prev) => prev + ore);
    setOperatiiZi((prev) => [
      {
        denumire: finalDenumire,
        valoare: activeVal,
        piese: p,
        ore,
        bucOra,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
    setPiese("");
  };

  const handleRemoveFromDay = useCallback((index: number) => {
    setConfirm({
      open: true,
      title: "Ștergere operație",
      message: "Ești sigur că vrei să ștergi această operație din lista de azi?",
      icon: "🗑️",
      okText: "Da, șterge",
      variant: "danger",
      onOk: () => {
        setOperatiiZi((prev) => {
          const removed = prev[index];
          if (removed) {
            setTotalOre((oldTotal) => Math.max(0, oldTotal - removed.ore));
          }
          return prev.filter((_, i) => i !== index);
        });
        setConfirm((c) => ({ ...c, open: false }));
      },
    });
  }, []);

  const handleSaveOperatie = useCallback(async (denumire: string, valoare: number) => {
    try {
      if (editingOp) {
        await adminUpdateOperatie(adminPassword, editingOp.id, denumire, valoare);
        setEditingOp(null);
      } else {
        await adminAddOperatie(adminPassword, denumire, valoare);
      }
      await loadOperatii();
    } catch (e) {
      console.error("Save error:", e);
    }
  }, [adminPassword, editingOp, loadOperatii]);

  const handleDeleteOperatie = useCallback((op: Operatie) => {
    setConfirm({
      open: true,
      title: "Ștergere operație",
      message: "Ești sigur că vrei să ștergi această operație? Acțiunea nu poate fi anulată.",
      icon: "🗑️",
      okText: "Da, șterge",
      variant: "danger",
      onOk: async () => {
        try {
          await adminDeleteOperatie(adminPassword, op.id);
          if (selectedId === op.id) setSelectedId(null);
          await loadOperatii();
        } catch (e) {
          console.error("Delete error:", e);
        }
        setConfirm((c) => ({ ...c, open: false }));
      },
    });
  }, [adminPassword, selectedId, loadOperatii]);

  const handleSelectOperatie = useCallback((op: Operatie) => {
    setSelectedId(op.id);
    const parsed = parseOperationName(op.denumire);
    if (parsed.isComplex) {
      setSelectedVariantId(null);
      setShowVariantModal(true);
    } else {
      setSelectedVariantId(null);
    }
    setPiese("");
  }, []);

  const handleEditOperatie = useCallback((op: Operatie) => {
    setEditingOp(op);
  }, []);

  const handleResetZi = useCallback(() => {
    setConfirm({
      open: true,
      title: "Reset zi",
      message: `Ești sigur că vrei să resetezi ziua pentru linia ${selectedLine || ""}? Se vor șterge toate operațiile adăugate azi pe această linie.`,
      icon: "⚠️",
      okText: "Da, resetează",
      variant: "danger",
      onOk: () => {
        setTotalOre(0);
        setOperatiiZi([]);
        setConfirm((c) => ({ ...c, open: false }));
      },
    });
  }, [selectedLine]);

  const handleRequestLineChange = useCallback(() => {
    setShowLineModal(true);
  }, []);

  const handleTransferCalc = useCallback((val: string) => setPiese(val), []);

  return (
    <div className="relative min-h-screen flex justify-center items-start py-7 px-3.5 max-[980px]:items-start">
      <div className="bg-blobs" />

      <div className="w-full max-w-[1120px] relative z-10">
        <div className="flex justify-between items-center gap-3.5 mb-6 max-[720px]:flex-col max-[720px]:items-start">
          <div className="flex flex-col gap-2">
            <h1 className="text-[30px] font-extrabold leading-tight tracking-tight max-[980px]:text-[26px]">
              Calculator Ore Conectica
            </h1>
            {selectedLine && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-semibold opacity-70">Linia curentă: <span className="text-primary opacity-100">{selectedLine}</span></span>
                <button 
                  onClick={handleRequestLineChange}
                  className="text-xs bg-white/10 hover:bg-white/20 transition-colors px-2 py-1 rounded-md"
                >
                  Schimbă
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://www.instagram.com/sebi_mking4/"
              target="_blank"
              rel="noreferrer"
              className="group flex items-center justify-center p-2 text-white/60 transition-all duration-300 hover:text-pink-400 hover:-translate-y-1 hover:drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]"
              title="Instagram: @sebi_mking4"
            >
              <Instagram size={28} strokeWidth={2.5} className="transition-transform duration-300 group-hover:scale-110" />
            </a>
            <button
              className="btn-secondary whitespace-nowrap px-[18px] py-[10px] w-auto"
              onClick={() => {
                if (isAdmin) {
                  setIsAdmin(false);
                  setAdminPassword("");
                  return;
                }
                setShowPasswordModal(true);
                setPasswordError("");
              }}
            >
              {isAdmin ? "✅ Admin activ" : "Admin"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[1.03fr_0.97fr] gap-[22px] max-[980px]:grid-cols-1">
          <div className="glass-card flex flex-col gap-3 relative">
            <div className="mb-2 pr-14">
              <h2 className="font-bold text-xl">Operații</h2>
            </div>
            <CalculatorWidget onTransfer={handleTransferCalc} />

            <div>
              <label className="text-[13px] font-semibold opacity-90 mb-2 block">Alege operația</label>
              <OperatiiDropdown
                operatii={operatiiPentruLinie}
                selectedId={selectedId}
                isAdmin={isAdmin}
                onSelect={handleSelectOperatie}
                onEdit={handleEditOperatie}
                onDelete={handleDeleteOperatie}
              />
            </div>

            {selectedOp ? (() => {
              const baseParsed = parseOperationName(selectedOp.denumire);

              let activeVal = selectedOp.valoare;
              let displayName = baseParsed.displayName;
              let iconPath = baseParsed.iconPath;

              if (baseParsed.isComplex) {
                const variant = baseParsed.variants.find(v => v.id === selectedVariantId);
                if (variant) {
                  activeVal = parseFloat(variant.valoare.replace(",", "."));
                  if (isNaN(activeVal)) activeVal = 0;
                  displayName = `${baseParsed.displayName} - ${variant.nume}`;
                  iconPath = AVAILABLE_ICONS.find(i => i.id === variant.iconId)?.path || null;
                }
              }

              return (
                <>
                  <div className="info-box flex flex-col gap-2">
                    <div className="flex items-center gap-2 font-semibold text-primary/90 text-lg">
                      {iconPath ? <img src={iconPath} className="w-7 h-7 object-contain rounded-sm" /> : null}
                      {displayName}
                    </div>
                    <div className="text-sm">📊 Productivitate: <b>{Math.round(60 / activeVal)}</b> bucăți / oră</div>
                  </div>
                  <div className="stats-box">
                    ⏱️ Pentru norma de <b>{targetOreZi.toFixed(1)}</b> ore ai nevoie de aproximativ{" "}
                    <b>{Math.round((60 / activeVal) * targetOreZi)}</b> bucăți.
                  </div>
                </>
              );
            })() : (
              <div className="info-box">Selectează o operație din listă.</div>
            )}

            {/* Admin panel */}
            {isAdmin && (
              <AdminPanel
                operatii={operatii}
                editingOp={editingOp}
                onSave={handleSaveOperatie}
                onCancelEdit={() => setEditingOp(null)}
                onAddLine={async (lineName) => {
                  try {
                    await adminAddOperatie(adminPassword, `[CAT:${lineName}] ___INIT___`, 1);
                    await loadOperatii();
                  } catch (e) {
                    console.error("Eroare creare linie:", e);
                  }
                }}
                onDeleteLine={async (lineName) => {
                  setConfirm({
                    open: true,
                    title: "Ștergere Linie",
                    message: `Ești sigur că vrei să ștergi definitiv linia ${lineName} și TOATE operațiile din ea?`,
                    icon: "⚠️",
                    okText: "Da, șterge",
                    variant: "danger",
                    onOk: async () => {
                      setConfirm(c => ({ ...c, open: false }));
                      try {
                        const opsToDelete = operatii.filter(op => {
                          const parsed = parseOperationName(op.denumire);
                          return parsed.category === lineName;
                        });
                        for (const op of opsToDelete) {
                          await adminDeleteOperatie(adminPassword, op.id);
                        }
                        await loadOperatii();
                        if (selectedLine === lineName) {
                          setSelectedLine(null);
                        }
                      } catch (e) {
                        console.error("Eroare stergere linie:", e);
                      }
                    }
                  });
                }}
              />
            )}
            {selectedOp && !isAdmin && (
              <>
                <div>
                  <label className="text-[13px] font-semibold opacity-90 mb-2 block">Număr piese</label>
                  <input
                    className="calc-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="Număr piese"
                    value={piese}
                    onChange={(e) => setPiese(e.target.value.replace(/[^0-9]/g, ""))}
                  />
                </div>

                <button className="btn-primary" onClick={handleAddToDay}>
                  Adaugă în zi
                </button>
              </>
            )}
          </div>

          <DaySummary
            operatiiZi={operatiiZi}
            totalOre={totalOre}
            targetOreZi={targetOreZi}
            onReset={handleResetZi}
            onRemoveOperatie={handleRemoveFromDay}
          />
        </div>
      </div>

      <PasswordModal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handleAdminLogin}
        error={passwordError}
        loading={passwordLoading}
      />

      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        icon={confirm.icon}
        okText={confirm.okText}
        variant={confirm.variant}
        onOk={confirm.onOk}
        onCancel={() => setConfirm((c) => ({ ...c, open: false }))}
      />

      {(!selectedLine || showLineModal) && categories.length > 0 && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => selectedLine && setShowLineModal(false)} />
          <div className="bg-[#1a1b2e] border border-white/10 rounded-[28px] shadow-[0_24px_60px_rgba(0,0,0,0.5)] w-full max-w-sm p-6 relative z-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 max-h-[85vh] flex flex-col">
            <h3 className="text-[20px] font-bold mb-1 text-white">Pe ce linie lucrezi?</h3>
            {selectedLine ? (
               <p className="text-[14px] text-white/50 mb-5">
                 Lucrezi pe linia <b className="text-primary">{selectedLine}</b>.<br/>Alege altă linie la care vrei să te muți.
               </p>
            ) : (
               <p className="text-[14px] text-white/50 mb-5">Alege linia pentru a vedea operațiile specifice.</p>
            )}

            <div className="flex flex-col gap-2.5 overflow-y-auto pr-1 flex-1">
              {categories.filter(cat => cat !== selectedLine).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    if (selectedLine && operatiiZi.length > 0) {
                      setShowLineModal(false);
                      setConfirm({
                        open: true,
                        title: "Schimbare Linie",
                        message: `Ești sigur că vrei să te muți pe linia ${cat}? Progresul tău curent va rămâne salvat pe ${selectedLine}.`,
                        icon: "🔄",
                        okText: "Da, schimbă linia",
                        variant: "primary",
                        onOk: () => {
                          setSelectedLine(cat);
                          setSelectedId(null);
                          setConfirm((c) => ({ ...c, open: false }));
                        }
                      });
                    } else {
                      setSelectedLine(cat);
                      setSelectedId(null);
                      setShowLineModal(false);
                    }
                  }}
                  className="flex items-center gap-3 p-4 rounded-2xl border bg-white/5 hover:bg-white/10 border-white/5 transition-all text-left max-sm:active:scale-[0.98]"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-xl border border-primary/20">
                    {cat.charAt(0)}
                  </div>
                  <div className="flex flex-col text-white">
                    <span className="font-semibold text-[16px]">{cat}</span>
                    <span className="text-xs text-white/50 font-medium">Apasă pentru a începe</span>
                  </div>
                </button>
              ))}

              <button
                onClick={() => {
                  setShowLineModal(false);
                  setConfirm({
                    open: true,
                    title: "În curând! 🚀",
                    message: "Această secțiune este în curs de dezvoltare. În viitor vei putea selecta și gestiona direct de aici și alte linii de producție!",
                    icon: "🚧",
                    okText: "Am înțeles",
                    variant: "primary",
                    onOk: () => setConfirm(c => ({ ...c, open: false }))
                  });
                }}
                className="flex items-center gap-3 p-4 rounded-2xl border bg-white/5 hover:bg-white/10 border-white/5 transition-all text-left max-sm:active:scale-[0.98] opacity-60"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary/70 font-bold text-xl border border-primary/10">
                  ⌛
                </div>
                <div className="flex flex-col text-white">
                  <span className="font-semibold text-[16px] text-white/80">Mai multe linii...</span>
                  <span className="text-xs text-white/40 font-medium">Coming soon</span>
                </div>
              </button>
            </div>
            {selectedLine && (
              <div className="mt-5 flex">
                <button onClick={() => setShowLineModal(false)} className="btn-secondary flex-1">Anulează</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showVariantModal && selectedOp && parseOperationName(selectedOp.denumire).isComplex && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowVariantModal(false)} />
          <div className="bg-[#1a1b2e] border border-white/10 rounded-[28px] shadow-[0_24px_60px_rgba(0,0,0,0.5)] w-full max-w-sm p-6 relative z-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <h3 className="text-[20px] font-bold mb-1 text-white">Ce tip de piesă faci?</h3>
            <p className="text-[14px] text-white/50 mb-5">
              Selectează piesa pentru operația <b>{parseOperationName(selectedOp.denumire).displayName}</b>
            </p>
            <div className="flex flex-col gap-2.5">
              {parseOperationName(selectedOp.denumire).variants?.map((variant) => {
                const fullIconPath = AVAILABLE_ICONS.find(i => i.id === variant.iconId)?.path;
                return (
                  <button
                    key={variant.id}
                    onClick={() => {
                      setSelectedVariantId(variant.id);
                      setShowVariantModal(false);
                    }}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left max-sm:active:scale-[0.98] ${selectedVariantId === variant.id ? 'bg-primary/20 border-primary/50 shadow-sm shadow-primary/10' : 'bg-white/5 hover:bg-white/10 border-white/5'}`}
                  >
                    {fullIconPath ? (
                      <img src={fullIconPath} className="w-10 h-10 object-contain rounded-xl bg-white/5 p-1" />
                    ) : (
                      <div className="w-10 h-10 object-contain rounded-xl bg-white/5 p-1 flex items-center justify-center font-bold text-white/50 text-xl border border-white/10">?</div>
                    )}
                    <div className="flex flex-col text-white">
                      <span className="font-semibold text-[15px]">{variant.nume}</span>
                      <span className="text-xs text-primary/80 font-medium">Valoare: {parseFloat(variant.valoare.replace(",", ".")).toFixed(3)} • {Math.round(60 / parseFloat(variant.valoare.replace(",", ".")))} buc/oră</span>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="mt-5 flex">
              <button
                onClick={() => setShowVariantModal(false)}
                className="btn-secondary flex-1"
              >
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
