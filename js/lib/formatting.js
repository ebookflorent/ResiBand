export function formatCurrency(amount, unit = 'millions') {
  // Format number with French locale (spaces for thousands, comma for decimal)
  // Add "M€" or "Md€" suffix based on unit
  const formatter = new Intl.NumberFormat('fr-FR');
  const suffix = unit === 'milliards' ? ' Md€' : ' M€';
  return formatter.format(Math.abs(amount)) + suffix;
}

export function formatBudgetRange(budget) {
  // Format a budget impact range like "−15 000 à −20 000 M€/an"
  // Chaque borne porte son signe : un coût reste visiblement négatif
  if (!budget) return 'Non estimé';
  const signed = (v) => (v < 0 ? '−' : '+') + formatCurrency(v, budget.unit);
  const timeLabel = budget.timeframe === 'annuel' ? '/an' : budget.timeframe === 'quinquennat' ? '/5 ans' : '';
  if (budget.low === budget.high) return signed(budget.low) + timeLabel;
  return `${signed(budget.low)} à ${signed(budget.high)}${timeLabel}`;
}

export function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatPercent(value) {
  return Math.round(value) + ' %';
}
