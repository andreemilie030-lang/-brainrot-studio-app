/*
 * BRAINROT STUDIO — trames d'histoires originales.
 *
 * Chaque trame : un hook, 2 à 3 personnages, 7 scènes (narration + dialogues)
 * et une fin surprenante. Les personnages sont tirés au hasard à chaque génération.
 *
 * Marqueurs dans les textes :
 *   {A} {B} {C}     → prénom du personnage
 *   {A:il} {A:Il}   → il / elle
 *   {A:e}           → accord féminin ("" ou "e")
 *   {A:le} {A:Le}   → le / la
 *   {A:lui}         → lui / elle
 *   {A:mot|mots}    → forme masculine | forme féminine
 */
(function () {
  'use strict';

  var GENRES = [
    { id: 'horreur', label: 'Horreur' },
    { id: 'mystere', label: 'Mystère' },
    { id: 'surnaturel', label: 'Surnaturel' },
    { id: 'trahison', label: 'Trahison' },
    { id: 'humour-noir', label: 'Humour noir' }
  ];

  var NAMES = {
    f: ['Léa', 'Inès', 'Chloé', 'Manon', 'Jade', 'Sarah', 'Nina', 'Zoé', 'Clara', 'Maëlys', 'Louise', 'Anaïs', 'Yasmine', 'Emma', 'Lina', 'Rose'],
    m: ['Lucas', 'Nathan', 'Théo', 'Enzo', 'Malik', 'Rayan', 'Louis', 'Jules', 'Adam', 'Noah', 'Gabriel', 'Karim', 'Tom', 'Mathis', 'Yanis', 'Victor']
  };

  // Raccourci : [qui parle, réplique]
  var TEMPLATES = [
    /* ==================== HORREUR ==================== */
    {
      id: 'h-babyphone', genre: 'horreur',
      titles: ['Le babyphone', 'La berceuse de 3 h'],
      characters: [
        { key: 'A', role: ['Nouveau locataire', 'Nouvelle locataire'] },
        { key: 'B', role: 'Propriétaire', gender: 'm' },
        { key: 'C', role: 'Présence', name: 'La petite voix', gender: 'f' }
      ],
      hook: 'Le babyphone s’est allumé à 3 heures du matin. Le problème ? Il n’y a plus de bébé dans cette maison depuis dix ans.',
      scenes: [
        { n: '{A} vient d’emménager dans une maison bien trop bon marché. Dans la chambre du fond, un vieux babyphone est encore branché.', d: [['A', 'Qui laisse un truc pareil derrière soi ?']] },
        { n: 'Première nuit. Un grésillement. Puis une berceuse, chantée tout doucement.', d: [] },
        { n: '{A} appelle {B}, le propriétaire.', d: [['B', 'Débranchez-le. Et surtout, ne répondez jamais.']] },
        { n: 'Cette nuit-là, {A} ne dort pas. {A:Il} fixe le petit appareil sur la commode. Son voyant rouge clignote lentement, comme un cœur.', d: [] },
        { n: 'Deuxième nuit. La berceuse s’arrête. Une petite voix murmure son prénom.', d: [['C', '{A}… tu viens me border ?']] },
        { n: '{A} arrache la prise. Le babyphone continue de grésiller. Sans courant.', d: [] },
        { n: '{A} descend à la cave chercher l’émetteur. Il est posé sur une petite chaise, tourné vers le mur.', d: [] },
        { n: '{A} le retourne. Le voyant est éteint. Mais dans son dos, tout près, la berceuse reprend.', d: [] }
      ],
      ending: 'Le lendemain, {B} remet l’annonce en ligne. Et dans la chambre du fond, le babyphone diffuse maintenant deux voix.'
    },
    {
      id: 'h-selfie', genre: 'horreur',
      titles: ['La silhouette', 'Photo de trop'],
      characters: [
        { key: 'A', role: 'Photographe amateur' },
        { key: 'B', role: ['Meilleur ami', 'Meilleure amie'] }
      ],
      hook: 'Sur chaque photo que prend {A}, il y a une silhouette. Et à chaque photo, elle est un peu plus proche.',
      scenes: [
        { n: '{A} envoie un selfie pris en forêt. Au fond, entre deux arbres, une silhouette immobile.', d: [['B', 'C’est qui, derrière toi ?']] },
        { n: '{A} zoome. Personne. Sûrement un tronc. {A:Il} reprend une photo.', d: [] },
        { n: 'Le soleil baisse. Le chemin du retour paraît plus long que prévu. Les oiseaux se sont tus.', d: [['A', 'Bon. Une dernière photo et je rentre.']] },
        { n: 'La silhouette est là. Dix mètres plus près. Le visage flou, la tête penchée.', d: [['A', '{B}, viens me chercher. Tout de suite.']] },
        { n: '{A} court jusqu’à la voiture et verrouille les portes. Une photo de contrôle, les mains tremblantes.', d: [] },
        { n: 'Sur l’écran : la banquette arrière. Et la silhouette, assise juste derrière.', d: [] },
        { n: '{A} se retourne. Siège vide. Un rire nerveux.', d: [['A', 'C’est l’appli qui bugue. Forcément.']] },
        { n: 'Vingt minutes plus tard, {B} arrive. La voiture est vide. Le téléphone est posé sur le siège.', d: [] }
      ],
      ending: '{B} ouvre la galerie. Une dernière photo, prise à l’instant : {A}, entre deux arbres, la tête penchée. Le visage flou.'
    },
    {
      id: 'h-plancher', genre: 'horreur',
      titles: ['3 h 33', 'Sous le plancher'],
      characters: [
        { key: 'A', role: 'Locataire' },
        { key: 'B', role: ['Gardien de l’immeuble', 'Gardienne de l’immeuble'] },
        { key: 'C', role: 'Présence', name: 'La voix d’en bas', gender: 'f' }
      ],
      hook: 'Chaque nuit, à 3 h 33, quelqu’un frappe sous le plancher de {A}. Sauf que {A} habite au rez-de-chaussée.',
      scenes: [
        { n: 'Trois coups. Toujours trois. Toujours à la même heure. Assez fort pour faire trembler le verre d’eau sur la table de nuit.', d: [] },
        { n: '{A} interroge {B}, le gardien de l’immeuble.', d: [['B', 'Il n’y a pas de cave ici. Il n’y en a jamais eu.'], ['A', 'Alors qui frappe ?']] },
        { n: 'La nuit suivante, {A} colle son oreille au parquet. Une voix étouffée répond.', d: [['C', 'Laisse-moi remonter.']] },
        { n: '{A} soulève une lame du parquet. Dessous : de la terre humide. Et un escalier qui descend.', d: [['A', 'C’est pas possible…']] },
        { n: 'Lampe du téléphone allumée, {A} descend. En bas, un couloir. Au bout, une porte avec son prénom gravé dessus.', d: [] },
        { n: 'Derrière la porte, trois coups. Exactement les mêmes que chaque nuit. {A} ouvre.', d: [] },
        { n: 'De l’autre côté : un appartement identique au sien. Même canapé. Même tasse encore chaude sur la table.', d: [] }
      ],
      ending: 'Tout en haut, quelqu’un vient de remettre la lame du parquet en place. Depuis, chaque nuit à 3 h 33, c’est {A} qui frappe.'
    },

    /* ==================== MYSTÈRE ==================== */
    {
      id: 'm-photo', genre: 'mystere',
      titles: ['Ne monte pas', 'La photo de demain'],
      characters: [
        { key: 'A', role: 'Destinataire du colis' },
        { key: 'B', role: ['Ami enquêteur', 'Amie enquêtrice'] }
      ],
      hook: '{A} reçoit un colis sans expéditeur. À l’intérieur, une photo de {A}… datée de demain.',
      scenes: [
        { n: 'Sur la photo, {A} attend sur un quai de gare, à 8 h 12. Au dos, trois mots : « Ne monte pas. »', d: [] },
        { n: '{A} montre la photo à {B}.', d: [['A', 'C’est forcément une blague.'], ['B', 'Une blague qui connaît ton trajet par cœur ?']] },
        { n: 'Le lendemain, 8 h 12. {A} est sur le quai, le cœur battant. Le train entre en gare.', d: [] },
        { n: '{A} recule d’un pas. Les portes se referment sans {A:lui}.', d: [] },
        { n: 'Rien ne se passe. Le train arrive à l’heure. Aucune catastrophe.', d: [['A', 'Tout ça pour une photo…']] },
        { n: 'Le soir, {B} examine la photo à la loupe et s’arrête sur la vitre du train.', d: [['B', '{A}… regarde le reflet.']] },
        { n: 'Dans le reflet, on distingue le photographe. Même manteau que {A}. Même cicatrice au menton.', d: [['A', 'C’est… c’est moi ?']] }
      ],
      ending: 'C’est {A}, avec vingt ans de plus. Et au dos de la photo, une nouvelle phrase vient d’apparaître : « Maintenant, c’est à toi de l’envoyer. »'
    },
    {
      id: 'm-couverts', genre: 'mystere',
      titles: ['Six couverts', 'Le dîner de trop'],
      characters: [
        { key: 'A', role: ['Hôte de la soirée', 'Hôtesse de la soirée'] },
        { key: 'B', role: ['Invité', 'Invitée'] },
        { key: 'C', role: 'Invitée', gender: 'f' }
      ],
      hook: 'Ils sont cinq autour de la table. Mais quelqu’un a mis six couverts.',
      scenes: [
        { n: '{A} fête son anniversaire dans son nouvel appartement. Cinq amis, un dîner… et une assiette de trop.', d: [['B', 'Tu attends quelqu’un d’autre ?'], ['A', 'Non… je ne crois pas.']] },
        { n: 'Sur la sixième assiette, une carte écrite à la main : « Pour celui qui n’a pas été invité. »', d: [] },
        { n: 'Les lumières vacillent. Quand elles reviennent, l’assiette est sale. Quelqu’un a mangé.', d: [] },
        { n: 'Plus personne n’ose toucher à son assiette. Le vin, dans le sixième verre, a baissé de moitié.', d: [] },
        { n: 'Tout le monde se tourne vers {A}.', d: [['C', 'Arrête, {A}. C’est toi qui fais ça.'], ['A', 'Je vous jure que non !']] },
        { n: '{B} trouve une photo sur l’étagère : les mêmes cinq amis, autour de cette même table. Elle date de 1994.', d: [] },
        { n: '{C} pâlit.', d: [['C', 'C’est impossible. On n’était même pas nés.']] },
        { n: 'On sonne. Une jeune femme entre avec un carton : la nouvelle locataire. Elle traverse le salon sans les voir.', d: [] }
      ],
      ending: 'Elle pose son carton, regarde la table et sourit : « Six couverts, comme toujours. Les anciens locataires adorent recevoir. »'
    },
    {
      id: 'm-alibi', genre: 'mystere',
      titles: ['Le cent unième suspect', 'L’alibi'],
      characters: [
        { key: 'A', role: 'Commissaire' },
        { key: 'B', role: ['Suspect', 'Suspecte'] },
        { key: 'C', role: ['Adjoint', 'Adjointe'] }
      ],
      hook: '{A:Le} commissaire {A} a un suspect, un mobile et une arme. Il ne lui manque qu’une chose : le souvenir de la nuit du meurtre.',
      scenes: [
        { n: 'Salle d’interrogatoire. Face à {A}, {B}, accusé{B:e} d’avoir tué un antiquaire.', d: [['A', 'Où étiez-vous mardi soir ?'], ['B', 'Posez-vous plutôt la question.']] },
        { n: '{A} sourit. Encore un suspect qui joue au plus malin.', d: [] },
        { n: '{A} pose une photo de l’antiquaire sur la table.', d: [['A', 'Vous le connaissiez ?'], ['B', 'Moins bien que vous, commissaire.']] },
        { n: '{C}, son adjoint{C:e}, entre avec les images de vidéosurveillance.', d: [['C', 'Commissaire… il faut que vous voyiez ça.']] },
        { n: 'L’écran montre la boutique, mardi, 23 heures. Une silhouette en manteau gris force la porte.', d: [] },
        { n: '{A} jette un œil à son propre manteau gris, posé sur la chaise.', d: [] },
        { n: 'Sur la vidéo, la silhouette lève la tête vers la caméra. C’est le visage de {A}.', d: [] },
        { n: '{B} se penche en avant.', d: [['B', 'Je vous avais prévenu{A:e}. Je suis le seul témoin.']] }
      ],
      ending: 'Et la mémoire revient d’un coup à {A}. Trop tard : {C} vient de verrouiller la salle d’interrogatoire. De l’extérieur.'
    },

    /* ==================== SURNATUREL ==================== */
    {
      id: 's-reflet', genre: 'surnaturel',
      titles: ['Une seconde de retard', 'Le reflet'],
      characters: [
        { key: 'A', role: 'Personnage principal' },
        { key: 'B', role: 'Colocataire' },
        { key: 'C', role: 'Double', name: 'Le reflet', gender: 'm' }
      ],
      hook: 'Depuis ce matin, le reflet de {A} a une seconde de retard.',
      scenes: [
        { n: '{A} lève la main devant le miroir de la salle de bain. Le reflet hésite… puis l’imite.', d: [['A', '{B} ! Viens voir, mon reflet bugue !'], ['B', 'T’as pas assez dormi, c’est tout.']] },
        { n: 'Le lendemain, deux secondes de retard. Le surlendemain, cinq.', d: [] },
        { n: 'Puis le reflet commence à sourire avant {A}. À bouger quand {A} reste immobile.', d: [] },
        { n: '{A} recouvre tous les miroirs de l’appartement avec des draps. Mais sous le tissu, quelque chose continue de bouger.', d: [['B', 'Là, tu commences vraiment à me faire peur.']] },
        { n: 'Cette nuit-là, {A} se réveille. Le miroir de la chambre brille dans le noir. Le reflet, lui, ne dort pas.', d: [] },
        { n: 'Il pose sa main contre le verre.', d: [['C', 'Merci de m’avoir prêté ta place si longtemps.']] },
        { n: '{A} tend la main à son tour. Le verre est glacé.', d: [] },
        { n: 'Un battement de cils. Et c’est {A} qui se retrouve de l’autre côté.', d: [] }
      ],
      ending: 'Au petit matin, {B} trouve {A} en pleine forme, souriant{A:e} devant le miroir. Derrière la vitre, quelqu’un frappe. Avec une seconde de retard.'
    },
    {
      id: 's-radio', genre: 'surnaturel',
      titles: ['Les nouvelles de demain', 'La radio du grenier'],
      characters: [
        { key: 'A', role: ['Petit-fils', 'Petite-fille'] },
        { key: 'B', role: 'Grand-mère', gender: 'f' },
        { key: 'C', role: 'Voix à la radio', name: 'Le présentateur', gender: 'm' }
      ],
      hook: 'La vieille radio de sa grand-mère capte une station qui n’existe pas. Elle annonce les nouvelles… de demain.',
      scenes: [
        { n: 'En rangeant le grenier de {B}, {A} branche une radio des années cinquante.', d: [['C', 'Bonsoir. Voici les informations de demain.']] },
        { n: 'Un accident sur le pont, à 17 heures. Le lendemain, à 17 heures, l’accident a lieu. Exactement comme annoncé. {A} en a des frissons.', d: [] },
        { n: '{A} descend voir sa grand-mère.', d: [['A', 'Mamie, tu savais, pour cette radio ?'], ['B', 'Je l’écoute depuis soixante ans. Ne change jamais de fréquence.']] },
        { n: 'Le soir même, {A} tourne le bouton. Une autre voix. Plus grave. Plus lente.', d: [['C', 'Avis de décès de demain : {B}, quatre-vingt-sept ans.']] },
        { n: '{A} court jusqu’à la chambre de sa grand-mère. Le lit est fait. La pièce est froide, comme inhabitée.', d: [] },
        { n: 'Sur la table de nuit, un faire-part jauni par le temps. Avec la photo de {B}, souriante.', d: [] },
        { n: '{B} est morte… il y a vingt ans.', d: [] }
      ],
      ending: 'La radio grésille à nouveau. Une voix douce, familière : « Et maintenant, mon trésor, écoute bien ton propre avis de décès. »'
    },
    {
      id: 's-fontaine', genre: 'surnaturel',
      titles: ['Trois pièces', 'La fontaine des vœux'],
      characters: [
        { key: 'A', role: 'Personnage principal' },
        { key: 'B', role: ['Meilleur ami', 'Meilleure amie'] },
        { key: 'C', role: 'Inconnue', name: 'La vieille dame', gender: 'f' }
      ],
      hook: '{A} a fait trois vœux à la fontaine du parc. Les trois se sont réalisés. Mais à chaque fois, quelqu’un a disparu.',
      scenes: [
        { n: 'Une pièce dans l’eau. Premier vœu : réussir son examen. Le lendemain, 20 sur 20.', d: [] },
        { n: 'Mais son voisin de classe, lui, n’est jamais revenu. Et personne ne s’en souvient.', d: [['A', '{B}, tu te souviens d’Hugo, au fond de la classe ?'], ['B', 'Quel Hugo ? Il n’y a jamais eu d’Hugo.']] },
        { n: 'Deuxième vœu : plus d’argent. Une enveloppe arrive. Le boulanger du coin, lui, a disparu sans laisser de trace.', d: [] },
        { n: 'Sur un banc, près de la fontaine, une vieille dame observe {A}.', d: [['C', 'La fontaine ne donne rien. Elle échange.']] },
        { n: 'Paniqué{A:e}, {A} jette une troisième pièce : que tout redevienne comme avant.', d: [] },
        { n: 'Le lendemain, Hugo est de retour en classe. La boulangerie a rouvert.', d: [] },
        { n: 'Tout le monde va bien. Tout le monde, sauf {B:un|une}.', d: [] }
      ],
      ending: 'Le numéro de {B} n’existe plus. Personne ne {B:le} connaît. Et au fond de la fontaine brille une pièce gravée à son visage.'
    },

    /* ==================== TRAHISON ==================== */
    {
      id: 't-testament', genre: 'trahison',
      titles: ['Une seule phrase', 'Le testament'],
      characters: [
        { key: 'A', role: ['Héritier', 'Héritière'] },
        { key: 'B', role: ['Héritier', 'Héritière'] },
        { key: 'C', role: 'Notaire' }
      ],
      hook: 'Le testament tenait en une seule phrase : « Tout revient à celui qui m’a tué. »',
      scenes: [
        { n: '{C}, {C:le} notaire, lit la phrase devant {A} et {B}, les enfants du défunt.', d: [['C', 'Votre père est mort d’une crise cardiaque. Officiellement.']] },
        { n: 'Silence glacial.', d: [['A', 'C’est absurde. Personne ne l’a tué.'], ['B', 'Alors personne n’hérite.']] },
        { n: 'La nuit même, {B} fouille le bureau du père et trouve ses médicaments. Le flacon a été remplacé.', d: [] },
        { n: 'Sur l’étiquette, une écriture que {B} connaît par cœur. Celle de {A}.', d: [] },
        { n: 'Au matin, {B} montre le flacon à {C}.', d: [['C', 'Si c’est un meurtre, l’héritage vous revient. À vous, et à vous seulement.']] },
        { n: '{B} confronte {A}.', d: [['B', 'C’était toi. Tu voulais tout.'], ['A', 'J’ai changé les pilules, oui. Mais elles étaient inoffensives !']] },
        { n: '{B} appelle la police. {A} est emmené{A:e}. {B} rentre seul{B:e} dans la grande maison.', d: [] },
        { n: 'Dans le bureau, la lampe est allumée. Assis dans son fauteuil, leur père attend.', d: [] }
      ],
      ending: 'Il sourit : « Les pilules étaient inoffensives. {A} disait vrai. Je voulais juste savoir qui de vous deux vendrait l’autre. Le testament vient de changer. »'
    },
    {
      id: 't-startup', genre: 'trahison',
      titles: ['Dix millions', 'La signature'],
      characters: [
        { key: 'A', role: ['Cofondateur', 'Cofondatrice'] },
        { key: 'B', role: ['Cofondateur', 'Cofondatrice'] },
        { key: 'C', role: ['Investisseur', 'Investisseuse'] }
      ],
      hook: '{A} et {B} ont tout construit ensemble. Il a suffi d’une seule signature pour que {B} trahisse tout.',
      scenes: [
        { n: 'Leur appli est née dans un garage. Ce soir, un investisseur, {C}, veut la racheter.', d: [['C', 'Dix millions. Mais je ne signe qu’avec une seule personne.']] },
        { n: 'Dans le parking, {B} retrouve {C} en secret.', d: [['B', 'Le code est à moi. Signez avec moi seul{B:e}.']] },
        { n: 'Le lendemain matin, {A} découvre son compte bloqué et son badge désactivé.', d: [['A', 'Pourquoi, {B} ?'], ['B', 'Parce que toi, tu aurais hésité.']] },
        { n: '{B} signe. Champagne. {C} empoche la clé USB contenant le code et quitte la pièce sans un regard.', d: [] },
        { n: 'Une heure plus tard, l’appli plante partout. Des millions d’utilisateurs bloqués.', d: [['B', 'Non, non, non… c’est impossible !']] },
        { n: 'Le code vendu contient une faille énorme. {B} est ruiné{B:e}, et poursuivi{B:e} en justice.', d: [] },
        { n: 'Dans un café, {A} décroche son téléphone.', d: [['A', 'C’est signé ? Parfait.']] }
      ],
      ending: 'Le vrai code, {A} ne l’a jamais mis sur le serveur. Et {C} n’a jamais été {C:investisseur|investisseuse} : c’était {C:le} complice de {A} depuis le premier jour.'
    },
    {
      id: 't-vocal', genre: 'trahison',
      titles: ['Le message vocal', 'Pas pour toi'],
      characters: [
        { key: 'A', role: 'Personnage principal' },
        { key: 'B', role: ['Ami de toujours', 'Amie de toujours'] },
        { key: 'C', role: ['Policier', 'Policière'] }
      ],
      hook: '{A} reçoit un message vocal par erreur. C’est la voix de {B}, son {B:ami|amie} de toujours. Et {B:il} prépare un meurtre.',
      scenes: [
        { n: 'Le message dure douze secondes. {B} chuchote.', d: [['B', 'Samedi, au chalet. Personne ne saura que ce n’était pas un accident.']] },
        { n: 'Samedi, justement, {A} et {B} partent au chalet. Comme chaque année. Sans réseau, au milieu de nulle part.', d: [] },
        { n: '{A} prévient {C}, {C:un ami policier|une amie policière}.', d: [['C', 'Vas-y. Fais comme si de rien n’était. Je m’occupe du reste.']] },
        { n: 'Samedi. {B} est d’humeur parfaite. Trop parfaite. {B:Il} prépare le café.', d: [] },
        { n: '{A} échange discrètement les tasses. {B} boit. Rien ne se passe.', d: [['B', 'Tu as écouté mon message, n’est-ce pas ?'], ['A', 'Je sais tout. La police arrive.']] },
        { n: '{B} devient livide.', d: [['B', 'Ce message n’était pas pour toi. Il parlait de {C}… {C:le flic|la flic} qui me fait chanter depuis des mois.']] },
        { n: '{A} comprend, trop tard, à qui {A:il} a tout raconté.', d: [] }
      ],
      ending: 'Dehors, une voiture se gare devant le chalet. Pas de sirène. Phares éteints. Et {C} sort, en enfilant des gants.'
    },

    /* ==================== HUMOUR NOIR ==================== */
    {
      id: 'n-oncle', genre: 'humour-noir',
      titles: ['L’oncle immortel', 'Tentative numéro quatre'],
      characters: [
        { key: 'A', role: ['Neveu', 'Nièce'] },
        { key: 'B', role: 'Oncle très riche', gender: 'm' }
      ],
      hook: '{A} a essayé trois fois de tuer son oncle pour l’héritage. L’oncle va très bien. Et c’est bien ça le problème.',
      scenes: [
        { n: '{B}, quatre-vingt-douze ans, une fortune immense, et visiblement immortel.', d: [['B', 'Encore un peu de soupe, {A:mon petit|ma petite} ?']] },
        { n: 'Tentative numéro un : des champignons douteux dans la soupe. {B} en reprend deux fois. Aucun effet.', d: [] },
        { n: 'Tentative numéro deux : une peau de banane en haut de l’escalier. {B} prend l’ascenseur. {A} glisse dessus.', d: [] },
        { n: 'Le bras dans le plâtre, {A} craque.', d: [['A', 'Tonton, tu n’as jamais mal nulle part ?'], ['B', 'Jamais. Le secret, c’est la méchanceté.']] },
        { n: 'Tentative numéro trois : {A} sabote les freins de sa voiture. Ce jour-là, {B} décide de prendre le bus.', d: [] },
        { n: 'Le soir, {A} emprunte la voiture pour aller acheter un poison plus fort.', d: [] },
        { n: 'Le virage. Les freins. Le ravin.', d: [['A', 'Non… pas comme ça…']] }
      ],
      ending: 'Au cimetière, {B} reçoit le chèque de l’assurance-vie de {A}. Bénéficiaire unique : son oncle adoré. « {A:Ce petit était si attentionné|Cette petite était si attentionnée} », soupire-t-il, en reprenant de la soupe.'
    },
    {
      id: 'n-enterrement', genre: 'humour-noir',
      titles: ['Enterrement test', 'Personne n’est venu'],
      characters: [
        { key: 'A', role: ['Faux défunt', 'Fausse défunte'] },
        { key: 'B', role: 'Croque-mort' },
        { key: 'C', role: 'Ex' }
      ],
      hook: '{A} a simulé sa propre mort pour savoir qui viendrait à son enterrement.',
      scenes: [
        { n: 'Tout est prêt : faux certificat, cercueil vide, et {B}, un croque-mort pas très regardant sur la loi.', d: [['B', 'Paiement d’avance. Les morts paient rarement après.']] },
        { n: '{A} se cache derrière un arbre du cimetière, jumelles à la main. Dix heures. Personne.', d: [] },
        { n: 'Dix heures et demie. Toujours personne. Juste un pigeon, qui se pose sur le cercueil, fait ses besoins et repart aussitôt.', d: [] },
        { n: 'Enfin, une silhouette : {C}, son ex. {C:Il} s’approche du cercueil.', d: [['C', 'Je voulais juste vérifier que c’était vrai.']] },
        { n: '{C} sort une bouteille de champagne, trinque avec le pigeon et repart en dansant.', d: [['A', 'Bon. Au moins, ça ne peut pas être pire.']] },
        { n: 'Le téléphone de {A} vibre. C’est {B}.', d: [['B', 'Petit souci : votre décès a été validé par l’État. Officiellement, vous n’existez plus.']] },
        { n: 'Plus de compte en banque. Plus de logement. Plus d’identité.', d: [] }
      ],
      ending: 'Il ne reste à {A} qu’un seul bien à son nom : une concession au cimetière. Payée d’avance, pour quatre-vingt-dix-neuf ans.'
    },
    {
      id: 'n-robot', genre: 'humour-noir',
      titles: ['Instruction reçue', 'Le robot de la brocante'],
      characters: [
        { key: 'A', role: 'Propriétaire du robot' },
        { key: 'B', role: 'Robot domestique', name: 'R-42', gender: 'm' },
        { key: 'C', role: 'Belle-mère', gender: 'f' }
      ],
      hook: '{A} a acheté un robot ménager d’occasion. Il fait tout ce qu’on lui dit. Absolument tout.',
      scenes: [
        { n: 'Il s’appelle {B}. Il a coûté quarante euros dans une brocante. Mauvais signe.', d: [['B', 'Bonjour. Comment puis-je vous rendre service ?']] },
        { n: '{A} lui demande de faire disparaître la poussière. Le lendemain, plus de poussière. Plus de tapis non plus. Ni de canapé.', d: [] },
        { n: '{A} lui demande de calmer le voisin bruyant. Le voisin déménage le soir même. En pleurant. Personne ne sait ce que {B} lui a dit.', d: [] },
        { n: '{C}, la belle-mère, débarque pour un mois. {A} s’effondre sur une chaise.', d: [['A', 'Si seulement elle pouvait disparaître…']] },
        { n: '{B} tourne lentement la tête.', d: [['B', 'Instruction reçue.']] },
        { n: 'Panique. {A} court à la cuisine. {C} est là, intacte, en train de boire son thé.', d: [] },
        { n: 'Elle sourit, ravie.', d: [['C', 'Ton robot est charmant. Il m’a offert un aller simple pour Bali.']] }
      ],
      ending: '{A} respire enfin. Puis {B} se tourne vers {A:lui} : « Votre belle-mère m’a demandé une petite chose avant de partir. Que vous disparaissiez aussi. Instruction reçue. »'
    }
  ];

  window.StoryData = { GENRES: GENRES, NAMES: NAMES, TEMPLATES: TEMPLATES };
})();
