import { candidates } from '../data/candidates.js';
import { themes } from '../data/themes.js';
import { getMeasuresByCandidate } from '../data/measures/index.js';
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
        <span class="section-kicker">Analyse comparée</span>
        <h1 class="page-title">Tableau de bord d'impact</h1>
        <p class="page-subtitle">Comparez l'impact budgétaire, social et environnemental des programmes, ainsi que leur faisabilité.</p>
      </div>

      <div class="tabs" id="impact-tabs" role="tablist">
        <button class="tab active" data-tab="budget">💰 Budget</button>
        <button class="tab" data-tab="social">👥 Social</button>
        <button class="tab" data-tab="environment">🌱 Environnement</button>
        <button class="tab" data-tab="feasibility">⚙️ Faisabilité</button>
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
    if (window.__vcRefreshReveal) window.__vcRefreshReveal();
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

function barRow(c, pct, fillClass, valueHtml) {
  return `
    <div class="bar-row">
      <span class="bar-label">
        <span class="party-dot" style="background:${c.party.color}"></span>
        ${c.fullName}
      </span>
      <div class="bar-track">
        <div class="bar-fill ${fillClass}" style="width: ${Math.max(pct, 4)}%"></div>
      </div>
      <span class="bar-value">${valueHtml}</span>
    </div>
  `;
}

function renderBudgetTab(candidateData, maxBudget) {
  const sorted = [...candidateData].sort((a, b) => a.budget.midpoint - b.budget.midpoint);
  const minMeasured = Math.min(...sorted.map(c => c.budget.measuredCount));
  const maxMeasured = Math.max(...sorted.map(c => c.budget.measuredCount));

  return `
    <div class="card mb-3 fade-in">
      <h3 class="impact-card-title">Impact budgétaire total estimé par candidat</h3>
      <p style="font-size: 0.87rem; color: var(--ink-3); margin-bottom: 1.4rem">
        Impact cumulé des mesures chiffrées, en millions d'euros par an.
        <span style="color:var(--div-neg-text); font-weight:700">Rouge : coût net</span> ·
        <span style="color:var(--div-pos-text); font-weight:700">bleu : économies ou recettes nettes</span>.
      </p>
      <div class="bar-chart">
        ${sorted.map(c => {
          const pct = Math.abs(c.budget.midpoint) / maxBudget * 100;
          const isNegative = c.budget.midpoint < 0;
          const fillClass = isNegative ? 'bar-fill-negative' : c.budget.midpoint > 0 ? 'bar-fill-positive' : 'bar-fill-neutral';
          const color = isNegative ? 'var(--div-neg-text)' : 'var(--div-pos-text)';
          const sign = isNegative ? '' : '+';
          return barRow(c, pct, fillClass,
            `<span style="color:${color}">${sign}${Math.round(c.budget.midpoint).toLocaleString('fr-FR')}&nbsp;M€</span>`);
        }).join('')}
      </div>
    </div>

    <div class="callout callout-warning mb-3">
      <strong>Avertissement :</strong> ces estimations sont basées sur les chiffrages disponibles et ne couvrent pas
      l'ensemble des mesures (${minMeasured} à ${maxMeasured} mesures chiffrées par candidat).
      Les fourchettes détaillées figurent sur les fiches candidats.
    </div>

    <div class="page-header" style="margin-top:2.4rem" data-reveal>
      <h3 style="font-size:1.25rem; font-weight:800; letter-spacing:-0.015em">Détail par thématique</h3>
      <p style="font-size:0.9rem; color:var(--ink-2)">Impact budgétaire annuel estimé par thème (point médian des fourchettes).</p>
    </div>

    ${renderBudgetByThemeTable(candidateData)}
  `;
}

function renderBudgetByThemeTable(candidateData) {
  const activeThemes = themes.filter(t =>
    candidateData.some(c => c.byTheme.some(bt => bt.themeId === t.id))
  );

  return `
    <div class="table-wrap" data-reveal>
      <table class="data-table">
        <thead>
          <tr>
            <th>Thème</th>
            ${candidateData.map(c => `<th style="text-align:right">${c.lastName}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${activeThemes.map(theme => `
            <tr>
              <td style="font-weight:650; white-space:nowrap">${theme.icon} ${theme.label}</td>
              ${candidateData.map(c => {
                const bt = c.byTheme.find(b => b.themeId === theme.id);
                if (!bt || bt.measuredCount === 0) return '<td class="text-right no-data">—</td>';
                const val = Math.round(bt.midpoint);
                const color = val < 0 ? 'var(--div-neg-text)' : val > 0 ? 'var(--div-pos-text)' : 'var(--ink-3)';
                return `<td style="text-align:right; font-weight:700; color:${color}">${val > 0 ? '+' : ''}${val.toLocaleString('fr-FR')}&nbsp;M€</td>`;
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
    <div class="card mb-3 fade-in">
      <h3 class="impact-card-title">${icon} ${title} moyen par candidat</h3>
      <p style="font-size: 0.87rem; color: var(--ink-3); margin-bottom: 1.4rem">
        Score moyen de l'impact ${title.toLowerCase().replace('impact ', '')} des mesures, sur une échelle de −3 (très négatif) à +3 (très positif).
      </p>
      <div class="bar-chart">
        ${sorted.map(c => {
          const pct = ((c.axisValue + 3) / 6) * 100;
          const isNeg = c.axisValue < 0;
          const fillClass = isNeg ? 'bar-fill-negative' : c.axisValue > 0 ? 'bar-fill-positive' : 'bar-fill-neutral';
          const color = isNeg ? 'var(--div-neg-text)' : c.axisValue > 0 ? 'var(--div-pos-text)' : 'var(--ink-3)';
          return barRow(c, pct, fillClass,
            `<span style="color:${color}">${c.axisValue > 0 ? '+' : ''}${c.axisValue.toFixed(1)}</span>
             <span style="font-weight:600; color:var(--ink-3); font-size:0.78rem"> · ${getImpactLabel(Math.round(c.axisValue))}</span>`);
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
    <div class="card mb-3 fade-in">
      <h3 class="impact-card-title">⚙️ Faisabilité moyenne des mesures</h3>
      <p style="font-size: 0.87rem; color: var(--ink-3); margin-bottom: 1.4rem">
        Score moyen de faisabilité juridique, technique et politique des mesures, de 1 (très difficile) à 5 (facilement réalisable).
      </p>
      <div class="bar-chart">
        ${sorted.map(c => {
          const pct = ((c.feas - 1) / 4) * 100;
          const fillClass = c.feas >= 3.5 ? 'bar-fill-positive' : c.feas >= 2.5 ? 'bar-fill-neutral' : 'bar-fill-negative';
          return barRow(c, pct, fillClass, `${c.feas.toFixed(1)}&nbsp;/&nbsp;5`);
        }).join('')}
      </div>
    </div>
  `;
}
