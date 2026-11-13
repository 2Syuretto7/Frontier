"use client";

import { useState } from "react";

type Mode = "threads" | "processes";
type Kind = "cpu" | "io";
type State = "cpu" | "io" | "gil" | "start" | "idle";

const WORKERS = 4, TASKS = 8;
const COLOR: Record<State, string> = {
  cpu: "var(--accent)",
  io: "var(--text-faint)",
  gil: "color-mix(in srgb, var(--danger) 35%, transparent)",
  start: "var(--text-muted)",
  idle: "transparent",
};

/** Unit-time simulation: each worker runs its tasks; with threads, only one may run Python at a time. */
function simulate(mode: Mode, kind: Kind) {
  const segs = (): [State, number][] => (kind === "cpu" ? [["cpu", 4]] : [["cpu", 1], ["io", 3]]);
  const queues: [State, number][][] = Array.from({ length: WORKERS }, (_, w) => {
    const q: [State, number][] = mode === "processes" ? [["start", 2]] : [];
    for (let t = w; t < TASKS; t += WORKERS) q.push(...segs());
    return q;
  });
  const rows: State[][] = Array.from({ length: WORKERS }, () => []);
  let turn = 0;
  for (let tick = 0; tick < 100 && queues.some((q) => q.length); tick++) {
    const wantCpu = queues.map((q, w) => (q.length && q[0][0] === "cpu" ? w : -1)).filter((w) => w >= 0);
    let holder = -1;
    if (mode === "threads" && wantCpu.length) {
      holder = wantCpu.find((w) => w >= turn % WORKERS) ?? wantCpu[0];
      turn = holder + 1;
    }
    queues.forEach((q, w) => {
      if (!q.length) { rows[w].push("idle"); return; }
      const [s] = q[0];
      if (s === "cpu" && mode === "threads" && w !== holder) { rows[w].push("gil"); return; }
      rows[w].push(s);
      q[0] = [s, q[0][1] - 1];
      if (q[0][1] === 0) q.shift();
    });
  }
  return rows;
}

export function GilViz() {
  const [mode, setMode] = useState<Mode>("threads");
  const [kind, setKind] = useState<Kind>("cpu");
  const rows = simulate(mode, kind);
  const T = rows[0].length;
  const serial = TASKS * 4;
  const cell = 100 / 34;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className="seg" aria-pressed={kind === "cpu"} onClick={() => setKind("cpu")}>pure-Python arithmetic</button>
        <button type="button" className="seg" aria-pressed={kind === "io"} onClick={() => setKind("io")}>mostly waiting on I/O</button>
        <span style={{ width: 8 }} />
        <button type="button" className="seg" aria-pressed={mode === "threads"} onClick={() => setMode("threads")}>4 threads</button>
        <button type="button" className="seg" aria-pressed={mode === "processes"} onClick={() => setMode("processes")}>4 processes</button>
      </div>
      <svg viewBox="0 0 100 30" style={{ width: "100%", display: "block", margin: "8px 0" }} role="img" aria-label="What each worker does at each moment">
        {rows.map((r, w) =>
          r.map((s, t) => <rect key={`${w}-${t}`} x={t * cell} y={w * 7 + 1} width={cell * 0.92} height={5.5} fill={COLOR[s]} />),
        )}
      </svg>
      <div className="mono" style={{ fontSize: 12, display: "flex", flexWrap: "wrap", gap: "4px 14px", color: "var(--text-muted)" }}>
        {(["cpu", "io", "gil", "start"] as State[]).map((s) => (
          <span key={s}><span style={{ display: "inline-block", width: 10, height: 10, background: COLOR[s], border: "1px solid var(--border)", marginRight: 4 }} />
            {{ cpu: "running Python", io: "waiting on I/O", gil: "waiting for the GIL", start: "process start-up", idle: "" }[s]}</span>
        ))}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Eight tasks take {T} time units, against {kind === "cpu" ? serial : TASKS * 4} one after another.{" "}
        {mode === "threads" && kind === "cpu"
          ? "Only the thread holding the GIL runs Python, so four threads are no faster than one."
          : mode === "threads"
            ? "Threads release the GIL while they wait, so the waits overlap. Threads suit I/O."
            : kind === "cpu"
              ? "Each process has its own interpreter and its own GIL, so the arithmetic really runs in parallel, after paying for start-up."
              : "Processes work too, but cost start-up and memory that threads would not need for waiting."}
      </figcaption>
    </figure>
  );
}
