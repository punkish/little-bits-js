// node triple-store.js   (in-memory RDF-style triple store)
//
// A triple is [subject, predicate, object]. In a query pattern, any string
// starting with "?" is a variable.
import { fileURLToPath } from 'node:url';

export const store = []; // the default store; pass your own array to keep several

export function addTriple(s, p, o, target = store) {
  target.push([s, p, o]);
}

export const isVar = (x) => typeof x === 'string' && x.startsWith('?');

// Unify one pattern with one triple under the bindings in `env`.
// Returns the extended bindings, or null if they don't match.
export function matchTriple(pattern, triple, env) {
  let result = env;
  for (let i = 0; i < 3; i++) {
    const p = pattern[i];
    const x = triple[i];
    if (isVar(p)) {
      if (p in result) {
        if (result[p] !== x) return null; // bound already, to something else
      } else {
        result = { ...result, [p]: x };   // bind it (copy: never mutate env)
      }
    } else if (p !== x) {
      return null;                        // literal mismatch
    }
  }
  return result;
}

// Returns an array of bindings objects, e.g. [{ '?who': 'plato' }, ...].
// Each pattern filters and extends the live bindings, so two patterns that
// share a variable act as a relational join.
export function queryTriples(patterns, target = store) {
  let envs = [{}];
  for (const pattern of patterns) {
    envs = envs.flatMap((env) =>
      target.map((triple) => matchTriple(pattern, triple, env)).filter((e) => e !== null),
    );
  }
  return envs;
}

// Demo: a knowledge graph of thinkers, occupations and cities.
function demo() {
  const triples = [
    ['socrates', 'is-a', 'philosopher'], ['socrates', 'lives-in', 'athens'],
    ['plato', 'is-a', 'philosopher'],    ['plato', 'lives-in', 'athens'],
    ['descartes', 'is-a', 'philosopher'], ['descartes', 'lives-in', 'paris'],
    ['monet', 'is-a', 'painter'],        ['monet', 'lives-in', 'paris'],
    ['voltaire', 'is-a', 'writer'],      ['voltaire', 'lives-in', 'paris'],
  ];
  for (const t of triples) addTriple(...t);

  console.log(`Knowledge base triples count: ${store.length}`);

  console.log('\nQuery 1: Who is a philosopher?');
  for (const b of queryTriples([['?who', 'is-a', 'philosopher']])) {
    console.log(`  who: ${b['?who']}`);
  }

  console.log('\nQuery 2: Who lives in Paris AND is a philosopher? (relational join)');
  for (const b of queryTriples([['?who', 'lives-in', 'paris'], ['?who', 'is-a', 'philosopher']])) {
    console.log(`  who: ${b['?who']}`);
  }

  console.log('\nQuery 3: All people in Paris and their occupations:');
  for (const b of queryTriples([['?person', 'lives-in', 'paris'], ['?person', 'is-a', '?job']])) {
    console.log(`  ${b['?person']} is a ${b['?job']} in Paris`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) demo();
