"use client";

import { useMemo, useState } from "react";
import { leastSquares, makeNormal, makeRng } from "./ml";

type Pick = "rooms" | "size" | "both";
const LABEL: Record<Pick, string> = { rooms: "Rooms only", size: "Size only", both: "Size and rooms" };

/** Fit flat prices on rooms, on size, or on both, and watch the coefficient of rooms change. */
export function CoefViz() {
  const [pick, setPick] = useState<Pick>("rooms");
  const fits = useMemo(() => {
    const r = makeRng(11), g = makeNormal(r);
    const rows = Array.from({ length: 200 }, () => {
      const size = 40 + 90 * r();
      const rooms = Math.max(1, Math.min(5, Math.round(size / 30 + 0.5 * g())));
      const price = 0.9 * size - 3 * rooms + 6 * g();
      return { size, rooms, price };
    });
    const y = rows.map((d) => d.price);
    return {
      rooms: leastSquares(rows.map((d) => [1, d.rooms]), y),
      size: leastSquares(rows.map((d) => [1, d.size]), y),
      both: leastSquares(rows.map((d) => [1, d.size, d.rooms]), y),
    };
  }, []);
  const w = fits[pick];
  const coefSize = pick === "size" ? w[1] : pick === "both" ? w[1] : null;
  const coefRooms = pick === "rooms" ? w[1] : pick === "both" ? w[2] : null;
  const f = (v: number | null) => (v === null ? "not in model" : `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}`);
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Features in the model">
        {(Object.keys(LABEL) as Pick[]).map((k) => (
          <button key={k} type="button" className="seg" aria-pressed={pick === k} onClick={() => setPick(k)}>{LABEL[k]}</button>
        ))}
      </div>
      <table className="table" style={{ marginTop: 12, marginBottom: 0 }}>
        <thead><tr><th>coefficient</th><th>value (&#8377; lakh)</th></tr></thead>
        <tbody>
          <tr><td>intercept</td><td className="mono">{w[0].toFixed(2)}</td></tr>
          <tr><td>per m² of size</td><td className="mono">{f(coefSize)}</td></tr>
          <tr><td>per extra room</td><td className="mono">{f(coefRooms)}</td></tr>
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        {pick === "rooms" && "On its own, each extra room seems to add many lakh, because flats with more rooms are bigger, and size is what buyers pay for."}
        {pick === "size" && "Size alone explains most of the price, at about 0.77 lakh per square metre. That is below the 0.9 used to make the data, because bigger flats also tend to have more rooms, and here each room lowers the price."}
        {pick === "both" && "With size held fixed, an extra room now costs money: the same area cut into more, smaller rooms is worth slightly less. The coefficient of rooms changed sign, though the data did not change."}
      </figcaption>
    </figure>
  );
}
