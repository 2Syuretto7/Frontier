"use client";

import { useState } from "react";

const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41];

function factor(n: number) {
  const out: number[] = [];
  for (let d = 2; d * d <= n; d++) {
    while (n % d === 0) { out.push(d); n /= d; }
  }
  if (n > 1) out.push(n);
  return out;
}

const fmt = (n: number) => n.toLocaleString("en-IN");

/** Euclid's argument: multiply any finite list of primes, add one, and the result has a prime factor not on the list. */
export function EuclidViz() {
  const [list, setList] = useState<number[]>([2, 3, 5, 7, 11, 13]);
  const toggle = (p: number) => setList(list.includes(p) ? list.filter((q) => q !== p) : [...list, p].sort((x, y) => x - y));
  const N = list.reduce((a, b) => a * b, 1) + 1;
  const fs = factor(N);
  const isPrime = fs.length === 1;

  return (
    <figure className="viz">
      <p className="viz-stepper-label" style={{ margin: "0 0 8px" }}>Your list of primes (click to add or remove):</p>
      <div className="viz-remainders">
        {PRIMES.map((p) => (
          <button key={p} type="button" className={`viz-chip mono ${list.includes(p) ? "is-on" : ""}`} style={{ cursor: "pointer" }} aria-pressed={list.includes(p)} onClick={() => toggle(p)}>{p}</button>
        ))}
      </div>
      <table className="table" style={{ marginTop: 16, marginBottom: 8 }}>
        <tbody>
          <tr><td>N = product of the list + 1</td><td className="mono">{list.length ? list.join(" · ") : "1"} + 1 = {fmt(N)}</td></tr>
          <tr><td>Prime factors of N</td><td className="mono">{fs.length ? fs.map(fmt).join(" · ") : "none: N = 1"}</td></tr>
          <tr>
            <td>A prime not on your list</td>
            <td className={`viz-verdict viz-verdict-${fs.length ? "info" : "wrong"}`}>{fs.length ? fmt(fs[0]) : "add a prime to start"}</td>
          </tr>
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        {list.length === 0
          ? <>With an empty list the product is 1 and N is 2, itself a prime not on the list.</>
          : <>Every prime on the list divides the product, so it leaves remainder 1 when it divides N. So no prime on the list divides N, and any prime factor of N is new. {isPrime ? <>Here N happens to be prime itself.</> : <>Notice that N need not be prime: what matters is that its prime factors are new.</>}</>}
      </figcaption>
    </figure>
  );
}
