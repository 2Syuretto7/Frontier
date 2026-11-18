import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SamplingKnobsViz } from "@/components/viz/SamplingKnobsViz";
import type { LessonContent } from "@/lib/types";

const KNOBS = `import numpy as np

def softmax_t(logits, T):
    z = np.asarray(logits, float) / T
    e = np.exp(z - z.max())
    return e / e.sum()

def top_k(p, k):
    keep = np.zeros(len(p), bool)
    keep[np.argsort(-p, kind="stable")[:k]] = True
    q = np.where(keep, p, 0.0)
    return q / q.sum()

def top_p(p, thresh):
    order = np.argsort(-p, kind="stable")
    n = int(np.searchsorted(np.cumsum(p[order]), thresh)) + 1
    keep = np.zeros(len(p), bool)
    keep[order[:n]] = True
    q = np.where(keep, p, 0.0)
    return q / q.sum()`;

const MORE = `import numpy as np

def min_p(p, ratio):
    q = np.where(p >= ratio * p.max(), p, 0.0)
    return q / q.sum()

def entropy(p):
    p = p[p > 0]
    return float(-(p * np.log(p)).sum())

def sample_with(u, p):
    return int(np.searchsorted(np.cumsum(p), u, side="right"))`;

export const lesson: LessonContent = {
  id: "l5.5.2",
  minutes: 45,
  links: {
    requires: ["l5.5.1", "m13.2.1"],
    revisits: ["l5.2.1"],
    foreshadows: ["l5.5.3"],
  },

  puzzle: (
    <>
      <p>
        Sampling from a language model&apos;s distribution avoids the blandness of the most probable text, but pure sampling
        has its own failure: over hundreds of steps, the model will now and then pick one of the thousands of tokens it
        rated at a fraction of a percent, and one such slip can derail everything after it. How should the distribution be
        reshaped before sampling, and why do practitioners argue over four different knobs to do it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Two moves are available. <em>Temperature</em> divides the logits by T before the softmax, sharpening the
        distribution for T &lt; 1 and flattening it for T &gt; 1, without changing the ranking. <em>Truncation</em> removes
        the unreliable tail and renormalises what is left. The truncation rules differ in how they decide where the tail
        starts: a fixed number of tokens (top-k), the smallest set holding a fixed share of the mass (top-p), or every
        token at least a fixed fraction as likely as the best one (min-p). The last two adapt to how confident the model
        is.
      </p>
      <SamplingKnobsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="temperature and truncation">
        <p>
          With logits z, the temperature-T distribution is <M>{"p_T(i) \\propto e^{z_i/T}"}</M>. Top-k keeps the k most
          probable tokens; top-p keeps the smallest set of most probable tokens whose total probability is at least p;
          min-p keeps the tokens with <M>{"p(i) \\ge r\\max_jp(j)"}</M>. Each then renormalises the kept probabilities.
          Implementations usually apply temperature first. A sample is drawn by the inverse-CDF method: draw u uniform on [0,
          1) and take the first token whose cumulative probability exceeds u.
        </p>
        <Code>{KNOBS}</Code>
      </Definition>

      <Theorem title="temperature moves entropy one way">
        <p>
          The entropy of <M>{"p_T"}</M> is non-decreasing in T, with derivative{" "}
          <M>{"\\operatorname{Var}_{p_T}(z)/T^3"}</M>. As T → 0 the distribution tends to uniform over the maximal logits, and
          as T → ∞ to uniform over all tokens.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write β = 1/T and <M>{"A(\\beta) = \\log\\sum_ie^{\\beta z_i}"}</M>, so <M>{"A' = \\mathbb E[z]"}</M> and{" "}
          <M>{"A'' = \\operatorname{Var}(z)"}</M>. The entropy is <M>{"H = A - \\beta\\mathbb E[z] = A - \\beta A'"}</M>, so{" "}
          <M>{"dH/d\\beta = -\\beta A'' = -\\beta\\operatorname{Var}(z) \\le 0"}</M>, and{" "}
          <M>{"dH/dT = (dH/d\\beta)(-1/T^2) = \\operatorname{Var}(z)/T^3"}</M>. For the limits, ratios{" "}
          <M>{"e^{(z_i - z_j)/T}"}</M> go to 0 or ∞ as T → 0 when <M>{"z_i \\ne z_j"}</M>, and to 1 as T → ∞.
        </p>
      </Proof>

      <Theorem title="what truncation costs">
        <p>
          If a truncation rule removes probability mass m and renormalises, the result q has total variation distance{" "}
          <M>{"\\tfrac12\\sum_i|q(i) - p(i)| = m"}</M> from p.
        </p>
      </Theorem>
      <Proof>
        <p>
          On kept tokens <M>{"q(i) = p(i)/(1 - m) \\ge p(i)"}</M>, so they contribute{" "}
          <M>{"\\sum(q(i) - p(i)) = 1 - (1 - m) = m"}</M>; removed tokens contribute their mass m. Half the sum is m. Top-p
          therefore bounds the distortion by 1 − p whatever the shape, while top-k&apos;s removed mass can be large when the
          distribution is flat, as in the open-ended context of the picture.
        </p>
      </Proof>

      <Theorem title="min-p adapts to confidence">
        <p>
          Min-p with ratio r keeps at most <M>{"1/(r\\,p_{\\max})"}</M> tokens. When the model is confident, few survive; when
          it is not, the cut sits low and many survive.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each kept token has probability at least <M>{"r\\,p_{\\max}"}</M>, and the kept probabilities sum to at most 1.
          With <M>{"p_{\\max} = 0.9"}</M> and r = 0.1 at most 11 tokens can pass, and in practice far fewer; with{" "}
          <M>{"p_{\\max} = 0.05"}</M> the bound is 200. Unlike top-p, the cut depends on the top token only, so a long flat
          tail cannot push it down.
        </p>
        <Code>{MORE}</Code>
      </Proof>

      <Remark title="choosing settings">
        <p>
          Common defaults are temperature between 0.7 and 1 with top-p between 0.9 and 0.95, or min-p around 0.05 to 0.1,
          which tolerates higher temperatures because its cut sharpens as the top token grows. Temperature 0 is taken to
          mean greedy decoding. None of these knobs fix a model that is wrong with confidence: they only decide how much of
          the model&apos;s own uncertainty reaches the text.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "temp",
      rung: "check",
      prompt: <p>The logits are 2, 1 and 0. At temperature 0.5, what is the probability of the first token? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.8668, tolerance: 0.00006 },
    },
    {
      key: "tv",
      rung: "check",
      prompt: <p>Top-p with p = 0.9 is applied to probabilities 0.5, 0.3, 0.15 and 0.05. What is the total variation distance between the result and the original?</p>,
      answer: { kind: "numeric", value: 0.05, tolerance: 1e-9 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why do top-p and min-p usually work better than a fixed top-k?</p>,
      answer: {
        kind: "choice",
        options: [
          "They keep few tokens when the model is confident and many when it is not, while top-k keeps the same number in both cases",
          "They are cheaper to compute because they avoid sorting",
          "They change the ranking of the tokens",
          "They guarantee the most probable sequence is found",
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

def softmax_t(logits, T):
    z = np.asarray(logits, float) / T
    e = np.exp(z - z.max())
    return e / e.sum()

def top_k(p, k):
    keep = np.zeros(len(p), bool)
    keep[np.argsort(-p, kind="stable")[:k]] = True
    q = np.where(keep, p, 0.0)
    return q / q.sum()

def top_p(p, thresh):
    order = np.argsort(-p, kind="stable")
    n = int(np.searchsorted(np.cumsum(p[order]), thresh)) + 1
    keep = np.zeros(len(p), bool)
    keep[order[:n]] = True
    q = np.where(keep, p, 0.0)
    return q / q.sum()

print(np.round(softmax_t([2.0, 1.0, 0.0], 1.0), 3).tolist(), np.round(softmax_t([2.0, 1.0, 0.0], 0.5), 3).tolist())
p = np.array([0.5, 0.3, 0.15, 0.05]); print(top_k(p, 2).round(3).tolist(), top_p(p, 0.8).round(3).tolist(), top_p(p, 0.81).round(3).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.665, 0.245, 0.09] [0.867, 0.117, 0.016]\n[0.625, 0.375, 0.0, 0.0] [0.625, 0.375, 0.0, 0.0] [0.526, 0.316, 0.158, 0.0]",
          "[0.665, 0.245, 0.09] [0.867, 0.117, 0.016]\n[0.625, 0.375, 0.0, 0.0] [0.526, 0.316, 0.158, 0.0] [0.526, 0.316, 0.158, 0.0]",
          "[0.665, 0.245, 0.09] [0.506, 0.307, 0.186]\n[0.625, 0.375, 0.0, 0.0] [0.625, 0.375, 0.0, 0.0] [0.526, 0.316, 0.158, 0.0]",
          "[0.665, 0.245, 0.09] [0.867, 0.117, 0.016]\n[0.5, 0.3, 0.0, 0.0] [0.5, 0.3, 0.0, 0.0] [0.5, 0.3, 0.15, 0.0]",
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

def min_p(p, ratio):
    q = np.where(p >= ratio * p.max(), p, 0.0)
    return q / q.sum()

def entropy(p):
    p = p[p > 0]
    return float(-(p * np.log(p)).sum())

def sample_with(u, p):
    return int(np.searchsorted(np.cumsum(p), u, side="right"))

p = np.array([0.5, 0.3, 0.15, 0.05]); print(min_p(p, 0.25).round(3).tolist(), round(entropy(p), 4), round(entropy(np.ones(4) / 4), 4))
print([sample_with(u, p) for u in [0.1, 0.5, 0.79, 0.96]])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.526, 0.316, 0.158, 0.0] 1.1421 1.3863\n[0, 1, 1, 3]",
          "[0.526, 0.316, 0.158, 0.0] 1.1421 1.3863\n[0, 0, 1, 3]",
          "[0.625, 0.375, 0.0, 0.0] 1.1421 1.3863\n[0, 1, 1, 3]",
          "[0.526, 0.316, 0.158, 0.0] 1.1421 1.3863\n[0, 1, 2, 3]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>softmax_t(logits, T)</C>; <C>top_k(p, k)</C>; and <C>top_p(p, thresh)</C>, keeping the smallest set of
          most probable tokens with total at least thresh. Break ties by index, and return renormalised arrays of the same
          length as p.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def softmax_t(logits, T):
    return np.exp(logits) / np.exp(logits).sum()

def top_k(p, k):
    return p

def top_p(p, thresh):
    return p
`,
        solution: KNOBS,
        tests: [
          { name: "temperature", code: `assert np.allclose(softmax_t([2.0, 1.0, 0.0], 0.5), np.exp([4, 2, 0]) / np.exp([4, 2, 0]).sum())
assert np.allclose(softmax_t([1000.0, 0.0], 1.0), [1, 0]) and np.allclose(softmax_t([3.0, 1.0], 1e6), [0.5, 0.5], atol=1e-5)` },
          { name: "truncation", code: `p = np.array([0.15, 0.5, 0.05, 0.3])
assert np.allclose(top_k(p, 2), [0, 0.625, 0, 0.375]) and np.allclose(top_k(p, 9), p)
assert np.allclose(top_p(p, 0.8), [0, 0.625, 0, 0.375]) and np.allclose(top_p(p, 0.81), [0.15 / 0.95, 0.5 / 0.95, 0, 0.3 / 0.95])
assert np.allclose(top_p(p, 0.1), [0, 1, 0, 0]) and np.allclose(top_k(np.array([0.4, 0.4, 0.2]), 1), [1, 0, 0])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>min_p(p, ratio)</C>; <C>entropy(p)</C> in nats as a float, treating 0 log 0 as 0; and{" "}
          <C>sample_with(u, p)</C>, the inverse-CDF sample for a uniform number u in [0, 1).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def min_p(p, ratio):
    return p

def entropy(p):
    return 0.0

def sample_with(u, p):
    return 0
`,
        solution: MORE,
        tests: [
          { name: "min-p and entropy", code: `p = np.array([0.5, 0.3, 0.15, 0.05]); assert np.allclose(min_p(p, 0.25), [0.5, 0.3, 0.15, 0] / np.float64(0.95)) and np.allclose(min_p(p, 1.0), [1, 0, 0, 0])
assert abs(entropy(np.ones(4) / 4) - np.log(4)) < 1e-12 and entropy(np.array([1.0, 0.0])) == 0 and isinstance(entropy(p), float)` },
          { name: "sampling", code: `p = np.array([0.5, 0.3, 0.15, 0.05]); assert [sample_with(u, p) for u in [0.0, 0.1, 0.5, 0.79, 0.8, 0.96]] == [0, 0, 1, 1, 2, 3]
u = np.random.default_rng(0).random(40000); c = np.bincount([sample_with(x, p) for x in u], minlength=4) / 40000; assert np.allclose(c, p, atol=0.01)` },
        ],
      },
    },
    {
      key: "dHdT",
      rung: "stretch",
      prompt: <p>Two tokens have logits 0 and ln 3. What is the derivative of the entropy with respect to temperature at T = 1? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.2263, tolerance: 0.00006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Sometimes the output must follow rules, such as valid JSON or a fixed set of labels. Next: constrained decoding,
        which masks every token that would break the rules before sampling.
      </p>
    </>
  ),
};
