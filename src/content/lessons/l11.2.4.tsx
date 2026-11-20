import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PatchingDirectionsViz } from "@/components/viz/PatchingDirectionsViz";
import type { LessonContent } from "@/lib/types";

const PATCH = `def forward(layers, x, patch=None):
    acts = [x]
    for k, f in enumerate(layers, 1):
        acts.append(patch[k] if patch and k in patch else f(acts))
    return acts

def patch_effect(layers, clean_x, corrupt_x, k, metric):
    clean, corrupt = forward(layers, clean_x), forward(layers, corrupt_x)
    patched = forward(layers, corrupt_x, {k: clean[k]})
    return (metric(patched) - metric(corrupt)) / (metric(clean) - metric(corrupt))

def noising_effect(layers, clean_x, corrupt_x, k, metric):
    clean, corrupt = forward(layers, clean_x), forward(layers, corrupt_x)
    patched = forward(layers, clean_x, {k: corrupt[k]})
    return (metric(clean) - metric(patched)) / (metric(clean) - metric(corrupt))`;

const METRICS = `def logit_diff(logits, a, b):
    return logits[a] - logits[b]

def normalised_recovery(m, m_clean, m_corrupt):
    return (m - m_corrupt) / (m_clean - m_corrupt)

def attribution_patch(grad, clean_act, corrupt_act):
    return sum(g * (c - r) for g, c, r in zip(grad, clean_act, corrupt_act))`;

export const lesson: LessonContent = {
  id: "l11.2.4",
  minutes: 55,
  links: {
    requires: ["l11.2.3", "l10.7.2"],
    revisits: ["l11.1.1", "l11.1.4", "l11.2.1"],
    foreshadows: ["l11.5.1", "l11.6.1"],
  },

  puzzle: (
    <>
      <p>
        Given &quot;When Mary and John went to the store, John gave a drink to&quot;, a model answers &quot;Mary&quot;. You want to find
        which heads compute this. Replacing a head&apos;s output with zeros is drastic and may break the model for unrelated reasons.
        Replacing it with its output on a different sentence seems gentler, but which sentence, and in which direction should you swap?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Activation patching runs the model on two inputs that differ in one controlled way, a clean input where the behaviour happens
        and a corrupted one where it does not, and copies a single activation from one run into the other. If copying the clean
        activation into the corrupted run restores the behaviour, that activation carries what the corruption removed. Because only one
        variable changes and everything else is held fixed, this is a causal experiment rather than a correlation, and the choice of
        corruption decides exactly which question it answers.
      </p>
      <PatchingDirectionsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="denoising and noising">
        <p>
          Treat the model as a sequence of activations, each computed from the earlier ones (<C>forward</C>), and fix a scalar metric m
          such as the logit difference between the right and wrong answers (<C>logit_diff</C>). Denoising, or patching clean into
          corrupted, runs the corrupted input with activation k taken from the clean run and reports{" "}
          <M>{"(m_{\\text{patched}} - m_{\\text{corr}})/(m_{\\text{clean}} - m_{\\text{corr}})"}</M> (<C>patch_effect</C>,{" "}
          <C>normalised_recovery</C>). Noising runs the clean input with activation k from the corrupted run and reports the fraction of the
          gap lost (<C>noising_effect</C>). Later activations are recomputed, so the effect of k includes everything downstream of it.
        </p>
        <Code>{PATCH}</Code>
      </Definition>

      <Theorem title="sufficiency and necessity are different questions">
        <p>
          Denoising measures whether an activation is sufficient, given the corrupted context, to restore the behaviour; noising measures
          whether it is necessary in the clean context. With two components that are redundant, each alone sufficient, noising either
          one shows no effect; with two components that are both needed, denoising either one shows no effect.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let the metric be <M>{"1 - (1-c_1)(1-c_2)"}</M>, with both components 1 on the clean input and 0 on the corrupted one. Noising{" "}
          <M>{"c_1"}</M> gives <M>{"1 - (1)(0) = 1"}</M>, the clean value, so the loss is 0, and similarly for <M>{"c_2"}</M>; but denoising
          either gives 1, full recovery. With metric <M>{"c_1 c_2"}</M>, denoising <M>{"c_1"}</M> gives <M>{"1 \\cdot 0 = 0"}</M>, no
          recovery, while noising it drops the metric to 0, full loss. Each method is blind to one of these structures, which is why
          careful studies run both.
        </p>
      </Proof>

      <Remark title="choosing the corruption">
        <p>
          The corrupted input should differ only in the variable of interest and stay in distribution. For the puzzle, swapping which name
          is repeated (&quot;… Mary gave a drink to&quot;) changes the answer while keeping the sentence natural; this is resample-style
          patching. Zero ablation and adding Gaussian noise to embeddings push activations off the distribution the model was trained on,
          so effects may reflect broken computation rather than the mechanism. Mean ablation, replacing an activation by its average over a
          dataset, sits between the two (l11.1.1). Path patching restricts the patch to the route from one component to another, so it
          measures a single edge of the circuit rather than everything downstream.
        </p>
      </Remark>

      <Definition title="attribution patching">
        <p>
          Patching every head at every position needs one forward pass each. Attribution patching approximates all denoising effects at
          once by a first-order Taylor expansion at the corrupted run:{" "}
          <M>{"m_{\\text{patched}} - m_{\\text{corr}} \\approx \\nabla_{a_k} m \\cdot (a_k^{\\text{clean}} - a_k^{\\text{corr}})"}</M>{" "}
          (<C>attribution_patch</C>), which needs one forward and one backward pass. It is the gradient-times-input idea of l11.1.4 applied
          to activations, and it fails in the same way where the metric curves or saturates, as the visualisation&apos;s last circuit
          shows. Use it to screen, then confirm the important components with real patches.
        </p>
        <Code>{METRICS}</Code>
      </Definition>

      <Example title="the puzzle, resolved">
        <p>
          In the indirect-object task, patching from the sentence with the names swapped, position by position and head by head, located a
          circuit of heads that find the duplicated name, heads that suppress it, and heads that copy the remaining name to the output.
          Noising and denoising disagreed on some heads that act as backups, which take over when the main ones are removed, an instance
          of the redundancy in the theorem.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "recover",
      rung: "check",
      prompt: (
        <p>
          The logit difference is 4.0 on the clean input and −1.0 on the corrupted one. Patching one head&apos;s clean output into the
          corrupted run gives 2.5. What fraction of the gap does it recover?
        </p>
      ),
      answer: { kind: "numeric", value: 0.7, tolerance: 0.001 },
    },
    {
      key: "attrib",
      rung: "check",
      prompt: (
        <p>
          At the corrupted run, the gradient of the metric with respect to an activation is (0.5, −1, 2). The activation is (1, 2, 0) on
          the clean input and (0, 1, 1) on the corrupted one. What is the attribution-patching estimate of the change from patching it?
        </p>
      ),
      answer: { kind: "numeric", value: -2.5, tolerance: 0.001 },
    },
    {
      key: "backup",
      rung: "apply",
      prompt: (
        <p>
          Denoising head 9.6 restores 60% of the logit difference, but noising it in the clean run lowers the logit difference by only 5%.
          What is the most likely explanation?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Other heads can do the same job, so head 9.6 is sufficient but not necessary when they are present",
          "The patching code has a bug, since the two must agree",
          "Head 9.6 is irrelevant, because noising is the more reliable test",
          "The corrupted input is out of distribution",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def forward(layers, x, patch=None):
    acts = [x]
    for k, f in enumerate(layers, 1):
        acts.append(patch[k] if patch and k in patch else f(acts))
    return acts

def patch_effect(layers, clean_x, corrupt_x, k, metric):
    clean, corrupt = forward(layers, clean_x), forward(layers, corrupt_x)
    patched = forward(layers, corrupt_x, {k: clean[k]})
    return (metric(patched) - metric(corrupt)) / (metric(clean) - metric(corrupt))

def noising_effect(layers, clean_x, corrupt_x, k, metric):
    clean, corrupt = forward(layers, clean_x), forward(layers, corrupt_x)
    patched = forward(layers, clean_x, {k: corrupt[k]})
    return (metric(clean) - metric(patched)) / (metric(clean) - metric(corrupt))

layers, last = [lambda a: a[0] * 2, lambda a: a[1] * a[0] + a[0]], lambda acts: acts[-1]
print(forward(layers, 1), round(patch_effect(layers, 1, 0, 1, last), 3), round(noising_effect(layers, 1, 0, 1, last), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 2, 3] 0.0 0.667",
          "[1, 2, 3] 0.667 0.667",
          "[1, 2, 3] 0.0 0.333",
          "[1, 2, 4] 0.0 0.667",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def logit_diff(logits, a, b):
    return logits[a] - logits[b]

def normalised_recovery(m, m_clean, m_corrupt):
    return (m - m_corrupt) / (m_clean - m_corrupt)

def attribution_patch(grad, clean_act, corrupt_act):
    return sum(g * (c - r) for g, c, r in zip(grad, clean_act, corrupt_act))

print(logit_diff([2.0, 0.5, 1.0], 0, 2), normalised_recovery(1.5, 3.0, 1.0), attribution_patch([1, -2], [3, 1], [1, 1]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 0.25 2",
          "1.0 0.75 2",
          "-1.0 0.25 2",
          "1.0 0.25 -2",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          A model is a list of functions; function k receives the list of activations so far, starting with the input, and returns
          activation k. Write <C>forward(layers, x, patch=None)</C>, where patch maps indices to values used instead of computing them;{" "}
          <C>patch_effect(layers, clean_x, corrupt_x, k, metric)</C>, the normalised denoising recovery; and{" "}
          <C>noising_effect(layers, clean_x, corrupt_x, k, metric)</C>, the normalised loss from noising.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def forward(layers, x, patch=None):
    return [x]

def patch_effect(layers, clean_x, corrupt_x, k, metric):
    return 0.0

def noising_effect(layers, clean_x, corrupt_x, k, metric):
    return 0.0
`,
        solution: PATCH,
        tests: [
          { name: "forward", code: `L = [lambda a: a[0] + 1, lambda a: a[1] ** 2, lambda a: a[2] - a[1]]\nassert forward(L, 2) == [2, 3, 9, 6] and forward(L, 2, {2: 0}) == [2, 3, 0, -3]` },
          { name: "patch", code: `L = [lambda a: a[0] + 1, lambda a: a[1] ** 2, lambda a: a[2] - a[1]]\nm = lambda acts: acts[-1]\nassert abs(patch_effect(L, 2, 0, 1, m) - 1) < 1e-12 and abs(patch_effect(L, 2, 0, 2, m) - 4 / 3) < 1e-12\nassert abs(noising_effect(L, 2, 0, 2, m) - 4 / 3) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>logit_diff(logits, a, b)</C>; <C>normalised_recovery(m, m_clean, m_corrupt)</C>; and{" "}
          <C>attribution_patch(grad, clean_act, corrupt_act)</C>, the dot product of the gradient with the clean-minus-corrupted
          difference.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def logit_diff(logits, a, b):
    return 0.0

def normalised_recovery(m, m_clean, m_corrupt):
    return 0.0

def attribution_patch(grad, clean_act, corrupt_act):
    return 0.0
`,
        solution: METRICS,
        tests: [
          { name: "metrics", code: `assert abs(logit_diff([0.1, 2.0, -1.0], 1, 2) - 3.0) < 1e-12\nassert abs(normalised_recovery(0.0, 2.0, -2.0) - 0.5) < 1e-12` },
          { name: "attribution", code: `assert attribution_patch([1.0, 1.0], [0.5, 0.5], [0.5, 0.5]) == 0\nassert abs(attribution_patch([2.0, -1.0, 0.5], [1.0, 1.0, 3.0], [0.0, 2.0, 1.0]) - 4.0) < 1e-12` },
        ],
      },
    },
    {
      key: "additive",
      rung: "stretch",
      prompt: (
        <p>
          The metric is <M>{"(c_1 + c_2)^2"}</M>. On the clean input the components are (1, 2); on the corrupted input both are 0. Patching
          each component separately from clean into corrupted, what is the sum of the two normalised recoveries? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.556, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Patching finds which components matter, but each component often seems to do several unrelated things. The next chapter explains
        why: networks pack more features than they have dimensions.
      </p>
    </>
  ),
};
