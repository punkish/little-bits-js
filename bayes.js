// node bayes.js   (Bayesian inference)
//
// A distribution is a plain object { hypothesis: probability }.
import { fileURLToPath } from 'node:url';

export function bayesNormalize(dist) {
  const sum = Object.values(dist).reduce((a, b) => a + b, 0);
  return Object.fromEntries(
    Object.entries(dist).map(([hypothesis, p]) => [hypothesis, p / sum]),
  );
}

// posterior ∝ prior × likelihood(evidence | hypothesis), then normalize.
export function bayesUpdate(dist, evidence, likelihoodFn) {
  return bayesNormalize(
    Object.fromEntries(
      Object.entries(dist).map(([hypothesis, p]) => [
        hypothesis,
        p * likelihoodFn(hypothesis, evidence),
      ]),
    ),
  );
}

// Maximum a posteriori: the [hypothesis, probability] pair with the highest probability.
export function mapHypothesis(dist) {
  return Object.entries(dist).reduce((a, b) => (a[1] > b[1] ? a : b));
}

// Demo: medical screening and the base-rate fallacy.
// Prevalence 1%; the test has 95% sensitivity and a 5% false-positive rate.
function demo() {
  const prior = { 'has-disease': 0.01, healthy: 0.99 };
  const likelihood = (hypothesis, testResult) => {
    if (hypothesis === 'has-disease') return testResult === '+' ? 0.95 : 0.05;
    return testResult === '+' ? 0.05 : 0.95;
  };
  const post1 = bayesUpdate(prior, '+', likelihood);
  const post2 = bayesUpdate(post1, '+', likelihood);

  const show = (dist) =>
    Object.entries(dist)
      .map(([hypothesis, p]) => `${hypothesis}: ${p.toFixed(4)}`)
      .join(', ');

  console.log(`Prior:         ${show(prior)}`);
  console.log(`After 1st (+): ${show(post1)}  -> MAP: ${mapHypothesis(post1)[0]}`);
  console.log(`After 2nd (+): ${show(post2)}  -> MAP: ${mapHypothesis(post2)[0]}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) demo();
