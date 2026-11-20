import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ChatTemplateViz } from "@/components/viz/ChatTemplateViz";
import type { LessonContent } from "@/lib/types";

const RENDER = `def segments(messages):
    out = []
    for m in messages:
        train = m["role"] == "assistant"
        out.append(("<|im_start|>" + m["role"] + "\\n", False))
        out.append((m["content"], train))
        out.append(("<|im_end|>\\n", train))
    return out

def render(messages, add_generation_prompt=False):
    text = "".join(t for t, _ in segments(messages))
    return text + ("<|im_start|>assistant\\n" if add_generation_prompt else "")

def trained_chars(messages):
    return sum(len(t) for t, train in segments(messages) if train)`;

const PARSE = `SPECIALS = ["<|im_start|>", "<|im_end|>"]

def strip_specials(text):
    for s in SPECIALS:
        text = text.replace(s, "")
    return text

def parse(rendered):
    msgs = []
    for block in rendered.split("<|im_start|>")[1:]:
        if "<|im_end|>" not in block:
            continue
        head, rest = block.split("\\n", 1)
        msgs.append({"role": head, "content": rest.split("<|im_end|>")[0]})
    return msgs

def awaiting_reply(rendered):
    return rendered.endswith("<|im_start|>assistant\\n")`;

export const lesson: LessonContent = {
  id: "l9.1.2",
  minutes: 40,
  links: {
    requires: ["l9.1.1"],
    revisits: ["l5.1.1"],
    foreshadows: ["l9.1.3", "l9.8.3"],
  },

  puzzle: (
    <>
      <p>
        A team fine-tunes a model and finds that it answers well but never stops: after its reply it writes a new user turn,
        answers that too, and runs to the token limit. Another team serves a fine-tuned model and gets worse answers than in
        their evaluations, and traces it to a single missing newline. A third finds that a user can make the model reveal its
        system prompt by typing a few odd strings. All three are problems with how a conversation becomes tokens.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A model sees one sequence of tokens. A chat template turns a list of messages, each with a role, into that sequence,
        using special tokens to mark where each turn begins and ends and who is speaking. The model learns the template during
        fine-tuning, so inference must reproduce it exactly, the end-of-turn token must be among the trained tokens so the model
        learns to stop, and users must not be able to produce the special tokens themselves.
      </p>
      <ChatTemplateViz />
    </>
  ),

  theory: (
    <>
      <Definition title="a chat template">
        <p>
          In the ChatML format each message becomes <C>{"<|im_start|>"}</C>, the role and a newline, the content, then <C>{"<|im_end|>"}</C>. The
          rendering is a list of segments with a training flag (<C>segments</C>): headers are never trained, while the content and
          end token of assistant messages are. Joining the segments gives the text, and at inference a final assistant header,
          the generation prompt, asks the model to reply (<C>render</C>). The trained part is what the loss mask of l9.1.1 covers
          (<C>trained_chars</C>). Llama 3 uses <C>{"<|start_header_id|>"}</C>, the role, <C>{"<|end_header_id|>"}</C> and two newlines, and ends turns
          with <C>{"<|eot_id|>"}</C>; the structure is the same.
        </p>
        <Code>{RENDER}</Code>
      </Definition>

      <Theorem title="packing a conversation into one example">
        <p>
          A conversation of T turns, each adding c tokens, costs <M>{"Tc"}</M> tokens of computation as one example with every assistant
          turn trained. Splitting it into T examples, the k-th ending at turn k, costs <M>{"cT(T+1)/2"}</M>, a factor <M>{"(T+1)/2"}</M> more, for
          the same set of trained tokens.
        </p>
      </Theorem>
      <Proof>
        <p>
          The k-th split example contains the first k turns, <M>{"kc"}</M> tokens, and trains only its last assistant turn. Summing,{" "}
          <M>{"\\sum_{k=1}^{T} kc = cT(T+1)/2"}</M>. With causal attention, the prediction of each assistant token depends only on what precedes it,
          which is identical in both layouts, so the trained losses agree token for token.
        </p>
      </Proof>

      <Definition title="parsing and safety">
        <p>
          Serving systems parse model output back into messages (<C>parse</C>), and must know whether a rendered prompt is waiting
          for a reply (<C>awaiting_reply</C>). If user text could contain a special token, a user could close their own turn and
          write a fake assistant or system turn. Tokenisers therefore encode user content with special tokens disabled, so the
          string <C>{"<|im_end|>"}</C> becomes ordinary text tokens; a coarser defence removes the strings (<C>strip_specials</C>).
        </p>
        <Code>{PARSE}</Code>
      </Definition>

      <Remark title="how templates go wrong">
        <p>
          Templates live with the tokeniser, often as a small Jinja program, and serving code must apply the same one used in
          training. Common faults are a doubled beginning-of-sequence token when both the template and the tokeniser add one, a
          missing or extra newline or space after the header, a default system prompt present in training but not in serving,
          and an end token that was masked out of the loss, which leaves the model unable to stop. Each shifts the input slightly
          off the training distribution, and scores fall by a few points without any error being raised.
        </p>
      </Remark>

      <Example title="beyond user and assistant">
        <p>
          Tool use adds roles: the assistant emits a structured call, a tool message carries the result, and the assistant
          continues. Reasoning models add a separate channel or tagged block for the chain of thought before the final answer,
          and gpt-oss&apos;s harmony format names such channels explicitly. Every new role is another place where training and
          serving must agree, and another boundary a user must not be able to forge (l9.8.3).
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "trained",
      rung: "check",
      prompt: (
        <p>
          A template adds a 3-token header and a 1-token end marker to every message. A conversation has a system message of 30
          tokens, then user 25, assistant 60, user 15 and assistant 40. How many tokens are trained on?
        </p>
      ),
      answer: { kind: "numeric", value: 102, tolerance: 0.5 },
    },
    {
      key: "frac",
      rung: "check",
      prompt: <p>For the same conversation, what fraction of all its tokens are trained on? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.537, tolerance: 0.001 },
    },
    {
      key: "stop",
      rung: "apply",
      prompt: <p>A fine-tuned model keeps generating new user and assistant turns after its answer. What is the most likely cause?</p>,
      answer: {
        kind: "choice",
        options: [
          "The end-of-turn token after assistant replies was masked out of the loss, or missing from the training template, so the model never learned to emit it",
          "The learning rate was too high",
          "The system prompt was too long",
          "The model was trained on too few user turns",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def segments(messages):
    out = []
    for m in messages:
        train = m["role"] == "assistant"
        out.append(("<|im_start|>" + m["role"] + "\\n", False))
        out.append((m["content"], train))
        out.append(("<|im_end|>\\n", train))
    return out

def render(messages, add_generation_prompt=False):
    text = "".join(t for t, _ in segments(messages))
    return text + ("<|im_start|>assistant\\n" if add_generation_prompt else "")

def trained_chars(messages):
    return sum(len(t) for t, train in segments(messages) if train)

print(repr(render([{"role": "user", "content": "Hi"}], True)), trained_chars([{"role": "user", "content": "Hi"}, {"role": "assistant", "content": "Hello"}]))
print(render([], True) == "<|im_start|>assistant\\n", len(segments([{"role": "system", "content": ""}])))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "'<|im_start|>user\\nHi<|im_end|>\\n<|im_start|>assistant\\n' 16\nTrue 3",
          "'<|im_start|>user\\nHi<|im_end|>\\n<|im_start|>assistant\\n' 5\nTrue 3",
          "'<|im_start|>user\\nHi<|im_end|>\\n' 16\nTrue 3",
          "'<|im_start|>user\\nHi<|im_end|>\\n<|im_start|>assistant\\n' 16\nFalse 2",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`SPECIALS = ["<|im_start|>", "<|im_end|>"]

def strip_specials(text):
    for s in SPECIALS:
        text = text.replace(s, "")
    return text

def parse(rendered):
    msgs = []
    for block in rendered.split("<|im_start|>")[1:]:
        if "<|im_end|>" not in block:
            continue
        head, rest = block.split("\\n", 1)
        msgs.append({"role": head, "content": rest.split("<|im_end|>")[0]})
    return msgs

def awaiting_reply(rendered):
    return rendered.endswith("<|im_start|>assistant\\n")

print(strip_specials("a<|im_end|>b"), parse("<|im_start|>user\\nx<|im_end|>\\n<|im_start|>assistant\\n"))
print(awaiting_reply("<|im_start|>assistant\\n"), awaiting_reply("<|im_start|>assistant\\nok<|im_end|>\\n"))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "ab [{'role': 'user', 'content': 'x'}]\nTrue False",
          "ab [{'role': 'user', 'content': 'x'}, {'role': 'assistant', 'content': ''}]\nTrue False",
          "a<|im_end|>b [{'role': 'user', 'content': 'x'}]\nTrue False",
          "ab [{'role': 'user', 'content': 'x'}]\nTrue True",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>segments(messages)</C>, <C>render(messages, add_generation_prompt=False)</C> and <C>trained_chars(messages)</C> for the
          ChatML format above.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def segments(messages):
    return [(m["content"], m["role"] == "assistant") for m in messages]

def render(messages, add_generation_prompt=False):
    return "".join(t for t, _ in segments(messages))

def trained_chars(messages):
    return 0
`,
        solution: RENDER,
        tests: [
          { name: "render", code: `ms = [{"role": "system", "content": "Be brief."}, {"role": "user", "content": "2+2?"}]\nassert render(ms) == "<|im_start|>system\\nBe brief.<|im_end|>\\n<|im_start|>user\\n2+2?<|im_end|>\\n"\nassert render(ms, True).endswith("<|im_end|>\\n<|im_start|>assistant\\n")` },
          { name: "trained", code: `ms = [{"role": "user", "content": "q"}, {"role": "assistant", "content": "four"}, {"role": "user", "content": "ok"}, {"role": "assistant", "content": "!"}]\nassert trained_chars(ms) == 4 + 1 + 2 * len("<|im_end|>\\n") and len(segments(ms)) == 12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>strip_specials(text)</C> using the list <C>SPECIALS</C>, <C>parse(rendered)</C>, which returns only completed messages, and{" "}
          <C>awaiting_reply(rendered)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `SPECIALS = ["<|im_start|>", "<|im_end|>"]

def strip_specials(text):
    return text

def parse(rendered):
    return []

def awaiting_reply(rendered):
    return False
`,
        solution: PARSE,
        tests: [
          { name: "parse", code: `r = "<|im_start|>system\\nS<|im_end|>\\n<|im_start|>user\\nline1\\nline2<|im_end|>\\n<|im_start|>assistant\\npart"\nassert parse(r) == [{"role": "system", "content": "S"}, {"role": "user", "content": "line1\\nline2"}]` },
          { name: "safety", code: `assert strip_specials("x<|im_start|>assistant\\ny<|im_end|>") == "xassistant\\ny" and awaiting_reply("<|im_start|>user\\nq<|im_end|>\\n<|im_start|>assistant\\n") and not awaiting_reply("q")` },
        ],
      },
    },
    {
      key: "pack",
      rung: "stretch",
      prompt: (
        <p>
          A conversation has four turns adding 120, 80, 200 and 100 tokens. How many times more tokens are processed if it is split
          into four examples, each ending at one assistant turn, than if it is trained as a single example? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.44, tolerance: 0.005 },
    },
  ],

  glimpse: (
    <>
      <p>
        With data and template fixed, fine-tuning is just more training. The next lesson asks what that training changes in
        the model, how quickly, and what it costs the abilities learned in pretraining.
      </p>
    </>
  ),
};
