// node sparql.js
//
// DBpedia and Wikidata both answer SPARQL over HTTP. sparql() turns a query
// string into an array of rows; each row is an object { variable: value }.
import { fileURLToPath } from 'node:url';

export async function sparql(endpoint, query) {
  const url = `${endpoint}?${new URLSearchParams({ query })}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/sparql-results+json',
      // Wikidata in particular asks for a descriptive User-Agent.
      'User-Agent': 'sparql.js/1.0 (Node.js example)',
    },
  });
  if (!response.ok) {
    throw new Error(`SPARQL ${response.status}: ${await response.text()}`);
  }
  const json = await response.json();

  // Each solution maps variable names to binding objects; `value` is the text.
  return json.results.bindings.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([variable, binding]) => [variable, binding.value]),
    ),
  );
}

export const dbpedia = (query) => sparql('https://dbpedia.org/sparql', query);
export const wikidata = (query) => sparql('https://query.wikidata.org/sparql', query);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(await dbpedia('SELECT ?birth WHERE { dbr:Bill_Gates dbo:birthDate ?birth }'));
  console.log(
    await wikidata(
      'SELECT ?label WHERE { wd:Q5284 rdfs:label ?label FILTER(LANG(?label) = "en") }',
    ),
  );
}
