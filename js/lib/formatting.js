export function formatCurrency(amount, unit = 'millions') {
  // Format number with French locale (spaces for thousands, comma for decimal)
  // Add "M€" or "Md€" suffix based on unit
  const formatter = new Intl.NumberFormat('fr-FR');
  const suffix = unit === 'milliards' ? ' Md€' : ' M€';
  return formatter.format(Math.abs(amount)) + suffix;
}

export function formatBudgetRange(budget) {
  // Format a budget impact range like "-15 000 à -20 000 M€/an"
  if (!budget) return 'Non estime';
  const low = formatCurrency(budget.low, budget.unit);
  const high = formatCurrency(budget.high, budget.unit);
  const prefix = budget.low < 0 ? '' : '+';
  const timeLabel = budget.timeframe === 'annuel' ? '/an' : budget.timeframe === 'quinquennat' ? '/5 ans' : '';
  if (budget.low === budget.high) return prefix + low + timeLabel;
  return `${prefix}${low} a ${formatCurrency(Math.abs(budget.high), budget.unit)}${timeLabel}`;
}

export function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatPercent(value) {
  return Math.round(value) + ' %';
}
