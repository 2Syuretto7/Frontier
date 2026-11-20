import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SampleDiversityViz } from "@/components/viz/SampleDiversityViz";
import type { LessonContent } from "@/lib/types";

const PROMPTS = `from itertools import product

def prompt_grid(personas, topics, styles):
    return [f"As {p}, write a {s} about {t}." for p, t, s in product(personas, topics, styles)]

def distinct_n(texts, n):
    grams = [tuple(w[i:i + n]) for w in (t.split() for t in texts) for i in range(len(w) - n + 1)]
    return len(set(grams)) / len(grams) if grams else 0.0   # 1.0: no n-gram repeats

def unique_fraction(texts):
    return len({t.strip().lower() for t in texts}) / len(texts)`;

const SAMPLING = `import math

def softmax_t(logits, t):
    m = max(logits)
    e = [math.exp((x - m) / t) for x in logits]   # temperature t divides the logits
    s = sum(e)
    return [x / s for x in e]

def expected_distinct(probs, k):
    return sum(1 - (1 - p) ** k for p in probs)    # chance each outcome appears at least once in k draws

def entropy(probs):
    return -sum(p * math.log2(p) for p in probs if p > 0)`;

export const lesson: LessonContent = {
  id: "e11.7.1",
  minutes: 50,
  links: {
    requires: ["e11.1.4", "l9.1.1"],
    revisits: ["l9.2.2", "e11.4.2"],
    foreshadows: ["e11.7.2"],
  },

  puzzle: (
    <>
      <p>
        A team asks a strong model for a million grade-school word problems with worked solutions, using one prompt and a high
        temperature. Deduplication removes most of them: the same few dozen scenarios about apples and trains, with numbers changed.
        Another team asks for the same million, but each prompt names a different person, setting and skill to practise, and keeps
        nearly all of them. Why does variety have to be put into the prompts rather than drawn out of the sampler?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Synthetic data is text produced by a model for training another (e11.1.4). A model asked the same question many times returns
        its favourite answers again and again; raising the temperature flattens the distribution but buys variety by sampling text the
        model rates as worse. The reliable source of diversity is the conditioning: seed documents to rephrase, lists of topics,
        personas, difficulty levels and formats, combined systematically so each prompt asks for something different. Diversity is
        then measured, and duplicates removed, before anything is kept.
      </p>
      <SampleDiversityViz />
    </>
  ),

  theory: (
    <>
      <Definition title="prompts and diversity measures">
        <p>
          <C>prompt_grid</C> forms one prompt per combination of persona, topic and style, in the order of{" "}
          <C>itertools.product</C>. <C>distinct_n</C> is the number of distinct word n-grams across all texts divided by the total
          number of n-grams. <C>unique_fraction</C> is the share of texts that remain after lower-casing, trimming and removing exact
          duplicates.
        </p>
        <Code>{PROMPTS}</Code>
      </Definition>

      <Theorem title="repetition caps distinct-n">
        <p>
          If a collection consists of r copies of each of its texts, its distinct-n is at most 1/r.
        </p>
      </Theorem>
      <Proof>
        <p>
          Every n-gram occurrence in one copy of a text is matched by an occurrence in each of the other r − 1 copies, so every distinct
          n-gram occurs at least r times. The number of distinct n-grams is therefore at most the total divided by r. A generator that
          keeps returning the same few outputs has low distinct-n even before exact duplicates are counted, which is why it is tracked
          alongside near-duplicate detection (e11.4.2).
        </p>
      </Proof>

      <Definition title="sampling and variety">
        <p>
          <C>softmax_t</C> divides the logits by the temperature t before the softmax. <C>expected_distinct</C> is the expected number
          of different outcomes in k independent draws, and <C>entropy</C> is the Shannon entropy in bits.
        </p>
        <Code>{SAMPLING}</Code>
      </Definition>

      <Theorem title="expected number of distinct samples">
        <p>
          Drawing k times independently from probabilities <M>{"p_1, \\dots, p_N"}</M>, the expected number of distinct outcomes is{" "}
          <M>{"\\sum_i \\big(1 - (1 - p_i)^k\\big)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"X_i"}</M> be 1 if outcome i appears at least once. It fails to appear in all k draws with probability{" "}
          <M>{"(1 - p_i)^k"}</M>, so <M>{"\\mathbb{E}[X_i] = 1 - (1 - p_i)^k"}</M>. The number of distinct outcomes is{" "}
          <M>{"\\sum_i X_i"}</M>, and linearity of expectation gives the result. When a few <M>{"p_i"}</M> dominate, the sum grows very
          slowly in k: more samples mostly repeat what was already drawn.
        </p>
      </Proof>

      <Remark title="how synthetic data is generated in practice">
        <p>
          Common recipes include rephrasing web documents into cleaner styles such as encyclopaedia entries or question and answer
          pairs; textbook-style explanations and exercises on enumerated topics; instruction data grown from a few seed tasks by asking a
          model for new ones (l9.1.1); persona-driven prompts that condition on a large set of described people; and distilling a
          teacher&apos;s full responses into a student (l9.2.2). Each recipe needs a licence that permits training on the generator&apos;s
          outputs, and each inherits the generator&apos;s errors, which the next lesson filters out.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          With one prompt, the model&apos;s distribution over scenarios has a few heavy modes, so a million draws contain only a few
          dozen of them many times over, and a higher temperature adds mostly noise. A grid of thousands of personas, settings and skills
          makes each prompt ask for a different problem; distinct-n and deduplication then confirm that the variety is real.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "grid",
      rung: "check",
      prompt: <p>A prompt grid combines 50 personas, 20 topics and 4 formats. How many prompts does it contain?</p>,
      answer: { kind: "numeric", value: 4000, tolerance: 0 },
    },
    {
      key: "distinct",
      rung: "check",
      prompt: (
        <p>
          A generator returns one of 10 equally likely answers. What is the expected number of distinct answers in 10 samples? Give two
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 6.51, tolerance: 0.01 },
    },
    {
      key: "why_grid",
      rung: "apply",
      prompt: <p>Why is diversity in synthetic data usually created through the prompts rather than by raising the temperature?</p>,
      answer: {
        kind: "choice",
        options: [
          "A higher temperature adds variety only by sampling outputs the model rates as worse, while varied prompts ask for genuinely different content",
          "Temperature has no effect on the outputs of large models",
          "Varied prompts make deduplication unnecessary",
          "A higher temperature makes generation slower",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from itertools import product

def prompt_grid(personas, topics, styles):
    return [f"As {p}, write a {s} about {t}." for p, t, s in product(personas, topics, styles)]

def distinct_n(texts, n):
    grams = [tuple(w[i:i + n]) for w in (t.split() for t in texts) for i in range(len(w) - n + 1)]
    return len(set(grams)) / len(grams) if grams else 0.0   # 1.0: no n-gram repeats

def unique_fraction(texts):
    return len({t.strip().lower() for t in texts}) / len(texts)

ps = prompt_grid(["a chef", "a pilot"], ["rain", "maps"], ["poem"])
print(len(ps), ps[1], distinct_n(["a b a b", "a b c"], 2), round(unique_fraction(["Hi", "hi ", "yo"]), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "4 As a chef, write a poem about maps. 0.6 0.67",
          "4 As a pilot, write a poem about rain. 0.6 0.67",
          "4 As a chef, write a poem about maps. 0.75 0.67",
          "4 As a chef, write a poem about maps. 0.6 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def softmax_t(logits, t):
    m = max(logits)
    e = [math.exp((x - m) / t) for x in logits]   # temperature t divides the logits
    s = sum(e)
    return [x / s for x in e]

def expected_distinct(probs, k):
    return sum(1 - (1 - p) ** k for p in probs)    # chance each outcome appears at least once in k draws

def entropy(probs):
    return -sum(p * math.log2(p) for p in probs if p > 0)

p = softmax_t([2.0, 1.0, 0.0], 1.0)
print([round(x, 2) for x in p], round(expected_distinct([0.5, 0.5], 2), 2), entropy([0.25] * 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.67, 0.24, 0.09] 1.5 2.0",
          "[0.67, 0.24, 0.09] 2.0 2.0",
          "[0.67, 0.24, 0.09] 1.5 1.39",
          "[0.67, 0.33, 0.0] 1.5 2.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>prompt_grid(personas, topics, styles)</C>, producing <C>{"\"As {p}, write a {s} about {t}.\""}</C>;{" "}
          <C>distinct_n(texts, n)</C>, returning 0.0 when there are no n-grams; and <C>unique_fraction(texts)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from itertools import product

def prompt_grid(personas, topics, styles):
    return []

def distinct_n(texts, n):
    return 1.0

def unique_fraction(texts):
    return 1.0
`,
        solution: PROMPTS,
        tests: [
          { name: "grid", code: `g = prompt_grid(["x", "y"], ["t"], ["song", "list"])\nassert g == ["As x, write a song about t.", "As x, write a list about t.", "As y, write a song about t.", "As y, write a list about t."]` },
          { name: "measures", code: `assert distinct_n(["p q p q p"], 2) == 0.5 and distinct_n(["one"], 2) == 0.0 and distinct_n(["u v", "w"], 1) == 1.0\nassert unique_fraction([" A", "a", "B ", "b", "c"]) == 0.6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>softmax_t(logits, t)</C>, subtracting the largest logit for stability; <C>expected_distinct(probs, k)</C>; and{" "}
          <C>entropy(probs)</C> in bits, skipping zero probabilities.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def softmax_t(logits, t):
    return [1 / len(logits)] * len(logits)

def expected_distinct(probs, k):
    return float(k)

def entropy(probs):
    return 0.0
`,
        solution: SAMPLING,
        tests: [
          { name: "softmax", code: `p = softmax_t([0.0, math.log(3)], 1.0)\nassert abs(p[0] - 0.25) < 1e-12 and abs(p[1] - 0.75) < 1e-12\nq = softmax_t([0.0, math.log(3)], 0.5)\nassert abs(q[1] - 0.9) < 1e-12 and abs(sum(softmax_t([1000.0, 999.0], 2.0)) - 1) < 1e-12` },
          { name: "distinct", code: `assert abs(expected_distinct([1.0, 0.0], 5) - 1) < 1e-12 and abs(expected_distinct([0.5, 0.25, 0.25], 1) - 1) < 1e-12\nassert abs(expected_distinct([0.5, 0.5], 3) - 1.75) < 1e-12 and entropy([1.0, 0.0]) == 0 and abs(entropy([0.5, 0.25, 0.25]) - 1.5) < 1e-12` },
        ],
      },
    },
    {
      key: "half",
      rung: "stretch",
      prompt: (
        <p>
          Prompts are drawn uniformly with replacement from a grid of 1,000. What is the smallest number of draws for which the expected
          number of distinct prompts reaches 500?
        </p>
      ),
      answer: { kind: "numeric", value: 693, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Generated data is varied only if the prompts are, and correct only if someone checks. The next lesson keeps the good samples:
        rejection sampling against verifiers, reward models and consistency checks.
      </p>
    </>
  ),
};
