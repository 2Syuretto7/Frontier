import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LayerTraceViz } from "@/components/viz/LayerTraceViz";
import type { LessonContent } from "@/lib/types";

const LAYERS = `import math

def first_nonfinite(trace):
    for name, vals in trace:
        if any(not math.isfinite(v) for v in vals):
            return name                                    # earliest layer in forward order
    return None

def rel_error(a, b):
    scale = max(abs(v) for v in b)
    err = max(abs(x - y) for x, y in zip(a, b))
    return err / scale if scale > 0 else err

def first_divergent(low, ref, tol):
    for (name, a), (_, b) in zip(low, ref):
        if rel_error(a, b) > tol:
            return name                                    # first layer far from the reference
    return None`;

const STEPS = `def first_bad_step(is_bad, lo, hi):
    probes = 0
    while hi - lo > 1:
        mid = (lo + hi) // 2
        probes += 1
        if is_bad(mid):
            hi = mid                                       # the fault is at or before mid
        else:
            lo = mid
    return hi, probes

def checksum(xs):
    return round(sum((i + 1) * x for i, x in enumerate(xs)), 6)

def odd_ranks(sums):
    common = max(set(sums), key=sums.count)
    return [r for r, s in enumerate(sums) if s != common]  # replicas that disagree with the majority`;

export const lesson: LessonContent = {
  id: "e13.3.3",
  minutes: 45,
  links: {
    requires: ["e13.3.2"],
    revisits: ["e5.4.3", "e4.1.3", "e5.2.4"],
    foreshadows: ["e13.4.3"],
  },

  puzzle: (
    <>
      <p>
        The loss of a 512-GPU run becomes NaN at step 81,377. The previous checkpoint is at step 81,000 and was fine. By
        the time anyone looks, every parameter on every rank is NaN, so the final state says nothing about the cause.
        How do you find the step, the rank, the layer and the operation where the first bad number appeared?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A non-finite value spreads: anything added to or multiplied by a NaN is NaN, so within one step it fills every
        layer after the one that produced it, and within one optimiser step it fills every parameter. The evidence is in
        the first occurrence, and debugging is a search for it along three axes in turn. Across steps, bisect by replaying
        from the checkpoint. Across ranks, compare replicas that should agree. Across layers, record each layer&apos;s
        outputs on the bad step and take the first one that is non-finite or far from a high-precision reference.
      </p>
      <LayerTraceViz />
    </>
  ),

  theory: (
    <>
      <Definition title="layer traces">
        <p>
          A trace is the list of (layer name, output values) recorded by forward hooks during one step, in execution
          order. The first non-finite layer is the earliest entry containing a NaN or infinity (<C>first_nonfinite</C>).
          For problems that stay finite but wrong, run the same inputs through the model in a higher precision and take
          the first layer whose relative error, the largest absolute difference divided by the largest reference
          magnitude, exceeds a tolerance (<C>rel_error</C>, <C>first_divergent</C>).
        </p>
        <Code>{LAYERS}</Code>
      </Definition>

      <Theorem title="the first bad layer contains the fault">
        <p>
          If every operation propagates non-finite inputs to non-finite outputs and the trace is in execution order,
          then the operation that created the first non-finite value lies in the first non-finite layer, whose inputs
          were all finite.
        </p>
      </Theorem>
      <Proof>
        <p>
          Every layer before the first non-finite one produced only finite outputs, and a layer&apos;s inputs are outputs
          of earlier layers or the step&apos;s inputs, which are checked separately. So the first non-finite layer
          received only finite inputs and produced a non-finite output, and some operation inside it turned finite
          numbers into a non-finite one. Later layers cannot be the origin, since some of their inputs were already
          non-finite. The assumption fails for operations such as a maximum that ignores NaN, which is one reason to
          check inputs to every layer as well as outputs when a result looks odd.
        </p>
      </Proof>

      <Example title="the usual culprits">
        <p>
          Inside the first bad layer the operation is usually one of a short list, most covered in e5.4.3: an exponential
          without max subtraction, in a softmax or a loss (e5.2.4); a logarithm or division at zero; a variance computed
          as <M>{"\\mathbb{E}[x^2] - \\mathbb{E}[x]^2"}</M>, whose first term overflows in half precision and whose
          difference can be negative; a square root of that negative number; or a reduction accumulated in a format too
          narrow for its sum. FP16 overflows above 65504, so its statistics are computed in FP32; BF16 has FP32&apos;s
          range but only eight bits of precision, so its failures are more often silent inaccuracy than NaN.
        </p>
      </Example>

      <Remark title="steps and ranks">
        <p>
          To find the step, replay from the last good checkpoint and bisect, checking each probe for a non-finite loss
          or gradient (<C>first_bad_step</C>). The number of probes grows with the logarithm of the interval, but each
          probe replays from a good state, so saving a checkpoint at each good probe changes the total cost a great deal.
          To find the rank, use the fact that data-parallel replicas hold identical parameters after each step: compare a
          cheap position-weighted checksum of each replica&apos;s parameters (<C>checksum</C>) and look for the ones that
          disagree with the majority (<C>odd_ranks</C>). A single rank that disagrees on a deterministic replay points to
          hardware, the subject of the next chapter.
        </p>
        <Code>{STEPS}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "exp",
      rung: "check",
      prompt: (
        <p>
          A softmax computes the exponential of each logit in FP16 without subtracting the maximum. What is the largest
          logit, to two decimals, whose exponential does not overflow?
        </p>
      ),
      answer: { kind: "numeric", value: 11.09, tolerance: 0.001 },
    },
    {
      key: "var",
      rung: "check",
      prompt: (
        <p>
          A normalisation layer computes the mean of <M>{"x^2"}</M> in FP16. If every value equals m, what is the largest m
          for which that mean stays at or below the FP16 maximum, to two decimals?
        </p>
      ),
      answer: { kind: "numeric", value: 255.94, tolerance: 0.001 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: (
        <p>
          A layer trace shows the attention block&apos;s output finite and the next MLP block&apos;s output containing
          infinities, with every later layer NaN. Where should you look first?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Inside the MLP block, at operations that can overflow given finite inputs",
          "In the attention block, since it ran earlier",
          "In the final layer, since it shows NaN rather than infinity",
          "In the optimiser, since NaN parameters come from it",
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

def first_nonfinite(trace):
    for name, vals in trace:
        if any(not math.isfinite(v) for v in vals):
            return name                                    # earliest layer in forward order
    return None

def rel_error(a, b):
    scale = max(abs(v) for v in b)
    err = max(abs(x - y) for x, y in zip(a, b))
    return err / scale if scale > 0 else err

def first_divergent(low, ref, tol):
    for (name, a), (_, b) in zip(low, ref):
        if rel_error(a, b) > tol:
            return name                                    # first layer far from the reference
    return None

tr = [("embed", [1.0, 2.0]), ("attn", [3.0, float('inf')]), ("mlp", [float('nan')])]
print(first_nonfinite(tr), rel_error([1.0, 2.5], [1.0, 2.0]), first_divergent([("a", [1.0]), ("b", [2.2])], [("a", [1.0]), ("b", [2.0])], 0.05))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["attn 0.25 b", "mlp 0.25 b", "attn 0.2 b", "attn 0.25 None"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def first_bad_step(is_bad, lo, hi):
    probes = 0
    while hi - lo > 1:
        mid = (lo + hi) // 2
        probes += 1
        if is_bad(mid):
            hi = mid                                       # the fault is at or before mid
        else:
            lo = mid
    return hi, probes

def checksum(xs):
    return round(sum((i + 1) * x for i, x in enumerate(xs)), 6)

def odd_ranks(sums):
    common = max(set(sums), key=sums.count)
    return [r for r, s in enumerate(sums) if s != common]  # replicas that disagree with the majority

print(first_bad_step(lambda s: s >= 13, 0, 16), checksum([1, 2, 3]))
print(odd_ranks([14.0, 14.0, 13.5, 14.0]), odd_ranks([2.0, 2.0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(13, 4) 14\n[2] []",
          "(12, 4) 14\n[2] []",
          "(13, 3) 6\n[2] []",
          "(13, 4) 14\n[0, 1, 3] []",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>first_nonfinite(trace)</C>, the name of the first layer with a NaN or infinity, or None;{" "}
          <C>rel_error(a, b)</C>, the largest absolute difference divided by the largest magnitude in b, or the
          difference itself when b is all zero; and <C>first_divergent(low, ref, tol)</C>, the first layer whose relative
          error exceeds tol, or None.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def first_nonfinite(trace):
    return None

def rel_error(a, b):
    return 0.0

def first_divergent(low, ref, tol):
    return None
`,
        solution: LAYERS,
        tests: [
          { name: "nonfinite", code: `assert first_nonfinite([("x", [1.0]), ("y", [float("nan"), 1.0]), ("z", [float("inf")])]) == "y" and first_nonfinite([("x", [1.0])]) is None` },
          { name: "divergent", code: `assert rel_error([0.0, 3.0], [0.0, 4.0]) == 0.25 and rel_error([1.0], [0.0]) == 1.0 and first_divergent([("p", [1.0]), ("q", [2.5]), ("r", [9.0])], [("p", [1.0]), ("q", [2.0]), ("r", [3.0])], 0.3) == "r"` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>first_bad_step(is_bad, lo, hi)</C>, given is_bad(lo) false and is_bad(hi) true, returning the first
          bad step and the number of probes; <C>checksum(xs)</C>, the sum of each value times its one-based position,
          rounded to six decimals; and <C>odd_ranks(sums)</C>, the ranks whose checksum differs from the most common one.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def first_bad_step(is_bad, lo, hi):
    return hi, 0

def checksum(xs):
    return sum(xs)

def odd_ranks(sums):
    return []
`,
        solution: STEPS,
        tests: [
          { name: "bisect", code: `assert first_bad_step(lambda s: s >= 5, 0, 100) == (5, 7) and first_bad_step(lambda s: True, 0, 1) == (1, 0)` },
          { name: "replicas", code: `assert checksum([0.5, -1, 2]) == 4.5 and odd_ranks([1.0, 1.5, 1.0, 1.0, 2.0]) == [1, 4] and odd_ranks([3.0]) == []` },
        ],
      },
    },
    {
      key: "replay",
      rung: "stretch",
      prompt: (
        <p>
          Step 0 is a good checkpoint and step 512 is the first step known to be bad. You bisect with the lesson&apos;s{" "}
          <C>first_bad_step</C>, and every probe replays from step 0, costing as many steps as the probe&apos;s step
          number. In the worst case, how many steps are replayed in total?
        </p>
      ),
      answer: { kind: "numeric", value: 4097, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Sometimes the first bad value comes from no line of code at all but from a failing chip. The next chapter is
        about hardware: how often it fails, how to checkpoint against it, and how to catch errors it makes silently.
      </p>
    </>
  ),
};
