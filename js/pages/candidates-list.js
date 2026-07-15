import { candidates } from '../data/candidates.js';
import { themes } from '../data/themes.js';
import { allMeasures, getMeasuresByCandidate } from '../data/measures/index.js';
import { scoreCandidateGlobal, getScoreClass } from '../lib/scoring.js';
import { defaultWeights } from '../data/scoring-weights.js';
import { formatPercent } from '../lib/formatting.js';

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
        <h1 class="page-title">Les candidats</h1>
        <p class="page-subtitle">Analyse detaillee de chaque candidat et de son programme</p>
      </div>

      <div class="candidates-grid">
        ${candidateScores.map((c, i) => `
          <a href="/candidats/${c.id}" data-link class="card card-clickable candidate-card fade-in stagger-${(i % 8) + 1}"
             style="--party-color: ${c.party.color}">
            <div class="candidate-avatar">${c.initials}</div>
            <h3 class="candidate-name">${c.fullName}</h3>
            <span class="party-badge" style="background: ${c.party.color}">${c.party.abbreviation}</span>
            <p class="candidate-role">${c.currentRole}</p>
            <div class="candidate-scores">
              <div class="score-row">
                <span class="score-label">Score global</span>
                <span class="score-value ${getScoreClass(c.overallScore)}">${Math.round(c.overallScore)}/100</span>
              </div>
              <div class="score-row">
                <span class="score-label">Mesures</span>
                <span class="score-value">${c.measureCount}</span>
              </div>
              <div class="score-row">
                <span class="score-label">Confiance donnees</span>
                <span class="score-value">${formatPercent(c.confidence)}</span>
              </div>
            </div>

            <div class="mt-2" style="width:100%">
              ${c.themeScores
                .filter(ts => ts.score !== null)
                .sort((a, b) => b.score - a.score)
                .slice(0, 4)
                .map(ts => {
                  const theme = themes.find(t => t.id === ts.themeId);
                  return `
                    <div class="score-row" style="margin-bottom: 0.3rem">
                      <span class="score-label">${theme ? theme.icon : ''} ${theme ? theme.label : ts.themeId}</span>
                      <span class="score-value ${getScoreClass(ts.score)}">${Math.round(ts.score)}</span>
                    </div>
                  `;
                }).join('')}
            </div>

            <div class="candidate-completeness">
              <div class="completeness-bar">
                <div class="completeness-fill" style="width: ${Math.round((c.themesWithData / themes.length) * 100)}%"></div>
              </div>
              <p class="completeness-label">${Math.round((c.themesWithData / themes.length) * 100)}% des themes couverts</p>
            </div>
          </a>
        `).join('')}
      </div>
    </div>
  `;
}
