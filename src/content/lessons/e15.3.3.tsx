import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RopeWavelengthViz } from "@/components/viz/RopeWavelengthViz";
import type { LessonContent } from "@/lib/types";

const MIX = `def anneal_mix(base, hq, frac):
    keys = sorted(set(base) | set(hq))
    mix = {k: (1 - frac) * base.get(k, 0) + frac * hq.get(k, 0) for k in keys}
    z = sum(mix.values())
    return {k: v / z for k, v in mix.items()}

def tokens_by_source(phases):
    out = {}
    for mix, total in phases:                              # each phase: (mixture, tokens trained)
        for k, w in mix.items():
            out[k] = out.get(k, 0) + w * total
    return out

def epochs(used, unique):
    return {k: used[k] / unique[k] for k in used}`;

const ROPE = `import math

def rope_freqs(dim, base):
    return [base ** (-2 * i / dim) for i in range(dim // 2)]

def wavelengths(dim, base):
    return [2 * math.pi / f for f in rope_freqs(dim, base)]   # tokens per full turn of each pair

def ntk_base(base, factor, dim):
    return base * factor ** (dim / (dim - 2))              # stretches the slowest pair by the factor`;

export const lesson: LessonContent = {
  id: "e15.3.3",
  minutes: 45,
  links: {
    requires: ["e15.3.2"],
    revisits: ["l8.7.1", "l8.7.2", "l8.7.3", "e11.6.4"],
    foreshadows: ["e15.4.1"],
  },

  puzzle: (
    <>
      <p>
        The last fifth of the main run decays the learning rate, and the loss drops sharply. Whatever data the model sees
        in that phase leaves an outsized mark, because the model is settling rather than wandering. Meanwhile, the model
        was trained on 4096-token sequences, but the post-training data and the serving plan want 16k. Can the decay
        phase both improve quality and extend the context, and how can it do so without wasting the scarce good data?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Mid-training changes the mixture as the learning rate falls: more educational text, code, mathematics and
        instruction-like data, which are scarce, so they are repeated a few times rather than spread across the whole
        run. In a final stretch, longer sequences are introduced with the rotary base raised, so that the slowest
        rotary frequencies stretch to cover the new length. Both changes are cheap because they happen once, near the end,
        on a small share of tokens.
      </p>
      <RopeWavelengthViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the annealing mixture">
        <p>
          The decay mixture blends the base mixture with a high-quality one, renormalised (<C>anneal_mix</C>). Over all
          phases of the run, each source contributes its weight times each phase&apos;s tokens (<C>tokens_by_source</C>),
          and dividing by the unique tokens available gives epochs per source (<C>epochs</C>), which should stay within
          the few repetitions that e15.1.2 found nearly free.
        </p>
        <Code>{MIX}</Code>
      </Definition>

      <Definition title="rotary frequencies">
        <p>
          Rotary embeddings rotate pairs of query and key coordinates by angles proportional to position, at frequencies{" "}
          <M>{"\\theta_i = b^{-2i/d}"}</M> for i from 0 to d/2 − 1, with base b and head width d (<C>rope_freqs</C>). Pair i
          completes a turn every <M>{"2\\pi/\\theta_i"}</M> tokens (<C>wavelengths</C>). Pairs whose wavelength exceeds
          the training context never see a full turn, so positions beyond the context put them at angles they have
          never seen. Raising the base for the longer context, the NTK-aware scaling of l8.7.2, keeps those angles in
          range (<C>ntk_base</C>).
        </p>
        <Code>{ROPE}</Code>
      </Definition>

      <Theorem title="what NTK-aware scaling does to each frequency">
        <p>
          Replacing the base b by <M>{"b' = b\\,s^{d/(d-2)}"}</M> multiplies frequency i by{" "}
          <M>{"s^{-2i/(d-2)}"}</M>. The fastest pair is unchanged and the slowest is divided by exactly s.
        </p>
      </Theorem>
      <Proof>
        <MD>{"\\theta'_i = (b')^{-2i/d} = b^{-2i/d}\\, s^{-\\frac{d}{d-2}\\cdot\\frac{2i}{d}} = \\theta_i\\, s^{-2i/(d-2)}"}</MD>
        <p>
          For i = 0 the factor is 1. For the slowest pair, i = d/2 − 1, the exponent is{" "}
          <M>{"-2(d/2-1)/(d-2) = -1"}</M>, so its frequency is divided by s and its wavelength multiplied by s, matching a
          context s times longer. Pairs in between are stretched by intermediate factors. The fast pairs, which encode
          local order, are left almost as they were, unlike position interpolation, which divides every frequency by s
          and blurs nearby positions.
        </p>
      </Proof>

      <Example title="the capstone mid-training">
        <p>
          During the decay, about 2 billion tokens: half the base mixture and half a high-quality mixture of educational
          web text, code and mathematics, as in l8.7.1 and e11.6.4. In the last few hundred million tokens, sequences of
          16k from long documents and concatenated code repositories, with the rotary base raised by the NTK formula for a
          factor of 4. A needle-in-a-haystack check and held-out loss at long positions, as in l8.7.3, confirm the new
          context works before post-training begins.
        </p>
      </Example>

      <Remark title="mid-training and evaluation">
        <p>
          Benchmarks often jump during the anneal, partly because high-quality data resembles their style. The
          evaluation plan&apos;s decontamination must be rerun against the annealing data, which is where contamination
          is most likely to enter, since curated sources such as textbooks and question-answer sites overlap benchmarks
          more than random web pages.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "epochs",
      rung: "check",
      prompt: (
        <p>
          The stable phase trains 8 billion tokens on a mixture of web 0.7, code 0.2 and mathematics 0.1. The decay trains
          2 billion tokens on an equal blend of that mixture with web 0.4, code 0.3 and mathematics 0.3. With 0.25 billion
          unique mathematics tokens, how many epochs of mathematics does the run make?
        </p>
      ),
      answer: { kind: "numeric", value: 4.8, tolerance: 0.001 },
    },
    {
      key: "base",
      rung: "check",
      prompt: (
        <p>
          A model with head width 64 and rotary base 10000 is extended to a context 4 times longer by NTK-aware scaling.
          What is the new base, to one decimal?
        </p>
      ),
      answer: { kind: "numeric", value: 41829.4, tolerance: 0.1 },
    },
    {
      key: "when",
      rung: "apply",
      prompt: <p>Why is high-quality data concentrated in the decay phase rather than spread over the whole run?</p>,
      answer: {
        kind: "choice",
        options: [
          "Data seen while the learning rate falls has a lasting effect, and the scarce data can be repeated a few times there",
          "High-quality data cannot be used at a high learning rate",
          "The decay phase uses a different tokeniser",
          "Spreading it would contaminate the benchmarks",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def anneal_mix(base, hq, frac):
    keys = sorted(set(base) | set(hq))
    mix = {k: (1 - frac) * base.get(k, 0) + frac * hq.get(k, 0) for k in keys}
    z = sum(mix.values())
    return {k: v / z for k, v in mix.items()}

def tokens_by_source(phases):
    out = {}
    for mix, total in phases:                              # each phase: (mixture, tokens trained)
        for k, w in mix.items():
            out[k] = out.get(k, 0) + w * total
    return out

def epochs(used, unique):
    return {k: used[k] / unique[k] for k in used}

print(anneal_mix({"web": 0.8, "code": 0.2}, {"web": 0.2, "math": 0.8}, 0.5))
u = tokens_by_source([({"a": 0.5, "b": 0.5}, 10), ({"a": 1.0}, 4)]); print(u, epochs(u, {"a": 3, "b": 5}))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'code': 0.1, 'math': 0.4, 'web': 0.5}\n{'a': 9.0, 'b': 5.0} {'a': 3.0, 'b': 1.0}",
          "{'web': 0.5, 'code': 0.1, 'math': 0.4}\n{'a': 9.0, 'b': 5.0} {'a': 3.0, 'b': 1.0}",
          "{'code': 0.2, 'math': 0.8, 'web': 1.0}\n{'a': 9.0, 'b': 5.0} {'a': 3.0, 'b': 1.0}",
          "{'code': 0.1, 'math': 0.4, 'web': 0.5}\n{'a': 5.0, 'b': 5.0} {'a': 1.6666666666666667, 'b': 1.0}",
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
    return [base ** (-2 * i / dim) for i in range(dim // 2)]

def wavelengths(dim, base):
    return [2 * math.pi / f for f in rope_freqs(dim, base)]   # tokens per full turn of each pair

def ntk_base(base, factor, dim):
    return base * factor ** (dim / (dim - 2))              # stretches the slowest pair by the factor

print(rope_freqs(4, 100), [round(w, 3) for w in wavelengths(4, 100)])
print(ntk_base(100, 4, 4), rope_freqs(4, ntk_base(100, 4, 4))[1] * 4)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 0.1] [6.283, 62.832]\n1600.0 0.1",
          "[1.0, 0.01] [6.283, 628.319]\n1600.0 0.1",
          "[1.0, 0.1] [6.283, 62.832]\n400.0 0.2",
          "[0.1, 1.0] [62.832, 6.283]\n1600.0 0.1",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>anneal_mix(base, hq, frac)</C>, with keys sorted and weights renormalised;{" "}
          <C>tokens_by_source(phases)</C> for a list of (mixture, tokens) pairs; and <C>epochs(used, unique)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def anneal_mix(base, hq, frac):
    return dict(base)

def tokens_by_source(phases):
    return {}

def epochs(used, unique):
    return {k: 1.0 for k in used}
`,
        solution: MIX,
        tests: [
          { name: "mix", code: `assert anneal_mix({"a": 1.0}, {"b": 1.0}, 0.25) == {"a": 0.75, "b": 0.25} and anneal_mix({"a": 2, "b": 2}, {}, 0) == {"a": 0.5, "b": 0.5}` },
          { name: "count", code: `u = tokens_by_source([({"x": 0.25, "y": 0.75}, 8), ({"y": 1.0}, 2)]); assert u == {"x": 2.0, "y": 8.0} and epochs(u, {"x": 4, "y": 2}) == {"x": 0.5, "y": 4.0} and tokens_by_source([]) == {}` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rope_freqs(dim, base)</C>; <C>wavelengths(dim, base)</C>, in tokens per turn; and{" "}
          <C>ntk_base(base, factor, dim)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def rope_freqs(dim, base):
    return [1.0] * (dim // 2)

def wavelengths(dim, base):
    return rope_freqs(dim, base)

def ntk_base(base, factor, dim):
    return base * factor
`,
        solution: ROPE,
        tests: [
          { name: "freqs", code: `assert all(abs(a - b) < 1e-12 for a, b in zip(rope_freqs(6, 64), [1.0, 0.25, 0.0625])) and len(rope_freqs(6, 64)) == 3 and abs(wavelengths(2, 9)[0] - 2 * math.pi) < 1e-12` },
          { name: "ntk", code: `assert ntk_base(10, 8, 6) == 10 * 8 ** 1.5 and abs(rope_freqs(6, ntk_base(64, 2, 6))[-1] * 2 - 0.0625) < 1e-12` },
        ],
      },
    },
    {
      key: "wave",
      rung: "stretch",
      prompt: (
        <p>
          After the scaling of the second check, what is the wavelength of the slowest rotary pair, to the nearest token?
        </p>
      ),
      answer: { kind: "numeric", value: 188469, tolerance: 1 },
    },
  ],

  glimpse: (
    <>
      <p>
        Pretraining is finished: a base model with a longer context and an annealed mixture. The next chapter turns it
        into an assistant, starting with supervised fine-tuning on conversations.
      </p>
    </>
  ),
};
