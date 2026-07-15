export const defaultWeights = {
  budget: 0.25,
  social: 0.25,
  environmental: 0.25,
  feasibility: 0.25,
};

export const methodology = {
  version: '1.0',
  axes: [
    { id: 'budget', label: 'Impact budgetaire', description: 'Cout ou economie pour les finances publiques', defaultWeight: 0.25 },
    { id: 'social', label: 'Impact social', description: 'Effet sur l\'egalite et le bien-etre social', defaultWeight: 0.25 },
    { id: 'environmental', label: 'Impact environnemental', description: 'Effet sur l\'environnement et le climat', defaultWeight: 0.25 },
    { id: 'feasibility', label: 'Faisabilite', description: 'Facilite de mise en oeuvre (juridique, technique, politique)', defaultWeight: 0.25 },
  ],
  normalizationMethod: 'linear',
  lastUpdated: '2025-07-15',
};
