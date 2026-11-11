"use client";

/**
 * The in-browser code runtime. Every editor on a page shares one Python worker (Pyodide), so Python starts once.
 * Runs are queued; a run that goes on too long, or that the learner stops, ends the worker, and a fresh one starts.
 * New runtimes (for example WebGPU) can be added as further `Language`s with their own worker.
 */

export type Language = "python";
export type TestSpec = { name: string; code: string };
export type TestResult = { name: string; passed: boolean; message?: string };

export type RunRequest = {
  code: string;
  setup?: string;
  files?: Record<string, string>;
  stdin?: string;
  tests?: TestSpec[] | null;
};

/** Where an error points: the exception type, its message, and the line of the learner's program (1-based). */
export type ErrorInfo = { type: string; message: string; line: number | null; column: number | null };
export type Completion = { label: string; type: string; detail?: string; info?: string };

export type RunResult = {
  error: string | null;
  info?: ErrorInfo | null;
  figures: string[];
  tests: TestResult[] | null;
  stopped?: "timeout" | "user";
};

export type RunHandlers = {
  onOutput?: (text: string, stream: "stdout" | "stderr") => void;
  onStatus?: (text: string | null) => void;
};

export const RUN_LIMIT_SECONDS = 20;

type Job = { id: number; resolve: (r: RunResult) => void; handlers: RunHandlers; timer?: ReturnType<typeof setTimeout> };

class PythonRuntime {
  private worker: Worker | null = null;
  private jobs = new Map<number, Job>();
  private nextId = 1;
  ready = false;
  private listeners = new Set<() => void>();
  private requests = new Map<number, (value: unknown) => void>();

  private ensure(): Worker {
    if (this.worker) return this.worker;
    const worker = new Worker("/python-worker.js");
    worker.onmessage = (event: MessageEvent) => this.receive(event.data);
    worker.onerror = () => {
      for (const job of this.jobs.values()) this.finish(job, { error: "Python stopped unexpectedly. Press Run to try again.", figures: [], tests: null });
      this.reset();
    };
    this.worker = worker;
    return worker;
  }

  private reset() {
    this.worker?.terminate();
    for (const resolve of this.requests.values()) resolve(null);
    this.requests.clear();
    this.worker = null;
    this.ready = false;
    this.notify();
  }

  private notify() { for (const l of this.listeners) l(); }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  /** Starts downloading Python before the first run, for example when an editor is first touched. */
  warm() { this.ensure().postMessage({ type: "warm" }); }

  private finish(job: Job, result: RunResult) {
    if (job.timer) clearTimeout(job.timer);
    this.jobs.delete(job.id);
    job.handlers.onStatus?.(null);
    job.resolve(result);
  }

  private receive(m: {
    type: string; id?: number; text?: string; stream?: "stdout" | "stderr"; error?: string | null; info?: ErrorInfo | null;
    figures?: string[]; tests?: TestResult[] | null; value?: unknown;
  }) {
    if (m.type === "ready") { this.ready = true; this.notify(); return; }
    if (m.type === "reply") {
      const resolve = m.id !== undefined ? this.requests.get(m.id) : undefined;
      if (resolve) { this.requests.delete(m.id!); resolve(m.value ?? null); }
      return;
    }
    const job = m.id !== undefined ? this.jobs.get(m.id) : undefined;
    if (!job) return;
    if (m.type === "status") job.handlers.onStatus?.(m.text ?? null);
    if (m.type === "out") job.handlers.onOutput?.(m.text ?? "", m.stream ?? "stdout");
    if (m.type === "running") {
      job.handlers.onStatus?.(null);
      job.timer = setTimeout(() => this.stop(job.id, "timeout"), RUN_LIMIT_SECONDS * 1000);
    }
    if (m.type === "done") this.finish(job, { error: m.error ?? null, info: m.info ?? null, figures: m.figures ?? [], tests: m.tests ?? null });
  }

  private ask<T>(message: Record<string, unknown>, waitMs: number): Promise<T | null> {
    const worker = this.ensure();
    const id = this.nextId++;
    return new Promise<T | null>((resolve) => {
      const timer = setTimeout(() => { this.requests.delete(id); resolve(null); }, waitMs);
      this.requests.set(id, (v) => { clearTimeout(timer); resolve(v as T | null); });
      worker.postMessage({ ...message, id });
    });
  }

  /** The first syntax error in the code, or null. Answers only once Python has started. */
  lint(code: string) {
    if (!this.ready) return Promise.resolve(null);
    return this.ask<ErrorInfo>({ type: "lint", code }, 1500);
  }

  /** Completions at a position: line is 1-based, column 0-based. */
  complete(code: string, line: number, column: number) {
    return this.ask<Completion[]>({ type: "complete", code, line, column }, 8000);
  }

  run(request: RunRequest, handlers: RunHandlers = {}): { id: number; done: Promise<RunResult> } {
    const worker = this.ensure();
    const id = this.nextId++;
    const done = new Promise<RunResult>((resolve) => this.jobs.set(id, { id, resolve, handlers }));
    worker.postMessage({ type: "run", id, ...request, tests: request.tests ?? null });
    return { id, done };
  }

  /** Stops a run by ending the worker. Other queued runs end too, and are told so. */
  stop(id: number, why: "timeout" | "user" = "user") {
    if (!this.jobs.has(id)) return;
    const jobs = [...this.jobs.values()];
    this.reset();
    for (const job of jobs) {
      const mine = job.id === id;
      this.finish(job, {
        error: mine && why === "timeout"
          ? `Your program ran for more than ${RUN_LIMIT_SECONDS} seconds, so it was stopped. Look for a loop that never ends.`
          : null,
        figures: [],
        tests: null,
        stopped: mine ? why : "user",
      });
    }
  }
}

let python: PythonRuntime | null = null;

export function runtime(language: Language = "python"): PythonRuntime {
  if (language !== "python") throw new Error(`No runtime for ${language}.`);
  python ??= new PythonRuntime();
  return python;
}

/** What is in each exercise's editor now, so Parton can read the learner's code when asked for a hint. */
export type Workspace = { source: string; error: string | null; output: string };
export const workspaces = new Map<string, Workspace>();
