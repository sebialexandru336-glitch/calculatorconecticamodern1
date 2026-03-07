import type { OperatieZi } from "@/types/operatie";
import { Trash2 } from "lucide-react";
interface DaySummaryProps {
  operatiiZi: OperatieZi[];
  totalOre: number;
  targetOreZi: number;
  onReset: () => void;
  onRemoveOperatie: (index: number) => void;
}

export default function DaySummary({ operatiiZi, totalOre, targetOreZi, onReset, onRemoveOperatie }: DaySummaryProps) {
  const procent = targetOreZi > 0 ? (totalOre / targetOreZi) * 100 : 0;

  return (
    <div className="glass-card flex flex-col gap-4">
      <div>
        <h2 className="font-bold text-xl">Total Zi</h2>
      </div>

      <div className="grid grid-cols-3 gap-2.5 max-[720px]:grid-cols-1">
        <div className="summary-item">
          <span className="text-xs text-muted-foreground block mb-1.5">Total ore</span>
          <div className="text-xl font-extrabold tracking-tight">{totalOre.toFixed(2)}</div>
        </div>
        <div className="summary-item">
          <span className="text-xs text-muted-foreground block mb-1.5">Procent normă</span>
          <div className="text-xl font-extrabold tracking-tight">{procent.toFixed(1)}%</div>
        </div>
        <div className="summary-item">
          <span className="text-xs text-muted-foreground block mb-1.5">Operații azi</span>
          <div className="text-xl font-extrabold tracking-tight">{operatiiZi.length}</div>
        </div>
      </div>

      <div className="text-base leading-relaxed opacity-95">
        Total: <b>{totalOre.toFixed(2)}</b> ore
        <br />
        Procent normă: <b>{procent.toFixed(1)}%</b> din {targetOreZi.toFixed(1)} ore
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${Math.min(procent, 150)}%` }}
        />
      </div>

      <div className="flex flex-col gap-2.5 mt-2">
        {operatiiZi.map((op, i) => (
          <div key={i} className="op-list-item">
            <div className="flex justify-between gap-2.5 items-start mb-1.5">
              <div className="font-bold">
                {i + 1}. {op.denumire}
              </div>
              <div className="flex items-center gap-2">
                <div className="list-badge">{op.valoare.toFixed(3)}</div>
                <button
                  className="icon-btn-delete"
                  style={{ width: "32px", height: "32px", borderRadius: "10px" }}
                  onClick={() => onRemoveOperatie(i)}
                  title="Șterge din zi"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div>
              {op.piese} piese → <b>{op.ore.toFixed(2)} ore</b>
            </div>
            <div className="text-muted-foreground">{op.bucOra.toFixed(0)} buc/oră</div>
          </div>
        ))}
      </div>

      <button className="btn-danger" onClick={onReset}>
        Reset Zi
      </button>

    </div>
  );
}
