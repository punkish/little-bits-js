// EXA_SEARCH_API_KEY=... BRAVE_SEARCH_API_KEY=... node search.js
//
// Two search APIs, one calling convention: esearch() and bsearch() both take
// a query and return an array of { title, url, text }.
import { fileURLToPath } from 'node:url';

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`);
  }
  return response.json();
}

// Exa puts the page content under `text`, Brave puts its snippet under
// `description`, so the key name is a parameter.
export function toResults(items, textKey) {
  return items.map((hit) => ({
    title: hit.title,
    url: hit.url,
    text: hit[textKey],
  }));
}

export async function esearch(query, n = 5) {
  const json = await fetchJson('https://api.exa.ai/search', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.EXA_SEARCH_API_KEY ?? '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      numResults: n,
      contents: { text: { maxCharacters: 300 } },
    }),
  });
  return toResults(json.results, 'text');
}

export async function bsearch(query, n = 5) {
  // URLSearchParams does the URL-encoding for a GET request.
  const params = new URLSearchParams({ q: query, count: String(n) });
  const json = await fetchJson(
    `https://api.search.brave.com/res/v1/web/search?${params}`,
    {
      headers: {
        'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY ?? '',
        Accept: 'application/json',
      },
    },
  );
  return toResults(json.web.results, 'description');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(await esearch('Common Lisp SPARQL client', 3));
  console.log(await bsearch('Sedona Arizona hiking', 3));
}
