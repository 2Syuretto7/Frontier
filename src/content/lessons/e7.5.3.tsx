import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RingAllReduceViz } from "@/components/viz/RingAllReduceViz";
import type { LessonContent } from "@/lib/types";

const RING = `import math

def ring_allreduce(vectors):
    p, n = len(vectors), len(vectors[0])
    c = n // p
    buf = [list(v) for v in vectors]
    sent = 0
    for phase in ('reduce', 'gather'):
        for step in range(p - 1):
            msgs = []
            for i in range(p):
                k = (i - step) % p if phase == 'reduce' else (i + 1 - step) % p
                msgs.append(((i + 1) % p, k, buf[i][k * c:(k + 1) * c]))
            for dst, k, chunk in msgs:
                for q, x in enumerate(chunk):
                    buf[dst][k * c + q] = buf[dst][k * c + q] + x if phase == 'reduce' else x
                sent += len(chunk)
    return buf, 2 * (p - 1), sent // p

def ring_time(nbytes, p, alpha, beta):
    return 2 * (p - 1) * alpha + 2 * (p - 1) / p * nbytes / beta

def tree_time(nbytes, p, alpha, beta):
    return 2 * math.ceil(math.log2(p)) * (alpha + nbytes / beta)`;

const TORUS = `def torus_neighbors(coord, dims):
    out = set()
    for axis, size in enumerate(dims):
        for step in (-1, 1):
            c = list(coord)
            c[axis] = (c[axis] + step) % size
            if tuple(c) != tuple(coord):
                out.add(tuple(c))
    return sorted(out)

def torus_diameter(dims):
    return sum(d // 2 for d in dims)

def bisection_links(dims):
    big = max(dims)
    rest = 1
    for d in dims:
        rest *= d
    return rest // big * (2 if big > 2 else 1)`;

export const lesson: LessonContent = {
  id: "e7.5.3",
  minutes: 55,
  links: {
    requires: ["e7.5.2", "e3.6.2"],
    revisits: ["e7.1.1", "e6.4.4"],
    foreshadows: ["e7.6.2"],
  },

  puzzle: (
    <>
      <p>
        Eight GPUs train a model with data parallelism: after each step every GPU must end up with the sum of all eight
        gradients. The obvious way, sending every gradient to one GPU, adding them and sending the sum back, makes that GPU
        receive seven gradients and send seven. A cleverer scheme has every GPU send less than two gradients&apos; worth of
        data, and the amount barely changes with a thousand GPUs instead of eight. How?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Arrange the GPUs in a ring and cut each gradient into as many chunks as there are GPUs. In each step every GPU
        passes one chunk to its neighbour, which adds its own contribution and passes the sum on. After one trip around the
        ring each GPU holds one chunk summed over everyone; a second trip shares those finished chunks. Every link is busy
        in every step, and no GPU ever handles more than a chunk at a time.
      </p>
      <RingAllReduceViz />
    </>
  ),

  theory: (
    <>
      <Definition title="links and the α–β model">
        <p>
          Chips are joined at several levels. Inside an H100 server, NVLink gives each GPU about 450 GB/s in each direction;
          PCIe 5 with 16 lanes gives about 64 GB/s; between servers, an InfiniBand NDR port gives 400 Gb/s, 50 GB/s. TPU pods
          link chips directly into a torus through their inter-chip interconnect. Sending n bytes over a link is modelled as
          taking <M>{"\\alpha + n/\\beta"}</M>: a fixed latency α plus the size over the bandwidth β (e3.6.2).
        </p>
      </Definition>

      <Theorem title="ring all-reduce">
        <p>
          On p nodes in a ring, ring all-reduce leaves every node with the elementwise sum of all p vectors after{" "}
          <M>{"2(p-1)"}</M> steps, each node sending <M>{"2(p-1)/p"}</M> times the vector size in all. Its time is
        </p>
        <MD>{"T_{\\text{ring}} = 2(p - 1)\\,\\alpha + \\frac{2(p-1)}{p}\\cdot\\frac{n}{\\beta}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Split each vector into p chunks. In reduce-scatter step s, node i sends its copy of chunk <M>{"i - s"}</M> (mod p)
          to node <M>{"i + 1"}</M>, which adds it to its own. By induction, after step s node i holds chunk{" "}
          <M>{"i - s - 1"}</M> summed over the s + 2 nodes <M>{"i - s - 1, \\dots, i"}</M>: it adds its own value to the sum of
          s + 1 nodes received from node i − 1. After p − 1 steps node i holds chunk i + 1 summed over all p nodes. In the
          all-gather phase, node i sends its finished chunk to i + 1, and each later step forwards the chunk just received,
          so after p − 1 more steps every node has every finished chunk. Each step sends one chunk of n/p bytes per node,
          and all links work in parallel, giving the time.
        </p>
        <Code>{RING}</Code>
      </Proof>

      <Theorem title="ring or tree">
        <p>
          A tree all-reduce, reducing up a binary tree and broadcasting back down with whole vectors, takes{" "}
          <M>{"2\\lceil \\log_2 p \\rceil(\\alpha + n/\\beta)"}</M>. For p = 8 the ring is faster exactly when{" "}
          <M>{"n > 8\\alpha\\beta/4.25"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The tree has <M>{"\\lceil \\log_2 p \\rceil"}</M> levels, each crossed once up and once down with the full vector.
          For p = 8 the ring takes <M>{"14\\alpha + 1.75n/\\beta"}</M> and the tree <M>{"6\\alpha + 6n/\\beta"}</M>; the ring is
          smaller when <M>{"8\\alpha < 4.25\\,n/\\beta"}</M>. In general the ring wins for large messages, because its bandwidth
          term is below 2n/β for any p, and the tree for small ones, because its latency term grows only with log p.
          Libraries such as NCCL choose between them by message size, and use hierarchies of both across levels of links.
        </p>
      </Proof>

      <Theorem title="the torus">
        <p>
          In a torus with side lengths <M>{"d_1, \\dots, d_k"}</M> (each at least 3), every node has 2k neighbours, the
          largest distance between nodes is <M>{"\\sum_i \\lfloor d_i/2 \\rfloor"}</M>, and cutting the largest dimension in
          half severs <M>{"2N/d_{\\max}"}</M> links, where N is the number of nodes.
        </p>
      </Theorem>
      <Proof>
        <p>
          A node differs from its neighbours by ±1 in one coordinate, with wrap-around, giving 2 per dimension. Moving
          between two nodes, each coordinate can be changed independently along a ring of <M>{"d_i"}</M> nodes, where the
          shorter way round is at most <M>{"\\lfloor d_i/2 \\rfloor"}</M> steps, and opposite nodes need exactly that. Cutting
          dimension j into two halves crosses each of the <M>{"N/d_j"}</M> rings along it twice, once in the middle and once
          at the wrap-around, so <M>{"2N/d_j"}</M> links; this is smallest for the largest <M>{"d_j"}</M>. A TPU v4 pod of 4096
          chips is a 16 × 16 × 16 torus: diameter 24, bisection 512 links.
        </p>
        <Code>{TORUS}</Code>
      </Proof>

      <Example title="the cost of data parallelism">
        <p>
          A 7-billion-parameter model in bf16 has 14 GB of gradients. Ring all-reduce over 8 GPUs moves{" "}
          <M>{"1.75 \\times 14"}</M> GB per GPU: about 54 ms over NVLink at 450 GB/s, but about 490 ms over a single 50 GB/s
          network port. That is why gradients are all-reduced within a server over NVLink before crossing the slower network,
          why the transfer is overlapped with the backward pass of earlier layers, and why sharded methods such as ZeRO
          (e6.4.4) use reduce-scatter and all-gather, the two halves of the ring, separately.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "ring",
      rung: "check",
      prompt: <p>Ignoring latency, how long does a ring all-reduce of 2 GB over 8 GPUs take at 450 GB/s per link, in milliseconds? Give three decimals.</p>,
      answer: { kind: "numeric", value: 7.778, tolerance: 0.0006 },
    },
    {
      key: "diam",
      rung: "check",
      prompt: <p>What is the diameter, in hops, of a 16 × 16 × 16 torus?</p>,
      answer: { kind: "numeric", value: 24, tolerance: 0 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>Why do collective libraries use trees for small messages and rings for large ones?</p>,
      answer: {
        kind: "choice",
        options: [
          "A ring pays latency 2(p − 1) times but sends less than twice the data; a tree pays latency only about 2 log p times but sends the whole message at every level",
          "Rings cannot carry small messages",
          "Trees are only correct for large messages",
          "Rings need more memory on each GPU than trees",
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

def ring_allreduce(vectors):
    p, n = len(vectors), len(vectors[0])
    c = n // p
    buf = [list(v) for v in vectors]
    sent = 0
    for phase in ('reduce', 'gather'):
        for step in range(p - 1):
            msgs = []
            for i in range(p):
                k = (i - step) % p if phase == 'reduce' else (i + 1 - step) % p
                msgs.append(((i + 1) % p, k, buf[i][k * c:(k + 1) * c]))
            for dst, k, chunk in msgs:
                for q, x in enumerate(chunk):
                    buf[dst][k * c + q] = buf[dst][k * c + q] + x if phase == 'reduce' else x
                sent += len(chunk)
    return buf, 2 * (p - 1), sent // p

def ring_time(nbytes, p, alpha, beta):
    return 2 * (p - 1) * alpha + 2 * (p - 1) / p * nbytes / beta

def tree_time(nbytes, p, alpha, beta):
    return 2 * math.ceil(math.log2(p)) * (alpha + nbytes / beta)

print(ring_allreduce([[1, 2, 3], [10, 20, 30], [100, 200, 300]]), ring_allreduce([[1, 2], [3, 4]])[1:])
print(round(ring_time(1e9, 8, 1e-5, 1e11), 5), round(tree_time(1e9, 8, 1e-5, 1e11), 4), ring_time(8, 8, 1e-5, 1e11) > tree_time(8, 8, 1e-5, 1e11))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "([[111, 222, 333], [111, 222, 333], [111, 222, 333]], 4, 4) (2, 2)\n0.01764 0.0601 True",
          "([[111, 222, 333], [111, 222, 333], [111, 222, 333]], 4, 6) (2, 2)\n0.01764 0.0601 True",
          "([[111, 222, 333], [111, 222, 333], [111, 222, 333]], 4, 4) (2, 2)\n0.01764 0.0601 False",
          "([[111, 222, 333], [111, 222, 333], [111, 222, 333]], 6, 4) (2, 4)\n0.02 0.0601 True",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def torus_neighbors(coord, dims):
    out = set()
    for axis, size in enumerate(dims):
        for step in (-1, 1):
            c = list(coord)
            c[axis] = (c[axis] + step) % size
            if tuple(c) != tuple(coord):
                out.add(tuple(c))
    return sorted(out)

def torus_diameter(dims):
    return sum(d // 2 for d in dims)

def bisection_links(dims):
    big = max(dims)
    rest = 1
    for d in dims:
        rest *= d
    return rest // big * (2 if big > 2 else 1)

print(torus_neighbors((0, 0), (4, 4)), torus_neighbors((0, 1), (2, 3)), len(torus_neighbors((1, 1, 1), (4, 4, 4))))
print(torus_diameter((4, 4, 4)), torus_diameter((16, 16)), bisection_links((4, 4, 4)), bisection_links((8, 4)), bisection_links((2, 2)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(0, 1), (0, 3), (1, 0), (3, 0)] [(0, 0), (0, 2), (1, 1)] 6\n6 16 32 8 2",
          "[(0, 1), (0, 3), (1, 0), (3, 0)] [(0, 0), (0, 2), (1, 1), (1, 1)] 6\n6 16 32 8 2",
          "[(0, 1), (1, 0)] [(0, 0), (0, 2), (1, 1)] 6\n6 16 32 8 2",
          "[(0, 1), (0, 3), (1, 0), (3, 0)] [(0, 0), (0, 2), (1, 1)] 6\n12 32 16 4 2",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ring_allreduce(vectors)</C>, simulating reduce-scatter and then all-gather on p nodes whose vectors have a
          length divisible by p, with all sends of a step taken from the state before the step, and returning (the final
          vectors, the number of steps, the elements sent per node); <C>ring_time(nbytes, p, alpha, beta)</C>; and{" "}
          <C>tree_time(nbytes, p, alpha, beta)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def ring_allreduce(vectors):
    total = [sum(c) for c in zip(*vectors)]
    return [total[:] for _ in vectors], 0, 0

def ring_time(nbytes, p, alpha, beta):
    return nbytes / beta

def tree_time(nbytes, p, alpha, beta):
    return nbytes / beta
`,
        solution: RING,
        tests: [
          { name: "simulation", code: `import random
r = random.Random(1)
for p, c in [(2, 1), (3, 1), (5, 2), (4, 3)]:
    v = [[r.randint(-9, 9) for _ in range(p * c)] for _ in range(p)]
    out, steps, sent = ring_allreduce(v)
    s = [sum(col) for col in zip(*v)]
    assert all(o == s for o in out) and steps == 2 * (p - 1) and sent == 2 * (p - 1) * c, (p, c, steps, sent)
out, steps, sent = ring_allreduce([[5, 7]])
assert out == [[5, 7]] and steps == 0 and sent == 0` },
          { name: "times", code: `assert abs(ring_time(1e9, 8, 1e-5, 1e11) - (14e-5 + 1.75e-2)) < 1e-12 and abs(tree_time(1e9, 8, 1e-5, 1e11) - 6 * (1e-5 + 1e-2)) < 1e-12
assert abs(tree_time(1, 5, 1, 1) - 12) < 1e-12 and ring_time(10, 1, 3, 1) == 0
assert ring_time(1882352, 8, 1e-5, 1e11) >= tree_time(1882352, 8, 1e-5, 1e11) and ring_time(1882353, 8, 1e-5, 1e11) < tree_time(1882353, 8, 1e-5, 1e11)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>torus_neighbors(coord, dims)</C>, the sorted distinct neighbours of a node, excluding itself;{" "}
          <C>torus_diameter(dims)</C>; and <C>bisection_links(dims)</C>, the links severed by cutting the largest dimension in
          half, counting the wrap-around only when that dimension has more than 2 nodes.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def torus_neighbors(coord, dims):
    return []

def torus_diameter(dims):
    return 0

def bisection_links(dims):
    return 0
`,
        solution: TORUS,
        tests: [
          { name: "neighbours", code: `assert torus_neighbors((0, 0), (4, 4)) == [(0, 1), (0, 3), (1, 0), (3, 0)] and torus_neighbors((0, 1), (2, 3)) == [(0, 0), (0, 2), (1, 1)]
assert len(torus_neighbors((1, 1, 1), (4, 4, 4))) == 6 and torus_neighbors((0,), (1,)) == [] and torus_neighbors((2,), (5,)) == [(1,), (3,)]` },
          { name: "diameter and bisection", code: `assert torus_diameter((4, 4, 4)) == 6 and torus_diameter((16, 16, 16)) == 24 and torus_diameter((5, 3)) == 3
assert bisection_links((4, 4, 4)) == 32 and bisection_links((8, 4)) == 8 and bisection_links((2, 2)) == 2 and bisection_links((16, 16, 16)) == 512` },
        ],
      },
    },
    {
      key: "cross",
      rung: "stretch",
      prompt: (
        <p>
          With p = 8, α = 10 µs and β = 100 GB/s (10<sup>11</sup> bytes per second), what is the smallest whole number of
          bytes for which ring all-reduce is faster than the tree?
        </p>
      ),
      answer: { kind: "numeric", value: 1882353, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        We have the hardware and the models of its speed. The last chapter applies them to the transformer: its FLOPs, and
        the memory it needs for training and for inference.
      </p>
    </>
  ),
};
