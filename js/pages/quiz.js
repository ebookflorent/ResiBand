import { candidates } from '../data/candidates.js';
import { themes } from '../data/themes.js';
import { allMeasures } from '../data/measures/index.js';
import { defaultWeights } from '../data/scoring-weights.js';
import { calculateQuizResults } from '../lib/quiz.js';
import { partyBadge } from '../lib/ui.js';

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
        window.scrollTo(0, 0);
      });
    }
  }

  render();
}

function sliderPct(value) {
  return `${value * 10}%`;
}

function renderWeightingStep(container, weights, onSubmit) {
  container.innerHTML = `
    <div class="container">
      <div class="page-header">
        <span class="section-kicker">Quiz de compatibilité</span>
        <h1 class="page-title">Trouvez votre candidat</h1>
        <p class="page-subtitle">
          Indiquez l'importance que vous accordez à chaque thématique — nous calculerons
          quel programme correspond le mieux à vos priorités. Aucune question d'opinion, aucun biais.
        </p>
      </div>

      <div class="quiz-container">
        <div class="callout callout-info mb-3">
          <strong>Comment ça marche ?</strong> Déplacez les curseurs de 0 (pas important)
          à 10 (très important). Votre profil de priorités est ensuite comparé aux scores
          thématiques de chaque candidat.
        </div>

        <div id="sliders-container">
          ${themes.map(theme => {
            const w = weights.find(w => w.themeId === theme.id);
            const value = w ? w.weight : 5;
            return `
              <div class="weight-slider-container card">
                <div class="weight-slider-header">
                  <span class="weight-slider-label">
                    <span>${theme.icon}</span>
                    <span>${theme.label}</span>
                  </span>
                  <span class="weight-slider-value" id="weight-val-${theme.id}" style="--pct:${sliderPct(value)}">${value}</span>
                </div>
                <input type="range" min="0" max="10" value="${value}"
                  class="weight-slider" id="weight-${theme.id}"
                  style="--pct:${sliderPct(value)}"
                  data-theme-id="${theme.id}"
                  aria-label="Importance de ${theme.label}">
                <div class="slider-scale">
                  <span>Pas important</span>
                  <span>Très important</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="quiz-actions">
          <button class="btn btn-outline" id="reset-btn">↺ Réinitialiser</button>
          <button class="btn btn-primary btn-lg" id="submit-btn">
            Voir mes résultats →
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
      e.target.style.setProperty('--pct', sliderPct(value));

      const display = document.getElementById(`weight-val-${themeId}`);
      if (display) {
        display.textContent = value;
        display.style.setProperty('--pct', sliderPct(value));
      }

      const w = weights.find(w => w.themeId === themeId);
      if (w) w.weight = value;
    }
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    weights = themes.map(t => ({ themeId: t.id, weight: 5 }));
    themes.forEach(t => {
      const slider = document.getElementById(`weight-${t.id}`);
      const display = document.getElementById(`weight-val-${t.id}`);
      if (slider) { slider.value = 5; slider.style.setProperty('--pct', '50%'); }
      if (display) { display.textContent = '5'; display.style.setProperty('--pct', '50%'); }
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
        <span class="section-kicker">Quiz de compatibilité</span>
        <h1 class="page-title">Vos résultats</h1>
        <p class="page-subtitle">Les candidats dont le programme correspond le mieux à vos priorités, classés par compatibilité.</p>
      </div>

      <div class="quiz-container">
        <div class="results-grid">
          ${results.map((r, i) => {
            const rank = i + 1;
            const candidate = r.candidate;
            const rankClass = rank <= 3 ? `result-rank-${rank}` : '';
            const matchColor = r.matchPercentage >= 65 ? 'var(--pos-text)' : r.matchPercentage >= 40 ? 'var(--warn)' : 'var(--neg-text)';

            return `
              <div class="card result-card fade-in stagger-${Math.min(i + 1, 8)} ${rank === 1 ? 'is-top' : ''}">
                <div class="result-rank ${rankClass}">${rank === 1 ? '🏆' : rank}</div>
                <div class="result-info">
                  <div class="result-name">
                    <a href="/candidats/${candidate.id}" data-link style="color:inherit">${candidate.fullName}</a>
                  </div>
                  <div class="flex gap-1 flex-wrap" style="align-items:center">
                    ${partyBadge(candidate.party, 'font-size:0.68rem')}
                    ${r.confidence < 40 ? '<span class="status-badge status-rumeur">Données limitées</span>' : ''}
                  </div>
                </div>
                <div style="text-align:right">
                  <div style="font-size:1.9rem; font-weight:800; letter-spacing:-0.03em; font-variant-numeric:tabular-nums; color:${matchColor}">${r.matchPercentage}<span style="font-size:0.55em">%</span></div>
                  <div style="font-size:0.72rem; font-weight:600; color:var(--ink-3); text-transform:uppercase; letter-spacing:0.06em">compatibilité</div>
                </div>

                <div class="result-breakdown">
                  ${r.themeBreakdown.slice(0, 6).map(tb => {
                    const theme = themes.find(t => t.id === tb.themeId);
                    const barColor = tb.score >= 65 ? 'var(--pos-fill)' :
                                     tb.score >= 40 ? 'var(--warn)' : 'var(--neg-fill)';
                    const textColor = tb.score >= 65 ? 'var(--pos-text)' :
                                      tb.score >= 40 ? 'var(--warn)' : 'var(--neg-text)';
                    return `
                      <div class="breakdown-item">
                        <span class="breakdown-theme">${theme ? theme.icon : ''} ${theme ? theme.label : tb.themeId}</span>
                        <div class="breakdown-bar">
                          <div class="breakdown-fill" style="width: ${Math.round(tb.score)}%; background: ${barColor}"></div>
                        </div>
                        <span class="breakdown-score" style="color:${textColor}">${Math.round(tb.score)}</span>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="quiz-actions mt-3">
          <button class="btn btn-outline" id="retake-btn">↺ Refaire le quiz</button>
          <a href="/comparateur?candidats=${results.slice(0, 2).map(r => r.candidateId).join(',')}"
             class="btn btn-primary" data-link>
            ⚖️ Comparer le top 2
          </a>
        </div>

        <div class="callout callout-info mt-3">
          <strong>Comment interpréter ces résultats ?</strong>
          Le pourcentage de compatibilité pondère les scores thématiques de chaque candidat
          selon l'importance que vous avez accordée à chaque thème. Un score de 70 % signifie
          que le programme du candidat correspond à 70 % de vos attentes pondérées.
          <a href="/methodologie" data-link>Voir la méthodologie complète →</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('retake-btn').addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    renderQuiz(container);
    window.scrollTo(0, 0);
  });
}
