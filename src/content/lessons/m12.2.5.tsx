import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { FDivViz } from "@/components/viz/FDivViz";
import type { LessonContent } from "@/lib/types";

const FD = `import numpy as np

GENERATORS = {
    "kl": lambda t: t * np.log(t),
    "reverse_kl": lambda t: -np.log(t),
    "tv": lambda t: 0.5 * np.abs(t - 1),
    "hellinger2": lambda t: (np.sqrt(t) - 1) ** 2,
    "chi2": lambda t: (t - 1) ** 2,
}

def f_divergence(p, q, name):
    p, q = np.asarray(p, dtype=float), np.asarray(q, dtype=float)
    return float(np.sum(q * GENERATORS[name](p / q)))

def best_test_event(p, q):
    p, q = np.asarray(p, dtype=float), np.asarray(q, dtype=float); A = p > q
    return A, float(np.sum(p[A] - q[A]))`;

const JS = `import numpy as np

def kl_nats(p, q):
    p, q = np.asarray(p, dtype=float), np.asarray(q, dtype=float); m = p > 0
    return float(np.sum(p[m] * np.log(p[m] / q[m])))

def js(p, q):
    m = 0.5 * (np.asarray(p, dtype=float) + np.asarray(q, dtype=float))
    return 0.5 * kl_nats(p, m) + 0.5 * kl_nats(q, m)

def pinsker_holds(p, q):
    tv = 0.5 * np.abs(np.asarray(p) - np.asarray(q)).sum()
    return bool(tv <= np.sqrt(kl_nats(p, q) / 2) + 1e-12)`;

export const lesson: LessonContent = {
  id: "m12.2.5",
  minutes: 45,
  links: {
    requires: ["m12.2.4", "m12.2.1"],
    revisits: ["m7.4.2"],
    foreshadows: ["l7.1.2", "m12.6.3"],
  },

  puzzle: (
    <>
      <p>
        Statisticians measure how different two distributions are with total variation, Hellinger distance or χ²; the
        original generative adversarial network turned out to minimise the Jensen–Shannon divergence; and this course has
        been using KL. They look like unrelated formulas, with different units and different behaviour when one distribution
        puts zero mass where the other does not. Is there one idea behind all of them, and does the data processing
        inequality, proved for mutual information, hold for every one?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every one of these divergences looks at the likelihood ratio p(x)/q(x), passes it through a convex function f with
        f(1) = 0, and averages under q. When p = q the ratio is 1 everywhere and the divergence is 0; convexity and Jensen
        make it nonnegative otherwise. The choice of f decides how heavily large and small ratios are punished: x log x gives
        KL, |t − 1|/2 gives total variation, (√t − 1)² gives squared Hellinger. And because Jensen&apos;s inequality is all the
        proofs use, every member obeys data processing.
      </p>
      <FDivViz />
    </>
  ),

  theory: (
    <>
      <Definition title="f-divergences">
        <p>
          For convex <M>{"f : (0, \\infty) \\to \\mathbb{R}"}</M> with f(1) = 0, and q(x) &gt; 0 wherever p(x) &gt; 0 (other cases
          are handled by limits),
        </p>
        <MD>{"D_f(p\\,\\|\\,q) = \\sum_x q(x)\\,f\\!\\left(\\frac{p(x)}{q(x)}\\right)."}</MD>
        <p>
          <M>{"f(t) = t\\log t"}</M> gives KL, <M>{"-\\log t"}</M> gives reverse KL D(q‖p),{" "}
          <M>{"\\tfrac12|t - 1|"}</M> gives total variation <M>{"\\tfrac12\\sum|p - q|"}</M>,{" "}
          <M>{"(\\sqrt t - 1)^2"}</M> gives the squared Hellinger distance <M>{"\\sum(\\sqrt p - \\sqrt q)^2"}</M>, and{" "}
          <M>{"(t - 1)^2"}</M> gives <M>{"\\chi^2 = \\sum(p - q)^2/q"}</M>.
        </p>
      </Definition>

      <Theorem title="nonnegativity">
        <p>
          <M>{"D_f(p\\,\\|\\,q) \\ge 0"}</M>, with equality when p = q; if f is strictly convex at 1, equality holds only
          when p = q.
        </p>
      </Theorem>
      <Proof>
        <p>
          The weights q(x) sum to 1, so Jensen gives{" "}
          <M>{"\\sum_x q(x)f(p(x)/q(x)) \\ge f\\left(\\sum_x q(x)\\,p(x)/q(x)\\right) = f(1) = 0"}</M>. With strict convexity,
          equality forces p(x)/q(x) to be constant, hence 1.
        </p>
        <Code>{FD}</Code>
      </Proof>

      <Theorem title="total variation is the best test">
        <p>
          <M>{"\\mathrm{TV}(p, q) = \\max_A\\,|P(A) - Q(A)|"}</M>, attained at A = {"{"}x : p(x) &gt; q(x){"}"}. Given one draw
          from p or q with equal prior probability, the best possible chance of guessing which is{" "}
          <M>{"\\tfrac12(1 + \\mathrm{TV})"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"P(A) - Q(A) = \\sum_{x \\in A}(p - q)"}</M> is largest when A collects exactly the x with p &gt; q, giving{" "}
          <M>{"\\sum(p - q)^+"}</M>. Since <M>{"\\sum(p - q) = 0"}</M>, the positive and negative parts are equal, so this is{" "}
          <M>{"\\tfrac12\\sum|p - q|"}</M>; the same bound holds for Q(A) − P(A). A guessing rule says &quot;p&quot; on some set A,
          and succeeds with probability <M>{"\\tfrac12P(A) + \\tfrac12(1 - Q(A)) = \\tfrac12(1 + P(A) - Q(A))"}</M>, which is
          at most <M>{"\\tfrac12(1 + \\mathrm{TV})"}</M>, with equality for the best A. In the code, TV = 0.3, so no test does
          better than 65%.
        </p>
      </Proof>

      <Theorem title="data processing for every f-divergence">
        <p>
          If both distributions pass through the same channel K, giving outputs pK and qK, then{" "}
          <M>{"D_f(pK\\,\\|\\,qK) \\le D_f(p\\,\\|\\,q)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Fix an output y with <M>{"(qK)(y) > 0"}</M> and put <M>{"w_x = q(x)K(y \\mid x)/(qK)(y)"}</M>, weights summing to 1.
          Then <M>{"\\frac{(pK)(y)}{(qK)(y)} = \\sum_x w_x\\frac{p(x)}{q(x)}"}</M>, so by Jensen{" "}
          <M>{"f\\left(\\frac{(pK)(y)}{(qK)(y)}\\right) \\le \\sum_x w_xf\\left(\\frac{p(x)}{q(x)}\\right)"}</M>. Multiply by{" "}
          <M>{"(qK)(y)"}</M> and sum over y: the right side becomes{" "}
          <M>{"\\sum_x q(x)f(p(x)/q(x))\\sum_y K(y \\mid x) = D_f(p\\,\\|\\,q)"}</M>. In the code, a three-to-two channel shrinks
          the KL from 0.218 to 0.098 nats.
        </p>
      </Proof>

      <Remark title="Pinsker, Jensen–Shannon and GANs">
        <p>
          Different f-divergences control each other. Pinsker&apos;s inequality,{" "}
          <M>{"\\mathrm{TV} \\le \\sqrt{D(p\\,\\|\\,q)/2}"}</M> with D in nats, says a small KL forces every event to have
          nearly the same probability under both. The Jensen–Shannon divergence,{" "}
          <M>{"\\mathrm{JS}(p, q) = \\tfrac12D(p\\,\\|\\,m) + \\tfrac12D(q\\,\\|\\,m)"}</M> with m = (p + q)/2, is symmetric,
          always finite and at most log 2, reached when the supports are disjoint. The original GAN, with its discriminator
          trained to optimality, minimises <M>{"2\\,\\mathrm{JS} - \\log 4"}</M>, and the f-GAN family trains a generator
          against any chosen f-divergence through a variational formula for D_f. That JS saturates at log 2 for disjoint
          supports is one reason early GANs gave vanishing gradients.
        </p>
        <Code>{JS}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "tv",
      rung: "check",
      prompt: <p>What is the total variation distance between (0.5, 0.5) and (0.9, 0.1)?</p>,
      answer: { kind: "numeric", value: 0.4, tolerance: 0.0001 },
    },
    {
      key: "chi",
      rung: "check",
      prompt: <p>What is χ²(p‖q) = Σ (p − q)²/q for p = (½, ½) and q = (¼, ¾)? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.3333, tolerance: 0.0001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why does the definition of an f-divergence require f to be convex with f(1) = 0?</p>,
      answer: {
        kind: "choice",
        options: [
          "Then Jensen's inequality gives Σ q f(p/q) ≥ f(1) = 0, so the divergence is nonnegative and zero when p = q",
          "So that the divergence is symmetric in p and q",
          "So that the divergence is always finite",
          "So that the divergence satisfies the triangle inequality",
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

GENERATORS = {
    "kl": lambda t: t * np.log(t),
    "reverse_kl": lambda t: -np.log(t),
    "tv": lambda t: 0.5 * np.abs(t - 1),
    "hellinger2": lambda t: (np.sqrt(t) - 1) ** 2,
    "chi2": lambda t: (t - 1) ** 2,
}

def f_divergence(p, q, name):
    p, q = np.asarray(p, dtype=float), np.asarray(q, dtype=float)
    return float(np.sum(q * GENERATORS[name](p / q)))

def best_test_event(p, q):
    p, q = np.asarray(p, dtype=float), np.asarray(q, dtype=float); A = p > q
    return A, float(np.sum(p[A] - q[A]))

p, q = [0.5, 0.3, 0.2], [0.25, 0.25, 0.5]
print({k: round(f_divergence(p, q, k), 4) for k in GENERATORS})
A, gap = best_test_event(p, q)
print(A, round(gap, 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'kl': 0.218, 'reverse_kl': 0.2393, 'tv': 0.3, 'hellinger2': 0.1127, 'chi2': 0.44}\n[ True  True False] 0.3",
          "{'kl': 0.218, 'reverse_kl': 0.218, 'tv': 0.3, 'hellinger2': 0.1127, 'chi2': 0.44}\n[ True  True False] 0.3",
          "{'kl': 0.218, 'reverse_kl': 0.2393, 'tv': 0.6, 'hellinger2': 0.1127, 'chi2': 0.44}\n[ True  True False] 0.6",
          "{'kl': 0.218, 'reverse_kl': 0.2393, 'tv': 0.3, 'hellinger2': 0.1127, 'chi2': 0.44}\n[False False  True] 0.3",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def kl_nats(p, q):
    p, q = np.asarray(p, dtype=float), np.asarray(q, dtype=float); m = p > 0
    return float(np.sum(p[m] * np.log(p[m] / q[m])))

def js(p, q):
    m = 0.5 * (np.asarray(p, dtype=float) + np.asarray(q, dtype=float))
    return 0.5 * kl_nats(p, m) + 0.5 * kl_nats(q, m)

def pinsker_holds(p, q):
    tv = 0.5 * np.abs(np.asarray(p) - np.asarray(q)).sum()
    return bool(tv <= np.sqrt(kl_nats(p, q) / 2) + 1e-12)

print(round(js([1.0, 0.0], [0.0, 1.0]), 4), round(js([0.5, 0.5], [0.5, 0.5]), 4) + 0.0)
K = np.array([[0.9, 0.1], [0.5, 0.5], [0.1, 0.9]]); p2, q2 = np.array([0.5, 0.3, 0.2]) @ K, np.array([0.25, 0.25, 0.5]) @ K
print(round(kl_nats(p2, q2), 4), round(js(p2, q2), 4), pinsker_holds(p2, q2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.6931 0.0\n0.0981 0.0244 True", "inf 0.0\n0.0981 0.0244 True", "1.0 0.0\n0.0981 0.0244 True", "0.6931 0.0\n0.3189 0.0244 False"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Complete the dictionary <C>GENERATORS</C> with the generators for &quot;kl&quot;, &quot;reverse_kl&quot;, &quot;tv&quot;,
          &quot;hellinger2&quot; and &quot;chi2&quot; (natural logs), write <C>f_divergence(p, q, name)</C> assuming q &gt; 0
          everywhere, and <C>best_test_event(p, q)</C>, returning the boolean mask of p &gt; q and P(A) − Q(A) for it.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

GENERATORS = {}

def f_divergence(p, q, name):
    return 0.0

def best_test_event(p, q):
    return np.zeros(len(p), dtype=bool), 0.0
`,
        solution: FD,
        tests: [
          { name: "values", code: `p, q = [0.5, 0.5], [0.25, 0.75]
assert np.isclose(f_divergence(p, q, "chi2"), 1 / 3) and np.isclose(f_divergence(p, q, "tv"), 0.25)
assert np.isclose(f_divergence(p, q, "kl"), 0.5 * np.log(2) + 0.5 * np.log(2 / 3)) and np.isclose(f_divergence(p, q, "reverse_kl"), 0.25 * np.log(0.5) + 0.75 * np.log(1.5))
assert np.isclose(f_divergence(p, q, "hellinger2"), (np.sqrt(0.5) - 0.5) ** 2 + (np.sqrt(0.5) - np.sqrt(0.75)) ** 2)` },
          { name: "event", code: `A, g = best_test_event([0.1, 0.6, 0.3], [0.4, 0.2, 0.4])
assert list(A) == [False, True, False] and np.isclose(g, 0.4) and np.isclose(f_divergence([0.2, 0.8], [0.2, 0.8], "kl"), 0.0)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kl_nats(p, q)</C>; <C>js(p, q)</C>, the Jensen–Shannon divergence in nats; and{" "}
          <C>pinsker_holds(p, q)</C>, returning whether TV ≤ √(KL/2) (allow 10⁻¹² of slack).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def kl_nats(p, q):
    return 0.0

def js(p, q):
    return 0.0

def pinsker_holds(p, q):
    return False
`,
        solution: JS,
        tests: [
          { name: "js", code: `assert np.isclose(js([1.0, 0.0], [0.0, 1.0]), np.log(2)) and np.isclose(js([0.3, 0.7], [0.3, 0.7]), 0.0)
p, q = np.array([0.6, 0.4]), np.array([0.2, 0.8]); m = (p + q) / 2
assert np.isclose(js(p, q), js(q, p)) and np.isclose(js(p, q), 0.5 * np.sum(p * np.log(p / m)) + 0.5 * np.sum(q * np.log(q / m)))` },
          { name: "pinsker", code: `rng = np.random.default_rng(5)
for _ in range(50):
    p, q = rng.dirichlet(np.ones(4)), rng.dirichlet(np.ones(4)); assert pinsker_holds(p, q)
assert pinsker_holds([0.5, 0.5], [0.5, 0.5]) and np.isclose(kl_nats([0.0, 1.0], [0.5, 0.5]), np.log(2))` },
        ],
      },
    },
    {
      key: "guess",
      rung: "stretch",
      prompt: (
        <p>
          One sample comes, with equal prior probability, from p = (0.5, 0.3, 0.2) or q = (0.25, 0.25, 0.5). What is the best
          possible probability of guessing correctly which distribution produced it?
        </p>
      ),
      answer: { kind: "numeric", value: 0.65, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        This finishes the measures of information. The next chapter asks what they mean for compression, starting with a
        surprising fact: long sequences from a source are, with overwhelming probability, drawn from a small set of
        typical sequences, all about equally likely.
      </p>
    </>
  ),
};
