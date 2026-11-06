# BRAINROT STUDIO

Studio de création de vidéos, pensé pour l'iPhone.

## Fonctionnalités actuelles

- **Tableau de bord** : accueil, nombre de vidéos créées, projets en cours, dernières vidéos produites.
- **Créer une vidéo** : crée un projet vidéo (titre) enregistré comme brouillon.
- **Projets** : liste et suppression des projets.
- **Générateur d'histoires** : histoires en français de 60 à 90 secondes (hook, 2 à 3 personnages,
  narration, dialogues, 6 à 8 scènes, fin surprenante) dans 5 genres : horreur, mystère, surnaturel,
  trahison, humour noir. Modification complète (titre, personnages, scènes, répliques), sauvegarde,
  suppression et copie du script.
- **Studio de personnages** : personnages anthropomorphes (nom, pronom, espèce, apparence physique,
  vêtements, personnalité, voix, histoire), fiche descriptive détaillée, prompt d'image 3D
  cinématographique réaliste (avec prompt négatif) à copier, sauvegarde et modification.
  Les personnages peuvent jouer dans plusieurs histoires (épisodes) : la fiche liste leurs épisodes.
- **Studio audio** : à partir d'une histoire, piste avec narration et dialogues par personnage,
  indications de jeu vocal, bruitages repérés dans le texte, ambiance, sous-titres synchronisés.
  Écoute avec la synthèse vocale de l'appareil (voix, vitesse et hauteur par rôle) ; une écoute
  complète cale le minutage sur la vraie voix. Exports : sous-titres `.srt` et `.vtt`, données `.json`,
  script audio texte.
- **Navigation** en bas de l'écran, style iPhone.

Module annoncé mais **pas encore disponible** : étapes de production vidéo.

### Synthèse vocale : ce qui est vraiment gratuit

La voix utilise la **Web Speech API**, c'est-à-dire la synthèse vocale intégrée au système
(sur iPhone, celle de Safari) : gratuite, sans compte, sans carte bancaire, hors ligne.
Limites : la qualité et le nombre de voix françaises dépendent de l'appareil, et le navigateur
**ne permet pas d'enregistrer cette voix dans un fichier audio**. Les bruitages sont des repères
(description + minutage), pas des sons joués. Le minutage est estimé (2,5 mots par seconde)
tant qu'aucune écoute complète n'a été mesurée.

Le format JSON exporté (`brainrot-studio/audio`, version 1) contient : `speakers`, `voiceTrack`
(segments avec début, fin, personnage, texte, indication), `sfxTrack`, `ambiance` et `subtitles`.

### Prompt d'image : pas de génération intégrée

L'appli **ne génère pas d'image**. Aucun service gratuit, fiable et utilisable sans compte ne
peut être garanti, et l'intégrer enverrait les descriptions des personnages à un tiers.
Le prompt (en français, dans `js/character-prompt.js`) se copie en un geste pour être collé
dans l'outil de génération d'image de son choix.

### Comment fonctionne le générateur

Il n'utilise **aucune IA en ligne** (donc aucun coût). Il assemble, sur l'appareil, l'une des
15 trames originales (3 par genre, dans `js/story-data.js`) avec des personnages tirés au hasard
(ou jusqu'à 3 personnages du studio, placés dans les rôles libres de la trame), en accordant le texte au masculin ou au féminin. La durée est estimée à 2,5 mots par seconde
(débit moyen d'une voix off). Pour ajouter des histoires, il suffit d'ajouter des trames dans ce fichier.

## Technique

- HTML, CSS et JavaScript, sans dépendance ni outil de compilation.
- Aucun service ni API payants.
- Les données restent **sur l'appareil** (stockage local du navigateur). Rien n'est envoyé à un serveur.
- Installable sur l'écran d'accueil de l'iPhone (Safari → Partager → « Sur l'écran d'accueil »).

## Mise en ligne gratuite (GitHub Pages)

Sur github.com : **Settings → Pages → Source : Deploy from a branch → Branch : `main` / `(root)` → Save**.
Le site sera disponible quelques minutes plus tard à l'adresse indiquée sur cette page.
