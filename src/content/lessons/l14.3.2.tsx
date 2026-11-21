import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BestOfNAttackViz } from "@/components/viz/BestOfNAttackViz";
import type { LessonContent } from "@/lib/types";

const SEARCH = `def greedy_coordinate(suffix, vocab, score, rounds):
    s = list(suffix)
    for _ in range(rounds):
        best, best_s = score(s), None
        for i in range(len(s)):                            # try every token at every position
            for t in vocab:
                cand = s[:i] + [t] + s[i + 1:]
                v = score(cand)
                if v > best:
                    best, best_s = v, cand
        if best_s is None:
            break                                          # no single swap helps: a local optimum
        s = best_s
    return s, score(s)

def queries_per_round(n_positions, vocab_size):
    return n_positions * vocab_size + 1

def attack_success_rate(results):
    return sum(results) / len(results)`;

const SAMPLING = `def bon_success(p, n):
    return 1 - (1 - p) ** n                                # n independent random variations

def mixed_bon(ps, n):
    return sum(bon_success(p, n) for p in ps) / len(ps)

def beta_fail(a, b, n):
    f = 1.0
    for k in range(n):
        f *= (b + k) / (a + b + k)                         # E[(1 - p)^n] for p ~ Beta(a, b)
    return f`;

export const lesson: LessonContent = {
  id: "l14.3.2",
  minutes: 45,
  links: {
    requires: ["l14.3.1", "l9.8.3"],
    revisits: ["l9.6.1", "l9.1.2"],
    foreshadows: ["l14.3.3", "l14.3.4"],
  },

  puzzle: (
    <>
      <p>
        A chat model refuses a dangerous request. The same request, with its letters randomly capitalised and a few
        characters swapped, is refused too, and so is the next variation. But an attacker can try ten thousand variations
        automatically, and the refusals are not perfectly consistent. How quickly does such an attack succeed, why does it
        keep succeeding long after the easy cases are gone, and what does that imply for defences?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Safety training teaches a model to refuse a region of inputs, but that region is learned from examples, and the
        space of inputs is vast. Jailbreaks find inputs outside the region that still carry the request: role-play that
        sets up a competing goal, encodings and languages the refusal training never covered, long runs of fake dialogue,
        or strings found by optimisation. Because a defender must hold everywhere and an attacker needs one success, even
        a small failure rate per attempt becomes a high success rate over many attempts.
      </p>
      <BestOfNAttackViz />
    </>
  ),

  theory: (
    <>
      <Definition title="jailbreaks and why they work">
        <p>
          A jailbreak is an input that makes a safety-trained model produce output its training was meant to prevent. Wei,
          Haghtalab and Steinhardt (2023) traced them to two failures. Competing objectives: the model&apos;s goals of
          following instructions and continuing text conflict with refusing, as when a prompt demands that the answer
          begin with an eager acknowledgement. Mismatched generalisation: capabilities from pretraining extend to inputs,
          such as Base64 or rare languages, that safety training never covered. Many-shot jailbreaking (Anil et al., 2024)
          fills a long context with fabricated dialogues in which an assistant complies, and its success grows as a power
          of the number of dialogues. A related threat, prompt injection, hides instructions in data an agent reads, such as
          a web page or an email.
        </p>
      </Definition>

      <Definition title="optimised attacks">
        <p>
          Zou et al. (2023) found adversarial suffixes by greedy coordinate gradient search: starting from a string of
          tokens, use gradients to shortlist promising token swaps at each position, evaluate them, and keep the swap that
          most raises the probability of a compliant opening, repeating until it succeeds (<C>greedy_coordinate</C>, here
          with exhaustive rather than gradient-guided candidates, whose cost per round is <C>queries_per_round</C>). Suffixes
          optimised on open models transferred to closed ones. Attacker models can also search in natural language,
          rewriting a request until the target complies. Attack success rate, the share of requests broken, is the usual
          measure (<C>attack_success_rate</C>).
        </p>
        <Code>{SEARCH}</Code>
      </Definition>

      <Theorem title="heterogeneous difficulty gives a power law">
        <p>
          Let each request be broken by a random attempt with probability p, independently across attempts, and let p
          vary across requests as Beta(a, b). After n attempts the share of requests not yet broken is
        </p>
        <MD>{"\\mathbb{E}\\big[(1 - p)^n\\big] = \\prod_{k=0}^{n-1}\\frac{b + k}{a + b + k} \\sim \\frac{\\Gamma(a + b)}{\\Gamma(b)}\\, n^{-a}"}</MD>
        <p>
          as n grows (<C>bon_success</C>, <C>mixed_bon</C>, <C>beta_fail</C>). Each doubling of attempts multiplies it by
          about <M>{"2^{-a}"}</M>, whereas if every request had the same p it would fall exponentially.
        </p>
      </Theorem>
      <Proof>
        <p>
          For one request the chance that n independent attempts all fail is <M>{"(1 - p)^n"}</M>; averaging over requests
          gives the expectation. With the Beta density,{" "}
          <M>{"\\mathbb{E}[(1 - p)^n] = B(a, b + n)/B(a, b)"}</M>, and using{" "}
          <M>{"B(a, c) = \\Gamma(a)\\Gamma(c)/\\Gamma(a + c)"}</M> together with <M>{"\\Gamma(x + 1) = x\\Gamma(x)"}</M>, the
          ratio telescopes into the product. Writing it as{" "}
          <M>{"\\frac{\\Gamma(a + b)}{\\Gamma(b)}\\cdot\\frac{\\Gamma(b + n)}{\\Gamma(a + b + n)}"}</M> and using the standard
          consequence of Stirling&apos;s formula <M>{"\\Gamma(n + x)/\\Gamma(n + y) \\sim n^{x - y}"}</M> gives the power law.
          The exponent a governs how much probability the Beta density puts near p = 0, that is, how many requests are
          nearly unbreakable by random variation. Hughes et al. (2024) observed this shape for best-of-n jailbreaking with
          random augmentations, reaching most requests on leading models with ten thousand attempts.
        </p>
        <Code>{SAMPLING}</Code>
      </Proof>

      <Remark title="defences">
        <p>
          The power law is a warning for defenders: lowering the per-attempt success rate helps, but an attacker with
          enough attempts and a way to recognise success will keep finding breaks. Defences therefore combine better
          refusal training, adversarial training on found attacks, classifiers that screen inputs and outputs, as with
          constitutional classifiers that withstood thousands of hours of red-teaming without a universal jailbreak, rate
          limits and monitoring that make many attempts expensive or visible, and, for agents, keeping untrusted data from
          being treated as instructions. None is complete, which is why the next lessons treat red-teaming and adversarial
          training as continuing processes.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bon",
      rung: "check",
      prompt: (
        <p>
          Each random variation of one request succeeds independently with probability 0.002. What is the chance that at
          least one of 500 variations succeeds?
        </p>
      ),
      answer: { kind: "numeric", value: 0.6325, tolerance: 0.001 },
    },
    {
      key: "beta",
      rung: "check",
      prompt: (
        <p>
          Per-attempt success rates across requests follow Beta(0.5, 2). What share of requests is broken within 100
          attempts?
        </p>
      ),
      answer: { kind: "numeric", value: 0.8682, tolerance: 0.001 },
    },
    {
      key: "mismatch",
      rung: "apply",
      prompt: (
        <p>
          A model refuses a request in English but answers it when the request is encoded in Base64. Which failure does this
          illustrate?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Mismatched generalisation: pretraining capabilities reach inputs that safety training did not cover",
          "Competing objectives between helpfulness and harmlessness",
          "Reward hacking by the model",
          "Goal misgeneralisation of the pretraining objective",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def greedy_coordinate(suffix, vocab, score, rounds):
    s = list(suffix)
    for _ in range(rounds):
        best, best_s = score(s), None
        for i in range(len(s)):                            # try every token at every position
            for t in vocab:
                cand = s[:i] + [t] + s[i + 1:]
                v = score(cand)
                if v > best:
                    best, best_s = v, cand
        if best_s is None:
            break                                          # no single swap helps: a local optimum
        s = best_s
    return s, score(s)

def queries_per_round(n_positions, vocab_size):
    return n_positions * vocab_size + 1

def attack_success_rate(results):
    return sum(results) / len(results)

score = lambda s: sum(1 for x, y in zip(s, "cab") if x == y); print(greedy_coordinate(list("aaa"), "abc", score, 1), greedy_coordinate(list("aaa"), "abc", score, 5))
print(queries_per_round(20, 50000), attack_success_rate([True, False, False, True]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(['c', 'a', 'a'], 2) (['c', 'a', 'b'], 3)\n1000001 0.5",
          "(['a', 'a', 'b'], 2) (['c', 'a', 'b'], 3)\n1000001 0.5",
          "(['c', 'a', 'b'], 3) (['c', 'a', 'b'], 3)\n1000001 0.5",
          "(['c', 'a', 'a'], 2) (['c', 'a', 'b'], 3)\n1000000 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def bon_success(p, n):
    return 1 - (1 - p) ** n                                # n independent random variations

def mixed_bon(ps, n):
    return sum(bon_success(p, n) for p in ps) / len(ps)

def beta_fail(a, b, n):
    f = 1.0
    for k in range(n):
        f *= (b + k) / (a + b + k)                         # E[(1 - p)^n] for p ~ Beta(a, b)
    return f

print(bon_success(0.5, 3), mixed_bon([0.0, 1.0], 10), round(beta_fail(1, 1, 1), 4), round(beta_fail(1, 1, 3), 4))
print(round(beta_fail(2, 3, 0), 4), round(1 - beta_fail(1, 9, 1), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.875 0.5 0.5 0.25\n1.0 0.1",
          "0.875 0.5 0.5 0.125\n1.0 0.1",
          "0.875 1.0 0.5 0.25\n1.0 0.1",
          "0.875 0.5 0.5 0.25\n0.0 0.1",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>greedy_coordinate(suffix, vocab, score, rounds)</C>: in each round try every token at every position,
          keep the single swap that most increases the score, the first found on ties, and stop early when none increases
          it, returning the final list and its score; <C>queries_per_round(n_positions, vocab_size)</C>, counting the
          evaluation of the current string; and <C>attack_success_rate(results)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def greedy_coordinate(suffix, vocab, score, rounds):
    s = list(suffix)
    return s, score(s)

def queries_per_round(n_positions, vocab_size):
    return n_positions

def attack_success_rate(results):
    return 0.0
`,
        solution: SEARCH,
        tests: [
          { name: "search", code: `sc = lambda s: s.count("x") - 2 * s.count("y")\nassert greedy_coordinate(list("yy"), "xy", sc, 1) == (["x", "y"], -1) and greedy_coordinate(list("yy"), "xy", sc, 9) == (["x", "x"], 2)` },
          { name: "count", code: `assert queries_per_round(3, 4) == 13 and attack_success_rate([1, 1, 0, 0, 0]) == 0.4` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bon_success(p, n)</C>; <C>mixed_bon(ps, n)</C>, the mean success over requests with rates ps; and{" "}
          <C>beta_fail(a, b, n)</C>, the share of requests unbroken after n attempts when rates follow Beta(a, b).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def bon_success(p, n):
    return p * n

def mixed_bon(ps, n):
    return 0.0

def beta_fail(a, b, n):
    return (b / (a + b)) ** n
`,
        solution: SAMPLING,
        tests: [
          { name: "bon", code: `assert abs(bon_success(0.1, 2) - 0.19) < 1e-12 and abs(mixed_bon([0.5, 0.0], 1) - 0.25) < 1e-12` },
          { name: "beta", code: `assert abs(beta_fail(1, 1, 4) - 0.2) < 1e-12 and abs(beta_fail(2, 1, 2) - 1 / 6) < 1e-12` },
        ],
      },
    },
    {
      key: "halve",
      rung: "stretch",
      prompt: (
        <p>
          For large n the share of unbroken requests falls as <M>{"n^{-a}"}</M> with a = 0.5. By what factor must the
          number of attempts grow to halve it?
        </p>
      ),
      answer: { kind: "numeric", value: 4, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Attackers search for failures; defenders can search first. Red-teaming organises that search, by people and by
        models, to find what a model will do before someone else does.
      </p>
    </>
  ),
};
