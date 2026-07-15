export const themes = [
  {
    id: 'economie',
    label: 'Economie',
    description: 'Fiscalite, emploi, croissance, dette publique, pouvoir d\'achat',
    icon: '💰',
    color: '#2563eb',
  },
  {
    id: 'environnement',
    label: 'Environnement',
    description: 'Transition ecologique, energie, biodiversite, climat',
    icon: '🌿',
    color: '#16a34a',
  },
  {
    id: 'securite',
    label: 'Securite',
    description: 'Police, gendarmerie, lutte contre la delinquance, terrorisme',
    icon: '🛡️',
    color: '#991b1b',
  },
  {
    id: 'education',
    label: 'Education',
    description: 'Ecole, universite, formation professionnelle, recherche',
    icon: '🎓',
    color: '#7c3aed',
  },
  {
    id: 'sante',
    label: 'Sante',
    description: 'Hopital, medecine de ville, Securite sociale, prevention',
    icon: '🏥',
    color: '#0d9488',
  },
  {
    id: 'immigration',
    label: 'Immigration',
    description: 'Politique migratoire, integration, droit d\'asile, frontières',
    icon: '🌍',
    color: '#ea580c',
  },
  {
    id: 'europe',
    label: 'Europe',
    description: 'Union europeenne, souverainete, politique etrangere, commerce',
    icon: '🇪🇺',
    color: '#003399',
  },
  {
    id: 'justice-sociale',
    label: 'Justice sociale',
    description: 'Inegalites, redistribution, protection sociale, retraites',
    icon: '⚖️',
    color: '#db2777',
  },
  {
    id: 'numerique',
    label: 'Numerique',
    description: 'Intelligence artificielle, donnees, souverainete numerique, inclusion',
    icon: '💻',
    color: '#06b6d4',
  },
  {
    id: 'culture',
    label: 'Culture',
    description: 'Patrimoine, creation artistique, medias, francophonie',
    icon: '🎭',
    color: '#d97706',
  },
  {
    id: 'institutions',
    label: 'Institutions',
    description: 'Democratie, Constitution, decentralisation, vie politique',
    icon: '🏛️',
    color: '#4f46e5',
  },
  {
    id: 'logement',
    label: 'Logement',
    description: 'Construction, loyers, renovation energetique, urbanisme',
    icon: '🏠',
    color: '#92400e',
  },
  {
    id: 'agriculture',
    label: 'Agriculture',
    description: 'Politique agricole, alimentation, ruralite, souverainete alimentaire',
    icon: '🌾',
    color: '#65a30d',
  },
  {
    id: 'defense',
    label: 'Defense',
    description: 'Armee, budget militaire, dissuasion nucleaire, OTAN',
    icon: '🎖️',
    color: '#374151',
  },
];

export function getThemeById(id) {
  return themes.find(t => t.id === id);
}
