import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AnnealMixViz } from "@/components/viz/AnnealMixViz";
import type { LessonContent } from "@/lib/types";

const MIXES = `def mix_weights(base, hq, frac):
    keys = set(base) | set(hq)
    w = {k: (1 - frac) * base.get(k, 0.0) + frac * hq.get(k, 0.0) for k in keys}
    total = sum(w.values())
    return {k: v / total for k, v in w.items()}

def phase_weights(step, decay_start, base, anneal):
    return base if step < decay_start else anneal

def tokens_by_source(weights, n_tokens):
    return {k: w * n_tokens for k, w in weights.items()}`;

const SOUPS = `def soup(models):
    n = len(models)
    return [sum(ws) / n for ws in zip(*models)]

def repeats(weights, n_tokens, sizes):
    return {k: weights[k] * n_tokens / sizes[k] for k in weights}

def max_fraction(size, n_tokens, max_epochs):
    return min(1.0, max_epochs * size / n_tokens)`;

export const lesson: LessonContent = {
  id: "l8.7.1",
  minutes: 45,
  links: {
    requires: ["l8.5.3", "l8.1.2"],
    revisits: ["l8.1.4", "l8.1.3"],
    foreshadows: ["l8.7.2", "l10.1.3"],
  },

  puzzle: (
    <>
      <p>
        The Llama 3 team found that switching the last part of training of its 8-billion-parameter model to a small amount of
        high-quality mathematics and code improved its GSM8K score by 24.0%, in the report&apos;s words. The same trick did almost nothing for the
        405-billion-parameter model. Why does data at the end of training matter so much more than the same data in the
        middle, and why less for the largest model?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        During the stable phase of a schedule the learning rate is high, and the model keeps moving: what it learned from a
        batch is partly overwritten by later ones. In the decay the steps shrink and the model settles, so the data it sees
        then leaves a lasting mark. That makes the decay the natural place for the best data, and it makes a short decay on a
        candidate dataset a cheap test of whether that dataset helps. A large model that already does well on a domain has
        less to gain from the switch.
      </p>
      <AnnealMixViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the annealing mixture">
        <p>
          Training uses the base mixture before the decay starts and an annealing mixture after (<C>phase_weights</C>). The annealing
          mixture is often a blend <M>{"w = (1 - f)\\,w_{\\text{base}} + f\\,w_{\\text{hq}}"}</M> of the base and a high-quality set, renormalised
          (<C>mix_weights</C>), and the token budget of each source follows (<C>tokens_by_source</C>). The high-quality sets are typically
          curated mathematics, code, textbook-like and instruction-like data, together with a slice of filtered web text so that
          general ability does not regress.
        </p>
        <Code>{MIXES}</Code>
      </Definition>

      <Remark title="annealing as a data test">
        <p>
          Llama 3 used short anneals to judge datasets. Taking a half-trained 8B checkpoint, it decayed the learning rate to zero
          over 40 billion tokens with 30% of the weight on the candidate set and 70% on the default mix, and compared benchmark
          scores with a control anneal. This is far cheaper than a scaling-law study per dataset, and OLMo 2 used the same idea,
          calling these short runs micro-anneals, to choose its mid-training mix.
        </p>
      </Remark>

      <Definition title="repetition and averaging">
        <p>
          High-quality sets are small, so an anneal may repeat them. The number of epochs of each source is its weight times the
          token budget over its size (<C>repeats</C>), and a cap of e epochs limits a source of size D to a weight of at most{" "}
          <M>{"\\min(1, eD/N)"}</M> in an anneal of N tokens (<C>max_fraction</C>); l8.1.3 suggests a cap of about four. Because each anneal
          ends in a different nearby minimum, averaging the weights of several anneals run from the same checkpoint with different
          data orders, a model soup (<C>soup</C>), often beats each of them. OLMo 2 souped several anneals, and Llama 3 averaged
          checkpoints from within its anneal.
        </p>
        <Code>{SOUPS}</Code>
      </Definition>

      <Theorem title="averaging two models in a quadratic basin">
        <p>
          Let <M>{"L(w) = L^* + \\sum_i a_i (w_i - w_i^*)^2"}</M> with <M>{"a_i > 0"}</M>. For any <M>{"w^{(1)}, w^{(2)}"}</M> with difference{" "}
          <M>{"\\Delta = w^{(1)} - w^{(2)}"}</M>,
        </p>
        <MD>{"L\\!\\left(\\tfrac12(w^{(1)} + w^{(2)})\\right) = \\tfrac12\\left(L(w^{(1)}) + L(w^{(2)})\\right) - \\sum_i a_i\\,(\\Delta_i/2)^2."}</MD>
      </Theorem>
      <Proof>
        <p>
          In each coordinate write <M>{"u = w^{(1)}_i - w_i^*"}</M> and <M>{"v = w^{(2)}_i - w_i^*"}</M>. Then{" "}
          <M>{"\\tfrac12(u^2 + v^2) - (\\tfrac12(u+v))^2 = \\tfrac14(u - v)^2 = (\\Delta_i/2)^2"}</M>. Multiplying by <M>{"a_i"}</M> and summing gives the claim.
          The soup is never worse than the average of its members, and gains most when they differ along steep directions.
          Real losses are only locally quadratic, so this holds when the models share a basin, as anneals from one checkpoint do.
        </p>
      </Proof>

      <Example title="why benchmarks overstate the gain">
        <p>
          Annealing sets rich in question-and-answer data look like benchmarks, and some contain near-copies of benchmark items.
          A jump in GSM8K after an anneal is partly a real gain in arithmetic reasoning and partly a gain in familiarity with
          the format. Careful reports decontaminate the annealing data against their evaluations and check held-out tasks of the
          same kind; l10.1.3 treats contamination in detail.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "code",
      rung: "check",
      prompt: (
        <p>
          The base mixture is 80% web and 20% code. The high-quality set is 50% mathematics and 50% code. An anneal of 50 billion
          tokens blends them with f = 0.4. How many billion tokens of code does it use?
        </p>
      ),
      answer: { kind: "numeric", value: 16, tolerance: 0.01 },
    },
    {
      key: "cap",
      rung: "check",
      prompt: <p>A curated set has 6 billion tokens and may be repeated at most four times. What is the largest weight it can have in a 100-billion-token anneal? Give two decimals.</p>,
      answer: { kind: "numeric", value: 0.24, tolerance: 0.001 },
    },
    {
      key: "where",
      rung: "apply",
      prompt: <p>Why is the high-quality data placed in the learning-rate decay rather than spread evenly through training?</p>,
      answer: {
        kind: "choice",
        options: [
          "While the rate is high, later batches overwrite much of what earlier ones taught; in the decay the model settles, so the data seen then has a lasting effect",
          "High-quality data has lower loss, so it can only be used with a small learning rate",
          "Data seen at the end of training is never forgotten, whatever the learning rate",
          "The decay phase uses longer sequences, which high-quality data needs",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def mix_weights(base, hq, frac):
    keys = set(base) | set(hq)
    w = {k: (1 - frac) * base.get(k, 0.0) + frac * hq.get(k, 0.0) for k in keys}
    total = sum(w.values())
    return {k: v / total for k, v in w.items()}

def phase_weights(step, decay_start, base, anneal):
    return base if step < decay_start else anneal

def tokens_by_source(weights, n_tokens):
    return {k: w * n_tokens for k, w in weights.items()}

w = mix_weights({"web": 1.0}, {"math": 1.0}, 0.25)
print(w["web"], w["math"], phase_weights(5, 10, "base", "anneal"), phase_weights(10, 10, "base", "anneal"))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.75 0.25 base anneal\n{'code': 4.0, 'web': 4.0}",
          "0.25 0.75 base anneal\n{'code': 4.0, 'web': 4.0}",
          "0.75 0.25 base base\n{'code': 4.0, 'web': 4.0}",
          "0.75 0.25 base anneal\n{'code': 0.5, 'web': 0.5}",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def soup(models):
    n = len(models)
    return [sum(ws) / n for ws in zip(*models)]

def repeats(weights, n_tokens, sizes):
    return {k: weights[k] * n_tokens / sizes[k] for k in weights}

def max_fraction(size, n_tokens, max_epochs):
    return min(1.0, max_epochs * size / n_tokens)

print(tokens_by_source({"code": 0.5, "web": 0.5}, 8))
print(soup([[1.0, 2.0], [3.0, 6.0]]), repeats({"math": 0.5}, 100, {"math": 25}))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2.0, 4.0] {'math': 2.0}\n0.2 1.0",
          "[2.0, 4.0] {'math': 0.5}\n0.2 1.0",
          "[4.0, 8.0] {'math': 2.0}\n0.2 2.0",
          "[2.0, 4.0] {'math': 2.0}\n0.02 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mix_weights(base, hq, frac)</C>, which blends two dictionaries of weights over the union of their keys and
          renormalises, <C>phase_weights(step, decay_start, base, anneal)</C> and <C>tokens_by_source(weights, n_tokens)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def mix_weights(base, hq, frac):
    return dict(base)

def phase_weights(step, decay_start, base, anneal):
    return anneal

def tokens_by_source(weights, n_tokens):
    return {k: n_tokens for k in weights}
`,
        solution: MIXES,
        tests: [
          { name: "mix", code: `w = mix_weights({"a": 0.6, "b": 0.4}, {"b": 0.2, "c": 0.8}, 0.5)\nassert abs(w["a"] - 0.3) < 1e-12 and abs(w["b"] - 0.3) < 1e-12 and abs(w["c"] - 0.4) < 1e-12\nw = mix_weights({"a": 2.0}, {"b": 2.0}, 0.5)\nassert abs(w["a"] - 0.5) < 1e-12` },
          { name: "phase", code: `assert phase_weights(99, 100, 1, 2) == 1 and phase_weights(100, 100, 1, 2) == 2\nt = tokens_by_source({"a": 0.25, "b": 0.75}, 40)\nassert abs(t["a"] - 10) < 1e-9 and abs(t["b"] - 30) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>soup(models)</C>, the elementwise mean of a list of weight lists, <C>repeats(weights, n_tokens, sizes)</C> and{" "}
          <C>max_fraction(size, n_tokens, max_epochs)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def soup(models):
    return models[0]

def repeats(weights, n_tokens, sizes):
    return {k: 1.0 for k in weights}

def max_fraction(size, n_tokens, max_epochs):
    return size / n_tokens
`,
        solution: SOUPS,
        tests: [
          { name: "soup", code: `s = soup([[0.0, 3.0, 1.0], [1.0, 0.0, 1.0], [2.0, 0.0, 4.0]])\nassert all(abs(a - b) < 1e-12 for a, b in zip(s, [1.0, 1.0, 2.0]))` },
          { name: "reps", code: `r = repeats({"m": 0.2, "c": 0.1}, 300, {"m": 20, "c": 60})\nassert abs(r["m"] - 3.0) < 1e-12 and abs(r["c"] - 0.5) < 1e-12 and abs(max_fraction(5, 200, 3) - 0.075) < 1e-12 and max_fraction(50, 100, 4) == 1.0` },
        ],
      },
    },
    {
      key: "soupgain",
      rung: "stretch",
      prompt: (
        <p>
          The loss near the end of training is <M>{"(w_1 - 1)^2 + 3(w_2 + 0.5)^2"}</M> plus a constant. Two anneals end at (0.4, 0) and
          (1.2, −0.8). By how much is the loss of their soup below the average of their two losses? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.64, tolerance: 0.005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Mid-training is also where the context window grows. Most pretraining runs on sequences of a few thousand tokens; the
        next lesson shows how a model trained that way is stretched to a hundred thousand or more.
      </p>
    </>
  ),
};
