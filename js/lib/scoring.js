// Import will be: import { allMeasures } from '../data/measures/index.js';

// Normalize impact level (-3 to +3) to 0-100
export function normalizeImpactLevel(value) {
  return ((value + 3) / 6) * 100;
}

// Normalize feasibility (1-5) to 0-100
export function normalizeFeasibility(value) {
  return ((value - 1) / 4) * 100;
}

// Normalize budget impact to 0-100 (higher = more savings/revenue)
// Uses all measures to determine the range
export function normalizeBudget(budget, allBudgets) {
  if (!budget) return 50; // neutral if unknown
  const mid = (budget.low + budget.high) / 2;
  // Convert all to same unit for comparison
  const allMids = allBudgets
    .filter(b => b !== null)
    .map(b => {
      const m = (b.low + b.high) / 2;
      return b.unit === 'milliards' ? m * 1000 : m;
    });
  const normalizedMid = budget.unit === 'milliards' ? mid * 1000 : mid;
  const min = Math.min(...allMids);
  const max = Math.max(...allMids);
  if (max === min) return 50;
  return ((normalizedMid - min) / (max - min)) * 100;
}

// Score a single measure (0-100)
export function scoreMeasure(measure, weights, allBudgets) {
  const { budget, social, environmental, feasibility } = measure.impact;
  const budgetNorm = normalizeBudget(budget, allBudgets);
  const socialNorm = normalizeImpactLevel(social);
  const envNorm = normalizeImpactLevel(environmental);
  const feasNorm = normalizeFeasibility(feasibility);

  return (
    weights.budget * budgetNorm +
    weights.social * socialNorm +
    weights.environmental * envNorm +
    weights.feasibility * feasNorm
  );
}

// Score a candidate on a specific theme
export function scoreTheme(candidateId, themeId, measures, weights, allBudgets) {
  const themeMeasures = measures.filter(
    m => m.candidateId === candidateId && m.themeId === themeId
  );
  if (themeMeasures.length === 0) return null;
  const scores = themeMeasures.map(m => scoreMeasure(m, weights, allBudgets));
  return {
    themeId,
    score: scores.reduce((a, b) => a + b, 0) / scores.length,
    measureCount: themeMeasures.length,
  };
}

// Calculate data confidence for a candidate (0-100)
export function calculateConfidence(candidateId, measures, totalThemes, medianMeasureCount) {
  const candidateMeasures = measures.filter(m => m.candidateId === candidateId);
  const total = candidateMeasures.length;
  if (total === 0) return 0;

  const themesWithMeasures = new Set(candidateMeasures.map(m => m.themeId)).size;
  const officialCount = candidateMeasures.filter(m => m.status === 'programme-officiel').length;

  return (
    0.4 * (themesWithMeasures / totalThemes) +
    0.3 * (officialCount / total) +
    0.3 * Math.min(1, total / medianMeasureCount)
  ) * 100;
}

// Full candidate score
export function scoreCandidateGlobal(candidateId, measures, themes, weights, themeWeights = null) {
  const allBudgets = measures.map(m => m.impact.budget);
  const equalThemeWeight = 1 / themes.length;

  const themeScores = themes.map(theme => {
    const ts = scoreTheme(candidateId, theme.id, measures, weights, allBudgets);
    return {
      themeId: theme.id,
      score: ts ? ts.score : null,
      measureCount: ts ? ts.measureCount : 0,
      weight: themeWeights ? (themeWeights[theme.id] || 0) : equalThemeWeight,
    };
  });

  const scored = themeScores.filter(ts => ts.score !== null);
  if (scored.length === 0) return { themeScores, overallScore: 0, confidence: 0 };

  const totalWeight = scored.reduce((sum, ts) => sum + ts.weight, 0);
  const overallScore = totalWeight > 0
    ? scored.reduce((sum, ts) => sum + (ts.weight / totalWeight) * ts.score, 0)
    : 0;

  // Calculate confidence
  const measureCounts = measures.reduce((acc, m) => {
    acc[m.candidateId] = (acc[m.candidateId] || 0) + 1;
    return acc;
  }, {});
  const counts = Object.values(measureCounts).sort((a, b) => a - b);
  const medianCount = counts[Math.floor(counts.length / 2)] || 1;
  const confidence = calculateConfidence(candidateId, measures, themes.length, medianCount);

  return { themeScores, overallScore, confidence };
}

// Get score class for CSS
export function getScoreClass(score) {
  if (score >= 65) return 'score-high';
  if (score >= 40) return 'score-medium';
  return 'score-low';
}

// Get impact class for CSS
export function getImpactClass(level) {
  const classes = {
    '-3': 'impact-very-negative',
    '-2': 'impact-negative',
    '-1': 'impact-slightly-negative',
    '0': 'impact-neutral',
    '1': 'impact-slightly-positive',
    '2': 'impact-positive',
    '3': 'impact-very-positive',
  };
  return classes[String(level)] || 'impact-neutral';
}

// Get impact label in French
export function getImpactLabel(level) {
  const labels = {
    '-3': 'Très négatif',
    '-2': 'Négatif',
    '-1': 'Légèrement négatif',
    '0': 'Neutre',
    '1': 'Légèrement positif',
    '2': 'Positif',
    '3': 'Très positif',
  };
  return labels[String(level)] || 'Neutre';
}

export function getFeasibilityLabel(score) {
  const labels = { 1: 'Très difficile', 2: 'Difficile', 3: 'Modérée', 4: 'Faisable', 5: 'Facilement réalisable' };
  return labels[score] || 'Non évalué';
}
