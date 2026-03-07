import { useState } from "react";

interface PasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  error?: string;
  loading?: boolean;
}

export default function PasswordModal({ open, onClose, onSubmit, error, loading }: PasswordModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(password);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="w-[50px] h-[50px] rounded-[18px] flex items-center justify-center bg-muted border border-border mb-2.5 text-[22px]">
          🔒
        </div>
        <div className="font-extrabold text-[17px] mb-1">Autentificare Admin</div>
        <div className="opacity-90 text-sm leading-snug">Introdu parola pentru a activa panoul de admin.</div>
        <form onSubmit={handleSubmit}>
          <div className="mt-3 flex gap-2.5 items-center">
            <input
              className="calc-input flex-1"
              type={showPassword ? "text" : "password"}
              placeholder="Parola"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="current-password"
            />
            <button
              type="button"
              className="w-[46px] h-[46px] rounded-[14px] flex items-center justify-center bg-muted border border-border text-lg cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
          {error && (
            <div className="min-h-[18px] mt-2.5 text-xs text-red-300/95">{error}</div>
          )}
          <div className="flex gap-2.5 mt-3.5">
            <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={loading}>
              Anulează
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? "Se verifică..." : "Intră"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
