import { test } from "node:test";
import assert from "node:assert/strict";
import { checkStrength, normalisePassphrase, suggestPassphrase } from "../src/lib/passphrase.ts";
import { WORDS } from "../src/lib/words.ts";

test("normalises spacing and case so any device matches", () => {
  assert.equal(normalisePassphrase("  Mango   RIVER lantern\tquiet "), "mango river lantern quiet");
});

test("rejects short or few-word passphrases", () => {
  assert.equal(checkStrength("one two three").ok, false);
  assert.equal(checkStrength("a b c d").ok, false);
  assert.equal(checkStrength("mango river lantern quiet").ok, true);
});

test("rejects heavy repetition", () => {
  assert.equal(checkStrength("mango mango mango mango mango").ok, false);
});

test("suggestions are six known words and pass the strength check", () => {
  let i = 0;
  const s = suggestPassphrase((max) => (i++ * 97) % max);
  assert.equal(s.split(" ").length, 6);
  assert.ok(s.split(" ").every((w) => WORDS.includes(w)));
  assert.equal(checkStrength(s).ok, true);
});

test("word list has 512 unique entries", () => {
  assert.equal(WORDS.length, 512);
  assert.equal(new Set(WORDS).size, 512);
});
