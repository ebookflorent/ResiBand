import { methodology } from '../data/scoring-weights.js';

export async function renderMethodology(container) {
  container.innerHTML = `
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">📐 Methodologie</h1>
        <p class="page-subtitle">Transparence totale sur nos calculs et nos sources</p>
      </div>

      <div class="methodology-content">

        <div class="callout callout-info">
          <strong>Engagement de transparence :</strong> VoteClaire s'engage a expliquer chaque calcul,
          chaque source et chaque hypothese. Les scores sont des evaluations editoriales et non des verites objectives.
          Nous encourageons chaque citoyen a consulter les programmes originaux.
        </div>

        <h2>1. Collecte des donnees</h2>
        <p>
          Les mesures de chaque candidat sont collectees a partir de sources publiques :
          programmes officiels publies, declarations lors d'interviews, discours, tribunes et
          articles de presse. Chaque mesure est accompagnee de sa ou ses sources.
        </p>
        <p>
          Chaque mesure se voit attribuer un <strong>statut de fiabilite</strong> :
        </p>
        <ul>
          <li><strong>Programme officiel</strong> : presente dans un document officiel du candidat ou de son parti</li>
          <li><strong>Declaration publique</strong> : annoncee lors d'une interview, d'un discours ou d'un debat</li>
          <li><strong>Rumeur</strong> : rapportee par les medias sans confirmation du candidat</li>
          <li><strong>Abandonnee</strong> : mesure initialement proposee puis retiree</li>
        </ul>

        <h2>2. Systeme de notation</h2>
        <p>
          Chaque mesure est evaluee sur 4 axes, chacun ayant un poids egal par defaut (25%).
          L'utilisateur peut modifier ces poids dans le quiz "Mon Candidat".
        </p>

        <h3>2.1 Impact budgetaire</h3>
        <p>
          Estimation du cout ou de l'economie pour les finances publiques, basee sur les chiffrages
          disponibles (Cour des comptes, INSEE, instituts economiques, chiffrages des candidats eux-memes).
          L'impact est exprime en fourchette (minimum et maximum) en millions d'euros.
        </p>
        <div class="formula-box">Score budgetaire = normalisation lineaire du point median de la fourchette
par rapport a l'ensemble des mesures de tous les candidats.
Echelle : 0 (plus couteux) a 100 (plus d'economies/recettes)</div>

        <h3>2.2 Impact social</h3>
        <p>
          Evaluation de l'effet de la mesure sur l'egalite sociale, le bien-etre collectif et la cohesion.
          Echelle de -3 (tres negatif) a +3 (tres positif), normalisee de 0 a 100.
        </p>

        <h3>2.3 Impact environnemental</h3>
        <p>
          Evaluation de l'effet sur l'environnement, le climat et la biodiversite.
          Meme echelle : -3 a +3, normalisee de 0 a 100.
        </p>

        <h3>2.4 Faisabilite</h3>
        <p>
          Evaluation de la facilite de mise en oeuvre de la mesure, tenant compte des contraintes
          juridiques (constitutionnalite, droit europeen), techniques, politiques et temporelles.
          Echelle de 1 (tres difficile) a 5 (facilement realisable), normalisee de 0 a 100.
        </p>

        <h2>3. Calcul des scores</h2>

        <h3>3.1 Score par mesure</h3>
        <div class="formula-box">score_mesure = w_budget x budget_norm + w_social x social_norm
              + w_env x env_norm + w_faisabilite x faisabilite_norm

Poids par defaut : w_budget = w_social = w_env = w_faisabilite = 0.25</div>

        <h3>3.2 Score par theme</h3>
        <p>
          Le score d'un candidat sur un theme est la <strong>moyenne arithmetique</strong> des scores de ses
          mesures dans ce theme.
        </p>
        <div class="formula-box">score_theme(candidat, theme) = moyenne(score_mesure pour chaque mesure du candidat dans ce theme)</div>

        <h3>3.3 Score global</h3>
        <p>
          Le score global est la <strong>somme ponderee</strong> des scores thematiques. Par defaut,
          chaque theme a un poids egal (1/N). Dans le quiz, l'utilisateur modifie ces poids.
        </p>
        <div class="formula-box">score_global(candidat) = somme( poids_theme[i] x score_theme(candidat, theme[i]) )

Les poids sont normalises pour sommer a 1.0.</div>

        <h3>3.4 Indice de confiance</h3>
        <p>
          Pour eviter qu'un candidat avec tres peu de donnees obtienne un score artificiellement
          eleve ou bas, un <strong>indice de confiance</strong> est calcule et affiche :
        </p>
        <div class="formula-box">confiance = 0.4 x (themes_couverts / total_themes)
           + 0.3 x (mesures_officielles / total_mesures)
           + 0.3 x min(1, total_mesures / mediane_mesures_tous_candidats)</div>
        <p>
          Un indice de confiance bas (< 40%) signifie que le candidat a peu de mesures
          repertoriees ou que ses mesures sont principalement issues de rumeurs.
        </p>

        <h2>4. Quiz "Mon Candidat"</h2>
        <p>
          Le quiz ne pose pas de questions d'opinion (qui introduiraient un biais editorial).
          Il demande a l'utilisateur de <strong>ponderer les thematiques</strong> selon leur importance.
        </p>
        <p>Le processus :</p>
        <ol>
          <li>L'utilisateur attribue un poids de 0 a 10 a chaque thematique</li>
          <li>Les poids sont normalises (somme = 1.0)</li>
          <li>Le score de compatibilite = somme ponderee des scores thematiques du candidat</li>
          <li>Les candidats sont classes par pourcentage de compatibilite</li>
        </ol>
        <p>
          Cette approche est plus neutre qu'un quiz "pour ou contre" car elle ne presuppose pas
          la position de l'utilisateur sur chaque sujet.
        </p>

        <h2>5. Limites et precautions</h2>

        <div class="callout callout-warning">
          <strong>Disclaimer important :</strong>
          <ul style="margin-top: 0.5rem; margin-bottom: 0">
            <li>Les scores sont des <strong>evaluations editoriales</strong>, pas des verites scientifiques</li>
            <li>Les estimations budgetaires sont approximatives et dependent des hypotheses retenues</li>
            <li>Les impacts sociaux et environnementaux sont par nature subjectifs</li>
            <li>Les candidats n'ont pas tous publie leur programme complet</li>
            <li>Un score eleve ne signifie pas qu'un candidat est "meilleur" — il reflete l'alignement
              avec les criteres de notation</li>
          </ul>
        </div>

        <p>
          Nous encourageons chaque citoyen a :
        </p>
        <ul>
          <li>Consulter les programmes originaux des candidats</li>
          <li>Verifier nos sources</li>
          <li>Former son propre jugement</li>
          <li>Signaler toute erreur ou biais</li>
        </ul>

        <h2>6. Mises a jour</h2>
        <p>
          Les donnees sont mises a jour regulierement au fur et a mesure des annonces des candidats.
          Chaque mise a jour est consignee dans le journal des modifications accessible sur le site.
          La date de derniere verification est indiquee pour chaque mesure.
        </p>
        <p>
          <strong>Version de la methodologie :</strong> ${methodology.version}<br>
          <strong>Derniere mise a jour :</strong> ${methodology.lastUpdated}
        </p>

      </div>
    </div>
  `;
}
