// Aggregate budget impact for a candidate
export function aggregateBudgetImpact(measures) {
  let totalLow = 0;
  let totalHigh = 0;
  let counted = 0;

  for (const m of measures) {
    if (!m.impact.budget) continue;
    const multiplier = m.impact.budget.unit === 'milliards' ? 1000 : 1;
    totalLow += m.impact.budget.low * multiplier;
    totalHigh += m.impact.budget.high * multiplier;
    counted++;
  }

  return {
    low: totalLow,
    high: totalHigh,
    midpoint: (totalLow + totalHigh) / 2,
    measuredCount: counted,
    totalCount: measures.length,
    unit: 'millions',
  };
}

// Aggregate impact by axis for a candidate
export function aggregateImpactByAxis(measures) {
  if (measures.length === 0) return { social: 0, environmental: 0, feasibility: 0, liberty: 0, european: 0 };

  const sum = measures.reduce((acc, m) => ({
    social: acc.social + m.impact.social,
    environmental: acc.environmental + m.impact.environmental,
    feasibility: acc.feasibility + m.impact.feasibility,
    liberty: acc.liberty + m.impact.libertyImpact,
    european: acc.european + m.impact.europeanCompatibility,
  }), { social: 0, environmental: 0, feasibility: 0, liberty: 0, european: 0 });

  const n = measures.length;
  return {
    social: sum.social / n,
    environmental: sum.environmental / n,
    feasibility: sum.feasibility / n,
    liberty: sum.liberty / n,
    european: sum.european / n,
  };
}

// Get budget impact by theme for a candidate
export function budgetByTheme(measures, themes) {
  return themes.map(theme => {
    const themeMeasures = measures.filter(m => m.themeId === theme.id);
    const budget = aggregateBudgetImpact(themeMeasures);
    return {
      themeId: theme.id,
      themeLabel: theme.label,
      ...budget,
    };
  }).filter(t => t.measuredCount > 0);
}
