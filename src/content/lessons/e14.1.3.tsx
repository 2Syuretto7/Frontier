import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PhiPlacementViz } from "@/components/viz/PhiPlacementViz";
import type { LessonContent } from "@/lib/types";

const STRAIGHT = `def to_ssa(code):
    count, cur, out = {}, {}, []
    for dst, op, args in code:
        args = [cur.get(a, a) if isinstance(a, str) else a for a in args]   # read the latest version
        count[dst] = count.get(dst, 0) + 1
        cur[dst] = f"{dst}{count[dst]}"
        out.append((cur[dst], op, args))
    return out, cur

def cse(ssa):
    seen, rename, out = {}, {}, []
    for dst, op, args in ssa:
        args = [rename.get(a, a) if isinstance(a, str) else a for a in args]
        key = (op, tuple(args))
        if key in seen:
            rename[dst] = seen[key]                        # same operation on the same values: reuse it
        else:
            seen[key] = dst
            out.append((dst, op, args))
    return out, rename

def fold(ssa):
    known, out = {}, []
    for dst, op, args in ssa:
        args = [known.get(a, a) if isinstance(a, str) else a for a in args]
        if op in ("add", "mul") and not any(isinstance(a, str) for a in args):
            known[dst] = args[0] + args[1] if op == "add" else args[0] * args[1]
        else:
            out.append((dst, op, args))
    return out, known`;

const PHI = `def dominators(cfg, entry):
    preds = {n: [p for p in cfg if n in cfg[p]] for n in cfg}
    dom = {n: set(cfg) for n in cfg}
    dom[entry] = {entry}
    changed = True
    while changed:
        changed = False
        for n in cfg:
            if n == entry:
                continue
            new = {n} | set.intersection(*(dom[p] for p in preds[n]))   # on every path from the entry
            if new != dom[n]:
                dom[n], changed = new, True
    return dom

def dom_frontier(cfg, entry):
    dom = dominators(cfg, entry)
    df = {n: set() for n in cfg}
    for a in cfg:
        for b in cfg[a]:
            for x in dom[a]:
                if x == b or x not in dom[b]:
                    df[x].add(b)                           # x reaches b's edge but does not strictly dominate b
    return df

def phi_blocks(cfg, entry, def_blocks):
    df = dom_frontier(cfg, entry)
    phis, work = set(), list(def_blocks)
    while work:
        for f in df[work.pop()]:
            if f not in phis:
                phis.add(f)
                work.append(f)                             # a phi is itself a new definition
    return sorted(phis)`;

export const lesson: LessonContent = {
  id: "e14.1.3",
  minutes: 50,
  links: {
    requires: ["e14.1.2"],
    revisits: ["e14.1.1"],
    foreshadows: ["e14.2.1", "e14.4.3"],
  },

  puzzle: (
    <>
      <p>
        In <C>x = a * 2; x = x + 1; y = a * 2</C>, the two computations of <C>a * 2</C> are obviously the same, and a
        compiler should compute it once. But to be sure, it must know that <C>a</C> was not reassigned between them,
        which in ordinary code means tracking every assignment along every path. Is there a representation in which
        &quot;same expression&quot; can simply be read off, even when the program has branches and loops?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Give every assignment its own name. Then a name always means the same value, wherever it is used, and two
        operations with the same operator and the same argument names compute the same thing. That is static single
        assignment (SSA) form. Straight-line code converts by renaming. Where control flow merges, a value may come from
        either path, so SSA adds a phi node that selects the version arriving along the edge actually taken. The art is
        to place phi nodes only where they are needed.
      </p>
      <PhiPlacementViz />
    </>
  ),

  theory: (
    <>
      <Definition title="SSA form">
        <p>
          A program is in SSA form if every variable is assigned exactly once in the program text. Straight-line code is
          converted by numbering each assignment and replacing each use with the latest version (<C>to_ssa</C>). In SSA,
          common-subexpression elimination is a lookup of (operator, arguments) in a table (<C>cse</C>), and constant
          folding replaces any operation whose arguments are all known constants by its value (<C>fold</C>). Both are
          safe only for operations without side effects: two calls to a random number generator are not the same value.
        </p>
        <Code>{STRAIGHT}</Code>
      </Definition>

      <Definition title="dominance">
        <p>
          In a control-flow graph with an entry block, block d dominates block n if every path from the entry to n passes
          through d (<C>dominators</C>). The dominance frontier of d is the set of blocks n such that d dominates a
          predecessor of n but does not strictly dominate n: the first blocks where d&apos;s influence meets other paths{" "}
          (<C>dom_frontier</C>).
        </p>
      </Definition>

      <Theorem title="where phi nodes go">
        <p>
          Let a variable be assigned in a set of blocks S that includes the entry. Merging is needed at exactly the
          blocks in the iterated dominance frontier of S: the frontier of S, then the frontier of that set together
          with S, until nothing changes (<C>phi_blocks</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          Sketch, following Cytron and colleagues. A block n needs a phi when two different definitions can reach it
          along paths that first meet at n. If d in S dominates a predecessor p of n but not n itself, a path through
          d and p reaches n carrying d&apos;s definition, while some path to n avoids d and carries another definition,
          ultimately the one in the entry; these meet at n, so n needs a phi. Conversely, if n is in no such frontier,
          then whichever definitions reach n&apos;s predecessors are the same, because the last definition before n
          dominates n and all its predecessors. A phi placed at n is itself a new definition, which is why the frontier is
          iterated: in the figure, a definition in the loop body puts a phi at the header, whose frontier may require
          another.
        </p>
        <Code>{PHI}</Code>
      </Proof>

      <Example title="SSA in ML compilers">
        <p>
          Traced graphs from e14.1.1 are already in SSA form, because every node is assigned once and loops have been
          unrolled. Control flow that survives capture, such as <C>lax.scan</C> or a while loop in a compiled graph, is
          represented with region arguments and results, which play the role of phi nodes. MLIR, LLVM IR and XLA&apos;s
          HLO are all SSA-based, so the passes of the next chapter are written against SSA values.
        </p>
      </Example>

      <Remark title="computing dominators">
        <p>
          The iterative algorithm here intersects predecessors&apos; dominator sets until nothing changes, which is
          simple and fast enough for graphs of hundreds of blocks. Compilers use faster algorithms such as
          Lengauer–Tarjan, and represent dominance as a tree in which each block&apos;s parent is its immediate dominator,
          but the definitions and the placement rule are the same. With <M>{"n"}</M> blocks and <M>{"e"}</M> edges,
          computing frontiers directly from the definition costs at most <M>{"O(e \\cdot n)"}</M>.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "names",
      rung: "check",
      prompt: (
        <p>
          In a straight-line block, x is assigned 7 times and y 5 times, and the input a is read but never assigned.
          After conversion to SSA, how many distinct names appear, counting a?
        </p>
      ),
      answer: { kind: "numeric", value: 13, tolerance: 0 },
    },
    {
      key: "phis",
      rung: "check",
      prompt: (
        <p>
          A control-flow graph has edges entry→A, entry→B, A→C, B→C, C→D, C→E, D→F and E→F. A variable is assigned in
          entry, A and D. In how many blocks must minimal SSA place a phi node for it?
        </p>
      ),
      answer: { kind: "numeric", value: 2, tolerance: 0 },
    },
    {
      key: "unsafe",
      rung: "apply",
      prompt: <p>Which pair of operations must common-subexpression elimination never merge?</p>,
      answer: {
        kind: "choice",
        options: [
          "Two calls to rand(shape) with the same shape",
          "Two additions of the same SSA values",
          "Two transposes of the same SSA value",
          "Two multiplications of the same value by the same constant",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def to_ssa(code):
    count, cur, out = {}, {}, []
    for dst, op, args in code:
        args = [cur.get(a, a) if isinstance(a, str) else a for a in args]   # read the latest version
        count[dst] = count.get(dst, 0) + 1
        cur[dst] = f"{dst}{count[dst]}"
        out.append((cur[dst], op, args))
    return out, cur

def cse(ssa):
    seen, rename, out = {}, {}, []
    for dst, op, args in ssa:
        args = [rename.get(a, a) if isinstance(a, str) else a for a in args]
        key = (op, tuple(args))
        if key in seen:
            rename[dst] = seen[key]                        # same operation on the same values: reuse it
        else:
            seen[key] = dst
            out.append((dst, op, args))
    return out, rename

def fold(ssa):
    known, out = {}, []
    for dst, op, args in ssa:
        args = [known.get(a, a) if isinstance(a, str) else a for a in args]
        if op in ("add", "mul") and not any(isinstance(a, str) for a in args):
            known[dst] = args[0] + args[1] if op == "add" else args[0] * args[1]
        else:
            out.append((dst, op, args))
    return out, known

ssa, cur = to_ssa([("x", "mul", ["a", 2]), ("x", "add", ["x", 1]), ("y", "mul", ["a", 2])])
print(ssa[1], cur, cse(ssa)[1], fold([("p", "add", [2, 3]), ("q", "mul", ["p", "z"])]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "('x2', 'add', ['x1', 1]) {'x': 'x2', 'y': 'y1'} {'y1': 'x1'} ([('q', 'mul', [5, 'z'])], {'p': 5})",
          "('x2', 'add', ['x', 1]) {'x': 'x2', 'y': 'y1'} {'y1': 'x1'} ([('q', 'mul', [5, 'z'])], {'p': 5})",
          "('x2', 'add', ['x1', 1]) {'x': 'x2', 'y': 'y1'} {} ([('q', 'mul', [5, 'z'])], {'p': 5})",
          "('x2', 'add', ['x1', 1]) {'x': 'x2', 'y': 'y1'} {'y1': 'x1'} ([('p', 'add', [2, 3]), ('q', 'mul', ['p', 'z'])], {})",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def dominators(cfg, entry):
    preds = {n: [p for p in cfg if n in cfg[p]] for n in cfg}
    dom = {n: set(cfg) for n in cfg}
    dom[entry] = {entry}
    changed = True
    while changed:
        changed = False
        for n in cfg:
            if n == entry:
                continue
            new = {n} | set.intersection(*(dom[p] for p in preds[n]))   # on every path from the entry
            if new != dom[n]:
                dom[n], changed = new, True
    return dom

def dom_frontier(cfg, entry):
    dom = dominators(cfg, entry)
    df = {n: set() for n in cfg}
    for a in cfg:
        for b in cfg[a]:
            for x in dom[a]:
                if x == b or x not in dom[b]:
                    df[x].add(b)                           # x reaches b's edge but does not strictly dominate b
    return df

def phi_blocks(cfg, entry, def_blocks):
    df = dom_frontier(cfg, entry)
    phis, work = set(), list(def_blocks)
    while work:
        for f in df[work.pop()]:
            if f not in phis:
                phis.add(f)
                work.append(f)                             # a phi is itself a new definition
    return sorted(phis)

cfg = {"entry": ["then", "else"], "then": ["join"], "else": ["join"], "join": []}
print(sorted(dominators(cfg, "entry")["join"]), dom_frontier(cfg, "entry")["then"], phi_blocks(cfg, "entry", ["then"]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['entry', 'join'] {'join'} ['join']",
          "['entry', 'then', 'else', 'join'] {'join'} ['join']",
          "['entry', 'join'] set() []",
          "['entry', 'join'] {'join'} ['join', 'then']",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Code is a list of (destination, operator, arguments), where string arguments are names and others are
          constants. Write <C>to_ssa(code)</C>, naming versions x1, x2 and so on and returning the code with the final
          version of each name; <C>cse(ssa)</C>, returning the kept code and a map from removed names to their
          replacements; and <C>fold(ssa)</C> for add and mul, returning the remaining code and the known constants.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def to_ssa(code):
    return code, {}

def cse(ssa):
    return ssa, {}

def fold(ssa):
    return ssa, {}
`,
        solution: STRAIGHT,
        tests: [
          { name: "ssa", code: `assert to_ssa([("a", "load", ["m"]), ("a", "add", ["a", "a"]), ("b", "mul", ["a", "m"])]) == ([("a1", "load", ["m"]), ("a2", "add", ["a1", "a1"]), ("b1", "mul", ["a2", "m"])], {"a": "a2", "b": "b1"})` },
          { name: "cse_fold", code: `assert cse([("t1", "add", ["a", "b"]), ("t2", "add", ["a", "b"]), ("t3", "mul", ["t1", "t2"]), ("t4", "mul", ["t2", "t1"])]) == ([("t1", "add", ["a", "b"]), ("t3", "mul", ["t1", "t1"])], {"t2": "t1", "t4": "t3"}) and fold([("u", "mul", [3, 4]), ("v", "add", ["u", 1]), ("w", "add", ["v", "x"]), ("z", "neg", [5])]) == ([("w", "add", [13, "x"]), ("z", "neg", [5])], {"u": 12, "v": 13})` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          A control-flow graph maps each block to its successors. Write <C>dominators(cfg, entry)</C>, mapping each block
          to the set of its dominators; <C>dom_frontier(cfg, entry)</C>, mapping each block to its frontier; and{" "}
          <C>phi_blocks(cfg, entry, def_blocks)</C>, the sorted iterated frontier.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def dominators(cfg, entry):
    return {n: {n} for n in cfg}

def dom_frontier(cfg, entry):
    return {n: set() for n in cfg}

def phi_blocks(cfg, entry, def_blocks):
    return []
`,
        solution: PHI,
        tests: [
          { name: "dom", code: `lp = {"s": ["h"], "h": ["b", "x"], "b": ["h"], "x": []}; assert dominators(lp, "s") == {"s": {"s"}, "h": {"h", "s"}, "b": {"b", "h", "s"}, "x": {"h", "s", "x"}}` },
          { name: "phi", code: `lp = {"s": ["h"], "h": ["b", "x"], "b": ["h"], "x": []}; assert dom_frontier(lp, "s") == {"s": set(), "h": {"h"}, "b": {"h"}, "x": set()} and phi_blocks(lp, "s", ["s", "b"]) == ["h"]` },
        ],
      },
    },
    {
      key: "nested",
      rung: "stretch",
      prompt: (
        <p>
          A graph has edges entry→H1, H1→H2, H1→exit, H2→B, H2→L1, B→H2 and L1→H1: an outer loop with header H1 around an
          inner loop with header H2. Variable i is assigned in entry and L1; variable j is assigned in H1 and B. How
          many phi nodes does minimal SSA place for the two variables together?
        </p>
      ),
      answer: { kind: "numeric", value: 3, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        With a graph in SSA form, the compiler can start rewriting it. The next chapter begins with the rewrite that
        matters most for ML workloads: fusing operations so that intermediate tensors never reach memory.
      </p>
    </>
  ),
};
