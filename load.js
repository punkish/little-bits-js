// node load.js
//
// Starts a REPL with every function from every example already in scope,
// plus help(). The Lisp version had to read each file form by form and eval
// only the definitions to keep the demos from firing. In Node each file only
// runs its demo when executed directly, so a plain import is enough.
//
// The REPL supports top-level await:  > await ollama('hi')
import repl from 'node:repl';
import { fileURLToPath } from 'node:url';
import * as lib from './load.js'; // this module's own exports (help included)

export * from './apple-system-model.js';
export * from './gemini.js';
export * from './ollama.js';
export * from './search.js';
export * from './sparql.js';
export * from './lightpanda.js';
export * from './webscraping.js';
export * from './osascript.js';
export * from './bayes.js';
export * from './bm25.js';
export * from './hopfield.js';
export * from './triple-store.js';
export * from './vector-store.js';
export * from './summarizer.js';
export * from './symbolic-math.js';
export * from './autograd.js';

// A one-element entry is a section header (a file name);
// a two-element entry is [signature, description].
const HELP = [
  ['apple-system-model.js'],
  ['await appleFm("what is 1 + 10?")', 'on-device Apple model via `fm`'],
  ['gemini.js'],
  ['await gemini("hi", [model])', 'Google Gemini (GOOGLE_API_KEY)'],
  ['ollama.js'],
  ['await ollama("hi", [model])', 'local Ollama model'],
  ['sparql.js'],
  ['await sparql(endpoint, "SELECT ...")', 'SPARQL query -> rows of { variable: value }'],
  ['await dbpedia("SELECT ...")', 'query DBpedia'],
  ['await wikidata("SELECT ...")', 'query Wikidata'],
  ['lightpanda.js'],
  ['await lightpanda(url, ["markdown"])', 'JS-rendered page via Lightpanda'],
  ['links(html)', 'href strings in an HTML string'],
  ['webscraping.js'],
  ['await fetchDom(url)', 'fetch and parse a page (cheerio)'],
  ['nodeText(node)', 'plain text of a DOM node'],
  ['cleanText(string)', 'trim spaces, collapse blank lines'],
  ['await headers(url)', 'h1-h6 texts of a page'],
  ['await pageText(url)', 'readable plain text of a page'],
  ['search.js'],
  ['await esearch("query", [n])', 'Exa search -> [{ title, url, text }]'],
  ['await bsearch("query", [n])', 'Brave search -> [{ title, url, text }]'],
  ['toResults(items, textKey)', 'hits -> [{ title, url, text }]'],
  ['osascript.js'],
  ['await osascript("return 1 + 10")', 'run AppleScript, return stdout'],
  ['await mailUnreadCount()', 'Mail inbox unread count'],
  ['await getTodaysEvents()', "today's Calendar event titles"],
  ['await addReminder("Buy milk")', 'add a Reminders item'],
  ['await sendIMessage("+1555...", "Hi")', 'send an iMessage'],
  ['await readRecentIMessages(3)', 'recent iMessages as an array of objects'],
  ['await safariLogin(url, user, password)', 'fill and submit a Safari login form'],
  ['symbolic-math.js  (p = poly(3, -1, 5) is 3x^2 - x + 5)'],
  ['poly(3, -1, 5)', 'polynomial from coefficients'],
  ['polyNormalize(terms)', 'combine like terms, sort'],
  ['polyAdd(p, q, ...) polySub(p, q)', 'add / subtract polynomials'],
  ['polyScale(p, 2)', 'multiply by a constant'],
  ['polyDegree(p) polyEvaluate(p, 2)', 'degree / value at x'],
  ['polyDeriv(p, [n])', 'nth derivative'],
  ['polyInteg(p, [n])', 'nth antiderivative (no +C)'],
  ["bound('pi')", "bound -> number (numbers, 'pi', 'e')"],
  ['polyDefinite(p, 0, 1)', 'definite integral from a to b'],
  ["isCriticalPoint(p, new Fraction('1/6'))", 'is p\'(x) = 0 ?'],
  ['polyToString(p)', 'p as text: 3x^2 + -1x + 5'],
  ['integralToString(p, 0, 1)', 'integral as text'],
  ['bayes.js'],
  ['bayesUpdate(dist, evidence, likelihoodFn)', 'Bayes update -> normalized posterior'],
  ['bayesNormalize(dist)', 'normalize probabilities to sum to 1.0'],
  ['mapHypothesis(dist)', 'maximum a posteriori (MAP) [hypothesis, p]'],
  ['triple-store.js'],
  ['addTriple(s, p, o)', 'add [s, p, o] triple to the store'],
  ['queryTriples(patterns, [store])', 'query by pattern match & relational join'],
  ['autograd.js'],
  ['val(number)', 'wrap a scalar in an autograd computation node'],
  ['vAdd(a, b) vMul(a, b) vRelu(a)', 'autograd scalar math operations'],
  ['backward(root)', 'reverse-mode automatic differentiation'],
  ['bm25.js'],
  ['tokenize(text)', 'extract lowercase alphanumeric tokens'],
  ['bm25Search(corpus, query)', 'Okapi BM25 ranked document retrieval'],
  ['hopfield.js'],
  ['hopfieldTrain(patterns, size)', 'Hebbian training -> 2D weight matrix'],
  ['hopfieldRecall(w, input, [steps])', 'associative recall of a corrupted pattern'],
  ['hopfieldEnergy(w, state)', 'Lyapunov energy function'],
  ['showPattern(pattern, [width])', 'render bipolar pattern as a #/. grid'],
  ['vector-store.js'],
  ['makeVectorStore()', 'create an in-memory dense vector store'],
  ['storeAdd(store, id, text, vec)', 'add a labeled vector to the store'],
  ['storeSearch(store, qvec, [k])', 'top-k nearest neighbors by cosine similarity'],
  ['vDot(a, b) vNorm(a) vCosine(a, b)', 'dot product / norm / cosine similarity'],
  ['summarizer.js'],
  ['summarize(text, [n])', 'extractive summarization (top-n sentences)'],
  ['words(text) splitSentences(text)', 'tokenization and sentence segmentation'],
  ['load.js'],
  ['help([filter])', 'print this list (optionally filtered by a string)'],
];

export function help(filter) {
  const needle = filter?.toString().toLowerCase();
  for (const [signature, description] of HELP) {
    if (description === undefined) {
      if (!needle) console.log(signature); // section header
    } else if (
      !needle ||
      signature.toLowerCase().includes(needle) ||
      description.toLowerCase().includes(needle)
    ) {
      console.log(`  ${signature.padEnd(42)} // ${description}`);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = repl.start('little-bits> ');
  Object.assign(server.context, lib);
  console.log('Everything is loaded. Try help() or help("search").');
}
