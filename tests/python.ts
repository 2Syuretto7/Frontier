import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const HARNESS = resolve(process.cwd(), "public/python/harness.py");

// Loads the same harness the browser uses, runs one program and its checks, and prints the outcome as JSON.
const DRIVER = `
import io, json, sys, runpy
h = runpy.run_path(sys.argv[1])
job = json.load(sys.stdin)
sys.stdout = io.StringIO()
program = json.loads(h["run_program"](job["code"], job.get("setup") or "", job.get("files") or {}, job.get("stdin") or ""))
tests = json.loads(h["run_tests"](job["tests"]))
sys.__stdout__.write(json.dumps({"program": program, "tests": tests, "printed": sys.stdout.getvalue()}))
`;

export type Outcome = {
  program: { error: string | null; info: { type: string; message: string; line: number | null } | null; figures: string[] };
  tests: { name: string; passed: boolean; message?: string }[];
  printed: string;
};

export type Job = { code: string; setup?: string; files?: Record<string, string>; stdin?: string; tests: { name: string; code: string }[] };

/** "python3" when a local Python is installed, otherwise null (tests that need it are skipped). */
export const python = spawnSync("python3", ["--version"]).status === 0 ? "python3" : null;

/** Runs a program and its checks with the local python3, exactly as the browser's Pyodide worker does. */
export function runPython(job: Job): Outcome {
  const dir = mkdtempSync(join(tmpdir(), "frontier-code-"));
  try {
    const out = spawnSync(python!, ["-I", "-c", DRIVER, HARNESS], { input: JSON.stringify(job), cwd: dir, encoding: "utf8", timeout: 60_000 });
    if (out.status !== 0) throw new Error(out.stderr);
    return JSON.parse(out.stdout) as Outcome;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export const missingModule = (o: Outcome) => o.program.info?.type === "ModuleNotFoundError" ? o.program.info.message : null;
