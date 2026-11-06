// node ollama.js   (needs a local Ollama server and: ollama pull qwen3.5:4b)
import { fileURLToPath } from 'node:url';

export async function ollama(prompt, model = 'qwen2.5:0.5b') {
    const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        body: JSON.stringify({
        model,
        prompt,
        stream: false, // one complete JSON reply instead of a token stream
        think: false,  // skip the reasoning trace on models that have one
        }),
    });
    const json = await response.json();
    if (json.error) throw new Error(`Ollama error: ${json.error}`);
    return json.response;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    console.log(await ollama('what is 1 + 10?'));
}
