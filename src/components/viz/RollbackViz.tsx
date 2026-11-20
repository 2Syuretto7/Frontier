"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const END = 1000, SPIKE = 680, DETECT = 686, MARGIN = 50;

type Mode = "ignore" | "lower" | "rollback";

const base = (s: number) => 2.3 + 3 * Math.pow(s + 30, -0.4) * 2.2;

/**
 * A synthetic run that hits an instability at step 680. Returns, for each executed step, the training step it was at,
 * its loss, and whether that work was later thrown away by a rollback.
 */
export function simulate(mode: Mode, interval: number) {
  const r = rand(23);
  const noise = () => 0.03 * (r() + r() + r() - 1.5) * 2;
  const out: { step: number; loss: number; discarded: boolean }[] = [];
  const restart = Math.floor((SPIKE - MARGIN) / interval) * interval;
  for (let s = 0; s < DETECT; s++) {
    let extra = 0;
    if (s >= SPIKE) extra = 1.6 * (1 - Math.exp(-(s - SPIKE + 1) / 1.5));
    out.push({ step: s, loss: base(s) + extra + noise(), discarded: mode === "rollback" && s >= restart });
  }
  if (mode === "rollback") {
    for (let s = restart; s < END; s++) out.push({ step: s, loss: base(s) + noise(), discarded: false });
    return out;
  }
  for (let s = DETECT; s < END; s++) {
    const t = s - DETECT;
    let extra = 1.5 * Math.exp(-t / 25);
    if (mode === "ignore") {
      extra += 0.08;
      if (s >= 800) extra += 1.4 * (1 - Math.exp(-(s - 800) / 30));
    } else {
      extra += 0.08 + 0.00025 * t;
    }
    out.push({ step: s, loss: base(s) + extra + noise(), discarded: false });
  }
  return out;
}

const LABEL: Record<Mode, string> = { ignore: "carry on", lower: "halve LR", rollback: "roll back and skip" };

export function RollbackViz() {
  const [mode, setMode] = useState<Mode>("rollback");
  const [interval, setInterval] = useState(100);
  const run = useMemo(() => simulate(mode, interval), [mode, interval]);
  const ref = useMemo(() => Array.from({ length: END }, (_, s) => base(s)), []);
  const XMAX = 1200;
  const W = 330, H = 200, X0 = 34, PW = 286, Y0 = 8, PH = 160, LMIN = 2.4, LMAX = 4.4;
  const px = (i: number) => X0 + (i / XMAX) * PW;
  const py = (v: number) => Y0 + PH - ((Math.min(LMAX, Math.max(LMIN, v)) - LMIN) / (LMAX - LMIN)) * PH;
  const seg = (keep: (d: { discarded: boolean }) => boolean) => {
    const parts: string[][] = [];
    let prev = -10;
    run.forEach((d, i) => {
      if (!keep(d) || (i % 3 !== 0 && i !== DETECT - 1)) return;
      if (i - prev > 3) parts.push([]);
      parts[parts.length - 1].push(`${px(i).toFixed(1)},${py(d.loss).toFixed(1)}`);
      prev = i;
    });
    return parts.map((p) => p.join(" "));
  };
  const last = run[run.length - 1];
  const final = run.slice(-20).reduce((a, d) => a + d.loss, 0) / 20;
  const finalRef = ref.slice(-20).reduce((a, v) => a + v, 0) / 20;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Response to the spike">
          {(Object.keys(LABEL) as Mode[]).map((m) => (
            <button key={m} className="seg" aria-pressed={mode === m} onClick={() => setMode(m)}>{LABEL[m]}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Checkpoint interval">
          {[100, 250].map((c) => (
            <button key={c} className="seg" aria-pressed={interval === c} onClick={() => setInterval(c)}>checkpoint every {c}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Loss against executed steps around a loss spike">
        {[2.5, 3.0, 3.5, 4.0].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 4} y={py(v) + 3} textAnchor="end" className="viz-label">{v.toFixed(1)}</text>
          </g>
        ))}
        <polyline points={ref.filter((_, s) => s % 3 === 0).map((v, j) => `${px(j * 3).toFixed(1)},${py(v).toFixed(1)}`).join(" ")} fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" />
        {seg((d) => d.discarded).map((p, k) => <polyline key={`d${k}`} points={p} fill="none" stroke="var(--danger)" strokeWidth={1.2} />)}
        {seg((d) => !d.discarded).map((p, k) => <polyline key={`k${k}`} points={p} fill="none" stroke="var(--accent)" strokeWidth={1.4} />)}
        <line x1={px(DETECT)} x2={px(DETECT)} y1={Y0} y2={Y0 + PH} stroke="var(--danger)" strokeDasharray="2 3" strokeWidth={0.8} />
        <text x={px(DETECT) + 3} y={Y0 + 10} className="viz-label" style={{ fill: "var(--danger)" }}>spike detected</text>
        <text x={X0} y={H - 18} className="viz-label">executed steps, 0 to 1,200</text>
        <text x={X0} y={H - 4} className="viz-label">dashed: run without a spike; red: work thrown away</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {LABEL[mode]}: {run.length} steps executed to reach step {last.step + 1}; final loss {final.toFixed(2)} against {finalRef.toFixed(2)} without a spike
      </div>
      <figcaption className="viz-caption">
        A synthetic run hits an instability at step 680. Carrying on leaves the loss damaged and a second, worse event follows;
        halving the learning rate recovers but trains more slowly from then on. Rolling back to a checkpoint before the spike and
        skipping the next stretch of data costs the steps between that checkpoint and the detection, more with sparser
        checkpoints, and returns the run to its expected curve.
      </figcaption>
    </figure>
  );
}
