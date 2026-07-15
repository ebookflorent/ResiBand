import { getCandidateById } from '../data/candidates.js';
import { themes } from '../data/themes.js';
import { allMeasures, getMeasuresByCandidate } from '../data/measures/index.js';
import { scoreCandidateGlobal, getScoreClass, getImpactClass, getImpactLabel, getFeasibilityLabel } from '../lib/scoring.js';
import { aggregateBudgetImpact, aggregateImpactByAxis } from '../lib/impact.js';
import { defaultWeights } from '../data/scoring-weights.js';
import { formatBudgetRange, formatDate, formatPercent } from '../lib/formatting.js';
import { partyBadge, candidacyBadge, statusLabels, statusClasses, scoreRing, partyVars, onColor } from '../lib/ui.js';

export async function renderCandidateDetail(container, params) {
  const candidate = getCandidateById(params.slug);
  if (!candidate) {
    container.innerHTML = `
      <div class="container">
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-text">Candidat introuvable</div>
          <a href="/candidats" class="btn btn-primary mt-2" data-link>Voir tous les candidats</a>
        </div>
      </div>
    `;
    return;
  }

  const measures = getMeasuresByCandidate(candidate.id);
  const { overallScore, confidence, themeScores } = scoreCandidateGlobal(candidate.id, allMeasures, themes, defaultWeights);
  const budget = aggregateBudgetImpact(measures);
  const impacts = aggregateImpactByAxis(measures);
  const themesWithData = new Set(measures.map(m => m.themeId)).size;

  const measuresByTheme = {};
  for (const m of measures) {
    if (!measuresByTheme[m.themeId]) measuresByTheme[m.themeId] = [];
    measuresByTheme[m.themeId].push(m);
  }

  container.innerHTML = `
    <div class="container">
      <div style="margin-top:1.6rem">
        <a href="/candidats" class="btn btn-sm btn-outline mb-3" data-link>← Tous les candidats</a>
      </div>

      <div class="card candidate-profile fade-in" style="${partyVars(candidate.party)}">
        <div class="profile-avatar">${candidate.initials}</div>
        <div class="profile-info">
          <h1>${candidate.fullName}</h1>
          <div class="flex gap-1 flex-wrap mb-1">
            <span class="party-badge" style="background: ${candidate.party.color}; color:${onColor(candidate.party.color)}; ${onColor(candidate.party.color) !== '#ffffff' ? 'text-shadow:none' : ''}">${candidate.party.name}</span>
            ${candidacyBadge(candidate.candidacyStatus, true)}
          </div>
          <p class="profile-bio">${candidate.bio}</p>
          <div class="profile-meta">
            <span class="profile-meta-item">📋 ${measures.length} mesures répertoriées</span>
            <span class="profile-meta-item">📊 ${themesWithData}/${themes.length} thèmes couverts</span>
            <span class="profile-meta-item">🔄 Mis à jour le ${formatDate(candidate.lastUpdated)}</span>
          </div>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-card card fade-in stagger-1" style="display:grid; place-items:center; gap:0.4rem">
          ${scoreRing(overallScore, { size: 82, stroke: 8 })}
          <div class="stat-label">Score global</div>
        </div>
        <div class="stat-card card fade-in stagger-2">
          <div class="stat-value">${formatPercent(confidence)}</div>
          <div class="stat-label">Confiance des données</div>
        </div>
        <div class="stat-card card fade-in stagger-3">
          <div class="stat-value" style="font-size:1.5rem; color: ${budget.midpoint < 0 ? 'var(--div-neg-text)' : 'var(--div-pos-text)'}">
            ${budget.midpoint < 0 ? '' : '+'}${Math.round(budget.midpoint).toLocaleString('fr-FR')}&nbsp;M€
          </div>
          <div class="stat-label">Impact budgétaire estimé / an</div>
        </div>
        <div class="stat-card card fade-in stagger-4">
          <div class="stat-value">${measures.length}</div>
          <div class="stat-label">Mesures analysées</div>
        </div>
      </div>

      <div class="card mb-3" data-reveal>
        <h3 class="impact-card-title">Profil d'impact moyen des mesures</h3>
        <div class="impact-profile-grid">
          ${renderBipolarAxis('👥 Social', impacts.social, 3)}
          ${renderBipolarAxis('🌱 Environnement', impacts.environmental, 3)}
          ${renderBipolarAxis('⚖️ Libertés', impacts.liberty, 3)}
          ${renderBipolarAxis('🇪🇺 Compatibilité UE', impacts.european, 3)}
          ${renderBipolarAxis('⚙️ Faisabilité', impacts.feasibility - 3, 2, ' / 5', impacts.feasibility)}
        </div>
      </div>

      <div class="page-header" data-reveal>
        <span class="section-kicker">Programme détaillé</span>
        <h2 class="page-title">Les mesures, thème par thème</h2>
        <p class="page-subtitle">${measures.length} mesures documentées et sourcées, classées par thématique.</p>
      </div>

      ${themes.filter(t => measuresByTheme[t.id]).map((theme, ti) => {
        const themeMeasures = measuresByTheme[theme.id];
        const ts = themeScores.find(s => s.themeId === theme.id);
        return `
          <div class="measures-section" id="theme-${theme.id}" data-reveal style="--reveal-delay:${Math.min(ti * 0.03, 0.2)}s">
            <div class="theme-header" data-toggle="theme-${theme.id}-list" style="--theme-color:${theme.color}">
              <span class="theme-icon">${theme.icon}</span>
              <h3 class="theme-title">${theme.label}</h3>
              <span class="theme-count">${themeMeasures.length} mesure${themeMeasures.length > 1 ? 's' : ''}</span>
              ${ts && ts.score !== null ? `<span class="score-value ${getScoreClass(ts.score)}">${Math.round(ts.score)}/100</span>` : ''}
              <span class="theme-toggle open">▼</span>
            </div>
            <div class="measures-list" id="theme-${theme.id}-list">
              ${themeMeasures.map(m => `
                <div class="card measure-card" style="--theme-color: ${theme.color}">
                  <div class="measure-header">
                    <h4 class="measure-title">${m.title}</h4>
                    <span class="status-badge ${statusClasses[m.status]}">${statusLabels[m.status]}</span>
                  </div>
                  <p class="measure-summary">${m.summary}</p>
                  <div class="measure-impacts">
                    ${m.impact.budget ? `<span class="impact-badge ${m.impact.budget.low < 0 ? 'impact-negative' : 'impact-positive'}">💰 ${formatBudgetRange(m.impact.budget)}</span>` : ''}
                    <span class="impact-badge ${getImpactClass(m.impact.social)}">👥 ${getImpactLabel(m.impact.social)}</span>
                    <span class="impact-badge ${getImpactClass(m.impact.environmental)}">🌱 ${getImpactLabel(m.impact.environmental)}</span>
                    <span class="impact-badge impact-neutral">⚙️ ${getFeasibilityLabel(m.impact.feasibility)}</span>
                  </div>
                  ${m.sources.length > 0 ? `
                    <div class="measure-sources">
                      ${m.sources.map(s => `
                        <span class="source-link" title="${s.date}">📎 ${s.title} (${s.type})</span>
                      `).join('')}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }).join('')}

      <div class="text-center mt-4" data-reveal>
        <a href="/comparateur?candidats=${candidate.id}" class="btn btn-primary" data-link>⚖️ Comparer avec un autre candidat</a>
      </div>
    </div>
  `;

  setupThemeToggles();
}

// Barre bipolaire centrée sur zéro : la valeur part du centre vers la
// gauche (négatif, rouge) ou la droite (positif, bleu)
function renderBipolarAxis(label, value, maxAbs, suffix = '', displayValue = null) {
  const clamped = Math.max(-maxAbs, Math.min(maxAbs, value));
  const halfPct = Math.abs(clamped) / maxAbs * 50;
  const isNeg = clamped < 0;
  const color = isNeg ? 'var(--div-neg-fill)' : clamped > 0 ? 'var(--div-pos-fill)' : 'var(--neutral-fill)';
  const textColor = isNeg ? 'var(--div-neg-text)' : clamped > 0 ? 'var(--div-pos-text)' : 'var(--ink-3)';
  const shown = displayValue !== null ? displayValue : value;
  const prefix = displayValue === null && shown > 0 ? '+' : '';

  return `
    <div class="impact-axis">
      <div class="axis-head">
        <span class="axis-name">${label}</span>
        <span class="axis-value" style="color:${textColor}">${prefix}${shown.toFixed(1)}${suffix}</span>
      </div>
      <div class="bipolar-track">
        <div class="bipolar-fill" style="
          ${isNeg ? `right: 50%; --origin: right;` : `left: 50%; --origin: left;`}
          width: ${Math.max(halfPct, 1.5)}%;
          background: ${color};
        "></div>
      </div>
    </div>
  `;
}

function setupThemeToggles() {
  document.querySelectorAll('.theme-header[data-toggle]').forEach(header => {
    header.addEventListener('click', () => {
      const targetId = header.dataset.toggle;
      const list = document.getElementById(targetId);
      const toggle = header.querySelector('.theme-toggle');
      if (list) {
        const isHidden = list.style.display === 'none';
        list.style.display = isHidden ? '' : 'none';
        toggle.classList.toggle('open', isHidden);
      }
    });
  });
}
