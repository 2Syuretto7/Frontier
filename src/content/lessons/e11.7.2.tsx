import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { VerifierPrecisionViz } from "@/components/viz/VerifierPrecisionViz";
import type { LessonContent } from "@/lib/types";

const VERIFY = `import re

def extract_answer(text):
    nums = re.findall(r"-?\\d+(?:\\.\\d+)?", text)
    return float(nums[-1]) if nums else None      # the last number stated is taken as the answer

def verify(sample, gold):
    a = extract_answer(sample)
    return a is not None and abs(a - gold) < 1e-6

def rejection_sample(samples, gold, k):
    kept = []
    for s in samples:
        if verify(s, gold) and s not in kept:     # keep distinct, verified solutions
            kept.append(s)
        if len(kept) == k:
            break
    return kept`;

const SELECT = `from math import comb

def majority(answers):
    counts = {}
    for a in answers:
        if a is not None:
            counts[a] = counts.get(a, 0) + 1
    return max(counts, key=counts.get) if counts else None   # ties go to the earliest answer

def pass_at_k(n, c, k):
    return 1 - comb(n - c, k) / comb(n, k)         # chance a random k of the n samples include a correct one

def difficulty_filter(pass_rates, lo, hi):
    return [i for i, r in enumerate(pass_rates) if lo <= r <= hi]`;

export const lesson: LessonContent = {
  id: "e11.7.2",
  minutes: 50,
  links: {
    requires: ["e11.7.1", "m7.1.4"],
    revisits: ["m13.2.2", "l10.3.1"],
    foreshadows: ["e11.7.3"],
  },

  puzzle: (
    <>
      <p>
        A model writes sixteen solutions to each of a hundred thousand mathematics problems. Keeping those whose final number matches
        the reference gives a large training set, but a spot check finds that one kept solution in five reaches the right number by a
        wrong argument, and that the hardest problems contributed nothing at all. How should generated data be filtered, how much can a
        verifier be trusted, and which problems are worth generating for?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Generating many candidates and keeping only those that pass a check is rejection sampling (m13.2.2) with a verifier in place of
        an exact acceptance probability. The best checks are mechanical: a final answer compared with a reference, code run against
        tests, a proof checked by a proof assistant. Where there is no reference, agreement among many samples or a reward model can
        stand in, at the cost of more errors. Any verifier accepts some wrong samples, and when the generator is rarely right those false
        accepts can make up much of what is kept.
      </p>
      <VerifierPrecisionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="verifying and keeping">
        <p>
          <C>extract_answer</C> takes the last number in a text, or <C>None</C>. <C>verify</C> compares it with the reference.{" "}
          <C>rejection_sample</C> scans the samples in order and keeps up to k distinct ones that verify.
        </p>
        <Code>{VERIFY}</Code>
      </Definition>

      <Theorem title="what share of kept samples is correct">
        <p>
          If a share q of samples is correct, and the verifier accepts a correct sample with probability a and an incorrect one with
          probability b, the share of accepted samples that are correct is <M>{"qa / (qa + (1 - q)b)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          A sample is accepted and correct with probability qa, and accepted and incorrect with probability <M>{"(1 - q)b"}</M>. By
          Bayes&apos; rule (m7.1.4), the probability of being correct given acceptance is the first divided by their sum. As q falls
          toward zero the ratio falls to zero for any b &gt; 0: on hard problems, a verifier must be far stricter to keep the data clean.
        </p>
      </Proof>

      <Definition title="selecting answers and problems">
        <p>
          <C>majority</C> returns the most common answer, ignoring <C>None</C> and breaking ties by first appearance; it is the
          verifier of last resort when no reference exists. <C>pass_at_k</C> is the unbiased estimate, from n samples of which c are
          correct, of the probability that k samples contain a correct one (l10.3.1). <C>difficulty_filter</C> returns the indices of
          problems whose pass rate lies in [lo, hi].
        </p>
        <Code>{SELECT}</Code>
      </Definition>

      <Theorem title="the pass@k estimate is unbiased">
        <p>
          If each of n independent samples is correct with probability p and c of them are, then{" "}
          <M>{"\\mathbb{E}\\big[1 - \\binom{n - c}{k} / \\binom{n}{k}\\big] = 1 - (1 - p)^k"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Choose a subset of k of the n samples uniformly at random. Given the samples, <M>{"\\binom{n - c}{k} / \\binom{n}{k}"}</M> is
          the probability that the subset contains no correct sample. Averaging also over the samples, this is the probability that k
          independent samples, each correct with probability p, are all wrong, which is <M>{"(1 - p)^k"}</M>. Taking complements gives
          the result.
        </p>
      </Proof>

      <Remark title="filtering in practice">
        <p>
          Reasoning datasets are commonly built by sampling many solutions per problem, keeping those whose answer matches the reference
          or whose code passes tests, and removing problems the model always or never solves, since they teach little or yield nothing.
          Weak tests let wrong programs through, so test suites are often strengthened with generated inputs. Kept samples are then
          deduplicated, and a share is checked by people or a stronger model. Without a reference, agreement among samples or a
          reward model filters instead, and the kept set inherits whatever that judge gets wrong.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          A matching final number is a verifier with a real false-accept rate: lucky guesses and compensating errors pass it. Where the
          model is right only a few times in sixteen, those false accepts form a large share of what is kept, by the theorem above.
          Stricter checks, such as requiring several independent solutions to agree or checking intermediate steps, raise precision. For
          the hardest problems, more samples per problem, or a stronger generator, are needed before any solution is found at all.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "precision",
      rung: "check",
      prompt: (
        <p>
          30% of generated solutions are correct. The verifier accepts 95% of correct ones and 10% of incorrect ones. What share of
          accepted solutions is correct? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.803, tolerance: 0.001 },
    },
    {
      key: "passk",
      rung: "check",
      prompt: <p>Of 10 samples for a problem, 3 are correct. What is the unbiased estimate of pass@2? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.533, tolerance: 0.001 },
    },
    {
      key: "difficulty",
      rung: "apply",
      prompt: <p>Why are problems with pass rate 0 or 1 usually dropped before building a filtered dataset?</p>,
      answer: {
        kind: "choice",
        options: [
          "Problems the model always solves teach it little, and problems it never solves yield no verified samples",
          "Such problems are always mislabelled",
          "They make the pass@k estimate biased",
          "They cannot be deduplicated",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import re

def extract_answer(text):
    nums = re.findall(r"-?\\d+(?:\\.\\d+)?", text)
    return float(nums[-1]) if nums else None      # the last number stated is taken as the answer

def verify(sample, gold):
    a = extract_answer(sample)
    return a is not None and abs(a - gold) < 1e-6

def rejection_sample(samples, gold, k):
    kept = []
    for s in samples:
        if verify(s, gold) and s not in kept:     # keep distinct, verified solutions
            kept.append(s)
        if len(kept) == k:
            break
    return kept

outs = ["so x = 12", "answer: 12.0", "I think 13", "no idea", "so x = 12"]
print(extract_answer(outs[1]), extract_answer(outs[3]), [verify(o, 12) for o in outs[:3]], rejection_sample(outs, 12, 5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "12.0 None [True, True, False] ['so x = 12', 'answer: 12.0']",
          "12.0 None [True, True, False] ['so x = 12', 'answer: 12.0', 'so x = 12']",
          "12.0 None [True, False, False] ['so x = 12']",
          "12.0 0.0 [True, True, False] ['so x = 12', 'answer: 12.0']",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from math import comb

def majority(answers):
    counts = {}
    for a in answers:
        if a is not None:
            counts[a] = counts.get(a, 0) + 1
    return max(counts, key=counts.get) if counts else None   # ties go to the earliest answer

def pass_at_k(n, c, k):
    return 1 - comb(n - c, k) / comb(n, k)         # chance a random k of the n samples include a correct one

def difficulty_filter(pass_rates, lo, hi):
    return [i for i, r in enumerate(pass_rates) if lo <= r <= hi]

ans = [3, None, 4, 3, 4, None]
print(majority(ans), round(pass_at_k(5, 2, 2), 2), difficulty_filter([0.0, 0.1, 0.5, 1.0], 0.05, 0.9))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["3 0.7 [1, 2]", "4 0.7 [1, 2]", "3 0.4 [1, 2]", "3 0.7 [0, 1, 2]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>extract_answer(text)</C>, returning the last integer or decimal (possibly negative) as a float, or <C>None</C>;{" "}
          <C>verify(sample, gold)</C>, with tolerance 1e-6; and <C>rejection_sample(samples, gold, k)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import re

def extract_answer(text):
    return None

def verify(sample, gold):
    return True

def rejection_sample(samples, gold, k):
    return samples[:k]
`,
        solution: VERIFY,
        tests: [
          { name: "extract", code: `assert extract_answer("from 3 to -4.5 units") == -4.5 and extract_answer("none here") is None\nassert verify("total 7", 7) and not verify("total 8", 7) and not verify("?", 0)` },
          { name: "keep", code: `s = ["a 1", "b 2", "a 1", "c 1", "d 1"]\nassert rejection_sample(s, 1, 2) == ["a 1", "c 1"] and rejection_sample(s, 5, 3) == []` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>majority(answers)</C>, returning <C>None</C> if every answer is <C>None</C>; <C>pass_at_k(n, c, k)</C>; and{" "}
          <C>difficulty_filter(pass_rates, lo, hi)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from math import comb

def majority(answers):
    return answers[0]

def pass_at_k(n, c, k):
    return c / n

def difficulty_filter(pass_rates, lo, hi):
    return list(range(len(pass_rates)))
`,
        solution: SELECT,
        tests: [
          { name: "vote", code: `assert majority([None, 2, 5, 5, 2, 2]) == 2 and majority(["b", "a", "a", "b"]) == "b" and majority([None]) is None` },
          { name: "pass", code: `assert abs(pass_at_k(4, 1, 2) - 0.5) < 1e-12 and pass_at_k(3, 0, 2) == 0 and pass_at_k(3, 2, 2) == 1\nassert difficulty_filter([0.2, 0.8, 0.95], 0.2, 0.8) == [0, 1]` },
        ],
      },
    },
    {
      key: "budget",
      rung: "stretch",
      prompt: (
        <p>
          A model solves a problem with probability 0.1 per independent sample. What is the smallest number of samples that gives at
          least a 90% chance of at least one correct solution?
        </p>
      ),
      answer: { kind: "numeric", value: 22, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Filtering keeps generated data correct, but not representative: a model trained on another model&apos;s filtered outputs sees
        less of the tails of the original distribution. The next lesson asks what happens when this repeats over generations.
      </p>
    </>
  ),
};
