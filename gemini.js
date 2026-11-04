// GOOGLE_API_KEY=... node gemini.js   (Node 18+; uses the built-in fetch)
import { fileURLToPath } from 'node:url';

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';

export async function gemini(prompt, model = 'gemini-3.5-flash-lite') {
  const response = await fetch(`${BASE}${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GOOGLE_API_KEY ?? '',
    },
    // JSON.stringify escapes the prompt safely; no hand-built JSON strings.
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  const json = await response.json();

  // Errors (missing key, rate limit, ...) come back without `candidates`.
  if (!json.candidates) {
    throw new Error(`Gemini error: ${JSON.stringify(json.error ?? json)}`);
  }
  return json.candidates[0].content.parts[0].text;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(await gemini('what is 1 + 10?'));
}
