# Frontier

A private, single-learner university for the mathematics, machine learning and machine learning engineering
required at frontier AI labs, live at [frontier.arnavraja.in](https://frontier.arnavraja.in).

One Learn button, a graph of lessons from school arithmetic to frontier research,
and Parton, a Feynman-style tutor that gives more hints and fewer solutions.

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
- Each written lesson is a file in `src/content/lessons/<id>.tsx`, listed in `src/content/lessons/index.ts`. A lesson provides its puzzle, intuition, theory, practice ladder, forward glimpse and any extra links (`parallels`, `foreshadows`, `revisits`, `applies`, `requires`).
- `src/lib/graph.ts` builds the lesson graph. Each lesson requires the one before it; a course's first lesson requires the last lesson of every course it depends on. The build fails if a link points nowhere or prerequisites form a cycle.
- **Learn hands out only lessons whose material is mastered.** A lesson opens when everything it builds on is mastered: the lesson before it, its required courses, any lesson it `requires` or `revisits` (`parallels`, `foreshadows` and `applies` never gate), and the engineering lessons that teach the Python it uses. That last set is worked out from the code in every lesson (examples, code blocks, exercises and reference solutions) by `npm run prerequisites`, which writes `src/content/code-prerequisites.json`; run it after changing any lesson's code. The tests fail if that file is out of date, if any lesson could open before the Python it uses is taught, or if any order a learner can take through the map breaks this.
- Answers never reach the browser: exercises are checked on the server (`src/lib/check.ts`).
- Mastered lessons become spaced-review cards scheduled with FSRS (`src/lib/learning.ts`). The cards decide which ideas are due; the questions on the Review page are written new each time (see Fresh review below).

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

Parton is the tutor on every lesson page (`src/lib/parton/`). It needs `ANTHROPIC_API_KEY` in Vercel; without it, the panel says so.

- **More hints, fewer solutions.** On each ask about a practice question, Parton judges whether the learner can solve it on their own. If it thinks they can, it does not nudge them towards the solution at all ("Over to you" in the panel). If it thinks they cannot, it nudges them towards it one rung at a time, still preferring hints: a worked solution is allowed only after all five rungs have been given and Parton judges another hint will not be enough. Until then, the model that writes a hint never sees the answers. A second, separate pass sees the answers and the draft and rewrites any reply that gives away an answer it may not give (twice at most, then a safe fallback hint).
- **A five-rung ladder** per question: a question back, a pointer, a nudge, a skeleton with blanks, a parallel worked example. Each nudge on the same question climbs one rung; over-to-you replies do not climb it.
- **Memory and repair.** Conversations, hints and noted misconceptions are stored per lesson and fed back to Parton in later lessons that build on them. Questions missed three or more times come back in review after twelve hours instead of a day.
- **Fresh recall.** The recall questions that open a lesson are written new by Parton for each sitting, on the mastered lessons it builds on (`src/lib/recall.ts`). Every recall question is stored, and a new one is dropped if it repeats an earlier recall question or a practice question from its lesson; a question is never shown again once tried. They lean towards ideas the learner has missed before, and their answer keys are checked on the server like any other exercise. Without Parton, the recall section says so instead of replaying old questions.
- **Fresh review.** The Review page shows three to five questions at a time, written new by Parton on the ideas FSRS says are due. Each question stands in for one due card, and the first answer to it rates that card. Review and recall questions share one store, so neither repeats the other, an earlier question, or a practice question. A session is kept while at least three of its questions are untried; otherwise the leftovers are retired and a new session is written.
- Model `claude-opus-5-5` with adaptive thinking, streamed, structured JSON output, prompt caching on the lesson context, and server-side refusal fallback (`fallbacks: "default"`).

## Readiness scorecard

`/readiness` (`src/app/readiness/`, `src/lib/readiness/`) scores the learner against what frontier labs actually ask for.

- **Postings, found for you.** Say the target role once. One button reads the public job boards of Anthropic, Google DeepMind and xAI (Greenhouse) and OpenAI and Cohere (Ashby) (`BOARDS` in `src/lib/readiness/sourcing.ts`), drops non-technical openings, and has Parton pick the 16 best matches across labs. A lab whose board can't be read is searched on the web by Parton instead (web search and web fetch server tools). Their full text becomes the postings; a posting can still be added by hand.
- **Skills.** Parton then reads the postings and pulls out the skills they keep asking for, with how many postings ask for each and short quotes. Re-reading keeps existing skills (matched by name), their levels and evidence; skills the postings stop asking for are kept but stop counting.
- **Levels need evidence.** Each skill is scored None, Studied, Practised, Built or Published. Above Studied, a level counts only when evidence backs it: Practised needs any evidence (such as a passed drill), Built a repository or project, Published a write-up plus a repository or project. Evidence is a kind, a title and a link, either a web address or a Frontier path such as `/drills/attention`, so drills and projects can be linked as they arrive (`addEvidence` in `src/lib/readiness/store.ts`).
- **Readiness** is each skill's counted level out of four, weighted by how many postings ask for it.
- **Quarterly re-check.** 91 days after the postings were last read, the page offers a one-click re-check: fresh postings are found and read, the old ones set aside, and levels and evidence stay. Every read is kept in the history.
- Its tables are created on first use in `src/lib/readiness/store.ts`, not in `src/lib/db.ts`.
