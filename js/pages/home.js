import { candidates } from '../data/candidates.js';
import { themes } from '../data/themes.js';
import { allMeasures, getMeasuresByCandidate } from '../data/measures/index.js';
import { scoreCandidateGlobal } from '../lib/scoring.js';
import { defaultWeights } from '../data/scoring-weights.js';
import { formatPercent } from '../lib/formatting.js';
import { scoreRing, partyBadge, candidacyBadge, partyVars } from '../lib/ui.js';

export async function renderHome(container) {
  const candidateScores = candidates.map(c => {
    const measures = getMeasuresByCandidate(c.id);
    const { overallScore, confidence } = scoreCandidateGlobal(c.id, allMeasures, themes, defaultWeights);
    const themesWithData = new Set(measures.map(m => m.themeId)).size;
    return { ...c, overallScore, confidence, measureCount: measures.length, themesWithData };
  }).sort((a, b) => b.overallScore - a.overallScore);

  const totalMeasures = allMeasures.length;

  container.innerHTML = `
    <section class="hero">
      <div class="container">
        <div class="hero-badge fade-in">
          <span class="dot"></span>
          Mis à jour en continu — Présidentielle 2027
        </div>
        <h1 class="hero-title fade-in stagger-1">
          Comparez les programmes,<br><span class="grad">votez en connaissance</span>
        </h1>
        <p class="hero-subtitle fade-in stagger-2">
          Un outil transparent et non partisan pour analyser les propositions des candidats,
          mesurer leur impact budgétaire, social et environnemental, et trouver le programme
          qui correspond à vos priorités.
        </p>
        <div class="hero-actions fade-in stagger-3">
          <a href="/mon-candidat" class="btn btn-primary btn-lg" data-link>
            🎯 Trouver mon candidat
          </a>
          <a href="/comparateur" class="btn btn-secondary btn-lg" data-link>
            ⚖️ Comparer les programmes
          </a>
        </div>
      </div>
      <svg class="hero-wave" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
        <path fill="currentColor" d="M0,48 C240,95 480,10 720,38 C960,66 1200,80 1440,30 L1440,90 L0,90 Z"/>
      </svg>
    </section>

    <div class="container hero-stats-wrap">
      <div class="stats-row" style="margin-top:0">
        <div class="stat-card card fade-in stagger-2">
          <div class="stat-value">${candidates.length}</div>
          <div class="stat-label">Candidats analysés</div>
        </div>
        <div class="stat-card card fade-in stagger-3">
          <div class="stat-value">${totalMeasures}</div>
          <div class="stat-label">Mesures répertoriées</div>
        </div>
        <div class="stat-card card fade-in stagger-4">
          <div class="stat-value">${themes.length}</div>
          <div class="stat-label">Thématiques couvertes</div>
        </div>
        <div class="stat-card card fade-in stagger-5">
          <div class="stat-value">100<span style="font-size:0.55em">%</span></div>
          <div class="stat-label">Sources publiques citées</div>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="page-header" data-reveal>
        <span class="section-kicker">Vue d'ensemble</span>
        <h2 class="page-title">Les candidats</h2>
        <p class="page-subtitle">Scores globaux, complétude des programmes et fiabilité des données pour chaque candidat.</p>
      </div>

      <div id="filter-bar" class="filter-bar" data-reveal>
        <button class="filter-chip active" data-filter="all">Tous</button>
        <button class="filter-chip" data-filter="gauche">Gauche</button>
        <button class="filter-chip" data-filter="centre">Centre</button>
        <button class="filter-chip" data-filter="centre-droit">Centre-droit</button>
        <button class="filter-chip" data-filter="droite">Droite</button>
        <button class="filter-chip" data-filter="extreme-droite">Extrême droite</button>
      </div>

      <div class="candidates-grid" id="candidates-grid">
        ${candidateScores.map((c, i) => renderCandidateCard(c, i)).join('')}
      </div>

      <div class="text-center mt-4" data-reveal>
        <a href="/candidats" class="btn btn-outline" data-link>
          Voir l'analyse détaillée de tous les candidats →
        </a>
      </div>
    </div>
  `;

  setupFilters(candidateScores);
}

export function renderCandidateCard(c, index) {
  const completeness = Math.round((c.themesWithData / themes.length) * 100);

  return `
    <a href="/candidats/${c.id}" data-link class="card card-clickable candidate-card fade-in stagger-${(index % 8) + 1}"
       style="${partyVars(c.party)}" data-family="${c.party.politicalFamily}">
      <div class="candidate-banner"></div>
      <div class="candidate-card-body">
        <div class="candidate-avatar">${c.initials}</div>
        <h3 class="candidate-name">${c.fullName}</h3>
        <div class="candidate-badges">
          ${partyBadge(c.party)}
          ${candidacyBadge(c.candidacyStatus)}
        </div>
        <p class="candidate-role">${c.currentRole}</p>
        <div class="candidate-key">
          ${scoreRing(c.overallScore, { size: 72, stroke: 7 })}
          <div class="candidate-key-stats">
            <div class="key-stat">
              <span class="key-stat-value">${c.measureCount}</span>
              <span class="key-stat-label">mesures</span>
            </div>
            <div class="key-stat">
              <span class="key-stat-value">${formatPercent(c.confidence)}</span>
              <span class="key-stat-label">confiance</span>
            </div>
          </div>
        </div>
        <div class="candidate-completeness">
          <div class="completeness-bar">
            <div class="completeness-fill" style="width: ${completeness}%"></div>
          </div>
          <p class="completeness-label">${completeness} % des thèmes couverts</p>
        </div>
        <span class="candidate-cta mt-2">Voir le programme <span aria-hidden="true">→</span></span>
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
    const list = filter === 'all'
      ? candidateScores
      : candidateScores.filter(c => c.party.politicalFamily === filter);

    if (list.length === 0) {
      grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🗂️</div><div class="empty-state-text">Aucun candidat dans cette famille politique</div></div>';
    } else {
      grid.innerHTML = list.map((c, i) => renderCandidateCard(c, i)).join('');
    }
  });
}
