import { methodology } from '../data/scoring-weights.js';

export async function renderMethodology(container) {
  container.innerHTML = `
    <div class="container">
      <div class="page-header">
        <span class="section-kicker">Transparence</span>
        <h1 class="page-title">Méthodologie</h1>
        <p class="page-subtitle">Transparence totale sur nos calculs, nos sources et nos hypothèses.</p>
      </div>

      <div class="methodology-content">

        <div class="callout callout-info" data-reveal>
          <strong>Engagement de transparence :</strong> VoteClaire s'engage à expliquer chaque calcul,
          chaque source et chaque hypothèse. Les scores sont des évaluations éditoriales et non des vérités objectives.
          Nous encourageons chaque citoyen à consulter les programmes originaux.
        </div>

        <h2>1. Collecte des données</h2>
        <p>
          Les mesures de chaque candidat sont collectées à partir de sources publiques :
          programmes officiels publiés, déclarations lors d'interviews, discours, tribunes et
          articles de presse. Chaque mesure est accompagnée de sa ou ses sources.
        </p>
        <p>
          Chaque mesure se voit attribuer un <strong>statut de fiabilité</strong> :
        </p>
        <ul>
          <li><strong>Programme officiel</strong> : présente dans un document officiel du candidat ou de son parti</li>
          <li><strong>Déclaration publique</strong> : annoncée lors d'une interview, d'un discours ou d'un débat</li>
          <li><strong>Rumeur</strong> : rapportée par les médias sans confirmation du candidat</li>
          <li><strong>Abandonnée</strong> : mesure initialement proposée puis retirée</li>
        </ul>

        <h2>2. Système de notation</h2>
        <p>
          Chaque mesure est évaluée sur 4 axes, chacun ayant un poids égal par défaut (25 %).
          L'utilisateur peut modifier ces poids dans le quiz « Mon candidat ».
        </p>

        <h3>2.1 Impact budgétaire</h3>
        <p>
          Estimation du coût ou de l'économie pour les finances publiques, basée sur les chiffrages
          disponibles (Cour des comptes, INSEE, instituts économiques, chiffrages des candidats eux-mêmes).
          L'impact est exprimé en fourchette (minimum et maximum) en millions d'euros.
        </p>
        <div class="formula-box">Score budgétaire = normalisation linéaire du point médian de la fourchette
par rapport à l'ensemble des mesures de tous les candidats.
Échelle : 0 (plus coûteux) à 100 (plus d'économies/recettes)</div>

        <h3>2.2 Impact social</h3>
        <p>
          Évaluation de l'effet de la mesure sur l'égalité sociale, le bien-être collectif et la cohésion.
          Échelle de −3 (très négatif) à +3 (très positif), normalisée de 0 à 100.
        </p>

        <h3>2.3 Impact environnemental</h3>
        <p>
          Évaluation de l'effet sur l'environnement, le climat et la biodiversité.
          Même échelle : −3 à +3, normalisée de 0 à 100.
        </p>

        <h3>2.4 Faisabilité</h3>
        <p>
          Évaluation de la facilité de mise en œuvre de la mesure, tenant compte des contraintes
          juridiques (constitutionnalité, droit européen), techniques, politiques et temporelles.
          Échelle de 1 (très difficile) à 5 (facilement réalisable), normalisée de 0 à 100.
        </p>

        <h2>3. Calcul des scores</h2>

        <h3>3.1 Score par mesure</h3>
        <div class="formula-box">score_mesure = w_budget × budget_norm + w_social × social_norm
              + w_env × env_norm + w_faisabilité × faisabilité_norm

Poids par défaut : w_budget = w_social = w_env = w_faisabilité = 0,25</div>

        <h3>3.2 Score par thème</h3>
        <p>
          Le score d'un candidat sur un thème est la <strong>moyenne arithmétique</strong> des scores de ses
          mesures dans ce thème.
        </p>
        <div class="formula-box">score_thème(candidat, thème) = moyenne(score_mesure pour chaque mesure du candidat dans ce thème)</div>

        <h3>3.3 Score global</h3>
        <p>
          Le score global est la <strong>somme pondérée</strong> des scores thématiques. Par défaut,
          chaque thème a un poids égal (1/N). Dans le quiz, l'utilisateur modifie ces poids.
        </p>
        <div class="formula-box">score_global(candidat) = somme( poids_thème[i] × score_thème(candidat, thème[i]) )

Les poids sont normalisés pour sommer à 1,0.</div>

        <h3>3.4 Indice de confiance</h3>
        <p>
          Pour éviter qu'un candidat avec très peu de données obtienne un score artificiellement
          élevé ou bas, un <strong>indice de confiance</strong> est calculé et affiché :
        </p>
        <div class="formula-box">confiance = 0,4 × (thèmes_couverts / total_thèmes)
           + 0,3 × (mesures_officielles / total_mesures)
           + 0,3 × min(1, total_mesures / médiane_mesures_tous_candidats)</div>
        <p>
          Un indice de confiance bas (&lt; 40 %) signifie que le candidat a peu de mesures
          répertoriées ou que ses mesures sont principalement issues de rumeurs.
        </p>

        <h2>4. Quiz « Mon candidat »</h2>
        <p>
          Le quiz ne pose pas de questions d'opinion (qui introduiraient un biais éditorial).
          Il demande à l'utilisateur de <strong>pondérer les thématiques</strong> selon leur importance.
        </p>
        <p>Le processus :</p>
        <ol>
          <li>L'utilisateur attribue un poids de 0 à 10 à chaque thématique</li>
          <li>Les poids sont normalisés (somme = 1,0)</li>
          <li>Le score de compatibilité = somme pondérée des scores thématiques du candidat</li>
          <li>Les candidats sont classés par pourcentage de compatibilité</li>
        </ol>
        <p>
          Cette approche est plus neutre qu'un quiz « pour ou contre » car elle ne présuppose pas
          la position de l'utilisateur sur chaque sujet.
        </p>

        <h2>5. Limites et précautions</h2>

        <div class="callout callout-warning">
          <strong>Avertissement important :</strong>
          <ul style="margin-top: 0.5rem; margin-bottom: 0">
            <li>Les scores sont des <strong>évaluations éditoriales</strong>, pas des vérités scientifiques</li>
            <li>Les estimations budgétaires sont approximatives et dépendent des hypothèses retenues</li>
            <li>Les impacts sociaux et environnementaux sont par nature subjectifs</li>
            <li>Les candidats n'ont pas tous publié leur programme complet</li>
            <li>Un score élevé ne signifie pas qu'un candidat est « meilleur » — il reflète l'alignement
              avec les critères de notation</li>
          </ul>
        </div>

        <p>
          Nous encourageons chaque citoyen à :
        </p>
        <ul>
          <li>Consulter les programmes originaux des candidats</li>
          <li>Vérifier nos sources</li>
          <li>Former son propre jugement</li>
          <li>Signaler toute erreur ou biais</li>
        </ul>

        <h2>6. Mises à jour</h2>
        <p>
          Les données sont mises à jour régulièrement au fur et à mesure des annonces des candidats.
          Chaque mise à jour est consignée dans le journal des modifications accessible sur le site.
          La date de dernière vérification est indiquée pour chaque mesure.
        </p>
        <p>
          <strong>Version de la méthodologie :</strong> ${methodology.version}<br>
          <strong>Dernière mise à jour :</strong> ${methodology.lastUpdated}
        </p>

      </div>
    </div>
  `;
}
