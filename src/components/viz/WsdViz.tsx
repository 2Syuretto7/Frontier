"use client";

import { useMemo, useState } from "react";

const T = 10000, WARM = 500, L0 = 2.0, A = 8, AL = 0.4, C = 5e-5, LAM = 0.999;

type Kind = "cosine" | "linear" | "sqrt" | "constant";

/** Learning-rate schedule with peak 1 over `total` steps. */
export function lrAt(step: number, total: number, kind: Kind, frac: number) {
  if (step < WARM) return (step + 1) / WARM;
  if (kind === "cosine") {
    const x = (step - WARM) / (total - WARM);
    return 0.1 + 0.9 * 0.5 * (1 + Math.cos(Math.PI * x));
  }
  const start = total - Math.floor(frac * total);
  if (kind === "constant" || step < start) return 1;
  const x = (step - start) / (total - start);
  return kind === "linear" ? 1 - x : 1 - Math.sqrt(x);
}

/** Loss along a schedule from L = L0 + A·S1^(−α) − C·S2, with S1 the summed learning rate and S2 the momentum-smoothed annealing area. */
export function lossCurve(lrs: number[]) {
  const out: number[] = [];
  let s1 = 0, m = 0, s2 = 0, peakSeen = false;
  for (let i = 0; i < lrs.length; i++) {
    s1 += lrs[i];
    if (i > 0 && peakSeen) { m = LAM * m + (lrs[i - 1] - lrs[i]); s2 += m; }
    if (lrs[i] >= 1) peakSeen = true;
    out.push(L0 + A * Math.pow(s1, -AL) - C * s2);
  }
  return out;
}

const LABEL: Record<Kind, string> = { cosine: "cosine", linear: "WSD linear", sqrt: "WSD 1−√", constant: "constant" };

export function WsdViz() {
  const [kind, setKind] = useState<Kind>("sqrt");
  const [frac, setFrac] = useState(0.2);
  const sched = (k: Kind, total: number) => Array.from({ length: total }, (_, s) => lrAt(s, total, k, frac));
  const main = useMemo(() => sched(kind, T), [kind, frac]); // eslint-disable-line react-hooks/exhaustive-deps
  const cos = useMemo(() => sched("cosine", T), [frac]); // eslint-disable-line react-hooks/exhaustive-deps
  const loss = useMemo(() => lossCurve(main), [main]);
  const lossCos = useMemo(() => lossCurve(cos), [cos]);
  const branches = useMemo(() => (kind === "linear" || kind === "sqrt" ? [5000, 7500].map((b) => lossCurve(sched(kind, b))) : []), [kind, frac]); // eslint-disable-line react-hooks/exhaustive-deps
  const W = 330, H = 220, X0 = 34, PW = 286, Y1 = 8, H1 = 50, Y2 = 74, H2 = 110;
  const px = (s: number) => X0 + (s / T) * PW;
  const pl = (v: number) => Y1 + H1 - v * H1;
  const LMIN = 2.17, LMAX = 2.37;
  const py = (v: number) => Y2 + H2 - ((Math.min(LMAX, Math.max(LMIN, v)) - LMIN) / (LMAX - LMIN)) * H2;
  const pts = (ys: number[], f: (v: number) => number, clip = false) => ys.map((v, i) => [i, v] as const).filter(([i, v]) => (i % 50 === 0 || i === ys.length - 1) && (!clip || v <= LMAX)).map(([i, v]) => `${px(i).toFixed(1)},${f(v).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Schedule">
          {(Object.keys(LABEL) as Kind[]).map((k) => (
            <button key={k} className="seg" aria-pressed={kind === k} onClick={() => setKind(k)}>{LABEL[k]}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Decay fraction">
          {[0.1, 0.2].map((f) => (
            <button key={f} className="seg" aria-pressed={frac === f} onClick={() => setFrac(f)}>decay {f * 100}%</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Learning-rate schedule and predicted loss curve">
        <text x={X0 - 4} y={pl(1) + 3} textAnchor="end" className="viz-label">η</text>
        <polyline points={pts(cos, pl)} fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" />
        <polyline points={pts(main, pl)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {[2.2, 2.25, 2.3, 2.35].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 4} y={py(v) + 3} textAnchor="end" className="viz-label">{v.toFixed(2)}</text>
          </g>
        ))}
        <polyline points={pts(lossCos, py, true)} fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" />
        {branches.map((b, i) => <polyline key={i} points={pts(b, py, true)} fill="none" stroke="var(--code-function)" strokeWidth={1.4} />)}
        <polyline points={pts(loss, py, true)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <text x={X0} y={H - 2} className="viz-label">steps; dashed: cosine; thin: decays branched off earlier</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {LABEL[kind]}{kind === "linear" || kind === "sqrt" ? `, decay over the last ${frac * 100}%` : ""}: final loss {loss[T - 1].toFixed(4)} against {lossCos[T - 1].toFixed(4)} for cosine
      </div>
      <figcaption className="viz-caption">
        Learning rate (top) and the loss predicted by a fitted annealing law (bottom) over 10,000 steps. With a constant rate the
        loss stalls above where a decay would take it; cosine lowers the rate throughout. Warmup-stable-decay holds the peak rate
        and then drops sharply: the loss sits higher during the stable phase and falls fast in the decay. Because the stable
        phase does not depend on the total length, decays can branch off at any checkpoint, giving finished models for several
        budgets from one run.
      </figcaption>
    </figure>
  );
}
