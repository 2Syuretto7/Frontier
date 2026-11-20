import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GptqViz } from "@/components/viz/GptqViz";
import type { LessonContent } from "@/lib/types";

const GPTQ = `import numpy as np

def rtn(w, scale):
    return np.round(w / scale) * scale              # round each weight to its nearest level

def layer_error(w, w_q, X):
    return float(np.sum(((w - w_q) @ X) ** 2))      # error in the layer's outputs on calibration inputs X

def gptq_row(w, X, scale):
    w = w.astype(float).copy()
    Hinv = np.linalg.inv(X @ X.T)
    q = np.zeros_like(w)
    for i in range(len(w)):
        q[i] = np.round(w[i] / scale) * scale
        err = (w[i] - q[i]) / Hinv[i, i]
        w[i + 1:] -= err * Hinv[i, i + 1:]          # push the error onto weights not yet quantised
        Hinv -= np.outer(Hinv[:, i], Hinv[i, :]) / Hinv[i, i]   # remove coordinate i from the problem
    return q`;

const AWQ = `import numpy as np

def salient_channels(act_mag, frac):
    k = int(len(act_mag) * frac)
    return sorted(int(i) for i in np.argsort(act_mag)[::-1][:k])   # input channels with the largest activations

def awq_scales(act_mag, alpha):
    return np.asarray(act_mag, dtype=float) ** alpha

def apply_scales(w, s):
    return w * s                                    # scale weight columns up; inputs are divided by s to compensate`;

export const lesson: LessonContent = {
  id: "e12.4.2",
  minutes: 55,
  links: {
    requires: ["e12.4.1", "m3.5.3"],
    revisits: ["e9.5.2", "e12.1.1"],
    foreshadows: ["e12.4.3"],
  },

  puzzle: (
    <>
      <p>
        Rounding every weight of a 70B-parameter model to its nearest 4-bit level, with small groups, still costs noticeable accuracy.
        Two methods, each using a few hundred sentences of calibration text and no retraining, recover most of it at the same 4 bits.
        One adjusts the not-yet-quantised weights to cancel each rounding error; the other rescales a handful of input channels before
        quantising. What do they know that rounding does not?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        What matters is not how far each weight moves but how much the layer&apos;s outputs change on real inputs. For a linear layer
        with calibration inputs X, the output error of a row is <M>{"\\delta^\\top H \\delta"}</M> with <M>{"H = XX^\\top"}</M> and{" "}
        <M>{"\\delta"}</M> the change in weights. When inputs are correlated, an error in one weight can be partly cancelled by
        adjusting others, as GPTQ does, one weight at a time. And input channels with large activations multiply their weights&apos;
        errors, so AWQ scales those columns up before quantising, giving them finer steps, and divides the inputs by the same factors.
        Only weights are quantised; activations stay in 16 bits, which suits memory-bound decode (e12.1.1).
      </p>
      <GptqViz />
    </>
  ),

  theory: (
    <>
      <Definition title="error-compensating quantisation">
        <p>
          <C>rtn</C> rounds each weight to the nearest level. <C>layer_error</C> is the squared change in the layer&apos;s outputs on
          calibration inputs X, columns being examples. <C>gptq_row</C> quantises a row&apos;s weights in order; after each, it spreads
          the rounding error over the remaining weights using the inverse of <M>{"H = XX^\\top"}</M>, then removes that coordinate from{" "}
          <M>{"H^{-1}"}</M>.
        </p>
        <Code>{GPTQ}</Code>
      </Definition>

      <Theorem title="the optimal compensation">
        <p>
          Minimising <M>{"\\delta^\\top H \\delta"}</M> subject to <M>{"\\delta_i = e"}</M> gives{" "}
          <M>{"\\delta = e\\,H^{-1}e_i/(H^{-1})_{ii}"}</M>, with minimum value <M>{"e^2/(H^{-1})_{ii}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          With a multiplier λ for the constraint <M>{"e_i^\\top \\delta = e"}</M>, stationarity gives <M>{"2H\\delta = \\lambda e_i"}</M>,
          so <M>{"\\delta = (\\lambda/2)H^{-1}e_i"}</M>. The constraint sets <M>{"\\lambda/2 = e/(H^{-1})_{ii}"}</M>, giving the stated
          δ, and then <M>{"\\delta^\\top H \\delta = e^2 e_i^\\top H^{-1} e_i/(H^{-1})_{ii}^2 = e^2/(H^{-1})_{ii}"}</M>. With{" "}
          <M>{"e = q_i - w_i"}</M>, the other weights move by <M>{"-(w_i - q_i)(H^{-1})_{ij}/(H^{-1})_{ii}"}</M>, the update in{" "}
          <C>gptq_row</C>; this is a constrained least-squares problem (m3.5.3). Removing coordinate i from <M>{"H^{-1}"}</M> by the
          rank-one update gives the inverse for the remaining weights, so the step repeats.
        </p>
      </Proof>

      <Definition title="activation-aware scaling">
        <p>
          <C>salient_channels</C> returns, sorted, the indices of the given fraction of input channels with the largest mean activation
          magnitude. <C>awq_scales</C> gives per-channel factors <M>{"s_j = a_j^\\alpha"}</M> from activation magnitudes, and{" "}
          <C>apply_scales</C> multiplies each weight column by its factor.
        </p>
        <Code>{AWQ}</Code>
      </Definition>

      <Theorem title="scaling is free before quantisation">
        <p>
          For any positive factors s, <M>{"(W\\,\\mathrm{diag}(s))(\\mathrm{diag}(s)^{-1}x) = Wx"}</M>. If column j is scaled by{" "}
          <M>{"s_j"}</M> and quantised with an unchanged step Δ, its weights&apos; rounding error in original units is at most{" "}
          <M>{"\\Delta/(2s_j)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The diagonal matrices cancel, so the scaled layer computes the same function before quantisation, and the division of x can be
          folded into the previous layer. A scaled weight <M>{"s_j w"}</M> is rounded with error at most Δ/2; dividing back by{" "}
          <M>{"s_j"}</M> gives at most <M>{"\\Delta/(2s_j)"}</M>, and the contribution to the output, multiplied by an activation of size{" "}
          <M>{"a_j"}</M>, shrinks with it. The step stays the same only while the scaled column does not set the group maximum, so
          factors are kept moderate and α is tuned on calibration data.
        </p>
      </Proof>

      <Remark title="weight-only quantisation in practice">
        <p>
          GPTQ quantises a large model layer by layer in a few GPU-hours, using Cholesky factorisations for stability and processing
          columns in blocks. AWQ searches α per layer and keeps all weights in 4 bits. Both store 4-bit weights with 16-bit group scales,
          and quantised kernels (e9.5.2) dequantise on the fly. At 4 bits, both typically lose only a small amount of accuracy on large
          models; at 3 bits and below the losses grow, and methods using vector codebooks or incoherence rotations take over.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Rounding minimises each weight&apos;s own error, not the layer&apos;s output error. GPTQ uses the calibration inputs&apos;
          correlations to cancel each rounding error with later weights; AWQ uses their magnitudes to protect the columns that matter
          most. Both reach the same storage as rounding, about 4.1 bits per weight with group scales, but with much smaller output error.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "obs",
      rung: "check",
      prompt: (
        <p>
          Quantising weight i moves it by 0.3, and <M>{"(H^{-1})_{ii} = 0.5"}</M>. After the best adjustment of the other weights, by how
          much has <M>{"\\delta^\\top H \\delta"}</M> increased?
        </p>
      ),
      answer: { kind: "numeric", value: 0.18, tolerance: 0.0001 },
    },
    {
      key: "memory",
      rung: "check",
      prompt: (
        <p>
          A 70B-parameter model is stored with 4-bit weights and one 16-bit scale per group of 128. How many GB (10⁹ bytes) do the weights
          occupy? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 36.09, tolerance: 0.01 },
    },
    {
      key: "calibrate",
      rung: "apply",
      prompt: <p>Why do GPTQ and AWQ need calibration data while round-to-nearest does not?</p>,
      answer: {
        kind: "choice",
        options: [
          "They minimise the error in the layer's outputs, which depends on the statistics of real inputs",
          "They retrain the model on the calibration data",
          "Calibration data sets the number of bits",
          "Round-to-nearest already uses the training data",
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

def rtn(w, scale):
    return np.round(w / scale) * scale              # round each weight to its nearest level

def layer_error(w, w_q, X):
    return float(np.sum(((w - w_q) @ X) ** 2))      # error in the layer's outputs on calibration inputs X

def gptq_row(w, X, scale):
    w = w.astype(float).copy()
    Hinv = np.linalg.inv(X @ X.T)
    q = np.zeros_like(w)
    for i in range(len(w)):
        q[i] = np.round(w[i] / scale) * scale
        err = (w[i] - q[i]) / Hinv[i, i]
        w[i + 1:] -= err * Hinv[i, i + 1:]          # push the error onto weights not yet quantised
        Hinv -= np.outer(Hinv[:, i], Hinv[i, :]) / Hinv[i, i]   # remove coordinate i from the problem
    return q

w = np.array([0.4, 0.4]); X = np.array([[1.0, 0.0, 1.0], [0.0, 1.0, 1.0]])
print(rtn(w, 1.0).tolist(), gptq_row(w, X, 1.0).tolist(), round(layer_error(w, rtn(w, 1.0), X), 2), round(layer_error(w, gptq_row(w, X, 1.0), X), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.0, 0.0] [0.0, 1.0] 0.96 0.56",
          "[0.0, 0.0] [0.0, 0.0] 0.96 0.96",
          "[0.0, 0.0] [1.0, 0.0] 0.96 0.56",
          "[0.0, 0.0] [0.0, 1.0] 0.32 0.56",
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

def salient_channels(act_mag, frac):
    k = int(len(act_mag) * frac)
    return sorted(int(i) for i in np.argsort(act_mag)[::-1][:k])   # input channels with the largest activations

def awq_scales(act_mag, alpha):
    return np.asarray(act_mag, dtype=float) ** alpha

def apply_scales(w, s):
    return w * s                                    # scale weight columns up; inputs are divided by s to compensate

a = np.array([0.25, 4.0, 1.0, 16.0])
print(salient_channels(a, 0.5), awq_scales(a, 0.5).tolist(), apply_scales(np.array([[1.0, 2.0, 3.0, 4.0]]), awq_scales(a, 0.5))[0].tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 3] [0.5, 2.0, 1.0, 4.0] [0.5, 4.0, 3.0, 16.0]",
          "[3, 1] [0.5, 2.0, 1.0, 4.0] [0.5, 4.0, 3.0, 16.0]",
          "[1, 3] [0.0625, 16.0, 1.0, 256.0] [0.5, 4.0, 3.0, 16.0]",
          "[1, 3] [0.5, 2.0, 1.0, 4.0] [2.0, 1.0, 3.0, 1.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rtn(w, scale)</C>, <C>layer_error(w, w_q, X)</C>, returning a float, and <C>gptq_row(w, X, scale)</C>, which must not
          modify <C>w</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rtn(w, scale):
    return w

def layer_error(w, w_q, X):
    return 0.0

def gptq_row(w, X, scale):
    return rtn(w, scale)
`,
        solution: GPTQ,
        tests: [
          { name: "basics", code: `assert rtn(np.array([0.26, -0.74]), 0.5).tolist() == [0.5, -0.5]\nassert layer_error(np.array([1.0, 0.0]), np.array([0.0, 0.0]), np.array([[2.0, 1.0], [0.0, 5.0]])) == 5.0` },
          { name: "gptq", code: `w = np.array([0.3, 0.3]); X = np.array([[1.0, 0.0, 1.0], [0.0, 1.0, 1.0]])\nassert gptq_row(w, X, 1.0).tolist() == [0.0, 0.0] and w.tolist() == [0.3, 0.3]\nw2 = np.array([0.45, 0.2])\nassert gptq_row(w2, X, 1.0).tolist() == [0.0, 0.0] and gptq_row(np.array([0.4, 0.4]), np.eye(2), 1.0).tolist() == [0.0, 0.0]\nassert gptq_row(np.array([0.4, 0.4]), np.array([[1.0, 1.0], [1.0, 0.9]]), 1.0).tolist() == [0.0, 1.0]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>salient_channels(act_mag, frac)</C>, returning a sorted list of ints of length <C>int(len(act_mag) * frac)</C>;{" "}
          <C>awq_scales(act_mag, alpha)</C>; and <C>apply_scales(w, s)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def salient_channels(act_mag, frac):
    return []

def awq_scales(act_mag, alpha):
    return np.ones(len(act_mag))

def apply_scales(w, s):
    return w
`,
        solution: AWQ,
        tests: [
          { name: "salient", code: `assert salient_channels(np.array([5.0, 1.0, 9.0, 3.0]), 0.5) == [0, 2] and salient_channels(np.array([1.0, 2.0]), 0.2) == []` },
          { name: "scales", code: `s = awq_scales([4.0, 9.0], 0.5)\nassert np.allclose(s, [2.0, 3.0]) and np.allclose(apply_scales(np.array([[1.0, 1.0], [2.0, 0.0]]), s), [[2.0, 3.0], [4.0, 0.0]])` },
        ],
      },
    },
    {
      key: "protect",
      rung: "stretch",
      prompt: (
        <p>
          A salient column contributes a mean squared output error of 0.08 after rounding. It is scaled by 4 before quantisation, with the
          step unchanged, and its inputs are divided by 4. Assuming the rounding error in scaled units has the same distribution, what is
          its new contribution?
        </p>
      ),
      answer: { kind: "numeric", value: 0.005, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Weight-only quantisation leaves the matrix multiplications in 16 bits. To use 8-bit arithmetic, activations must be quantised
        too, and activations contain outliers that are far worse than any in the weights. The next lesson deals with them.
      </p>
    </>
  ),
};
