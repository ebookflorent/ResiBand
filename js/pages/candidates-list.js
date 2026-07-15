import { candidates } from '../data/candidates.js';
import { themes } from '../data/themes.js';
import { allMeasures, getMeasuresByCandidate } from '../data/measures/index.js';
import { scoreCandidateGlobal, getScoreClass } from '../lib/scoring.js';
import { defaultWeights } from '../data/scoring-weights.js';
import { formatPercent } from '../lib/formatting.js';
import { scoreRing, partyBadge, candidacyBadge, partyVars } from '../lib/ui.js';

export async function renderCandidatesList(container) {
  const candidateScores = candidates.map(c => {
    const measures = getMeasuresByCandidate(c.id);
    const { overallScore, confidence, themeScores } = scoreCandidateGlobal(c.id, allMeasures, themes, defaultWeights);
    const themesWithData = new Set(measures.map(m => m.themeId)).size;
    return { ...c, overallScore, confidence, measureCount: measures.length, themesWithData, themeScores };
  }).sort((a, b) => b.overallScore - a.overallScore);

  container.innerHTML = `
    <div class="container">
      <div class="page-header">
        <span class="section-kicker">Présidentielle 2027</span>
        <h1 class="page-title">Les candidats</h1>
        <p class="page-subtitle">Analyse détaillée de chaque candidat : score global, points forts thématiques et fiabilité des données.</p>
      </div>

      <div class="candidates-grid">
        ${candidateScores.map((c, i) => {
          const completeness = Math.round((c.themesWithData / themes.length) * 100);
          const topThemes = c.themeScores
            .filter(ts => ts.score !== null)
            .sort((a, b) => b.score - a.score)
            .slice(0, 4);

          return `
            <a href="/candidats/${c.id}" data-link class="card card-clickable candidate-card fade-in stagger-${(i % 8) + 1}"
               style="${partyVars(c.party)}">
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

                <div style="width:100%; display:grid; gap:0.35rem; margin-bottom:1rem">
                  <p class="key-stat-label" style="text-transform:uppercase; letter-spacing:0.06em; font-size:0.7rem">Thèmes les mieux notés</p>
                  ${topThemes.map(ts => {
                    const theme = themes.find(t => t.id === ts.themeId);
                    return `
                      <div class="score-row">
                        <span class="score-label" style="font-size:0.82rem">${theme ? theme.icon : ''} ${theme ? theme.label : ts.themeId}</span>
                        <span class="score-value ${getScoreClass(ts.score)}" style="font-size:0.88rem">${Math.round(ts.score)}</span>
                      </div>
                    `;
                  }).join('')}
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
        }).join('')}
      </div>
    </div>
  `;
}
