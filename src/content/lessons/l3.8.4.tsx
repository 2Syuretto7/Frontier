import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AblationViz } from "@/components/viz/AblationViz";
import type { LessonContent } from "@/lib/types";

const SE = `import numpy as np

def mean_se(xs):
    xs = np.asarray(xs, dtype=float)
    return float(xs.mean()), float(xs.std(ddof=1) / np.sqrt(len(xs)))

def significant(a, b, z=2.0):
    (ma, sa), (mb, sb) = mean_se(a), mean_se(b)
    return bool(abs(ma - mb) > z * np.sqrt(sa ** 2 + sb ** 2))`;

const FACT = `import numpy as np

def factorial_effects(full, minus_a, minus_b, minus_ab):
    with_b = full - minus_a
    without_b = minus_b - minus_ab
    return {"a_with_b": with_b, "a_without_b": without_b, "interaction": with_b - without_b}

def paired_diff_se(a, b):
    d = np.asarray(a, dtype=float) - np.asarray(b, dtype=float)
    return float(d.mean()), float(d.std(ddof=1) / np.sqrt(len(d)))`;

export const lesson: LessonContent = {
  id: "l3.8.4",
  minutes: 45,
  links: {
    requires: ["l3.8.3"],
    revisits: ["l3.5.3", "l3.7.2"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        A new model adds three ideas to a baseline and gains two points of accuracy. Which of the three ideas earned them?
        Perhaps one did all the work and the other two are dead weight; perhaps two only help together; perhaps the gain is
        smaller than the difference between two random seeds of the same model. Finding out takes a disciplined set of
        experiments.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An ablation removes one component, keeps everything else fixed, and measures the change. Two things make this harder
        than it sounds. Runs are noisy, so the change must be compared with seed-to-seed variation, ideally with the same
        seeds in both arms. And components interact, so the effect of removing A can depend on whether B is still there.
      </p>
      <AblationViz />
    </>
  ),

  theory: (
    <>
      <Definition title="standard error over seeds">
        <p>
          With results <M>{"x_1, \\dots, x_n"}</M> from n seeds, report the mean and its standard error{" "}
          <M>{"s/\\sqrt n"}</M>, where s is the sample standard deviation. A difference between two arms is convincing when it
          is well beyond about two combined standard errors, <M>{"2\\sqrt{\\mathrm{se}_a^2 + \\mathrm{se}_b^2}"}</M>.
        </p>
        <Code>{SE}</Code>
      </Definition>

      <Theorem title="pairing removes shared noise">
        <p>
          Let <M>{"a_i = \\mu_a + s_i + e_i"}</M> and <M>{"b_i = \\mu_b + s_i + f_i"}</M>, where <M>{"s_i"}</M> is the effect
          of seed i shared by both arms (variance <M>{"\\sigma_s^2"}</M>) and <M>{"e_i, f_i"}</M> are independent run noise
          (variance <M>{"\\sigma^2"}</M>). The unpaired difference of means has variance{" "}
          <M>{"2(\\sigma_s^2 + \\sigma^2)/n"}</M>; the mean of paired differences <M>{"a_i - b_i"}</M> has variance{" "}
          <M>{"2\\sigma^2/n"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\bar a - \\bar b"}</M> uses two independent sets of seeds in the unpaired design, so each mean has variance{" "}
          <M>{"(\\sigma_s^2 + \\sigma^2)/n"}</M> and the variances add. With the same seeds,{" "}
          <M>{"a_i - b_i = \\mu_a - \\mu_b + e_i - f_i"}</M>: the <M>{"s_i"}</M> cancel exactly, leaving variance{" "}
          <M>{"2\\sigma^2"}</M> per pair and <M>{"2\\sigma^2/n"}</M> for the mean. When seeds matter much more than the
          change being tested, pairing can shrink the error bar many times over.
        </p>
      </Proof>

      <Definition title="interactions">
        <p>
          With two components A and B, run all four combinations. The effect of A with B present is{" "}
          <M>{"y_{AB} - y_{B}"}</M>, without B it is <M>{"y_{A} - y_{\\varnothing}"}</M>, and their difference is the
          interaction. Removing one component at a time from the full model (leave-one-out) only measures the first; an
          add-one-in study from the baseline only measures the second. When they disagree, the components interact.
        </p>
        <Code>{FACT}</Code>
      </Definition>

      <Remark title="good ablation practice">
        <p>
          Change exactly one thing per arm; retune the learning rate if the change plausibly moves its optimum, and say so;
          use the same seeds, data order and budget across arms; report means with standard errors, not best runs; and decide
          the comparisons before looking at the results. An ablation that removes a component and finds no change is a
          result too: it is the cheapest way to simplify a model.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "se",
      rung: "check",
      prompt: <p>Four seeds give a sample standard deviation of 0.02. What is the standard error of the mean?</p>,
      answer: { kind: "numeric", value: 0.01, tolerance: 1e-9 },
    },
    {
      key: "inter",
      rung: "check",
      prompt: <p>Accuracies: full 0.80, without A 0.79, without B 0.75, without both 0.70. What is A's effect with B present minus A's effect with B absent?</p>,
      answer: { kind: "numeric", value: -0.04, tolerance: 1e-9 },
    },
    {
      key: "noise",
      rung: "apply",
      prompt: <p>A change improves accuracy by 0.3 points in one run each. Seed-to-seed variation is about 0.5 points. What can be concluded?</p>,
      answer: {
        kind: "choice",
        options: [
          "Nothing yet: run several paired seeds before claiming an effect",
          "The change helps by 0.3 points",
          "The change hurts, since 0.3 < 0.5",
          "The change has no effect",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def mean_se(xs):
    xs = np.asarray(xs, dtype=float)
    return float(xs.mean()), float(xs.std(ddof=1) / np.sqrt(len(xs)))

def significant(a, b, z=2.0):
    (ma, sa), (mb, sb) = mean_se(a), mean_se(b)
    return bool(abs(ma - mb) > z * np.sqrt(sa ** 2 + sb ** 2))

def paired_diff_se(a, b):
    d = np.asarray(a, dtype=float) - np.asarray(b, dtype=float)
    return float(d.mean()), float(d.std(ddof=1) / np.sqrt(len(d)))

base = np.array([0.80, 0.83, 0.78, 0.81])
new = base + np.array([0.012, 0.009, 0.011, 0.010])
print(significant(new, base), np.round(paired_diff_se(new, base), 4))
print(np.round(mean_se([0.80, 0.83, 0.78, 0.81]), 4))`}</Code>
          <p>The same four seeds in both arms. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "False [0.0105 0.0006]\n[0.805  0.0104]",
          "True [0.0105 0.0006]\n[0.805  0.0104]",
          "False [0.0105 0.0104]\n[0.805  0.0104]",
          "False [0.0105 0.0006]\n[0.805  0.0208]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def factorial_effects(full, minus_a, minus_b, minus_ab):
    with_b = full - minus_a
    without_b = minus_b - minus_ab
    return {"a_with_b": with_b, "a_without_b": without_b, "interaction": with_b - without_b}

e = factorial_effects(0.80, 0.79, 0.75, 0.70)
print({k: round(v, 2) for k, v in e.items()})`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'a_with_b': 0.01, 'a_without_b': 0.05, 'interaction': -0.04}",
          "{'a_with_b': 0.05, 'a_without_b': 0.01, 'interaction': 0.04}",
          "{'a_with_b': 0.01, 'a_without_b': 0.05, 'interaction': 0.04}",
          "{'a_with_b': 0.01, 'a_without_b': 0.1, 'interaction': -0.09}",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mean_se(xs)</C>, returning the mean and the standard error (sample standard deviation with{" "}
          <C>ddof=1</C>, divided by √n) as floats, and <C>significant(a, b, z=2.0)</C>, True when the difference of the two
          means exceeds z times <M>{"\\sqrt{\\mathrm{se}_a^2 + \\mathrm{se}_b^2}"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def mean_se(xs):
    return float(np.mean(xs)), 0.0

def significant(a, b, z=2.0):
    return np.mean(a) != np.mean(b)
`,
        solution: SE,
        tests: [
          { name: "mean and se", code: `m, se = mean_se([0.80, 0.83, 0.78, 0.81])
assert abs(m - 0.805) < 1e-12 and abs(se - np.std([0.80, 0.83, 0.78, 0.81], ddof=1) / 2) < 1e-12
assert isinstance(m, float) and isinstance(se, float)` },
          { name: "significance", code: `base = [0.80, 0.83, 0.78, 0.81]
assert significant([0.90, 0.93, 0.88, 0.91], base)
assert not significant([0.81, 0.84, 0.79, 0.82], base)
assert significant([1.0, 1.01, 0.99], [0.0, 0.01, -0.01], z=100.0)
assert significant(base, [0.90, 0.93, 0.88, 0.91]) is True` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>factorial_effects(full, minus_a, minus_b, minus_ab)</C>, returning a dict with <C>"a_with_b"</C>,{" "}
          <C>"a_without_b"</C> and <C>"interaction"</C> (the first minus the second), and <C>paired_diff_se(a, b)</C>, the
          mean and standard error (ddof=1) of the per-seed differences a − b, as floats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def factorial_effects(full, minus_a, minus_b, minus_ab):
    return {}

def paired_diff_se(a, b):
    return 0.0, 0.0
`,
        solution: FACT,
        tests: [
          { name: "factorial", code: `e = factorial_effects(0.80, 0.79, 0.75, 0.70)
assert set(e) == {"a_with_b", "a_without_b", "interaction"}
assert abs(e["a_with_b"] - 0.01) < 1e-12 and abs(e["a_without_b"] - 0.05) < 1e-12 and abs(e["interaction"] + 0.04) < 1e-12
e = factorial_effects(3.0, 2.0, 2.0, 1.0)
assert abs(e["interaction"]) < 1e-12` },
          { name: "paired", code: `base = np.array([0.80, 0.83, 0.78, 0.81])
new = base + np.array([0.012, 0.009, 0.011, 0.010])
m, se = paired_diff_se(new, base)
d = np.array([0.012, 0.009, 0.011, 0.010])
assert abs(m - d.mean()) < 1e-12 and abs(se - d.std(ddof=1) / 2) < 1e-12
assert isinstance(m, float) and isinstance(se, float)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>With aᵢ = μ_a + sᵢ + eᵢ and bᵢ = μ_b + sᵢ + fᵢ (sᵢ, eᵢ, fᵢ independent, variances σ_s², σ², σ²), prove that the mean of the paired differences has variance 2σ²/n, while comparing means from independent seeds gives 2(σ_s² + σ²)/n.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Shows aᵢ − bᵢ = μ_a − μ_b + eᵢ − fᵢ, so the shared seed term cancels and each difference has variance 2σ².",
          "Uses independence across i to get variance 2σ²/n for the mean of n differences.",
          "For independent seeds, each arm's mean has variance (σ_s² + σ²)/n and the two are independent, so the variance of the difference is 2(σ_s² + σ²)/n.",
        ],
      },
    },
    {
      key: "nseeds",
      rung: "stretch",
      prompt: <p>Run-to-run noise has σ = 0.004 (after pairing). How many paired seeds are needed for the standard error of the mean difference, √(2σ²/n), to be at most 0.001? Give the smallest whole number.</p>,
      answer: { kind: "numeric", value: 32 },
    },
  ],

  teachBack:
    "Explain to a friend how to run an ablation that can be trusted: one change at a time, several paired seeds, standard errors, and a full factorial when components might interact.",

  glimpse: (
    <p>
      That completes the toolkit for building and training networks. The next course puts it to work on images: convolution,
      and the architectures built from it.
    </p>
  ),
};
