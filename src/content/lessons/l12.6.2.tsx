import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CtcLatticeViz } from "@/components/viz/CtcLatticeViz";
import type { LessonContent } from "@/lib/types";

const CTC = `def ctc_collapse(path, blank=0):
    out = [c for i, c in enumerate(path) if i == 0 or c != path[i - 1]]   # merge repeats first
    return [c for c in out if c != blank]                                  # then drop blanks

def ctc_forward(probs, target, blank=0):
    ext = [blank]
    for c in target:
        ext += [c, blank]
    S = len(ext)
    a = [probs[0][ext[0]], probs[0][ext[1]] if S > 1 else 0.0] + [0.0] * (S - 2)
    for p in probs[1:]:
        a = [(a[s] + (a[s - 1] if s >= 1 else 0.0)
              + (a[s - 2] if s >= 2 and ext[s] != blank and ext[s] != ext[s - 2] else 0.0)) * p[ext[s]]
             for s in range(S)]
    return a[-1] + (a[-2] if S > 1 else 0.0)

def n_alignments(T, target):
    V = max(target + [0]) + 1
    return round(ctc_forward([[1.0] * V for _ in range(T)], target))      # every path has weight one`;

const EVAL = `import math

def edit_distance(ref, hyp):
    d = list(range(len(hyp) + 1))
    for i, r in enumerate(ref, 1):
        prev, d[0] = d[0], i
        for j, h in enumerate(hyp, 1):
            prev, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, prev + (r != h))   # delete, insert, substitute
    return d[-1]

def wer(ref, hyp):
    return edit_distance(ref.split(), hyp.split()) / len(ref.split())

def mel(f):
    return 2595 * math.log10(1 + f / 700)`;

export const lesson: LessonContent = {
  id: "l12.6.2",
  minutes: 50,
  links: {
    requires: ["l12.6.1"],
    revisits: ["l12.5.2", "l12.5.4"],
    foreshadows: ["l12.6.3"],
  },

  puzzle: (
    <>
      <p>
        A recording of someone saying &quot;cat&quot; lasts half a second, a hundred frames of features. The transcript has
        three letters. Training data pair whole recordings with whole transcripts, and nobody has marked which frames belong
        to which letter, or where the pauses are. How can a network learn to transcribe from such pairs, and what changed
        when models were instead trained on hundreds of thousands of hours of loosely transcribed audio from the web?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Let the network output, for every frame, a distribution over letters plus a special blank meaning &quot;nothing
        new here&quot;. Any frame-by-frame path that, once repeats are merged and blanks removed, spells the transcript is a
        valid alignment, and the probability of the transcript is the sum over all of them. There are exponentially many,
        but they form a lattice and dynamic programming sums them in time proportional to frames times letters.
      </p>
      <CtcLatticeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="log-mel features">
        <p>
          Speech models rarely read raw samples. The waveform is cut into windows of 25 ms every 10 ms, each is Fourier
          transformed, and the power is pooled into 80 or 128 filters spaced evenly on the mel scale{" "}
          <M>{"m(f) = 2595 \\log_{10}(1 + f/700)"}</M> (<C>mel</C>), which is roughly linear below 1 kHz and logarithmic
          above, like the ear&apos;s resolution of pitch. Taking logarithms gives a log-mel spectrogram of 100 frames a
          second.
        </p>
      </Definition>

      <Definition title="connectionist temporal classification">
        <p>
          Given per-frame distributions <M>{"p_t(\\cdot)"}</M> over a vocabulary with a blank, a path <M>{"\\pi"}</M> of
          length T collapses to a label sequence by merging repeated symbols and then deleting blanks (<C>ctc_collapse</C>).
          CTC defines
        </p>
        <MD>{"p(y \\mid x) = \\sum_{\\pi : \\mathcal{B}(\\pi) = y} \\prod_{t=1}^{T} p_t(\\pi_t)"}</MD>
        <p>
          and trains by minimising <M>{"-\\log p(y \\mid x)"}</M>. It assumes the frames&apos; outputs are independent given
          the audio, so the network itself must carry all context.
        </p>
      </Definition>

      <Theorem title="the forward recursion">
        <p>
          Insert blanks around and between the L labels to get an extended sequence <M>{"z"}</M> of length 2L + 1, and let{" "}
          <M>{"\\alpha_t(s)"}</M> be the total probability of path prefixes of length t that are consistent with the first s
          + 1 symbols of z and end at symbol s. Then
        </p>
        <MD>{"\\alpha_t(s) = \\big(\\alpha_{t-1}(s) + \\alpha_{t-1}(s-1) + [\\,z_s \\ne \\text{blank},\\ z_s \\ne z_{s-2}\\,]\\, \\alpha_{t-1}(s-2)\\big)\\, p_t(z_s),"}</MD>
        <p>
          and <M>{"p(y \\mid x) = \\alpha_T(2L) + \\alpha_T(2L - 1)"}</M> (<C>ctc_forward</C>), computed in O(TL) time.
        </p>
      </Theorem>
      <Proof>
        <p>
          A path collapses to y exactly when, read against z, it stays on a symbol, moves to the next one, or skips a blank
          between two different labels; skipping is forbidden between equal labels, since without a blank the repeats would
          merge, and skipping a label is forbidden since it would be lost. It must start at the first blank or first label,
          and end at the last label or final blank. Grouping paths by their position at time t − 1 gives the three terms,
          and each path is counted once because its sequence of positions is determined by the path itself. With every{" "}
          <M>{"p_t = 1"}</M> the recursion counts the alignments (<C>n_alignments</C>).
        </p>
        <Code>{CTC}</Code>
      </Proof>

      <Remark title="how many frames a transcript needs">
        <p>
          Each label needs its own frame, and each adjacent pair of equal labels needs a blank frame between them, so a
          transcript of L labels with r adjacent repeats needs at least L + r frames. Character transcripts are far shorter
          than 100 frames a second, so this rarely binds, but it is why CTC models with heavily downsampled audio use
          subword vocabularies.
        </p>
      </Remark>

      <Example title="Whisper">
        <p>
          Whisper drops CTC for an encoder-decoder transformer trained on 680,000 hours of audio paired with transcripts
          found on the internet. It reads 30-second windows of log-mel spectrogram, 3000 frames, which a convolutional stem
          of stride 2 halves to 1500 encoder positions, and a decoder writes the text token by token while attending to
          them, like a vision-language model reading an image. Special tokens at the start select the language and the
          task, transcription or translation into English, and whether to predict timestamps, so one model does all of
          them. The decoder learns the alignment implicitly through cross-attention. Weak supervision at scale gave
          robustness: Whisper made far fewer errors than models trained on one clean dataset when tested on others.
        </p>
      </Example>

      <Definition title="word error rate">
        <p>
          Recognisers are scored by the minimum number of word substitutions, deletions and insertions turning the
          hypothesis into the reference (<C>edit_distance</C>, by dynamic programming), divided by the number of reference
          words (<C>wer</C>). Insertions can make it exceed one. Text is normalised first, for case, punctuation and
          spellings of numbers, and differences in normalisation alone can move the score by several points.
        </p>
        <Code>{EVAL}</Code>
      </Definition>

      <Remark title="alternatives">
        <p>
          The transducer (RNN-T) adds a small prediction network over previous labels to CTC&apos;s lattice, removing the
          independence assumption while still streaming frame by frame, and it dominates on-device recognition.
          Self-supervised encoders such as wav2vec 2.0, pretrained by predicting quantised targets for masked stretches of
          audio, reach good accuracy with a CTC head and only hours of labelled speech.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "frames",
      rung: "check",
      prompt: (
        <p>
          A model reads 30-second windows of log-mel features at 100 frames per second, and its convolutional stem has total
          stride 2. How many positions does its encoder see?
        </p>
      ),
      answer: { kind: "numeric", value: 1500, tolerance: 0 },
    },
    {
      key: "wer",
      rung: "check",
      prompt: (
        <p>
          A reference has 10 words. The best alignment of a hypothesis to it has one substitution, one deletion and two
          insertions. What is the word error rate?
        </p>
      ),
      answer: { kind: "numeric", value: 0.4, tolerance: 0.001 },
    },
    {
      key: "blank",
      rung: "apply",
      prompt: <p>Why does CTC need a blank symbol?</p>,
      answer: {
        kind: "choice",
        options: [
          "To let frames emit nothing new and to separate repeated letters, which merging would otherwise join",
          "To mark the end of the utterance",
          "To make the vocabulary size a power of two",
          "To stand for silence only, as a phoneme of its own",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ctc_collapse(path, blank=0):
    out = [c for i, c in enumerate(path) if i == 0 or c != path[i - 1]]   # merge repeats first
    return [c for c in out if c != blank]                                  # then drop blanks

def ctc_forward(probs, target, blank=0):
    ext = [blank]
    for c in target:
        ext += [c, blank]
    S = len(ext)
    a = [probs[0][ext[0]], probs[0][ext[1]] if S > 1 else 0.0] + [0.0] * (S - 2)
    for p in probs[1:]:
        a = [(a[s] + (a[s - 1] if s >= 1 else 0.0)
              + (a[s - 2] if s >= 2 and ext[s] != blank and ext[s] != ext[s - 2] else 0.0)) * p[ext[s]]
             for s in range(S)]
    return a[-1] + (a[-2] if S > 1 else 0.0)

def n_alignments(T, target):
    V = max(target + [0]) + 1
    return round(ctc_forward([[1.0] * V for _ in range(T)], target))      # every path has weight one

print(ctc_collapse([1, 1, 0, 1, 2, 2, 0]), ctc_collapse([0, 3, 0, 0, 3]))
print(n_alignments(3, [1]), n_alignments(4, [1, 1]), round(ctc_forward([[0.5, 0.5], [0.5, 0.5]], [1]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 1, 2] [3, 3]\n6 5 0.75",
          "[1, 2] [3]\n6 5 0.75",
          "[1, 1, 2] [3, 3]\n3 1 0.5",
          "[1, 1, 2, 2] [3, 3]\n6 5 0.75",
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

def edit_distance(ref, hyp):
    d = list(range(len(hyp) + 1))
    for i, r in enumerate(ref, 1):
        prev, d[0] = d[0], i
        for j, h in enumerate(hyp, 1):
            prev, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, prev + (r != h))   # delete, insert, substitute
    return d[-1]

def wer(ref, hyp):
    return edit_distance(ref.split(), hyp.split()) / len(ref.split())

def mel(f):
    return 2595 * math.log10(1 + f / 700)

print(edit_distance("the cat sat".split(), "the cat sat down".split()), wer("a b c d", "a x c"))
print(round(mel(700), 2), round(mel(1000), 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1 0.5\n781.17 1000.0",
          "1 0.25\n781.17 1000.0",
          "0 0.5\n700.0 1000.0",
          "1 0.75\n781.17 1000.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          With blank index 0, write <C>ctc_collapse(path)</C>, <C>ctc_forward(probs, target)</C> where <C>probs[t][k]</C> is
          the probability of symbol k at frame t, and <C>n_alignments(T, target)</C>, the number of length-T paths collapsing
          to the target.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ctc_collapse(path, blank=0):
    return path

def ctc_forward(probs, target, blank=0):
    return 0.0

def n_alignments(T, target):
    return 0
`,
        solution: CTC,
        tests: [
          { name: "collapse", code: `assert ctc_collapse([2, 2, 0, 0, 2, 1]) == [2, 2, 1] and ctc_collapse([0, 0]) == []` },
          { name: "forward", code: `assert n_alignments(2, [1]) == 3 and abs(ctc_forward([[0.2, 0.8], [0.6, 0.4]], [1]) - 0.88) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>edit_distance(ref, hyp)</C> for two lists, <C>wer(ref, hyp)</C> for two strings of space-separated words,
          and <C>mel(f)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def edit_distance(ref, hyp):
    return abs(len(ref) - len(hyp))

def wer(ref, hyp):
    return 0.0

def mel(f):
    return f
`,
        solution: EVAL,
        tests: [
          { name: "edit", code: `assert edit_distance(list("kitten"), list("sitting")) == 3 and abs(wer("a b", "a b c") - 0.5) < 1e-12` },
          { name: "mel", code: `import math\nassert abs(mel(0)) < 1e-12 and abs(mel(1400) - 2595 * math.log10(3)) < 1e-9` },
        ],
      },
    },
    {
      key: "count",
      rung: "stretch",
      prompt: (
        <p>
          How many CTC alignments of 5 frames collapse to a two-letter transcript whose letters are different?
        </p>
      ),
      answer: { kind: "numeric", value: 35, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Recognition maps speech to text. Synthesis goes the other way, and is harder in one respect: a transcript does not
        say how fast, in what voice, or with what emphasis to speak, so the model must generate everything the text leaves
        out.
      </p>
    </>
  ),
};
