// node hopfield.js   (Hopfield associative neural network)
//
// Patterns are arrays of +1 / -1. Training is Hebbian: the weight between two
// units is the sum over patterns of (unit i) × (unit j).
import { fileURLToPath } from 'node:url';

export function hopfieldTrain(patterns, size) {
    const w = Array.from({ length: size }, () => Array(size).fill(0));
    
    for (const p of patterns) {

        for (let i = 0; i < size; i++) {

            for (let j = 0; j < size; j++) {
                if (i !== j) w[i][j] += p[i] * p[j];
            }

        }
    }

    return w;
}

// Update units one at a time with a sign rule; the state slides downhill in
// energy into the nearest stored pattern. The input array is not modified.
export function hopfieldRecall(w, input, steps = 5) {
    const state = [...input];
    const n = state.length;

    for (let step = 0; step < steps; step++) {

        for (let i = 0; i < n; i++) {
            let sum = 0;

            for (let j = 0; j < n; j++) {
                sum += w[i][j] * state[j];
            }

            state[i] = sum >= 0 ? 1 : -1;
        }

    }

    return state;
}

// E = -1/2 · Σ_ij w_ij · s_i · s_j   (lower means more stable)
export function hopfieldEnergy(w, state) {
    let sum = 0;

    for (let i = 0; i < state.length; i++) {

        for (let j = 0; j < state.length; j++) {
            sum += w[i][j] * state[i] * state[j];
        }

    }

    return -0.5 * sum;
}

// Render a bipolar pattern as a grid of # and .
export function showPattern(pattern, width = 4) {
    const rows = [];

    for (let i = 0; i < pattern.length; i += width) {
        rows.push(
        pattern
            .slice(i, i + width)
            .map((v) => (v === 1 ? '#' : '.'))
            .join(' '),
        );
    }

    console.log(rows.join('\n'));
}

// Demo: train on 16-bit 'X' and 'O', then recall a corrupted 'X'.
function demo() {
    const patternX = [
        1, -1, -1,  1,
        -1,  1,  1, -1,
        -1,  1,  1, -1,
        1, -1, -1,  1,
    ];
    const patternO = [
        1,  1,  1, 1,
        1, -1, -1, 1,
        1, -1, -1, 1,
        1,  1,  1, 1,
    ];
    const w = hopfieldTrain([patternX, patternO], 16);

    // Corrupt the X by flipping 3 bits (indices 0, 5, 10).
    const noisy = [...patternX];

    for (const i of [0, 5, 10]) {
        noisy[i] = -noisy[i];
    }

    const recalled = hopfieldRecall(w, noisy);

    console.log(`Original Pattern 'X' (Energy: ${hopfieldEnergy(w, patternX).toFixed(1)}):`);
    showPattern(patternX);
    console.log(`\nNoisy Pattern with 3 bit-flips (Energy: ${hopfieldEnergy(w, noisy).toFixed(1)}):`);
    showPattern(noisy);
    console.log(`\nRecalled Associative Memory (Energy: ${hopfieldEnergy(w, recalled).toFixed(1)}):`);
    showPattern(recalled);
    console.log(`\nRecovered perfectly? ${recalled.every((v, i) => v === patternX[i])}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) demo();
