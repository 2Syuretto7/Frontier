import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark } from "@/components/lesson/Blocks";
import { FrequencyViz } from "@/components/viz/FrequencyViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.8.3",
  minutes: 65,
  links: {
    revisits: ["m0.7.4", "m0.8.2"],
    foreshadows: ["m7.1.1", "m7.1.2", "m7.7.1"],
  },

  puzzle: (
    <>
      <p>
        A fair coin has landed heads five times in a row. Many people feel that tails is now &ldquo;due&rdquo;, so the
        sixth toss is more likely to be tails. Others feel the coin is &ldquo;on a streak&rdquo;, so heads is more likely.
      </p>
      <p>
        Who is right? And if a fair coin is equally likely to land either way, why does it so rarely give exactly 50 heads
        in 100 tosses?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Neither is right. The coin has no memory: whatever happened before, the next toss is still a fair coin. What,
        then, does &ldquo;a probability of one half&rdquo; actually mean, if it does not mean the coin evens things up?
      </p>
      <p>
        It means something about the long run. Toss the coin many times and keep track of the <em>proportion</em> of heads
        so far. Early on that proportion jumps about: after one toss it is 0 or 1. As tosses pile up, each new one changes
        the proportion less and less, and it settles down towards one half. Run it below several times.
      </p>
      <FrequencyViz />
      <p>
        Notice what settles and what does not. The <em>proportion</em> of heads closes in on one half. The{" "}
        <em>number</em> of heads minus the number of tails does not settle at all; it typically grows. Exactly 50 heads in
        100 tosses has a chance of only about 8%. The coin never catches up; the early streak is simply swamped.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="experiments, outcomes and events">
        <p>
          A <strong>random experiment</strong> is a process with an uncertain result, such as tossing a coin or rolling a
          die. Its possible results are the <strong>outcomes</strong>, and the set of all of them is the{" "}
          <strong>sample space</strong>. An <strong>event</strong> is a set of outcomes: for a die, &ldquo;even&rdquo; is
          the event <M>{"\\{2, 4, 6\\}"}</M>.
        </p>
      </Definition>

      <Definition title="probability as long-run frequency">
        <p>
          Repeat an experiment <M>n</M> times independently, and let <M>{"n_A"}</M> be the number of times event{" "}
          <M>A</M> happens. The <strong>relative frequency</strong> of <M>A</M> is <M>{"\\tfrac{n_A}{n}"}</M>. The{" "}
          <strong>probability</strong> of <M>A</M>, written <M>{"P(A)"}</M>, is the number this relative frequency settles
          down to as <M>n</M> grows.
        </p>
      </Definition>

      <p>
        This is a description, not yet a mathematical definition: what does &ldquo;settles down&rdquo; mean, for a sequence
        that is random? Making it precise takes the whole of a Probability course, which turns it into a theorem, the law
        of large numbers. For now the description is enough to tell us which rules a probability must obey, because
        relative frequencies obey them.
      </p>

      <Proposition title="the basic rules">
        <p>For any events <M>A</M> and <M>B</M>:</p>
        <ol>
          <li><M>{"0 \\le P(A) \\le 1"}</M>, and the sample space has probability 1.</li>
          <li>The complement rule: <M>{"P(\\text{not } A) = 1 - P(A)"}</M>.</li>
          <li>If <M>A</M> and <M>B</M> cannot both happen, <M>{"P(A \\text{ or } B) = P(A) + P(B)"}</M>.</li>
        </ol>
      </Proposition>
      <Proof>
        <p>
          Each holds for relative frequencies, for every <M>n</M>. A count <M>{"n_A"}</M> lies between 0 and <M>n</M>, and
          some outcome happens every time. Every trial is either in <M>A</M> or not, so{" "}
          <M>{"n_{\\text{not } A} = n - n_A"}</M>. If <M>A</M> and <M>B</M> never happen together, the trials where one of
          them happens are counted exactly once, so <M>{"n_{A \\text{ or } B} = n_A + n_B"}</M>. Divide by <M>n</M>, and
          each rule passes to the numbers the frequencies settle to.
        </p>
      </Proof>

      <Definition title="equally likely outcomes">
        <p>
          When a sample space has finitely many outcomes and symmetry gives us no reason to prefer one over another, we
          take them to be equally likely. Then, by the addition rule,
        </p>
        <MD>{"P(A) = \\frac{\\text{number of outcomes in } A}{\\text{number of outcomes in the sample space}}."}</MD>
      </Definition>

      <Example title="two dice">
        <p>
          Roll two dice. The 36 ordered outcomes <M>{"(1,1), (1,2), \\ldots, (6,6)"}</M> are equally likely. The total is 7
          for six of them, so <M>{"P(7) = \\tfrac{6}{36} = \\tfrac16"}</M>. The chance of at least one six is easiest by the
          complement: no six means both dice show 1 to 5, which is <M>{"5 \\times 5 = 25"}</M> outcomes, so the answer is{" "}
          <M>{"1 - \\tfrac{25}{36} = \\tfrac{11}{36}"}</M>. Counting principles from the last chapter do the work.
        </p>
      </Example>

      <Proposition title="independent events multiply">
        <p>
          If two experiments do not influence each other, the chance that <M>A</M> happens in the first and <M>B</M> in the
          second is <M>{"P(A) \\times P(B)"}</M>.
        </p>
      </Proposition>
      <p>
        In the long run, a proportion <M>{"P(A)"}</M> of all trials of the first experiment give <M>A</M>; among those,
        since the second experiment pays no attention to the first, a proportion <M>{"P(B)"}</M> give <M>B</M>. So five
        heads in a row has probability <M>{"\\left(\\tfrac12\\right)^5 = \\tfrac{1}{32}"}</M>: rare, but in a long run of
        tosses it will happen often. And the sixth toss, being independent, is still heads with probability{" "}
        <M>{"\\tfrac12"}</M>.
      </p>

      <Remark title="the gambler's fallacy">
        <p>
          On 18 August 1913, at the casino in Monte Carlo, the roulette ball fell on black 26 times in a row. Gamblers lost
          millions betting on red, sure that red was overdue. The belief that independent events balance themselves out in
          the short run is now called the <em>gambler&rsquo;s fallacy</em>. The long-run frequency is not enforced by
          correction; it emerges because the early results become a smaller and smaller part of the whole.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "die",
      rung: "check",
      prompt: <p>A fair die is rolled. What is the probability of a number greater than 4?</p>,
      answer: { kind: "numeric", value: 1 / 3 },
    },
    {
      key: "complement",
      rung: "check",
      prompt: <p>The probability of rain tomorrow is 0.35. What is the probability that it does not rain?</p>,
      answer: { kind: "numeric", value: 0.65 },
    },
    {
      key: "two-dice",
      rung: "apply",
      prompt: <p>Two fair dice are rolled. What is the probability that the total is 9?</p>,
      answer: { kind: "numeric", value: 1 / 9 },
    },
    {
      key: "at-least-one",
      rung: "apply",
      prompt: <p>A fair coin is tossed 4 times. What is the probability of at least one head?</p>,
      answer: { kind: "numeric", value: 15 / 16 },
    },
    {
      key: "fallacy",
      rung: "apply",
      prompt: <p>A fair coin has landed tails 8 times running. Select every true statement.</p>,
      answer: {
        kind: "choice",
        options: [
          "The next toss is heads with probability 1/2.",
          "Heads is now more likely, to even things out.",
          "Over many more tosses, the proportion of heads will still tend to 1/2.",
          "Eight tails in a row is impossible for a fair coin.",
        ],
        correct: [0, 2],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import random
random.seed(1)
flips = [random.random() < 0.5 for _ in range(100000)]
print(abs(sum(flips) / len(flips) - 0.5) < 0.01)`}</Code>
          <p>The fraction of heads in 100 000 fair flips. Is it within 0.01 of one half?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True", "False"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import random
random.seed(0)
a = [random.randint(1, 6) for _ in range(3)]
random.seed(0)
b = [random.randint(1, 6) for _ in range(3)]
print(a == b, len(set(random.sample(range(10), 10))))`}</Code>
          <p>Seeding a random generator twice. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True 10", "False 10", "True 9", "False 6"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>frequency(trial, n)</C>, which seeds <C>random</C> with 0, runs the function <C>trial()</C> n times and returns the fraction of runs that returned <C>True</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def frequency(trial, n):
    return 0.5
`,
        solution: `import random

def frequency(trial, n):
    random.seed(0)
    return sum(1 for _ in range(n) if trial()) / n
`,
        tests: [
          { name: "dice", code: `import random
f = frequency(lambda: random.randint(1, 6) == 6, 60000)
assert abs(f - 1 / 6) < 0.01, 'A six should come up about one time in six.'` },
          { name: "two dice", code: `import random
f = frequency(lambda: random.randint(1, 6) + random.randint(1, 6) == 7, 60000)
assert abs(f - 1 / 6) < 0.01, 'A total of 7 has probability 6/36.'` },
          { name: "seeded", code: `import random
assert frequency(lambda: random.random() < 0.3, 1000) == frequency(lambda: random.random() < 0.3, 1000), 'Seed with 0 so the answer is repeatable.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>LCG</C>, a linear congruential generator with <C>LCG(seed)</C>, state xₙ₊₁ = (1103515245·xₙ + 12345) mod 2³¹, and methods <C>next()</C> (the new state) and <C>random()</C> (the new state divided by 2³¹, in [0, 1)). Then write <C>estimate_pi(rng, n)</C>, which draws n points (x, y) with x then y from <C>rng.random()</C> and returns 4 times the fraction with x² + y² &lt; 1.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class LCG:
    def __init__(self, seed):
        self.x = seed
    def next(self):
        return self.x
    def random(self):
        return 0.5

def estimate_pi(rng, n):
    return 3.0
`,
        solution: `class LCG:
    M = 2 ** 31
    def __init__(self, seed):
        self.x = seed % self.M
    def next(self):
        self.x = (1103515245 * self.x + 12345) % self.M
        return self.x
    def random(self):
        return self.next() / self.M

def estimate_pi(rng, n):
    hits = 0
    for _ in range(n):
        x, y = rng.random(), rng.random()
        if x * x + y * y < 1:
            hits += 1
    return 4 * hits / n
`,
        tests: [
          { name: "sequence", code: `g = LCG(42)
assert [g.next() for _ in range(3)] == [1250496027, 1116302264, 1000676753], 'xₙ₊₁ = (1103515245·xₙ + 12345) mod 2³¹.'` },
          { name: "repeatable", code: `a, b = LCG(7), LCG(7)
assert [a.random() for _ in range(5)] == [b.random() for _ in range(5)] and all(0 <= LCG(s).random() < 1 for s in range(100)), 'The same seed gives the same stream.'` },
          { name: "pi", code: `v = estimate_pi(LCG(1), 200000)
assert abs(v - 3.14159) < 0.02, f'Expected about 3.14, got {v}.'` },
          { name: "uses rng", code: `v1, v2 = estimate_pi(LCG(1), 1000), estimate_pi(LCG(2), 1000)
assert v1 != v2 and estimate_pi(LCG(1), 1000) == v1, 'Draw the points from the generator you are given.'` },
        ],
      },
    },
    {
      key: "union",
      rung: "prove",
      prompt: (
        <p>
          Events <M>A</M> and <M>B</M> may happen together. Using relative frequencies, explain why{" "}
          <M>{"P(A \\text{ or } B) = P(A) + P(B) - P(A \\text{ and } B)"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that adding n_A and n_B counts the trials where both happen twice.",
          "Writes n_(A or B) = n_A + n_B − n_(A and B).",
          "Divides by n and passes to the long-run values to get the formula.",
        ],
      },
    },
    {
      key: "birthday",
      rung: "stretch",
      prompt: (
        <p>
          Ignoring leap years and assuming all 365 birthdays are equally likely, what is the probability that among 23
          people at least two share a birthday? Give a decimal to two places. (Find the complement first.)
        </p>
      ),
      answer: { kind: "numeric", value: 0.51, tolerance: 0.02 },
    },
  ],

  teachBack:
    "Explain to a friend what it means for a coin to have probability one half of heads, and why a run of five heads does not make tails more likely next.",

  glimpse: (
    <p>
      Next, expected value, the long-run average of a number that depends on chance. In Probability, these rules become
      the axioms of probability, and the long-run description becomes a theorem, the law of large numbers. Counting
      equally likely outcomes is the first chapter of that course, and independence returns in every model you will ever
      train, whenever data are assumed to be drawn independently.
    </p>
  ),
};
