import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark, Theorem } from "@/components/lesson/Blocks";
import { ExpLogViz } from "@/components/viz/ExpLogViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.4.3",
  minutes: 65,
  links: {
    revisits: ["m0.3.4", "m0.4.1"],
    foreshadows: ["m4.5.1", "m7.3.1"],
  },

  puzzle: (
    <>
      <p>
        Start with 1 and keep doubling: 2, 4, 8, 16, and so on. How many doublings does it take to pass one million? Now a
        harder version: how many doublings does it take to reach <em>exactly</em> 1000? Is that question even sensible, when
        1000 is not a power of 2?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Since <M>{"2^{10} = 1024"}</M>, ten doublings pass a thousand, and twenty pass a million, because{" "}
        <M>{"2^{20} = 1024^2 = 1{,}048{,}576"}</M>. Reaching exactly 1000 needs a little under ten doublings: there is a
        unique real number <M>x</M> with <M>{"2^x = 1000"}</M>, because <M>{"x \\mapsto 2^x"}</M> is one-to-one and takes
        every positive value. It is about 9.97.
      </p>
      <p>
        That number has a name: the <strong>logarithm</strong> of 1000 to base 2. A logarithm is an exponent, the answer
        to &ldquo;what power of the base gives this number?&rdquo;. Since it undoes an exponential function, its graph is
        the reflection in <M>{"y = x"}</M>, as for every inverse.
      </p>
      <ExpLogViz withLog />
    </>
  ),

  theory: (
    <>
      <Definition title="logarithm">
        <p>
          Let <M>{"b > 0"}</M> with <M>{"b \\neq 1"}</M>. For <M>{"y > 0"}</M>, the <strong>logarithm</strong> of{" "}
          <M>y</M> to base <M>b</M>, written <M>{"\\log_b y"}</M>, is the unique real number <M>x</M> with{" "}
          <M>{"b^x = y"}</M>:
        </p>
        <MD>{"\\log_b y = x \\iff b^x = y."}</MD>
      </Definition>
      <p>
        It exists and is unique because the exponential function is one-to-one with range all the positive reals. So{" "}
        <M>{"\\log_b"}</M> is defined only for positive numbers: no power of a positive base is zero or negative.
      </p>

      <Theorem title="logarithm and exponential are inverse">
        <p>For every real <M>x</M> and every <M>{"y > 0"}</M>:</p>
        <MD>{"\\log_b(b^x) = x \\qquad \\text{and} \\qquad b^{\\log_b y} = y."}</MD>
      </Theorem>
      <Proof>
        <p>
          The first: <M>{"\\log_b(b^x)"}</M> is the power of <M>b</M> that gives <M>{"b^x"}</M>, and that power is{" "}
          <M>x</M>, since exponentials are one-to-one. The second is the definition read aloud: <M>{"\\log_b y"}</M> is the
          power that, applied to <M>b</M>, gives <M>y</M>.
        </p>
      </Proof>

      <p>Some values follow straight from the definition:</p>
      <ul>
        <li><M>{"\\log_b 1 = 0"}</M> and <M>{"\\log_b b = 1"}</M>, because <M>{"b^0 = 1"}</M> and <M>{"b^1 = b"}</M>;</li>
        <li><M>{"\\log_2 32 = 5"}</M>, <M>{"\\log_{10} 0.001 = -3"}</M> and <M>{"\\log_9 3 = \\tfrac12"}</M>;</li>
        <li>for <M>{"b > 1"}</M>, <M>{"\\log_b"}</M> is increasing, negative on <M>{"(0, 1)"}</M> and positive beyond 1.</li>
      </ul>
      <p>
        The base-10 logarithm is the <strong>common logarithm</strong>, often written <M>{"\\log"}</M> alone. The logarithm
        to base <M>e</M>, the natural logarithm <M>{"\\ln"}</M>, arrives at the end of this chapter.
      </p>

      <Proposition title="counting digits">
        <p>A whole number <M>{"N \\ge 1"}</M> has <M>{"\\lfloor \\log_{10} N \\rfloor + 1"}</M> digits.</p>
      </Proposition>
      <Proof>
        <p>
          <M>N</M> has <M>k</M> digits exactly when <M>{"10^{k-1} \\le N < 10^k"}</M>. Since <M>{"\\log_{10}"}</M> is
          increasing, this is equivalent to <M>{"k - 1 \\le \\log_{10} N < k"}</M>, which says{" "}
          <M>{"\\lfloor \\log_{10} N \\rfloor = k - 1"}</M>.
        </p>
      </Proof>

      <Example title="dating a bone">
        <p>
          A bone retains 30 percent of the carbon-14 it had in life, and the half-life is 5730 years. After <M>t</M> years
          the fraction remaining is <M>{"(\\tfrac12)^{t/5730}"}</M>. Setting this equal to 0.3 and taking logarithms to base{" "}
          <M>{"\\tfrac12"}</M>:
        </p>
        <MD>{"\\frac{t}{5730} = \\log_{1/2} 0.3, \\qquad t = 5730 \\log_{1/2} 0.3 \\approx 5730 \\times 1.737 \\approx 9950."}</MD>
        <p>
          The bone is about 10,000 years old. Calculators offer only <M>{"\\log_{10}"}</M> and <M>{"\\ln"}</M>; the next
          lesson shows how to get any other base from those.
        </p>
      </Example>

      <Remark title="logarithmic scales">
        <p>
          When quantities range over many powers of ten, we measure them by their logarithms. The decibel scale for sound, the
          pH scale for acidity and the magnitude scale for stars all work this way: a step of 1 on such a scale means
          multiplying by a fixed factor, not adding a fixed amount. Logarithms turn the geometric world into an arithmetic
          one, which is why they were invented.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "log2",
      rung: "check",
      prompt: <p>What is <M>{"\\log_2 32"}</M>?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "log-fraction",
      rung: "check",
      prompt: <p>What is <M>{"\\log_3 \\tfrac19"}</M>?</p>,
      answer: { kind: "numeric", value: -2 },
    },
    {
      key: "undefined",
      rung: "apply",
      prompt: <p>Select every expression that is <strong>not</strong> defined.</p>,
      answer: {
        kind: "choice",
        options: ["log₂ 0", "log₂ (−4)", "log_{1/2} 8", "log₅ 1"],
        correct: [0, 1],
      },
    },
    {
      key: "solve",
      rung: "apply",
      prompt: <p>Solve <M>{"\\log_2 x = 6"}</M>.</p>,
      answer: { kind: "numeric", value: 64 },
    },
    {
      key: "digits",
      rung: "apply",
      prompt: <p>How many digits does <M>{"2^{20}"}</M> have?</p>,
      answer: { kind: "numeric", value: 7 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
print(math.log2(1024), math.log10(0.001), math.log(math.e ** 3))`}</Code>
          <p>A logarithm answers 'what power?'. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["10.0 -3.0 3.0", "10.0 3.0 3.0", "512.0 -3.0 3.0", "10.0 -3.0 20.09"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
n, k = 1000, 0
while n > 1:
    n //= 2
    k += 1
print(k, math.floor(math.log2(1000)), math.ceil(math.log2(1000)))`}</Code>
          <p>How many halvings bring 1000 down to 1? What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["9 9 10", "10 9 10", "9 10 10", "10 10 10"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>ilog(b, x)</C>, the largest integer k with bᵏ ≤ x, for integers b ≥ 2 and x ≥ 1, by repeated multiplication. It is the floor of log<sub>b</sub> x.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def ilog(b, x):
    return x // b
`,
        solution: `def ilog(b, x):
    k, p = 0, b
    while p <= x:
        k += 1
        p *= b
    return k
`,
        tests: [
          { name: "exact", code: `assert ilog(2, 1024) == 10 and ilog(10, 1000) == 3, '2¹⁰ = 1024 and 10³ = 1000.'` },
          { name: "between", code: `assert ilog(2, 1000) == 9 and ilog(3, 1) == 0, '2⁹ = 512 ≤ 1000 < 1024.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>log_bits(x)</C>, an approximation of log₂ x for x &gt; 0 to within 1e−9, using only multiplication and division by 2 and squaring. First scale x into [1, 2) by halving or doubling, counting steps for the integer part; then each fraction bit comes from squaring y: if y² ≥ 2 the next bit is 1 and y becomes y²/2. Use 40 bits. Do not import <C>math</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def log_bits(x):
    k = 0
    while x >= 2:
        x /= 2
        k += 1
    return k
`,
        solution: `def log_bits(x):
    k = 0
    while x >= 2:
        x /= 2
        k += 1
    while x < 1:
        x *= 2
        k -= 1
    frac, bit = 0.0, 0.5
    for _ in range(40):
        x = x * x
        if x >= 2:
            x /= 2
            frac += bit
        bit /= 2
    return k + frac
`,
        tests: [
          { name: "powers", code: `assert log_bits(1) == 0 and log_bits(8) == 3 and log_bits(0.25) == -2, 'Exact powers of 2 have no fraction part.'` },
          { name: "fractions", code: `import math
for x in [3, 10, 1000, 1.5, 0.3, 123456.789]:
    assert abs(log_bits(x) - math.log2(x)) < 1e-9, x` },
          { name: "small", code: `import math
assert abs(log_bits(1e-6) - math.log2(1e-6)) < 1e-9, 'Double x into [1, 2) when it is small.'` },
          { name: "no math", code: `import inspect
assert 'math' not in inspect.getsource(log_bits) and 'log' not in inspect.getsource(log_bits).replace('log_bits', ''), 'Build the bits by squaring.'` },
        ],
      },
    },
    {
      key: "inverse-proof",
      rung: "prove",
      prompt: (
        <p>
          Prove from the definition that if <M>{"b > 1"}</M> and <M>{"0 < y < z"}</M>, then <M>{"\\log_b y < \\log_b z"}</M>.
          (Hint: suppose not, and use what you know about <M>{"b^x"}</M>.)
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Sets u = log_b y and v = log_b z, so bᵘ = y and bᵛ = z.",
          "Supposes u ≥ v.",
          "Uses that b^x is increasing for b > 1 to deduce bᵘ ≥ bᵛ, that is y ≥ z.",
          "Notes the contradiction with y < z and concludes u < v.",
        ],
      },
    },
    {
      key: "big-digits",
      rung: "stretch",
      prompt: <p>Given <M>{"\\log_{10} 2 \\approx 0.30103"}</M>, how many digits does <M>{"2^{100}"}</M> have?</p>,
      answer: { kind: "numeric", value: 31 },
    },
  ],

  teachBack:
    "Explain to a friend what log base 2 of 1000 means, using doubling, and why the logarithm of a negative number is not defined.",

  glimpse: (
    <p>
      Next, the laws of logarithms, which turn multiplication into addition and powered the slide rules and astronomy of
      three centuries. In Calculus, the natural logarithm is redefined as an area under a curve. Logarithms reappear in
      Discrete Mathematics, where they count the steps of efficient algorithms, and in Probability, in the densities of
      common distributions.
    </p>
  ),
};
