import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { Utf8BytesViz } from "@/components/viz/Utf8BytesViz";
import type { LessonContent } from "@/lib/types";

const CODEC = `def utf8_encode(cp):
    if cp < 0x80:
        return [cp]
    if cp < 0x800:
        return [0xC0 | cp >> 6, 0x80 | cp & 0x3F]
    if cp < 0x10000:
        return [0xE0 | cp >> 12, 0x80 | cp >> 6 & 0x3F, 0x80 | cp & 0x3F]
    return [0xF0 | cp >> 18, 0x80 | cp >> 12 & 0x3F, 0x80 | cp >> 6 & 0x3F, 0x80 | cp & 0x3F]

def utf8_decode(bs):
    out, i = [], 0
    while i < len(bs):
        b = bs[i]
        n, lo = (1, 0) if b < 0x80 else (2, 0x80) if b >> 5 == 6 else (3, 0x800) if b >> 4 == 14 else (4, 0x10000) if b >> 3 == 30 else (0, 0)
        tail = bs[i + 1:i + n]
        if n == 0 or len(tail) < n - 1 or any(t >> 6 != 2 for t in tail):
            out.append(0xFFFD); i += 1            # invalid lead or continuation: replace and resynchronise
            continue
        cp = b & (0x7F >> n if n > 1 else 0x7F)
        for t in tail:
            cp = cp << 6 | t & 0x3F
        out.append(cp if cp >= lo and not 0xD800 <= cp <= 0xDFFF else 0xFFFD)   # overlong forms and surrogates are invalid
        i += n
    return out

def byte_len(text):
    return sum(len(utf8_encode(ord(c))) for c in text)`;

const CLEAN = `import unicodedata

def nfkc_fold(text):
    return unicodedata.normalize("NFKC", text).casefold()   # compatibility forms and case folded together

def fix_mojibake(text):
    try:
        fixed = text.encode("cp1252").decode("utf-8")   # undo UTF-8 bytes misread as Windows-1252
    except (UnicodeEncodeError, UnicodeDecodeError):
        return text
    return fixed if len(fixed) < len(text) else text

def bytes_per_char(samples):
    return {name: len(t.encode("utf-8")) / len(t) for name, t in samples.items()}`;

export const lesson: LessonContent = {
  id: "e11.5.1",
  minutes: 40,
  links: {
    requires: ["e0.4.3", "e11.2.3"],
    revisits: ["l5.1.1", "e11.2.1"],
    foreshadows: ["e11.5.2", "e11.5.4"],
  },

  puzzle: (
    <>
      <p>
        A tokeniser trained on a multilingual corpus turns a Hindi sentence into three times as many tokens as its English
        translation. The corpus also contains &quot;cafÃ©&quot; where &quot;café&quot; was meant, full-width letters from East Asian
        keyboards that look like ordinary ones, and the occasional broken byte sequence. All of this happens below the level of words.
        What is text, as a computer stores it, and what should a pipeline normalise before tokenising?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Unicode assigns every character a number, its code point. UTF-8 stores each code point in one to four bytes: ASCII in one,
        most European and Middle Eastern scripts in two, most Indian and East Asian scripts in three, emoji and rare characters in four.
        The design lets a reader find where any character starts, and makes byte-level tokenisers possible. But one visible text can
        have several encodings as code points, and text decoded with the wrong encoding turns into mojibake, so pipelines normalise
        and repair before training.
      </p>
      <Utf8BytesViz />
    </>
  ),

  theory: (
    <>
      <Definition title="UTF-8">
        <p>
          A code point below <M>{"2^7"}</M> is one byte <C>0xxxxxxx</C>. Otherwise its bits are split into a lead byte{" "}
          <C>110xxxxx</C>, <C>1110xxxx</C> or <C>11110xxx</C>, for two, three or four bytes, followed by continuation bytes{" "}
          <C>10xxxxxx</C>, most significant bits first (<C>utf8_encode</C>). <C>utf8_decode</C> reads a lead byte, checks the
          continuations, and rejects overlong forms (a code point written with more bytes than needed) and the surrogate range
          U+D800 to U+DFFF, replacing each error with U+FFFD. <C>byte_len</C> is the encoded length.
        </p>
        <Code>{CODEC}</Code>
      </Definition>

      <Theorem title="UTF-8 is self-synchronising and prefix-free">
        <p>
          No encoded character is a prefix of another, and from any byte position the start of the current character is at most three
          bytes back.
        </p>
      </Theorem>
      <Proof>
        <p>
          Lead bytes and continuation bytes have different top bits, so the first byte of an encoding says how many bytes follow, and
          two encodings that begin alike have the same length; if one were a prefix of the other they would be equal. A reader at any
          byte steps back over continuation bytes, which start with 10, until it meets a lead byte; a character has at most three
          continuation bytes. So a corrupted byte damages one character, and a file can be split anywhere and resynchronised.
        </p>
      </Proof>

      <Theorem title="byte order is code point order">
        <p>
          Comparing UTF-8 encodings byte by byte orders them exactly as their code points.
        </p>
      </Theorem>
      <Proof>
        <p>
          Code points needing more bytes are larger, and their lead bytes are larger: 00 to 7F, then C2 to DF, E0 to EF and F0 to F4.
          For two encodings of the same length, the payload bits are laid out from most to least significant across the bytes, so the
          first differing byte decides, as the first differing bit of the code points would.
        </p>
      </Proof>

      <Definition title="normalising text">
        <p>
          Unicode normalisation form NFKC replaces compatibility characters, such as full-width letters and ligatures, with their
          ordinary equivalents and composes accents with their letters; <C>nfkc_fold</C> also folds case. Mojibake arises when UTF-8
          bytes are decoded as Windows-1252; <C>fix_mojibake</C> reverses that when the result is valid and shorter.{" "}
          <C>bytes_per_char</C> compares scripts by the average UTF-8 bytes per code point.
        </p>
        <Code>{CLEAN}</Code>
      </Definition>

      <Remark title="encoding in practice">
        <p>
          Pipelines decode the web&apos;s declared and detected encodings to Unicode early, repair mojibake with tools such as ftfy, and
          normalise, usually to NFC or NFKC, though NFKC also changes characters that matter in mathematics and code, such as
          superscripts. Byte-level BPE (l5.1.1) starts from the 256 byte values, so it can encode any string, but scripts that take three
          bytes per character start with three tokens per character, and only merges learned from enough data in that script bring the
          count down; that is the origin of the Hindi gap in the puzzle and a theme of e11.5.3. Models that work on raw bytes are
          the subject of e11.5.4.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Hindi needs three bytes per code point and vowel signs are separate code points, so byte-level tokens start far behind English
          unless the tokeniser saw enough Hindi to learn merges. &quot;cafÃ©&quot; is UTF-8 read as Windows-1252, and full-width letters
          are compatibility forms; repairing and normalising before tokenising turns them back into the ordinary text.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "bytes",
      rung: "check",
      prompt: <p>How many bytes does &quot;naïve 日本&quot;, with one space, take in UTF-8?</p>,
      answer: { kind: "numeric", value: 13, tolerance: 0 },
    },
    {
      key: "second",
      rung: "check",
      prompt: <p>What is the decimal value of the second byte of the UTF-8 encoding of ñ, U+00F1?</p>,
      answer: { kind: "numeric", value: 177, tolerance: 0 },
    },
    {
      key: "resync",
      rung: "apply",
      prompt: <p>Why can a UTF-8 file be split at an arbitrary byte and still be decoded almost entirely?</p>,
      answer: {
        kind: "choice",
        options: [
          "Continuation bytes start with 10 and lead bytes do not, so a reader can skip to the next character start",
          "Every character takes the same number of bytes",
          "UTF-8 stores a length header every 64 bytes",
          "Only ASCII characters can be split",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def utf8_encode(cp):
    if cp < 0x80:
        return [cp]
    if cp < 0x800:
        return [0xC0 | cp >> 6, 0x80 | cp & 0x3F]
    if cp < 0x10000:
        return [0xE0 | cp >> 12, 0x80 | cp >> 6 & 0x3F, 0x80 | cp & 0x3F]
    return [0xF0 | cp >> 18, 0x80 | cp >> 12 & 0x3F, 0x80 | cp >> 6 & 0x3F, 0x80 | cp & 0x3F]

def utf8_decode(bs):
    out, i = [], 0
    while i < len(bs):
        b = bs[i]
        n, lo = (1, 0) if b < 0x80 else (2, 0x80) if b >> 5 == 6 else (3, 0x800) if b >> 4 == 14 else (4, 0x10000) if b >> 3 == 30 else (0, 0)
        tail = bs[i + 1:i + n]
        if n == 0 or len(tail) < n - 1 or any(t >> 6 != 2 for t in tail):
            out.append(0xFFFD); i += 1            # invalid lead or continuation: replace and resynchronise
            continue
        cp = b & (0x7F >> n if n > 1 else 0x7F)
        for t in tail:
            cp = cp << 6 | t & 0x3F
        out.append(cp if cp >= lo and not 0xD800 <= cp <= 0xDFFF else 0xFFFD)   # overlong forms and surrogates are invalid
        i += n
    return out

def byte_len(text):
    return sum(len(utf8_encode(ord(c))) for c in text)

bs = utf8_encode(0xE9) + [0xC0, 0x80] + utf8_encode(0x20AC)
print([hex(b) for b in utf8_encode(0xE9)], [hex(c) for c in utf8_decode(bs)], byte_len("a€😀"))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['0xc3', '0xa9'] ['0xe9', '0xfffd', '0x20ac'] 8",
          "['0xc3', '0xa9'] ['0xe9', '0xfffd', '0xfffd', '0x20ac'] 8",
          "['0xe9'] ['0xe9', '0xfffd', '0x20ac'] 8",
          "['0xc3', '0xa9'] ['0xe9', '0xfffd', '0x20ac'] 6",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import unicodedata

def nfkc_fold(text):
    return unicodedata.normalize("NFKC", text).casefold()   # compatibility forms and case folded together

def fix_mojibake(text):
    try:
        fixed = text.encode("cp1252").decode("utf-8")   # undo UTF-8 bytes misread as Windows-1252
    except (UnicodeEncodeError, UnicodeDecodeError):
        return text
    return fixed if len(fixed) < len(text) else text

def bytes_per_char(samples):
    return {name: len(t.encode("utf-8")) / len(t) for name, t in samples.items()}

print(nfkc_fold("Ｆｉｌｅ ﬁ"), fix_mojibake("cafÃ©"), fix_mojibake("café"), bytes_per_char({"x": "aé"}))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "file fi café café {'x': 1.5}",
          "File fi café café {'x': 1.5}",
          "file fi cafÃ© café {'x': 1.5}",
          "file fi café café {'x': 2.0}",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>utf8_encode(cp)</C>, returning a list of byte values; <C>utf8_decode(bs)</C>, which replaces an invalid lead byte or
          a missing or wrong continuation with one U+FFFD and moves on by one byte, and replaces a whole overlong or surrogate sequence
          with one U+FFFD; and <C>byte_len(text)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def utf8_encode(cp):
    return [cp]

def utf8_decode(bs):
    return list(bs)

def byte_len(text):
    return len(text)
`,
        solution: CODEC,
        tests: [
          { name: "encode", code: `for c in ["A", "é", "ह", "€", "😀", "\\u07ff", "\\U00010000"]:\n    assert bytes(utf8_encode(ord(c))) == c.encode("utf-8")\nassert byte_len("aé😀") == 7` },
          { name: "decode", code: `s = "x€😀é"\nassert utf8_decode(list(s.encode())) == [ord(c) for c in s]\nassert utf8_decode([0xE2, 0x82, 0x41]) == [0xFFFD, 0xFFFD, 0x41] and utf8_decode([0xED, 0xA0, 0x80, 0xFF]) == [0xFFFD, 0xFFFD]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>nfkc_fold(text)</C>; <C>fix_mojibake(text)</C>; and <C>bytes_per_char(samples)</C>, for a dict from name to text.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import unicodedata

def nfkc_fold(text):
    return text.lower()

def fix_mojibake(text):
    return text

def bytes_per_char(samples):
    return {name: 1.0 for name in samples}
`,
        solution: CLEAN,
        tests: [
          { name: "fold", code: `assert nfkc_fold("Straße ①") == "strasse 1" and nfkc_fold("e\\u0301") == "é"\nassert bytes_per_char({"a": "日本", "b": "ab😀"}) == {"a": 3.0, "b": 2.0}` },
          { name: "mojibake", code: `assert fix_mojibake("naÃ¯ve") == "naïve" and fix_mojibake("plain") == "plain" and fix_mojibake("数据") == "数据"` },
        ],
      },
    },
    {
      key: "three",
      rung: "stretch",
      prompt: (
        <p>
          How many code points are encoded in exactly three bytes by valid UTF-8, given that the surrogates U+D800 to U+DFFF are not
          allowed?
        </p>
      ),
      answer: { kind: "numeric", value: 61440, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Bytes are where tokenisation starts. The next lesson trains a byte-pair encoding tokeniser from scratch, merge by merge, on a
        corpus like the ones built so far.
      </p>
    </>
  ),
};
