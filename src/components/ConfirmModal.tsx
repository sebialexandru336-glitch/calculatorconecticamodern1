interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message?: string;
  icon?: string;
  okText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
  onOk: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title = "Confirmare",
  message = "Ești sigur?",
  icon = "🗑️",
  okText = "Da",
  cancelText = "Nu",
  variant = "danger",
  onOk,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div
          className={`w-[50px] h-[50px] rounded-[18px] flex items-center justify-center border mb-2.5 text-[22px] ${
            variant === "danger"
              ? "bg-[rgba(239,68,68,0.12)] border-[rgba(239,68,68,0.25)]"
              : "bg-muted border-border"
          }`}
        >
          {icon}
        </div>
        <div className="font-extrabold text-[17px] mb-1">{title}</div>
        <div className="opacity-90 text-sm leading-snug">{message}</div>
        <div className="flex gap-2.5 mt-3.5">
          <button className="btn-secondary flex-1" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={`flex-1 ${variant === "danger" ? "btn-danger" : "btn-primary"}`}
            onClick={onOk}
          >
            {okText}
          </button>
        </div>
      </div>
    </div>
  );
}
