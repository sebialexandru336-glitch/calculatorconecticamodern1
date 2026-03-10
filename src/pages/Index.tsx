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
import { parseOperationName } from "@/lib/iconMap";

const STORAGE_DAY = "ziCurenta_v2";
const TARGET_DEFAULT = 7.5;

export default function Index() {
  const [operatii, setOperatii] = useState<Operatie[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [piese, setPiese] = useState("");
  const [targetOreZi, setTargetOreZi] = useState(TARGET_DEFAULT);

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [editingOp, setEditingOp] = useState<Operatie | null>(null);

  // Day state
  const [operatiiZi, setOperatiiZi] = useState<OperatieZi[]>([]);
  const [totalOre, setTotalOre] = useState(0);

  // Confirm modal
  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    icon: string;
    okText: string;
    variant: "danger" | "primary";
    onOk: () => void;
  }>({ open: false, title: "", message: "", icon: "", okText: "", variant: "danger", onOk: () => {} });

  // Load operatii from DB
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

  // Load day from localStorage
  useEffect(() => {
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

  // Save day to localStorage
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

  // Admin login
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

  // Add operation to day
  const handleAddToDay = () => {
    const p = parseInt(piese.replace(/[^0-9]/g, ""), 10);
    if (!selectedOp || isNaN(p) || p <= 0) return;

    const bucOra = 60 / selectedOp.valoare;
    const ore = p / bucOra;

    setTotalOre((prev) => prev + ore);
    setOperatiiZi((prev) => [
      {
        denumire: selectedOp.denumire,
        valoare: selectedOp.valoare,
        piese: p,
        ore,
        bucOra,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
    setPiese("");
  };

  // Remove operation from day
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

  // Admin: save operatie (add or update)
  const handleSaveOperatie = async (denumire: string, valoare: number) => {
    try {
      if (editingOp) {
        await adminUpdateOperatie(adminPassword, editingOp.id, denumire, valoare);
        setEditingOp(null);
      } else {
        await adminAddOperatie(adminPassword, denumire, valoare);
      }
      await loadOperatii();
    } catch (e: any) {
      console.error("Save error:", e);
    }
  };

  // Admin: delete operatie
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
        } catch (e: any) {
          console.error("Delete error:", e);
        }
        setConfirm((c) => ({ ...c, open: false }));
      },
    });
  };

  // Reset day
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
        {/* Top bar */}
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

        {/* Grid */}
        <div className="grid grid-cols-[1.03fr_0.97fr] gap-[22px] max-[980px]:grid-cols-1">
          {/* Left: Operations */}
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
                onSelect={(op) => setSelectedId(op.id)}
                onEdit={(op) => setEditingOp(op)}
                onDelete={handleDeleteOperatie}
              />
            </div>

            {/* Info about selected op */}
            {selectedOp ? (() => {
              const parsed = parseOperationName(selectedOp.denumire);
              return (
              <>
                <div className="info-box">
                  <span className="flex items-center gap-2 mb-1.5 font-semibold text-primary/90 text-lg">
                    {parsed.iconPath && <img src={parsed.iconPath} className="w-7 h-7 object-contain rounded-sm" />} 
                    {parsed.displayName}
                  </span>
                  📊 Productivitate: <b>{Math.round(60 / selectedOp.valoare)}</b> bucăți / oră
                </div>
                <div className="stats-box">
                  ⏱️ Pentru norma de <b>{targetOreZi.toFixed(1)}</b> ore ai nevoie de aproximativ{" "}
                  <b>{Math.round((60 / selectedOp.valoare) * targetOreZi)}</b> bucăți.
                </div>
              </>
            );
            })() : (
              <div className="info-box">Selectează o operație ca să vezi productivitatea.</div>
            )}



            {/* Admin panel */}
            {isAdmin && (
              <AdminPanel
                editingOp={editingOp}
                onSave={handleSaveOperatie}
                onCancelEdit={() => setEditingOp(null)}
              />
            )}

            {/* Pieces input */}
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

          {/* Right: Day summary */}
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
    </div>
  );
}
