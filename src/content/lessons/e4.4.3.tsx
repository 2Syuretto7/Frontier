import { Definition, Example, Proposition, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ReviewHuntViz } from "@/components/viz/ReviewHuntViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e4.4.3",
  minutes: 50,
  links: {
    requires: ["e4.4.2"],
    revisits: ["e1.2.3", "e4.1.4"],
    foreshadows: ["e4.6.2", "e4.6.3"],
  },

  puzzle: (
    <>
      <p>
        A colleague asks you to review a 40-line change to the evaluation code. All the tests pass, the code is tidy, and the
        accuracy it reports went up by two points. You are about to approve.
      </p>
      <p>What should you check first?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Most bugs in machine learning code do not crash; they change a number. Tests catch some; a careful second reader
        catches others, because a reviewer reads what the code says rather than what the author meant. Review is most useful
        when the reviewer knows the specific ways this kind of code goes wrong. Try it.
      </p>
      <ReviewHuntViz />
      <p>
        A result that improved suddenly deserves more suspicion, not less. Each of these bugs could have produced the two-point
        gain.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="what to look for in machine learning code">
        <ul>
          <li>
            <strong>Leakage</strong>: test or validation data influencing training, through normalisation statistics,
            feature selection, deduplication done after splitting, or examples from the same source on both sides.
          </li>
          <li><strong>Modes</strong>: evaluation with dropout on or batch-norm statistics updating; gradients computed where none are needed.</li>
          <li><strong>Axes and shapes</strong>: reductions over the wrong axis, silent broadcasting, labels shifted the wrong way.</li>
          <li><strong>Averages</strong>: mean over batches instead of examples, padding counted in a loss, a last batch of a different size.</li>
          <li><strong>Randomness and state</strong>: unseeded generators, state carried between runs, mutation of shared inputs.</li>
        </ul>
      </Definition>

      <Example title="useful comments">
        <p>
          Specific, with the reason and a suggestion: &ldquo;<C>len(loader)</C> counts batches, so this divides by about 100
          rather than 6,400. Should it be <C>total</C>?&rdquo; Mark which comments must be addressed before merging and which
          are optional preferences. Ask questions when unsure; the author knows things you do not.
        </p>
      </Example>

      <Definition title="writing reviewable changes">
        <p>
          Keep each change small and about one thing; reviewers&rsquo; attention drops sharply beyond a few hundred lines.
          Describe what changed, why, and how you checked it. Review your own diff before asking anyone, and separate pure
          refactors, which should change no results, from changes in behaviour, which should.
        </p>
      </Definition>

      <Proposition title="several reviewers">
        <p>
          If each of r reviewers independently misses a particular bug with probability q, all of them miss it with probability{" "}
          <C>q ** r</C>. Two reviewers who each miss 40% of bugs together miss 16%. But reviewers are not independent: they
          share blind spots, which is why checklists and automated checks for known pitfalls add more than another pair of
          eyes looking the same way.
        </p>
      </Proposition>

      <Remark title="automation first">
        <p>
          Formatting, style and simple pitfalls are for tools: formatters, linters and type checkers that run on every change.
          Human attention is for what tools cannot judge: whether the change is correct, whether the experiment it enables
          answers the question, and whether the next reader will understand it.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "comment",
      rung: "check",
      prompt: <p>Which review comment is most useful?</p>,
      answer: {
        kind: "choice",
        options: [
          "x_test is normalised with its own mean and std, which leaks test statistics; use the training mean and std",
          "This looks wrong",
          "I would have written this differently",
          "LGTM",
        ],
        correct: [0],
      },
    },
    {
      key: "two",
      rung: "apply",
      prompt: <p>Two reviewers each independently catch a particular bug with probability 0.6. What is the probability that at least one catches it?</p>,
      answer: { kind: "numeric", value: 0.84, tolerance: 0.001 },
    },
    {
      key: "leak",
      rung: "apply",
      prompt: <p>Which of these leak information from the test set into training?</p>,
      answer: {
        kind: "choice",
        options: [
          "Normalising features with the mean and standard deviation of the whole dataset before splitting",
          "Choosing which features to keep by their correlation with the test labels",
          "Stopping training early when the validation loss stops improving",
          "Shuffling the training set every epoch",
        ],
        correct: [0, 1],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`tokens = [5, 8, 2, 9]
inputs, targets = tokens[:-1], tokens[1:]
pairs = list(zip(inputs, targets))
bad = list(zip(tokens, tokens))
print(pairs, sum(a == b for a, b in bad))`}</Code>
          <p>Next-token targets, and a bug that forgot to shift them. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[(5, 8), (8, 2), (2, 9)] 4", "[(5, 8), (8, 2), (2, 9)] 0", "[(8, 5), (2, 8), (9, 2)] 4", "[(5, 8), (8, 2), (2, 9), (9, 5)] 4"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
logits = np.array([[2.0, 1.0, 0.0], [0.0, 3.0, 1.0]])
y = np.array([0, 1])
print(logits.argmax(axis=0), (logits.argmax(axis=-1) == y).mean(), (logits.argmax(axis=0)[:2] == y).mean())`}</Code>
          <p>The right axis and the wrong one, on two examples with three classes. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[0 1 1] 1.0 1.0", "[0 1] 1.0 1.0", "[0 1 1] 1.0 0.5", "[0 1 2] 1.0 0.5"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Automate part of a review. Write <C>lint_diff(lines)</C>, which checks only added lines (starting with{" "}
            <C>+</C> but not <C>+++</C>) and returns a sorted list of (line_number, rule) pairs, with line numbers counted from 1
            in the list. The rules:
          </p>
          <ul>
            <li><C>&apos;test-stats&apos;</C>: a name containing <C>test</C> followed by <C>.mean(</C>, <C>.std(</C> or <C>.fit(</C>;</li>
            <li><C>&apos;argmax-axis0&apos;</C>: <C>argmax(axis=0)</C> or <C>argmax(0)</C>;</li>
            <li><C>&apos;none-compare&apos;</C>: <C>== None</C> or <C>!= None</C>;</li>
            <li><C>&apos;bare-except&apos;</C>: a line whose code is <C>except:</C>.</li>
          </ul>
          <p>A line can break several rules; list each.</p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import re

def lint_diff(lines):
    return []
`,
        solution: `import re

RULES = [
    ('test-stats', r'\\w*test\\w*\\.(mean|std|fit)\\('),
    ('argmax-axis0', r'argmax\\((axis=)?0\\)'),
    ('none-compare', r'[!=]= None'),
    ('bare-except', r'^\\s*except:'),
]

def lint_diff(lines):
    found = []
    for n, line in enumerate(lines, 1):
        if not line.startswith('+') or line.startswith('+++'):
            continue
        for rule, pattern in RULES:
            if re.search(pattern, line[1:]):
                found.append((n, rule))
    return sorted(found)
`,
        tests: [
          { name: "rules", code: `diff = [
    '+++ b/train.py',
    '  x_train = load()',
    '+ x_test = (x_test - x_test.mean()) / x_test.std()',
    '- pred = logits.argmax(axis=0)',
    '+ pred = logits.argmax(axis=0)',
    '+ if mask == None:',
    '+     try:',
    '+         run()',
    '+     except:',
    '+         scaler.fit(X_test_small)',
    '+ ok = logits.argmax(axis=-1) is not None and a != None',
]
got = lint_diff(diff)
want = [(3, 'test-stats'), (5, 'argmax-axis0'), (6, 'none-compare'), (9, 'bare-except'), (11, 'none-compare')]
assert got == want, got` },
          { name: "clean and edge", code: `clean = ['+ x_test = (x_test - x_train.mean()) / x_train.std()', '+ pred = p.argmax(axis=-1)', '+ if m is None:', '+ except ValueError:', '  except:']
assert lint_diff(clean) == [], lint_diff(clean)
assert lint_diff(['+ s = latest_test_set.std(); y = z.argmax(0)']) == [(1, 'argmax-axis0'), (1, 'test-stats')]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          A frequent review finding is a split that puts near-duplicates on both sides. Write{" "}
          <C>split_by_group(items, group_of, test_fraction, seed)</C>: collect the distinct groups (<C>group_of(item)</C>),
          sort them, shuffle them with <C>random.Random(seed)</C>, and put the first{" "}
          <C>math.ceil(test_fraction * number_of_groups)</C> groups in the test set. Return (train, test) lists of items, each
          in the original order.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math, random

def split_by_group(items, group_of, test_fraction, seed):
    k = int(len(items) * (1 - test_fraction))
    return items[:k], items[k:]
`,
        solution: `import math, random

def split_by_group(items, group_of, test_fraction, seed):
    groups = sorted({group_of(x) for x in items})
    random.Random(seed).shuffle(groups)
    test_groups = set(groups[:math.ceil(test_fraction * len(groups))])
    train = [x for x in items if group_of(x) not in test_groups]
    test = [x for x in items if group_of(x) in test_groups]
    return train, test
`,
        tests: [
          { name: "no group on both sides", code: `items = [(p, s) for p in ['ann', 'bo', 'cy', 'di', 'ed'] for s in range(4)]
train, test = split_by_group(items, lambda x: x[0], 0.4, seed=1)
tr, te = {p for p, _ in train}, {p for p, _ in test}
assert not tr & te, f'Patients on both sides: {tr & te}'
assert len(te) == 2 and len(tr) == 3, (tr, te)
assert train + test != [] and sorted(train + test) == sorted(items)
assert train == [x for x in items if x in train] and test == [x for x in items if x in test], 'Keep the original order.'` },
          { name: "deterministic", code: `import random
items = [f'doc{i % 7}-chunk{i}' for i in range(40)]
g = lambda s: s.split('-')[0]
a = split_by_group(items, g, 0.3, seed=5)
b = split_by_group(list(items), g, 0.3, seed=5)
assert a == b
groups = sorted({g(x) for x in items})
random.Random(5).shuffle(groups)
assert {g(x) for x in a[1]} == set(groups[:3]), 'Shuffle the sorted groups with random.Random(seed).'
assert split_by_group(items, g, 0.01, seed=0)[1] != [], 'ceil gives at least one test group.'` },
        ],
      },
    },
    {
      key: "indep",
      rung: "prove",
      prompt: (
        <p>
          If each of r reviewers independently misses a bug with probability q, show that all miss it with probability{" "}
          <C>q ** r</C>. Then argue why real reviewers are not independent, and what that means for adding more of them.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Uses independence to multiply the r miss probabilities.",
          "Gives a reason the misses are correlated, such as shared blind spots, the same unfamiliar pitfall, or the same misleading description.",
          "Concludes that extra reviewers help less than the formula suggests, and that checklists, tests or automated checks address the shared blind spots.",
        ],
      },
    },
    {
      key: "count",
      rung: "stretch",
      prompt: <p>If each reviewer independently misses a bug with probability 0.4, how many reviewers are needed for the chance that all miss it to fall below 1%?</p>,
      answer: { kind: "numeric", value: 6, tolerance: 0 },
    },
  ],

  teachBack:
    "Explain to a friend what to look for when reviewing a change to evaluation code, and why a sudden improvement in a result is a reason to look harder.",

  glimpse: (
    <p>
      Correct code that is slow wastes compute and time. Next, profiling: measuring where a program actually spends its time
      before trying to make it faster.
    </p>
  ),
};
