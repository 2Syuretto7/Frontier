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

## When practice sections appear

Drills, the Debugging gym, Interview, Projects and Readiness stay out of the navigation, Home and the daily queue until
you have mastered, through Learn, a concrete set of lessons that gives each one real work to do, and they appear the
moment that set is mastered (`src/lib/sections.ts`, `src/lib/sections-store.ts`). Each set is closed under
prerequisites, so it is the same set whether you take the three tracks one at a time, side by side or mixed, and none
can open on one track alone. Today's sets, out of 797 written lessons:

| Section | Opens when you have mastered | Lessons (maths / ML / engineering) |
| --- | --- | --- |
| Debugging gym | every lesson its first case rests on ("leaky split": Introduction to ML up to Leakage, and NumPy indexing) | 327 (214 / 44 / 69) |
| Interview | what three questions in one mode rest on, a full session (coding: LRU cache, streaming top-k, edit distance) | 333 (214 / 41 / 78) |
| Drills | every lesson the first drill tests (the training loop: matrix backprop, softmax and cross-entropy, SGD) | 399 (252 / 64 / 83) |
| Projects | Ablations (end of Neural Networks from Scratch) and The lab notebook (Software Engineering for ML Research) | 442 (252 / 75 / 115) |
| Readiness | Drills and Projects both open, so every level of evidence can be earned | 442 (252 / 75 / 115) |

- Drill, gym and interview thresholds follow the content: adding an earlier drill, case or question moves them, and
  `tests/sections.test.ts` fails if any section could open with fewer than 300 lessons mastered, or fewer than 40 in
  any one track. It also walks learners through the curriculum in six orders and checks every section opens for each.
- An interview question that rests on no lessons (such as "why this lab") never opens Interview on its own.
- Before a section opens it steers nothing in Learn and adds nothing to the queue. A direct link shows what it waits
  for. Nothing already saved is lost.
- Once open, a section stays open.

## Drills

Timed, from-scratch implementation drills at `/drills`, the closest thing here to lab coding interviews and take-homes: causal multi-head attention, a byte-level BPE tokeniser, AdamW, an MLP training loop with hand-written backprop, KV-cache inference, a LoRA layer and a basic PPO step, all in NumPy.

- **Content** (`src/content/drills/`). Each drill has a brief, a starter, a reference solution, a time limit in minutes and hidden tests (Python run after the learner's program, with an optional `prelude` of reference code prefixed to each). Add a drill by writing a file and listing it in `index.ts`.
- **Hidden tests** are sent only when Submit is pressed during an attempt and run in the browser, like code exercises. The reference solution is shown only after an attempt at that drill has ended.
- **Timing and pass rate** (`src/lib/drills.ts`, table `drill_attempts`, created on first use). The server times each attempt from Start to the submission that passes every test, or to Give up. Starting again while an attempt is open closes it as abandoned. Pass rate is passes over ended attempts; a pass counts as in time when it beats the drill's limit. `drillEvidence()` lists passed drills for the readiness scorecard.
- **Tests** (`tests/drills.test.ts`). Every solution must pass every hidden test and every starter must fail. Each drill also lists plausible wrong answers (no score scaling, L2 instead of decoupled decay, a cache that never grows, and so on) that its hidden tests must catch.

## Projects

The Projects page (`src/app/projects/`) turns study into published work. Each project moves through six fixed
stages: question, plan, experiments, lab notebook, write-up and public repository (`src/lib/pipeline.ts` holds the
rules, `src/lib/projects.ts` the storage).

- **One project at a time.** A new project cannot start until the open one is published or killed. A unique index on
  open projects enforces this in the database as well as in the app.
- **Each stage has a bar to clear** before Move on works: a question with a reason it matters, a plan with a kill
  criterion decided in advance, at least one experiment with its result (and none left open), three lab notebook
  entries, a public https link to the write-up with a summary of findings, and a public repository. A stage's fields
  are frozen once the project moves past it, so the write-up is judged against what you set out to do.
- **Publishing checks the links.** Both links must open for someone who is not signed in; a private or missing GitHub
  repository is refused.
- **Killing needs a post-mortem** of at least 50 words. Killed projects and their post-mortems stay on the Projects page.
- `publishedProjects()` in `src/lib/projects.ts` lists the portfolio, with links, for other pages to cite as evidence.
- **Parton helps at each stage** (`src/lib/project-assist/`). With nothing open, Parton suggests three project
  questions aimed at the biggest Readiness gaps (skills many postings ask for and you are weakest at), and one click
  starts a project with its question already filled in. On entering the plan, experiments and write-up stages Parton
  drafts, in the background, a plan and kill criterion, a lab notebook entry template, and a write-up outline, all from
  what you have already written and never inventing results.
- **Public repository from the app.** From the experiments stage on, Frontier can create the public GitHub repository
  with a README built from the project and a Python .gitignore, and later refresh the README while keeping your own
  "Reproducing the main result" section. This needs `GITHUB_TOKEN` in Vercel: a fine-grained token with access to all
  repositories and read and write permission for Administration and Contents.
- **Each stage is checked before the next unlocks.** Beyond word counts, moving on asks Parton whether the stage's work
  does its job (a sharp question, a plan with baselines and a checkable kill criterion, real results, real notes, a
  write-up that matches the findings, a repository that says how to reproduce them). The write-up link must open, and
  the repository must have code and a README whose reproduction section is filled in. An unchanged stage is never
  checked twice. If you disagree with Parton you can move on anyway with a written reason, which stays on the record.

## Parton

Parton is the tutor on every lesson page (`src/lib/parton/`). It needs `ANTHROPIC_API_KEY` in Vercel; without it, the panel says so.

- **More hints, fewer solutions.** On each ask about a practice question, Parton judges whether the learner can solve it on their own. If it thinks they can, it does not nudge them towards the solution at all ("Over to you" in the panel). If it thinks they cannot, it nudges them towards it one rung at a time, still preferring hints: a worked solution is allowed only after all five rungs have been given and Parton judges another hint will not be enough. Until then, the model that writes a hint never sees the answers. A second, separate pass sees the answers and the draft and rewrites any reply that gives away an answer it may not give (twice at most, then a safe fallback hint).
- **A five-rung ladder** per question: a question back, a pointer, a nudge, a skeleton with blanks, a parallel worked example. Each nudge on the same question climbs one rung; over-to-you replies do not climb it.
- **Memory and repair.** Conversations, hints and noted misconceptions are stored per lesson and fed back to Parton in later lessons that build on them. Questions missed three or more times come back in review after twelve hours instead of a day.
- **Fresh recall.** The recall questions that open a lesson are written new by Parton for each sitting, on the mastered lessons it builds on (`src/lib/recall.ts`). Every recall question is stored, and a new one is dropped if it repeats an earlier recall question or a practice question from its lesson; a question is never shown again once tried. They lean towards ideas the learner has missed before, and their answer keys are checked on the server like any other exercise. Without Parton, the recall section says so instead of replaying old questions.
- **Fresh review.** The Review page shows three to five questions at a time, written new by Parton on the ideas FSRS says are due. Each question stands in for one due card, and the first answer to it rates that card. Review and recall questions share one store, so neither repeats the other, an earlier question, or a practice question. A session is kept while at least three of its questions are untried; otherwise the leftovers are retired and a new session is written. After a review session, Learn (and the Review page's *Done: open a lesson* button) opens a lesson, never a second review session in a row; reviews become eligible again once a new lesson has been begun.
- Model `claude-opus-5-5` with adaptive thinking, streamed, structured JSON output, prompt caching on the lesson context, and server-side refusal fallback (`fallbacks: "default"`).

## Mock interviews

`/interview` (`src/app/interview/`, `src/lib/interview/`, questions in `src/content/interview/`) runs practice interviews in five modes: ML fundamentals, coding, systems design at scale, research discussion and values or motivation. Parton plays the interviewer and scores each answer against the question's rubric.

- **Locked until learnt.** Each question lists the lessons it rests on and opens only once every one is mastered through Learn. Research questions about your own project also wait for a project with an experiment result, and "why this lab" waits for a Readiness check. A mode opens with its first question. The tests fail if any question (prompt or rubric) uses an idea, or a coding question's reference uses Python, that its lessons and their prerequisites do not teach.
- **An interviewer that probes.** After each answer Parton asks up to two follow-ups aimed at what the rubric wants and the answer has not shown, then moves on. A follow-up that names an idea no mastered lesson teaches (checked against `src/content/concepts.ts`) is rewritten once, then dropped. Coding questions add the editor; handing in code runs the question's checks in the browser and the interviewer sees the results.
- **Scoring.** At the end, each answer is scored 0 to 3 on every criterion, with a quote from the answer, a note, overall feedback and a strong answer in outline. Every question, answer, follow-up and score is kept, and `/interview/<id>` reads a session back. Answers can be typed or dictated (speech to text in the browser).
- **Weak scores send you back.** Each criterion names the lessons behind it. A criterion scored 0 or 1 on a mastered lesson brings two of its review cards due now and leaves Parton a note of what went wrong; the lesson goes into the daily queue to reread. One not yet mastered but open is pulled into Learn (source `interview`). The question waits until that is done. Lessons the learner cannot open yet are never touched.
- **Spaced and queued.** A question comes back the next day after a weak answer, in three days after a fair one, and in a week (doubling) after strong ones. One session joins the Home queue every other day, in the mode with due questions and the lowest average, else the one practised least recently. When a mode has fewer than three questions ready, Parton writes a fresh fundamentals or design question on mastered lessons only, aimed at earlier weak spots; it joins the bank.
- Tables are created on first use in `src/lib/interview/store.ts`.

## Readiness scorecard

`/readiness` (`src/app/readiness/`, `src/lib/readiness/`) scores the learner against what frontier labs actually ask for.

- **Postings, found for you.** Say the target role once. One button reads the public job boards of Anthropic, Google DeepMind and xAI (Greenhouse) and OpenAI and Cohere (Ashby) (`BOARDS` in `src/lib/readiness/sourcing.ts`), drops non-technical openings, and has Parton pick the 16 best matches across labs. A lab whose board can't be read is searched on the web by Parton instead (web search and web fetch server tools). Their full text becomes the postings; a posting can still be added by hand.
- **Skills.** Parton then reads the postings and pulls out the skills they keep asking for, with how many postings ask for each and short quotes. Re-reading keeps existing skills (matched by name), their levels and evidence; skills the postings stop asking for are kept but stop counting.
- **Levels need evidence.** Each skill is scored None, Studied, Practised, Built or Published. Above Studied, a level counts only when evidence backs it: Practised needs any evidence (such as a passed drill), Built a repository or project, Published a write-up plus a repository or project. Evidence is a kind, a title and a link, either a web address or a Frontier path such as `/drills/attention`, so drills and projects can be linked as they arrive (`addEvidence` in `src/lib/readiness/store.ts`).
- **Readiness** is each skill's counted level out of four, weighted by how many postings ask for it.
- **Quarterly re-check.** 91 days after the postings were last read, the page offers a one-click re-check: fresh postings are found and read, the old ones set aside, and levels and evidence stay. Every read is kept in the history.
- Its tables are created on first use in `src/lib/readiness/store.ts`, not in `src/lib/db.ts`.
