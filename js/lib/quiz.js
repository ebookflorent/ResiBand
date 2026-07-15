import { scoreCandidateGlobal } from './scoring.js';

// Run the quiz matching: given user theme weights, rank candidates
export function calculateQuizResults(candidates, measures, themes, weights, userThemeWeights) {
  // Normalize user weights to sum to 1
  const rawWeights = {};
  let totalWeight = 0;
  for (const tw of userThemeWeights) {
    rawWeights[tw.themeId] = tw.weight;
    totalWeight += tw.weight;
  }

  const normalizedWeights = {};
  for (const [themeId, w] of Object.entries(rawWeights)) {
    normalizedWeights[themeId] = totalWeight > 0 ? w / totalWeight : 1 / themes.length;
  }

  // Score each candidate with user's theme weights
  const results = candidates.map(candidate => {
    const { themeScores, overallScore, confidence } = scoreCandidateGlobal(
      candidate.id, measures, themes, weights, normalizedWeights
    );

    // Calculate per-theme breakdown
    const themeBreakdown = themeScores
      .filter(ts => ts.score !== null)
      .map(ts => ({
        themeId: ts.themeId,
        score: ts.score,
        weight: normalizedWeights[ts.themeId] || 0,
        contribution: (normalizedWeights[ts.themeId] || 0) * ts.score,
      }))
      .sort((a, b) => b.contribution - a.contribution);

    return {
      candidateId: candidate.id,
      candidate,
      matchPercentage: Math.round(overallScore),
      confidence: Math.round(confidence),
      themeBreakdown,
      strongestThemes: themeBreakdown.slice(0, 3).map(t => t.themeId),
    };
  });

  // Sort by match percentage (descending)
  results.sort((a, b) => b.matchPercentage - a.matchPercentage);
  return results;
}
