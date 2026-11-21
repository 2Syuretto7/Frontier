import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MlirLoweringViz } from "@/components/viz/MlirLoweringViz";
import type { LessonContent } from "@/lib/types";

const REWRITE = `def sweep(e, patterns):
    if isinstance(e, tuple):
        e = (e[0],) + tuple(sweep(a, patterns) for a in e[1:])     # operands first
    for p in patterns:
        r = p(e)
        if r is not None:
            return r                                       # at most one rewrite per node per sweep
    return e

def greedy(e, patterns, max_sweeps=100):
    for n in range(max_sweeps):
        new = sweep(e, patterns)
        if new == e:
            return e, n                                    # fixpoint: no pattern applies anywhere
        e = new
    raise RuntimeError("rewriting did not converge")

def size(e):
    return 1 + sum(size(a) for a in e[1:]) if isinstance(e, tuple) else 1`;

const LOWER = `def dialect(op):
    return op.split(".")[0]

def lower_once(ops, table, legal):
    return [new for op in ops for new in (table.get(op, [op]) if dialect(op) not in legal else [op])]

def lower_to(ops, table, legal):
    rounds = 0
    while any(dialect(op) not in legal for op in ops):
        new = lower_once(ops, table, legal)
        if new == ops:
            raise ValueError("no pattern for " + next(op for op in ops if dialect(op) not in legal))
        ops, rounds = new, rounds + 1
    return ops, rounds`;

export const lesson: LessonContent = {
  id: "e14.4.3",
  minutes: 40,
  links: {
    requires: ["e14.4.2"],
    revisits: ["e14.1.2", "e14.1.3", "e14.3.1"],
    foreshadows: ["e14.5.1"],
  },

  puzzle: (
    <>
      <p>
        Every compiler so far has built its own stack of IRs: one graph IR, one loop IR, one kernel IR, each with its own
        parser, printer, verifier and passes. A new accelerator needs a new back end for each of them, and a new
        framework a new front end for each. Most of that code is the same. Could compilers share their infrastructure
        and still keep IRs suited to each level?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        MLIR makes the IR itself extensible. An operation is a named node with operands, results, attributes and nested
        regions, and a dialect is a named family of operations with their types and rules. Tensor-level, loop-level and
        machine-level dialects can coexist in one module. A compiler is then a sequence of conversions, each declaring
        which dialects are legal afterwards and supplying rewrite patterns that replace the illegal operations, lowering
        the program one level at a time.
      </p>
      <MlirLoweringViz />
    </>
  ),

  theory: (
    <>
      <Definition title="operations, regions and dialects">
        <p>
          Every MLIR operation has a name such as <C>arith.addf</C>, in which the prefix is its dialect (<C>dialect</C>),
          a list of SSA operands and results as in e14.1.3, a dictionary of attributes and zero or more regions, each a
          list of blocks. Regions let structured control flow nest: <C>scf.for</C> holds its loop body as a region, and
          a function holds its body. Common dialects include <C>linalg</C> for structured operations on tensors and
          buffers, <C>tensor</C> and <C>memref</C> for values and memory, <C>scf</C> and <C>affine</C> for loops,{" "}
          <C>vector</C> for SIMD, <C>arith</C> and <C>math</C> for scalars, and <C>gpu</C>, <C>nvvm</C> and{" "}
          <C>llvm</C> near the hardware.
        </p>
      </Definition>

      <Definition title="pattern rewriting">
        <p>
          A rewrite pattern matches an operation and replaces it. The greedy driver visits operations, applies the first
          matching pattern, and repeats until no pattern applies anywhere, a fixpoint. The code represents operations as
          nested tuples, applies patterns bottom-up in one sweep (<C>sweep</C>) and repeats sweeps until nothing changes
          (<C>greedy</C>); <C>size</C> counts the nodes. Canonicalisation, which folds constants and removes identities,
          is such a driver with each operation&apos;s simplifications.
        </p>
        <Code>{REWRITE}</Code>
      </Definition>

      <Theorem title="termination of greedy rewriting">
        <p>
          If every pattern turns an expression into one of strictly smaller size, the greedy driver reaches a fixpoint
          after at most as many changing sweeps as the size of the starting expression minus one.
        </p>
      </Theorem>
      <Proof>
        <p>
          A sweep that changes the expression applies at least one pattern. Replacing a subexpression by a smaller one
          decreases the size of every expression containing it, so the total size drops by at least one with each
          changing sweep. A size is at least 1, so after at most the starting size minus one changing sweeps, a sweep
          leaves the expression unchanged. Patterns that do not shrink, such as commuting operands, need another
          argument: a pattern that rewrites a + b into b + a and back would cycle forever, so drivers impose orders such
          as constants on the right, and cap the number of iterations.
        </p>
      </Proof>

      <Definition title="dialect conversion">
        <p>
          A conversion target declares which dialects are legal. The conversion rewrites each illegal operation with a
          pattern for it, leaving legal ones alone (<C>lower_once</C>), and repeats until everything is legal; if some
          illegal operation has no pattern, the conversion fails (<C>lower_to</C>). A pipeline is a sequence of such
          conversions with optimising passes between them, for example tiling at the linalg level as in e14.3.1, then
          lowering to loops, then to branches, then to LLVM.
        </p>
        <Code>{LOWER}</Code>
      </Definition>

      <Example title="who uses MLIR">
        <p>
          OpenXLA lowers StableHLO through MLIR before its own HLO passes. Triton parses kernels into its{" "}
          <C>tt</C> dialect, converts them to <C>ttg</C>, which adds GPU layouts, and lowers through <C>nvvm</C> and{" "}
          <C>llvm</C> to PTX. IREE compiles whole models through MLIR to CPUs, GPUs and Vulkan. Torch-MLIR brings
          PyTorch programs into MLIR. Because these share dialects such as <C>linalg</C>, <C>arith</C> and{" "}
          <C>llvm</C>, a pass written for one can serve the others.
        </p>
      </Example>

      <Remark title="why multiple levels">
        <p>
          Each level keeps information the next loses, as in e14.1.2. At the <C>linalg</C> level a matrix product is
          one operation whose iteration space and access patterns are explicit, so tiling and fusion are simple
          rewrites. Once lowered to loops, recovering that structure takes analysis; once lowered to branches, it is
          nearly impossible. Progressive lowering runs each optimisation at the highest level that expresses it, and
          sharing the levels across compilers turns n front ends and m targets from n·m translators into n + m.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "share",
      rung: "check",
      prompt: (
        <p>
          Six front ends must each reach five hardware targets. How many fewer translators are needed if all of them
          lower into one shared set of dialects rather than translating each front end directly to each target?
        </p>
      ),
      answer: { kind: "numeric", value: 19, tolerance: 0 },
    },
    {
      key: "vector",
      rung: "check",
      prompt: (
        <p>
          A <C>linalg.generic</C> on a 128 × 64 buffer computes exp(x) − 1 at each element. It is lowered to loops
          whose innermost body is a load, an exp, a subtraction and a store, and the inner loop is then vectorised by 16,
          so each body operation handles 16 elements. How many body operations execute in total?
        </p>
      ),
      answer: { kind: "numeric", value: 2048, tolerance: 0 },
    },
    {
      key: "level",
      rung: "apply",
      prompt: <p>Why is tiling a matrix product done at the linalg level rather than after lowering to LLVM?</p>,
      answer: {
        kind: "choice",
        options: [
          "The linalg operation still states its iteration space and accesses, which lowering would leave implicit in branches and address arithmetic",
          "LLVM has no way to represent loops",
          "Tiling changes the result, so it must happen before code generation",
          "The linalg dialect runs faster than LLVM IR",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def sweep(e, patterns):
    if isinstance(e, tuple):
        e = (e[0],) + tuple(sweep(a, patterns) for a in e[1:])     # operands first
    for p in patterns:
        r = p(e)
        if r is not None:
            return r                                       # at most one rewrite per node per sweep
    return e

def greedy(e, patterns, max_sweeps=100):
    for n in range(max_sweeps):
        new = sweep(e, patterns)
        if new == e:
            return e, n                                    # fixpoint: no pattern applies anywhere
        e = new
    raise RuntimeError("rewriting did not converge")

def size(e):
    return 1 + sum(size(a) for a in e[1:]) if isinstance(e, tuple) else 1

z = lambda e: e[1] if isinstance(e, tuple) and e[0] == "add" and e[2] == 0 else None; c = lambda e: ("add", e[2], 0) if isinstance(e, tuple) and e[0] == "add" and e[1] == 0 and e[2] != 0 else None
print(sweep(("add", 0, ("add", "y", 0)), [z, c]), greedy(("add", 0, ("add", "y", 0)), [z, c]), size(("add", 0, ("add", "y", 0))))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "('add', 'y', 0) ('y', 2) 5",
          "y ('y', 1) 5",
          "('add', 0, 'y') ('y', 2) 5",
          "('add', 'y', 0) ('y', 3) 3",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def dialect(op):
    return op.split(".")[0]

def lower_once(ops, table, legal):
    return [new for op in ops for new in (table.get(op, [op]) if dialect(op) not in legal else [op])]

def lower_to(ops, table, legal):
    rounds = 0
    while any(dialect(op) not in legal for op in ops):
        new = lower_once(ops, table, legal)
        if new == ops:
            raise ValueError("no pattern for " + next(op for op in ops if dialect(op) not in legal))
        ops, rounds = new, rounds + 1
    return ops, rounds

T = {"hi.f": ["mid.g", "mid.g"], "mid.g": ["lo.a", "lo.b"]}; print(lower_once(["hi.f", "mid.g"], T, {"mid", "lo"}), lower_to(["hi.f", "lo.a"], T, {"lo"}))
print(dialect("arith.addf"), len(lower_to(["hi.f", "hi.f"], T, {"lo"})[0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['mid.g', 'mid.g', 'mid.g'] (['lo.a', 'lo.b', 'lo.a', 'lo.b', 'lo.a'], 2)\narith 8",
          "['mid.g', 'mid.g', 'lo.a', 'lo.b'] (['lo.a', 'lo.b', 'lo.a', 'lo.b', 'lo.a'], 2)\narith 8",
          "['mid.g', 'mid.g', 'mid.g'] (['lo.a', 'lo.b', 'lo.a', 'lo.b', 'lo.a'], 1)\narith 8",
          "['mid.g', 'mid.g', 'mid.g'] (['lo.a', 'lo.b', 'lo.a', 'lo.b', 'lo.a'], 2)\naddf 4",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sweep(e, patterns)</C>, rewriting operands first and then applying at most the first matching pattern
          to the node; <C>greedy(e, patterns, max_sweeps=100)</C>, returning the fixpoint and the number of changing
          sweeps, or raising RuntimeError; and <C>size(e)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def sweep(e, patterns):
    return e

def greedy(e, patterns, max_sweeps=100):
    return e, 0

def size(e):
    return 1
`,
        solution: REWRITE,
        tests: [
          { name: "sweep", code: `neg = lambda e: e[1][1] if isinstance(e, tuple) and e[0] == "neg" and isinstance(e[1], tuple) and e[1][0] == "neg" else None; assert sweep(("neg", ("neg", ("neg", ("neg", "a")))), [neg]) == "a" and sweep(("neg", ("neg", ("neg", "a"))), [neg]) == ("neg", "a") and size(("f", "a", ("g", "b"))) == 4` },
          { name: "greedy", code: `neg = lambda e: e[1][1] if isinstance(e, tuple) and e[0] == "neg" and isinstance(e[1], tuple) and e[1][0] == "neg" else None; sw = lambda e: ("f", e[2], 0) if isinstance(e, tuple) and e[1] == 0 and e[2] != 0 else None; z = lambda e: e[1] if isinstance(e, tuple) and e[2] == 0 else None; assert greedy(("f", 0, "b"), [z, sw]) == ("b", 2) and greedy(("f", ("f", 0, 0), "b"), [z, sw]) == ("b", 2) and greedy("a", [neg]) == ("a", 0)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>dialect(op)</C>; <C>lower_once(ops, table, legal)</C>, replacing each illegal operation that has a
          pattern by its expansion; and <C>lower_to(ops, table, legal)</C>, returning the legal operations and the number of
          rounds, or raising ValueError when a round changes nothing.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def dialect(op):
    return op

def lower_once(ops, table, legal):
    return ops

def lower_to(ops, table, legal):
    return ops, 0
`,
        solution: LOWER,
        tests: [
          { name: "once", code: `T = {"a.x": ["b.y", "c.z"], "b.y": ["c.w"]}; assert dialect("gpu.launch") == "gpu" and lower_once(["a.x", "b.y"], T, {"b", "c"}) == ["b.y", "c.z", "b.y"]` },
          { name: "to", code: `T = {"a.x": ["b.y", "c.z"], "b.y": ["c.w"]}; assert lower_to(["a.x"], T, {"c"}) == (["c.w", "c.z"], 2) and lower_to(["c.q"], T, {"c"}) == (["c.q"], 0)` },
        ],
      },
    },
    {
      key: "count",
      rung: "stretch",
      prompt: (
        <>
          <p>
            Use the patterns of the viz: tosa.matmul becomes linalg.fill and linalg.matmul; tosa.relu becomes
            linalg.generic; linalg.fill becomes scf.for and memref.store; linalg.matmul becomes three scf.for, three
            memref.load, arith.mulf, arith.addf and memref.store; linalg.generic becomes scf.for, memref.load,
            arith.maximumf and memref.store; scf.for becomes cf.br, cf.cond_br, arith.cmpi and arith.addi; each
            memref.load or memref.store becomes two llvm operations; and every arith or cf operation becomes one llvm
            operation.
          </p>
          <p>
            A program of two tosa.matmul and one tosa.relu is lowered until only llvm is legal. How many operations
            result?
          </p>
        </>
      ),
      answer: { kind: "numeric", value: 65, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Compilers can now turn one device&apos;s program into fast kernels. The last chapter lets the compiler also split
        the program across many devices, starting with how a few sharding annotations propagate through a whole graph.
      </p>
    </>
  ),
};
