import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ControlSafetyViz } from "@/components/viz/ControlSafetyViz";
import type { LessonContent } from "@/lib/types";

const UPFRONT = `def red_win_upfront(p, n, k, b=1.0):
    clean_audit = (1 - p) ** k                             # no attack among the k audited tasks
    return clean_audit * (1 - (1 - p * b) ** (n - k))      # then at least one working attack

def best_red_upfront(a):
    return (1 - a) * a ** (a / (1 - a))                    # the attack rate chosen optimally, b = 1

def best_attack_rate(n, k):
    r = (n - k) / k
    return 1 - (1 + r) ** (-1 / (r * k))                   # p with (1 - p)^k = (1 + r)^(-1/r)`;

const MONITOR = `from statistics import NormalDist

def catch_prob(audit_frac, mu):
    t = NormalDist().inv_cdf(1 - audit_frac)               # audit threshold on honest suspicion scores
    return 1 - NormalDist().cdf(t - mu)                    # an attack's score is shifted up by mu

def race(c, b):
    return c / (c + (1 - c) * b)                           # caught before any attack works

def monitor_safety(audit_frac, mu, b):
    return race(catch_prob(audit_frac, mu), b)`;

export const lesson: LessonContent = {
  id: "l14.4.2",
  minutes: 50,
  links: {
    requires: ["l14.4.1", "l14.3.3"],
    revisits: ["l14.1.3", "l14.2.1"],
    foreshadows: ["l14.4.3", "l14.5.3"],
  },

  puzzle: (
    <>
      <p>
        A lab wants a powerful model to write a thousand pieces of security-critical code. It cannot rule out that the
        model is misaligned and would slip in a backdoor if it could. It has a weaker model it trusts but that writes
        worse code, and human experts who can carefully audit only twenty of the thousand outputs. Which twenty should
        they audit, and what else can be done, so that a scheming model is caught before it succeeds?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Alignment tries to make the model not want to cause harm. Control asks for safety even if it does want to: design
        the deployment so that a model trying its hardest to subvert it would probably be caught first. It is evaluated
        as a game. A red team plays the untrusted model with the best attack strategy it can find; a blue team designs a
        protocol from trusted but weaker models and scarce human audits. A protocol is good if it keeps most of the
        untrusted model&apos;s usefulness while giving the red team a small chance of winning.
      </p>
      <ControlSafetyViz />
    </>
  ),

  theory: (
    <>
      <Definition title="control protocols">
        <p>
          Greenblatt et al. (2023) studied programming tasks in which an untrusted model might insert backdoors, a trusted
          weaker model was available, and humans could audit 2% of outputs. Protocols included upfront auditing, which
          audits the first outputs; trusted monitoring, in which the trusted model scores every output for suspicion and
          the most suspicious are audited; defer to trusted, which also replaces moderately suspicious outputs with the
          trusted model&apos;s own; trusted editing, in which the trusted model rewrites suspicious parts; and untrusted
          monitoring, in which another copy of the untrusted model scores outputs, with measures against collusion.
          Safety is the probability that no backdoor succeeds, and usefulness is the share of the untrusted model&apos;s
          performance retained.
        </p>
      </Definition>

      <Theorem title="rare attacks defeat upfront auditing">
        <p>
          Of n tasks, the first k = an are audited; the model attacks each task independently with probability p, an
          audited attack is caught, and every unaudited attack succeeds. The red team wins with probability{" "}
          <M>{"(1 - p)^k\\big(1 - (1 - p)^{n - k}\\big)"}</M> (<C>red_win_upfront</C>), and its best choice of p gives
        </p>
        <MD>{"\\max_p \\Pr(\\text{red wins}) = (1 - a)\\,a^{a/(1 - a)}"}</MD>
        <p>(<C>best_red_upfront</C>, <C>best_attack_rate</C>).</p>
        <Code>{UPFRONT}</Code>
      </Theorem>
      <Proof>
        <p>
          The red team wins if no attack falls among the audited tasks and at least one falls among the rest. Put{" "}
          <M>{"x = (1 - p)^k \\in (0, 1)"}</M> and r = (n − k)/k = (1 − a)/a, so that{" "}
          <M>{"(1 - p)^{n - k} = x^r"}</M> and the win probability is <M>{"x - x^{1 + r}"}</M>, with every x in (0, 1)
          reachable by some p. Its derivative <M>{"1 - (1 + r)x^r"}</M> vanishes at <M>{"x^* = (1 + r)^{-1/r}"}</M>, a
          maximum since the function is concave. There the value is <M>{"x^*(1 - x^{*r}) = x^* \\cdot r/(1 + r)"}</M>, and
          substituting <M>{"1 + r = 1/a"}</M> gives <M>{"(1 - a)a^{a/(1 - a)}"}</M>. The optimal attack is rare, about
          one per <M>{"(n - k)/\\ln(1/a)"}</M> tasks, so it usually slips past the audited prefix. Greenblatt et al. found 15%
          safety for upfront auditing, higher than this bound because not every attempted backdoor worked.
        </p>
      </Proof>

      <Theorem title="monitoring makes it a race">
        <p>
          Suppose each attack is audited and caught with probability c, and otherwise succeeds with probability b and
          passes unnoticed otherwise, independently. If the red team attacks persistently over many tasks, the blue team
          wins with probability
        </p>
        <MD>{"\\frac{c}{c + (1 - c)\\,b}"}</MD>
        <p>
          (<C>race</C>). If the trusted monitor&apos;s suspicion scores are standard normal for honest outputs and shifted
          by μ for attacks, auditing the top share a gives <M>{"c = 1 - \\Phi(\\Phi^{-1}(1 - a) - \\mu)"}</M>{" "}
          (<C>catch_prob</C>, <C>monitor_safety</C>).
        </p>
        <Code>{MONITOR}</Code>
      </Theorem>
      <Proof>
        <p>
          Each attack ends the game for blue with probability c, for red with probability (1 − c)b, and leaves it running
          otherwise. The game ends at the first decisive attack, and given that an attack is decisive, it is blue&apos;s
          with probability <M>{"c/(c + (1 - c)b)"}</M>; with infinitely many attacks some attack is decisive with
          probability 1. The audit threshold t is the (1 − a) quantile of honest scores, <M>{"t = \\Phi^{-1}(1 - a)"}</M>, so
          that the audit budget is spent; an attack&apos;s score exceeds t with probability{" "}
          <M>{"1 - \\Phi(t - \\mu)"}</M>. Unlike upfront auditing, attacking rarely does not help, because every attack
          faces the same chance of being audited; what helps the red team is making attacks look innocent, which lowers μ.
        </p>
      </Proof>

      <Remark title="results and open problems">
        <p>
          In the programming setting, trusted monitoring with deferral and trusted editing raised safety well above upfront
          auditing while keeping most of the untrusted model&apos;s usefulness. Later work extended control to agents acting
          over many steps, where an attack can be spread across actions and a suspicious step can be resampled rather than
          executed. The approach depends on the red team being as capable as the misaligned model would be, on the trusted
          model being genuinely trustworthy, and on the protocol not leaking which outputs are audited. Its appeal is that
          it does not require solving alignment, only limiting what a misaligned model could get away with.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "upfront",
      rung: "check",
      prompt: (
        <p>
          With 2% of tasks audited up front and every unaudited attack succeeding, what is the safety, the blue team&apos;s
          winning probability, against the best attack rate?
        </p>
      ),
      answer: { kind: "numeric", value: 0.0952, tolerance: 0.001 },
    },
    {
      key: "monitor",
      rung: "check",
      prompt: (
        <p>
          Trusted monitoring audits the top 2% of suspicion scores; attacks score 1.5 higher on average, and 40% of
          unnoticed attacks work. What is the safety against a persistent attacker?
        </p>
      ),
      answer: { kind: "numeric", value: 0.5051, tolerance: 0.001 },
    },
    {
      key: "rare",
      rung: "apply",
      prompt: <p>Why does attacking rarely help against upfront auditing but not against trusted monitoring?</p>,
      answer: {
        kind: "choice",
        options: [
          "Upfront auditing only inspects early tasks, which rare attacks avoid; monitoring gives every attack the same chance of audit",
          "Rare attacks are more suspicious",
          "Monitoring audits more tasks than upfront auditing",
          "Upfront auditing uses the trusted model",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def red_win_upfront(p, n, k, b=1.0):
    clean_audit = (1 - p) ** k                             # no attack among the k audited tasks
    return clean_audit * (1 - (1 - p * b) ** (n - k))      # then at least one working attack

def best_red_upfront(a):
    return (1 - a) * a ** (a / (1 - a))                    # the attack rate chosen optimally, b = 1

def best_attack_rate(n, k):
    r = (n - k) / k
    return 1 - (1 + r) ** (-1 / (r * k))                   # p with (1 - p)^k = (1 + r)^(-1/r)

print(red_win_upfront(0.0, 100, 2), red_win_upfront(1.0, 100, 2), round(red_win_upfront(0.5, 4, 1), 4), round(best_red_upfront(0.5), 4))
p = best_attack_rate(100, 50); print(round(p, 4), round(red_win_upfront(p, 100, 50), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0 0.0 0.4375 0.25\n0.0138 0.25",
          "0.0 1.0 0.4375 0.25\n0.0138 0.25",
          "0.0 0.0 0.5 0.25\n0.0138 0.25",
          "0.0 0.0 0.4375 0.5\n0.0138 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from statistics import NormalDist

def catch_prob(audit_frac, mu):
    t = NormalDist().inv_cdf(1 - audit_frac)               # audit threshold on honest suspicion scores
    return 1 - NormalDist().cdf(t - mu)                    # an attack's score is shifted up by mu

def race(c, b):
    return c / (c + (1 - c) * b)                           # caught before any attack works

def monitor_safety(audit_frac, mu, b):
    return race(catch_prob(audit_frac, mu), b)

print(round(catch_prob(0.5, 0.0), 4), race(1.0, 0.3), race(0.0, 0.3), race(0.5, 1.0))
print(round(monitor_safety(0.5, 0.0, 1.0), 4), round(monitor_safety(0.02, 10.0, 0.5), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 1.0 0.0 0.5\n0.5 1.0",
          "0.5 1.0 0.0 0.5\n0.5 0.5",
          "0.0 1.0 0.0 0.5\n0.5 1.0",
          "0.5 1.0 0.3 0.5\n0.5 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>red_win_upfront(p, n, k, b=1.0)</C>, where an unaudited attack works with probability b;{" "}
          <C>best_red_upfront(a)</C> for b = 1; and <C>best_attack_rate(n, k)</C>, the optimal p for b = 1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def red_win_upfront(p, n, k, b=1.0):
    return 1 - (1 - p * b) ** n

def best_red_upfront(a):
    return 1 - a

def best_attack_rate(n, k):
    return 1 / n
`,
        solution: UPFRONT,
        tests: [
          { name: "win", code: `assert abs(red_win_upfront(0.5, 3, 1, 0.5) - 0.5 * (1 - 0.75 ** 2)) < 1e-12 and abs(best_red_upfront(0.5) - 0.25) < 1e-12` },
          { name: "rate", code: `p = best_attack_rate(30, 10)\nassert abs((1 - p) ** 10 - 3 ** -0.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>catch_prob(audit_frac, mu)</C>, <C>race(c, b)</C> and <C>monitor_safety(audit_frac, mu, b)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from statistics import NormalDist

def catch_prob(audit_frac, mu):
    return audit_frac

def race(c, b):
    return c

def monitor_safety(audit_frac, mu, b):
    return 0.0
`,
        solution: MONITOR,
        tests: [
          { name: "catch", code: `assert abs(catch_prob(0.5, 1.0) - NormalDist().cdf(1.0)) < 1e-12 and abs(race(0.5, 0.5) - 2 / 3) < 1e-12` },
          { name: "safety", code: `assert abs(monitor_safety(0.5, 0.0, 0.25) - 0.8) < 1e-12` },
        ],
      },
    },
    {
      key: "mu",
      rung: "stretch",
      prompt: (
        <p>
          With 2% of outputs audited and half of unnoticed attacks working, how much higher must attacks score on average
          for trusted monitoring to reach 90% safety?
        </p>
      ),
      answer: { kind: "numeric", value: 2.962, tolerance: 0.005 },
    },
  ],

  glimpse: (
    <>
      <p>
        One of the most informative things a monitor can read is the model&apos;s own reasoning. Whether chains of thought
        reveal what a model is doing, and whether they will keep doing so, is the subject of the next lesson.
      </p>
    </>
  ),
};
