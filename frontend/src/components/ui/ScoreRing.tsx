import { scoreColor } from "@/lib/engine/scoring";

export function ScoreRing({ score, size = 120, stroke = 10, label, sub, color }: { score: number | null; size?: number; stroke?: number; label?: string; sub?: string; color?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = score == null ? 0 : Math.max(0, Math.min(100, score)) / 100;
  const col = color ?? scoreColor(score);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--chart-grid)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset 1s cubic-bezier(.22,1,.36,1)", filter: `drop-shadow(0 0 8px ${col}55)` }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="h-display font-bold tabular-nums" style={{ color: col, fontSize: size * 0.28 }}>{score == null ? "—" : Math.round(score)}</span>
          {sub && <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">{sub}</span>}
        </div>
      </div>
      {label && <span className="text-center text-xs font-semibold uppercase tracking-wider text-ink-300">{label}</span>}
    </div>
  );
}
