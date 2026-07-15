import { candidates } from '../data/candidates.js';
import { themes } from '../data/themes.js';
import { allMeasures, getMeasuresByCandidate } from '../data/measures/index.js';
import { aggregateBudgetImpact, aggregateImpactByAxis, budgetByTheme } from '../lib/impact.js';
import { getImpactLabel } from '../lib/scoring.js';

export async function renderImpact(container) {
  const candidateData = candidates.map(c => {
    const measures = getMeasuresByCandidate(c.id);
    const budget = aggregateBudgetImpact(measures);
    const impacts = aggregateImpactByAxis(measures);
    const byTheme = budgetByTheme(measures, themes);
    return { ...c, measures, budget, impacts, byTheme };
  });

  candidateData.sort((a, b) => b.budget.midpoint - a.budget.midpoint);

  const maxBudget = Math.max(...candidateData.map(c => Math.abs(c.budget.midpoint)), 1);

  container.innerHTML = `
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">📊 Tableau de bord d'impact</h1>
        <p class="page-subtitle">Analysez et comparez l'impact budgetaire, social et environnemental des programmes</p>
      </div>

      <div class="tabs" id="impact-tabs">
        <button class="tab active" data-tab="budget">💰 Impact budgetaire</button>
        <button class="tab" data-tab="social">👥 Impact social</button>
        <button class="tab" data-tab="environment">🌱 Impact environnemental</button>
        <button class="tab" data-tab="feasibility">⚙️ Faisabilite</button>
      </div>

      <div id="tab-content"></div>
    </div>
  `;

  function renderTab(tabId) {
    const content = document.getElementById('tab-content');

    switch (tabId) {
      case 'budget':
        content.innerHTML = renderBudgetTab(candidateData, maxBudget);
        break;
      case 'social':
        content.innerHTML = renderAxisTab(candidateData, 'social', '👥', 'Impact social');
        break;
      case 'environment':
        content.innerHTML = renderAxisTab(candidateData, 'environmental', '🌱', 'Impact environnemental');
        break;
      case 'feasibility':
        content.innerHTML = renderFeasibilityTab(candidateData);
        break;
    }
  }

  document.getElementById('impact-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    renderTab(tab.dataset.tab);
  });

  renderTab('budget');
}

function renderBudgetTab(candidateData, maxBudget) {
  const sorted = [...candidateData].sort((a, b) => a.budget.midpoint - b.budget.midpoint);

  return `
    <div class="card mb-3">
      <h3 class="impact-card-title">Impact budgetaire total estime par candidat</h3>
      <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 1.5rem">
        Estimation de l'impact cumule de toutes les mesures chiffrees (en millions d'euros par an)
      </p>
      <div class="bar-chart">
        ${sorted.map(c => {
          const pct = Math.abs(c.budget.midpoint) / maxBudget * 100;
          const isNegative = c.budget.midpoint < 0;
          const fillClass = isNegative ? 'bar-fill-negative' : c.budget.midpoint > 0 ? 'bar-fill-positive' : 'bar-fill-neutral';
          const sign = isNegative ? '' : '+';
          return `
            <div class="bar-row">
              <span class="bar-label">
                <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${c.party.color}; margin-right:0.4rem"></span>
                ${c.fullName}
              </span>
              <div class="bar-track">
                <div class="bar-fill ${fillClass}" style="width: ${Math.max(pct, 5)}%"></div>
              </div>
              <span class="bar-value" style="color: ${isNegative ? 'var(--color-negative)' : 'var(--color-positive)'}">
                ${sign}${Math.round(c.budget.midpoint).toLocaleString('fr-FR')} M€
              </span>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div class="callout callout-warning mb-3">
      <strong>Avertissement :</strong> Ces estimations sont basees sur les chiffrages disponibles et ne couvrent pas l'ensemble des mesures.
      ${sorted[0].budget.measuredCount} a ${sorted[sorted.length - 1].budget.measuredCount} mesures chiffrees sur ${sorted[0].budget.totalCount} a ${sorted[sorted.length - 1].budget.totalCount} au total.
    </div>

    <h3 style="font-size: 1.2rem; font-weight: 700; margin: 2rem 0 1rem">Detail par thematique</h3>

    ${renderBudgetByThemeTable(candidateData)}
  `;
}

function renderBudgetByThemeTable(candidateData) {
  const activeThemes = themes.filter(t =>
    candidateData.some(c => c.byTheme.some(bt => bt.themeId === t.id))
  );

  return `
    <div style="overflow-x: auto">
      <table class="data-table">
        <thead>
          <tr>
            <th>Theme</th>
            ${candidateData.map(c => `<th style="text-align:right">${c.lastName}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${activeThemes.map(theme => `
            <tr>
              <td>${theme.icon} ${theme.label}</td>
              ${candidateData.map(c => {
                const bt = c.byTheme.find(b => b.themeId === theme.id);
                if (!bt || bt.measuredCount === 0) return '<td class="text-right no-data">--</td>';
                const val = Math.round(bt.midpoint);
                const color = val < 0 ? 'var(--color-negative)' : val > 0 ? 'var(--color-positive)' : 'var(--color-text-muted)';
                return `<td style="text-align:right; font-weight:600; color:${color}">${val > 0 ? '+' : ''}${val.toLocaleString('fr-FR')} M€</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderAxisTab(candidateData, axis, icon, title) {
  const sorted = [...candidateData]
    .map(c => ({ ...c, axisValue: c.impacts[axis] }))
    .sort((a, b) => b.axisValue - a.axisValue);

  return `
    <div class="card mb-3">
      <h3 class="impact-card-title">${icon} ${title} moyen par candidat</h3>
      <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 1.5rem">
        Score moyen de l'impact ${title.toLowerCase()} des mesures (echelle de -3 a +3)
      </p>
      <div class="bar-chart">
        ${sorted.map(c => {
          const pct = ((c.axisValue + 3) / 6) * 100;
          const isNeg = c.axisValue < 0;
          const fillClass = isNeg ? 'bar-fill-negative' : c.axisValue > 0 ? 'bar-fill-positive' : 'bar-fill-neutral';
          return `
            <div class="bar-row">
              <span class="bar-label">
                <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${c.party.color}; margin-right:0.4rem"></span>
                ${c.fullName}
              </span>
              <div class="bar-track">
                <div class="bar-fill ${fillClass}" style="width: ${Math.max(pct, 5)}%"></div>
              </div>
              <span class="bar-value" style="color: ${isNeg ? 'var(--color-negative)' : 'var(--color-positive)'}">
                ${c.axisValue > 0 ? '+' : ''}${c.axisValue.toFixed(1)} — ${getImpactLabel(Math.round(c.axisValue))}
              </span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderFeasibilityTab(candidateData) {
  const sorted = [...candidateData]
    .map(c => ({ ...c, feas: c.impacts.feasibility }))
    .sort((a, b) => b.feas - a.feas);

  return `
    <div class="card mb-3">
      <h3 class="impact-card-title">⚙️ Faisabilite moyenne des mesures</h3>
      <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 1.5rem">
        Score moyen de faisabilite des mesures (echelle de 1 a 5)
      </p>
      <div class="bar-chart">
        ${sorted.map(c => {
          const pct = ((c.feas - 1) / 4) * 100;
          const fillClass = c.feas >= 3.5 ? 'bar-fill-positive' : c.feas >= 2.5 ? 'bar-fill-neutral' : 'bar-fill-negative';
          return `
            <div class="bar-row">
              <span class="bar-label">
                <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${c.party.color}; margin-right:0.4rem"></span>
                ${c.fullName}
              </span>
              <div class="bar-track">
                <div class="bar-fill ${fillClass}" style="width: ${Math.max(pct, 5)}%"></div>
              </div>
              <span class="bar-value">${c.feas.toFixed(1)} / 5</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
