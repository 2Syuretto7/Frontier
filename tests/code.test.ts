import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { LESSONS } from "../src/content/lessons/index.ts";
import { checkAnswer, codeSource, parseCodeSubmission } from "../src/lib/check.ts";
import type { CodeAnswer } from "../src/lib/types.ts";

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

type Outcome = {
  program: { error: string | null; info: { type: string; message: string; line: number | null } | null; figures: string[] };
  tests: { name: string; passed: boolean; message?: string }[];
  printed: string;
};

const python = spawnSync("python3", ["--version"]).status === 0 ? "python3" : null;

function runPython(job: { code: string; setup?: string; files?: Record<string, string>; stdin?: string; tests: { name: string; code: string }[] }): Outcome {
  const dir = mkdtempSync(join(tmpdir(), "frontier-code-"));
  try {
    const out = spawnSync(python!, ["-I", "-c", DRIVER, HARNESS], { input: JSON.stringify(job), cwd: dir, encoding: "utf8", timeout: 60_000 });
    if (out.status !== 0) throw new Error(out.stderr);
    return JSON.parse(out.stdout) as Outcome;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const missingModule = (o: Outcome) => o.program.info?.type === "ModuleNotFoundError" ? o.program.info.message : null;

test("a code submission is correct only when every named check passed", () => {
  const answer: CodeAnswer = { kind: "code", starter: "", solution: "", tests: [{ name: "a", code: "" }, { name: "b", code: "" }] };
  const submit = (results: { name: string; passed: boolean }[]) => JSON.stringify({ source: "x = 1", results });
  assert.equal(checkAnswer(answer, submit([{ name: "a", passed: true }, { name: "b", passed: true }])).correct, true);
  assert.equal(checkAnswer(answer, submit([{ name: "a", passed: true }, { name: "b", passed: false }])).correct, false);
  assert.equal(checkAnswer(answer, submit([{ name: "a", passed: true }])).correct, false);
  assert.ok(checkAnswer(answer, "x = 1").message, "plain text is not a submission");
  assert.ok(checkAnswer(answer, JSON.stringify({ source: "  ", results: [] })).message, "empty code is refused");
  assert.equal(parseCodeSubmission("nonsense"), null);
  assert.equal(codeSource(submit([])), "x = 1");
  assert.equal(codeSource("older text"), "older text");
});

test("the harness runs programs and checks as the browser does", { skip: !python && "python3 is not installed" }, () => {
  const ok = runPython({
    code: "def double(x):\n    return 2 * x\nname = input('Name? ')\nprint('Hello', name)\n",
    stdin: "Asha",
    files: { "data/marks.txt": "70\n85\n" },
    tests: [
      { name: "doubles", code: "assert double(4) == 8, 'double(4) should be 8'" },
      { name: "greets", code: "assert 'Hello Asha' in printed" },
      { name: "reads files", code: "assert open('data/marks.txt').read().split() == ['70', '85']" },
      { name: "fails kindly", code: "assert double(1) == 3, 'Think again about 1'" },
      { name: "other errors", code: "undefined_name" },
    ],
  });
  assert.equal(ok.program.error, null);
  assert.equal(ok.printed, "Name? Asha\nHello Asha\n");
  assert.deepEqual(ok.tests.map((t) => t.passed), [true, true, true, false, false]);
  assert.equal(ok.tests[3].message, "Think again about 1");
  assert.match(ok.tests[4].message!, /^NameError/);

  const broken = runPython({ code: "x = 1\nprint(x +)\n", tests: [{ name: "any", code: "" }] });
  assert.equal(broken.program.info?.type, "SyntaxError");
  assert.equal(broken.program.info?.line, 2);
  assert.equal(broken.tests[0].passed, false, "checks do not pass when the program fails");

  const crash = runPython({ code: "xs = [1, 2]\n\nprint(xs[5])\n", tests: [] });
  assert.equal(crash.program.info?.type, "IndexError");
  assert.equal(crash.program.info?.line, 3);
  assert.doesNotMatch(crash.program.error!, /harness|exec\(/, "the traceback shows only the learner's code");
});

const exercises = LESSONS.flatMap((l) => l.practice.filter((e) => e.answer.kind === "code").map((e) => ({ lesson: l.id, key: e.key, answer: e.answer as CodeAnswer })));

for (const { lesson, key, answer } of exercises) {
  test(`${lesson}:${key} is a sound code exercise`, { skip: !python && "python3 is not installed" }, (t) => {
    const names = answer.tests.map((x) => x.name);
    assert.ok(names.length > 0, "has at least one check");
    assert.equal(new Set(names).size, names.length, "check names are unique");
    assert.ok(names.every((n) => n.trim()), "every check has a name");

    const solved = runPython({ code: answer.solution, setup: answer.setup, files: answer.files, tests: answer.tests });
    const missing = missingModule(solved);
    if (missing) { t.skip(`${missing} here; it runs in the browser`); return; }
    assert.equal(solved.program.error, null, `the solution runs: ${solved.program.error}`);
    for (const r of solved.tests) assert.ok(r.passed, `the solution passes "${r.name}": ${r.message}`);

    const started = runPython({ code: answer.starter, setup: answer.setup, files: answer.files, tests: answer.tests });
    assert.ok(started.tests.some((r) => !r.passed), "the starter code does not already pass every check");
  });
}
