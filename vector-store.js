// node vector-store.js   (in-memory dense vector store, cosine similarity)
import { fileURLToPath } from 'node:url';

export const vDot = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0);
export const vNorm = (a) => Math.sqrt(vDot(a, a));

// cos θ = a·b / (|a||b|); a zero vector has similarity 0 with everything.
export function vCosine(a, b) {
  const na = vNorm(a);
  const nb = vNorm(b);
  return na === 0 || nb === 0 ? 0 : vDot(a, b) / (na * nb);
}

// id -> { text, vec }
export const makeVectorStore = () => new Map();

export function storeAdd(store, id, text, vec) {
  store.set(id, { text, vec });
}

// Brute-force top-k: score everything, sort descending, keep the first k.
export function storeSearch(store, queryVec, k = 3) {
  return [...store]
    .map(([id, { text, vec }]) => ({ score: vCosine(queryVec, vec), id, text }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

// Demo: semantic search in a hand-made 4D concept space.
function demo() {
  const store = makeVectorStore();
  storeAdd(store, 'item-1', 'queen',    [0.90, 0.90, 0.05, 0.10]);
  storeAdd(store, 'item-2', 'king',     [0.95, 0.10, 0.05, 0.10]);
  storeAdd(store, 'item-3', 'princess', [0.80, 0.95, 0.05, 0.15]);
  storeAdd(store, 'item-4', 'apple',    [0.05, 0.10, 0.95, 0.30]);
  storeAdd(store, 'item-5', 'banana',   [0.05, 0.10, 0.90, 0.95]);

  console.log(`Vector Store Entries: ${store.size}`);

  const queries = [
    ['Royal female concept', [0.85, 0.85, 0.05, 0.10]],
    ['Sweet fruit concept', [0.05, 0.10, 0.85, 0.90]],
  ];
  queries.forEach(([label, vec], i) => {
    console.log(`\nQuery ${i + 1}: ${label} [${vec.join(', ')}]`);
    for (const { score, id, text } of storeSearch(store, vec, 3)) {
      console.log(`  [sim: ${score.toFixed(3)}] (${id}) ${JSON.stringify(text)}`);
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) demo();
