import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SelectiveSsmViz } from "@/components/viz/SelectiveSsmViz";
import type { LessonContent } from "@/lib/types";

const LTI = `import math

def zoh(a, b, delta):
    abar = [math.exp(delta * ai) for ai in a]
    bbar = [(ab - 1) / ai * bi for ab, ai, bi in zip(abar, a, b)]
    return abar, bbar

def ssm_scan(abar, bbar, c, xs):
    h = [0.0] * len(abar)
    ys = []
    for x in xs:
        h = [ai * hi + bi * x for ai, hi, bi in zip(abar, h, bbar)]
        ys.append(sum(ci * hi for ci, hi in zip(c, h)))
    return ys

def ssm_kernel(abar, bbar, c, length):
    return [sum(ci * ai ** k * bi for ci, ai, bi in zip(c, abar, bbar)) for k in range(length)]`;

const SELECTIVE = `import math

def combine(e1, e2):
    a1, b1 = e1
    a2, b2 = e2
    return (a1 * a2, a2 * b1 + b2)

def prefix_scan(pairs):
    out = list(pairs)
    step = 1
    while step < len(out):
        out = [out[i] if i < step else combine(out[i - step], out[i]) for i in range(len(out))]
        step *= 2
    return out

def selective_scan(xs, deltas, a, b, c):
    h, ys = 0.0, []
    for x, d in zip(xs, deltas):
        h = math.exp(d * a) * h + d * b * x
        ys.append(c * h)
    return ys`;

export const lesson: LessonContent = {
  id: "l8.8.2",
  minutes: 55,
  links: {
    requires: ["l8.8.1", "l4.3.3", "m11.7.1"],
    revisits: ["l4.3.4"],
    foreshadows: ["l8.8.3", "e9.4.2"],
  },

  puzzle: (
    <>
      <p>
        Recurrent networks were abandoned for language because they trained one step at a time and forgot. State space
        models are recurrences too, yet Mamba matched transformers of twice its size on language modelling at the scales it was
        tested. Two ideas made the difference: a recurrence that can be computed in parallel over the sequence, and one whose
        rate of forgetting is chosen by the input itself. How do they fit together?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A state space model starts from a continuous system, a state that decays and is pushed by the input, and samples it with
        a step size Δ. A small step means the state barely changes, so the input is mostly ignored; a large step means the state
        is overwritten by the current input. If Δ is fixed, the model treats every token alike, and its output is a fixed
        convolution of the input. Making Δ depend on the token lets the model decide what to store and what to skip, which is
        what a language model needs, at the cost of the convolution.
      </p>
      <SelectiveSsmViz />
    </>
  ),

  theory: (
    <>
      <Definition title="continuous system and discretisation">
        <p>
          The system is <M>{"h'(t) = Ah(t) + Bx(t)"}</M>, <M>{"y(t) = Ch(t)"}</M>, with diagonal A of negative entries. Holding the input
          constant over a step Δ (zero-order hold) gives
        </p>
        <MD>{"h_t = \\bar A h_{t-1} + \\bar B x_t,\\quad \\bar A = e^{\\Delta A},\\quad \\bar B = (\\Delta A)^{-1}(e^{\\Delta A} - I)\\,\\Delta B"}</MD>
        <p>
          which for diagonal A is entrywise <M>{"\\bar b_i = (e^{\\Delta a_i} - 1)\\,b_i/a_i"}</M> (<C>zoh</C>), using the matrix exponential of
          m11.7.1. The recurrence runs token by token (<C>ssm_scan</C>). When <M>{"\\bar A, \\bar B, C"}</M> are the same at every step the system is
          linear and time-invariant, so the output is a convolution with kernel <M>{"K_k = C\\bar A^k\\bar B"}</M> (<C>ssm_kernel</C>), which S4
          computed with the fast Fourier transform for parallel training.
        </p>
        <Code>{LTI}</Code>
      </Definition>

      <Definition title="selection and the parallel scan">
        <p>
          Mamba makes <M>{"\\Delta"}</M>, B and C functions of the current token, and simplifies <M>{"\\bar B"}</M> to <M>{"\\Delta B"}</M> (<C>selective_scan</C>).
          The convolution no longer exists, but the recurrence <M>{"h_t = a_t h_{t-1} + b_t"}</M> is still parallel: represent step t by the pair{" "}
          <M>{"(a_t, b_t)"}</M>, the map <M>{"h \\mapsto a_t h + b_t"}</M>, and compose maps with <M>{"(a_1, b_1) \\circ (a_2, b_2) = (a_1 a_2,\\ a_2 b_1 + b_2)"}</M>{" "}
          (<C>combine</C>). A prefix scan of these pairs (<C>prefix_scan</C>) runs in <M>{"O(\\log n)"}</M> rounds; the version shown does{" "}
          <M>{"O(n \\log n)"}</M> work, and Blelloch&apos;s work-efficient variant does <M>{"O(n)"}</M>.
        </p>
        <Code>{SELECTIVE}</Code>
      </Definition>

      <Theorem title="the scan computes the recurrence">
        <p>
          The operation <M>{"\\circ"}</M> is associative, and with <M>{"h_0 = 0"}</M> the second component of <M>{"(a_1, b_1) \\circ \\cdots \\circ (a_t, b_t)"}</M>{" "}
          is <M>{"h_t"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The pair <M>{"(a, b)"}</M> stands for the affine map <M>{"h \\mapsto ah + b"}</M>, and <M>{"(a_1, b_1) \\circ (a_2, b_2)"}</M> is the map that applies the first
          and then the second: <M>{"a_2(a_1 h + b_1) + b_2 = a_1 a_2 h + (a_2 b_1 + b_2)"}</M>. Composition of functions is associative, so
          the grouping does not matter. Applying the composed map to <M>{"h_0 = 0"}</M> gives its second component, and applying the
          maps in order to 0 is exactly the recurrence.
        </p>
      </Proof>

      <Remark title="making it fast">
        <p>
          The state has an extra dimension N per channel, 16 in Mamba, so materialising every <M>{"h_t"}</M> in GPU memory would cost N
          times the activations. Mamba&apos;s kernel loads the parameters into on-chip memory, runs the scan there, writes only the
          outputs, and recomputes the states in the backward pass, the same tactics as FlashAttention (e9.4.2). Mamba-2
          restricts <M>{"\\bar A"}</M> to a scalar times the identity per head. Then the model is exactly linear attention with a
          data-dependent decay (l8.8.1), computable chunkwise with matrix multiplications, which allowed states of 64 to 256 per
          channel and much faster training.
        </p>
      </Remark>

      <Example title="what selection buys">
        <p>
          Gu and Dao tested selective copying, where the tokens to copy are scattered among filler, and induction heads, where the
          model must recall what followed an earlier occurrence of the current token. Time-invariant models such as S4 fail
          selective copying because a fixed kernel cannot depend on where the useful tokens are; the selective model solves both
          and extrapolated induction heads far beyond its training length. The limits of l8.8.1 remain: a state of fixed size
          can still hold only so many distinct associations.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "bbar",
      rung: "check",
      prompt: <p>A diagonal SSM entry has a = −1 and b = 1. With step Δ = 0.5 and zero-order hold, what is the discretised input weight b̄? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.3935, tolerance: 0.0001 },
    },
    {
      key: "kernel",
      rung: "check",
      prompt: <p>A single-state time-invariant SSM has ā = 0.8, b̄ = 0.5 and c = 2. What is the convolution kernel at lag 3, counting the current token as lag 0? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.512, tolerance: 0.001 },
    },
    {
      key: "conv",
      rung: "apply",
      prompt: <p>Why can a selective SSM such as Mamba not be trained as a convolution, as S4 was?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its step size and projections change with each token, so the system is not time-invariant and there is no single kernel; it is trained with a parallel scan instead",
          "Its state is too large to fit a convolution kernel",
          "Convolutions cannot be computed on GPUs",
          "Its matrix A is not diagonal",
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

def zoh(a, b, delta):
    abar = [math.exp(delta * ai) for ai in a]
    bbar = [(ab - 1) / ai * bi for ab, ai, bi in zip(abar, a, b)]
    return abar, bbar

def ssm_scan(abar, bbar, c, xs):
    h = [0.0] * len(abar)
    ys = []
    for x in xs:
        h = [ai * hi + bi * x for ai, hi, bi in zip(abar, h, bbar)]
        ys.append(sum(ci * hi for ci, hi in zip(c, h)))
    return ys

def ssm_kernel(abar, bbar, c, length):
    return [sum(ci * ai ** k * bi for ci, ai, bi in zip(c, abar, bbar)) for k in range(length)]

abar, bbar = zoh([math.log(0.5)], [math.log(0.5)], 1.0)
print(round(abar[0], 3), round(bbar[0], 3), ssm_scan([0.5], [1.0], [2.0], [1.0, 0.0, 4.0]), ssm_kernel([0.5], [1.0], [2.0], 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 -0.5 [2.0, 1.0, 8.5] [2.0, 1.0, 0.5]\n(6, 7) [(0.5, 1.0), (0.25, 1.5), (0.125, 1.75)]",
          "0.5 0.5 [2.0, 1.0, 8.5] [2.0, 1.0, 0.5]\n(6, 7) [(0.5, 1.0), (0.25, 1.5), (0.125, 1.75)]",
          "0.5 -0.5 [2.0, 1.0, 8.0] [2.0, 1.0, 0.5]\n(6, 11) [(0.5, 1.0), (0.25, 1.5), (0.125, 1.75)]",
          "0.5 -0.5 [2.0, 1.0, 8.5] [2.0, 1.0, 0.5]\n(6, 7) [(0.5, 1.0), (0.25, 2.0), (0.125, 3.0)]",
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

def combine(e1, e2):
    a1, b1 = e1
    a2, b2 = e2
    return (a1 * a2, a2 * b1 + b2)

def prefix_scan(pairs):
    out = list(pairs)
    step = 1
    while step < len(out):
        out = [out[i] if i < step else combine(out[i - step], out[i]) for i in range(len(out))]
        step *= 2
    return out

def selective_scan(xs, deltas, a, b, c):
    h, ys = 0.0, []
    for x, d in zip(xs, deltas):
        h = math.exp(d * a) * h + d * b * x
        ys.append(c * h)
    return ys

print(combine((2, 1), (3, 4)), prefix_scan([(0.5, 1.0), (0.5, 1.0), (0.5, 1.0)]))
print(selective_scan([1.0, 5.0, 0.0], [1.0, 0.0, 1.0], math.log(0.5), 2.0, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2.0, 2.0, 1.0]",
          "[2.0, 12.0, 6.0]",
          "[2.0, 2.0, 0.0]",
          "[1.0, 1.0, 0.5]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>zoh(a, b, delta)</C> for diagonal entries given as lists, <C>ssm_scan(abar, bbar, c, xs)</C> for a scalar input sequence,
          and <C>ssm_kernel(abar, bbar, c, length)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def zoh(a, b, delta):
    return [1 + delta * ai for ai in a], [delta * bi for bi in b]

def ssm_scan(abar, bbar, c, xs):
    return list(xs)

def ssm_kernel(abar, bbar, c, length):
    return [1.0] * length
`,
        solution: LTI,
        tests: [
          { name: "zoh", code: `ab, bb = zoh([-2.0, -0.5], [1.0, 3.0], 0.2)\nassert abs(ab[0] - math.exp(-0.4)) < 1e-12 and abs(bb[1] - (1 - math.exp(-0.1)) * 6.0) < 1e-12` },
          { name: "conv", code: `ab, bb, c, xs = [0.9, -0.3], [1.0, 2.0], [0.5, 1.5], [1.0, -2.0, 0.5, 3.0, 0.0]\nK = ssm_kernel(ab, bb, c, len(xs))\nys = ssm_scan(ab, bb, c, xs)\nconv = [sum(K[k] * xs[t - k] for k in range(t + 1)) for t in range(len(xs))]\nassert all(abs(p - q) < 1e-9 for p, q in zip(ys, conv)) and abs(K[0] - 3.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>combine(e1, e2)</C>, <C>prefix_scan(pairs)</C> using the doubling scheme, and{" "}
          <C>selective_scan(xs, deltas, a, b, c)</C> for one scalar state with <M>{"\\bar a_t = e^{\\Delta_t a}"}</M> and <M>{"\\bar b_t = \\Delta_t b"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def combine(e1, e2):
    return (e1[0] * e2[0], e1[1] + e2[1])

def prefix_scan(pairs):
    return list(pairs)

def selective_scan(xs, deltas, a, b, c):
    return [c * x for x in xs]
`,
        solution: SELECTIVE,
        tests: [
          { name: "scan", code: `import random\nrandom.seed(1)\nps = [(random.uniform(0, 1), random.uniform(-1, 1)) for _ in range(11)]\nout = prefix_scan(ps)\nh = 0.0\nfor (a, b), (pa, pb) in zip(ps, out):\n    h = a * h + b\n    assert abs(pb - h) < 1e-12\nassert combine((0.5, 2.0), (4.0, 1.0)) == (2.0, 9.0)` },
          { name: "select", code: `ys = selective_scan([2.0, 1.0, 0.0], [0.5, 0.0, 2.0], -1.0, 1.0, 3.0)\nassert abs(ys[0] - 3.0) < 1e-12 and abs(ys[1] - 3.0) < 1e-12 and abs(ys[2] - 3.0 * math.exp(-2.0)) < 1e-12` },
        ],
      },
    },
    {
      key: "hold",
      rung: "stretch",
      prompt: (
        <p>
          A selective one-state model has a = −1, b = c = 1 and <M>{"\\bar b_t = \\Delta_t b"}</M>, starting from h = 0. It reads x = 1 with Δ = 2,
          then ten inputs of 0 with Δ = 0.01. What is its output after the last of these? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.81, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Recurrent layers are cheap but forgetful; attention layers remember but cost more with length. The next lesson looks
        at models that use both, and at how the mix is chosen.
      </p>
    </>
  ),
};
