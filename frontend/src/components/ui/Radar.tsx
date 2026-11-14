import { DIMENSIONS } from "@/lib/engine/types";

export function Radar({ values, size = 300, compare }: { values: Record<string, number | null>; size?: number; compare?: Record<string, number | null> }) {
  const cx = size / 2, cy = size / 2, R = size / 2 - 46;
  const n = DIMENSIONS.length;
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(a) * R * (v / 100), cy + Math.sin(a) * R * (v / 100)];
  };
  const poly = (vals: Record<string, number | null>) => DIMENSIONS.map((d, i) => pt(i, vals[d.key] ?? 0).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full max-w-[340px]" role="img" aria-label="Trust dimension radar">
      {[25, 50, 75, 100].map((l) => (
        <polygon key={l} points={DIMENSIONS.map((_, i) => pt(i, l).join(",")).join(" ")} fill="none" stroke="rgb(255 255 255 / 0.07)" />
      ))}
      {DIMENSIONS.map((_, i) => {
        const [x, y] = pt(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgb(255 255 255 / 0.06)" />;
      })}
      {compare && <polygon points={poly(compare)} fill="rgb(148 160 186 / 0.08)" stroke="rgb(148 160 186 / 0.5)" strokeDasharray="4 4" />}
      <polygon points={poly(values)} fill="rgb(99 102 241 / 0.22)" stroke="#818cf8" strokeWidth={2} style={{ filter: "drop-shadow(0 0 10px rgb(99 102 241 / .5))" }} />
      {DIMENSIONS.map((d, i) => {
        const v = values[d.key];
        const [x, y] = pt(i, v ?? 0);
        const [lx, ly] = pt(i, 122);
        return (
          <g key={d.key}>
            {v != null && <circle cx={x} cy={y} r={3.5} fill="#22d3ee" />}
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="fill-ink-300" style={{ fontSize: 10.5, fontWeight: 600 }}>
              {d.short}
            </text>
            <text x={lx} y={ly + 13} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 10, fontWeight: 700 }} className={v == null ? "fill-ink-500" : "fill-ink-100"}>
              {v == null ? "untested" : Math.round(v)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
