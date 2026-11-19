import type { CurveSet } from "@/content/gym/curves";

const W = 640;
const H = 260;
const PAD = { left: 56, right: 16, top: 16, bottom: 36 };
const COLOURS = ["var(--accent)", "var(--code-number)", "var(--success)"];

const fmt = (v: number) => {
  const a = Math.abs(v);
  if (a === 0) return "0";
  if (a >= 1e4 || a < 1e-3) return v.toExponential(0).replace("e+", "e");
  return Number(v.toPrecision(2)).toString();
};

/** The symptom chart: the buggy script's logged curves, drawn from its own output. */
export function LossChart({ title, curves, log = false }: { title: string; curves: CurveSet; log?: boolean }) {
  const ys = curves.series.flatMap((s) => s.y).filter((v): v is number => v !== null && (!log || v > 0));
  if (curves.floor) ys.push(curves.floor.value);
  const xs = curves.series.flatMap((s) => s.x);
  if (!ys.length || !xs.length) return null;
  const tf = (v: number) => (log ? Math.log10(v) : v);
  let lo = Math.min(...ys.map(tf));
  let hi = Math.max(...ys.map(tf));
  if (!log) lo = Math.min(0, lo);
  if (hi - lo < 1e-9) hi = lo + 1;
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs) || 1;
  const px = (x: number) => PAD.left + ((x - x0) / (x1 - x0 || 1)) * (W - PAD.left - PAD.right);
  const py = (y: number) => PAD.top + (1 - (tf(y) - lo) / (hi - lo)) * (H - PAD.top - PAD.bottom);

  const ticks = log
    ? Array.from({ length: Math.floor(hi) - Math.ceil(lo) + 1 }, (_, i) => 10 ** (Math.ceil(lo) + i)).filter((_, i, a) => a.length <= 6 || i % Math.ceil(a.length / 6) === 0)
    : Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4);
  const xticks = Array.from({ length: 5 }, (_, i) => Math.round(x0 + ((x1 - x0) * i) / 4));

  return (
    <figure className="gym-chart">
      <figcaption className="eyebrow">{title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}: ${curves.series.map((s) => s.label).join(", ")}`}>
        {ticks.map((t) => (
          <g key={`y${t}`}>
            <line x1={PAD.left} x2={W - PAD.right} y1={py(t)} y2={py(t)} className="gym-chart-grid" />
            <text x={PAD.left - 8} y={py(t) + 4} textAnchor="end" className="gym-chart-tick">{fmt(t)}</text>
          </g>
        ))}
        {xticks.map((t) => (
          <text key={`x${t}`} x={px(t)} y={H - PAD.bottom + 18} textAnchor="middle" className="gym-chart-tick">{t}</text>
        ))}
        <text x={(PAD.left + W - PAD.right) / 2} y={H - 4} textAnchor="middle" className="gym-chart-tick">step</text>
        {curves.floor && (
          <g>
            <line x1={PAD.left} x2={W - PAD.right} y1={py(curves.floor.value)} y2={py(curves.floor.value)} className="gym-chart-floor" />
            <text x={W - PAD.right} y={py(curves.floor.value) - 6} textAnchor="end" className="gym-chart-tick">{curves.floor.label}: {fmt(curves.floor.value)}</text>
          </g>
        )}
        {curves.series.map((s, i) => {
          const pts = s.x.map((x, j) => [x, s.y[j]] as const).filter(([, y]) => y !== null && (!log || y > 0)) as [number, number][];
          return (
            <g key={s.label}>
              <polyline points={pts.map(([x, y]) => `${px(x).toFixed(1)},${py(y).toFixed(1)}`).join(" ")} fill="none" stroke={COLOURS[i % COLOURS.length]} strokeWidth={2} />
              {pts.length <= 3 && pts.map(([x, y]) => <circle key={x} cx={px(x)} cy={py(y)} r={3} fill={COLOURS[i % COLOURS.length]} />)}
            </g>
          );
        })}
      </svg>
      <ul className="gym-chart-legend">
        {curves.series.map((s, i) => (
          <li key={s.label}><span className="gym-chart-swatch" style={{ background: COLOURS[i % COLOURS.length] }} aria-hidden="true" />{s.label}</li>
        ))}
      </ul>
    </figure>
  );
}
