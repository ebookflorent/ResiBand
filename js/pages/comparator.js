import { candidates, getCandidateById } from '../data/candidates.js';
import { themes } from '../data/themes.js';
import { allMeasures } from '../data/measures/index.js';
import { defaultWeights } from '../data/scoring-weights.js';
import { buildComparisonData } from '../lib/comparison.js';
import { getScoreClass, getImpactLabel, getImpactClass } from '../lib/scoring.js';
import { formatBudgetRange } from '../lib/formatting.js';

export async function renderComparator(container) {
  const params = new URLSearchParams(window.location.search);
  const preselected = (params.get('candidats') || '').split(',').filter(Boolean);

  container.innerHTML = `
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">⚖️ Comparateur de programmes</h1>
        <p class="page-subtitle">Selectionnez 2 ou 3 candidats pour comparer leurs propositions theme par theme</p>
      </div>

      <div class="comparison-selector card mb-3">
        <div class="selector-group">
          <label class="selector-label" for="candidate-1">Candidat 1</label>
          <select class="selector-select" id="candidate-1">
            <option value="">-- Choisir --</option>
            ${candidates.map(c => `<option value="${c.id}" ${preselected[0] === c.id ? 'selected' : ''}>${c.fullName} (${c.party.abbreviation})</option>`).join('')}
          </select>
        </div>
        <div class="selector-group">
          <label class="selector-label" for="candidate-2">Candidat 2</label>
          <select class="selector-select" id="candidate-2">
            <option value="">-- Choisir --</option>
            ${candidates.map(c => `<option value="${c.id}" ${preselected[1] === c.id ? 'selected' : ''}>${c.fullName} (${c.party.abbreviation})</option>`).join('')}
          </select>
        </div>
        <div class="selector-group">
          <label class="selector-label" for="candidate-3">Candidat 3 (optionnel)</label>
          <select class="selector-select" id="candidate-3">
            <option value="">-- Aucun --</option>
            ${candidates.map(c => `<option value="${c.id}" ${preselected[2] === c.id ? 'selected' : ''}>${c.fullName} (${c.party.abbreviation})</option>`).join('')}
          </select>
        </div>
        <div style="display:flex; gap:0.5rem; align-items:flex-end">
          <button class="btn btn-primary" id="compare-btn">Comparer</button>
          <button class="btn btn-sm btn-outline" id="share-btn" style="display:none">Partager</button>
        </div>
      </div>

      <div id="comparison-result"></div>
    </div>
  `;

  const compareBtn = document.getElementById('compare-btn');
  const shareBtn = document.getElementById('share-btn');

  compareBtn.addEventListener('click', () => {
    const ids = [
      document.getElementById('candidate-1').value,
      document.getElementById('candidate-2').value,
      document.getElementById('candidate-3').value,
    ].filter(Boolean);

    if (ids.length < 2) {
      document.getElementById('comparison-result').innerHTML = `
        <div class="callout callout-warning">Veuillez selectionner au moins 2 candidats pour comparer.</div>
      `;
      return;
    }

    const url = new URL(window.location);
    url.searchParams.set('candidats', ids.join(','));
    history.replaceState(null, '', url);
    shareBtn.style.display = '';

    renderComparison(ids);
  });

  shareBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      shareBtn.textContent = 'Lien copie !';
      setTimeout(() => { shareBtn.textContent = 'Partager'; }, 2000);
    });
  });

  if (preselected.length >= 2) {
    shareBtn.style.display = '';
    renderComparison(preselected);
  }
}

function renderComparison(candidateIds) {
  const resultDiv = document.getElementById('comparison-result');
  const selectedCandidates = candidateIds.map(getCandidateById).filter(Boolean);

  if (selectedCandidates.length < 2) {
    resultDiv.innerHTML = '<div class="callout callout-warning">Candidats introuvables.</div>';
    return;
  }

  const comparisonData = buildComparisonData(candidateIds, allMeasures, themes, defaultWeights);
  const colCount = selectedCandidates.length + 1;

  resultDiv.innerHTML = `
    <div class="comparison-grid" style="grid-template-columns: 200px repeat(${selectedCandidates.length}, 1fr)">
      <div class="comparison-row" style="grid-template-columns: 200px repeat(${selectedCandidates.length}, 1fr)">
        <div class="comparison-cell comparison-header-cell">Thematique</div>
        ${selectedCandidates.map(c => `
          <div class="comparison-cell comparison-header-cell">
            <div style="font-size: 1.5rem; margin-bottom: 0.3rem">${c.initials}</div>
            <div style="font-weight: 700">${c.fullName}</div>
            <span class="party-badge" style="background: ${c.party.color}; font-size: 0.7rem; margin-top: 0.3rem">${c.party.abbreviation}</span>
          </div>
        `).join('')}
      </div>

      ${comparisonData.map(row => `
        <div class="comparison-row" style="grid-template-columns: 200px repeat(${selectedCandidates.length}, 1fr)">
          <div class="comparison-cell comparison-theme-cell">
            <span>${row.themeIcon}</span>
            <span>${row.themeLabel}</span>
          </div>
          ${row.candidates.map(cd => `
            <div class="comparison-cell comparison-measure-cell">
              ${cd.measureCount === 0 ? '<p class="no-data">Pas de mesure</p>' : `
                ${cd.themeScore !== null ? `<div class="mb-1"><span class="score-value ${getScoreClass(cd.themeScore)}">${Math.round(cd.themeScore)}/100</span></div>` : ''}
                ${cd.measures.slice(0, 3).map(m => `
                  <div style="margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--color-border-light)">
                    <div style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem">${m.title}</div>
                    <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-bottom: 0.4rem">${m.summary}</div>
                    <div class="flex flex-wrap gap-1">
                      ${m.impact.budget ? `<span class="impact-badge ${m.impact.budget.low < 0 ? 'impact-negative' : 'impact-positive'}" style="font-size:0.7rem">💰 ${formatBudgetRange(m.impact.budget)}</span>` : ''}
                      <span class="impact-badge ${getImpactClass(m.impact.social)}" style="font-size:0.7rem">👥 ${getImpactLabel(m.impact.social)}</span>
                      <span class="impact-badge ${getImpactClass(m.impact.environmental)}" style="font-size:0.7rem">🌱 ${getImpactLabel(m.impact.environmental)}</span>
                    </div>
                  </div>
                `).join('')}
                ${cd.measures.length > 3 ? `<p class="no-data">+ ${cd.measures.length - 3} autre(s) mesure(s)</p>` : ''}
              `}
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>

    <div class="callout callout-info mt-3">
      <strong>Methodologie :</strong> Les scores par theme sont calcules a partir de l'impact budgetaire, social, environnemental et de la faisabilite de chaque mesure.
      <a href="/methodologie" data-link>En savoir plus →</a>
    </div>
  `;
}
