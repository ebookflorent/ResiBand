import { candidates } from '../data/candidates.js';
import { themes } from '../data/themes.js';
import { allMeasures, getMeasuresByCandidate } from '../data/measures/index.js';
import { scoreCandidateGlobal, getScoreClass } from '../lib/scoring.js';
import { defaultWeights } from '../data/scoring-weights.js';
import { formatPercent } from '../lib/formatting.js';

export async function renderHome(container) {
  const candidateScores = candidates.map(c => {
    const measures = getMeasuresByCandidate(c.id);
    const { overallScore, confidence } = scoreCandidateGlobal(c.id, allMeasures, themes, defaultWeights);
    const themesWithData = new Set(measures.map(m => m.themeId)).size;
    return { ...c, overallScore, confidence, measureCount: measures.length, themesWithData };
  }).sort((a, b) => b.overallScore - a.overallScore);

  const totalMeasures = allMeasures.length;
  const avgMeasures = Math.round(totalMeasures / candidates.length);

  container.innerHTML = `
    <section class="hero">
      <div class="container">
        <h1 class="hero-title">Comparez les programmes<br>presidentiels 2027</h1>
        <p class="hero-subtitle">
          Un outil transparent et non partisan pour analyser les propositions des candidats,
          calculer leur impact et trouver le programme qui correspond a vos priorites.
        </p>
        <div class="hero-actions">
          <a href="/mon-candidat" class="btn btn-primary btn-lg" data-link>
            🎯 Trouver mon candidat
          </a>
          <a href="/comparateur" class="btn btn-secondary btn-lg" data-link>
            ⚖️ Comparer les programmes
          </a>
        </div>
      </div>
    </section>

    <div class="container">
      <div class="stats-row">
        <div class="stat-card card">
          <div class="stat-value">${candidates.length}</div>
          <div class="stat-label">Candidats analyses</div>
        </div>
        <div class="stat-card card">
          <div class="stat-value">${totalMeasures}</div>
          <div class="stat-label">Mesures repertoriees</div>
        </div>
        <div class="stat-card card">
          <div class="stat-value">${themes.length}</div>
          <div class="stat-label">Thematiques couvertes</div>
        </div>
        <div class="stat-card card">
          <div class="stat-value">~${avgMeasures}</div>
          <div class="stat-label">Mesures par candidat</div>
        </div>
      </div>

      <div class="page-header">
        <h2 class="page-title">Les candidats</h2>
        <p class="page-subtitle">Vue d'ensemble des programmes et scores globaux</p>
      </div>

      <div id="filter-bar" class="filter-bar">
        <button class="filter-chip active" data-filter="all">Tous</button>
        <button class="filter-chip" data-filter="extreme-gauche">Extreme gauche</button>
        <button class="filter-chip" data-filter="gauche">Gauche</button>
        <button class="filter-chip" data-filter="centre">Centre</button>
        <button class="filter-chip" data-filter="centre-droit">Centre-droit</button>
        <button class="filter-chip" data-filter="droite">Droite</button>
        <button class="filter-chip" data-filter="extreme-droite">Extreme droite</button>
      </div>

      <div class="candidates-grid" id="candidates-grid">
        ${candidateScores.map((c, i) => renderCandidateCard(c, i)).join('')}
      </div>

      <div class="text-center mt-4">
        <a href="/candidats" class="btn btn-outline" data-link>
          Voir tous les candidats en detail →
        </a>
      </div>
    </div>
  `;

  setupFilters(candidateScores);
}

function renderCandidateCard(c, index) {
  const scoreClass = getScoreClass(c.overallScore);
  const completeness = Math.round((c.themesWithData / themes.length) * 100);
  const statusLabel = { declare: 'Declare', probable: 'Probable', possible: 'Possible' }[c.candidacyStatus] || '';
  const statusClass = `candidacy-${c.candidacyStatus}`;

  return `
    <a href="/candidats/${c.id}" data-link class="card card-clickable candidate-card fade-in stagger-${(index % 8) + 1}"
       style="--party-color: ${c.party.color}" data-family="${c.party.politicalFamily}">
      <div class="candidate-avatar">
        ${c.initials}
      </div>
      <h3 class="candidate-name">${c.fullName}</h3>
      <span class="party-badge" style="background: ${c.party.color}">
        ${c.party.abbreviation}
      </span>
      <span class="candidacy-badge ${statusClass}">${statusLabel}</span>
      <p class="candidate-role">${c.currentRole}</p>
      <div class="candidate-scores">
        <div class="score-row">
          <span class="score-label">Score global</span>
          <span class="score-value ${scoreClass}">${Math.round(c.overallScore)}/100</span>
        </div>
        <div class="score-row">
          <span class="score-label">Mesures</span>
          <span class="score-value">${c.measureCount}</span>
        </div>
        <div class="score-row">
          <span class="score-label">Confiance</span>
          <span class="score-value">${formatPercent(c.confidence)}</span>
        </div>
      </div>
      <div class="candidate-completeness">
        <div class="completeness-bar">
          <div class="completeness-fill" style="width: ${completeness}%"></div>
        </div>
        <p class="completeness-label">${completeness}% des themes couverts</p>
      </div>
    </a>
  `;
}

function setupFilters(candidateScores) {
  const filterBar = document.getElementById('filter-bar');
  if (!filterBar) return;

  filterBar.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;

    filterBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');

    const filter = chip.dataset.filter;
    const grid = document.getElementById('candidates-grid');

    if (filter === 'all') {
      grid.innerHTML = candidateScores.map((c, i) => renderCandidateCard(c, i)).join('');
    } else {
      const filtered = candidateScores.filter(c => c.party.politicalFamily === filter);
      if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-state-text">Aucun candidat dans cette famille politique</div></div>';
      } else {
        grid.innerHTML = filtered.map((c, i) => renderCandidateCard(c, i)).join('');
      }
    }
  });
}
