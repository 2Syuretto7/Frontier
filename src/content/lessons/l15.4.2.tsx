import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ChangeBisectViz } from "@/components/viz/ChangeBisectViz";
import type { LessonContent } from "@/lib/types";

const BISECT = `def apply_first(base, changes, k):
    cfg = dict(base)
    for key, value in changes[:k]:
        cfg[key] = value
    return cfg

def bisect(n, is_bad):
    lo, hi, runs = 0, n, 0                                 # is_bad(lo) is False, is_bad(hi) is True
    while hi - lo > 1:
        mid = (lo + hi) // 2
        runs += 1
        if is_bad(mid):
            hi = mid
        else:
            lo = mid
    return hi, runs                                        # change number hi (1-based) breaks it

def bisect_changes(base, changes, is_bad_cfg):
    k, runs = bisect(len(changes), lambda m: is_bad_cfg(apply_first(base, changes, m)))
    return changes[k - 1], runs`;

const CURVES = `def interp(xs, ys, x):
    for i in range(len(xs) - 1):
        if xs[i] <= x <= xs[i + 1]:
            t = (x - xs[i]) / (xs[i + 1] - xs[i])
            return ys[i] + t * (ys[i + 1] - ys[i])
    raise ValueError("outside the curve")

def curve_gap(xs1, ys1, xs2, ys2, grid):
    return max(abs(interp(xs1, ys1, g) - interp(xs2, ys2, g)) for g in grid)

def first_divergence(xs1, ys1, xs2, ys2, grid, tol):
    for g in grid:
        if abs(interp(xs1, ys1, g) - interp(xs2, ys2, g)) > tol:
            return g                                       # where the two runs part company
    return None`;

export const lesson: LessonContent = {
  id: "l15.4.2",
  minutes: 50,
  links: {
    requires: ["l15.4.1", "l15.1.2"],
    revisits: ["l8.6.1", "l15.2.3"],
    foreshadows: ["l15.4.3"],
  },

  puzzle: (
    <>
      <p>
        The second part of the thesis is to reproduce the paper named in your proposal. The released code reaches the
        reported number. Your reimplementation, which differs from it in thirty-seven small ways you made deliberately
        or by accident, is two points short. Running each difference on its own would take thirty-seven experiments. How
        can you find the one that matters in a handful, and how do you compare your loss curve with a curve in a paper
        that was logged at different steps?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A reproduction succeeds when your result is within the margin you set in the proposal, by the equivalence test of
        l15.1.2. When it falls short, the gap is usually one difference among many, and the way to find it is the same as
        finding a bug introduced somewhere in a long history of commits: apply the first half of the changes and see
        whether the gap appears, then halve again. Each run halves the suspects. Meanwhile, comparing whole loss curves,
        not just final numbers, shows where two runs part company, which often points at the cause directly.
      </p>
      <ChangeBisectViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the reproduction deliverable">
        <p>
          Run the released checkpoint or code first, to separate evaluation problems from training problems. Then train,
          with the seeds and margin from the proposal, and report the equivalence verdict. Record every deviation from the
          paper, from batch size and learning-rate rescaling as in l15.1.2 to library versions, and keep the
          configuration and code version of every run as in l15.2.3. If the result is not reproduced, the deliverable is
          the diagnosis: which difference causes the gap, and whether it reflects on the paper or only on your setup.
        </p>
      </Definition>

      <Theorem title="bisecting a list of changes">
        <p>
          Order the n differences between a known-good setup and yours, and let <M>{"\\mathrm{bad}(k)"}</M> say whether
          applying the first k of them produces the gap (<C>apply_first</C>). If bad(0) is false, bad(n) is true, and
          once a breaking change is applied the gap stays, then repeatedly testing the midpoint of the bracket finds the
          first breaking change in at most <M>{"\\lceil \\log_2 n \\rceil"}</M> runs (<C>bisect</C>,{" "}
          <C>bisect_changes</C>).
        </p>
        <Code>{BISECT}</Code>
      </Theorem>
      <Proof>
        <p>
          Keep the invariant that bad(lo) is false and bad(hi) is true, which holds for lo = 0 and hi = n. Testing{" "}
          <M>{"m = \\lfloor (lo + hi)/2 \\rfloor"}</M> and replacing hi or lo by m keeps it, and the bracket length{" "}
          <M>{"hi - lo"}</M> becomes at most <M>{"\\lceil (hi - lo)/2 \\rceil"}</M>. After{" "}
          <M>{"\\lceil\\log_2 n\\rceil"}</M> runs it is 1, so bad(hi − 1) is false and bad(hi) is true: change hi is
          the first that breaks the result. If changes interact, so that two are needed together, bad is not monotone in
          this way and the method can mislead; Zeller&apos;s delta debugging generalises bisection to find a minimal
          failing subset in that case.
        </p>
      </Proof>

      <Theorem title="comparing curves logged at different steps">
        <p>
          To compare two loss curves, evaluate each at common steps by linear interpolation (<C>interp</C>) and take the
          largest difference (<C>curve_gap</C>) or the first step where they differ by more than a tolerance{" "}
          (<C>first_divergence</C>). If the true curve f has <M>{"|f''| \\le M"}</M> between logged points h apart, linear
          interpolation is within <M>{"h^2 M / 8"}</M> of it.
        </p>
        <Code>{CURVES}</Code>
      </Theorem>
      <Proof>
        <p>
          On an interval [a, b] with b − a = h, let L be the line through the endpoints and fix x inside. Define{" "}
          <M>{"g(t) = f(t) - L(t) - c(t - a)(t - b)"}</M> with c chosen so that g(x) = 0. Then g vanishes at a, x and
          b, so by Rolle&apos;s theorem twice, <M>{"g''(\\xi) = f''(\\xi) - 2c = 0"}</M> for some ξ, and{" "}
          <M>{"f(x) - L(x) = \\tfrac{f''(\\xi)}{2}(x - a)(x - b)"}</M>. The product <M>{"|(x - a)(x - b)|"}</M> is at
          most <M>{"h^2/4"}</M>, at the midpoint, giving the bound. Loss curves are smoother in the logarithm of the
          step, so interpolating there is often more accurate.
        </p>
      </Proof>

      <Example title="reading where curves part">
        <p>
          If your curve tracks the paper&apos;s for the first few thousand steps and then flattens earlier, suspect the
          learning-rate schedule or the data order; if it is worse from the first hundred steps, suspect initialisation,
          tokenisation or the loss computation; if it matches throughout but the final evaluation differs, suspect the
          evaluation. The reading of loss curves in l8.6.1 applies directly.
        </p>
      </Example>

      <Remark title="writing up the reproduction">
        <p>
          The write-up states the claim reproduced, the margin, the verdict with its interval, every deviation and its
          justification, and the compute used. A failed reproduction with a clear diagnosis is a valid and useful result;
          the ML Reproducibility Challenge publishes such reports. This document becomes the baseline section of the
          final paper.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "runs",
      rung: "check",
      prompt: (
        <p>
          Your setup differs from a known-good one by 37 ordered changes, and one of them causes the gap. At most how many
          bisection runs are needed to find it?
        </p>
      ),
      answer: { kind: "numeric", value: 6, tolerance: 0.001 },
    },
    {
      key: "bound",
      rung: "check",
      prompt: (
        <p>
          A loss curve is logged every 1000 steps, and its second derivative is at most <M>{"2 \\times 10^{-7}"}</M> per
          step squared in magnitude. What is the bound on the error of linear interpolation between logged points?
        </p>
      ),
      answer: { kind: "numeric", value: 0.025, tolerance: 0.0001 },
    },
    {
      key: "first",
      rung: "apply",
      prompt: <p>Why run the paper&apos;s released checkpoint through your evaluation before training anything?</p>,
      answer: {
        kind: "choice",
        options: [
          "It separates differences in evaluation from differences in training, so a later gap can be located",
          "It makes training faster",
          "It replaces the need for seeds",
          "It guarantees that the reproduction will succeed",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def apply_first(base, changes, k):
    cfg = dict(base)
    for key, value in changes[:k]:
        cfg[key] = value
    return cfg

def bisect(n, is_bad):
    lo, hi, runs = 0, n, 0                                 # is_bad(lo) is False, is_bad(hi) is True
    while hi - lo > 1:
        mid = (lo + hi) // 2
        runs += 1
        if is_bad(mid):
            hi = mid
        else:
            lo = mid
    return hi, runs                                        # change number hi (1-based) breaks it

def bisect_changes(base, changes, is_bad_cfg):
    k, runs = bisect(len(changes), lambda m: is_bad_cfg(apply_first(base, changes, m)))
    return changes[k - 1], runs

base = {"lr": 1, "wd": 0, "warm": 0}; changes = [("lr", 2), ("wd", 1), ("warm", 5), ("lr", 3)]
print(apply_first(base, changes, 2), apply_first(base, changes, 4)["lr"], bisect(4, lambda k: k >= 3), bisect_changes(base, changes, lambda c: c["warm"] > 0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'lr': 2, 'wd': 1, 'warm': 0} 3 (3, 2) (('warm', 5), 2)",
          "{'lr': 2, 'wd': 1, 'warm': 0} 3 (2, 2) (('wd', 1), 2)",
          "{'lr': 1, 'wd': 0, 'warm': 0} 3 (3, 2) (('warm', 5), 2)",
          "{'lr': 2, 'wd': 1, 'warm': 0} 2 (3, 3) (('warm', 5), 3)",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def interp(xs, ys, x):
    for i in range(len(xs) - 1):
        if xs[i] <= x <= xs[i + 1]:
            t = (x - xs[i]) / (xs[i + 1] - xs[i])
            return ys[i] + t * (ys[i + 1] - ys[i])
    raise ValueError("outside the curve")

def curve_gap(xs1, ys1, xs2, ys2, grid):
    return max(abs(interp(xs1, ys1, g) - interp(xs2, ys2, g)) for g in grid)

def first_divergence(xs1, ys1, xs2, ys2, grid, tol):
    for g in grid:
        if abs(interp(xs1, ys1, g) - interp(xs2, ys2, g)) > tol:
            return g                                       # where the two runs part company
    return None

xs = [0, 10, 20]; ys = [4.0, 3.0, 2.5]
print(interp(xs, ys, 5), interp(xs, ys, 15), round(curve_gap(xs, ys, [0, 20], [4.0, 2.0], [0, 10, 20]), 3), first_divergence(xs, ys, [0, 20], [4.0, 2.0], [0, 10, 20], 0.2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["3.5 2.75 0.5 20", "3.5 2.75 0.5 10", "3.5 2.5 0.5 20", "3.5 2.75 0.0 None"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Changes are (key, value) pairs. Write <C>apply_first(base, changes, k)</C>, returning a new dict;{" "}
          <C>bisect(n, is_bad)</C>, returning the first breaking change (1-based) and the number of calls to is_bad, given
          that is_bad(0) is false and is_bad(n) is true; and <C>bisect_changes(base, changes, is_bad_cfg)</C>, returning the
          breaking change and the runs.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def apply_first(base, changes, k):
    return base

def bisect(n, is_bad):
    for k in range(1, n + 1):
        if is_bad(k):
            return k, k
    return n, n

def bisect_changes(base, changes, is_bad_cfg):
    return changes[0], 0
`,
        solution: BISECT,
        tests: [
          { name: "apply", code: `b = {"x": 0}\nc = apply_first(b, [("x", 1), ("y", 2)], 2)\nassert c == {"x": 1, "y": 2} and b == {"x": 0} and bisect(8, lambda k: k >= 7) == (7, 3) and bisect(1, lambda k: k >= 1) == (1, 0)` },
          { name: "changes", code: `ch = [("a", 1), ("b", 1), ("c", 1), ("d", 1), ("e", 1)]\nassert bisect_changes({}, ch, lambda cfg: "d" in cfg) == (("d", 1), 3) and bisect(20, lambda k: k >= 20)[1] == 5` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>interp(xs, ys, x)</C>, raising ValueError outside the logged range;{" "}
          <C>curve_gap(xs1, ys1, xs2, ys2, grid)</C>; and <C>first_divergence(xs1, ys1, xs2, ys2, grid, tol)</C>, the
          first grid point where the curves differ by more than tol, or None.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def interp(xs, ys, x):
    return ys[0]

def curve_gap(xs1, ys1, xs2, ys2, grid):
    return abs(ys1[-1] - ys2[-1])

def first_divergence(xs1, ys1, xs2, ys2, grid, tol):
    return None
`,
        solution: CURVES,
        tests: [
          { name: "interp", code: `assert interp([0, 4], [1.0, 3.0], 1) == 1.5 and interp([0, 1, 3], [0, 2, 0], 2) == 1.0\ntry:\n    interp([0, 1], [0, 1], 2)\n    assert False\nexcept ValueError:\n    pass` },
          { name: "gap", code: `a = ([0, 10], [5.0, 3.0]); b = ([0, 5, 10], [5.0, 4.5, 2.0])\nassert abs(curve_gap(*a, *b, [0, 5, 10]) - 1.0) < 1e-12 and first_divergence(*a, *b, [0, 5, 10], 0.4) == 5 and first_divergence(*a, *b, [0, 5], 0.6) is None` },
        ],
      },
    },
    {
      key: "logstep",
      rung: "stretch",
      prompt: (
        <p>
          A paper logs loss 3.2 at step 1000 and 2.9 at step 2000. Interpolating linearly in the base-10 logarithm of the
          step, what loss does it imply at step 1300? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 3.0864, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        With a reproduced baseline in hand, the thesis turns to its contribution. The next lesson adds one new idea to
        the baseline and asks how to show, with ablations and honest statistics, that the idea is what made the
        difference.
      </p>
    </>
  ),
};
