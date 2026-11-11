"use client";

import { useState } from "react";

type R = { date: string; city: string; amount: string };
const RAW: R[] = [
  { date: "2026-11-01", city: " Pune", amount: "₹450" },
  { date: "01/11/2026", city: "pune", amount: "1,200" },
  { date: "2026-11-02", city: "Delhi ", amount: "N/A" },
  { date: "2026-11-03", city: "DELHI", amount: "300" },
  { date: "2026-11-03", city: "DELHI", amount: "300" },
  { date: "2026-11-04", city: "Chennai", amount: "800" },
  { date: "2026-11-04", city: "Mumbai", amount: "7OO" },
];
const STEPS = [
  { name: "Raw file", note: "As loaded. Summing the amounts that happen to parse as numbers, and counting distinct city strings, gives nonsense." },
  { name: "Tidy city names", note: "Strip surrounding spaces and use one capitalisation, so ' Pune', 'pune' and 'Pune' become one city." },
  { name: "Parse amounts", note: "Remove the ₹ sign and thousands commas, then convert. 'N/A' and the typo '7OO' cannot be converted, so they become missing values, marked —, instead of crashing or silently vanishing." },
  { name: "Parse dates", note: "Convert every date to one format, ISO 8601 (year-month-day). 01/11/2026 is read as day/month, which must be confirmed with whoever made the file." },
  { name: "Drop duplicates", note: "Two rows are now identical: the same order entered twice. Keep one." },
  { name: "Handle missing", note: "Drop the rows whose amount is missing, and report how many, so the decision is visible. Now the totals mean something." },
];

const tidy = (s: string) => s.trim().toLowerCase().replace(/^./, (c) => c.toUpperCase());
const parseAmt = (s: string) => { const t = s.replace(/[₹,]/g, ""); return /^\d+(\.\d+)?$/.test(t) ? t : ""; };
const iso = (d: string) => { const m = /^(\d\d)\/(\d\d)\/(\d{4})$/.exec(d); return m ? `${m[3]}-${m[2]}-${m[1]}` : d; };

function apply(step: number): { rows: R[]; changed: Set<string> } {
  let rows = RAW.map((r) => ({ ...r }));
  const changed = new Set<string>();
  if (step >= 1) rows = rows.map((r, i) => { const c = tidy(r.city); if (c !== r.city && step === 1) changed.add(`${i}city`); return { ...r, city: c }; });
  if (step >= 2) rows = rows.map((r, i) => { const a = parseAmt(r.amount); if (a !== r.amount && step === 2) changed.add(`${i}amount`); return { ...r, amount: a }; });
  if (step >= 3) rows = rows.map((r, i) => { const d = iso(r.date); if (d !== r.date && step === 3) changed.add(`${i}date`); return { ...r, date: d }; });
  if (step >= 4) rows = rows.filter((r, i) => rows.findIndex((q) => q.date === r.date && q.city === r.city && q.amount === r.amount) === i);
  if (step >= 5) rows = rows.filter((r) => r.amount !== "");
  return { rows, changed };
}

/** Cleaning a messy table one step at a time, watching the summary numbers become trustworthy. */
export function CleanViz() {
  const [step, setStep] = useState(0);
  const { rows, changed } = apply(step);
  const total = rows.reduce((s, r) => s + (/^\d+(\.\d+)?$/.test(r.amount) ? Number(r.amount) : 0), 0);
  const cities = new Set(rows.map((r) => r.city)).size;
  const missing = rows.filter((r) => r.amount === "").length;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Cleaning step">
          {STEPS.map((s, i) => <button key={s.name} type="button" className="seg" aria-pressed={step === i} onClick={() => setStep(i)}>{i}. {s.name}</button>)}
        </div>
      </div>
      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table className="df-table">
          <thead><tr><th>date</th><th>city</th><th>amount</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {(["date", "city", "amount"] as const).map((k) => (
                  <td key={k} className={changed.has(`${RAW.indexOf(RAW.find((x) => x === RAW[i])!)}${k}`) ? "is-changed" : undefined}>{k === "city" ? <code>&quot;{r[k]}&quot;</code> : r[k] === "" ? "—" : r[k]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ml-stats">
        <div className="ml-stat"><b>{rows.length}</b><span>rows</span></div>
        <div className="ml-stat"><b>{cities}</b><span>distinct cities</span></div>
        <div className="ml-stat"><b>{total.toLocaleString("en-IN")}</b><span>total of numeric amounts</span></div>
        <div className="ml-stat"><b>{step >= 2 ? missing : "?"}</b><span>missing amounts</span></div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">{STEPS[step].note}</figcaption>
    </figure>
  );
}
