import { M } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ForkingPathsViz } from "@/components/viz/ForkingPathsViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e4.3.4",
  minutes: 45,
  links: {
    requires: ["e4.3.3"],
    revisits: ["e0.6.1", "e1.2.1"],
    foreshadows: ["e4.4.1", "e4.6.1"],
  },

  puzzle: (
    <>
      <p>
        You tried twelve tweaks to the training recipe. One of them, a new normalisation, beat the baseline clearly, and you are
        writing it up. A colleague asks whether you expected normalisation to be the one that worked, and what you would
        have concluded if it had lost.
      </p>
      <p>You are not sure any more. Does it matter?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Memory rewrites itself to match results: after seeing an outcome, it is hard to remember that you expected something
        else, and every success looks predicted. A lab notebook written before and during experiments is the honest record.
        It also protects you from the most common statistical trap in research, trying many things and reporting the one
        that happened to look good.
      </p>
      <ForkingPathsViz />
      <p>
        Each variant here is no better than the baseline, yet with a dozen tries, about half of all projects find something
        that passes a 5% test. A notebook that says which comparison you planned turns a lucky find into a hypothesis to test
        again, rather than a result.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="the lab notebook">
        <p>
          A dated, append-only record of your research, kept as you go. For each experiment, write <em>before</em> running it:
          the question, the hypothesis, the prediction, and what result would change your mind. Afterwards write the run
          identifiers, what happened, what you conclude and what you will do next. Record failures and dead ends too; they
          are the part you will otherwise repeat.
        </p>
      </Definition>

      <Example title="an entry">
        <Code>{`2026-11-03
#hyp H7  The loss spike at step 2k comes from Adam's second-moment estimate being too small early on.
#pred    If so, beta2 = 0.95 removes the spike; warm-up of 500 steps also removes it; changing lr alone does not.
#run     a1f3 (beta2=0.95), a1f4 (warmup=500), a1f5 (lr=0.5x)   seeds 0-2 each
#result  H7  a1f3 and a1f4: no spike in 6/6. a1f5: spike in 3/3, later. Consistent with H7.
#next    Check the second-moment values at step 2k directly before believing it.`}</Code>
        <p>
          A plain text or Markdown file in the repository works, and versioning it with the code ties notes to commits. Short
          tags make the notebook searchable.
        </p>
      </Example>

      <Proposition title="multiple comparisons">
        <p>
          If you run k independent comparisons, each with false-positive probability α, the chance that at least one is a
          false positive is <M>{"1 - (1 - \\alpha)^k"}</M>. For α = 0.05 and k = 20 that is about 0.64. Whether or not they
          are independent, testing each at <M>{"\\alpha / k"}</M> (the Bonferroni correction) keeps the chance of any false
          positive at most α.
        </p>
      </Proposition>
      <Proof>
        <p>
          Let <M>{"A_i"}</M> be the event that comparison i is a false positive. By the union bound,{" "}
          <M>{"P(A_1 \\cup \\dots \\cup A_k) \\le \\sum_i P(A_i) \\le k \\cdot \\alpha / k = \\alpha"}</M>.
        </p>
      </Proof>

      <Remark title="Holm's method">
        <p>
          Bonferroni is cautious. Holm&rsquo;s step-down method gives the same guarantee and rejects at least as much: sort
          the p-values, compare the smallest with <M>{"\\alpha / k"}</M>, the next with <M>{"\\alpha / (k - 1)"}</M>, and so
          on, stopping at the first that fails. In practice, the simplest protection is the notebook: decide the main
          comparison before running, and treat everything else as exploration that needs a fresh test.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "before",
      rung: "check",
      prompt: <p>What should you write in the notebook before running an experiment?</p>,
      answer: {
        kind: "choice",
        options: [
          "The hypothesis, the prediction, and which result would change your mind",
          "Only the run identifier",
          "Nothing; write it up when you know the result",
          "The final paper section",
        ],
        correct: [0],
      },
    },
    {
      key: "fwer",
      rung: "apply",
      prompt: (
        <p>
          You compare 20 variants with the baseline, none of which really differs, each at α = 0.05, independently. What is the
          probability that at least one looks significant? Give three decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.642, tolerance: 0.001 },
    },
    {
      key: "bonf",
      rung: "apply",
      prompt: <p>With the Bonferroni correction for 20 comparisons and an overall α of 0.05, what threshold does each p-value need to beat?</p>,
      answer: { kind: "choice", options: ["0.0025", "0.05", "0.01", "0.0025 for the first and 0.05 for the rest"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`notes = """2026-11-02 #hyp warmup fixes the early spike
2026-11-02 #run a1f3 warmup=500
2026-11-03 #result spike gone, val 1.52 vs 1.58
2026-11-03 #hyp the spike is from Adam's second moment
2026-11-04 #todo try beta2=0.95"""
by_tag = {}
for line in notes.splitlines():
    date, tag, text = line.split(' ', 2)
    by_tag.setdefault(tag[1:], []).append(date[-2:])
print(by_tag)`}</Code>
          <p>Indexing a notebook by tag. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'hyp': ['02', '03'], 'run': ['02'], 'result': ['03'], 'todo': ['04']}",
          "{'#hyp': ['02', '03'], '#run': ['02'], '#result': ['03'], '#todo': ['04']}",
          "{'hyp': ['03'], 'run': ['02'], 'result': ['03'], 'todo': ['04']}",
          "{'hyp': ['2026-11-02', '2026-11-03'], 'run': ['2026-11-02'], 'result': ['2026-11-03'], 'todo': ['2026-11-04']}",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`preds = {'warmup': 'better', 'wd': 'same', 'bigger': 'better'}
results = {'warmup': 'better', 'wd': 'worse', 'bigger': 'better', 'dropout': 'better'}
hits = [k for k in preds if results.get(k) == preds[k]]
unpredicted = sorted(set(results) - set(preds))
print(len(hits), len(preds), unpredicted)`}</Code>
          <p>Checking written predictions against results. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2 3 ['dropout']", "3 4 []", "2 4 ['dropout']", "3 3 ['dropout']"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>Write two functions for a plain-text notebook.</p>
          <ul>
            <li>
              <C>parse_notebook(text)</C>: each entry starts with a line <C>YYYY-MM-DD #tag rest of text</C>. A line that
              starts with a space continues the previous entry&rsquo;s text (strip it and join with one space). Ignore blank
              lines. Return a list of dicts with keys date, tag (without #) and text.
            </li>
            <li>
              <C>open_hypotheses(entries)</C>: a <C>hyp</C> entry&rsquo;s text starts with an identifier such as{" "}
              <C>H7</C>; a <C>result</C> entry whose text starts with the same identifier closes it. Return the identifiers
              of hypotheses with no result after them, in the order they were stated.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def parse_notebook(text):
    return []

def open_hypotheses(entries):
    return []
`,
        solution: `def parse_notebook(text):
    entries = []
    for line in text.splitlines():
        if not line.strip():
            continue
        if line[0] == ' ':
            entries[-1]['text'] += ' ' + line.strip()
        else:
            date, tag, rest = line.split(' ', 2)
            entries.append({'date': date, 'tag': tag[1:], 'text': rest})
    return entries

def open_hypotheses(entries):
    still_open = []
    for e in entries:
        ident = e['text'].split()[0]
        if e['tag'] == 'hyp':
            still_open.append(ident)
        elif e['tag'] == 'result' and ident in still_open:
            still_open.remove(ident)
    return still_open
`,
        tests: [
          { name: "parse", code: `text = """2026-11-02 #hyp H1 warmup fixes the early spike

2026-11-02 #run a1f3 warmup=500
  three seeds
2026-11-03 #result H1 spike gone
2026-11-03 #hyp H2 the spike comes from Adam's
    second moment
"""
got = parse_notebook(text)
assert got == [
    {'date': '2026-11-02', 'tag': 'hyp', 'text': 'H1 warmup fixes the early spike'},
    {'date': '2026-11-02', 'tag': 'run', 'text': 'a1f3 warmup=500 three seeds'},
    {'date': '2026-11-03', 'tag': 'result', 'text': 'H1 spike gone'},
    {'date': '2026-11-03', 'tag': 'hyp', 'text': "H2 the spike comes from Adam's second moment"},
], got` },
          { name: "open", code: `E = lambda tag, text: {'date': '2026-11-01', 'tag': tag, 'text': text}
entries = [E('hyp', 'H1 a'), E('hyp', 'H2 b'), E('run', 'r1'), E('result', 'H2 confirmed'), E('hyp', 'H3 c'), E('result', 'H9 stray'), E('todo', 'H1 later')]
assert open_hypotheses(entries) == ['H1', 'H3'], open_hypotheses(entries)
assert open_hypotheses([E('result', 'H1 early'), E('hyp', 'H1 stated after')]) == ['H1'], 'A result before the hypothesis does not close it.'
assert open_hypotheses([]) == []` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>holm(pvalues, alpha=0.05)</C>, returning the set of indices of the comparisons Holm&rsquo;s method rejects:
          sort the indices by p-value; the i-th smallest (counting from 0) is rejected if it and all smaller ones satisfy{" "}
          <M>{"p \\le \\alpha / (k - i)"}</M>, where k is the number of p-values. Stop at the first that fails.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def holm(pvalues, alpha=0.05):
    return {i for i, p in enumerate(pvalues) if p <= alpha}
`,
        solution: `def holm(pvalues, alpha=0.05):
    k = len(pvalues)
    rejected = set()
    for i, j in enumerate(sorted(range(k), key=lambda j: pvalues[j])):
        if pvalues[j] > alpha / (k - i):
            break
        rejected.add(j)
    return rejected
`,
        tests: [
          { name: "examples", code: `assert holm([0.01, 0.04, 0.03, 0.005]) == {0, 3}, holm([0.01, 0.04, 0.03, 0.005])
assert holm([0.001, 0.2, 0.012, 0.03]) == {0, 2}
assert holm([0.04]) == {0} and holm([0.06]) == set() and holm([]) == set()
assert holm([0.01, 0.011, 0.012, 0.013], alpha=0.05) == {0, 1, 2, 3}, 'Each threshold loosens as you go: 0.0125, 0.0167, 0.025, 0.05.'` },
          { name: "stops at the first failure", code: `got = holm([0.03, 0.001, 0.012, 0.04])
assert got == {1, 2}, f'0.001 <= 0.0125 and 0.012 <= 0.0167 pass, 0.03 > 0.025 fails, so 0.04 is not rejected even though 0.04 <= 0.05; got {got}'
assert holm([0.009, 0.02, 0.013, 0.001, 0.5]) == {0, 1, 2, 3}` },
        ],
      },
    },
    {
      key: "union",
      rung: "prove",
      prompt: (
        <p>
          Prove that testing each of k comparisons at threshold <M>{"\\alpha / k"}</M> keeps the probability of at least one
          false positive at most α, even if the comparisons are not independent.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Defines the event of a false positive for each comparison, each with probability at most α / k.",
          "Applies the union bound, which needs no independence, to get at most k · α / k = α.",
        ],
      },
    },
    {
      key: "exact",
      rung: "stretch",
      prompt: (
        <p>
          If the 20 comparisons are independent and each is tested at 0.05 / 20, what is the exact probability of at least one
          false positive? Give four decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0488, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why writing a prediction down before an experiment makes its result more believable, and why trying many variants and reporting the best one is misleading.",

  glimpse: (
    <p>
      Notes, configs and logs make research reproducible; the code itself must also stay workable as it grows. Next, research
      code versus production code: what each is for, and how much engineering a research project actually needs.
    </p>
  ),
};
