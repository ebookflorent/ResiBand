import { candidates, getCandidateById } from '../data/candidates.js';
import { themes } from '../data/themes.js';
import { allMeasures } from '../data/measures/index.js';
import { defaultWeights } from '../data/scoring-weights.js';
import { buildComparisonData } from '../lib/comparison.js';
import { getScoreClass, getImpactLabel, getImpactClass } from '../lib/scoring.js';
import { formatBudgetRange } from '../lib/formatting.js';
import { partyBadge, onColor } from '../lib/ui.js';

export async function renderComparator(container) {
  const params = new URLSearchParams(window.location.search);
  const preselected = (params.get('candidats') || '').split(',').filter(Boolean);

  container.innerHTML = `
    <div class="container">
      <div class="page-header">
        <span class="section-kicker">Face à face</span>
        <h1 class="page-title">Comparateur de programmes</h1>
        <p class="page-subtitle">Sélectionnez 2 ou 3 candidats pour comparer leurs propositions thème par thème. Le lien de la page est partageable.</p>
      </div>

      <div class="comparison-selector card mb-3">
        <div class="selector-group">
          <label class="selector-label" for="candidate-1">Candidat 1</label>
          <select class="selector-select" id="candidate-1">
            <option value="">— Choisir —</option>
            ${candidates.map(c => `<option value="${c.id}" ${preselected[0] === c.id ? 'selected' : ''}>${c.fullName} (${c.party.abbreviation})</option>`).join('')}
          </select>
        </div>
        <div class="selector-group">
          <label class="selector-label" for="candidate-2">Candidat 2</label>
          <select class="selector-select" id="candidate-2">
            <option value="">— Choisir —</option>
            ${candidates.map(c => `<option value="${c.id}" ${preselected[1] === c.id ? 'selected' : ''}>${c.fullName} (${c.party.abbreviation})</option>`).join('')}
          </select>
        </div>
        <div class="selector-group">
          <label class="selector-label" for="candidate-3">Candidat 3 <span style="text-transform:none; letter-spacing:0">(optionnel)</span></label>
          <select class="selector-select" id="candidate-3">
            <option value="">— Aucun —</option>
            ${candidates.map(c => `<option value="${c.id}" ${preselected[2] === c.id ? 'selected' : ''}>${c.fullName} (${c.party.abbreviation})</option>`).join('')}
          </select>
        </div>
        <div style="display:flex; gap:0.6rem; align-items:center">
          <button class="btn btn-primary" id="compare-btn">Comparer</button>
          <button class="btn btn-sm btn-outline" id="share-btn" style="display:none">🔗 Partager</button>
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
        <div class="callout callout-warning">Veuillez sélectionner au moins 2 candidats pour lancer la comparaison.</div>
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
      shareBtn.textContent = '✓ Lien copié !';
      setTimeout(() => { shareBtn.textContent = '🔗 Partager'; }, 2000);
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
  const cols = `minmax(150px, 190px) repeat(${selectedCandidates.length}, minmax(230px, 1fr))`;

  resultDiv.innerHTML = `
    <div class="comparison-wrap fade-in">
      <div class="comparison-grid">
        <div class="comparison-row comparison-head" style="grid-template-columns: ${cols}">
          <div class="comparison-cell comparison-header-cell" style="align-self:end">
            <span class="section-kicker" style="margin:0">Thématique</span>
          </div>
          ${selectedCandidates.map(c => `
            <div class="comparison-cell comparison-header-cell" style="--pc:${c.party.color}; --pc-ink:${onColor(c.party.color)}">
              <div class="cmp-avatar">${c.initials}</div>
              <div class="cmp-name">${c.fullName}</div>
              <div style="margin-top:0.35rem">${partyBadge(c.party, 'font-size:0.68rem')}</div>
            </div>
          `).join('')}
        </div>

        ${comparisonData.map(row => `
          <div class="comparison-row" style="grid-template-columns: ${cols}">
            <div class="comparison-cell comparison-theme-cell">
              <span>${row.themeIcon}</span>
              <span>${row.themeLabel}</span>
            </div>
            ${row.candidates.map(cd => `
              <div class="comparison-cell comparison-measure-cell">
                ${cd.measureCount === 0 ? '<p class="no-data">Pas encore de mesure connue</p>' : `
                  ${cd.themeScore !== null ? `<div class="mb-1"><span class="score-value ${getScoreClass(cd.themeScore)}">${Math.round(cd.themeScore)}/100</span></div>` : ''}
                  ${cd.measures.slice(0, 3).map(m => `
                    <div class="cmp-measure">
                      <div class="cmp-measure-title">${m.title}</div>
                      <div class="cmp-measure-summary">${m.summary}</div>
                      <div class="flex flex-wrap gap-1">
                        ${m.impact.budget ? `<span class="impact-badge ${m.impact.budget.low < 0 ? 'impact-negative' : 'impact-positive'}" style="font-size:0.7rem">💰 ${formatBudgetRange(m.impact.budget)}</span>` : ''}
                        <span class="impact-badge ${getImpactClass(m.impact.social)}" style="font-size:0.7rem">👥 ${getImpactLabel(m.impact.social)}</span>
                        <span class="impact-badge ${getImpactClass(m.impact.environmental)}" style="font-size:0.7rem">🌱 ${getImpactLabel(m.impact.environmental)}</span>
                      </div>
                    </div>
                  `).join('')}
                  ${cd.measures.length > 3 ? `<p class="no-data" style="margin-top:0.5rem">+ ${cd.measures.length - 3} autre${cd.measures.length - 3 > 1 ? 's' : ''} mesure${cd.measures.length - 3 > 1 ? 's' : ''}</p>` : ''}
                `}
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
    </div>

    <div class="callout callout-info mt-3">
      <strong>Méthodologie :</strong> les scores par thème sont calculés à partir de l'impact budgétaire, social, environnemental et de la faisabilité de chaque mesure.
      <a href="/methodologie" data-link>En savoir plus →</a>
    </div>
  `;
}
