import { M } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { PigeonholeViz } from "@/components/viz/PigeonholeViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m4.1.4",
  minutes: 50,
  links: {
    requires: ["m4.1.1", "m1.3.3"],
    foreshadows: ["m4.4.4", "m4.6.4", "e2.3.2"],
  },

  puzzle: (
    <>
      <p>
        A file-sharing service promises to compress <em>every</em> file of 1 megabyte to something smaller, losslessly. Is that
        possible?
      </p>
      <p>
        No algorithm needs inspecting. A counting argument that fits in one line settles it.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If you put more pigeons than holes, some hole gets two. That is obvious, yet it proves things that look hard, because
        it shows that something exists without saying where. Place the pigeons below however you like: the fullest hole never
        drops below the line.
      </p>
      <PigeonholeViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the pigeonhole principle">
        <p>
          If n objects are placed in k boxes and n &gt; k, some box contains at least two objects. Equivalently, a function
          from a finite set A to a finite set B with <M>{"|A| > |B|"}</M> is not injective.
        </p>
      </Theorem>
      <Theorem title="the generalised principle">
        <p>
          If n objects are placed in k boxes, some box contains at least <M>{"\\lceil n/k \\rceil"}</M> objects.
        </p>
      </Theorem>
      <Proof>
        <p>
          If every box held at most <M>{"\\lceil n/k \\rceil - 1"}</M> objects, the total would be at most{" "}
          <M>{"k(\\lceil n/k \\rceil - 1) < k \\cdot (n/k) = n"}</M>, using <M>{"\\lceil n/k \\rceil < n/k + 1"}</M>. This
          contradicts there being n objects.
        </p>
      </Proof>

      <Example title="no compressor shrinks everything">
        <p>
          There are <M>{"2^N"}</M> files of exactly N bits, but only{" "}
          <M>{"2^0 + 2^1 + \\dots + 2^{N-1} = 2^N - 1"}</M> shorter files. A lossless compressor is injective, so it cannot map
          the <M>{"2^N"}</M> files into the <M>{"2^N - 1"}</M> shorter ones. Some file does not get shorter. Real compressors
          win on the files people actually make and lose slightly on random ones.
        </p>
      </Example>

      <Example title="birthdays">
        <p>
          Among 367 people two share a birthday. Among 100 people, some month has at least{" "}
          <M>{"\\lceil 100/12 \\rceil = 9"}</M> birthdays.
        </p>
      </Example>

      <Example title="a subset with a divisible sum">
        <p>
          Any n integers <M>{"a_1, \\dots, a_n"}</M> contain a non-empty run of consecutive terms whose sum is divisible by n.
          Consider the n prefix sums <M>{"s_j = a_1 + \\dots + a_j"}</M> modulo n. If one is 0 we are done. Otherwise the n
          sums take at most n − 1 non-zero values, so two are equal, say <M>{"s_i \\equiv s_j"}</M> with i &lt; j, and then{" "}
          <M>{"a_{i+1} + \\dots + a_j \\equiv 0"}</M>.
        </p>
      </Example>

      <Theorem title="Erdős–Szekeres">
        <p>
          Every sequence of <M>{"n^2 + 1"}</M> distinct numbers has an increasing subsequence of length n + 1 or a decreasing
          one of length n + 1.
        </p>
      </Theorem>
      <Proof>
        <p>
          Label each term with <M>{"(i_k, d_k)"}</M>, the lengths of the longest increasing and decreasing subsequences
          starting there. If all were at most n there would be at most <M>{"n^2"}</M> labels for <M>{"n^2 + 1"}</M> terms, so
          two terms j &lt; k share a label. But if <M>{"a_j < a_k"}</M>, putting <M>{"a_j"}</M> in front of the longest
          increasing run from <M>{"a_k"}</M> gives <M>{"i_j > i_k"}</M>; if <M>{"a_j > a_k"}</M>, similarly{" "}
          <M>{"d_j > d_k"}</M>. Either way the labels differ, a contradiction.
        </p>
      </Proof>

      <Remark title="hash collisions">
        <p>
          A hash function maps a huge set of keys to a small set of values, so collisions are unavoidable: pigeonhole says they
          exist, and the birthday problem in probability says they arrive sooner than intuition expects. Hash tables are
          designed to live with them.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "socks",
      rung: "check",
      prompt: <p>A drawer holds socks in 5 colours. How many socks must you take, in the dark, to be sure of a matching pair?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "class",
      rung: "check",
      prompt: <p>A class of 40 students is split across 7 tutorial groups. What is the smallest possible size of the largest group?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "three",
      rung: "apply",
      prompt: <p>How many cards must be drawn from a standard 52-card deck to be sure of three cards of the same suit?</p>,
      answer: { kind: "numeric", value: 9 },
    },
    {
      key: "pairs",
      rung: "apply",
      prompt: <p>What is the smallest n such that any n integers chosen from 1 to 20 must include two whose sum is 21?</p>,
      answer: { kind: "numeric", value: 11 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`words = ["tea", "eat", "ate", "tan", "nat", "bat"]
groups = {}
for w in words:
    groups.setdefault("".join(sorted(w)), []).append(w)
print(max(len(g) for g in groups.values()))`}</Code>
          <p>Words are put into boxes by their sorted letters. How many words does the fullest box hold?</p>
        </>
      ),
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Pigeonhole made concrete. Write <C>repeat_prefix_sums(nums)</C>: given a list of n integers, return a pair (i, j) with 0 ≤ i &lt; j ≤ n such that <C>sum(nums[i:j])</C> is divisible by n, found by looking for two equal prefix sums modulo n (count the empty prefix as prefix 0).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def repeat_prefix_sums(nums):
    return (0, len(nums))
`,
        solution: `def repeat_prefix_sums(nums):
    n = len(nums)
    seen = {0: 0}
    s = 0
    for j, x in enumerate(nums, start=1):
        s = (s + x) % n
        if s in seen:
            return (seen[s], j)
        seen[s] = j
`,
        tests: [
          { name: "example", code: `nums = [3, 1, 4, 1, 5]
i, j = repeat_prefix_sums(nums)
assert 0 <= i < j <= 5 and sum(nums[i:j]) % 5 == 0, 'Two of the six prefix sums agree modulo 5.'` },
          { name: "many", code: `import random
random.seed(4)
for _ in range(200):
    n = random.randint(1, 12)
    nums = [random.randint(-50, 50) for _ in range(n)]
    i, j = repeat_prefix_sums(nums)
    assert 0 <= i < j <= n and sum(nums[i:j]) % n == 0, 'n + 1 prefix sums, only n remainders: some pair must repeat.'` },
        ],
      },
    },
    {
      key: "handshake",
      rung: "prove",
      prompt: (
        <p>
          At a party of n ≥ 2 people, some shake hands. Prove that two people shook the same number of hands.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes each person shook between 0 and n − 1 hands, which is n possible values.",
          "Observes that 0 and n − 1 cannot both occur: someone who shook everyone's hand rules out someone who shook none.",
          "So n people take at most n − 1 values, and pigeonhole gives two with the same count.",
        ],
      },
    },
    {
      key: "square",
      rung: "stretch",
      prompt: (
        <p>
          Points are placed in a 2 × 2 square. What is the smallest number of points that guarantees two of them are at
          distance at most √2?
        </p>
      ),
      answer: { kind: "numeric", value: 5 },
    },
  ],

  teachBack:
    "Explain to a friend the pigeonhole principle and how it proves that no lossless compressor can shrink every file.",

  glimpse: (
    <p>
      Hashing, later in this course, starts from the fact that collisions must happen. The probabilistic method, at the end of
      the course, is a statistical cousin of pigeonhole: if the average is large, something is at least the average.
    </p>
  ),
};
