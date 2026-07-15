import { renderHome } from './pages/home.js';
import { renderCandidatesList } from './pages/candidates-list.js';
import { renderCandidateDetail } from './pages/candidate-detail.js';
import { renderComparator } from './pages/comparator.js';
import { renderQuiz } from './pages/quiz.js';
import { renderImpact } from './pages/impact.js';
import { renderMethodology } from './pages/methodology.js';

const routes = [
  { path: '/', render: renderHome },
  { path: '/candidats', render: renderCandidatesList },
  { path: '/candidats/:slug', render: renderCandidateDetail },
  { path: '/comparateur', render: renderComparator },
  { path: '/mon-candidat', render: renderQuiz },
  { path: '/impact', render: renderImpact },
  { path: '/methodologie', render: renderMethodology },
];

const app = document.getElementById('app');

function matchRoute(pathname) {
  for (const route of routes) {
    if (route.path.includes(':')) {
      const pattern = route.path.replace(/:(\w+)/g, '([^/]+)');
      const match = pathname.match(new RegExp(`^${pattern}$`));
      if (match) {
        const paramNames = [...route.path.matchAll(/:(\w+)/g)].map(m => m[1]);
        const params = {};
        paramNames.forEach((name, i) => { params[name] = match[i + 1]; });
        return { route, params };
      }
    } else if (route.path === pathname) {
      return { route, params: {} };
    }
  }
  return null;
}

// Révélation au scroll : les éléments [data-reveal] apparaissent en entrant
// dans le viewport (désactivé si prefers-reduced-motion)
let revealObserver = null;

function setupReveal() {
  if (revealObserver) revealObserver.disconnect();

  const elements = document.querySelectorAll('[data-reveal]:not(.revealed)');
  if (elements.length === 0) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('revealed'));
    return;
  }

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  elements.forEach(el => revealObserver.observe(el));
}

async function navigate(pathname) {
  const matched = matchRoute(pathname);

  if (!matched) {
    app.innerHTML = `
      <div class="container">
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-text">Page introuvable</div>
          <a href="/" class="btn btn-primary mt-2" data-link>Retour à l'accueil</a>
        </div>
      </div>
    `;
    return;
  }

  app.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    await matched.route.render(app, matched.params);
  } catch (err) {
    console.error('Render error:', err);
    app.innerHTML = `
      <div class="container">
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <div class="empty-state-text">Erreur lors du chargement de la page</div>
        </div>
      </div>
    `;
  }

  updateActiveNav(pathname);
  window.scrollTo(0, 0);
  setupReveal();
}

function updateActiveNav(pathname) {
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === pathname || (href !== '/' && pathname.startsWith(href))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-link]');
  if (link) {
    e.preventDefault();
    const href = link.getAttribute('href');
    if (href && href !== window.location.pathname) {
      history.pushState(null, '', href);
      navigate(href);
    }

    const nav = document.getElementById('main-nav');
    const btn = document.getElementById('mobile-menu-btn');
    nav.classList.remove('open');
    btn.classList.remove('active');
    btn.setAttribute('aria-expanded', 'false');
  }
});

window.addEventListener('popstate', () => {
  navigate(window.location.pathname);
});

const mobileBtn = document.getElementById('mobile-menu-btn');
const mainNav = document.getElementById('main-nav');
mobileBtn.addEventListener('click', () => {
  const open = mainNav.classList.toggle('open');
  mobileBtn.classList.toggle('active', open);
  mobileBtn.setAttribute('aria-expanded', String(open));
});

// Pages dynamiques (quiz, comparateur) : permet de ré-observer
// les éléments injectés après le rendu initial
export function refreshReveal() { setupReveal(); }
window.__vcRefreshReveal = setupReveal;

navigate(window.location.pathname);
