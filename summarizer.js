// node summarizer.js   (extractive text summarization)
//
// Score each sentence by the average frequency of its words, keep the top few,
// and show them in their original order.
import { fileURLToPath } from 'node:url';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'is',
  'are', 'was', 'were', 'it', 'that', 'this', 'with', 'as', 'by', 'from',
  'be', 'has', 'have', 'its',
]);

export function words(text) {
  return text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

// A heuristic: break after . ! or ? (abbreviations like "Dr." will fool it).
export function splitSentences(text) {
  const pieces = text.match(/[^.!?]*[.!?]|[^.!?]+$/g) ?? [];
  return pieces.map((s) => s.trim()).filter((s) => s.length > 0);
}

export function summarize(text, n = 2) {
  const sentences = splitSentences(text);

  // Word frequencies across the whole document, ignoring stop words.
  const freqs = new Map();
  for (const sentence of sentences) {
    for (const w of words(sentence)) {
      if (!STOP_WORDS.has(w)) freqs.set(w, (freqs.get(w) ?? 0) + 1);
    }
  }

  // Average (not total) so long sentences don't win just by being long.
  const scored = sentences.map((sentence, index) => {
    const ws = words(sentence);
    const total = ws.reduce((sum, w) => sum + (freqs.get(w) ?? 0), 0);
    return { score: ws.length ? total / ws.length : 0, index, sentence };
  });

  return scored
    .sort((a, b) => b.score - a.score) // best first...
    .slice(0, n)                       // ...keep n...
    .sort((a, b) => a.index - b.index) // ...restore document order
    .map((s) => s.sentence);
}

function demo() {
  const text =
    'Common Lisp is an expressive, multi-paradigm programming language with a rich ' +
    'history in artificial intelligence. ' +
    'It features dynamic typing, an advanced object system, and syntactic macros ' +
    'that allow programmers to create domain-specific languages. ' +
    'Extractive summarization algorithms score sentences based on significant word ' +
    'frequencies across a document. ' +
    'In this example, we calculate term frequencies and rank sentences to produce a ' +
    'concise summary. ' +
    'Common Lisp continues to empower developers to build complex symbolic and ' +
    'numerical systems with high productivity.';

  console.log(`Original text: ${splitSentences(text).length} sentences.\n`);
  console.log('Extractive 2-Sentence Summary:');
  for (const s of summarize(text, 2)) console.log(`  • ${s}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) demo();
