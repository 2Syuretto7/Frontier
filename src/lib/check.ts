import type { Answer } from "./types";

export type CheckResult = { correct: boolean; message?: string };

/** Parses "3", "-2.5", "3/4", "1e3" (spaces and thousands commas ignored). */
export function parseNumber(input: string): number | null {
  const s = input.replace(/[\s,]/g, "");
  if (/^[-+]?\d+\/\d+$/.test(s)) {
    const [a, b] = s.split("/").map(Number);
    return b === 0 ? null : a / b;
  }
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return null;
  return Number(s);
}

// ---------- A small, safe expression evaluator (no eval). ----------

type Node =
  | { t: "num"; v: number }
  | { t: "var"; name: string }
  | { t: "neg"; a: Node }
  | { t: "bin"; op: "+" | "-" | "*" | "/" | "^"; a: Node; b: Node }
  | { t: "fn"; name: string; a: Node };

const FUNCTIONS: Record<string, (x: number) => number> = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan, exp: Math.exp, ln: Math.log, log: Math.log10,
  sqrt: Math.sqrt, abs: Math.abs, arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan,
};
const CONSTANTS: Record<string, number> = { pi: Math.PI, e: Math.E };

function tokenize(src: string, variables: readonly string[]): string[] {
  const s = src.replace(/\*\*/g, "^").replace(/π/g, "pi").replace(/·|×/g, "*").replace(/−/g, "-");
  const names = [...Object.keys(FUNCTIONS), ...Object.keys(CONSTANTS), ...variables].sort((a, b) => b.length - a.length);
  const out: string[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    const num = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
    if (num) { out.push(num[0]); i += num[0].length; continue; }
    if ("+-*/^()".includes(c)) { out.push(c); i++; continue; }
    const name = names.find((n) => s.startsWith(n, i));
    if (name) { out.push(name); i += name.length; continue; }
    throw new Error(`Unexpected "${c}"`);
  }
  // Insert implicit multiplication: 2x, 2(x), x(y), )(, )x, x y
  const withMul: string[] = [];
  const endsValue = (t: string) => /^[\d.]/.test(t) || t === ")" || (!(t in FUNCTIONS) && /^[a-z]/i.test(t));
  const startsValue = (t: string) => /^[\d.]/.test(t) || t === "(" || /^[a-z]/i.test(t);
  out.forEach((t, k) => {
    if (k > 0 && endsValue(out[k - 1]) && startsValue(t)) withMul.push("*");
    withMul.push(t);
  });
  return withMul;
}

function parse(tokens: string[]): Node {
  let p = 0;
  const peek = () => tokens[p];
  const take = (t?: string) => {
    const tok = tokens[p++];
    if (t && tok !== t) throw new Error(`Expected "${t}"`);
    return tok;
  };
  const expr = (): Node => {
    let a = term();
    while (peek() === "+" || peek() === "-") a = { t: "bin", op: take() as "+" | "-", a, b: term() };
    return a;
  };
  const term = (): Node => {
    let a = unary();
    while (peek() === "*" || peek() === "/") a = { t: "bin", op: take() as "*" | "/", a, b: unary() };
    return a;
  };
  const unary = (): Node => {
    if (peek() === "-") { take(); return { t: "neg", a: unary() }; }
    if (peek() === "+") { take(); return unary(); }
    return power();
  };
  const power = (): Node => {
    const base = atom();
    if (peek() === "^") { take(); return { t: "bin", op: "^", a: base, b: unary() }; }
    return base;
  };
  const atom = (): Node => {
    const tok = take();
    if (tok === undefined) throw new Error("Unexpected end");
    if (tok === "(") { const e = expr(); take(")"); return e; }
    if (/^[\d.]/.test(tok)) return { t: "num", v: Number(tok) };
    if (tok in FUNCTIONS) return { t: "fn", name: tok, a: atom() };
    if (tok in CONSTANTS) return { t: "num", v: CONSTANTS[tok] };
    if (/^[a-z]/i.test(tok)) return { t: "var", name: tok };
    throw new Error(`Unexpected "${tok}"`);
  };
  const tree = expr();
  if (p !== tokens.length) throw new Error(`Unexpected "${tokens[p]}"`);
  return tree;
}

function evaluate(n: Node, env: Record<string, number>): number {
  switch (n.t) {
    case "num": return n.v;
    case "var": return env[n.name];
    case "neg": return -evaluate(n.a, env);
    case "fn": return FUNCTIONS[n.name](evaluate(n.a, env));
    case "bin": {
      const a = evaluate(n.a, env), b = evaluate(n.b, env);
      return n.op === "+" ? a + b : n.op === "-" ? a - b : n.op === "*" ? a * b : n.op === "/" ? a / b : a ** b;
    }
  }
}

export function compileExpression(src: string, variables: readonly string[]) {
  const tree = parse(tokenize(src, variables));
  return (env: Record<string, number>) => evaluate(tree, env);
}

/** Two expressions are equivalent if they agree at many deterministic sample points. */
export function equivalent(a: string, b: string, variables: readonly string[]): boolean {
  const f = compileExpression(a, variables);
  const g = compileExpression(b, variables);
  let compared = 0;
  for (let k = 0; k < 40 && compared < 12; k++) {
    const env = Object.fromEntries(variables.map((v, i) => [v, 0.37 + ((k * 7 + i * 13) % 23) * 0.29 - 2.5]));
    const x = f(env), y = g(env);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    compared++;
    if (Math.abs(x - y) > 1e-7 * Math.max(1, Math.abs(x), Math.abs(y))) return false;
  }
  return compared > 0;
}

export function checkAnswer(answer: Answer, input: string): CheckResult {
  switch (answer.kind) {
    case "numeric": {
      const n = parseNumber(input);
      if (n === null) return { correct: false, message: "Enter a number, such as 12, -3.5 or 3/4." };
      const tol = answer.tolerance ?? 1e-9;
      return { correct: Math.abs(n - answer.value) <= tol * Math.max(1, Math.abs(answer.value)) };
    }
    case "expression": {
      try {
        return { correct: equivalent(input, answer.value, answer.variables) };
      } catch (e) {
        return { correct: false, message: `I couldn't read that expression: ${(e as Error).message}.` };
      }
    }
    case "choice": {
      const picked = input.split(",").filter(Boolean).map(Number).sort((a, b) => a - b);
      const want = [...answer.correct].sort((a, b) => a - b);
      if (picked.length === 0) return { correct: false, message: "Choose an option first." };
      return { correct: picked.length === want.length && picked.every((v, i) => v === want[i]) };
    }
    case "written":
      return { correct: input.trim().length >= 20, message: input.trim().length < 20 ? "Write a little more first." : undefined };
  }
}
