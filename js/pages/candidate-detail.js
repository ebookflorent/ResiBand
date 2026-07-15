import { getCandidateById } from '../data/candidates.js';
import { themes, getThemeById } from '../data/themes.js';
import { allMeasures, getMeasuresByCandidate } from '../data/measures/index.js';
import { scoreCandidateGlobal, getScoreClass, getImpactClass, getImpactLabel, getFeasibilityLabel } from '../lib/scoring.js';
import { aggregateBudgetImpact, aggregateImpactByAxis } from '../lib/impact.js';
import { defaultWeights } from '../data/scoring-weights.js';
import { formatBudgetRange, formatDate, formatPercent } from '../lib/formatting.js';

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

  const statusLabels = {
    'programme-officiel': 'Programme officiel',
    'declaration-publique': 'Declaration publique',
    'rumeur': 'Rumeur',
    'abandonnee': 'Abandonnee',
  };

  const statusClasses = {
    'programme-officiel': 'status-officiel',
    'declaration-publique': 'status-declaration',
    'rumeur': 'status-rumeur',
    'abandonnee': 'status-abandonnee',
  };

  const candidacyLabels = { declare: 'Candidature declaree', probable: 'Candidature probable', possible: 'Candidature possible' };

  container.innerHTML = `
    <div class="container">
      <a href="/candidats" class="btn btn-sm btn-outline mb-3" data-link>← Retour aux candidats</a>

      <div class="card candidate-profile" style="--party-color: ${candidate.party.color}">
        <div class="profile-avatar" style="border-color: ${candidate.party.color}">
          ${candidate.initials}
        </div>
        <div class="profile-info">
          <h1>${candidate.fullName}</h1>
          <div class="flex gap-1 flex-wrap mb-1">
            <span class="party-badge" style="background: ${candidate.party.color}">${candidate.party.name}</span>
            <span class="candidacy-badge candidacy-${candidate.candidacyStatus}">${candidacyLabels[candidate.candidacyStatus]}</span>
          </div>
          <p class="profile-bio">${candidate.bio}</p>
          <div class="profile-meta">
            <span class="profile-meta-item">📋 ${measures.length} mesures repertoriees</span>
            <span class="profile-meta-item">📊 ${themesWithData}/${themes.length} themes couverts</span>
            <span class="profile-meta-item">🔄 Mis a jour le ${formatDate(candidate.lastUpdated)}</span>
          </div>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-card card">
          <div class="stat-value ${getScoreClass(overallScore)}">${Math.round(overallScore)}</div>
          <div class="stat-label">Score global /100</div>
        </div>
        <div class="stat-card card">
          <div class="stat-value">${formatPercent(confidence)}</div>
          <div class="stat-label">Confiance donnees</div>
        </div>
        <div class="stat-card card">
          <div class="stat-value" style="font-size:1.3rem; color: ${budget.midpoint < 0 ? 'var(--color-negative)' : 'var(--color-positive)'}">
            ${budget.midpoint < 0 ? '' : '+'}${Math.round(budget.midpoint).toLocaleString('fr-FR')} M€
          </div>
          <div class="stat-label">Impact budgetaire estime /an</div>
        </div>
        <div class="stat-card card">
          <div class="stat-value">${measures.length}</div>
          <div class="stat-label">Mesures</div>
        </div>
      </div>

      <div class="card mb-3">
        <h3 class="impact-card-title">Profil d'impact moyen</h3>
        <div class="flex flex-wrap gap-2">
          ${renderImpactBar('Social', impacts.social, '👥')}
          ${renderImpactBar('Environnement', impacts.environmental, '🌱')}
          ${renderImpactBar('Faisabilite', (impacts.feasibility - 3) / 2 * 3, '⚙️')}
          ${renderImpactBar('Libertes', impacts.liberty, '⚖️')}
          ${renderImpactBar('Compatibilite UE', impacts.european, '🇪🇺')}
        </div>
      </div>

      <div class="page-header">
        <h2 class="page-title">Programme detaille</h2>
        <p class="page-subtitle">${measures.length} mesures classees par thematique</p>
      </div>

      ${themes.filter(t => measuresByTheme[t.id]).map(theme => {
        const themeMeasures = measuresByTheme[theme.id];
        const ts = themeScores.find(s => s.themeId === theme.id);
        return `
          <div class="measures-section" id="theme-${theme.id}">
            <div class="theme-header" data-toggle="theme-${theme.id}-list">
              <span class="theme-icon">${theme.icon}</span>
              <h3 class="theme-title">${theme.label}</h3>
              <span class="theme-count">${themeMeasures.length} mesure${themeMeasures.length > 1 ? 's' : ''}</span>
              ${ts && ts.score !== null ? `<span class="score-value ${getScoreClass(ts.score)}">${Math.round(ts.score)}/100</span>` : ''}
              <span class="theme-toggle open">▼</span>
            </div>
            <div class="measures-list" id="theme-${theme.id}-list">
              ${themeMeasures.map(m => `
                <div class="card measure-card" style="border-left-color: ${theme.color}">
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

      <div class="text-center mt-4">
        <a href="/comparateur" class="btn btn-outline" data-link>⚖️ Comparer avec un autre candidat</a>
      </div>
    </div>
  `;

  setupThemeToggles();
}

function renderImpactBar(label, value, icon) {
  const pct = ((value + 3) / 6) * 100;
  const color = value > 0 ? 'var(--color-positive)' : value < 0 ? 'var(--color-negative)' : 'var(--color-neutral)';
  return `
    <div style="flex: 1; min-width: 150px;">
      <div class="score-row mb-1">
        <span class="score-label">${icon} ${label}</span>
        <span style="font-weight:600; color: ${color}">${value > 0 ? '+' : ''}${value.toFixed(1)}</span>
      </div>
      <div class="bar-track" style="height: 8px">
        <div style="width: ${pct}%; height: 100%; background: ${color}; border-radius: var(--radius-sm); transition: width 0.4s ease"></div>
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
