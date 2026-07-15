// Composants UI partagés (SVG, badges) — retournent des chaînes HTML

import { getScoreClass } from './scoring.js';

// Jauge circulaire SVG. `tone` : 'auto' (couleur selon score) ou 'accent'
export function scoreRing(score, { size = 74, stroke = 7, sub = '/100', tone = 'auto' } = {}) {
  const val = Math.max(0, Math.min(100, Math.round(score)));
  const r = (size - stroke) / 2;
  const cls = tone === 'accent' ? 'ring-accent' : `ring-${getScoreClass(val).replace('score-', '')}`;
  const fontSize = Math.round(size * 0.3);
  return `
    <span class="score-ring ${cls}" role="img" aria-label="Score : ${val} sur 100">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle class="ring-bg" cx="${size / 2}" cy="${size / 2}" r="${r}"
          fill="none" stroke-width="${stroke}" />
        <circle class="ring-val" cx="${size / 2}" cy="${size / 2}" r="${r}"
          fill="none" stroke-width="${stroke}" pathLength="100"
          stroke-dasharray="${val} ${100 - val}" />
      </svg>
      <span class="ring-label">
        <span class="ring-number" style="font-size:${fontSize}px">${val}</span>
        ${sub ? `<span class="ring-sub">${sub}</span>` : ''}
      </span>
    </span>
  `;
}

export const candidacyLabels = {
  declare: 'Déclaré',
  probable: 'Probable',
  possible: 'Possible',
};

export const candidacyLabelsLong = {
  declare: 'Candidature déclarée',
  probable: 'Candidature probable',
  possible: 'Candidature possible',
};

export const statusLabels = {
  'programme-officiel': 'Programme officiel',
  'declaration-publique': 'Déclaration publique',
  'rumeur': 'Rumeur',
  'abandonnee': 'Abandonnée',
};

export const statusClasses = {
  'programme-officiel': 'status-officiel',
  'declaration-publique': 'status-declaration',
  'rumeur': 'status-rumeur',
  'abandonnee': 'status-abandonnee',
};

// Encre lisible (sombre ou blanche) selon la luminance d'une couleur de fond
export function onColor(hex) {
  const n = hex.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 150 ? '#101532' : '#ffffff';
}

export function partyVars(party) {
  return `--party-color:${party.color}; --pc-ink:${onColor(party.color)}`;
}

export function partyBadge(party, style = '') {
  const ink = onColor(party.color);
  const shadow = ink === '#ffffff' ? '' : 'text-shadow:none;';
  return `<span class="party-badge" style="background:${party.color};color:${ink};${shadow}${style}">${party.abbreviation}</span>`;
}

export function candidacyBadge(status, long = false) {
  const label = (long ? candidacyLabelsLong : candidacyLabels)[status] || '';
  return `<span class="candidacy-badge candidacy-${status}">${label}</span>`;
}
