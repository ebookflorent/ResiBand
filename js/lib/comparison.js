import { scoreTheme } from './scoring.js';
import { aggregateBudgetImpact, aggregateImpactByAxis } from './impact.js';

// Build comparison data for selected candidates across themes
export function buildComparisonData(candidateIds, measures, themes, weights) {
  const allBudgets = measures.map(m => m.impact.budget);

  return themes.map(theme => {
    const candidates = candidateIds.map(candidateId => {
      const candidateMeasures = measures.filter(
        m => m.candidateId === candidateId && m.themeId === theme.id
      );
      const ts = scoreTheme(candidateId, theme.id, measures, weights, allBudgets);

      return {
        candidateId,
        measures: candidateMeasures,
        themeScore: ts ? ts.score : null,
        measureCount: candidateMeasures.length,
        budget: aggregateBudgetImpact(candidateMeasures),
        impacts: aggregateImpactByAxis(candidateMeasures),
      };
    });

    return {
      themeId: theme.id,
      themeLabel: theme.label,
      themeIcon: theme.icon,
      candidates,
    };
  }).filter(row => row.candidates.some(c => c.measureCount > 0));
}
