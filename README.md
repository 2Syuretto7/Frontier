# Frontier

A private, single-learner university for the mathematics, machine learning and machine learning engineering
required at frontier AI labs, live at [frontier.arnavraja.in](https://frontier.arnavraja.in).

One Learn button, a graph of lessons from school arithmetic to frontier research,
and Parton, a Feynman-style tutor that gives hints and never solutions.

## Stack

| Part | Choice |
| --- | --- |
| App | Next.js 15 (App Router), React 19, TypeScript |
| Hosting | Vercel, deploying from `main` |
| Database | Neon Postgres (embedded PGlite when developing locally) |
| Sign-in | One passphrase, hashed with Argon2id; signed 90-day session cookies |

## One-time setup (owner)

1. **Vercel.** Sign in at vercel.com with GitHub, choose *Add New → Project*, and import this repository. Keep every default.
2. **Database.** In the Vercel project, open *Storage → Create Database → Neon* and connect it to the project. This adds `DATABASE_URL` automatically.
3. **Session secret.** In *Settings → Environment Variables*, add `SESSION_SECRET` with any long random value (for example the output of `openssl rand -base64 48`).
4. **Domain.** In *Settings → Domains*, add `frontier.arnavraja.in`. Vercel shows a CNAME value. At GoDaddy, open DNS for `arnavraja.in` and add a CNAME record with name `frontier` and that value.
5. **Redeploy** once from the Vercel dashboard, then visit the site and choose your passphrase. Sign-up closes as soon as your account exists.

`ANTHROPIC_API_KEY` is needed from Phase 3 (Parton) onwards.

## Developing

```bash
npm install
npm run dev        # http://localhost:3000, uses ./.pglite as its database
npm test           # unit tests
npm run typecheck
```

## How the curriculum is stored

- `src/content/outline.json` is the whole curriculum: 55 courses in six tiers across three tracks (mathematics, machine learning, ML engineering), with chapters and lesson titles, course prerequisites and parallels.
- Each written lesson is a file in `src/content/lessons/<id>.tsx`, listed in `src/content/lessons/index.ts`. A lesson provides its puzzle, intuition, theory, practice ladder, teach-back prompt, forward glimpse and any extra links (`parallels`, `foreshadows`, `revisits`, `applies`, `requires`).
- `src/lib/graph.ts` builds the lesson graph. Each lesson requires the one before it; a course's first lesson requires the last lesson of every course it depends on. The build fails if a link points nowhere or prerequisites form a cycle.
- Answers never reach the browser: exercises are checked on the server (`src/lib/check.ts`).
- Mastered lessons become spaced-review cards scheduled with FSRS (`src/lib/learning.ts`).

## Code, run in the browser

Every lesson can carry runnable code. Nothing runs on Frontier's servers: Python runs in the learner's browser with
[Pyodide](https://pyodide.org) (Python 3.13, loaded from the jsDelivr CDN and cached), so there is no server or GPU cost.

- **Editor** (`src/components/code/`). CodeMirror 6 with Python highlighting, autocompletion from jedi (names, NumPy
  methods, signatures and docs), live syntax checking, and runtime errors marked on their line with a plain-English
  explanation. Ctrl or Cmd + Enter runs. Expand opens a full-screen editor, side by side from 900px. On touch screens a
  key row adds Tab, outdent and the symbols phone keyboards hide. Programs that ask for `input()` get an Input box;
  Matplotlib plots are shown under the output; runs longer than 20 seconds are stopped.
- **Runtime** (`public/python-worker.js`, `public/python/harness.py`). One Web Worker per page. Imports of NumPy, pandas,
  SciPy, Matplotlib, scikit-learn or SymPy are loaded on first use. `language` on a code exercise leaves room for further
  in-browser runtimes, such as WebGPU, later.
- **Runnable examples.** `<Playground code={`...`} />` in any part of a lesson. Use `<Code>` for code the learner should
  read rather than run, such as "what does this print?" questions.
- **Code exercises.** An answer of kind `"code"` has a `starter`, a `solution` (server only), named `tests` (Python run
  after the learner's program in its namespace; `printed` holds what it printed; assertion messages are shown as hints),
  and optional `setup` and `files`. Tests are fetched only when Check is pressed and run in the browser; the server
  records the result. `npm test` runs every solution and starter against its tests with the local `python3`, so a broken
  exercise fails the build checks. Parton sees the learner's current code, output and error when asked for a hint.

## Parton

Parton is the tutor on every lesson page (`src/lib/parton/`). It needs `ANTHROPIC_API_KEY` in Vercel; without it, the panel says so and written work is provisionally accepted on submission.

- **Hints, never answers.** The model that writes a hint never sees the answers. A second, separate pass sees the answers and the draft and rewrites any reply that gives one away (twice at most, then a safe fallback hint).
- **A five-rung ladder** per question: a question back, a pointer, a nudge, a skeleton with blanks, a parallel worked example. Each ask on the same question climbs one rung.
- **Marking.** Written proofs and arguments are marked against their rubric; the work counts towards mastery only when every criterion is met. Feedback points to the failing line and asks a question about it.
- **Teach-back.** Parton reads the explanation as a curious student and asks up to two questions about real gaps.
- **Memory and repair.** Conversations, hints and noted misconceptions are stored per lesson and fed back to Parton in later lessons that build on them. Questions missed three or more times come back in review after twelve hours instead of a day, and recall questions favour earlier struggles.
- Model `claude-opus-5-5` with adaptive thinking, streamed, structured JSON output, prompt caching on the lesson context, and server-side refusal fallback (`fallbacks: "default"`).
