import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ActivationMemoryViz } from "@/components/viz/ActivationMemoryViz";
import type { LessonContent } from "@/lib/types";

const ACT = `def act_bytes_layer(s, b, d, heads, recompute='none', tp=1):
    if recompute == 'full':
        return 2 * s * b * d
    per = 10 + 24 / tp
    if recompute == 'none':
        per += 5 * heads * s / (d * tp)
    return s * b * d * per

def checkpoint_memory(layers, layer_act, input_bytes, k):
    return -(-layers // k) * input_bytes + k * layer_act

def best_k(layers, layer_act, input_bytes):
    return min(range(1, layers + 1), key=lambda k: (checkpoint_memory(layers, layer_act, input_bytes, k), k))`;

const BUDGET = `import math

def max_micro_batch(gpu_bytes, state_bytes, act_per_sample):
    return max(0, int((gpu_bytes - state_bytes) // act_per_sample))

def accum_steps(global_batch, micro, gpus):
    return math.ceil(global_batch / (micro * gpus))

def state_bytes(params, gpus=1, zero_stage=0):
    weights, grads, opt = 2 * params, 2 * params, 12 * params
    return weights / (gpus if zero_stage >= 3 else 1) + grads / (gpus if zero_stage >= 2 else 1) + opt / (gpus if zero_stage >= 1 else 1)`;

export const lesson: LessonContent = {
  id: "e7.6.2",
  minutes: 55,
  links: {
    requires: ["e7.6.1", "e6.4.4"],
    revisits: ["e7.5.3"],
    foreshadows: ["e7.6.3"],
  },

  puzzle: (
    <>
      <p>
        A 7-billion-parameter model&apos;s weights, gradients and optimiser state take about 108 GB, so sharding them over
        eight 80 GB GPUs leaves more than 60 GB free on each. Yet training with 4096-token sequences runs out of memory
        before a single sequence finishes its forward pass. What is filling the memory, and why does recomputing part of the
        forward pass, which makes training slower, let the same run fit three sequences per GPU?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The backward pass needs the intermediate results of the forward pass: to get a weight&apos;s gradient you need the
        input that weight multiplied. So every layer keeps its activations until the backward pass reaches it. They grow
        with the batch, the sequence and the width, and attention adds a term that grows with the square of the sequence.
        Anything not stored can be recomputed when needed, trading FLOPs for memory.
      </p>
      <ActivationMemoryViz />
    </>
  ),

  theory: (
    <>
      <Definition title="what training memory holds">
        <p>
          Training memory is <em>model state</em> (in mixed precision with Adam, 16 bytes per parameter, divided by ZeRO
          sharding as in e6.4.4), <em>activations</em> saved for the backward pass, and temporary workspace. Model state
          depends only on the model; activations depend on the micro-batch b, the sequence length s, the width d and the
          number of heads a.
        </p>
        <Code>{BUDGET}</Code>
      </Definition>

      <Theorem title="activations of a transformer layer">
        <p>
          For a GPT-style layer (4d MLP with GeLU, dropout) in 16-bit precision, the activations saved for the backward pass
          take (Korthikanti et al., 2022)
        </p>
        <MD>{"sbd\\Bigl(34 + \\frac{5as}{d}\\Bigr) \\text{ bytes},"}</MD>
        <p>
          and with t-way tensor parallelism <M>{"sbd(10 + 24/t + 5as/(dt))"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Count what each operation keeps, at 2 bytes per value and 1 per dropout-mask entry. Attention: the input to the
          QKV projection, 2sbd; Q and K for the scores, 4sbd; the softmax output, <M>{"2as^2b"}</M>; its dropout mask,{" "}
          <M>{"as^2b"}</M>; the dropout output for the product with V, <M>{"2as^2b"}</M>; V, 2sbd; the output projection&apos;s
          input, 2sbd; and its dropout mask, sbd: <M>{"11sbd + 5as^2b"}</M>. MLP: its input, 2sbd; the first layer&apos;s
          output, 8sbd; the GeLU output, 8sbd; a dropout mask, sbd: 19sbd. Two layer norms keep their inputs, 4sbd. The total
          is <M>{"34sbd + 5as^2b"}</M>. Tensor parallelism splits everything inside the attention and MLP blocks, all but
          10sbd, over t devices.
        </p>
        <Code>{ACT}</Code>
      </Proof>

      <Example title="recomputation">
        <p>
          The <M>{"5as^2b"}</M> term is the score matrix, quadratic in s: for the 7B shape at s = 4096 it is 160 of every 194
          bytes. <em>Selective recomputation</em> drops it and recomputes the softmax in the backward pass, which costs few
          FLOPs; FlashAttention never stores it at all, for the same reason. <em>Full recomputation</em> keeps only each
          layer&apos;s input, 2sbd, and reruns the whole layer in the backward pass, costing a fourth forward pass (e7.6.1).
          In the viz, store-everything needs 104 GB per sequence; selective needs 18 GB; full needs about 1 GB.
        </p>
      </Example>

      <Theorem title="checkpointing every k layers">
        <p>
          If each of L layers has activations a when stored in full and input i, keeping only the inputs of every k-th
          layer and recomputing one segment of k layers at a time uses
        </p>
        <MD>{"\\Bigl\\lceil \\frac{L}{k} \\Bigr\\rceil i + k a"}</MD>
        <p>
          of memory, which is minimised near <M>{"k = \\sqrt{Li/a}"}</M> at about <M>{"2\\sqrt{Lia}"}</M>, growing only as
          the square root of the depth.
        </p>
      </Theorem>
      <Proof>
        <p>
          The stored checkpoints are the inputs of <M>{"\\lceil L/k \\rceil"}</M> segments. During the backward pass one
          segment at a time is recomputed from its checkpoint with all k layers&apos; activations held, then freed. Ignoring
          the ceiling, <M>{"Li/k + ka"}</M> has derivative <M>{"-Li/k^2 + a"}</M>, zero at <M>{"k = \\sqrt{Li/a}"}</M>, where the
          two terms are equal and their sum is <M>{"2\\sqrt{Lia}"}</M>; <C>best_k</C> searches the whole numbers. Each layer is
          recomputed once, so the extra cost is one forward pass, as for full recomputation (Chen et al., 2016).
        </p>
      </Proof>

      <Remark title="micro-batches and accumulation">
        <p>
          Memory fixes the micro-batch; the optimiser wants a global batch, often millions of tokens. The difference is made
          up by gradient accumulation: run several micro-batches, sum their gradients, then step. The global batch is the
          micro-batch times the number of data-parallel GPUs times the accumulation steps, so freeing memory for a larger
          micro-batch reduces the accumulation steps rather than changing the training.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "layer",
      rung: "check",
      prompt: <p>How many GB (10<sup>9</sup> bytes) of activations does one layer store with s = 2048, b = 4, d = 4096 and 32 heads, without recomputation or tensor parallelism? Give three decimals.</p>,
      answer: { kind: "numeric", value: 3.825, tolerance: 0.0006 },
    },
    {
      key: "accum",
      rung: "check",
      prompt: <p>A global batch of 2048 sequences is trained on 64 GPUs with a micro-batch of 2 sequences each. How many accumulation steps are needed?</p>,
      answer: { kind: "numeric", value: 16, tolerance: 0 },
    },
    {
      key: "selective",
      rung: "apply",
      prompt: <p>Why does selective recomputation save much of the activation memory for little extra compute?</p>,
      answer: {
        kind: "choice",
        options: [
          "It recomputes only the attention scores and softmax, whose memory grows with the square of the sequence but whose FLOPs are a small share",
          "It recomputes the MLP, which has no FLOPs",
          "It stores activations in 8 bits instead of 16",
          "It skips the backward pass for attention",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def act_bytes_layer(s, b, d, heads, recompute='none', tp=1):
    if recompute == 'full':
        return 2 * s * b * d
    per = 10 + 24 / tp
    if recompute == 'none':
        per += 5 * heads * s / (d * tp)
    return s * b * d * per

def checkpoint_memory(layers, layer_act, input_bytes, k):
    return -(-layers // k) * input_bytes + k * layer_act

def best_k(layers, layer_act, input_bytes):
    return min(range(1, layers + 1), key=lambda k: (checkpoint_memory(layers, layer_act, input_bytes, k), k))

print(act_bytes_layer(2048, 1, 12288, 96) / 1e9, act_bytes_layer(2048, 1, 12288, 96, 'selective') / 1e9, act_bytes_layer(2048, 1, 12288, 96, 'full') / 1e6)
print(act_bytes_layer(1, 1, 1, 1, tp=2), checkpoint_memory(32, 10, 1, 4), checkpoint_memory(32, 10, 1, 1), best_k(32, 10, 1), best_k(100, 1, 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.868903936 0.855638016 50.331648\n24.5 48 42 2 10",
          "2.868903936 0.855638016 50.331648\n34.0 48 42 2 10",
          "2.868903936 0.855638016 50.331648\n24.5 48 42 1 10",
          "0.855638016 2.868903936 50.331648\n24.5 48 42 2 10",
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

def max_micro_batch(gpu_bytes, state_bytes, act_per_sample):
    return max(0, int((gpu_bytes - state_bytes) // act_per_sample))

def accum_steps(global_batch, micro, gpus):
    return math.ceil(global_batch / (micro * gpus))

def state_bytes(params, gpus=1, zero_stage=0):
    weights, grads, opt = 2 * params, 2 * params, 12 * params
    return weights / (gpus if zero_stage >= 3 else 1) + grads / (gpus if zero_stage >= 2 else 1) + opt / (gpus if zero_stage >= 1 else 1)

print(max_micro_batch(80e9, 13.5e9, 18.3e9), max_micro_batch(80e9, 90e9, 1e9), accum_steps(1024, 4, 64), accum_steps(1000, 3, 8))
print(state_bytes(7e9) / 1e9, state_bytes(7e9, 8, 1) / 1e9, state_bytes(7e9, 8, 3) / 1e9)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3 0 4 42\n112.0 38.5 14.0",
          "3 -1 4 42\n112.0 38.5 14.0",
          "3 0 4 41\n112.0 38.5 14.0",
          "3 0 4 42\n112.0 14.0 14.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>act_bytes_layer(s, b, d, heads, recompute=&apos;none&apos;, tp=1)</C> for &apos;none&apos;,
          &apos;selective&apos; and &apos;full&apos;, where full keeps only the layer&apos;s 16-bit input;{" "}
          <C>checkpoint_memory(layers, layer_act, input_bytes, k)</C>; and <C>best_k(layers, layer_act, input_bytes)</C>, the
          k from 1 to layers with the least memory, the smallest on a tie.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def act_bytes_layer(s, b, d, heads, recompute='none', tp=1):
    return 0

def checkpoint_memory(layers, layer_act, input_bytes, k):
    return layers * layer_act

def best_k(layers, layer_act, input_bytes):
    return 1
`,
        solution: ACT,
        tests: [
          { name: "activations", code: `assert act_bytes_layer(2048, 1, 12288, 96) == 2048 * 12288 * 114 and act_bytes_layer(2048, 1, 12288, 96, 'selective') == 2048 * 12288 * 34
assert act_bytes_layer(2048, 1, 12288, 96, 'full') == 2 * 2048 * 12288 and act_bytes_layer(1, 1, 1, 1, tp=2) == 24.5
assert abs(act_bytes_layer(2048, 4, 4096, 32) / 1e9 - 3.825205248) < 1e-9 and act_bytes_layer(10, 3, 8, 2, 'selective', tp=4) == 10 * 3 * 8 * 16` },
          { name: "checkpointing", code: `assert checkpoint_memory(32, 10, 1, 4) == 48 and checkpoint_memory(32, 10, 1, 1) == 42 and checkpoint_memory(10, 1, 1, 3) == 7
assert best_k(32, 10, 1) == 2 and best_k(100, 1, 1) == 10 and best_k(1, 5, 5) == 1 and best_k(4, 1, 1) == 2` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>max_micro_batch(gpu_bytes, state_bytes, act_per_sample)</C>, never below 0;{" "}
          <C>accum_steps(global_batch, micro, gpus)</C>; and <C>state_bytes(params, gpus=1, zero_stage=0)</C>, with 2 bytes of
          weights, 2 of gradients and 12 of optimiser state per parameter, sharded by ZeRO stages 1 to 3.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def max_micro_batch(gpu_bytes, state_bytes, act_per_sample):
    return 1

def accum_steps(global_batch, micro, gpus):
    return 1

def state_bytes(params, gpus=1, zero_stage=0):
    return 16 * params
`,
        solution: BUDGET,
        tests: [
          { name: "batches", code: `assert max_micro_batch(80e9, 13.5e9, 18.3e9) == 3 and max_micro_batch(80e9, 90e9, 1e9) == 0 and max_micro_batch(10, 4, 2) == 3
assert accum_steps(1024, 4, 64) == 4 and accum_steps(1000, 3, 8) == 42 and accum_steps(2048, 2, 64) == 16` },
          { name: "state", code: `assert state_bytes(7e9) == 112e9 and state_bytes(7e9, 8, 1) == 38.5e9 and state_bytes(7e9, 8, 3) == 14e9
assert state_bytes(1, 4, 2) == 2 + 0.5 + 3 and state_bytes(1, 4, 0) == 16` },
        ],
      },
    },
    {
      key: "segments",
      rung: "stretch",
      prompt: (
        <p>
          A layer&apos;s full activations are 17 times its input. With 128 layers and checkpoints every k layers, what is the
          least memory, in units of one layer&apos;s input, over whole numbers k?
        </p>
      ),
      answer: { kind: "numeric", value: 94, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Inference keeps no activations for a backward pass, but it keeps something else that grows with every token
        generated: the key-value cache. The last lesson counts it, and what it costs in memory and bandwidth.
      </p>
    </>
  ),
};
