export const themes = [
  {
    id: 'economie',
    label: 'Économie',
    description: 'Fiscalité, emploi, croissance, dette publique, pouvoir d\'achat',
    icon: '💰',
    color: '#2563eb',
  },
  {
    id: 'environnement',
    label: 'Environnement',
    description: 'Transition écologique, énergie, biodiversité, climat',
    icon: '🌿',
    color: '#16a34a',
  },
  {
    id: 'securite',
    label: 'Sécurité',
    description: 'Police, gendarmerie, lutte contre la délinquance, terrorisme',
    icon: '🛡️',
    color: '#991b1b',
  },
  {
    id: 'education',
    label: 'Éducation',
    description: 'École, université, formation professionnelle, recherche',
    icon: '🎓',
    color: '#7c3aed',
  },
  {
    id: 'sante',
    label: 'Santé',
    description: 'Hôpital, médecine de ville, Sécurité sociale, prévention',
    icon: '🏥',
    color: '#0d9488',
  },
  {
    id: 'immigration',
    label: 'Immigration',
    description: 'Politique migratoire, intégration, droit d\'asile, frontières',
    icon: '🌍',
    color: '#ea580c',
  },
  {
    id: 'europe',
    label: 'Europe',
    description: 'Union européenne, souveraineté, politique étrangère, commerce',
    icon: '🇪🇺',
    color: '#003399',
  },
  {
    id: 'justice-sociale',
    label: 'Justice sociale',
    description: 'Inégalités, redistribution, protection sociale, retraites',
    icon: '⚖️',
    color: '#db2777',
  },
  {
    id: 'numerique',
    label: 'Numérique',
    description: 'Intelligence artificielle, données, souveraineté numérique, inclusion',
    icon: '💻',
    color: '#06b6d4',
  },
  {
    id: 'culture',
    label: 'Culture',
    description: 'Patrimoine, création artistique, médias, francophonie',
    icon: '🎭',
    color: '#d97706',
  },
  {
    id: 'institutions',
    label: 'Institutions',
    description: 'Démocratie, Constitution, décentralisation, vie politique',
    icon: '🏛️',
    color: '#4f46e5',
  },
  {
    id: 'logement',
    label: 'Logement',
    description: 'Construction, loyers, rénovation énergétique, urbanisme',
    icon: '🏠',
    color: '#92400e',
  },
  {
    id: 'agriculture',
    label: 'Agriculture',
    description: 'Politique agricole, alimentation, ruralité, souveraineté alimentaire',
    icon: '🌾',
    color: '#65a30d',
  },
  {
    id: 'defense',
    label: 'Défense',
    description: 'Armée, budget militaire, dissuasion nucléaire, OTAN',
    icon: '🎖️',
    color: '#374151',
  },
];

export function getThemeById(id) {
  return themes.find(t => t.id === id);
}
