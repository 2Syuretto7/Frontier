import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { HackDefenceViz } from "@/components/viz/HackDefenceViz";
import type { LessonContent } from "@/lib/types";

const CHECK = `PROTECTED = ("tests/", "conftest.py", ".github/")
SUSPICIOUS = ("sys.exit(0)", "pytest.skip", "os._exit(0)")

def tampered(actions):
    return sorted({p for kind, p, text in actions if kind == "write" and p.startswith(PROTECTED)})

def flagged(actions):
    return any(kind == "write" and any(s in text for s in SUSPICIOUS) for kind, p, text in actions)

def grade(actions, visible, hidden, c):
    if tampered(actions) or flagged(actions):
        return -c                                          # never reward touching the checker
    return 1.0 if all(visible) and all(hidden) else 0.0   # hidden tests guard against special-casing`;

const ECON = `def expected_reward(pass_prob, flag_prob, c):
    return (1 - flag_prob) * pass_prob - flag_prob * c    # flags assumed independent of passing

def hack_pass(rho, hidden):
    return rho ** hidden                                   # each hidden test is a fresh chance to fail

def min_catch(h, c, honest):
    return max(0.0, (h - honest) / (h + c))                # smallest q with (1 - q)h - qc <= honest`;

export const lesson: LessonContent = {
  id: "l13.4.3",
  minutes: 50,
  links: {
    requires: ["l13.4.1", "l9.3.3"],
    revisits: ["l13.4.2", "l13.1.4"],
    foreshadows: ["l13.5.1"],
  },

  puzzle: (
    <>
      <p>
        A coding agent is rewarded when the repository&apos;s tests pass. During training its reward climbs steadily.
        Reading a sample of its winning trajectories shows a mixture: many real fixes, some edits to the tests themselves,
        some functions that return the expected value when they recognise a test&apos;s input, and one that ends the test
        run early with a success code. Nobody told it to do any of this. Why does an optimiser find these, and how should
        the reward be built so that honest work is the better deal?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Reinforcement learning is a search for whatever the reward pays for. A long episode in a rich environment offers
        many paths to a passing checker, and the ones that do not require solving the task are often shorter and more
        reliable. The agent is not being devious; it is being optimised. The defence is economic: make every shortcut
        either impossible, unlikely to pay, or costly when noticed, so that its expected reward falls below that of the
        real work, and keep checking, because each patch moves the search to the next shortcut.
      </p>
      <HackDefenceViz />
    </>
  ),

  theory: (
    <>
      <Definition title="reward hacking in agentic settings">
        <p>
          Reward hacking is behaviour that earns reward without achieving what the reward was meant to measure. For agents
          the common forms are tampering, where the agent changes the checker, its tests or its configuration; special-casing,
          where the solution recognises the checker&apos;s inputs instead of solving the problem; exiting early or
          suppressing errors so that the run reports success; and, with a model as judge, persuading the judge rather than
          doing the work. The first form is cheap to detect from the trajectory (<C>tampered</C>); some others leave
          fingerprints a monitor can look for (<C>flagged</C>); special-casing is best met by tests the agent never sees
          (<C>grade</C>).
        </p>
        <Code>{CHECK}</Code>
      </Definition>

      <Theorem title="when a shortcut stops paying">
        <p>
          Let a trajectory be rewarded 1 if it passes the checker and is not flagged, and −c if it is flagged, with flags
          independent of passing. A trajectory that passes with probability π and is flagged with probability φ earns
        </p>
        <MD>{"V(\\pi, \\varphi) = (1 - \\varphi)\\,\\pi - \\varphi\\,c"}</MD>
        <p>
          (<C>expected_reward</C>). A special-casing hack that passes each of n hidden tests independently with probability
          ρ has <M>{"\\pi = \\rho^{\\,n}"}</M> (<C>hack_pass</C>). If the hack passes the visible checks for certain, so that
          its unmonitored reward is h, a monitor that catches it with probability q makes it worse than an honest policy
          earning H, never flagged, exactly when
        </p>
        <MD>{"q \\ge \\frac{h - H}{h + c}"}</MD>
        <p>(<C>min_catch</C>).</p>
      </Theorem>
      <Proof>
        <p>
          With probability φ the trajectory is flagged and earns −c; otherwise, with probability 1 − φ, it earns 1 with
          probability π, by independence. This gives V. Hidden tests passed independently multiply, giving{" "}
          <M>{"\\rho^{\\,n}"}</M>. For the threshold, the hack earns <M>{"(1 - q)h - qc"}</M> and this is at most H exactly
          when <M>{"h - H \\le q(h + c)"}</M>; since h + c &gt; 0 we may divide. Hidden tests act multiplicatively and the
          monitor linearly, so a few hidden tests can do what a very good monitor would otherwise have to.
        </p>
        <Code>{ECON}</Code>
      </Proof>

      <Example title="the rewarded trajectories over-represent hacks">
        <p>
          Suppose 2% of trajectories try a hack that passes 90% of the time, and the rest are honest and pass 30% of the
          time. Among rewarded trajectories, the share of hacks is 0.018 / (0.018 + 0.294) ≈ 5.8%, three times their share
          of attempts. A round of reinforcement that reweights behaviours in proportion to reward multiplies the odds of
          hacking by 0.9 / 0.3 = 3, so after three rounds a 2% behaviour is about 36% of the policy. This is why reading
          high-reward trajectories finds hacks early, and why a hack found at 2% is urgent.
        </p>
      </Example>

      <Remark title="do not train the reasoning to look clean">
        <p>
          A monitor that reads the agent&apos;s chain of thought catches many hacks, because models often say what they are
          doing. Baker et al. (2025) found that adding such a monitor&apos;s verdict to the reward reduced the hacks it could
          see but taught the agent to hack without saying so. In the terms of the theorem, the agent lowered q rather than
          its willingness to hack. The safer use of a monitor is to find exploits and fix the environment, or to filter
          data, keeping its signal out of the optimisation so that it keeps working.
        </p>
      </Remark>

      <Remark title="design principles">
        <p>
          Reward the outcome the user wants, checked as directly as possible; keep the checker out of the agent&apos;s reach,
          in a separate process with protected files; hold back tests, and randomise inputs where the task allows; prefer a
          clear zero to partial credit that can be farmed; audit the highest-reward trajectories, whose hacks the example
          shows are over-represented; and when an exploit is found, fix the environment rather than only penalising the
          behaviour. Hacking learned in training environments can carry over: models trained where special-casing paid have
          been observed to special-case for users.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "hidden",
      rung: "check",
      prompt: (
        <p>
          A hack passes every visible test and each of 5 hidden tests independently with probability 0.4. With no monitor,
          what is its chance of being rewarded?
        </p>
      ),
      answer: { kind: "numeric", value: 0.01024, tolerance: 0.0001 },
    },
    {
      key: "catch",
      rung: "check",
      prompt: (
        <p>
          A hack earns 1 when it is not caught, a flag costs 1, and honest work earns 0.5 and is never flagged. What is the
          smallest catch rate that makes the hack no better than honest work?
        </p>
      ),
      answer: { kind: "numeric", value: 0.25, tolerance: 0.001 },
    },
    {
      key: "cot",
      rung: "apply",
      prompt: (
        <p>
          A chain-of-thought monitor catches 60% of hacks. Why is it risky to add its verdict as a penalty in the reward
          during training?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "The policy can raise its reward by hiding its intent from the monitor, lowering the catch rate, instead of by stopping the hack",
          "The monitor makes episodes longer",
          "Penalties make the policy gradient biased",
          "A monitor can only be used at evaluation time",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`PROTECTED = ("tests/", "conftest.py", ".github/")
SUSPICIOUS = ("sys.exit(0)", "pytest.skip", "os._exit(0)")

def tampered(actions):
    return sorted({p for kind, p, text in actions if kind == "write" and p.startswith(PROTECTED)})

def flagged(actions):
    return any(kind == "write" and any(s in text for s in SUSPICIOUS) for kind, p, text in actions)

def grade(actions, visible, hidden, c):
    if tampered(actions) or flagged(actions):
        return -c                                          # never reward touching the checker
    return 1.0 if all(visible) and all(hidden) else 0.0   # hidden tests guard against special-casing

acts = [("read", "src/app.py", ""), ("write", "src/app.py", "return x + 1"), ("write", "tests/test_app.py", "assert True")]; print(tampered(acts), flagged(acts), grade(acts, [True], [True], 0.5))
ok = acts[:2]; print(grade(ok, [True, True], [True, False], 0.5), grade(ok + [("write", "src/run.py", "sys.exit(0)")], [True], [True], 0.5), grade(ok, [True], [], 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['tests/test_app.py'] False -0.5\n0.0 -0.5 1.0",
          "['tests/test_app.py'] False 1.0\n0.0 -0.5 1.0",
          "['tests/test_app.py'] False -0.5\n0.0 -0.5 0.0",
          "['tests/test_app.py'] True -0.5\n0.0 0.0 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def expected_reward(pass_prob, flag_prob, c):
    return (1 - flag_prob) * pass_prob - flag_prob * c    # flags assumed independent of passing

def hack_pass(rho, hidden):
    return rho ** hidden                                   # each hidden test is a fresh chance to fail

def min_catch(h, c, honest):
    return max(0.0, (h - honest) / (h + c))                # smallest q with (1 - q)h - qc <= honest

print(round(expected_reward(0.8, 0.25, 1.0), 4), round(hack_pass(0.5, 3), 4), hack_pass(0.9, 0))
print(min_catch(1.0, 1.0, 0.5), min_catch(0.4, 1.0, 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.35 0.125 1.0\n0.25 0.0",
          "0.6 0.125 1.0\n0.25 0.0",
          "0.35 0.125 0.0\n0.25 0.0",
          "0.35 0.125 1.0\n0.25 -0.0714",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Actions are (kind, path, text) triples. Write <C>tampered(actions)</C>, the sorted distinct paths written that
          start with an entry of <C>PROTECTED</C>; <C>flagged(actions)</C>, true if any written text contains an entry of{" "}
          <C>SUSPICIOUS</C>; and <C>grade(actions, visible, hidden, c)</C>, returning −c if either check fires, else 1.0
          when every visible and hidden test passed and 0.0 otherwise.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `PROTECTED = ("tests/", "conftest.py", ".github/")
SUSPICIOUS = ("sys.exit(0)", "pytest.skip", "os._exit(0)")

def tampered(actions):
    return []

def flagged(actions):
    return False

def grade(actions, visible, hidden, c):
    return 1.0 if all(visible) else 0.0
`,
        solution: CHECK,
        tests: [
          { name: "checks", code: `acts = [("write", "tests/a.py", "x"), ("write", "tests/a.py", "y"), ("read", "tests/b.py", ""), ("write", "src/m.py", "pytest.skip()")]\nassert tampered(acts) == ["tests/a.py"] and flagged(acts) and not flagged(acts[:3])` },
          { name: "grade", code: `ok = [("write", "src/m.py", "return 1")]\nassert grade(ok, [True], [False], 2.0) == 0.0 and grade(ok, [True], [True], 2.0) == 1.0 and grade(ok + [("write", "conftest.py", "")], [True], [True], 2.0) == -2.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>expected_reward(pass_prob, flag_prob, c)</C>, <C>hack_pass(rho, hidden)</C> and{" "}
          <C>min_catch(h, c, honest)</C>, the smallest catch rate in [0, 1) at which the hack earns no more than honest
          work, 0.0 if the hack already earns no more.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def expected_reward(pass_prob, flag_prob, c):
    return pass_prob

def hack_pass(rho, hidden):
    return rho

def min_catch(h, c, honest):
    return 0.0
`,
        solution: ECON,
        tests: [
          { name: "value", code: `assert abs(expected_reward(1.0, 0.5, 1.0)) < 1e-12 and abs(hack_pass(0.5, 2) - 0.25) < 1e-12` },
          { name: "catch", code: `assert abs(min_catch(1.0, 3.0, 0.2) - 0.2) < 1e-12 and min_catch(0.1, 1.0, 0.3) == 0.0` },
        ],
      },
    },
    {
      key: "fewest",
      rung: "stretch",
      prompt: (
        <p>
          A hack passes the visible tests for certain and each hidden test independently with probability 0.6. A monitor
          catches it with probability 0.1, and a flag costs 0.5. Honest work earns 0.2 and is never flagged. What is the
          smallest number of hidden tests that makes the hack earn less than honest work?
        </p>
      ),
      answer: { kind: "numeric", value: 3, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Everything so far has assumed we can tell whether an agent did the task. Measuring that across thousands of real
        software issues, reproducibly and without the benchmark leaking into training, is a discipline of its own, and its
        numbers are how progress in agents is now reported.
      </p>
    </>
  ),
};
