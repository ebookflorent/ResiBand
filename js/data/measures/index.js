import { lepenMeasures } from './le-pen.js';
import { bardellaMeasures } from './bardella.js';
import { melenchonMeasures } from './melenchon.js';
import { philippeMeasures } from './philippe.js';
import { attalMeasures } from './attal.js';
import { ruffinMeasures } from './ruffin.js';
import { retailleauMeasures } from './retailleau.js';
import { wauquiezMeasures } from './wauquiez.js';

export const allMeasures = [
  ...lepenMeasures,
  ...bardellaMeasures,
  ...melenchonMeasures,
  ...philippeMeasures,
  ...attalMeasures,
  ...ruffinMeasures,
  ...retailleauMeasures,
  ...wauquiezMeasures,
];

export function getMeasuresByCandidate(candidateId) {
  return allMeasures.filter(m => m.candidateId === candidateId);
}

export function getMeasuresByTheme(themeId) {
  return allMeasures.filter(m => m.themeId === themeId);
}

export function getMeasureById(id) {
  return allMeasures.find(m => m.id === id);
}

export {
  lepenMeasures,
  bardellaMeasures,
  melenchonMeasures,
  philippeMeasures,
  attalMeasures,
  ruffinMeasures,
  retailleauMeasures,
  wauquiezMeasures,
};
