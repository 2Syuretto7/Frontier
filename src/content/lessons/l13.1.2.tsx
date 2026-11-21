import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PluralityVoteViz } from "@/components/viz/PluralityVoteViz";
import type { LessonContent } from "@/lib/types";

const VOTE = `import math

def plurality(answers):
    counts = {}
    for a in answers:
        counts[a] = counts.get(a, 0) + 1
    return max(counts, key=lambda a: counts[a])            # ties go to the answer seen first

def plurality_acc(p, q, m):
    r = 1 - p - q                                          # the rest: answers that never repeat
    acc = 0.0
    for c in range(m + 1):
        for w in range(m - c + 1):
            j = m - c - w
            pr = math.comb(m, c) * math.comb(m - c, w) * p ** c * q ** w * r ** j
            top = max(c, w, 1 if j else 0)
            if c == top:
                acc += pr / ((c == top) + (w == top) + (j if top == 1 else 0))   # random tie-break
    return acc

def union_bound(probs, correct, m):
    pc = probs[correct]
    return min(1.0, sum(math.exp(-m * (pc - pa) ** 2 / 2) for a, pa in probs.items() if a != correct))`;

const SELECT = `def weighted_vote(answers, weights):
    total = {}
    for a, w in zip(answers, weights):
        total[a] = total.get(a, 0) + w
    return max(total, key=lambda a: total[a])

def coverage(p, m):
    return 1 - (1 - p) ** m                                # some sample is right: the ceiling for any selector

def extract_answer(text):
    i = text.rfind("Answer:")
    if i < 0:
        return None
    return text[i + len("Answer:"):].split("\\n")[0].strip().lower().replace(",", "")`;

export const lesson: LessonContent = {
  id: "l13.1.2",
  minutes: 50,
  links: {
    requires: ["l13.1.1", "l9.7.4"],
    revisits: ["l9.7.1"],
    foreshadows: ["l13.1.3", "l13.1.4"],
  },

  puzzle: (
    <>
      <p>
        A model solves a competition problem correctly in only 30% of its sampled attempts. The other 70% end in many
        different wrong answers, though one wrong answer, from a common slip, turns up 20% of the time. Taking the most
        common answer among 25 samples gets the problem right about three times in four, far above 30%. Why does voting
        help when the right answer is a minority, when does it start to hurt, and what is the best any method of choosing
        among samples could do?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Correct chains tend to agree on the answer, while wrong chains go wrong in different ways. Counting votes therefore
        finds the answer the model believes most, which need not be a majority, only more popular than every single
        alternative. When a misconception makes one wrong answer more popular than the right one, more votes make the model
        more confidently wrong. Separately, the chance that at least one sample is right grows much faster than the vote, and
        closing that gap needs a better judge than counting.
      </p>
      <PluralityVoteViz />
    </>
  ),

  theory: (
    <>
      <Definition title="plurality voting over answers">
        <p>
          Sample m chains at a positive temperature, extract each final answer and normalise it so that equal answers compare
          equal (<C>extract_answer</C>), and return the most frequent answer (<C>plurality</C>). The earlier lesson on
          test-time compute treated two possible answers; here the answer space is large, which is the usual case for
          mathematics and short-answer questions.
        </p>
      </Definition>

      <Theorem title="the vote converges to the mode">
        <p>
          Let each sample&apos;s answer be drawn independently from a distribution π over answers, with the correct answer c
          its unique mode. For every other answer a let <M>{"\\delta_a = \\pi_c - \\pi_a > 0"}</M>. Then the plurality of m
          samples differs from c with probability at most
        </p>
        <MD>{"\\sum_{a \\ne c} e^{-m \\delta_a^2 / 2}"}</MD>
        <p>
          (<C>union_bound</C>), which tends to 0. If instead some wrong answer has <M>{"\\pi_a > \\pi_c"}</M>, the
          probability that the vote is right tends to 0.
        </p>
      </Theorem>
      <Proof>
        <p>
          For a fixed wrong answer a, write <M>{"N_c - N_a = \\sum_{k=1}^m Y_k"}</M>, where <M>{"Y_k"}</M> is 1 if sample k is c,
          −1 if it is a, and 0 otherwise. The <M>{"Y_k"}</M> are independent, lie in [−1, 1] and have mean{" "}
          <M>{"\\delta_a"}</M>. Hoeffding&apos;s inequality bounds the probability that their sum is at most 0, which is{" "}
          <M>{"m\\delta_a"}</M> below its mean, by <M>{"\\exp(-2 (m\\delta_a)^2 / (m \\cdot 2^2)) = e^{-m\\delta_a^2/2}"}</M>. The
          vote can be wrong only if <M>{"N_a \\ge N_c"}</M> for some a, and the union bound adds these probabilities. The
          bound is a sum over all answers, but answers far less likely than c contribute almost nothing. In the reverse
          case the same argument with the roles of c and a exchanged shows that <M>{"N_a > N_c"}</M> with probability tending
          to 1.
        </p>
        <Code>{VOTE}</Code>
      </Proof>

      <Example title="minorities and misconceptions">
        <p>
          With 30% correct, 20% on one popular wrong answer and the rest scattered, the vote over 25 samples is right with
          probability 0.76, computed exactly by counting (<C>plurality_acc</C>). Raise the popular wrong answer to 35% and the
          vote over 25 samples drops to 0.38, on its way to 0. The Hoeffding bound is loose for small margins: for a margin of
          0.05 a single term is still above one half at m = 500, so it says how voting behaves, not how many samples to draw.
        </p>
      </Example>

      <Definition title="coverage and selection">
        <p>
          Coverage is the probability that at least one of m samples is correct, <M>{"1 - (1 - p)^m"}</M> for independent
          samples (<C>coverage</C>), the unbiased pass@k of the previous course estimated from data. It is an upper bound on
          any method of choosing one sample. Experiments that sampled up to ten thousand attempts per problem found coverage
          rising steadily, roughly log-linearly, over orders of magnitude, while majority voting levelled off after a few
          hundred. In domains with an automatic check, such as code with unit tests, coverage converts directly into
          accuracy; elsewhere the gap between coverage and voting is the opportunity for verifiers.
        </p>
      </Definition>

      <Remark title="better than counting">
        <p>
          Weighted voting sums a score for each answer instead of a count (<C>weighted_vote</C>), using the model&apos;s own
          probability of the chain or a verifier&apos;s score, and the following lessons develop such verifiers. For free-form
          outputs, where no two answers are textually equal, universal self-consistency gives all the samples to the model
          and asks it to pick the one most consistent with the others. Temperature trades the two quantities: hotter
          sampling raises diversity and coverage but lowers the per-sample accuracy p on which voting depends.
        </p>
        <Code>{SELECT}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "vote25",
      rung: "check",
      prompt: (
        <p>
          A model is correct with probability 0.3; one wrong answer appears with probability 0.2 and the rest never repeat.
          What is the accuracy of a plurality vote over 25 samples, ties broken at random?
        </p>
      ),
      answer: { kind: "numeric", value: 0.7608, tolerance: 0.001 },
    },
    {
      key: "bound",
      rung: "check",
      prompt: (
        <p>
          Answers are correct with probability 0.7 and wrong, always the same wrong answer, with probability 0.3. What is
          the theorem&apos;s bound on the probability that a vote over 25 samples is wrong?
        </p>
      ),
      answer: { kind: "numeric", value: 0.1353, tolerance: 0.001 },
    },
    {
      key: "hurt",
      rung: "apply",
      prompt: <p>When does adding more samples to a plurality vote make it worse?</p>,
      answer: {
        kind: "choice",
        options: [
          "When some wrong answer is more likely than the correct one",
          "Whenever the correct answer has probability below one half",
          "Whenever there are more than two possible answers",
          "Never: more samples always help",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def plurality(answers):
    counts = {}
    for a in answers:
        counts[a] = counts.get(a, 0) + 1
    return max(counts, key=lambda a: counts[a])            # ties go to the answer seen first

def plurality_acc(p, q, m):
    r = 1 - p - q                                          # the rest: answers that never repeat
    acc = 0.0
    for c in range(m + 1):
        for w in range(m - c + 1):
            j = m - c - w
            pr = math.comb(m, c) * math.comb(m - c, w) * p ** c * q ** w * r ** j
            top = max(c, w, 1 if j else 0)
            if c == top:
                acc += pr / ((c == top) + (w == top) + (j if top == 1 else 0))   # random tie-break
    return acc

def union_bound(probs, correct, m):
    pc = probs[correct]
    return min(1.0, sum(math.exp(-m * (pc - pa) ** 2 / 2) for a, pa in probs.items() if a != correct))

print(plurality(["7", "5", "7", "9", "5"]), plurality(["a", "b"]), round(plurality_acc(0.4, 0.3, 1), 4))
print(round(plurality_acc(0.4, 0.3, 3), 4), round(union_bound({"x": 0.5, "y": 0.3, "z": 0.2}, "x", 50), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "7 a 0.4\n0.46 0.4733",
          "5 a 0.4\n0.46 0.4733",
          "7 b 0.4\n0.46 0.4733",
          "7 a 0.4\n0.4 0.4733",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def weighted_vote(answers, weights):
    total = {}
    for a, w in zip(answers, weights):
        total[a] = total.get(a, 0) + w
    return max(total, key=lambda a: total[a])

def coverage(p, m):
    return 1 - (1 - p) ** m                                # some sample is right: the ceiling for any selector

def extract_answer(text):
    i = text.rfind("Answer:")
    if i < 0:
        return None
    return text[i + len("Answer:"):].split("\\n")[0].strip().lower().replace(",", "")

print(weighted_vote(["a", "b", "b"], [0.9, 0.3, 0.4]), round(coverage(0.2, 5), 4))
print(extract_answer("so 3 + 4 = 7.\\nAnswer: 1,024\\n"), extract_answer("no final line"))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "a 0.6723\n1024 None",
          "b 0.6723\n1024 None",
          "a 0.3277\n1024 None",
          "a 0.6723\n1,024 None",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>plurality(answers)</C>, breaking ties in favour of the answer seen first; <C>plurality_acc(p, q, m)</C>,
          the exact accuracy when each sample is correct with probability p, a single wrong answer with probability q, and
          otherwise an answer that never repeats, with ties broken uniformly at random among the tied answers; and{" "}
          <C>union_bound(probs, correct, m)</C>, capped at 1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def plurality(answers):
    return answers[0]

def plurality_acc(p, q, m):
    return p

def union_bound(probs, correct, m):
    return 1.0
`,
        solution: VOTE,
        tests: [
          { name: "plur", code: `assert plurality(["b", "a", "a"]) == "a" and abs(plurality_acc(0.6, 0.4, 3) - 0.648) < 1e-12` },
          { name: "bound", code: `import math\nassert abs(union_bound({"a": 0.6, "b": 0.4}, "a", 50) - math.exp(-1)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>weighted_vote(answers, weights)</C>, <C>coverage(p, m)</C>, and <C>extract_answer(text)</C>, which takes
          the rest of the line after the last &quot;Answer:&quot;, strips it, lowercases it and removes commas, or returns
          None if there is none.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def weighted_vote(answers, weights):
    return answers[0]

def coverage(p, m):
    return p

def extract_answer(text):
    return text.strip()
`,
        solution: SELECT,
        tests: [
          { name: "vote", code: `assert weighted_vote(["x", "y"], [0.2, 0.5]) == "y" and abs(coverage(0.5, 3) - 0.875) < 1e-12` },
          { name: "extract", code: `assert extract_answer("Answer: 3\\nAnswer: 12,5\\n") == "125" and extract_answer("x") is None` },
        ],
      },
    },
    {
      key: "samples",
      rung: "stretch",
      prompt: (
        <p>
          Answers are correct with probability 0.5, and the two wrong answers have probabilities 0.3 and 0.2. What is the
          smallest number of samples for which the theorem&apos;s bound on the error is at most 0.05?
        </p>
      ),
      answer: { kind: "numeric", value: 151, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Voting spends compute in parallel with a fixed recipe. The next lesson asks the general question: given a budget of
        inference compute, how should it be split between more samples, longer chains and bigger models, and how much can it
        substitute for training?
      </p>
    </>
  ),
};
