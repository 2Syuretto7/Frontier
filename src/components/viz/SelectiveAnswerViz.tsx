"use client";

import { useMemo, useState } from "react";

const N = 4000;
const MODELS = ["calibrated", "overconfident"];

function rand(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Questions with a stated confidence c; correct with probability c (calibrated) or c³ (overconfident). */
export function questions(model: number) {
  const u = rand(21);
  return Array.from({ length: N }, () => {
    const c = 0.2 + 0.8 * Math.sqrt(u());
    const pc = model === 0 ? c : c ** 3;
    return { c, ok: u() < pc };
  });
}

export function selectiveStats(qs: { c: number; ok: boolean }[], tau: number) {
  const ans = qs.filter((q) => q.c >= tau);
  const right = ans.filter((q) => q.ok).length;
  return { coverage: ans.length / qs.length, accuracy: ans.length ? right / ans.length : NaN, wrong: (100 * (ans.length - right)) / qs.length };
}

export function SelectiveAnswerViz() {
  const [mi, setMi] = useState(0);
  const [tau, setTau] = useState(0.6);
  const qs = useMemo(() => questions(mi), [mi]);
  const curve = useMemo(() => Array.from({ length: 41 }, (_, k) => selectiveStats(qs, 0.2 + 0.02 * k)), [qs]);
  const s = selectiveStats(qs, tau);
  const W = 320, H = 200, X0 = 40, Y0 = 10, PW = W - X0 - 10, PH = H - Y0 - 34;
  const sx = (c: number) => X0 + c * PW;
  const sy = (a: number) => Y0 + PH - a * PH;
  const pts = curve.filter((p) => p.coverage > 0);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">model</span>
        {MODELS.map((m, i) => (
          <button key={m} type="button" className="seg" aria-pressed={mi === i} onClick={() => setMi(i)}>{m}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="sel-tau">answer only if confidence ≥ {tau.toFixed(2)}</label>
        <input id="sel-tau" type="range" min={0.2} max={0.98} step={0.02} value={tau} onChange={(e) => setTau(Number(e.target.value))} style={{ flex: 1, minWidth: 120 }} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Accuracy of answered questions against the fraction of questions answered">
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={X0} x2={W - 10} y1={sy(v)} y2={sy(v)} stroke="var(--border)" />
            <text x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
            <text x={sx(v)} y={H - 18} textAnchor="middle" className="viz-label">{v}</text>
          </g>
        ))}
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">fraction answered</text>
        <path d={pts.map((p, i) => `${i ? "L" : "M"}${sx(p.coverage).toFixed(1)},${sy(p.accuracy).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {s.coverage > 0 && <circle cx={sx(s.coverage)} cy={sy(s.accuracy)} r={5} fill="var(--danger)" />}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {s.coverage > 0
          ? `answers ${(100 * s.coverage).toFixed(0)}% of questions, ${(100 * s.accuracy).toFixed(1)}% of them right; ${s.wrong.toFixed(1)} wrong answers per 100 questions`
          : "answers nothing"}
      </div>
      <figcaption className="viz-caption">
        Four thousand questions, each with the model&apos;s confidence in its best answer. A model forced to answer
        everything is wrong on every question where its best guess fails, and those wrong answers look as fluent as the
        right ones. Abstaining below a threshold trades coverage for accuracy along the blue curve. For a calibrated model
        the accuracy of answered questions equals their average confidence, so the threshold does what it promises; for
        the overconfident one the same threshold leaves many more confident mistakes.
      </figcaption>
    </figure>
  );
}
