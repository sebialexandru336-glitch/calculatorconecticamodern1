import { useState, useEffect, useCallback } from "react";
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
  const [operatii, setOperatii] = useState<Operatie[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [piese, setPiese] = useState("");
  const [targetOreZi, setTargetOreZi] = useState(TARGET_DEFAULT);

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [editingOp, setEditingOp] = useState<Operatie | null>(null);

  const [operatiiZi, setOperatiiZi] = useState<OperatieZi[]>([]);
  const [totalOre, setTotalOre] = useState(0);

  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    icon: string;
    okText: string;
    variant: "danger" | "primary";
    onOk: () => void;
  }>({ open: false, title: "", message: "", icon: "", okText: "", variant: "danger", onOk: () => {} });

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

  const loadDay = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_DAY);
      if (!raw) return;
      const payload = JSON.parse(raw);
      if (payload) {
        setTotalOre(Number(payload.totalOre) || 0);
        setOperatiiZi(Array.isArray(payload.operatiiZi) ? payload.operatiiZi : []);
        setSelectedId(payload.selectedId || null);
        setTargetOreZi(Number(payload.targetOreZi) > 0 ? Number(payload.targetOreZi) : TARGET_DEFAULT);
      }
    } catch (e) {
      console.warn("Cannot load day:", e);
    }
  }, []);

  const saveDay = useCallback(() => {
    try {
      localStorage.setItem(
        STORAGE_DAY,
        JSON.stringify({ totalOre, operatiiZi, selectedId, targetOreZi })
      );
    } catch (e) {
      console.warn("Cannot save day:", e);
    }
  }, [totalOre, operatiiZi, selectedId, targetOreZi]);

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

  const selectedOp = operatii.find((o) => o.id === selectedId) || null;

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

  const handleRemoveFromDay = (index: number) => {
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
  };

  const handleSaveOperatie = async (denumire: string, valoare: number) => {
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
  };

  const handleDeleteOperatie = (op: Operatie) => {
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
  };

  const handleResetZi = () => {
    setConfirm({
      open: true,
      title: "Reset zi",
      message: "Ești sigur că vrei să resetezi ziua? Se vor șterge toate operațiile adăugate azi.",
      icon: "⚠️",
      okText: "Da, resetează",
      variant: "danger",
      onOk: () => {
        setTotalOre(0);
        setOperatiiZi([]);
        setConfirm((c) => ({ ...c, open: false }));
      },
    });
  };



  return (
    <div className="relative min-h-screen flex justify-center items-start py-7 px-3.5 max-[980px]:items-start">
      <div className="bg-blobs" />

      <div className="w-full max-w-[1120px] relative z-10">
        <div className="flex justify-between items-center gap-3.5 mb-6 max-[720px]:flex-col max-[720px]:items-start">
          <div className="flex flex-col gap-2">

            <h1 className="text-[30px] font-extrabold leading-tight tracking-tight max-[980px]:text-[26px]">
              Calculator Ore Conectica
            </h1>

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
            <CalculatorWidget onTransfer={(val) => setPiese(val)} />

            <div>
              <label className="text-[13px] font-semibold opacity-90 mb-2 block">Alege operația</label>
              <OperatiiDropdown
                operatii={operatii}
                selectedId={selectedId}
                isAdmin={isAdmin}
                onSelect={(op) => {
                  setSelectedId(op.id);
                  const parsed = parseOperationName(op.denumire);
                  if (parsed.isComplex) {
                    setSelectedVariantId(null);
                    setShowVariantModal(true);
                  } else {
                    setSelectedVariantId(null);
                  }
                  setPiese("");
                }}
                onEdit={(op) => setEditingOp(op)}
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
                editingOp={editingOp}
                onSave={handleSaveOperatie}
                onCancelEdit={() => setEditingOp(null)}
              />
            )}

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
               )})}
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
