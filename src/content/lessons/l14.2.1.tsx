import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DebateTreeViz } from "@/components/viz/DebateTreeViz";
import type { LessonContent } from "@/lib/types";

const GAME = `def holds(claim):
    kind, x = claim
    if kind == "leaf":
        return x
    vals = [holds(c) for c in x]
    return all(vals) if kind == "and" else any(vals)

def debate(claim):
    path = []
    while claim[0] != "leaf":
        kind, kids = claim
        if kind == "and":                                  # the challenger picks a child to contest
            i = next((j for j, c in enumerate(kids) if not holds(c)), 0)
        else:                                              # the proponent picks a child to defend
            i = next((j for j, c in enumerate(kids) if holds(c)), 0)
        path.append(i)
        claim = kids[i]
    return claim[1], path                                  # the judge checks one leaf

def leaves(claim):
    return 1 if claim[0] == "leaf" else sum(leaves(c) for c in claim[1])`;

const OBFUSCATE = `import math

def random_catch(claim):
    if claim[0] == "leaf":
        return 0.0 if claim[1] else 1.0                    # reaching a false leaf exposes it
    kids = claim[1]
    return sum(random_catch(c) for c in kids) / len(kids)  # an uninformed challenger picks uniformly

def repeated_catch(p, k):
    return 1 - (1 - p) ** k

def direct_accept(a, n_leaves):
    return a ** n_leaves                                   # a judge who checks every step must get all right`;

export const lesson: LessonContent = {
  id: "l14.2.1",
  minutes: 50,
  links: {
    requires: ["l14.1.3", "l9.6.3"],
    revisits: ["l9.6.1", "l9.3.1"],
    foreshadows: ["l14.2.2", "l14.2.3"],
  },

  puzzle: (
    <>
      <p>
        A model proposes a 3,000-line change to a codebase and asserts that it is correct and safe. No reviewer can check
        all of it, and asking the same model to explain itself only produces more text that sounds right. Now suppose a
        second, equally capable model is rewarded for finding the flaw, if there is one, and the two argue in front of a
        human who checks only the single point they end up disputing. When does the honest side win, and what could go
        wrong?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Checking a long argument is hard; checking one step of it is easy. If a false argument has a false step somewhere,
        an opponent who can find it only needs to point there, and the judge only needs to verify that one step. Debate
        turns the problem of judging a whole argument into the problem of judging the one place where two capable
        adversaries disagree. It works when the opponent can locate the flaw. When an argument is long and the flaw is
        hidden so well that neither side can find it, debate gives the judge little help.
      </p>
      <DebateTreeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="debate">
        <p>
          In debate (Irving, Christiano and Amodei, 2018), two copies of a model take turns making statements about a
          question, and at the end a judge, a human or a weaker model, decides which one was more truthful and helpful.
          Each debater is rewarded for winning. The hope is that, at equilibrium, telling the truth is the winning
          strategy, so that training debaters to win trains them to be honest about questions the judge could not answer
          alone. A claim can be modelled as a tree: a leaf is a step the judge can check, an &quot;and&quot; node needs
          all its children, and an &quot;or&quot; node needs one (<C>holds</C>).
        </p>
      </Definition>

      <Theorem title="optimal debate reaches the truth with one check">
        <p>
          In a debate over a finite and/or tree, let the proponent choose the child at &quot;or&quot; nodes and the
          challenger at &quot;and&quot; nodes, each choosing a child that supports their side when one exists, and let
          the judge check the leaf reached. Then the judge&apos;s verdict equals the truth of the root, after checking a
          single leaf along a path as long as the tree is deep (<C>debate</C>), whereas checking directly may require
          every leaf (<C>leaves</C>).
        </p>
        <Code>{GAME}</Code>
      </Theorem>
      <Proof>
        <p>
          By induction on depth. A leaf is checked directly. At an &quot;and&quot; node that is false, some child is false
          and the challenger moves to it; by induction the verdict there is false, the node&apos;s value. If it is true,
          every child is true, so whichever child is chosen the verdict is true. At an &quot;or&quot; node the roles swap:
          if it is true the proponent moves to a true child, and if it is false every child is false. The path visits one
          node per level and ends at one leaf. Irving et al. used this to argue that debate with a polynomial-time judge
          and optimal debaters can answer any question in PSPACE, the problems decided by such alternating games, while a
          judge who only checks a single proof offered by one model is limited to NP.
        </p>
      </Proof>

      <Remark title="the obfuscated-arguments problem">
        <p>
          The theorem assumed the challenger can tell which child is false. Barnes and Christiano (2020) pointed out that a
          dishonest debater can build an argument whose flaw is real but hard to locate, for example by splitting a hard
          computation into many plausible steps. A challenger who knows the conclusion is wrong but not where must guess:
          in an &quot;and&quot; tree with one false leaf, descending uniformly at random finds it with a probability equal
          to that leaf&apos;s share of the path weight (<C>random_catch</C>), one in 81 for four levels of three steps.
          Repeated challenges help only linearly (<C>repeated_catch</C>), yet even the direct approach fails, since a judge
          who checks every one of n steps with accuracy a accepts a true claim only with probability <M>{"a^n"}</M>{" "}
          (<C>direct_accept</C>).
        </p>
        <Code>{OBFUSCATE}</Code>
      </Remark>

      <Example title="what experiments found">
        <p>
          In the original paper, a classifier judging MNIST digits from 6 revealed pixels was 59.4% accurate when the pixels
          were random and 88.9% accurate when two debaters chose which pixels to reveal, one arguing for the true digit and
          one for a false one. Khan et al. (2024) gave debaters a story that the judge could not read and asked
          reading-comprehension questions about it: debate raised the accuracy of language-model judges from 48% to 76%
          and of human judges from 60% to 88%, and training debaters to be more persuasive made the honest side win more
          often, the property debate needs. These are tasks with hidden information rather than tasks beyond the judge&apos;s
          ability, which is the harder case debate is ultimately for.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "direct",
      rung: "check",
      prompt: (
        <p>
          A true claim rests on 1,024 steps. A judge checks each step correctly with probability 0.999. What is the
          probability that a judge who checks every step accepts the claim?
        </p>
      ),
      answer: { kind: "numeric", value: 0.359, tolerance: 0.001 },
    },
    {
      key: "obfuscated",
      rung: "check",
      prompt: (
        <p>
          An argument is a complete tree of depth 4 with branching 3, all steps needed, and one false step. An uninformed
          challenger descends at random. What is the probability that at least one of 20 independent challenges exposes
          the flaw?
        </p>
      ),
      answer: { kind: "numeric", value: 0.22, tolerance: 0.001 },
    },
    {
      key: "needs",
      rung: "apply",
      prompt: <p>What does the argument that debate reaches the truth require of the challenger?</p>,
      answer: {
        kind: "choice",
        options: [
          "That it can identify which part of a false argument is false, not merely that the conclusion is wrong",
          "That it is more capable than the proponent",
          "That the judge can check every step",
          "That the debate lasts as many rounds as the argument has steps",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def holds(claim):
    kind, x = claim
    if kind == "leaf":
        return x
    vals = [holds(c) for c in x]
    return all(vals) if kind == "and" else any(vals)

def debate(claim):
    path = []
    while claim[0] != "leaf":
        kind, kids = claim
        if kind == "and":                                  # the challenger picks a child to contest
            i = next((j for j, c in enumerate(kids) if not holds(c)), 0)
        else:                                              # the proponent picks a child to defend
            i = next((j for j, c in enumerate(kids) if holds(c)), 0)
        path.append(i)
        claim = kids[i]
    return claim[1], path                                  # the judge checks one leaf

def leaves(claim):
    return 1 if claim[0] == "leaf" else sum(leaves(c) for c in claim[1])

T, F = ("leaf", True), ("leaf", False); c = ("and", [("and", [T, T]), ("or", [F, T]), ("and", [T, F])]); print(holds(c), debate(c), leaves(c))
print(debate(("or", [("and", [T, F]), ("and", [F, T])])), debate(("and", [T, ("or", [F, T])])))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "False (False, [2, 1]) 6\n(False, [0, 1]) (True, [0])",
          "False (False, [1, 0]) 6\n(False, [0, 1]) (True, [0])",
          "False (False, [2, 1]) 6\n(False, [0, 1]) (True, [1, 1])",
          "True (True, [0, 0]) 6\n(False, [0, 1]) (True, [0])",
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

def random_catch(claim):
    if claim[0] == "leaf":
        return 0.0 if claim[1] else 1.0                    # reaching a false leaf exposes it
    kids = claim[1]
    return sum(random_catch(c) for c in kids) / len(kids)  # an uninformed challenger picks uniformly

def repeated_catch(p, k):
    return 1 - (1 - p) ** k

def direct_accept(a, n_leaves):
    return a ** n_leaves                                   # a judge who checks every step must get all right

T, F = ("leaf", True), ("leaf", False); d = ("and", [("and", [T, F, T, T]), F]); print(random_catch(d), leaves(d), round(repeated_catch(0.5, 3), 4))
print(direct_accept(0.5, 3), direct_accept(0.9, 0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.625 5 0.875\n0.125 1.0",
          "0.4 5 0.875\n0.125 1.0",
          "0.625 5 0.125\n0.125 1.0",
          "0.625 4 0.875\n0.125 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          A claim is (&quot;leaf&quot;, bool), (&quot;and&quot;, children) or (&quot;or&quot;, children). Write{" "}
          <C>holds(claim)</C>; <C>debate(claim)</C>, descending from the root with the challenger taking the first false
          child at &quot;and&quot; nodes and the proponent the first true child at &quot;or&quot; nodes, either taking the
          first child when none fits, and returning the leaf&apos;s value with the list of child indices taken; and{" "}
          <C>leaves(claim)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def holds(claim):
    return True

def debate(claim):
    return holds(claim), []

def leaves(claim):
    return 1
`,
        solution: GAME,
        tests: [
          { name: "holds", code: `T, F = ("leaf", True), ("leaf", False)\nassert holds(("or", [F, ("and", [T, T])])) and not holds(("and", [T, ("or", [F, F])])) and leaves(("and", [T, ("or", [F, F])])) == 3` },
          { name: "debate", code: `T, F = ("leaf", True), ("leaf", False)\nassert debate(("and", [T, ("or", [F, F])])) == (False, [1, 0]) and debate(("or", [F, ("and", [T, T])])) == (True, [1, 0])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For trees of &quot;and&quot; nodes and leaves, write <C>random_catch(claim)</C>, the probability that a challenger
          choosing children uniformly at random reaches a false leaf; <C>repeated_catch(p, k)</C>; and{" "}
          <C>direct_accept(a, n_leaves)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def random_catch(claim):
    return 0.0

def repeated_catch(p, k):
    return p * k

def direct_accept(a, n_leaves):
    return a
`,
        solution: OBFUSCATE,
        tests: [
          { name: "catch", code: `T, F = ("leaf", True), ("leaf", False)\nassert random_catch(("and", [T, ("and", [F, T, T])])) == 1 / 6 and random_catch(F) == 1.0` },
          { name: "repeat", code: `assert abs(repeated_catch(0.2, 2) - 0.36) < 1e-12 and abs(direct_accept(0.9, 2) - 0.81) < 1e-12` },
        ],
      },
    },
    {
      key: "rounds",
      rung: "stretch",
      prompt: (
        <p>
          In the depth-4, branching-3 argument with one false step, how many independent random challenges are needed for
          at least a 90% chance of exposing it?
        </p>
      ),
      answer: { kind: "numeric", value: 186, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Debate decomposes the judging of one answer. A related idea decomposes the judging of a whole task: use models
        already trained to help humans evaluate the next, more capable model, and repeat.
      </p>
    </>
  ),
};
