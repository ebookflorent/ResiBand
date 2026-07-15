import { candidates } from '../data/candidates.js';
import { themes } from '../data/themes.js';
import { allMeasures } from '../data/measures/index.js';
import { defaultWeights } from '../data/scoring-weights.js';
import { calculateQuizResults } from '../lib/quiz.js';
import { getScoreClass } from '../lib/scoring.js';
import { formatPercent } from '../lib/formatting.js';

const STORAGE_KEY = 'voteclaire-quiz';

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export async function renderQuiz(container) {
  const saved = loadState();
  let weights = saved?.weights || themes.map(t => ({ themeId: t.id, weight: 5 }));
  let showResults = saved?.completed || false;

  function render() {
    if (showResults) {
      renderResults(container, weights);
    } else {
      renderWeightingStep(container, weights, (newWeights) => {
        weights = newWeights;
        showResults = true;
        saveState({ weights, completed: true });
        render();
      });
    }
  }

  render();
}

function renderWeightingStep(container, weights, onSubmit) {
  container.innerHTML = `
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">🎯 Trouvez votre candidat</h1>
        <p class="page-subtitle">
          Indiquez l'importance que vous accordez a chaque thematique.
          Nous calculerons quel programme correspond le mieux a vos priorites.
        </p>
      </div>

      <div class="quiz-container">
        <div class="callout callout-info mb-3">
          <strong>Comment ca marche ?</strong> Deplacez les curseurs pour indiquer l'importance de chaque theme dans votre choix de vote
          (0 = pas important, 10 = tres important). Votre profil sera compare aux programmes des candidats.
        </div>

        <div class="card mb-3">
          <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 1.5rem">
            Quelle importance accordez-vous a chaque theme ?
          </h3>

          <div id="sliders-container">
            ${themes.map((theme, i) => {
              const w = weights.find(w => w.themeId === theme.id);
              const value = w ? w.weight : 5;
              return `
                <div class="weight-slider-container card" style="padding: 1rem; margin-bottom: 0.5rem">
                  <div class="weight-slider-header">
                    <span class="weight-slider-label">
                      <span>${theme.icon}</span>
                      <span>${theme.label}</span>
                    </span>
                    <span class="weight-slider-value" id="weight-val-${theme.id}">${value}</span>
                  </div>
                  <input type="range" min="0" max="10" value="${value}"
                    class="weight-slider" id="weight-${theme.id}"
                    data-theme-id="${theme.id}"
                    aria-label="Importance de ${theme.label}">
                  <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--color-text-muted); margin-top: 0.25rem">
                    <span>Pas important</span>
                    <span>Tres important</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="quiz-actions">
          <button class="btn btn-outline" id="reset-btn">Reinitialiser</button>
          <button class="btn btn-primary btn-lg" id="submit-btn">
            Voir mes resultats →
          </button>
        </div>
      </div>
    </div>
  `;

  const slidersContainer = document.getElementById('sliders-container');
  slidersContainer.addEventListener('input', (e) => {
    if (e.target.classList.contains('weight-slider')) {
      const themeId = e.target.dataset.themeId;
      const value = parseInt(e.target.value);
      const display = document.getElementById(`weight-val-${themeId}`);
      if (display) display.textContent = value;

      const w = weights.find(w => w.themeId === themeId);
      if (w) w.weight = value;
    }
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    weights = themes.map(t => ({ themeId: t.id, weight: 5 }));
    themes.forEach(t => {
      const slider = document.getElementById(`weight-${t.id}`);
      const display = document.getElementById(`weight-val-${t.id}`);
      if (slider) slider.value = 5;
      if (display) display.textContent = '5';
    });
  });

  document.getElementById('submit-btn').addEventListener('click', () => {
    const currentWeights = themes.map(t => {
      const slider = document.getElementById(`weight-${t.id}`);
      return { themeId: t.id, weight: slider ? parseInt(slider.value) : 5 };
    });
    onSubmit(currentWeights);
  });
}

function renderResults(container, weights) {
  const results = calculateQuizResults(candidates, allMeasures, themes, defaultWeights, weights);

  container.innerHTML = `
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">🎯 Vos resultats</h1>
        <p class="page-subtitle">Voici les candidats dont le programme correspond le mieux a vos priorites</p>
      </div>

      <div class="quiz-container">
        <div class="results-grid">
          ${results.map((r, i) => {
            const rank = i + 1;
            const candidate = r.candidate;
            const rankClass = rank <= 3 ? `result-rank-${rank}` : '';

            return `
              <div class="card result-card fade-in stagger-${Math.min(i + 1, 8)}">
                <div class="result-rank ${rankClass}">${rank}</div>
                <div class="result-info">
                  <div class="result-name">${candidate.fullName}</div>
                  <span class="party-badge" style="background: ${candidate.party.color}; font-size: 0.7rem">
                    ${candidate.party.abbreviation}
                  </span>
                  ${r.confidence < 40 ? '<span class="status-badge status-rumeur" style="margin-left:0.5rem">Donnees limitees</span>' : ''}
                </div>
                <div class="result-match">${r.matchPercentage}%</div>

                <div class="result-breakdown">
                  ${r.themeBreakdown.slice(0, 6).map(tb => {
                    const theme = themes.find(t => t.id === tb.themeId);
                    const barColor = tb.score >= 65 ? 'var(--color-positive)' :
                                     tb.score >= 40 ? 'var(--color-warning)' : 'var(--color-negative)';
                    return `
                      <div class="breakdown-item">
                        <span class="breakdown-theme">${theme ? theme.icon : ''} ${theme ? theme.label : tb.themeId}</span>
                        <div class="breakdown-bar">
                          <div class="breakdown-fill" style="width: ${Math.round(tb.score)}%; background: ${barColor}"></div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="quiz-actions mt-3">
          <button class="btn btn-outline" id="retake-btn">🔄 Refaire le quiz</button>
          <a href="/comparateur?candidats=${results.slice(0, 2).map(r => r.candidateId).join(',')}"
             class="btn btn-primary" data-link>
            ⚖️ Comparer le top 2
          </a>
        </div>

        <div class="callout callout-info mt-3">
          <strong>Comment interpreter ces resultats ?</strong>
          Le pourcentage de compatibilite est calcule en ponderant les scores thematiques de chaque candidat
          selon l'importance que vous avez accordee a chaque theme.
          Un score de 70% signifie que le programme du candidat correspond a 70% de vos attentes ponderees.
          <a href="/methodologie" data-link>Voir la methodologie complete →</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('retake-btn').addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    renderQuiz(container);
  });
}
