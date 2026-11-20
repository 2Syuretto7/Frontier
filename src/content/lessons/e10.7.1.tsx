import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MeshLayoutViz } from "@/components/viz/MeshLayoutViz";
import type { LessonContent } from "@/lib/types";

const RANKS = `def coords(rank, dims):
    c = {}
    for name, size in reversed(dims):               # dims are listed outermost first
        c[name] = rank % size
        rank //= size
    return {name: c[name] for name, _ in dims}

def rank_of(c, dims):
    r = 0
    for name, size in dims:
        r = r * size + c[name]
    return r

def groups(dims, name):
    out, index = [], {}
    n = 1
    for _, size in dims:
        n *= size
    for r in range(n):                              # ranks agreeing on every other coordinate
        c = coords(r, dims)
        key = tuple(v for k, v in c.items() if k != name)
        if key not in index:
            index[key] = len(out)
            out.append([])
        out[index[key]].append(r)
    return out`;

const PER_GPU = `def per_gpu_params(P, tp, pp):
    return P / (tp * pp)                            # tensor and pipeline parallelism partition the weights

def dp_grad_bytes(P, tp, pp, dp):
    return 2 * (dp - 1) / dp * 2 * per_gpu_params(P, tp, pp)   # ring all-reduce of bf16 gradients

def bubble(G, dp, mb, pp):
    m = G // (dp * mb)                              # micro-batches each pipeline runs per step
    return (pp - 1) / (m + pp - 1)`;

const TORCH = `from torch.distributed.device_mesh import init_device_mesh

mesh = init_device_mesh("cuda", (16, 8, 8), mesh_dim_names=("dp", "pp", "tp"))
tp_group = mesh["tp"].get_group()     # 8 consecutive ranks: one node
pp_group = mesh["pp"].get_group()     # stride 8: one GPU from each of 8 nodes
dp_group = mesh["dp"].get_group()     # stride 64: replicas of the same shard`;

export const lesson: LessonContent = {
  id: "e10.7.1",
  minutes: 45,
  links: {
    requires: ["e10.5.2", "e10.4.1", "e10.3.1"],
    revisits: ["e10.1.1", "e6.5.4"],
    foreshadows: ["e10.7.2", "e10.7.3"],
  },

  puzzle: (
    <>
      <p>
        A 70-billion-parameter model trains on 1024 GPUs, 8 per node, with 8-way tensor parallelism, 8 pipeline stages and 16 data
        replicas. Rank 1000 must know which GPUs it exchanges activations with, which it all-reduces gradients with, and which it splits
        each matrix with. How are the ranks numbered so that each collective runs over the right links, and what does each GPU then
        hold and send?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Lay the GPUs out as a grid with one axis per kind of parallelism, dp × pp × tp. A rank&apos;s position on the grid is its
        coordinates; the GPUs that agree on every coordinate but one form that dimension&apos;s process group. Number the ranks so the
        dimension with the most traffic varies fastest. Ranks on the same node are consecutive, so the tensor-parallel groups, which
        communicate inside every layer, land inside a node, and the data-parallel groups, which communicate once per step, span nodes.
      </p>
      <MeshLayoutViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the device mesh">
        <p>
          With dimensions listed outermost first, sizes <M>{"n_1, \\dots, n_D"}</M>, rank r has mixed-radix coordinates, the last
          varying fastest (<C>coords</C>, <C>rank_of</C>). The group of dimension i containing r is the set of ranks whose other
          coordinates match r&apos;s; the groups of one dimension partition the ranks (<C>groups</C>). Each group gets its own
          communicator.
        </p>
        <Code>{RANKS}</Code>
        <Code>{TORCH}</Code>
      </Definition>

      <Theorem title="what each dimension costs a GPU">
        <p>
          On a dp × pp × tp mesh, a GPU holds <M>{"P/(t\\,p)"}</M> of the weights; its data-parallel all-reduce moves{" "}
          <M>{"2\\frac{d-1}{d}\\cdot 2P/(tp)"}</M> bytes per step in bf16; each pipeline runs <M>{"m = G/(d\\,\\mu)"}</M>{" "}
          micro-batches for global batch G and micro-batch μ, so the bubble is <M>{"(p - 1)/(m + p - 1)"}</M>; and the tensor-parallel
          all-reduces move activations inside every layer of the GPU&apos;s stage (e10.4.1).
        </p>
      </Theorem>
      <Proof>
        <p>
          Tensor parallelism splits each of a stage&apos;s matrices t ways and pipeline parallelism gives each stage L/p layers, so
          the weights are split tp ways (<C>per_gpu_params</C>, e10.1.1). Data-parallel replicas hold the same shard and average its
          gradients, a ring all-reduce over d members (<C>dp_grad_bytes</C>). The global batch is split over d replicas, and each
          replica&apos;s share is split into micro-batches of μ for its pipeline (<C>bubble</C>, e10.5.1).
        </p>
        <Code>{PER_GPU}</Code>
      </Proof>

      <Remark title="the order of dimensions">
        <p>
          The innermost dimension gets consecutive ranks, the next one stride equal to the innermost size, and so on. Tensor parallelism
          communicates most, activations in every layer and direction, so it is innermost and sized to fit a node. Context and expert
          parallelism, which also move activations, come next. Pipeline parallelism sends one activation per micro-batch per boundary,
          and data parallelism one gradient exchange per step, both tolerant of slower links, so they go outermost. Expert parallelism
          usually reuses the data-parallel ranks for the MoE layers, so it is a different way of folding the same GPUs rather than a
          further factor.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          With dimensions (dp, pp, tp) = (16, 8, 8) and tp innermost, rank 1000 has coordinates (15, 5, 0): it is GPU 0 of its node,
          on pipeline stage 5 of replica 15. Its tensor-parallel group is ranks 1000 to 1007, all on one node; its pipeline group is
          the ranks 15·64 + 8s for s = 0 to 7; and its data-parallel group is 16 ranks spaced 64 apart, one per replica. Each GPU holds 1/64 of the weights
          and all-reduces their gradients with 15 other GPUs on other nodes.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "partner",
      rung: "check",
      prompt: (
        <p>
          On the mesh (dp, pp, tp) = (16, 8, 8) with tp innermost, which rank has the same pipeline stage and tensor index as rank 1000
          but data-parallel index 3?
        </p>
      ),
      answer: { kind: "numeric", value: 232, tolerance: 0 },
    },
    {
      key: "grads",
      rung: "check",
      prompt: (
        <p>
          On that mesh, a 70-billion-parameter model all-reduces bf16 gradients over each data-parallel group. How many gigabytes does
          each GPU send per step? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 4.1, tolerance: 0.01 },
    },
    {
      key: "inner",
      rung: "apply",
      prompt: <p>Why is the tensor-parallel dimension placed innermost?</p>,
      answer: {
        kind: "choice",
        options: [
          "It communicates activations in every layer, so its groups should be consecutive ranks on one node with the fastest links",
          "It has the largest size",
          "Its collectives are the smallest",
          "Pipeline parallelism requires consecutive ranks",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def coords(rank, dims):
    c = {}
    for name, size in reversed(dims):               # dims are listed outermost first
        c[name] = rank % size
        rank //= size
    return {name: c[name] for name, _ in dims}

def rank_of(c, dims):
    r = 0
    for name, size in dims:
        r = r * size + c[name]
    return r

def groups(dims, name):
    out, index = [], {}
    n = 1
    for _, size in dims:
        n *= size
    for r in range(n):                              # ranks agreeing on every other coordinate
        c = coords(r, dims)
        key = tuple(v for k, v in c.items() if k != name)
        if key not in index:
            index[key] = len(out)
            out.append([])
        out[index[key]].append(r)
    return out

dims = [('dp', 2), ('pp', 2), ('tp', 2)]
print(coords(5, dims), rank_of({'dp': 1, 'pp': 0, 'tp': 1}, dims), groups(dims, 'pp'))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'dp': 1, 'pp': 0, 'tp': 1} 5 [[0, 2], [1, 3], [4, 6], [5, 7]]",
          "{'dp': 1, 'pp': 0, 'tp': 1} 5 [[0, 1], [2, 3], [4, 5], [6, 7]]",
          "{'dp': 1, 'pp': 0, 'tp': 1} 5 [[0, 4], [1, 5], [2, 6], [3, 7]]",
          "{'dp': 1, 'pp': 1, 'tp': 0} 6 [[0, 2], [1, 3], [4, 6], [5, 7]]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def per_gpu_params(P, tp, pp):
    return P / (tp * pp)                            # tensor and pipeline parallelism partition the weights

def dp_grad_bytes(P, tp, pp, dp):
    return 2 * (dp - 1) / dp * 2 * per_gpu_params(P, tp, pp)   # ring all-reduce of bf16 gradients

def bubble(G, dp, mb, pp):
    m = G // (dp * mb)                              # micro-batches each pipeline runs per step
    return (pp - 1) / (m + pp - 1)

x = per_gpu_params(64e9, 8, 4) / 1e9
print(x, dp_grad_bytes(64e9, 8, 4, 4) / 1e9, round(bubble(256, 8, 2, 4), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["2.0 6.0 0.1579", "2.0 8.0 0.1579", "16.0 6.0 0.1579", "2.0 6.0 0.1875"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          With dims a list of (name, size) pairs, outermost first, write <C>coords(rank, dims)</C>, returning a dictionary in the same
          order; <C>rank_of(c, dims)</C>; and <C>groups(dims, name)</C>, the process groups of one dimension, each in increasing rank
          order and listed by their smallest rank.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def coords(rank, dims):
    return {}

def rank_of(c, dims):
    return 0

def groups(dims, name):
    return []
`,
        solution: RANKS,
        tests: [
          { name: "coords", code: `d = [('a', 3), ('b', 4)]\nassert coords(7, d) == {'a': 1, 'b': 3} and rank_of({'a': 2, 'b': 1}, d) == 9\nd3 = [('x', 2), ('y', 3), ('z', 4)]\nassert all(rank_of(coords(r, d3), d3) == r for r in range(24))` },
          { name: "groups", code: `d = [('a', 3), ('b', 4)]\nassert groups(d, 'a') == [[0, 4, 8], [1, 5, 9], [2, 6, 10], [3, 7, 11]] and groups(d, 'b') == [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11]]\nassert groups([('x', 2), ('y', 2), ('z', 2)], 'x') == [[0, 4], [1, 5], [2, 6], [3, 7]]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>per_gpu_params(P, tp, pp)</C>; <C>dp_grad_bytes(P, tp, pp, dp)</C>, bytes each GPU sends in a ring all-reduce of
          its bf16 gradients; and <C>bubble(G, dp, mb, pp)</C>, the 1F1B bubble when the global batch G is split over dp replicas in
          micro-batches of mb.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def per_gpu_params(P, tp, pp):
    return P

def dp_grad_bytes(P, tp, pp, dp):
    return 0.0

def bubble(G, dp, mb, pp):
    return 0.0
`,
        solution: PER_GPU,
        tests: [
          { name: "params", code: `assert per_gpu_params(100, 5, 2) == 10.0 and dp_grad_bytes(100, 5, 2, 4) == 30.0` },
          { name: "bubble", code: `assert abs(bubble(64, 4, 2, 3) - 0.2) < 1e-12 and bubble(64, 4, 2, 1) == 0.0` },
        ],
      },
    },
    {
      key: "count",
      rung: "stretch",
      prompt: (
        <p>
          On the mesh (dp, pp, tp) = (16, 8, 8), how many process groups are there in total across the three dimensions?
        </p>
      ),
      answer: { kind: "numeric", value: 320, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        This lesson took the sizes 16, 8 and 8 as given. The next one chooses them: given a model, a cluster and a batch size, which
        mesh fits in memory and runs fastest?
      </p>
    </>
  ),
};
