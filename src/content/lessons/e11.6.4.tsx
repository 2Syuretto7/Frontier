import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MidTrainingViz } from "@/components/viz/MidTrainingViz";
import type { LessonContent } from "@/lib/types";

const SCHEDULE = `def wsd_lr(step, total, peak, warmup, decay):
    if step < warmup:
        return peak * (step + 1) / warmup         # linear warm-up
    if step < total - decay:
        return peak                               # stable phase
    return peak * (total - step) / decay          # linear decay towards zero

def mixture_at(step, total, decay, pre, mid):
    return mid if step >= total - decay else pre  # mid-training data arrives with the decay

def tokens_by_source(total, decay, pre, mid, tokens_per_step):
    out = {}
    for k in list(pre) + [k for k in mid if k not in pre]:
        out[k] = tokens_per_step * (pre.get(k, 0) * (total - decay) + mid.get(k, 0) * decay)
    return out`;

const LONG = `import math

def rope_freqs(dim, base):
    return [base ** (-2 * i / dim) for i in range(dim // 2)]   # radians per position, one per pair of dimensions

def wavelengths(freqs):
    return [2 * math.pi / f for f in freqs]       # positions per full rotation

def long_share(lengths, threshold, factor=1):
    long = sum(n for n in lengths if n >= threshold) * factor   # long documents repeated factor times
    short = sum(n for n in lengths if n < threshold)
    return long / (long + short)`;

export const lesson: LessonContent = {
  id: "e11.6.4",
  minutes: 50,
  links: {
    requires: ["e11.6.3", "l8.5.3"],
    revisits: ["l5.2.3", "l8.1.3"],
    foreshadows: ["e11.7.1"],
  },

  puzzle: (
    <>
      <p>
        A model has been pre-trained on trillions of web tokens with a context of 8,000 tokens. The team has a 20B-token corpus of
        carefully checked mathematics, a few billion tokens of long books and repositories, and a budget for perhaps a tenth more
        training. Mixing the mathematics evenly into the whole run would have diluted it to almost nothing; repeating it forty times
        would have overfit it. When should high-quality data enter, how much of it, and how does the model learn to read 128,000
        tokens at once?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Mid-training is a phase near the end of pre-training, usually coinciding with the decay of the learning rate, in which the
        mixture shifts toward smaller, higher-quality sources: curated web, mathematics, code, instruction-like text and reasoning
        traces. A falling learning rate lets the model settle into whatever it sees last, so scarce good data has its greatest effect
        there, and it is spent over a short window rather than repeated across the whole run. Context length is extended in the same
        spirit: a short final phase on long documents, with the positional encoding adjusted so that distant positions are not new to
        the model.
      </p>
      <MidTrainingViz />
    </>
  ),

  theory: (
    <>
      <Definition title="schedule and mixture">
        <p>
          <C>wsd_lr</C> is the warmup-stable-decay schedule (l8.5.3): linear warm-up over the first steps, a constant peak, and a
          linear decay to zero over the last <C>decay</C> steps. <C>mixture_at</C> returns the pre-training mixture before the decay
          starts and the mid-training mixture after. <C>tokens_by_source</C> totals the tokens each source contributes, listing the
          pre-training sources first.
        </p>
        <Code>{SCHEDULE}</Code>
      </Definition>

      <Theorem title="how often a mid-training source is repeated">
        <p>
          In a run of T tokens whose final fraction f uses the mid-training mixture, a source with U unique tokens, weight p before and
          m during the decay, contributes <M>{"T((1 - f)p + fm)"}</M> tokens. If p = 0 it is seen <M>{"fmT/U"}</M> times.
        </p>
      </Theorem>
      <Proof>
        <p>
          The first phase has <M>{"(1 - f)T"}</M> tokens, of which a share p comes from the source; the second has fT, of which a share
          m does. Adding gives the total. With p = 0 the total is fmT, and dividing by U gives the number of passes. Since repeating
          data beyond about four epochs gives sharply diminishing returns (l8.1.3), this bounds m for a small corpus:{" "}
          <M>{"m \\le 4U/(fT)"}</M>.
        </p>
      </Proof>

      <Definition title="positions for long context">
        <p>
          <C>rope_freqs</C> gives the rotary frequencies <M>{"\\theta_i = b^{-2i/d}"}</M> for each pair of dimensions (l5.2.3),{" "}
          <C>wavelengths</C> the number of positions per full turn, <M>{"2\\pi/\\theta_i"}</M>, and <C>long_share</C> the share of
          tokens that come from documents at least <C>threshold</C> long after those documents are repeated <C>factor</C> times.
        </p>
        <Code>{LONG}</Code>
      </Definition>

      <Theorem title="raising the RoPE base">
        <p>
          The wavelength of pair i is <M>{"\\lambda_i = 2\\pi b^{2i/d}"}</M>. Replacing the base b by sb multiplies{" "}
          <M>{"\\lambda_i"}</M> by <M>{"s^{2i/d}"}</M>: the fastest pair is unchanged and the slowest is stretched by{" "}
          <M>{"s^{1 - 2/d}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\lambda_i = 2\\pi/\\theta_i = 2\\pi b^{2i/d}"}</M>, and <M>{"(sb)^{2i/d} = s^{2i/d} b^{2i/d}"}</M>. At i = 0 the factor
          is 1; at <M>{"i = d/2 - 1"}</M> it is <M>{"s^{(d-2)/d}"}</M>. So the pairs that track nearby positions keep their meaning,
          while the slow pairs, which encode coarse position, rotate less over the new longer context and do not reach angles the model
          never saw in training.
        </p>
      </Proof>

      <Remark title="mid-training in practice">
        <p>
          Recent open models describe a final phase of a few hundred billion tokens with the learning rate annealed to zero and the
          mixture shifted toward curated sources; some also anneal small models on a candidate dataset to judge its value cheaply,
          extending the ablations of the previous lesson. Long-context extension typically raises the RoPE base, or rescales
          frequencies by band, and trains on sequences of increasing length, with long documents upsampled because naturally long
          documents are a small share of tokens. Evaluation then checks both long-context tasks and short-context benchmarks, since a
          poorly balanced phase can trade one for the other.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The mathematics enters only in the decay phase. With T = 15T tokens, f = 0.1 and a 20B-token corpus, keeping it to four
          epochs bounds its mid-training weight at <M>{"4 \\cdot 20/1500 \\approx 0.05"}</M>; a larger weight would need a longer
          decay or more unique data. A further short phase then raises the RoPE base and trains on long documents, upsampled so they
          supply a substantial share of tokens, before checking that short-context scores held.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "epochs",
      rung: "check",
      prompt: (
        <p>
          A 2T-token run uses its final 10% as a decay phase in which a 10B-token mathematics corpus has weight 0.3; it was absent
          before. How many times is the corpus seen?
        </p>
      ),
      answer: { kind: "numeric", value: 6, tolerance: 0.001 },
    },
    {
      key: "stretch_factor",
      rung: "check",
      prompt: (
        <p>
          With head dimension d = 128, the RoPE base is raised from 10,000 to 500,000. By what factor does the wavelength of pair
          i = 32 grow? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 7.07, tolerance: 0.01 },
    },
    {
      key: "why_decay",
      rung: "apply",
      prompt: <p>Why is scarce high-quality data usually added during the learning-rate decay rather than spread across the whole run?</p>,
      answer: {
        kind: "choice",
        options: [
          "It has its largest effect while the learning rate falls, and confining it to a short window avoids repeating it many times",
          "High-quality data cannot be learnt at a high learning rate at all",
          "The decay phase does not update the model's weights",
          "It makes the warm-up unnecessary",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def wsd_lr(step, total, peak, warmup, decay):
    if step < warmup:
        return peak * (step + 1) / warmup         # linear warm-up
    if step < total - decay:
        return peak                               # stable phase
    return peak * (total - step) / decay          # linear decay towards zero

def mixture_at(step, total, decay, pre, mid):
    return mid if step >= total - decay else pre  # mid-training data arrives with the decay

def tokens_by_source(total, decay, pre, mid, tokens_per_step):
    out = {}
    for k in list(pre) + [k for k in mid if k not in pre]:
        out[k] = tokens_per_step * (pre.get(k, 0) * (total - decay) + mid.get(k, 0) * decay)
    return out

pre, mid = {"web": 0.8, "code": 0.2}, {"web": 0.4, "code": 0.3, "math": 0.3}
print(wsd_lr(0, 100, 1.0, 10, 20), wsd_lr(50, 100, 1.0, 10, 20), wsd_lr(90, 100, 1.0, 10, 20), tokens_by_source(100, 20, pre, mid, 10))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.1 1.0 0.5 {'web': 720.0, 'code': 220.0, 'math': 60.0}",
          "0.1 1.0 0.45 {'web': 720.0, 'code': 220.0, 'math': 60.0}",
          "0.0 1.0 0.5 {'web': 720.0, 'code': 220.0, 'math': 60.0}",
          "0.1 1.0 0.5 {'web': 720.0, 'code': 220.0}",
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

def rope_freqs(dim, base):
    return [base ** (-2 * i / dim) for i in range(dim // 2)]   # radians per position, one per pair of dimensions

def wavelengths(freqs):
    return [2 * math.pi / f for f in freqs]       # positions per full rotation

def long_share(lengths, threshold, factor=1):
    long = sum(n for n in lengths if n >= threshold) * factor   # long documents repeated factor times
    short = sum(n for n in lengths if n < threshold)
    return long / (long + short)

fr = rope_freqs(4, 10000.0)
print(fr, [round(w, 1) for w in wavelengths(fr)], long_share([100, 900, 2000], 1000, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 0.01] [6.3, 628.3] 0.8",
          "[1.0, 0.01] [6.3, 628.3] 0.67",
          "[1.0, 0.1] [6.3, 62.8] 0.8",
          "[1.0, 0.01] [1.0, 100.0] 0.8",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>wsd_lr(step, total, peak, warmup, decay)</C>, with warm-up value <C>peak * (step + 1) / warmup</C> and decay value{" "}
          <C>peak * (total - step) / decay</C>; <C>mixture_at(step, total, decay, pre, mid)</C>; and{" "}
          <C>tokens_by_source(total, decay, pre, mid, tokens_per_step)</C>, a dict listing the sources of <C>pre</C> first, then new
          sources of <C>mid</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def wsd_lr(step, total, peak, warmup, decay):
    return peak

def mixture_at(step, total, decay, pre, mid):
    return pre

def tokens_by_source(total, decay, pre, mid, tokens_per_step):
    return {k: w * total * tokens_per_step for k, w in pre.items()}
`,
        solution: SCHEDULE,
        tests: [
          { name: "lr", code: `assert wsd_lr(1, 50, 2.0, 4, 10) == 1.0 and wsd_lr(20, 50, 2.0, 4, 10) == 2.0\nassert wsd_lr(45, 50, 2.0, 4, 10) == 1.0 and wsd_lr(49, 50, 2.0, 4, 10) == 0.2` },
          { name: "mixture", code: `p, m = {"a": 1.0}, {"a": 0.5, "b": 0.5}\nassert mixture_at(39, 50, 10, p, m) is p and mixture_at(40, 50, 10, p, m) is m\nt = tokens_by_source(50, 10, p, m, 2)\nassert list(t) == ["a", "b"] and t == {"a": 90.0, "b": 10.0}` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rope_freqs(dim, base)</C>; <C>wavelengths(freqs)</C>; and <C>long_share(lengths, threshold, factor=1)</C>, where a
          document counts as long if its length is at least <C>threshold</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def rope_freqs(dim, base):
    return [1.0] * (dim // 2)

def wavelengths(freqs):
    return list(freqs)

def long_share(lengths, threshold, factor=1):
    return 0.0
`,
        solution: LONG,
        tests: [
          { name: "rope", code: `f = rope_freqs(6, 64.0)\nassert len(f) == 3 and all(abs(a - b) < 1e-12 for a, b in zip(f, [1.0, 0.25, 0.0625]))\nassert all(abs(a - b) < 1e-9 for a, b in zip(wavelengths([1.0, 0.5]), [2 * math.pi, 4 * math.pi]))` },
          { name: "share", code: `assert long_share([10, 30, 60], 30) == 0.9 and long_share([10, 30, 60], 31, 3) == 180 / 220\nassert long_share([5, 5], 100) == 0` },
        ],
      },
    },
    {
      key: "cap",
      rung: "stretch",
      prompt: (
        <p>
          An 8B-token corpus is used only in the decay phase, which is the final 20% of a 1T-token run. What is the largest
          mid-training weight that keeps it to at most four epochs?
        </p>
      ),
      answer: { kind: "numeric", value: 0.16, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Mid-training increasingly relies on data that no one wrote: worked solutions, reasoning traces and rewritten documents produced
        by other models. The next chapter turns to generating such synthetic data and to the checks it needs.
      </p>
    </>
  ),
};
