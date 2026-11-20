import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DpoVsIpoViz } from "@/components/viz/DpoVsIpoViz";
import type { LessonContent } from "@/lib/types";

const VARIANTS = `import math

def ipo_loss(h, tau):
    return (h - 1 / (2 * tau)) ** 2

def kto_loss(r, desirable, z0, beta, lam_d, lam_u):
    if desirable:
        return lam_d * (1 - 1 / (1 + math.exp(-beta * (r - z0))))
    return lam_u * (1 - 1 / (1 + math.exp(-beta * (z0 - r))))

def simpo_loss(lp_w, n_w, lp_l, n_l, beta, gamma):
    margin = beta * lp_w / n_w - beta * lp_l / n_l - gamma
    return math.log(1 + math.exp(-margin))`;

const MORE = `import math

def cdpo_loss(margin, eps):
    nll = lambda m: math.log(1 + math.exp(-m))
    return (1 - eps) * nll(margin) + eps * nll(-margin)

def orpo_log_odds(avg_logp):
    return avg_logp - math.log1p(-math.exp(avg_logp))

def orpo_term(avg_w, avg_l):
    d = orpo_log_odds(avg_w) - orpo_log_odds(avg_l)
    return math.log(1 + math.exp(-d))`;

export const lesson: LessonContent = {
  id: "l9.5.2",
  minutes: 50,
  links: {
    requires: ["l9.5.1"],
    revisits: ["l9.3.1", "l9.3.2"],
    foreshadows: ["l9.5.3", "l9.7.4"],
  },

  puzzle: (
    <>
      <p>
        Within a year of DPO there were dozens of rivals: IPO, KTO, SimPO, ORPO, cDPO and more, each claiming to fix
        something. Some drop the reference model, some work from thumbs up and thumbs down without pairs, some fold in
        supervised fine-tuning. Faced with a new preference dataset, which should be used, and what problem does each actually
        solve?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each variant changes one assumption of DPO. IPO drops the Bradley–Terry link and asks for a fixed margin, so that
        unanimous preferences do not push the policy without limit. KTO drops the pairs, scoring each response against a
        reference point the way people judge gains and losses. SimPO drops the reference model and divides by length. ORPO
        merges preference learning into supervised fine-tuning. cDPO admits that some labels are flipped. Careful comparisons
        find the differences between these variants are often smaller than the effect of tuning β and the learning rate well,
        and depend heavily on the data.
      </p>
      <DpoVsIpoViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="DPO with deterministic preferences">
        <p>
          If a pair is always labelled the same way, the DPO loss <M>{"-\\log\\sigma(\\beta h)"}</M>, with h the difference of
          log-ratios, has no minimiser: it decreases strictly towards 0 as <M>{"h \\to \\infty"}</M>, whatever <M>{"\\beta"}</M> is.
        </p>
      </Theorem>
      <Proof>
        <p>
          Its derivative in h is <M>{"-\\beta\\sigma(-\\beta h) < 0"}</M> for every h, and the loss tends to 0 only in the limit. Gradient
          descent therefore keeps pushing <M>{"\\pi_\\theta(y_l)/\\pi_{\\text{ref}}(y_l)"}</M> towards 0, and the policy can move
          arbitrarily far from the reference however large <M>{"\\beta"}</M> is. With a preference probability p &lt; 1 the expected
          loss has its minimum where <M>{"\\sigma(\\beta h) = p"}</M>. Small datasets have many pairs seen once and labelled one way,
          so this is the usual case, held back only by early stopping.
        </p>
      </Proof>

      <Definition title="IPO">
        <p>
          Azar et al. (2023) regress the margin onto a constant:{" "}
          <M>{"\\mathcal{L}_{\\text{IPO}} = (h - \\tfrac{1}{2\\tau})^2"}</M> (<C>ipo_loss</C>). With flipped labels in proportion 1 − p, the
          expected loss is minimised at <M>{"h = (2p - 1)/(2\\tau)"}</M>, finite even when p = 1, and <M>{"\\tau"}</M> plays the role of{" "}
          <M>{"\\beta"}</M>.
        </p>
      </Definition>

      <Definition title="KTO">
        <p>
          Ethayarajh et al. (2024) take each response with a binary label. With implicit reward{" "}
          <M>{"r = \\log(\\pi_\\theta(y)/\\pi_{\\text{ref}}(y))"}</M> and a reference point <M>{"z_0"}</M>, an estimate of the KL between policy and
          reference, the value of a desirable response is <M>{"\\lambda_D\\sigma(\\beta(r - z_0))"}</M> and of an undesirable one{" "}
          <M>{"\\lambda_U\\sigma(\\beta(z_0 - r))"}</M>; the loss is <M>{"\\lambda"}</M> minus the value (<C>kto_loss</C>). The saturating
          sigmoid echoes prospect theory: gains and losses far from the reference point matter less, and the two weights let
          losses count more than gains. KTO suits data such as user feedback, which comes unpaired.
        </p>
      </Definition>

      <Definition title="SimPO">
        <p>
          Meng et al. (2024) drop the reference and use the average log-probability per token as the implicit reward, with a target
          margin <M>{"\\gamma"}</M>:{" "}
          <M>{"-\\log\\sigma\\big(\\tfrac{\\beta}{|y_w|}\\log\\pi_\\theta(y_w) - \\tfrac{\\beta}{|y_l|}\\log\\pi_\\theta(y_l) - \\gamma\\big)"}</M>{" "}
          (<C>simpo_loss</C>). Normalising by length removes DPO&apos;s tendency to favour longer responses, whose summed log-probabilities
          differ more, and saves the memory and compute of the reference model.
        </p>
        <Code>{VARIANTS}</Code>
      </Definition>

      <Remark title="ORPO and noise-robust DPO">
        <p>
          ORPO (Hong et al., 2024) adds to the supervised loss on the chosen response a term{" "}
          <M>{"-\\log\\sigma(\\log\\mathrm{odds}(y_w) - \\log\\mathrm{odds}(y_l))"}</M>, with odds <M>{"p/(1-p)"}</M> of the per-token average
          probability (<C>orpo_log_odds</C>, <C>orpo_term</C>), so one stage replaces SFT followed by DPO. Conservative DPO assumes a
          fraction <M>{"\\varepsilon"}</M> of labels are flipped and mixes the loss of the pair in both orders (<C>cdpo_loss</C>); like IPO,
          its expected minimum is finite, at <M>{"\\sigma(\\beta h) = 1 - \\varepsilon"}</M>.
        </p>
        <Code>{MORE}</Code>
      </Remark>

      <Example title="length and SimPO">
        <p>
          A chosen response of 50 tokens has log-probability −40 and a rejected one of 10 tokens −10. A reward built from summed
          log-probabilities, as DPO&apos;s is apart from the reference terms, ranks the pair wrongly, −40 against −10, so training pushes
          hard on the long response. SimPO compares the averages, −0.8 against −1.0, and already ranks the pair correctly.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "ipo",
      rung: "check",
      prompt: <p>With <M>{"\\tau = 0.25"}</M>, a pair has margin h = 1.3. What is its IPO loss? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.49, tolerance: 0.001 },
    },
    {
      key: "simpo",
      rung: "check",
      prompt: (
        <p>
          The chosen response has log-probability −30 over 20 tokens; the rejected −36 over 40 tokens. With <M>{"\\beta = 2"}</M> and{" "}
          <M>{"\\gamma = 0.5"}</M>, what is the SimPO loss? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.868, tolerance: 0.001 },
    },
    {
      key: "pick",
      rung: "apply",
      prompt: (
        <p>
          A product logs thumbs-up and thumbs-down on single responses, with no pairs, and about four times as many thumbs-up.
          Which method fits most directly?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "KTO, which learns from unpaired desirable and undesirable examples and can reweight the two classes",
          "DPO, after pairing every thumbs-up with a random thumbs-down from another prompt",
          "IPO, because the labels are deterministic",
          "SimPO, because it needs no reference model",
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

def ipo_loss(h, tau):
    return (h - 1 / (2 * tau)) ** 2

def kto_loss(r, desirable, z0, beta, lam_d, lam_u):
    if desirable:
        return lam_d * (1 - 1 / (1 + math.exp(-beta * (r - z0))))
    return lam_u * (1 - 1 / (1 + math.exp(-beta * (z0 - r))))

def simpo_loss(lp_w, n_w, lp_l, n_l, beta, gamma):
    margin = beta * lp_w / n_w - beta * lp_l / n_l - gamma
    return math.log(1 + math.exp(-margin))

print(ipo_loss(5.0, 0.1), ipo_loss(0.0, 0.5), round(simpo_loss(-10.0, 10, -20.0, 10, 1.0, 0.0), 3))
print(round(kto_loss(0.5, True, 0.5, 1.0, 1.0, 1.0), 3), round(kto_loss(0.5, False, 0.5, 1.0, 1.0, 2.0), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0 1.0 0.313\n0.5 1.0",
          "0.0 1.0 1.313\n0.5 1.0",
          "0.0 0.0 0.313\n0.5 1.0",
          "0.0 1.0 0.313\n0.5 0.5",
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

def cdpo_loss(margin, eps):
    nll = lambda m: math.log(1 + math.exp(-m))
    return (1 - eps) * nll(margin) + eps * nll(-margin)

def orpo_log_odds(avg_logp):
    return avg_logp - math.log1p(-math.exp(avg_logp))

def orpo_term(avg_w, avg_l):
    d = orpo_log_odds(avg_w) - orpo_log_odds(avg_l)
    return math.log(1 + math.exp(-d))

print(round(cdpo_loss(0.0, 0.1), 3), round(cdpo_loss(2.0, 0.0), 3), round(cdpo_loss(2.0, 0.5), 3))
print(orpo_log_odds(math.log(0.5)), round(orpo_term(math.log(0.5), math.log(0.2)), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.693 0.127 1.127\n0.0 0.223",
          "0.693 0.127 0.693\n0.0 0.223",
          "0.624 0.127 1.127\n0.0 0.223",
          "0.693 0.127 1.127\n-0.693 0.223",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ipo_loss(h, tau)</C>, <C>kto_loss(r, desirable, z0, beta, lam_d, lam_u)</C> and{" "}
          <C>simpo_loss(lp_w, n_w, lp_l, n_l, beta, gamma)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def ipo_loss(h, tau):
    return math.log(1 + math.exp(-h / tau))

def kto_loss(r, desirable, z0, beta, lam_d, lam_u):
    return 1 / (1 + math.exp(-beta * (r - z0)))

def simpo_loss(lp_w, n_w, lp_l, n_l, beta, gamma):
    return math.log(1 + math.exp(-beta * (lp_w - lp_l)))
`,
        solution: VARIANTS,
        tests: [
          { name: "ipo", code: `assert abs(ipo_loss(1.0, 0.25) - 1.0) < 1e-12 and abs(simpo_loss(-8.0, 4, -9.0, 3, 1.0, 1.0) - math.log(2)) < 1e-12` },
          { name: "kto", code: `assert abs(kto_loss(1.0, True, 0.0, 2.0, 1.0, 1.5) - (1 - 1 / (1 + math.exp(-2)))) < 1e-12 and abs(kto_loss(1.0, False, 0.0, 2.0, 1.0, 1.5) - 1.5 / (1 + math.exp(-2))) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cdpo_loss(margin, eps)</C>, <C>orpo_log_odds(avg_logp)</C>, the log-odds of probability <M>{"e^{\\text{avg\\_logp}}"}</M>, and{" "}
          <C>orpo_term(avg_w, avg_l)</C>, the negative log-sigmoid of the difference in log-odds.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def cdpo_loss(margin, eps):
    return math.log(1 + math.exp(-margin))

def orpo_log_odds(avg_logp):
    return avg_logp

def orpo_term(avg_w, avg_l):
    return avg_l - avg_w
`,
        solution: MORE,
        tests: [
          { name: "cdpo", code: `assert abs(cdpo_loss(1.0, 0.25) - (0.75 * math.log(1 + math.exp(-1)) + 0.25 * math.log(1 + math.e))) < 1e-12` },
          { name: "orpo", code: `assert abs(orpo_log_odds(math.log(0.8)) - math.log(4)) < 1e-12 and abs(orpo_term(math.log(0.8), math.log(0.8))  - math.log(2)) < 1e-12` },
        ],
      },
    },
    {
      key: "opt",
      rung: "stretch",
      prompt: (
        <p>
          A pair&apos;s first response is preferred by 70% of annotators. With <M>{"\\beta = 0.2"}</M>, at what margin h is the expected DPO loss
          minimised? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 4.236, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        All these methods learn from a fixed dataset of responses, usually written by other models. The next lesson asks how
        much is lost by never sampling from the policy being trained.
      </p>
    </>
  ),
};
