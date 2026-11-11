/** A tiny, deterministic shell for teaching: a virtual file system and a handful of Unix commands. */

export type FS = { files: Record<string, string>; dirs: Set<string>; modes: Record<string, string> };
export type Shell = { fs: FS; cwd: string; home: string; vars: Record<string, string>; last: number };
export type Result = { out: string; err: string; code: number; stages?: { cmd: string; out: string }[] };

export function makeShell(files: Record<string, string>, cwd = "/home/asha", extraDirs: string[] = []): Shell {
  const dirs = new Set<string>(["/"]);
  const addParents = (p: string) => {
    const parts = p.split("/").filter(Boolean);
    for (let i = 1; i <= parts.length; i++) dirs.add("/" + parts.slice(0, i).join("/"));
  };
  for (const p of Object.keys(files)) addParents(p.slice(0, p.lastIndexOf("/")) || "/");
  for (const d of [...extraDirs, cwd]) addParents(d);
  const modes: Record<string, string> = {};
  for (const p of Object.keys(files)) modes[p] = p.endsWith(".sh") ? "rwxr-xr-x" : "rw-r--r--";
  return { fs: { files: { ...files }, dirs, modes }, cwd, home: "/home/asha", vars: { HOME: "/home/asha", USER: "asha" }, last: 0 };
}

export function resolve(sh: Shell, p: string): string {
  if (p === "~" || p.startsWith("~/")) p = sh.home + p.slice(1);
  const parts = (p.startsWith("/") ? p : sh.cwd + "/" + p).split("/");
  const out: string[] = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") out.pop();
    else out.push(part);
  }
  return "/" + out.join("/");
}

/** Split a command line into words, honouring quotes and expanding $VARS outside single quotes. */
export function words(sh: Shell, line: string): string[] {
  const res: string[] = [];
  let cur = "", q: string | null = null, has = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === q) q = null;
      else if (ch === "$" && q === '"') { const m = /^\$(\?|\w+)/.exec(line.slice(i)); if (m) { cur += m[1] === "?" ? String(sh.last) : sh.vars[m[1]] ?? ""; i += m[0].length - 1; } else cur += ch; }
      else cur += ch;
    } else if (ch === "'" || ch === '"') { q = ch; has = true; }
    else if (ch === " " || ch === "\t") { if (cur || has) res.push(cur); cur = ""; has = false; }
    else if (ch === "$") { const m = /^\$(\?|\w+)/.exec(line.slice(i)); if (m) { cur += m[1] === "?" ? String(sh.last) : sh.vars[m[1]] ?? ""; i += m[0].length - 1; } else cur += ch; }
    else cur += ch;
  }
  if (cur || has) res.push(cur);
  return res;
}

/** Split on a separator character that is not inside quotes. */
function splitTop(line: string, sep: string): string[] {
  const parts: string[] = [];
  let cur = "", q: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === q) q = null; cur += ch; continue; }
    if (ch === "'" || ch === '"') { q = ch; cur += ch; continue; }
    if (sep === "|" && line[i] === "|" && (line[i + 1] === "|" || line[i - 1] === "|")) { cur += ch; continue; }
    if (line.startsWith(sep, i)) { parts.push(cur); cur = ""; i += sep.length - 1; continue; }
    cur += ch;
  }
  parts.push(cur);
  return parts.map((s) => s.trim());
}

const lines = (s: string) => (s === "" ? [] : s.replace(/\n$/, "").split("\n"));
const joinLines = (ls: string[]) => (ls.length ? ls.join("\n") + "\n" : "");

function glob(sh: Shell, w: string): string[] {
  if (!w.includes("*")) return [w];
  const dir = w.includes("/") ? w.slice(0, w.lastIndexOf("/")) : ".";
  const pat = w.slice(w.lastIndexOf("/") + 1);
  const re = new RegExp("^" + pat.split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$");
  const base = resolve(sh, dir);
  const names = children(sh, base).filter((n) => re.test(n) && !n.startsWith("."));
  return names.length ? names.map((n) => (dir === "." ? n : dir + "/" + n)) : [w];
}

function children(sh: Shell, d: string): string[] {
  const pre = d === "/" ? "/" : d + "/";
  const set = new Set<string>();
  for (const p of [...Object.keys(sh.fs.files), ...sh.fs.dirs]) {
    if (p.startsWith(pre) && p !== d) set.add(p.slice(pre.length).split("/")[0]);
  }
  return [...set].sort();
}

type Cmd = (sh: Shell, args: string[], input: string) => Result;
const ok = (out: string): Result => ({ out, err: "", code: 0 });
const fail = (err: string, code = 1): Result => ({ out: "", err: err + "\n", code });

function readArgOrInput(sh: Shell, files: string[], input: string, name: string): Result {
  if (!files.length) return ok(input);
  let out = "";
  for (const f of files) {
    const p = resolve(sh, f);
    if (sh.fs.dirs.has(p)) return fail(`${name}: ${f}: Is a directory`);
    if (!(p in sh.fs.files)) return fail(`${name}: ${f}: No such file or directory`);
    out += sh.fs.files[p];
  }
  return ok(out);
}

function flags(args: string[], valued: string[] = []) {
  const f = new Set<string>(), rest: string[] = [];
  const val: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (valued.includes(a)) { val[a] = args[++i] ?? ""; continue; }
    if (/^-[a-zA-Z]+$/.test(a)) for (const c of a.slice(1)) f.add(c);
    else rest.push(a);
  }
  return { f, rest, val };
}

const CMDS: Record<string, Cmd> = {
  pwd: (sh) => ok(sh.cwd + "\n"),
  whoami: (sh) => ok(sh.vars.USER + "\n"),
  echo: (_sh, a) => ok(a.join(" ") + "\n"),
  ls: (sh, a) => {
    const { f, rest } = flags(a);
    const targets = rest.length ? rest : ["."];
    const outs: string[] = [];
    for (const t of targets) {
      const p = resolve(sh, t);
      if (p in sh.fs.files) { outs.push(f.has("l") ? `-${sh.fs.modes[p]} ${String(sh.fs.files[p].length).padStart(5)} ${t}` : t); continue; }
      if (!sh.fs.dirs.has(p)) return fail(`ls: cannot access '${t}': No such file or directory`, 2);
      let names = children(sh, p);
      if (!f.has("a")) names = names.filter((n) => !n.startsWith("."));
      else names = [".", "..", ...names];
      if (targets.length > 1) outs.push(t + ":");
      if (f.has("l")) for (const n of names) {
        const q = n === "." ? p : n === ".." ? resolve(sh, p + "/..") : (p === "/" ? "" : p) + "/" + n;
        outs.push(sh.fs.dirs.has(q) ? `drwxr-xr-x  4096 ${n}` : `-${sh.fs.modes[q]} ${String(sh.fs.files[q].length).padStart(5)} ${n}`);
      }
      else if (names.length) outs.push(names.map((n) => (sh.fs.dirs.has((p === "/" ? "" : p) + "/" + n) && !n.startsWith(".") ? n + "/" : n)).join("  "));
    }
    return ok(joinLines(outs));
  },
  cd: (sh, a) => {
    const p = resolve(sh, a[0] ?? "~");
    if (!sh.fs.dirs.has(p)) return fail(`cd: ${a[0]}: No such file or directory`);
    sh.cwd = p;
    return ok("");
  },
  cat: (sh, a, input) => readArgOrInput(sh, a, input, "cat"),
  mkdir: (sh, a) => {
    const { f, rest } = flags(a);
    for (const t of rest) {
      const p = resolve(sh, t);
      const parent = p.slice(0, p.lastIndexOf("/")) || "/";
      if (sh.fs.dirs.has(p) && !f.has("p")) return fail(`mkdir: cannot create directory '${t}': File exists`);
      if (!sh.fs.dirs.has(parent) && !f.has("p")) return fail(`mkdir: cannot create directory '${t}': No such file or directory`);
      const parts = p.split("/").filter(Boolean);
      for (let i = 1; i <= parts.length; i++) sh.fs.dirs.add("/" + parts.slice(0, i).join("/"));
    }
    return ok("");
  },
  touch: (sh, a) => {
    for (const t of a) {
      const p = resolve(sh, t);
      if (!sh.fs.dirs.has(p.slice(0, p.lastIndexOf("/")) || "/")) return fail(`touch: cannot touch '${t}': No such file or directory`);
      if (!(p in sh.fs.files)) { sh.fs.files[p] = ""; sh.fs.modes[p] = "rw-r--r--"; }
    }
    return ok("");
  },
  cp: (sh, a) => {
    const [src, dst] = a;
    const s = resolve(sh, src ?? "");
    if (!(s in sh.fs.files)) return fail(`cp: cannot stat '${src}': No such file or directory`);
    let d = resolve(sh, dst ?? "");
    if (sh.fs.dirs.has(d)) d = (d === "/" ? "" : d) + "/" + s.slice(s.lastIndexOf("/") + 1);
    sh.fs.files[d] = sh.fs.files[s]; sh.fs.modes[d] = sh.fs.modes[s];
    return ok("");
  },
  mv: (sh, a) => {
    const r = CMDS.cp(sh, a, "");
    if (r.code) return { ...r, err: r.err.replace("cp:", "mv:") };
    delete sh.fs.files[resolve(sh, a[0])];
    return ok("");
  },
  rm: (sh, a) => {
    const { f, rest } = flags(a);
    for (const t of rest) {
      const p = resolve(sh, t);
      if (sh.fs.dirs.has(p)) {
        if (!f.has("r")) return fail(`rm: cannot remove '${t}': Is a directory`);
        for (const k of Object.keys(sh.fs.files)) if (k.startsWith(p + "/")) delete sh.fs.files[k];
        for (const k of [...sh.fs.dirs]) if (k === p || k.startsWith(p + "/")) sh.fs.dirs.delete(k);
        continue;
      }
      if (!(p in sh.fs.files)) return fail(`rm: cannot remove '${t}': No such file or directory`);
      delete sh.fs.files[p];
    }
    return ok("");
  },
  chmod: (sh, a) => {
    const p = resolve(sh, a[1] ?? "");
    if (!(p in sh.fs.files)) return fail(`chmod: cannot access '${a[1]}': No such file or directory`);
    if (a[0] === "+x") sh.fs.modes[p] = sh.fs.modes[p].replace(/^(..).(..).(..)./, "$1x$2x$3x");
    if (a[0] === "-x") sh.fs.modes[p] = sh.fs.modes[p].replace(/x/g, "-");
    return ok("");
  },
  wc: (sh, a, input) => {
    const { f, rest } = flags(a);
    const r = readArgOrInput(sh, rest, input, "wc");
    if (r.code) return r;
    const n = f.has("l") ? lines(r.out).length : f.has("w") ? r.out.split(/\s+/).filter(Boolean).length : f.has("c") ? r.out.length : lines(r.out).length;
    return ok(`${n}${rest.length ? " " + rest.join(" ") : ""}\n`);
  },
  head: (sh, a, input) => {
    const { rest, val } = flags(a, ["-n"]);
    const r = readArgOrInput(sh, rest, input, "head");
    return r.code ? r : ok(joinLines(lines(r.out).slice(0, Number(val["-n"] ?? 10))));
  },
  tail: (sh, a, input) => {
    const { rest, val } = flags(a, ["-n"]);
    const r = readArgOrInput(sh, rest, input, "tail");
    const n = Number(val["-n"] ?? 10);
    return r.code ? r : ok(joinLines(lines(r.out).slice(-n)));
  },
  sort: (sh, a, input) => {
    const { f, rest, val } = flags(a, ["-t", "-k"]);
    const r = readArgOrInput(sh, rest, input, "sort");
    if (r.code) return r;
    const sep = val["-t"];
    const key = (l: string) => (val["-k"] ? (sep ? l.split(sep) : l.trim().split(/\s+/))[Number(val["-k"]) - 1] ?? "" : l);
    const ls = lines(r.out).sort((x, y) => {
      const kx = key(x), ky = key(y);
      const c = f.has("n") ? parseFloat(kx) - parseFloat(ky) || (kx < ky ? -1 : kx > ky ? 1 : 0) : kx < ky ? -1 : kx > ky ? 1 : 0;
      return c;
    });
    if (f.has("r")) ls.reverse();
    return ok(joinLines(ls));
  },
  uniq: (sh, a, input) => {
    const { f, rest } = flags(a);
    const r = readArgOrInput(sh, rest, input, "uniq");
    if (r.code) return r;
    const out: [string, number][] = [];
    for (const l of lines(r.out)) {
      if (out.length && out[out.length - 1][0] === l) out[out.length - 1][1]++;
      else out.push([l, 1]);
    }
    return ok(joinLines(out.map(([l, n]) => (f.has("c") ? `${String(n).padStart(7)} ${l}` : l))));
  },
  grep: (sh, a, input) => {
    const { f, rest } = flags(a);
    const [pat, ...files] = rest;
    if (pat === undefined) return fail("usage: grep [-icvn] PATTERN [FILE...]", 2);
    const r = readArgOrInput(sh, files, input, "grep");
    if (r.code) return r;
    let re: RegExp;
    try { re = new RegExp(pat, f.has("i") ? "i" : ""); } catch { return fail(`grep: invalid pattern '${pat}'`, 2); }
    const hits = lines(r.out).map((l, i) => [l, i + 1] as const).filter(([l]) => re.test(l) !== f.has("v"));
    if (f.has("c")) return { out: hits.length + "\n", err: "", code: hits.length ? 0 : 1 };
    return { out: joinLines(hits.map(([l, i]) => (f.has("n") ? `${i}:${l}` : l))), err: "", code: hits.length ? 0 : 1 };
  },
  cut: (sh, a, input) => {
    const { rest, val } = flags(a, ["-d", "-f"]);
    const r = readArgOrInput(sh, rest, input, "cut");
    if (r.code) return r;
    const d = val["-d"] ?? "\t";
    const fields = (val["-f"] ?? "1").split(",").map(Number);
    return ok(joinLines(lines(r.out).map((l) => fields.map((k) => l.split(d)[k - 1] ?? "").join(d))));
  },
  tr: (_sh, a, input) => {
    const [from, to] = a;
    const map = (s: string) => s.replace("a-z", "abcdefghijklmnopqrstuvwxyz").replace("A-Z", "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    const F = map(from ?? ""), T = map(to ?? "");
    return ok([...input].map((c) => (F.includes(c) ? T[Math.min(F.indexOf(c), T.length - 1)] : c)).join(""));
  },
  true: () => ok(""),
  false: () => ({ out: "", err: "", code: 1 }),
  export: (sh, a) => { for (const kv of a) { const [k, ...v] = kv.split("="); sh.vars[k] = v.join("="); } return ok(""); },
};

/** Run one simple command (no pipes), handling redirection. */
function simple(sh: Shell, text: string, input: string): Result {
  const assign = /^(\w+)=(.*)$/.exec(text);
  if (assign && !text.includes(" ")) { sh.vars[assign[1]] = words(sh, assign[2]).join(" "); return ok(""); }
  let redirect: { path: string; append: boolean } | null = null;
  let inFile: string | null = null;
  const m = /\s(>>?)\s*(\S+)\s*$/.exec(" " + text);
  if (m) { redirect = { path: m[2], append: m[1] === ">>" }; text = (" " + text).slice(0, m.index).trim(); }
  const mi = /\s<\s*(\S+)\s*$/.exec(" " + text);
  if (mi) { inFile = mi[1]; text = (" " + text).slice(0, mi.index).trim(); }
  const w = words(sh, text).flatMap((x) => glob(sh, x));
  if (!w.length) return ok("");
  if (inFile !== null) {
    const p = resolve(sh, inFile);
    if (!(p in sh.fs.files)) return fail(`bash: ${inFile}: No such file or directory`);
    input = sh.fs.files[p];
  }
  let r: Result;
  const [name, ...args] = w;
  if (name === "bash" || name.startsWith("./")) {
    const path = name === "bash" ? args[0] : name;
    const p = resolve(sh, path ?? "");
    if (!(p in sh.fs.files)) r = fail(`bash: ${path}: No such file or directory`, 127);
    else if (name.startsWith("./") && !sh.fs.modes[p].includes("x")) r = fail(`bash: ${path}: Permission denied`, 126);
    else r = runScript(sh, sh.fs.files[p], name === "bash" ? args.slice(1) : args);
  } else if (CMDS[name]) r = CMDS[name](sh, args, input);
  else r = fail(`${name}: command not found`, 127);
  if (redirect) {
    const p = resolve(sh, redirect.path);
    if (!sh.fs.dirs.has(p.slice(0, p.lastIndexOf("/")) || "/")) return fail(`bash: ${redirect.path}: No such file or directory`);
    sh.fs.files[p] = (redirect.append ? sh.fs.files[p] ?? "" : "") + r.out;
    sh.fs.modes[p] ??= "rw-r--r--";
    r = { ...r, out: "" };
  }
  return r;
}

function runScript(sh: Shell, src: string, args: string[]): Result {
  const saved = { ...sh.vars };
  args.forEach((a, i) => (sh.vars[String(i + 1)] = a));
  sh.vars["#"] = String(args.length);
  let out = "", err = "", code = 0;
  for (const raw of src.split("\n")) {
    const l = raw.trim();
    if (!l || l.startsWith("#")) continue;
    const r = run(sh, l);
    out += r.out; err += r.err; code = r.code;
  }
  for (const k of Object.keys(sh.vars)) if (!(k in saved)) delete sh.vars[k];
  Object.assign(sh.vars, saved);
  return { out, err, code };
}

/** Run a full command line: `a | b | c`, joined by && or ;. */
export function run(sh: Shell, line: string): Result {
  let out = "", err = "";
  let stages: { cmd: string; out: string }[] | undefined;
  for (const seq of splitTop(line, ";")) {
    // Split into a chain of pipelines joined by && and ||.
    const chain: { op: string; part: string }[] = [];
    for (const a of splitTop(seq, "&&").map((x, i) => ({ x, i }))) {
      const ors = splitTop(a.x, "||");
      ors.forEach((part, k) => { chain.push({ op: k === 0 ? (a.i === 0 ? ";" : "&&") : "||", part }); });
    }
    for (const { op: o, part } of chain) {
      if (o === "&&" && sh.last !== 0) continue;
      if (o === "||" && sh.last === 0) continue;
      const cmds = splitTop(part, "|");
      let input = "", r: Result = ok("");
      const st: { cmd: string; out: string }[] = [];
      for (const c of cmds) {
        r = simple(sh, c, input);
        err += r.err;
        input = r.out;
        st.push({ cmd: c, out: r.out });
      }
      if (cmds.length > 1) stages = st;
      out += r.out;
      sh.last = r.code;
    }
  }
  return { out, err, code: sh.last, stages };
}
