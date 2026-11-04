// node bm25.js   (Okapi BM25 document ranking)
import { fileURLToPath } from 'node:url';

// Lowercase words made of letters and digits (Unicode-aware).
export function tokenize(text) {
  return text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

// Returns [{ score, text }] for every matching document, best first.
export function bm25Search(corpus, query, { k1 = 1.5, b = 0.75 } = {}) {
  const docs = corpus.map(tokenize);
  const n = corpus.length;
  const avgdl = docs.reduce((sum, d) => sum + d.length, 0) / Math.max(1, n);
  const queryTerms = [...new Set(tokenize(query))]; // a repeated word must not count twice

  // Rare terms are worth more: idf = ln(1 + (N - df + 0.5) / (df + 0.5))
  const idf = (term) => {
    const df = docs.filter((d) => d.includes(term)).length;
    return Math.log(1 + (n - df + 0.5) / (df + 0.5));
  };
  const idfs = new Map(queryTerms.map((term) => [term, idf(term)]));

  const hits = [];
  docs.forEach((doc, i) => {
    let score = 0;
    for (const term of queryTerms) {
      const tf = doc.filter((w) => w === term).length;
      if (tf > 0) {
        // k1 saturates term frequency; b penalizes documents longer than average.
        const norm = tf + k1 * (1 - b + b * (doc.length / avgdl));
        score += idfs.get(term) * ((tf * (k1 + 1)) / norm);
      }
    }
    if (score > 0) hits.push({ score, text: corpus[i] });
  });
  return hits.sort((x, y) => y.score - x.score);
}

function demo() {
  const corpus = [
    'Common Lisp is a general-purpose programming language with powerful macros.',
    'Python is an interpreted language known for data science and machine learning.',
    'Deep learning models require automatic differentiation and gradient optimization.',
    'Macros in Common Lisp enable syntactic metaprogramming and DSL design.',
    'Okapi BM25 is an information retrieval ranking function used in search engines.',
  ];
  console.log(`Corpus size: ${corpus.length} documents`);
  for (const query of ['Common Lisp macros', 'search ranking', 'learning']) {
    console.log(`\nQuery: ${JSON.stringify(query)}`);
    for (const { score, text } of bm25Search(corpus, query)) {
      console.log(`  [score: ${score.toFixed(3)}] ${text}`);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) demo();
